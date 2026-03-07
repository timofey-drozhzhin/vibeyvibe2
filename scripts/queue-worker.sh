#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# vibeyvibe CLI Queue Worker
# Polls the API for pending AI jobs and processes them via CLI tools.
#
# Usage: bash scripts/queue-worker.sh
#    or: pnpm cli:worker
#
# Requires: jq, curl, timeout, and the relevant CLI tool (claude/gemini)
# -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env from workspace root
if [ -f "$WORKSPACE_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$WORKSPACE_ROOT/.env"
  set +a
fi

# Configuration
API_BASE="${CLI_API_BASE:-http://localhost:3001/api}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"
CLI_TIMEOUT="${CLI_TIMEOUT:-300}"
CLAUDE_CLI="${CLAUDE_CLI:-claude}"
GEMINI_CLI="${GEMINI_CLI:-gemini}"

if [ -z "${CLI_MODELS:-}" ]; then
  echo "[queue-worker] ERROR: CLI_MODELS is not set in .env"
  echo "[queue-worker] Example: CLI_MODELS=claude-opus-4-6,gemini-2.5-pro"
  exit 1
fi

# Check dependencies
for cmd in jq curl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "[queue-worker] ERROR: $cmd is required but not installed"
    exit 1
  fi
done

# Convert comma-separated models to JSON array
MODELS_JSON=$(echo "$CLI_MODELS" | tr ',' '\n' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' | grep -v '^$' | jq -R . | jq -s .)

echo "[queue-worker] Starting CLI queue worker"
echo "[queue-worker]   API:           $API_BASE"
echo "[queue-worker]   Models:        $CLI_MODELS"
echo "[queue-worker]   Poll interval: ${POLL_INTERVAL}s"
echo "[queue-worker]   CLI timeout:   ${CLI_TIMEOUT}s"
echo "[queue-worker]   Claude CLI:    $CLAUDE_CLI"
echo "[queue-worker]   Gemini CLI:    $GEMINI_CLI"
echo ""

# Cleanup temp files on exit
cleanup() {
  rm -f /tmp/vv-prompt-*.txt /tmp/vv-response-*.txt
  echo "[queue-worker] Stopped"
}
trap cleanup EXIT

# -------------------------------------------------------------------
# Reset stale "processing" jobs from previous runs
# -------------------------------------------------------------------
echo "[queue-worker] Resetting stale jobs..."
RESET_RESPONSE=$(curl -s -X POST "$API_BASE/admin/ai-queue/reset-stale" \
  -H "Content-Type: application/json" \
  -d "{\"models\": $MODELS_JSON}" 2>&1) || true

RESET_COUNT=$(echo "$RESET_RESPONSE" | jq -r '.data.reset // 0' 2>/dev/null) || RESET_COUNT=0
if [ "$RESET_COUNT" -gt 0 ]; then
  echo "[queue-worker] Reset $RESET_COUNT stale job(s) back to pending"
else
  echo "[queue-worker] No stale jobs found"
fi

# -------------------------------------------------------------------
# Main loop
# -------------------------------------------------------------------
while true; do
  # Claim a job
  CLAIM_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_BASE/admin/ai-queue/claim" \
    -H "Content-Type: application/json" \
    -d "{\"models\": $MODELS_JSON}" 2>/dev/null) || true

  HTTP_CODE=$(echo "$CLAIM_RESPONSE" | tail -1)
  BODY=$(echo "$CLAIM_RESPONSE" | sed '$d')

  # No jobs available
  if [ "$HTTP_CODE" = "204" ] || [ -z "$BODY" ] || [ "$BODY" = "null" ]; then
    echo -ne "\r[queue-worker] Polling... no jobs (HTTP $HTTP_CODE)   "
    sleep "$POLL_INTERVAL"
    continue
  fi

  # Request failed
  if [ "$HTTP_CODE" != "200" ]; then
    echo ""
    echo "[queue-worker] Claim failed (HTTP $HTTP_CODE): $BODY"
    sleep "$POLL_INTERVAL"
    continue
  fi
  echo ""

  # Extract job fields
  JOB_ID=$(echo "$BODY" | jq -r '.data.id')
  JOB_MODEL=$(echo "$BODY" | jq -r '.data.model')
  JOB_NAME=$(echo "$BODY" | jq -r '.data.name')
  JOB_TYPE=$(echo "$BODY" | jq -r '.data.type')

  if [ -z "$JOB_ID" ] || [ "$JOB_ID" = "null" ]; then
    sleep "$POLL_INTERVAL"
    continue
  fi

  echo "[queue-worker] Claimed job #$JOB_ID: $JOB_NAME (model: $JOB_MODEL, type: $JOB_TYPE)"

  # Write prompt to temp file (avoids shell escaping issues with large prompts)
  PROMPT_FILE="/tmp/vv-prompt-${JOB_ID}.txt"
  RESPONSE_FILE="/tmp/vv-response-${JOB_ID}.txt"
  echo "$BODY" | jq -r '.data.prompt' > "$PROMPT_FILE"

  # Dispatch to appropriate CLI tool based on model prefix
  # Supports: anthropic/claude-*, claude-*, google/gemini-*, gemini-*
  CLI_EXIT_CODE=0

  # Strip provider prefix and convert to native CLI model ID
  NATIVE_MODEL="$JOB_MODEL"
  if [[ "$JOB_MODEL" == anthropic/* ]]; then
    # anthropic/claude-sonnet-4.6 -> claude-sonnet-4-6 (strip prefix, dots to dashes)
    NATIVE_MODEL="${JOB_MODEL#anthropic/}"
    NATIVE_MODEL="${NATIVE_MODEL//./-}"
  elif [[ "$JOB_MODEL" == google/* ]]; then
    NATIVE_MODEL="${JOB_MODEL#google/}"
  fi

  PROMPT_CONTENT="$(cat "$PROMPT_FILE")"

  if [[ "$JOB_MODEL" == anthropic/* ]] || [[ "$JOB_MODEL" == claude-* ]]; then
    # Claude CLI: --print (boolean flag), --model, --output-format
    echo "[queue-worker]   -> Claude CLI (model: $NATIVE_MODEL)"
    $CLAUDE_CLI --print --model "$NATIVE_MODEL" --output-format text "$PROMPT_CONTENT"
    exit
    timeout "$CLI_TIMEOUT" env -u CLAUDECODE $CLAUDE_CLI --print --model "$NATIVE_MODEL" --output-format text "$PROMPT_CONTENT" 2>&1 | tee "$RESPONSE_FILE"
    CLI_EXIT_CODE=${PIPESTATUS[0]}

  elif [[ "$JOB_MODEL" == google/* ]] || [[ "$JOB_MODEL" == gemini-* ]]; then
    # Gemini CLI: --prompt (string arg), --model, --output-format
    echo "[queue-worker]   -> Gemini CLI (model: $NATIVE_MODEL)"
    timeout "$CLI_TIMEOUT" $GEMINI_CLI --prompt "$PROMPT_CONTENT" --model "$NATIVE_MODEL" --output-format text 2>&1 | tee "$RESPONSE_FILE"
    CLI_EXIT_CODE=${PIPESTATUS[0]}

  else
    echo "[queue-worker]   -> Unknown model prefix: $JOB_MODEL"
    curl -s -X POST "$API_BASE/admin/ai-queue/${JOB_ID}/fail" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg error "No CLI handler for model: $JOB_MODEL" '{error: $error}')" > /dev/null 2>&1 || true
    rm -f "$PROMPT_FILE" "$RESPONSE_FILE"
    continue
  fi

  # Handle CLI failure or timeout
  if [ "$CLI_EXIT_CODE" -ne 0 ]; then
    if [ "$CLI_EXIT_CODE" -eq 124 ]; then
      ERROR_MSG="CLI timed out after ${CLI_TIMEOUT}s"
    else
      ERROR_MSG="CLI exited with code $CLI_EXIT_CODE"
    fi
    echo "[queue-worker]   FAILED: $ERROR_MSG"

    curl -s -X POST "$API_BASE/admin/ai-queue/${JOB_ID}/fail" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg error "$ERROR_MSG" '{error: $error}')" > /dev/null 2>&1 || true

    rm -f "$PROMPT_FILE" "$RESPONSE_FILE"
    continue
  fi

  # Submit the response (jq handles all JSON escaping)
  RESPONSE_CONTENT=$(cat "$RESPONSE_FILE")
  SUBMIT_PAYLOAD=$(jq -n --arg response "$RESPONSE_CONTENT" '{response: $response}')

  SUBMIT_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_BASE/admin/ai-queue/${JOB_ID}/complete" \
    -H "Content-Type: application/json" \
    -d "$SUBMIT_PAYLOAD" 2>/dev/null) || true

  SUBMIT_CODE=$(echo "$SUBMIT_RESPONSE" | tail -1)
  SUBMIT_BODY=$(echo "$SUBMIT_RESPONSE" | sed '$d')

  if [ "$SUBMIT_CODE" = "200" ]; then
    echo "[queue-worker]   OK: Job #$JOB_ID completed"
  else
    echo "[queue-worker]   SUBMIT FAILED (HTTP $SUBMIT_CODE): $SUBMIT_BODY"
  fi

  # Cleanup temp files for this job
  rm -f "$PROMPT_FILE" "$RESPONSE_FILE"

  # Brief pause between jobs
  sleep 1
done
