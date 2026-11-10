import { Link, Outlet } from 'react-router-dom';

export function RelatoriosLayout() {
  return (
    <div className="grid gap-4">
      <Link to="/relatorios" className="w-fit text-sm font-semibold text-primary lg:hidden">
        Voltar aos relatórios
      </Link>
      <Outlet />
    </div>
  );
}
