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
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettlements } from "@/hooks/useSettlements";
import { calculateBalances, totalSpendingForMonth } from "@/lib/balances";
import { formatDateLocale } from "@/lib/dates";
import { softDeleteSettlement } from "@/lib/firebase/firestore";
import { formatMoney } from "@/lib/money";
import type { Settlement } from "@/types";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const { appUser } = useAuth();
  const { household, members, partner } = useHousehold();
  const { locale, t } = useLanguage();
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
    showToast({ title: t("dashboard.settlementDeleted") });
    setSettlementToDelete(null);
  }

  return (
    <div className="grid gap-5">
      <SectionHeader
        title={household?.name ?? t("dashboard.title")}
        subtitle={partner ? t("dashboard.withPartner", { name: partner.displayName }) : t("dashboard.waitingPartner")}
        action={<Link href="/app/invite"><Button variant="secondary">{t("dashboard.invite")}</Button></Link>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <BalanceCard balanceMinor={myBalance} />
        <Card>
          <p className="text-sm font-semibold text-text-muted">{t("dashboard.monthIn", { name: household?.name ?? t("common.household") })}</p>
          <p className="mt-2 text-3xl font-bold text-text">{formatMoney(monthTotal, "ILS", locale)}</p>
          <p className="mt-2 text-sm text-text-muted">{t("dashboard.activeExpenses", { count: activeExpenses.length })}</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/app/expenses/new">
          <Button className="w-full"><Plus className="h-4 w-4" />{t("quick.addExpense")}</Button>
        </Link>
        <Link href="/app/expenses#recurring">
          <Button className="w-full" variant="secondary"><CalendarClock className="h-4 w-4" />{t("quick.addRecurring")}</Button>
        </Link>
        <Link href="/app/settle-up">
          <Button className="w-full" variant="secondary"><WalletCards className="h-4 w-4" />{t("quick.settleUp")}</Button>
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-3">
          <SectionHeader title={t("dashboard.recentExpenses")} />
          {activeExpenses.slice(0, 5).length ? (
            activeExpenses.slice(0, 5).map((expense) => <ExpenseCard key={expense.id} expense={expense} members={members} />)
          ) : (
            <EmptyState
              title={t("dashboard.noExpensesTitle")}
              message={t("dashboard.noExpensesMessage")}
              action={<Link href="/app/expenses/new"><Button>{t("quick.addExpense")}</Button></Link>}
            />
          )}
        </section>
        <div className="grid content-start gap-5">
          <RecurringBillsSummary />
          <section className="grid content-start gap-3">
            <SectionHeader title={t("dashboard.recentSettlements")} />
            {activeSettlements.slice(0, 5).length ? (
              activeSettlements.slice(0, 5).map((settlement) => {
                const from = members.find((member) => member.uid === settlement.fromUid)?.displayName ?? t("common.someone");
                const to = members.find((member) => member.uid === settlement.toUid)?.displayName ?? t("common.someoneLower");
                return (
                  <Card key={settlement.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">{t("dashboard.settlementPaid", { from, to })}</p>
                        <p className="mt-1 text-sm text-text-muted">{formatMoney(settlement.amountMinor, "ILS", locale)} - {formatDateLocale(settlement.date, locale)}</p>
                        {settlement.note ? <p className="mt-1 text-xs text-text-muted/80">{settlement.note}</p> : null}
                      </div>
                      <Button variant="ghost" className="h-9 px-2" onClick={() => setSettlementToDelete(settlement)} aria-label={t("dashboard.deleteSettlementTitle")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <EmptyState title={t("dashboard.noSettlementsTitle")} message={t("dashboard.noSettlementsMessage")} />
            )}
          </section>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(settlementToDelete)}
        title={t("dashboard.deleteSettlementTitle")}
        message={t("dashboard.deleteSettlementMessage")}
        confirmLabel={t("common.delete")}
        onCancel={() => setSettlementToDelete(null)}
        onConfirm={() => void removeSettlement()}
      />
    </div>
  );
}
