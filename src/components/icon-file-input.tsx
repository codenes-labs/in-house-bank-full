import { useState, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { cx } from './ui';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function IconFileInput({
  accept,
  ariaLabel,
  title = 'Arraste o arquivo aqui',
  hint = 'PNG ou JPG — até 10 MB',
  className,
  onFileSelected,
  onReject,
}: {
  accept: string;
  ariaLabel: string;
  title?: string;
  hint?: string;
  className?: string;
  onFileSelected: (file: File) => void;
  onReject?: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  function pickFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      onReject?.('O arquivo passa de 10 MB.');
      return;
    }
    onFileSelected(file);
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  return (
    <label
      className={cx(
        'flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors',
        dragging
          ? 'border-primary bg-brand-soft'
          : 'border-primary/45 bg-brand-soft/70 hover:border-primary/60 hover:bg-brand-soft',
        className,
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={ariaLabel}
        onChange={(event) => {
          pickFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm dark:bg-primary/15">
        <Upload className="size-5 stroke-[2.25]" aria-hidden />
      </span>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </label>
  );
}
