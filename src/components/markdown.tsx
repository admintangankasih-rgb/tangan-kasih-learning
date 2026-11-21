import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Gambar yang diunggah pendamping disimpan sebagai "storage:<path>" di bucket privat "materi". */
export const STORAGE_PREFIX = "storage:";

export type MediaKind = "image" | "pdf" | "video" | "audio" | "file";
export function mediaKind(src: string): MediaKind {
  const ext = (src.split("?")[0] ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) return "file";
  return "image";
}

function StoredImage({ src, alt }: { src: string; alt: string }) {
  const stored = src.startsWith(STORAGE_PREFIX);
  const [url, setUrl] = useState<string | undefined>(stored ? undefined : src);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!stored) { setUrl(src); return; }
    let alive = true;
    const load = () => supabase.storage.from("materi").createSignedUrl(src.slice(STORAGE_PREFIX.length), 3600).then(({ data }) => {
      if (!alive) return;
      if (data?.signedUrl) { setUrl(data.signedUrl); setFailed(false); } else setFailed(true);
    });
    load();
    // Perbarui tautan sebelum kedaluwarsa (1 jam).
    const t = setInterval(load, 50 * 60 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, [src, stored]);
  if (failed) return <div className="my-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">Berkas tidak dapat dimuat: {alt || "berkas"}</div>;
  const kind = mediaKind(src);
  if (!url) return <div className="my-2 h-40 animate-pulse rounded-md bg-muted" aria-label="Memuat berkas" />;
  const download = <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium">Unduh / buka berkas: {alt || "berkas"}</a>;
  if (kind === "pdf") return <div className="my-3 space-y-2"><iframe src={url} title={alt || "Dokumen PDF"} className="h-[70vh] w-full rounded-md border" />{download}</div>;
  if (kind === "video") return <div className="my-3"><video src={url} controls preload="metadata" playsInline className="w-full rounded-md bg-muted" aria-label={alt} />{download}</div>;
  if (kind === "audio") return <div className="my-3 space-y-1"><audio src={url} controls preload="metadata" className="w-full" aria-label={alt} />{download}</div>;
  if (kind === "file") return <div className="my-3 rounded-md border p-3">📄 {download}</div>;
  return <img src={url} alt={alt} loading="lazy" className="max-w-full rounded-md" />;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export function extractToc(md: string) {
  return md
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.slice(3).trim();
      return { text, id: slugify(text) };
    });
}

function textOf(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  if (children && typeof children === "object" && "props" in children) return textOf((children as { props: { children: ReactNode } }).props.children);
  return "";
}

/** react-markdown membuang skema URL yang tidak dikenal; izinkan "storage:" untuk berkas unggahan. */
function urlTransform(url: string) {
  if (url.startsWith(STORAGE_PREFIX)) return url;
  return defaultUrlTransform(url);
}

/** Renderer tunggal untuk editor, pratinjau, dan halaman siswa. `inline` untuk soal & pilihan jawaban. */
export function Markdown({ content, inline = false }: { content: string; inline?: boolean }) {
  return (
    <div className={inline ? "media-inline min-w-0 space-y-2 [&_img]:max-h-72 [&_p]:m-0" : "prose-materi"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={urlTransform}
        components={{
          h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{children}</a>,
          img: ({ src, alt }) => <StoredImage src={typeof src === "string" ? src : ""} alt={alt ?? ""} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
