"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-100 p-6">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sky-700 font-bold mb-6 hover:text-sky-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    홈으로
                </Link>

                <div className="bg-white rounded-3xl shadow-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-7 h-7 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">개인정보 처리방침</h1>
                            <p className="text-sm text-slate-400 font-bold">Phonics 300</p>
                        </div>
                    </div>

                    <div className="space-y-6 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-lg font-black text-slate-800 mb-2">1. 개인정보 수집 항목</h2>
                            <p className="font-semibold">
                                본 앱은 <span className="text-green-600">개인정보를 수집하지 않습니다.</span>
                            </p>
                            <ul className="mt-2 space-y-1 text-sm">
                                <li>- 회원가입, 로그인 기능이 없습니다.</li>
                                <li>- 이름, 이메일, 전화번호 등 개인 식별 정보를 요구하지 않습니다.</li>
                                <li>- 학생은 &quot;학생 1&quot;, &quot;학생 2&quot; 등 익명 닉네임만 사용합니다.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-800 mb-2">2. 데이터 저장 방식</h2>
                            <p className="text-sm">
                                모든 학습 데이터(진도, 점수, 복습 일정)는 사용 중인 기기에만 저장되며(IndexedDB),
                                외부 서버로 전송되지 않습니다. 기기의 브라우저 데이터를 삭제하면 학습 기록도 함께 삭제됩니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-800 mb-2">3. 클라우드 동기화 (선택)</h2>
                            <p className="text-sm">
                                교사 대시보드 기능을 사용하는 경우, 학습 진도 데이터가 클라우드에 동기화될 수 있습니다.
                                이 경우에도 학생의 실명이나 개인 식별 정보는 사용되지 않으며,
                                랜덤 생성된 기기 식별자와 익명 닉네임만 사용됩니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-800 mb-2">4. 마이크 사용</h2>
                            <p className="text-sm">
                                발음 연습 기능에서 마이크 접근을 요청할 수 있습니다.
                                녹음된 음성은 기기 내에서만 처리되며, 서버로 전송되거나 저장되지 않습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-800 mb-2">5. 제3자 제공</h2>
                            <p className="text-sm">
                                본 앱은 어떠한 데이터도 제3자에게 제공하지 않습니다.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-black text-slate-800 mb-2">6. 문의</h2>
                            <p className="text-sm">
                                개인정보 관련 문의 사항은 학교 담당자 또는 앱 공급자에게 연락해 주세요.
                            </p>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 font-bold">
                        최종 업데이트: 2026년 3월
                    </div>
                </div>
            </div>
        </div>
    );
}
