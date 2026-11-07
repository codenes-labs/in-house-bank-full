import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { useAuth } from './components/auth-context';
import { AuthPage } from './pages/auth-page';
import { ChangePasswordPage } from './pages/change-password-page';
import { CashBoxDetailPage } from './pages/cash-box-detail-page';
import { CashBoxesPage } from './pages/cash-boxes-page';
import { ExtratoPage } from './pages/extrato-page';
import { FinancialPage } from './pages/financial-page';
import { FreeBalancePage } from './pages/free-balance-page';
import { HomePage } from './pages/home-page';
import { InstallmentsPage } from './pages/installments-page';
import { LandingPage } from './pages/landing-page';
import { PatrimonioPage } from './pages/patrimonio-page';
import { PlanDetailPage } from './pages/plan-detail-page';
import { NewInstallmentPage } from './pages/new-installment-page';
import { RelatoriosLayout } from './pages/relatorios-layout';
import { ReportsPage } from './pages/reports-page';
import { SettingsPage } from './pages/settings-page';
import { AccountChangePasswordPage } from './pages/account-change-password-page';
import { DocsLayout } from './pages/docs/docs-layout';
import { DocsApiPage } from './pages/docs/docs-api-page';
import { DocsArchitecturePage } from './pages/docs/docs-architecture-page';
import { DocsCicdPage } from './pages/docs/docs-cicd-page';
import { DocsDatabasePage } from './pages/docs/docs-database-page';
import { DocsDeployPage } from './pages/docs/docs-deploy-page';
import { DocsOverviewPage } from './pages/docs/docs-overview-page';
import { DocsPresentationPage } from './pages/docs/docs-presentation-page';
import { DocsChangelogPage } from './pages/docs/docs-changelog-page';
import { DocsStackPage } from './pages/docs/docs-stack-page';
import { PrivacyPage, TermsPage } from './pages/legal-notice-page';

function ChangePasswordGate() {
  const { session, loading, configured } = useAuth();
  if (loading) {
    return <p className="p-6">Carregando…</p>;
  }
  if (!session || !configured) {
    return <Navigate to="/entrar" replace />;
  }
  if (!session.user.mustChangePassword) {
    return <Navigate to="/inicio" replace />;
  }
  return <ChangePasswordPage />;
}

function PrivateRoutes() {
  const { session, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) {
    return <p className="p-6">Carregando…</p>;
  }
  if (!session || !configured) {
    return <Navigate to="/entrar" replace />;
  }
  if (session.user.mustChangePassword) {
    return <Navigate to="/alterar-senha" replace state={{ from: location.pathname }} />;
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
      <Route path="/cadastro" element={<Navigate to="/entrar" replace />} />
      <Route path="/recuperar-senha" element={<AuthPage mode="recover" />} />
      <Route path="/docs" element={<DocsLayout />}>
        <Route index element={<DocsOverviewPage />} />
        <Route path="stack" element={<DocsStackPage />} />
        <Route path="arquitetura" element={<DocsArchitecturePage />} />
        <Route path="banco" element={<DocsDatabasePage />} />
        <Route path="ci-cd" element={<DocsCicdPage />} />
        <Route path="deploy" element={<DocsDeployPage />} />
        <Route path="api" element={<DocsApiPage />} />
        <Route path="apresentacao" element={<DocsPresentationPage />} />
        <Route path="changelog" element={<DocsChangelogPage />} />
      </Route>
      <Route path="/termos" element={<TermsPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="/alterar-senha" element={<ChangePasswordGate />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/patrimonio" element={<PatrimonioPage />} />
        <Route path="/parcelamentos" element={<InstallmentsPage />} />
        <Route path="/parcelamentos/novo" element={<NewInstallmentPage />} />
        <Route path="/parcelamentos/:planId" element={<PlanDetailPage />} />
        <Route path="/caixinhas" element={<CashBoxesPage />} />
        <Route path="/caixinhas/:cashBoxId" element={<CashBoxDetailPage />} />
        <Route path="/financeiro" element={<FinancialPage />} />
        <Route path="/financeiro/saldo-livre" element={<FreeBalancePage />} />
        <Route path="/relatorios" element={<RelatoriosLayout />}>
          <Route index element={<Navigate to="extrato" replace />} />
          <Route path="extrato" element={<ExtratoPage />} />
          <Route path="resumo" element={<ReportsPage />} />
        </Route>
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/conta/alterar-senha" element={<AccountChangePasswordPage />} />
        <Route path="/mais" element={<Navigate to="/patrimonio" replace />} />
        <Route path="/a-receber" element={<Navigate to="/relatorios/extrato?tipo=RECEIVABLES" replace />} />
        <Route path="/a-pagar" element={<Navigate to="/relatorios/extrato?tipo=PAYABLES" replace />} />
        <Route path="/extrato" element={<Navigate to="/relatorios/extrato" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
