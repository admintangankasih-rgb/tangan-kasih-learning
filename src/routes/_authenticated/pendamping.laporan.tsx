import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBox, Loading, PageHeader, Panel } from "@/components/common";
import { DataTable, Field, NativeSelect, lastActiveMap, td, useLearningOverview, useStudents } from "@/components/admin-kit";
import { averageScore, isInactive, needsSupport } from "@/lib/student-stats";
import { downloadCsv, formatDateTime, formatScore, inDateRange, jakartaDayKey, LEVELS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pendamping/laporan")({
  head: () => ({ meta: [{ title: "Laporan — Tangan Kasih" }, { name: "description", content: "Ringkasan dan unduhan laporan belajar siswa." }] }),
  component: ReportsPage,
});

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" };

function ReportsPage() {
  const s = useStudents();
  const o = useLearningOverview();
  const [level, setLevel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  if (s.isLoading || o.isLoading) return <Loading />;
  if (s.error || o.error) return <ErrorBox error={s.error ?? o.error} />;
  const d = o.data!;
  const students = s.data!.students.filter((x) => !level || x.level === level);
  const ids = new Set(students.map((x) => x.id));
  const attemptsF = d.attempts.filter((a) => ids.has(a.user_id) && inDateRange(a.submitted_at, from, to));
  const progressF = d.progress.filter((p) => ids.has(p.user_id) && inDateRange(p.last_opened_at, from, to));
  const completedF = d.progress.filter((p) => ids.has(p.user_id) && p.status === "selesai" && inDateRange(p.completed_at, from, to));
  const today = jakartaDayKey(new Date());
  const suffix = `${level || "semua"}${from || to ? `_${from || "awal"}_${to || "kini"}` : ""}_${today}`;
  const last = lastActiveMap([...d.activities, ...d.attempts, ...d.progress]);
  const stu = (id: string) => students.find((x) => x.id === id);
  const subjectOf = (x: unknown) => (x as { name: string } | null)?.name ?? "Lainnya";

  const activeIds = new Set([...attemptsF.map((a) => a.user_id), ...progressF.map((p) => p.user_id)]);
  const passed = attemptsF.filter((a) => a.passed).length;

  // Grafik: rata-rata nilai per mapel & partisipasi per jenjang
  const bySubject = new Map<string, number[]>();
  for (const a of attemptsF) {
    const q = d.quizzes.find((x) => x.id === a.quiz_id);
    const k = subjectOf(q?.subjects);
    bySubject.set(k, [...(bySubject.get(k) ?? []), Number(a.score)]);
  }
  const subjectChart = [...bySubject.entries()].map(([name, sc]) => ({ name, rata: Math.round((averageScore(sc) ?? 0) * 10) / 10, jumlah: sc.length }));
  const levelRows = LEVELS.filter((l) => !level || l === level).map((l) => {
    const st = students.filter((x) => x.level === l);
    const att = attemptsF.filter((a) => stu(a.user_id)?.level === l);
    return { level: l, siswa: st.length, aktif: st.filter((x) => activeIds.has(x.id)).length, kuis: att.length, selesai: completedF.filter((p) => stu(p.user_id)?.level === l).length, rata: averageScore(att.map((a) => Number(a.score))) };
  });

  const summary = () => downloadCsv(`ringkasan-siswa_${suffix}.csv`, ["Nama", "Nama pengguna", "Jenjang", "Status", "Materi selesai", "Jumlah kuis", "Rata-rata", "Perlu pendampingan", "Terakhir aktif"],
    students.map((st) => {
      const scores = attemptsF.filter((a) => a.user_id === st.id).map((a) => Number(a.score));
      const input = { scores, lastActive: last.get(st.id) ?? null, now: Date.now(), supportThreshold: d.settings.support_threshold, inactiveDays: d.settings.inactive_days };
      return [st.display_name, st.username, st.level, st.status, completedF.filter((p) => p.user_id === st.id).length, scores.length, formatScore(averageScore(scores)), needsSupport(input) ? "Ya" : "Tidak", input.lastActive ? formatDateTime(input.lastActive) : (isInactive(input) ? "Belum pernah" : "")];
    }));
  const attempts = () => downloadCsv(`nilai-kuis_${suffix}.csv`, ["Tanggal", "Nama", "Jenjang", "Kuis", "Jenis", "Mapel", "Percobaan", "Nilai", "Lulus"],
    attemptsF.map((a) => {
      const st = stu(a.user_id); const q = d.quizzes.find((x) => x.id === a.quiz_id);
      return [formatDateTime(a.submitted_at), st?.display_name, st?.level, q?.title, q?.kind, subjectOf(q?.subjects), a.attempt_number, formatScore(Number(a.score)), a.passed ? "Ya" : "Tidak"];
    }));
  const progress = () => downloadCsv(`progres-materi_${suffix}.csv`, ["Nama", "Jenjang", "Materi", "Mapel", "Status", "Terakhir dibuka", "Selesai"],
    progressF.map((p) => {
      const st = stu(p.user_id); const m = d.materials.find((x) => x.id === p.material_id);
      return [st?.display_name, st?.level, m?.title, subjectOf(m?.subjects), p.status, formatDateTime(p.last_opened_at), formatDateTime(p.completed_at)];
    }));

  const stats = [
    { t: "Siswa aktif", v: `${activeIds.size} / ${students.length}` },
    { t: "Materi diselesaikan", v: completedF.length },
    { t: "Pengerjaan kuis", v: attemptsF.length },
    { t: "Rata-rata nilai", v: formatScore(averageScore(attemptsF.map((a) => Number(a.score)))) },
    { t: "Tingkat kelulusan", v: attemptsF.length ? `${Math.round((passed / attemptsF.length) * 100)}%` : "-" },
  ];
  const items = [
    { t: "Ringkasan per siswa", d: `${students.length} siswa: materi selesai, rata-rata nilai, status pendampingan.`, f: summary },
    { t: "Nilai semua kuis", d: `${attemptsF.length} pengerjaan latihan dan evaluasi.`, f: attempts },
    { t: "Progres materi", d: `${progressF.length} catatan materi yang dibuka siswa.`, f: progress },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" description="Ringkasan partisipasi dan hasil belajar. Unduhan CSV mengikuti filter yang dipilih." />
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <Field label="Jenjang" htmlFor="r-level"><NativeSelect id="r-level" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Semua jenjang</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</NativeSelect></Field>
        <Field label="Dari tanggal" htmlFor="r-from"><Input id="r-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Sampai tanggal" htmlFor="r-to"><Input id="r-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((x) => <div key={x.t} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{x.t}</p><p className="mt-1 text-2xl font-bold">{x.v}</p></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Rata-rata nilai per mata pelajaran">
          {subjectChart.length ? (
            <div className="h-64"><ResponsiveContainer><BarChart data={subjectChart}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" /><YAxis domain={[0, 100]} fontSize={12} stroke="var(--muted-foreground)" /><Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Rata-rata"]} /><Bar dataKey="rata" fill="var(--primary)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">Belum ada pengerjaan kuis pada filter ini.</p>}
        </Panel>
        <Panel title="Partisipasi per jenjang">
          <div className="h-64"><ResponsiveContainer><BarChart data={levelRows}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="level" fontSize={12} stroke="var(--muted-foreground)" /><YAxis allowDecimals={false} fontSize={12} stroke="var(--muted-foreground)" /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="siswa" name="Jumlah siswa" fill="var(--muted-foreground)" radius={[6, 6, 0, 0]} /><Bar dataKey="aktif" name="Siswa aktif" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
      </div>
      <DataTable head={["Jenjang", "Siswa", "Siswa aktif", "Materi selesai", "Pengerjaan kuis", "Rata-rata"]} empty={!levelRows.length}>
        {levelRows.map((r) => <tr key={r.level}><td className={`${td} font-medium`}>{r.level}</td><td className={td}>{r.siswa}</td><td className={td}>{r.aktif}</td><td className={td}>{r.selesai}</td><td className={td}>{r.kuis}</td><td className={`${td} font-semibold`}>{formatScore(r.rata)}</td></tr>)}
      </DataTable>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <Panel key={i.t} title={i.t}>
            <p className="mb-4 text-sm text-muted-foreground">{i.d}</p>
            <Button onClick={i.f} variant="outline" className="w-full"><Download /> Unduh CSV</Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
