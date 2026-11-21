import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ErrorBox, LevelBadge, Loading, PageHeader, Panel, Pill, ProgressBar } from "@/components/common";
import { DataTable, Field, NativeSelect, lastActiveMap, td, useLearningOverview, useStudents, useSubjects } from "@/components/admin-kit";
import { averageScore, isInactive, needsSupport } from "@/lib/student-stats";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadStudentReport } from "@/lib/student-report-pdf";
import { errorMessage, formatDateTime, formatScore, inDateRange, LEVELS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pendamping/nilai")({
  head: () => ({ meta: [{ title: "Nilai dan Progres — Tangan Kasih" }, { name: "description", content: "Pantau nilai dan progres belajar siswa." }] }),
  component: GradesPage,
});

function GradesPage() {
  const s = useStudents();
  const o = useLearningOverview();
  const subjects = useSubjects();
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [quiz, setQuiz] = useState("");
  const [student, setStudent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  if (s.isLoading || o.isLoading) return <Loading />;
  if (s.error || o.error) return <ErrorBox error={s.error ?? o.error} />;
  const d = o.data!;
  const last = lastActiveMap([...d.activities, ...d.attempts, ...d.progress]);
  const now = Date.now();
  const inRange = (iso: string | null) => inDateRange(iso, from, to);
  const quizSubject = new Map(d.quizzes.map((q) => [q.id, q.subject_id]));
  const matSubject = new Map(d.materials.map((m) => [m.id, m.subject_id]));
  const attempts = d.attempts.filter((a) => (!quiz || a.quiz_id === quiz) && (!subject || quizSubject.get(a.quiz_id) === subject) && inRange(a.submitted_at));
  const quizOptions = d.quizzes.filter((q) => (!level || q.level === level) && (!subject || q.subject_id === subject));
  const rows = s.data!.students.filter((x) => (!level || x.level === level) && (!student || x.id === student)).map((st) => {
    const att = attempts.filter((a) => a.user_id === st.id);
    const scores = att.map((a) => Number(a.score));
    const total = d.materials.filter((m) => m.is_published && st.level && (m.levels as string[]).includes(st.level) && (!subject || m.subject_id === subject)).length;
    const done = d.progress.filter((p) => p.user_id === st.id && p.status === "selesai" && (!subject || matSubject.get(p.material_id) === subject) && (!from && !to || inRange(p.completed_at))).length;
    const input = { scores, lastActive: last.get(st.id) ?? null, now, supportThreshold: d.settings.support_threshold, inactiveDays: d.settings.inactive_days };
    return { st, att, avg: averageScore(scores), done, total, support: needsSupport(input), inactive: isInactive(input), last: input.lastActive };
  });
  const filtered = !!(level || subject || quiz || student || from || to);
  const reset = () => { setLevel(""); setSubject(""); setQuiz(""); setStudent(""); setFrom(""); setTo(""); };
  const quizTitle = (id: string) => d.quizzes.find((q) => q.id === id)?.title ?? "Kuis";
  const sel = rows.find((r) => r.st.id === open);
  async function pdf(r: (typeof rows)[number]) {
    try {
      await downloadStudentReport({
        student: r.st, avg: r.avg, done: r.done, total: r.total, support: r.support, inactive: r.inactive, lastActive: r.last, supportThreshold: d.settings.support_threshold,
        attempts: r.att.map((a) => { const q = d.quizzes.find((x) => x.id === a.quiz_id); return { quiz: q?.title ?? "Kuis", kind: q?.kind ?? "latihan", attempt: a.attempt_number, score: Number(a.score), passed: a.passed, submitted_at: a.submitted_at }; }),
        materials: d.progress.filter((p) => p.user_id === r.st.id).map((p) => { const m = d.materials.find((x) => x.id === p.material_id); return { title: m?.title ?? "Materi", subject: (m?.subjects as { name: string } | null)?.name ?? "", status: p.status, completed_at: p.completed_at, last_opened_at: p.last_opened_at }; }),
      });
    } catch (e) { toast.error(errorMessage(e, "PDF gagal dibuat.")); }
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Nilai dan Progres" description={`Siswa dengan rata-rata di bawah ${d.settings.support_threshold} ditandai perlu pendampingan.`} />
      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Jenjang" htmlFor="f-level"><NativeSelect id="f-level" value={level} onChange={(e) => { setLevel(e.target.value); setQuiz(""); setStudent(""); }}><option value="">Semua jenjang</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</NativeSelect></Field>
        <Field label="Siswa" htmlFor="f-student"><NativeSelect id="f-student" value={student} onChange={(e) => setStudent(e.target.value)}><option value="">Semua siswa</option>{s.data!.students.filter((x) => !level || x.level === level).map((x) => <option key={x.id} value={x.id}>{x.display_name}</option>)}</NativeSelect></Field>
        <Field label="Mata pelajaran" htmlFor="f-subject"><NativeSelect id="f-subject" value={subject} onChange={(e) => { setSubject(e.target.value); setQuiz(""); }}><option value="">Semua mapel</option>{subjects.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</NativeSelect></Field>
        <Field label="Kuis" htmlFor="f-quiz"><NativeSelect id="f-quiz" value={quiz} onChange={(e) => setQuiz(e.target.value)}><option value="">Semua kuis</option>{quizOptions.map((q) => <option key={q.id} value={q.id}>{q.title} ({q.level})</option>)}</NativeSelect></Field>
        <Field label="Dari tanggal" htmlFor="f-from"><Input id="f-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Sampai tanggal" htmlFor="f-to"><Input id="f-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></Field>
        {filtered && <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-3"><p className="text-xs text-muted-foreground">Nilai, jumlah kuis, dan materi selesai dihitung sesuai filter.</p><Button size="sm" variant="ghost" onClick={reset}>Hapus filter</Button></div>}
      </div>
      <DataTable head={["Siswa", "Jenjang", "Materi selesai", "Kuis", "Rata-rata", "Terakhir aktif", "Catatan", "Laporan"]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.st.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setOpen(r.st.id)}>
            <td className={`${td} font-medium text-primary underline-offset-2 hover:underline`}>{r.st.display_name}</td>
            <td className={td}><LevelBadge level={r.st.level} /></td>
            <td className={`${td} w-40`}><p className="mb-1 text-xs">{r.done}/{r.total}</p><ProgressBar value={r.total ? (r.done / r.total) * 100 : 0} label="Progres materi" /></td>
            <td className={td}>{r.att.length}</td>
            <td className={`${td} font-semibold`}>{formatScore(r.avg)}</td>
            <td className={`${td} text-xs`}>{r.last ? formatDateTime(r.last) : "Belum pernah"}</td>
            <td className={td}><div className="flex flex-wrap gap-1">{r.support && <Pill tone="warning">Perlu pendampingan</Pill>}{r.inactive && <Pill>Tidak aktif</Pill>}</div></td>
            <td className={td}><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); pdf(r); }}><FileText /> PDF</Button></td>
          </tr>
        ))}
      </DataTable>
      {sel && (
        <Panel title={`Riwayat kuis: ${sel.st.display_name}`} action={<button className="text-sm text-muted-foreground" onClick={() => setOpen(null)}>Tutup</button>}>
          <ul className="divide-y">
            {sel.att.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>{quizTitle(a.quiz_id)} <span className="text-muted-foreground">· percobaan {a.attempt_number} · {formatDateTime(a.submitted_at)}</span></span>
                <Pill tone={a.passed ? "success" : "warning"}>{formatScore(Number(a.score))}</Pill>
              </li>
            ))}
            {!sel.att.length && <p className="py-3 text-sm text-muted-foreground">Belum mengerjakan kuis.</p>}
          </ul>
        </Panel>
      )}
    </div>
  );
}
