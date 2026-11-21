/**
 * MESIN REKOMENDASI BERBASIS ATURAN (rule-based) — Tangan Kasih
 *
 * Tidak memakai machine learning / AI. Setiap rekomendasi dihasilkan oleh aturan
 * yang dapat dibaca dan diubah oleh tim yayasan. Urutan prioritas:
 *
 *  1. "Prasyarat"         — materi prasyarat yang belum selesai dari materi yang sedang/akan dipelajari.
 *  2. "Perlu Latihan"     — nilai terbaik kuis materi di bawah nilai lulus kuis, ATAU
 *                            rata-rata nilai mata pelajaran di bawah ambang penguasaan (pengaturan).
 *  3. "Materi Berikutnya" — semua prasyarat sudah selesai dan kuis prasyarat sudah lulus.
 *  4. "Belum Dipelajari"  — materi tanpa prasyarat yang belum diselesaikan (juga untuk siswa baru).
 *
 * Materi yang sudah selesai DAN kuisnya lulus (dikuasai) tidak direkomendasikan lagi.
 * Ambang batas diatur pendamping di menu Pengaturan Akun (tabel app_settings).
 */

export type RecCategory = "Prasyarat" | "Perlu Latihan" | "Materi Berikutnya" | "Belum Dipelajari";

export interface RecMaterial {
  id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  levels: string[];
  prerequisite_ids: string[];
  order_index: number;
}
export interface RecQuiz {
  id: string;
  title: string;
  material_id: string | null;
  subject_id: string;
  passing_score: number;
}
export interface RecAttempt {
  quiz_id: string;
  score: number;
}
export interface RecInput {
  level: string;
  materials: RecMaterial[];
  completedIds: Set<string>;
  openedIds: Set<string>;
  quizzes: RecQuiz[];
  attempts: RecAttempt[];
  masteryThreshold: number;
  maxResults: number;
}
export interface Recommendation {
  material: RecMaterial;
  category: RecCategory;
  reason: string;
  priority: number;
}

const PRIORITY: Record<RecCategory, number> = {
  Prasyarat: 1,
  "Perlu Latihan": 2,
  "Materi Berikutnya": 3,
  "Belum Dipelajari": 4,
};

export function buildRecommendations(input: RecInput): Recommendation[] {
  const { materials, completedIds, openedIds, quizzes, attempts, masteryThreshold, maxResults } = input;
  const byId = new Map(materials.map((m) => [m.id, m]));
  const best = new Map<string, number>();
  for (const a of attempts) best.set(a.quiz_id, Math.max(best.get(a.quiz_id) ?? -1, Number(a.score)));

  const quizzesByMaterial = new Map<string, RecQuiz[]>();
  for (const q of quizzes) if (q.material_id) quizzesByMaterial.set(q.material_id, [...(quizzesByMaterial.get(q.material_id) ?? []), q]);

  /** Materi lulus kuis bila semua kuisnya yang pernah dikerjakan ≥ nilai lulus dan minimal satu dikerjakan. */
  const quizStatus = (materialId: string): "lulus" | "belum_lulus" | "belum_dikerjakan" | "tanpa_kuis" => {
    const qs = quizzesByMaterial.get(materialId) ?? [];
    if (!qs.length) return "tanpa_kuis";
    const tried = qs.filter((q) => best.has(q.id));
    if (!tried.length) return "belum_dikerjakan";
    return tried.every((q) => (best.get(q.id) ?? 0) >= q.passing_score) ? "lulus" : "belum_lulus";
  };

  // Rata-rata nilai per mapel
  const subjectScores = new Map<string, number[]>();
  const quizById = new Map(quizzes.map((q) => [q.id, q]));
  for (const a of attempts) {
    const q = quizById.get(a.quiz_id);
    if (q) subjectScores.set(q.subject_id, [...(subjectScores.get(q.subject_id) ?? []), Number(a.score)]);
  }
  const subjectAvg = new Map<string, number>();
  subjectScores.forEach((v, k) => subjectAvg.set(k, v.reduce((a, b) => a + b, 0) / v.length));

  const out = new Map<string, Recommendation>();
  const add = (m: RecMaterial, category: RecCategory, reason: string) => {
    const prev = out.get(m.id);
    const priority = PRIORITY[category];
    if (!prev || priority < prev.priority) out.set(m.id, { material: m, category, reason, priority });
  };
  const prereqsDone = (m: RecMaterial) =>
    m.prerequisite_ids.filter((p) => byId.has(p)).every((p) => completedIds.has(p) && quizStatus(p) !== "belum_lulus");

  for (const m of materials) {
    const done = completedIds.has(m.id);
    const qs = quizStatus(m.id);

    // Aturan 1: prasyarat belum selesai untuk materi yang dibuka / berikutnya
    if (!done || openedIds.has(m.id)) {
      for (const pid of m.prerequisite_ids) {
        const p = byId.get(pid);
        if (p && !completedIds.has(pid)) {
          add(p, "Prasyarat", `Selesaikan materi ini dulu sebelum mempelajari "${m.title}".`);
        }
      }
    }

    // Aturan 2a: nilai kuis materi di bawah nilai lulus
    if (qs === "belum_lulus") {
      const q = (quizzesByMaterial.get(m.id) ?? []).find((x) => best.has(x.id) && (best.get(x.id) ?? 0) < x.passing_score)!;
      add(m, "Perlu Latihan", `Nilai terbaikmu di "${q.title}" adalah ${Math.round(best.get(q.id) ?? 0)}, di bawah nilai lulus ${q.passing_score}. Ulangi materi lalu coba lagi.`);
      continue;
    }

    if (done) continue; // sudah selesai & tidak ada masalah nilai → dianggap dikuasai

    // Aturan 2b: mapel lemah
    const avg = subjectAvg.get(m.subject_id);
    if (avg !== undefined && avg < masteryThreshold && prereqsDone(m)) {
      add(m, "Perlu Latihan", `Rata-rata nilai ${m.subject_name} kamu ${Math.round(avg)}, masih di bawah ${masteryThreshold}. Materi ini membantu memperkuatnya.`);
      continue;
    }

    // Aturan 3: materi berikutnya
    const realPrereqs = m.prerequisite_ids.filter((p) => byId.has(p));
    if (realPrereqs.length > 0 && prereqsDone(m)) {
      const names = realPrereqs.map((p) => byId.get(p)!.title).join(", ");
      add(m, "Materi Berikutnya", `Kamu sudah menuntaskan "${names}". Saatnya lanjut ke materi ini.`);
      continue;
    }

    // Aturan 4: belum dipelajari
    if (realPrereqs.length === 0) {
      add(
        m,
        "Belum Dipelajari",
        openedIds.has(m.id)
          ? "Kamu sudah membuka materi ini tetapi belum menyelesaikannya."
          : attempts.length === 0 && completedIds.size === 0
            ? `Materi awal yang cocok untuk memulai belajar di jenjang ${input.level}.`
            : `Materi ${m.subject_name} jenjang ${input.level} yang belum kamu pelajari.`,
      );
    }
  }

  return [...out.values()]
    .sort((a, b) => a.priority - b.priority || a.material.order_index - b.material.order_index || a.material.title.localeCompare(b.material.title))
    .slice(0, maxResults);
}
