import type { ReactNode } from "react";
import { Loader2, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export function Logo({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-3 font-display text-lg font-bold",
        light ? "text-primary-foreground" : "text-primary",
        className
      )}
    >
      <img
        src="/favicon.png"
        alt="Logo Yayasan Sosial Tangan Kasih"
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 object-contain"
      />

      <span>Tangan Kasih</span>
    </Link>
  );
}


export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4 shadow-card sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-bold sm:text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  primary: "bg-primary-soft text-primary",
  teal: "bg-teal-soft text-teal",
  highlight: "bg-highlight-soft text-highlight-foreground",
  success: "bg-success-soft text-success",
} as const;

export function StatCard({ label, value, hint, icon, tone = "primary" }: { label: string; value: ReactNode; hint?: ReactNode; icon: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-soft">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl [&_svg]:size-5", TONES[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6">{icon ?? <Inbox />}</span>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  const msg = error && typeof error === "object" && "message" in error ? String((error as { message: string }).message) : "Data gagal dimuat.";
  return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive">Gagal memuat data: {msg}</div>;
}

export function LevelBadge({ level, className }: { level: string | null | undefined; className?: string }) {
  if (!level) return null;
  const tone = level === "SD" ? "bg-highlight-soft text-highlight-foreground" : level === "SMP" ? "bg-teal-soft text-teal" : "bg-primary-soft text-primary";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", tone, className)}>{level}</span>;
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "warning" | "primary" | "teal" | "destructive" }) {
  const t = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    primary: "bg-primary-soft text-primary",
    teal: "bg-teal-soft text-teal",
    destructive: "bg-destructive-soft text-destructive",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function ProgressBar({ value, tone = "primary", label }: { value: number; tone?: "primary" | "teal" | "success"; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bar = { primary: "bg-primary", teal: "bg-teal", success: "bg-success" }[tone];
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ConfirmAction({ trigger, title, description, confirmLabel = "Ya, lanjutkan", onConfirm, destructive = true }: {
  trigger: ReactNode; title: string; description: ReactNode; confirmLabel?: string; onConfirm: () => void; destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SampleNotice() {
  return (
    <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
      Konten contoh — belum diverifikasi sebagai materi yang selaras dengan kurikulum resmi.
    </p>
  );
}
