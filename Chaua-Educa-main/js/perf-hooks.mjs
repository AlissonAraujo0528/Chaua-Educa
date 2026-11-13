// Single opt-in bridge. The normal GitHub Pages game never imports the profiler.
export let activeProbe = null;
export function setActiveProbe(probe) { activeProbe = probe || null; }
