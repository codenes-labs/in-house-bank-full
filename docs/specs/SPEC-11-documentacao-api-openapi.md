# SPEC-11 Documentação pública e OpenAPI

Status: concluída.

Site de documentação no estilo da landing (público, fora do menu logado), com termos e privacidade preenchidos, referência de stack/CI/deploy e Swagger em subrota.

## Objetivo

Operadores, desenvolvedores e apresentadores do projeto acessam `/docs` pela URL ou rodapé da landing, sem item no `AppShell`.

## Regras

1. `GET /api/openapi.json` — OpenAPI 3.0 (`src/server/openapi-document.ts`), público.
2. `/docs` — sumário **sticky** no desktop (`lg`); em tablet/celular, **menu sanduíche** (sumário em painel lateral), cabeçalho em duas linhas no mobile; marca leva a `/docs`.
3. `/docs/api` — Swagger UI (CDN) embutido na mesma chrome pública.
4. `/docs/apresentacao` — área reservada para vídeo + roteiro sugerido.
5. `/termos` e `/privacidade` — textos completos em português, chrome público compartilhada (`PublicSiteChrome`).
6. Rodapé na landing e páginas legais: **Termos**, **Privacidade**, **Documentação** (sem “Página inicial”; ver SPEC-12). **Sem rodapé** em `/docs`.
7. Em `/docs`: cabeçalho no **fluxo** da página (sem faixa fixa nem sticky com borda); sumário lateral **sticky** só no desktop (`lg`); marca → `/docs`; sem botão “Página inicial” (SPEC-12); **Localizar** com sugestões; scroll sem barra visível em viewports &lt; `lg`; ao mudar de seção no sumário, o cabeçalho **não** desloca horizontalmente (largura estável da viewport).
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
