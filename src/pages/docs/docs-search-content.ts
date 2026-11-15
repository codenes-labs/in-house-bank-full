import { PRODUCT_CHANGELOG } from '../../domain/docs/product-changelog';

export interface DocsSearchSection {
  title: string;
  body: string;
}

export interface DocsSearchTopic {
  to: string;
  label: string;
  keywords: readonly string[];
  sections: readonly DocsSearchSection[];
}

const OVERVIEW_TOPICS =
  'Stack React Vite TypeScript Tailwind Vitest ferramentas repositório. Arquitetura domínio repositório API. Banco Neon Postgres RLS migração automática backup JSON. CI/CD GitHub Actions lint testes deploy master. Deploy Cloudflare Worker assets secrets. API OpenAPI Swagger UI. Changelog versões marcos produto.';

function changelogSections(): DocsSearchSection[] {
  const intro: DocsSearchSection = {
    title: 'Sobre o changelog',
    body:
      'Versões marcam entregas visíveis ao usuário. Detalhe técnico completo no repositório em docs/CHANGELOG.md. Atualize changelog quando mudar comportamento, UI ou API documentada.',
  };
  const releases = PRODUCT_CHANGELOG.map((release) => ({
    title: `v${release.version}`,
    body: release.sections
      .flatMap((section) => section.items.map((item) => `${section.title}: ${item}`))
      .join(' '),
  }));
  return [intro, ...releases];
}

/** Texto espelhado das páginas em /docs — manter alinhado ao editar docs-*-page.tsx */
export const DOCS_SEARCH_TOPICS: readonly DocsSearchTopic[] = [
  {
    to: '/docs',
    label: 'Visão geral',
    keywords: ['produto', 'carnê', 'patrimônio', 'parcelamento', 'overview'],
    sections: [
      {
        title: 'O que é',
        body:
          'In House Bank aplicativo web registrar empréstimos compras parceladas dinheiro próprio acompanhar parcelas saldo livre caixinhas patrimônio não movimenta dinheiro não é meio de pagamento',
      },
      {
        title: 'Tópicos',
        body: OVERVIEW_TOPICS,
      },
      {
        title: 'Documentação técnica',
        body:
          'Referência do produto stack banco pipeline API HTTP área não aparece no menu da conta logada',
      },
    ],
  },
  {
    to: '/docs/stack',
    label: 'Stack',
    keywords: ['react', 'vite', 'typescript', 'tailwind', 'vitest', 'recharts', 'pdf'],
    sections: [
      {
        title: 'Front-end',
        body:
          'React 19 React Router 7 Vite 8 build dev server TypeScript estrito Tailwind CSS 4 componentes src/components Lucide React ícones Recharts relatórios SPEC-10 extrato texto pdf-lib qrcode PDF carnê navegador',
      },
      {
        title: 'Back-end e dados',
        body:
          'API src/server/create-api-handler.ts rotas /api/* Neon Postgres @neondatabase/serverless JWT HS256 sessão Bearer cliente Schema RLS src/server/schema.ts',
      },
      {
        title: 'Qualidade e entrega',
        body:
          'Vitest testes unitários src/**/*.spec.ts oxlint npm run lint Wrangler 4 Cloudflare Worker GitHub Actions .github/workflows',
      },
      {
        title: 'Princípios de código',
        body:
          'Domínio puro src/domain sem React dinheiro centavos inteiros datas YYYY-MM-DD specs docs/specs features produção SDD',
      },
    ],
  },
  {
    to: '/docs/arquitetura',
    label: 'Arquitetura',
    keywords: ['domínio', 'repositório', 'camadas', 'worker', 'spa', 'jwt'],
    sections: [
      {
        title: 'Visão geral',
        body:
          'Navegador carrega SPA dist/ chamadas autenticadas /api/* mesmo domínio Worker encaminha API handler Node-compatível restante assets estáticos',
      },
      {
        title: 'Camadas',
        body:
          'domain regras negócio sem I/O application orquestrações domínio repositories BankRepository HTTP memória testes components pages pdf interface',
      },
      {
        title: 'Visitante e logado',
        body:
          'Visitante landing gerador carnê rascunho sessionStorage Login JWT cliente BankRepository HTTP persiste Neon cadastro público fechado contas seed admin demo',
      },
      {
        title: 'Repositório',
        body:
          'Contrato BankRepository load saveSettings planos parcelas caixinhas movimentos resgate saldo livre import backup front nunca DATABASE_URL JWT_SECRET',
      },
    ],
  },
  {
    to: '/docs/banco',
    label: 'Banco Neon',
    keywords: ['postgres', 'neon', 'rls', 'user_id', 'backup', 'migração', 'schema'],
    sections: [
      {
        title: 'Neon Postgres',
        body:
          'Banco gerenciado Neon URL só servidor variável DATABASE_URL primeira requisição handler aplica schemaStatements tabelas índices RLS',
      },
      {
        title: 'Tabelas principais',
        body:
          'users credenciais tipo conta settings negócio Pix padrão CDI metas saldo livre installment_plans installments parcelamentos cash_boxes cash_box_movements caixinhas free_balance_withdrawals saídas auditáveis saldo livre',
      },
      {
        title: 'Isolamento (RLS)',
        body:
          'Cada tabela user_id referenciando users políticas user_id current_setting app.user_id servidor cada transação testes src/server/schema.spec.ts',
      },
      {
        title: 'Backup',
        body:
          'Exportação JSON versão 1 app Configurações Import substitui dados usuário autenticado detalhes docs/banco.md',
      },
    ],
  },
  {
    to: '/docs/ci-cd',
    label: 'CI/CD',
    keywords: ['github', 'actions', 'lint', 'testes', 'workflow', 'master', 'rollback', 'revert', 'wrangler'],
    sections: [
      {
        title: 'GitHub Actions',
        body:
          'Dois workflows .github/workflows/ developer.yml branches não master lint coverage build deploy.yml master lint coverage build validação secrets deploy Cloudflare',
      },
      {
        title: 'Ambiente de CI',
        body: 'Node.js 22 npm ci cache dependências concurrency branch developer cancela execução anterior',
      },
      {
        title: 'Gates',
        body:
          'Nenhum deploy sem lint testes verdes master coverage mínimo vite.config.ts lines statements functions branches métrica GET /api/metrics SLO docs/slo.md SPEC-09',
      },
      {
        title: 'Rollback em produção',
        body:
          'Deploy master publica Worker in-house-bank-full dist SPA devcontainer Docker local risco quebra produção build Worker quando usar workflow Deploy falhou deploy verde defeito rollback Cloudflare wrangler git revert master push conferência GET /api/health login fluxo crítico',
      },
    ],
  },
  {
    to: '/docs/deploy',
    label: 'Deploy',
    keywords: ['cloudflare', 'wrangler', 'secrets', 'worker', 'build', 'rollback'],
    sections: [
      {
        title: 'Cloudflare Worker',
        body:
          'worker/index.ts publica API SPA mesmo domínio rotas /api/* createApiHandler demais rotas bucket assets fallback SPA',
      },
      {
        title: 'Build local',
        body: 'npm run build tsc Vite dist npm run deploy build wrangler deploy',
      },
      {
        title: 'Docker',
        body:
          'Desenvolvimento docker compose .docker/docker-compose.dev.yaml Vite 5173 .docker/.env produção local compose.prod.yaml Dockerfile raiz wrangler dev 8787 deploy nuvem npm run deploy Worker não imagem Docker produção',
      },
      {
        title: 'Secrets (GitHub → Worker)',
        body:
          'DATABASE_URL connection string Neon JWT_SECRET mínimo 32 caracteres CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID wrangler-action sync secrets wrangler secret bulk',
      },
      {
        title: 'Produção vs desenvolvimento',
        body:
          'Dev plugin Vite neon-api monta rotas /api variáveis .docker/.env ambiente front caminhos relativos /api/...',
      },
      {
        title: 'Rollback',
        body:
          'Push master versão ruim rollback dashboard Cloudflare wrangler rollback git revert push CI/CD Rollback em produção',
      },
    ],
  },
  {
    to: '/docs/api',
    label: 'API (OpenAPI)',
    keywords: ['swagger', 'openapi', 'bearer', 'auth', 'sign-in', 'rest', 'http'],
    sections: [
      {
        title: 'Swagger UI',
        body:
          'Especificação /api/openapi.json login POST /api/auth/sign-in copie accessToken Authorize Bearer conta demo teste senha make api-token JWT terminal curl',
      },
    ],
  },
  {
    to: '/docs/changelog',
    label: 'Changelog',
    keywords: ['versão', 'release', 'novidades', 'histórico', '0.2.1', '0.2.0'],
    sections: changelogSections(),
  },
];