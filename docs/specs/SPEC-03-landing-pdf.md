# SPEC-03 Landing e PDF

Status: concluída.

A página `/` abre o gerador na primeira dobra. Visitante gera, pré-visualiza e baixa o PDF. Rascunho fica na sessão. Cores do PDF permanecem fixas.

Aceite: simulação e **Aplicar** nos simuladores (juros simples / compostos) exigem valor utilizado e taxa ao mês; sem parcelas informadas, a simulação assume 4; **Aplicar** só preenche o retorno total; **Gerar parcelas**, **Salvar na conta** e **Baixar PDF** exigem formulário completo (incluindo cidade e Pix válido) e retorno válido; rótulo **Juros compostos** (tabela Price); botões com ícones padronizados; o PDF segue `carne-{pagador}-{referencia}-{AAAAMMDD}.pdf`; parcela paga reimpressa mostra a data no canhoto.
