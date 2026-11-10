import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../components/auth-context';
import { useBank } from '../../components/bank-context';
import {
  MaskedDueDayInput,
  MaskedInstallmentCountInput,
} from '../../components/masked-inputs';
import { SaveActionButton } from '../../components/standard-action-buttons';
import { IconFileInput } from '../../components/icon-file-input';
import { Card, Field, SelectInput, SoftTextArea } from '../../components/ui';
import { DefaultInterestType } from '../../domain/enums/default-interest-type';
import {
  demoPresentationCarneTexts,
  demoPresentationInstallmentDefaults,
  settingsNeedDemoInstallmentDefaults,
  settingsNeedDemoPresentationTexts,
} from '../../domain/demo/demo-presentation-texts';
import { validateSettings } from '../../domain/settings/validate-settings';
import {
  DEFAULT_WHATSAPP_MESSAGE,
  WHATSAPP_MESSAGE_TAGS,
} from '../../domain/whatsapp/default-whatsapp-message';
import { resizeLogoFile } from '../../pdf/resize-logo';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsInstallmentsPage() {
  const auth = useAuth();
  const bank = useBank();
  const isDemo = auth.session?.user.isDemo ?? false;
  const settings = bank.snapshot.settings;
  const demoTexts = demoPresentationCarneTexts();
  const demoDefaults = demoPresentationInstallmentDefaults();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDemo || !bank.ready) {
      return;
    }
    const needsTexts = settingsNeedDemoPresentationTexts(settings);
    const needsDefaults = settingsNeedDemoInstallmentDefaults(settings);
    const needsLogoCleared = Boolean(settings.logoDataUrl);
    if (!needsTexts && !needsDefaults && !needsLogoCleared) {
      return;
    }
    void bank.saveSettings({
      ...settings,
      ...demoTexts,
      ...demoDefaults,
      logoDataUrl: undefined,
    });
  }, [bank, demoDefaults, demoTexts, isDemo, settings]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      ...settings,
      defaultInstallments: Number(data.get('defaultInstallments')),
      defaultDueDay: data.get('defaultDueDay') ? Number(data.get('defaultDueDay')) : undefined,
      defaultInterestType:
        String(data.get('defaultInterestType')) === DefaultInterestType.Compound
          ? DefaultInterestType.Compound
          : DefaultInterestType.Simple,
      ...(isDemo
        ? { ...demoTexts, ...demoDefaults }
        : {
            paymentInstructions: String(data.get('paymentInstructions') ?? ''),
            responsibilityTerm: String(data.get('responsibilityTerm') ?? ''),
            whatsappMessageTemplate: String(data.get('whatsappMessageTemplate') ?? ''),
            pdfFooterText: String(data.get('paymentInstructions') ?? ''),
          }),
    };
    const validation = validateSettings(next);
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Revise os dados.');
      return;
    }
    await bank.saveSettings(next);
    setError(null);
    setNotice('Configurações de parcelamentos salvas.');
  }

  return (
    <div className="grid gap-4">
      <SettingsPageHeader
        title="Parcelamentos"
        description="Padrões do gerador de carnê, textos do PDF e mensagem do WhatsApp."
      />
      <SettingsAlerts notice={notice} error={error} />
      {isDemo ? (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">
          Conta de demonstração: padrões (4 parcelas, vencimento dia 10) e textos do carnê ficam fixos.
        </p>
      ) : null}
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3 md:grid-cols-3">
          <Field label="Parcelas padrão">
            <MaskedInstallmentCountInput
              name="defaultInstallments"
              readOnly={isDemo}
              defaultValue={String(isDemo ? demoDefaults.defaultInstallments : settings.defaultInstallments)}
            />
          </Field>
          <Field label="Dia de vencimento">
            <MaskedDueDayInput
              name="defaultDueDay"
              readOnly={isDemo}
              defaultValue={String(
                isDemo ? demoDefaults.defaultDueDay : (settings.defaultDueDay ? String(settings.defaultDueDay) : ''),
              )}
            />
          </Field>
          <Field label="Juros padrão">
            <SelectInput
              name="defaultInterestType"
              disabled={isDemo}
              defaultValue={isDemo ? demoDefaults.defaultInterestType : settings.defaultInterestType}
            >
              <option value={DefaultInterestType.Simple}>Simples</option>
              <option value={DefaultInterestType.Compound}>Composto</option>
            </SelectInput>
          </Field>
        </Card>
        <Card className="grid gap-4">
          <Field label="Instruções de pagamento do PDF">
            <SoftTextArea
              name="paymentInstructions"
              rows={5}
              readOnly={isDemo}
              defaultValue={
                isDemo
                  ? demoTexts.paymentInstructions
                  : (settings.paymentInstructions ?? settings.pdfFooterText ?? '')
              }
            />
          </Field>
          <Field label="Termo de responsabilidade">
            <SoftTextArea
              name="responsibilityTerm"
              rows={5}
              readOnly={isDemo}
              defaultValue={isDemo ? demoTexts.responsibilityTerm : (settings.responsibilityTerm ?? '')}
            />
          </Field>
          <Field label="Mensagem do WhatsApp">
            <div className="grid gap-1.5 font-normal">
              <p className="text-xs leading-snug text-muted-foreground">Tags disponíveis</p>
              <div className="flex flex-wrap gap-1.5">
                {WHATSAPP_MESSAGE_TAGS.map((tag) => (
                  <code
                    key={tag}
                    className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground"
                  >
                    {`{${tag}}`}
                  </code>
                ))}
              </div>
            </div>
            <SoftTextArea
              name="whatsappMessageTemplate"
              rows={5}
              readOnly={isDemo}
              defaultValue={
                isDemo ? demoTexts.whatsappMessageTemplate : (settings.whatsappMessageTemplate ?? DEFAULT_WHATSAPP_MESSAGE)
              }
            />
          </Field>
          <Field label="Logotipo do carnê">
            {isDemo ? (
              <p className="text-sm text-muted-foreground">Sem logotipo na demonstração.</p>
            ) : null}
            {!isDemo ? (
            <IconFileInput
              accept="image/png,image/jpeg"
              ariaLabel="Enviar logotipo do carnê"
              title="Arraste a imagem aqui"
              hint="PNG ou JPG — até 10 MB"
              onReject={(message) => setError(message)}
              onFileSelected={(file) => {
                void resizeLogoFile(file)
                  .then((logoDataUrl) => {
                    void bank.saveSettings({ ...settings, logoDataUrl });
                    setNotice('Logotipo atualizado.');
                    setError(null);
                  })
                  .catch((cause) => {
                    setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a imagem.');
                  });
              }}
            />
            ) : null}
          </Field>
          {!isDemo && settings.logoDataUrl ? (
            <img src={settings.logoDataUrl} alt="Logotipo atual" className="h-16 w-16 rounded-lg object-contain" />
          ) : null}
          <SaveActionButton type="submit" />
        </Card>
      </form>
    </div>
  );
}
