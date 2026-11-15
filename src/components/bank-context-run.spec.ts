import { describe, expect, it, vi, afterEach } from 'vitest';
import { createEmptySettings } from '../domain/models/settings';
import { createEmptySnapshot } from '../repositories/bank-repository';
import { createHttpBankRepository } from '../repositories/http-bank-repository';
import { runBankMutation } from './bank-context-run';

describe('runBankMutation (regressão tema / settings)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('conta real: após saveSettings o load via GET /api/bank reflete o tema', async () => {
    const calls: string[] = [];
    const empty = createEmptySnapshot();
    const updated = {
      ...empty,
      settings: { ...createEmptySettings(), theme: 'dark' as const, businessName: 'Teste' },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push(`${init?.method ?? 'GET'} ${url}`);
        if (url.endsWith('/api/bank/settings') && init?.method === 'PUT') {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (url.endsWith('/api/bank')) {
          return new Response(JSON.stringify(updated), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'não encontrado' }), { status: 404 });
      }),
    );

    const http = createHttpBankRepository();
    const next = await runBankMutation(empty, false, http, (repo) =>
      repo.saveSettings({ ...createEmptySettings(), theme: 'dark', businessName: 'Teste' }),
    );

    expect(calls).toEqual(['PUT /api/bank/settings', 'GET /api/bank']);
    expect(next.settings.theme).toBe('dark');
    expect(next.settings.businessName).toBe('Teste');
  });

  it('conta demo: saveSettings recarrega da memória sem HTTP', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const empty = createEmptySnapshot();
    const next = await runBankMutation(empty, true, createHttpBankRepository(), (repo) =>
      repo.saveSettings({ ...createEmptySettings(), theme: 'dark' }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(next.settings.theme).toBe('dark');
  });

  it('falha se GET /api/bank retorna 500 após PUT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/bank/settings') && init?.method === 'PUT') {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        if (url.endsWith('/api/bank')) {
          return new Response(JSON.stringify({ error: 'Falha interna' }), { status: 500 });
        }
        return new Response(null, { status: 404 });
      }),
    );

    const http = createHttpBankRepository();
    await expect(
      runBankMutation(createEmptySnapshot(), false, http, (repo) =>
        repo.saveSettings({ ...createEmptySettings(), theme: 'dark' }),
      ),
    ).rejects.toThrow('Falha interna');
  });
});