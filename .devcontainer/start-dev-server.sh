#!/usr/bin/env bash
set -euo pipefail

port="${PORT_INTERNAL:-5173}"
base="http://127.0.0.1:${port}"
log=/tmp/vite.log

vite_ready() {
  curl -sf -o /dev/null "${base}/@vite/client" 2>/dev/null
}

if vite_ready; then
  exit 0
fi

if pgrep -f '[n]ode.*vite' >/dev/null 2>&1; then
  echo "Processo Vite existe mas a porta ${port} não responde — reiniciando." >&2
  pkill -f '[n]ode.*vite' 2>/dev/null || true
  sleep 1
fi

pkill -f '[n]ode /app/node_modules/.bin/vite' 2>/dev/null || true
sleep 1

echo "=== $(date -Is) start-dev-server: npm run dev (porta ${port}) ===" >>"$log"
nohup npm run dev -- --host 0.0.0.0 >>"$log" 2>&1 &

for _ in $(seq 1 90); do
  if vite_ready; then
    echo "Vite OK em ${base}" >&2
    exit 0
  fi
  sleep 1
done

echo "Vite não respondeu em 90s (porta ${port}). Veja ${log}" >&2
tail -40 "$log" >&2 || true
exit 1