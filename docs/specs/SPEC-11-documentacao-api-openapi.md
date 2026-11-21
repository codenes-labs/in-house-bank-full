# SPEC-11 Documentação pública e OpenAPI

Status: concluída.

Site de documentação no estilo da landing (público, fora do menu logado), com termos e privacidade preenchidos, referência de stack/CI/deploy e Swagger em subrota.

## Objetivo

Operadores, desenvolvedores e apresentadores do projeto acessam `/docs` pela URL ou rodapé da landing, sem item no `AppShell`.

## Regras

1. `GET /api/openapi.json` — OpenAPI 3.0 (`src/server/openapi-document.ts`), público.
2. `/docs` — sumário **fixo** no desktop (`lg`, coluna-reserva + `position: fixed` alinhado ao grid); em celular, **menu sanduíche** (sumário em painel **tela cheia**, portal em `body`, `z-index` acima de Swagger/embeds, fundo opaco, sem rolagem do corpo; Swagger oculto enquanto o sumário está aberto); cabeçalho sticky em duas linhas; marca leva a `/docs`.
3. `/docs/api` — Swagger UI (CDN) embutido na mesma chrome pública.
4. `/docs/apresentacao` — área reservada para vídeo + roteiro sugerido.
5. `/termos` e `/privacidade` — textos completos em português, chrome público compartilhada (`PublicSiteChrome`).
6. Rodapé na landing, páginas legais e `/docs`: links institucionais (ver SPEC-12), com **Início** em `/docs`.
7. Em `/docs`: cabeçalho **sticky** (faixa superior); sumário lateral **fixo** no desktop (`lg`, coluna-reserva no grid + `position: fixed` alinhado ao âncora); intro “In House Bank” só na **visão geral** (`/docs`); subpáginas começam direto no conteúdo no mobile; **Localizar** com sugestões em texto integral (`docs-search-content.ts`); scroll sem barra visível em viewports &lt; `lg`; largura estável da viewport ao trocar de seção.
8. Atualizar `openapi-document.ts` ao mudar rotas `/api`.
9. **Changelog:** `/docs/changelog` lê `src/domain/docs/product-changelog.ts`; manter `docs/CHANGELOG.md` com o mesmo conteúdo ao publicar marcos (versão `MAJOR.MINOR.PATCH` + data).

## Fora de escopo

- Menu logado apontando para `/docs`.
- Hospedagem do vídeo (só placeholder até URL do usuário).

## Aceite

1. `/docs` lista tópicos e cada subrota renderiza conteúdo alinhado a `docs/arquitetura.md`, `docs/banco.md` e workflows GitHub.
2. `/docs/api` explica login (demo/admin), Authorize Bearer e `make api-token` para JWT no terminal.
3. Termos e privacidade não são placeholders.
4. Nenhum link em `logged-shell-nav` para `/docs`.

## Testes

- `buildOpenApiDocument` cobre rotas principais.
