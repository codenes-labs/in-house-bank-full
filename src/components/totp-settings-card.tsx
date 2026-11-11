import { useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { authRequestInit } from '../lib/auth-token';
import { Button, Card, Field, TextInput } from './ui';

interface TotpStatus {
  enabled: boolean;
  loading: boolean;
}

export function TotpSettingsCard({
  status,
  onStatusChange,
}: {
  status: TotpStatus;
  onStatusChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupUri, setSetupUri] = useState<string | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  async function beginSetup() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/totp/begin', authRequestInit({ method: 'POST' }));
      const body = (await response.json()) as { error?: string; secret?: string; otpauthUrl?: string };
      if (!response.ok || !body.secret || !body.otpauthUrl) {
        setError(body.error ?? 'Não foi possível iniciar o 2FA.');
        return;
      }
      setSetupSecret(body.secret);
      setSetupUri(body.otpauthUrl);
      setMessage('Adicione a chave no app autenticador (Google Authenticator, Aegis, etc.) e confirme com um código.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/totp/enable', authRequestInit({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: enableCode }),
      }));
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível ativar.');
        return;
      }
      setSetupSecret(null);
      setSetupUri(null);
      setEnableCode('');
      setMessage('Verificação em duas etapas ativada.');
      onStatusChange();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/totp/disable', authRequestInit({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      }));
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível desativar.');
        return;
      }
      setDisablePassword('');
      setDisableCode('');
      setMessage('Verificação em duas etapas desativada.');
      onStatusChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="grid gap-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Verificação em duas etapas (2FA)</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {status.enabled
          ? 'Ativa. No login será pedido o código de 6 dígitos do autenticador.'
          : 'Desativada. Recomendado para contas com dados financeiros sensíveis.'}
      </p>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {status.loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
      {!status.enabled && !setupSecret ? (
        <Button type="button" disabled={busy || status.loading} onClick={() => void beginSetup()}>
          Configurar autenticador
        </Button>
      ) : null}
      {setupSecret && setupUri ? (
        <form className="grid gap-2" onSubmit={(event) => void confirmEnable(event)}>
          <p className="text-sm font-medium">Chave manual (base32)</p>
          <code className="break-all rounded-lg bg-muted px-3 py-2 text-xs">{setupSecret}</code>
          <a href={setupUri} className="text-sm font-semibold text-primary">
            Abrir link otpauth no celular
          </a>
          <Field label="Código de 6 dígitos">
            <TextInput
              inputMode="numeric"
              autoComplete="one-time-code"
              value={enableCode}
              onChange={(event) => setEnableCode(event.target.value)}
              maxLength={6}
            />
          </Field>
          <Button type="submit" disabled={busy}>
            Ativar 2FA
          </Button>
        </form>
      ) : null}
      {status.enabled ? (
        <form className="grid gap-2 border-t border-border pt-3" onSubmit={(event) => void confirmDisable(event)}>
          <Field label="Senha atual">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={disablePassword}
              onChange={(event) => setDisablePassword(event.target.value)}
            />
          </Field>
          <Field label="Código do autenticador">
            <TextInput
              inputMode="numeric"
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              maxLength={6}
            />
          </Field>
          <Button type="submit" variant="danger" disabled={busy}>
            Desativar 2FA
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
