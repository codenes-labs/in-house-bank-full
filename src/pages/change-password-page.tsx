import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { Card, Logo } from '../components/ui';
import { ChangePasswordForm } from '../components/user-account-menu';

export function ChangePasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4 py-8">
      <Card className="grid w-full gap-4">
        <Logo />
        <ChangePasswordForm
          heading="Nova senha"
          description="Defina uma senha forte antes de usar o app."
          onSuccessPath="/inicio"
        />
        {!auth.session?.user.mustChangePassword ? (
          <button type="button" className="text-sm font-semibold text-primary" onClick={() => navigate('/inicio')}>
            Voltar
          </button>
        ) : null}
      </Card>
    </div>
  );
}
