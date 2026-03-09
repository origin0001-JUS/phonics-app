"use client";

import type { VisemeId } from "@/data/visemeMap";

// SVG tongue path per viseme — sagittal (side) cross-section view
const TONGUE_PATHS: Record<VisemeId, string> = {
    rest:           'M 40,70 Q 55,66 70,68 Q 82,72 92,76',
    bilabial:       'M 40,70 Q 55,66 70,68 Q 82,72 92,76',
    labiodental:    'M 40,70 Q 55,66 70,68 Q 82,72 92,76',
    dental:         'M 40,70 Q 50,62 58,55 L 32,50',
    alveolar_stop:  'M 40,70 Q 50,58 60,48 Q 72,62 92,76',
    alveolar_fric:  'M 40,70 Q 52,60 62,52 Q 74,62 92,76',
    postalveolar:   'M 40,68 Q 52,56 65,50 Q 78,60 92,74',
    velar:          'M 40,74 Q 52,74 62,72 Q 78,52 90,48',
    glottal:        'M 40,72 Q 55,68 70,70 Q 82,73 92,76',
    open_front:     'M 40,82 Q 55,80 70,82 Q 82,84 92,88',
    mid_front:      'M 40,74 Q 55,70 70,72 Q 82,76 92,80',
    close_front:    'M 40,56 Q 52,50 64,52 Q 76,58 92,66',
    open_back:      'M 40,82 Q 55,82 68,80 Q 80,78 92,84',
    close_back:     'M 40,70 Q 52,70 64,66 Q 78,54 90,56',
    mid_central:    'M 40,74 Q 55,72 70,74 Q 82,76 92,78',
};

// Jaw drop amount per viseme (px offset)
const JAW_DROP: Record<VisemeId, number> = {
    rest: 0, bilabial: 0, labiodental: 3, dental: 5,
    alveolar_stop: 8, alveolar_fric: 5, postalveolar: 8,
    velar: 15, glottal: 18,
    open_front: 25, mid_front: 15, close_front: 5,
    open_back: 22, close_back: 5, mid_central: 12,
};

// Lip opening (for upper/lower lip separation)
const LIP_GAP: Record<VisemeId, number> = {
    rest: 0, bilabial: -2, labiodental: 2, dental: 4,
    alveolar_stop: 6, alveolar_fric: 4, postalveolar: 6,
    velar: 12, glottal: 14,
    open_front: 20, mid_front: 12, close_front: 4,
    open_back: 18, close_back: 4, mid_central: 10,
};

interface MouthCrossSectionProps {
    viseme: VisemeId;
}

export default function MouthCrossSection({ viseme }: MouthCrossSectionProps) {
    const tonguePath = TONGUE_PATHS[viseme];
    const jaw = JAW_DROP[viseme];
    const lip = LIP_GAP[viseme];

    return (
        <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
                <marker id="airflow-arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                    <path d="M 0,0 L 6,2 L 0,4" fill="#60a5fa" />
                </marker>
            </defs>

            {/* Background — soft cream for mouth cavity */}
            <rect x="0" y="0" width="120" height="120" rx="12" fill="#fef3e2" />

            {/* Nasal cavity (subtle) */}
            <path d="M 28,12 Q 40,8 55,10 Q 65,12 70,18" fill="none" stroke="#e5c8a8" strokeWidth="1.5" />

            {/* Hard palate (roof of mouth — fixed) */}
            <path d="M 28,38 Q 48,24 78,28 Q 96,32 102,38"
                  fill="none" stroke="#d4856a" strokeWidth="2.5" strokeLinecap="round" />

            {/* Soft palate / velum */}
            <path d="M 96,38 Q 100,42 98,50 Q 95,56 90,58"
                  fill="none" stroke="#d4856a" strokeWidth="2" strokeLinecap="round" />

            {/* Upper teeth */}
            <rect x="26" y="38" width="9" height="12" rx="2" fill="white" stroke="#d1d5db" strokeWidth="1" />

            {/* Upper lip */}
            <path d={`M 8,${38 - lip * 0.2} Q 16,${35 - lip * 0.3} 26,${38 - lip * 0.1}`}
                  fill="#f4a4a0" stroke="#d48080" strokeWidth="2" strokeLinecap="round" />

            {/* Lower jaw group (moves with jaw drop) */}
            <g style={{ transform: `translateY(${jaw * 0.4}px)`, transition: 'transform 0.3s ease' }}>
                {/* Lower teeth */}
                <rect x="26" y="58" width="9" height="10" rx="2" fill="white" stroke="#d1d5db" strokeWidth="1" />

                {/* Lower lip */}
                <path d={`M 8,${68 + lip * 0.3} Q 16,${72 + lip * 0.2} 26,${68 + lip * 0.1}`}
                      fill="#f4a4a0" stroke="#d48080" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Tongue — changes per viseme */}
            <path d={tonguePath}
                  fill="#e85d75" stroke="#c04060" strokeWidth="2" strokeLinecap="round"
                  style={{ transition: 'all 0.3s ease-in-out' }} />

            {/* Airflow arrow for fricatives */}
            {(viseme === 'dental' || viseme === 'alveolar_fric' || viseme === 'glottal') && (
                <path d="M 50,46 L 18,42" fill="none" stroke="#60a5fa"
                      strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#airflow-arrow)" />
            )}

            {/* Label */}
            <text x="60" y="114" textAnchor="middle" fontSize="8" fill="#94a3b8" fontWeight="bold">
                cross-section
            </text>
        </svg>
    );
}
