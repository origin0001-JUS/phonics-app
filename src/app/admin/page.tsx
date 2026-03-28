"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    School, Plus, Copy, Check, LogOut, AlertCircle,
    Users, Calendar, Key, RefreshCw, Loader2, Trash2, UserPlus
} from "lucide-react";
import { getSupabase, isCloudEnabled } from "@/lib/supabaseClient";

// ─── 관리자 PIN (환경변수로 설정, 기본값 000000) ───
// .env.local에 NEXT_PUBLIC_ADMIN_PIN=xxxxxx 로 변경하세요 (6자리)
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "000000";
const PIN_LENGTH = 6;
const PIN_KEY = "phonics_admin_auth";

// ─── 라이선스 키 자동 생성 ───
function generateLicenseKey(schoolName: string): string {
    const year = new Date().getFullYear();
    const arr = new Uint8Array(4);
    crypto.getRandomValues(arr);
    const rand = Array.from(arr, b => b.toString(36)).join('').substring(0, 4).toUpperCase();
    const prefix = schoolName.replace(/[^가-힣a-zA-Z]/g, "").substring(0, 2).toUpperCase() || "SC";
    return `PHONICS-${year}-${prefix}-${rand}`;
}

// ─── 만료일 계산 (3년 후) ───
function threeYearsFromNow(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d.toISOString().split("T")[0];
}

// ─── PIN 로그인 화면 ───
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const handleDigit = (d: string) => {
        if (pin.length >= PIN_LENGTH) return;
        const next = pin + d;
        setPin(next);
        if (next.length === PIN_LENGTH) {
            setTimeout(() => {
                if (next === ADMIN_PIN) {
                    sessionStorage.setItem(PIN_KEY, "1");
                    onSuccess();
                } else {
                    setError(true);
                    setShake(true);
                    setPin("");
                    setTimeout(() => { setShake(false); setError(false); }, 800);
                }
            }, 200);
        }
    };

    const handleClear = () => setPin("");

    const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center p-6">
            <motion.div
                className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
                animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-1">관리자 로그인</h1>
                <p className="text-sm text-slate-400 font-bold mb-6">{PIN_LENGTH}자리 PIN 번호를 입력하세요</p>

                {/* PIN 표시 */}
                <div className="flex justify-center gap-2 mb-6">
                    {Array.from({ length: PIN_LENGTH }, (_, i) => (
                        <div
                            key={i}
                            className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${
                                i < pin.length
                                    ? error ? "border-red-400 bg-red-400" : "border-indigo-400 bg-indigo-400"
                                    : "border-slate-200 bg-slate-50"
                            }`}
                        >
                            {i < pin.length && <div className="w-3 h-3 bg-white rounded-full" />}
                        </div>
                    ))}
                </div>

                {error && (
                    <p className="text-red-500 font-bold text-sm mb-3">PIN이 맞지 않습니다</p>
                )}

                {/* 숫자 키패드 */}
                <div className="grid grid-cols-3 gap-3">
                    {digits.map((d, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (d === "⌫") handleClear();
                                else if (d !== "") handleDigit(d);
                            }}
                            disabled={d === ""}
                            className={`h-14 rounded-2xl font-black text-xl transition-all active:scale-95 ${
                                d === ""
                                    ? "invisible"
                                    : d === "⌫"
                                    ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    : "bg-slate-50 text-slate-700 shadow-[0_4px_0_#e2e8f0] active:shadow-none active:translate-y-[4px] hover:bg-indigo-50"
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// ─── 학교 등록 모달 ───
function NewSchoolModal({
    onClose,
    onSave,
}: {
    onClose: () => void;
    onSave: (school: { school_name: string; max_seats: number; expires_at: string; license_key: string }) => Promise<void>;
}) {
    const [schoolName, setSchoolName] = useState("");
    const [maxSeats, setMaxSeats] = useState(30);
    const [expiresAt, setExpiresAt] = useState(threeYearsFromNow());
    const [loading, setLoading] = useState(false);
    const generatedKey = generateLicenseKey(schoolName || "학교");

    const handleSave = async () => {
        if (!schoolName.trim()) return;
        setLoading(true);
        await onSave({
            school_name: schoolName.trim(),
            max_seats: maxSeats,
            expires_at: expiresAt,
            license_key: generatedKey,
        });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <h2 className="text-2xl font-black text-slate-800 mb-5">🏫 새 학교 등록</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-black text-slate-500 mb-1">학교 이름 *</label>
                        <input
                            type="text"
                            placeholder="예: 서울 OO초등학교"
                            value={schoolName}
                            onChange={e => setSchoolName(e.target.value)}
                            className="w-full px-4 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none font-bold text-lg text-slate-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-500 mb-1">학생 수 (최대 이용 인원)</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMaxSeats(s => Math.max(1, s - 10))}
                                className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                            >−</button>
                            <div className="flex-1 text-center text-3xl font-black text-indigo-600">{maxSeats}명</div>
                            <button
                                onClick={() => setMaxSeats(s => s + 10)}
                                className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                            >+</button>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {[30, 60, 120, 200].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setMaxSeats(n)}
                                    className={`flex-1 py-2 rounded-xl text-sm font-black transition-colors ${
                                        maxSeats === n ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-indigo-50"
                                    }`}
                                >
                                    {n}명
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black text-slate-500 mb-1">만료일 (기본: 3년)</label>
                        <input
                            type="date"
                            value={expiresAt}
                            onChange={e => setExpiresAt(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none font-bold text-slate-700"
                        />
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-4">
                        <p className="text-xs font-black text-indigo-400 mb-1">자동 생성 라이선스 키</p>
                        <p className="font-black text-lg text-indigo-700 font-mono tracking-wider">{generatedKey}</p>
                        <p className="text-xs text-indigo-400 mt-1">이 코드를 학교 담당 선생님에게 전달하세요</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-500 hover:bg-slate-50 text-lg"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!schoolName.trim() || loading}
                        className="flex-[2] py-4 rounded-2xl bg-indigo-500 text-white font-black text-lg shadow-[0_6px_0_#3730a3] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "✅ 등록 완료!"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── 라이선스 카드 ───
function LicenseCard({ license, onRevoke, onReload }: { license: any; onRevoke: (id: string) => void, onReload: () => void }) {
    const [copied, setCopied] = useState(false);
    const [showTeachers, setShowTeachers] = useState(false);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const isExpired = new Date(license.expires_at) < new Date();
    const usagePercent = Math.min(100, Math.round((license.used_seats / license.max_seats) * 100));
    const isFull = license.used_seats >= license.max_seats;

    const fetchTeachers = async () => {
        if (showTeachers) {
            setShowTeachers(false);
            return;
        }
        setLoadingTeachers(true);
        const client = getSupabase();
        if (client) {
            const { data } = await client
                .from("teacher_profiles")
                .select("*")
                .eq("license_id", license.id);
            setTeachers(data || []);
        }
        setLoadingTeachers(false);
        setShowTeachers(true);
    };

    const removeTeacher = async (teacherId: string, email: string) => {
        if (!confirm(`"${email}" 선생님 계정을 삭제하시겠습니까?`)) return;
        const client = getSupabase();
        if (client) {
            await client.from("teacher_profiles").delete().eq("id", teacherId);
            fetchTeachers();
            onReload();
        }
    };

    const copyKey = async () => {
        await navigator.clipboard.writeText(license.license_key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const daysLeft = Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <motion.div
            className={`bg-white rounded-3xl border-4 p-5 shadow-sm ${
                isExpired ? "border-red-200" : isFull ? "border-amber-200" : "border-slate-100"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* 상태 뱃지 */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-xl font-black text-slate-800">{license.school_name}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                        등록일: {new Date(license.created_at).toLocaleDateString("ko-KR")}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                        isExpired ? "bg-red-100 text-red-600" :
                        isFull ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-600"
                    }`}>
                        {isExpired ? "⛔ 만료" : isFull ? "⚠️ 초과" : "✅ 정상"}
                    </span>
                    <button 
                        onClick={fetchTeachers}
                        className="text-[10px] font-black text-indigo-500 hover:underline px-2"
                    >
                        {showTeachers ? "닫기" : "선생님 목록"}
                    </button>
                </div>
            </div>

            {/* 선생님 목록 (펼쳐짐) */}
            <AnimatePresence>
                {showTeachers && (
                    <motion.div 
                        className="mb-4 bg-slate-50 rounded-2xl p-3 border-2 border-slate-100 space-y-2 overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <p className="text-[10px] font-black text-slate-400 flex items-center gap-1 mb-1">
                            <UserPlus className="w-3 h-3" /> 등록된 선생님 ({teachers.length})
                        </p>
                        {loadingTeachers ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300" />
                        ) : teachers.length === 0 ? (
                            <p className="text-center text-[11px] text-slate-400 py-2">가입한 선생님이 없습니다.</p>
                        ) : (
                            teachers.map(t => (
                                <div key={t.id} className="flex items-center justify-between group">
                                    <div className="text-[11px] truncate flex-1">
                                        <span className="font-black text-slate-700">{t.display_name}</span>
                                        <span className="text-slate-400 ml-2">({t.email})</span>
                                    </div>
                                    <button 
                                        onClick={() => removeTeacher(t.id, t.email)}
                                        className="text-red-400 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded shrink-0 transition-opacity"
                                    >
                                        <LogOut className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 라이선스 키 */}
            <button
                onClick={copyKey}
                className="w-full flex items-center justify-between bg-slate-50 hover:bg-indigo-50 rounded-2xl px-4 py-3 mb-4 transition-colors group"
            >
                <span className="font-black text-slate-600 font-mono tracking-wider text-sm">{license.license_key}</span>
                <span className={`ml-2 flex items-center gap-1 text-xs font-black ${copied ? "text-green-500" : "text-slate-400 group-hover:text-indigo-500"}`}>
                    {copied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 복사</>}
                </span>
            </button>

            {/* 인원 현황 */}
            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span className="text-sm font-black text-slate-500 flex items-center gap-1">
                        <Users className="w-4 h-4" /> 학생 인원
                    </span>
                    <span className="text-sm font-black text-slate-700">
                        {license.used_seats} / {license.max_seats}명
                    </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${
                            isFull ? "bg-amber-400" : "bg-indigo-400"
                        }`}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
            </div>

            {/* 만료일 */}
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {isExpired
                        ? `만료됨 (${new Date(license.expires_at).toLocaleDateString("ko-KR")})`
                        : `${daysLeft}일 남음 (${new Date(license.expires_at).toLocaleDateString("ko-KR")} 만료)`
                    }
                </span>
                <button
                    onClick={() => {
                        if (confirm(`"${license.school_name}" 라이선스를 삭제하시겠습니까?\n삭제 시 해당 학교의 모든 선생님과 학생이 접근 불가합니다.`)) {
                            onRevoke(license.id);
                        }
                    }}
                    className="p-1 px-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px] font-black"
                >
                    <Trash2 className="w-3 h-3" /> 삭제
                </button>
            </div>
        </motion.div>
    );
}

// ─── 관리자 대시보드 ───
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [licenses, setLicenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const loadLicenses = useCallback(async () => {
        const client = getSupabase();
        if (!client) return;
        setLoading(true);
        const { data } = await client
            .from("licenses")
            .select("*")
            .order("created_at", { ascending: false });
        setLicenses(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { loadLicenses(); }, [loadLicenses]);

    const handleSave = async (school: {
        school_name: string;
        max_seats: number;
        expires_at: string;
        license_key: string;
    }) => {
        const client = getSupabase();
        if (!client) return;
        await client.from("licenses").insert({
            ...school,
            used_seats: 0,
        });
        setShowModal(false);
        setSuccessMsg(`"${school.school_name}" 등록 완료! 라이선스 키를 전달해 주세요.`);
        setTimeout(() => setSuccessMsg(""), 5000);
        loadLicenses();
    };

    const handleRevoke = async (id: string) => {
        const client = getSupabase();
        if (!client) return;
        await client.from("licenses").delete().eq("id", id);
        loadLicenses();
    };

    const totalSchools = licenses.length;
    const totalSeats = licenses.reduce((s, l) => s + l.max_seats, 0);
    const totalUsed = licenses.reduce((s, l) => s + l.used_seats, 0);
    const expiringSoon = licenses.filter(l => {
        const days = Math.ceil((new Date(l.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days > 0 && days <= 30;
    }).length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
            {/* 헤더 */}
            <header className="bg-white border-b-4 border-indigo-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">📋 라이선스 관리</h1>
                        <p className="text-xs text-slate-400 font-bold">Phonics 300 관리자 페이지</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadLicenses}
                            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
                            title="새로고침"
                        >
                            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-3 rounded-2xl bg-slate-100 hover:bg-red-50 hover:text-red-400 transition-colors text-slate-400"
                            title="로그아웃"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* 성공 메시지 */}
                <AnimatePresence>
                    {successMsg && (
                        <motion.div
                            className="bg-green-100 border-2 border-green-300 rounded-2xl px-4 py-3 text-green-700 font-bold text-sm flex items-center gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <Check className="w-5 h-5 text-green-500 shrink-0" />
                            {successMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 요약 통계 */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "계약 학교 수", value: `${totalSchools}곳`, color: "indigo", emoji: "🏫" },
                        { label: "총 이용 학생", value: `${totalUsed}/${totalSeats}명`, color: "sky", emoji: "👦" },
                        { label: "이번 달 만료 예정", value: `${expiringSoon}곳`, color: expiringSoon > 0 ? "amber" : "green", emoji: expiringSoon > 0 ? "⚠️" : "✅" },
                        { label: "활성 라이선스", value: `${licenses.filter(l => new Date(l.expires_at) >= new Date()).length}곳`, color: "green", emoji: "🔑" },
                    ].map(({ label, value, emoji }) => (
                        <div key={label} className="bg-white rounded-3xl p-4 border-2 border-slate-100 text-center shadow-sm">
                            <p className="text-2xl mb-1">{emoji}</p>
                            <p className="text-xl font-black text-slate-700">{value}</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* 새 학교 등록 버튼 */}
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-5 rounded-3xl bg-indigo-500 text-white font-black text-xl shadow-[0_8px_0_#3730a3] active:shadow-[0_0px_0_#3730a3] active:translate-y-[8px] transition-all flex items-center justify-center gap-3"
                >
                    <Plus className="w-7 h-7" />
                    새 학교 등록하기
                </button>

                {/* 학교 목록 */}
                <div>
                    <h2 className="text-lg font-black text-slate-600 mb-3 flex items-center gap-2">
                        <School className="w-5 h-5" />
                        등록된 학교 목록
                        <span className="ml-auto text-sm font-bold text-slate-400">{totalSchools}곳</span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-10 h-10 text-indigo-300 animate-spin mx-auto" />
                        </div>
                    ) : licenses.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center border-2 border-slate-100">
                            <p className="text-4xl mb-3">🏫</p>
                            <p className="font-black text-slate-600 text-lg mb-1">등록된 학교가 없어요</p>
                            <p className="text-sm text-slate-400">위 버튼을 눌러 첫 번째 학교를 등록해 보세요!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {licenses.map(l => (
                                <LicenseCard key={l.id} license={l} onRevoke={handleRevoke} onReload={loadLicenses} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <NewSchoolModal
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

// ─── 페이지 진입점 ───
export default function AdminPage() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = sessionStorage.getItem(PIN_KEY);
        if (auth === "1") setAuthenticated(true);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (!isCloudEnabled()) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-sm text-center">
                    <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-xl font-black text-slate-800 mb-2">Supabase 연결 필요</h1>
                    <p className="text-sm text-slate-500">
                        관리자 페이지를 사용하려면<br />
                        <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">.env.local</code>에<br />
                        Supabase 환경변수를 설정해 주세요.
                    </p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return <PinScreen onSuccess={() => setAuthenticated(true)} />;
    }

    return (
        <AdminDashboard
            onLogout={() => {
                sessionStorage.removeItem(PIN_KEY);
                setAuthenticated(false);
            }}
        />
    );
}
