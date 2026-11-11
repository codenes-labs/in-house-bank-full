import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import { applyInstallmentPlanUpdate } from '../domain/installments/update-installment-plan';
import {
  planCarneTextOverride,
  planCarneTextsForEdit,
  settingsCarneTextDefaults,
} from '../domain/plan/plan-carne-texts';
import { brlStringToCents, formatCentsAsBrl } from '../domain/money/brl-input';
import { validateBrazilianPhone, maskBrazilianPhone } from '../domain/whatsapp/validate-brazilian-phone';
import { useBank } from './bank-context';
import { MaskedMoneyInput } from './masked-inputs';
import { SaveActionButton } from './standard-action-buttons';
import { Field, SoftTextArea, TextInput } from './ui';

export function PlanEditForm({
  plan,
  onSubmit,
  onSaved,
}: {
  plan: InstallmentPlan;
  onSubmit: (plan: InstallmentPlan) => Promise<string | null>;
  onSaved?: () => void;
}) {
  const bank = useBank();
  const settings = bank.snapshot.settings;
  const defaults = settingsCarneTextDefaults(settings);
  const initialTexts = planCarneTextsForEdit(plan, settings);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [customTexts, setCustomTexts] = useState(initialTexts.usesPlanOverride);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const paymentInstructions = customTexts
      ? planCarneTextOverride(String(data.get('paymentInstructions') ?? ''), defaults.paymentInstructions)
      : undefined;
    const responsibilityTerm = customTexts
      ? planCarneTextOverride(String(data.get('responsibilityTerm') ?? ''), defaults.responsibilityTerm)
      : undefined;

    const usedAmountCents = brlStringToCents(String(data.get('usedAmount') ?? '')) ?? 0;
    const result = applyInstallmentPlanUpdate(plan, {
      reference: String(data.get('reference') ?? ''),
      borrowerName: String(data.get('borrowerName') ?? ''),
      beneficiary: String(data.get('beneficiary') ?? ''),
      pixKey: String(data.get('pixKey') ?? ''),
      institution: String(data.get('institution') ?? ''),
      usedAmountCents,
      payerPhone: String(data.get('payerPhone') ?? ''),
      paymentInstructions: customTexts ? paymentInstructions ?? '' : '',
      responsibilityTerm: customTexts ? responsibilityTerm ?? '' : '',
    });
    if (!result.ok) {
      setError(Object.values(result.errors)[0] ?? 'Dados inválidos.');
      return;
    }
    let next = result.plan;
    if (next.payerPhone) {
      const phone = validateBrazilianPhone(next.payerPhone);
      if (!phone.valid) {
        setError(phone.error ?? 'WhatsApp inválido.');
        return;
      }
      next = { ...next, payerPhone: phone.nationalDigits ?? '' };
    }
    if (!customTexts) {
      next = { ...next, paymentInstructions: undefined, responsibilityTerm: undefined };
    } else {
      next = {
        ...next,
        paymentInstructions: paymentInstructions,
        responsibilityTerm: responsibilityTerm,
      };
    }
    setBusy(true);
    const message = await onSubmit(next);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    onSaved?.();
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados do carnê</p>
        <Field label="Pagador">
          <TextInput name="borrowerName" defaultValue={plan.borrowerName} />
        </Field>
        <Field label="Referência">
          <TextInput name="reference" defaultValue={plan.reference} />
        </Field>
        <Field label="Valor utilizado">
          <MaskedMoneyInput name="usedAmount" defaultValue={formatCentsAsBrl(plan.usedAmountCents)} />
        </Field>
        <Field label="Valor de retorno">
          <TextInput
            readOnly
            value={`R$ ${formatCentsAsBrl(plan.returnAmountCents)}`}
            className="bg-muted/60"
            aria-readonly
          />
          <span className="text-xs font-normal text-muted-foreground">
            Soma das parcelas; altere em Ajustar parcela no detalhe.
          </span>
        </Field>
        <Field label="Beneficiário">
          <TextInput name="beneficiary" defaultValue={plan.beneficiary} />
        </Field>
        <Field label="Chave Pix">
          <TextInput name="pixKey" defaultValue={plan.pixKey} />
        </Field>
        <Field label="Instituição">
          <TextInput name="institution" defaultValue={plan.institution} />
        </Field>
        <Field label="WhatsApp do pagador">
          <TextInput
            name="payerPhone"
            defaultValue={plan.payerPhone ? maskBrazilianPhone(plan.payerPhone) : ''}
            placeholder="(11) 99999-9999"
          />
          <span className="text-xs font-normal text-muted-foreground">Usado na cobrança de todas as parcelas.</span>
        </Field>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-sm font-semibold">Textos do PDF</p>
        <p className="text-sm text-muted-foreground">
          O modelo vem de{' '}
          <Link to="/configuracoes" className="font-semibold text-primary">
            Ajustes
          </Link>
          . Ative só se este parcelamento precisar de texto diferente.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            checked={customTexts}
            onChange={(event) => setCustomTexts(event.target.checked)}
          />
          <span>Personalizar instruções e termo deste carnê</span>
        </label>
        {customTexts ? (
          <>
            <Field label="Instruções de pagamento">
              <SoftTextArea name="paymentInstructions" defaultValue={initialTexts.paymentInstructions} rows={5} />
            </Field>
            <Field label="Termo de responsabilidade">
              <SoftTextArea name="responsibilityTerm" defaultValue={initialTexts.responsibilityTerm} rows={5} />
            </Field>
          </>
        ) : (
          <div className="grid gap-2 text-sm text-muted-foreground">
            {defaults.paymentInstructions ? (
              <p>
                <span className="font-semibold text-foreground">Instruções: </span>
                {defaults.paymentInstructions}
              </p>
            ) : (
              <p>Nenhum modelo de instruções em Ajustes.</p>
            )}
            {defaults.responsibilityTerm ? (
              <p>
                <span className="font-semibold text-foreground">Termo: </span>
                {defaults.responsibilityTerm}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <SaveActionButton type="submit" busy={busy} disabled={busy} label="Salvar alterações" />
    </form>
  );
}
