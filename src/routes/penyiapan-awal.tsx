import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/public-layout";
import { Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSetupStatus, setupInitialAdmin } from "@/lib/accounts.functions";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/penyiapan-awal")({
  head: () => ({
    meta: [
      { title: "Penyiapan Awal — Tangan Kasih" },
      { name: "description", content: "Pembuatan akun administrator pertama Yayasan Tangan Kasih." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Penyiapan Awal — Tangan Kasih" },
      { property: "og:description", content: "Penyiapan akun administrator yayasan." },
    ],
  }),
  component: Setup,
});

function Setup() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const status = useQuery({ queryKey: ["setup-status"], queryFn: () => getSetupStatus() });
  const [f, setF] = useState({ display_name: "", username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (f.password !== f.confirm) return setErr("Konfirmasi kata sandi tidak sama.");
    setLoading(true);
    try {
      await setupInitialAdmin({ data: { display_name: f.display_name, username: f.username, email: f.email, password: f.password } });
      toast.success("Akun administrator berhasil dibuat. Silakan masuk.");
      qc.invalidateQueries({ queryKey: ["setup-status"] });
      navigate({ to: "/masuk" });
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        {status.isLoading ? <Loading /> : !status.data?.needsSetup ? (
          <div className="rounded-3xl border bg-card p-6 text-center shadow-card">
            <ShieldCheck className="mx-auto size-10 text-success" />
            <h1 className="mt-3 text-xl font-bold">Penyiapan awal sudah selesai</h1>
            <p className="mt-1 text-sm text-muted-foreground">Akun pendamping baru hanya dapat dibuat oleh administrator dari dasbor.</p>
            <Button asChild className="mt-4"><Link to="/masuk">Ke halaman Masuk</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-6 shadow-card">
            <h1 className="text-2xl font-bold">Penyiapan Awal</h1>
            <p className="text-sm text-muted-foreground">Buat akun administrator yayasan pertama. Halaman ini otomatis terkunci setelah administrator dibuat.</p>
            {([
              ["display_name", "Nama lengkap", "text", "name"],
              ["username", "Nama pengguna", "text", "username"],
              ["email", "Email", "email", "email"],
              ["password", "Kata sandi (min. 8 karakter)", "password", "new-password"],
              ["confirm", "Ulangi kata sandi", "password", "new-password"],
            ] as const).map(([k, label, type, ac]) => (
              <div key={k} className="space-y-1.5">
                <Label htmlFor={k}>{label}</Label>
                <Input id={k} type={type} autoComplete={ac} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-11" />
              </div>
            ))}
            {err && <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{err}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>{loading && <Loader2 className="animate-spin" />} Buat Administrator</Button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
