import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { TurnstileField } from '../components/turnstile-field';
import { Button, Card, Field, Logo, TextInput } from '../components/ui';

interface AuthSecurityConfig {
  turnstileSiteKey: string | null;
  captchaRequired: boolean;
  passwordRecoverEnabled?: boolean;
}

export function AuthPage({ mode }: { mode: 'sign-in' | 'recover' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [security, setSecurity] = useState<AuthSecurityConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setTotpCode('');
    setNeedsTotp(false);
    setTurnstileToken(null);
    setError(null);
    setMessage(null);
  }, [mode]);

  useEffect(() => {
    void fetch('/api/auth/security')
      .then(async (response) => (response.ok ? ((await response.json()) as AuthSecurityConfig) : null))
      .then((body) => {
        if (body) {
          setSecurity(body);
        }
      })
      .catch(() => undefined);
  }, []);

  const captchaRequired = Boolean(security?.captchaRequired && security.turnstileSiteKey);
  const recoverEnabled = security?.passwordRecoverEnabled !== false;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const trimmed = email.trim();
    const login = trimmed.toLowerCase() === 'teste' ? 'teste' : trimmed;
    if (!login.includes('@') && login !== 'teste') {
      setError('Informe um e-mail válido ou teste (conta demo, sem @).');
      return;
    }
    if (mode === 'sign-in' && password.length < 5) {
      setError('Informe a senha.');
      return;
    }
    if (mode === 'recover' && password.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (captchaRequired && !turnstileToken) {
      setError('Confirme o captcha antes de continuar.');
      return;
    }
    const totpPayload = needsTotp && mode === 'sign-in' ? totpCode : undefined;
    const result =
      mode === 'sign-in'
        ? await auth.signIn(login, password, { totpCode: totpPayload, turnstileToken })
        : await auth.recoverPassword(login, password, { turnstileToken });
    if (result) {
      if (mode === 'sign-in' && result.includes('autenticador')) {
        setNeedsTotp(true);
      }
      setError(result);
      return;
    }
    if (mode === 'recover') {
      setMessage('Senha atualizada. Entre com a nova senha.');
      return;
    }
    navigate('/inicio');
  }

  const title = mode === 'sign-in' ? 'Entrar' : 'Recuperar senha';

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md overflow-y-auto overscroll-y-contain px-4 py-6 sm:py-10">
      <Card className="my-4 grid w-full gap-4 sm:my-auto">
        <Logo />
        <h1 className="text-2xl font-semibold">{title}</h1>
        {mode === 'recover' && security && !recoverEnabled ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
            Recuperação por e-mail está desativada neste ambiente. Use sua senha ou fale com o administrador.
          </p>
        ) : null}
        {!auth.configured ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
            A API não está configurada (DATABASE_URL e JWT_SECRET no servidor). O carnê aberto continua disponível na página inicial.
          </p>
        ) : null}
        <form
          id="auth-form"
          className="grid gap-3"
          autoComplete="on"
          onSubmit={(event) => void submit(event)}
        >
          <Field label="E-mail">
            <TextInput
              id="auth-email"
              name="email"
              form="auth-form"
              type={mode === 'sign-in' ? 'text' : 'email'}
              autoComplete="username"
              inputMode={mode === 'sign-in' ? 'email' : undefined}
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label={mode === 'recover' ? 'Nova senha' : 'Senha'}>
            <TextInput
              id="auth-password"
              name="password"
              form="auth-form"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {needsTotp && mode === 'sign-in' ? (
            <Field label="Código do autenticador (6 dígitos)">
              <TextInput
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value)}
                maxLength={6}
              />
            </Field>
          ) : null}
          {captchaRequired && security?.turnstileSiteKey ? (
            <TurnstileField siteKey={security.turnstileSiteKey} onToken={setTurnstileToken} onExpired={() => setTurnstileToken(null)} />
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
          <Button type="submit">{title}</Button>
        </form>
        <div className="grid gap-1 text-sm">
          {mode !== 'sign-in' ? <Link to="/entrar">Voltar ao login</Link> : null}
          {mode !== 'recover' && recoverEnabled ? <Link to="/recuperar-senha">Esqueci a senha</Link> : null}
          <Link to="/">Voltar</Link>
        </div>
      </Card>
    </div>
  );
}
