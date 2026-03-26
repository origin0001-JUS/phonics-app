import { chromium } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:4000';
const OUT = path.join(__dirname, '..', 'docs', 'teacher-guide', 'screenshots');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR',
  });
  const page = await ctx.newPage();

  // Mock audio
  await page.addInitScript(() => {
    window.speechSynthesis = { speak(){}, cancel(){}, pause(){}, resume(){}, getVoices(){ return []; }, speaking: false, paused: false, pending: false, onvoiceschanged: null, addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; } } as any;
    const Ctx = class { state='running'; sampleRate=44100; currentTime=0; destination={} as any; createOscillator(){ return { connect(){}, start(){}, stop(){}, disconnect(){}, frequency:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}}, type:'sine' }; } createGain(){ return { connect(){}, disconnect(){}, gain:{value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}} }; } createAnalyser(){ return { connect(){}, disconnect(){}, fftSize:256, frequencyBinCount:128, getByteFrequencyData(a:any){a.fill(0);}, getByteTimeDomainData(a:any){a.fill(128);} }; } createMediaStreamSource(){ return { connect(){}, disconnect(){} }; } close(){ return Promise.resolve(); } resume(){ return Promise.resolve(); } suspend(){ return Promise.resolve(); } };
    (window as any).AudioContext = Ctx; (window as any).webkitAudioContext = Ctx;
    HTMLMediaElement.prototype.play = function(){ Object.defineProperty(this,'paused',{value:false,writable:true}); setTimeout(()=>this.dispatchEvent(new Event('ended')),50); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function(){ Object.defineProperty(this,'paused',{value:true,writable:true}); };
    HTMLMediaElement.prototype.load = function(){};
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  // Go to app — clear DB first
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Delete DB
  await page.evaluate(() => {
    return new Promise<void>(resolve => {
      const req = indexedDB.deleteDatabase('PhonicsAppDB');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  // Set activation
  await page.evaluate(() => localStorage.setItem('phonics_device_activated', 'GUIDE'));

  // Reload to trigger onboarding
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click start
  const startBtn = page.locator('button').filter({ hasText: /시작/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(1000);

    // Click grade 1
    const grades = page.locator('button').filter({ hasText: /1학년|1/ });
    const count = await grades.count();
    console.log(`Grade buttons found: ${count}`);
    for (let i = 0; i < count; i++) {
      const text = await grades.nth(i).textContent();
      console.log(`  button[${i}]: "${text}"`);
    }

    // Try clicking "1학년" or the first grade-related button
    const g1 = page.locator('button').filter({ hasText: '1학년' }).first();
    if (await g1.isVisible()) {
      await g1.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, '03_onboarding_recommend.png'), fullPage: false });
      console.log('✅ 03_onboarding_recommend.png');
    } else {
      // Try any grade button
      const anyGrade = page.locator('button').filter({ hasText: /학년/ }).first();
      if (await anyGrade.isVisible()) {
        await anyGrade.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(OUT, '03_onboarding_recommend.png'), fullPage: false });
        console.log('✅ 03_onboarding_recommend.png (via fallback)');
      } else {
        // Take screenshot of current state
        await page.screenshot({ path: path.join(OUT, '03_onboarding_recommend.png'), fullPage: false });
        console.log('⚠️ No grade button found, captured current state');
      }
    }
  }

  await browser.close();
})();
