import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../components/auth-context';
import { authRequestInit } from '../../lib/auth-token';
import { isHoldingAdminEmail } from '../../domain/holding/holding-admin';
import { WAITLIST_INTEREST_OPTIONS } from '../../domain/waitlist/waitlist-interests';
import { Card, EmptyState } from '../../components/ui';
import { formatCalendarDateBr } from '../../domain/pdf/format-calendar-date-br';

type WaitlistItem = {
  id: string;
  name: string;
  email: string;
  interest: string;
  message: string | null;
  source: string;
  createdAt: string;
};

function interestLabel(id: string): string {
  return WAITLIST_INTEREST_OPTIONS.find((item) => item.id === id)?.label ?? id;
}

export function HoldingWaitlistPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<WaitlistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = Boolean(session && isHoldingAdminEmail(session.user.email));

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    void fetch('/api/waitlist', authRequestInit())
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? 'Falha ao carregar.');
        }
        return (await response.json()) as { items: WaitlistItem[] };
      })
      .then((body) => setItems(body.items))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao carregar.');
      });
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl px-4 py-6 lg:px-0">
      <h1 className="text-2xl font-semibold text-foreground">Lista de espera</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cadastros públicos aguardando convite. Use o e-mail para contato.
      </p>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {items === null ? (
        <p className="mt-6 text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nenhum cadastro" text="Ainda não há inscrições na lista de espera." />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <time className="text-xs text-muted-foreground" dateTime={item.createdAt}>
                    {formatCalendarDateBr(item.createdAt.slice(0, 10))}
                  </time>
                </div>
                <p className="text-sm">
                  <a className="font-medium text-primary hover:underline" href={`mailto:${item.email}`}>
                    {item.email}
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">{interestLabel(item.interest)}</p>
                {item.message ? <p className="text-sm text-foreground">{item.message}</p> : null}
                <p className="text-xs text-muted-foreground">Origem: {item.source}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}