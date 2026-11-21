import { useState, type ChangeEvent } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { STORAGE_PREFIX } from "@/components/markdown";

export const MEDIA_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,video/mp4,video/webm,video/quicktime,.mov,audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/aac,.m4a,.mp3,.wav";
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "mp4", "webm", "mov", "m4v", "mp3", "wav", "ogg", "m4a", "aac"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

/** Validasi + unggah ke bucket privat "materi". Mengembalikan potongan markdown untuk disisipkan. */
export async function uploadMedia(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) { toast.error("Jenis berkas tidak didukung."); return null; }
  const limit = IMAGE_EXT.includes(ext) ? 5 : 50;
  if (file.size > limit * 1024 * 1024) { toast.error(`Ukuran berkas maksimal ${limit} MB.`); return null; }
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("materi").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) { toast.error(`Gagal mengunggah: ${errorMessage(error)}`); return null; }
  const alt = file.name.replace(/\.[^.]+$/, "").replace(/[[\]()]/g, "");
  return `![${alt}](${STORAGE_PREFIX}${path})`;
}

/** Tombol sisipkan berkas: menyisipkan media di posisi kursor elemen `targetId`. */
export function MediaInsertButton({ targetId, value, onChange, label = "Sisipkan berkas" }: { targetId: string; value: string; onChange: (v: string) => void; label?: string }) {
  const [busy, setBusy] = useState(false);
  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const el = document.getElementById(targetId) as HTMLTextAreaElement | HTMLInputElement | null;
    const pos = el?.selectionStart ?? value.length;
    setBusy(true);
    const md = await uploadMedia(file);
    setBusy(false);
    if (!md) return;
    const snippet = `\n${md}\n`;
    onChange(value.slice(0, pos) + snippet + value.slice(pos));
    toast.success("Berkas disisipkan.");
  }
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />} {busy ? "Mengunggah…" : label}
      <input type="file" accept={MEDIA_ACCEPT} className="sr-only" disabled={busy} onChange={pick} />
    </label>
  );
}
