/**
 * L3/L4 데이터 무결성 검증 스크립트
 * 실행: npx tsx src/scripts/merge-l3l4.ts
 */

import { curriculum } from '../data/curriculum';

function validate() {
    const allIds = new Set<string>();
    const duplicates: string[] = [];
    const missingFields: string[] = [];
    let totalWords = 0;

    for (const unit of curriculum) {
        for (const word of unit.words) {
            totalWords++;

            if (allIds.has(word.id)) {
                duplicates.push(`${word.id} (${unit.id})`);
            }
            allIds.add(word.id);

            if (!word.phonemes.length) missingFields.push(`${word.id}: missing phonemes`);
            if (!word.meaning) missingFields.push(`${word.id}: missing meaning`);
            if (unit.level === 'L3' || unit.level === 'L4') {
                if (!word.onset) missingFields.push(`${word.id}: missing onset`);
                if (!word.rime) missingFields.push(`${word.id}: missing rime`);
                if (!word.wordFamily) missingFields.push(`${word.id}: missing wordFamily`);
            }
        }
    }

    // 유닛 번호 연속성
    const unitNumbers = curriculum.map(u => u.unitNumber).sort((a, b) => a - b);
    const gaps: string[] = [];
    for (let i = 1; i < unitNumbers.length; i++) {
        if (unitNumbers[i] !== unitNumbers[i - 1] + 1) {
            gaps.push(`${unitNumbers[i - 1]} → ${unitNumbers[i]}`);
        }
    }

    const l3Count = curriculum.filter(u => u.level === 'L3').length;
    const l4Count = curriculum.filter(u => u.level === 'L4').length;
    const l3Words = curriculum.filter(u => u.level === 'L3').reduce((s, u) => s + u.words.length, 0);
    const l4Words = curriculum.filter(u => u.level === 'L4').reduce((s, u) => s + u.words.length, 0);

    console.log('=== L3/L4 Merge Validation ===');
    console.log(`Total units: ${curriculum.length}`);
    console.log(`Total words: ${totalWords}`);
    console.log(`L3 units: ${l3Count} (${l3Words} words)`);
    console.log(`L4 units: ${l4Count} (${l4Words} words)`);
    console.log(`Duplicates: ${duplicates.length ? duplicates.join(', ') : 'None ✅'}`);
    console.log(`Missing fields: ${missingFields.length ? missingFields.join('\n  ') : 'None ✅'}`);
    console.log(`Unit number gaps: ${gaps.length ? gaps.join(', ') : 'None ✅'}`);

    if (duplicates.length || missingFields.length) {
        process.exit(1);
    }
    console.log('\n✅ All validations passed!');
}

validate();
