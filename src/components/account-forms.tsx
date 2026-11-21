import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "./common";
import { supabase } from "@/integrations/supabase/client";
import { updateMyProfile } from "@/lib/accounts.functions";
import { errorMessage } from "@/lib/format";
import { useMe } from "@/hooks/use-me";

export function ProfileForm() {
  const me = useMe();
  const qc = useQueryClient();
  const [name, setName] = useState(me?.displayName ?? "");
  const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMyProfile({ data: { display_name: name } });
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profil berhasil diperbarui.");
    } catch (err) { toast.error(errorMessage(err)); } finally { setLoading(false); }
  }
  return (
    <Panel title="Data Profil">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="dn">Nama tampilan</Label><Input id="dn" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="text-muted-foreground">Nama pengguna</p><p className="font-medium">{me?.username}</p></div>
          {me?.level && <div><p className="text-muted-foreground">Jenjang</p><p className="font-medium">{me.level}</p></div>}
          {me?.isPendamping && <div><p className="text-muted-foreground">Email</p><p className="font-medium break-all">{me.email}</p></div>}
        </div>
        <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Simpan Profil</Button>
      </form>
    </Panel>
  );
}

export function PasswordForm() {
  const me = useMe();
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (f.next.length < 8) return setErr("Kata sandi baru minimal 8 karakter.");
    if (f.next !== f.confirm) return setErr("Konfirmasi kata sandi tidak sama.");
    setLoading(true);
    try {
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: me!.email, password: f.current });
      if (e1) throw new Error("Kata sandi saat ini salah.");
      const { error } = await supabase.auth.updateUser({ password: f.next });
      if (error) throw error;
      setF({ current: "", next: "", confirm: "" });
      toast.success("Kata sandi berhasil diganti.");
    } catch (er) { setErr(errorMessage(er)); } finally { setLoading(false); }
  }
  return (
    <Panel title="Ganti Kata Sandi">
      <form onSubmit={submit} className="space-y-4">
        {([["current", "Kata sandi saat ini", "current-password"], ["next", "Kata sandi baru", "new-password"], ["confirm", "Ulangi kata sandi baru", "new-password"]] as const).map(([k, l, ac]) => (
          <div key={k} className="space-y-1.5"><Label htmlFor={`pw-${k}`}>{l}</Label><Input id={`pw-${k}`} type="password" autoComplete={ac} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required /></div>
        ))}
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Ganti Kata Sandi</Button>
      </form>
    </Panel>
  );
}
