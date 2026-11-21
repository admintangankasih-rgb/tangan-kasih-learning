import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, Lock } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBox, LevelBadge, Loading, Pill } from "@/components/common";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_LABEL, LEVELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pembelajaran")({
  head: () => ({
    meta: [
      { title: "Pratinjau Pembelajaran — Tangan Kasih" },
      { name: "description", content: "Lihat mata pelajaran dan materi yang tersedia untuk siswa SD, SMP, dan SMA." },
      { property: "og:title", content: "Pratinjau Pembelajaran — Tangan Kasih" },
      { property: "og:description", content: "Mata pelajaran Matematika, Bahasa Indonesia, Bahasa Inggris, dan IPA/IPAS sesuai jenjang." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Preview,
});

const PREVIEW_PER_LEVEL = 6;

function Preview() {
  const [level, setLevel] = useState<string>("SD");
  const q = useQuery({
    queryKey: ["public-preview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_material_preview");
      if (error) throw error;
      return data;
    },
  });
  const items = (q.data ?? []).filter((m) => m.levels.includes(level as "SD")).slice(0, PREVIEW_PER_LEVEL);

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">Pratinjau Pembelajaran</h1>
        <p className="mt-2 text-muted-foreground">Contoh sebagian materi yang tersedia. Masuk untuk membaca materi lengkap, mengerjakan latihan, dan menyimpan progres.</p>
        <div className="mt-6 inline-flex rounded-xl border bg-card p-1" role="tablist" aria-label="Pilih jenjang">
          {LEVELS.map((l) => (
            <button key={l} role="tab" aria-selected={level === l} onClick={() => setLevel(l)} className={cn("rounded-lg px-5 py-2 text-sm font-semibold", level === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
              {l}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : items.length === 0 ? (
            <EmptyState title="Belum ada materi untuk jenjang ini" description="Pendamping yayasan sedang menyiapkan materi." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <article key={m.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <Pill tone="primary">{m.subject_name}</Pill>
                    <LevelBadge level={level} />
                  </div>
                  <h2 className="mt-3 font-bold">{m.title}</h2>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> {m.duration_minutes} menit · {DIFFICULTY_LABEL[m.difficulty]}</span>
                    <span className="flex items-center gap-1"><Lock className="size-3.5" /> Perlu masuk</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="mt-10 rounded-2xl bg-primary-soft p-6 text-center">
          <p className="font-semibold text-primary">Ingin mempelajari materi lengkap?</p>
          <p className="mt-1 text-sm text-muted-foreground">Akun siswa dibuat oleh pendamping Yayasan Tangan Kasih.</p>
          <Button asChild className="mt-4"><Link to="/masuk">Masuk untuk Belajar</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
