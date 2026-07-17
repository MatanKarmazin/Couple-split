"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { categories } from "@/lib/validators";
import { formatDateLocale, toDate } from "@/lib/dates";
import { categoryLabel } from "@/lib/i18n";

export default function ExpensesPage() {
  const { household, members, activeMembers } = useHousehold();
  const { language, locale, t } = useLanguage();
  const { activeExpenses } = useExpenses(household?.id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [payer, setPayer] = useState("all");
  const [month, setMonth] = useState("");

  const filtered = useMemo(() => {
    return activeExpenses.filter((expense) => {
      const expenseDate = toDate(expense.date);
      const monthValue = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
      return (
        expense.description.toLowerCase().includes(search.toLowerCase()) &&
        (category === "all" || expense.category === category) &&
        (payer === "all" || expense.paidByUid === payer) &&
        (!month || monthValue === month)
      );
    });
  }, [activeExpenses, category, month, payer, search]);

  const groupedExpenses = useMemo(() => {
    return filtered.reduce<Array<{ title: string; expenses: typeof filtered }>>((groups, expense) => {
      const title = formatDateLocale(expense.date, locale, "monthYear");
      const group = groups.find((item) => item.title === title);
      if (group) {
        group.expenses.push(expense);
      } else {
        groups.push({ title, expenses: [expense] });
      }
      return groups;
    }, []);
  }, [filtered, locale]);

  return (
    <div className="grid gap-5">
      <SectionHeader
        title={t("expenses.title")}
        subtitle={t("expenses.subtitle", { household: household?.name ?? t("common.household"), count: filtered.length })}
        action={<Link href="/app/expenses/new?returnTo=%2Fapp%2Fexpenses"><Button><Plus className="h-4 w-4" />{t("nav.add")}</Button></Link>}
      />
      <Card className="grid gap-3 md:grid-cols-4">
        <Input placeholder={t("expenses.search")} value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">{t("expenses.allCategories")}</option>
          {categories.map((item) => <option key={item} value={item}>{categoryLabel(language, item)}</option>)}
        </Select>
        <Select value={payer} onChange={(event) => setPayer(event.target.value)}>
          <option value="all">{t("expenses.anyPayer")}</option>
          {activeMembers.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
        </Select>
        <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
      </Card>
      <div className="grid gap-3">
        {groupedExpenses.length ? (
          groupedExpenses.map((group) => (
            <section key={group.title} className="grid gap-3">
              <h2 className="text-sm font-bold text-text-muted">{group.title}</h2>
              {group.expenses.map((expense) => <ExpenseCard key={expense.id} expense={expense} members={members} />)}
            </section>
          ))
        ) : (
          <EmptyState
            title={activeExpenses.length ? t("expenses.noMatchTitle") : t("dashboard.noExpensesTitle")}
            message={activeExpenses.length ? t("expenses.noMatchMessage") : t("dashboard.noExpensesMessage")}
            action={!activeExpenses.length ? <Link href="/app/expenses/new?returnTo=%2Fapp%2Fexpenses"><Button>{t("quick.addExpense")}</Button></Link> : null}
          />
        )}
      </div>
    </div>
  );
}
