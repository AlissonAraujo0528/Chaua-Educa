import {smoothstep} from './motion.mjs';

const clamp = v => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

// Continuous simulation-time breeze: pausing never advances weather or secondary animation.
export function breeze(time = 0, strength = 0, reduced = false, x = 0) {
    if (reduced) return 0;
    const intensity = 0.16 + 0.64 * clamp(strength);
    return intensity * (0.65 * Math.sin(time * 1.7 - x * 0.002) + 0.35 * Math.sin(time * 3.1 - x * 0.003));
}

// Organic trunk and branch sway with hit recoil impulse
export function treeBend(time, wind, id, hitAge, reduced = false) {
    if (reduced) return 0;
    const recoil = hitAge === null ? 0 : Math.sin(hitAge * 24) * Math.exp(-hitAge * 7) * 0.009;
    return breeze(time, wind, false, id * 41) * 0.003 + recoil;
}

// Distance-based winter mountain transition
export function winterAmount(distance) {
    return smoothstep(clamp((distance - 17500) / 700)) * smoothstep(clamp((20200 - distance) / 700));
}
