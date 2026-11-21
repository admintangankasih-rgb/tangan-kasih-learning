/** Aturan ringkasan siswa untuk dasbor pendamping. */
export interface StatInput {
  scores: number[];
  lastActive: string | null;
  now: number;
  supportThreshold: number;
  inactiveDays: number;
}

export function averageScore(scores: number[]) {
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

/** Siswa perlu pendampingan bila rata-rata nilainya di bawah ambang dukungan. */
export function needsSupport(i: StatInput) {
  const avg = averageScore(i.scores);
  return avg !== null && avg < i.supportThreshold;
}

/** Siswa dianggap tidak aktif bila tidak ada aktivitas selama `inactiveDays` hari atau belum pernah aktif. */
export function isInactive(i: StatInput) {
  if (!i.lastActive) return true;
  return i.now - new Date(i.lastActive).getTime() > i.inactiveDays * 86400000;
}
