import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { compactActionButtonClassName } from './standard-action-buttons';
import { Button, cx } from './ui';

export function PixCopyButton({
  code,
  disabledReason,
  className,
}: {
  code: string;
  disabledReason?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const unavailable = Boolean(disabledReason);

  async function copy() {
    if (unavailable) {
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="soft"
        className={cx(compactActionButtonClassName, className)}
        disabled={unavailable}
        onClick={() => void copy()}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span className="truncate">{copied ? 'Pix copiado' : 'Copiar Pix'}</span>
      </Button>
      {unavailable ? <p className="w-full basis-full text-sm text-muted-foreground">{disabledReason}</p> : null}
    </>
  );
}

export function buildPlanInstallmentPixCode(
  plan: { pixKey: string; beneficiary: string },
  installment: { amountCents: number; txid: string },
  city: string,
  build: (input: {
    pixKey: string;
    amountCents: number;
    merchantName: string;
    merchantCity: string;
    txid: string;
  }) => string,
): { code: string; error?: string } {
  try {
    return {
      code: build({
        pixKey: plan.pixKey,
        amountCents: installment.amountCents,
        merchantName: plan.beneficiary,
        merchantCity: city,
        txid: installment.txid,
      }),
    };
  } catch {
    return { code: '', error: 'Pix indisponível até cidade e chave estarem válidas.' };
  }
}
