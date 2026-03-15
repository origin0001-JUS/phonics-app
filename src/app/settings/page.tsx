"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, FileText, GraduationCap, Trash2, AlertTriangle, Sun, Moon } from "lucide-react";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";

const GRADES = [
    { grade: 1, emoji: "🌱", label: "Level 1" },
    { grade: 2, emoji: "🌿", label: "Level 2" },
    { grade: 3, emoji: "🌳", label: "Level 3" },
    { grade: 4, emoji: "🚀", label: "Level 4" },
];

function getMapping(grade: number) {
    const makeUnits = (n: number) =>
        Array.from({ length: n }, (_, i) => `unit_${String(i + 1).padStart(2, "0")}`);

    switch (grade) {
        case 1:
        case 2:
            return { level: "CoreA", unitCount: 6, units: makeUnits(6) };
        case 3:
            return { level: "CoreA", unitCount: 12, units: makeUnits(12) };
        case 4:
            return { level: "CoreB", unitCount: 18, units: makeUnits(18) };
        default:
            return { level: "CoreA", unitCount: 6, units: makeUnits(6) };
    }
}

export default function SettingsPage() {
    const router = useRouter();
    const { setGradeLevel, setLevel, theme, toggleTheme } = useAppStore();
    const [currentGrade, setCurrentGrade] = useState<number | null>(null);
    const [showGradePicker, setShowGradePicker] = useState(false);
    const [resetStep, setResetStep] = useState(0); // 0=none, 1=first confirm, 2=final confirm
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        db.progress.get("user_progress").then((p) => {
            setCurrentGrade(p?.gradeLevel ?? null);
            setLoading(false);
        });
    }, []);

    const handleGradeChange = async (grade: number) => {
        const mapping = getMapping(grade);
        const progress = await db.progress.get("user_progress");

        // Keep completedUnits — only update grade/level/unlockedUnits
        const completedUnits = progress?.completedUnits ?? [];

        // Merge: keep already-unlocked units, fallback to unit_01
        const existingUnlocked = progress?.unlockedUnits?.length ? progress.unlockedUnits : ["unit_01"];
        const newUnlocked = [...new Set([...existingUnlocked, ...completedUnits])];

        await db.progress.put({
            id: "user_progress",
            currentLevel: mapping.level,
            unlockedUnits: newUnlocked,
            completedUnits,
            lastPlayedDate: progress?.lastPlayedDate ?? new Date().toISOString(),
            onboardingCompleted: true,
            gradeLevel: grade,
        });

        setGradeLevel(grade);
        setLevel(mapping.level);
        setCurrentGrade(grade);
        setShowGradePicker(false);
    };

    const handleReset = async () => {
        try {
            // Clear all Dexie.js tables
            await db.progress.clear();
            await db.cards.clear();
            await db.logs.clear();
            await db.rewards.clear();

            // Reset all Zustand store state (except theme preference)
            const store = useAppStore.getState();
            store.setGradeLevel(null);
            store.setLevel("CoreA");
            store.setOnboardingCompleted(false);
            store.setStreakDays(0);
            store.resetDaily();
            store.setUnit(null);

            router.replace("/onboarding");
        } catch (err) {
            console.error("Reset failed:", err);
            alert("초기화에 실패했습니다. 다시 시도해주세요.");
            setResetStep(0);
        }
    };

    if (loading) return null;

    const gradeInfo = GRADES.find((g) => g.grade === currentGrade);

    return (
        <div className="flex min-h-[100dvh] flex-col px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <Link
                    href="/"
                    className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white/60 dark:border-slate-600 bg-white/80 dark:bg-slate-700 shadow-[0_4px_0_#c8c8c8] dark:shadow-[0_4px_0_#1e293b] active:translate-y-[4px] active:shadow-none transition-all touch-manipulation cursor-pointer"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">설정</h1>
            </div>

            {/* Settings List */}
            <div className="space-y-4">
                {/* Grade Change */}
                <div className="rounded-[2rem] border-4 border-white/80 dark:border-slate-600/80 bg-white/90 dark:bg-slate-800/90 shadow-[0_6px_0_#c8c8c8] dark:shadow-[0_6px_0_#1e293b] overflow-hidden">
                    <button
                        onClick={() => setShowGradePicker(!showGradePicker)}
                        className="flex w-full items-center gap-4 px-5 py-4"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100">
                            <GraduationCap className="h-6 w-6 text-sky-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold text-gray-800 dark:text-gray-100">수준 변경</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {gradeInfo ? `${gradeInfo.emoji} ${gradeInfo.label}` : "미설정"}
                            </p>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${showGradePicker ? "rotate-90" : ""}`} />
                    </button>

                    {/* Grade Picker Dropdown */}
                    {showGradePicker && (
                        <div className="border-t-2 border-gray-100 px-4 pb-4 pt-3">
                            <div className="grid grid-cols-2 gap-3">
                                {GRADES.map((g) => {
                                    const isSelected = currentGrade === g.grade;
                                    return (
                                        <button
                                            key={g.grade}
                                            onClick={() => handleGradeChange(g.grade)}
                                            className={`rounded-2xl border-4 px-4 py-3 font-bold transition-all ${
                                                isSelected
                                                    ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_4px_0_#d97706]"
                                                    : "border-gray-200 bg-gray-50 text-gray-600 shadow-[0_4px_0_#d1d5db] active:translate-y-[4px] active:shadow-none"
                                            }`}
                                        >
                                            <span className="text-2xl">{g.emoji}</span>
                                            <p className="mt-1 text-sm">{g.label}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <div className="rounded-[2rem] border-4 border-white/80 bg-white/90 dark:bg-slate-800/90 dark:border-slate-600/80 shadow-[0_6px_0_#c8c8c8] dark:shadow-[0_6px_0_#1e293b] overflow-hidden">
                    <button
                        onClick={toggleTheme}
                        className="flex w-full items-center gap-4 px-5 py-4"
                    >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${theme === 'dark' ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                            {theme === 'dark' ? (
                                <Moon className="h-6 w-6 text-indigo-600" />
                            ) : (
                                <Sun className="h-6 w-6 text-amber-600" />
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-bold text-gray-800 dark:text-gray-100">테마 변경</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {theme === 'dark' ? '🌙 다크 모드' : '☀️ 라이트 모드'}
                            </p>
                        </div>
                        {/* Toggle Switch */}
                        <div className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                        </div>
                    </button>
                </div>

                {/* Report Link */}
                <Link
                    href="/report"
                    className="flex items-center gap-4 rounded-[2rem] border-4 border-white/80 dark:border-slate-600/80 bg-white/90 dark:bg-slate-800/90 px-5 py-4 shadow-[0_6px_0_#c8c8c8] dark:shadow-[0_6px_0_#1e293b] active:translate-y-[6px] active:shadow-none transition-all"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                        <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 dark:text-gray-100">학습 리포트</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">학습 현황 확인 및 내보내기</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>

                {/* Data Reset */}
                <div className="rounded-[2rem] border-4 border-white/80 dark:border-slate-600/80 bg-white/90 dark:bg-slate-800/90 shadow-[0_6px_0_#c8c8c8] dark:shadow-[0_6px_0_#1e293b] overflow-hidden">
                    {resetStep === 0 && (
                        <button
                            onClick={() => setResetStep(1)}
                            className="flex w-full items-center gap-4 px-5 py-4"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-bold text-gray-800 dark:text-gray-100">진행 초기화</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">모든 학습 데이터를 삭제합니다</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>
                    )}

                    {resetStep === 1 && (
                        <div className="px-5 py-4">
                            <div className="mb-3 flex items-center gap-2 text-amber-700">
                                <AlertTriangle className="h-5 w-5" />
                                <p className="font-bold">정말 초기화할까요?</p>
                            </div>
                            <p className="mb-4 text-sm text-gray-500">
                                모든 학습 기록, 단어 카드, 트로피가 삭제됩니다.
                                이 작업은 되돌릴 수 없습니다.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setResetStep(0)}
                                    className="flex-1 rounded-xl border-4 border-gray-200 bg-gray-50 py-3 font-bold text-gray-600 shadow-[0_4px_0_#d1d5db] active:translate-y-[4px] active:shadow-none"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => setResetStep(2)}
                                    className="flex-1 rounded-xl border-4 border-red-300 bg-red-50 py-3 font-bold text-red-600 shadow-[0_4px_0_#ef4444] active:translate-y-[4px] active:shadow-none"
                                >
                                    초기화하기
                                </button>
                            </div>
                        </div>
                    )}

                    {resetStep === 2 && (
                        <div className="px-5 py-4">
                            <div className="mb-3 flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                <p className="font-bold">마지막 확인</p>
                            </div>
                            <p className="mb-4 text-sm text-red-500 font-semibold">
                                되돌릴 수 없습니다. 정말 삭제할까요?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setResetStep(0)}
                                    className="flex-1 rounded-xl border-4 border-gray-200 bg-gray-50 py-3 font-bold text-gray-600 shadow-[0_4px_0_#d1d5db] active:translate-y-[4px] active:shadow-none"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 rounded-xl border-4 border-red-400 bg-red-500 py-3 font-bold text-white shadow-[0_4px_0_#b91c1c] active:translate-y-[4px] active:shadow-none"
                                >
                                    삭제합니다
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* App Version */}
            <p className="mt-auto pt-8 text-center text-xs text-gray-400">
                Phonics 300 v0.1.0
            </p>
        </div>
    );
}
