import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { useAuth } from './components/auth-context';
import { AuthPage } from './pages/auth-page';
import { FinancialPage } from './pages/financial-page';
import { HomePage } from './pages/home-page';
import { InstallmentsPage } from './pages/installments-page';
import { LandingPage } from './pages/landing-page';
import { PlanDetailPage } from './pages/plan-detail-page';
import { ReportsPage } from './pages/reports-page';
import { SettingsPage } from './pages/settings-page';

function PrivateRoutes() {
  const { session, loading, configured } = useAuth();
  if (loading) {
    return <p className="p-6">Carregando…</p>;
  }
  if (!session || !configured) {
    return <Navigate to="/entrar" replace />;
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/entrar" element={<AuthPage mode="sign-in" />} />
      <Route path="/cadastro" element={<AuthPage mode="sign-up" />} />
      <Route path="/recuperar-senha" element={<AuthPage mode="recover" />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/parcelamentos" element={<InstallmentsPage />} />
        <Route path="/parcelamentos/:planId" element={<PlanDetailPage />} />
        <Route path="/financeiro" element={<FinancialPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
