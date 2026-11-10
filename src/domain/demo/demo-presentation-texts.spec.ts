import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import {
  DEMO_PRESENTATION_WHATSAPP_MESSAGE,
  demoPresentationCarneTexts,
  settingsNeedDemoPresentationTexts,
} from './demo-presentation-texts';

describe('demoPresentationCarneTexts', () => {
  it('includes WhatsApp message with all tags for demo', () => {
    const texts = demoPresentationCarneTexts();
    expect(texts.whatsappMessageTemplate).toBe(DEMO_PRESENTATION_WHATSAPP_MESSAGE);
    expect(texts.whatsappMessageTemplate).toContain('{pagador}');
    expect(texts.whatsappMessageTemplate).toContain('Demonstração');
  });

  it('detects when settings differ from presentation copy', () => {
    expect(settingsNeedDemoPresentationTexts(createEmptySettings())).toBe(true);
    expect(settingsNeedDemoPresentationTexts({ ...createEmptySettings(), ...demoPresentationCarneTexts() })).toBe(
      false,
    );
  });
});
