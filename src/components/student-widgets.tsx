import { Link } from "@tanstack/react-router";
import { Clock, CheckCircle2, ArrowRight, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LevelBadge, Pill, EmptyState } from "./common";
import type { Recommendation } from "@/lib/recommendations";
import { DIFFICULTY_LABEL, formatDate, formatScore } from "@/lib/format";
import type { StudentMaterial } from "@/hooks/use-student-data";

const CAT_TONE = { Prasyarat: "warning", "Perlu Latihan": "destructive", "Materi Berikutnya": "teal", "Belum Dipelajari": "primary" } as const;

export function RecommendationCard({ rec, level }: { rec: Recommendation; level: string | null | undefined }) {
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={CAT_TONE[rec.category]}>{rec.category}</Pill>
        <Pill>{rec.material.subject_name}</Pill>
        <LevelBadge level={level} />
      </div>
      <h3 className="mt-3 font-bold">{rec.material.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{rec.reason}</p>
      <Button asChild size="sm" className="mt-4 self-start">
        <Link to="/siswa/materi/$id" params={{ id: rec.material.id }}>Mulai Belajar <ArrowRight /></Link>
      </Button>
    </article>
  );
}

export function MaterialCard({ m, done, opened }: { m: StudentMaterial; done: boolean; opened: boolean }) {
  return (
    <article className="flex flex-col rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <Pill tone="primary">{m.subjects?.name}</Pill>
        {done ? <Pill tone="success"><CheckCircle2 className="size-3" /> Selesai</Pill> : opened ? <Pill tone="warning">Sedang dipelajari</Pill> : <Pill>Belum dimulai</Pill>}
      </div>
      <h3 className="mt-3 font-bold">{m.title}</h3>
      <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-3">{m.summary}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="size-3.5" /> {m.duration_minutes} menit</span>
        <span>{DIFFICULTY_LABEL[m.difficulty]}</span>
        {m.topic && <span className="min-w-0 truncate">{m.topic}</span>}
      </div>
      <Button asChild variant={done ? "outline" : "default"} size="sm" className="mt-4 self-start">
        <Link to="/siswa/materi/$id" params={{ id: m.id }}>Pelajari Materi</Link>
      </Button>
    </article>
  );
}

interface QuizRow { id: string; title: string; description: string; kind: string; passing_score: number; allow_retake: boolean; max_attempts: number | null; available_from: string | null; available_until: string | null; subjects: { name: string } | null; subject_id: string }
interface AttemptRow { quiz_id: string; score: number; submitted_at: string; id: string }

export function QuizList({ quizzes, attempts, emptyTitle }: { quizzes: QuizRow[]; attempts: AttemptRow[]; emptyTitle: string }) {
  if (!quizzes.length) return <EmptyState title={emptyTitle} description="Pendamping belum menerbitkan kuis untuk jenjangmu." />;
  const now = Date.now();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quizzes.map((q) => {
        const mine = attempts.filter((a) => a.quiz_id === q.id);
        const best = mine.length ? Math.max(...mine.map((a) => Number(a.score))) : null;
        const closed = (q.available_from && new Date(q.available_from).getTime() > now) || (q.available_until && new Date(q.available_until).getTime() < now);
        const exhausted = (mine.length > 0 && !q.allow_retake) || (q.max_attempts !== null && mine.length >= q.max_attempts);
        return (
          <article key={q.id} className="flex flex-col rounded-2xl border bg-card p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="primary">{q.subjects?.name}</Pill>
              <Pill>Nilai lulus {q.passing_score}</Pill>
              {best !== null && <Pill tone={best >= q.passing_score ? "success" : "warning"}><Trophy className="size-3" /> Terbaik {formatScore(best)}</Pill>}
            </div>
            <h3 className="mt-3 font-bold">{q.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{q.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {mine.length} percobaan · {q.allow_retake ? (q.max_attempts ? `maks. ${q.max_attempts} kali` : "boleh diulang") : "hanya 1 kali"}
              {q.available_until && ` · ditutup ${formatDate(q.available_until, true)}`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {closed ? <Pill>Belum/tidak tersedia</Pill> : exhausted ? <Pill>Batas percobaan tercapai</Pill> : (
                <Button asChild size="sm"><Link to="/siswa/kuis/$id" params={{ id: q.id }}>{mine.length ? <><RotateCcw /> Kerjakan Lagi</> : "Mulai Kerjakan"}</Link></Button>
              )}
              {mine[0] && <Button asChild size="sm" variant="outline"><Link to="/siswa/hasil/$id" params={{ id: mine[0].id }}>Hasil Terakhir</Link></Button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
