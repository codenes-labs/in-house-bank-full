import { Link } from 'react-router-dom';
import { DocsSection } from './docs-prose';

const OUTLINE = [
  'Problema: controlar empréstimos e parcelas com dinheiro próprio, sem confundir com banco.',
  'Landing: gerador de carnê, Pix copia e cola, PDF no cliente.',
  'Conta: parcelamentos, marcar paga, WhatsApp, saldo livre e caixinhas.',
  'Patrimônio: KPIs, metas, extrato parcial (buildLedger).',
  'Arquitetura: domínio testável, Neon + RLS, deploy único no Worker.',
] as const;

export function DocsPresentationPage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="Vídeo de apresentação">
        <p>Espaço reservado para incorporar o vídeo (YouTube, Vimeo ou arquivo hospedado). Substitua o bloco abaixo quando o link estiver pronto.</p>
        <div
          className="grid aspect-video place-items-center rounded-xl border border-dashed border-border bg-muted px-4 text-center text-sm text-muted-foreground"
          role="img"
          aria-label="Área reservada para vídeo de apresentação"
        >
          Player de vídeo — em breve
        </div>
      </DocsSection>
      <DocsSection title="Roteiro sugerido (5–8 min)">
        <ol className="grid list-decimal gap-2 pl-5">
          {OUTLINE.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </DocsSection>
      <DocsSection title="Material de apoio">
        <p>
          Use as demais seções desta documentação durante a gravação: stack, banco, CI/CD e demonstração ao vivo da API em{' '}
          <Link to="/docs/api" className="font-semibold text-primary">
            /docs/api
          </Link>
          .
        </p>
      </DocsSection>
    </div>
  );
}
