import { useState } from 'react';
import { useBank } from '../../components/bank-context';
import { useTheme } from '../../components/theme';
import { Button, Card, Field, TextInput } from '../../components/ui';
import { APP_DATA_BACKUP_VERSION } from '../../domain/models/app-data-backup';
import { parseAppDataBackupJson } from '../../domain/backup/assert-app-data-backup';
import { serializeAppDataBackup } from '../../domain/backup/serialize-app-data-backup';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsBackupPage() {
  const bank = useBank();
  const theme = useTheme();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function exportBackup() {
    const json = serializeAppDataBackup({ version: APP_DATA_BACKUP_VERSION, ...bank.snapshot });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `in-house-bank-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Backup exportado.');
    setError(null);
  }

  async function importBackup(file: File) {
    try {
      const backup = parseAppDataBackupJson(await file.text());
      if (!window.confirm('Importar o backup vai substituir os dados desta conta. Deseja continuar?')) {
        return;
      }
      await bank.importBackup(backup);
      theme.setMode(backup.settings.theme);
      setNotice('Backup importado.');
      setError(null);
    } catch {
      setError('Arquivo de backup inválido.');
    }
  }

  return (
    <div className="grid gap-4">
      <SettingsPageHeader
        title="Importação e exportação"
        description="Cópia completa dos planos, parcelas, caixinhas e configurações."
      />
      <SettingsAlerts notice={notice} error={error} />
      <Card className="grid gap-3">
        <Button type="button" variant="soft" onClick={exportBackup}>
          Exportar JSON
        </Button>
        <Field label="Importar backup">
          <TextInput
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void importBackup(file);
              }
            }}
          />
        </Field>
      </Card>
    </div>
  );
}
