import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  message,
  action
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="grid justify-items-start gap-3 border-dashed bg-surface-muted/60 text-sm">
      <div>
        <p className="font-bold text-text">{title}</p>
        <p className="mt-1 text-text-muted">{message}</p>
      </div>
      {action}
    </Card>
  );
}
