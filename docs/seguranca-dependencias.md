# Verificação de dependências

Rodar periodicamente (CI ou antes de release):

```bash
npm audit --audit-level=moderate
```

## Baseline (2026-11-10)

| Severidade | Origem | Nota |
| --- | --- | --- |
| critical / high | `html2pdf.js` → `jspdf` → `dompurify` | Corrigir com `npm audit fix --force` pode exigir breaking change em `html2pdf.js` — avaliar upgrade em sprint dedicada. |

Auth e API: preferir `JWT_SECRET` forte, HTTPS em produção, e proteções conforme **SPEC-13** (rate limit e-mail/IP, Turnstile opcional, TOTP em Configurações → Usuário).

### Turnstile (produção)

1. Criar widget em [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/).
2. Definir no Worker: `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY` (ver `.docker/.env.example`).
3. Sem essas variáveis, o captcha fica desligado (útil em dev local).
