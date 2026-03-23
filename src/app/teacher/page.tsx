"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    School, Users, BookOpen, Star, Layout, 
    ArrowRight, LogOut, ChevronRight, CheckCircle, 
    Calendar, Shield, Loader2, Plus, Trash2, Copy, Check,
    UserPlus, BarChart3, Trophy, Clock, ChevronLeft, RefreshCw
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
    signInTeacher,
    signUpTeacher,
    signOutTeacher,
    getTeacherProfile,
    getClassStudents,
    getUnitCompletionStats,
    isCloudEnabled,
    type TeacherProfile,
    type ClassProgress,
} from "@/lib/supabaseClient";

// ─── Color palette ───

const COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

function getScoreColor(score: number): string {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
}

// ─── Login / Signup Form ───

// ─── 유틸: 에러 메시지 한글화 ───
function translateError(err: string): string {
    if (err.includes("email rate limit exceeded")) return "잠시 후 다시 시도해 주세요 (스팸 방지 보안)";
    if (err.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않습니다.";
    if (err.includes("User already registered")) return "이미 가입되어 있는 이메일입니다.";
    if (err.includes("Database error: null")) return "입력하신 정보가 올바른지 확인해 주세요.";
    if (err.includes("유효하지 않은 학교 라이선스")) return "학교 라이선스 코드가 정확하지 않습니다.";
    if (err.includes("회원 탈퇴 처리 중 오류")) return "탈퇴 처리 중 오류가 발생했습니다. 다시 시도해 주세요.";
    return err; // 그 외는 원래 에러 표시
}

function AuthForm({ onSuccess }: { onSuccess: () => void }) {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [licenseKey, setLicenseKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = mode === "login"
            ? await signInTeacher(email, password)
            : await signUpTeacher(email, password, displayName, licenseKey, schoolName);

        setLoading(false);

        if (result.success) {
            onSuccess();
        } else {
            setError(result.error || "오류가 발생했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] to-[#f0f9ff] flex items-center justify-center p-4">
            <motion.div
                className="bg-white rounded-3xl shadow-xl border-4 border-sky-200 p-8 w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <School className="w-8 h-8 text-sky-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">
                        {mode === "login" ? "선생님 로그인" : "교사 계정 만들기"}
                    </h1>
                    <p className="text-sm text-slate-400 font-bold mt-1">
                        {mode === "login" ? "활동 내역을 관리해 보세요" : "Phonics 300 학습 관리 대시보드"}
                    </p>
                    {mode === "signup" && (
                        <p className="text-[11px] text-indigo-500 font-black mt-2 bg-indigo-50 py-1 rounded-full px-3 inline-block">
                            ※ 학교 라이선스 코드가 있어야 가입 가능합니다
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 mb-1 ml-1">이름</label>
                                <input
                                    type="text"
                                    placeholder="선생님 성함 입력"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-indigo-500 mb-1 ml-1">📋 학교 라이선스 코드 (필수)</label>
                                <input
                                    type="text"
                                    placeholder="예: PHONICS-2026-XXXX-XXXX"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value.trim().toUpperCase())}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/20 focus:border-indigo-500 focus:outline-none font-bold text-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 mb-1 ml-1">학교 이름 (선택)</label>
                                <input
                                    type="text"
                                    placeholder="소속 학교"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        {mode === "login" && <label className="block text-[11px] font-black text-slate-400 mb-1 ml-1">이메일 계정</label>}
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                        />
                    </div>
                    <div>
                        {mode === "login" && <label className="block text-[11px] font-black text-slate-400 mb-1 ml-1">비밀번호</label>}
                        <input
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 rounded-xl text-red-500 text-xs font-bold text-center border border-red-200 animate-shake">
                            {translateError(error)}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#0ea5e9] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : mode === "login" ? "로그인" : "계정 만들기"}
                    </button>
                </form>

                <button
                    onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                    className="w-full mt-4 text-sm text-sky-600 font-bold hover:underline"
                >
                    {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
                </button>
            </motion.div>
        </div>
    );
}

// ─── Class Code Card ───

function ClassCodeCard({ code, license }: { code: string; license?: any }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-sm font-bold opacity-80 mb-1">학생 연결코드</p>
                <div className="flex items-center gap-3">
                    <span className="text-3xl font-black tracking-[0.2em] font-mono">
                        {code}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-xs opacity-70 mt-2">
                    학생들에게 이 코드를 알려주세요. 앱에서 입력하면 자동 연결됩니다.
                </p>
            </div>

            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-black text-slate-500">학교 라이선스 현황</p>
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">B2G Active</span>
                </div>
                {license ? (
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                            <span className="text-xl font-black text-slate-800">{license.school_name}</span>
                            <span className="text-xs font-bold text-slate-400">
                                {new Date(license.expires_at).toLocaleDateString()} 만료
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                            <div 
                                className="bg-indigo-500 h-full" 
                                style={{ width: `${Math.min(100, (license.used_seats / license.max_seats) * 100)}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                            시트 현황: <span className="text-indigo-600">{license.used_seats}</span> / {license.max_seats} 점유 중
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400">라이선스 정보를 불러오는 중...</p>
                )}
            </div>
        </div>
    );
}

// ─── Student List Table ───

function StudentTable({ students }: { students: ClassProgress[] }) {
    if (students.length === 0) {
        return (
            <div className="bg-slate-50 rounded-2xl p-8 text-center">
                <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold">아직 등록된 학생이 없어요</p>
                <p className="text-sm text-slate-400 mt-1">
                    학생들에게 연결코드를 공유해 주세요!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50 text-left text-sm font-bold text-slate-500">
                        <th className="px-4 py-3">학생</th>
                        <th className="px-4 py-3 text-center">완료 유닛</th>
                        <th className="px-4 py-3 text-center">총 레슨</th>
                        <th className="px-4 py-3 text-center">평균 점수</th>
                        <th className="px-4 py-3 text-center">활동일</th>
                        <th className="px-4 py-3 text-right">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((s, i) => (
                        <tr key={s.student_id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="px-4 py-3 font-bold text-slate-700">
                                {s.nickname}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className="bg-sky-100 text-sky-700 font-black text-sm px-2 py-1 rounded-full">
                                    {s.completed_units}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-600">
                                {s.total_lessons}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span
                                    className="font-black text-sm px-2 py-1 rounded-full"
                                    style={{
                                        color: getScoreColor(s.avg_score),
                                        backgroundColor: `${getScoreColor(s.avg_score)}15`,
                                    }}
                                >
                                    {s.avg_score}%
                                </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-slate-400 font-bold">
                                {new Date(s.last_active).toLocaleDateString("ko-KR")}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => {
                                        if (confirm(`"${s.nickname}" 학생의 시트를 회수하시겠습니까?\n회수 시 새로운 학생이 이 자리를 사용할 수 있습니다.`)) {
                                            import("@/lib/supabaseClient").then(m => m.deactivateStudent(s.student_id)).then(() => window.location.reload());
                                        }
                                    }}
                                    className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md hover:bg-red-100 hover:text-red-600 transition-colors"
                                >
                                    시트 회수
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Charts ───

function UnitProgressChart({ data }: { data: { unitId: string; completedCount: number; totalStudents: number }[] }) {
    const chartData = data
        .sort((a, b) => a.unitId.localeCompare(b.unitId))
        .map((d) => ({
            name: d.unitId.replace("unit_", "U"),
            완료율: Math.round((d.completedCount / d.totalStudents) * 100),
            학생수: d.completedCount,
        }));

    if (chartData.length === 0) {
        return (
            <div className="bg-slate-50 rounded-2xl p-8 text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-bold">아직 데이터가 없어요</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4">
            <h3 className="text-sm font-black text-slate-600 mb-3">유닛별 완료율</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                        formatter={(value) => [`${value}%`, "완료율"]}
                        contentStyle={{ borderRadius: 12, border: "2px solid #e2e8f0", fontWeight: 700 }}
                    />
                    <Bar dataKey="완료율" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function ScoreDistributionChart({ students }: { students: ClassProgress[] }) {
    const ranges = [
        { name: "90~100", min: 90, max: 100 },
        { name: "70~89", min: 70, max: 89 },
        { name: "50~69", min: 50, max: 69 },
        { name: "0~49", min: 0, max: 49 },
    ];

    const pieData = ranges.map((r) => ({
        name: r.name,
        value: students.filter((s) => s.avg_score >= r.min && s.avg_score <= r.max).length,
    })).filter((d) => d.value > 0);

    if (pieData.length === 0) return null;

    const pieColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4">
            <h3 className="text-sm font-black text-slate-600 mb-3">점수 분포</h3>
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}명`}
                        labelLine={false}
                    >
                        {pieData.map((_, i) => (
                            <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Summary Cards ───

function SummaryCards({ students }: { students: ClassProgress[] }) {
    const totalStudents = students.length;
    const totalLessons = students.reduce((sum, s) => sum + s.total_lessons, 0);
    const avgScore = totalStudents > 0
        ? Math.round(students.reduce((sum, s) => sum + s.avg_score, 0) / totalStudents)
        : 0;
    const activeToday = students.filter((s) => {
        const lastActive = new Date(s.last_active).toDateString();
        return lastActive === new Date().toDateString();
    }).length;

    const cards = [
        { icon: Users, label: "등록 학생", value: `${totalStudents}명`, color: "#3b82f6" },
        { icon: BookOpen, label: "총 레슨 수", value: `${totalLessons}회`, color: "#10b981" },
        { icon: Trophy, label: "평균 점수", value: `${avgScore}점`, color: "#f59e0b" },
        { icon: Clock, label: "오늘 활동", value: `${activeToday}명`, color: "#8b5cf6" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map(({ icon: Icon, label, value, color }) => (
                <div
                    key={label}
                    className="bg-white rounded-2xl border-2 border-slate-100 p-4 text-center"
                >
                    <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{label}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main Dashboard ───

function Dashboard({
    profile,
    onLogout,
}: {
    profile: TeacherProfile;
    onLogout: () => void;
}) {
    const [students, setStudents] = useState<ClassProgress[]>([]);
    const [unitStats, setUnitStats] = useState<{ unitId: string; completedCount: number; totalStudents: number }[]>([]);
    const [license, setLicense] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"overview" | "students">("overview");

    const handleWithdraw = async () => {
        if (!confirm("정말 탈퇴하시겠습니까?\n탈퇴 시 관리하시던 모든 학생 학습 기록이 삭제되며,\n다른 기기에서 더 이상 이 학급 코드를 사용할 수 없습니다.")) return;
        
        setLoading(true);
        const { getSupabase } = await import("@/lib/supabaseClient");
        const client = getSupabase();
        if (client) {
            try {
                // 1. 프로필 삭제 (RLS 정책에 의해 본인 것만 삭제 가능)
                const { error: delError } = await client
                    .from("teacher_profiles")
                    .delete()
                    .eq("id", profile.id);
                
                if (delError) throw delError;

                // 2. 로그아웃 후 홈으로
                await client.auth.signOut();
                window.location.href = "/";
            } catch (err: any) {
                alert("탈퇴 중 오류가 발생했습니다: " + err.message);
                setLoading(false);
            }
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        const { getSupabase } = await import("@/lib/supabaseClient");
        const supabase = getSupabase();
        
        const [studentsData, statsData, licenseResp] = await Promise.all([
            getClassStudents(profile.class_code),
            getUnitCompletionStats(profile.class_code),
            supabase ? supabase.from("licenses").select("*").eq("id", profile.license_id).single() : Promise.resolve({ data: null })
        ]);
        
        setStudents(studentsData);
        setUnitStats(statsData);
        if (licenseResp.data) setLicense(licenseResp.data);
        setLoading(false);
    }, [profile.class_code, profile.license_id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] to-[#f0f9ff]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b-2 border-sky-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/" className="p-2 rounded-xl hover:bg-sky-50">
                            <ChevronLeft className="w-5 h-5 text-slate-500" />
                        </a>
                        <div>
                            <h1 className="text-lg font-black text-slate-800">
                                {profile.display_name} 선생님
                            </h1>
                            <p className="text-xs text-slate-400 font-bold">
                                {profile.school_name || "Phonics 300 대시보드"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadData}
                            className="p-2 rounded-xl hover:bg-sky-50 text-slate-500"
                            title="새로고침"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-2 rounded-xl hover:bg-red-50 text-slate-500"
                            title="로그아웃"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Class Code & License */}
                <ClassCodeCard code={profile.class_code} license={license} />

                {/* Tabs */}
                <div className="flex gap-2">
                    {(["overview", "students"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                                tab === t
                                    ? "bg-sky-500 text-white shadow-[0_3px_0_#0369a1]"
                                    : "bg-white text-slate-500 border-2 border-slate-100"
                            }`}
                        >
                            {t === "overview" ? "전체 현황" : "학생 목록"}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {tab === "overview" ? (
                        <motion.div
                            key="overview"
                            className="space-y-4"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                        >
                            <SummaryCards students={students} />
                            <div className="grid md:grid-cols-2 gap-4">
                                <UnitProgressChart data={unitStats} />
                                <ScoreDistributionChart students={students} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="students"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <StudentTable students={students} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// ─── Page Entry ───

export default function TeacherDashboardPage() {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [cloudAvailable, setCloudAvailable] = useState(true);

    useEffect(() => {
        if (!isCloudEnabled()) {
            setCloudAvailable(false);
            setLoading(false);
            return;
        }

        getTeacherProfile().then((p) => {
            setProfile(p);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] to-[#f0f9ff] flex items-center justify-center">
                <motion.div
                    className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
            </div>
        );
    }

    if (!cloudAvailable) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] to-[#f0f9ff] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl border-4 border-amber-200 p-8 max-w-md text-center">
                    <School className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-xl font-black text-slate-800 mb-2">클라우드 미연결</h1>
                    <p className="text-sm text-slate-500 mb-4">
                        교사 대시보드를 사용하려면 Supabase 환경변수 설정이 필요합니다.
                    </p>
                    <code className="block bg-slate-50 text-xs text-slate-600 p-3 rounded-lg font-mono text-left">
                        NEXT_PUBLIC_SUPABASE_URL=...<br />
                        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
                    </code>
                    <a
                        href="/"
                        className="inline-block mt-4 px-5 py-2 bg-sky-500 text-white font-bold rounded-xl shadow-[0_3px_0_#0369a1]"
                    >
                        홈으로 돌아가기
                    </a>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <AuthForm
                onSuccess={async () => {
                    const p = await getTeacherProfile();
                    setProfile(p);
                }}
            />
        );
    }

    return (
        <Dashboard
            profile={profile}
            onLogout={async () => {
                await signOutTeacher();
                setProfile(null);
            }}
        />
    );
}
