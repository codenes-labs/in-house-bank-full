import type { PublicToolId } from './public-tools-catalog';

export type PublicToolPageCopy = {
  title: string;
  lead: string;
};

export const PUBLIC_TOOL_PAGE_COPY: Record<PublicToolId, PublicToolPageCopy> = {
  organizador: {
    title: 'Assistente financeiro',
    lead:
      'Prévia gratuita: veja como distribuir sua renda entre compromissos, lazer e reservas. Nenhum dado é salvo nesta página. O assistente completo na conta será liberado em breve.',
  },
  'gerar-carne': {
    title: 'Gerador de parcelas',
    lead:
      'Monte o carnê, simule juros e exporte o PDF com Pix em cada vencimento. Uso público: as informações ficam apenas neste navegador até você fechar a aba.',
  },
};

export const PUBLIC_ASSISTANT_SIMULATOR_FOOTNOTE = 'Prévia local — sem sincronização com a conta.';
export const PUBLIC_ASSISTANT_SIMULATOR_ACCOUNT_CTA = 'Entrar na conta';