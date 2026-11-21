import { useState } from 'react';
import { LandingReveal } from './landing-reveal';
import { cx } from '../ui';

type LandingTabId = 'assistente' | 'caixinhas' | 'carnes';

const TABS: { id: LandingTabId; label: string }[] = [
  { id: 'assistente', label: 'Assistente & Orçamento' },
  { id: 'caixinhas', label: 'Caixinhas & Patrimônio' },
  { id: 'carnes', label: 'Parcelamentos & Carnês' },
];

export function LandingFeatureTabs() {
  const [activeTab, setActiveTab] = useState<LandingTabId>('assistente');

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <LandingReveal className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-xs font-bold tracking-wider text-accent uppercase">Por dentro da plataforma</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Explore os módulos do seu painel</h2>
      </LandingReveal>

      <LandingReveal className="mb-8 flex flex-wrap justify-center gap-2">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                'press rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-[var(--shadow-control)]'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted',
              )}
              aria-pressed={active}
            >
              {tab.label}
            </button>
          );
        })}
      </LandingReveal>

      <LandingReveal className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        {activeTab === 'assistente' ? <AssistenteTab /> : null}
        {activeTab === 'caixinhas' ? <CaixinhasTab /> : null}
        {activeTab === 'carnes' ? <CarnesTab /> : null}
      </LandingReveal>
    </div>
  );
}

function AssistenteTab() {
  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <span className="inline-block rounded-lg bg-brand-soft px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Organizador Mensal
        </span>
        <h3 className="text-2xl font-bold text-foreground">Clareza total antes mesmo de gastar</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Saiba exatamente quanto do seu salário já está comprometido com parcelas, quanto está livre para lazer e quanto
          deve ir direto para suas reservas.
        </p>
        <FeatureList items={['Sugestão automática de poupança e teto de gastos', 'Visão consolidada de Saldo Livre vs. Comprometido']} />
      </div>
      <div className="rounded-xl border border-border bg-muted/40 p-5 lg:col-span-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Resumo do Mês Atual</p>
            <p className="text-xl font-bold text-foreground">Saldo Livre: R$ 1.840,00</p>
          </div>
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-status-paid">Dentro da meta</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat title="Contas Fixas" value="R$ 2.150,00" hint="47% da renda" />
          <MiniStat title="Lazer Utilizado" value="R$ 510,00" hint="De R$ 1.100,00" valueClass="text-brand" />
          <MiniStat title="Aporte Caixinhas" value="R$ 950,00" hint="Concluído ✓" valueClass="text-status-paid" />
        </div>
      </div>
    </div>
  );
}

function CaixinhasTab() {
  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <span className="inline-block rounded-lg bg-success-soft px-3 py-1 text-xs font-semibold text-status-paid">
          Patrimônio & Reservas
        </span>
        <h3 className="text-2xl font-bold text-foreground">Acompanhe cada objetivo de perto</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Crie caixinhas personalizadas para reserva de emergência, troca de carro ou capital de giro próprio, com
          projeção automática pelo CDI.
        </p>
        <FeatureList
          items={[
            'Barra de progresso rumo à próxima meta de patrimônio',
            'Histórico completo de entradas e retiradas para empréstimos',
          ]}
        />
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-5 lg:col-span-7">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground">Patrimônio Total Acumulado</span>
            <span className="text-base font-bold text-status-paid">R$ 5.377,60</span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">Próxima meta: R$ 10.000,00 · Dez/2026</p>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[53.7%] rounded-full bg-status-paid" role="presentation" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MiniStat title="Reserva de Emergência" value="R$ 3.877,60" hint="+100% CDI" />
          <MiniStat title="Fundo de Giro Próprio" value="R$ 1.500,00" hint="Ativo" />
        </div>
      </div>
    </div>
  );
}

function CarnesTab() {
  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <span className="inline-block rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Gerador de Carnês & Pix
        </span>
        <h3 className="text-2xl font-bold text-foreground">Pague juros para você mesmo</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tirou dinheiro da caixinha para uma compra à vista ou emprestou para um familiar? Gere um carnê parcelado com
          taxa configurável e código Pix Copia e Cola em cada parcela.
        </p>
        <FeatureList
          items={['Cálculo automático em Juros Simples ou Compostos', 'Exportação em PDF e cobrança rápida via WhatsApp']}
        />
      </div>
      <div className="rounded-xl border border-border bg-muted/40 p-5 lg:col-span-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs text-muted-foreground">Simulação de Carnê · Principal R$ 540,00 (3% a.m.)</p>
            <p className="text-base font-bold text-foreground">Retorno Total: R$ 604,80 (4x de R$ 151,20)</p>
          </div>
          <span className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            Lucro: +R$ 64,80
          </span>
        </div>
        <div className="space-y-2">
          <InstallmentRow label="Parcela 1/4 · Venc. 20/12/2026" amount="R$ 151,20" status="Pix Pronto" paid />
          <InstallmentRow label="Parcela 2/4 · Venc. 20/01/2027" amount="R$ 151,20" status="Agendada" />
        </div>
      </div>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 pt-2 text-sm text-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-success-soft text-xs font-bold text-status-paid">
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function MiniStat({
  title,
  value,
  hint,
  valueClass,
}: {
  title: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={cx('mt-1 text-base font-bold', valueClass ?? 'text-foreground')}>{value}</p>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </div>
  );
}

function InstallmentRow({
  label,
  amount,
  status,
  paid,
}: {
  label: string;
  amount: string;
  status: string;
  paid?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5 text-xs">
      <span className="font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold text-foreground">{amount}</span>
        <span
          className={cx(
            'rounded px-2 py-0.5 font-medium',
            paid ? 'bg-success-soft text-status-paid' : 'bg-muted text-muted-foreground',
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
}