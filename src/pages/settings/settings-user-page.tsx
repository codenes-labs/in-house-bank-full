import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../../components/auth-context';
import { TotpSettingsCard } from '../../components/totp-settings-card';
import { authRequestInit } from '../../lib/auth-token';
import { Card, Field, TextInput } from '../../components/ui';
import { SettingsPageHeader } from './settings-page-header';

export function SettingsUserPage() {
  const auth = useAuth();
  const email = auth.session?.user.email ?? '';
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(true);

  function loadTotpStatus() {
    setTotpLoading(true);
    void fetch('/api/auth/totp/status', authRequestInit())
      .then(async (response) => {
        if (!response.ok) {
          return { enabled: false };
        }
        return (await response.json()) as { enabled?: boolean };
      })
      .then((body) => setTotpEnabled(Boolean(body.enabled)))
      .finally(() => setTotpLoading(false));
  }

  useEffect(() => {
    loadTotpStatus();
  }, []);

  return (
    <div className="grid gap-4">
      <SettingsPageHeader title="Usuário" description="Login e senha de acesso ao app." />
      <TotpSettingsCard status={{ enabled: totpEnabled, loading: totpLoading }} onStatusChange={loadTotpStatus} />
      <Card className="grid gap-4">
        <Field label="E-mail de login">
          <TextInput readOnly value={email} aria-readonly />
        </Field>
        <Link
          to="/conta/alterar-senha"
          className="press inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-soft px-4 text-sm font-semibold text-secondary-foreground w-fit"
        >
          <KeyRound className="size-4 shrink-0" aria-hidden />
          Alterar senha
        </Link>
      </Card>
    </div>
  );
}
