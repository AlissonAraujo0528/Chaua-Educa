const {chromium} = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const BRAIN = 'C:/Users/aliss/.gemini/antigravity/brain/ed57b9d7-6392-4a2f-9a94-60455156b763';

(async () => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || 'C:\\Users\\aliss\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage({viewport: {width: 1280, height: 720}});
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', msg => console.log('PAGE:', msg.text()));

        await page.route('**/js/script.js', route => route.fulfill({contentType: 'text/javascript', body: ''}));
        await page.goto('http://127.0.0.1:5501/', {waitUntil: 'networkidle'});

        await page.evaluate(async () => {
            const {Renderer} = await import('/js/render.mjs');
            const {Game} = await import('/js/engine.mjs');
            const {setWeatherMode} = await import('/js/weather.mjs');

            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            canvas.style.cssText = 'width: 1280px; height: 720px; position: fixed; inset: 0;';
            document.body.replaceChildren(canvas);

            window.renderer = new Renderer(canvas);
            await renderer.ready;
            window.game = new Game();
            game.state = 'playing';
            game.y = 320;
            game.stageAge = 10;
            window.setWeatherMode = setWeatherMode;
        });

        // 1. Winter Chauá + Snow Trees + Clay Breath
        console.log('Capturing Winter Chauá breath...');
        await page.evaluate(() => {
            window.setWeatherMode('winter');
            game.distance = 18500;
            game.stage = 3;
            game.sceneTime = 0.45; // peak breath puff
            game.y = 330;
            game.wing = 0.7;
            game.entities = [
                {kind: 'wood', id: 11, x: 280, top: 140, bottom: 490, variant: 'plain', fragileSide: 'top', fragileKind: 'rot'},
                {kind: 'wood', id: 12, x: 620, top: 130, bottom: 500, variant: 'branch', fragileSide: 'bottom', fragileKind: 'hollow', decorSide: 'top', decorKind: 'vine'},
                {kind: 'wood', id: 13, x: 960, top: 150, bottom: 480, variant: 'plain'}
            ];
            renderer.game(game, false);
        });
        await page.screenshot({path: path.join(BRAIN, 'showcase_winter_chaua_breath.png')});

        // 2. Winter Snake + Snow Branch + Clay Breath
        console.log('Capturing Winter Snake breath...');
        await page.evaluate(() => {
            window.setWeatherMode('winter');
            game.distance = 18500;
            game.stage = 3;
            // Wood id 12: snake t = sceneTime + 12 * 1.3 = sceneTime + 15.6
            // We want cycle = (t / 3.4) % 1 ~= 0.22 (active exhalation)
            // 15.6 / 3.4 = 4.588. To get .22: cycle = 4.588 + sceneTime/3.4 = 4.22 -> sceneTime = 3.4 * (5.22 - 4.588) = 2.15
            game.sceneTime = 2.15;
            game.entities = [
                {
                    kind: 'wood', id: 12, x: 500, top: 120, bottom: 480, variant: 'branch',
                    snake: {retreat: false, phase: 'idle', strike: 0, mouth: 0.4}
                }
            ];
            // Center camera on snake tree
            renderer.game(game, false);
        });
        await page.screenshot({path: path.join(BRAIN, 'showcase_winter_snake_breath.png')});

        // 3. Winter Hawk Dive + Clay Breath Stream
        console.log('Capturing Winter Hawk breath...');
        await page.evaluate(() => {
            window.setWeatherMode('winter');
            game.distance = 18500;
            game.stage = 3;
            // Hawk t = sceneTime + entity.id * 0.7. Period = 1.5, duration = 0.48.
            // With id = 5, 5 * 0.7 = 3.5. 3.5 % 1.5 = 0.5. If sceneTime = 1.25 -> t = 4.75 -> 4.75 % 1.5 = 0.25 (peak breath)
            game.sceneTime = 1.25;
            game.entities = [
                {kind: 'wood', id: 21, x: 260, top: 130, bottom: 500, variant: 'plain'},
                {kind: 'hawk', id: 5, x: 680, y: 300, warning: 0, dive: true, phase: 'dive', startX: 900, targetX: 400}
            ];
            renderer.game(game, false);
        });
        await page.screenshot({path: path.join(BRAIN, 'showcase_winter_hawk_breath.png')});

        // 4. Rain Storm + Wet Glistening Trees
        console.log('Capturing Rain Wet Trees...');
        await page.evaluate(() => {
            window.setWeatherMode('rain');
            game.distance = 9500;
            game.stage = 1;
            game.sceneTime = 12.0;
            game.y = 300;
            game.p = {flapImpulse: 0.8}; // trigger water spray drops off wings
            game.entities = [
                {kind: 'wood', id: 31, x: 380, top: 140, bottom: 490, variant: 'plain'},
                {kind: 'wood', id: 32, x: 740, top: 130, bottom: 510, variant: 'plain', decorSide: 'top', decorKind: 'vine'}
            ];
            renderer.game(game, false);
        });
        await page.screenshot({path: path.join(BRAIN, 'showcase_rain_wet_trees.png')});

        console.log('All showcase screenshots captured successfully!');
        if (errors.length > 0) {
            console.error('Page errors encountered:', errors);
        }
    } finally {
        await browser.close();
    }
})();
