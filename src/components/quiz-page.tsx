import { useState } from "react";
import { useStudentData } from "@/hooks/use-student-data";
import { ErrorBox, Loading, PageHeader } from "./common";
import { QuizList } from "./student-widgets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function QuizPage({ kind, title, description }: { kind: "latihan" | "evaluasi"; title: string; description: string }) {
  const { data, isLoading, error } = useStudentData();
  const [subject, setSubject] = useState("semua");
  if (isLoading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;
  const all = data.quizzes.filter((q) => q.kind === kind);
  const subjects = [...new Map(all.map((q) => [q.subject_id, q.subjects?.name ?? ""])).entries()];
  const list = all.filter((q) => subject === "semua" || q.subject_id === subject);
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-52" aria-label="Filter mata pelajaran"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="semua">Semua mapel</SelectItem>{subjects.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}</SelectContent>
          </Select>
        }
      />
      <QuizList quizzes={list} attempts={data.attempts} emptyTitle={kind === "latihan" ? "Belum ada latihan soal" : "Belum ada evaluasi"} />
    </div>
  );
}
