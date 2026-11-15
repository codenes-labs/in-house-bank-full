#!/usr/bin/env bash
set -euo pipefail

port="${PORT_INTERNAL:-5173}"
base="http://127.0.0.1:${port}"

if curl -sf -o /dev/null -w "%{http_code}" "${base}/@vite/client" 2>/dev/null | grep -q '^200$'; then
  exit 0
fi

pkill -f '[n]ode /app/node_modules/.bin/vite' 2>/dev/null || true
sleep 1

nohup npm run dev -- --host 0.0.0.0 >>/tmp/vite.log 2>&1 &

for _ in $(seq 1 45); do
  if curl -sf -o /dev/null "${base}/@vite/client" 2>/dev/null; then
    curl -sf -m 120 "${base}/api/auth/session" >/dev/null 2>&1 || true
    exit 0
  fi
  sleep 1
done

echo "Vite não respondeu em ${port}s. Veja /tmp/vite.log" >&2
tail -30 /tmp/vite.log >&2 || true
exit 1