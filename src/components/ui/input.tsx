import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, children }: FieldProps & { children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-text">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-text-muted">{hint}</span> : null}
      {error ? <span className="text-xs font-semibold text-danger">{error}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-11 rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted/60",
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
        "focus-ring h-11 rounded-md border border-border bg-surface px-3 text-sm text-text",
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
        "focus-ring min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/60",
        className
      )}
      {...props}
    />
  );
}
