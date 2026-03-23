-- ============================================================
-- 관리자 페이지 RLS 수정 패치
-- Supabase SQL Editor에서 실행하세요 (기존 스키마에 추가)
-- ============================================================

-- licenses 테이블: anon도 전체 접근 허용 (관리자 페이지 PIN으로 보호됨)
CREATE POLICY "Admin anon can read licenses"
ON public.licenses FOR SELECT
USING (true);

CREATE POLICY "Admin anon can insert licenses"
ON public.licenses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin anon can update licenses"
ON public.licenses FOR UPDATE
USING (true);

CREATE POLICY "Admin anon can delete licenses"
ON public.licenses FOR DELETE
USING (true);

-- teacher_profiles: 로그인 없이 삽입 가능 (선생님 회원가입 용)
CREATE POLICY "Anon can insert teacher profiles"
ON public.teacher_profiles FOR INSERT
WITH CHECK (true);

-- student_profiles: 로그인 없이 삽입 가능 (학생 코드 등록 용)
CREATE POLICY "Anon can insert student profiles"
ON public.student_profiles FOR INSERT
WITH CHECK (true);
