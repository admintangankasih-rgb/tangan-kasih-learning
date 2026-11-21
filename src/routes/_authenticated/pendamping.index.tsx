import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, BookOpen, Award, AlertTriangle } from "lucide-react";
import { ErrorBox, LevelBadge, Loading, PageHeader, Panel, Pill, StatCard } from "@/components/common";
import { lastActiveMap, useLearningOverview, useStudents } from "@/components/admin-kit";
import { averageScore, isInactive, needsSupport } from "@/lib/student-stats";
import { formatDateTime, formatScore } from "@/lib/format";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/pendamping/")({
  head: () => ({ meta: [{ title: "Dasbor Pendamping — Tangan Kasih" }, { name: "description", content: "Ringkasan belajar siswa yayasan." }] }),
  component: Overview,
});

function Overview() {
  const me = useMe();
  const s = useStudents();
  const o = useLearningOverview();
  if (s.isLoading || o.isLoading) return <Loading />;
  if (s.error || o.error) return <ErrorBox error={s.error ?? o.error} />;
  const students = s.data!.students;
  const d = o.data!;
  const last = lastActiveMap([...d.activities, ...d.attempts, ...d.progress]);
  const now = Date.now();
  const rows = students.map((st) => {
    const scores = d.attempts.filter((a) => a.user_id === st.id).map((a) => Number(a.score));
    const input = { scores, lastActive: last.get(st.id) ?? null, now, supportThreshold: d.settings.support_threshold, inactiveDays: d.settings.inactive_days };
    return { st, avg: averageScore(scores), support: needsSupport(input), inactive: isInactive(input), last: input.lastActive };
  });
  const allAvg = averageScore(d.attempts.map((a) => Number(a.score)));
  const recent = d.attempts.slice(0, 8);
  const nameOf = (id: string) => students.find((x) => x.id === id)?.display_name ?? "Siswa";
  const quizOf = (id: string) => d.quizzes.find((q) => q.id === id)?.title ?? "Kuis";

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${me?.displayName ?? "Pendamping"}`} description="Ringkasan kegiatan belajar siswa Yayasan Tangan Kasih." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Siswa aktif" value={students.filter((x) => x.status === "aktif").length} hint={`${students.length} akun siswa`} icon={<Users />} />
        <StatCard label="Materi terbit" value={d.materials.filter((m) => m.is_published).length} hint={`${d.materials.length} total materi`} icon={<BookOpen />} tone="teal" />
        <StatCard label="Rata-rata nilai" value={formatScore(allAvg)} hint={`${d.attempts.length} pengerjaan`} icon={<Award />} tone="success" />
        <StatCard label="Perlu pendampingan" value={rows.filter((r) => r.support).length} hint={`Nilai di bawah ${d.settings.support_threshold}`} icon={<AlertTriangle />} tone="highlight" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Siswa yang perlu perhatian" action={<Link to="/pendamping/nilai" className="text-sm font-semibold text-primary">Lihat semua</Link>}>
          <ul className="divide-y">
            {rows.filter((r) => r.support || r.inactive).slice(0, 8).map((r) => (
              <li key={r.st.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.st.display_name} <LevelBadge level={r.st.level} /></p>
                  <p className="text-xs text-muted-foreground">Terakhir aktif: {r.last ? formatDateTime(r.last) : "belum pernah"}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.support && <Pill tone="warning">Nilai {formatScore(r.avg)}</Pill>}
                  {r.inactive && <Pill tone="muted">Tidak aktif</Pill>}
                </div>
              </li>
            ))}
            {!rows.some((r) => r.support || r.inactive) && <p className="py-4 text-sm text-muted-foreground">Semua siswa aktif dan nilainya baik.</p>}
          </ul>
        </Panel>
        <Panel title="Pengerjaan terbaru">
          <ul className="divide-y">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{nameOf(a.user_id)}</p>
                  <p className="truncate text-xs text-muted-foreground">{quizOf(a.quiz_id)} · {formatDateTime(a.submitted_at)}</p>
                </div>
                <Pill tone={a.passed ? "success" : "warning"}>{formatScore(Number(a.score))}</Pill>
              </li>
            ))}
            {!recent.length && <p className="py-4 text-sm text-muted-foreground">Belum ada siswa yang mengerjakan kuis.</p>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
