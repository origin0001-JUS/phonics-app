"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    ChevronLeft, Download, FileDown, BarChart3,
    Clock, Flame, BookOpen, TrendingUp, AlertTriangle
} from "lucide-react";
import {
    gatherReportData, downloadCSV, generatePDF,
    type OverallReport, type UnitReport, type PhonemeWeakness, type WeeklyStats
} from "@/lib/exportReport";

// ─── Lazy-loaded Recharts (tree-shake friendly) ───
const LazyBarChart = dynamic(() => import("recharts").then(m => {
    const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } = m;
    return {
        default: ({ data }: { data: PhonemeWeakness[] }) => (
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis dataKey="displayLabel" tick={{ fontSize: 11, fontWeight: 700 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                        formatter={(value) => [`${value}%`, "취약률"]}
                        labelFormatter={(label) => `음소: ${label}`}
                    />
                    <Bar dataKey="weaknessRate" radius={[6, 6, 0, 0]}>
                        {data.map((entry, i) => (
                            <Cell
                                key={i}
                                fill={entry.weaknessRate >= 60 ? "#ef4444" : entry.weaknessRate >= 30 ? "#f59e0b" : "#10b981"}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        ),
    };
}), { ssr: false, loading: () => <div className="h-[250px] flex items-center justify-center text-slate-400 font-bold">차트 로딩...</div> });

const LazyLineChart = dynamic(() => import("recharts").then(m => {
    const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = m;
    return {
        default: ({ data }: { data: WeeklyStats[] }) => (
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="분" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="개" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="totalMinutes" stroke="#3b82f6" strokeWidth={3} name="학습 시간(분)" dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="wordsLearned" stroke="#10b981" strokeWidth={3} name="학습 단어" dot={{ r: 4 }} />
                </LineChart>
            </ResponsiveContainer>
        ),
    };
}), { ssr: false, loading: () => <div className="h-[200px] flex items-center justify-center text-slate-400 font-bold">차트 로딩...</div> });

export default function ReportPage() {
    const router = useRouter();
    const [report, setReport] = useState<OverallReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("학생");
    const [showNameInput, setShowNameInput] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            try {
                const data = await gatherReportData(studentName);
                setReport(data);
            } catch (err) {
                console.error("Failed to load report:", err);
            }
            setLoading(false);
        };

        void loadReport();
    }, [studentName]);

    if (loading) {
        return (
            <main className="flex-1 flex items-center justify-center z-10 relative">
                <div className="text-white font-bold text-xl animate-pulse">
                    리포트 생성 중...
                </div>
            </main>
        );
    }

    if (!report) {
        return (
            <main className="flex-1 flex flex-col items-center justify-center z-10 relative gap-4">
                <p className="text-white font-bold text-xl">데이터가 아직 없습니다</p>
                <button
                    onClick={() => router.push("/")}
                    className="bg-white/30 text-white font-bold px-6 py-3 rounded-xl"
                >
                    홈으로 돌아가기
                </button>
            </main>
        );
    }

    const overallPct = report.totalWords > 0
        ? Math.round((report.masteredWords / report.totalWords) * 100) : 0;

    const handlePDF = async () => {
        setPdfLoading(true);
        try {
            await generatePDF(report);
        } catch (err) {
            console.error("PDF generation failed:", err);
        }
        setPdfLoading(false);
    };

    return (
        <main className="flex-1 flex flex-col relative z-10 print:bg-white print:text-black">
            {/* ─── Header ─── */}
            <header className="flex items-center gap-3 px-5 pt-6 pb-3 print:hidden">
                <button
                    onClick={() => router.push("/")}
                    className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center"
                >
                    <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-2xl font-black text-white drop-shadow-sm flex-1">
                    학습 리포트
                </h1>
            </header>

            {/* ─── Content (scrollable + printable) ─── */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5" id="report-content">

                {/* Student Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <button
                                onClick={() => setShowNameInput(!showNameInput)}
                                className="text-2xl font-black text-slate-800 dark:text-slate-100 hover:text-sky-600 transition-colors print:text-black"
                            >
                                {report.studentName}
                            </button>
                            <p className="text-slate-400 font-medium text-sm">{report.reportDate}</p>
                        </div>
                        <div className="bg-sky-50 px-4 py-2 rounded-xl">
                            <span className="text-sm text-sky-600 font-bold">{report.currentLevel}</span>
                        </div>
                    </div>

                    {showNameInput && (
                        <div className="flex gap-2 mb-4 print:hidden">
                            <input
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                className="flex-1 px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-400"
                            />
                            <button
                                onClick={() => setShowNameInput(false)}
                                className="bg-sky-400 text-white font-bold px-4 py-2 rounded-xl"
                            >
                                적용
                            </button>
                        </div>
                    )}

                    {/* Big Progress Ring */}
                    <div className="flex items-center gap-6">
                        <div className="relative w-28 h-28 flex-shrink-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                <circle
                                    cx="50" cy="50" r="42" fill="none"
                                    stroke={overallPct >= 80 ? "#10b981" : overallPct >= 40 ? "#fbbf24" : "#f87171"}
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={`${overallPct * 2.64} 264`}
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{overallPct}%</span>
                                <span className="text-xs text-slate-400 font-bold">달성률</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 flex-1">
                            <StatBadge icon={<BookOpen className="w-4 h-4" />} label="습득 단어" value={`${report.masteredWords}`} color="text-green-600 bg-green-50" />
                            <StatBadge icon={<TrendingUp className="w-4 h-4" />} label="학습 중" value={`${report.learningWords}`} color="text-amber-600 bg-amber-50" />
                            <StatBadge icon={<Clock className="w-4 h-4" />} label="총 시간" value={`${report.totalStudyMinutes}분`} color="text-sky-600 bg-sky-50" />
                            <StatBadge icon={<Flame className="w-4 h-4" />} label="연속 학습" value={`${report.streakDays}일`} color="text-orange-600 bg-orange-50" />
                        </div>
                    </div>
                </div>

                {/* ─── Phoneme Weakness Chart ─── */}
                {report.phonemeWeaknesses.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            취약 음소 분석
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mb-3">
                            가장 어려워하는 소리를 집중 연습해 보세요!
                        </p>
                        <LazyBarChart data={report.phonemeWeaknesses} />
                    </div>
                )}

                {/* ─── Weekly Study Chart ─── */}
                {report.weeklyStats.some(w => w.totalMinutes > 0) && (
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            주간 학습 추이
                        </h2>
                        <LazyLineChart data={report.weeklyStats} />
                    </div>
                )}

                {/* ─── Unit Progress Grid ─── */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600">
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        유닛별 학습 현황
                    </h2>
                    <div className="space-y-3">
                        {report.unitReports.map((u) => (
                            <UnitProgressBar key={u.unitId} unit={u} />
                        ))}
                    </div>
                </div>

                {/* ─── Recent Activity ─── */}
                {report.recentLogs.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600">
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-sky-500" />
                            최근 활동 기록
                        </h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {report.recentLogs.slice(-10).reverse().map((log, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{log.date}</span>
                                    <span className="text-sm font-bold text-sky-600">{log.durationMinutes}분</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Summary Stats (print-only) ─── */}
                <div className="hidden print:block bg-white p-6 rounded-xl border">
                    <h2 className="text-lg font-bold mb-2">종합 통계</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            <tr><td className="py-1 font-medium">총 학습 횟수</td><td className="text-right font-bold">{report.totalSessions}회</td></tr>
                            <tr><td className="py-1 font-medium">일평균 학습</td><td className="text-right font-bold">{report.averageMinutesPerDay}분</td></tr>
                            <tr><td className="py-1 font-medium">완료 유닛</td><td className="text-right font-bold">{report.completedUnits} / {report.totalUnits}</td></tr>
                            <tr><td className="py-1 font-medium">전체 단어 습득률</td><td className="text-right font-bold">{overallPct}%</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* ─── Export Buttons ─── */}
                <div className="flex gap-3 print:hidden">
                    <button
                        onClick={() => downloadCSV(report)}
                        className="flex-1 bg-green-400 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_#16a34a] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        CSV 다운로드
                    </button>
                    <button
                        onClick={handlePDF}
                        disabled={pdfLoading}
                        className="flex-1 bg-indigo-400 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_#4338ca] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FileDown className="w-5 h-5" />
                        {pdfLoading ? "생성 중..." : "PDF 다운로드"}
                    </button>
                </div>
            </div>
        </main>
    );
}

// ─── Sub-Components ───

function StatBadge({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    const colorClass = color.split(' ');
    return (
        <div className={`${colorClass[1] || 'bg-slate-50'} rounded-xl px-3 py-2 flex flex-col`}>
            <div className={`flex items-center gap-1 ${colorClass[0]} mb-0.5`}>
                {icon}
                <span className="text-xs font-bold">{label}</span>
            </div>
            <span className={`text-lg font-black ${colorClass[0]}`}>{value}</span>
        </div>
    );
}

function UnitProgressBar({ unit }: { unit: UnitReport }) {
    const mastered = unit.youngWords + unit.matureWords;
    const masteredPct = unit.totalWords > 0 ? (mastered / unit.totalWords) * 100 : 0;
    const learningPct = unit.totalWords > 0 ? (unit.learningWords / unit.totalWords) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{unit.unitTitle}</span>
                <span className="text-xs font-bold text-slate-400">
                    {mastered}/{unit.totalWords}
                    {unit.completionRate >= 80 && <span className="ml-1">*</span>}
                </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                {/* Mastered = green */}
                <div
                    className="h-full bg-green-400 transition-all duration-500"
                    style={{ width: `${masteredPct}%` }}
                />
                {/* Learning = yellow */}
                <div
                    className="h-full bg-amber-300 transition-all duration-500"
                    style={{ width: `${learningPct}%` }}
                />
            </div>
        </div>
    );
}
