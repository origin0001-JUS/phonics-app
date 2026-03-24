import { type Page } from '@playwright/test';

/** Mock all Audio APIs to prevent errors in headless browser */
export async function mockAudioAPIs(page: Page) {
  await page.addInitScript(() => {
    // SpeechSynthesis mock
    window.speechSynthesis = {
      speak: () => {},
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      getVoices: () => [],
      speaking: false,
      paused: false,
      pending: false,
      onvoiceschanged: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as unknown as SpeechSynthesis;

    // AudioContext mock
    const MockAudioContext = class {
      state = 'running';
      sampleRate = 44100;
      currentTime = 0;
      destination = {} as AudioDestinationNode;
      createOscillator() {
        return {
          connect: () => {},
          start: () => {},
          stop: () => {},
          disconnect: () => {},
          frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
          type: 'sine',
        };
      }
      createGain() {
        return {
          connect: () => {},
          disconnect: () => {},
          gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        };
      }
      createAnalyser() {
        return {
          connect: () => {},
          disconnect: () => {},
          fftSize: 256,
          frequencyBinCount: 128,
          getByteFrequencyData: (arr: Uint8Array) => arr.fill(0),
          getByteTimeDomainData: (arr: Uint8Array) => arr.fill(128),
        };
      }
      createMediaStreamSource() {
        return { connect: () => {}, disconnect: () => {} };
      }
      close() { return Promise.resolve(); }
      resume() { return Promise.resolve(); }
      suspend() { return Promise.resolve(); }
    };
    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = MockAudioContext;

    // HTMLMediaElement play/pause mock
    HTMLMediaElement.prototype.play = function () {
      Object.defineProperty(this, 'paused', { value: false, writable: true });
      setTimeout(() => {
        this.dispatchEvent(new Event('ended'));
      }, 50);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      Object.defineProperty(this, 'paused', { value: true, writable: true });
    };
    HTMLMediaElement.prototype.load = function () {};

    // SpeechRecognition mock (for Say & Check step)
    const MockSpeechRecognition = class {
      onresult: any;
      onerror: any;
      onend: any;
      continuous = false;
      interimResults = false;
      lang = 'en-US';
      start() {
        setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: 'cat', confidence: 0.95 }]],
            resultIndex: 0,
          });
          this.onend?.();
        }, 200);
      }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    };
    (window as any).SpeechRecognition = MockSpeechRecognition;
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;

    // navigator.mediaDevices mock
    if (!navigator.mediaDevices) {
      (navigator as any).mediaDevices = {};
    }
    navigator.mediaDevices.getUserMedia = () =>
      Promise.resolve(new MediaStream());
  });
}

/** Skip Framer Motion animations */
export async function skipAnimations(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}

/** Set activation key in localStorage (matches phonics_device_activated) */
export async function setActivationKey(page: Page, key: string = 'TEST123') {
  await page.evaluate((key) => {
    localStorage.setItem('phonics_device_activated', key);
  }, key);
}

/** Wait for app to finish loading (spinner gone) */
export async function waitForAppReady(page: Page) {
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/** Standard test setup: mock audio + skip animations */
export async function setupTestPage(page: Page) {
  await mockAudioAPIs(page);
  await skipAnimations(page);
}
