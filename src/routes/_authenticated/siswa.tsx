import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, PencilLine, ClipboardCheck, Compass, TrendingUp, UserRound } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { meQuery } from "@/hooks/use-me";

const NAV: NavItem[] = [
  { to: "/siswa", label: "Dashboard", icon: LayoutDashboard, exact: true, mobile: true },
  { to: "/siswa/materi", label: "Materi Pembelajaran", icon: BookOpen, mobile: true },
  { to: "/siswa/latihan", label: "Latihan Soal", icon: PencilLine, mobile: true },
  { to: "/siswa/evaluasi", label: "Evaluasi", icon: ClipboardCheck },
  { to: "/siswa/rekomendasi", label: "Rekomendasi Materi", icon: Compass, mobile: true },
  { to: "/siswa/progres", label: "Progres Belajar", icon: TrendingUp },
  { to: "/siswa/profil", label: "Profil Saya", icon: UserRound },
];

export const Route = createFileRoute("/_authenticated/siswa")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/masuk" });
    if (!me.isSiswa) throw redirect({ to: me.isPendamping ? "/pendamping" : "/masuk" });
  },
  component: () => (
    <AppShell items={NAV} roleLabel="Siswa">
      <Outlet />
    </AppShell>
  ),
});
