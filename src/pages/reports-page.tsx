import { EmptyState } from '../components/ui';

export function ReportsPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold lg:hidden">Resumo</h1>
      <EmptyState
        title="Resumo em desenvolvimento"
        text="Recebido, lucro por tipo de operação e evolução do patrimônio em texto — conforme SPEC-10."
      />
    </div>
  );
}
