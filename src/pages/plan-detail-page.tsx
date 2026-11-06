import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { planWithInstallmentSum } from '../application/plan-with-installment-sum';
import { useBank } from '../components/bank-context';
import { Button, Card, EmptyState, Field, money, StatusPill, TextArea, TextInput } from '../components/ui';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { InstallmentStatus } from '../domain/enums/installment-status';
import { deriveInstallmentStatus } from '../domain/installments/derive-installment-status';
import { canDeleteInstallment } from '../domain/installments/installment-deletion';
import { clearInstallmentSettlement, settleInstallment } from '../domain/installments/installment-settlement';
import { PlanDeleteConfirmationLevel, resolvePlanDeleteConfirmationLevel } from '../domain/installments/plan-deletion';
import { refreshPendingInstallmentTxids } from '../domain/installments/refresh-pending-installment-txids';
import { installmentStatusLabel } from '../domain/installments/status-labels';
import { applyInstallmentPlanUpdate } from '../domain/installments/update-installment-plan';
import { applyInstallmentUpdate } from '../domain/installments/update-installment';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import { brlStringToCents } from '../domain/money/brl-input';
import { buildCarnePdfFilename } from '../domain/pdf/build-carne-pdf-filename';
import { buildStaticPixBrCode } from '../domain/pix/build-static-pix-br-code';
import { buildWhatsappChargeMessage, buildWhatsappUrl } from '../domain/whatsapp/build-whatsapp-charge';
import { maskBrazilianPhone, validateBrazilianPhone } from '../domain/whatsapp/validate-brazilian-phone';
import { createEmptySettings } from '../domain/models/settings';
import { downloadPdfBytes } from '../pdf/download-pdf-bytes';
import { generateCarnePdf } from '../pdf/generate-carne-pdf';

export function PlanDetailPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();
  const bank = useBank();
  const today = todayCalendarDate();
  const plan = bank.snapshot.installmentPlans.find((item) => item.id === planId);
  const installments = bank.snapshot.installments
    .filter((item) => item.planId === planId)
    .sort((left, right) => left.number - right.number);
  const [notice, setNotice] = useState<string | null>(null);
  const [phonePrompt, setPhonePrompt] = useState('');
  const [bookletUrl, setBookletUrl] = useState<string | null>(null);
  const bookletFilename = plan
    ? buildCarnePdfFilename(plan.borrowerName, plan.reference, plan.issueDate)
    : 'carne.pdf';
  const bookletKey = [
    plan?.id ?? '',
    plan?.beneficiary ?? '',
    plan?.pixKey ?? '',
    plan?.institution ?? '',
    plan?.reference ?? '',
    plan?.borrowerName ?? '',
    plan?.issueDate ?? '',
    plan?.returnAmountCents ?? '',
    plan?.paymentInstructions ?? '',
    plan?.responsibilityTerm ?? '',
    bank.snapshot.settings.city ?? '',
    bank.snapshot.settings.paymentInstructions ?? '',
    bank.snapshot.settings.pdfFooterText ?? '',
    bank.snapshot.settings.responsibilityTerm ?? '',
    bank.snapshot.settings.logoDataUrl ?? '',
    installments
      .map((item) => `${item.id}:${item.amountCents}:${item.dueDate}:${item.txid}:${item.paidDate ?? ''}`)
      .join('|'),
  ].join('~');

  useEffect(() => {
    if (!plan || installments.length === 0) {
      return;
    }
    let cancelled = false;
    setBookletUrl((current) => {
      if (current) {
        window.setTimeout(() => URL.revokeObjectURL(current), 60_000);
      }
      return null;
    });
    void generateCarnePdf({
      plan,
      installments,
      settings: { ...bank.snapshot.settings, city: bank.snapshot.settings.city || 'SAO PAULO' },
    }).then((bytes) => {
      if (cancelled) {
        return;
      }
      const url = URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' }));
      setBookletUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [bookletKey]);

  if (!bank.ready) {
    return <p>Carregando…</p>;
  }
  if (!plan) {
    return <EmptyState title="Parcelamento não encontrado" text="Ele pode ter sido excluído desta conta." />;
  }

  async function print(selected = installments) {
    if (!plan) {
      return;
    }
    const bytes = await generateCarnePdf({
      plan,
      installments: selected,
      settings: { ...bank.snapshot.settings, city: bank.snapshot.settings.city || 'SAO PAULO' },
    });
    downloadPdfBytes(buildCarnePdfFilename(plan.borrowerName, plan.reference, plan.issueDate), bytes);
  }

  async function charge(installmentId: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!plan || !installment) {
      return;
    }
    const stored = plan.payerPhone ? validateBrazilianPhone(plan.payerPhone) : null;
    const typed = phonePrompt ? validateBrazilianPhone(phonePrompt) : null;
    const phone = stored?.valid ? stored : typed;
    if (!phone?.valid || !phone.nationalDigits) {
      setNotice('Informe o WhatsApp do pagador para cobrar.');
      return;
    }
    const settings = bank.snapshot.settings.city ? bank.snapshot.settings : { ...createEmptySettings(), ...bank.snapshot.settings, city: 'SAO PAULO' };
    const message = buildWhatsappChargeMessage({ plan, installment, settings });
    if (!plan.payerPhone) {
      await bank.savePlan({ ...plan, payerPhone: phone.nationalDigits });
    }
    window.open(buildWhatsappUrl(phone.nationalDigits, message), '_blank', 'noopener,noreferrer');
  }

  async function markPaid(installmentId: string, paidDate: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!installment) {
      return;
    }
    const result = settleInstallment(installment, paidDate);
    if (!result.ok) {
      setNotice('Esta parcela já está paga.');
      return;
    }
    await bank.saveInstallment(result.installment);
  }

  async function undo(installmentId: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!installment) {
      return;
    }
    const result = clearInstallmentSettlement(installment);
    if (!result.ok) {
      return;
    }
    await bank.saveInstallment(result.installment);
  }

  async function changeAmount(installmentId: string, amount: string, dueDate: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!plan || !installment) {
      return;
    }
    const result = applyInstallmentUpdate(installment, {
      amountCents: brlStringToCents(amount) ?? 0,
      dueDate,
    });
    if (!result.ok) {
      setNotice(result.error === 'INVALID_AMOUNT' ? 'Informe um valor maior que zero.' : 'Data inválida.');
      return;
    }
    const nextInstallments = installments.map((item) => (item.id === installmentId ? result.installment : item));
    await bank.saveInstallment(result.installment);
    await bank.savePlan(planWithInstallmentSum(plan, nextInstallments));
  }

  async function removeInstallment(installmentId: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!plan || !installment || !canDeleteInstallment(installment)) {
      setNotice('Desfaça o pagamento antes de excluir a parcela.');
      return;
    }
    if (!window.confirm('Excluir esta parcela?')) {
      return;
    }
    const remaining = installments.filter((item) => item.id !== installmentId);
    await bank.deleteInstallment(installmentId);
    await bank.savePlan(planWithInstallmentSum(plan, remaining));
  }

  async function savePlan(form: FormData) {
    const result = applyInstallmentPlanUpdate(plan!, {
      reference: String(form.get('reference') ?? ''),
      borrowerName: String(form.get('borrowerName') ?? ''),
      beneficiary: String(form.get('beneficiary') ?? ''),
      pixKey: String(form.get('pixKey') ?? ''),
      institution: String(form.get('institution') ?? ''),
      payerPhone: String(form.get('payerPhone') ?? ''),
      paymentInstructions: String(form.get('paymentInstructions') ?? ''),
      responsibilityTerm: String(form.get('responsibilityTerm') ?? ''),
    });
    if (!result.ok) {
      setNotice(Object.values(result.errors)[0] ?? 'Dados inválidos.');
      return;
    }
    if (result.plan.payerPhone) {
      const phone = validateBrazilianPhone(result.plan.payerPhone);
      if (!phone.valid) {
        setNotice(phone.error ?? 'WhatsApp inválido.');
        return;
      }
      result.plan.payerPhone = phone.nationalDigits ?? '';
    }
    await bank.savePlan(result.plan);
    if (result.pixFieldsChanged) {
      for (const installment of refreshPendingInstallmentTxids(result.plan, installments)) {
        if (!installment.paidDate) {
          await bank.saveInstallment(installment);
        }
      }
      setNotice('Chave ou beneficiário alterados. Os Pix das parcelas pendentes foram regenerados.');
      return;
    }
    setNotice('Parcelamento atualizado.');
  }

  async function removePlan() {
    const level = resolvePlanDeleteConfirmationLevel(installments);
    const confirmed = window.confirm(
      level === PlanDeleteConfirmationLevel.Reinforced
        ? 'Este parcelamento tem parcelas pagas. A exclusão é permanente e remove todo o histórico. Confirma?'
        : 'Excluir este parcelamento e todas as parcelas?',
    );
    if (!confirmed) {
      return;
    }
    await bank.deletePlan(plan!.id);
    navigate('/parcelamentos');
  }

  return (
    <div className="grid gap-4">
      <Link to="/parcelamentos" className="text-sm font-semibold text-primary">Voltar</Link>
      <h1 className="text-3xl font-semibold">{plan.borrowerName}</h1>
      <p className="text-muted-foreground">{plan.reference} · retorno {money(plan.returnAmountCents)}</p>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <div className="flex flex-wrap gap-2">
        {bookletUrl ? (
          <a
            href={bookletUrl}
            download={bookletFilename}
            className="press inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-soft px-4 text-base font-semibold text-secondary-foreground"
          >
            Baixar PDF
          </a>
        ) : (
          <Button type="button" variant="soft" disabled>Preparando PDF…</Button>
        )}
        <Button type="button" variant="danger" onClick={() => void removePlan()}>Excluir</Button>
      </div>
      <div className="grid gap-3">
        {installments.map((installment) => {
          const status = deriveInstallmentStatus(installment, today);
          const tone = status === InstallmentStatus.Paid ? 'paid' : status === InstallmentStatus.Overdue ? 'overdue' : 'pending';
          return (
            <Card key={installment.id} className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>Parcela {installment.number}</strong>
                <StatusPill label={installmentStatusLabel(status)} tone={tone} />
                <span>{money(installment.amountCents)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Vencimento {installment.dueDate.split('-').reverse().join('/')}</p>
              {installment.paidDate ? (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <TextInput type="date" defaultValue={installment.paidDate} aria-label="Data de pagamento" onChange={(event) => void bank.saveInstallment({ ...installment, paidDate: event.target.value })} />
                  <Button type="button" variant="ghost" onClick={() => void undo(installment.id)}>Desfazer</Button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <TextInput type="date" defaultValue={today} id={`paid-${installment.id}`} />
                  <Button type="button" onClick={() => {
                    const input = document.getElementById(`paid-${installment.id}`) as HTMLInputElement | null;
                    void markPaid(installment.id, input?.value || today);
                  }}>Marcar como paga</Button>
                  <Button type="button" variant="soft" onClick={() => void charge(installment.id)}>Cobrar no WhatsApp</Button>
                </div>
              )}
              {!installment.paidDate ? (
                <Field label="WhatsApp, se ainda não estiver no plano">
                  <TextInput value={phonePrompt} placeholder="(11) 99999-9999" onChange={(event) => setPhonePrompt(maskBrazilianPhone(event.target.value))} />
                </Field>
              ) : null}
              <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void changeAmount(installment.id, String(data.get('amount')), String(data.get('due')));
              }}>
                <TextInput name="amount" defaultValue={formatCentsAsBrl(installment.amountCents)} aria-label="Valor da parcela" />
                <TextInput name="due" type="date" defaultValue={installment.dueDate} aria-label="Vencimento" />
                <Button type="submit" variant="soft">Salvar parcela</Button>
              </form>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" onClick={() => void print([installment])}>Reimprimir</Button>
                <Button type="button" variant="ghost" onClick={() => void removeInstallment(installment.id)}>Excluir parcela</Button>
              </div>
              <p className="break-all text-xs text-muted-foreground">
                {safePix(plan, installment, bank.snapshot.settings.city || 'SAO PAULO')}
              </p>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2 className="mb-3 font-semibold">Editar plano</h2>
        <form className="grid gap-3" onSubmit={(event) => {
          event.preventDefault();
          void savePlan(new FormData(event.currentTarget));
        }}>
          <Field label="Pagador"><TextInput name="borrowerName" defaultValue={plan.borrowerName} /></Field>
          <Field label="Referência"><TextInput name="reference" defaultValue={plan.reference} /></Field>
          <Field label="Beneficiário"><TextInput name="beneficiary" defaultValue={plan.beneficiary} /></Field>
          <Field label="Chave Pix"><TextInput name="pixKey" defaultValue={plan.pixKey} /></Field>
          <Field label="Instituição"><TextInput name="institution" defaultValue={plan.institution} /></Field>
          <Field label="WhatsApp"><TextInput name="payerPhone" defaultValue={plan.payerPhone ? maskBrazilianPhone(plan.payerPhone) : ''} /></Field>
          <Field label="Instruções de pagamento"><TextArea name="paymentInstructions" defaultValue={plan.paymentInstructions ?? ''} /></Field>
          <Field label="Termo de responsabilidade"><TextArea name="responsibilityTerm" defaultValue={plan.responsibilityTerm ?? ''} /></Field>
          <Button type="submit">Salvar plano</Button>
        </form>
      </Card>
    </div>
  );
}

function safePix(plan: { pixKey: string; beneficiary: string }, installment: { amountCents: number; txid: string }, city: string): string {
  try {
    return buildStaticPixBrCode({
      pixKey: plan.pixKey,
      amountCents: installment.amountCents,
      merchantName: plan.beneficiary,
      merchantCity: city,
      txid: installment.txid,
    });
  } catch {
    return 'Pix indisponível até a cidade e a chave estarem válidas.';
  }
}
