import { DocsList, DocsSection } from './docs-prose';

export function DocsDatabasePage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="Neon Postgres">
        <p>
          Banco gerenciado no Neon. A URL fica só no servidor (variável <code className="text-foreground">DATABASE_URL</code>).
          Na primeira requisição, o handler aplica <code className="text-foreground">schemaStatements</code> (tabelas, índices, RLS).
        </p>
      </DocsSection>
      <DocsSection title="Tabelas principais">
        <DocsList
          items={[
            'users — credenciais e tipo de conta',
            'settings — negócio, Pix padrão, CDI, metas, saldo livre',
            'installment_plans / installments — parcelamentos',
            'cash_boxes / cash_box_movements — caixinhas',
            'free_balance_withdrawals — saídas auditáveis do saldo livre',
          ]}
        />
      </DocsSection>
      <DocsSection title="Isolamento (RLS)">
        <p>
          Cada tabela de dados tem <code className="text-foreground">user_id</code> referenciando{' '}
          <code className="text-foreground">users</code>. Políticas exigem{' '}
          <code className="text-foreground">user_id = current_setting(&apos;app.user_id&apos;)</code>, definido pelo servidor em
          cada transação. Testes em <code className="text-foreground">src/server/schema.spec.ts</code>.
        </p>
      </DocsSection>
      <DocsSection title="Backup">
        <p>
          Exportação JSON versão 1 pelo app (Configurações). Import substitui apenas os dados do usuário autenticado.
          Detalhes em <code className="text-foreground">docs/banco.md</code>.
        </p>
      </DocsSection>
    </div>
  );
}
