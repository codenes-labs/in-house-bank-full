import { useState, type FormEvent } from 'react';
import { useBank } from '../../components/bank-context';
import { MilestonesField } from '../../components/milestones-field';
import { MaskedRateInput } from '../../components/masked-inputs';
import { SaveActionButton } from '../../components/standard-action-buttons';
import { Card, Field } from '../../components/ui';
import { validateSettings } from '../../domain/settings/validate-settings';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsFinancialPage() {
  const bank = useBank();
  const settings = bank.snapshot.settings;
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [milestonesCents, setMilestonesCents] = useState(settings.milestonesCents);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {
      ...settings,
      cdiAnnualPercent: Number(String(data.get('cdiAnnualPercent') ?? '0').replace(',', '.')),
      milestonesCents,
    };
    const validation = validateSettings(next);
    if (!validation.valid) {
      setError(Object.values(validation.errors)[0] ?? 'Revise os dados.');
      return;
    }
    await bank.saveSettings(next);
    setError(null);
    setNotice('Ajustes financeiros salvos.');
  }

  return (
    <div className="grid gap-4">
      <SettingsPageHeader
        title="Ajustes financeiros"
        description="Projeção CDI das caixinhas e metas de patrimônio na home."
      />
      <SettingsAlerts notice={notice} error={error} />
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3">
          <Field label="CDI ao ano (%)">
            <MaskedRateInput name="cdiAnnualPercent" defaultValue={String(settings.cdiAnnualPercent).replace('.', ',')} />
          </Field>
          <MilestonesField
            label="Metas de patrimônio (reais)"
            value={milestonesCents}
            onChange={setMilestonesCents}
          />
          <SaveActionButton type="submit" />
        </Card>
      </form>
    </div>
  );
}
