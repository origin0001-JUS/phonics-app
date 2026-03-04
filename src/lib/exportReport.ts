/**
 * 학습 리포트 데이터 수집 & 내보내기 유틸리티
 * ─────────────────────────────────────────
 * - IndexedDB에서 학습 기록 집계
 * - CSV / PDF(인쇄) 형태로 내보내기
 */

import { db, type ActivityLog } from './db';
import { curriculum } from '@/data/curriculum';

// ─── 리포트 데이터 타입 ───

export interface UnitReport {
    unitId: string;
    unitTitle: string;
    totalWords: number;
    newWords: number;      // stage 0
    learningWords: number; // stage 1
    youngWords: number;    // stage 2
    matureWords: number;   // stage 3
    completionRate: number; // 0~100%
}

export interface OverallReport {
    studentName: string;
    reportDate: string;
    currentLevel: string;
    totalUnits: number;
    completedUnits: number;
    totalWords: number;
    masteredWords: number;  // stage >= 2
    learningWords: number;  // stage 1
    newWords: number;       // stage 0
    totalStudyMinutes: number;
    totalSessions: number;
    averageMinutesPerDay: number;
    streakDays: number;
    unitReports: UnitReport[];
    recentLogs: ActivityLog[];
}

// ─── 데이터 수집 ───

export async function gatherReportData(studentName: string = '학생'): Promise<OverallReport> {
    // 1) Progress 가져오기
    const progress = await db.progress.get('user_progress');

    // 2) 모든 카드 가져오기
    const allCards = await db.cards.toArray();

    // 3) 최근 30일 활동 로그
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = await db.logs
        .where('date')
        .aboveOrEqual(thirtyDaysAgo.toISOString().split('T')[0])
        .toArray();

    // 4) 전체 로그 (통계용)
    const allLogs = await db.logs.toArray();

    // 5) 유닛별 리포트 생성
    const unitReports: UnitReport[] = curriculum
        .filter(u => u.words.length > 0) // 리뷰 유닛(빈 단어) 제외
        .map(unit => {
            const unitCards = allCards.filter(c => c.unitId === unit.id);
            const totalWords = unit.words.length;

            const newWords = totalWords - unitCards.length; // 아직 학습 안 함
            const learningWords = unitCards.filter(c => c.stage === 1).length;
            const youngWords = unitCards.filter(c => c.stage === 2).length;
            const matureWords = unitCards.filter(c => c.stage === 3).length;
            const stageZeroCards = unitCards.filter(c => c.stage === 0).length;

            const masteredInUnit = youngWords + matureWords;
            const completionRate = totalWords > 0
                ? Math.round((masteredInUnit / totalWords) * 100) : 0;

            return {
                unitId: unit.id,
                unitTitle: unit.title,
                totalWords,
                newWords: newWords + stageZeroCards,
                learningWords,
                youngWords,
                matureWords,
                completionRate,
            };
        });

    // 6) 전체 통계 집계
    const totalStudyMinutes = allLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const uniqueDays = new Set(allLogs.map(l => l.date)).size;
    const averageMinutesPerDay = uniqueDays > 0
        ? Math.round(totalStudyMinutes / uniqueDays) : 0;

    const totalMastered = allCards.filter(c => c.stage >= 2).length;
    const totalLearning = allCards.filter(c => c.stage === 1).length;
    const totalNew = curriculum
        .filter(u => u.words.length > 0)
        .reduce((sum, u) => sum + u.words.length, 0) - allCards.length;

    // 연속 학습일수 계산
    let streakDays = 0;
    const logDates = [...new Set(allLogs.map(l => l.date))].sort().reverse();

    for (let i = 0; i < logDates.length; i++) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        const expectedStr = expected.toISOString().split('T')[0];
        if (logDates[i] === expectedStr) {
            streakDays++;
        } else {
            break;
        }
    }

    return {
        studentName,
        reportDate: new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
        }),
        currentLevel: progress?.currentLevel || 'CoreA',
        totalUnits: curriculum.length,
        completedUnits: progress?.completedUnits?.length || 0,
        totalWords: curriculum
            .filter(u => u.words.length > 0)
            .reduce((sum, u) => sum + u.words.length, 0),
        masteredWords: totalMastered,
        learningWords: totalLearning,
        newWords: Math.max(0, totalNew),
        totalStudyMinutes,
        totalSessions: allLogs.length,
        averageMinutesPerDay,
        streakDays,
        unitReports,
        recentLogs,
    };
}

// ─── CSV 내보내기 ───

export function generateCSV(report: OverallReport): string {
    const lines: string[] = [];

    // BOM for Korean Excel
    const BOM = '\uFEFF';

    // 헤더 섹션
    lines.push('학습 리포트 - Phonics 300');
    lines.push(`학생 이름,${report.studentName}`);
    lines.push(`생성일,${report.reportDate}`);
    lines.push(`현재 레벨,${report.currentLevel}`);
    lines.push('');

    // 전체 통계
    lines.push('=== 전체 학습 통계 ===');
    lines.push(`총 학습 시간(분),${report.totalStudyMinutes}`);
    lines.push(`총 학습 횟수,${report.totalSessions}`);
    lines.push(`일평균 학습 시간(분),${report.averageMinutesPerDay}`);
    lines.push(`연속 학습일,${report.streakDays}`);
    lines.push(`완료 유닛,${report.completedUnits} / ${report.totalUnits}`);
    lines.push(`완전 습득 단어,${report.masteredWords} / ${report.totalWords}`);
    lines.push(`학습 중 단어,${report.learningWords}`);
    lines.push(`미학습 단어,${report.newWords}`);
    lines.push('');

    // 유닛별 상세
    lines.push('=== 유닛별 학습 현황 ===');
    lines.push('유닛,총 단어,미학습,학습 중,습득,완전 습득,달성률');
    for (const u of report.unitReports) {
        lines.push([
            u.unitTitle,
            u.totalWords,
            u.newWords,
            u.learningWords,
            u.youngWords,
            u.matureWords,
            `${u.completionRate}%`,
        ].join(','));
    }
    lines.push('');

    // 최근 활동 로그
    lines.push('=== 최근 30일 활동 ===');
    lines.push('날짜,학습시간(분),활동내용');
    for (const log of report.recentLogs) {
        lines.push([
            log.date,
            log.durationMinutes,
            `"${log.completedActivities.join(', ')}"`,
        ].join(','));
    }

    return BOM + lines.join('\n');
}

export function downloadCSV(report: OverallReport): void {
    const csv = generateCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `phonics300_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ─── PDF 내보내기 (브라우저 인쇄 기능 활용) ───

export function printReport(): void {
    window.print();
}
