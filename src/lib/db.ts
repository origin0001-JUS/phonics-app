import Dexie, { type EntityTable } from 'dexie';

export interface ProgressState {
    id: string; // 'user_progress'
    currentLevel: string; // 'Prep', 'CoreA', 'CoreB'
    unlockedUnits: string[]; // e.g. ['unit_01', 'unit_02']
    completedUnits: string[]; // units the user has finished
    lastPlayedDate: string; // ISO String
    onboardingCompleted: boolean;
    gradeLevel: number | null; // 1~4
}

export interface VocabularyCard {
    id: string; // word string itself, e.g. 'cat'
    unitId: string;
    nextReviewDate: string; // ISO String
    stage: number; // SRS stage: 0 (new), 1, 2, 3, etc.
    easeFactor: number; // default 2.5
    interval: number; // in days
    repetitions: number; // consecutive correct answers (SM-2)
}

export interface ActivityLog {
    id?: number; // auto-increment
    date: string; // ISO String
    durationMinutes: number;
    completedActivities: string[]; // e.g. ['SoundFocus', 'BlendTap']
}

export interface UnlockedReward {
    id: string;          // trophy ID (e.g. 'first_lesson')
    unlockedAt: string;  // ISO date string
}

class PhonicsDatabase extends Dexie {
    progress!: EntityTable<ProgressState, 'id'>;
    cards!: EntityTable<VocabularyCard, 'id'>;
    logs!: EntityTable<ActivityLog, 'id'>;
    rewards!: EntityTable<UnlockedReward, 'id'>;

    constructor() {
        super('PhonicsAppDB');
        this.version(1).stores({
            progress: 'id',
            cards: 'id, unitId, nextReviewDate',
            logs: '++id, date'
        });
        this.version(2).stores({
            progress: 'id',
            cards: 'id, unitId, nextReviewDate',
            logs: '++id, date'
        }).upgrade(tx => {
            return tx.table('cards').toCollection().modify(card => {
                if (card.repetitions === undefined) {
                    card.repetitions = 0;
                }
            });
        });
        this.version(3).stores({
            progress: 'id',
            cards: 'id, unitId, nextReviewDate',
            logs: '++id, date'
        }).upgrade(tx => {
            return tx.table('progress').toCollection().modify(row => {
                if (row.completedUnits === undefined) {
                    row.completedUnits = [];
                }
            });
        });
        this.version(4).stores({
            progress: 'id',
            cards: 'id, unitId, nextReviewDate',
            logs: '++id, date'
        }).upgrade(tx => {
            return tx.table('progress').toCollection().modify(row => {
                if (row.onboardingCompleted === undefined) {
                    row.onboardingCompleted = false;
                }
                if (row.gradeLevel === undefined) {
                    row.gradeLevel = null;
                }
            });
        });
        this.version(5).stores({
            progress: 'id',
            cards: 'id, unitId, nextReviewDate',
            logs: '++id, date',
            rewards: 'id'
        });
        this.version(6).stores({
            progress: 'id',
            cards: 'id, unitId, nextReviewDate, stage',
            logs: '++id, date',
            rewards: 'id'
        });
    }
}

export const db = new PhonicsDatabase();
