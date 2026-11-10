import { OverlayPanel } from './overlay-panel';
import { CancelActionButton, DeleteActionButton, formActionRowClassName } from './standard-action-buttons';
import { money } from './ui';
import type { CashBox } from '../domain/models/cash-box';

export function DeleteCashBoxPanel({
  cashBox,
  open,
  onClose,
  onConfirm,
}: {
  cashBox: CashBox | undefined;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <OverlayPanel open={open} title="Excluir caixinha" onClose={onClose}>
      {cashBox ? (
        <div className="grid gap-4">
          <p>
            Excluir <strong>{cashBox.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <p className="text-sm text-muted-foreground">
            O saldo de {money(cashBox.balanceCents)} será transferido automaticamente para o saldo livre.
          </p>
          <div className={formActionRowClassName}>
            <CancelActionButton onClick={onClose} />
            <DeleteActionButton label="Confirmar exclusão" onClick={onConfirm} />
          </div>
        </div>
      ) : null}
    </OverlayPanel>
  );
}
