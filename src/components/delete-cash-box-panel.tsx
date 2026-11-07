import { OverlayPanel } from './overlay-panel';
import { Button, money } from './ui';
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={onConfirm}>
              Confirmar exclusão
            </Button>
          </div>
        </div>
      ) : null}
    </OverlayPanel>
  );
}
