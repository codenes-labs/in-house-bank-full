export type PublicToolId = 'organizador' | 'gerar-carne';

export type PublicToolLink = {
  id: PublicToolId;
  to: string;
  label: string;
  /** Ferramenta publicada no rodapé e nas rotas. */
  active: boolean;
};

/** Ferramentas públicas no rodapé (visitante, sem gravar na conta). */
export const PUBLIC_TOOL_LINKS: readonly PublicToolLink[] = [
  {
    id: 'organizador',
    to: '/ferramentas/organizador',
    label: 'Assistente financeiro',
    active: true,
  },
  {
    id: 'gerar-carne',
    to: '/ferramentas/gerar-carne',
    label: 'Gerador de parcelas',
    active: true,
  },
] as const;

export function activePublicToolLinks(): readonly PublicToolLink[] {
  return PUBLIC_TOOL_LINKS.filter((item) => item.active);
}