"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircleDollarSign, Home, LogOut, Plus, ReceiptText, Settings, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/firebase/auth";
import { useRequireAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { useRecurringBills } from "@/hooks/useRecurringBills";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/app/expenses/new", label: "Add", icon: Plus },
  { href: "/app/settle-up", label: "Settle", icon: WalletCards },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { appUser, loading } = useRequireAuth();
  const { household, members, loading: householdLoading } = useHousehold();
  const needsOnboarding = !household && !householdLoading && pathname !== "/app/onboarding";
  useRecurringBills(household?.id, members);

  useEffect(() => {
    if (needsOnboarding) {
      router.replace("/app/onboarding");
    }
  }, [needsOnboarding, router]);

  if (loading || !appUser) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-ink/60">Loading CoupleSplit...</div>;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-sage/15 bg-white/85 p-4 backdrop-blur md:block">
        <Link href="/app" className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sage text-white">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold text-ink">CoupleSplit</p>
            <p className="text-xs text-ink/55">{household?.name ?? "Household"}</p>
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-ink/65 transition hover:bg-mist hover:text-ink",
                  active && "bg-mist text-ink"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-mist p-3">
            {appUser.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={appUser.photoURL} alt="" className="h-9 w-9 rounded-full" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-full bg-honey font-bold">{appUser.displayName[0]}</div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{appUser.displayName}</p>
              <p className="truncate text-xs text-ink/55">{appUser.email}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => void signOutUser()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 md:ml-64 md:px-8 md:py-8">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-sage/15 bg-white md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("grid place-items-center gap-1 px-1 py-2 text-[11px] font-semibold text-ink/55", active && "text-sage")}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
