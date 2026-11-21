import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmAction, EmptyState, Loading, Panel, Pill, ProgressBar } from "@/components/common";
import { Button } from "@/components/ui/button";
import { errorMessage, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown";

export const Route = createFileRoute("/_authenticated/siswa/kuis/$id")({
  head: () => ({ meta: [{ title: "Mengerjakan Kuis — Tangan Kasih" }, { name: "description", content: "Kerjakan kuis." }] }),
  component: TakeQuiz,
});

interface QuizPayload {
  quiz: { id: string; title: string; description: string; passing_score: number; allow_retake: boolean; max_attempts: number | null; show_review: boolean };
  attempt_count: number;
  best_score: number | null;
  questions: { id: string; prompt: string; type: string; options: string[]; points: number }[];
}

function TakeQuiz() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const token = useRef(crypto.randomUUID());
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const q = useQuery({
    queryKey: ["quiz-take", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_quiz_for_student", { p_quiz: id });
      if (error) throw error;
      return data as unknown as QuizPayload;
    },
  });

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) return <EmptyState title="Kuis tidak tersedia" description={errorMessage(q.error)} action={<Button asChild><Link to="/siswa/latihan">Kembali</Link></Button>} />;
  const { quiz, questions, attempt_count, best_score } = q.data;
  const blocked = (attempt_count > 0 && !quiz.allow_retake) || (quiz.max_attempts !== null && attempt_count >= quiz.max_attempts);
  const answered = Object.keys(answers).length;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_quiz", { p_quiz: id, p_answers: answers, p_token: token.current });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["student-data"] });
      toast.success("Jawaban terkirim dan sudah dinilai.");
      navigate({ to: "/siswa/hasil/$id", params: { id: data as string }, replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
      setSubmitting(false);
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl">
        <Panel>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="mt-2 text-muted-foreground">{quiz.description}</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            <li>• Jumlah soal: <b>{questions.length}</b></li>
            <li>• Nilai lulus: <b>{quiz.passing_score}</b></li>
            <li>• Percobaan: <b>{quiz.allow_retake ? (quiz.max_attempts ? `maksimal ${quiz.max_attempts} kali` : "boleh diulang") : "hanya 1 kali"}</b> (sudah {attempt_count}×)</li>
            {best_score !== null && <li>• Nilai terbaikmu: <b>{formatScore(Number(best_score))}</b></li>}
            <li>• Kunci jawaban {quiz.show_review ? "ditampilkan setelah jawaban dikirim" : "tidak ditampilkan"}.</li>
          </ul>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => history.back()}><ArrowLeft /> Kembali</Button>
            <Button disabled={blocked || !questions.length} onClick={() => setStarted(true)}>{blocked ? "Batas percobaan tercapai" : "Mulai Mengerjakan"}</Button>
          </div>
        </Panel>
      </div>
    );
  }

  const cur = questions[i];
  if (!cur) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{quiz.title}</span>
        <span className="text-muted-foreground">{answered}/{questions.length} terjawab</span>
      </div>
      <ProgressBar value={((i + 1) / questions.length) * 100} label="Posisi soal" />
      <Panel>
        <div className="flex items-center justify-between">
          <Pill tone="primary">Soal {i + 1} dari {questions.length}</Pill>
          <span className="text-xs text-muted-foreground">{cur.points} poin</span>
        </div>
        <div className="mt-4 text-lg font-semibold"><Markdown content={cur.prompt} /></div>
        <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Pilihan jawaban">
          {cur.options.map((opt, k) => {
            const sel = answers[cur.id] === k;
            return (
              <div key={k} role="radio" aria-checked={sel} tabIndex={0}
                onClick={() => setAnswers({ ...answers, [cur.id]: k })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAnswers({ ...answers, [cur.id]: k }); } }}
                className={cn("flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", sel ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40")}>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold", sel ? "bg-primary text-primary-foreground" : "bg-muted")}>{String.fromCharCode(65 + k)}</span>
                <span className="min-w-0 flex-1 text-sm"><Markdown content={opt} inline /></span>
              </div>
            );
          })}
        </div>
      </Panel>
      <div className="flex flex-wrap gap-1.5" aria-label="Navigasi soal">
        {questions.map((qq, k) => (
          <button key={qq.id} onClick={() => setI(k)} aria-label={`Soal ${k + 1}`} className={cn("size-9 rounded-lg text-sm font-semibold", k === i ? "bg-primary text-primary-foreground" : answers[qq.id] !== undefined ? "bg-teal-soft text-teal" : "bg-muted")}>{k + 1}</button>
        ))}
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}><ArrowLeft /> Sebelumnya</Button>
        {i < questions.length - 1 ? (
          <Button onClick={() => setI(i + 1)}>Berikutnya <ArrowRight /></Button>
        ) : (
          <ConfirmAction
            destructive={false}
            trigger={<Button variant="teal" disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : <Send />} Kirim Jawaban</Button>}
            title="Kirim jawaban sekarang?"
            description={answered < questions.length ? `Masih ada ${questions.length - answered} soal yang belum dijawab. Soal kosong dinilai salah.` : "Jawaban tidak dapat diubah setelah dikirim."}
            confirmLabel="Ya, kirim"
            onConfirm={submit}
          />
        )}
      </div>
    </div>
  );
}
