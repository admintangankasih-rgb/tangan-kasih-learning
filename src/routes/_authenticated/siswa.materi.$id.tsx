import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Target, PencilLine, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStudentData } from "@/hooks/use-student-data";
import { EmptyState, ErrorBox, LevelBadge, Loading, Panel, Pill, SampleNotice } from "@/components/common";
import { Markdown, extractToc } from "@/components/markdown";
import { MaterialCard } from "@/components/student-widgets";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABEL, errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/siswa/materi/$id")({
  head: () => ({ meta: [{ title: "Materi — Tangan Kasih" }, { name: "description", content: "Pelajari materi." }] }),
  component: MateriDetail,
});

function MateriDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { me, data, derived } = useStudentData();
  const q = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*, subjects(name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const logged = useRef<string | null>(null);

  // Catat materi dibuka
  useEffect(() => {
    if (!me || !q.data || logged.current === id) return;
    logged.current = id;
    (async () => {
      const { data: existing } = await supabase.from("material_progress").select("id,status").eq("user_id", me.id).eq("material_id", id).maybeSingle();
      if (existing) await supabase.from("material_progress").update({ last_opened_at: new Date().toISOString() }).eq("id", existing.id);
      else {
        await supabase.from("material_progress").insert({ user_id: me.id, material_id: id });
        await supabase.from("activity_logs").insert({ user_id: me.id, type: "materi_dibuka", description: `Membuka ${q.data!.title}`, ref_id: id });
      }
      qc.invalidateQueries({ queryKey: ["student-data"] });
    })();
  }, [me, q.data, id, qc]);

  const complete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("material_progress").upsert(
        { user_id: me!.id, material_id: id, status: "selesai", completed_at: new Date().toISOString(), last_opened_at: new Date().toISOString() },
        { onConflict: "user_id,material_id" },
      );
      if (error) throw error;
      await supabase.from("activity_logs").insert({ user_id: me!.id, type: "materi_selesai", description: `Menyelesaikan ${q.data!.title}`, ref_id: id });
    },
    onSuccess: () => { toast.success("Materi ditandai selesai. Hebat!"); qc.invalidateQueries({ queryKey: ["student-data"] }); },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (q.isLoading || !data || !derived) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const m = q.data;
  if (!m) return <EmptyState title="Materi tidak ditemukan" description="Materi ini tidak tersedia untuk jenjangmu atau belum diterbitkan." action={<Button asChild><Link to="/siswa/materi">Kembali ke daftar</Link></Button>} />;

  const done = derived.completedIds.has(id);
  const toc = extractToc(m.content);
  const ordered = data.materials;
  const idx = ordered.findIndex((x) => x.id === id);
  const sameSubject = ordered.filter((x) => x.subject_id === m.subject_id);
  const sIdx = sameSubject.findIndex((x) => x.id === id);
  const prev = sameSubject[sIdx - 1];
  const next = sameSubject[sIdx + 1];
  const related = ordered.filter((x) => x.subject_id === m.subject_id && x.id !== id).slice(0, 3);
  const quizzes = data.quizzes.filter((x) => x.material_id === id);
  const missingPrereq = m.prerequisite_ids.map((p) => ordered.find((x) => x.id === p)).filter((x) => x && !derived.completedIds.has(x.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-5">
        <Link to="/siswa/materi" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Daftar materi</Link>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="primary">{m.subjects?.name}</Pill>
            {me?.level && <LevelBadge level={me.level} />}
            <Pill><Clock className="size-3" /> {m.duration_minutes} menit</Pill>
            <Pill>{DIFFICULTY_LABEL[m.difficulty]}</Pill>
            {done && <Pill tone="success"><CheckCircle2 className="size-3" /> Selesai</Pill>}
          </div>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{m.title}</h1>
          {m.topic && <p className="mt-1 text-sm text-muted-foreground">Topik: {m.topic}</p>}
        </div>
        {m.is_sample && <SampleNotice />}
        {missingPrereq.length > 0 && (
          <div className="flex gap-3 rounded-xl bg-warning-soft p-4 text-sm">
            <AlertTriangle className="size-5 shrink-0 text-warning" />
            <div>Sebaiknya pelajari dulu: {missingPrereq.map((p, i) => <span key={p!.id}>{i > 0 && ", "}<Link to="/siswa/materi/$id" params={{ id: p!.id }} className="font-semibold text-primary underline">{p!.title}</Link></span>)}</div>
          </div>
        )}
        {m.objectives.length > 0 && (
          <Panel title={<span className="flex items-center gap-2"><Target className="size-5 text-teal" /> Tujuan Pembelajaran</span>}>
            <ul className="list-disc space-y-1 pl-5 text-sm">{m.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          </Panel>
        )}
        {m.cover_url && <img src={m.cover_url} alt="" className="w-full rounded-2xl" />}
        <article className="rounded-2xl border bg-card p-5 shadow-soft sm:p-7"><Markdown content={m.content} /></article>

        {quizzes.length > 0 && (
          <Panel title={<span className="flex items-center gap-2"><PencilLine className="size-5 text-primary" /> Latihan untuk materi ini</span>}>
            <div className="flex flex-wrap gap-2">
              {quizzes.map((z) => <Button key={z.id} asChild variant="teal"><Link to="/siswa/kuis/$id" params={{ id: z.id }}>{z.title}</Link></Button>)}
            </div>
          </Panel>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => complete.mutate()} disabled={done || complete.isPending} variant={done ? "outline" : "default"} size="lg">
            <CheckCircle2 /> {done ? "Sudah Selesai" : "Tandai Selesai"}
          </Button>
          <div className="flex gap-2">
            {prev && <Button asChild variant="outline"><Link to="/siswa/materi/$id" params={{ id: prev.id }}><ArrowLeft /> Sebelumnya</Link></Button>}
            {next && <Button asChild variant="outline"><Link to="/siswa/materi/$id" params={{ id: next.id }}>Berikutnya <ArrowRight /></Link></Button>}
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-bold">Materi Terkait</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((r) => <MaterialCard key={r.id} m={r} done={derived.completedIds.has(r.id)} opened={derived.openedIds.has(r.id)} />)}
            </div>
          </div>
        )}
        <span className="hidden">{idx}</span>
      </div>
      {toc.length > 1 && (
        <aside className="hidden lg:block">
          <nav className="sticky top-8 rounded-2xl border bg-card p-4" aria-label="Daftar isi">
            <p className="mb-2 text-sm font-bold">Daftar Isi</p>
            <ul className="space-y-1.5 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-muted-foreground hover:text-primary">{t.text}</a></li>)}</ul>
          </nav>
        </aside>
      )}
    </div>
  );
}
