
CREATE TYPE public.app_role AS ENUM ('admin','pendamping','siswa');
CREATE TYPE public.edu_level AS ENUM ('SD','SMP','SMA');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  level public.edu_level,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_pendamping()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = auth.uid() AND r.role = 'pendamping' AND p.status = 'aktif')
$$;

CREATE OR REPLACE FUNCTION public.current_level()
RETURNS public.edu_level LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.level FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id AND r.role = 'siswa'
  WHERE p.id = auth.uid() AND p.status = 'aktif'
$$;

CREATE POLICY "Lihat profil sendiri" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_pendamping());
CREATE POLICY "Lihat peran sendiri" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_pendamping());

-- SUBJECTS
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'book',
  levels public.edu_level[] NOT NULL DEFAULT '{SD,SMP,SMA}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mapel publik" ON public.subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Pendamping kelola mapel" ON public.subjects FOR ALL TO authenticated USING (public.is_pendamping()) WITH CHECK (public.is_pendamping());

-- MATERIALS
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  topic text NOT NULL DEFAULT '',
  levels public.edu_level[] NOT NULL CHECK (array_length(levels,1) >= 1),
  difficulty text NOT NULL DEFAULT 'mudah' CHECK (difficulty IN ('mudah','sedang','sulit')),
  duration_minutes int NOT NULL DEFAULT 15 CHECK (duration_minutes > 0),
  summary text NOT NULL DEFAULT '',
  objectives text[] NOT NULL DEFAULT '{}',
  content text NOT NULL DEFAULT '',
  cover_url text,
  prerequisite_ids uuid[] NOT NULL DEFAULT '{}',
  order_index int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  is_sample boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX materials_subject_idx ON public.materials(subject_id);
CREATE INDEX materials_levels_idx ON public.materials USING gin(levels);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Siswa lihat materi jenjangnya" ON public.materials FOR SELECT TO authenticated
  USING (public.is_pendamping() OR (is_published AND public.current_level() = ANY(levels)));
CREATE POLICY "Pendamping tambah materi" ON public.materials FOR INSERT TO authenticated WITH CHECK (public.is_pendamping());
CREATE POLICY "Pendamping ubah materi" ON public.materials FOR UPDATE TO authenticated USING (public.is_pendamping()) WITH CHECK (public.is_pendamping());
CREATE POLICY "Pendamping hapus materi" ON public.materials FOR DELETE TO authenticated USING (public.is_pendamping());

-- Public preview (limited columns, no content)
CREATE OR REPLACE FUNCTION public.public_material_preview()
RETURNS TABLE(id uuid, title text, summary text, topic text, levels public.edu_level[], difficulty text, duration_minutes int, subject_name text, subject_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.title, m.summary, m.topic, m.levels, m.difficulty, m.duration_minutes, s.name, s.slug
  FROM public.materials m JOIN public.subjects s ON s.id = m.subject_id
  WHERE m.is_published ORDER BY s.name, m.order_index, m.title
$$;
GRANT EXECUTE ON FUNCTION public.public_material_preview() TO anon, authenticated;

-- MATERIAL PROGRESS
CREATE TABLE public.material_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'dibuka' CHECK (status IN ('dibuka','selesai')),
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, material_id)
);
CREATE INDEX material_progress_user_idx ON public.material_progress(user_id);
GRANT SELECT, INSERT, UPDATE ON public.material_progress TO authenticated;
GRANT ALL ON public.material_progress TO service_role;
ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lihat progres" ON public.material_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_pendamping());
CREATE POLICY "Siswa catat progres" ON public.material_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.materials m WHERE m.id = material_id AND m.is_published AND public.current_level() = ANY(m.levels)));
CREATE POLICY "Siswa ubah progres" ON public.material_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  topic text NOT NULL DEFAULT '',
  level public.edu_level NOT NULL,
  type text NOT NULL DEFAULT 'pilihan_ganda' CHECK (type IN ('pilihan_ganda','benar_salah')),
  prompt text NOT NULL CHECK (length(trim(prompt)) > 0),
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation text NOT NULL DEFAULT '',
  points int NOT NULL DEFAULT 10 CHECK (points > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) >= 2),
  CHECK (correct_index >= 0 AND correct_index < jsonb_array_length(options))
);
CREATE INDEX questions_subject_level_idx ON public.questions(subject_id, level);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pendamping kelola soal" ON public.questions FOR ALL TO authenticated USING (public.is_pendamping()) WITH CHECK (public.is_pendamping());

-- QUIZZES
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'latihan' CHECK (kind IN ('latihan','evaluasi')),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  level public.edu_level NOT NULL,
  passing_score int NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  allow_retake boolean NOT NULL DEFAULT true,
  max_attempts int CHECK (max_attempts IS NULL OR max_attempts > 0),
  show_review boolean NOT NULL DEFAULT true,
  available_from timestamptz,
  available_until timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quizzes_level_idx ON public.quizzes(level, subject_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Siswa lihat kuis jenjangnya" ON public.quizzes FOR SELECT TO authenticated
  USING (public.is_pendamping() OR (is_published AND level = public.current_level()));
CREATE POLICY "Pendamping tambah kuis" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.is_pendamping());
CREATE POLICY "Pendamping ubah kuis" ON public.quizzes FOR UPDATE TO authenticated USING (public.is_pendamping()) WITH CHECK (public.is_pendamping());
CREATE POLICY "Pendamping hapus kuis" ON public.quizzes FOR DELETE TO authenticated USING (public.is_pendamping());

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position int NOT NULL DEFAULT 0,
  points int CHECK (points IS NULL OR points > 0),
  UNIQUE (quiz_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pendamping kelola soal kuis" ON public.quiz_questions FOR ALL TO authenticated USING (public.is_pendamping()) WITH CHECK (public.is_pendamping());

-- ATTEMPTS
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  score numeric(5,2) NOT NULL,
  points_earned int NOT NULL,
  points_total int NOT NULL,
  correct_count int NOT NULL,
  question_count int NOT NULL,
  passed boolean NOT NULL,
  client_token uuid NOT NULL UNIQUE,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, quiz_id, attempt_number)
);
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts(user_id, submitted_at DESC);
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lihat percobaan" ON public.quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_pendamping());

CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_index int,
  is_correct boolean NOT NULL,
  points_awarded int NOT NULL,
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pendamping lihat jawaban" ON public.quiz_answers FOR SELECT TO authenticated USING (public.is_pendamping());

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('masuk','materi_dibuka','materi_selesai','kuis_selesai')),
  description text NOT NULL DEFAULT '',
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_user_idx ON public.activity_logs(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lihat aktivitas" ON public.activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_pendamping());
CREATE POLICY "Catat aktivitas sendiri" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND type IN ('masuk','materi_dibuka','materi_selesai'));

-- SETTINGS (recommendation & support thresholds)
CREATE TABLE public.app_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mastery_threshold int NOT NULL DEFAULT 70 CHECK (mastery_threshold BETWEEN 0 AND 100),
  support_threshold int NOT NULL DEFAULT 60 CHECK (support_threshold BETWEEN 0 AND 100),
  max_recommendations int NOT NULL DEFAULT 6 CHECK (max_recommendations BETWEEN 1 AND 20),
  inactive_days int NOT NULL DEFAULT 14 CHECK (inactive_days > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id) VALUES (1);
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Baca pengaturan" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pendamping ubah pengaturan" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_pendamping()) WITH CHECK (public.is_pendamping());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_materials BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_questions BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_quizzes BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Publish validation for quizzes
CREATE OR REPLACE FUNCTION public.validate_quiz_publish() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_published AND (TG_OP = 'INSERT' OR NOT OLD.is_published) THEN
    IF NOT EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_id = NEW.id) THEN
      RAISE EXCEPTION 'Kuis belum memiliki soal. Tambahkan minimal satu soal sebelum dipublikasikan.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.quiz_questions qq JOIN public.questions q ON q.id = qq.question_id
               WHERE qq.quiz_id = NEW.id AND q.level <> NEW.level) THEN
      RAISE EXCEPTION 'Ada soal yang jenjangnya berbeda dengan jenjang kuis.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_quiz_publish BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.validate_quiz_publish();

-- Student: get quiz without answers
CREATE OR REPLACE FUNCTION public.get_quiz_for_student(p_quiz uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_level public.edu_level := public.current_level(); v_quiz public.quizzes; v_count int; v_best numeric;
BEGIN
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz;
  IF v_quiz.id IS NULL OR NOT (public.is_pendamping() OR (v_quiz.is_published AND v_quiz.level = v_level)) THEN
    RAISE EXCEPTION 'Kuis tidak ditemukan atau tidak tersedia untuk jenjang Anda.';
  END IF;
  SELECT count(*), max(score) INTO v_count, v_best FROM public.quiz_attempts WHERE quiz_id = p_quiz AND user_id = auth.uid();
  RETURN jsonb_build_object(
    'quiz', to_jsonb(v_quiz),
    'attempt_count', v_count,
    'best_score', v_best,
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', q.id, 'prompt', q.prompt, 'type', q.type, 'options', q.options, 'points', COALESCE(qq.points, q.points)) ORDER BY qq.position)
       FROM public.quiz_questions qq JOIN public.questions q ON q.id = qq.question_id WHERE qq.quiz_id = p_quiz), '[]'::jsonb)
  );
END $$;
GRANT EXECUTE ON FUNCTION public.get_quiz_for_student(uuid) TO authenticated;

-- Student: submit & grade on the server
CREATE OR REPLACE FUNCTION public.submit_quiz(p_quiz uuid, p_answers jsonb, p_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid(); v_level public.edu_level := public.current_level();
  v_quiz public.quizzes; v_existing uuid; v_count int; v_attempt uuid;
  v_total int := 0; v_earned int := 0; v_correct int := 0; v_n int := 0; v_score numeric; r record; v_sel int;
BEGIN
  IF v_uid IS NULL OR v_level IS NULL THEN RAISE EXCEPTION 'Hanya siswa aktif yang dapat mengerjakan kuis.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text || p_quiz::text));
  SELECT id INTO v_existing FROM public.quiz_attempts WHERE client_token = p_token AND user_id = v_uid;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz;
  IF v_quiz.id IS NULL OR NOT v_quiz.is_published OR v_quiz.level <> v_level THEN RAISE EXCEPTION 'Kuis tidak tersedia.'; END IF;
  IF v_quiz.available_from IS NOT NULL AND now() < v_quiz.available_from THEN RAISE EXCEPTION 'Kuis belum dibuka.'; END IF;
  IF v_quiz.available_until IS NOT NULL AND now() > v_quiz.available_until THEN RAISE EXCEPTION 'Waktu pengerjaan kuis sudah berakhir.'; END IF;
  SELECT count(*) INTO v_count FROM public.quiz_attempts WHERE quiz_id = p_quiz AND user_id = v_uid;
  IF v_count >= 1 AND NOT v_quiz.allow_retake THEN RAISE EXCEPTION 'Kuis ini hanya dapat dikerjakan satu kali.'; END IF;
  IF v_quiz.max_attempts IS NOT NULL AND v_count >= v_quiz.max_attempts THEN RAISE EXCEPTION 'Batas jumlah percobaan sudah tercapai.'; END IF;

  v_attempt := gen_random_uuid();
  INSERT INTO public.quiz_attempts (id, user_id, quiz_id, attempt_number, score, points_earned, points_total, correct_count, question_count, passed, client_token)
  VALUES (v_attempt, v_uid, p_quiz, v_count + 1, 0, 0, 0, 0, 0, false, p_token);

  FOR r IN SELECT q.id, q.correct_index, COALESCE(qq.points, q.points) AS pts
           FROM public.quiz_questions qq JOIN public.questions q ON q.id = qq.question_id WHERE qq.quiz_id = p_quiz LOOP
    v_sel := NULL;
    IF p_answers ? r.id::text AND jsonb_typeof(p_answers -> r.id::text) = 'number' THEN v_sel := (p_answers ->> r.id::text)::int; END IF;
    v_n := v_n + 1; v_total := v_total + r.pts;
    IF v_sel IS NOT NULL AND v_sel = r.correct_index THEN v_earned := v_earned + r.pts; v_correct := v_correct + 1; END IF;
    INSERT INTO public.quiz_answers (attempt_id, question_id, selected_index, is_correct, points_awarded)
    VALUES (v_attempt, r.id, v_sel, COALESCE(v_sel = r.correct_index, false), CASE WHEN v_sel = r.correct_index THEN r.pts ELSE 0 END);
  END LOOP;
  IF v_n = 0 THEN RAISE EXCEPTION 'Kuis belum memiliki soal.'; END IF;
  v_score := round(v_earned::numeric * 100 / v_total, 2);
  UPDATE public.quiz_attempts SET score = v_score, points_earned = v_earned, points_total = v_total,
    correct_count = v_correct, question_count = v_n, passed = v_score >= v_quiz.passing_score WHERE id = v_attempt;
  INSERT INTO public.activity_logs (user_id, type, description, ref_id)
  VALUES (v_uid, 'kuis_selesai', 'Menyelesaikan ' || v_quiz.title || ' dengan nilai ' || v_score, v_attempt);
  RETURN v_attempt;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, uuid) TO authenticated;

-- Review after submission
CREATE OR REPLACE FUNCTION public.get_attempt_review(p_attempt uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_a public.quiz_attempts; v_quiz public.quizzes; v_reveal boolean;
BEGIN
  SELECT * INTO v_a FROM public.quiz_attempts WHERE id = p_attempt;
  IF v_a.id IS NULL OR NOT (v_a.user_id = auth.uid() OR public.is_pendamping()) THEN RAISE EXCEPTION 'Hasil tidak ditemukan.'; END IF;
  SELECT * INTO v_quiz FROM public.quizzes WHERE id = v_a.quiz_id;
  v_reveal := v_quiz.show_review OR public.is_pendamping();
  RETURN jsonb_build_object(
    'attempt', to_jsonb(v_a), 'quiz', jsonb_build_object('id', v_quiz.id, 'title', v_quiz.title, 'passing_score', v_quiz.passing_score, 'show_review', v_quiz.show_review, 'allow_retake', v_quiz.allow_retake, 'max_attempts', v_quiz.max_attempts, 'material_id', v_quiz.material_id, 'kind', v_quiz.kind),
    'review_available', v_reveal,
    'answers', CASE WHEN v_reveal THEN COALESCE((SELECT jsonb_agg(jsonb_build_object('question_id', q.id, 'prompt', q.prompt, 'options', q.options, 'selected_index', a.selected_index, 'correct_index', q.correct_index, 'is_correct', a.is_correct, 'points_awarded', a.points_awarded, 'explanation', q.explanation) ORDER BY qq.position)
      FROM public.quiz_answers a JOIN public.questions q ON q.id = a.question_id
      LEFT JOIN public.quiz_questions qq ON qq.quiz_id = v_a.quiz_id AND qq.question_id = q.id
      WHERE a.attempt_id = p_attempt), '[]'::jsonb) ELSE '[]'::jsonb END
  );
END $$;
GRANT EXECUTE ON FUNCTION public.get_attempt_review(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_for_student(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_attempt_review(uuid) FROM anon;
