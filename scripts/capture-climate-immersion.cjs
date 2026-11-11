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

        // 1. Winter Scene: Chaua with breath vapor, snow-covered trees, fruits with snow caps
        await page.evaluate(() => {
            game.distance = 18800; // Deep mountain winter
            game.sceneTime = 14.2;
            game.elapsed = 14.2;
            game.entities = [
                { kind: 'wood', id: 21, x: 420, top: 120, bottom: 490, variant: 'branch' },
                { kind: 'fruit', id: 101, x: 560, y: 310, variety: 1 },
                { kind: 'wood', id: 22, x: 760, top: 110, bottom: 500, variant: 'plain', fragileSide: 'top', fragileKind: 'rot' },
                { kind: 'wood', id: 23, x: 1020, top: 130, bottom: 480, variant: 'plain', decorSide: 'top', decorKind: 'vine' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_inverno_arvores_neve_chaua.png') });
        console.log('Saved clima_inverno_arvores_neve_chaua.png');

        // 2. Winter Snake: snake on snowy branch with frosty breath
        await page.evaluate(() => {
            game.distance = 19000;
            game.sceneTime = 16.8;
            game.elapsed = 16.8;
            game.entities = [
                { kind: 'wood', id: 21, x: 420, top: 120, bottom: 490, variant: 'branch', snake: { phase: 'watching', age: 1.4 } },
                { kind: 'fruit', id: 101, x: 580, y: 320, variety: 0 },
                { kind: 'wood', id: 22, x: 780, top: 120, bottom: 490, variant: 'plain', fragileSide: 'bottom', fragileKind: 'hollow' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_inverno_cobra_respiracao.png') });
        console.log('Saved clima_inverno_cobra_respiracao.png');

        // 3. Winter Hawk Predator: hunting in snowfall with icy breath vapor
        await page.evaluate(() => {
            game.distance = 19400;
            game.sceneTime = 25.1;
            game.elapsed = 25.1;
            game.entities = [
                { kind: 'hawk', id: 9, x: 640, y: 270, warning: 0, startX: 900, startY: 270, phase: 'crossing', harmless: false },
                { kind: 'wood', id: 31, x: 380, top: 130, bottom: 510, variant: 'plain', decorSide: 'bottom', decorKind: 'moss' },
                { kind: 'wood', id: 32, x: 880, top: 110, bottom: 480, variant: 'plain' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_inverno_predador_respiracao.png') });
        console.log('Saved clima_inverno_predador_respiracao.png');

        // 4. Rain Scene: Wet Trees, glossy specular sheen, water drips trickling down, glistening fruits
        await page.goto('http://127.0.0.1:5501/?clima=rain', { waitUntil: 'networkidle' });
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
            game.distance = 10500; // Rain / Ancient forest
            game.sceneTime = 18.3;
            game.elapsed = 18.3;
            game.entities = [
                { kind: 'wood', id: 41, x: 420, top: 120, bottom: 490, variant: 'branch', snake: { phase: 'watching', age: 1.5 } },
                { kind: 'fruit', id: 102, x: 570, y: 310, variety: 2 },
                { kind: 'wood', id: 42, x: 760, top: 120, bottom: 500, variant: 'plain', fragileSide: 'bottom', fragileKind: 'hollow' },
                { kind: 'wood', id: 43, x: 1020, top: 110, bottom: 480, variant: 'plain', decorSide: 'top', decorKind: 'vine' }
            ];
            renderer.game(game, false);
        });
        await page.screenshot({ path: path.join(artifactDir, 'clima_chuva_arvores_molhadas_gotas.png') });
        console.log('Saved clima_chuva_arvores_molhadas_gotas.png');

        // 5. Real in-flight gameplay with UI
        await page.goto('http://127.0.0.1:5501/?clima=winter', { waitUntil: 'networkidle' });
        await page.waitForSelector('#btnStart:not([disabled])', { timeout: 8000 });
        await page.click('#btnStart');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(artifactDir, 'gameplay_voo_inverno_real.png') });
        console.log('Saved gameplay_voo_inverno_real.png');

        await page.close();
    } finally {
        await browser.close();
    }
})();
