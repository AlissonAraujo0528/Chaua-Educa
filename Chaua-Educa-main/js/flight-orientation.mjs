// Orientation lock is an enhancement for phones, not a gameplay dependency.
// The browser may reject fullscreen or orientation requests (notably iOS).
export function isMobileFlightDevice(agent, display, coarsePointer = false) {
    if (agent?.userAgentData?.mobile === true) return true;
    if (/Android|iPhone|iPad|iPod/i.test(agent?.userAgent || '')) return true;
    return (agent?.maxTouchPoints || 0) > 0 && coarsePointer &&
        Math.min(display?.width ?? Infinity, display?.height ?? Infinity) <= 900;
}

export async function requestFlightLandscape(element, doc, display) {
    if (!doc.fullscreenElement && typeof element.requestFullscreen === 'function') {
        try {
            await element.requestFullscreen();
        } catch {
            // Standalone iOS and restricted browser contexts may deny fullscreen.
        }
    }
    if (typeof display.orientation?.lock === 'function') {
        try {
            await display.orientation.lock('landscape');
        } catch {
            // Keep the portrait-compatible game available as a fallback.
        }
    }
}

export function releaseFlightLandscape(element, doc, display) {
    if (doc.fullscreenElement !== element) return;
    try {
        display.orientation?.unlock?.();
    } catch {
        // Exiting fullscreen also releases the orientation lock in browsers.
    }
    try {
        doc.exitFullscreen?.()?.catch?.(() => {});
    } catch {
        // Never block returning to the menu.
    }
}
