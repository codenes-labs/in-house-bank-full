import { CarneGenerator } from '../../components/carne-generator';
import { PublicSiteChrome } from '../../components/public-site-chrome';
import { PublicToolIntro } from '../../components/public-tool-intro';

export function GerarCarneFerramentaPage() {
  return (
    <PublicSiteChrome section="marketing">
      <PublicToolIntro toolId="gerar-carne" />
      <section className="mt-8 min-w-0 w-full">
        <CarneGenerator
          title="Gerar carnê"
          description="Confira a simulação, gere as parcelas e baixe o PDF. Nada é gravado na sua conta."
        />
      </section>
    </PublicSiteChrome>
  );
}