import { DocsList, DocsSection } from './docs-prose';

export function DocsArchitecturePage() {
  return (
    <div className="grid gap-4">
      <DocsSection title="Visão geral">
        <p>
          O navegador carrega a SPA de <code className="text-foreground">dist/</code>. Chamadas autenticadas vão para{' '}
          <code className="text-foreground">/api/*</code> no mesmo domínio. O Worker encaminha API ao handler Node-compatível
          e o restante aos assets estáticos.
        </p>
      </DocsSection>
      <DocsSection title="Camadas">
        <DocsList
          items={[
            'domain — regras de negócio, sem I/O',
            'application — orquestrações que combinam domínio',
            'repositories — BankRepository (HTTP ou memória nos testes)',
            'components / pages / pdf — interface',
          ]}
        />
      </DocsSection>
      <DocsSection title="Visitante e logado">
        <DocsList
          items={[
            'Visitante na landing: gerador de carnê e rascunho em sessionStorage',
            'Login: JWT armazenado no cliente; BankRepository HTTP persiste no Neon',
            'Cadastro público fechado; contas seed admin e demo',
          ]}
        />
      </DocsSection>
      <DocsSection title="Repositório">
        <p>
          Contrato único <code className="text-foreground">BankRepository</code>: load, saveSettings, planos, parcelas,
          caixinhas, movimentos, resgate de saldo livre, import de backup. O front nunca recebe DATABASE_URL nem JWT_SECRET.
        </p>
      </DocsSection>
    </div>
  );
}
