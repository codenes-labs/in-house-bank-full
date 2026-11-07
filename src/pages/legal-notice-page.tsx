import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PublicSiteChrome } from '../components/public-site-chrome';
import { Card } from '../components/ui';

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="grid gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-2 text-sm text-muted-foreground">{children}</div>
    </Card>
  );
}

export function TermsPage() {
  return (
    <PublicSiteChrome>
      <article className="mt-8 grid max-w-3xl gap-4">
        <h1 className="text-3xl font-semibold">Termos de uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: documento alinhado ao produto In House Bank.</p>
        <LegalSection title="1. Natureza do serviço">
          <p>
            O In House Bank é software de <strong className="text-foreground">controle financeiro pessoal</strong>. Ele
            organiza registros de empréstimos, parcelas, saldo livre e caixinhas que <strong className="text-foreground">você</strong>{' '}
            informa. O serviço <strong className="text-foreground">não movimenta dinheiro</strong>, não é instituição
            financeira, não é meio de pagamento e não executa transferências, Pix ou cobranças em nome do usuário.
          </p>
        </LegalSection>
        <LegalSection title="2. Conta e acesso">
          <p>
            O cadastro público pode estar fechado; o acesso é por contas criadas pelo operador do ambiente. Você é
            responsável por manter a confidencialidade da senha e por toda atividade na sua conta. Avise o operador se
            suspeitar de uso não autorizado.
          </p>
        </LegalSection>
        <LegalSection title="3. Dados que você lança">
          <p>
            Valores, datas, nomes de pagadores e demais campos são de sua responsabilidade. O app calcula indicadores e
            relatórios a partir desses dados; não substitui conferência em extratos bancários reais nem assessoria
            contábil ou jurídica.
          </p>
        </LegalSection>
        <LegalSection title="4. Uso aceitável">
          <p>
            Não use o serviço para atividades ilegais, para tentar acessar dados de outros usuários ou para sobrecarregar
            a infraestrutura. O operador pode suspender contas que violem estas regras.
          </p>
        </LegalSection>
        <LegalSection title="5. Disponibilidade e alterações">
          <p>
            O serviço é oferecido no estado em que se encontra. Funcionalidades podem mudar conforme evolução do produto
            e das specs em <code className="text-foreground">docs/specs</code>. Backups exportados pelo usuário são a
            principal proteção contra perda acidental de dados.
          </p>
        </LegalSection>
        <LegalSection title="6. Limitação de responsabilidade">
          <p>
            Na extensão permitida pela lei, o operador não responde por lucros cessantes, decisões financeiras tomadas com
            base apenas nos números do app ou por indisponibilidade temporária. O uso continua por sua conta e risco.
          </p>
        </LegalSection>
        <LegalSection title="7. Contato">
          <p>
            Dúvidas sobre estes termos: utilize o canal de contato do operador que disponibilizou sua conta (por exemplo
            o responsável pela instância Codenes / demonstração).
          </p>
        </LegalSection>
        <p className="text-sm">
          <Link to="/docs" className="font-semibold text-primary">
            Documentação técnica
          </Link>
        </p>
      </article>
    </PublicSiteChrome>
  );
}

export function PrivacyPage() {
  return (
    <PublicSiteChrome>
      <article className="mt-8 grid max-w-3xl gap-4">
        <h1 className="text-3xl font-semibold">Política de privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Descreve como o In House Bank trata dados na instância operada com Neon Postgres e JWT.
        </p>
        <LegalSection title="1. Quem somos">
          <p>
            O In House Bank é operado na infraestrutura configurada pelo mantenedor do ambiente (deploy Cloudflare +
            banco Neon). Esta política aplica-se ao uso dessa instância web.
          </p>
        </LegalSection>
        <LegalSection title="2. Dados que coletamos">
          <ul className="grid list-disc gap-1 pl-5">
            <li>Conta: e-mail, hash de senha, flags de conta (demo, troca de senha obrigatória).</li>
            <li>Dados financeiros que você cadastra: parcelamentos, caixinhas, saldo livre, configurações de negócio, backup.</li>
            <li>Técnicos: logs de erro no servidor podem incluir trechos de requisição; o front não envia DATABASE_URL.</li>
          </ul>
        </LegalSection>
        <LegalSection title="3. Finalidade">
          <p>
            Autenticar, persistir seus registros, gerar PDFs e relatórios no navegador e manter isolamento entre contas.
            Não vendemos nem alugamos sua base de parcelamentos a terceiros para marketing.
          </p>
        </LegalSection>
        <LegalSection title="4. Armazenamento e segurança">
          <p>
            Dados ficam no Postgres (Neon), com Row Level Security por <code className="text-foreground">user_id</code>.
            A sessão usa JWT no cliente; segredos de banco e assinatura JWT existem apenas no Worker/servidor de
            desenvolvimento. Conexões usam TLS conforme provedores.
          </p>
        </LegalSection>
        <LegalSection title="5. Retenção e exclusão">
          <p>
            Os dados permanecem enquanto a conta existir. Você pode exportar backup JSON em Configurações. Exclusão
            definitiva de conta deve ser solicitada ao operador da instância, se disponível.
          </p>
        </LegalSection>
        <LegalSection title="6. Cookies e armazenamento local">
          <p>
            Preferências como tema e visibilidade de valores no dashboard podem usar <code className="text-foreground">localStorage</code>.
            O token de sessão fica no mecanismo usado pelo app de autenticação (não compartilhado entre sites).
          </p>
        </LegalSection>
        <LegalSection title="7. Seus direitos">
          <p>
            Você pode acessar e corrigir dados pela própria aplicação. Para portabilidade, use exportação de backup.
            Legislação local (LGPD) pode garantir outros direitos — contate o operador para exercê-los.
          </p>
        </LegalSection>
        <LegalSection title="8. Alterações">
          <p>Esta política pode ser atualizada junto com o produto. A data no topo indica a revisão corrente.</p>
        </LegalSection>
        <p className="text-sm">
          <Link to="/docs" className="font-semibold text-primary">
            Documentação técnica
          </Link>
        </p>
      </article>
    </PublicSiteChrome>
  );
}

/** @deprecated Use TermsPage / PrivacyPage */
export function LegalNoticePage({ kind }: { kind: 'terms' | 'privacy' }) {
  return kind === 'terms' ? <TermsPage /> : <PrivacyPage />;
}
