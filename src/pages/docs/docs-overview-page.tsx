import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';

const TOPICS = [
  { to: '/docs/stack', title: 'Stack', text: 'React, Vite, TypeScript, Tailwind, Vitest e ferramentas do repositório.' },
  { to: '/docs/arquitetura', title: 'Arquitetura', text: 'Camadas de domínio, repositório e front no mesmo domínio que a API.' },
  { to: '/docs/banco', title: 'Banco Neon', text: 'Postgres, RLS, migração automática e backup JSON.' },
  { to: '/docs/ci-cd', title: 'CI/CD', text: 'GitHub Actions: lint, testes e deploy na master.' },
  { to: '/docs/deploy', title: 'Deploy Cloudflare', text: 'Worker, assets estáticos e secrets.' },
  { to: '/docs/api', title: 'API OpenAPI', text: 'Referência HTTP interativa (Swagger UI).' },
  { to: '/docs/apresentacao', title: 'Apresentação', text: 'Espaço para vídeo e roteiro do produto.' },
  { to: '/docs/changelog', title: 'Changelog', text: 'Versões e marcos do produto.' },
] as const;

export function DocsOverviewPage() {
  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="text-xl font-semibold">O que é</h2>
        <p className="mt-2 text-muted-foreground">
          O In House Bank é um aplicativo web para registrar empréstimos e compras parceladas feitos com dinheiro próprio,
          acompanhar parcelas, saldo livre, caixinhas e patrimônio. Ele <strong className="text-foreground">não movimenta dinheiro</strong>{' '}
          e <strong className="text-foreground">não é meio de pagamento</strong>.
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <Link key={topic.to} to={topic.to} className="block">
            <Card className="press h-full transition-colors hover:border-primary/30">
              <h3 className="font-semibold text-primary">{topic.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{topic.text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
