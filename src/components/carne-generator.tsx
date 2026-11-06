import { useEffect, useMemo, useRef, useState } from 'react';
import { createId } from '../domain/ids/create-id';
import { brlStringToCents } from '../domain/money/brl-input';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { computeDefaultFirstDueDate } from '../domain/quick-generator/compute-default-first-due-date';
import { createInstallmentPlanBundle } from '../domain/quick-generator/create-installment-plan-from-generator';
import { validateQuickGenerator } from '../domain/quick-generator/validate-quick-generator';
import { InstallmentPlanType } from '../domain/enums/installment-plan-type';
import { INSTALLMENT_PLAN_TYPE_LABELS } from '../domain/quick-generator/installment-plan-type-labels';
import { detectPixKeyType } from '../domain/pix/validate-pix-key';
import { PixKeyType } from '../domain/enums/pix-key-type';
import { simulateReturnAmounts } from '../domain/return-amount/simulate-return-amounts';
import { createEmptySettings } from '../domain/models/settings';
import { buildCarnePdfFilename } from '../domain/pdf/build-carne-pdf-filename';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import type { GeneratedInstallmentPlanBundle } from '../domain/quick-generator/create-installment-plan-from-generator';
import { readGeneratorDraft, writeGeneratorDraft, writePendingBundle } from '../lib/guest-draft';
import { generateCarnePdf } from '../pdf/generate-carne-pdf';
import { Button, Card, Field, money, SelectInput, TextInput } from './ui';

const pixLabels: Record<PixKeyType, string> = {
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  RANDOM: 'Aleatória',
  CPF: 'CPF',
  CNPJ: 'CNPJ',
};

const today = todayCalendarDate();
const stored = readGeneratorDraft();

export function CarneGenerator() {
  const [usedAmount, setUsedAmount] = useState(stored?.usedAmount ?? '');
  const [returnAmount, setReturnAmount] = useState(stored?.returnAmount ?? '');
  const [type, setType] = useState(stored?.type ?? InstallmentPlanType.Loan);
  const [reference, setReference] = useState(stored?.reference ?? '');
  const [borrowerName, setBorrowerName] = useState(stored?.borrowerName ?? '');
  const [issueDate, setIssueDate] = useState(stored?.issueDate ?? today);
  const [firstDueDate, setFirstDueDate] = useState(
    stored?.firstDueDate ?? computeDefaultFirstDueDate(today),
  );
  const [installmentsCount, setInstallmentsCount] = useState(stored?.installmentsCount ?? '4');
  const [pixKey, setPixKey] = useState(stored?.pixKey ?? '');
  const [beneficiary, setBeneficiary] = useState(stored?.beneficiary ?? '');
  const [institution, setInstitution] = useState(stored?.institution ?? '');
  const [city, setCity] = useState(stored?.city ?? '');
  const [ratePercent, setRatePercent] = useState(stored?.ratePercent ?? '3');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [bundle, setBundle] = useState<GeneratedInstallmentPlanBundle | null>(null);
  const [pdfFile, setPdfFile] = useState<{ filename: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pdfRequest = useRef(0);
  const pdfUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl.current) {
        const current = pdfUrl.current;
        window.setTimeout(() => URL.revokeObjectURL(current), 60_000);
      }
    };
  }, []);

  const pixType = detectPixKeyType(pixKey);
  const principal = brlStringToCents(usedAmount) ?? 0;
  const count = Number(installmentsCount);
  const rate = Number(ratePercent.replace(',', '.'));
  const simulation = useMemo(() => {
    if (principal <= 0 || !Number.isInteger(count) || count < 1 || !Number.isFinite(rate) || rate < 0) {
      return null;
    }
    return simulateReturnAmounts(principal, rate, count);
  }, [count, principal, rate]);

  function rememberPdf(next: { filename: string; url: string } | null) {
    const previous = pdfUrl.current;
    pdfUrl.current = next?.url ?? null;
    setPdfFile(next);
    if (previous) {
      window.setTimeout(() => URL.revokeObjectURL(previous), 60_000);
    }
  }

  function edit(apply: () => void) {
    pdfRequest.current += 1;
    setBundle(null);
    rememberPdf(null);
    writePendingBundle(null);
    setMessage(null);
    setBusy(false);
    apply();
  }

  function persistDraft(nextReturn = returnAmount) {
    writeGeneratorDraft({
      usedAmount,
      returnAmount: nextReturn,
      type,
      reference,
      borrowerName,
      issueDate,
      firstDueDate,
      installmentsCount,
      pixKey,
      beneficiary,
      institution,
      city,
      ratePercent,
    });
  }

  function buildInput(nextReturn = returnAmount) {
    return {
      usedAmountCents: brlStringToCents(usedAmount) ?? 0,
      returnAmountCents: brlStringToCents(nextReturn) ?? 0,
      type: type as InstallmentPlanType,
      reference,
      borrowerName,
      issueDate,
      firstDueDate,
      installmentsCount: Number(installmentsCount),
      pixKey,
      beneficiary,
      institution,
    };
  }

  function generate(nextReturn = returnAmount): GeneratedInstallmentPlanBundle | null {
    persistDraft(nextReturn);
    const fieldErrors: Record<string, string> = {};
    if (!city.trim() || city.trim().length > 15) {
      fieldErrors.city = 'Informe a cidade do beneficiário com até 15 caracteres.';
    }
    const validation = validateQuickGenerator(buildInput(nextReturn));
    setErrors({ ...validation.errors, ...fieldErrors });
    setWarning(validation.warnings.expectedProfit ?? null);
    if (!validation.valid || Object.keys(fieldErrors).length > 0) {
      pdfRequest.current += 1;
      setBundle(null);
      rememberPdf(null);
      writePendingBundle(null);
      setBusy(false);
      return null;
    }
    const created = createInstallmentPlanBundle(buildInput(nextReturn), createId(), new Date().toISOString());
    setBundle(created);
    writePendingBundle(created);
    setMessage('Parcelas geradas. Nada foi salvo na nuvem.');
    void preparePdf(created);
    return created;
  }

  async function preparePdf(created: GeneratedInstallmentPlanBundle) {
    const request = ++pdfRequest.current;
    rememberPdf(null);
    setBusy(true);
    try {
      const settings = {
        ...createEmptySettings(),
        businessName: created.plan.beneficiary,
        city: city.trim(),
        defaultPixKey: created.plan.pixKey,
        defaultInstitution: created.plan.institution,
      };
      const bytes = await generateCarnePdf({
        plan: created.plan,
        installments: created.installments,
        settings,
      });
      if (pdfRequest.current !== request) {
        return;
      }
      rememberPdf({
        filename: buildCarnePdfFilename(created.plan.borrowerName, created.plan.reference, created.plan.issueDate),
        url: URL.createObjectURL(new Blob([bytes.slice()], { type: 'application/pdf' })),
      });
    } catch (cause) {
      if (pdfRequest.current === request) {
        setMessage(cause instanceof Error ? cause.message : 'Não foi possível gerar o PDF.');
      }
    } finally {
      if (pdfRequest.current === request) {
        setBusy(false);
      }
    }
  }

  function applySimulation(amountCents: number) {
    const formatted = formatCentsAsBrl(amountCents);
    setReturnAmount(formatted);
    generate(formatted);
  }

  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold">Gerar carnê</h2>
        <p className="text-sm text-muted-foreground">Preencha, confira o simulador e baixe o PDF. Visitante não grava histórico.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Valor utilizado" error={errors.usedAmountCents}>
          <TextInput inputMode="decimal" value={usedAmount} onChange={(event) => edit(() => setUsedAmount(event.target.value))} placeholder="540,00" />
        </Field>
        <Field label="Retorno total" error={errors.returnAmountCents}>
          <TextInput inputMode="decimal" value={returnAmount} onChange={(event) => edit(() => setReturnAmount(event.target.value))} placeholder="604,80" />
        </Field>
        <Field label="Tipo">
          <SelectInput value={type} onChange={(event) => edit(() => setType(event.target.value))}>
            {Object.values(InstallmentPlanType).map((value) => (
              <option key={value} value={value}>{INSTALLMENT_PLAN_TYPE_LABELS[value]}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Parcelas" error={errors.installmentsCount}>
          <TextInput inputMode="numeric" value={installmentsCount} onChange={(event) => edit(() => setInstallmentsCount(event.target.value))} />
        </Field>
        <Field label="Pagador" error={errors.borrowerName}>
          <TextInput value={borrowerName} onChange={(event) => edit(() => setBorrowerName(event.target.value))} />
        </Field>
        <Field label="Referência" error={errors.reference}>
          <TextInput value={reference} onChange={(event) => edit(() => setReference(event.target.value))} />
        </Field>
        <Field label="Beneficiário" error={errors.beneficiary}>
          <TextInput value={beneficiary} onChange={(event) => edit(() => setBeneficiary(event.target.value))} />
        </Field>
        <Field label="Instituição" error={errors.institution}>
          <TextInput value={institution} onChange={(event) => edit(() => setInstitution(event.target.value))} />
        </Field>
        <Field label="Cidade do beneficiário" error={errors.city}>
          <TextInput value={city} onChange={(event) => edit(() => setCity(event.target.value))} maxLength={15} />
        </Field>
        <Field label="Chave Pix" error={errors.pixKey}>
          <TextInput value={pixKey} onChange={(event) => edit(() => setPixKey(event.target.value))} />
          <span className="text-sm font-normal text-muted-foreground">{pixType ? `Tipo: ${pixLabels[pixType]}` : 'Tipo ainda não reconhecido'}</span>
        </Field>
        <Field label="Data da operação" error={errors.issueDate}>
          <TextInput type="date" value={issueDate} onChange={(event) => edit(() => setIssueDate(event.target.value))} />
        </Field>
        <Field label="Primeiro vencimento" error={errors.firstDueDate}>
          <TextInput type="date" value={firstDueDate} onChange={(event) => edit(() => setFirstDueDate(event.target.value))} />
        </Field>
      </div>
      {warning ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">{warning}</p> : null}
      <div className="grid gap-3 lg:grid-cols-[12rem_1fr_1fr]">
        <Field label="Taxa ao mês (%)">
          <TextInput inputMode="decimal" value={ratePercent} onChange={(event) => edit(() => setRatePercent(event.target.value))} />
        </Field>
        <SimulatorColumn
          title="Juros simples"
          total={simulation?.simpleReturnAmountCents}
          onApply={() => simulation && applySimulation(simulation.simpleReturnAmountCents)}
        />
        <SimulatorColumn
          title="Price (composto)"
          total={simulation?.compoundReturnAmountCents}
          installment={simulation?.compoundInstallmentAmountCents}
          onApply={() => simulation && applySimulation(simulation.compoundReturnAmountCents)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => generate()} disabled={!pixType}>Gerar parcelas</Button>
        {pdfFile ? (
          <a
            href={pdfFile.url}
            download={pdfFile.filename}
            className="press inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-soft px-4 text-base font-semibold text-secondary-foreground"
          >
            Baixar PDF
          </a>
        ) : (
          <Button type="button" variant="soft" disabled>
            {busy ? 'Preparando PDF…' : 'Baixar PDF'}
          </Button>
        )}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {bundle ? (
        <ul className="grid gap-2">
          {bundle.installments.map((installment) => (
            <li key={installment.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
              <span>Parcela {installment.number}</span>
              <span>{installment.dueDate.split('-').reverse().join('/')}</span>
              <strong>{money(installment.amountCents)}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function SimulatorColumn({
  title,
  total,
  installment,
  onApply,
}: {
  title: string;
  total?: number;
  installment?: number;
  onApply: () => void;
}) {
  return (
    <div className="rounded-xl bg-brand-soft p-3">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-2 text-lg font-semibold">{total === undefined ? '—' : money(total)}</p>
      {installment !== undefined ? <p className="text-sm text-muted-foreground">Parcela {money(installment)}</p> : null}
      <Button type="button" variant="ghost" className="mt-2 px-0" onClick={onApply} disabled={total === undefined}>
        Aplicar
      </Button>
    </div>
  );
}
