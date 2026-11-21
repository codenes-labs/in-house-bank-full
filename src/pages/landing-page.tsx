import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileText, PieChart, TrendingUp } from 'lucide-react';
import { LandingFeatureTabs } from '../components/landing/landing-feature-tabs';
import { LandingReveal } from '../components/landing/landing-reveal';
import { SalaryAssistantSimulator } from '../components/landing/salary-assistant-simulator';
import { PublicSiteChrome } from '../components/public-site-chrome';
import { cx } from '../components/ui';

export function LandingPage() {
  return (
    <PublicSiteChrome section="landing">
      <section className="landing-grid-pattern relative overflow-hidden pb-20 pt-8 lg:pb-28 lg:pt-12">
        <div className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <LandingReveal eager className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-soft px-3.5 py-1.5 text-xs font-semibold tracking-wide text-secondary-foreground uppercase">
                <span className="size-2 animate-pulse rounded-full bg-status-paid" aria-hidden />
                Assistente Financeiro & Gestão de Patrimônio
              </div>

              <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                Organize seu salário, construa reservas e{' '}
                <span className="text-primary">seja seu próprio banco.</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                O <strong className="text-foreground">In House Bank</strong> calcula a divisão ideal da sua renda, projeta
                o crescimento das suas caixinhas e organiza seus parcelamentos e carnês com Pix. Sem movimentar seu
                dinheiro — 100% no seu controle.
              </p>

              <div className="flex flex-col items-stretch gap-3.5 pt-2 sm:flex-row sm:items-center">
                <Link
                  to="/entrar"
                  className="press inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] sm:text-base"
                >
                  Acessar minha conta
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a
                  href="#ferramentas"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:text-base"
                >
                  Explorar ferramentas
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground">
                <TrustBadge text="Não é instituição financeira" />
                <TrustBadge text="Sem custódia de saldo" />
                <TrustBadge text="Pix Copia e Cola integrado" />
              </div>
            </LandingReveal>

            <SalaryAssistantSimulator />
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-border bg-card py-16 sm:py-24 scroll-mt-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal className="mb-12 max-w-2xl">
            <p className="text-xs font-bold tracking-wider text-accent uppercase">Arquitetura Financeira</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Tudo o que você precisa para dominar seu fluxo de caixa
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Integramos organização orçamentária, metas de rendimento e controle de crédito próprio em uma interface
              limpa e direta.
            </p>
          </LandingReveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PillarCard
              icon={PieChart}
              tone="brand"
              title="1. Divisão Inteligente de Renda"
              text="Informe quanto você ganha e receba sugestões claras de tetos para contas fixas, lazer sem culpa e aportes mensais."
              delayClass="landing-reveal-delay-0"
            />
            <PillarCard
              icon={TrendingUp}
              tone="success"
              title="2. Caixinhas & Metas de Patrimônio"
              text="Separe reservas por objetivo, acompanhe barras de progresso e visualize projeções de rendimento baseadas no CDI."
              delayClass="landing-reveal-delay-100"
            />
            <PillarCard
              icon={FileText}
              tone="sky"
              title="3. Parcelamentos & Gerador de Carnês"
              text="Emprestou para si mesmo ou para terceiros? Gere carnês com juros simples ou compostos, PDF e cobrança via Pix."
              delayClass="landing-reveal-delay-200"
            />
          </div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-20 py-16 sm:py-24">
        <LandingFeatureTabs />
      </section>

      <section
        id="para-quem"
        className="border-t border-border bg-card py-16 sm:py-24 scroll-mt-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LandingReveal className="mb-12 max-w-2xl">
            <p className="text-xs font-bold tracking-wider text-accent uppercase">Perfis de Uso</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              Feito para quem leva o próprio dinheiro a sério
            </h2>
          </LandingReveal>

          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <AudienceCard
              badge="Organização Pessoal & Familiar"
              badgeTone="brand"
              title="Assalariados e Autônomos que querem previsibilidade"
              body="Pare de misturar o dinheiro das contas com o dinheiro do lazer. Use o assistente para fatiar sua renda assim que ela cair na conta e acompanhe suas metas sem planilhas complexas."
              footnote="Ideal para: Planejamento 50/30/20, reservas de emergência e compras à vista com autofinanciamento."
            />
            <AudienceCard
              badge="Gestão de Recebíveis & Carnês"
              badgeTone="success"
              title="Quem gerencia parcelamentos diretos e empréstimos"
              body="Controle datas de vencimento, parcelas em atraso, lucro previsto vs. recebido e gere carnês profissionais com QR/Copia e Cola Pix e lembretes para WhatsApp."
              footnote="Ideal para: Acordos familiares, vendas parceladas diretas e reposição disciplinada de caixinhas."
              delay
            />
          </div>

          <LandingReveal className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-primary p-8 text-primary-foreground shadow-[var(--shadow-card)] sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <h3 className="text-2xl font-bold sm:text-3xl">O que a sua conta gratuita libera</h3>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-2 pt-1 text-sm sm:grid-cols-2">
                {[
                  'Assistente de divisão de salário',
                  'Caixinhas e projeção pelo CDI',
                  'Histórico completo de parcelamentos',
                  'Relatórios de patrimônio e backup',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                to="/entrar"
                className="press inline-flex w-full items-center justify-center rounded-xl bg-card px-7 py-4 text-sm font-bold text-primary shadow-[var(--shadow-control)] sm:w-auto sm:text-base"
              >
                Entrar na conta
              </Link>
              <Link
                to="/lista-espera"
                className="inline-flex w-full items-center justify-center rounded-xl border border-primary-foreground/40 px-7 py-4 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto sm:text-base"
              >
                Lista de espera
              </Link>
            </div>
          </LandingReveal>
        </div>
      </section>
    </PublicSiteChrome>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check className="size-4 text-status-paid" aria-hidden />
      {text}
    </span>
  );
}

function PillarCard({
  icon: Icon,
  tone,
  title,
  text,
  delayClass,
}: {
  icon: typeof PieChart;
  tone: 'brand' | 'success' | 'sky';
  title: string;
  text: string;
  delayClass: string;
}) {
  const iconWrap = cx(
    'mb-5 flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
    tone === 'brand' && 'bg-brand-soft text-primary',
    tone === 'success' && 'bg-success-soft text-status-paid',
    tone === 'sky' && 'bg-secondary text-secondary-foreground',
  );

  return (
    <LandingReveal
      className={cx(
        'group rounded-2xl border border-border bg-background p-7 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]',
        delayClass,
      )}
    >
      <div className={iconWrap}>
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </LandingReveal>
  );
}

function AudienceCard({
  badge,
  badgeTone,
  title,
  body,
  footnote,
  delay,
}: {
  badge: string;
  badgeTone: 'brand' | 'success';
  title: string;
  body: string;
  footnote: string;
  delay?: boolean;
}) {
  const badgeClass = cx(
    'mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold',
    badgeTone === 'brand' && 'bg-brand-soft text-secondary-foreground',
    badgeTone === 'success' && 'bg-success-soft text-status-paid',
  );

  return (
    <LandingReveal
      className={cx(
        'rounded-2xl border border-border bg-background p-7',
        delay && 'landing-reveal-delay-100',
      )}
    >
      <span className={badgeClass}>{badge}</span>
      <h3 className="mb-2 text-xl font-bold text-foreground">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <p className="text-xs font-medium text-muted-foreground">{footnote}</p>
    </LandingReveal>
  );
}