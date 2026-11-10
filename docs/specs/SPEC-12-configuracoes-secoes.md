# SPEC-12 Configurações por seção

## Objetivo

Organizar `/configuracoes` em hub e subrotas, no mesmo padrão de Patrimônio e Relatórios.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/configuracoes` | Hub com quatro cartões |
| `/configuracoes/conta` | Beneficiário, documento, cidade, instituição, Pix padrão |
| `/configuracoes/parcelamentos` | Padrões do carnê, textos do PDF, WhatsApp e logotipo |
| `/configuracoes/gerais` | CDI e metas de patrimônio |
| `/configuracoes/backup` | Exportar e importar JSON |

Alterar senha permanece em `/conta/alterar-senha` (menu da conta).

## Aceite

1. Hub lista as quatro seções com ícone e descrição.
2. Celular: subrotas exibem “Voltar às configurações”.
3. Cada seção salva via `bank.saveSettings` com validação `validateSettings`.
4. Menu da conta no mobile aponta para o hub `/configuracoes`.
