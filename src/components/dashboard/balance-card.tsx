import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { formatMoney } from "@/lib/money";

export function BalanceCard({ balanceMinor }: { balanceMinor: number }) {
  const { locale, t } = useLanguage();
  const isOwed = balanceMinor > 0;
  const isOwe = balanceMinor < 0;
  const Icon = isOwed ? ArrowDownLeft : isOwe ? ArrowUpRight : CheckCircle2;
  const label = isOwed ? t("balance.owed") : isOwe ? t("balance.owe") : t("balance.settled");

  return (
    <Card className="min-w-0 overflow-hidden bg-text text-surface">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface/65">{t("balance.current")}</p>
          <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">{formatMoney(Math.abs(balanceMinor), "ILS", locale)}</p>
          <p className="mt-2 break-words text-sm font-semibold text-surface/75">{label}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface/10">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
