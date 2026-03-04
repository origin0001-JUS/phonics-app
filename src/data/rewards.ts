export type RewardCategory = 'milestone' | 'vocabulary' | 'unit' | 'level' | 'performance' | 'streak';

export interface RewardDefinition {
    id: string;
    name: string;        // Korean display name
    description: string; // Korean description of how to earn
    emoji: string;
    category: RewardCategory;
    color: string;       // Hex color for the badge background
    shadowColor: string; // 3D shadow hex
}

export const REWARDS: RewardDefinition[] = [
    {
        id: 'first_lesson',
        name: '첫 발걸음',
        description: '첫 번째 레슨을 완료하세요',
        emoji: '🎯',
        category: 'milestone',
        color: '#fcd34d',
        shadowColor: '#d4a017',
    },
    {
        id: 'ten_words',
        name: '단어 수집가',
        description: '단어 10개를 습득하세요',
        emoji: '📚',
        category: 'vocabulary',
        color: '#93c5fd',
        shadowColor: '#3b82f6',
    },
    {
        id: 'fifty_words',
        name: '어휘 달인',
        description: '단어 50개를 습득하세요',
        emoji: '🏆',
        category: 'vocabulary',
        color: '#a78bfa',
        shadowColor: '#7c3aed',
    },
    {
        id: 'hundred_words',
        name: '단어 마스터',
        description: '단어 100개를 습득하세요',
        emoji: '👑',
        category: 'vocabulary',
        color: '#f9a8d4',
        shadowColor: '#db2777',
    },
    {
        id: 'unit_complete',
        name: '유닛 클리어',
        description: '첫 번째 유닛을 완료하세요',
        emoji: '✅',
        category: 'unit',
        color: '#86efac',
        shadowColor: '#16a34a',
    },
    {
        id: 'five_units',
        name: '모험가',
        description: '유닛 5개를 완료하세요',
        emoji: '🗺️',
        category: 'unit',
        color: '#fdba74',
        shadowColor: '#ea580c',
    },
    {
        id: 'level_coreA',
        name: 'CoreA 정복',
        description: 'CoreA 레벨을 전부 완료하세요 (유닛 1~12)',
        emoji: '🌟',
        category: 'level',
        color: '#fde047',
        shadowColor: '#ca8a04',
    },
    {
        id: 'perfect_lesson',
        name: '퍼펙트 레슨',
        description: '레슨에서 별 3개를 받으세요',
        emoji: '⭐',
        category: 'performance',
        color: '#fbbf24',
        shadowColor: '#b45309',
    },
    {
        id: 'three_day_streak',
        name: '3일 연속',
        description: '3일 연속으로 학습하세요',
        emoji: '🔥',
        category: 'streak',
        color: '#fb923c',
        shadowColor: '#c2410c',
    },
    {
        id: 'seven_day_streak',
        name: '일주일 챔피언',
        description: '7일 연속으로 학습하세요',
        emoji: '💪',
        category: 'streak',
        color: '#f87171',
        shadowColor: '#b91c1c',
    },
];
