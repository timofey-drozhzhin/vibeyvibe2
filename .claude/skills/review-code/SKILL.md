---
name: review-code
description: Comprehensive code review covering security, architecture, duplication, consistency, and UX/UI unification. Use when the user asks to review code, audit the codebase, or check for issues.
argument-hint: [optional: focus area like "security", "duplication", "consistency"]
user-invocable: true
allowed-tools: Read, Grep, Glob, Task, Bash, WebSearch
---

# Comprehensive Code Review

You are performing a thorough, multi-dimensional code review. Launch **at least 5 parallel agents** to cover every corner of the codebase. Each agent should specialize in one review dimension. After all agents complete, synthesize findings into a single prioritized report.

## Review Dimensions

### 1. SECURITY

Audit every layer for security vulnerabilities. The API server is the **only trusted authority** -- never assume the frontend protects anything.

**Authentication & Authorization:**
- Verify ALL API endpoints require authentication (except explicitly public ones like health checks and auth endpoints)
- Confirm auth is centralized in one middleware/guard that every request passes through -- no endpoint should bypass it accidentally
- Check that role-based access (admin, user) is enforced server-side, not just hidden in the UI
- Look for endpoints that return data without verifying the caller owns or has access to that data
- Verify session/token handling follows best practices (secure cookies, expiry, no secrets in URLs)

**Input Validation & Injection:**
- Every API endpoint must validate input with a schema (e.g., Zod, Joi, Yup) -- no raw `req.body` usage
- Check for SQL injection: parameterized queries only, no string interpolation in SQL
- Check for XSS: user input must be sanitized before rendering in HTML responses
- Check for command injection: no user input passed to shell commands or `eval()`
- Validate file uploads: type checking, size limits, filename sanitization
- Ensure URL parameters and query strings are validated and typed

**Data Exposure:**
- Error responses must NOT leak stack traces, internal paths, raw database errors, or AI/LLM output
- API responses should not over-fetch -- only return fields the client needs
- Sensitive fields (passwords, tokens, secrets) must never appear in API responses or logs
- Check that environment variables/secrets have no hardcoded defaults or fallbacks in code

**CORS & Headers:**
- CORS origin must be explicitly configured, not wildcarded in production
- Verify secure headers are applied (CSP, X-Frame-Options, etc.)
- Check that allowed HTTP methods match what the API actually implements

**Rate Limiting:**
- Auth endpoints and expensive operations should be rate-limited
- Verify rate limiting cannot be trivially bypassed

**Cross-Context / Cross-Tenant:**
- If the app uses contexts, tenants, or scopes, verify that queries always filter by the correct scope
- Relationship assignments must validate that both entities belong to the same scope/context
- A user should never be able to link or access data across boundaries via direct API calls

### 2. ARCHITECTURE & CODE QUALITY

Review the structural health of the codebase.

**Single Responsibility:**
- Each file/module should have one clear purpose
- Look for "god files" that do too many things
- Check that business logic lives in services, not in route handlers or UI components

**Naming Conventions:**
- File names, function names, variable names, and class names should follow consistent conventions (camelCase, snake_case, PascalCase) per the language/framework norms
- Database columns should use a consistent naming scheme (e.g., snake_case with `_id` for FKs, `_uid` for external IDs)
- URL paths should use kebab-case
- Check for misleading names (e.g., a function named `getX` that also mutates state)

**Error Handling:**
- Every async operation should have error handling (try/catch, .catch, error boundaries)
- Errors should be caught with `unknown` type and narrowed, not `any`
- Silent catches (empty catch blocks) must log warnings at minimum
- Error messages should be user-friendly on the frontend and detailed in server logs

**Type Safety:**
- Minimize `any` usage -- prefer `unknown` with type narrowing
- Function signatures should have explicit parameter and return types where the language supports it
- Avoid type assertions (`as any`, `as SomeType`) unless absolutely necessary and documented

**Dead Code:**
- Look for unused imports, unreachable code, commented-out blocks, deprecated exports still present
- Migration/one-time code that runs repeatedly but has no effect should be removed
- Features marked `@deprecated` with no remaining consumers should be deleted

**Configuration Consistency:**
- If there is a registry or config-driven pattern, verify ALL entities/features go through it
- No entity-specific `if/switch` branches in generic code -- behavior differences should come from configuration
- Validation schemas should match database constraints (e.g., rating scale, string lengths)

### 3. CODE DUPLICATION & UNIFICATION

The goal is **zero duplication**. Every piece of logic should exist in exactly one place.

**Identical Code Blocks:**
- Search for repeated patterns of 3+ lines that appear in multiple files
- Extract into shared functions, hooks, components, or utilities
- Common targets: state management patterns, save/cancel UI, modal patterns, notification calls, date formatting, display name resolution

**Near-Duplicate Logic:**
- Look for code that does the same thing with minor variations (different variable names, slightly different parameters)
- Unify into a single parameterized implementation

**Shared Constants:**
- Repeated literal values (magic numbers, repeated strings, validation rules) should be extracted into named constants
- Schema fragments used across multiple validators should be shared (e.g., a rating field schema used by 4 entities)

**Component Patterns (Frontend):**
- Identify repeated JSX/UI patterns across components (button groups, modal layouts, form fields, icon+text combos)
- Extract into shared components with props for variation
- Identical state management patterns (editing + saving + canceling) should use a shared hook

**Query Patterns (Backend):**
- Repeated database query shapes should use shared helper functions
- Identical enrichment/transform logic across multiple endpoints should be consolidated

### 4. CONSISTENCY & CONVENTIONS

The codebase should feel like one person wrote it. Every pattern should be used the same way everywhere.

**API Conventions:**
- All endpoints should follow the same URL structure, HTTP method conventions, response format, and error format
- Pagination, filtering, sorting, and search should work identically across all list endpoints
- Status codes should be used consistently (201 for creates, 404 for not found, etc.)

**Frontend Conventions:**
- Component prop patterns should be consistent (same prop names for the same concepts)
- Icon sizes, spacing, and component sizing should follow a standard scale
- Notification/toast patterns (duration, style, presence of titles) should be uniform
- State management (useState vs useDisclosure vs custom hooks) should use the same approach for the same concept
- Filter/toolbar options should match documentation (e.g., if docs say Active/All/Archived, the UI must show all three)

**Documentation Accuracy:**
- CLAUDE.md / README files must match the actual code
- If the code says `allowMethods: ["GET", "POST", "PUT", "DELETE"]`, the docs should not say "no DELETE endpoints"
- Schema documentation (field types, validation ranges) must match the actual validators
- Documented features must actually exist; removed features must be removed from docs

**Import Style:**
- Consistent import ordering (external libs, internal modules, relative imports)
- Consistent use of named vs default exports

### 5. UX/UI UNIFICATION (Frontend)

The interface should have a cohesive, polished feel with no inconsistencies.

**Visual Consistency:**
- Same type of element should look the same everywhere (all edit icons same size, all action buttons same variant, all modals same structure)
- Color usage should be semantic and consistent (e.g., red = destructive, green = success, yellow = warning)
- Spacing and padding should follow the design system's scale -- no arbitrary pixel values

**Interaction Patterns:**
- Same type of action should work the same way everywhere (inline edit always works the same, modals always have the same button layout)
- Loading states should be consistent (same spinner, same overlay, same skeleton)
- Empty states should have helpful messaging, not blank space
- Error states should show user-friendly messages, not raw error strings

**Component Reuse:**
- If a UI pattern appears more than once, it should be a shared component
- Generic/registry-driven components should not contain entity-specific hardcoded strings
- Labels, placeholders, and messages should come from configuration, not inline strings in generic code

**Responsive Behavior:**
- Check that layouts handle different content lengths gracefully (long names, missing images, empty lists)
- Tables should handle edge cases (0 rows, 1 row, many rows)

**Accessibility:**
- Interactive elements should have appropriate ARIA labels or roles
- Color should not be the only indicator of state (add icons or text)
- Focus management in modals and forms

### 6. PERFORMANCE (Lightweight)

Flag obvious performance issues without premature optimization.

- N+1 query patterns: loops that make a database call per iteration instead of batching
- Missing database indexes on columns used in WHERE clauses or JOINs
- Unbounded queries: list endpoints without pagination limits
- Large payloads: API responses that return entire objects when only a few fields are needed
- Frontend: unnecessary re-renders, missing dependency arrays in hooks, large bundle imports

## Agent Deployment Strategy

Launch these agents in parallel:

1. **Security Agent** -- Dimensions 1 (Security) above
2. **Architecture Agent** -- Dimension 2 (Architecture & Code Quality)
3. **Duplication Agent** -- Dimension 3 (Code Duplication & Unification)
4. **Consistency Agent** -- Dimension 4 (Consistency & Conventions)
5. **UX/UI Agent** -- Dimension 5 (UX/UI Unification)
6. **Performance Agent** -- Dimension 6 (Performance)

Each agent should:
- Read the project's CLAUDE.md files to understand conventions and rules
- Explore the full codebase (backend, frontend, config, tests, seed scripts, standalone pages)
- Return findings with **file paths and line numbers**
- Classify each finding as: **Critical**, **Important**, or **Minor**

## Focus Override

$ARGUMENTS

If a focus area was specified above, still run all agents but give extra depth and priority to the matching dimension.

## Output Format

After all agents complete, present a unified report:

```
## Code Review Report

### Critical Issues (must fix)
1. [SECURITY] Description -- `file:line`
   **Fix:** What to do

### Important Issues (should fix)
2. [DUPLICATION] Description -- `file:line`
   **Fix:** What to do

### Minor Suggestions (consider)
3. [CONSISTENCY] Description -- `file:line`
   **Suggestion:** What to consider

### Positive Observations
- What's done well
```

After presenting findings, ask the user if they want to proceed with implementing the fixes. If yes, enter plan mode and create an implementation plan organized by priority.
