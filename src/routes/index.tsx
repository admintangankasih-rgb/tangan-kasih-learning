import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, PencilLine, ClipboardCheck, Compass, ArrowRight, HandHeart } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-belajar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tangan Kasih — Belajar Lebih Mudah, Raih Masa Depan Cerah" },
      { name: "description", content: "Platform belajar interaktif untuk siswa SD, SMP, dan SMA di Yayasan Sosial Tangan Kasih, Tangerang." },
      { property: "og:title", content: "Tangan Kasih — Platform Belajar Interaktif" },
      { property: "og:description", content: "Materi, latihan soal, evaluasi, dan rekomendasi belajar untuk anak di Yayasan Tangan Kasih." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Beranda,
});

const FEATURES = [
  { icon: BookOpen, title: "Materi Pembelajaran", text: "Materi bertahap sesuai jenjang, dengan tujuan belajar dan contoh yang jelas.", tone: "bg-primary-soft text-primary" },
  { icon: PencilLine, title: "Latihan Soal", text: "Latihan singkat dengan penilaian otomatis dan pembahasan.", tone: "bg-teal-soft text-teal" },
  { icon: ClipboardCheck, title: "Evaluasi", text: "Evaluasi berkala untuk mengukur pemahaman dan kemajuan belajar.", tone: "bg-highlight-soft text-highlight-foreground" },
  { icon: Compass, title: "Rekomendasi Materi", text: "Saran materi berikutnya berdasarkan progres dan nilai, dengan alasan yang jelas.", tone: "bg-success-soft text-success" },
];

const LEVELS = [
  { level: "SD", title: "Sekolah Dasar", text: "Bahasa sederhana dan contoh nyata dari kehidupan sehari-hari." },
  { level: "SMP", title: "Sekolah Menengah Pertama", text: "Pengenalan konsep dan penerapannya dalam masalah praktis." },
  { level: "SMA", title: "Sekolah Menengah Atas", text: "Penjelasan lebih mendalam dan latihan yang lebih menantang." },
];

function Beranda() {
  return (
    <PublicLayout>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
              <HandHeart className="size-4" /> Yayasan Sosial Tangan Kasih
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Belajar Lebih Mudah, Raih Masa Depan Cerah</h1>
            <p className="mt-4 max-w-lg text-base text-primary-foreground/85 sm:text-lg">
              Platform belajar interaktif untuk siswa SD, SMP, dan SMA. Pelajari materi, kerjakan latihan, lihat nilaimu, dan dapatkan rekomendasi materi yang sesuai.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="hero"><Link to="/masuk">Mulai Belajar <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="heroOutline"><Link to="/pembelajaran">Jelajahi Materi</Link></Button>
            </div>
          </div>
          <img src={hero} alt="Tiga siswa SD, SMP, dan SMA belajar bersama menggunakan tablet" width={1280} height={1024} className="w-full rounded-3xl shadow-lift" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Semua yang dibutuhkan untuk belajar</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5 shadow-soft">
              <span className={`grid size-11 place-items-center rounded-xl ${f.tone}`}><f.icon className="size-5" /></span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-soft">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Sesuai jenjang pendidikan</h2>
          <p className="mt-2 text-muted-foreground">Setiap siswa hanya melihat materi dan soal untuk jenjangnya.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LEVELS.map((l) => (
              <div key={l.level} className="rounded-2xl border bg-card p-6 shadow-soft">
                <span className="font-display text-4xl font-extrabold text-primary">{l.level}</span>
                <h3 className="mt-2 font-bold">{l.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{l.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid items-center gap-6 rounded-3xl border bg-card p-6 shadow-card md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h2 className="text-2xl font-bold">Tentang Yayasan Sosial Tangan Kasih</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Yayasan Sosial Tangan Kasih di Tangerang mendampingi anak-anak dalam kegiatan belajar. Platform ini dikembangkan bersama mahasiswa melalui program pengabdian masyarakat agar anak-anak dapat belajar secara mandiri dan terarah.
            </p>
          </div>
          <Button asChild variant="outline" size="lg"><Link to="/tentang">Selengkapnya</Link></Button>
        </div>
      </section>
    </PublicLayout>
  );
}
