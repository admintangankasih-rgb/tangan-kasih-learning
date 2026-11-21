import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, Loading, Panel, Pill } from "./common";
import { errorMessage, formatDateTime, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

export interface ReviewPayload {
  attempt: { id: string; score: number; passed: boolean; correct_count: number; question_count: number; points_earned: number; points_total: number; attempt_number: number; submitted_at: string; quiz_id: string };
  quiz: { id: string; title: string; passing_score: number; show_review: boolean; allow_retake: boolean; max_attempts: number | null; material_id: string | null; kind: string };
  review_available: boolean;
  answers: { question_id: string; prompt: string; options: string[]; selected_index: number | null; correct_index: number; is_correct: boolean; points_awarded: number; explanation: string }[];
}

export function useAttemptReview(id: string) {
  return useQuery({
    queryKey: ["attempt", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_attempt_review", { p_attempt: id });
      if (error) throw error;
      return data as unknown as ReviewPayload;
    },
  });
}

export function AttemptReview({ id }: { id: string }) {
  const q = useAttemptReview(id);
  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <EmptyState title="Hasil tidak ditemukan" description={errorMessage(q.error)} />;
  const { attempt: a, quiz, answers, review_available } = q.data;
  return (
    <div className="space-y-4">
      <Panel>
        <p className="text-sm text-muted-foreground">{quiz.title} · Percobaan ke-{a.attempt_number} · {formatDateTime(a.submitted_at)}</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <span className={cn("font-display text-6xl font-extrabold", a.passed ? "text-success" : "text-warning")}>{formatScore(Number(a.score))}</span>
          <div className="pb-2">
            <Pill tone={a.passed ? "success" : "warning"}>{a.passed ? "Lulus" : "Belum lulus"}</Pill>
            <p className="mt-1 text-sm text-muted-foreground">Nilai lulus {quiz.passing_score} · {a.correct_count}/{a.question_count} benar · {a.points_earned}/{a.points_total} poin</p>
          </div>
        </div>
        <p className="mt-3 text-sm">{a.passed ? "Selamat! Pemahamanmu sudah baik. Lanjutkan ke materi berikutnya." : "Belum mencapai nilai lulus. Pelajari ulang materinya, lalu coba lagi bila diizinkan."}</p>
      </Panel>
      {review_available ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Pembahasan</h2>
          {answers.map((x, k) => (
            <Panel key={x.question_id}>
              <div className="flex items-start gap-2">
                {x.is_correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />}
                <div className="min-w-0 font-semibold"><span>{k + 1}. </span><Markdown content={x.prompt} inline /></div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {x.options.map((o, j) => (
                  <li key={j} className={cn("rounded-lg border px-3 py-2 text-sm", j === x.correct_index ? "border-success bg-success-soft" : j === x.selected_index ? "border-destructive bg-destructive-soft" : "")}>
                    <span className="font-semibold">{String.fromCharCode(65 + j)}. </span><Markdown content={o} inline />
                    {j === x.correct_index && <span className="ml-2 text-xs font-semibold text-success">Jawaban benar</span>}
                    {j === x.selected_index && j !== x.correct_index && <span className="ml-2 text-xs font-semibold text-destructive">Jawabanmu</span>}
                  </li>
                ))}
              </ul>
              {x.selected_index === null && <p className="mt-2 text-xs text-destructive">Tidak dijawab.</p>}
              {x.explanation && <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><b>Penjelasan:</b><Markdown content={x.explanation} /></div>}
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState title="Pembahasan tidak ditampilkan" description="Pendamping mengatur kuis ini tanpa menampilkan kunci jawaban." />
      )}
    </div>
  );
}
