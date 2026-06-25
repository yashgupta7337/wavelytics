#!/bin/bash
# Wavelytics SessionStart hook: install workspace deps so builds run in fresh
# (especially remote / Claude Code on the web) sessions. Idempotent.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"
npm install --no-audit --no-fund >/tmp/wavelytics-setup.log 2>&1
echo "Wavelytics: npm dependencies installed (web + server workspaces)."
