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
  const participantCount = expense.participants.length;
  const compactSplitSummary = `${shortSplitTypeLabel(language, expense.splitType)} - ${participantCount} ${participantCount === 1 ? "person" : "people"}`;
  const fullSplitSummary = expense.participants
    .map((uid) => {
      const member = members.find((item) => item.uid === uid);
      return `${member?.displayName ?? uid}: ${formatMoney(expense.shares[uid] ?? 0, "ILS", locale)}`;
    })
    .join(" / ");

  return (
    <Link href={`/app/expenses/${expense.id}`} className="block w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="row-span-2 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-primary sm:row-span-1">
          <CategoryIcon category={expense.category} />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="min-w-0 break-words text-sm font-bold text-text">{expense.description}</p>
            {expense.recurringBillId ? <Badge className="shrink-0">{t("expenses.recurringBadge")}</Badge> : null}
            {expense.installmentPlanId ? (
              <Badge className="shrink-0">
                {t("installments.badge", { index: expense.installmentIndex ?? 1, count: expense.installmentCount ?? 1 })}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 break-words text-xs text-text-muted">{t("expenses.paidByLine", { name: payer, date: formatDateLocale(expense.date, locale) })}</p>
          <p className="mt-1 break-words text-xs text-text-muted/80 sm:hidden">{compactSplitSummary}</p>
          <p className="mt-1 hidden break-words text-xs text-text-muted/80 sm:block">{shortSplitTypeLabel(language, expense.splitType)} - {fullSplitSummary}</p>
        </div>
        <div className="col-start-2 min-w-0 text-left sm:col-start-auto sm:text-right rtl:text-right">
          <p className="break-words text-sm font-bold text-text">{formatMoney(expense.amountMinor, "ILS", locale)}</p>
          <Badge className="mt-1 max-w-full break-words">{categoryLabel(language, expense.category)}</Badge>
        </div>
      </div>
    </Link>
  );
}
