import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { useStudentData } from "@/hooks/use-student-data";
import { EmptyState, ErrorBox, Loading, PageHeader } from "@/components/common";
import { MaterialCard } from "@/components/student-widgets";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/siswa/materi/")({
  head: () => ({ meta: [{ title: "Materi Pembelajaran — Tangan Kasih" }, { name: "description", content: "Daftar materi sesuai jenjang." }] }),
  component: MateriList,
});

function MateriList() {
  const { me, data, derived, isLoading, error } = useStudentData();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("semua");
  const [topic, setTopic] = useState("semua");
  const [diff, setDiff] = useState("semua");
  const [status, setStatus] = useState("semua");
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data || !derived) return null;

  const subjects = [...new Map(data.materials.map((m) => [m.subject_id, m.subjects?.name ?? ""])).entries()];
  const topics = [...new Set(data.materials.filter((m) => subject === "semua" || m.subject_id === subject).map((m) => m.topic).filter(Boolean))];
  const list = data.materials.filter((m) =>
    (subject === "semua" || m.subject_id === subject) &&
    (topic === "semua" || m.topic === topic) &&
    (diff === "semua" || m.difficulty === diff) &&
    (status === "semua" || (status === "selesai" ? derived.completedIds.has(m.id) : !derived.completedIds.has(m.id))) &&
    m.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader title="Materi Pembelajaran" description={`Materi untuk jenjang ${me?.level ?? ""}.`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari judul materi…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Cari materi" />
        </div>
        <Select value={subject} onValueChange={(v) => { setSubject(v); setTopic("semua"); }}>
          <SelectTrigger aria-label="Mata pelajaran"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="semua">Semua mapel</SelectItem>{subjects.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger aria-label="Topik"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="semua">Semua topik</SelectItem>{topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={diff} onValueChange={setDiff}>
          <SelectTrigger aria-label="Tingkat kesulitan"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="semua">Semua tingkat</SelectItem><SelectItem value="mudah">Mudah</SelectItem><SelectItem value="sedang">Sedang</SelectItem><SelectItem value="sulit">Sulit</SelectItem></SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="semua">Semua status</SelectItem><SelectItem value="selesai">Sudah selesai</SelectItem><SelectItem value="belum">Belum selesai</SelectItem></SelectContent>
        </Select>
      </div>
      {list.length === 0 ? <EmptyState title="Materi tidak ditemukan" description="Coba ubah kata kunci atau filter." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => <MaterialCard key={m.id} m={m} done={derived.completedIds.has(m.id)} opened={derived.openedIds.has(m.id)} />)}
        </div>
      )}
    </div>
  );
}
