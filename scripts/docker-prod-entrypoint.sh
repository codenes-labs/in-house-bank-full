#!/bin/sh
set -e

WRANGLER_DEV_FLAGS="--local --ip 0.0.0.0 --port 8787"

if [ -f .docker/.env ] && [ -r .docker/.env ]; then
  exec npx wrangler dev $WRANGLER_DEV_FLAGS --env-file .docker/.env
fi

if [ -n "${DATABASE_URL:-}" ] && [ -n "${JWT_SECRET:-}" ]; then
  tmpfile=$(mktemp)
  trap 'rm -f "$tmpfile"' EXIT
  umask 077
  {
    printf 'DATABASE_URL=%s\nJWT_SECRET=%s\n' "$DATABASE_URL" "$JWT_SECRET"
    if [ -n "${TURNSTILE_SECRET_KEY:-}" ]; then
      printf 'TURNSTILE_SECRET_KEY=%s\n' "$TURNSTILE_SECRET_KEY"
    fi
    if [ -n "${TURNSTILE_SITE_KEY:-}" ]; then
      printf 'TURNSTILE_SITE_KEY=%s\n' "$TURNSTILE_SITE_KEY"
    fi
    if [ -n "${AUTH_PASSWORD_RECOVER_ENABLED:-}" ]; then
      printf 'AUTH_PASSWORD_RECOVER_ENABLED=%s\n' "$AUTH_PASSWORD_RECOVER_ENABLED"
    fi
  } > "$tmpfile"
  exec npx wrangler dev $WRANGLER_DEV_FLAGS --env-file "$tmpfile"
fi

exec npx wrangler dev $WRANGLER_DEV_FLAGS
