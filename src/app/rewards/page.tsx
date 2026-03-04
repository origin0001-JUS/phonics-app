"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        <div className="flex min-h-[100dvh] flex-col px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white/60 bg-white/80 shadow-[0_4px_0_#c8c8c8] active:translate-y-[4px] active:shadow-none"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        나의 트로피
                    </h1>
                    <p className="text-sm text-gray-500">
                        {unlockedCount} / {totalCount} 획득
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6 overflow-hidden rounded-full border-4 border-white/60 bg-white/50">
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
                <div className="grid grid-cols-2 gap-4">
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
            className={`relative flex flex-col items-center gap-2 rounded-[2rem] border-4 p-5 text-center transition-all ${
                isUnlocked
                    ? "border-white/80 bg-white/90 shadow-[0_6px_0_#c8c8c8]"
                    : "border-gray-200/60 bg-gray-100/60 opacity-60"
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
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 text-3xl"
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
            <p className="text-sm font-bold text-gray-800">
                {isUnlocked ? reward.name : "???"}
            </p>

            {/* Description / Date */}
            <p className="text-xs text-gray-500">
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
