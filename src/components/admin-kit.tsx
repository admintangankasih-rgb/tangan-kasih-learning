import type { ReactNode, SelectHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function NativeSelect({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      {children}
    </select>
  );
}

export function DataTable({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm text-muted-foreground">Belum ada data.</p>}
    </div>
  );
}

export const td = "px-3 py-2.5 align-top";

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name,slug,levels").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useStudents() {
  return useQuery({
    queryKey: ["pd-students"],
    queryFn: async () => {
      const [{ data: roles, error: e1 }, { data: profiles, error: e2 }] = await Promise.all([
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("profiles").select("*").order("display_name"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const siswa = new Set((roles ?? []).filter((r) => r.role === "siswa").map((r) => r.user_id));
      const pd = new Set((roles ?? []).filter((r) => r.role === "pendamping").map((r) => r.user_id));
      const admins = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      return {
        students: (profiles ?? []).filter((p) => siswa.has(p.id) && !pd.has(p.id)),
        pendamping: (profiles ?? []).filter((p) => pd.has(p.id)).map((p) => ({ ...p, isAdmin: admins.has(p.id) })),
      };
    },
  });
}

/** Ringkasan nilai & aktivitas semua siswa (RLS: pendamping boleh membaca semuanya). */
export function useLearningOverview() {
  return useQuery({
    queryKey: ["pd-overview"],
    queryFn: async () => {
      const [att, prog, mats, quizzes, settings, acts] = await Promise.all([
        supabase.from("quiz_attempts").select("id,user_id,quiz_id,score,passed,submitted_at,attempt_number").order("submitted_at", { ascending: false }),
        supabase.from("material_progress").select("user_id,material_id,status,last_opened_at,completed_at"),
        supabase.from("materials").select("id,title,levels,is_published,subject_id,subjects(name)"),
        supabase.from("quizzes").select("id,title,kind,level,subject_id,passing_score,subjects(name)"),
        supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("activity_logs").select("user_id,created_at").order("created_at", { ascending: false }).limit(2000),
      ]);
      for (const r of [att, prog, mats, quizzes]) if (r.error) throw r.error;
      return {
        attempts: att.data ?? [],
        progress: prog.data ?? [],
        materials: mats.data ?? [],
        quizzes: quizzes.data ?? [],
        settings: settings.data ?? { id: 1, mastery_threshold: 70, support_threshold: 60, max_recommendations: 6, inactive_days: 14, updated_at: "" },
        activities: acts.data ?? [],
      };
    },
  });
}

export function lastActiveMap(rows: { user_id: string; created_at?: string; submitted_at?: string; last_opened_at?: string }[]) {
  const m = new Map<string, string>();
  for (const r of rows) {
    const t = r.created_at ?? r.submitted_at ?? r.last_opened_at;
    if (!t) continue;
    const cur = m.get(r.user_id);
    if (!cur || cur < t) m.set(r.user_id, t);
  }
  return m;
}
