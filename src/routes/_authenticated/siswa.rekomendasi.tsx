import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useStudentData } from "@/hooks/use-student-data";
import { EmptyState, ErrorBox, Loading, PageHeader, Panel } from "@/components/common";
import { RecommendationCard } from "@/components/student-widgets";

export const Route = createFileRoute("/_authenticated/siswa/rekomendasi")({
  head: () => ({ meta: [{ title: "Rekomendasi Materi — Tangan Kasih" }, { name: "description", content: "Rekomendasi materi berdasarkan progres dan nilai." }] }),
  component: Rekomendasi,
});

function Rekomendasi() {
  const { me, derived, data, isLoading, error } = useStudentData();
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!derived || !data) return null;
  return (
    <div className="space-y-6">
      <PageHeader title="Rekomendasi Materi" description="Saran materi yang sebaiknya kamu pelajari berikutnya." />
      {derived.recommendations.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {derived.recommendations.map((r) => <RecommendationCard key={r.material.id} rec={r} level={me?.level} />)}
        </div>
      ) : <EmptyState title="Tidak ada rekomendasi saat ini" description="Kamu sudah menguasai semua materi yang tersedia. Hebat!" />}
      <Panel title={<span className="flex items-center gap-2"><Info className="size-5 text-teal" /> Bagaimana rekomendasi dibuat?</span>}>
        <p className="text-sm text-muted-foreground">Rekomendasi dibuat dengan aturan sederhana (bukan kecerdasan buatan), berdasarkan jenjang, materi yang sudah selesai, dan nilai kuismu:</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li><b>Prasyarat</b> — materi dasar yang perlu diselesaikan sebelum materi lanjutan.</li>
          <li><b>Perlu Latihan</b> — nilai kuis di bawah nilai lulus, atau rata-rata mapel di bawah {data.settings.mastery_threshold}.</li>
          <li><b>Materi Berikutnya</b> — prasyarat sudah selesai dan kuisnya lulus.</li>
          <li><b>Belum Dipelajari</b> — materi lain di jenjangmu yang belum kamu selesaikan.</li>
        </ol>
      </Panel>
    </div>
  );
}
