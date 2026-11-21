import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DOMAIN = "akun.tangankasih.local";
const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/, "Nama pengguna 3–30 karakter: huruf kecil, angka, titik, garis bawah, atau strip.");
const passwordSchema = z.string().min(8, "Kata sandi minimal 8 karakter.").max(72);
const nameSchema = z.string().trim().min(2, "Nama minimal 2 karakter.").max(80);
const levelSchema = z.enum(["SD", "SMP", "SMA"]);

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Ctx = { supabase: { rpc: (fn: never, args?: never) => PromiseLike<{ data: unknown }> }; userId: string };

async function assertPendamping(context: unknown) {
  const { supabase } = context as Ctx;
  const { data } = await supabase.rpc("is_pendamping" as never);
  if (!data) throw new Error("Akses ditolak: hanya pendamping yayasan.");
}
async function assertAdmin(context: unknown) {
  const { supabase, userId } = context as Ctx;
  const { data } = await supabase.rpc("has_role" as never, { _user_id: userId, _role: "admin" } as never);
  if (!data) throw new Error("Akses ditolak: hanya administrator yayasan.");
}
async function assertStudent(id: string) {
  const a = await admin();
  const { data } = await a.from("user_roles").select("role").eq("user_id", id);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("siswa") || roles.includes("pendamping")) throw new Error("Akun yang dipilih bukan akun siswa.");
}
async function usernameTaken(username: string, exceptId?: string) {
  const a = await admin();
  const { data } = await a.from("profiles").select("id").eq("username", username).maybeSingle();
  return !!data && data.id !== exceptId;
}

/** Apakah yayasan sudah memiliki administrator? (publik, hanya mengembalikan boolean) */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const a = await admin();
  const { count } = await a.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return { needsSetup: (count ?? 0) === 0 };
});

/** Penyiapan awal: hanya berhasil jika BELUM ada administrator sama sekali. */
export const setupInitialAdmin = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email("Email tidak valid."), username: usernameSchema, display_name: nameSchema, password: passwordSchema }).parse(i),
  )
  .handler(async ({ data }) => {
    const a = await admin();
    const { count } = await a.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Penyiapan awal sudah pernah dilakukan.");
    if (await usernameTaken(data.username)) throw new Error("Nama pengguna sudah dipakai.");
    const { data: created, error } = await a.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true });
    if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat akun.");
    const id = created.user.id;
    await a.from("profiles").insert({ id, username: data.username, display_name: data.display_name });
    await a.from("user_roles").insert([{ user_id: id, role: "admin" }, { user_id: id, role: "pendamping" }]);
    return { ok: true };
  });

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ username: usernameSchema, display_name: nameSchema, level: levelSchema, password: passwordSchema }).parse(i))
  .handler(async ({ data, context }) => {
    await assertPendamping(context);
    if (await usernameTaken(data.username)) throw new Error("Nama pengguna sudah dipakai.");
    const a = await admin();
    const { data: created, error } = await a.auth.admin.createUser({ email: `${data.username}@${DOMAIN}`, password: data.password, email_confirm: true });
    if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat akun.");
    const id = created.user.id;
    const { error: e2 } = await a.from("profiles").insert({ id, username: data.username, display_name: data.display_name, level: data.level });
    if (e2) { await a.auth.admin.deleteUser(id); throw new Error(e2.message); }
    await a.from("user_roles").insert({ user_id: id, role: "siswa" });
    return { id };
  });

export const updateStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), username: usernameSchema, display_name: nameSchema, level: levelSchema, status: z.enum(["aktif", "nonaktif"]) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertPendamping(context);
    await assertStudent(data.id);
    if (await usernameTaken(data.username, data.id)) throw new Error("Nama pengguna sudah dipakai.");
    const a = await admin();
    const { data: current } = await a.from("profiles").select("username,status").eq("id", data.id).single();
    const authUpdate: { email?: string; email_confirm?: boolean; ban_duration?: string } = {};
    if (current?.username !== data.username) { authUpdate.email = `${data.username}@${DOMAIN}`; authUpdate.email_confirm = true; }
    if (current?.status !== data.status) authUpdate.ban_duration = data.status === "nonaktif" ? "876000h" : "none";
    if (Object.keys(authUpdate).length) {
      const { error } = await a.auth.admin.updateUserById(data.id, authUpdate);
      if (error) throw new Error(error.message);
    }
    const { error } = await a.from("profiles").update({ username: data.username, display_name: data.display_name, level: data.level, status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetStudentPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), password: passwordSchema }).parse(i))
  .handler(async ({ data, context }) => {
    await assertPendamping(context);
    await assertStudent(data.id);
    const a = await admin();
    const { error } = await a.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createPendamping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ email: z.string().trim().toLowerCase().email("Email tidak valid."), username: usernameSchema, display_name: nameSchema, password: passwordSchema }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (await usernameTaken(data.username)) throw new Error("Nama pengguna sudah dipakai.");
    const a = await admin();
    const { data: created, error } = await a.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true });
    if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat akun.");
    await a.from("profiles").insert({ id: created.user.id, username: data.username, display_name: data.display_name });
    await a.from("user_roles").insert({ user_id: created.user.id, role: "pendamping" });
    return { ok: true };
  });

export const setPendampingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["aktif", "nonaktif"]) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === (context as Ctx).userId) throw new Error("Anda tidak dapat menonaktifkan akun sendiri.");
    const a = await admin();
    await a.auth.admin.updateUserById(data.id, { ban_duration: data.status === "nonaktif" ? "876000h" : "none" });
    await a.from("profiles").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ display_name: nameSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const a = await admin();
    const { error } = await a.from("profiles").update({ display_name: data.display_name }).eq("id", (context as Ctx).userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
