import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Settings, User, type LucideIcon } from 'lucide-react';
import { useAuth } from './auth-context';
import { useBank } from './bank-context';
import { SaveActionButton } from './standard-action-buttons';
import { Field, TextInput, cx } from './ui';

export function UserAccountMenu() {
  const { session, signOut } = useAuth();
  const bank = useBank();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const email = session?.user.email ?? '';
  const businessName = bank.snapshot.settings.businessName.trim();

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
          className="absolute top-full right-0 z-30 mt-1 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)]"
          role="menu"
        >
          <div className="px-3 pt-2 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conta</p>
            <p className="mt-2 break-all text-sm font-semibold leading-snug text-foreground" title={email}>
              {email}
            </p>
            {businessName ? (
              <p className="mt-1 text-sm text-muted-foreground" title={businessName}>
                {businessName}
              </p>
            ) : null}
            {session.user.isDemo ? (
              <p className="mt-2 text-xs leading-snug text-status-pending">
                Demonstração: senha fixa; alterar senha não tem efeito.
              </p>
            ) : null}
          </div>
          <div className="grid gap-0.5 border-t border-border pt-2">
            <AccountMenuLink to="/conta/alterar-senha" icon={KeyRound} onNavigate={() => setOpen(false)}>
              Alterar senha
            </AccountMenuLink>
            <AccountMenuLink
              to="/configuracoes"
              icon={Settings}
              className="lg:hidden"
              onNavigate={() => setOpen(false)}
            >
              Configurações
            </AccountMenuLink>
            <AccountMenuButton
              icon={LogOut}
              className="text-muted-foreground lg:hidden"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
            >
              Sair
            </AccountMenuButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const menuItemClass =
  'press flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-foreground hover:bg-muted';

function AccountMenuLink({
  to,
  icon: Icon,
  children,
  className,
  onNavigate,
}: {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  onNavigate: () => void;
}) {
  return (
    <Link to={to} className={cx(menuItemClass, className)} role="menuitem" onClick={onNavigate}>
      <Icon className="size-5 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}

function AccountMenuButton({
  icon: Icon,
  children,
  className,
  onClick,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={cx(menuItemClass, 'w-full text-left', className)} role="menuitem" onClick={onClick}>
      <Icon className="size-5 shrink-0" aria-hidden />
      {children}
    </button>
  );
}

export function ChangePasswordForm({
  heading,
  description,
  demoNotice,
  onSuccessPath = '/inicio',
  requireCurrentPassword = true,
}: {
  heading: string;
  description: string;
  demoNotice?: string;
  onSuccessPath?: string;
  requireCurrentPassword?: boolean;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (requireCurrentPassword && !currentPassword) {
      setError('Informe a senha atual.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    const result = await auth.updatePassword(password, requireCurrentPassword ? currentPassword : undefined);
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
        {requireCurrentPassword ? (
          <Field label="Senha atual">
            <TextInput
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
        ) : null}
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
