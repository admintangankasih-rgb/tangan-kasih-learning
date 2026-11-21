import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStudentData } from "@/hooks/use-student-data";
import { EmptyState, ErrorBox, Loading, PageHeader, Panel, Pill, ProgressBar } from "@/components/common";
import { RecommendationCard } from "@/components/student-widgets";
import { Button } from "@/components/ui/button";
import { average, formatDateTime, formatScore } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/siswa/progres")({
  head: () => ({ meta: [{ title: "Progres Belajar — Tangan Kasih" }, { name: "description", content: "Progres belajar siswa." }] }),
  component: Progres,
});

function Progres() {
  const { me, data, derived, isLoading, error } = useStudentData();
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data || !derived) return null;
  const total = data.materials.length;
  const pct = total ? (derived.completedIds.size / total) * 100 : 0;
  const isNew = data.progress.length === 0 && data.attempts.length === 0;
  const quizById = new Map(data.quizzes.map((q) => [q.id, q]));
  const bySubject = [...new Map(data.materials.map((m) => [m.subject_id, m.subjects?.name ?? ""])).entries()].map(([sid, name]) => {
    const mats = data.materials.filter((m) => m.subject_id === sid);
    const scores = data.attempts.filter((a) => quizById.get(a.quiz_id)?.subject_id === sid).map((a) => Number(a.score));
    return { sid, name, total: mats.length, done: mats.filter((m) => derived.completedIds.has(m.id)).length, avg: average(scores) };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Progres Belajar" description="Perkembangan belajarmu berdasarkan materi selesai dan nilai kuis." />
      {isNew && <EmptyState title="Kamu belum memulai belajar" description="Buka materi pertama dan kerjakan latihannya. Progresmu akan muncul di sini." action={<Button asChild><Link to="/siswa/rekomendasi">Lihat materi yang disarankan</Link></Button>} />}
      <Panel title="Penyelesaian Keseluruhan">
        <div className="flex items-end justify-between"><span className="font-display text-4xl font-extrabold text-primary">{Math.round(pct)}%</span><span className="text-sm text-muted-foreground">{derived.completedIds.size} dari {total} materi</span></div>
        <div className="mt-3"><ProgressBar value={pct} label="Penyelesaian keseluruhan" /></div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Progres per Mata Pelajaran">
          <ul className="space-y-4">
            {bySubject.map((s) => (
              <li key={s.sid}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.name}</span><span className="text-muted-foreground">{s.done}/{s.total} · rata-rata {formatScore(s.avg)}</span></div>
                <ProgressBar value={s.total ? (s.done / s.total) * 100 : 0} tone="teal" />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Rata-rata Nilai per Mapel">
          {bySubject.some((s) => s.avg !== null) ? (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={bySubject.map((s) => ({ mapel: s.name, nilai: s.avg ? Math.round(s.avg) : 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="mapel" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis domain={[0, 100]} width={30} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="nilai" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="Belum ada nilai" />}
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Materi" className="min-w-0">
          <ul className="max-h-80 divide-y overflow-y-auto">
            {data.materials.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <Link to="/siswa/materi/$id" params={{ id: m.id }} className="min-w-0 flex-1 truncate hover:text-primary">{m.title}</Link>
                {derived.completedIds.has(m.id) ? <Pill tone="success">Selesai</Pill> : derived.openedIds.has(m.id) ? <Pill tone="warning">Dibuka</Pill> : <Pill>Belum</Pill>}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Riwayat Kuis" className="min-w-0">
          {data.attempts.length ? (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {data.attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <Link to="/siswa/hasil/$id" params={{ id: a.id }} className="min-w-0 hover:text-primary"><span className="block truncate">{quizById.get(a.quiz_id)?.title}</span><span className="text-xs text-muted-foreground">{formatDateTime(a.submitted_at)}</span></Link>
                  <Pill tone={a.passed ? "success" : "warning"}>{formatScore(Number(a.score))}</Pill>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Belum ada percobaan kuis" />}
        </Panel>
      </div>
      <Panel title="Aktivitas Terbaru">
        {data.activities.length ? (
          <ul className="divide-y text-sm">
            {data.activities.slice(0, 10).map((a) => <li key={a.id} className="flex justify-between gap-2 py-2"><span>{a.description}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span></li>)}
          </ul>
        ) : <EmptyState title="Belum ada aktivitas" />}
      </Panel>
      {derived.recommendations.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold">Langkah Berikutnya</h2>
          <div className="grid gap-4 md:grid-cols-3">{derived.recommendations.slice(0, 3).map((r) => <RecommendationCard key={r.material.id} rec={r} level={me?.level} />)}</div>
        </div>
      )}
    </div>
  );
}
