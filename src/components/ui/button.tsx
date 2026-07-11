import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-white shadow-soft hover:bg-primary/90 dark:text-background",
        variant === "secondary" && "border border-border bg-surface text-text hover:bg-surface-muted",
        variant === "ghost" && "bg-transparent text-text hover:bg-surface-muted",
        variant === "danger" && "bg-danger text-white hover:bg-danger/90",
        className
      )}
      {...props}
    />
  );
}
