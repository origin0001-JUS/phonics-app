import { db, type VocabularyCard } from './db';
import { calculateNextReview, createNewCard, type SRSCard, type Rating } from './srs';
import { curriculum } from '@/data/curriculum';
import { REWARDS } from '@/data/rewards';
import { syncLessonToCloud, getLocalStudentId, isCloudEnabled, type CloudLessonLog } from './supabaseClient';

export interface WordResult {
    wordId: string;
    unitId: string;
    attempts: number;
    correct: number;
}

export interface LessonOutcome {
    unitId: string;
    wordResults: Map<string, WordResult>;
    durationMinutes: number;
    completedSteps: string[];
}

function wordResultToRating(result: WordResult): Rating {
    if (result.attempts === 0) return 2; // No quiz — default Good
    if (result.correct === result.attempts) return 2; // All correct — Good
    if (result.correct > 0) return 1; // Some correct — Hard
    return 0; // All wrong — Again
}

export function vocabCardToSRSCard(vc: VocabularyCard): SRSCard {
    return {
        wordId: vc.id,
        unitId: vc.unitId,
        nextReviewDate: vc.nextReviewDate,
        interval: vc.interval,
        easeFactor: vc.easeFactor,
        repetitions: vc.repetitions,
        stage: vc.stage,
    };
}

export function srsCardToVocabCard(srs: SRSCard): VocabularyCard {
    return {
        id: srs.wordId,
        unitId: srs.unitId,
        nextReviewDate: srs.nextReviewDate,
        interval: srs.interval,
        easeFactor: srs.easeFactor,
        repetitions: srs.repetitions,
        stage: srs.stage,
    };
}

// Review units and their content unit prerequisites
const REVIEW_PREREQUISITES: Record<number, number[]> = {
    6:  [1, 2, 3, 4, 5],
    12: [7, 8, 9, 10, 11],
    18: [13, 14, 15, 16, 17],
    24: [19, 20, 21, 22, 23],
};

const REVIEW_UNIT_NUMBERS = Object.keys(REVIEW_PREREQUISITES).map(Number);

function canUnlockReviewUnit(unitNumber: number, completedUnits: string[]): boolean {
    const prereqs = REVIEW_PREREQUISITES[unitNumber];
    if (!prereqs) return true; // Not a review unit — always allowed
    return prereqs.every(num => {
        const id = `unit_${String(num).padStart(2, '0')}`;
        return completedUnits.includes(id);
    });
}

async function getStreakDays(): Promise<number> {
    const logs = await db.logs.orderBy('date').reverse().toArray();
    if (logs.length === 0) return 0;

    const uniqueDates = [...new Set(logs.map(l => l.date.slice(0, 10)))].sort().reverse();
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

export async function checkAndUnlockRewards(isPerfectLesson: boolean): Promise<string[]> {
    const alreadyUnlocked = await db.rewards.toArray();
    const unlockedIds = new Set(alreadyUnlocked.map(r => r.id));
    const newlyUnlocked: string[] = [];

    const progress = await db.progress.get('user_progress');
    const completedUnits = progress?.completedUnits ?? [];
    const masteredCards = await db.cards.where('stage').aboveOrEqual(2).count();
    const totalLessons = await db.logs.count();
    const streakDays = await getStreakDays();

    const conditions: Record<string, boolean> = {
        first_lesson: totalLessons >= 1,
        ten_words: masteredCards >= 10,
        fifty_words: masteredCards >= 50,
        hundred_words: masteredCards >= 100,
        unit_complete: completedUnits.length >= 1,
        five_units: completedUnits.length >= 5,
        level_coreA: Array.from({ length: 12 }, (_, i) =>
            `unit_${String(i + 1).padStart(2, '0')}`
        ).every(id => completedUnits.includes(id)),
        perfect_lesson: isPerfectLesson,
        three_day_streak: streakDays >= 3,
        seven_day_streak: streakDays >= 7,
    };

    for (const reward of REWARDS) {
        if (!unlockedIds.has(reward.id) && conditions[reward.id]) {
            await db.rewards.put({
                id: reward.id,
                unlockedAt: new Date().toISOString(),
            });
            newlyUnlocked.push(reward.id);
        }
    }

    return newlyUnlocked;
}

export async function saveLessonResults(outcome: LessonOutcome, isPerfectLesson = false): Promise<string[]> {
    const { unitId, wordResults, durationMinutes, completedSteps } = outcome;

    // 1. Update SRS cards for each word
    for (const result of wordResults.values()) {
        const existing = await db.cards.get(result.wordId);
        const rating = wordResultToRating(result);

        let srsCard: SRSCard;
        if (existing) {
            srsCard = vocabCardToSRSCard(existing);
        } else {
            srsCard = createNewCard(result.wordId, result.unitId);
        }

        const updated = calculateNextReview(srsCard, rating);
        await db.cards.put(srsCardToVocabCard(updated));
    }

    // 2. Log the activity
    await db.logs.add({
        date: new Date().toISOString(),
        durationMinutes,
        completedActivities: completedSteps,
    });

    // 3. Update progress — mark complete + unlock next unit
    const progress = await db.progress.get('user_progress');
    const unlockedUnits = progress?.unlockedUnits ?? ['unit_01'];
    const completedUnits = progress?.completedUnits ?? [];

    // Mark this unit as completed
    if (!completedUnits.includes(unitId)) {
        completedUnits.push(unitId);
    }

    // Find the current unit's number and unlock the next one
    const currentUnit = curriculum.find(u => u.id === unitId);
    if (currentUnit) {
        const nextUnitNum = currentUnit.unitNumber + 1;
        const nextUnit = curriculum.find(u => u.unitNumber === nextUnitNum);

        if (nextUnit && !unlockedUnits.includes(nextUnit.id)) {
            // Check if the next unit is a review unit with prerequisites
            if (canUnlockReviewUnit(nextUnit.unitNumber, completedUnits)) {
                unlockedUnits.push(nextUnit.id);
            }
        }

        // Also check if completing this unit satisfies a review unit's prerequisites
        for (const reviewNum of REVIEW_UNIT_NUMBERS) {
            const reviewUnit = curriculum.find(u => u.unitNumber === reviewNum);
            if (reviewUnit && !unlockedUnits.includes(reviewUnit.id)) {
                if (canUnlockReviewUnit(reviewNum, completedUnits)) {
                    unlockedUnits.push(reviewUnit.id);
                }
            }
        }
    }

    await db.progress.put({
        id: 'user_progress',
        currentLevel: progress?.currentLevel ?? 'CoreA',
        unlockedUnits,
        completedUnits,
        lastPlayedDate: new Date().toISOString(),
        onboardingCompleted: progress?.onboardingCompleted ?? false,
        gradeLevel: progress?.gradeLevel ?? null,
    });

    // 4. Check and unlock rewards
    const newlyUnlocked = await checkAndUnlockRewards(isPerfectLesson);

    // 5. Cloud sync (background — non-blocking)
    syncLessonToCloudIfConnected(outcome);

    return newlyUnlocked;
}

// ─── Cloud Sync (V2-5) ───

/**
 * 레슨 결과를 Supabase에 백그라운드 전송.
 * 클라우드 미연결 시 조용히 스킵. 실패해도 로컬 데이터에 영향 없음.
 */
async function syncLessonToCloudIfConnected(outcome: LessonOutcome): Promise<void> {
    if (!isCloudEnabled()) return;

    const studentId = getLocalStudentId();
    if (!studentId) return; // 연결코드 미입력 — 클라우드 동기화 대상 아님

    try {
        const wordResultsObj: Record<string, { attempts: number; correct: number }> = {};
        let totalAttempts = 0;
        let totalCorrect = 0;

        for (const [wordId, result] of outcome.wordResults) {
            wordResultsObj[wordId] = {
                attempts: result.attempts,
                correct: result.correct,
            };
            totalAttempts += result.attempts;
            totalCorrect += result.correct;
        }

        const scorePercent = totalAttempts > 0
            ? Math.round((totalCorrect / totalAttempts) * 100)
            : 100; // 퀴즈 없는 레슨은 100%로 기록

        const cloudLog: CloudLessonLog = {
            student_id: studentId,
            unit_id: outcome.unitId,
            completed_steps: outcome.completedSteps,
            word_results: wordResultsObj,
            duration_minutes: outcome.durationMinutes,
            score_percent: scorePercent,
            synced_at: new Date().toISOString(),
        };

        await syncLessonToCloud(cloudLog);
    } catch (err) {
        // 동기화 실패는 무시 — 로컬 학습에 영향 없음
        console.warn('☁️ Cloud sync skipped:', err);
    }
}
