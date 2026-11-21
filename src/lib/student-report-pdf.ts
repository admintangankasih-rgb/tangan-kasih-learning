import { formatDateTime, formatScore, jakartaDayKey } from "./format";

export interface ReportData {
  student: { display_name: string; username: string; level: string | null; status: string };
  avg: number | null;
  done: number;
  total: number;
  support: boolean;
  inactive: boolean;
  lastActive: string | null;
  supportThreshold: number;
  materials: { title: string; subject: string; status: string; completed_at: string | null; last_opened_at: string }[];
  attempts: { quiz: string; kind: string; attempt: number; score: number; passed: boolean; submitted_at: string }[];
}

/** Membuat PDF laporan belajar satu siswa di peramban dan mengunduhnya. */
export async function downloadStudentReport(d: ReportData) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(194, 65, 12);
  doc.rect(0, 0, W, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(15).text("Laporan Belajar Siswa", 14, 11);
  doc.setFont("helvetica", "normal").setFontSize(9).text("Yayasan Sosial Tangan Kasih, Tangerang", 14, 18);
  doc.text(`Dicetak: ${formatDateTime(new Date())}`, W - 14, 18, { align: "right" });
  doc.setTextColor(30, 30, 30);

  autoTable(doc, {
    startY: 30, theme: "plain", styles: { fontSize: 10, cellPadding: 1.5 }, columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    body: [
      ["Nama", d.student.display_name],
      ["Nama pengguna", d.student.username],
      ["Jenjang", d.student.level ?? "-"],
      ["Status akun", d.student.status === "aktif" ? "Aktif" : "Nonaktif"],
      ["Materi selesai", `${d.done} dari ${d.total} materi (${d.total ? Math.round((d.done / d.total) * 100) : 0}%)`],
      ["Jumlah pengerjaan kuis", String(d.attempts.length)],
      ["Rata-rata nilai", formatScore(d.avg)],
      ["Terakhir aktif", d.lastActive ? formatDateTime(d.lastActive) : "Belum pernah"],
      ["Catatan", [d.support ? `Perlu pendampingan (rata-rata di bawah ${d.supportThreshold})` : "", d.inactive ? "Tidak aktif belakangan ini" : ""].filter(Boolean).join("; ") || "Belajar dengan baik"],
    ],
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold").setFontSize(12).text("Hasil Latihan dan Evaluasi", 14, y);
  autoTable(doc, {
    startY: y + 3, headStyles: { fillColor: [15, 118, 110] }, styles: { fontSize: 9 },
    head: [["Tanggal", "Kuis", "Jenis", "Ke-", "Nilai", "Lulus"]],
    body: d.attempts.length ? d.attempts.map((a) => [formatDateTime(a.submitted_at), a.quiz, a.kind === "evaluasi" ? "Evaluasi" : "Latihan", a.attempt, formatScore(a.score), a.passed ? "Ya" : "Belum"]) : [["-", "Belum ada pengerjaan", "", "", "", ""]],
  });

  const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold").setFontSize(12).text("Progres Materi", 14, y2);
  autoTable(doc, {
    startY: y2 + 3, headStyles: { fillColor: [15, 118, 110] }, styles: { fontSize: 9 },
    head: [["Materi", "Mapel", "Status", "Terakhir dibuka", "Selesai"]],
    body: d.materials.length ? d.materials.map((m) => [m.title, m.subject, m.status === "selesai" ? "Selesai" : "Sedang dipelajari", formatDateTime(m.last_opened_at), m.completed_at ? formatDateTime(m.completed_at) : "-"]) : [["Belum membuka materi", "", "", "", ""]],
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(120, 120, 120);
    doc.text(`Halaman ${i} dari ${pages}`, W - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }
  doc.save(`laporan-${d.student.username}-${jakartaDayKey(new Date())}.pdf`);
}
