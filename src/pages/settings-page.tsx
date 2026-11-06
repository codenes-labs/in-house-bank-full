import { useState, type FormEvent } from 'react';
import { useBank } from '../components/bank-context';
import {
  MaskedDueDayInput,
  MaskedInstallmentCountInput,
  MaskedRateInput,
} from '../components/masked-inputs';
import { useTheme } from '../components/theme';
import { Button, Card, Field, SelectInput, TextArea, TextInput } from '../components/ui';
import { APP_DATA_BACKUP_VERSION } from '../domain/models/app-data-backup';
import { DefaultInterestType } from '../domain/enums/default-interest-type';
import { validatePixKey } from '../domain/pix/validate-pix-key';
import { Check } from 'lucide-react';
import { parseAppDataBackupJson } from '../domain/backup/assert-app-data-backup';
import { serializeAppDataBackup } from '../domain/backup/serialize-app-data-backup';
import { validateSettings } from '../domain/settings/validate-settings';
import { DEFAULT_WHATSAPP_MESSAGE } from '../domain/whatsapp/default-whatsapp-message';
import { resizeLogoFile } from '../pdf/resize-logo';

export function SettingsPage() {
  const bank = useBank();
  const theme = useTheme();
  const settings = bank.snapshot.settings;
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState(settings.defaultPixKey);
  const pixValid = validatePixKey(pixKey).valid;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      ...settings,
      businessName: String(data.get('businessName') ?? ''),
      document: String(data.get('document') ?? '') || undefined,
      city: String(data.get('city') ?? ''),
      defaultPixKey: String(data.get('defaultPixKey') ?? ''),
      defaultInstitution: String(data.get('defaultInstitution') ?? ''),
      defaultInstallments: Number(data.get('defaultInstallments')),
      defaultDueDay: data.get('defaultDueDay') ? Number(data.get('defaultDueDay')) : undefined,
      defaultInterestType: String(data.get('defaultInterestType')) === DefaultInterestType.Compound ? DefaultInterestType.Compound : DefaultInterestType.Simple,
      theme: theme.mode,
      cdiAnnualPercent: Number(String(data.get('cdiAnnualPercent') ?? '0').replace(',', '.')),
      milestonesCents: String(data.get('milestones') ?? '')
        .split(',')
        .map((item) => Math.round(Number(item.trim().replace(/\./g, '').replace(',', '.')) * 100))
        .filter((item) => item > 0),
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
    setNotice('Configurações salvas.');
  }

  function exportBackup() {
    const json = serializeAppDataBackup({ version: APP_DATA_BACKUP_VERSION, ...bank.snapshot });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `in-house-bank-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File) {
    try {
      const backup = parseAppDataBackupJson(await file.text());
      if (!window.confirm('Importar o backup vai substituir os dados desta conta. Deseja continuar?')) {
        return;
      }
      await bank.importBackup(backup);
      theme.setMode(backup.settings.theme);
      setNotice('Backup version 1 importado.');
      setError(null);
    } catch {
      setError('Arquivo de backup inválido.');
    }
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Configurações</h1>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3 md:grid-cols-2">
          <Field label="Beneficiário"><TextInput name="businessName" defaultValue={settings.businessName} /></Field>
          <Field label="CPF ou CNPJ"><TextInput name="document" defaultValue={settings.document ?? ''} /></Field>
          <Field label="Cidade"><TextInput name="city" defaultValue={settings.city} maxLength={15} /></Field>
          <Field label="Instituição"><TextInput name="defaultInstitution" defaultValue={settings.defaultInstitution} /></Field>
          <Field label="Chave Pix padrão">
            <div className="relative">
              <TextInput name="defaultPixKey" className={pixValid ? 'pr-10' : undefined} value={pixKey} onChange={(event) => setPixKey(event.target.value)} />
              {pixValid ? <Check className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-accent" aria-label="Chave Pix válida" /> : null}
            </div>
          </Field>
          <Field label="Parcelas padrão">
            <MaskedInstallmentCountInput name="defaultInstallments" defaultValue={String(settings.defaultInstallments)} />
          </Field>
          <Field label="Dia de vencimento">
            <MaskedDueDayInput name="defaultDueDay" defaultValue={settings.defaultDueDay ? String(settings.defaultDueDay) : ''} />
          </Field>
          <Field label="Juros padrão">
            <SelectInput name="defaultInterestType" defaultValue={settings.defaultInterestType}>
              <option value={DefaultInterestType.Simple}>Simples</option>
              <option value={DefaultInterestType.Compound}>Composto</option>
            </SelectInput>
          </Field>
          <Field label="CDI ao ano (%)">
            <MaskedRateInput name="cdiAnnualPercent" defaultValue={String(settings.cdiAnnualPercent).replace('.', ',')} />
          </Field>
          <Field label="Metas em reais, separadas por vírgula">
            <TextInput name="milestones" defaultValue={settings.milestonesCents.map((cents) => cents / 100).join(', ')} placeholder="10000, 20000, 50000, 100000, 200000, 500000, 1000000" />
          </Field>
        </Card>
        <Card className="grid gap-3">
          <Field label="Instruções de pagamento do PDF"><TextArea name="paymentInstructions" defaultValue={settings.paymentInstructions ?? settings.pdfFooterText ?? ''} /></Field>
          <Field label="Termo de responsabilidade"><TextArea name="responsibilityTerm" defaultValue={settings.responsibilityTerm ?? ''} /></Field>
          <Field label="Mensagem do WhatsApp"><TextArea name="whatsappMessageTemplate" defaultValue={settings.whatsappMessageTemplate ?? DEFAULT_WHATSAPP_MESSAGE} /></Field>
          <Field label="Logotipo do carnê">
            <TextInput type="file" accept="image/png,image/jpeg" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              void resizeLogoFile(file).then((logoDataUrl) => bank.saveSettings({ ...settings, logoDataUrl }));
            }} />
          </Field>
          {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="Logotipo atual" className="h-16 w-16 rounded-lg object-contain" /> : null}
          <Button type="submit">Salvar</Button>
        </Card>
      </form>
      <Card className="grid gap-3">
        <h2 className="font-semibold">Backup</h2>
        <Button type="button" variant="soft" onClick={exportBackup}>Exportar JSON</Button>
        <Field label="Importar backup version 1">
          <TextInput type="file" accept="application/json" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void importBackup(file);
            }
          }} />
        </Field>
      </Card>
    </div>
  );
}
