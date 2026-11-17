import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../components/auth-context';
import { Card, cx, EmptyState, StatusPill } from '../../components/ui';
import {
  HoldingAccountProfile,
  holdingAccountProfileLabel,
} from '../../domain/holding/holding-account-profile';
import { formatRegistrationCodeDisplay } from '../../domain/holding/company-registration-code';
import { canProvisionHoldingCompanies } from '../../domain/holding/holding-provision';
import { authRequestInit } from '../../lib/auth-token';
import { useMinLg } from '../../lib/use-min-lg';

type HoldingCompanyListRow = {
  id: string;
  registrationCode: string | null;
  email: string;
  profile: HoldingAccountProfile;
  mustChangePassword: boolean;
  businessName: string;
};

function companyDisplayName(company: HoldingCompanyListRow): string {
  if (company.businessName) {
    return company.businessName;
  }
  if (company.profile === HoldingAccountProfile.Administration) {
    return 'Codenes — administração';
  }
  if (company.profile === HoldingAccountProfile.Demo) {
    return 'Conta demonstração';
  }
  return company.email;
}

export function HoldingCompaniesPage() {
  const { session } = useAuth();
  const isLg = useMinLg();
  const [companies, setCompanies] = useState<HoldingCompanyListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/holding/companies', authRequestInit());
      const body = (await response.json()) as { error?: string; companies?: HoldingCompanyListRow[] };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível carregar as empresas.');
        setCompanies([]);
        return;
      }
      setCompanies(body.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && canProvisionHoldingCompanies(session.user) && isLg) {
      void loadCompanies();
    } else {
      setLoading(false);
    }
  }, [isLg, loadCompanies, session]);

  if (!session || !canProvisionHoldingCompanies(session.user)) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">Cadastro de empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Carregando…' : `${companies.length} conta${companies.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {isLg ? (
          <Link
            to="/holding/empresas/novo"
            className="press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground sm:w-auto"
          >
            <Plus className="size-5" aria-hidden />
            Nova empresa
          </Link>
        ) : null}
      </div>

      {!isLg ? (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
          Este cadastro está disponível apenas na versão web (tela larga).
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <Card>
          <p className="text-sm text-muted-foreground">Carregando contas do banco…</p>
        </Card>
      ) : companies.length === 0 ? (
        <div className="grid gap-3">
          <EmptyState title="Nenhuma conta" text="Cadastre a primeira empresa para liberar o login com e-mail e senha." />
          <Link
            to="/holding/empresas/novo"
            className="press inline-flex min-h-12 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground"
          >
            Nova empresa
          </Link>
        </div>
      ) : (
        <Card className="min-w-0 overflow-hidden p-0">
          <ul className="grid list-none gap-0 p-0 lg:grid-cols-[4.5rem_minmax(0,1fr)_5.5rem_minmax(0,6.5rem)] lg:gap-x-3">
            <li className="col-span-full hidden border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-subgrid lg:items-center">
              <span>ID</span>
              <span>Empresa</span>
              <span>Perfil</span>
              <span className="text-end lg:text-center">Acesso</span>
            </li>
            {companies.map((company) => {
              const name = companyDisplayName(company);
              return (
                <li
                  key={company.id}
                  className={cx(
                    'press col-span-full border-b border-border px-4 py-3 transition-colors last:border-b-0',
                    'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 lg:grid-cols-subgrid lg:items-center lg:gap-y-0',
                    'hover:bg-muted/40 lg:hover:bg-muted/50',
                  )}
                >
                  <Link to={`/holding/empresas/${company.id}`} className="contents">
                    <span className="font-mono text-sm font-semibold tabular-nums max-lg:row-start-1">
                      {formatRegistrationCodeDisplay(company.registrationCode)}
                    </span>
                    <div className="min-w-0 max-lg:col-span-2 max-lg:row-start-2">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="truncate text-sm text-muted-foreground">{company.email}</p>
                    </div>
                    <span className="text-sm text-muted-foreground max-lg:row-start-3 lg:text-left">
                      {holdingAccountProfileLabel(company.profile)}
                    </span>
                    <span className="flex justify-end max-lg:row-start-1 lg:justify-center">
                      {company.mustChangePassword ? (
                        <StatusPill label="Senha pendente" tone="pending" className="text-xs" />
                      ) : (
                        <StatusPill label="Ativo" tone="paid" className="text-xs" />
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}