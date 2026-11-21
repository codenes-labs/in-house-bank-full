import { PUBLIC_TOOL_PAGE_COPY } from '../domain/navigation/public-tool-page-copy';
import type { PublicToolId } from '../domain/navigation/public-tools-catalog';

export function PublicToolIntro({ toolId }: { toolId: PublicToolId }) {
  const { title, lead } = PUBLIC_TOOL_PAGE_COPY[toolId];

  return (
    <section className="mt-0 min-w-0 text-center sm:text-left">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Ferramentas</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mx-0">{lead}</p>
    </section>
  );
}