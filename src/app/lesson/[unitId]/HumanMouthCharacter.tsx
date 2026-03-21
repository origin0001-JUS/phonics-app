"use client";

import { useState } from "react";
import type { VisemeId } from "@/data/visemeMap";

/**
 * HumanMouthCharacter v6 — seed 이미지 기반 정적 입모양
 *
 * seed_final.jpeg 캐릭터를 기반으로 AI 생성된 15개 viseme 이미지를 표시.
 * 이미지가 없는 viseme은 rest(seed 원본)로 fallback.
 */

// viseme → 이미지 경로 매핑
// 이미지 파일은 public/assets/images/mouth/ 에 배치
// 지원 확장자: .jpeg, .webp, .png
const MOUTH_IMAGES: Record<VisemeId, string> = {
    rest:           '/assets/images/mouth/rest.jpeg',
    bilabial:       '/assets/images/mouth/bilabial.jpeg',
    labiodental:    '/assets/images/mouth/labiodental.jpeg',
    dental:         '/assets/images/mouth/dental.jpeg',
    alveolar_stop:  '/assets/images/mouth/alveolar_stop.jpeg',
    alveolar_fric:  '/assets/images/mouth/alveolar_fric.jpeg',
    postalveolar:   '/assets/images/mouth/postalveolar.jpeg',
    velar:          '/assets/images/mouth/velar.jpeg',
    glottal:        '/assets/images/mouth/glottal.jpeg',
    open_front:     '/assets/images/mouth/open_front.jpeg',
    mid_front:      '/assets/images/mouth/mid_front.jpeg',
    close_front:    '/assets/images/mouth/close_front.jpeg',
    open_back:      '/assets/images/mouth/open_back.jpeg',
    close_back:     '/assets/images/mouth/close_back.jpeg',
    mid_central:    '/assets/images/mouth/mid_central.jpeg',
};

const REST_IMAGE = MOUTH_IMAGES.rest;

interface HumanMouthCharacterProps {
    viseme: VisemeId;
    isSpeaking?: boolean;
    compact?: boolean;
    isVoiced?: boolean;
    showAirflow?: boolean;
}

export default function HumanMouthCharacter({
    viseme,
    isSpeaking = false,
    compact = false,
}: HumanMouthCharacterProps) {
    const [imgError, setImgError] = useState(false);
    const [currentViseme, setCurrentViseme] = useState(viseme);

    // viseme 변경 시 에러 상태 리셋
    if (viseme !== currentViseme) {
        setCurrentViseme(viseme);
        setImgError(false);
    }

    const src = imgError ? REST_IMAGE : (MOUTH_IMAGES[viseme] || REST_IMAGE);

    return (
        <div className={`relative ${compact ? 'w-28 h-20' : 'w-full h-full'}`}>
            <img
                src={src}
                alt={`발음 입모양: ${viseme}`}
                className={`w-full h-full object-cover ${compact ? 'rounded-lg' : 'rounded-xl'}`}
                onError={() => setImgError(true)}
                draggable={false}
            />
            {/* Speaking 인디케이터 — 파란 테두리 펄스 */}
            {isSpeaking && (
                <div
                    className={`absolute inset-0 border-3 border-blue-400 ${compact ? 'rounded-lg' : 'rounded-xl'} pointer-events-none`}
                    style={{
                        animation: 'pulse-border 1s ease-in-out infinite',
                    }}
                />
            )}
            <style jsx>{`
                @keyframes pulse-border {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.15; }
                }
            `}</style>
        </div>
    );
}

// ─── 헬퍼 (MouthVisualizer에서 import) ───
const VOICED_PHONEMES = new Set([
    'b','d','g','v','ð','z','ʒ','dʒ','m','n','ŋ','l','r','w','j',
    'æ','ɛ','ɪ','ɒ','ʌ','ʊ','iː','eɪ','aɪ','oʊ','uː','juː',
    'ɔɪ','aʊ','ɑːr','ɔːr','ɜːr','ə',
]);
const AIRFLOW_PHONEMES = new Set([
    'f','v','θ','ð','s','z','ʃ','ʒ','h','th',
]);
export function isVoicedPhoneme(p?: string): boolean { return !!p && VOICED_PHONEMES.has(p); }
export function isAirflowPhoneme(p?: string): boolean { return !!p && AIRFLOW_PHONEMES.has(p); }
