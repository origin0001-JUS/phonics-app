import { chromium } from '@playwright/test';

/**
 * 모든 viseme 유형을 개별 스크린샷으로 캡처
 * MouthVisualizer 영역만 크롭하여 저장
 */
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    const units = [
        { id: 'unit_01', label: 'short-a_open-front', desc: '/æ/ open_front' },
        { id: 'unit_02', label: 'short-e_mid-front', desc: '/ɛ/ mid_front' },
        { id: 'unit_03', label: 'short-i_close-front', desc: '/ɪ/ close_front' },
        { id: 'unit_04', label: 'short-o_open-back', desc: '/ɒ/ open_back' },
        { id: 'unit_05', label: 'short-u_mid-central', desc: '/ʌ/ mid_central' },
        { id: 'unit_07', label: 'long-a_mid-front', desc: '/eɪ/ mid_front' },
        { id: 'unit_08', label: 'long-i_open-front', desc: '/aɪ/ open_front' },
        { id: 'unit_09', label: 'long-o_close-back', desc: '/oʊ/ close_back' },
        { id: 'unit_10', label: 'long-u_close-front', desc: '/juː/ close_front' },
        { id: 'unit_11', label: 'ee-ea_close-front', desc: '/iː/ close_front' },
        { id: 'unit_13', label: 'bl-cl-fl_blends', desc: 'bl/cl/fl blends' },
        { id: 'unit_17', label: 'sh-ch_postalveolar', desc: '/ʃ tʃ/ postalveolar' },
        { id: 'unit_19', label: 'th-wh_dental', desc: '/θ ð/ dental' },
        { id: 'unit_20', label: 'ar-or_open-back', desc: '/ɑːr ɔːr/ open_back' },
        { id: 'unit_21', label: 'er-ir-ur_mid-central', desc: '/ɜːr/ mid_central' },
        { id: 'unit_22', label: 'diphthongs_mixed', desc: '/ɔɪ aʊ/ diphthongs' },
    ];

    // Ensure directory
    for (const unit of units) {
        await page.goto(`http://localhost:4000/lesson/${unit.id}`);
        await page.waitForTimeout(2000);

        // Full page screenshot
        await page.screenshot({
            path: `test-screenshots/viseme-${unit.label}.png`,
        });

        // Try to capture just the mouth area
        const mouthEl = page.locator('svg[aria-label="발음 입모양"]').first();
        if (await mouthEl.isVisible()) {
            await mouthEl.screenshot({
                path: `test-screenshots/mouth-${unit.label}.png`,
            });
        }

        console.log(`✓ ${unit.id}: ${unit.desc}`);
    }

    await browser.close();
    console.log('\nDone! All visemes captured.');
})();
