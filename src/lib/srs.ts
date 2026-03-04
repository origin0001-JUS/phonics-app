// SRS (Spaced Repetition System) Engine
// Based on SM-2 algorithm adapted for kids

export interface SRSCard {
    wordId: string;
    unitId: string;
    nextReviewDate: string; // ISO date string
    interval: number;       // days until next review
    easeFactor: number;     // starts at 2.5
    repetitions: number;    // consecutive correct answers
    stage: number;          // 0=new, 1=learning, 2=young, 3=mature
}

export type Rating = 0 | 1 | 2 | 3; // Again=0, Hard=1, Good=2, Easy=3

export function calculateNextReview(card: SRSCard, rating: Rating): SRSCard {
    const now = new Date();
    let { interval, easeFactor, repetitions, stage } = card;

    if (rating < 2) {
        // Failed — reset
        repetitions = 0;
        interval = 1;
        stage = 1;
    } else {
        // Passed
        repetitions += 1;
        if (repetitions === 1) {
            interval = 1;
            stage = 1;
        } else if (repetitions === 2) {
            interval = 3;
            stage = 2;
        } else {
            interval = Math.round(interval * easeFactor);
            stage = interval >= 21 ? 3 : 2;
        }
    }

    // Adjust ease factor
    easeFactor = easeFactor + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Easy bonus
    if (rating === 3) {
        interval = Math.round(interval * 1.3);
    }

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + interval);

    return {
        ...card,
        interval,
        easeFactor,
        repetitions,
        stage,
        nextReviewDate: nextDate.toISOString().split('T')[0],
    };
}

export function createNewCard(wordId: string, unitId: string): SRSCard {
    const today = new Date().toISOString().split('T')[0];
    return {
        wordId,
        unitId,
        nextReviewDate: today,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        stage: 0,
    };
}

export function isDueToday(card: SRSCard): boolean {
    const today = new Date().toISOString().split('T')[0];
    return card.nextReviewDate <= today;
}
