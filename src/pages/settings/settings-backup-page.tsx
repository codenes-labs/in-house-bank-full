import { useState } from 'react';
import { FileJson } from 'lucide-react';
import { useBank } from '../../components/bank-context';
import { IconFileInput } from '../../components/icon-file-input';
import { Button, Card, Field } from '../../components/ui';
import { APP_DATA_BACKUP_VERSION } from '../../domain/models/app-data-backup';
import { parseAppDataBackupJson } from '../../domain/backup/assert-app-data-backup';
import { serializeAppDataBackup } from '../../domain/backup/serialize-app-data-backup';
import { downloadTextFile } from '../../lib/download-text-file';
import { SettingsAlerts, SettingsPageHeader } from './settings-page-header';

export function SettingsBackupPage() {
  const bank = useBank();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function exportBackup() {
    const exportDate = new Date().toISOString().slice(0, 10);
    const json = serializeAppDataBackup({ version: APP_DATA_BACKUP_VERSION, ...bank.snapshot });
    downloadTextFile(`in-house-bank-backup-${exportDate}.json`, json, 'application/json');
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
        description="Cópia completa da conta em JSON. A importação aceita apenas esse formato."
      />
      <SettingsAlerts notice={notice} error={error} />
      <Card className="grid gap-3">
        <Button type="button" variant="soft" className="w-full sm:w-auto" onClick={exportBackup}>
          <FileJson className="size-4 shrink-0" aria-hidden />
          Exportar JSON
        </Button>
        <Field label="Importar backup">
          <IconFileInput
            accept="application/json,.json"
            ariaLabel="Importar arquivo de backup JSON"
            title="Arraste o arquivo aqui"
            hint="JSON — até 10 MB"
            onReject={(message) => setError(message)}
            onFileSelected={(file) => {
              void importBackup(file);
            }}
          />
        </Field>
      </Card>
    </div>
  );
}
