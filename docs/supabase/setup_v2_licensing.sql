-- Phonics 300: B2G Licensing & Seat Recycling Schema (Stage 4)
-- ==========================================================

-- 1. Licenses Table (학교 단위 패키지)
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,       -- 관리자가 발급하는 고유 키
    school_name TEXT NOT NULL,
    max_seats INTEGER NOT NULL DEFAULT 30, -- 구매한 학생 시트 수
    used_seats INTEGER DEFAULT 0,          -- 현재 점유 중인 시트 (계산 필드)
    expires_at TIMESTAMPTZ NOT NULL,       -- 3년 후 만료일
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teacher Profiles (학급 단위 관리자)
-- 기존 auth.users 테이블과 연동
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    license_id UUID REFERENCES public.licenses(id),
    email TEXT NOT NULL,
    display_name TEXT,
    school_name TEXT,
    class_code TEXT UNIQUE NOT NULL,       -- 학생 연결용 6자리 코드 (예: A8F3-K9)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Student Profiles (학습자 및 시트 점유)
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code TEXT NOT NULL REFERENCES public.teacher_profiles(class_code),
    device_id TEXT NOT NULL,               -- 기기 락 (1인 1기기 보안)
    nickname TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,        -- 시트 재사용 핵심: false 처리 시 시트 부활
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active TIMESTAMPTZ DEFAULT now(),
    
    -- 동일 클래스 내에서 기기당 한 명의 학생만 허용 (선택 사항)
    UNIQUE(class_code, device_id)
);

-- 4. Row Level Security (RLS) 설정
-- ==========================================================

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 프로필만 조회 가능
CREATE POLICY "Teachers can view own profile" 
ON public.teacher_profiles FOR SELECT 
USING (auth.uid() = id);

-- 교사는 자신의 학급(class_code) 소속 학생만 조회/수정 가능 (시트 회수용)
CREATE POLICY "Teachers can manage own class students" 
ON public.student_profiles FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_profiles 
        WHERE teacher_profiles.class_code = student_profiles.class_code 
        AND teacher_profiles.id = auth.uid()
    )
);

-- 학생은 본인의 프로필만 조회 가능 (device_id 기반 식별)
CREATE POLICY "Students can view own profile" 
ON public.student_profiles FOR SELECT 
USING (true); -- 실제 서비스에서는 device_id 검증 로직 추가 권장

-- 5. Helper Functions (시트 카운팅 등)
-- ==========================================================

-- 해당 라이선스의 활성 시트 수를 계산하는 함수
CREATE OR REPLACE FUNCTION public.get_active_seat_count(license_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM public.student_profiles s
        JOIN public.teacher_profiles t ON s.class_code = t.class_code
        WHERE t.license_id = license_uuid AND s.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
