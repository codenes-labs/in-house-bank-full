# SPEC-03 Landing e PDF

Status: concluída (atualizada em 2026-11-21).

## Landing pública (`/`)

1. Primeira dobra: proposta de valor do assistente financeiro + **simulador de divisão de renda** (estratégias 50/30/20, 50/20/30 e 60/20/20). Simulação em tempo real **não grava** histórico.
2. Seções âncora no cabeçalho (desktop): **Como funciona**, **Funcionalidades**, **Para quem é**.
3. **Funcionalidades:** abas demonstrativas (Assistente, Caixinhas, Parcelamentos) só ilustrativas.
4. Cabeçalho sticky na landing; tema claro/escuro com preferência em `localStorage` (como demais páginas públicas).
5. Rodapé (`#ferramentas`): nome **In House Bank** (sem ícone) + texto curto; **Ferramentas**; **Institucional** com **Início** (`/`), Termos, Privacidade, Documentação. Páginas de ferramenta não exibem link “voltar” no corpo — só **Início** no rodapé.

## Ferramentas públicas (visitante, sem gravar na conta)

| Rota | Conteúdo |
| --- | --- |
| `/ferramentas/organizador` | **Assistente financeiro** — prévia do simulador (não persiste; assistente na conta em breve). |
| `/ferramentas/gerar-carne` | **Gerador de parcelas** — carnê, PDF; dados só no navegador. **Sem** Salvar na conta. |
| `/gerador-carne` | Redireciona para `/ferramentas/gerar-carne`. |

Futuro: simulador de renda fixa e outras entradas no catálogo `public-tools-catalog` (desligadas com `active: false` até existir página).

Aceite do gerador: simulação e **Aplicar** nos simuladores (juros simples / compostos) exigem valor utilizado e taxa ao mês; sem parcelas informadas, a simulação assume 4; **Aplicar** só preenche o retorno total; **Gerar parcelas** e **Baixar PDF** exigem formulário completo (incluindo cidade e Pix válido) e retorno válido; rótulo **Juros compostos** (tabela Price); botões com ícones padronizados; o PDF segue `carne-{pagador}-{referencia}-{AAAAMMDD}.pdf`; parcela paga reimpressa mostra a data no canhoto. Cores do PDF permanecem fixas.