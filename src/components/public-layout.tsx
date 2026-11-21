import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./common";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/tentang", label: "Tentang Kami" },
  { to: "/pembelajaran", label: "Pembelajaran" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const me = useMe();
  const dash = me ? (me.isPendamping ? "/pendamping" : "/siswa") : null;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground" activeProps={{ className: "text-primary bg-primary-soft" }}>
                {n.label}
              </Link>
            ))}
            {dash ? (
              <Button asChild className="ml-2"><Link to={dash}>Dasbor Saya</Link></Button>
            ) : (
              <Button asChild className="ml-2"><Link to="/masuk">Masuk</Link></Button>
            )}
          </nav>
          <button className="grid size-10 place-items-center rounded-lg hover:bg-accent md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Tutup menu" : "Buka menu"} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav className="border-t bg-card px-4 py-3 md:hidden" aria-label="Navigasi seluler">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}
            <Button asChild className="mt-2 w-full">
              <Link to={dash ?? "/masuk"} onClick={() => setOpen(false)}>{dash ? "Dasbor Saya" : "Masuk"}</Link>
            </Button>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Media pembelajaran interaktif untuk anak-anak di Yayasan Sosial Tangan Kasih, Tangerang.</p>
          </div>
          <div>
            <p className="font-semibold">Jelajahi</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link to="/tentang" className="hover:text-primary">Tentang Kami</Link></li>
              <li><Link to="/pembelajaran" className="hover:text-primary">Pratinjau Pembelajaran</Link></li>
              <li><Link to="/masuk" className="hover:text-primary">Masuk</Link></li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Program PKM</p>
            <p className="mt-2">Dikembangkan oleh mahasiswa sebagai Program Kreativitas Mahasiswa bidang Pengabdian kepada Masyarakat, untuk dikelola mandiri oleh yayasan.</p>
          </div>
        </div>
        <p className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Yayasan Sosial Tangan Kasih</p>
      </footer>
    </div>
  );
}
