export type ReportId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'R10';

export interface ReportCatalogEntry {
  id: ReportId;
  title: string;
  description: string;
}

export const REPORT_CATALOG: readonly ReportCatalogEntry[] = [
  {
    id: 'R1',
    title: 'Fluxo de caixa mensal',
    description: 'Previsto (vencimentos) × realizado (pagamentos) por mês.',
  },
  {
    id: 'R2',
    title: 'Inadimplência por faixa de atraso',
    description: 'Parcelas vencidas em 1–15, 16–30 e 31+ dias, por tomador.',
  },
  {
    id: 'R3',
    title: 'Lucro por mês',
    description: 'Lucro previsto (emissão) e realizado (baixas) por mês.',
  },
  {
    id: 'R4',
    title: 'Ranking de tomadores',
    description: 'Total emprestado, retornado, lucro e atrasos.',
  },
  {
    id: 'R5',
    title: 'Lucro por tipo e referência',
    description: 'Compra, empréstimo, sangria e outros; detalhe por referência.',
  },
  {
    id: 'R6',
    title: 'Agenda de recebimentos',
    description: 'Parcelas pendentes futuras por semana e por mês.',
  },
  {
    id: 'R7',
    title: 'Taxa efetiva por parcelamento',
    description: 'Retorno ÷ principal e % ao mês equivalente (juros simples).',
  },
  {
    id: 'R8',
    title: 'Evolução do patrimônio',
    description: 'Patrimônio ao fim de cada mês (caixinhas + saldo livre atual).',
  },
  {
    id: 'R9',
    title: 'Rendimento das caixinhas',
    description: 'Estimativa mensal e uso do limite por caixinha.',
  },
  {
    id: 'R10',
    title: 'Economia vs cartão/empréstimo',
    description: 'Parcelamentos com preço no cartão informado no gerador.',
  },
];
