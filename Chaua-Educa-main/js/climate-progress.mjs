// Calibrated from the existing browser full-journey CI (seed 104, real Game):
// Aventura: 827.4167 flight seconds; Tranquilo: 794.2583 flight seconds.
// Both finished after distance had already hit its 28,000-unit cap.
// These are scripted pilot baselines, NOT measured human averages.
// Re-evaluate with the seeded report and real-player data before tuning.
export const CLIMATE_FLIGHT_REFERENCE = Object.freeze({
 aventura:827.42,
 tranquilo:794.26
});

const clamp01 = x => Math.min(1,Math.max(0,Number.isFinite(x)?x:0));

// No points or progress bar enter this formula. Flight time continues to
// advance even when the world-distance cap is reached and stops on pause/quiz.
// The tiny deterministic per-run offset avoids a mechanical identical timestamp.
export function climateReferenceSeconds(mode='aventura',seed=0){
 const baseline=CLIMATE_FLIGHT_REFERENCE[mode]??CLIMATE_FLIGHT_REFERENCE.aventura;
 const hash=Math.imul((Number(seed)||0)>>>0,0x9e3779b1)>>>0;
 const offset=(hash/4294967295-.5)*.08;
 return baseline*(1+offset);
}

export function climateJourneyProgress({elapsed=0,mode='aventura',seed=0}={}){
 return clamp01(Number(elapsed)/climateReferenceSeconds(mode,seed));
}
