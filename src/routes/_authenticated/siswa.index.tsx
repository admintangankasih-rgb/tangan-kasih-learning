import { createFileRoute, Link } from "@tanstack/react-router";
import { BookCheck, Star, PencilLine, TrendingUp, PlayCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStudentData } from "@/hooks/use-student-data";
import { EmptyState, ErrorBox, LevelBadge, Loading, Panel, ProgressBar, StatCard, Pill } from "@/components/common";
import { RecommendationCard } from "@/components/student-widgets";
import { Button } from "@/components/ui/button";
import { average, formatDateTime, formatScore, jakartaDayKey, lastNDays, LEVEL_LABEL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/siswa/")({
  head: () => ({ meta: [{ title: "Dashboard Siswa — Tangan Kasih" }, { name: "description", content: "Ringkasan belajar siswa." }] }),
  component: Dashboard,
});

function motivation(pct: number, avg: number | null) {
  if (pct === 0) return "Setiap perjalanan dimulai dari langkah pertama. Yuk buka satu materi hari ini!";
  if (avg !== null && avg < 60) return "Tidak apa-apa belum sempurna. Ulangi materinya pelan-pelan, kamu pasti bisa.";
  if (pct >= 80) return "Hebat! Hampir semua materi sudah kamu tuntaskan.";
  return "Kerja bagus! Teruskan belajar sedikit demi sedikit setiap hari.";
}

function Dashboard() {
  const { me, data, derived, isLoading, error } = useStudentData();
  if (isLoading || !me) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data || !derived) return null;

  const total = data.materials.length;
  const done = derived.completedIds.size;
  const pct = total ? (done / total) * 100 : 0;
  const avg = average(data.attempts.map((a) => Number(a.score)));
  const cont = data.progress
    .filter((p) => p.status === "dibuka")
    .sort((a, b) => b.last_opened_at.localeCompare(a.last_opened_at))
    .map((p) => data.materials.find((m) => m.id === p.material_id))
    .find(Boolean);

  const subjects = new Map<string, { name: string; total: number; done: number }>();
  for (const m of data.materials) {
    const s = subjects.get(m.subject_id) ?? { name: m.subjects?.name ?? "", total: 0, done: 0 };
    s.total++;
    if (derived.completedIds.has(m.id)) s.done++;
    subjects.set(m.subject_id, s);
  }
  const days = lastNDays(7);
  const chart = days.map((d) => ({ hari: d.label, aktivitas: data.activities.filter((a) => a.type !== "masuk" && jakartaDayKey(a.created_at) === d.key).length }));
  const quizTitle = new Map(data.quizzes.map((q) => [q.id, q.title]));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-hero p-5 text-primary-foreground shadow-lift sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={me.level} className="bg-primary-foreground text-primary" />
          <span className="text-sm text-primary-foreground/80">{me.level && LEVEL_LABEL[me.level]}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Halo, {me.displayName}! 👋</h1>
        <p className="mt-1 max-w-xl text-primary-foreground/85">{motivation(pct, avg)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Materi Selesai" value={`${done}/${total}`} icon={<BookCheck />} />
        <StatCard label="Rata-rata Nilai" value={formatScore(avg)} icon={<Star />} tone="highlight" />
        <StatCard label="Latihan Dikerjakan" value={data.attempts.length} hint="total percobaan" icon={<PencilLine />} tone="teal" />
        <StatCard label="Progres Belajar" value={`${Math.round(pct)}%`} icon={<TrendingUp />} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Lanjutkan Belajar" className="lg:col-span-1">
          {cont ? (
            <div>
              <Pill tone="primary">{cont.subjects?.name}</Pill>
              <p className="mt-2 font-bold">{cont.title}</p>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{cont.summary}</p>
              <Button asChild className="mt-4 w-full"><Link to="/siswa/materi/$id" params={{ id: cont.id }}><PlayCircle /> Lanjutkan</Link></Button>
            </div>
          ) : (
            <EmptyState title="Belum ada materi yang sedang dipelajari" action={<Button asChild size="sm"><Link to="/siswa/materi">Pilih Materi</Link></Button>} />
          )}
        </Panel>
        <Panel title="Aktivitas 7 Hari Terakhir" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, "Aktivitas"]} />
                <Bar dataKey="aktivitas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Rekomendasi Materi" action={<Link to="/siswa/rekomendasi" className="text-sm font-semibold text-primary hover:underline">Lihat semua</Link>}>
        {derived.recommendations.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {derived.recommendations.slice(0, 3).map((r) => <RecommendationCard key={r.material.id} rec={r} level={me.level} />)}
          </div>
        ) : <EmptyState title="Semua materi sudah kamu kuasai" description="Luar biasa! Tunggu materi baru dari pendamping." />}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Mata Pelajaran">
          {subjects.size ? (
            <ul className="space-y-4">
              {[...subjects.values()].map((s) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.name}</span><span className="text-muted-foreground">{s.done}/{s.total} materi</span></div>
                  <ProgressBar value={(s.done / s.total) * 100} tone="teal" label={`Progres ${s.name}`} />
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Belum ada materi untuk jenjangmu" />}
        </Panel>
        <Panel title="Hasil Kuis Terbaru">
          {data.attempts.length ? (
            <ul className="divide-y">
              {data.attempts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link to="/siswa/hasil/$id" params={{ id: a.id }} className="block truncate text-sm font-medium hover:text-primary">{quizTitle.get(a.quiz_id) ?? "Kuis"}</Link>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.submitted_at)}</p>
                  </div>
                  <Pill tone={a.passed ? "success" : "warning"}>{formatScore(Number(a.score))}</Pill>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Belum ada kuis yang dikerjakan" action={<Button asChild size="sm" variant="outline"><Link to="/siswa/latihan">Ke Latihan Soal</Link></Button>} />}
        </Panel>
      </div>
    </div>
  );
}
