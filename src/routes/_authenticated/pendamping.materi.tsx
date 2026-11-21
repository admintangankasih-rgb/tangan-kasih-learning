import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmAction, ErrorBox, LevelBadge, Loading, PageHeader, Pill } from "@/components/common";
import { DataTable, Field, NativeSelect, td, useSubjects } from "@/components/admin-kit";
import { Markdown } from "@/components/markdown";
import { MEDIA_ACCEPT, uploadMedia } from "@/components/media-upload";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_LABEL, errorMessage, LEVELS, type Level } from "@/lib/format";
import { useMe } from "@/hooks/use-me";
import type { Database } from "@/integrations/supabase/types";

type Material = Database["public"]["Tables"]["materials"]["Row"];

export const Route = createFileRoute("/_authenticated/pendamping/materi")({
  head: () => ({ meta: [{ title: "Kelola Materi — Tangan Kasih" }, { name: "description", content: "Tambah dan ubah materi pembelajaran." }] }),
  component: MaterialsPage,
});

function useMaterials() {
  return useQuery({
    queryKey: ["pd-materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").order("order_index");
      if (error) throw error;
      return data;
    },
  });
}


function MaterialsPage() {
  const q = useMaterials();
  const subjects = useSubjects();
  const qc = useQueryClient();

  const [editing, setEditing] = useState<Material | "new" | null>(null);

  // State untuk filter
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const subjectName = (id: string) =>
    subjects.data?.find((s) => s.id === id)?.name ?? "-";

  // Penyaringan data materi
  const filteredMaterials = (q.data ?? []).filter((m) => {
    const matchSubject =
      subjectFilter === "all" || m.subject_id === subjectFilter;

    const matchLevel =
      levelFilter === "all" || m.levels.includes(levelFilter as Level);

    return matchSubject && matchLevel;
  });

  async function remove(m: Material) {
    const { error } = await supabase.from("materials").delete().eq("id", m.id);

    if (error) {
      toast.error(
        error.code === "23503"
          ? "Materi dipakai oleh kuis. Lepaskan dulu dari kuis atau sembunyikan saja."
          : errorMessage(error)
      );
      return;
    }

    toast.success("Materi dihapus.");
    qc.invalidateQueries({ queryKey: ["pd-materials"] });
  }

  async function togglePublish(m: Material) {
    const { error } = await supabase
      .from("materials")
      .update({ is_published: !m.is_published })
      .eq("id", m.id);

    if (error) {
      toast.error(errorMessage(error));
      return;
    }

    qc.invalidateQueries({ queryKey: ["pd-materials"] });
  }

  return (
    <div>
      <PageHeader
        title="Materi Pembelajaran"
        description="Tulis materi dengan format sederhana dan lihat pratinjaunya sebelum diterbitkan."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Tambah Materi
          </Button>
        }
      />

      {/* Filter mata pelajaran dan jenjang */}
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <NativeSelect
          aria-label="Filter mata pelajaran"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="all">Semua mata pelajaran</option>
          {subjects.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filter jenjang"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">Semua jenjang</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </NativeSelect>
      </div>

      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} />
      ) : (
        <DataTable
          head={[
            "Urutan",
            "Judul",
            "Mata pelajaran",
            "Jenjang",
            "Status",
            "Aksi",
          ]}
          empty={!filteredMaterials.length}
        >
          {filteredMaterials.map((m) => (
            <tr key={m.id}>
              <td className={td}>{m.order_index}</td>

              <td className={`${td} font-medium`}>
                {m.title}
                {m.is_sample && (
                  <span className="ml-1 text-xs text-warning">
                    (contoh)
                  </span>
                )}
              </td>

              <td className={td}>{subjectName(m.subject_id)}</td>

              <td className={td}>
                <div className="flex gap-1">
                  {m.levels.map((l) => (
                    <LevelBadge key={l} level={l} />
                  ))}
                </div>
              </td>

              <td className={td}>
                <Pill tone={m.is_published ? "success" : "muted"}>
                  {m.is_published ? "Terbit" : "Draf"}
                </Pill>
              </td>

              <td className={td}>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(m)}
                  >
                    <Pencil /> Ubah
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePublish(m)}
                    aria-label={m.is_published ? "Sembunyikan" : "Terbitkan"}
                  >
                    {m.is_published ? <EyeOff /> : <Eye />}
                  </Button>

                  <ConfirmAction
                    trigger={
                      <Button size="sm" variant="ghost" aria-label="Hapus">
                        <Trash2 className="text-destructive" />
                      </Button>
                    }
                    title="Hapus materi?"
                    description={`"${m.title}" dan progres siswa pada materi ini akan dihapus.`}
                    confirmLabel="Hapus"
                    onConfirm={() => remove(m)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Tambah Materi" : "Ubah Materi"}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <MaterialForm
              material={editing === "new" ? null : editing}
              all={q.data ?? []}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


function MaterialForm({ material, all, onDone }: { material: Material | null; all: Material[]; onDone: () => void }) {
  const qc = useQueryClient();
  const me = useMe();
  const subjects = useSubjects();
  const [f, setF] = useState({
    title: material?.title ?? "", summary: material?.summary ?? "", topic: material?.topic ?? "", content: material?.content ?? "",
    subject_id: material?.subject_id ?? "", levels: (material?.levels ?? ["SD"]) as Level[], difficulty: material?.difficulty ?? "mudah",
    duration_minutes: material?.duration_minutes ?? 15, order_index: material?.order_index ?? all.length + 1,
    objectives: (material?.objectives ?? []).join("\n"), prerequisite_ids: material?.prerequisite_ids ?? [], is_published: material?.is_published ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  async function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ta = document.getElementById("isi-materi") as HTMLTextAreaElement | null;
    const pos = ta?.selectionStart ?? f.content.length;
    setUploading(true);
    const markdown = await uploadMedia(file);
    setUploading(false);
    if (!markdown) return;
    const snippet = `\n${markdown}\n`;
    setF((prev) => ({ ...prev, content: prev.content.slice(0, pos) + snippet + prev.content.slice(pos) }));
    toast.success("Berkas disisipkan. Cek di tab Pratinjau.");
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.levels.length) { toast.error("Pilih minimal satu jenjang."); return; }
    let subject_id = f.subject_id;
    if (subject_id === "__new") {
      const name = newSubject.trim();
      if (!name) { toast.error("Tulis nama mata pelajaran baru."); return; }
      const existing = subjects.data?.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (existing) subject_id = existing.id;
      else {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
        const { data, error } = await supabase.from("subjects").insert({ name, slug, levels: f.levels }).select("id").single();
        if (error) { toast.error(errorMessage(error)); return; }
        subject_id = data.id;
        qc.invalidateQueries({ queryKey: ["subjects"] });
      }
    }
    if (!subject_id) { toast.error("Pilih mata pelajaran."); return; }
    setBusy(true);
    const row = { ...f, subject_id, objectives: f.objectives.split("\n").map((s) => s.trim()).filter(Boolean), duration_minutes: Number(f.duration_minutes), order_index: Number(f.order_index) };
    const { error } = material
      ? await supabase.from("materials").update({ ...row, is_sample: false }).eq("id", material.id)
      : await supabase.from("materials").insert({ ...row, created_by: me?.id ?? null });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Materi disimpan.");
    qc.invalidateQueries({ queryKey: ["pd-materials"] });
    onDone();
  }
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Judul materi" htmlFor="mt"><Input id="mt" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mata pelajaran" htmlFor="ms">
          <NativeSelect id="ms" required value={f.subject_id} onChange={(e) => setF({ ...f, subject_id: e.target.value })}><option value="">Pilih…</option>{subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}<option value="__new">+ Buat mata pelajaran baru…</option></NativeSelect>
          {f.subject_id === "__new" && <Input className="mt-2" aria-label="Nama mata pelajaran baru" placeholder="Contoh: Seni Budaya" maxLength={60} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />}
        </Field>
        <Field label="Topik" htmlFor="mtp"><Input id="mtp" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} /></Field>
      </div>
      <Field label="Jenjang">
        <div className="flex gap-4">{LEVELS.map((l) => <label key={l} className="flex items-center gap-2 text-sm"><Checkbox checked={f.levels.includes(l)} onCheckedChange={() => setF({ ...f, levels: toggle(f.levels, l) })} />{l}</label>)}</div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tingkat kesulitan" htmlFor="md"><NativeSelect id="md" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>{Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</NativeSelect></Field>
        <Field label="Durasi (menit)" htmlFor="mdu"><Input id="mdu" type="number" min={1} value={f.duration_minutes} onChange={(e) => setF({ ...f, duration_minutes: Number(e.target.value) })} /></Field>
        <Field label="Urutan" htmlFor="mo"><Input id="mo" type="number" min={0} value={f.order_index} onChange={(e) => setF({ ...f, order_index: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Ringkasan" htmlFor="msu"><Textarea id="msu" rows={2} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
      <Field label="Tujuan pembelajaran" htmlFor="mob" hint="Satu tujuan per baris."><Textarea id="mob" rows={3} value={f.objectives} onChange={(e) => setF({ ...f, objectives: e.target.value })} /></Field>
      <Field label="Isi materi" hint="Gunakan ## untuk judul bagian, - untuk daftar, **tebal** untuk penekanan. Berkas disisipkan di posisi kursor: gambar maks. 5 MB; PDF/dokumen, video, dan suara maks. 50 MB.">
        <Tabs defaultValue="tulis">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList><TabsTrigger value="tulis">Tulis</TabsTrigger><TabsTrigger value="pratinjau">Pratinjau</TabsTrigger></TabsList>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Sisipkan Berkas (gambar, PDF, video, suara)
              <input type="file" accept={MEDIA_ACCEPT} className="sr-only" disabled={uploading} onChange={uploadImage} />
            </label>
          </div>
          <TabsContent value="tulis"><Textarea id="isi-materi" aria-label="Isi materi" rows={12} className="font-mono text-sm" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></TabsContent>
          <TabsContent value="pratinjau"><div className="min-h-40 rounded-md border p-4">{f.content ? <Markdown content={f.content} /> : <p className="text-sm text-muted-foreground">Belum ada isi.</p>}</div></TabsContent>
        </Tabs>
      </Field>
      <Field label="Materi prasyarat" hint="Materi yang sebaiknya dipelajari lebih dulu.">
        <div className="grid max-h-36 gap-1.5 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
          {all.filter((m) => m.id !== material?.id).map((m) => (
            <label key={m.id} className="flex min-w-0 items-center gap-2 text-sm"><Checkbox checked={f.prerequisite_ids.includes(m.id)} onCheckedChange={() => setF({ ...f, prerequisite_ids: toggle(f.prerequisite_ids, m.id) })} /><span className="min-w-0 truncate">{m.title}</span></label>
          ))}
        </div>
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: !!v })} /> Terbitkan untuk siswa</label>
      <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />} Simpan Materi</Button>
    </form>
  );
}
