"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Check, School } from "lucide-react";
import { joinClassWithCode, isCloudEnabled } from "@/lib/supabaseClient";

// 활성화 토큰 localStorage 키
const ACTIVATION_KEY = "phonics_device_activated";

/* ─── Types ─── */
type Screen = "activation" | "welcome" | "grade" | "recommendation";
const SCREENS: Screen[] = ["activation", "welcome", "grade", "recommendation"];

interface GradeOption {
  grade: number;
  emoji: string;
  label: string;
  description: string;
}

const GRADES: GradeOption[] = [
  { grade: 1, emoji: "🌱", label: "Level 1", description: "처음 시작! 알파벳 소리부터 배워요" },
  { grade: 2, emoji: "🌿", label: "Level 2", description: "짧은 모음 소리를 배워요!" },
  { grade: 3, emoji: "🌳", label: "Level 3", description: "긴 모음까지 도전해요!" },
  { grade: 4, emoji: "🚀", label: "Level 4", description: "자음 조합까지 배워요!" },
];

interface LevelMapping {
  level: string;
  levelLabel: string;
  unitCount: number;
  units: string[];
}

function getMapping(grade: number): LevelMapping {
  const makeUnits = (n: number) =>
    Array.from({ length: n }, (_, i) => `unit_${String(i + 1).padStart(2, "0")}`);

  switch (grade) {
    case 1:
      return { level: "CoreA", levelLabel: "CoreA 기본 파닉스", unitCount: 6, units: makeUnits(6) };
    case 2:
      return { level: "CoreA", levelLabel: "CoreA 기본 파닉스", unitCount: 6, units: makeUnits(6) };
    case 3:
      return { level: "CoreA", levelLabel: "CoreA 기본 파닉스", unitCount: 12, units: makeUnits(12) };
    case 4:
      return { level: "CoreB", levelLabel: "CoreB 자음 조합 파닉스", unitCount: 18, units: makeUnits(18) };
    default:
      return { level: "CoreA", levelLabel: "CoreA 기본 파닉스", unitCount: 6, units: makeUnits(6) };
  }
}

/* ─── Roadmap data ─── */
interface RoadmapItem {
  label: string;
  range: string;
  maxUnit: number;
}

const ROADMAP: RoadmapItem[] = [
  { label: "짧은 모음", range: "Unit 1-5", maxUnit: 5 },
  { label: "긴 모음", range: "Unit 7-12", maxUnit: 12 },
  { label: "자음 조합", range: "Unit 13-18", maxUnit: 18 },
  { label: "심화 학습", range: "Unit 19-24", maxUnit: 24 },
];

/* ─── Slide animation variants ─── */
const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};
const transition = { type: "spring" as const, stiffness: 300, damping: 30 };

/* ─── Screen 0: Activation (연결코드 활성화) ─── */
function ActivationScreen({ onActivated }: { onActivated: () => void }) {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleActivate = async () => {
    if (!code.trim() || !nickname.trim()) {
      setError("연결코드와 이름을 모두 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await joinClassWithCode(code.trim(), nickname.trim());
    if (result.success && result.studentId) {
      localStorage.setItem(ACTIVATION_KEY, result.studentId);
      onActivated();
    } else {
      setError(result.error || "활성화에 실패했습니다. 선생님께 코드를 확인해 주세요.");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6">
      <div className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center">
        <School className="w-10 h-10 text-white drop-shadow-md" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-white drop-shadow-md mb-1">앱 활성화</h2>
        <p className="text-white/80 font-semibold text-sm">선생님께 받은 연결코드를 입력해 주세요.</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <div>
          <label className="block text-white/80 font-bold text-xs mb-1">내 이름 (닉네임)</label>
          <input
            type="text"
            placeholder="예: 박지우"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-4 border-white/50 bg-white/90 font-bold text-slate-700 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="block text-white/80 font-bold text-xs mb-1">선생님 연결코드</label>
          <input
            type="text"
            placeholder="예: A8F3-K9"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={7}
            className="w-full px-4 py-3 rounded-2xl border-4 border-white/50 bg-white/90 font-black text-xl tracking-widest text-center text-slate-700 focus:outline-none focus:border-amber-400"
          />
        </div>
        {error && (
          <p className="text-xs font-bold text-red-200 bg-red-500/30 px-4 py-2 rounded-xl text-center">{error}</p>
        )}
        <button
          onClick={handleActivate}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-xl bg-amber-400 text-amber-900 shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all border-4 border-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "시작하기! 🚀"}
        </button>
      </div>
      <p className="text-xs text-white/50 text-center">연결코드는 선생님 대시보드에서 확인하실 수 있습니다.</p>
    </div>
  );
}

/* ─── BigButton ─── */
function BigButton({
  children,
  color = "amber",
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  color?: "amber" | "green";
  disabled?: boolean;
  onClick: () => void;
}) {
  const styles = {
    amber: "bg-[#fcd34d] text-amber-900 shadow-[0_6px_0_#d97706] active:shadow-[0_0px_0_#d97706]",
    green: "bg-[#a3da61] text-green-900 shadow-[0_6px_0_#6b9b2a] active:shadow-[0_0px_0_#6b9b2a]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl font-black text-xl tracking-wide transition-transform duration-100 active:translate-y-[6px] border-4 border-white ${styles[color]} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      {children}
    </button>
  );
}

/* ─── Screen 1: Welcome ─── */
function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      {/* Mascot */}
      <div className="w-40 h-40 bg-white/40 rounded-full flex items-center justify-center mb-6">
        <div className="w-32 h-32 rounded-full border-4 border-white shadow-[0_10px_20px_rgba(0,0,0,0.1)] relative overflow-hidden bg-white">
          <img
            src="/assets/images/foxy_mascot_3d.jpg"
            alt="3D Foxy Mascot"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Speech bubble */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl px-8 py-6 shadow-lg border-4 border-white dark:border-slate-600 mb-10 max-w-xs">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white dark:border-b-slate-800"></div>
        <p className="text-center text-lg font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
          안녕! 나는 <span className="text-orange-500">FOXY</span>야!
          <br />
          영어 소리를 함께 배워볼까?
        </p>
      </div>

      <div className="w-full max-w-xs">
        <BigButton color="amber" onClick={onNext}>
          시작하기!
        </BigButton>
      </div>
    </div>
  );
}

/* ─── High Quality Audio Helper ─── */
function playGreeting() {
  if (typeof window === "undefined") return;
  const audio = new Audio('/assets/audio/hi_im_foxy.mp3');
  audio.play().catch(() => { });
}
function playLevelSelectGuide() {
  if (typeof window === "undefined") return;
  const audio = new Audio('/assets/audio/foxy_level_select.mp3');
  audio.play().catch(() => { });
}

/* ─── Screen 2: Grade Selection ─── */
function GradeSelectScreen({
  selectedGrade,
  onSelect,
  onNext,
}: {
  selectedGrade: number | null;
  onSelect: (g: number) => void;
  onNext: () => void;
}) {
  useEffect(() => {
    playLevelSelectGuide();
  }, []);

  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      <h2 className="text-3xl font-black text-center text-white drop-shadow-md mb-2">
        어떤 레벨로 시작할까요?
      </h2>
      <p className="text-center text-white/80 font-semibold mb-8">
        수준에 맞는 학습을 준비해 줄게요!
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {GRADES.map((g) => {
          const isSelected = selectedGrade === g.grade;
          return (
            <button
              key={g.grade}
              onClick={() => onSelect(g.grade)}
              className={`bg-white dark:bg-slate-800 rounded-[1.5rem] p-5 border-4 transition-all flex flex-col items-center gap-2 ${isSelected
                  ? "border-amber-400 scale-105 shadow-[0_8px_0_#d97706]"
                  : "border-white dark:border-slate-600 shadow-[0_6px_0_#d1d5db] dark:shadow-[0_6px_0_#1e293b]"
                }`}
            >
              <span className="text-4xl">{g.emoji}</span>
              <span className="font-black text-lg text-slate-700 dark:text-slate-100">{g.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-tight text-center">
                {g.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        <BigButton color="amber" disabled={selectedGrade === null} onClick={onNext}>
          다음
        </BigButton>
      </div>
    </div>
  );
}

/* ─── Screen 3: Level Recommendation ─── */
function RecommendationScreen({
  grade,
  onStart,
  onBack,
}: {
  grade: number;
  onStart: () => void;
  onBack: () => void;
}) {
  const mapping = getMapping(grade);

  return (
    <div className="flex-1 flex flex-col px-6 py-10">
      {/* Small mascot + title */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full border-3 border-white shadow-md relative overflow-hidden shrink-0 bg-white">
          <img
            src="/assets/images/foxy_mascot_3d.jpg"
            alt="3D Foxy"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-black text-white drop-shadow-md">
          Level {grade} 친구, 준비됐어!
        </h2>
      </div>

      {/* Recommended level card */}
      <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] p-5 border-4 border-amber-300 shadow-[0_6px_0_#d97706] mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full">
            추천 레벨
          </span>
        </div>
        <p className="font-black text-xl text-slate-800 dark:text-slate-100 mb-1">{mapping.levelLabel}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
          {mapping.unitCount}개 유닛이 열려요!
        </p>
      </div>

      {/* Roadmap */}
      <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-5 mb-8 flex-1 overflow-y-auto">
        <p className="font-black text-slate-600 dark:text-slate-300 mb-4 text-sm">학습 로드맵</p>
        <div className="space-y-3">
          {ROADMAP.map((item) => {
            const unlocked = mapping.unitCount >= item.maxUnit;
            return (
              <div key={item.label} className="flex items-center gap-3">
                {unlocked ? (
                  <div className="w-7 h-7 rounded-full bg-[#a3da61] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${unlocked ? "text-slate-700" : "text-slate-400"
                      }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400">{item.range}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <BigButton color="green" onClick={onStart}>
        학습 시작!
      </BigButton>

      <button
        onClick={onBack}
        className="mt-3 text-center text-white/70 font-semibold text-sm underline underline-offset-2"
      >
        수준 다시 선택하기
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function OnboardingPage() {
  const router = useRouter();
  const { setOnboardingCompleted, setGradeLevel, setLevel } = useAppStore();

  const [checking, setChecking] = useState(true);
  const [screenIndex, setScreenIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const screen = SCREENS[screenIndex];

  // Redirect if already onboarded, or skip activation if not needed
  useEffect(() => {
    db.progress.get("user_progress").then((p) => {
      if (p?.onboardingCompleted) {
        router.replace("/");
        return;
      }
      // 개발 모드(클라우드 뫸연결)이면 활성화 화면 스킵
      if (!isCloudEnabled()) {
        setScreenIndex(1); // welcome부터 시작
        setChecking(false);
        return;
      }
      // 이미 활성화된 기기면 welcome부터 시작
      const activated = localStorage.getItem(ACTIVATION_KEY);
      if (activated) setScreenIndex(1);
      setChecking(false);
    });
  }, [router]);

  const goNext = useCallback(() => {
    setDirection(1);
    setScreenIndex((i) => Math.min(i + 1, SCREENS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setScreenIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleStart = useCallback(async () => {
    if (selectedGrade === null) return;
    const mapping = getMapping(selectedGrade);

    await db.progress.put({
      id: "user_progress",
      currentLevel: mapping.level,
      unlockedUnits: ["unit_01"],
      completedUnits: [],
      lastPlayedDate: new Date().toISOString(),
      onboardingCompleted: true,
      gradeLevel: selectedGrade,
    });

    setOnboardingCompleted(true);
    setGradeLevel(selectedGrade);
    setLevel(mapping.level);
    router.push("/");
  }, [selectedGrade, router, setOnboardingCompleted, setGradeLevel, setLevel]);

  if (checking) {
    return (
      <main className="flex-1 flex items-center justify-center relative z-10">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={screen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="flex-1 flex flex-col"
        >
          {screen === "activation" && (
            <ActivationScreen onActivated={() => { setDirection(1); setScreenIndex(1); }} />
          )}
          {screen === "welcome" && <WelcomeScreen onNext={goNext} />}
          {screen === "grade" && (
            <GradeSelectScreen
              selectedGrade={selectedGrade}
              onSelect={setSelectedGrade}
              onNext={goNext}
            />
          )}
          {screen === "recommendation" && selectedGrade !== null && (
            <RecommendationScreen
              grade={selectedGrade}
              onStart={handleStart}
              onBack={goBack}
            />
          )}
        </motion.div>

      </AnimatePresence>
    </main>
  );
}
