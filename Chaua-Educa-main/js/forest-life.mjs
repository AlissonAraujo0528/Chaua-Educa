import {breeze, winterAmount} from './living-motion.mjs';

// Renders ambient forest atmosphere: winter snowfall, rising humid ground mist, and atmospheric breeze.
// All particle motion is deterministic based on simulation time so pausing is 100% frozen.
export function drawForestLife(c, w, h, time, distance, rain, wind, reduced = false, low = false) {
    const t = reduced ? 0 : time;
    const air = breeze(t, wind, reduced);
    const snow = winterAmount(distance);

    c.save();

    // 1. Winter mountain atmosphere & multi-layer snowfall
    if (snow > 0) {
        c.globalAlpha = snow * 0.08;
        c.fillStyle = '#deefff';
        c.fillRect(0, 0, w, h);

        if (!reduced) {
            const layers = low ? 1 : 2;
            for (let layer = 0; layer < layers; layer++) {
                const flakeCount = low ? 16 : (layer === 0 ? 36 : 24);
                const speed = 18 + layer * 16;
                const r = layer === 0 ? 1.2 : 2.2;
                c.globalAlpha = snow * (layer === 0 ? 0.35 : 0.68);
                c.fillStyle = '#f5faff';
                c.beginPath();
                for (let i = 0; i < flakeCount; i++) {
                    const x = ((i * 139.73 - t * speed + Math.sin(t * 0.65 + i) * 16 + air * 22) % (w + 40) + w + 40) % (w + 40) - 20;
                    const y = (i * 71.17 + t * (speed + (i % 3) * 6)) % (h + 30) - 15;
                    c.moveTo(x + r, y);
                    c.arc(x, y, r, 0, Math.PI * 2);
                }
                c.fill();
            }
        }
    }

    // 2. Rising Atlantic Forest ground mist (Névoa da Mata)
    if (!low) {
        const mistTop = h * 0.70;
        const mist = c.createLinearGradient(0, mistTop, 0, h);
        mist.addColorStop(0, '#d8e9df00');
        mist.addColorStop(0.45, '#d8e9df18');
        mist.addColorStop(1, '#d8e9df35');

        const mistAlpha = 0.35 + rain * 0.45 + (snow > 0 ? snow * 0.25 : 0);
        c.globalAlpha = Math.min(0.85, mistAlpha);
        c.fillStyle = mist;

        c.save();
        c.translate(air * 10, Math.sin(t * 0.22) * 3);
        c.fillRect(-30, mistTop, w + 60, h - mistTop + 10);
        c.restore();
    }

    c.restore();
}
