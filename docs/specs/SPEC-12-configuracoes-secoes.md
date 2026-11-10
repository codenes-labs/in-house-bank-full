# SPEC-12 Configurações por seção

## Objetivo

Organizar `/configuracoes` em hub e subrotas, no mesmo padrão de Patrimônio e Relatórios.

## Rotas

| Rota | Conteúdo |
| --- | --- |
| `/configuracoes` | Hub com cartões (sem repetir e-mail no topo) |
| `/configuracoes/usuario` | E-mail de login e link para alterar senha |
| `/configuracoes/conta` | Beneficiário, documento, cidade, instituição, Pix padrão |
| `/configuracoes/parcelamentos` | Padrões do carnê, textos do PDF, WhatsApp e logotipo |
| `/configuracoes/financeiro` | CDI das caixinhas e metas de patrimônio |
| `/configuracoes/gerais` | Tema e tamanho do texto (este dispositivo) |
| `/configuracoes/backup` | Exportar e importar backup JSON |

## Aceite

1. Hub lista as seções com ícone e descrição.
2. Celular: subrotas exibem “Voltar às configurações”.
3. Dados de negócio e aparência salvam com `bank.saveSettings` quando aplicável; escala de fonte persiste em `localStorage`.
4. Menu da conta no mobile aponta para o hub `/configuracoes`.
5. Em financeiro, metas de patrimônio são lista editável: digitar valor em reais (só números) e Enter para incluir; cada meta pode ser removida.
6. Em gerais, o select de tema reflete o tema aplicado (localStorage), não o valor padrão do snapshot antes de carregar o banco.
7. Em backup, botão de exportação JSON com ícone; importação usa a mesma zona de upload (arrastar ou clicar) do logotipo; aceita JSON até 10 MB.
