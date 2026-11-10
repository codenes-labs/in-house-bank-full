import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import {
  maskMilestoneReaisInput,
  parseMilestoneReaisToCents,
  sortMilestonesCents,
} from '../domain/finance/parse-milestone-reais';
import { Field, TextInput, money } from './ui';

export function MilestonesField({
  label,
  value,
  onChange,
  inputError,
}: {
  label: string;
  value: number[];
  onChange: (next: number[]) => void;
  inputError?: string | null;
}) {
  const [draft, setDraft] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function addDraft() {
    const cents = parseMilestoneReaisToCents(draft);
    if (cents === null) {
      setLocalError('Informe um valor em reais.');
      return;
    }
    if (value.includes(cents)) {
      setLocalError('Essa meta já está na lista.');
      return;
    }
    onChange(sortMilestonesCents([...value, cents]));
    setDraft('');
    setLocalError(null);
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    addDraft();
  }

  return (
    <Field label={label} error={inputError ?? localError ?? undefined}>
      <div className="grid gap-2">
        {value.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {value.map((cents) => (
              <li
                key={cents}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 py-1 pl-2.5 pr-1 text-sm font-medium tabular-nums"
              >
                {money(cents)}
                <button
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Remover meta ${money(cents)}`}
                  onClick={() => onChange(value.filter((item) => item !== cents))}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <TextInput
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          placeholder="Ex.: 10.000 — Enter para adicionar"
          onChange={(event) => {
            setDraft(maskMilestoneReaisInput(event.target.value));
            setLocalError(null);
          }}
          onKeyDown={onDraftKeyDown}
        />
        <p className="text-xs text-muted-foreground">Digite o valor em reais e pressione Enter.</p>
      </div>
    </Field>
  );
}
