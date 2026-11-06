import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Button, Card, Field, Logo, TextInput } from '../components/ui';

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' | 'recover' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (mode !== 'recover' && password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    const result =
      mode === 'sign-in'
        ? await auth.signIn(email, password)
        : mode === 'sign-up'
          ? await auth.signUp(email, password)
          : password
            ? await auth.updatePassword(password)
            : await auth.sendRecovery(email);
    if (result) {
      setError(result);
      return;
    }
    if (mode === 'recover' && !password) {
      setMessage('Enviamos o link de recuperação, se o e-mail existir.');
      return;
    }
    navigate('/inicio');
  }

  const title = mode === 'sign-in' ? 'Entrar' : mode === 'sign-up' ? 'Criar conta' : 'Recuperar senha';

  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-8">
      <Card className="grid w-full gap-4">
        <Logo />
        <h1 className="text-2xl font-semibold">{title}</h1>
        {!auth.configured ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
            O banco Neon não está acessível. O carnê aberto continua disponível na página inicial.
          </p>
        ) : null}
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          <Field label="E-mail">
            <TextInput type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          {mode !== 'recover' || password || message ? (
            <Field label={mode === 'recover' ? 'Nova senha' : 'Senha'}>
              <TextInput type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
          <Button type="submit">{title}</Button>
        </form>
        <div className="grid gap-1 text-sm">
          {mode !== 'sign-in' ? <Link to="/entrar">Já tenho conta</Link> : <Link to="/cadastro">Criar conta</Link>}
          {mode !== 'recover' ? <Link to="/recuperar-senha">Esqueci a senha</Link> : null}
          <Link to="/">Voltar ao carnê aberto</Link>
        </div>
      </Card>
    </div>
  );
}
