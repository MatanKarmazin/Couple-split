"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, Plus, Trash2, WalletCards } from "lucide-react";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { RecurringBillsSummary } from "@/components/recurring-bills-panel";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useSettlements } from "@/hooks/useSettlements";
import { calculateBalances, totalSpendingForMonth } from "@/lib/balances";
import { formatDate } from "@/lib/dates";
import { softDeleteSettlement } from "@/lib/firebase/firestore";
import { formatMoney } from "@/lib/money";
import type { Settlement } from "@/types";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const { appUser } = useAuth();
  const { household, members, partner } = useHousehold();
  const { activeExpenses } = useExpenses(household?.id);
  const { activeSettlements } = useSettlements(household?.id);
  const { showToast } = useToast();
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null);
  const balances = calculateBalances(activeExpenses, activeSettlements);
  const myBalance = appUser ? balances[appUser.uid] ?? 0 : 0;
  const monthTotal = totalSpendingForMonth(activeExpenses, new Date());

  async function removeSettlement() {
    if (!household || !settlementToDelete) return;
    await softDeleteSettlement(household.id, settlementToDelete.id);
    showToast({ title: "Settlement deleted" });
    setSettlementToDelete(null);
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        title={household?.name ?? "Dashboard"}
        subtitle={partner ? `With ${partner.displayName}` : "Waiting for your partner to join"}
        action={<Link href="/app/invite"><Button variant="secondary">Invite</Button></Link>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <BalanceCard balanceMinor={myBalance} />
        <Card>
          <p className="text-sm font-semibold text-ink/60">Shared spending this month</p>
          <p className="mt-2 text-3xl font-bold text-ink">{formatMoney(monthTotal)}</p>
          <p className="mt-2 text-sm text-ink/55">{activeExpenses.length} active expenses</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/app/expenses/new">
          <Button className="w-full"><Plus className="h-4 w-4" />Add expense</Button>
        </Link>
        <Link href="/app/expenses#recurring">
          <Button className="w-full" variant="secondary"><CalendarClock className="h-4 w-4" />Add recurring</Button>
        </Link>
        <Link href="/app/settle-up">
          <Button className="w-full" variant="secondary"><WalletCards className="h-4 w-4" />Settle up</Button>
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-3">
          <SectionHeader title="Recent expenses" />
          {activeExpenses.slice(0, 5).length ? (
            activeExpenses.slice(0, 5).map((expense) => <ExpenseCard key={expense.id} expense={expense} members={members} />)
          ) : (
            <Card className="text-sm text-ink/60">No expenses yet. Add the first shared cost when you are ready.</Card>
          )}
        </section>
        <div className="grid content-start gap-5">
          <RecurringBillsSummary />
          <section className="grid content-start gap-3">
            <SectionHeader title="Recent settlements" />
            {activeSettlements.slice(0, 5).length ? (
              activeSettlements.slice(0, 5).map((settlement) => {
                const from = members.find((member) => member.uid === settlement.fromUid)?.displayName ?? "Someone";
                const to = members.find((member) => member.uid === settlement.toUid)?.displayName ?? "someone";
                return (
                  <Card key={settlement.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{from} paid {to}</p>
                        <p className="mt-1 text-sm text-ink/60">{formatMoney(settlement.amountMinor)} - {formatDate(settlement.date)}</p>
                      </div>
                      <Button variant="ghost" className="h-9 px-2" onClick={() => setSettlementToDelete(settlement)} aria-label="Delete settlement">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="text-sm text-ink/60">No settlement payments recorded.</Card>
            )}
          </section>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(settlementToDelete)}
        title="Delete this settlement?"
        message="This will remove the payment from balance calculations."
        confirmLabel="Delete"
        onCancel={() => setSettlementToDelete(null)}
        onConfirm={() => void removeSettlement()}
      />
    </div>
  );
}
