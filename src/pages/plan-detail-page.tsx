import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { planWithInstallmentSum } from '../application/plan-with-installment-sum';
import { useBank } from '../components/bank-context';
import { MaskedMoneyInput } from '../components/masked-inputs';
import { OverlayPanel } from '../components/overlay-panel';
import { buildPlanInstallmentPixCode, PixCopyButton } from '../components/pix-copy-button';
import { PlanEditForm } from '../components/plan-edit-form';
import {
  actionBarRowClassName,
  CancelActionButton,
  CloseActionButton,
  DeleteActionButton,
  EditActionButton,
  MarkPaidActionButton,
  PrintActionButton,
  SaveActionButton,
  UndoActionButton,
  WhatsAppActionButton,
} from '../components/standard-action-buttons';
import { Card, cx, EmptyState, Field, money, StatusPill, TextInput } from '../components/ui';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { InstallmentStatus } from '../domain/enums/installment-status';
import { PlanStatus } from '../domain/enums/plan-status';
import { deriveInstallmentStatus } from '../domain/installments/derive-installment-status';
import { derivePlanStatus } from '../domain/installments/derive-plan-status';
import { canDeleteInstallment } from '../domain/installments/installment-deletion';
import { clearInstallmentSettlement, settleInstallment } from '../domain/installments/installment-settlement';
import { PlanDeleteConfirmationLevel, resolvePlanDeleteConfirmationLevel } from '../domain/installments/plan-deletion';
import { refreshPendingInstallmentTxids } from '../domain/installments/refresh-pending-installment-txids';
import { installmentStatusLabel, planStatusLabel } from '../domain/installments/status-labels';
import { applyInstallmentUpdate } from '../domain/installments/update-installment';
import { formatCentsAsBrl, brlStringToCents } from '../domain/money/brl-input';
import type { InstallmentPlan } from '../domain/models/installment-plan';
import { buildCarnePdfFilename } from '../domain/pdf/build-carne-pdf-filename';
import { buildStaticPixBrCode } from '../domain/pix/build-static-pix-br-code';
import { buildWhatsappChargeMessage, buildWhatsappUrl } from '../domain/whatsapp/build-whatsapp-charge';
import { maskBrazilianPhone, validateBrazilianPhone } from '../domain/whatsapp/validate-brazilian-phone';
import { settingsAfterInstallmentChange } from '../domain/finance/settings-after-installment-change';
import type { Installment } from '../domain/models/installment';
import { createEmptySettings } from '../domain/models/settings';
import { downloadPdfBytes } from '../pdf/download-pdf-bytes';
import { generateCarnePdf } from '../pdf/generate-carne-pdf';
import {
  ReprintSelectionMode,
  selectInstallmentsForReprint,
} from '../domain/installments/select-installments-for-reprint';
import { sortPlanInstallmentsForDisplay } from '../domain/installments/sort-plan-installments-for-display';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';

type InstallmentSelectionPurpose = 'delete' | 'download';

export function PlanDetailPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();
  const bank = useBank();
  const today = todayCalendarDate();
  const planFromStore = bank.snapshot.installmentPlans.find((item) => item.id === planId);
  const installments = sortPlanInstallmentsForDisplay(
    bank.snapshot.installments.filter((item) => item.planId === planId),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [selectionPurpose, setSelectionPurpose] = useState<InstallmentSelectionPurpose | null>(null);
  const [carneBusy, setCarneBusy] = useState(false);
  const [adjustingInstallmentId, setAdjustingInstallmentId] = useState<string | null>(null);
  const merchantCity = bank.snapshot.settings.city || 'SAO PAULO';
  const installmentIds = useMemo(() => installments.map((item) => item.id), [installments]);
  const allSelected = installmentIds.length > 0 && installmentIds.every((id) => selectedIds.has(id));

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => installmentIds.includes(id)));
      return next.size === current.size ? current : next;
    });
  }, [installmentIds]);

  if (!bank.ready) {
    return <p>Carregando…</p>;
  }
  if (!planFromStore) {
    return <EmptyState title="Parcelamento não encontrado" text="Ele pode ter sido excluído desta conta." />;
  }

  const plan = planFromStore;
  const planStatus = derivePlanStatus(installments, today);
  const planTone =
    planStatus === PlanStatus.Settled ? 'paid' : planStatus === PlanStatus.Overdue ? 'overdue' : 'pending';

  async function persistInstallmentChange(previous: Installment, next: Installment) {
    const nextSettings = settingsAfterInstallmentChange(bank.snapshot.settings, previous, next);
    if (nextSettings.freeBalanceCents !== bank.snapshot.settings.freeBalanceCents) {
      await bank.saveSettings(nextSettings);
    }
    await bank.saveInstallment(next);
  }

  function toggleInstallment(installmentId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(installmentId);
      } else {
        next.delete(installmentId);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(installmentIds) : new Set());
  }

  function beginSelection(purpose: InstallmentSelectionPurpose) {
    setSelectionPurpose(purpose);
    setSelectedIds(new Set());
    setNotice(
      purpose === 'delete' ? 'Marque as parcelas para excluir e toque em Excluir de novo.' : 'Marque as parcelas e toque em Reimprimir de novo.',
    );
  }

  function cancelSelection() {
    setSelectionPurpose(null);
    setSelectedIds(new Set());
    setNotice(null);
  }

  const showSelectionCheckboxes = selectionPurpose !== null;

  async function downloadCarne(): Promise<boolean> {
    const result = selectInstallmentsForReprint(installments, selectedIds, ReprintSelectionMode.Selected);
    if (!result.ok) {
      setNotice('Selecione ao menos uma parcela.');
      return false;
    }
    setCarneBusy(true);
    try {
      const bytes = await generateCarnePdf({
        plan,
        installments: result.installments,
        settings: { ...bank.snapshot.settings, city: merchantCity },
      });
      downloadPdfBytes(buildCarnePdfFilename(plan.borrowerName, plan.reference, plan.issueDate), bytes);
      return true;
    } finally {
      setCarneBusy(false);
    }
  }

  function onBaixarCarneClick() {
    if (selectionPurpose !== 'download') {
      beginSelection('download');
      return;
    }
    void downloadCarne().then((ok) => {
      if (ok) {
        cancelSelection();
      }
    });
  }

  function onExcluirClick() {
    if (selectionPurpose !== 'delete') {
      beginSelection('delete');
      return;
    }
    void removeSelected();
  }

  async function charge(installmentId: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!installment) {
      return;
    }
    const stored = plan.payerPhone ? validateBrazilianPhone(plan.payerPhone) : null;
    if (!stored?.valid || !stored.nationalDigits) {
      setNotice('Cadastre o WhatsApp do pagador em Editar (vale para todas as parcelas).');
      setEditOpen(true);
      return;
    }
    const settings = bank.snapshot.settings.city ? bank.snapshot.settings : { ...createEmptySettings(), ...bank.snapshot.settings, city: 'SAO PAULO' };
    const message = buildWhatsappChargeMessage({ plan, installment, settings });
    window.open(buildWhatsappUrl(stored.nationalDigits, message), '_blank', 'noopener,noreferrer');
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
    await persistInstallmentChange(installment, result.installment);
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
    await persistInstallmentChange(installment, result.installment);
  }

  async function saveInstallmentAdjust(installmentId: string, amount: string, dueDate: string, paidDate?: string) {
    const installment = installments.find((item) => item.id === installmentId);
    if (!installment) {
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
    let next = result.installment;
    if (installment.paidDate && paidDate && paidDate !== installment.paidDate) {
      next = { ...next, paidDate };
    }
    const nextInstallments = installments.map((item) => (item.id === installmentId ? next : item));
    await persistInstallmentChange(installment, next);
    await bank.savePlan(planWithInstallmentSum(plan, nextInstallments));
    setNotice('Parcela atualizada.');
  }

  async function removeSelected() {
    if (selectedIds.size === 0) {
      setNotice('Selecione ao menos uma parcela.');
      return;
    }
    if (selectedIds.size === installments.length) {
      await removePlan();
      return;
    }
    const selected = installments.filter((item) => selectedIds.has(item.id));
    if (selected.some((item) => !canDeleteInstallment(item))) {
      setNotice('Desfaça o pagamento das parcelas selecionadas antes de excluir.');
      return;
    }
    const label = selected.length === 1 ? 'Excluir esta parcela?' : `Excluir ${selected.length} parcelas?`;
    if (!window.confirm(label)) {
      return;
    }
    for (const installment of selected) {
      await bank.deleteInstallment(installment.id);
    }
    const remaining = installments.filter((item) => !selectedIds.has(item.id));
    await bank.savePlan(planWithInstallmentSum(plan, remaining));
    cancelSelection();
    setNotice(selected.length === 1 ? 'Parcela excluída.' : 'Parcelas excluídas.');
  }

  async function persistPlanEdit(saved: InstallmentPlan): Promise<string | null> {
    const pixFieldsChanged = saved.pixKey !== plan.pixKey || saved.beneficiary !== plan.beneficiary;
    await bank.savePlan(saved);
    if (pixFieldsChanged) {
      for (const installment of refreshPendingInstallmentTxids(saved, installments)) {
        if (!installment.paidDate) {
          await bank.saveInstallment(installment);
        }
      }
      setNotice('Dados salvos. Pix das parcelas pendentes atualizado.');
    } else {
      setNotice('Parcelamento atualizado.');
    }
    return null;
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
    await bank.deletePlan(plan.id);
    navigate('/parcelamentos');
  }

  return (
    <div className="grid gap-4">
      <Link to="/parcelamentos" className="w-fit text-sm font-semibold text-primary">
        Voltar
      </Link>

      <Card className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{plan.borrowerName}</h1>
              <StatusPill label={planStatusLabel(planStatus)} tone={planTone} />
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.reference} · retorno {money(plan.returnAmountCents)} · {installments.length} parcela
              {installments.length === 1 ? '' : 's'} · operação em {formatCalendarDateBr(plan.issueDate)}
            </p>
            {plan.payerPhone ? (
              <p className="text-sm text-muted-foreground">
                WhatsApp {maskBrazilianPhone(plan.payerPhone)}
              </p>
            ) : (
              <p className="text-sm text-status-pending">WhatsApp não cadastrado — use Editar para cobrar.</p>
            )}
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 lg:w-auto lg:items-end">
            <div className={actionBarRowClassName}>
              <EditActionButton layout="bar" onClick={() => setEditOpen(true)} label="Editar" />
              <PrintActionButton layout="bar" busy={carneBusy} onClick={onBaixarCarneClick} />
              <DeleteActionButton
                layout="bar"
                onClick={onExcluirClick}
                label={selectionPurpose === 'delete' ? 'Confirmar exclusão' : 'Excluir'}
              />
            </div>
            {showSelectionCheckboxes ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border"
                    checked={allSelected}
                    onChange={(event) => toggleAll(event.target.checked)}
                    aria-label="Selecionar todas as parcelas"
                  />
                  Selecionar todas
                </label>
                <CancelActionButton className="min-h-10 px-2" onClick={cancelSelection} />
              </div>
            ) : null}
          </div>
        </div>
        {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      </Card>

      <div className="grid gap-3">
        {installments.map((installment) => {
          const status = deriveInstallmentStatus(installment, today);
          const tone = status === InstallmentStatus.Paid ? 'paid' : status === InstallmentStatus.Overdue ? 'overdue' : 'pending';
          const pix = buildPlanInstallmentPixCode(plan, installment, merchantCity, buildStaticPixBrCode);
          return (
            <Card key={installment.id} className="grid gap-0 divide-y divide-border p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {showSelectionCheckboxes ? (
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 rounded border-border"
                      checked={selectedIds.has(installment.id)}
                      onChange={(event) => toggleInstallment(installment.id, event.target.checked)}
                      aria-label={`Selecionar parcela ${installment.number}`}
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Parcela {installment.number}</p>
                    <p className="text-xl font-semibold tabular-nums">{money(installment.amountCents)}</p>
                  <p className="text-sm text-muted-foreground">
                    Vencimento {formatCalendarDateBr(installment.dueDate)}
                    {installment.paidDate ? ` · pago em ${formatCalendarDateBr(installment.paidDate)}` : ''}
                  </p>
                  </div>
                </div>
                <StatusPill label={installmentStatusLabel(status)} tone={tone} />
              </div>

              <div className="flex w-full flex-wrap items-stretch gap-2 p-4 sm:flex-nowrap">
                {installment.paidDate ? (
                  <>
                    <UndoActionButton layout="compact" onClick={() => void undo(installment.id)} />
                    {adjustingInstallmentId === installment.id ? (
                      <CloseActionButton
                        layout="compact"
                        onClick={() => setAdjustingInstallmentId(null)}
                      />
                    ) : (
                      <EditActionButton
                        layout="compact"
                        onClick={() => setAdjustingInstallmentId(installment.id)}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <MarkPaidActionButton layout="compact" onClick={() => void markPaid(installment.id, today)} />
                    <WhatsAppActionButton layout="compact" onClick={() => void charge(installment.id)} />
                    <PixCopyButton
                      code={pix.code}
                      disabledReason={pix.error}
                      className="min-h-10 min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-0"
                    />
                    {adjustingInstallmentId === installment.id ? (
                      <CloseActionButton
                        layout="compact"
                        onClick={() => setAdjustingInstallmentId(null)}
                      />
                    ) : (
                      <EditActionButton
                        layout="compact"
                        onClick={() => setAdjustingInstallmentId(installment.id)}
                      />
                    )}
                  </>
                )}
              </div>

              {adjustingInstallmentId === installment.id ? (
                <div className="grid gap-3 border-t border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ajustar parcela</p>
                  <form
                    className={cx(
                      'grid w-full gap-2 sm:items-end',
                      installment.paidDate
                        ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'
                        : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]',
                    )}
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      void saveInstallmentAdjust(
                        installment.id,
                        String(data.get('amount')),
                        String(data.get('due')),
                        installment.paidDate ? String(data.get('paidDate') ?? '') : undefined,
                      ).then(() => setAdjustingInstallmentId(null));
                    }}
                  >
                    <Field label="Valor">
                      <MaskedMoneyInput
                        key={`${installment.id}-amount`}
                        name="amount"
                        className="min-h-10"
                        defaultValue={formatCentsAsBrl(installment.amountCents)}
                      />
                    </Field>
                    <Field label="Vencimento">
                      <TextInput
                        name="due"
                        type="date"
                        className="min-h-10 text-sm"
                        defaultValue={installment.dueDate}
                      />
                    </Field>
                    {installment.paidDate ? (
                      <Field label="Data do pagamento">
                        <TextInput
                          name="paidDate"
                          type="date"
                          className="min-h-10 text-sm"
                          defaultValue={installment.paidDate}
                        />
                      </Field>
                    ) : null}
                    <SaveActionButton
                      type="submit"
                      variant="soft"
                      className="min-h-10 w-full sm:w-auto sm:min-w-[6.75rem]"
                    />
                  </form>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <OverlayPanel open={editOpen} title="Editar parcelamento" onClose={() => setEditOpen(false)}>
        <PlanEditForm
          plan={plan}
          onSubmit={persistPlanEdit}
          onSaved={() => {
            setEditOpen(false);
          }}
        />
      </OverlayPanel>
    </div>
  );
}
