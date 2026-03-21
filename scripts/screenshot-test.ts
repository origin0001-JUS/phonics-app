import { chromium } from '@playwright/test';
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

    const units = [
        ['unit_01', 'short-a'],
        ['unit_03', 'short-i'],
        ['unit_09', 'long-o'],
        ['unit_17', 'sh-ch'],
        ['unit_19', 'th-wh'],
    ];

    for (const [id, label] of units) {
        await page.goto(`http://localhost:4000/lesson/${id}`);
        await page.waitForTimeout(2500);
        await page.screenshot({ path: `test-screenshots/final-${label}.png` });
        console.log(`✓ ${label}`);
    }

    await browser.close();
    console.log('Done!');
})();
