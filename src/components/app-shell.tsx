import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode, type ComponentType } from "react";
import { LogOut, Menu } from "lucide-react";
import { Logo, LevelBadge } from "./common";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  mobile?: boolean;
}

function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/masuk", replace: true });
  };
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const signOut = useSignOut();
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Menu dasbor">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          onClick={onNavigate}
          activeOptions={{ exact: !!it.exact }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
        >
          <it.icon className="size-5 shrink-0" />
          {it.label}
        </Link>
      ))}
      <button onClick={signOut} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive-soft">
        <LogOut className="size-5" /> Keluar
      </button>
    </nav>
  );
}

export function AppShell({ items, roleLabel, children }: { items: NavItem[]; roleLabel: string; children: ReactNode }) {
  const me = useMe();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const mobileItems = items.filter((i) => i.mobile);

  const userBox = (
    <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
        {(me?.displayName ?? "?").slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{me?.displayName ?? "…"}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {roleLabel} <LevelBadge level={me?.level} />
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-5 border-r bg-sidebar p-4 lg:flex">
        <Logo />
        {userBox}
        <NavList items={items} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:hidden">
        <Logo className="text-base" />
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg hover:bg-accent" aria-label="Buka menu">
          <Menu />
        </button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-5 bg-sidebar p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo />
          {userBox}
          <NavList items={items} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className={cn("mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8", mobileItems.length && "pb-24 lg:pb-8")}>{children}</main>

      {mobileItems.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-card lg:hidden" style={{ gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))` }} aria-label="Navigasi bawah">
          {mobileItems.map((it) => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                <it.icon className="size-5" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
