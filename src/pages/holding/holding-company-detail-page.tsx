import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../components/auth-context';
import { DeleteHoldingCompanyPanel } from '../../components/delete-holding-company-panel';
import { HoldingCompanyPermissionsPanel } from '../../components/holding-company-permissions-panel';
import { InputWithInlineActions } from '../../components/input-with-inline-actions';
import {
  CancelActionButton,
  CloseActionButton,
  DeleteActionButton,
  EditActionButton,
  ManagePermissionsActionButton,
  SaveActionButton,
  ViewPasswordActionButton,
} from '../../components/standard-action-buttons';
import { Card, Field, TextInput, StatusPill } from '../../components/ui';
import {
  HoldingAccountProfile,
  holdingAccountProfileLabel,
} from '../../domain/holding/holding-account-profile';
import { type CompanyMenuAccess } from '../../domain/holding/company-menu-access';
import { formatRegistrationCodeDisplay } from '../../domain/holding/company-registration-code';
import { generateProvisionalPassword } from '../../domain/holding/generate-provisional-password';
import { holdingAccountAccessStatus } from '../../domain/holding/holding-account-active';
import { canManageHoldingAccounts, canProvisionHoldingCompanies } from '../../domain/holding/holding-provision';
import { Button } from '../../components/ui';
import {
  formatBrazilianDocumentDisplay,
  maskBrazilianDocumentInput,
  onlyDocumentDigits,
} from '../../domain/document/format-brazilian-document';
import { authRequestInit } from '../../lib/auth-token';
import { useMinLg } from '../../lib/use-min-lg';

type HoldingCompanyDetail = {
  id: string;
  registrationCode: string | null;
  email: string;
  profile: HoldingAccountProfile;
  accountActive: boolean;
  canToggleAccountActive: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  holdingDelegate: boolean;
  menuAccess: CompanyMenuAccess;
  createdAt: string;
  businessName: string;
  city: string;
  document: string | null;
  canEditAccess: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  canEditMenuAccess: boolean;
  hasOperationalData: boolean;
  provisionalAccess: {
    active: boolean;
    reveal: string | null;
    expiresAt: string | null;
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
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ businessName: '', city: '', document: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordGenerate, setPasswordGenerate] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMode, setPasswordMode] = useState<'provisional' | 'main'>('provisional');
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [menuDraft, setMenuDraft] = useState<CompanyMenuAccess | null>(null);
  const [mustChangeDraft, setMustChangeDraft] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [deleteAcknowledge, setDeleteAcknowledge] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

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
      const loaded = body.company ?? null;
      setCompany(loaded);
      if (loaded) {
        setProfileDraft({
          businessName: loaded.businessName,
          city: loaded.city,
          document: formatBrazilianDocumentDisplay(loaded.document),
          email: loaded.email,
        });
        setMenuDraft(loaded.menuAccess);
        setMustChangeDraft(loaded.mustChangePassword);
      }
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

  if (!isLg || !companyId) {
    return !isLg ? (
      <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
        Este cadastro está disponível apenas na versão web (tela larga).
      </p>
    ) : (
      <Navigate to="/holding/empresas" replace />
    );
  }

  const accessStatus =
    company === null
      ? null
      : holdingAccountAccessStatus(company.accountActive !== false, company.mustChangePassword);

  const displayName =
    company?.businessName ||
    (company?.profile === HoldingAccountProfile.Administration
      ? 'Codenes — administração'
      : company?.profile === HoldingAccountProfile.Demo
        ? 'Conta demonstração'
        : company?.email);

  async function saveProfile() {
    if (!company || !canManage || !company.canManagePermissions) {
      return;
    }
    setSavingProfile(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/holding/companies/${company.id}/profile`,
        authRequestInit({
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            businessName: profileDraft.businessName,
            city: profileDraft.city,
            document: onlyDocumentDigits(profileDraft.document) || null,
            email: profileDraft.email,
          }),
        }),
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível salvar.');
        return;
      }
      setEditingProfile(false);
      await load();
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (!company || !canManage) {
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    try {
      const isProvisional = passwordMode === 'provisional';
      const url = isProvisional
        ? `/api/holding/companies/${company.id}/provisional-access`
        : `/api/holding/companies/${company.id}/password`;
      const response = await fetch(
        url,
        authRequestInit({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            newPassword: newPassword,
            generate: passwordGenerate,
          }),
        }),
      );
      const body = (await response.json()) as {
        error?: string;
        generatedPassword?: string;
        provisionalAccess?: HoldingCompanyDetail['provisionalAccess'];
      };
      if (!response.ok) {
        setPasswordError(
          body.error ??
            (isProvisional ? 'Não foi possível gerar o acesso provisório.' : 'Não foi possível redefinir a senha.'),
        );
        return;
      }
      setNewPassword('');
      setPasswordGenerate(false);
      setPasswordEditing(false);
      setPasswordPanelOpen(true);
      setPasswordMode('provisional');
      await load();
    } finally {
      setSavingPassword(false);
    }
  }

  async function revokeProvisionalAccess() {
    if (!company || !canManage) {
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    try {
      const response = await fetch(
        `/api/holding/companies/${company.id}/provisional-access`,
        authRequestInit({ method: 'DELETE' }),
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setPasswordError(body.error ?? 'Não foi possível revogar o acesso provisório.');
        return;
      }
      await load();
    } finally {
      setSavingPassword(false);
    }
  }

  function formatProvisionalExpiry(iso: string | null): string {
    if (!iso) {
      return '—';
    }
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR');
  }

  async function setAccountActive(nextActive: boolean) {
    if (!company || !canManage || !company.canToggleAccountActive) {
      return;
    }
    setTogglingActive(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/holding/companies/${company.id}/active`,
        authRequestInit({
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ active: nextActive }),
        }),
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível atualizar o cadastro.');
        return;
      }
      await load();
    } finally {
      setTogglingActive(false);
    }
  }

  async function savePermissions() {
    if (!company || !menuDraft || !canManage || !company.canEditMenuAccess) {
      return;
    }
    setSavingPermissions(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/holding/companies/${company.id}/menu-access`,
        authRequestInit({
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            routes: menuDraft.routes,
            mustChangePassword: mustChangeDraft,
          }),
        }),
      );
      const body = (await response.json()) as {
        error?: string;
        menuAccess?: CompanyMenuAccess;
        holdingDelegate?: boolean;
        mustChangePassword?: boolean;
      };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível salvar permissões.');
        return;
      }
      setPermissionsOpen(false);
      await load();
    } finally {
      setSavingPermissions(false);
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
      setDeleteOpen(false);
    }
  }

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

          <Card className="grid min-w-0 gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dados do cadastro</h2>
              {canManage && company.canManagePermissions ? (
                editingProfile ? (
                  <div className="flex gap-2">
                    <CancelActionButton className="min-h-10" onClick={() => setEditingProfile(false)} />
                    <SaveActionButton
                      className="min-h-10"
                      busy={savingProfile}
                      onClick={() => void saveProfile()}
                    />
                  </div>
                ) : (
                  <EditActionButton label="Editar dados" className="min-h-10" onClick={() => setEditingProfile(true)} />
                )
              ) : null}
            </div>

            {editingProfile && company.canManagePermissions ? (
              <form
                className="grid gap-3 sm:grid-cols-2 sm:items-start"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveProfile();
                }}
              >
                <Field label="Nome da empresa">
                  <TextInput
                    value={profileDraft.businessName}
                    onChange={(e) => setProfileDraft((d) => ({ ...d, businessName: e.target.value }))}
                  />
                </Field>
                <Field label="Cidade">
                  <TextInput
                    value={profileDraft.city}
                    onChange={(e) => setProfileDraft((d) => ({ ...d, city: e.target.value }))}
                  />
                </Field>
                <Field label="E-mail de acesso">
                  <TextInput
                    type="email"
                    autoComplete="off"
                    readOnly={company.profile !== HoldingAccountProfile.Company}
                    tabIndex={company.profile !== HoldingAccountProfile.Company ? -1 : undefined}
                    className={
                      company.profile !== HoldingAccountProfile.Company ? 'opacity-80' : undefined
                    }
                    value={profileDraft.email}
                    onChange={(e) => setProfileDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </Field>
                <Field label="Documento (CPF/CNPJ)">
                  <TextInput
                    inputMode="numeric"
                    autoComplete="off"
                    value={profileDraft.document}
                    onChange={(e) =>
                      setProfileDraft((d) => ({
                        ...d,
                        document: maskBrazilianDocumentInput(e.target.value),
                      }))
                    }
                  />
                </Field>
                {company.profile !== HoldingAccountProfile.Company ? (
                  <p className="text-xs font-normal text-muted-foreground sm:col-span-2">
                    Conta de sistema: o e-mail de login não pode ser alterado pelo holding. Nome, cidade e documento
                    podem ser editados normalmente.
                  </p>
                ) : null}
              </form>
            ) : (
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
                  <dd className="font-medium">{formatBrazilianDocumentDisplay(company.document) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">E-mail de acesso</dt>
                  <dd className="font-medium">{company.email}</dd>
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
                <div>
                  <dt className="text-muted-foreground">Acesso</dt>
                  <dd className="mt-1">
                    {accessStatus ? (
                      <StatusPill label={accessStatus.label} tone={accessStatus.tone} />
                    ) : null}
                  </dd>
                </div>
              </dl>
            )}
          </Card>

          {canManage && company.canToggleAccountActive ? (
            <Card className="grid gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Situação do cadastro</h2>
              <p className="text-sm text-muted-foreground">
                Conta inativa não consegue entrar. O login exibe orientação para contato com o setor responsável.
              </p>
              {company.accountActive !== false ? (
                <Button
                  type="button"
                  variant="danger"
                  className="w-fit min-h-12"
                  disabled={togglingActive}
                  onClick={() => void setAccountActive(false)}
                >
                  {togglingActive ? 'Salvando…' : 'Inativar cadastro'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="soft"
                  className="w-fit min-h-12"
                  disabled={togglingActive}
                  onClick={() => void setAccountActive(true)}
                >
                  {togglingActive ? 'Salvando…' : 'Ativar cadastro'}
                </Button>
              )}
            </Card>
          ) : null}

          <Card className="grid gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Acesso provisório (suporte)
            </h2>
            <p className="text-sm text-muted-foreground">
              A senha principal do cliente não é exibida. Gere um acesso provisório para testar o login sem alterar a
              senha que ele usa no dia a dia.
            </p>
            {canManage && company.canManagePermissions ? (
              <>
                {!passwordPanelOpen ? (
                  <ViewPasswordActionButton
                    className="w-fit"
                    onClick={() => {
                      setPasswordPanelOpen(true);
                      setPasswordEditing(false);
                      setPasswordError(null);
                      void load();
                    }}
                  />
                ) : (
                  <div className="grid gap-4">
                    {passwordEditing ? (
                      <form className="grid gap-3" onSubmit={(event) => void submitPassword(event)}>
                        <Field
                          label={
                            passwordMode === 'provisional' ? 'Nova senha provisória' : 'Nova senha principal'
                          }
                        >
                          <div className="flex min-w-0 flex-wrap items-stretch gap-2">
                            <InputWithInlineActions
                              className="min-w-[min(100%,16rem)] max-w-md flex-1"
                              type="text"
                              autoComplete="new-password"
                              value={newPassword}
                              submitLabel="Salvar"
                              submitting={savingPassword}
                              submitDisabled={savingPassword || newPassword.length < 6}
                              onChange={(next) => {
                                setPasswordGenerate(false);
                                setNewPassword(next);
                              }}
                              onGenerate={() => {
                                const generated = generateProvisionalPassword();
                                setPasswordGenerate(true);
                                setNewPassword(generated);
                              }}
                            />
                            <CloseActionButton
                              layout="inline"
                              className="min-h-12 shrink-0"
                              onClick={() => {
                                setPasswordEditing(false);
                                setPasswordMode('provisional');
                                setNewPassword('');
                                setPasswordGenerate(false);
                                setPasswordError(null);
                              }}
                            />
                          </div>
                        </Field>
                        {passwordMode === 'main' ? (
                          <p className="text-sm text-destructive">
                            Isso substitui a senha principal do cliente. Use só se ele esqueceu ou pediu redefinição.
                          </p>
                        ) : null}
                        {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
                      </form>
                    ) : (
                      <div className="grid gap-3">
                        <Field label="Senha provisória ativa">
                          <div className="flex min-w-0 flex-wrap items-stretch gap-2">
                            <InputWithInlineActions
                              className="min-w-[min(100%,16rem)] max-w-md flex-1"
                              readOnly
                              tabIndex={-1}
                              value={company.provisionalAccess.reveal ?? ''}
                              placeholder="—"
                              showGenerate={false}
                              showSubmit={false}
                              onChange={() => undefined}
                              onGenerate={() => undefined}
                              trailingAction={{
                                label: 'Gerar provisório',
                                icon: 'key',
                                onClick: () => {
                                  setPasswordMode('provisional');
                                  setPasswordEditing(true);
                                  setPasswordError(null);
                                  setNewPassword('');
                                  setPasswordGenerate(false);
                                },
                              }}
                            />
                            <CloseActionButton
                              layout="inline"
                              className="min-h-12 shrink-0"
                              onClick={() => {
                                setPasswordPanelOpen(false);
                                setPasswordEditing(false);
                                setNewPassword('');
                                setPasswordError(null);
                              }}
                            />
                          </div>
                        </Field>
                        {company.provisionalAccess.active ? (
                          <p className="text-sm text-muted-foreground">
                            Válido até {formatProvisionalExpiry(company.provisionalAccess.expiresAt)}. Entre com o
                            e-mail da conta e esta senha provisória.
                          </p>
                        ) : (
                          <p className="max-w-md text-sm text-muted-foreground">
                            Nenhum acesso provisório ativo. Gere uma senha para testar login ou conferir erro relatado
                            pelo cliente.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {company.provisionalAccess.active ? (
                            <Button
                              type="button"
                              variant="soft"
                              className="min-h-10"
                              disabled={savingPassword}
                              onClick={() => void revokeProvisionalAccess()}
                            >
                              Revogar acesso provisório
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            className="min-h-10 text-destructive"
                            onClick={() => {
                              setPasswordMode('main');
                              setPasswordEditing(true);
                              setPasswordError(null);
                              setNewPassword('');
                              setPasswordGenerate(false);
                            }}
                          >
                            Redefinir senha principal…
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Indisponível para esta conta.</p>
            )}
          </Card>

          <Card className="grid gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Permissões</h2>
            <p className="text-sm text-muted-foreground">
              Controla o menu que a empresa vê ao entrar (Patrimônio, Holding, Relatórios, Ajustes).
            </p>
            {canManage && company.canManagePermissions ? (
              <ManagePermissionsActionButton
                className="w-fit"
                label={company.canEditMenuAccess ? 'Gerenciar permissões' : 'Ver permissões'}
                onClick={() => {
                  setMenuDraft(company.menuAccess);
                  setMustChangeDraft(company.canEditMenuAccess ? company.mustChangePassword : false);
                  setPermissionsOpen(true);
                }}
              />
            ) : null}
          </Card>

          {canManage && company.canDelete ? (
            <Card className="grid gap-3 border-destructive/30">
              <h2 className="text-sm font-semibold text-destructive">Zona de perigo</h2>
              <p className="text-sm text-muted-foreground">Remove a conta e todos os dados em cascata.</p>
              <DeleteActionButton label="Excluir empresa" className="w-fit" onClick={() => setDeleteOpen(true)} />
            </Card>
          ) : null}

          <HoldingCompanyPermissionsPanel
            open={permissionsOpen}
            menuAccess={menuDraft ?? company.menuAccess}
            mustChangePassword={mustChangeDraft}
            saving={savingPermissions}
            readOnly={!company.canEditMenuAccess}
            mustChangePasswordEditable={company.profile === HoldingAccountProfile.Company}
            onClose={() => setPermissionsOpen(false)}
            onChangeMenuAccess={setMenuDraft}
            onChangeMustChangePassword={setMustChangeDraft}
            onSave={() => void savePermissions()}
          />

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