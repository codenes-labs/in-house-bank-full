import { Navigate } from 'react-router-dom';

/** Atalho legado após reorganização das ferramentas públicas. */
export function GeradorCarnePage() {
  return <Navigate to="/ferramentas/gerar-carne" replace />;
}