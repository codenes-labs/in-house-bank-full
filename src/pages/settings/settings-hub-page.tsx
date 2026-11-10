import { Link } from 'react-router-dom';
import {
  ArrowDownUp,
  Landmark,
  Settings2,
  User,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { SettingsPageHeader } from './settings-page-header';

const hubItems: readonly {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    to: '/configuracoes/usuario',
    label: 'Usuário',
    description: 'E-mail de login e alteração de senha.',
    icon: UserRound,
  },
  {
    to: '/configuracoes/conta',
    label: 'Beneficiário',
    description: 'Nome, documento, cidade, instituição e Pix padrão do carnê.',
    icon: User,
  },
  {
    to: '/configuracoes/parcelamentos',
    label: 'Parcelamentos',
    description: 'Valores padrão, carnê, PDF, WhatsApp e logotipo.',
    icon: WalletCards,
  },
  {
    to: '/configuracoes/financeiro',
    label: 'Ajustes financeiros',
    description: 'CDI das caixinhas e metas de patrimônio na home.',
    icon: Landmark,
  },
  {
    to: '/configuracoes/gerais',
    label: 'Configurações gerais',
    description: 'Tema claro ou escuro e tamanho do texto.',
    icon: Settings2,
  },
  {
    to: '/configuracoes/backup',
    label: 'Importação e exportação',
    description: 'Exportar e importar backup JSON da conta.',
    icon: ArrowDownUp,
  },
];

export function SettingsHubPage() {
  return (
    <div className="grid gap-4">
      <SettingsPageHeader title="Configurações" description="Escolha o que deseja ajustar." />
      <div className="grid gap-2 lg:grid-cols-2">
        {hubItems.map((item) => (
          <Link key={item.to} to={item.to} className="block">
            <Card className="press flex h-full items-start gap-3 transition-colors hover:border-primary/30">
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
