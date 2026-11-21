import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmAction, ErrorBox, LevelBadge, Loading, PageHeader } from "@/components/common";
import { DataTable, Field, NativeSelect, td, useSubjects } from "@/components/admin-kit";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, LEVELS, type Level } from "@/lib/format";
import { Markdown } from "@/components/markdown";
import { MediaInsertButton } from "@/components/media-upload";
import type { Database } from "@/integrations/supabase/types";

type Question = Database["public"]["Tables"]["questions"]["Row"];

export const Route = createFileRoute("/_authenticated/pendamping/soal")({
  head: () => ({ meta: [{ title: "Bank Soal — Tangan Kasih" }, { name: "description", content: "Kelola soal pilihan ganda." }] }),
  component: QuestionsPage,
});

function useQuestions() {
  return useQuery({
    queryKey: ["pd-questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function QuestionsPage() {
  const q = useQuestions();
  const subjects = useSubjects();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Question | "new" | null>(null);
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const list = (q.data ?? []).filter((x) => (!level || x.level === level) && (!subject || x.subject_id === subject));
  async function remove(x: Question) {
    const { error } = await supabase.from("questions").delete().eq("id", x.id);
    if (error) { toast.error(error.code === "23503" ? "Soal masih dipakai di kuis atau sudah pernah dijawab siswa." : errorMessage(error)); return; }
    toast.success("Soal dihapus.");
    qc.invalidateQueries({ queryKey: ["pd-questions"] });
  }
  return (
    <div>
      <PageHeader title="Bank Soal" description="Soal pilihan ganda yang dapat dipakai di latihan maupun evaluasi." actions={<Button onClick={() => setEditing("new")}><Plus /> Tambah Soal</Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <NativeSelect aria-label="Filter mata pelajaran" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Semua mata pelajaran</option>{subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</NativeSelect>
        <NativeSelect aria-label="Filter jenjang" className="sm:w-40" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Semua jenjang</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</NativeSelect>
      </div>
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : (
        <DataTable head={["Pertanyaan", "Mata pelajaran", "Jenjang", "Poin", "Aksi"]} empty={!list.length}>
          {list.map((x) => (
            <tr key={x.id}>
              <td className={`${td} max-w-md`}><p className="line-clamp-2">{x.prompt}</p></td>
              <td className={td}>{subjects.data?.find((s) => s.id === x.subject_id)?.name ?? "-"}</td>
              <td className={td}><LevelBadge level={x.level} /></td>
              <td className={td}>{x.points}</td>
              <td className={td}>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(x)}><Pencil /> Ubah</Button>
                  <ConfirmAction trigger={<Button size="sm" variant="ghost" aria-label="Hapus"><Trash2 className="text-destructive" /></Button>} title="Hapus soal?" description="Soal yang sudah dipakai kuis tidak dapat dihapus." confirmLabel="Hapus" onConfirm={() => remove(x)} />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === "new" ? "Tambah Soal" : "Ubah Soal"}</DialogTitle></DialogHeader>
          {editing && <QuestionForm question={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionForm({ question, onDone }: { question: Question | null; onDone: () => void }) {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const [f, setF] = useState({
    prompt: question?.prompt ?? "", subject_id: question?.subject_id ?? "", level: (question?.level ?? "SD") as Level, topic: question?.topic ?? "",
    options: (question?.options as string[] | undefined) ?? ["", "", "", ""], correct_index: question?.correct_index ?? 0, explanation: question?.explanation ?? "", points: question?.points ?? 10,
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const options = f.options.map((o) => o.trim());
    if (options.length < 2 || options.some((o) => !o)) { toast.error("Isi semua pilihan jawaban (minimal 2)."); return; }
    if (!f.subject_id) { toast.error("Pilih mata pelajaran."); return; }
    setBusy(true);
    const row = { ...f, options, points: Number(f.points) };
    const { error } = question ? await supabase.from("questions").update(row).eq("id", question.id) : await supabase.from("questions").insert(row);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Soal disimpan.");
    qc.invalidateQueries({ queryKey: ["pd-questions"] });
    onDone();
  }
  const letters = "ABCDEF";
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Pertanyaan" htmlFor="qp" hint="Teks dan media dapat disisipkan pada posisi kursor.">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <MediaInsertButton targetId="qp" value={f.prompt} onChange={(prompt) => setF((prev) => ({ ...prev, prompt }))} />
          <span className="text-xs text-muted-foreground">Pratinjau pertanyaan</span>
        </div>
        <Textarea id="qp" required rows={3} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
        {f.prompt.trim() && <div className="mt-2 rounded-md border bg-muted/20 p-3"><Markdown content={f.prompt} /></div>}
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mata pelajaran" htmlFor="qs"><NativeSelect id="qs" required value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value })}><option value="">Pilih…</option>{subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</NativeSelect></Field>
        <Field label="Jenjang" htmlFor="ql"><NativeSelect id="ql" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Level })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</NativeSelect></Field>
        <Field label="Poin" htmlFor="qpt"><Input id="qpt" type="number" min={1} value={f.points} onChange={(e) => setF({ ...f, points: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Topik" htmlFor="qt"><Input id="qt" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} /></Field>
      <Field label="Pilihan jawaban" hint="Klik huruf untuk menandai jawaban benar.">
        <div className="space-y-2">
          {f.options.map((o, i) => (
            <div key={i} className="flex items-start gap-2">
              <button type="button" onClick={() => setF({ ...f, correct_index: i })} aria-label={`Tandai ${letters[i]} benar`} className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full border font-bold ${f.correct_index === i ? "border-success bg-success text-primary-foreground" : "bg-card"}`}>{letters[i]}</button>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Textarea id={`qo-${i}`} aria-label={`Pilihan ${letters[i]}`} rows={2} value={o} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} />
                <MediaInsertButton targetId={`qo-${i}`} value={o} onChange={(next) => setF((prev) => ({ ...prev, options: prev.options.map((x, j) => (j === i ? next : x)) }))} label={`Sisipkan media ${letters[i]}`} />
                <div id={`qo-preview-${i}`} className="rounded-md bg-muted/20 px-2 py-1 text-sm"><Markdown content={o || "Belum ada isi."} inline /></div>
              </div>
              {f.options.length > 2 && <Button type="button" size="icon" variant="ghost" aria-label="Hapus pilihan" onClick={() => setF({ ...f, options: f.options.filter((_, j) => j !== i), correct_index: f.correct_index === i ? 0 : f.correct_index > i ? f.correct_index - 1 : f.correct_index })}><X /></Button>}
            </div>
          ))}
          {f.options.length < 6 && <Button type="button" size="sm" variant="outline" onClick={() => setF({ ...f, options: [...f.options, ""] })}><Plus /> Tambah pilihan</Button>}
        </div>
      </Field>
      <Field label="Pembahasan" htmlFor="qe">
        <Textarea id="qe" rows={2} value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} />
        <MediaInsertButton targetId="qe" value={f.explanation} onChange={(explanation) => setF((prev) => ({ ...prev, explanation }))} label="Sisipkan media pembahasan" />
        {f.explanation.trim() && <div className="mt-2 rounded-md border bg-muted/20 p-3"><Markdown content={f.explanation} /></div>}
      </Field>
      <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />} Simpan Soal</Button>
    </form>
  );
}
