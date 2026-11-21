import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Level } from "@/lib/format";

export interface Me {
  id: string;
  email: string;
  username: string;
  displayName: string;
  level: Level | null;
  status: string;
  roles: string[];
  isAdmin: boolean;
  isPendamping: boolean;
  isSiswa: boolean;
}

export const meQuery = queryOptions({
  queryKey: ["me"],
  staleTime: 60_000,
  queryFn: async (): Promise<Me | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const r = (roles ?? []).map((x) => x.role as string);
    return {
      id: user.id,
      email: user.email ?? "",
      username: profile?.username ?? "",
      displayName: profile?.display_name ?? "Pengguna",
      level: (profile?.level as Level | null) ?? null,
      status: profile?.status ?? "aktif",
      roles: r,
      isAdmin: r.includes("admin"),
      isPendamping: r.includes("pendamping"),
      isSiswa: r.includes("siswa"),
    };
  },
});

export function useMe() {
  const q = useQuery(meQuery);
  return q.data ?? null;
}
