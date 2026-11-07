import { PRODUCT_CHANGELOG } from '../../domain/docs/product-changelog';
import { Card } from '../../components/ui';

export function DocsChangelogPage() {
  return (
    <div className="grid gap-4">
      <Card className="text-sm text-muted-foreground">
        <p>
          Versões marcam entregas visíveis ao usuário. Detalhe técnico completo fica no repositório em{' '}
          <code className="text-foreground">docs/CHANGELOG.md</code>. Atualize changelog quando mudar
          comportamento, UI ou API documentada.
        </p>
      </Card>
      {PRODUCT_CHANGELOG.map((release) => (
        <Card key={release.version} className="grid gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-xl font-semibold">v{release.version}</h2>
            <time className="text-sm text-muted-foreground" dateTime={release.date}>
              {release.date.split('-').reverse().join('/')}
            </time>
          </div>
          {release.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="mt-1 grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
