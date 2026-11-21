# SPEC-22 Lista de espera e consentimento de cookies

Status: concluída.

## Objetivo

Captar interesse de visitantes enquanto o cadastro público está fechado, com consentimento LGPD, e exibir aviso de cookies no site público.

## Lista de espera

1. Rota pública `/lista-espera` com formulário: nome, e-mail, interesse (select), mensagem opcional (máx. 500), checkbox obrigatório de consentimento para contato. Após envio bem-sucedido, **substituir** o formulário por cartão de confirmação (ícone de sucesso, mensagem da API, texto secundário, CTAs **Voltar ao início** e **Explorar ferramentas** (`/#ferramentas`) — mesma ideia do contato Codenes, visual do IHB).
2. `POST /api/waitlist` persiste no Postgres; Turnstile quando configurado; rate limit por IP.
3. Um e-mail por cadastro (mesmo e-mail na `waitlist_signups` → `alreadyOnWaitlist: true`; sem duplicar linha).
4. E-mail já em `users` → `400` com `existingAccount: true` (não grava; orienta **Entrar**).
5. `GET /api/waitlist` somente `admin@codenes.com.br` autenticado.
6. Admin: `/holding/lista-espera` — contato **só por e-mail** (sem WhatsApp na v1).
7. Links: rodapé (**Institucional** — lista de espera; **Legal** — privacidade), `/entrar` (quando cadastro fechado), CTA da landing (secundário).

Tabela `waitlist_signups` sem `user_id` (dados operacionais; acesso só via API).

## Cookies

1. Faixa fixa na primeira visita até **Aceitar** ou **Recusar**; preferência em `localStorage` (`accepted` / `declined`).
2. Texto institucional + link para `/privacidade`; layout profissional (faixa larga, ícone, dois botões).
3. Apenas cookies/armazenamento essenciais (sem analytics de terceiros nesta versão).
4. Seção 9 de `/privacidade` descreve cookies; rodapé com **Preferências de cookies** (reabre o banner).
5. Política de privacidade com estrutura profissional (12 seções), incluindo lista de espera e terceiros (Neon, Cloudflare, Turnstile).

## Evoluções futuras (documentado, não implementado)

- Campo **WhatsApp opcional** no formulário, com consentimento específico e atualização da privacidade.
- **Template de e-mail** (texto padrão) para o admin convidar inscritos da lista, reutilizável no fluxo de holding.

## Fora de escopo

- Planos grátis/pagos (SPEC-23).
- Envio automático de e-mail na v1 (só captura + painel admin).

## Aceite

1. Testes: POST sucesso, consentimento, e-mail duplicado na lista, e-mail com conta existente, GET 401/403.
2. Migration em `docs/migrations` e patch idempotente.