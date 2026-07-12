import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDateLocale } from "@/lib/dates";
import { categoryLabel, shortSplitTypeLabel } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { Expense, HouseholdMember } from "@/types";

export function ExpenseCard({ expense, members }: { expense: Expense; members: HouseholdMember[] }) {
  const { language, locale, t } = useLanguage();
  const payer = members.find((member) => member.uid === expense.paidByUid)?.displayName ?? t("common.someone");
  const splitSummary = members
    .map((member) => `${member.displayName}: ${formatMoney(expense.shares[member.uid] ?? 0, "ILS", locale)}`)
    .join(" / ");

  return (
    <Link href={`/app/expenses/${expense.id}`} className="block rounded-lg border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-primary">
            <CategoryIcon category={expense.category} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold text-text">{expense.description}</p>
              {expense.recurringBillId ? <Badge>{t("expenses.recurringBadge")}</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-text-muted">{t("expenses.paidByLine", { name: payer, date: formatDateLocale(expense.date, locale) })}</p>
            <p className="mt-1 truncate text-xs text-text-muted/80">{shortSplitTypeLabel(language, expense.splitType)} - {splitSummary}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-text">{formatMoney(expense.amountMinor, "ILS", locale)}</p>
          <Badge className="mt-1">{categoryLabel(language, expense.category)}</Badge>
        </div>
      </div>
    </Link>
  );
}
