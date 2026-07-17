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
  const { household, members, activeMembers, partner } = useHousehold();
  const { locale, t } = useLanguage();
  const { activeExpenses } = useExpenses(household?.id);
  const { activeSettlements } = useSettlements(household?.id);
  const { showToast } = useToast();
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null);
  const balances = calculateBalances(activeExpenses, activeSettlements);
  const myBalance = appUser ? balances[appUser.uid] ?? 0 : 0;
  const monthTotal = totalSpendingForMonth(activeExpenses, new Date());
  const householdCurrency = household?.defaultCurrency ?? "ILS";

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
        subtitle={activeMembers.length > 2 ? t("dashboard.memberCount", { count: activeMembers.length }) : partner ? t("dashboard.withPartner", { name: partner.displayName }) : t("dashboard.waitingPartner")}
        action={<Link href="/app/invite"><Button variant="secondary">{t("dashboard.invite")}</Button></Link>}
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <BalanceCard balanceMinor={myBalance} currency={householdCurrency} />
        <Card className="min-w-0 overflow-hidden">
          <p className="break-words text-sm font-semibold text-text-muted">{t("dashboard.monthIn", { name: household?.name ?? t("common.household") })}</p>
          <p className="mt-2 break-words text-2xl font-bold text-text sm:text-3xl">{formatMoney(monthTotal, householdCurrency, locale)}</p>
          <p className="mt-2 break-words text-sm text-text-muted">{t("dashboard.activeExpenses", { count: activeExpenses.length })}</p>
        </Card>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Link href="/app/expenses/new?returnTo=%2Fapp" className="min-w-0">
          <Button className="w-full whitespace-normal text-center"><Plus className="h-4 w-4 shrink-0" />{t("quick.addExpense")}</Button>
        </Link>
        <Link href="/app/expenses/new?mode=recurring" className="min-w-0">
          <Button className="w-full whitespace-normal text-center" variant="secondary"><CalendarClock className="h-4 w-4 shrink-0" />{t("quick.addRecurring")}</Button>
        </Link>
        <Link href="/app/settle-up" className="min-w-0">
          <Button className="w-full whitespace-normal text-center" variant="secondary"><WalletCards className="h-4 w-4 shrink-0" />{t("quick.settleUp")}</Button>
        </Link>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="grid min-w-0 gap-3">
          <SectionHeader title={t("dashboard.recentExpenses")} />
          {activeExpenses.slice(0, 5).length ? (
            activeExpenses.slice(0, 5).map((expense) => <ExpenseCard key={expense.id} expense={expense} members={members} />)
          ) : (
            <EmptyState
              title={t("dashboard.noExpensesTitle")}
              message={t("dashboard.noExpensesMessage")}
              action={<Link href="/app/expenses/new?returnTo=%2Fapp"><Button>{t("quick.addExpense")}</Button></Link>}
            />
          )}
        </section>
        <div className="grid min-w-0 content-start gap-5">
          <RecurringBillsSummary />
          <section className="grid min-w-0 content-start gap-3">
            <SectionHeader title={t("dashboard.recentSettlements")} />
            {activeSettlements.slice(0, 5).length ? (
              activeSettlements.slice(0, 5).map((settlement) => {
                const from = members.find((member) => member.uid === settlement.fromUid)?.displayName ?? t("common.someone");
                const to = members.find((member) => member.uid === settlement.toUid)?.displayName ?? t("common.someoneLower");
                const settlementCurrency = settlement.currency ?? householdCurrency;
                const settlementHouseholdCurrency = settlement.householdCurrency ?? settlementCurrency;
                const showSettlementConverted = settlementCurrency !== settlementHouseholdCurrency && typeof settlement.householdAmountMinor === "number";
                return (
                  <Card key={settlement.id} className="min-w-0 overflow-hidden p-3">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-text">{t("dashboard.settlementPaid", { from, to })}</p>
                        <p className="mt-1 break-words text-sm text-text-muted">
                          {formatMoney(settlement.amountMinor, settlementCurrency, locale)}
                          {showSettlementConverted ? ` / ${formatMoney(settlement.householdAmountMinor ?? 0, settlementHouseholdCurrency, locale)}` : ""}
                          {" - "}{formatDateLocale(settlement.date, locale)}
                        </p>
                        {settlement.note ? <p className="mt-1 break-words text-xs text-text-muted/80">{settlement.note}</p> : null}
                      </div>
                      <Button variant="ghost" className="h-9 shrink-0 px-2" onClick={() => setSettlementToDelete(settlement)} aria-label={t("dashboard.deleteSettlementTitle")}>
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
