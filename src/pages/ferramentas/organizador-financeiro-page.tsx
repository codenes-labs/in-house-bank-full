import { PublicSiteChrome } from '../../components/public-site-chrome';
import { PublicToolIntro } from '../../components/public-tool-intro';
import { SalaryAssistantSimulator } from '../../components/landing/salary-assistant-simulator';

export function OrganizadorFinanceiroPage() {
  return (
    <PublicSiteChrome section="marketing">
      <PublicToolIntro toolId="organizador" />
      <section className="mt-8 min-w-0 w-full">
        <SalaryAssistantSimulator standalone />
      </section>
    </PublicSiteChrome>
  );
}