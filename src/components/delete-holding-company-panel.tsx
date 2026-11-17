import { OverlayPanel } from './overlay-panel';
import { CancelActionButton, DeleteActionButton, formActionRowClassName } from './standard-action-buttons';
import { Button } from './ui';

export function DeleteHoldingCompanyPanel({
  companyName,
  hasOperationalData,
  open,
  onClose,
  onConfirm,
  acknowledging,
  onAcknowledge,
}: {
  companyName: string;
  hasOperationalData: boolean;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  acknowledging: boolean;
  onAcknowledge: () => void;
}) {
  return (
    <OverlayPanel open={open} title="Excluir empresa" onClose={onClose}>
      <div className="grid gap-4">
        {hasOperationalData ? (
          <>
            <p className="text-sm leading-relaxed">
              A conta <strong>{companyName}</strong> contém dados (parcelamentos, caixinhas ou saldo). Faça backup em{' '}
              <strong>Ajustes → Backup</strong> entrando com o e-mail da empresa antes de excluir.
            </p>
            <p className="text-sm text-destructive">A exclusão é permanente e não pode ser desfeita.</p>
            {!acknowledging ? (
              <Button type="button" variant="danger" className="w-full" onClick={onAcknowledge}>
                Entendi — quero excluir mesmo assim
              </Button>
            ) : (
              <p className="text-sm font-semibold text-foreground">Confirme abaixo para excluir definitivamente.</p>
            )}
          </>
        ) : (
          <p className="text-sm leading-relaxed">
            Excluir <strong>{companyName}</strong>? O cadastro ainda não tem dados operacionais. A exclusão é
            permanente.
          </p>
        )}
        <div className={formActionRowClassName}>
          <CancelActionButton onClick={onClose} />
          <DeleteActionButton
            label="Excluir empresa"
            disabled={hasOperationalData && !acknowledging}
            onClick={onConfirm}
          />
        </div>
      </div>
    </OverlayPanel>
  );
}