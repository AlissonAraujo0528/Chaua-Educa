const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const artifactDir = 'C:\\Users\\aliss\\.gemini\\antigravity\\brain\\ed57b9d7-6392-4a2f-9a94-60455156b763';

(async () => {
    const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
    
    await page.goto('http://127.0.0.1:5501/', { waitUntil: 'networkidle' });
    
    // Capture 1: In-game active flight with no borders, updated Chaua and background
    await page.fill('#inputPlayer', 'Alisson');
    await page.click('#btnStart');
    await page.waitForTimeout(1600); // Wait for countdown to finish and game to start
    
    // Tap space to show wing flap with lift
    await page.keyboard.press('Space');
    await page.waitForTimeout(80);
    const flightPath = path.join(artifactDir, 'animacao_voo_chaua_fluido.png');
    await page.screenshot({ path: flightPath });
    console.log('Saved:', flightPath);

    // Capture 2: Dedicated showcase of the new snake strike, teeth, tongue, and hawk dive
    const showcasePath = path.join(artifactDir, 'animacoes_fluidez_showcase.png');
    await page.evaluate(async () => {
        const { Renderer } = await import('/js/render.mjs');
        const { loadAssets, images } = await import('/js/assets.mjs');
        await loadAssets();

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 700;
        canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#18281a;';
        document.body.appendChild(canvas);
        const r = new Renderer(canvas);
        const c = r.c;

        // Draw title
        c.fillStyle = '#f8f4db';
        c.font = '800 28px Nunito, sans-serif';
        c.fillText('Revisão Completa de Fluidez das Animações', 40, 50);
        c.font = '600 16px Nunito, sans-serif';
        c.fillStyle = '#b7e3a8';
        c.fillText('Papagaio (Chauá) · Gavião Predador (Raptor) · Serpente com Dentes, Língua & Articulação', 40, 80);

        // Panel 1: Serpente - Repouso / Alerta com Língua Exploratória
        c.save();
        c.translate(160, 360);
        c.scale(1.6, 1.6);
        const woodIdle = {
            kind: 'wood', id: 1, x: -29, top: -200, bottom: 0, variant: 'plain',
            snake: { phase: 'warning', age: 0.2, warningAge: 0.2, attackStarted: false }
        };
        r.obstacle(woodIdle, { sceneTime: 0.2, elapsed: 10 }, false);
        c.restore();

        c.fillStyle = '#ffffff';
        c.font = '700 17px Nunito, sans-serif';
        c.fillText('1. Serpente: Alerta & Língua', 40, 520);
        c.font = '500 13px Nunito, sans-serif';
        c.fillStyle = '#cbd5e1';
        c.fillText('Língua bifurcada exploratória', 40, 545);
        c.fillText('Respiração e swaying contínuo', 40, 568);

        // Panel 2: Serpente - Bote com Boca Articulada, Dentes & Língua
        c.save();
        c.translate(450, 360);
        c.scale(1.6, 1.6);
        const woodStrike = {
            kind: 'wood', id: 2, x: -29, top: -200, bottom: 0, variant: 'plain',
            snake: { phase: 'striking', phaseAge: 0.18, age: 3.5, attackStarted: true }
        };
        r.obstacle(woodStrike, { sceneTime: 3.5, elapsed: 15 }, false);
        c.restore();

        c.fillStyle = '#ffffff';
        c.font = '700 17px Nunito, sans-serif';
        c.fillText('2. Serpente: Bote Explosivo', 330, 520);
        c.font = '500 13px Nunito, sans-serif';
        c.fillStyle = '#cbd5e1';
        c.fillText('Presas curvas + dentes serrados', 330, 545);
        c.fillText('Garganta profunda & língua vibrante', 330, 568);

        // Panel 3: Papagaio Chauá - Batimento e Planeio Dinâmico
        c.save();
        c.translate(740, 240);
        const { drawBird } = await import('/js/render.mjs');
        drawBird(r.c, { x: 0, y: 0, scale: 1.1, wing: 0.8, flapImpulse: 0.9, angle: -0.05, time: 1.2 });
        drawBird(r.c, { x: 0, y: 140, scale: 1.1, wing: 0.0, flapImpulse: 0.0, angle: 0.02, time: 2.4 });
        c.restore();

        c.fillStyle = '#ffffff';
        c.font = '700 17px Nunito, sans-serif';
        c.fillText('3. Papagaio: Voo Orgânico', 630, 520);
        c.font = '500 13px Nunito, sans-serif';
        c.fillStyle = '#cbd5e1';
        c.fillText('Impulso de batimento com sustentação', 630, 545);
        c.fillText('Planeio suave com respiração de asas', 630, 568);

        // Panel 4: Gavião - Voo Predatório & Mergulho Aerodinâmico
        c.save();
        c.translate(1040, 240);
        r.hawk({ id: 5, x: 0, y: 0, warning: 0, dive: false }, 1.2, false);
        c.restore();

        c.save();
        c.translate(1040, 380);
        r.hawk({ id: 6, x: 0, y: 0, startX: 200, startY: -100, targetX: -200, targetY: 100, warning: 0, dive: true }, 2.0, false);
        c.restore();

        c.fillStyle = '#ffffff';
        c.font = '700 17px Nunito, sans-serif';
        c.fillText('4. Gavião: Voo & Mergulho', 930, 520);
        c.font = '500 13px Nunito, sans-serif';
        c.fillStyle = '#cbd5e1';
        c.fillText('Cadência real de batida e planeio', 930, 545);
        c.fillText('Mergulho em arco e flare dinâmico', 930, 568);
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: showcasePath });
    console.log('Saved showcase:', showcasePath);

    await browser.close();
})();
