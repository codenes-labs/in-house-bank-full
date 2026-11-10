import { Link, Outlet } from 'react-router-dom';

export function SettingsLayout() {
  return (
    <div className="grid gap-4">
      <Link to="/configuracoes" className="w-fit text-sm font-semibold text-primary lg:hidden">
        Voltar às configurações
      </Link>
      <Outlet />
    </div>
  );
}
