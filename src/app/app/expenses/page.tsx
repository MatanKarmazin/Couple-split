"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { RecurringBillsPanel } from "@/components/recurring-bills-panel";
import { Button } from "@/components/ui/button";
import { Card, SectionHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { useExpenses } from "@/hooks/useExpenses";
import { useHousehold } from "@/hooks/useHousehold";
import { categories } from "@/lib/validators";
import { formatDate, toDate } from "@/lib/dates";

export default function ExpensesPage() {
  const { household, members } = useHousehold();
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
      const title = formatDate(expense.date, "MMMM yyyy");
      const group = groups.find((item) => item.title === title);
      if (group) {
        group.expenses.push(expense);
      } else {
        groups.push({ title, expenses: [expense] });
      }
      return groups;
    }, []);
  }, [filtered]);

  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Expenses"
        subtitle={`${household?.name ?? "Household"} - ${filtered.length} shown`}
        action={<Link href="/app/expenses/new"><Button><Plus className="h-4 w-4" />Add</Button></Link>}
      />
      <RecurringBillsPanel />
      <Card className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </Select>
        <Select value={payer} onChange={(event) => setPayer(event.target.value)}>
          <option value="all">Any payer</option>
          {members.map((member) => <option key={member.uid} value={member.uid}>{member.displayName}</option>)}
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
            title={activeExpenses.length ? "No expenses match these filters" : "No expenses yet"}
            message={activeExpenses.length ? "Try a different search, category, payer, or month." : "Add the first shared cost when you are ready."}
            action={!activeExpenses.length ? <Link href="/app/expenses/new"><Button>Add expense</Button></Link> : null}
          />
        )}
      </div>
    </div>
  );
}
