import { useState, type FormEvent } from 'react';
import { useBank } from '../../components/bank-context';
import { MaskedRateInput } from '../../components/masked-inputs';
import { SaveActionButton } from '../../components/standard-action-buttons';
import { Card, Field, TextInput } from '../../components/ui';
import { validateSettings } from '../../domain/settings/validate-settings';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsGeneralPage() {
  const bank = useBank();
  const settings = bank.snapshot.settings;
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      ...settings,
      cdiAnnualPercent: Number(String(data.get('cdiAnnualPercent') ?? '0').replace(',', '.')),
      milestonesCents: String(data.get('milestones') ?? '')
        .split(',')
        .map((item) => Math.round(Number(item.trim().replace(/\./g, '').replace(',', '.')) * 100))
        .filter((item) => item > 0),
    };
    const validation = validateSettings(next);
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Revise os dados.');
      return;
    }
    await bank.saveSettings(next);
    setError(null);
    setNotice('Ajustes gerais salvos.');
  }

  return (
    <div className="grid gap-4">
      <SettingsPageHeader
        title="Ajustes gerais"
        description="Projeção das caixinhas e metas de patrimônio exibidas na home."
      />
      <SettingsAlerts notice={notice} error={error} />
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3">
          <Field label="CDI ao ano (%)">
            <MaskedRateInput name="cdiAnnualPercent" defaultValue={String(settings.cdiAnnualPercent).replace('.', ',')} />
          </Field>
          <Field label="Metas em reais, separadas por vírgula">
            <TextInput
              name="milestones"
              defaultValue={settings.milestonesCents.map((cents) => cents / 100).join(', ')}
              placeholder="10000, 20000, 50000, 100000, 200000, 500000, 1000000"
            />
          </Field>
          <SaveActionButton type="submit" />
        </Card>
      </form>
    </div>
  );
}
