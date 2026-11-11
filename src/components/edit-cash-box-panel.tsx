import { useState, type FormEvent } from 'react';
import { useBank } from './bank-context';
import { MaskedMoneyInput, MaskedRateInput } from './masked-inputs';
import { OverlayPanel } from './overlay-panel';
import { CancelActionButton, formActionRowClassName, SaveActionButton } from './standard-action-buttons';
import { Field, TextInput } from './ui';
import { validateCashBoxInput } from '../domain/cash-boxes/validate-cash-box';
import type { CashBox } from '../domain/models/cash-box';
import { brlStringToCents, formatCentsAsBrl } from '../domain/money/brl-input';

export function EditCashBoxPanel({
  cashBox,
  open,
  onClose,
  onSaved,
  onError,
}: {
  cashBox: CashBox;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onError?: (message: string) => void;
}) {
  const bank = useBank();
  const [formKey, setFormKey] = useState(0);

  async function saveBox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const limitRaw = String(data.get('limit') ?? '').trim();
    const limitCents = limitRaw ? brlStringToCents(limitRaw) ?? undefined : undefined;
    const input = {
      name: String(data.get('name') ?? ''),
      institution: String(data.get('institution') ?? ''),
      cdiPercent: Number(String(data.get('cdi') ?? '').replace(',', '.')),
      limitCents,
      balanceCents: cashBox.balanceCents,
    };
    const validation = validateCashBoxInput(input);
    if (!validation.valid || (limitCents === undefined && limitRaw && limitRaw !== '0,00')) {
      onError?.(Object.values(validation.errors)[0] ?? 'Dados da caixinha inválidos.');
      return;
    }
    if (limitCents !== undefined && limitCents < cashBox.balanceCents) {
      onError?.('O limite não pode ser menor que o saldo atual.');
      return;
    }
    await bank.saveCashBox({
      ...cashBox,
      name: input.name.trim(),
      institution: input.institution.trim(),
      cdiPercent: input.cdiPercent,
      limitCents,
    });
    onClose();
    setFormKey((previous) => previous + 1);
    onSaved?.();
  }

  const limitDefault =
    cashBox.limitCents !== undefined ? formatCentsAsBrl(cashBox.limitCents) : '';

  return (
    <OverlayPanel open={open} title="Editar caixinha" onClose={onClose}>
      <form key={formKey} className="grid gap-3" onSubmit={(event) => void saveBox(event)}>
        <Field label="Nome">
          <TextInput name="name" required defaultValue={cashBox.name} />
        </Field>
        <Field label="Instituição">
          <TextInput name="institution" required defaultValue={cashBox.institution} />
        </Field>
        <Field label="% do CDI">
          <MaskedRateInput name="cdi" defaultValue={String(cashBox.cdiPercent).replace('.', ',')} />
        </Field>
        <Field label="Limite opcional">
          <MaskedMoneyInput name="limit" defaultValue={limitDefault} placeholder="Sem limite" />
          <span className="text-xs font-normal text-muted-foreground">
            Saldo atual {formatCentsAsBrl(cashBox.balanceCents)} — ajuste só por aportes e resgates.
          </span>
        </Field>
        <div className={`${formActionRowClassName} sm:justify-end`}>
          <CancelActionButton className="flex-1 sm:flex-none" onClick={onClose} />
          <SaveActionButton type="submit" label="Salvar alterações" className="flex-1 sm:flex-none" />
        </div>
      </form>
    </OverlayPanel>
  );
}
