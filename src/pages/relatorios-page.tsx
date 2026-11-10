import { Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartColumn,
  CircleDollarSign,
  PiggyBank,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../components/ui';
import { EXTRATO_KIND_OPTIONS, ExtratoKind } from '../domain/ledger/extrato-kind';
import { relatoriosExtratoNavTo } from '../domain/navigation/logged-shell-nav';

const EXTRATO_HUB_ICONS: Record<ExtratoKind, LucideIcon> = {
  [ExtratoKind.Payables]: ArrowDownToLine,
  [ExtratoKind.Receivables]: ArrowUpFromLine,
  [ExtratoKind.Installments]: WalletCards,
  [ExtratoKind.CashBox]: PiggyBank,
  [ExtratoKind.FreeBalance]: CircleDollarSign,
};

const EXTRATO_HUB_DESCRIPTIONS: Record<ExtratoKind, string> = {
  [ExtratoKind.Payables]: 'Contas a pagar — em desenvolvimento.',
  [ExtratoKind.Receivables]: 'Contas a receber — em desenvolvimento.',
  [ExtratoKind.Installments]: 'Parcelas pagas e pendentes.',
  [ExtratoKind.CashBox]: 'Aportes e resgates das caixinhas.',
  [ExtratoKind.FreeBalance]: 'Entradas e saídas registradas do saldo livre.',
};

const extratoItems = EXTRATO_KIND_OPTIONS.map((option) => ({
  to: relatoriosExtratoNavTo(option.value),
  label: option.label,
  description: EXTRATO_HUB_DESCRIPTIONS[option.value],
  icon: EXTRATO_HUB_ICONS[option.value],
}));

const hubItems = [
  ...extratoItems,
  {
    to: '/relatorios/resumo',
    label: 'Resumo',
    description: 'Recebido, lucro e patrimônio.',
    icon: ChartColumn,
  },
] as const;

export function RelatoriosPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Relatórios</h1>
      <p className="text-sm text-muted-foreground">
        Escolha o extrato ou o resumo que quer consultar.
      </p>
      <div className="grid gap-2">
        {hubItems.map((item) => (
          <Link key={item.to} to={item.to} className="block">
            <Card className="press flex items-start gap-3 transition-colors hover:border-primary/30">
              <item.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
