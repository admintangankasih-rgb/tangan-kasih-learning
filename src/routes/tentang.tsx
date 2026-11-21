import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Users, ShieldCheck, Compass } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — Tangan Kasih" },
      { name: "description", content: "Tujuan platform belajar Tangan Kasih dan kolaborasi dengan Yayasan Sosial Tangan Kasih." },
      { property: "og:title", content: "Tentang Kami — Tangan Kasih" },
      { property: "og:description", content: "Media pembelajaran interaktif hasil kolaborasi mahasiswa dan Yayasan Sosial Tangan Kasih." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tentang,
});

const POINTS = [
  { icon: Target, title: "Tujuan pendidikan", text: "Membantu anak belajar secara mandiri dengan materi yang sesuai jenjang, latihan dengan umpan balik langsung, dan evaluasi berkala." },
  { icon: Compass, title: "Rekomendasi yang transparan", text: "Saran materi dibuat dengan aturan sederhana yang dapat dibaca: prasyarat, nilai latihan, dan progres belajar. Tidak memakai kecerdasan buatan." },
  { icon: Users, title: "Didampingi pendamping", text: "Pendamping yayasan mengelola akun siswa, materi, soal, dan memantau perkembangan setiap anak." },
  { icon: ShieldCheck, title: "Aman dan tertutup", text: "Tidak ada pendaftaran umum. Akun siswa dibuat oleh pendamping, dan setiap siswa hanya dapat melihat data belajarnya sendiri." },
];

function Tentang() {
  return (
    <PublicLayout>
      <section className="bg-soft">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Tentang Kami</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Platform ini adalah bagian dari kegiatan Program Kreativitas Mahasiswa bidang Pengabdian kepada Masyarakat berjudul
            <em> “Pengembangan dan Penerapan Media Pembelajaran Interaktif Berbasis Web dengan Rekomendasi Materi Pembelajaran bagi Anak di Yayasan Tangan Kasih”</em>.
          </p>
          <p className="mt-4 text-muted-foreground">
            Aplikasi dikembangkan oleh tim mahasiswa bersama Yayasan Sosial Tangan Kasih di Tangerang, dan akan diserahkan kepada yayasan untuk dikelola secara mandiri.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-12 sm:grid-cols-2">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border bg-card p-5 shadow-soft">
            <p.icon className="size-6 text-teal" />
            <h2 className="mt-3 text-lg font-bold">{p.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </section>
      <div className="mx-auto max-w-4xl px-4 pb-14">
        <Button asChild size="lg"><Link to="/pembelajaran">Lihat pratinjau materi</Link></Button>
      </div>
    </PublicLayout>
  );
}
