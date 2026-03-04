"use client";

import { useState, useEffect } from "react";
import { curriculum } from "@/data/curriculum";
import { db } from "@/lib/db";
import { ChevronLeft, Lock, Star, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

const DEFAULT_UNLOCKED = ["unit_01", "unit_02", "unit_03"];

export default function UnitsPage() {
    const [unlockedUnits, setUnlockedUnits] = useState<string[]>([]);
    const [completedUnits, setCompletedUnits] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        db.progress.get("user_progress").then((progress) => {
            setUnlockedUnits(progress?.unlockedUnits ?? DEFAULT_UNLOCKED);
            setCompletedUnits(progress?.completedUnits ?? []);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <main className="flex-1 flex items-center justify-center relative z-10">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col pb-10 relative z-10">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 pt-8 pb-4">
                <Link href="/" className="w-11 h-11 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-[0_4px_0_#d1d5db] dark:shadow-[0_4px_0_#1e293b] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[4px] transition-all border-2 border-slate-100 dark:border-slate-600">
                    <ChevronLeft className="w-6 h-6 text-slate-500" />
                </Link>
                <h1 className="text-2xl font-bold text-white drop-shadow-md">Pick a Unit!</h1>
            </header>

            {/* Unit Grid */}
            <div className="px-5 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    {curriculum.map((unit) => {
                        const isUnlocked = unlockedUnits.includes(unit.id);
                        const isCompleted = completedUnits.includes(unit.id);

                        return (
                            <Link
                                key={unit.id}
                                href={isUnlocked ? `/lesson/${unit.id}` : "#"}
                                className={`relative rounded-[1.5rem] p-1.5 pb-2 border-4 border-white dark:border-slate-600 flex flex-col transition-all ${isUnlocked
                                        ? "active:scale-95"
                                        : "opacity-60 pointer-events-none"
                                    }`}
                                style={{
                                    backgroundColor: unit.color,
                                    boxShadow: `0 8px 0 ${unit.shadowColor}`,
                                }}
                            >
                                {/* Lock overlay */}
                                {!isUnlocked && (
                                    <div className="absolute inset-0 bg-black/20 rounded-[1.3rem] flex items-center justify-center z-10">
                                        <Lock className="w-10 h-10 text-white drop-shadow-lg" />
                                    </div>
                                )}
                                {/* Completed check */}
                                {isCompleted && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <CheckCircle2 className="w-7 h-7 text-white fill-green-400" />
                                    </div>
                                )}

                                {/* Emoji icon area */}
                                <div className="h-20 bg-white/20 rounded-t-xl flex items-center justify-center">
                                    <span className="text-5xl">{unit.emoji}</span>
                                </div>

                                {/* Label */}
                                <div className="bg-white dark:bg-slate-800 rounded-b-xl p-3 flex flex-col items-center">
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{unit.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{unit.subtitle}</p>
                                    {isUnlocked && (
                                        <div className="flex gap-0.5 mt-2">
                                            {[1, 2, 3].map((s) => (
                                                <Star
                                                    key={s}
                                                    className={`w-4 h-4 ${isCompleted
                                                        ? "text-yellow-400 fill-yellow-300"
                                                        : "text-slate-300 fill-slate-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
