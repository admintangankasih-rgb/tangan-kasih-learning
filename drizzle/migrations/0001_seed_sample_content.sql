
CREATE OR REPLACE FUNCTION public._seed_q(p_quiz uuid, p_subject uuid, p_level public.edu_level, p_topic text, p_pos int, p_prompt text, p_opts jsonb, p_correct int, p_expl text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  INSERT INTO public.questions (subject_id, level, topic, type, prompt, options, correct_index, explanation, points)
  VALUES (p_subject, p_level, p_topic, CASE WHEN p_opts = '["Benar","Salah"]'::jsonb THEN 'benar_salah' ELSE 'pilihan_ganda' END, p_prompt, p_opts, p_correct, p_expl, 10)
  RETURNING id INTO v;
  INSERT INTO public.quiz_questions (quiz_id, question_id, position) VALUES (p_quiz, v, p_pos);
  RETURN v;
END $$;

DO $$
DECLARE
  s_mtk uuid; s_bi uuid; s_en uuid; s_ipa uuid;
  m uuid; m2 uuid; qz uuid; ev uuid;
BEGIN
  INSERT INTO public.subjects (name, slug, description, icon) VALUES
   ('Matematika','matematika','Berhitung, bilangan, aljabar, dan pemecahan masalah.','calculator') RETURNING id INTO s_mtk;
  INSERT INTO public.subjects (name, slug, description, icon) VALUES
   ('Bahasa Indonesia','bahasa-indonesia','Membaca, menulis, dan memahami teks.','book-open') RETURNING id INTO s_bi;
  INSERT INTO public.subjects (name, slug, description, icon) VALUES
   ('Bahasa Inggris','bahasa-inggris','Kosakata, tata bahasa, dan percakapan sederhana.','languages') RETURNING id INTO s_en;
  INSERT INTO public.subjects (name, slug, description, icon) VALUES
   ('IPA / IPAS','ipa','Mengenal alam, makhluk hidup, dan gejala sains.','flask-conical') RETURNING id INTO s_ipa;

  ---------------- SD ----------------
  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Penjumlahan dan Pengurangan Sampai 100', s_mtk, 'Bilangan', '{SD}', 'mudah', 15,
   'Belajar menjumlah dan mengurangi bilangan dengan contoh benda sehari-hari.',
   ARRAY['Menjumlahkan dua bilangan sampai 100','Mengurangkan bilangan sampai 100','Menyelesaikan soal cerita sederhana'],
   E'## Apa itu penjumlahan?\nPenjumlahan artinya **menggabungkan** dua kelompok benda. Jika kamu punya 12 kelereng lalu diberi 5 kelereng, sekarang kelerengmu ada 12 + 5 = **17**.\n\n## Apa itu pengurangan?\nPengurangan artinya **mengambil** sebagian benda. Jika ada 20 kue lalu dimakan 6, sisanya 20 − 6 = **14**.\n\n## Cara bersusun\nUntuk bilangan puluhan, jumlahkan **satuan** dulu, lalu **puluhan**.\n\n- 34 + 25 → satuan: 4 + 5 = 9, puluhan: 3 + 2 = 5 → **59**\n- 48 − 23 → satuan: 8 − 3 = 5, puluhan: 4 − 2 = 2 → **25**\n\n## Soal cerita\nIbu membeli 30 telur. Sebanyak 8 telur dipakai membuat kue. Berapa sisa telur? Jawab: 30 − 8 = **22 telur**.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, prerequisite_ids, order_index, is_published, is_sample)
  VALUES ('Mengenal Perkalian', s_mtk, 'Bilangan', '{SD}', 'sedang', 20,
   'Perkalian adalah penjumlahan berulang. Yuk pahami dengan contoh kelompok benda.',
   ARRAY['Memahami perkalian sebagai penjumlahan berulang','Menghafal perkalian 1 sampai 5','Menggunakan perkalian dalam soal cerita'],
   E'## Perkalian adalah penjumlahan berulang\nAda 3 piring, setiap piring berisi 4 apel. Jumlah apel = 4 + 4 + 4 = 12. Ini bisa ditulis **3 × 4 = 12**.\n\n## Sifat pertukaran\n3 × 4 hasilnya sama dengan 4 × 3, yaitu 12. Urutan boleh ditukar!\n\n## Tips menghafal\n- Perkalian dengan 1 hasilnya bilangan itu sendiri: 7 × 1 = 7\n- Perkalian dengan 10 tinggal menambah angka 0: 6 × 10 = 60\n- Perkalian dengan 5 hasilnya selalu berakhir 0 atau 5\n\n## Soal cerita\nSatu kotak pensil berisi 5 pensil. Berapa pensil di dalam 4 kotak? Jawab: 4 × 5 = **20 pensil**.',
   ARRAY[m], 2, true, true) RETURNING id INTO m2;

  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Penjumlahan dan Pengurangan', 'Uji pemahamanmu tentang penjumlahan dan pengurangan.', 'latihan', s_mtk, m, 'SD', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_mtk, 'SD', 'Bilangan', 1, 'Berapa hasil 34 + 25?', '["49","59","69","58"]', 1, 'Satuan 4+5=9, puluhan 3+2=5, jadi 59.');
  PERFORM public._seed_q(qz, s_mtk, 'SD', 'Bilangan', 2, 'Ada 20 kue, dimakan 6. Berapa sisanya?', '["14","16","26","12"]', 0, '20 − 6 = 14.');
  PERFORM public._seed_q(qz, s_mtk, 'SD', 'Bilangan', 3, '48 − 23 = 25', '["Benar","Salah"]', 0, 'Satuan 8−3=5, puluhan 4−2=2, jadi 25.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Perkalian Dasar', 'Latihan perkalian sebagai penjumlahan berulang.', 'latihan', s_mtk, m2, 'SD', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_mtk, 'SD', 'Bilangan', 1, '3 piring masing-masing berisi 4 apel. Berapa jumlah apel?', '["7","12","10","14"]', 1, '3 × 4 = 12.');
  PERFORM public._seed_q(qz, s_mtk, 'SD', 'Bilangan', 2, 'Berapa hasil 6 × 10?', '["16","60","600","66"]', 1, 'Perkalian dengan 10 tinggal menambah 0.');
  PERFORM public._seed_q(qz, s_mtk, 'SD', 'Bilangan', 3, '4 × 3 hasilnya sama dengan 3 × 4.', '["Benar","Salah"]', 0, 'Sifat pertukaran pada perkalian.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Menemukan Ide Pokok Paragraf', s_bi, 'Membaca', '{SD}', 'mudah', 15,
   'Belajar menemukan gagasan utama dari sebuah paragraf pendek.',
   ARRAY['Menjelaskan arti ide pokok','Menemukan kalimat utama','Membedakan ide pokok dan penjelas'],
   E'## Apa itu ide pokok?\nIde pokok adalah **hal utama** yang dibicarakan dalam satu paragraf.\n\n## Di mana letaknya?\nBiasanya ide pokok ada di **kalimat pertama** atau **kalimat terakhir** paragraf. Kalimat yang memuat ide pokok disebut **kalimat utama**.\n\n## Contoh\n> Kucing adalah hewan peliharaan yang lucu. Bulunya lembut. Ia suka bermain bola benang. Kucing juga suka tidur di tempat hangat.\n\nIde pokoknya: **kucing adalah hewan peliharaan yang lucu**. Kalimat lainnya adalah kalimat penjelas.\n\n## Cara mudah\nTanyakan pada dirimu: *"Paragraf ini sebagian besar membicarakan apa?"*',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Ide Pokok', 'Temukan ide pokok dari paragraf.', 'latihan', s_bi, m, 'SD', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_bi, 'SD', 'Membaca', 1, 'Kalimat yang berisi ide pokok disebut…', '["Kalimat penjelas","Kalimat utama","Kalimat tanya","Kalimat seru"]', 1, 'Kalimat utama memuat ide pokok.');
  PERFORM public._seed_q(qz, s_bi, 'SD', 'Membaca', 2, '"Kucing adalah hewan peliharaan yang lucu. Bulunya lembut." Ide pokoknya adalah…', '["Bulu kucing lembut","Kucing hewan peliharaan yang lucu","Kucing suka tidur","Kucing suka bola"]', 1, 'Kalimat pertama adalah kalimat utama.');
  PERFORM public._seed_q(qz, s_bi, 'SD', 'Membaca', 3, 'Ide pokok selalu terletak di tengah paragraf.', '["Benar","Salah"]', 1, 'Biasanya di awal atau akhir paragraf.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Greetings: Menyapa dalam Bahasa Inggris', s_en, 'Percakapan', '{SD}', 'mudah', 10,
   'Ucapan salam sehari-hari dalam bahasa Inggris dan cara menjawabnya.',
   ARRAY['Mengucapkan salam pagi, siang, dan malam','Memperkenalkan diri','Menjawab sapaan'],
   E'## Salam sesuai waktu\n- **Good morning** = Selamat pagi\n- **Good afternoon** = Selamat siang/sore\n- **Good evening** = Selamat malam (saat bertemu)\n- **Good night** = Selamat tidur/malam (saat berpisah)\n\n## Memperkenalkan diri\n- *Hello, my name is Budi.* = Halo, nama saya Budi.\n- *Nice to meet you.* = Senang bertemu denganmu.\n\n## Menanyakan kabar\n- *How are you?* → *I am fine, thank you.*\n\n## Coba praktikkan\nSapa temanmu besok pagi dengan **"Good morning!"**',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Greetings', 'Latihan ucapan salam.', 'latihan', s_en, m, 'SD', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_en, 'SD', 'Percakapan', 1, 'Bahasa Inggris dari "Selamat pagi" adalah…', '["Good night","Good morning","Good evening","Goodbye"]', 1, 'Good morning = selamat pagi.');
  PERFORM public._seed_q(qz, s_en, 'SD', 'Percakapan', 2, 'Jawaban yang tepat untuk "How are you?" adalah…', '["My name is Ani","I am fine, thank you","Good night","Nice to meet you"]', 1, 'I am fine, thank you = Saya baik, terima kasih.');
  PERFORM public._seed_q(qz, s_en, 'SD', 'Percakapan', 3, '"Good night" diucapkan saat berpisah di malam hari.', '["Benar","Salah"]', 0, 'Good night untuk berpisah/akan tidur.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Bagian Tubuh Tumbuhan dan Fungsinya', s_ipa, 'Makhluk Hidup', '{SD}', 'mudah', 15,
   'Mengenal akar, batang, daun, bunga, dan fungsinya bagi tumbuhan.',
   ARRAY['Menyebutkan bagian tubuh tumbuhan','Menjelaskan fungsi setiap bagian','Mengamati tumbuhan di sekitar'],
   E'## Akar\nAkar ada di dalam tanah. Fungsinya **menyerap air** dan zat hara, serta **menguatkan** tumbuhan agar tidak roboh.\n\n## Batang\nBatang **menyalurkan air** dari akar ke daun dan menopang tumbuhan.\n\n## Daun\nDaun adalah **dapur** tumbuhan. Di daun terjadi **fotosintesis**, yaitu membuat makanan dengan bantuan sinar matahari.\n\n## Bunga\nBunga adalah alat **perkembangbiakan**. Dari bunga akan tumbuh buah dan biji.\n\n## Ayo mengamati\nPerhatikan tanaman di halaman. Bisakah kamu menunjuk akar, batang, daun, dan bunganya?',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Bagian Tumbuhan', 'Latihan mengenal bagian tumbuhan.', 'latihan', s_ipa, m, 'SD', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_ipa, 'SD', 'Makhluk Hidup', 1, 'Bagian tumbuhan yang menyerap air dari tanah adalah…', '["Daun","Bunga","Akar","Batang"]', 2, 'Akar menyerap air dan zat hara.');
  PERFORM public._seed_q(qz, s_ipa, 'SD', 'Makhluk Hidup', 2, 'Fotosintesis terjadi di bagian…', '["Akar","Daun","Biji","Batang"]', 1, 'Daun adalah dapur tumbuhan.');
  PERFORM public._seed_q(qz, s_ipa, 'SD', 'Makhluk Hidup', 3, 'Bunga berfungsi sebagai alat perkembangbiakan.', '["Benar","Salah"]', 0, 'Dari bunga tumbuh buah dan biji.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.quizzes (title, description, kind, subject_id, level, passing_score, allow_retake, max_attempts, show_review, is_published)
  VALUES ('Evaluasi Tengah Semester SD', 'Evaluasi gabungan Matematika dan IPAS. Hanya dapat dikerjakan 2 kali.', 'evaluasi', s_mtk, 'SD', 70, true, 2, true, false) RETURNING id INTO ev;
  PERFORM public._seed_q(ev, s_mtk, 'SD', 'Bilangan', 1, 'Berapa hasil 5 × 4?', '["9","20","25","15"]', 1, '5 × 4 = 20.');
  PERFORM public._seed_q(ev, s_mtk, 'SD', 'Bilangan', 2, 'Berapa hasil 75 − 32?', '["43","53","33","47"]', 0, 'Satuan 5−2=3, puluhan 7−3=4.');
  PERFORM public._seed_q(ev, s_mtk, 'SD', 'Bilangan', 3, 'Satu kotak berisi 10 permen. Ada 3 kotak. Berapa permen semuanya?', '["13","30","300","10"]', 1, '3 × 10 = 30.');
  PERFORM public._seed_q(ev, s_mtk, 'SD', 'Bilangan', 4, '27 + 16 = 43', '["Benar","Salah"]', 0, '7+6=13, simpan 1; 2+1+1=4 → 43.');
  UPDATE public.quizzes SET is_published = true WHERE id = ev;

  ---------------- SMP ----------------
  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Bilangan Bulat dan Operasinya', s_mtk, 'Bilangan', '{SMP}', 'mudah', 20,
   'Memahami bilangan positif, negatif, dan operasi hitungnya dengan garis bilangan.',
   ARRAY['Membandingkan bilangan bulat','Menjumlah dan mengurangkan bilangan bulat','Menerapkan bilangan bulat pada suhu dan ketinggian'],
   E'## Pengertian\nBilangan bulat terdiri dari bilangan **negatif**, **nol**, dan **positif**: …, −3, −2, −1, 0, 1, 2, 3, …\n\n## Garis bilangan\nMakin ke kanan, nilai makin besar. Jadi −2 > −5.\n\n## Aturan operasi\n- Menambah bilangan positif → bergerak ke kanan.\n- Menambah bilangan negatif → bergerak ke kiri: 3 + (−5) = −2.\n- Mengurangi sama dengan menambah lawannya: 4 − (−3) = 4 + 3 = 7.\n- Perkalian: positif × negatif = negatif; negatif × negatif = positif.\n\n## Penerapan\nSuhu di puncak gunung −4°C, lalu naik 9°C. Suhu sekarang: −4 + 9 = **5°C**.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, prerequisite_ids, order_index, is_published, is_sample)
  VALUES ('Persamaan Linear Satu Variabel', s_mtk, 'Aljabar', '{SMP}', 'sedang', 25,
   'Menyelesaikan persamaan seperti 2x + 3 = 11 dan menerapkannya pada masalah sehari-hari.',
   ARRAY['Mengenali bentuk persamaan linear','Menyelesaikan persamaan dengan operasi setara','Membuat model persamaan dari soal cerita'],
   E'## Bentuk umum\nPersamaan linear satu variabel berbentuk **ax + b = c**, dengan pangkat variabel tertinggi 1.\n\n## Prinsip keseimbangan\nApa pun yang dilakukan di ruas kiri harus dilakukan juga di ruas kanan.\n\n## Contoh\n2x + 3 = 11\n1. Kurangi kedua ruas dengan 3 → 2x = 8\n2. Bagi kedua ruas dengan 2 → **x = 4**\n\nCek: 2(4) + 3 = 11 ✔\n\n## Soal cerita\nHarga 3 buku dan ongkos Rp5.000 adalah Rp20.000. Misal harga buku x: 3x + 5.000 = 20.000 → 3x = 15.000 → **x = Rp5.000**.',
   ARRAY[m], 2, true, true) RETURNING id INTO m2;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Bilangan Bulat', 'Operasi hitung bilangan bulat.', 'latihan', s_mtk, m, 'SMP', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_mtk, 'SMP', 'Bilangan', 1, 'Hasil dari 3 + (−5) adalah…', '["8","−2","2","−8"]', 1, 'Bergerak 5 langkah ke kiri dari 3.');
  PERFORM public._seed_q(qz, s_mtk, 'SMP', 'Bilangan', 2, 'Hasil dari 4 − (−3) adalah…', '["1","−7","7","−1"]', 2, 'Mengurangi negatif sama dengan menambah.');
  PERFORM public._seed_q(qz, s_mtk, 'SMP', 'Bilangan', 3, '(−6) × (−2) = −12', '["Benar","Salah"]', 1, 'Negatif × negatif = positif, hasilnya 12.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Persamaan Linear', 'Selesaikan persamaan linear satu variabel.', 'latihan', s_mtk, m2, 'SMP', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_mtk, 'SMP', 'Aljabar', 1, 'Nilai x dari 2x + 3 = 11 adalah…', '["3","4","5","7"]', 1, '2x = 8, x = 4.');
  PERFORM public._seed_q(qz, s_mtk, 'SMP', 'Aljabar', 2, 'Nilai x dari 5x − 10 = 15 adalah…', '["1","5","3","25"]', 1, '5x = 25, x = 5.');
  PERFORM public._seed_q(qz, s_mtk, 'SMP', 'Aljabar', 3, 'x + 7 = 2 memiliki penyelesaian x = −5.', '["Benar","Salah"]', 0, 'x = 2 − 7 = −5.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Teks Deskripsi', s_bi, 'Menulis', '{SMP}', 'sedang', 20,
   'Struktur dan ciri kebahasaan teks deskripsi, serta cara menulisnya.',
   ARRAY['Menjelaskan struktur teks deskripsi','Mengenali ciri kebahasaan','Menulis teks deskripsi singkat'],
   E'## Pengertian\nTeks deskripsi menggambarkan suatu objek (tempat, benda, orang) secara rinci sehingga pembaca seolah **melihat, mendengar, atau merasakan** sendiri.\n\n## Struktur\n1. **Identifikasi** – memperkenalkan objek.\n2. **Deskripsi bagian** – rincian ciri-ciri objek.\n3. **Simpulan/kesan** (opsional).\n\n## Ciri kebahasaan\n- Menggunakan kata sifat: *sejuk, rindang, harum*.\n- Menggunakan kata yang melibatkan pancaindra.\n- Menggunakan majas, misalnya *ombak berkejaran*.\n\n## Latihan menulis\nPilih satu tempat di sekitar yayasan, lalu tulis 5 kalimat yang menggambarkannya.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Teks Deskripsi', 'Struktur dan kebahasaan teks deskripsi.', 'latihan', s_bi, m, 'SMP', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_bi, 'SMP', 'Menulis', 1, 'Bagian awal teks deskripsi yang memperkenalkan objek disebut…', '["Orientasi","Identifikasi","Komplikasi","Reorientasi"]', 1, 'Struktur: identifikasi, deskripsi bagian, simpulan.');
  PERFORM public._seed_q(qz, s_bi, 'SMP', 'Menulis', 2, 'Kata berikut yang merupakan kata sifat adalah…', '["Berlari","Rindang","Meja","Kemarin"]', 1, 'Rindang menggambarkan sifat.');
  PERFORM public._seed_q(qz, s_bi, 'SMP', 'Menulis', 3, 'Teks deskripsi melibatkan pancaindra pembaca.', '["Benar","Salah"]', 0, 'Tujuannya agar pembaca seolah merasakan sendiri.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Simple Present Tense', s_en, 'Tata Bahasa', '{SMP}', 'sedang', 20,
   'Menyatakan kebiasaan dan fakta dengan simple present tense.',
   ARRAY['Membentuk kalimat positif, negatif, dan tanya','Menambahkan -s/-es pada subjek orang ketiga','Menggunakan keterangan waktu kebiasaan'],
   E'## Kegunaan\nSimple present tense dipakai untuk **kebiasaan** dan **fakta umum**.\n- *I study every night.*\n- *The sun rises in the east.*\n\n## Rumus\n- Positif: S + V1(s/es)\n- Negatif: S + do/does + not + V1\n- Tanya: Do/Does + S + V1?\n\n## Aturan -s/-es\nSubjek **he, she, it** → kata kerja ditambah -s/-es: *She reads*, *He watches*.\n\n## Keterangan waktu\n*always, usually, often, sometimes, never, every day*.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Simple Present', 'Latihan bentuk simple present tense.', 'latihan', s_en, m, 'SMP', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_en, 'SMP', 'Tata Bahasa', 1, 'She ___ to school every day.', '["go","goes","going","gone"]', 1, 'Subjek she → goes.');
  PERFORM public._seed_q(qz, s_en, 'SMP', 'Tata Bahasa', 2, 'Kalimat negatif yang benar adalah…', '["He not play football","He does not plays football","He does not play football","He do not play football"]', 2, 'does not + V1 tanpa -s.');
  PERFORM public._seed_q(qz, s_en, 'SMP', 'Tata Bahasa', 3, '"The sun rises in the east" adalah contoh fakta umum.', '["Benar","Salah"]', 0, 'Fakta umum memakai simple present.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Sistem Pencernaan Manusia', s_ipa, 'Biologi', '{SMP}', 'sedang', 25,
   'Organ-organ pencernaan dan proses mengubah makanan menjadi zat yang dapat diserap tubuh.',
   ARRAY['Menyebutkan urutan organ pencernaan','Membedakan pencernaan mekanik dan kimiawi','Menerapkan pola makan sehat'],
   E'## Urutan organ\nMulut → kerongkongan → lambung → usus halus → usus besar → anus.\n\n## Pencernaan mekanik dan kimiawi\n- **Mekanik**: penghancuran makanan secara fisik, misalnya dikunyah gigi.\n- **Kimiawi**: dengan bantuan **enzim**, misalnya enzim amilase di mulut memecah karbohidrat.\n\n## Fungsi organ penting\n- **Lambung**: mengaduk makanan dan menghasilkan asam lambung (HCl).\n- **Usus halus**: tempat **penyerapan** sari makanan.\n- **Usus besar**: penyerapan air.\n\n## Hidup sehat\nKonsumsi serat dari sayur dan buah membantu kerja usus besar.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Sistem Pencernaan', 'Organ dan proses pencernaan.', 'latihan', s_ipa, m, 'SMP', 70, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_ipa, 'SMP', 'Biologi', 1, 'Penyerapan sari makanan terutama terjadi di…', '["Lambung","Usus halus","Usus besar","Kerongkongan"]', 1, 'Usus halus menyerap sari makanan.');
  PERFORM public._seed_q(qz, s_ipa, 'SMP', 'Biologi', 2, 'Enzim di mulut yang memecah karbohidrat adalah…', '["Pepsin","Lipase","Amilase","Tripsin"]', 2, 'Amilase (ptialin) di air liur.');
  PERFORM public._seed_q(qz, s_ipa, 'SMP', 'Biologi', 3, 'Mengunyah makanan termasuk pencernaan kimiawi.', '["Benar","Salah"]', 1, 'Mengunyah adalah pencernaan mekanik.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.quizzes (title, description, kind, subject_id, level, passing_score, allow_retake, max_attempts, show_review, is_published)
  VALUES ('Evaluasi Matematika SMP', 'Evaluasi bilangan bulat dan persamaan linear. Hanya satu kali percobaan.', 'evaluasi', s_mtk, 'SMP', 75, false, 1, true, false) RETURNING id INTO ev;
  PERFORM public._seed_q(ev, s_mtk, 'SMP', 'Bilangan', 1, 'Suhu −4°C naik 9°C. Suhu sekarang…', '["−13°C","5°C","13°C","−5°C"]', 1, '−4 + 9 = 5.');
  PERFORM public._seed_q(ev, s_mtk, 'SMP', 'Aljabar', 2, 'Nilai x dari 3x + 5 = 20 adalah…', '["5","15","25/3","3"]', 0, '3x = 15, x = 5.');
  PERFORM public._seed_q(ev, s_mtk, 'SMP', 'Bilangan', 3, 'Urutan dari terkecil: ', '["−1, −5, 0, 3","−5, −1, 0, 3","0, −1, −5, 3","3, 0, −1, −5"]', 1, 'Makin ke kiri garis bilangan makin kecil.');
  PERFORM public._seed_q(ev, s_mtk, 'SMP', 'Aljabar', 4, '2(x − 1) = 6 memiliki penyelesaian x = 4.', '["Benar","Salah"]', 0, 'x − 1 = 3, x = 4.');
  UPDATE public.quizzes SET is_published = true WHERE id = ev;

  ---------------- SMA ----------------
  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Fungsi Linear dan Grafiknya', s_mtk, 'Fungsi', '{SMA}', 'sedang', 30,
   'Menganalisis fungsi f(x) = mx + c, gradien, titik potong, dan penerapannya.',
   ARRAY['Menentukan gradien dan titik potong sumbu','Menggambar grafik fungsi linear','Memodelkan masalah kontekstual dengan fungsi linear'],
   E'## Bentuk fungsi linear\nf(x) = **mx + c**, dengan **m** gradien (kemiringan) dan **c** titik potong sumbu-y.\n\n## Gradien dari dua titik\nm = (y₂ − y₁) / (x₂ − x₁). Melalui (1, 3) dan (3, 7): m = (7 − 3)/(3 − 1) = **2**.\n\n## Titik potong\n- Sumbu-y: x = 0 → (0, c)\n- Sumbu-x: f(x) = 0 → x = −c/m\n\nUntuk f(x) = 2x − 4: memotong sumbu-y di (0, −4) dan sumbu-x di (2, 0).\n\n## Hubungan dua garis\n- Sejajar jika m₁ = m₂\n- Tegak lurus jika m₁ × m₂ = −1\n\n## Penerapan\nTarif ojek Rp8.000 ditambah Rp2.500 per km: f(x) = 2.500x + 8.000. Untuk 6 km biayanya **Rp23.000**.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, prerequisite_ids, order_index, is_published, is_sample)
  VALUES ('Fungsi Kuadrat', s_mtk, 'Fungsi', '{SMA}', 'sulit', 35,
   'Sumbu simetri, titik puncak, diskriminan, dan akar-akar fungsi kuadrat.',
   ARRAY['Menentukan titik puncak dan sumbu simetri','Menggunakan diskriminan untuk sifat akar','Menyelesaikan masalah optimasi sederhana'],
   E'## Bentuk umum\nf(x) = **ax² + bx + c**, a ≠ 0. Grafiknya berbentuk **parabola**: terbuka ke atas jika a > 0, ke bawah jika a < 0.\n\n## Sumbu simetri dan titik puncak\nx_p = −b / (2a), lalu y_p = f(x_p).\nUntuk f(x) = x² − 4x + 3: x_p = 2, y_p = −1 → puncak **(2, −1)**.\n\n## Diskriminan\nD = b² − 4ac\n- D > 0: dua akar real berbeda\n- D = 0: akar kembar\n- D < 0: tidak memiliki akar real\n\n## Akar-akar\nx² − 4x + 3 = (x − 1)(x − 3) → x = 1 atau x = 3.\n\n## Optimasi\nKeliling persegi panjang 20 m. Luas L = x(10 − x) maksimum saat x = 5, yaitu **25 m²**.',
   ARRAY[m], 2, true, true) RETURNING id INTO m2;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Fungsi Linear', 'Gradien, titik potong, dan penerapan.', 'latihan', s_mtk, m, 'SMA', 75, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_mtk, 'SMA', 'Fungsi', 1, 'Gradien garis yang melalui (1, 3) dan (3, 7) adalah…', '["1","2","4","1/2"]', 1, 'm = 4/2 = 2.');
  PERFORM public._seed_q(qz, s_mtk, 'SMA', 'Fungsi', 2, 'f(x) = 2x − 4 memotong sumbu-x di titik…', '["(0, −4)","(−2, 0)","(2, 0)","(4, 0)"]', 2, '2x − 4 = 0 → x = 2.');
  PERFORM public._seed_q(qz, s_mtk, 'SMA', 'Fungsi', 3, 'Dua garis dengan gradien 2 dan −1/2 saling tegak lurus.', '["Benar","Salah"]', 0, '2 × (−1/2) = −1.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Fungsi Kuadrat', 'Puncak, diskriminan, dan akar.', 'latihan', s_mtk, m2, 'SMA', 75, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_mtk, 'SMA', 'Fungsi', 1, 'Titik puncak f(x) = x² − 4x + 3 adalah…', '["(2, −1)","(−2, 15)","(4, 3)","(1, 0)"]', 0, 'x_p = 2, f(2) = −1.');
  PERFORM public._seed_q(qz, s_mtk, 'SMA', 'Fungsi', 2, 'Diskriminan x² + 2x + 5 bernilai…', '["24","−16","16","−24"]', 1, 'D = 4 − 20 = −16.');
  PERFORM public._seed_q(qz, s_mtk, 'SMA', 'Fungsi', 3, 'Jika D < 0, fungsi kuadrat memiliki dua akar real berbeda.', '["Benar","Salah"]', 1, 'D < 0 berarti tidak ada akar real.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Teks Eksposisi dan Argumentasi', s_bi, 'Menulis', '{SMA}', 'sedang', 30,
   'Menyusun tesis, argumen, dan penegasan ulang dalam teks eksposisi.',
   ARRAY['Menganalisis struktur teks eksposisi','Membedakan fakta dan opini','Menulis argumen yang didukung data'],
   E'## Pengertian\nTeks eksposisi memaparkan **gagasan atau pendapat** penulis dengan didukung **fakta dan data** agar pembaca yakin.\n\n## Struktur\n1. **Tesis** – pernyataan pendapat utama.\n2. **Argumentasi** – alasan yang didukung fakta, data, atau pendapat ahli.\n3. **Penegasan ulang** – menegaskan kembali tesis.\n\n## Fakta vs opini\n- Fakta: *Indonesia memiliki lebih dari 17.000 pulau.* (dapat dibuktikan)\n- Opini: *Pantai di Indonesia paling indah.* (penilaian pribadi)\n\n## Kebahasaan\nKonjungsi kausal (*karena, sehingga*), kata teknis, dan kalimat persuasif yang logis.\n\n## Menulis argumen kuat\nSertakan sumber data dan hindari generalisasi berlebihan.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Teks Eksposisi', 'Struktur dan kebahasaan eksposisi.', 'latihan', s_bi, m, 'SMA', 75, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_bi, 'SMA', 'Menulis', 1, 'Bagian teks eksposisi yang berisi pendapat utama penulis adalah…', '["Argumentasi","Tesis","Penegasan ulang","Orientasi"]', 1, 'Tesis = pendapat utama.');
  PERFORM public._seed_q(qz, s_bi, 'SMA', 'Menulis', 2, 'Manakah yang merupakan fakta?', '["Matematika pelajaran tersulit","Indonesia memiliki lebih dari 17.000 pulau","Musik pop paling enak didengar","Kota ini paling nyaman"]', 1, 'Fakta dapat dibuktikan.');
  PERFORM public._seed_q(qz, s_bi, 'SMA', 'Menulis', 3, 'Kata "sehingga" termasuk konjungsi kausal.', '["Benar","Salah"]', 0, 'Menyatakan hubungan sebab-akibat.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Passive Voice', s_en, 'Tata Bahasa', '{SMA}', 'sulit', 30,
   'Mengubah kalimat aktif menjadi pasif dalam berbagai tenses.',
   ARRAY['Memahami fungsi kalimat pasif','Membentuk passive voice pada beberapa tenses','Menggunakan passive voice dalam teks ilmiah'],
   E'## Kapan dipakai?\nPassive voice menekankan **objek atau hasil tindakan**, bukan pelakunya. Sering dipakai di berita dan teks ilmiah.\n\n## Rumus dasar\n**Object + to be + V3 (+ by agent)**\n\n| Tense | Aktif | Pasif |\n|---|---|---|\n| Simple present | She writes a letter. | A letter is written. |\n| Simple past | They built the bridge. | The bridge was built. |\n| Present perfect | He has finished the task. | The task has been finished. |\n| Future | We will clean the room. | The room will be cleaned. |\n\n## Catatan\nPelaku (*by ...*) boleh dihilangkan jika tidak penting atau tidak diketahui.',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Passive Voice', 'Ubah kalimat aktif ke pasif.', 'latihan', s_en, m, 'SMA', 75, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_en, 'SMA', 'Tata Bahasa', 1, 'They built the bridge in 2010. → The bridge ___ in 2010.', '["is built","was built","has built","was build"]', 1, 'Simple past: was/were + V3.');
  PERFORM public._seed_q(qz, s_en, 'SMA', 'Tata Bahasa', 2, 'Bentuk pasif dari "He has finished the task" adalah…', '["The task has finished","The task has been finished","The task was finishing","The task is finish"]', 1, 'Present perfect: has/have been + V3.');
  PERFORM public._seed_q(qz, s_en, 'SMA', 'Tata Bahasa', 3, 'Dalam kalimat pasif, pelaku selalu wajib disebutkan.', '["Benar","Salah"]', 1, 'Pelaku boleh dihilangkan.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.materials (title, subject_id, topic, levels, difficulty, duration_minutes, summary, objectives, content, order_index, is_published, is_sample)
  VALUES ('Hukum Newton tentang Gerak', s_ipa, 'Fisika', '{SMA}', 'sulit', 35,
   'Tiga hukum Newton, konsep gaya, massa, percepatan, dan contoh perhitungannya.',
   ARRAY['Menjelaskan hukum I, II, dan III Newton','Menghitung gaya dengan F = m·a','Menganalisis gaya aksi-reaksi'],
   E'## Hukum I (Kelembaman)\nBenda akan tetap diam atau bergerak lurus beraturan jika resultan gaya **ΣF = 0**. Contoh: penumpang terdorong ke depan saat bus mengerem mendadak.\n\n## Hukum II\nPercepatan sebanding dengan resultan gaya dan berbanding terbalik dengan massa:\n\n**ΣF = m · a**\n\nContoh: gaya 20 N pada benda 4 kg → a = 20/4 = **5 m/s²**.\n\n## Hukum III (Aksi-Reaksi)\nSetiap aksi menimbulkan reaksi yang **sama besar** dan **berlawanan arah**, bekerja pada benda yang berbeda. Contoh: saat mendayung, dayung mendorong air ke belakang dan air mendorong perahu ke depan.\n\n## Satuan\nGaya diukur dalam **newton (N)**: 1 N = 1 kg·m/s².',
   1, true, true) RETURNING id INTO m;
  INSERT INTO public.quizzes (title, description, kind, subject_id, material_id, level, passing_score, is_published)
  VALUES ('Latihan Hukum Newton', 'Konsep dan perhitungan hukum Newton.', 'latihan', s_ipa, m, 'SMA', 75, false) RETURNING id INTO qz;
  PERFORM public._seed_q(qz, s_ipa, 'SMA', 'Fisika', 1, 'Gaya 20 N bekerja pada benda 4 kg. Percepatannya…', '["80 m/s²","5 m/s²","0,2 m/s²","24 m/s²"]', 1, 'a = F/m = 5 m/s².');
  PERFORM public._seed_q(qz, s_ipa, 'SMA', 'Fisika', 2, 'Penumpang terdorong ke depan saat bus mengerem adalah contoh hukum…', '["Newton I","Newton II","Newton III","Hooke"]', 0, 'Sifat kelembaman benda.');
  PERFORM public._seed_q(qz, s_ipa, 'SMA', 'Fisika', 3, 'Gaya aksi dan reaksi bekerja pada benda yang sama.', '["Benar","Salah"]', 1, 'Aksi-reaksi bekerja pada dua benda berbeda.');
  UPDATE public.quizzes SET is_published = true WHERE id = qz;

  INSERT INTO public.quizzes (title, description, kind, subject_id, level, passing_score, allow_retake, max_attempts, show_review, is_published)
  VALUES ('Evaluasi Sains SMA', 'Evaluasi hukum Newton. Pembahasan tidak ditampilkan.', 'evaluasi', s_ipa, 'SMA', 75, true, 2, false, false) RETURNING id INTO ev;
  PERFORM public._seed_q(ev, s_ipa, 'SMA', 'Fisika', 1, 'Benda 10 kg diberi gaya 50 N. Percepatannya…', '["500 m/s²","5 m/s²","0,5 m/s²","60 m/s²"]', 1, 'a = 50/10.');
  PERFORM public._seed_q(ev, s_ipa, 'SMA', 'Fisika', 2, '1 newton setara dengan…', '["1 kg·m/s²","1 kg·m/s","1 g·cm/s²","1 kg/m²"]', 0, 'Definisi satuan newton.');
  PERFORM public._seed_q(ev, s_ipa, 'SMA', 'Fisika', 3, 'Jika resultan gaya nol, benda yang bergerak akan berhenti seketika.', '["Benar","Salah"]', 1, 'Benda tetap bergerak lurus beraturan.');
  PERFORM public._seed_q(ev, s_ipa, 'SMA', 'Fisika', 4, 'Perahu maju saat dayung mendorong air ke belakang menunjukkan hukum…', '["Newton I","Newton II","Newton III","Archimedes"]', 2, 'Aksi-reaksi.');
  UPDATE public.quizzes SET is_published = true WHERE id = ev;
END $$;

DROP FUNCTION public._seed_q(uuid, uuid, public.edu_level, text, int, text, jsonb, int, text);
