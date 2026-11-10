import type { Settings } from '../domain/models/settings';
import { rasterizeSvgToPngDataUrl } from './rasterize-svg-to-png-data-url';

export type ExtratoPdfSettings = Pick<Settings, 'businessName' | 'logoDataUrl'>;

export async function resolveExtratoPdfSettings(settings: Settings): Promise<ExtratoPdfSettings> {
  if (settings.logoDataUrl?.startsWith('data:image/')) {
    return {
      businessName: settings.businessName,
      logoDataUrl: settings.logoDataUrl,
    };
  }
  const logoDataUrl = await rasterizeSvgToPngDataUrl();
  return {
    businessName: settings.businessName,
    logoDataUrl,
  };
}
