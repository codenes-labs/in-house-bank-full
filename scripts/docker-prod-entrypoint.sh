#!/bin/sh
set -e

if [ -n "${DATABASE_URL:-}" ] && [ -n "${JWT_SECRET:-}" ]; then
  umask 077
  printf 'DATABASE_URL=%s\nJWT_SECRET=%s\n' "$DATABASE_URL" "$JWT_SECRET" > .dev.vars
fi

exec npx wrangler dev --ip 0.0.0.0 --port 8787 --local
