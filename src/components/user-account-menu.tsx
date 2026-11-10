import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from './auth-context';
import { SaveActionButton } from './standard-action-buttons';
import { Field, TextInput, cx } from './ui';

export function UserAccountMenu() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const email = session?.user.email ?? '';

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!session) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cx(
          'press inline-flex size-12 items-center justify-center rounded-lg',
          open ? 'bg-brand-soft text-primary' : 'text-muted-foreground',
        )}
        aria-label="Conta"
        aria-expanded={open}
        aria-haspopup="menu"
        title={email}
        onClick={() => setOpen((current) => !current)}
      >
        <User className="size-5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute top-full right-0 z-30 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]"
          role="menu"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conta</p>
          <p className="mt-1 break-all text-sm font-semibold text-foreground" title={email}>
            {email}
          </p>
          {session.user.isDemo ? (
            <p className="mt-2 text-xs leading-snug text-status-pending">
              Demonstração: senha fixa; alterar senha não tem efeito.
            </p>
          ) : null}
          <div className="mt-3 grid gap-1">
            <Link
              to="/conta/alterar-senha"
              className="press flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Alterar senha
            </Link>
            <button
              type="button"
              className="press flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-semibold text-muted-foreground lg:hidden"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              Sair
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm({
  heading,
  description,
  demoNotice,
  onSuccessPath = '/inicio',
}: {
  heading: string;
  description: string;
  demoNotice?: string;
  onSuccessPath?: string;
}) {
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
    navigate(onSuccessPath);
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {demoNotice ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">{demoNotice}</p> : null}
      <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
        <Field label="Nova senha">
          <TextInput type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Field label="Confirmar senha">
          <TextInput type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <SaveActionButton type="submit" label="Salvar senha" />
      </form>
    </div>
  );
}
