# SPEC-06 WhatsApp, filtros e carnê

Status: concluída.

Cobrar no WhatsApp abre `wa.me` com a mensagem configurável. Lista filtra por texto, status e mês, e ordena por vencimento, valor ou criação. Logotipo, instruções e termo entram no PDF. O carnê é gerado no cliente com **pdf-lib** (`src/pdf/generate-carne-pdf.ts`), não HTML. Cabeçalho compacto azul `#1E3A8A` com texto claro; cartão branco com sombra leve; só o canhoto em mint `#ECFDF5`; valor em faixa azul largura total; Pix em caixa branca com fonte maior; hierarquia visual por cor, não tudo mint. Backup JSON version 1 exporta e importa.

Aceite: telefone sem DDD válido não abre o WhatsApp; plano pode sobrescrever o rodapé das configurações.
