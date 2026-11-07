import type { ReactNode } from 'react';
import { Card } from '../../components/ui';

export function DocsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="grid gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="grid gap-3 text-muted-foreground">{children}</div>
    </Card>
  );
}

export function DocsList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid list-disc gap-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
