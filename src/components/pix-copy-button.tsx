import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './ui';

export function PixCopyButton({ code, disabledReason }: { code: string; disabledReason?: string }) {
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
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="soft" className="min-h-10" disabled={unavailable} onClick={() => void copy()}>
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? 'Pix copiado' : 'Copiar Pix'}
      </Button>
      {unavailable ? <span className="text-sm text-muted-foreground">{disabledReason}</span> : null}
    </div>
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
