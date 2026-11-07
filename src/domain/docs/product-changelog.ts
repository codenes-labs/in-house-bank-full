export interface ChangelogSection {
  title: 'Adicionado' | 'Alterado' | 'Corrigido';
  items: readonly string[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  sections: readonly ChangelogSection[];
}

/** Atualize junto com `docs/CHANGELOG.md` (mesmo conteúdo). */
export const PRODUCT_CHANGELOG: readonly ChangelogRelease[] = [
  {
    version: '0.2.0',
    date: '2026-11-07',
    sections: [
      {
        title: 'Adicionado',
        items: [
          'Resgate do saldo livre com histórico (`free_balance_withdrawals`) e linhas no extrato (Saldo livre / Caixinha).',
          'Entrada e saída em `/financeiro/saldo-livre`; crédito automático no saldo livre ao marcar parcela paga.',
          'Documentação pública em `/docs` (stack, Neon, CI/CD, deploy, apresentação) e referência OpenAPI em `/docs/api`.',
          'Termos de uso e política de privacidade completos.',
          'Changelog do produto nesta seção.',
        ],
      },
      {
        title: 'Alterado',
        items: [
          'Financeiro: KPIs clicáveis; cards placeholder de contas a pagar/receber; rendimento estimado mantido na página.',
          'Caixinha: excluir e voltar no topo do detalhe; formulário de lançamento com entrada/saída semântica no saldo livre.',
        ],
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-03-20',
    sections: [
      {
        title: 'Adicionado',
        items: [
          'Área de caixinhas (`/caixinhas`), painel financeiro e fluxo de parcelamentos com seleção para reimprimir/excluir.',
          'Contas seed admin e demo; persistência Neon com RLS por `user_id`.',
        ],
      },
    ],
  },
];
