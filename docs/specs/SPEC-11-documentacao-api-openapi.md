# SPEC-11 Documentação pública e OpenAPI

Status: concluída.

Site de documentação no estilo da landing (público, fora do menu logado), com termos e privacidade preenchidos, referência de stack/CI/deploy e Swagger em subrota.

## Objetivo

Operadores, desenvolvedores e apresentadores do projeto acessam `/docs` pela URL ou rodapé da landing, sem item no `AppShell`.

## Regras

1. `GET /api/openapi.json` — OpenAPI 3.0 (`src/server/openapi-document.ts`), público.
2. `/docs` — layout com **menu lateral** (desktop) e lista vertical (mobile): Visão geral, Stack, Arquitetura, Banco, CI/CD, Deploy, API, Apresentação.
3. `/docs/api` — Swagger UI (CDN) embutido na mesma chrome pública.
4. `/docs/apresentacao` — área reservada para vídeo + roteiro sugerido.
5. `/termos` e `/privacidade` — textos completos em português, chrome público compartilhada (`PublicSiteChrome`).
6. Rodapé com links institucionais (início, Termos, Privacidade, Documentação) na landing e páginas legais; em `/docs` só o aviso legal, sem barra de links.
7. Em `/docs`: marca leva à landing; sufixo `/ Docs` (mesma cor, sem link); campo **Localizar** no cabeçalho fixo (antes do tema); tema só ícone; ações Página inicial + Entrar; sumário `sticky` abaixo do cabeçalho no desktop; uma única barra de rolagem (página).
8. Atualizar `openapi-document.ts` ao mudar rotas `/api`.
9. **Changelog:** `/docs/changelog` lê `src/domain/docs/product-changelog.ts`; manter `docs/CHANGELOG.md` com o mesmo conteúdo ao publicar marcos (versão `MAJOR.MINOR.PATCH` + data).

## Fora de escopo

- Menu logado apontando para `/docs`.
- Hospedagem do vídeo (só placeholder até URL do usuário).

## Aceite

1. `/docs` lista tópicos e cada subrota renderiza conteúdo alinhado a `docs/arquitetura.md`, `docs/banco.md` e workflows GitHub.
2. `/docs/api` permite Authorize Bearer após sign-in.
3. Termos e privacidade não são placeholders.
4. Nenhum link em `logged-shell-nav` para `/docs`.

## Testes

- `buildOpenApiDocument` cobre rotas principais.
