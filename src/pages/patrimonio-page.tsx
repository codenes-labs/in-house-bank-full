import { Link } from 'react-router-dom';
import { Landmark, PiggyBank, WalletCards } from 'lucide-react';
import { Card } from '../components/ui';

const items = [
  {
    to: '/financeiro',
    label: 'Financeiro',
    description: 'Saldo livre, patrimônio e contas a pagar e a receber.',
    icon: Landmark,
  },
  {
    to: '/caixinhas',
    label: 'Caixinhas',
    description: 'Reservas com projeção de rendimento.',
    icon: PiggyBank,
  },
  {
    to: '/parcelamentos',
    label: 'Parcelamentos',
    description: 'Empréstimos e compras parceladas.',
    icon: WalletCards,
  },
] as const;

export function PatrimonioPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Patrimônio</h1>
      <p className="text-sm text-muted-foreground">
        Escolha onde quer registrar ou consultar o seu patrimônio e movimentos.
      </p>
      <div className="grid gap-2">
        {items.map((item) => (
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
