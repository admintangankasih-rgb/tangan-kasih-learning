import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, KeyRound, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorBox, LevelBadge, Loading, PageHeader, Pill } from "@/components/common";
import { DataTable, Field, NativeSelect, td, useStudents } from "@/components/admin-kit";
import { createStudent, resetStudentPassword, updateStudent } from "@/lib/accounts.functions";
import { errorMessage, formatDate, LEVELS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pendamping/siswa")({
  head: () => ({ meta: [{ title: "Data Siswa — Tangan Kasih" }, { name: "description", content: "Kelola akun siswa yayasan." }] }),
  component: StudentsPage,
});

type Student = NonNullable<ReturnType<typeof useStudents>["data"]>["students"][number];

function StudentsPage() {
  const q = useStudents();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [editing, setEditing] = useState<Student | "new" | null>(null);
  const [resetting, setResetting] = useState<Student | null>(null);
  const list = (q.data?.students ?? []).filter(
    (s) => (!level || s.level === level) && (s.display_name + s.username).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div>
      <PageHeader title="Data Siswa" description="Buat akun siswa, ubah jenjang, nonaktifkan akun, atau atur ulang kata sandi." actions={<Button onClick={() => setEditing("new")}><Plus /> Tambah Siswa</Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Cari siswa" placeholder="Cari nama atau nama pengguna…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <NativeSelect aria-label="Filter jenjang" className="sm:w-40" value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Semua jenjang</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</NativeSelect>
      </div>
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : (
        <DataTable head={["Nama", "Nama pengguna", "Jenjang", "Status", "Terdaftar", "Aksi"]} empty={!list.length}>
          {list.map((s) => (
            <tr key={s.id}>
              <td className={`${td} font-medium`}>{s.display_name}</td>
              <td className={td}>{s.username}</td>
              <td className={td}><LevelBadge level={s.level} /></td>
              <td className={td}><Pill tone={s.status === "aktif" ? "success" : "muted"}>{s.status === "aktif" ? "Aktif" : "Nonaktif"}</Pill></td>
              <td className={td}>{formatDate(s.created_at)}</td>
              <td className={td}>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil /> Ubah</Button>
                  <Button size="sm" variant="ghost" onClick={() => setResetting(s)}><KeyRound /> Sandi</Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing === "new" ? "Tambah Siswa" : "Ubah Data Siswa"}</DialogTitle></DialogHeader>
          {editing && <StudentForm student={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!resetting} onOpenChange={(o) => !o && setResetting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atur Ulang Kata Sandi</DialogTitle></DialogHeader>
          {resetting && <ResetForm student={resetting} onDone={() => setResetting(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudentForm({ student, onDone }: { student: Student | null; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ display_name: student?.display_name ?? "", username: student?.username ?? "", level: student?.level ?? "SD", status: student?.status ?? "aktif", password: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (student) await updateStudent({ data: { id: student.id, display_name: f.display_name, username: f.username, level: f.level as "SD", status: f.status as "aktif" } });
      else await createStudent({ data: { display_name: f.display_name, username: f.username, level: f.level as "SD", password: f.password } });
      await qc.invalidateQueries({ queryKey: ["pd-students"] });
      toast.success(student ? "Data siswa diperbarui." : "Akun siswa dibuat. Berikan nama pengguna dan kata sandi kepada siswa.");
      onDone();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nama lengkap" htmlFor="sn"><Input id="sn" required minLength={2} value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></Field>
      <Field label="Nama pengguna" htmlFor="su" hint="Dipakai siswa untuk masuk. Huruf kecil, angka, titik, atau strip."><Input id="su" required pattern="[a-z0-9._\-]{3,30}" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase() })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenjang" htmlFor="sl"><NativeSelect id="sl" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as "SD" })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</NativeSelect></Field>
        {student && <Field label="Status akun" htmlFor="ss"><NativeSelect id="ss" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></NativeSelect></Field>}
      </div>
      {!student && <Field label="Kata sandi awal" htmlFor="sp" hint="Minimal 8 karakter."><Input id="sp" type="text" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>}
      <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />} Simpan</Button>
    </form>
  );
}

function ResetForm({ student, onDone }: { student: Student; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await resetStudentPassword({ data: { id: student.id, password: pw } });
      toast.success(`Kata sandi ${student.display_name} sudah diganti.`);
      onDone();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Kata sandi baru untuk <b>{student.display_name}</b> ({student.username}).</p>
      <Field label="Kata sandi baru" htmlFor="rp"><Input id="rp" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="animate-spin" />} Simpan Kata Sandi</Button>
    </form>
  );
}
