import { useState, type FormEvent } from 'react';
import { useBank } from '../../components/bank-context';
import {
  MaskedDueDayInput,
  MaskedInstallmentCountInput,
} from '../../components/masked-inputs';
import { SaveActionButton } from '../../components/standard-action-buttons';
import { Card, Field, SelectInput, SoftTextArea, TextInput } from '../../components/ui';
import { DefaultInterestType } from '../../domain/enums/default-interest-type';
import { validateSettings } from '../../domain/settings/validate-settings';
import {
  DEFAULT_WHATSAPP_MESSAGE,
  WHATSAPP_MESSAGE_TAGS,
} from '../../domain/whatsapp/default-whatsapp-message';
import { resizeLogoFile } from '../../pdf/resize-logo';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsInstallmentsPage() {
  const bank = useBank();
  const settings = bank.snapshot.settings;
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      paymentInstructions: String(data.get('paymentInstructions') ?? ''),
      responsibilityTerm: String(data.get('responsibilityTerm') ?? ''),
      whatsappMessageTemplate: String(data.get('whatsappMessageTemplate') ?? ''),
      pdfFooterText: String(data.get('paymentInstructions') ?? ''),
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
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3 md:grid-cols-3">
          <Field label="Parcelas padrão">
            <MaskedInstallmentCountInput name="defaultInstallments" defaultValue={String(settings.defaultInstallments)} />
          </Field>
          <Field label="Dia de vencimento">
            <MaskedDueDayInput
              name="defaultDueDay"
              defaultValue={settings.defaultDueDay ? String(settings.defaultDueDay) : ''}
            />
          </Field>
          <Field label="Juros padrão">
            <SelectInput name="defaultInterestType" defaultValue={settings.defaultInterestType}>
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
              defaultValue={settings.paymentInstructions ?? settings.pdfFooterText ?? ''}
            />
          </Field>
          <Field label="Termo de responsabilidade">
            <SoftTextArea name="responsibilityTerm" rows={5} defaultValue={settings.responsibilityTerm ?? ''} />
          </Field>
          <div className="grid gap-1.5">
            <p className="text-xs leading-snug text-muted-foreground">
              Tags disponíveis:{' '}
              {WHATSAPP_MESSAGE_TAGS.map((tag) => (
                <code key={tag} className="mr-1 font-mono text-[11px] text-foreground">
                  {`{${tag}}`}
                </code>
              ))}
            </p>
            <Field label="Mensagem do WhatsApp">
              <SoftTextArea
                name="whatsappMessageTemplate"
                rows={5}
                defaultValue={settings.whatsappMessageTemplate ?? DEFAULT_WHATSAPP_MESSAGE}
              />
            </Field>
          </div>
          <Field label="Logotipo do carnê">
            <TextInput
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                void resizeLogoFile(file).then((logoDataUrl) => {
                  void bank.saveSettings({ ...settings, logoDataUrl });
                  setNotice('Logotipo atualizado.');
                  setError(null);
                });
              }}
            />
          </Field>
          {settings.logoDataUrl ? (
            <img src={settings.logoDataUrl} alt="Logotipo atual" className="h-16 w-16 rounded-lg object-contain" />
          ) : null}
          <SaveActionButton type="submit" />
        </Card>
      </form>
    </div>
  );
}
