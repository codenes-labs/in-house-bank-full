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
    version: '0.2.3',
    date: '2026-11-11',
    sections: [
      {
        title: 'Adicionado',
        items: [
          'Projeto B (SPEC-09): health integration, métrica api_requests_total, SLO, ADR BankRepository, openapi.yaml e k6 smoke.',
          'CI roda test:coverage com piso mínimo.',
        ],
      },
    ],
  },
  {
    version: '0.2.2',
    date: '2026-11-11',
    sections: [
      {
        title: 'Corrigido',
        items: [
          'Segurança: recover desligado no Worker por padrão; 2FA begin exige senha+código se já ativo; senha atual na troca de senha.',
          'Headers de segurança; validação de import JSON; Docker/entrypoint sem gravar .dev.vars na raiz.',
        ],
      },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-11-10',
    sections: [
      {
        title: 'Adicionado',
        items: [
          'Hub Relatórios com Extrato por tipo (Saldo livre, Caixinha) e Resumo.',
          'Extrato: período, Limpar filtro, histórico por mês e Baixar PDF (caixinha e saldo livre).',
          'PDF do extrato de saldo livre com resumo, saldo por linha e rodapé paginado (html2pdf.js).',
          'Conta demo com snapshot fictício e extrato alinhado às datas de exemplo.',
          'Entrada no saldo livre ao excluir caixinha (nota Resgate da caixinha).',
          'Hub Configurações (SPEC-12): usuário, beneficiário, carnê, financeiro, backup JSON.',
          'Simulador de juros no carnê; Docker de desenvolvimento (.docker/).',
        ],
      },
      {
        title: 'Alterado',
        items: [
          'PDF do carnê e extrato de caixinha com utilitários compartilhados em src/pdf/ e layout atualizado.',
          'Parcelamentos: paginação, vencimento e botões padronizados; Início com próximas parcelas.',
          'Saldo livre: lançamento em linha única; menu mobile com Configurações.',
        ],
      },
      {
        title: 'Corrigido',
        items: [
          'Calendário de vencimento no mobile; demo sem persistência no Neon; tema claro/escuro persistente.',
        ],
      },
    ],
  },
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
