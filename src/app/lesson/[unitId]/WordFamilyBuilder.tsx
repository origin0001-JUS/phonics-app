"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ArrowRight, Layers, Star } from "lucide-react";
import { playWordAudio, playSFX } from "@/lib/audio";
import type { WordData } from "@/data/curriculum";

interface WordFamilyBuilderProps {
    words: WordData[];
    onNext: () => void;
}

interface BuiltWord {
    word: string;
    onset: string;
    rime: string;
    isBonus?: boolean;    // true if this word wasn't in the lesson but is a real word
}

// A broad set of common English CVC/CVCC words to validate "bonus" correct answers.
// Any distractor onset that combines with the current rime to form one of these words
// will be treated as a VALID (bonus) answer instead of a wrong one.
const COMMON_ENGLISH_WORDS = new Set([
    // -ag
    'bag','gag','hag','lag','nag','rag','sag','tag','wag','jag',
    // -am
    'ham','jam','ram','yam','clam','slam','tram',
    // -an
    'ban','can','fan','man','pan','ran','tan','van',
    // -ap
    'cap','gap','lap','map','nap','rap','sap','tap','zap','clap','slap','snap','trap',
    // -at
    'bat','cat','fat','hat','mat','pat','rat','sat','vat','flat','that',
    // -ad
    'bad','dad','fad','had','lad','mad','pad','sad',
    // -ed
    'bed','fed','led','red','wed',
    // -en
    'den','hen','men','pen','ten','yen',
    // -et
    'bet','get','jet','let','met','net','pet','set','vet','wet',
    // -eg
    'beg','keg','leg','peg',
    // -ig
    'big','dig','fig','gig','jig','pig','rig','wig',
    // -in
    'bin','fin','pin','sin','tin','win',
    // -ip
    'dip','hip','lip','nip','rip','sip','tip','zip','chip','drip','grip','skip','slip','trip','whip',
    // -it
    'bit','fit','hit','kit','lit','pit','sit','wit','grit','knit','spit',
    // -id
    'bid','did','hid','kid','lid','rid',
    // -ob
    'mob','rob','sob','job','lob',
    // -og
    'bog','cog','fog','hog','jog','log','smog','frog',
    // -op
    'cop','hop','mop','pop','top','crop','drop','flop','shop','stop','chop',
    // -ot
    'cot','dot','got','hot','lot','not','pot','rot','blot','knot','plot','shot','slot','trot',
    // -ub
    'cub','rub','sub','tub','club','grub','shrub','stub',
    // -ug
    'bug','hug','jug','mug','pug','rug','tug','drug','plug','shrug','slug','snug',
    // -um
    'gum','hum','mum','sum','drum','plum','scum','slum',
    // -un
    'bun','fun','gun','nun','run','sun','pun','spun','stun',
    // -ut
    'but','cut','hut','nut','rut','gut','jut',
    // -ack
    'back','hack','jack','lack','mack','pack','rack','sack','tack','black','crack','knack','slack','smack','snack','stack','track',
    // -ake
    'bake','cake','fake','lake','make','rake','sake','take','wake','blake','brake','flake','shake','snake','stake',
    // -ale
    'bale','dale','gale','male','pale','sale','tale','vale','whale','scale','stale',
    // -ame
    'came','dame','fame','game','name','same','tame','blame','flame','frame','shame',
    // -ane
    'cane','lane','mane','pane','sane','vane','wane','crane','plane','plane',
    // -ape
    'cape','gape','tape','drape','grape','shape',
    // -are
    'bare','care','dare','fare','hare','mare','rare','ware','flare','share','spare','stare',
    // -ate
    'date','fate','gate','hate','late','mate','rate','crate','grate','plate','skate','slate','state',
    // -ave
    'cave','gave','pave','rave','save','wave','brave','crave','grave','shave',
    // -aze
    'daze','faze','gaze','haze','maze','raze','blaze','craze','glaze',
    // -ice
    'dice','lice','mice','nice','rice','vice','price','slice','spice','twice',
    // -ide
    'hide','ride','side','tide','wide','bride','glide','guide','pride','slide','snide',
    // -ike
    'bike','hike','like','mike','spike','strike',
    // -ile
    'file','mile','pile','tile','vile','while',
    // -ime
    'dime','lime','mime','rhyme','time','crime','grime','slime',
    // -ine
    'dine','fine','line','mine','nine','pine','vine','wine','brine','shine','spine','swine','twine','whine',
    // -ite
    'bite','cite','kite','mite','site','quite','spite','write',
    // -obe
    'lobe','robe','globe','probe',
    // -ode
    'code','mode','node','rode','strode',
    // -oke
    'coke','joke','poke','woke','yoke','broke','choke','smoke','spoke','stroke',
    // -ole
    'hole','mole','pole','role','sole','stole','whole',
    // -ome
    'dome','home','nome','rome','gnome',
    // -one
    'bone','cone','hone','lone','tone','zone','phone','prone','stone',
    // -ope
    'cope','dope','hope','mope','rope','slope',
    // -ore
    'bore','core','fore','gore','more','pore','sore','tore','wore','chore','score','shore','snore','store',
    // -ose
    'dose','nose','pose','rose','those','chose','close','prose',
    // -ube
    'cube','lube','tube',
    // -ude
    'dude','rude','crude','prude',
    // -uke
    'duke','fluke','nuke',
    // -ule
    'mule','rule','yule',
    // -une
    'dune','june','tune','prune',
    // -ute
    'cute','lute','mute','flute',
]);

export default function WordFamilyBuilder({ words, onNext }: WordFamilyBuilderProps) {
    // Group words by word family (rime)
    const families = useMemo(() => {
        const map = new Map<string, WordData[]>();
        for (const w of words) {
            if (w.wordFamily && w.onset && w.rime) {
                const existing = map.get(w.wordFamily) || [];
                existing.push(w);
                map.set(w.wordFamily, existing);
            }
        }
        // Filter families with at least 2 members
        return Array.from(map.entries())
            .filter(([, members]) => members.length >= 2)
            .slice(0, 3); // max 3 families per session
    }, [words]);

    const [familyIdx, setFamilyIdx] = useState(0);
    const [builtWords, setBuiltWords] = useState<BuiltWord[]>([]);
    const [lastTapped, setLastTapped] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [tapping, setTapping] = useState(false);

    // Clamp familyIdx to valid range to prevent "Family 4/3" display bug
    const safeFamilyIdx = Math.min(familyIdx, Math.max(0, families.length - 1));
    const currentFamily = families[safeFamilyIdx];
    const familyKey = currentFamily?.[0] || '';
    // rime from word data (without dash), fallback to stripping dash from familyKey
    const rime = currentFamily?.[1]?.[0]?.rime || familyKey.replace(/^-/, '');
    const familyWords = currentFamily?.[1] || [];

    // All possible onsets from the entire words list to use as distractors
    const allPossibleOnsets = useMemo(() => {
        const set = new Set<string>();
        for (const w of words) {
            if (w.onset) set.add(w.onset);
        }
        return Array.from(set);
    }, [words]);

    // Available onsets for this family (lesson-taught words)
    const correctOnsets = useMemo(() => {
        return familyWords.map(w => ({
            onset: w.onset!,
            word: w.word,
            meaning: w.meaning,
        }));
    }, [familyWords]);

    // Options to display (correct + distractors)
    const [options, setOptions] = useState<string[]>([]);
    
    // Generate mixed options when family changes
    useEffect(() => {
        if (!rime || correctOnsets.length === 0) return;
        
        const corrects = correctOnsets.map(o => o.onset);
        const distractors = allPossibleOnsets.filter(o => !corrects.includes(o));
        
        // Shuffle distractors and pick enough to make total options around 6-8
        // Or at least double the correct onsets if there are many
        const numDistractorsToPick = Math.max(3, 8 - corrects.length);
        const pickedDistractors = [...distractors].sort(() => Math.random() - 0.5).slice(0, numDistractorsToPick);
        
        // Ensure fallback if not enough distractors from current unit words
        const fallbackDistractors = ['b', 'c', 'h', 'm', 'p', 's', 't', 'n', 'r', 'l'].filter(o => !corrects.includes(o));
        while (pickedDistractors.length < numDistractorsToPick && fallbackDistractors.length > 0) {
            const fallback = fallbackDistractors.pop();
            if (fallback && !pickedDistractors.includes(fallback)) {
                pickedDistractors.push(fallback);
            }
        }
        
        const shuffledOptions = [...corrects, ...pickedDistractors].sort(() => Math.random() - 0.5);
        setOptions(shuffledOptions);
    }, [safeFamilyIdx, rime, correctOnsets, allPossibleOnsets]);

    // Check if an onset has already been built
    const isBuilt = useCallback((onset: string) => {
        return builtWords.some(bw => bw.onset === onset && bw.rime === rime);
    }, [builtWords, rime]);

    const [wrongTapped, setWrongTapped] = useState<string | null>(null);

    const handleOnsetTap = (onset: string) => {
        if (isBuilt(onset) || tapping) return;

        setLastTapped(onset);

        // Check if it's one of the lesson's target onsets
        const correctTarget = correctOnsets.find(c => c.onset === onset);

        // Check if it's a REAL English word (bonus answer) even if not in this lesson
        const attemptedWord = onset + rime;
        const isRealWord = COMMON_ENGLISH_WORDS.has(attemptedWord);

        if (!correctTarget && !isRealWord) {
            // Truly wrong tap — not a lesson word AND not a real English word
            setWrongTapped(onset);
            try { playSFX('wrong'); } catch { /* ignore audio errors */ }
            setTimeout(() => setWrongTapped(null), 600);
            return;
        }

        const word = correctTarget?.word ?? attemptedWord;
        const isBonus = !correctTarget && isRealWord;
        setTapping(true);

        // Play the full word audio first
        setTimeout(() => {
            playWordAudio(word);
        }, 200);

        // Wait enough time for word audio to play fully (~1.2s) before state transition
        setTimeout(() => {
            const newBuilt = [...builtWords, { word, onset, rime, isBonus }];
            setBuiltWords(newBuilt);
            playSFX('correct');
            setTapping(false);

            // Only check lesson completion against correctOnsets (not bonus words)
            const lessonBuiltCount = newBuilt.filter(bw => bw.rime === rime && !bw.isBonus).length;
            if (lessonBuiltCount === correctOnsets.length) {
                setTimeout(() => {
                    setShowCelebration(true);
                    playSFX('complete');
                }, 500);
            }
        }, 1400);
    };

    // allBuilt = all LESSON words built (bonus words don't count against you)
    const allBuilt = builtWords.filter(bw => bw.rime === rime && !bw.isBonus).length === correctOnsets.length;


    const handleNext = () => {
        setShowCelebration(false);
        if (safeFamilyIdx < families.length - 1) {
            setFamilyIdx(i => i + 1);
            setLastTapped(null);
        } else {
            onNext();
        }
    };

    // Fallback if no word families available
    if (families.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                    <Layers className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-400 font-bold text-center">Word Family game coming soon!</p>
                </div>
                <button
                    onClick={onNext}
                    className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                >
                    Continue <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full shadow-[0_8px_0_#e2e8f0] dark:shadow-[0_8px_0_#1e293b] border-4 border-white dark:border-slate-600 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-5 h-5 text-amber-500" />
                    <p className="text-slate-400 font-bold text-sm">Word Family Builder</p>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
                    Tap an onset to build a word!
                </p>

                {/* Fixed rime block */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-14 border-4 border-dashed border-blue-300 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-black text-blue-300">?</span>
                    </div>
                    <span className="text-xl font-black text-slate-300">+</span>
                    <div className="px-6 h-14 bg-amber-100 dark:bg-amber-900/30 border-4 border-amber-300 dark:border-amber-600 rounded-xl flex items-center justify-center shadow-[0_4px_0_#fbbf24]">
                        <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{familyKey}</span>
                    </div>
                </div>

                {/* Onset buttons grid */}
                <div className="flex flex-wrap gap-3 justify-center mb-4">
                    {options.map((onset) => {
                        const built = isBuilt(onset);
                        const isWrong = wrongTapped === onset;
                        // Just a subtle tap animation if correct and tapped
                        const justTapped = lastTapped === onset && !built && !isWrong;
                        
                        return (
                            <motion.button
                                key={onset}
                                onClick={() => handleOnsetTap(onset)}
                                disabled={built || isWrong}
                                animate={
                                    isWrong ? { x: [-5, 5, -5, 5, 0], scale: 0.95 }
                                    : justTapped ? { scale: [1, 1.2, 1] } : {}
                                }
                                transition={{ duration: isWrong ? 0.3 : 0.2 }}
                                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black transition-all border-4 relative overflow-hidden ${
                                    built
                                        ? "bg-green-100 border-green-300 text-green-500 opacity-60"
                                        : isWrong
                                        ? "bg-red-50 border-red-300 text-red-500"
                                        : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300 shadow-[0_4px_0_#93c5fd] active:shadow-none active:translate-y-[4px] active:scale-95 cursor-pointer"
                                }`}
                            >
                                {onset}
                                {isWrong && (
                                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                                        <div className="w-10 h-10 text-red-400 opacity-50 text-4xl leading-none rotate-45 flex items-center justify-center font-normal pb-1">+</div>
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Built words card stack */}
                <div className="w-full mt-2">
                    <p className="text-xs font-bold text-slate-400 mb-2 text-center">
                        Built: {builtWords.filter(bw => bw.rime === rime && !bw.isBonus).length} / {correctOnsets.length}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <AnimatePresence>
                            {builtWords
                                .filter(bw => bw.rime === rime)
                                .map((bw, i) => (
                                    <motion.button
                                        key={bw.word}
                                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => playWordAudio(bw.word)}
                                        className={`px-4 py-2 rounded-xl flex items-center gap-2 active:scale-95 transition-transform border-2 ${
                                            bw.isBonus
                                                ? "bg-gradient-to-br from-purple-100 to-violet-50 border-purple-300"
                                                : "bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-300 dark:border-green-700"
                                        }`}
                                    >
                                        <Volume2 className={`w-3 h-3 ${bw.isBonus ? "text-purple-500" : "text-green-500"}`} />
                                        <span className={`font-black ${bw.isBonus ? "text-purple-700" : "text-green-700 dark:text-green-300"}`}>{bw.word}</span>
                                        {bw.isBonus && <span className="text-xs font-bold text-purple-500">🌟</span>}
                                    </motion.button>
                                ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>


            {/* Family progress */}
            <p className="text-white/70 font-bold text-sm">
                Family {safeFamilyIdx + 1} / {families.length}
            </p>

            {/* Celebration modal */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                        onClick={handleNext}
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: "spring", damping: 12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] p-8 mx-6 shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-4 max-w-sm"
                        >
                            <div className="flex gap-1">
                                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                            </div>
                            <p className="text-2xl font-black text-amber-600">Word Family Complete!</p>
                            <p className="text-slate-500 font-bold text-center">
                                You built all the <span className="text-amber-600">{rime}</span> words!
                            </p>
                            <button
                                onClick={handleNext}
                                className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {safeFamilyIdx < families.length - 1 ? "Next Family" : "Continue"} <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Next button — shown when all onsets are built (fallback if modal dismissed) */}
            {allBuilt && !showCelebration && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <button
                        onClick={handleNext}
                        className="w-full bg-[#fcd34d] text-amber-900 font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-2"
                    >
                        {safeFamilyIdx < families.length - 1 ? "Next Family" : "Continue"} <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            )}
        </div>
    );
}
