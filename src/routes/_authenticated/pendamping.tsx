import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Users, BookOpen, ListChecks, ClipboardCheck, BarChart3, FileDown, Settings } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { meQuery } from "@/hooks/use-me";

const NAV: NavItem[] = [
  { to: "/pendamping", label: "Dashboard", icon: LayoutDashboard, exact: true, mobile: true },
  { to: "/pendamping/siswa", label: "Data Siswa", icon: Users, mobile: true },
  { to: "/pendamping/materi", label: "Materi", icon: BookOpen, mobile: true },
  { to: "/pendamping/soal", label: "Bank Soal", icon: ListChecks },
  { to: "/pendamping/evaluasi", label: "Latihan & Evaluasi", icon: ClipboardCheck },
  { to: "/pendamping/nilai", label: "Nilai dan Progres", icon: BarChart3, mobile: true },
  { to: "/pendamping/laporan", label: "Laporan", icon: FileDown },
  { to: "/pendamping/pengaturan", label: "Pengaturan Akun", icon: Settings },
];

export const Route = createFileRoute("/_authenticated/pendamping")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/masuk" });
    if (!me.isPendamping) throw redirect({ to: "/siswa" });
  },
  component: () => (
    <AppShell items={NAV} roleLabel="Pendamping">
      <Outlet />
    </AppShell>
  ),
});
