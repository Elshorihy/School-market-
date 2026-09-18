import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FieldWrap({ label, error, hint, required, htmlFor, children, className }: FieldWrapProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, required, id, className, ...rest }: InputProps) {
  const inputId = id ?? (label ? `f-${label.replace(/\s+/g, '-')}` : undefined);
  return (
    <FieldWrap label={label} error={error} hint={hint} required={required} htmlFor={inputId}>
      <input
        id={inputId}
        required={required}
        className={cn('input', error && 'ring-rose-400 focus:ring-rose-500 dark:ring-rose-500', className)}
        {...rest}
      />
    </FieldWrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  hint,
  required,
  id,
  className,
  placeholder,
  options,
  children,
  ...rest
}: SelectProps) {
  const selectId = id ?? (label ? `f-${label.replace(/\s+/g, '-')}` : undefined);
  return (
    <FieldWrap label={label} error={error} hint={hint} required={required} htmlFor={selectId}>
      <select id={selectId} required={required} className={cn('input appearance-none', className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
    </FieldWrap>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, required, id, className, ...rest }: TextareaProps) {
  const textareaId = id ?? (label ? `f-${label.replace(/\s+/g, '-')}` : undefined);
  return (
    <FieldWrap label={label} error={error} hint={hint} required={required} htmlFor={textareaId}>
      <textarea
        id={textareaId}
        required={required}
        className={cn('input min-h-28 resize-y', className)}
        {...rest}
      />
    </FieldWrap>
  );
}
