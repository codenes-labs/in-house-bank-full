import { useState, type FormEvent } from 'react';
import { useBank } from '../../components/bank-context';
import { SaveActionButton } from '../../components/standard-action-buttons';
import { Card, Field, TextInput } from '../../components/ui';
import { validatePixKey } from '../../domain/pix/validate-pix-key';
import { validateSettings } from '../../domain/settings/validate-settings';
import { Check } from 'lucide-react';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsAccountPage() {
  const bank = useBank();
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
      defaultInstitution: String(data.get('defaultInstitution') ?? ''),
      defaultPixKey: String(data.get('defaultPixKey') ?? ''),
    };
    const validation = validateSettings(next);
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Revise os dados.');
      return;
    }
    await bank.saveSettings(next);
    setError(null);
    setNotice('Dados da conta salvos.');
  }

  return (
    <div className="grid gap-4">
      <SettingsPageHeader title="Beneficiário" description="Dados usados no carnê e no Pix padrão." />
      <SettingsAlerts notice={notice} error={error} />
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3 md:grid-cols-2">
          <Field label="Beneficiário">
            <TextInput name="businessName" defaultValue={settings.businessName} />
          </Field>
          <Field label="CPF ou CNPJ">
            <TextInput name="document" defaultValue={settings.document ?? ''} />
          </Field>
          <Field label="Cidade">
            <TextInput name="city" defaultValue={settings.city} maxLength={15} />
          </Field>
          <Field label="Instituição">
            <TextInput name="defaultInstitution" defaultValue={settings.defaultInstitution} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Chave Pix padrão">
              <div className="relative">
                <TextInput
                  name="defaultPixKey"
                  className={pixValid ? 'pr-10' : undefined}
                  value={pixKey}
                  onChange={(event) => setPixKey(event.target.value)}
                />
                {pixValid ? (
                  <Check
                    className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-accent"
                    aria-label="Chave Pix válida"
                  />
                ) : null}
              </div>
            </Field>
          </div>
        </Card>
        <SaveActionButton type="submit" />
      </form>
    </div>
  );
}
