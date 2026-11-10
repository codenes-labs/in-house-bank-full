import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Pencil,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Button, cx } from './ui';

export const actionBarRowClassName = 'flex w-full gap-2 lg:w-auto lg:flex-wrap';

export const actionBarButtonClassName =
  'min-h-10 min-w-0 flex-1 px-2 text-sm lg:min-h-12 lg:flex-none lg:px-4 lg:text-base';

export const compactActionButtonClassName =
  'min-h-10 min-w-0 flex-1 basis-[calc(50%-0.25rem)] px-2 text-sm sm:basis-0 sm:px-3';

export const formActionRowClassName = 'flex flex-wrap gap-2';

type ActionLayout = 'bar' | 'compact' | 'inline';

type StandardActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: ReactNode;
  layout?: ActionLayout;
};

function layoutClass(layout: ActionLayout) {
  if (layout === 'bar') {
    return actionBarButtonClassName;
  }
  if (layout === 'compact') {
    return compactActionButtonClassName;
  }
  return 'min-h-10 px-3 text-sm lg:min-h-12 lg:px-4 lg:text-base';
}

function actionLabel(label: ReactNode) {
  return <span className="truncate">{label}</span>;
}

export function EditActionButton({ label = 'Editar', layout = 'inline', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" variant="soft" className={cx(layoutClass(layout), className)} {...props}>
      <Pencil className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function DeleteActionButton({ label = 'Excluir', layout = 'inline', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" variant="danger" className={cx(layoutClass(layout), className)} {...props}>
      <Trash2 className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function PrintActionButton({
  label = 'Reimprimir',
  busy = false,
  busyLabel = 'Reimprimindo…',
  layout = 'inline',
  className,
  ...props
}: StandardActionProps & { busy?: boolean; busyLabel?: ReactNode }) {
  return (
    <Button
      type="button"
      variant="soft"
      className={cx(layoutClass(layout), className)}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : <Printer className="size-4 shrink-0" aria-hidden />}
      {actionLabel(busy ? busyLabel : label)}
    </Button>
  );
}

export function SaveActionButton({
  label = 'Salvar',
  busy = false,
  busyLabel = 'Salvando…',
  layout = 'inline',
  variant = 'primary',
  type = 'button',
  className,
  ...props
}: StandardActionProps & { busy?: boolean; busyLabel?: ReactNode; variant?: 'primary' | 'soft' }) {
  return (
    <Button
      type={type}
      variant={variant}
      className={cx(layoutClass(layout), className)}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : <Save className="size-4 shrink-0" aria-hidden />}
      {actionLabel(busy ? busyLabel : label)}
    </Button>
  );
}

export function CancelActionButton({ label = 'Cancelar', layout = 'inline', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" variant="ghost" className={cx(layoutClass(layout), className)} {...props}>
      <X className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function MarkPaidActionButton({ label = 'Marcar paga', layout = 'compact', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" className={cx(layoutClass(layout), className)} {...props}>
      <CheckCircle2 className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function UndoActionButton({ label = 'Desfazer', layout = 'compact', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" variant="soft" className={cx(layoutClass(layout), className)} {...props}>
      <RotateCcw className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function CloseActionButton({ label = 'Fechar', layout = 'compact', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" variant="soft" className={cx(layoutClass(layout), className)} {...props}>
      <X className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function WhatsAppActionButton({ label = 'WhatsApp', layout = 'compact', className, ...props }: StandardActionProps) {
  return (
    <Button type="button" variant="soft" className={cx(layoutClass(layout), className)} {...props}>
      <MessageCircle className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function DepositActionButton({
  label = 'Entrada',
  layout = 'compact',
  type = 'submit',
  className,
  ...props
}: StandardActionProps) {
  return (
    <Button type={type} variant="primary" className={cx(layoutClass(layout), className)} {...props}>
      <ArrowDownToLine className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}

export function WithdrawalActionButton({
  label = 'Saída',
  layout = 'compact',
  type = 'submit',
  className,
  ...props
}: StandardActionProps) {
  return (
    <Button type={type} variant="soft" className={cx(layoutClass(layout), className)} {...props}>
      <ArrowUpFromLine className="size-4 shrink-0" aria-hidden />
      {actionLabel(label)}
    </Button>
  );
}
