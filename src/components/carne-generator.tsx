import { useEffect, useMemo, useRef, useState } from 'react';
import { createId } from '../domain/ids/create-id';
import { brlStringToCents } from '../domain/money/brl-input';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { computeDefaultFirstDueDate } from '../domain/quick-generator/compute-default-first-due-date';
import { createInstallmentPlanBundle } from '../domain/quick-generator/create-installment-plan-from-generator';
import {
  isQuickGeneratorReadyToApplyInterest,
  isQuickGeneratorReadyToGenerate,
  resolveSimulationInstallmentCount,
  simulationInstallmentCountFor,
  validateQuickGenerator,
} from '../domain/quick-generator/validate-quick-generator';
import { InstallmentPlanType } from '../domain/enums/installment-plan-type';
import { INSTALLMENT_PLAN_TYPE_LABELS } from '../domain/quick-generator/installment-plan-type-labels';
import { validatePixKey } from '../domain/pix/validate-pix-key';
import { Check } from 'lucide-react';
import { maskInstallmentCount, maskMoneyField, maskMonthlyRate } from '../domain/quick-generator/mask-generator-fields';
import { simulateReturnAmounts } from '../domain/return-amount/simulate-return-amounts';
import { createEmptySettings } from '../domain/models/settings';
import { buildCarnePdfFilename } from '../domain/pdf/build-carne-pdf-filename';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import type { GeneratedInstallmentPlanBundle } from '../domain/quick-generator/create-installment-plan-from-generator';
import { writePendingBundle } from '../lib/guest-draft';
import { generateCarnePdf } from '../pdf/generate-carne-pdf';
import {
  DownloadPdfActionButton,
  GenerateInstallmentsActionButton,
  SaveActionButton,
} from './standard-action-buttons';
import { Button, Card, Field, money, SelectInput, TextInput } from './ui';

const today = todayCalendarDate();

export function CarneGenerator({
  title = 'Gerar carnê',
  description = 'Preencha, confira o simulador e baixe o PDF. Visitante não grava histórico.',
  prefill,
  onSaveBundle,
}: {
  title?: string;
  description?: string;
  prefill?: {
    beneficiary?: string;
    pixKey?: string;
    institution?: string;
    city?: string;
  };
  onSaveBundle?: (bundle: GeneratedInstallmentPlanBundle) => Promise<void>;
} = {}) {
  const [usedAmount, setUsedAmount] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [type, setType] = useState<string>(InstallmentPlanType.Loan);
  const [reference, setReference] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [firstDueDate, setFirstDueDate] = useState(computeDefaultFirstDueDate(today));
  const [installmentsCount, setInstallmentsCount] = useState('4');
  const [pixKey, setPixKey] = useState(prefill?.pixKey ?? '');
  const [beneficiary, setBeneficiary] = useState(prefill?.beneficiary ?? '');
  const [institution, setInstitution] = useState(prefill?.institution ?? '');
  const [city, setCity] = useState(prefill?.city ?? '');
  const [ratePercent, setRatePercent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);
  const [bundle, setBundle] = useState<GeneratedInstallmentPlanBundle | null>(null);
  const [pdfFile, setPdfFile] = useState<{ filename: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pdfRequest = useRef(0);
  const pdfUrl = useRef<string | null>(null);

  useEffect(() => {
    sessionStorage.removeItem('in-house-bank.generatorDraft');
    return () => {
      if (pdfUrl.current) {
        const current = pdfUrl.current;
        window.setTimeout(() => URL.revokeObjectURL(current), 60_000);
      }
    };
  }, []);

  const pixValid = validatePixKey(pixKey).valid;
  const principal = brlStringToCents(usedAmount) ?? 0;
  const count = Number(installmentsCount);
  const rate = ratePercent.trim() ? Number(ratePercent.replace(',', '.')) : Number.NaN;
  const generatorInput = useMemo(() => buildInput(), [
    beneficiary,
    borrowerName,
    firstDueDate,
    installmentsCount,
    institution,
    issueDate,
    pixKey,
    reference,
    returnAmount,
    type,
    usedAmount,
  ]);

  const readyToApplySimulation = useMemo(
    () => isQuickGeneratorReadyToApplyInterest(principal, count, rate),
    [count, principal, rate],
  );

  const simulationInstallmentCount = useMemo(
    () => simulationInstallmentCountFor(principal, count, rate),
    [count, principal, rate],
  );

  const readyToGenerate = useMemo(
    () => isQuickGeneratorReadyToGenerate(generatorInput, city),
    [city, generatorInput],
  );

  const usesDefaultInstallmentCount =
    readyToApplySimulation && resolveSimulationInstallmentCount(count) === null;

  const simulation = useMemo(() => {
    if (simulationInstallmentCount === null || principal <= 0) {
      return null;
    }
    return simulateReturnAmounts(principal, rate, simulationInstallmentCount);
  }, [principal, rate, simulationInstallmentCount]);

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
    setMessage(onSaveBundle ? 'Parcelas geradas. Revise e salve na conta.' : 'Parcelas geradas. Nada foi salvo na nuvem.');
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
    if (!readyToApplySimulation) {
      return;
    }
    const formatted = formatCentsAsBrl(amountCents);
    edit(() => setReturnAmount(formatted));
  }

  async function saveToAccount() {
    if (!bundle || !onSaveBundle) {
      return;
    }
    setSaving(true);
    try {
      await onSaveBundle(bundle);
      writePendingBundle(null);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="grid min-w-0 gap-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Valor utilizado" error={errors.usedAmountCents}>
          <TextInput inputMode="numeric" value={usedAmount} onChange={(event) => edit(() => setUsedAmount(maskMoneyField(event.target.value)))} placeholder="540,00" />
        </Field>
        <Field label="Retorno total" error={errors.returnAmountCents}>
          <TextInput inputMode="numeric" value={returnAmount} onChange={(event) => edit(() => setReturnAmount(maskMoneyField(event.target.value)))} placeholder="604,80" />
        </Field>
        <Field label="Tipo">
          <SelectInput value={type} onChange={(event) => edit(() => setType(event.target.value))}>
            {Object.values(InstallmentPlanType).map((value) => (
              <option key={value} value={value}>{INSTALLMENT_PLAN_TYPE_LABELS[value]}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Parcelas" error={errors.installmentsCount}>
          <TextInput inputMode="numeric" value={installmentsCount} onChange={(event) => edit(() => setInstallmentsCount(maskInstallmentCount(event.target.value)))} placeholder="4" maxLength={2} />
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
        <Field label="Chave Pix" error={errors.pixKey}>
          <div className="relative">
            <TextInput className={pixValid ? 'pr-10' : undefined} value={pixKey} onChange={(event) => edit(() => setPixKey(event.target.value))} />
            {pixValid ? <Check className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-accent" aria-label="Chave Pix válida" /> : null}
          </div>
        </Field>
        <Field label="Instituição" error={errors.institution}>
          <TextInput value={institution} onChange={(event) => edit(() => setInstitution(event.target.value))} />
        </Field>
        <Field label="Cidade do beneficiário" error={errors.city}>
          <TextInput value={city} onChange={(event) => edit(() => setCity(event.target.value))} maxLength={15} />
        </Field>
        <Field label="Data da operação" error={errors.issueDate}>
          <TextInput type="date" value={issueDate} onChange={(event) => edit(() => setIssueDate(event.target.value))} />
        </Field>
        <Field label="Primeiro vencimento" error={errors.firstDueDate}>
          <TextInput type="date" value={firstDueDate} onChange={(event) => edit(() => setFirstDueDate(event.target.value))} />
        </Field>
      </div>
      {warning ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-status-pending">{warning}</p> : null}
      <div className="grid gap-2">
        <div className="grid min-w-0 gap-2 md:grid-cols-[8rem_1fr_1fr]">
          <Field label="Taxa ao mês (%)">
            <TextInput inputMode="decimal" value={ratePercent} onChange={(event) => edit(() => setRatePercent(maskMonthlyRate(event.target.value)))} placeholder="3" maxLength={6} />
          </Field>
          <SimulatorColumn
            title="Juros simples"
            total={simulation?.simpleReturnAmountCents}
            canApply={readyToApplySimulation}
            onApply={() => simulation && applySimulation(simulation.simpleReturnAmountCents)}
          />
          <SimulatorColumn
            title="Juros compostos"
            total={simulation?.compoundReturnAmountCents}
            installment={simulation?.compoundInstallmentAmountCents}
            canApply={readyToApplySimulation}
            onApply={() => simulation && applySimulation(simulation.compoundReturnAmountCents)}
          />
        </div>
        {usesDefaultInstallmentCount ? (
          <p className="text-sm text-muted-foreground">
            Parcelas em branco: a simulação usa 4 parcelas. Ajuste o campo Parcelas se precisar.
          </p>
        ) : null}
        {!simulation ? (
          <p className="text-sm text-muted-foreground">
            Informe valor utilizado e taxa ao mês para simular e aplicar no retorno total.
          </p>
        ) : null}
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <GenerateInstallmentsActionButton
          type="button"
          className={onSaveBundle ? 'w-full min-w-0' : 'w-full min-w-0 sm:col-span-2'}
          disabled={!readyToGenerate}
          onClick={() => generate()}
        />
        {onSaveBundle ? (
          <SaveActionButton
            type="button"
            className="w-full min-w-0"
            disabled={!bundle || saving || !readyToGenerate}
            busy={saving}
            label="Salvar na conta"
            onClick={() => void saveToAccount()}
          />
        ) : null}
        <DownloadPdfActionButton
          className={onSaveBundle ? 'w-full min-w-0 sm:col-span-2' : 'w-full min-w-0 sm:col-span-2'}
          href={pdfFile?.url}
          download={pdfFile?.filename}
          busy={busy}
          disabled={!pdfFile && !busy}
        />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {bundle ? (
        <ul className="grid gap-2">
          {bundle.installments.map((installment) => (
            <li
              key={installment.id}
              className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
            >
              <span className="whitespace-nowrap">Parcela {installment.number}</span>
              <span className="truncate text-center">{installment.dueDate.split('-').reverse().join('/')}</span>
              <strong className="whitespace-nowrap text-right">{money(installment.amountCents)}</strong>
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
  canApply,
  onApply,
}: {
  title: string;
  total?: number;
  installment?: number;
  canApply: boolean;
  onApply: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-brand-soft px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-primary">{title}</p>
        <p className="text-sm font-semibold">{total === undefined ? '—' : money(total)}</p>
        {installment !== undefined ? <p className="text-xs text-muted-foreground">Parcela {money(installment)}</p> : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        className="min-h-9 shrink-0 px-2"
        onClick={onApply}
        disabled={!canApply || total === undefined}
      >
        Aplicar
      </Button>
    </div>
  );
}
