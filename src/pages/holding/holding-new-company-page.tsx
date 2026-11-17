import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth-context';
import { InputWithInlineActions } from '../../components/input-with-inline-actions';
import {
  CancelActionButton,
  formActionRowClassName,
  SaveActionButton,
} from '../../components/standard-action-buttons';
import { Card, Field, TextInput } from '../../components/ui';
import { generateProvisionalPassword } from '../../domain/holding/generate-provisional-password';
import { canProvisionHoldingCompanies } from '../../domain/holding/holding-provision';
import { authRequestInit } from '../../lib/auth-token';
import { useMinLg } from '../../lib/use-min-lg';

export function HoldingNewCompanyPage() {
  const { session } = useAuth();
  const isLg = useMinLg();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !canProvisionHoldingCompanies(session.user)) {
    return <Navigate to="/inicio" replace />;
  }

  if (!isLg) {
    return (
      <div className="grid gap-4">
        <h1 className="text-3xl font-semibold">Nova empresa</h1>
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
          Este cadastro está disponível apenas na versão web (tela larga). Use um computador ou tablet em modo
          paisagem.
        </p>
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmedName = companyName.trim();
    const trimmed = email.trim();
    if (trimmedName.length < 2) {
      setError('Informe o nome da empresa (mínimo 2 caracteres).');
      return;
    }
    if (!trimmed.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        '/api/holding/companies',
        authRequestInit({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            companyName: trimmedName,
            email: trimmed,
            password,
            city: city.trim(),
          }),
        }),
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível cadastrar a empresa.');
        return;
      }
      navigate('/holding/empresas', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      <Link to="/holding/empresas" className="w-fit text-sm font-semibold text-primary">
        Voltar às empresas
      </Link>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold sm:text-3xl">Nova empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O ID cadastro é gerado automaticamente. O nome da empresa vira o beneficiário padrão nos carnês e
          relatórios.
        </p>
      </div>
      <Card className="grid min-w-0 max-w-2xl gap-4">
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          <Field label="Nome da empresa">
            <TextInput
              value={companyName}
              autoComplete="organization"
              placeholder="Razão social ou nome fantasia"
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </Field>
          <Field label="Cidade">
            <TextInput
              value={city}
              autoComplete="address-level2"
              placeholder="Cidade usada nos PDFs e cadastros"
              onChange={(event) => setCity(event.target.value)}
            />
          </Field>
          <Field label="E-mail de acesso">
            <TextInput
              type="email"
              autoComplete="off"
              inputMode="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Senha inicial">
            <InputWithInlineActions
              type="text"
              autoComplete="new-password"
              value={password}
              showSubmit={false}
              onChange={setPassword}
              onGenerate={() => setPassword(generateProvisionalPassword())}
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <p className="text-xs text-muted-foreground">O login da empresa usará o e-mail e a senha informados.</p>
          <div className={`${formActionRowClassName} sm:justify-start`}>
            <CancelActionButton
              type="button"
              className="flex-1 sm:flex-none"
              disabled={submitting}
              onClick={() => navigate('/holding/empresas')}
            />
            <SaveActionButton
              type="submit"
              label="Cadastrar empresa"
              busyLabel="Cadastrando…"
              busy={submitting}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            />
          </div>
        </form>
      </Card>
    </div>
  );
}