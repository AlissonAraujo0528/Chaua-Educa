const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || 'C:\\Users\\aliss\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
        args: ['--no-sandbox']
    });

    const artifactDir = 'C:\\Users\\aliss\\.gemini\\antigravity\\brain\\ed57b9d7-6392-4a2f-9a94-60455156b763';
    fs.mkdirSync(artifactDir, { recursive: true });

    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
        await page.goto('http://127.0.0.1:5501/?clima=winter', { waitUntil: 'networkidle' });

        await page.evaluate(async () => {
            const { Renderer } = await import('/js/render.mjs');
            const { Game } = await import('/js/engine.mjs');
            const canvas = document.createElement('canvas');
            canvas.style.cssText = 'width:100vw;height:100vh;position:fixed;inset:0;z-index:99999;';
            document.body.appendChild(canvas);
            window.renderer = new Renderer(canvas);
            await renderer.ready;
            window.game = new Game();
            game.state = 'playing';
            game.y = 310;
            game.x = 240;
            game.stamina = 0.9;
        });

        // 1. Chaua actively exhaling warm vapor puff in cold mountain winter
        await page.evaluate(() => {
            game.distance = 18800; // Deep mountain winter
            game.sceneTime = 12.552; // Peak breath puff
            game.elapsed = 12.552;
            game.entities = [
                { kind: 'wood', id: 21, x: 440, top: 120, bottom: 490, variant: 'branch' },
                { kind: 'fruit', id: 101, x: 600, y: 310, variety: 1 },
                { kind: 'wood', id: 22, x: 800, top: 110, bottom: 500, variant: 'plain', fragileSide: 'top', fragileKind: 'rot' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_chaua_respiracao_vapor.png') });
        console.log('Saved clima_chaua_respiracao_vapor.png');

        // 2. Snake actively exhaling frosty wisp on snowy trunk
        await page.evaluate(() => {
            game.distance = 19000;
            game.sceneTime = 4.082; // Peak snake breath puff
            game.elapsed = 4.082;
            game.entities = [
                { kind: 'wood', id: 21, x: 420, top: 120, bottom: 490, variant: 'branch', snake: { phase: 'watching', age: 1.4 } },
                { kind: 'fruit', id: 101, x: 580, y: 320, variety: 0 },
                { kind: 'wood', id: 22, x: 780, top: 120, bottom: 490, variant: 'plain', fragileSide: 'bottom', fragileKind: 'hollow' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_cobra_respiracao_vapor.png') });
        console.log('Saved clima_cobra_respiracao_vapor.png');

        // 3. Hawk Predator actively exhaling frosty vapor stream trailing past its head
        await page.evaluate(() => {
            game.distance = 19400;
            game.sceneTime = 16.56; // Peak hawk vapor trail
            game.elapsed = 16.56;
            game.entities = [
                { kind: 'hawk', id: 9, x: 640, y: 270, warning: 0, startX: 900, startY: 270, phase: 'crossing', harmless: false },
                { kind: 'wood', id: 31, x: 380, top: 130, bottom: 510, variant: 'plain', decorSide: 'bottom', decorKind: 'moss' },
                { kind: 'wood', id: 32, x: 880, top: 110, bottom: 480, variant: 'plain' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_predador_respiracao_vapor.png') });
        console.log('Saved clima_predador_respiracao_vapor.png');

        await page.close();
    } finally {
        await browser.close();
    }
})();
