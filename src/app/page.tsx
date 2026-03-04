"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Mic, Settings, Star, BookOpen, Loader2, Trophy } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { streakDays } = useAppStore();
  const [dueCount, setDueCount] = useState(0);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    db.progress.get("user_progress").then((p) => {
      if (!p?.onboardingCompleted) {
        router.replace("/onboarding");
      } else {
        setCheckingOnboarding(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (checkingOnboarding) return;
    const today = new Date().toISOString().split("T")[0];
    db.cards
      .where("nextReviewDate")
      .belowOrEqual(today)
      .count()
      .then(setDueCount);

    // Calculate streak from logs
    db.logs.orderBy("date").reverse().toArray().then((logs) => {
      if (logs.length === 0) return;
      const uniqueDates = [...new Set(logs.map((l) => l.date.slice(0, 10)))].sort().reverse();
      const todayStr = new Date().toISOString().slice(0, 10);
      // If most recent log isn't today or yesterday, streak is 0
      const mostRecent = uniqueDates[0];
      const diffFromToday = (new Date(todayStr).getTime() - new Date(mostRecent).getTime()) / (1000 * 60 * 60 * 24);
      if (diffFromToday > 1) return;

      let streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
      useAppStore.getState().setStreakDays(streak);
    });
  }, [checkingOnboarding]);

  if (checkingOnboarding) {
    return (
      <main className="flex-1 flex items-center justify-center relative z-10">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pt-6 pb-8 px-6 relative z-10">
      {/* Top Bar Navigation */}
      <header className="flex justify-between items-center mb-4">
        <Link href="/settings" className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-[0_5px_0_#d1d5db] dark:shadow-[0_5px_0_#1e293b] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[5px] transition-all border-2 border-slate-100 dark:border-slate-600">
          <Settings className="w-6 h-6 text-slate-400" />
        </Link>

        {/* Streak Badge */}
        <div className="bg-[#a3da61] px-5 py-2.5 rounded-full font-bold text-white shadow-[0_4px_0_#8bc34a] border-2 border-white flex items-center gap-2">
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-500" />
          Day {streakDays}
        </div>
      </header>

      {/* Hero Character Section */}
      <div className="flex flex-col items-center justify-center mt-2">
        {/* Signboard Banner */}
        <div className="relative mb-3 transform -rotate-2">
          <div className="bg-[#f0c184] border-4 border-[#c88d40] px-8 py-3 rounded-2xl shadow-[0_8px_0_#b3782b]">
            <h1 className="text-3xl font-black text-[#5e270a] tracking-wider text-center drop-shadow-sm">
              Phonics 300
            </h1>
          </div>
          <div className="absolute -top-6 left-6 w-1 h-6 bg-[#b3782b]"></div>
          <div className="absolute -top-6 right-6 w-1 h-6 bg-[#b3782b]"></div>
        </div>

        {/* Mascot Face */}
        <div className="w-36 h-36 bg-white/40 rounded-full flex items-center justify-center relative mb-2">
          <div className="w-30 h-30 bg-orange-400 rounded-full flex flex-col items-center justify-center text-white border-4 border-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] relative overflow-hidden">
            <div className="absolute top-10 left-8 w-6 h-6 bg-slate-800 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
            </div>
            <div className="absolute top-10 right-8 w-6 h-6 bg-slate-800 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
            </div>
            <div className="absolute top-20 w-4 h-3 bg-red-400 rounded-full"></div>
            <p className="absolute bottom-4 font-black tracking-widest opacity-80">FOXY</p>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                const u = new SpeechSynthesisUtterance("Hi! I'm Foxy! Let's learn phonics together!");
                u.lang = "en-US";
                u.rate = 0.8;
                window.speechSynthesis.speak(u);
              }
            }}
            className="absolute -bottom-2 right-4 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_6px_0_#d1d5db] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[6px] transition-all border-4 border-[#d8f4ff] z-20"
          >
            <Mic className="w-7 h-7 text-sky-500" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-400 font-bold mb-4 opacity-80 text-sm">Tap to hear me!</p>
      </div>

      {/* Main Action Buttons */}
      <div className="mt-auto">
        <h2 className="text-center text-xl font-black text-[#2e5c8e] dark:text-sky-300 mb-3 drop-shadow-sm">Learning Through Play</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Learn Route → Units Page */}
          <Link href="/units" className="bg-[#ff99a8] rounded-[2rem] p-2 pb-3 shadow-[0_8px_0_#d6657a] border-4 border-white flex flex-col active:scale-95 transition-transform">
            <div className="h-20 bg-[#ffb3c0] rounded-t-2xl flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white opacity-90 drop-shadow-md" />
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 w-full rounded-b-2xl flex flex-col items-center">
              <p className="font-extrabold text-[#d6657a] mb-2">Learn</p>
              <div className="w-full bg-[#fcd34d] text-amber-900 font-black py-3 rounded-xl shadow-[0_6px_0_#d97706] text-center">
                START
              </div>
            </div>
          </Link>

          {/* Review Route → Dedicated review page */}
          <Link href="/review" className="bg-[#7dd3fc] rounded-[2rem] p-2 pb-3 shadow-[0_8px_0_#38bdf8] border-4 border-white flex flex-col active:scale-95 transition-transform relative">
            {dueCount > 0 && (
              <span className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
            <div className="h-20 bg-[#a5e2ff] rounded-t-2xl flex items-center justify-center">
              <Star className="w-16 h-16 text-yellow-300 fill-yellow-300 drop-shadow-md" />
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 w-full rounded-b-2xl flex flex-col items-center">
              <p className="font-extrabold text-[#38bdf8] mb-2">Review</p>
              <div className="w-full bg-[#fcd34d] text-amber-900 font-black py-3 rounded-xl shadow-[0_6px_0_#d97706] text-center">
                START
              </div>
            </div>
          </Link>
        </div>

        {/* Rewards Button */}
        <Link
          href="/rewards"
          className="mt-3 bg-[#fef3c7] border-4 border-[#fcd34d] rounded-[2rem] px-6 py-3 shadow-[0_6px_0_#d97706] flex items-center justify-center gap-3 active:translate-y-[6px] active:shadow-none transition-all"
        >
          <Trophy className="w-7 h-7 text-amber-500" />
          <span className="font-black text-amber-800 text-lg">My Trophies</span>
        </Link>
      </div>
    </main>
  );
}
