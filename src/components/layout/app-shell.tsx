"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarClock, CircleDollarSign, Home, LogOut, Plus, ReceiptText, Settings, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { signOutUser } from "@/lib/firebase/auth";
import { switchHousehold } from "@/lib/firebase/firestore";
import { useRequireAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useLanguage } from "@/hooks/useLanguage";
import { useRecurringBills } from "@/hooks/useRecurringBills";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", labelKey: "nav.home", icon: Home },
  { href: "/app/expenses", labelKey: "nav.expenses", icon: ReceiptText },
  { href: "/app/expenses/new", labelKey: "nav.add", icon: Plus },
  { href: "/app/settle-up", labelKey: "nav.settle", icon: WalletCards },
  { href: "/app/settings", labelKey: "nav.settings", icon: Settings }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { appUser, loading } = useRequireAuth();
  const { household, households, activeMembers, loading: householdLoading } = useHousehold();
  const { t } = useLanguage();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const hasKnownHouseholdId = Boolean(appUser?.defaultHouseholdId || appUser?.householdIds?.length);
  const needsOnboarding =
    !loading &&
    Boolean(appUser) &&
    !householdLoading &&
    !household &&
    !hasKnownHouseholdId &&
    households.length === 0 &&
    pathname !== "/app/onboarding";
  useRecurringBills(household?.id, activeMembers);

  useEffect(() => {
    if (needsOnboarding) {
      router.replace("/app/onboarding");
    }
  }, [needsOnboarding, router]);

  if (loading || !appUser) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-text-muted">{t("common.loadingApp")}</div>;
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-border bg-surface/85 p-4 backdrop-blur rtl:left-auto rtl:right-0 rtl:border-l rtl:border-r-0 md:block">
        <Link href="/app" className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white dark:text-background">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold text-text">CoupleSplit</p>
            <p className="text-xs text-text-muted">{household?.name ?? t("common.household")}</p>
          </div>
        </Link>
        <nav className="grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-muted hover:text-text",
                  active && "bg-surface-muted text-text"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        {households.length > 1 ? (
          <label className="mt-4 grid gap-1.5 text-xs font-bold text-text-muted">
            {t("settings.switchHousehold")}
            <Select
              value={household?.id ?? ""}
              onChange={(event) => appUser ? void switchHousehold(appUser.uid, event.target.value) : undefined}
            >
              {households.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </label>
        ) : null}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-surface-muted p-3">
            {appUser.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appUser.photoURL} alt="" className="h-9 w-9 rounded-full" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent font-bold text-text">{appUser.displayName[0]}</div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-text">{appUser.displayName}</p>
              <p className="truncate text-xs text-text-muted">{appUser.email}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => void signOutUser()}>
            <LogOut className="h-4 w-4" />
            {t("nav.signOut")}
          </Button>
        </div>
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-4 py-5 md:ml-64 md:px-8 md:py-8 rtl:md:ml-auto rtl:md:mr-64">{children}</main>
      {quickAddOpen ? (
        <div className="fixed inset-x-4 z-40 grid max-w-full gap-2 rounded-lg border border-border bg-surface p-3 shadow-soft md:hidden" style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
          <Link href="/app/expenses/new" onClick={() => setQuickAddOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-text hover:bg-surface-muted">
            <Plus className="h-4 w-4 text-primary" />
            {t("quick.addExpense")}
          </Link>
          <Link href="/app/expenses#recurring" onClick={() => setQuickAddOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-text hover:bg-surface-muted">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t("quick.addRecurring")}
          </Link>
          <Link href="/app/settle-up" onClick={() => setQuickAddOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold text-text hover:bg-surface-muted">
            <WalletCards className="h-4 w-4 text-primary" />
            {t("quick.settleUp")}
          </Link>
        </div>
      ) : null}
      <button
        type="button"
        className="fixed inset-x-0 z-50 mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-soft dark:text-background md:hidden"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        onClick={() => setQuickAddOpen((value) => !value)}
        aria-label={quickAddOpen ? t("common.cancel") : t("nav.add")}
      >
        {quickAddOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.filter((item) => item.href !== "/app/expenses/new").map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("grid place-items-center gap-1 px-1 py-2 text-[11px] font-semibold text-text-muted", active && "text-primary")}
            >
              <Icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
