import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Button, Card, Field, Logo, TextInput } from '../components/ui';

export function AuthPage({ mode }: { mode: 'sign-in' | 'recover' }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const login = email.trim().toLowerCase() === 'teste' ? 'teste' : email;
    if (!login.includes('@') && login !== 'teste') {
      setError('Informe um e-mail válido ou teste para a conta demo.');
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
    const result =
      mode === 'sign-in'
        ? await auth.signIn(login, password)
        : await auth.recoverPassword(login, password);
    if (result) {
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
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-8">
      <Card className="grid w-full gap-4">
        <Logo />
        <h1 className="text-2xl font-semibold">{title}</h1>
        {!auth.configured ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
            A API não está configurada (DATABASE_URL e JWT_SECRET no servidor). O carnê aberto continua disponível na página inicial.
          </p>
        ) : null}
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          <Field label={mode === 'sign-in' ? 'E-mail ou teste' : 'E-mail'}>
            <TextInput
              type={mode === 'sign-in' ? 'text' : 'email'}
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label={mode === 'recover' ? 'Nova senha' : 'Senha'}>
            <TextInput
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
          <Button type="submit">{title}</Button>
        </form>
        <div className="grid gap-1 text-sm">
          {mode !== 'sign-in' ? <Link to="/entrar">Voltar ao login</Link> : null}
          {mode !== 'recover' ? <Link to="/recuperar-senha">Esqueci a senha</Link> : null}
          <Link to="/">Voltar ao carnê aberto</Link>
        </div>
      </Card>
    </div>
  );
}
