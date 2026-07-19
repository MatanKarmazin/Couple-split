import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, children }: FieldProps & { children: React.ReactNode }) {
  return (
    <label className="grid w-full min-w-0 gap-1.5 overflow-hidden text-sm font-medium text-text">
      <span className="min-w-0 break-words">{label}</span>
      {children}
      {hint ? <span className="min-w-0 break-words text-xs font-normal text-text-muted">{hint}</span> : null}
      {error ? <span className="min-w-0 break-words text-xs font-semibold text-danger">{error}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-11 w-full min-w-0 max-w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted/60",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring h-11 w-full min-w-0 max-w-full appearance-none truncate overflow-hidden text-ellipsis rounded-md border border-border bg-surface px-3 py-0 pe-9 text-sm text-text",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-24 w-full min-w-0 max-w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/60",
        className
      )}
      {...props}
    />
  );
}
