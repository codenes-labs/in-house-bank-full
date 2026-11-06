import { Link } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { ChangePasswordForm } from '../components/user-account-menu';

export function AccountChangePasswordPage() {
  const { session } = useAuth();
  const isDemo = session?.user.isDemo ?? false;

  return (
    <div className="mx-auto grid max-w-lg gap-4">
      <Link to="/inicio" className="text-sm font-semibold text-primary w-fit">
        Voltar
      </Link>
      <ChangePasswordForm
        heading="Alterar senha"
        description="Use uma senha com pelo menos 6 caracteres."
        demoNotice={
          isDemo ? 'Conta de demonstração: a senha continua fixa; esta tela não altera o login demo.' : undefined
        }
      />
    </div>
  );
}
