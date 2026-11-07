import { useState, type FormEvent } from 'react';
import { useBank } from './bank-context';
import { MaskedMoneyInput, MaskedRateInput } from './masked-inputs';
import { OverlayPanel } from './overlay-panel';
import { Button, Field, TextInput } from './ui';
import { createId } from '../domain/ids/create-id';
import { validateCashBoxInput } from '../domain/cash-boxes/validate-cash-box';
import { brlStringToCents } from '../domain/money/brl-input';

export function CreateCashBoxPanel({
  open,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  onError?: (message: string) => void;
}) {
  const bank = useBank();
  const [formKey, setFormKey] = useState(0);

  async function saveBox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get('name') ?? ''),
      institution: String(data.get('institution') ?? ''),
      cdiPercent: Number(String(data.get('cdi') ?? '').replace(',', '.')),
      limitCents: data.get('limit') ? brlStringToCents(String(data.get('limit'))) ?? undefined : undefined,
      balanceCents: brlStringToCents(String(data.get('balance') ?? '0')) ?? -1,
    };
    const validation = validateCashBoxInput(input);
    if (!validation.valid || (input.limitCents === undefined && data.get('limit'))) {
      onError?.(Object.values(validation.errors)[0] ?? 'Dados da caixinha inválidos.');
      return;
    }
    await bank.saveCashBox({
      id: createId(),
      name: input.name.trim(),
      institution: input.institution.trim(),
      cdiPercent: input.cdiPercent,
      limitCents: input.limitCents,
      balanceCents: input.balanceCents,
    });
    onClose();
    setFormKey((previous) => previous + 1);
    onCreated?.();
  }

  return (
    <OverlayPanel open={open} title="Criar caixinha" onClose={onClose}>
      <form key={formKey} className="grid gap-3" onSubmit={(event) => void saveBox(event)}>
        <Field label="Nome"><TextInput name="name" required /></Field>
        <Field label="Instituição"><TextInput name="institution" required /></Field>
        <Field label="% do CDI"><MaskedRateInput name="cdi" defaultValue="100" /></Field>
        <Field label="Saldo inicial"><MaskedMoneyInput name="balance" defaultValue="0,00" /></Field>
        <Field label="Limite opcional"><MaskedMoneyInput name="limit" placeholder="0,00" /></Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Criar caixinha</Button>
        </div>
      </form>
    </OverlayPanel>
  );
}
