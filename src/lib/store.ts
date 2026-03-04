import { create } from 'zustand';

interface AppState {
    currentLevel: string;
    currentUnitId: string | null;
    todayMinutes: number;
    streakDays: number;
    onboardingCompleted: boolean;
    gradeLevel: number | null;
    setLevel: (level: string) => void;
    setUnit: (unitId: string) => void;
    addPlayTime: (minutes: number) => void;
    resetDaily: () => void;
    setOnboardingCompleted: (completed: boolean) => void;
    setStreakDays: (days: number) => void;
    setGradeLevel: (grade: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentLevel: 'CoreA',
    currentUnitId: null,
    todayMinutes: 0,
    streakDays: 0,
    onboardingCompleted: false,
    gradeLevel: null,
    setLevel: (level) => set({ currentLevel: level }),
    setUnit: (unitId) => set({ currentUnitId: unitId }),
    addPlayTime: (minutes) => set((state) => ({ todayMinutes: state.todayMinutes + minutes })),
    resetDaily: () => set({ todayMinutes: 0 }),
    setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
    setStreakDays: (days) => set({ streakDays: days }),
    setGradeLevel: (grade) => set({ gradeLevel: grade }),
}));
