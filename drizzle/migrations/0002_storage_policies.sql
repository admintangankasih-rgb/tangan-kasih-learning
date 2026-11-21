
CREATE POLICY "Pengguna masuk dapat melihat gambar materi" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'materi');
CREATE POLICY "Pendamping unggah gambar materi" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materi' AND public.is_pendamping());
CREATE POLICY "Pendamping ubah gambar materi" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi' AND public.is_pendamping());
CREATE POLICY "Pendamping hapus gambar materi" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi' AND public.is_pendamping());
