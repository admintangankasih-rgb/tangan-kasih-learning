import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { meQuery } from "@/hooks/use-me";
import { errorMessage, loginIdentifierToEmail } from "@/lib/format";


export const Route = createFileRoute("/masuk")({
  head: () => ({
    meta: [
      { title: "Masuk — Tangan Kasih" },
      { name: "description", content: "Masuk ke platform belajar Tangan Kasih untuk siswa dan pendamping yayasan." },
      { property: "og:title", content: "Masuk — Tangan Kasih" },
      { property: "og:description", content: "Halaman masuk siswa dan pendamping Yayasan Tangan Kasih." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Masuk,
});

function Masuk() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ id?: string; pw?: string; form?: string }>({});

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!id.trim()) errs.id = "Nama pengguna atau email wajib diisi.";
    if (!pw) errs.pw = "Kata sandi wajib diisi.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginIdentifierToEmail(id), password: pw });
      if (error) throw error;
      qc.removeQueries({ queryKey: ["me"] });
      const me = await qc.fetchQuery(meQuery);
      if (!me || me.status !== "aktif" || (!me.isSiswa && !me.isPendamping)) {
        await supabase.auth.signOut();
        throw new Error("Akun belum aktif atau belum memiliki peran. Hubungi pendamping yayasan.");
      }
      if (me.isSiswa) await supabase.from("activity_logs").insert({ user_id: me.id, type: "masuk", description: "Masuk ke aplikasi" });
      toast.success(`Selamat datang, ${me.displayName}!`);
      navigate({ to: me.isPendamping ? "/pendamping" : "/siswa", replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
        <div className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold">Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">Siswa masuk dengan nama pengguna. Pendamping dapat memakai email.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="id">Nama pengguna atau email</Label>
              <Input id="id" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} aria-invalid={!!errors.id} aria-describedby={errors.id ? "id-err" : undefined} className="h-11" />
              {errors.id && <p id="id-err" className="text-sm text-destructive">{errors.id}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Kata sandi</Label>
              <div className="relative">
                <Input id="pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={!!errors.pw} className="h-11 pr-11" />
                <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.pw && <p className="text-sm text-destructive">{errors.pw}</p>}
            </div>
            {errors.form && <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{errors.form}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <LogIn />} Masuk
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">Lupa kata sandi? Hubungi pendamping yayasan untuk mengatur ulang.</p>
        </div>
              </div>
    </PublicLayout>
  );
}
