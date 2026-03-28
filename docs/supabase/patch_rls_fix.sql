-- ============================================================
-- 관리자 페이지 RLS 수정 패치 (v2 - 보안 강화)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================
-- 주의: 기존 anon 전체 접근 정책이 있다면 먼저 삭제하세요:
--   DROP POLICY IF EXISTS "Admin anon can read licenses" ON public.licenses;
--   DROP POLICY IF EXISTS "Admin anon can insert licenses" ON public.licenses;
--   DROP POLICY IF EXISTS "Admin anon can update licenses" ON public.licenses;
--   DROP POLICY IF EXISTS "Admin anon can delete licenses" ON public.licenses;
--   DROP POLICY IF EXISTS "Anon can insert teacher profiles" ON public.teacher_profiles;
--   DROP POLICY IF EXISTS "Anon can insert student profiles" ON public.student_profiles;

-- ─── licenses 테이블: 인증된 교사만 자신의 라이선스 조회 가능 ───
CREATE POLICY "Authenticated teachers can read own license"
ON public.licenses FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.teacher_profiles WHERE license_id = licenses.id
    )
);

-- licenses 삽입/수정/삭제는 서비스 키(Edge Function)로만 수행
-- 클라이언트에서는 불가

-- ─── teacher_profiles: 인증된 사용자만 자신의 프로필 생성 ───
CREATE POLICY "Authenticated users can insert own teacher profile"
ON public.teacher_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can read own profile"
ON public.teacher_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles FOR UPDATE
USING (auth.uid() = id);

-- ─── student_profiles: 연결코드 기반 삽입 허용 (anon) ───
-- 학생은 로그인 없이 연결코드로 등록하므로 INSERT만 허용
-- 단, class_code가 실제 존재하는 코드여야 함
CREATE POLICY "Students can register with valid class code"
ON public.student_profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teacher_profiles
        WHERE class_code = student_profiles.class_code
    )
);

-- 학생 프로필 조회는 해당 교사만 가능
CREATE POLICY "Teachers can read their class students"
ON public.student_profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_profiles
        WHERE teacher_profiles.class_code = student_profiles.class_code
        AND teacher_profiles.id = auth.uid()
    )
);

-- ─── lesson_logs: 학생 디바이스만 자신의 로그 삽입 가능 ───
CREATE POLICY "Students can insert own lesson logs"
ON public.lesson_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.student_profiles
        WHERE student_profiles.id = lesson_logs.student_id
    )
);

-- 교사는 자신의 학급 학생 로그만 조회 가능
CREATE POLICY "Teachers can read their class lesson logs"
ON public.lesson_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.student_profiles sp
        JOIN public.teacher_profiles tp ON sp.class_code = tp.class_code
        WHERE sp.id = lesson_logs.student_id
        AND tp.id = auth.uid()
    )
);
