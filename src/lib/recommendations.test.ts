import { describe, expect, it } from "vitest";
import { buildRecommendations, type RecInput, type RecMaterial } from "./recommendations";

const mat = (id: string, prereq: string[] = [], order = 1, subject = "mtk"): RecMaterial => ({
  id, title: id, subject_id: subject, subject_name: subject, levels: ["SD"], prerequisite_ids: prereq, order_index: order,
});
const base = (over: Partial<RecInput> = {}): RecInput => ({
  level: "SD",
  materials: [mat("A"), mat("B", ["A"], 2)],
  completedIds: new Set(),
  openedIds: new Set(),
  quizzes: [{ id: "qA", title: "Kuis A", material_id: "A", subject_id: "mtk", passing_score: 70 }],
  attempts: [],
  masteryThreshold: 70,
  maxResults: 6,
  ...over,
});
const cat = (r: ReturnType<typeof buildRecommendations>, id: string) => r.find((x) => x.material.id === id)?.category;

describe("rekomendasi berbasis aturan", () => {
  it("siswa baru mendapat materi prasyarat yang belum dipelajari, bukan materi lanjutan", () => {
    const r = buildRecommendations(base());
    expect(cat(r, "A")).toBe("Prasyarat");
    expect(cat(r, "B")).toBeUndefined();
  });

  it("nilai di bawah nilai lulus memberi kategori Perlu Latihan", () => {
    const r = buildRecommendations(base({ completedIds: new Set(["A"]), attempts: [{ quiz_id: "qA", score: 50 }] }));
    expect(cat(r, "A")).toBe("Perlu Latihan");
    expect(cat(r, "B")).toBeUndefined();
  });

  it("prasyarat selesai dan lulus memunculkan Materi Berikutnya", () => {
    const r = buildRecommendations(base({ completedIds: new Set(["A"]), attempts: [{ quiz_id: "qA", score: 80 }] }));
    expect(cat(r, "B")).toBe("Materi Berikutnya");
    expect(cat(r, "A")).toBeUndefined();
  });

  it("materi yang sudah dikuasai tidak direkomendasikan lagi", () => {
    const r = buildRecommendations(base({ completedIds: new Set(["A", "B"]), attempts: [{ quiz_id: "qA", score: 100 }] }));
    expect(r).toHaveLength(0);
  });

  it("membatasi jumlah rekomendasi sesuai pengaturan", () => {
    const materials = Array.from({ length: 10 }, (_, i) => mat(`M${i}`, [], i));
    const r = buildRecommendations(base({ materials, quizzes: [], maxResults: 3 }));
    expect(r).toHaveLength(3);
  });
});
