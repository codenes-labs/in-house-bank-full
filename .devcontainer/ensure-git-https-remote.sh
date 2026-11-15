#!/usr/bin/env bash
# Evita "cannot run ssh" no Git integrado do Cursor (container sem openssh-client).
set -euo pipefail

HTTPS='https://github.com/codenes-labs/in-house-bank-full.git'
current="$(git -C /app remote get-url origin 2>/dev/null || true)"

case "$current" in
  git@github.com:*|ssh://git@github.com/*)
    git -C /app remote set-url origin "$HTTPS"
    echo "origin → $HTTPS (use push no host com credencial, ou PAT/SSH no WSL)." >&2
    ;;
esac