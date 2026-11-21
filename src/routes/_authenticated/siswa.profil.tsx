import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common";
import { PasswordForm, ProfileForm } from "@/components/account-forms";

export const Route = createFileRoute("/_authenticated/siswa/profil")({
  head: () => ({ meta: [{ title: "Profil Saya — Tangan Kasih" }, { name: "description", content: "Profil dan kata sandi." }] }),
  component: () => (
    <div>
      <PageHeader title="Profil Saya" description="Ubah nama tampilan dan kata sandi. Jenjang hanya dapat diubah oleh pendamping." />
      <div className="grid gap-6 lg:grid-cols-2"><ProfileForm /><PasswordForm /></div>
    </div>
  ),
});
