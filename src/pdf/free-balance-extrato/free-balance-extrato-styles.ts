/**
 * CSS auxiliar do extrato de saldo livre.
 * html2canvas (via html2pdf.js) ignora variáveis CSS e falha com flex/grid/position:fixed;
 * cores literais e layout principal ficam inline no HTML gerado.
 */
export const FREE_BALANCE_EXTRATO_CSS = `
* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #0F172A;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 1.45;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

table { border-collapse: collapse; }
img { display: block; max-width: 100%; border: 0; }

@media print {
  tr { page-break-inside: avoid; break-inside: avoid; }
  thead { display: table-header-group; }
}
`;
