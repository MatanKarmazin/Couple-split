import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-text",
        className
      )}
      {...props}
    />
  );
}
