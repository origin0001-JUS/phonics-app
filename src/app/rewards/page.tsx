"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { db, type UnlockedReward } from "@/lib/db";
import { REWARDS, type RewardDefinition } from "@/data/rewards";

export default function RewardsPage() {
    const router = useRouter();
    const [unlocked, setUnlocked] = useState<Map<string, UnlockedReward>>(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const rows = await db.rewards.toArray();
            const map = new Map(rows.map((r) => [r.id, r]));
            setUnlocked(map);
            setLoading(false);
        }
        load();
    }, []);

    const unlockedCount = unlocked.size;
    const totalCount = REWARDS.length;

    return (
        <div className="flex min-h-[100dvh] flex-col px-4 py-6 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3 shrink-0">
                <Link
                    href="/"
                    className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white/60 dark:border-slate-600 bg-white/80 dark:bg-slate-700 shadow-[0_4px_0_#c8c8c8] dark:shadow-[0_4px_0_#1e293b] active:translate-y-[4px] active:shadow-none transition-all touch-manipulation cursor-pointer"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        나의 트로피
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {unlockedCount} / {totalCount} 획득
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 overflow-hidden rounded-full border-4 border-white/60 bg-white/50 shrink-0">
                <div
                    className="h-4 rounded-full bg-[#fcd34d] transition-all duration-500"
                    style={{
                        width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%`,
                    }}
                />
            </div>

            {/* Badge grid */}
            {loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-lg text-gray-400">로딩 중...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 pb-12">
                    {REWARDS.map((reward) => {
                        const isUnlocked = unlocked.has(reward.id);
                        return (
                            <RewardCard
                                key={reward.id}
                                reward={reward}
                                isUnlocked={isUnlocked}
                                unlockedAt={unlocked.get(reward.id)?.unlockedAt}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function RewardCard({
    reward,
    isUnlocked,
    unlockedAt,
}: {
    reward: RewardDefinition;
    isUnlocked: boolean;
    unlockedAt?: string;
}) {
    return (
        <div
            className={`relative flex flex-col items-center gap-2 rounded-[2rem] border-4 p-4 sm:p-5 text-center transition-all overflow-hidden ${
                isUnlocked
                    ? "border-white/80 dark:border-slate-600/80 bg-white/90 dark:bg-slate-800/90 shadow-[0_6px_0_#c8c8c8] dark:shadow-[0_6px_0_#1e293b]"
                    : "border-gray-200/60 dark:border-slate-600/40 bg-gray-100/60 dark:bg-slate-800/40 opacity-60"
            }`}
        >
            {/* Lock overlay */}
            {!isUnlocked && (
                <div className="absolute right-3 top-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                </div>
            )}

            {/* Emoji badge */}
            <div
                className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-4 text-2xl sm:text-3xl shrink-0"
                style={{
                    backgroundColor: isUnlocked ? reward.color : "#e5e7eb",
                    borderColor: isUnlocked ? reward.shadowColor : "#d1d5db",
                    boxShadow: isUnlocked
                        ? `0 4px 0 ${reward.shadowColor}`
                        : "0 4px 0 #c8c8c8",
                }}
            >
                {isUnlocked ? reward.emoji : "?"}
            </div>

            {/* Name */}
            <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 break-words w-full leading-tight">
                {isUnlocked ? reward.name : "???"}
            </p>

            {/* Description / Date */}
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 break-words w-full leading-tight">
                {isUnlocked
                    ? formatDate(unlockedAt!)
                    : reward.description}
            </p>
        </div>
    );
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} 획득`;
}
