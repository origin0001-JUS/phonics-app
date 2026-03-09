"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, LogOut, Copy, Check, RefreshCw,
    BookOpen, Trophy, Clock, ChevronLeft,
    BarChart3, UserPlus, School,
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

function AuthForm({ onSuccess }: { onSuccess: () => void }) {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = mode === "login"
            ? await signInTeacher(email, password)
            : await signUpTeacher(email, password, displayName, schoolName);

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
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <School className="w-8 h-8 text-sky-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">
                        {mode === "login" ? "교사 로그인" : "교사 계정 만들기"}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Phonics 300 학습 관리 대시보드
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                        <>
                            <input
                                type="text"
                                placeholder="이름"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                            />
                            <input
                                type="text"
                                placeholder="학교명 (선택)"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                            />
                        </>
                    )}
                    <input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 focus:outline-none font-bold text-slate-700"
                    />

                    {error && (
                        <p className="text-sm text-red-500 font-bold bg-red-50 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-sky-500 text-white font-black text-lg rounded-xl shadow-[0_4px_0_#0369a1] active:translate-y-[2px] active:shadow-[0_2px_0_#0369a1] disabled:opacity-50"
                    >
                        {loading ? "처리 중..." : mode === "login" ? "로그인" : "계정 만들기"}
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

function ClassCodeCard({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
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
                        <th className="px-4 py-3 text-right">마지막 활동</th>
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
                            <td className="px-4 py-3 text-right text-sm text-slate-400 font-bold">
                                {new Date(s.last_active).toLocaleDateString("ko-KR")}
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
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"overview" | "students">("overview");

    const loadData = useCallback(async () => {
        setLoading(true);
        const [studentsData, statsData] = await Promise.all([
            getClassStudents(profile.class_code),
            getUnitCompletionStats(profile.class_code),
        ]);
        setStudents(studentsData);
        setUnitStats(statsData);
        setLoading(false);
    }, [profile.class_code]);

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
                {/* Class Code */}
                <ClassCodeCard code={profile.class_code} />

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
