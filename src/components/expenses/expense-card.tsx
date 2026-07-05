import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Expense, HouseholdMember } from "@/types";

export function ExpenseCard({ expense, members }: { expense: Expense; members: HouseholdMember[] }) {
  const payer = members.find((member) => member.uid === expense.paidByUid)?.displayName ?? "Someone";

  return (
    <Link href={`/app/expenses/${expense.id}`} className="block rounded-lg border border-sage/15 bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mist text-sage">
            <CategoryIcon category={expense.category} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{expense.description}</p>
            <p className="mt-1 text-xs text-ink/55">Paid by {payer} · {formatDate(expense.date)}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-ink">{formatMoney(expense.amountMinor)}</p>
          <Badge className="mt-1">{expense.category}</Badge>
        </div>
      </div>
    </Link>
  );
}
