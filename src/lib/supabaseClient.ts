/**
 * Supabase Client (V2-5)
 * ──────────────────────────
 * B2G 대시보드 & 클라우드 동기화용 Supabase 연동 모듈.
 * 교사 계정 인증, 익명 학생 연결코드, 학습 데이터 동기화를 처리합니다.
 *
 * 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL    — Supabase 프로젝트 URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — 공개 Anon Key (Client-side 용)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface License {
    id: string;
    license_key: string;
    school_name: string;
    max_seats: number;
    expires_at: string;
    created_at: string;
}

export interface TeacherProfile {
    id: string;          // Supabase auth.users.id
    license_id: string;  // 소속 라이선스 ID
    email: string;
    display_name: string;
    school_name?: string;
    class_code: string;  // 학생 연결코드 (예: A8F3-K9)
    created_at: string;
}

export interface StudentProfile {
    id: string;          // UUID
    class_code: string;  // 교사의 연결코드
    device_id: string;   // 로컬 디바이스 식별자
    nickname: string;    // 익명 닉네임 (예: "학생 3")
    is_active: boolean;  // 시트 점유 여부 (Recycling 핵심)
    created_at: string;
    last_active: string;
}

export interface CloudLessonLog {
    id?: string;
    student_id: string;
    unit_id: string;
    completed_steps: string[];
    word_results: Record<string, { attempts: number; correct: number }>;
    duration_minutes: number;
    score_percent: number;
    synced_at: string;
}

export interface ClassProgress {
    student_id: string;
    nickname: string;
    completed_units: number;
    total_lessons: number;
    avg_score: number;
    last_active: string;
}

// ─── Supabase Client Singleton ───

let supabase: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 인스턴스 반환.
 * 환경변수가 설정되지 않으면 null 반환 (오프라인 모드).
 */
export function getSupabase(): SupabaseClient | null {
    if (typeof window === 'undefined') return null;

    if (supabase) return supabase;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        console.warn('⚠️ Supabase 환경변수 미설정 — 오프라인 모드로 동작합니다.');
        return null;
    }

    supabase = createClient(url, anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    });

    return supabase;
}

/**
 * 앱 모드: "open" (지인 공유용) | "school" (학교 배포용, 기본값)
 */
export function getAppMode(): "open" | "school" {
    return process.env.NEXT_PUBLIC_APP_MODE === "open" ? "open" : "school";
}

/**
 * Supabase 연결 가능 여부 (school 모드 + 환경변수 필요)
 */
export function isCloudEnabled(): boolean {
    if (getAppMode() === "open") return false;
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// ─── 연결코드 생성 유틸 ───

/**
 * 6자리 익명 연결코드 생성 (예: A8F3-K9)
 */
export function generateClassCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외 (0/O, 1/I/L)
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[randomBytes[i] % chars.length];
        if (i === 3) code += '-'; // A8F3-K9 형식
    }
    return code;
}

/**
 * 디바이스 고유 ID 생성/조회 (localStorage 기반)
 */
export function getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';

    const key = 'phonics_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

// ─── 교사 인증 ───

/**
 * 교사 회원가입 (이메일/비밀번호)
 */
export async function signUpTeacher(
    email: string,
    password: string,
    displayName: string,
    licenseKey: string,
    schoolName?: string
): Promise<{ success: boolean; error?: string }> {
    const client = getSupabase();
    if (!client) return { success: false, error: '클라우드 미연결' };

    // 1. 라이선스 키 유효성 확인
    const { data: license, error: licenseError } = await client
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey.trim())
        .single();

    if (licenseError || !license) {
        return { success: false, error: '유효하지 않은 학교 라이선스 코드입니다.' };
    }

    // 2. 만료일 확인
    if (new Date(license.expires_at) < new Date()) {
        return { success: false, error: '만료된 라이선스입니다. 학교 관리자에게 문의하세요.' };
    }

    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
    });

    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: '계정 생성 실패' };

    // 3. teacher_profiles 테이블에 프로필 삽입 (라이선스 연결)
    const classCode = generateClassCode();
    const { error: profileError } = await client
        .from('teacher_profiles')
        .insert({
            id: data.user.id,
            license_id: license.id,
            email,
            display_name: displayName,
            school_name: schoolName || license.school_name,
            class_code: classCode,
        });

    if (profileError) return { success: false, error: profileError.message };

    return { success: true };
}

/**
 * 교사 로그인
 */
export async function signInTeacher(
    email: string,
    password: string
): Promise<{ success: boolean; error?: string }> {
    const client = getSupabase();
    if (!client) return { success: false, error: '클라우드 미연결' };

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    return { success: true };
}

/**
 * 교사 로그아웃
 */
export async function signOutTeacher(): Promise<void> {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
}

/**
 * 현재 로그인된 교사 프로필 가져오기
 */
export async function getTeacherProfile(): Promise<TeacherProfile | null> {
    const client = getSupabase();
    if (!client) return null;

    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    const { data, error } = await client
        .from('teacher_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !data) return null;
    return data as TeacherProfile;
}

// ─── 학생 연결 ───

/**
 * 학생이 연결코드로 교사의 반에 등록
 */
export async function joinClassWithCode(
    classCode: string,
    nickname: string
): Promise<{ success: boolean; studentId?: string; error?: string }> {
    const client = getSupabase();
    if (!client) return { success: false, error: '클라우드 미연결' };

    // 1. 연결코드 유효성 및 라이선스 정보 확인
    const { data: teacher, error: teacherError } = await client
        .from('teacher_profiles')
        .select('id, license_id, licenses!inner(expires_at, max_seats)')
        .eq('class_code', classCode.toUpperCase().replace(/\s/g, ''))
        .single();

    if (teacherError || !teacher) {
        return { success: false, error: '잘못된 연결코드예요. 선생님께 다시 확인해 보세요!' };
    }

    const license = teacher.licenses as any;

    // 2. 라이선스 만료 체크
    if (new Date(license.expires_at) < new Date()) {
        return { success: false, error: '선생님 학교의 이용 기간이 끝났어요. (만료)' };
    }

    const deviceId = getDeviceId();

    // 3. 이미 등록된 기기인지 확인 (활성 상태인 것 위주)
    const { data: existing } = await client
        .from('student_profiles')
        .select('id, is_active')
        .eq('class_code', classCode.toUpperCase())
        .eq('device_id', deviceId)
        .single();

    if (existing && existing.is_active) {
        return { success: true, studentId: existing.id };
    }

    // 4. 시트 수량 체크 (Active 학생 수)
    const { data: activeCountData, error: countError } = await client
        .rpc('get_active_seat_count', { license_uuid: teacher.license_id });

    if (!countError && activeCountData >= license.max_seats) {
        return { success: false, error: '선생님 반의 등록 인원이 꽉 찼어요! (정원 초과)' };
    }

    // 5. 새 학생 프로필 생성 (또는 기존 비활성 학생 재활성화)
    if (existing && !existing.is_active) {
        // 기존 기기가 비활성 상태면 다시 활성화 (시트 소진)
        const { error: updateError } = await client
            .from('student_profiles')
            .update({ is_active: true, nickname })
            .eq('id', existing.id);
        
        if (updateError) return { success: false, error: '재등록 실패' };
        return { success: true, studentId: existing.id };
    }

    const { data: student, error: studentError } = await client
        .from('student_profiles')
        .insert({
            class_code: classCode.toUpperCase(),
            device_id: deviceId,
            nickname,
            is_active: true,
        })
        .select('id')
        .single();

    if (studentError || !student) {
        return { success: false, error: studentError?.message || '등록 실패' };
    }

    // 로컬에 학생 ID 저장
    localStorage.setItem('phonics_student_id', student.id);
    localStorage.setItem('phonics_class_code', classCode.toUpperCase());

    return { success: true, studentId: student.id };
}

/**
 * 로컬에 저장된 학생 ID 조회
 */
export function getLocalStudentId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('phonics_student_id');
}

// ─── 학습 데이터 동기화 ───

/**
 * 레슨 결과를 Supabase에 업로드
 */
export async function syncLessonToCloud(log: CloudLessonLog): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    const { error } = await client
        .from('lesson_logs')
        .insert({
            student_id: log.student_id,
            unit_id: log.unit_id,
            completed_steps: log.completed_steps,
            word_results: log.word_results,
            duration_minutes: log.duration_minutes,
            score_percent: log.score_percent,
            synced_at: log.synced_at,
        });

    if (error) {
        console.warn('☁️ Cloud sync failed:', error.message);
        return false;
    }

    return true;
}

// ─── 교사 대시보드 데이터 조회 ───

/**
 * 학생 비활성화 (시트 회수 - 진급/졸업 등)
 */
export async function deactivateStudent(studentId: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;

    const { error } = await client
        .from('student_profiles')
        .update({ is_active: false })
        .eq('id', studentId);

    return !error;
}

/**
 * 교사의 반 학생 목록 + 진도 요약 조회 (활성 학생 위주)
 */
export async function getClassStudents(classCode: string, includeInactive = false): Promise<ClassProgress[]> {
    const client = getSupabase();
    if (!client) return [];

    let query = client
        .from('student_profiles')
        .select('id, nickname, created_at, is_active')
        .eq('class_code', classCode);
    
    if (!includeInactive) {
        query = query.eq('is_active', true);
    }

    const { data: students, error } = await query;

    if (error || !students) return [];

    const progressList: ClassProgress[] = [];

    for (const student of students) {
        const { data: logs } = await client
            .from('lesson_logs')
            .select('unit_id, score_percent, synced_at')
            .eq('student_id', student.id)
            .order('synced_at', { ascending: false });

        const uniqueUnits = new Set(logs?.map(l => l.unit_id) || []);
        const scores = logs?.map(l => l.score_percent) || [];
        const avgScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        progressList.push({
            student_id: student.id,
            nickname: student.nickname,
            completed_units: uniqueUnits.size,
            total_lessons: logs?.length || 0,
            avg_score: avgScore,
            last_active: logs?.[0]?.synced_at || student.created_at,
        });
    }

    return progressList;
}

/**
 * 반 전체의 유닛별 완료율 통계
 */
export async function getUnitCompletionStats(
    classCode: string
): Promise<{ unitId: string; completedCount: number; totalStudents: number }[]> {
    const client = getSupabase();
    if (!client) return [];

    // 학생 수 조회
    const { count: totalStudents } = await client
        .from('student_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('class_code', classCode);

    if (!totalStudents) return [];

    // 각 유닛별 완료 학생 수
    const { data: logs } = await client
        .from('lesson_logs')
        .select('student_id, unit_id')
        .in('student_id', (
            await client
                .from('student_profiles')
                .select('id')
                .eq('class_code', classCode)
        ).data?.map(s => s.id) || []);

    if (!logs) return [];

    // 유닛별 고유 학생 수 집계
    const unitMap = new Map<string, Set<string>>();
    for (const log of logs) {
        if (!unitMap.has(log.unit_id)) unitMap.set(log.unit_id, new Set());
        unitMap.get(log.unit_id)!.add(log.student_id);
    }

    return Array.from(unitMap.entries()).map(([unitId, students]) => ({
        unitId,
        completedCount: students.size,
        totalStudents,
    }));
}
