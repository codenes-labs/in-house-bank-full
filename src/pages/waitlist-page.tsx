import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TurnstileField, type TurnstileFieldHandle } from '../components/turnstile-field';
import { loadTurnstileScript } from '../components/turnstile-script';
import { PublicSiteChrome } from '../components/public-site-chrome';
import { Button, Card, Field, SelectInput, SoftTextArea, TextInput } from '../components/ui';
import { WAITLIST_INTEREST_OPTIONS } from '../domain/waitlist/waitlist-interests';
import { WAITLIST_MESSAGE_MAX_LENGTH } from '../domain/waitlist/validate-waitlist-signup';

interface AuthSecurityConfig {
  turnstileSiteKey: string | null;
  captchaRequired: boolean;
}

export function WaitlistPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [security, setSecurity] = useState<AuthSecurityConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileFieldHandle>(null);

  useEffect(() => {
    void loadTurnstileScript().catch(() => undefined);
    void fetch('/api/auth/security')
      .then(async (response) => (response.ok ? ((await response.json()) as AuthSecurityConfig) : null))
      .then((body) => {
        if (body) {
          setSecurity(body);
        }
      })
      .catch(() => undefined);
  }, []);

  const captchaRequired = Boolean(security?.captchaRequired && security.turnstileSiteKey);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          interest,
          message: message.trim() || undefined,
          consentGiven: consent,
          source: 'lista-espera',
          turnstileToken,
        }),
      });
      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(body.error ?? 'Não foi possível enviar. Tente de novo.');
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        return;
      }
      setSuccess(body.message ?? 'Recebemos seu interesse. Entraremos em contato por e-mail.');
      setName('');
      setEmail('');
      setInterest('');
      setMessage('');
      setConsent(false);
    } catch {
      setError('Falha de conexão. Verifique a internet e tente de novo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicSiteChrome section="marketing">
      <section className="mx-auto max-w-xl min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Acesso antecipado</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground">Lista de espera</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          O cadastro público ainda está fechado. Deixe seus dados para receber novidades e convite quando abrirmos novas
          vagas.
        </p>

        <Card className="mt-8">
          <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
            <Field label="Nome">
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                maxLength={120}
              />
            </Field>
            <Field label="E-mail">
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                required
              />
            </Field>
            <Field label="O que você mais busca?">
              <SelectInput value={interest} onChange={(event) => setInterest(event.target.value)} required>
                <option value="">Selecione…</option>
                {WAITLIST_INTEREST_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Mensagem (opcional)">
              <SoftTextArea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={WAITLIST_MESSAGE_MAX_LENGTH}
                rows={4}
                placeholder="Conte em poucas palavras sua maior dificuldade hoje."
              />
            </Field>
            <label className="flex min-w-0 items-start gap-3 text-sm leading-snug">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 rounded border-border"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              <span>
                Autorizo o In House Bank a usar meu e-mail para contato sobre o produto e novidades, conforme a{' '}
                <Link to="/privacidade" className="font-semibold text-primary hover:underline">
                  Política de privacidade
                </Link>
                .
              </span>
            </label>
            {captchaRequired && security?.turnstileSiteKey ? (
              <TurnstileField
                ref={turnstileRef}
                siteKey={security.turnstileSiteKey}
                onToken={setTurnstileToken}
                onExpired={() => setTurnstileToken(null)}
              />
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-status-paid">{success}</p> : null}
            <Button type="submit" disabled={submitting || (captchaRequired && !turnstileToken)}>
              {submitting ? 'Enviando…' : 'Entrar na lista'}
            </Button>
          </form>
        </Card>
      </section>
    </PublicSiteChrome>
  );
}