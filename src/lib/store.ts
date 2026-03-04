import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface AppState {
    currentLevel: string;
    currentUnitId: string | null;
    todayMinutes: number;
    streakDays: number;
    onboardingCompleted: boolean;
    gradeLevel: number | null;
    theme: Theme;
    setLevel: (level: string) => void;
    setUnit: (unitId: string) => void;
    addPlayTime: (minutes: number) => void;
    resetDaily: () => void;
    setOnboardingCompleted: (completed: boolean) => void;
    setStreakDays: (days: number) => void;
    setGradeLevel: (grade: number | null) => void;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

function getInitialTheme(): Theme {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('phonics-theme');
        if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
}

function applyThemeToDOM(theme: Theme) {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }
}

export const useAppStore = create<AppState>((set) => ({
    currentLevel: 'CoreA',
    currentUnitId: null,
    todayMinutes: 0,
    streakDays: 0,
    onboardingCompleted: false,
    gradeLevel: null,
    theme: getInitialTheme(),
    setLevel: (level) => set({ currentLevel: level }),
    setUnit: (unitId) => set({ currentUnitId: unitId }),
    addPlayTime: (minutes) => set((state) => ({ todayMinutes: state.todayMinutes + minutes })),
    resetDaily: () => set({ todayMinutes: 0 }),
    setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
    setStreakDays: (days) => set({ streakDays: days }),
    setGradeLevel: (grade) => set({ gradeLevel: grade }),
    setTheme: (theme) => {
        localStorage.setItem('phonics-theme', theme);
        applyThemeToDOM(theme);
        set({ theme });
    },
    toggleTheme: () => set((state) => {
        const next = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('phonics-theme', next);
        applyThemeToDOM(next);
        return { theme: next };
    }),
}));
