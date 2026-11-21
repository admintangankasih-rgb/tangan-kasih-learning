import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Pill } from "@/components/common";
import { Field, useStudents } from "@/components/admin-kit";
import { PasswordForm, ProfileForm } from "@/components/account-forms";
import { supabase } from "@/integrations/supabase/client";
import { createPendamping, setPendampingStatus } from "@/lib/accounts.functions";
import { errorMessage } from "@/lib/format";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/pendamping/pengaturan")({
  head: () => ({ meta: [{ title: "Pengaturan Akun — Tangan Kasih" }, { name: "description", content: "Profil, kata sandi, dan pengaturan yayasan." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const me = useMe();
  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan Akun" description="Profil Anda, kata sandi, aturan rekomendasi, dan akun pendamping." />
      <div className="grid gap-6 lg:grid-cols-2"><ProfileForm /><PasswordForm /></div>
      <ThresholdForm />
      {me?.isAdmin && <PendampingAccounts />}
    </div>
  );
}

function ThresholdForm() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["app-settings"], queryFn: async () => (await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle()).data });
  const [f, setF] = useState({ mastery_threshold: 70, support_threshold: 60, max_recommendations: 6, inactive_days: 14 });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) setF({ mastery_threshold: q.data.mastery_threshold, support_threshold: q.data.support_threshold, max_recommendations: q.data.max_recommendations, inactive_days: q.data.inactive_days }); }, [q.data]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("app_settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Pengaturan disimpan.");
    qc.invalidateQueries();
  }
  const fields: [keyof typeof f, string, string, number, number][] = [
    ["mastery_threshold", "Nilai tuntas", "Di bawah nilai ini, siswa direkomendasikan mengulang materi.", 0, 100],
    ["support_threshold", "Batas perlu pendampingan", "Rata-rata di bawah nilai ini ditandai di dasbor.", 0, 100],
    ["max_recommendations", "Jumlah rekomendasi", "Banyaknya materi yang disarankan ke siswa.", 1, 20],
    ["inactive_days", "Hari tanpa aktivitas", "Setelah sekian hari, siswa ditandai tidak aktif.", 1, 365],
  ];
  return (
    <Panel title="Aturan Rekomendasi & Pemantauan">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([k, l, h, min, max]) => <Field key={k} label={l} htmlFor={k} hint={h}><Input id={k} type="number" min={min} max={max} required value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} /></Field>)}
        </div>
        <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Simpan Aturan</Button>
      </form>
    </Panel>
  );
}

function PendampingAccounts() {
  const me = useMe();
  const qc = useQueryClient();
  const s = useStudents();
  const [f, setF] = useState({ display_name: "", username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createPendamping({ data: f });
      toast.success("Akun pendamping dibuat.");
      setF({ display_name: "", username: "", email: "", password: "" });
      qc.invalidateQueries({ queryKey: ["pd-students"] });
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  }
  async function toggle(id: string, status: string) {
    try {
      await setPendampingStatus({ data: { id, status: status === "aktif" ? "nonaktif" : "aktif" } });
      qc.invalidateQueries({ queryKey: ["pd-students"] });
    } catch (err) { toast.error(errorMessage(err)); }
  }
  return (
    <Panel title="Akun Pendamping (khusus administrator)">
      <ul className="mb-5 divide-y">
        {s.data?.pendamping.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
            <span className="min-w-0"><b>{p.display_name}</b> <span className="text-muted-foreground">({p.username})</span> {p.isAdmin && <Pill tone="primary">Admin</Pill>}</span>
            <span className="flex items-center gap-2">
              <Pill tone={p.status === "aktif" ? "success" : "muted"}>{p.status === "aktif" ? "Aktif" : "Nonaktif"}</Pill>
              {p.id !== me?.id && <Button size="sm" variant="outline" onClick={() => toggle(p.id, p.status)}>{p.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</Button>}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" htmlFor="pn"><Input id="pn" required value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></Field>
        <Field label="Nama pengguna" htmlFor="pu"><Input id="pu" required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} /></Field>
        <Field label="Email" htmlFor="pe"><Input id="pe" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Kata sandi awal" htmlFor="pp"><Input id="pp" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Button type="submit" disabled={busy} className="sm:col-span-2 sm:w-fit">{busy ? <Loader2 className="animate-spin" /> : <Plus />} Tambah Pendamping</Button>
      </form>
    </Panel>
  );
}
