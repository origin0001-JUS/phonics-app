"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Mic, Settings, Star, BookOpen, Loader2, Trophy } from "lucide-react";
import Link from "next/link";

// ─── V2-8: Bilingual Video Sequencer Types ───

type FoxyState = "idle" | "talking_en" | "talking_ko";

interface VideoStep {
  src: string;
  foxyState: FoxyState;
  bubbleText: string;
}

const VIDEO_SEQUENCE: VideoStep[] = [
  {
    src: "/assets/video/Foxy_english.mp4",
    foxyState: "talking_en",
    bubbleText: "Hi! I'm Foxy! 🦊",
  },
];

// ─── useVideoSequencer Hook (co-located) ───

function useVideoSequencer(steps: VideoStep[]) {
  const [foxyState, setFoxyState] = useState<FoxyState>("idle");
  const [currentBubbleText, setCurrentBubbleText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState("");

  const currentIndexRef = useRef(-1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    currentIndexRef.current = -1;
    setFoxyState("idle");
    setCurrentBubbleText("");
    setIsPlaying(false);
    setCurrentVideoSrc("");
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    finish();
  }, [finish]);

  const playStep = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        finish();
        return;
      }

      const step = steps[index];
      currentIndexRef.current = index;
      setFoxyState(step.foxyState);
      setCurrentBubbleText(step.bubbleText);
      setCurrentVideoSrc(step.src);
    },
    [steps, finish]
  );

  const handleVideoEnd = useCallback(() => {
    if (timeoutRef.current) return; // Prevent double firing
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < steps.length) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        playStep(nextIndex);
      }, 300);
    } else {
      finish();
    }
  }, [steps.length, playStep, finish]);

  const play = useCallback(() => {
    stop();
    setIsPlaying(true);
    requestAnimationFrame(() => playStep(0));
  }, [stop, playStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { play, stop, foxyState, currentBubbleText, isPlaying, currentVideoSrc, handleVideoEnd };
}


// ─── Home Page ───

export default function Home() {
  const router = useRouter();
  const { streakDays } = useAppStore();
  const [dueCount, setDueCount] = useState(0);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  const { play, foxyState, currentBubbleText, currentVideoSrc, handleVideoEnd } =
    useVideoSequencer(VIDEO_SEQUENCE);

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
    db.logs
      .orderBy("date")
      .reverse()
      .toArray()
      .then((logs) => {
        if (logs.length === 0) return;
        const uniqueDates = [
          ...new Set(logs.map((l) => l.date.slice(0, 10))),
        ]
          .sort()
          .reverse();
        const todayStr = new Date().toISOString().slice(0, 10);
        const mostRecent = uniqueDates[0];
        const diffFromToday =
          (new Date(todayStr).getTime() - new Date(mostRecent).getTime()) /
          (1000 * 60 * 60 * 24);
        if (diffFromToday > 1) return;

        let streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const diff =
            (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
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
        <Link
          href="/settings"
          className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-[0_5px_0_#d1d5db] dark:shadow-[0_5px_0_#1e293b] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[5px] transition-all border-2 border-slate-100 dark:border-slate-600"
        >
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

        {/* Speech Bubble */}
        <div
          className={`transition-all duration-300 ${currentBubbleText
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
        >
          {currentBubbleText && (
            <div className="bg-white border-4 border-[#fcd34d] rounded-2xl px-5 py-3 mb-2 relative shadow-lg max-w-[260px]">
              <p className="text-sm font-bold text-slate-700 text-center">
                {currentBubbleText}
              </p>
              {/* Bubble tail */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#fcd34d]" />
            </div>
          )}
        </div>

        {/* Mascot Face */}
        <div
          className={`w-36 h-36 bg-white/40 rounded-full flex items-center justify-center relative mb-2 transition-all duration-300 ${foxyState !== "idle"
            ? `animate-pulse ${foxyState === "talking_en"
              ? "ring-4 ring-sky-300"
              : "ring-4 ring-amber-300"
            }`
            : ""
            }`}
        >
          <div className="w-30 h-30 rounded-full flex items-center justify-center border-4 border-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] relative overflow-hidden bg-white">
            {currentVideoSrc ? (
              <video
                src={currentVideoSrc}
                autoPlay
                playsInline
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  // Trim the last 1.0 second to avoid the audio pop
                  if (video.duration && video.currentTime >= video.duration - 1.0) {
                    handleVideoEnd();
                  }
                }}
                onEnded={handleVideoEnd}
                className="w-full h-full object-cover scale-110"
              />
            ) : (
              <img
                src="/assets/images/foxy_mascot_3d.jpg"
                alt="Cute Foxy Mascot"
                className="w-full h-full object-cover scale-110"
              />
            )}
          </div>

          <button
            onClick={play}
            className={`absolute -bottom-2 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_6px_0_#d1d5db] active:shadow-[0_0px_0_#d1d5db] active:translate-y-[6px] transition-all border-4 z-20 ${foxyState === "talking_en"
              ? "bg-[#a3da61] border-[#8bc34a]"
              : foxyState === "talking_ko"
                ? "bg-[#fcd34d] border-[#d97706]"
                : "bg-white border-[#d8f4ff]"
              }`}
          >
            <Mic
              className={`w-7 h-7 ${foxyState !== "idle"
                ? "text-white animate-bounce"
                : "text-sky-500"
                }`}
            />
          </button>
        </div>

        <p
          className={`font-bold mb-4 text-sm ${foxyState === "idle"
            ? "text-slate-600 dark:text-slate-400 opacity-80"
            : foxyState === "talking_en"
              ? "text-sky-500 animate-pulse"
              : "text-amber-500 animate-pulse"
            }`}
        >
          {foxyState === "idle"
            ? "Tap to hear me!"
            : foxyState === "talking_en"
              ? "Speaking..."
              : "말하는 중..."}
        </p>
      </div>

      {/* Main Action Buttons */}
      <div className="mt-auto">
        <h2 className="text-center text-xl font-black text-[#2e5c8e] dark:text-sky-300 mb-3 drop-shadow-sm">
          Learning Through Play
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Learn Route → Units Page */}
          <Link
            href="/units"
            className="bg-[#ff99a8] rounded-[2rem] p-2 pb-3 shadow-[0_8px_0_#d6657a] border-4 border-white flex flex-col active:scale-95 transition-transform"
          >
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
          <Link
            href="/review"
            className="bg-[#7dd3fc] rounded-[2rem] p-2 pb-3 shadow-[0_8px_0_#38bdf8] border-4 border-white flex flex-col active:scale-95 transition-transform relative"
          >
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
          <span className="font-black text-amber-800 text-lg">
            My Trophies
          </span>
        </Link>
      </div>
    </main>
  );
}
