"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw } from "lucide-react";
import {
    initMicStream,
    disposeMicStream,
    startRecording,
    stopRecording,
    assessPronunciation,
    checkMicPermission,
    type AssessmentResult,
    type AssessmentOptions,
} from "@/lib/audioAssessment";
import { playSFX } from "@/lib/audio";

// ─── Types ───

interface AudioVisualizerProps {
    /** 평가할 단어 */
    targetWord: string;
    /** 평가할 음소 배열 */
    targetPhonemes: string[];
    /** 최대 녹음 시간 (ms) */
    maxDurationMs?: number;
    /** 평가 완료 시 콜백 */
    onResult?: (result: AssessmentResult) => void;
    /** 컴팩트 모드 */
    compact?: boolean;
}

// ─── Score → Color/Label 변환 ───

function getScoreColor(score: number): string {
    if (score >= 80) return "#22c55e"; // green
    if (score >= 60) return "#f59e0b"; // amber
    if (score >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
}

function getScoreLabel(score: number): string {
    if (score >= 90) return "완벽해요! 🌟";
    if (score >= 80) return "아주 잘했어요! ⭐";
    if (score >= 60) return "잘하고 있어요! 👍";
    if (score >= 40) return "조금만 더! 💪";
    return "다시 해볼까요? 🔄";
}

// ─── Waveform Canvas 컴포넌트 ───

function WaveformCanvas({
    waveformData,
    isRecording,
    width = 260,
    height = 80,
}: {
    waveformData: Float32Array | null;
    isRecording: boolean;
    width?: number;
    height?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // 배경
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 12);
        ctx.fill();

        // 중심선
        const centerY = height / 2;
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, centerY);
        ctx.lineTo(width - 8, centerY);
        ctx.stroke();

        if (!waveformData || waveformData.length === 0) {
            // 대기 상태 — 점선 그리기
            ctx.strokeStyle = "#cbd5e1";
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(8, centerY);
            ctx.lineTo(width - 8, centerY);
            ctx.stroke();
            ctx.setLineDash([]);
            return;
        }

        // 파형 그리기
        const barCount = Math.min(waveformData.length, 64);
        const barWidth = (width - 16) / barCount;
        const maxAmplitude = (height / 2) - 8;

        ctx.fillStyle = isRecording ? "#3b82f6" : "#60a5fa";

        for (let i = 0; i < barCount; i++) {
            const value = waveformData[i] || 0;
            const barHeight = Math.max(2, Math.abs(value) * maxAmplitude * 2);
            const x = 8 + i * barWidth;
            const y = centerY - barHeight / 2;

            ctx.beginPath();
            ctx.roundRect(x, y, Math.max(1, barWidth - 1), barHeight, 1);
            ctx.fill();
        }

        if (isRecording) {
            animationRef.current = requestAnimationFrame(draw);
        }
    }, [waveformData, isRecording, width, height]);

    useEffect(() => {
        draw();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width, height }}
            className="rounded-xl"
        />
    );
}

// ─── Score Gauge 컴포넌트 ───

function ScoreGauge({ score, animate }: { score: number; animate: boolean }) {
    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 42;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-28 h-28 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* 배경 원 */}
                <circle
                    cx="50" cy="50" r="42"
                    fill="none" stroke="#e2e8f0" strokeWidth="8"
                    strokeLinecap="round"
                />
                {/* 점수 원 */}
                <motion.circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: animate ? strokeDashoffset : circumference }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
            </svg>
            {/* 점수 텍스트 */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: animate ? 1 : 0, scale: animate ? 1 : 0.5 }}
                transition={{ delay: 0.5, duration: 0.4 }}
            >
                <span className="text-2xl font-black" style={{ color }}>
                    {score}
                </span>
                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
            </motion.div>
        </div>
    );
}

// ─── 음소별 점수 바 ───

function PhonemeScoreBar({ phoneme, accuracy }: { phoneme: string; accuracy: number }) {
    const percent = Math.round(accuracy * 100);
    const color = getScoreColor(percent);

    return (
        <div className="flex items-center gap-2">
            <span className="w-8 text-center text-xs font-black text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5">
                /{phoneme}/
            </span>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                />
            </div>
            <span className="w-8 text-right text-xs font-bold" style={{ color }}>
                {percent}
            </span>
        </div>
    );
}

// ─── 메인 컴포넌트 ───

export default function AudioVisualizer({
    targetWord,
    targetPhonemes,
    maxDurationMs = 5000,
    onResult,
    compact,
}: AudioVisualizerProps) {
    const [micReady, setMicReady] = useState(false);
    const [recording, setRecording] = useState(false);
    const [assessing, setAssessing] = useState(false);
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
    const [volume, setVolume] = useState(0);
    const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // 마이크 권한 체크
    useEffect(() => {
        checkMicPermission().then(setMicPermission);
    }, []);

    // 언마운트 시 정리
    useEffect(() => {
        return () => {
            disposeMicStream();
            if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
        };
    }, []);

    // 마이크 초기화
    const handleInitMic = async () => {
        const ok = await initMicStream();
        setMicReady(ok);
        if (ok) setMicPermission('granted');
        else setMicPermission('denied');
    };

    // 녹음 시작
    const handleStartRecording = async () => {
        if (!micReady) {
            await handleInitMic();
            if (!micReady) return;
        }

        setResult(null);
        setRecording(true);
        playSFX('tap');

        startRecording({
            onWaveformUpdate: (data) => setWaveformData(new Float32Array(data)),
            onVolumeChange: (v) => setVolume(v),
        });

        // 자동 정지 타이머
        recordingTimeoutRef.current = setTimeout(() => {
            handleStopAndAssess();
        }, maxDurationMs);
    };

    // 녹음 중지 + 평가
    const handleStopAndAssess = async () => {
        if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);

        setRecording(false);
        setAssessing(true);

        const buffer = stopRecording();

        // 너무 짧으면 평가 스킵
        if (buffer.length < 1600) {
            setAssessing(false);
            setResult({
                score: 0,
                phonemeScores: targetPhonemes.map((p) => ({ phoneme: p, accuracy: 0 })),
                waveformData: new Float32Array(0),
                durationSec: 0,
            });
            return;
        }

        const options: AssessmentOptions = {
            targetWord,
            targetPhonemes,
            maxDurationMs,
        };

        const assessmentResult = await assessPronunciation(buffer, options);
        setResult(assessmentResult);
        setAssessing(false);

        // SFX
        if (assessmentResult.score >= 80) playSFX('correct');
        else if (assessmentResult.score >= 40) playSFX('tap');
        else playSFX('wrong');

        onResult?.(assessmentResult);
    };

    // 다시 시도
    const handleRetry = () => {
        setResult(null);
        setWaveformData(null);
        setVolume(0);
    };

    return (
        <div className={`flex flex-col items-center gap-3 ${compact ? 'gap-2' : 'gap-4'}`}>
            {/* 목표 단어 */}
            <div className="text-center">
                <p className="text-2xl font-black text-indigo-700">&ldquo;{targetWord}&rdquo;</p>
                <p className="text-xs font-bold text-slate-400 mt-1">
                    /{targetPhonemes.join(" · ")}/
                </p>
            </div>

            {/* Waveform 시각화 */}
            <WaveformCanvas
                waveformData={result ? result.waveformData : waveformData}
                isRecording={recording}
                width={compact ? 200 : 260}
                height={compact ? 60 : 80}
            />

            {/* 볼륨 인디케이터 (녹음 중) */}
            {recording && (
                <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="flex gap-0.5 items-end h-6">
                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 rounded-full"
                                style={{
                                    backgroundColor: volume >= threshold ? "#3b82f6" : "#e2e8f0",
                                    height: `${(i + 1) * 20}%`,
                                }}
                                animate={{ scaleY: volume >= threshold ? 1 : 0.5 }}
                                transition={{ duration: 0.1 }}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-bold text-blue-500 animate-pulse">
                        듣고 있어요...
                    </span>
                </motion.div>
            )}

            {/* 마이크 버튼 */}
            {!result && !assessing && (
                <motion.button
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-colors ${
                        recording
                            ? "bg-red-500 border-red-300 shadow-[0_4px_0_#b91c1c]"
                            : micPermission === 'denied'
                                ? "bg-slate-300 border-slate-200 cursor-not-allowed"
                                : "bg-blue-500 border-blue-300 shadow-[0_4px_0_#1d4ed8]"
                    }`}
                    whileTap={!recording && micPermission !== 'denied' ? { scale: 0.9 } : undefined}
                    onClick={recording ? handleStopAndAssess : handleStartRecording}
                    disabled={micPermission === 'denied'}
                >
                    {recording ? (
                        <motion.div
                            className="w-6 h-6 bg-white rounded-sm"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                        />
                    ) : micPermission === 'denied' ? (
                        <MicOff className="w-7 h-7 text-white" />
                    ) : (
                        <Mic className="w-7 h-7 text-white" />
                    )}
                </motion.button>
            )}

            {/* 마이크 권한 안내 */}
            {micPermission === 'denied' && !result && (
                <p className="text-xs text-red-400 font-bold text-center">
                    마이크 권한이 필요해요!<br />
                    브라우저 설정에서 허용해 주세요.
                </p>
            )}

            {!recording && !result && !assessing && micPermission !== 'denied' && (
                <p className="text-xs font-bold text-slate-400">
                    버튼을 눌러서 말해보세요!
                </p>
            )}

            {/* 평가 중 로딩 */}
            {assessing && (
                <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <motion.div
                        className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    />
                    <p className="text-sm font-bold text-blue-500">발음 분석 중...</p>
                </motion.div>
            )}

            {/* 결과 표시 */}
            <AnimatePresence>
                {result && result.score > 0 && (
                    <motion.div
                        className="flex flex-col items-center gap-3 w-full max-w-[280px]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* 점수 게이지 */}
                        <ScoreGauge score={result.score} animate={true} />

                        {/* 라벨 */}
                        <motion.p
                            className="text-base font-black text-center"
                            style={{ color: getScoreColor(result.score) }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            {getScoreLabel(result.score)}
                        </motion.p>

                        {/* 음소별 점수 */}
                        {!compact && result.phonemeScores.length > 0 && (
                            <div className="w-full space-y-1.5 bg-white/60 rounded-xl p-3 border-2 border-slate-100">
                                <p className="text-xs font-bold text-slate-500 mb-2">음소별 정확도</p>
                                {result.phonemeScores.map(({ phoneme, accuracy }) => (
                                    <PhonemeScoreBar key={phoneme} phoneme={phoneme} accuracy={accuracy} />
                                ))}
                            </div>
                        )}

                        {/* 다시 시도 버튼 */}
                        <motion.button
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white font-bold text-sm rounded-full shadow-[0_4px_0_#3730a3] active:translate-y-[2px] active:shadow-[0_2px_0_#3730a3]"
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRetry}
                        >
                            <RotateCcw className="w-4 h-4" />
                            다시 도전!
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
