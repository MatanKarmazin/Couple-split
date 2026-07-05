import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export function BalanceCard({ balanceMinor }: { balanceMinor: number }) {
  const isOwed = balanceMinor > 0;
  const isOwe = balanceMinor < 0;
  const Icon = isOwed ? ArrowDownLeft : isOwe ? ArrowUpRight : CheckCircle2;
  const label = isOwed ? "You are owed" : isOwe ? "You owe" : "You are settled up";

  return (
    <Card className="bg-ink text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/65">Current balance</p>
          <p className="mt-2 text-3xl font-bold">{isOwe || isOwed ? formatMoney(Math.abs(balanceMinor)) : "₪0.00"}</p>
          <p className="mt-2 text-sm font-semibold text-white/75">{label}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/10">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
