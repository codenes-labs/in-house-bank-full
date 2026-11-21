# SPEC-22 Lista de espera e consentimento de cookies

Status: concluída.

## Objetivo

Captar interesse de visitantes enquanto o cadastro público está fechado, com consentimento LGPD, e exibir aviso de cookies no site público.

## Lista de espera

1. Rota pública `/lista-espera` com formulário: nome, e-mail, interesse (select), mensagem opcional (máx. 500), checkbox obrigatório de consentimento para contato. Após envio bem-sucedido, **substituir** o formulário por cartão de confirmação (ícone de sucesso, mensagem da API, texto secundário, CTAs **Voltar ao início** e **Explorar ferramentas** (`/#ferramentas`) — mesma ideia do contato Codenes, visual do IHB).
2. `POST /api/waitlist` persiste no Postgres; Turnstile quando configurado; rate limit por IP.
3. Um e-mail por cadastro (mesmo e-mail → `alreadyOnWaitlist: true` e mensagem explícita na UI; sem duplicar linha no banco).
4. `GET /api/waitlist` somente `admin@codenes.com.br` autenticado.
5. Admin: página `/holding/lista-espera` (menu Holding, só admin).
6. Links: rodapé (Institucional), `/entrar` (quando cadastro fechado), CTA da landing (secundário).

Tabela `waitlist_signups` sem `user_id` (dados operacionais; acesso só via API).

## Cookies

1. Faixa fixa na primeira visita até **Aceitar** ou **Recusar**; preferência em `localStorage` (`accepted` / `declined`).
2. Texto institucional + link para `/privacidade`; layout profissional (faixa larga, ícone, dois botões).
3. Apenas cookies/armazenamento essenciais (sem analytics de terceiros nesta versão).
4. Seção 9 de `/privacidade` descreve cookies; rodapé com **Preferências de cookies** (reabre o banner).
5. Política de privacidade com estrutura profissional (12 seções), incluindo lista de espera e terceiros (Neon, Cloudflare, Turnstile).

## Fora de escopo

- Planos grátis/pagos (SPEC futura).

## Aceite

1. Testes de validação do payload e API (POST sucesso, consentimento, e-mail duplicado, GET 401/403).
2. Migration em `docs/migrations` e patch idempotente.