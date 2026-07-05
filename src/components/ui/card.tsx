import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-sage/15 bg-white p-4 shadow-soft", className)} {...props} />;
}

export function SectionHeader({
  title,
  action,
  subtitle
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink/60">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
