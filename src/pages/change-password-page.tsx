import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Button, Card, Field, Logo, TextInput } from '../components/ui';

export function ChangePasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    const result = await auth.updatePassword(password);
    if (result) {
      setError(result);
      return;
    }
    navigate('/inicio');
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-8">
      <Card className="grid w-full gap-4">
        <Logo />
        <h1 className="text-2xl font-semibold">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Defina uma senha forte antes de usar o app.</p>
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          <Field label="Nova senha">
            <TextInput type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Confirmar senha">
            <TextInput type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit">Salvar senha</Button>
        </form>
      </Card>
    </div>
  );
}
