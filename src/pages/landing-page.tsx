import { Link } from 'react-router-dom';
import { CarneGenerator } from '../components/carne-generator';
import { PublicSiteChrome } from '../components/public-site-chrome';
import { Card } from '../components/ui';

export function LandingPage() {
  return (
    <PublicSiteChrome>
      <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Controle financeiro pessoal</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">Pague juros para você mesmo</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            O In House Bank organiza empréstimos e compras parceladas feitos com o seu dinheiro.
            Sai da caixinha, paga no Pix e volta em parcelas. O app não movimenta dinheiro e não é meio de pagamento.
          </p>
        </div>
        <CarneGenerator />
      </section>
      <section className="mt-10 grid gap-3 md:grid-cols-3">
        <Card><h2 className="font-semibold">1. Sai da caixinha</h2><p className="mt-2 text-muted-foreground">O valor utilizado deixa o seu caixa e vira uma operação.</p></Card>
        <Card><h2 className="font-semibold">2. Combina as parcelas</h2><p className="mt-2 text-muted-foreground">O retorno é dividido, com a diferença na última parcela, e cada uma ganha um Pix copia e cola.</p></Card>
        <Card><h2 className="font-semibold">3. Volta para você</h2><p className="mt-2 text-muted-foreground">Quando a parcela é paga, o controle registra a data. O lucro previsto é o retorno menos o valor utilizado.</p></Card>
      </section>
      <Card className="mt-6">
        <h2 className="text-xl font-semibold">Exemplo</h2>
        <p className="mt-2 text-muted-foreground">
          Principal de R$ 540,00, 3% ao mês, em 4 parcelas: juros simples fecham em R$ 604,80.
          Nos juros compostos, a parcela fica em R$ 145,27 e o total em R$ 581,08.
        </p>
      </Card>
      <Card className="mt-6">
        <h2 className="text-xl font-semibold">O que a conta libera</h2>
        <ul className="mt-3 grid gap-2 text-muted-foreground md:grid-cols-2">
          <li>Histórico de parcelamentos</li>
          <li>Caixinhas e projeção pelo CDI</li>
          <li>Relatórios de recebimento e patrimônio</li>
          <li>Backup e cobrança por WhatsApp</li>
        </ul>
        <Link to="/entrar" className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground">
          Entrar na conta
        </Link>
      </Card>
    </PublicSiteChrome>
  );
}
