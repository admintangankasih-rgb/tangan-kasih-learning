import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildRecommendations } from "@/lib/recommendations";
import { useMe } from "./use-me";

export interface StudentMaterial {
  id: string;
  title: string;
  summary: string;
  topic: string;
  levels: string[];
  difficulty: string;
  duration_minutes: number;
  prerequisite_ids: string[];
  order_index: number;
  subject_id: string;
  subjects: { name: string; slug: string; icon: string } | null;
}

/** Semua data belajar siswa yang sedang masuk. RLS memastikan hanya data miliknya & jenjangnya. */
export function useStudentData() {
  const me = useMe();
  const q = useQuery({
    queryKey: ["student-data", me?.id],
    enabled: !!me?.id,
    queryFn: async () => {
      const uid = me!.id;
      const [mats, prog, quizzes, attempts, settings, acts] = await Promise.all([
        supabase.from("materials").select("id,title,summary,topic,levels,difficulty,duration_minutes,prerequisite_ids,order_index,subject_id,subjects(name,slug,icon)").order("order_index"),
        supabase.from("material_progress").select("*").eq("user_id", uid),
        supabase.from("quizzes").select("id,title,description,kind,subject_id,material_id,level,passing_score,allow_retake,max_attempts,show_review,available_from,available_until,subjects(name)").order("title"),
        supabase.from("quiz_attempts").select("id,quiz_id,score,passed,attempt_number,submitted_at,correct_count,question_count").eq("user_id", uid).order("submitted_at", { ascending: false }),
        supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("activity_logs").select("id,type,description,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
      ]);
      for (const r of [mats, prog, quizzes, attempts]) if (r.error) throw r.error;
      return {
        materials: (mats.data ?? []) as unknown as StudentMaterial[],
        progress: prog.data ?? [],
        quizzes: quizzes.data ?? [],
        attempts: attempts.data ?? [],
        settings: settings.data ?? { mastery_threshold: 70, support_threshold: 60, max_recommendations: 6, inactive_days: 14 },
        activities: acts.data ?? [],
      };
    },
  });

  const d = q.data;
  const derived = d
    ? (() => {
        const completedIds = new Set(d.progress.filter((p) => p.status === "selesai").map((p) => p.material_id));
        const openedIds = new Set(d.progress.map((p) => p.material_id));
        const recommendations = buildRecommendations({
          level: me?.level ?? "",
          materials: d.materials.map((m) => ({ ...m, subject_name: m.subjects?.name ?? "" })),
          completedIds,
          openedIds,
          quizzes: d.quizzes,
          attempts: d.attempts.map((a) => ({ quiz_id: a.quiz_id, score: Number(a.score) })),
          masteryThreshold: d.settings.mastery_threshold,
          maxResults: d.settings.max_recommendations,
        });
        return { completedIds, openedIds, recommendations };
      })()
    : null;

  return { ...q, me, data: d, derived };
}
