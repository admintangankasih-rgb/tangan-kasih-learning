
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmAction, ErrorBox, LevelBadge, Loading, PageHeader, Pill } from "@/components/common";
import { DataTable, Field, NativeSelect, td, useSubjects } from "@/components/admin-kit";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, formatDate, LEVELS, type Level } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"] & { quiz_questions: { question_id: string }[] };

export const Route = createFileRoute("/_authenticated/pendamping/evaluasi")({
  head: () => ({ meta: [{ title: "Latihan & Evaluasi — Tangan Kasih" }, { name: "description", content: "Atur latihan soal dan evaluasi." }] }),
  component: QuizzesPage,
});

function QuizzesPage() {
  const qc = useQueryClient();
  const subjects = useSubjects();

  // FILTER BARU
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const q = useQuery({
    queryKey: ["pd-quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("*, quiz_questions(question_id)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quiz[];
    },
  });

  const [editing, setEditing] = useState<Quiz | "new" | null>(null);

  // FILTER DATA KUIS
  const filteredQuizzes = (q.data ?? []).filter((x) => {
    const matchSubject = !filterSubject || x.subject_id === filterSubject;
    const matchLevel = !filterLevel || x.level === filterLevel;
    return matchSubject && matchLevel;
  });

  async function remove(x: Quiz) {
    const { error } = await supabase.from("quizzes").delete().eq("id", x.id);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Kuis dihapus.");
    qc.invalidateQueries({ queryKey: ["pd-quizzes"] });
  }

  return (
    <div>
      <PageHeader
        title="Latihan & Evaluasi"
        description="Susun kuis dari bank soal, atur nilai lulus, jadwal, dan kesempatan mengulang."
        actions={<Button onClick={() => setEditing("new")}><Plus /> Buat Kuis</Button>}
      />

      {/* FILTER MATA PELAJARAN DAN JENJANG */}
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <NativeSelect
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="">Semua mata pelajaran</option>
          {subjects.data?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="">Semua jenjang</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </NativeSelect>
      </div>

      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : (
        <DataTable
          head={["Judul", "Jenis", "Mapel", "Jenjang", "Soal", "Jadwal", "Status", "Aksi"]}
          empty={!filteredQuizzes.length}
        >
          {filteredQuizzes.map((x) => (
            <tr key={x.id}>
              <td className={`${td} font-medium`}>{x.title}</td>
              <td className={td}>
                <Pill tone={x.kind === "evaluasi" ? "primary" : "teal"}>
                  {x.kind === "evaluasi" ? "Evaluasi" : "Latihan"}
                </Pill>
              </td>
              <td className={td}>
                {subjects.data?.find((s) => s.id === x.subject_id)?.name ?? "-"}
              </td>
              <td className={td}><LevelBadge level={x.level} /></td>
              <td className={td}>{x.quiz_questions.length}</td>
              <td className={`${td} text-xs`}>
                {x.available_from || x.available_until
                  ? `${formatDate(x.available_from)} – ${formatDate(x.available_until)}`
                  : "Selalu"}
              </td>
              <td className={td}>
                <Pill tone={x.is_published ? "success" : "muted"}>
                  {x.is_published ? "Terbit" : "Draf"}
                </Pill>
              </td>
              <td className={td}>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(x)}>
                    <Pencil /> Ubah
                  </Button>
                  <ConfirmAction
                    trigger={<Button size="sm" variant="ghost" aria-label="Hapus"><Trash2 className="text-destructive" /></Button>}
                    title="Hapus kuis?"
                    description="Semua hasil pengerjaan siswa untuk kuis ini juga akan terhapus."
                    confirmLabel="Hapus"
                    onConfirm={() => remove(x)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Buat Kuis" : "Ubah Kuis"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <QuizForm
              quiz={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const toLocal = (v: string | null) => (v ? new Date(new Date(v).getTime() + 7 * 3600000).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(`${v}:00+07:00`).toISOString() : null);

function QuizForm({ quiz, onDone }: { quiz: Quiz | null; onDone: () => void }) {
  const qc = useQueryClient();
  const subjects = useSubjects();
  const [f, setF] = useState({
    title: quiz?.title ?? "",
    description: quiz?.description ?? "",
    kind: quiz?.kind ?? "latihan",
    subject_id: quiz?.subject_id ?? "",
    material_id: quiz?.material_id ?? "",
    level: (quiz?.level ?? "SD") as Level,
    passing_score: quiz?.passing_score ?? 70,
    allow_retake: quiz?.allow_retake ?? true,
    max_attempts: quiz?.max_attempts?.toString() ?? "",
    show_review: quiz?.show_review ?? true,
    available_from: toLocal(quiz?.available_from ?? null),
    available_until: toLocal(quiz?.available_until ?? null),
    is_published: quiz?.is_published ?? false,
  });

  const [selected, setSelected] = useState<string[]>(quiz?.quiz_questions.map((x) => x.question_id) ?? []);
  const [busy, setBusy] = useState(false);

  const pool = useQuery({
    queryKey: ["pd-pool", f.subject_id, f.level],
    enabled: !!f.subject_id,
    queryFn: async () => (await supabase.from("questions").select("id,prompt,points").eq("subject_id", f.subject_id).eq("level", f.level).order("created_at")).data ?? [],
  });

  const mats = useQuery({
    queryKey: ["pd-mat-opts", f.subject_id],
    enabled: !!f.subject_id,
    queryFn: async () => (await supabase.from("materials").select("id,title").eq("subject_id", f.subject_id).order("order_index")).data ?? [],
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.subject_id) { toast.error("Pilih mata pelajaran."); return; }

    const valid = selected.filter((id) => pool.data?.some((p) => p.id === id));
    if (!valid.length) { toast.error("Pilih minimal satu soal."); return; }

    setBusy(true);
    try {
      const row = {
        ...f,
        material_id: f.material_id || null,
        passing_score: Number(f.passing_score),
        max_attempts: f.allow_retake && f.max_attempts ? Number(f.max_attempts) : f.allow_retake ? null : 1,
        available_from: fromLocal(f.available_from),
        available_until: fromLocal(f.available_until),
      };

      let id = quiz?.id;
      if (id) {
        const { error } = await supabase.from("quizzes").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("quizzes").insert(row).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      const { error: dErr } = await supabase.from("quiz_questions").delete().eq("quiz_id", id!);
      if (dErr) throw dErr;

      const { error: iErr } = await supabase.from("quiz_questions").insert(
        valid.map((question_id, position) => ({ quiz_id: id!, question_id, position }))
      );
      if (iErr) throw iErr;

      toast.success("Kuis disimpan.");
      qc.invalidateQueries({ queryKey: ["pd-quizzes"] });
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Judul" htmlFor="zt">
        <Input id="zt" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </Field>

      <Field label="Petunjuk" htmlFor="zd">
        <Textarea id="zd" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Jenis" htmlFor="zk">
          <NativeSelect id="zk" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="latihan">Latihan</option>
            <option value="evaluasi">Evaluasi</option>
          </NativeSelect>
        </Field>

        <Field label="Mata pelajaran" htmlFor="zs">
          <NativeSelect id="zs" required value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value, material_id: "" })}>
            <option value="">Pilih…</option>
            {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </NativeSelect>
        </Field>

        <Field label="Jenjang" htmlFor="zl">
          <NativeSelect id="zl" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Level })}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </NativeSelect>
        </Field>
      </div>

      <Field label="Terkait materi (opsional)" htmlFor="zm">
        <NativeSelect id="zm" value={f.material_id} onChange={(e) => setF({ ...f, material_id: e.target.value })}>
          <option value="">Tidak ada</option>
          {mats.data?.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </NativeSelect>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nilai lulus (0–100)" htmlFor="zp">
          <Input id="zp" type="number" min={0} max={100} value={f.passing_score} onChange={(e) => setF({ ...f, passing_score: Number(e.target.value) })} />
        </Field>
        <Field label="Batas pengerjaan" htmlFor="zma" hint="Kosongkan bila tidak dibatasi.">
          <Input id="zma" type="number" min={1} disabled={!f.allow_retake} value={f.max_attempts} onChange={(e) => setF({ ...f, max_attempts: e.target.value })} />
        </Field>
        <Field label="Mulai (WIB)" htmlFor="zf">
          <Input id="zf" type="datetime-local" value={f.available_from} onChange={(e) => setF({ ...f, available_from: e.target.value })} />
        </Field>
        <Field label="Berakhir (WIB)" htmlFor="zu">
          <Input id="zu" type="datetime-local" value={f.available_until} onChange={(e) => setF({ ...f, available_until: e.target.value })} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox checked={f.allow_retake} onCheckedChange={(v) => setF({ ...f, allow_retake: !!v })} /> Boleh diulang
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={f.show_review} onCheckedChange={(v) => setF({ ...f, show_review: !!v })} /> Tampilkan pembahasan
        </label>
        <label className="flex items-center gap-2 font-medium">
          <Checkbox checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: !!v })} /> Terbitkan
        </label>
      </div>

      <Field label={`Soal dipilih (${selected.filter((id) => pool.data?.some((p) => p.id === id)).length})`} hint="Soal diambil dari Bank Soal sesuai mata pelajaran dan jenjang.">
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border p-2">
          {!f.subject_id ? (
            <p className="text-sm text-muted-foreground">Pilih mata pelajaran dulu.</p>
          ) : !pool.data?.length ? (
            <p className="text-sm text-muted-foreground">Belum ada soal untuk mapel dan jenjang ini.</p>
          ) : (
            pool.data.map((p) => (
              <label key={p.id} className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={selected.includes(p.id)}
                  onCheckedChange={() => setSelected(selected.includes(p.id) ? selected.filter((x) => x !== p.id) : [...selected, p.id])}
                />
                <span className="line-clamp-2">{p.prompt}</span>
              </label>
            ))
          )}
        </div>
      </Field>

      <Button type="submit" disabled={busy} className="w-full">
        {busy && <Loader2 className="animate-spin" />} Simpan Kuis
      </Button>
    </form>
  );
}
