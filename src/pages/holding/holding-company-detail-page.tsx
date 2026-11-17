import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../components/auth-context';
import { DeleteHoldingCompanyPanel } from '../../components/delete-holding-company-panel';
import { Button, Card, Field, TextInput, StatusPill, money } from '../../components/ui';
import {
  HoldingAccountProfile,
  holdingAccountProfileLabel,
} from '../../domain/holding/holding-account-profile';
import { formatRegistrationCodeDisplay } from '../../domain/holding/company-registration-code';
import { canManageHoldingAccounts, canProvisionHoldingCompanies } from '../../domain/holding/holding-provision';
import { authRequestInit } from '../../lib/auth-token';
import { useMinLg } from '../../lib/use-min-lg';

type HoldingCompanyDetail = {
  id: string;
  registrationCode: string | null;
  email: string;
  profile: HoldingAccountProfile;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  holdingDelegate: boolean;
  createdAt: string;
  businessName: string;
  city: string;
  document: string | null;
  canEditAccess: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  hasOperationalData: boolean;
  dataMetrics: {
    installmentPlanCount: number;
    cashBoxCount: number;
    cashBoxMovementCount: number;
    freeBalanceCents: number;
    freeBalanceDepositCount: number;
    freeBalanceWithdrawalCount: number;
  };
};

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('pt-BR');
}

export function HoldingCompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuth();
  const isLg = useMinLg();
  const navigate = useNavigate();
  const [company, setCompany] = useState<HoldingCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteAcknowledge, setDeleteAcknowledge] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManage = session ? canManageHoldingAccounts(session.user) : false;

  const load = useCallback(async () => {
    if (!companyId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/holding/companies/${companyId}`, authRequestInit());
      const body = (await response.json()) as { error?: string; company?: HoldingCompanyDetail };
      if (!response.ok) {
        setError(body.error ?? 'Conta não encontrada.');
        setCompany(null);
        return;
      }
      setCompany(body.company ?? null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (session && canProvisionHoldingCompanies(session.user) && isLg && companyId) {
      void load();
    } else {
      setLoading(false);
    }
  }, [companyId, isLg, load, session]);

  if (!session || !canProvisionHoldingCompanies(session.user)) {
    return <Navigate to="/inicio" replace />;
  }

  if (!isLg) {
    return (
      <div className="grid gap-4">
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
          Este cadastro está disponível apenas na versão web (tela larga).
        </p>
      </div>
    );
  }

  if (!companyId) {
    return <Navigate to="/holding/empresas" replace />;
  }

  async function patchAccess(patch: { mustChangePassword?: boolean; holdingDelegate?: boolean }) {
    if (!company || !canManage) {
      return;
    }
    setError(null);
    if (typeof patch.mustChangePassword === 'boolean') {
      const response = await fetch(
        `/api/holding/companies/${company.id}/access`,
        authRequestInit({
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mustChangePassword: patch.mustChangePassword }),
        }),
      );
      const body = (await response.json()) as { error?: string; mustChangePassword?: boolean };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível atualizar o acesso.');
        return;
      }
      setCompany((c) => (c ? { ...c, mustChangePassword: body.mustChangePassword ?? patch.mustChangePassword! } : c));
    }
    if (typeof patch.holdingDelegate === 'boolean') {
      const response = await fetch(
        `/api/holding/companies/${company.id}/holding-access`,
        authRequestInit({
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ enabled: patch.holdingDelegate }),
        }),
      );
      const body = (await response.json()) as { error?: string; holdingDelegate?: boolean };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível atualizar permissão Holding.');
        return;
      }
      setCompany((c) => (c ? { ...c, holdingDelegate: body.holdingDelegate ?? patch.holdingDelegate! } : c));
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (!company || !canManage) {
      return;
    }
    setPasswordMessage(null);
    setSavingPassword(true);
    try {
      const response = await fetch(
        `/api/holding/companies/${company.id}/password`,
        authRequestInit({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ newPassword: newPassword }),
        }),
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setPasswordMessage(body.error ?? 'Não foi possível alterar a senha.');
        return;
      }
      setNewPassword('');
      setPasswordMessage('Nova senha definida. O login da empresa já pode usar essa senha.');
      setCompany((c) => (c ? { ...c, mustChangePassword: false } : c));
    } finally {
      setSavingPassword(false);
    }
  }

  async function confirmDelete() {
    if (!company) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(
        `/api/holding/companies/${company.id}`,
        authRequestInit({
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            acknowledgeDataLoss: company.hasOperationalData ? deleteAcknowledge : false,
          }),
        }),
      );
      const body = (await response.json()) as { error?: string; requiresDataAcknowledgement?: boolean };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível excluir.');
        if (body.requiresDataAcknowledgement) {
          setDeleteAcknowledge(true);
        }
        return;
      }
      navigate('/holding/empresas', { replace: true });
    } finally {
      /* keep panel open on error */
    }
  }

  const displayName =
    company?.businessName ||
    (company?.profile === HoldingAccountProfile.Administration
      ? 'Codenes — administração'
      : company?.profile === HoldingAccountProfile.Demo
        ? 'Conta demonstração'
        : company?.email);

  return (
    <div className="grid min-w-0 gap-4">
      <Link to="/holding/empresas" className="w-fit text-sm font-semibold text-primary">
        Voltar às empresas
      </Link>

      {loading ? (
        <Card>
          <p className="text-sm text-muted-foreground">Carregando cadastro…</p>
        </Card>
      ) : error && !company ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : company ? (
        <>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">{displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ID {formatRegistrationCodeDisplay(company.registrationCode)} · {company.email}
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Card className="grid min-w-0 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do cadastro</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nome da empresa</dt>
                <dd className="font-medium">{company.businessName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cidade</dt>
                <dd className="font-medium">{company.city || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Documento</dt>
                <dd className="font-medium">{company.document || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Perfil</dt>
                <dd className="font-medium">{holdingAccountProfileLabel(company.profile)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cadastro em</dt>
                <dd className="font-medium">{formatCreatedAt(company.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">2FA</dt>
                <dd className="font-medium">{company.totpEnabled ? 'Ativo' : 'Desativado'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Acesso</dt>
                <dd className="mt-1">
                  {company.mustChangePassword ? (
                    <StatusPill label="Troca de senha pendente" tone="pending" />
                  ) : (
                    <StatusPill label="Ativo" tone="paid" />
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="grid min-w-0 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados no banco</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Parcelamentos</dt>
                <dd className="font-medium tabular-nums">{company.dataMetrics.installmentPlanCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Caixinhas</dt>
                <dd className="font-medium tabular-nums">{company.dataMetrics.cashBoxCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Movimentações</dt>
                <dd className="font-medium tabular-nums">{company.dataMetrics.cashBoxMovementCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Saldo livre</dt>
                <dd className="font-medium tabular-nums">{money(company.dataMetrics.freeBalanceCents)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="grid min-w-0 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Senha de acesso</h2>
            <p className="text-sm text-muted-foreground">
              A senha fica criptografada no servidor e não pode ser exibida. Defina uma nova senha para o login da
              empresa.
            </p>
            {canManage && company.canManagePermissions ? (
              <form className="grid max-w-md gap-3" onSubmit={(event) => void submitPassword(event)}>
                <Field label="Nova senha">
                  <TextInput
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </Field>
                {passwordMessage ? (
                  <p
                    className={
                      passwordMessage.includes('definida') ? 'text-sm text-accent' : 'text-sm text-destructive'
                    }
                  >
                    {passwordMessage}
                  </p>
                ) : null}
                <Button type="submit" disabled={savingPassword || newPassword.length < 6}>
                  {savingPassword ? 'Salvando…' : 'Definir nova senha'}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Não disponível para esta conta.</p>
            )}
          </Card>

          <Card className="grid min-w-0 gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Permissões</h2>
            {canManage && company.canManagePermissions ? (
              <div className="grid gap-3">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 rounded border-border"
                    checked={company.mustChangePassword}
                    onChange={(event) => void patchAccess({ mustChangePassword: event.target.checked })}
                  />
                  <span className="text-sm text-muted-foreground">Exigir troca de senha no próximo login</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 rounded border-border"
                    checked={company.holdingDelegate}
                    onChange={(event) => void patchAccess({ holdingDelegate: event.target.checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Permitir ver o menu Holding (cadastro de empresas) com este e-mail
                  </span>
                </label>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {company.holdingDelegate
                  ? 'Esta conta tem acesso ao menu Holding.'
                  : 'Permissões fixas para administração e demonstração.'}
              </p>
            )}
          </Card>

          {canManage && company.canDelete ? (
            <Card className="grid gap-3 border-destructive/30">
              <h2 className="text-sm font-semibold text-destructive">Zona de perigo</h2>
              <p className="text-sm text-muted-foreground">Remove a conta e todos os dados em cascata.</p>
              <Button type="button" variant="danger" className="w-fit" onClick={() => setDeleteOpen(true)}>
                Excluir empresa
              </Button>
            </Card>
          ) : null}

          <DeleteHoldingCompanyPanel
            open={deleteOpen}
            companyName={displayName ?? company.email}
            hasOperationalData={company.hasOperationalData}
            acknowledging={deleteAcknowledge}
            onAcknowledge={() => setDeleteAcknowledge(true)}
            onClose={() => {
              setDeleteOpen(false);
              setDeleteAcknowledge(false);
            }}
            onConfirm={() => void confirmDelete()}
          />
        </>
      ) : null}
    </div>
  );
}