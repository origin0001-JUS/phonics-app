# Claude Code Prompt for Round 4 QA (Beta Feedback)

Hello Claude, please act as a senior React/Next.js developer to fix the following 5 specific issues reported during our beta test of the `phonics-app`.

Before you edit any file, please read them to understand the context. After fixing each issue, please verify via the terminal or by checking the code strictly.

**1. Part O (WordFamily Range Error)**
- **File:** `src/app/lesson/[unitId]/WordFamilyBuilder.tsx`
- **Issue:** The family progress text exceeds the bounds (e.g., showing "Family 4 / 3" instead of stopping at 3/3) and the UI freezes or fails to auto-advance properly after the last family word is built.
- **Goal:** Fix the index-bound logic inside `onComplete` or state updates so the progress display never exceeds the total count, and the screen gracefully finishes and calls the `onComplete` prop instead of incrementing endlessly.

**2. Part P (WordFamily Audio Timing & Effect Missing)**
- **File:** `src/app/lesson/[unitId]/WordFamilyBuilder.tsx`
- **Issue:** The error sound effect (`playSFX('wrong')`) sometimes doesn't play when tapping a distractor block. Moreover, when a word is successfully built, the full word pronunciation audio (`playWordAudio`) often gets cut off or skipped if the state transitions too fast.
- **Goal:** Ensure the wrong SFX plays reliably when tapping incorrect letters. Most importantly, ensure the word audio plays fully before moving to the next family word (using `await` or `setTimeout` delays if necessary).

**3. Part Q (Say&Check Autoplay Issue)**
- **File:** `src/app/lesson/[unitId]/SayCheckStep.tsx`
- **Issue:** When the user enters the Say & Check step, the word audio should play automatically. Currently, it does not auto-play and the user is forced to tap the speaker button to hear it.
- **Goal:** Add an `useEffect` hook that automatically calls the `playWordAudio` function shortly after the component mounts or the target word changes. Provide a small delay (e.g., 300ms) to ensure browser autoplay policies allow it.

**4. Part S (Pronunciation Assessment Similarity UI)**
- **File:** `src/app/lesson/[unitId]/PronunciationAssessmentStep.tsx` (or `LessonClient.tsx`)
- **Issue:** The Speech-to-Text evaluation used to visually display a 'Similarity Score' (percentage or progress bar) to the user showing how closely their pronunciation matched the target word. Now it only silently passes or fails.
- **Goal:** Restore or implement a UI element (like a text `Accuracy: 85%` or a progress bar) that visually presents the `similarity` variable value from the assessment result to the user.

**5. Part T (Review Queue Not Working)**
- **File:** `src/app/review/ReviewClient.tsx` or `src/lib/srs.ts`
- **Issue:** The Spaced Repetition (SRS) Review system on the Home screen ("Review" button) isn't functioning. The queue seems to be empty or getting stuck despite wrong answers being saved in Dexie DB.
- **Goal:** Inspect how `db.cards.toArray()` or queries are fetching due cards. Fix the logic so that any cards with `dueDate` <= `Date.now()` (or whichever is defined) successfully load and allow the user to review them.

Please implement these fixes directly in the files. After completing all 5, do a brief summary of what you fixed.
