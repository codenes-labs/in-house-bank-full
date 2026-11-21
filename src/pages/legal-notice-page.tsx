import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PublicSiteChrome } from '../components/public-site-chrome';
import { Card } from '../components/ui';
import { PRIVACY_CONTACT_EMAIL, PRIVACY_LAST_UPDATED } from '../domain/legal/public-legal-copy';

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
        <p className="text-sm text-muted-foreground">Última atualização: {PRIVACY_LAST_UPDATED}</p>
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
            Dúvidas sobre estes termos:{' '}
            <a className="font-semibold text-primary hover:underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
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
        <p className="text-sm text-muted-foreground">Última atualização: {PRIVACY_LAST_UPDATED}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Esta política explica quais dados o In House Bank trata e por quê. O app é de{' '}
          <strong className="text-foreground">controle financeiro pessoal</strong>: não movimenta dinheiro, não é banco e
          não é meio de pagamento. Se algo não ficar claro, escreva para o canal indicado no fim do documento.
        </p>

        <LegalSection title="1. Quem somos">
          <p>
            O In House Bank é oferecido na instância operada por Codenes (site e API em{' '}
            <strong className="text-foreground">inhousebank.codenes.com.br</strong>), com banco de dados Neon Postgres e
            hospedagem Cloudflare. Somos os controladores dos dados das contas de usuário e dos cadastros públicos de
            interesse (lista de espera) feitos neste site.
          </p>
        </LegalSection>

        <LegalSection title="2. Quais dados coletamos">
          <ul className="grid list-disc gap-2 pl-5">
            <li>
              <strong className="text-foreground">Conta de usuário:</strong> e-mail, hash de senha, tipo de conta (padrão
              ou demonstração), obrigatoriedade de troca de senha, preferências de menu (holding), autenticação em dois
              fatores (quando ativada).
            </li>
            <li>
              <strong className="text-foreground">Dados que você cadastra:</strong> parcelamentos, parcelas, caixinhas,
              movimentos, saldo livre, configurações (Pix, textos de PDF, metas), backup exportado e importado, logos em
              base64 na conta.
            </li>
            <li>
              <strong className="text-foreground">Lista de espera</strong> (formulário público): nome, e-mail, interesse
              principal, mensagem opcional, data do cadastro e confirmação de consentimento para contato.
            </li>
            <li>
              <strong className="text-foreground">Ferramentas públicas</strong> (organizador e gerador de parcelas na web):
              os cálculos ficam no seu navegador; o gerador de carnê pode guardar rascunho apenas na sessão até você
              fechar a aba, sem gravar na conta sem login.
            </li>
            <li>
              <strong className="text-foreground">Dados técnicos:</strong> endereço IP, método e caminho de requisições da
              API, tempo de resposta e registros de segurança (tentativas de login, rate limit). Não vendemos esses
              registros.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Para que usamos esses dados">
          <ul className="grid list-disc gap-1 pl-5">
            <li>Autenticar, manter a sessão e isolar os dados de cada conta.</li>
            <li>Calcular indicadores, gerar PDFs e relatórios a partir do que você informou.</li>
            <li>Responder cadastros na lista de espera e avisar sobre abertura de vagas ou novidades do produto.</li>
            <li>Proteger o serviço contra abuso (captcha, limites de taxa, auditoria básica).</li>
          </ul>
          <p className="mt-2">Não usamos seus parcelamentos para publicidade nem vendemos bases de dados a terceiros.</p>
        </LegalSection>

        <LegalSection title="4. Com quem compartilhamos">
          <ul className="grid list-disc gap-1 pl-5">
            <li>
              <strong className="text-foreground">Neon</strong> — hospedagem do banco Postgres na nuvem (dados da conta e
              lista de espera).
            </li>
            <li>
              <strong className="text-foreground">Cloudflare</strong> — entrega do site, Worker da API e proteções de
              borda.
            </li>
            <li>
              <strong className="text-foreground">Cloudflare Turnstile</strong> (quando configurado) — validação de
              captcha em login, cadastro, recuperação de senha e lista de espera.
            </li>
          </ul>
          <p className="mt-2">
            Cada fornecedor recebe apenas o necessário ao serviço contratado. Podemos divulgar dados se exigidos por lei
            ou ordem válida de autoridade.
          </p>
        </LegalSection>

        <LegalSection title="5. Base legal (LGPD)">
          <ul className="grid list-disc gap-1 pl-5">
            <li>
              <strong className="text-foreground">Execução de contrato / uso do serviço:</strong> dados da conta e do que
              você cadastrou para operar o app.
            </li>
            <li>
              <strong className="text-foreground">Consentimento:</strong> lista de espera e contato por e-mail sobre o
              produto.
            </li>
            <li>
              <strong className="text-foreground">Legítimo interesse:</strong> segurança, logs técnicos e prevenção de
              fraude ou abuso, dentro do razoável.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Seus direitos">
          <p>Você pode solicitar, quando aplicável:</p>
          <ul className="mt-2 grid list-disc gap-1 pl-5">
            <li>confirmação e acesso aos dados;</li>
            <li>correção de dados incompletos ou desatualizados (muitos campos você mesmo altera no app);</li>
            <li>portabilidade — use o backup JSON em Configurações;</li>
            <li>eliminação ou encerramento da conta, conforme disponibilidade do operador;</li>
            <li>revogação de consentimento da lista de espera (entraremos em contato para confirmar a exclusão).</li>
          </ul>
          <p className="mt-2">
            Envie pedidos para{' '}
            <a className="font-semibold text-primary hover:underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            . Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </LegalSection>

        <LegalSection title="7. Por quanto tempo guardamos">
          <ul className="grid list-disc gap-1 pl-5">
            <li>Dados da conta: enquanto a conta estiver ativa ou enquanto precisarmos para cumprir obrigação legal.</li>
            <li>Lista de espera: até o convite, descadastro ou pedido de exclusão, o que ocorrer primeiro.</li>
            <li>
              Logs técnicos de API: pelo tempo necessário para segurança e diagnóstico, respeitando obrigações legais
              aplicáveis.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="8. Segurança">
          <p>
            Dados ficam isolados por conta no banco (Row Level Security por{' '}
            <code className="text-foreground">user_id</code>). Senhas são armazenadas com hash; a API exige HTTPS. Segredos
            de banco e JWT não ficam no navegador. Nenhum sistema é infalível: faça backup em Configurações e mantenha sua
            senha em sigilo. Detalhes técnicos em{' '}
            <Link to="/docs" className="font-semibold text-primary hover:underline">
              Documentação
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection title="9. Cookies e armazenamento local">
          <p>
            Exibimos um banner na primeira visita com <strong className="text-foreground">Aceitar</strong> ou{' '}
            <strong className="text-foreground">Recusar</strong>. Usamos apenas armazenamento essencial: tema, preferências
            do site público, consentimento do banner, visibilidade de valores no painel e token de sessão.{' '}
            <strong className="text-foreground">Não</strong> usamos cookies de publicidade ou analytics de terceiros nesta
            versão.
          </p>
          <p className="mt-2">
            Você pode rever a escolha a qualquer momento em{' '}
            <strong className="text-foreground">Preferências de cookies</strong> no rodapé do site.
          </p>
        </LegalSection>

        <LegalSection title="10. Encarregado de dados">
          <p>
            Por enquanto não há encarregado (DPO) formalmente nomeado. Pedidos sobre privacidade e LGPD são tratados pelo
            mesmo canal de contato abaixo. Se isso mudar, atualizaremos esta seção.
          </p>
        </LegalSection>

        <LegalSection title="11. Alterações">
          <p>
            Podemos atualizar esta política conforme o produto evolui. A data no topo indica a versão vigente. Mudanças
            relevantes podem ser comunicadas pelo site ou por e-mail aos usuários cadastrados, quando couber.
          </p>
        </LegalSection>

        <LegalSection title="12. Fale conosco">
          <p>
            Privacidade, lista de espera e direitos LGPD:{' '}
            <a className="font-semibold text-primary hover:underline" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>

        <p className="text-sm">
          <Link to="/termos" className="font-semibold text-primary">
            Termos de uso
          </Link>
          {' · '}
          <Link to="/docs" className="font-semibold text-primary">
            Documentação técnica
          </Link>
        </p>
      </article>
    </PublicSiteChrome>
  );
}
