import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../components/auth-context';
import { useBank } from '../../components/bank-context';
import { useTheme } from '../../components/theme';
import { SaveActionButton } from '../../components/standard-action-buttons';
import { Card, Field, SelectInput } from '../../components/ui';
import type { ThemeMode } from '../../domain/theme/theme-mode';
import {
  applyUiFontScale,
  readStoredUiFontScale,
  type UiFontScale,
} from '../../domain/theme/ui-font-scale';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsGeneralPage() {
  const auth = useAuth();
  const bank = useBank();
  const theme = useTheme();
  const settings = bank.snapshot.settings;
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(theme.mode);
  const [fontScale, setFontScale] = useState<UiFontScale>(readStoredUiFontScale());

  useEffect(() => {
    setThemeMode(theme.mode);
  }, [theme.mode]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      applyUiFontScale(fontScale);
      if (auth.session?.user.id && bank.ready) {
        await bank.saveSettings({ ...settings, theme: themeMode });
      }
      setError(null);
      setNotice('Configurações gerais salvas.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    }
  }

  return (
    <div className="grid gap-4">
      <SettingsPageHeader title="Configurações gerais" description="Aparência do app neste dispositivo." />
      <SettingsAlerts notice={notice} error={error} />
      <form className="grid gap-3" onSubmit={(event) => void save(event)}>
        <Card className="grid gap-3">
          <Field label="Tema">
            <SelectInput
              value={themeMode}
              onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </SelectInput>
          </Field>
          <Field label="Tamanho do texto">
            <SelectInput
              value={fontScale}
              onChange={(event) => setFontScale(event.target.value as UiFontScale)}
            >
              <option value="default">Padrão</option>
              <option value="large">Grande</option>
            </SelectInput>
          </Field>
          <SaveActionButton type="submit" />
        </Card>
      </form>
    </div>
  );
}
