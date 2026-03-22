import { CORE_CURRICULUM } from '../src/data/curriculum';

interface FamilyData {
    rime: string;
    unitId: string;
    correctOnsets: Set<string>;
    correctWords: string[];
}

function main() {
    console.log("=== Word Family Builder Survey ===");

    // 1. Gather all unique onsets used anywhere in the curriculum
    const allOnsets = new Set<string>();
    
    // 2. Gather families
    const families = new Map<string, FamilyData>();

    for (const unit of CORE_CURRICULUM) {
        for (const word of unit.words) {
            if (word.onset) {
                allOnsets.add(word.onset);
            }
            if (word.wordFamily && word.onset && word.rime) {
                if (!families.has(word.wordFamily)) {
                    families.set(word.wordFamily, {
                        rime: word.rime,
                        unitId: unit.id,
                        correctOnsets: new Set(),
                        correctWords: []
                    });
                }
                const fam = families.get(word.wordFamily)!;
                fam.correctOnsets.add(word.onset);
                fam.correctWords.push(word.word);
            }
        }
    }

    const onsetsList = Array.from(allOnsets).sort();
    console.log(`Total unique onsets used as distractors (${onsetsList.length}): ${onsetsList.join(', ')}\n`);

    console.log("=== Families and Potential Distractor Real Words ===");
    for (const [familyName, data] of families.entries()) {
        const distractors = onsetsList.filter(o => !data.correctOnsets.has(o));
        const allPossibleCombinations = distractors.map(d => d + data.rime);
        
        console.log(`\nFamily: -${data.rime} (Unit: ${data.unitId})`);
        console.log(`  Correct words in unit: ${data.correctWords.join(', ')}`);
        
        // Let's heuristically point out likely real words from distractors
        const commonRealWords = new Set(['bog', 'fog', 'hog', 'cog', 'smog', 'frog', 'log', 'dog', 'jog', 'bad', 'dad', 'fad', 'had', 'lad', 'mad', 'pad', 'sad', 'bag', 'gag', 'hag', 'lag', 'nag', 'rag', 'sag', 'tag', 'wag', 'ban', 'can', 'fan', 'man', 'pan', 'ran', 'tan', 'van', 'cap', 'gap', 'lap', 'map', 'nap', 'rap', 'sap', 'tap', 'bat', 'cat', 'fat', 'hat', 'mat', 'pat', 'rat', 'sat', 'vat', 'bed', 'fed', 'led', 'red', 'wed', 'den', 'hen', 'men', 'pen', 'ten', 'bet', 'get', 'jet', 'let', 'met', 'net', 'pet', 'set', 'vet', 'wet', 'big', 'dig', 'fig', 'gig', 'jig', 'pig', 'rig', 'wig', 'bin', 'fin', 'pin', 'sin', 'tin', 'win', 'dip', 'hip', 'lip', 'nip', 'rip', 'sip', 'tip', 'zip', 'bit', 'fit', 'hit', 'kit', 'lit', 'pit', 'sit', 'mob', 'rob', 'sob', 'job', 'cop', 'hop', 'mop', 'pop', 'top', 'cot', 'dot', 'got', 'hot', 'lot', 'not', 'pot', 'rot', 'cub', 'rub', 'sub', 'tub', 'bug', 'hug', 'jug', 'mug', 'pug', 'rug', 'tug', 'gum', 'hum', 'mum', 'sum', 'bun', 'fun', 'gun', 'nun', 'run', 'sun', 'but', 'cut', 'hut', 'nut', 'rut']);
        
        const problemWords = allPossibleCombinations.filter(w => commonRealWords.has(w));
        const nonWords = allPossibleCombinations.filter(w => !commonRealWords.has(w)).slice(0, 10);
        
        if (problemWords.length > 0) {
            console.log(`  !! DANGER (Real words treated as wrong): ${problemWords.join(', ')}`);
        }
        console.log(`  Safe nonsense distractors (examples): ${nonWords.join(', ')}`);
    }
}

main();
