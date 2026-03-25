/**
 * Playwright 스크린샷 캡처 스크립트 — 교사용 가이드용
 * 실행: npx playwright test scripts/capture-teacher-guide.ts --project=chromium
 */
import { chromium, type Page, type Browser } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:4000';
const OUT = path.join(__dirname, '..', 'docs', 'teacher-guide', 'screenshots');
const DB_NAME = 'PhonicsAppDB';

// ─── Helpers ───

async function waitForDB(page: Page): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const ready = await page.evaluate(() => {
      return new Promise(function(resolve) {
        var req = indexedDB.open('PhonicsAppDB');
        req.onsuccess = function(e) {
          var db = (e.target as IDBOpenDBRequest).result;
          var has = db.objectStoreNames.contains('progress');
          db.close();
          resolve(has);
        };
        req.onerror = function() { resolve(false); };
      });
    });
    if (ready) return;
    await page.waitForTimeout(300);
  }
}

async function putRecord(page: Page, storeName: string, data: unknown) {
  await waitForDB(page);
  await page.evaluate(
    ({ dbName, storeName, data }) => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          try {
            const tx = db.transaction(storeName, 'readwrite');
            tx.objectStore(storeName).put(data);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
          } catch (err) { db.close(); reject(err); }
        };
        req.onerror = () => reject(req.error);
      });
    },
    { dbName: DB_NAME, storeName, data }
  );
}

async function putRecords(page: Page, storeName: string, records: unknown[]) {
  await waitForDB(page);
  await page.evaluate(
    ({ dbName, storeName, records }) => {
      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          try {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            for (const r of records) store.put(r);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
          } catch (err) { db.close(); reject(err); }
        };
        req.onerror = () => reject(req.error);
      });
    },
    { dbName: DB_NAME, storeName, records }
  );
}

async function clearDB(page: Page) {
  await page.evaluate((dbName) => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  }, DB_NAME);
}

async function mockAudio(page: Page) {
  await page.addInitScript(() => {
    window.speechSynthesis = {
      speak: () => {}, cancel: () => {}, pause: () => {}, resume: () => {},
      getVoices: () => [], speaking: false, paused: false, pending: false,
      onvoiceschanged: null, addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => true,
    } as unknown as SpeechSynthesis;

    const Ctx = class {
      state = 'running'; sampleRate = 44100; currentTime = 0;
      destination = {} as AudioDestinationNode;
      createOscillator() { return { connect(){}, start(){}, stop(){}, disconnect(){}, frequency: { value: 0, setValueAtTime(){}, linearRampToValueAtTime(){} }, type: 'sine' }; }
      createGain() { return { connect(){}, disconnect(){}, gain: { value: 1, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} } }; }
      createAnalyser() { return { connect(){}, disconnect(){}, fftSize: 256, frequencyBinCount: 128, getByteFrequencyData(a: Uint8Array){ a.fill(0); }, getByteTimeDomainData(a: Uint8Array){ a.fill(128); } }; }
      createMediaStreamSource() { return { connect(){}, disconnect(){} }; }
      close() { return Promise.resolve(); }
      resume() { return Promise.resolve(); }
      suspend() { return Promise.resolve(); }
    };
    (window as any).AudioContext = Ctx;
    (window as any).webkitAudioContext = Ctx;

    HTMLMediaElement.prototype.play = function() {
      Object.defineProperty(this, 'paused', { value: false, writable: true });
      setTimeout(() => this.dispatchEvent(new Event('ended')), 50);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() {
      Object.defineProperty(this, 'paused', { value: true, writable: true });
    };
    HTMLMediaElement.prototype.load = function() {};

    const MockSTT = class {
      onresult: any; onerror: any; onend: any;
      continuous = false; interimResults = false; lang = 'en-US';
      start() { setTimeout(() => { this.onresult?.({ results: [[{ transcript: 'cat', confidence: 0.95 }]], resultIndex: 0 }); this.onend?.(); }, 200); }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    };
    (window as any).SpeechRecognition = MockSTT;
    (window as any).webkitSpeechRecognition = MockSTT;

    if (!navigator.mediaDevices) (navigator as any).mediaDevices = {};
    navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
  });
}

async function setActivation(page: Page) {
  await page.evaluate(() => localStorage.setItem('phonics_device_activated', 'GUIDE'));
}

async function seedProgress(page: Page) {
  await putRecord(page, 'progress', {
    id: 'user_progress',
    currentLevel: 'CoreA',
    unlockedUnits: ['unit_01', 'unit_02', 'unit_03', 'unit_04', 'unit_05'],
    completedUnits: ['unit_01', 'unit_02', 'unit_03'],
    lastPlayedDate: new Date().toISOString(),
    onboardingCompleted: true,
    gradeLevel: 1,
  });
}

async function seedCards(page: Page) {
  const today = new Date().toISOString().slice(0, 10);
  const words = ['cat', 'bat', 'hat', 'map', 'tap', 'bed', 'red', 'pen'];
  const records = words.map(w => ({
    id: w, unitId: 'unit_01', nextReviewDate: today,
    stage: 1, easeFactor: 2.5, interval: 1, repetitions: 1,
  }));
  await putRecords(page, 'cards', records);
}

async function seedRewards(page: Page) {
  const rewardIds = ['first_lesson', 'ten_words', 'unit_complete', 'three_day_streak', 'perfect_lesson'];
  for (const id of rewardIds) {
    await putRecord(page, 'rewards', { id, unlockedAt: new Date().toISOString() });
  }
}

async function seedLogs(page: Page) {
  const logs = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push({
      id: i + 1,
      date: d.toISOString().slice(0, 10),
      durationMinutes: 8 + Math.floor(Math.random() * 5),
      completedActivities: ['sound_focus', 'blend_tap', 'decode_words', 'say_check', 'micro_reader', 'exit_ticket'],
    });
  }
  await putRecords(page, 'logs', logs);
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  ✅ ${name}.png`);
}

// ─── Main ───

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'ko-KR',
  });

  let page = await context.newPage();
  await mockAudio(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // ═══ 1. Onboarding (fresh) ═══
  console.log('\n📸 온보딩 캡처...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await clearDB(page);
  await setActivation(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Onboarding welcome
  await shot(page, '01_onboarding_welcome');

  // Click start
  const startBtn = page.getByRole('button', { name: /시작/i }).or(page.locator('button:has-text("Start")'));
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(800);
    await shot(page, '02_onboarding_grade');

    // Select grade
    const gradeBtn = page.locator('button').filter({ hasText: /1학년|Grade 1/i }).first();
    if (await gradeBtn.isVisible()) {
      await gradeBtn.click();
      await page.waitForTimeout(800);
      await shot(page, '03_onboarding_recommend');
    }
  }

  // ═══ 2. Home (with data) ═══
  console.log('📸 홈 화면 캡처...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await seedProgress(page);
  await seedCards(page);
  await seedRewards(page);
  await seedLogs(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, '04_home');

  // ═══ 3. Units ═══
  console.log('📸 유닛 선택 캡처...');
  await page.goto(`${BASE}/units`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '05_units');

  // ═══ 4. Lesson Flow (6 steps) ═══
  console.log('📸 레슨 플로우 캡처...');
  await page.goto(`${BASE}/lesson/unit_01`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Step 1: Sound Focus
  await shot(page, '06_step_sound_focus');

  // Step 2: Blend & Tap — click Next
  const nextBtn = () => page.getByRole('button', { name: /다음|Next|계속/i }).or(page.locator('button:has-text("→")'));
  try {
    await nextBtn().first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    await shot(page, '07_step_blend_tap');
  } catch { console.log('  ⚠️ blend_tap 스킵'); }

  // Step 3: Decode Words
  try {
    await nextBtn().first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    await shot(page, '08_step_decode_words');
  } catch { console.log('  ⚠️ decode_words 스킵'); }

  // Step 4: Word Family (or Say & Check)
  try {
    await nextBtn().first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    await shot(page, '09_step_word_family');
  } catch { console.log('  ⚠️ word_family 스킵'); }

  // Step 5: Say & Check
  try {
    await nextBtn().first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    await shot(page, '10_step_say_check');
  } catch { console.log('  ⚠️ say_check 스킵'); }

  // Step 6: Micro Reader
  try {
    await nextBtn().first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    await shot(page, '11_step_micro_reader');
  } catch { console.log('  ⚠️ micro_reader 스킵'); }

  // Step 7: Exit Ticket
  try {
    await nextBtn().first().click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    await shot(page, '12_step_exit_ticket');
  } catch { console.log('  ⚠️ exit_ticket 스킵'); }

  // ═══ 5. Review ═══
  console.log('📸 복습 화면 캡처...');
  await page.goto(`${BASE}/review`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot(page, '13_review');

  // ═══ 6. Rewards ═══
  console.log('📸 보상 화면 캡처...');
  await page.goto(`${BASE}/rewards`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '14_rewards');

  // ═══ 7. Report ═══
  console.log('📸 리포트 캡처...');
  await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '15_report');

  // ═══ 8. Settings ═══
  console.log('📸 설정 캡처...');
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '16_settings');

  // ═══ 9. Teacher page (login) ═══
  console.log('📸 교사 페이지 캡처...');
  await page.goto(`${BASE}/teacher`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '17_teacher_login');

  // ═══ 10. Admin page (PIN screen) ═══
  console.log('📸 관리자 페이지 캡처...');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '18_admin_pin');

  // Enter PIN 1234
  try {
    for (const d of ['1', '2', '3', '4']) {
      await page.locator(`button:has-text("${d}")`).first().click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1500);
    await shot(page, '19_admin_dashboard');
  } catch { console.log('  ⚠️ admin dashboard 스킵'); }

  await browser.close();
  console.log(`\n✅ 완료! 스크린샷 저장 위치: ${OUT}`);
})();
