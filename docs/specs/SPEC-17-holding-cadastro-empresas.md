# SPEC-17 Holding — cadastro de empresas (admin web)

Status: concluída.

## Objetivo

Na **produção**, com cadastro público fechado (SPEC-15), permitir que o login **`admin@codenes.com.br`** crie **novas contas standard** (empresas) pela área logada, como se fosse o fluxo de cadastro por e-mail e senha, **sem** trocar a sessão do administrador.

## Regras

1. **Quem pode:** somente sessão **JWT** do admin **`admin@codenes.com.br`**, conta **standard** (`canProvisionHoldingCompanies`: não demo). Demais logins reais usam JWT normalmente; só não provisionam empresas.
2. **Onde aparece na UI:** menu lateral **desktop** (`lg+`), grupo **Holding** posicionado **abaixo** do grupo Patrimônio (que contém Financeiro), com item **Cadastro de empresas** → `/holding/empresas`. Não aparece na barra inferior mobile nem no hub Patrimônio.
3. **Rotas holding:** `/holding/empresas` (lista + permissões) e `/holding/empresas/novo` (cadastro). Acessíveis só ao admin; demais usuários → `/inicio`. Detalhes de lista e PATCH em [SPEC-18](SPEC-18-holding-lista-empresas-permissoes.md). Em viewport abaixo de `lg`, mensagem de uso só na web larga.
4. **API `POST /api/holding/companies`:** exige JWT; corpo `{ companyName, email, password, city? }` (SPEC-18). Validações de e-mail/senha iguais ao cadastro público; `companyName` ≥ 2 caracteres. Cria `users` com `registration_code` numérico e `settings.business_name`. **Sem** Turnstile. Resposta **200** com `{ ok: true, user: { id, email, registrationCode, companyName } }` — **não** emite token da nova conta.
5. Não autorizado (sem JWT) → 401; conta demo → 403; outro login real (empresa já cadastrada) → 403.
6. Cadastro público (`POST /api/auth/sign-up`) permanece inalterado em produção (desligado por padrão). Em operação, **novas empresas só** por Holding no admin; empresas existentes entram com e-mail/senha (JWT) e **não** veem Holding.

## Operação em produção (auditoria 2026-11-17)

| Vetor | Comportamento esperado | Onde |
| --- | --- | --- |
| Sem JWT em `POST /api/holding/companies` | 401 | `create-api-handler.ts` (gate `sessionUser`) |
| JWT demo (`teste` / `teste@teste.com`) | 403; mutações de banco já bloqueadas exceto leitura | demo + holding |
| JWT empresa standard | 403 na API; UI redireciona `/inicio`; menu sem Holding | `holding-provision.ts` |
| JWT admin | 200 cria `users` standard; admin permanece logado | Holding web |
| `POST /api/auth/sign-up` com flag off | 403 (cadastro público fechado) | SPEC-15 |
| UI mobile | Sem item Holding; rota mostra aviso, sem formulário | `use-min-lg` |

**Pendência consciente (futuro):** cada empresa poderá cadastrar seus usuários; fora desta spec — hoje só o admin cadastra **empresas** (contas).

## Aceite

1. Teste unitário: sem JWT → 401; demo JWT → 403; empresa standard JWT → 403; admin JWT → 200.
2. Teste unitário: admin com JWT, e-mail novo → 200 e corpo com `user.email` (sem `accessToken` da nova conta).
3. Teste unitário: `desktopNavGroupsForUser` inclui Holding só para admin não-demo.
4. Teste unitário: validação de e-mails reservados em `provision-standard-account`.
5. Página admin envia cadastro em `/holding/empresas/novo` e volta à lista sem deslogar (SPEC-18).

## Fora de escopo

- Convite por e-mail; papéis além do e-mail fixo do admin; app mobile nativo. Lista e permissões básicas: SPEC-18.