# SPEC-12 Navegação pública entre landing e documentação

Status: pendente.

## Contexto

A chrome pública (`PublicSiteChrome`) serve landing (`/`), documentação (`/docs/*`), termos e privacidade. Hoje:

- Na **doc**, a marca **In House Bank / Docs** leva a `/docs` (visão geral); em telas abaixo de `sm`, o cabeçalho mostra só o ícone **IH** e o sufixo **Docs** (sem quebrar o nome completo).
- **Favicon:** ícone da marca em SVG, PNG 32×32 e `apple-touch-icon` 180×180 (Safari/iOS não usam bem só SVG).
- O link **Página inicial** foi **removido** do cabeçalho da doc e do rodapé público (redundante e confuso com a marca).
- O rodapé em páginas não-doc mantém **Termos**, **Privacidade** e **Documentação** apenas.

Falta definir um fluxo claro de volta à landing (`/`) e entre áreas públicas sem poluir o header.

## Objetivo

Qualquer visitante encontra o caminho de volta à landing e entre doc, termos e privacidade, com no máximo um padrão consistente (marca, rodapé ou ação única no header).

## Regras (a fechar na implementação)

1. **Landing (`/`):** logo/marca permanece em `/`; cabeçalho **sticky** no mobile; marca compacta (só ícone **IH**) abaixo de `sm`; conteúdo sem rolagem horizontal; rodapé com Termos, Privacidade, Documentação (sem link “Página inicial”).
2. **`/docs`:** marca → `/docs`; sem botão “Página inicial” até esta spec ser implementada; entrada na landing continua possível por URL `/` ou link externo.
3. **`/termos` e `/privacidade`:** mesma chrome; decidir se a marca leva a `/` ou mantém contexto da página legal.
4. Evitar duplicar o mesmo destino em marca + botão + rodapé.
5. Ao implementar, atualizar SPEC-11 e esta spec para **concluída**.

## Propostas (escolher na sprint)

- A) Marca em `/docs` volta a apontar para `/`; sufixo `/ Docs` permanece só indicativo (como hoje o contrário).
- B) Ícone “casa” discreto só no header da doc (mobile e desktop).
- C) Rodapé mínimo só em termos/privacidade com link “Voltar ao site” (não na landing).

## Fora de escopo

- Menu logado (`AppShell`).
- Tradução/i18n.

## Aceite (quando concluída)

1. Caminho testável da doc até a landing em ≤ 2 cliques, documentado na SPEC-11.
2. Nenhum link “Página inicial” duplicado com a marca sem critério explícito.
3. Rodapé público alinhado às regras escolhidas.
