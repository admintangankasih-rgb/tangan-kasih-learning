# Catatan Perubahan Multimedia

Perubahan yang diterapkan pada source code:

1. Form Bank Soal sekarang mendukung sisipkan berkas pada pertanyaan, setiap pilihan jawaban, dan pembahasan.
2. Pertanyaan, pilihan jawaban, dan pembahasan menampilkan pratinjau menggunakan komponen `Markdown` yang sama dengan halaman materi.
3. Halaman pengerjaan kuis siswa merender Markdown pada pertanyaan dan pilihan jawaban, sehingga media yang sudah tersimpan ikut tampil.
4. Halaman pembahasan hasil kuis merender Markdown pada pertanyaan, pilihan, dan penjelasan.
5. Renderer media memperbaiki elemen pembungkus untuk audio/video/PDF/dokumen dan menambahkan tautan buka/unduh pada audio dan video.
6. Upload materi menggunakan fungsi upload bersama dengan validasi ekstensi dan batas ukuran yang sama seperti upload di bank soal.
7. Upload menyimpan content type, cache control, dan tidak menimpa file lain (`upsert: false`). Nama file dicatat pada teks alternatif Markdown; path disimpan di konten soal/materi; Supabase Storage menyimpan metadata objek seperti ukuran dan MIME type.

## Batasan verifikasi

- Pemeriksaan sintaks TypeScript/TSX pada enam file yang berubah berhasil.
- Build penuh, lint, dan test suite belum dapat dijalankan karena dependensi proyek belum berhasil dipasang pada lingkungan ini.
- Pengujian upload sungguhan, signed URL, refresh, dan akses akun siswa memerlukan koneksi ke proyek Supabase/Lovable yang aktif. Hal tersebut belum dapat diklaim berhasil dari ZIP saja.
- Migrasi database tidak diubah. Kebijakan Storage yang sudah ada mengizinkan pengguna terautentikasi membaca bucket `materi` dan membatasi upload ke pendamping. Keberadaan bucket `materi` pada proyek Supabase aktif tetap perlu diverifikasi.

## File yang diubah

- `src/routes/_authenticated/pendamping.soal.tsx`
- `src/routes/_authenticated/pendamping.materi.tsx`
- `src/routes/_authenticated/siswa.kuis.$id.tsx`
- `src/components/attempt-review.tsx`
- `src/components/markdown.tsx`
- `src/components/media-upload.tsx`

## Keputusan fitur chatbot

Chatbot/Tutor AI dihapus dari halaman materi siswa sesuai keputusan pengelola program. Integrasi OpenAI API, server function chatbot, dan konfigurasi OPENAI_API_KEY juga dihapus. Fitur rekomendasi materi berbasis algoritma Decision Tree serta pembahasan soal yang disusun pembimbing tetap dipertahankan.
