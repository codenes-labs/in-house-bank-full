import { useState, type InputHTMLAttributes } from 'react';
import {
  maskDueDay,
  maskInstallmentCount,
  maskMoneyField,
  maskMonthlyRate,
} from '../domain/quick-generator/mask-generator-fields';
import { TextInput } from './ui';

type MaskedProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> & {
  defaultValue?: string;
};

export function MaskedMoneyInput({ defaultValue = '', ...props }: MaskedProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TextInput
      {...props}
      inputMode="numeric"
      value={value}
      onChange={(event) => setValue(maskMoneyField(event.target.value))}
    />
  );
}

export function MaskedRateInput({ defaultValue = '', ...props }: MaskedProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TextInput
      {...props}
      inputMode="decimal"
      value={value}
      onChange={(event) => setValue(maskMonthlyRate(event.target.value))}
    />
  );
}

export function MaskedInstallmentCountInput({ defaultValue = '', ...props }: MaskedProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TextInput
      {...props}
      inputMode="numeric"
      value={value}
      maxLength={2}
      onChange={(event) => setValue(maskInstallmentCount(event.target.value))}
    />
  );
}

export function MaskedDueDayInput({ defaultValue = '', ...props }: MaskedProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TextInput
      {...props}
      inputMode="numeric"
      value={value}
      maxLength={2}
      onChange={(event) => setValue(maskDueDay(event.target.value))}
    />
  );
}
