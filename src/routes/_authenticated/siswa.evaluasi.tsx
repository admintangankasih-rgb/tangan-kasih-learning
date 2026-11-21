import { createFileRoute } from "@tanstack/react-router";
import { QuizPage } from "@/components/quiz-page";

export const Route = createFileRoute("/_authenticated/siswa/evaluasi")({
  head: () => ({ meta: [{ title: "Evaluasi — Tangan Kasih" }, { name: "description", content: "Evaluasi belajar sesuai jenjang." }] }),
  component: () => <QuizPage kind="evaluasi" title="Evaluasi" description="Evaluasi berkala yang disiapkan pendamping. Perhatikan batas percobaan." />,
});
