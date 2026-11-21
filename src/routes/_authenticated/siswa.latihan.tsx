import { createFileRoute } from "@tanstack/react-router";
import { QuizPage } from "@/components/quiz-page";

export const Route = createFileRoute("/_authenticated/siswa/latihan")({
  head: () => ({ meta: [{ title: "Latihan Soal — Tangan Kasih" }, { name: "description", content: "Latihan soal sesuai jenjang." }] }),
  component: () => <QuizPage kind="latihan" title="Latihan Soal" description="Latihan singkat untuk mengecek pemahaman setiap materi." />,
});
