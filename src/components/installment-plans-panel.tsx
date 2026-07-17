"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useHousehold } from "@/hooks/useHousehold";
import { useInstallmentPlans } from "@/hooks/useInstallmentPlans";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDateLocale } from "@/lib/dates";
import { softDeleteInstallmentPlan, toggleInstallmentPlan } from "@/lib/firebase/firestore";
import { formatMoney } from "@/lib/money";
import type { InstallmentPlan } from "@/types";

export function InstallmentPlansPanel() {
  const { household, members, activeMembers } = useHousehold();
  const { activeInstallmentPlans } = useInstallmentPlans(household?.id, activeMembers);
  const { locale, t } = useLanguage();
  const [confirmPlan, setConfirmPlan] = useState<InstallmentPlan | null>(null);

  async function togglePlan(plan: InstallmentPlan) {
    if (!household) return;
    await toggleInstallmentPlan(household.id, plan.id, !plan.active);
  }

  async function deletePlan() {
    if (!household || !confirmPlan) return;
    await softDeleteInstallmentPlan(household.id, confirmPlan.id);
    setConfirmPlan(null);
  }

  return (
    <Card className="grid gap-3">
      <div>
        <h2 className="text-base font-bold text-text">{t("installments.title")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("installments.subtitle")}</p>
      </div>
      {activeInstallmentPlans.length ? (
        <div className="grid gap-2">
          {activeInstallmentPlans.map((plan) => {
            const payer = members.find((member) => member.uid === plan.paidByUid)?.displayName ?? t("common.someone");
            return (
              <div key={plan.id} className="grid min-w-0 gap-3 rounded-lg border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-bold text-text">{plan.description}</p>
                    <Badge>{plan.active ? t("recurring.activeBadge") : t("recurring.pausedBadge")}</Badge>
                  </div>
                  <p className="mt-1 break-words text-xs text-text-muted">
                    {t("installments.planLine", {
                      amount: formatMoney(plan.totalAmountMinor, "ILS", locale),
                      count: plan.installmentCount,
                      payer,
                      date: formatDateLocale(plan.firstPaymentDate, locale)
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="h-9 px-3" onClick={() => void togglePlan(plan)}>
                    {plan.active ? t("recurring.pause") : t("recurring.resume")}
                  </Button>
                  <Button variant="danger" className="h-9 px-3" onClick={() => setConfirmPlan(plan)}>
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t("installments.empty")}</p>
      )}
      <ConfirmDialog
        open={Boolean(confirmPlan)}
        title={t("installments.deleteTitle")}
        message={t("installments.deleteMessage")}
        confirmLabel={t("common.delete")}
        onCancel={() => setConfirmPlan(null)}
        onConfirm={() => void deletePlan()}
      />
    </Card>
  );
}
