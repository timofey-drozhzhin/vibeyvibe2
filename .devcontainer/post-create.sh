#!/usr/bin/env bash
set -Eeo pipefail

install_brew_cask() {
    brew install cask
}

install_claude() {
    # Install Claude CLI
    echo 'Installing Claude CLI...'
    brew install --cask claude-code
}

install_gemini() {
    # Install Gemini CLI
    echo 'Installing Gemini CLI...'
    brew install gemini-cli
}

install_htmlq() {
    # Install htmlq for HTML parsing
    echo 'Installing htmlq...'
    brew install htmlq
}

# For converting html to markdown
install_pandoc() {
    # Install Pandoc for document conversion
    echo 'Installing Pandoc...'
    brew install pandoc
}

add_playwright_mcp() {
    # Install chromium and dependencies
    echo 'Installing Playwright browsers...'
    npx -y playwright install --with-deps chromium

    # Add MCP Client configuration
    echo 'Configuring Playwright MCP for Claude...'
    claude mcp add playwright --scope user -- npx -y @playwright/mcp@latest --browser chromium --ignore-https-errors --no-sandbox --output-dir=/workspace/tmp/mcp-playwright --caps=install,tabs,pdf
}

add_chrome_devtools_mcp() {
    export CHROME_HOST=$(getent hosts host.docker.internal | awk '{ print $1 }')

    # Add MCP Client configuration for Chrome DevTools
    echo 'Configuring Chrome DevTools MCP for Claude...'
    claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest --browser-url=http://$CHROME_HOST:9222
}

add_gemini_mcp() {
    # Add MCP Client configuration for Gemini
    echo 'Configuring Gemini MCP for Claude...'
    claude mcp add gemini-cli --scope user -- npx -y gemini-mcp-tool@latest
}

add_chrome_devtools_skill() {
    echo 'Adding Chrome DevTools Skill'
    npx -y skills add https://github.com/chromedevtools/chrome-devtools-mcp --agent claude-code --yes --skill chrome-devtools
}

# Install prerequisites
install_brew_cask
install_htmlq
install_pandoc

# Install AI CLIs
install_claude
install_gemini

# Configure MCP Clients
add_playwright_mcp
# add_chrome_devtools_mcp
add_gemini_mcp

# Add Skills
# add_chrome_devtools_skill