import { type Page } from '@playwright/test';

const DB_NAME = 'PhonicsAppDB';

/** Wait for Dexie to initialize the DB with all stores */
async function waitForDB(page: Page, timeout = 10_000): Promise<void> {
  await page.waitForFunction(
    ({ dbName, timeout }) => {
      return new Promise<boolean>((resolve) => {
        const start = Date.now();
        const check = () => {
          const req = indexedDB.open(dbName);
          req.onsuccess = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const hasProgress = db.objectStoreNames.contains('progress');
            const hasCards = db.objectStoreNames.contains('cards');
            db.close();
            if (hasProgress && hasCards) {
              resolve(true);
            } else if (Date.now() - start > timeout) {
              resolve(false);
            } else {
              setTimeout(check, 200);
            }
          };
          req.onerror = () => {
            if (Date.now() - start > timeout) resolve(false);
            else setTimeout(check, 200);
          };
        };
        check();
      });
    },
    { dbName: DB_NAME, timeout },
    { timeout: timeout + 5_000 }
  );
}

/** Write data into an existing DB using version-less open */
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
          } catch (err) {
            db.close();
            reject(err);
          }
        };
        req.onerror = () => reject(req.error);
      });
    },
    { dbName: DB_NAME, storeName, data }
  );
}

/** Write multiple records into an existing DB */
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
            for (const record of records) {
              store.put(record);
            }
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
          } catch (err) {
            db.close();
            reject(err);
          }
        };
        req.onerror = () => reject(req.error);
      });
    },
    { dbName: DB_NAME, storeName, records }
  );
}

/**
 * Seed onboarding complete + unit_01 unlocked.
 * Call AFTER page.goto() — waits for Dexie to initialize.
 */
export async function seedOnboardingComplete(page: Page, grade: number = 1) {
  await putRecord(page, 'progress', {
    id: 'user_progress',
    currentLevel: 'CoreA',
    unlockedUnits: ['unit_01'],
    completedUnits: [],
    lastPlayedDate: new Date().toISOString(),
    onboardingCompleted: true,
    gradeLevel: grade,
  });
}

/** Unit 01 completed + unit_02 unlocked */
export async function seedUnit01Completed(page: Page) {
  await putRecord(page, 'progress', {
    id: 'user_progress',
    currentLevel: 'CoreA',
    unlockedUnits: ['unit_01', 'unit_02'],
    completedUnits: ['unit_01'],
    lastPlayedDate: new Date().toISOString(),
    onboardingCompleted: true,
    gradeLevel: 1,
  });
}

/** Seed SRS due cards for today */
export async function seedDueCards(page: Page, words: string[] = ['cat', 'bat', 'hat']) {
  const today = new Date().toISOString().slice(0, 10);
  const records = words.map(word => ({
    id: word,
    unitId: 'unit_01',
    nextReviewDate: today,
    stage: 1,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
  }));
  await putRecords(page, 'cards', records);
}

/** Seed an unlocked reward */
export async function seedReward(page: Page, rewardId: string) {
  await putRecord(page, 'rewards', {
    id: rewardId,
    unlockedAt: new Date().toISOString(),
  });
}

/** Delete the entire database */
export async function clearDB(page: Page) {
  await page.evaluate(
    (dbName) => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbName);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    },
    DB_NAME
  );
}
