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
        variant === "primary" && "bg-sage text-white shadow-soft hover:bg-sage/90",
        variant === "secondary" && "border border-sage/20 bg-white text-ink hover:bg-mist",
        variant === "ghost" && "bg-transparent text-ink hover:bg-mist",
        variant === "danger" && "bg-coral text-white hover:bg-coral/90",
        className
      )}
      {...props}
    />
  );
}
