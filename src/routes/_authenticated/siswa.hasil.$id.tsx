import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AttemptReview, useAttemptReview } from "@/components/attempt-review";
import { useStudentData } from "@/hooks/use-student-data";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatScore } from "@/lib/format";
import { Panel, Pill } from "@/components/common";

export const Route = createFileRoute("/_authenticated/siswa/hasil/$id")({
  head: () => ({ meta: [{ title: "Hasil Kuis — Tangan Kasih" }, { name: "description", content: "Hasil dan pembahasan kuis." }] }),
  component: Hasil,
});

function Hasil() {
  const { id } = Route.useParams();
  const r = useAttemptReview(id);
  const { data } = useStudentData();
  const quiz = r.data?.quiz;
  const history = data?.attempts.filter((a) => a.quiz_id === quiz?.id) ?? [];
  const best = history.length ? Math.max(...history.map((a) => Number(a.score))) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/siswa/latihan" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Latihan Soal</Link>
      <h1 className="text-2xl font-bold">Hasil Kuis</h1>
      <AttemptReview id={id} />
      {quiz && (
        <Panel title="Riwayat Percobaan" action={best !== null && <Pill tone="success">Terbaik {formatScore(best)}</Pill>}>
          <ul className="divide-y">
            {history.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <Link to="/siswa/hasil/$id" params={{ id: a.id }} className={a.id === id ? "font-bold text-primary" : "hover:text-primary"}>Percobaan ke-{a.attempt_number} · {formatDateTime(a.submitted_at)}</Link>
                <Pill tone={a.passed ? "success" : "warning"}>{formatScore(Number(a.score))}</Pill>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {quiz.material_id && <Button asChild variant="outline"><Link to="/siswa/materi/$id" params={{ id: quiz.material_id }}>Pelajari Ulang Materi</Link></Button>}
            <Button asChild><Link to="/siswa/rekomendasi">Lihat Rekomendasi</Link></Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
