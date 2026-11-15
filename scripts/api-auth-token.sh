#!/usr/bin/env bash
# Imprime accessToken JWT para curl/Swagger (dev local sem Turnstile).
set -euo pipefail

base_url="${BASE_URL:-http://localhost:5173}"
email="${API_LOGIN:-teste}"
password="${API_PASSWORD:-teste}"

payload=$(API_LOGIN="$email" API_PASSWORD="$password" node -e '
  console.log(JSON.stringify({ email: process.env.API_LOGIN, password: process.env.API_PASSWORD }));
')

http_response=$(curl -sS -w "\n%{http_code}" -X POST "${base_url}/api/auth/sign-in" \
  -H 'Content-Type: application/json' \
  -d "$payload")

body=$(printf '%s' "$http_response" | head -n -1)
status=$(printf '%s' "$http_response" | tail -n 1)

printf '%s' "$body" | API_HTTP_STATUS="$status" node -e '
  const status = Number(process.env.API_HTTP_STATUS);
  let data;
  try {
    data = JSON.parse(require("fs").readFileSync(0, "utf8"));
  } catch {
    console.error("Resposta inválida do servidor.");
    process.exit(1);
  }
  if (status !== 200) {
    console.error(data.error ?? `Falha no login (HTTP ${status}).`);
    if (data.retryAfterSeconds) {
      console.error(`Tente de novo em ${data.retryAfterSeconds}s.`);
    }
    process.exit(1);
  }
  if (data.requiresTotp) {
    console.error("Conta com 2FA: informe totpCode no sign-in ou use outra conta (ex.: demo).");
    process.exit(1);
  }
  const token = data.accessToken;
  if (!token) {
    console.error("Resposta sem accessToken.");
    process.exit(1);
  }
  console.log(token);
'