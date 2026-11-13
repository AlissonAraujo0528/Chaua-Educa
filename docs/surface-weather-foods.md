# Surface weather and food atlases

Implementation of the approved 13 November 2026 audit. This branch extends the
P1–P4 performance branch without changing climate dates, collision geometry,
wind physics, scoring, victory score or number of simultaneous collectables.

## Runtime

- `surface-weather.mjs` owns flight-time wetness, drying and deposited snow.
  Snowfall/cold still follow the existing season transition; cover begins at
  zero, waits eight flight seconds and ramps with smoothstep over ninety.
  A manual winter choice starts the same ramp; pause/quiz stop advancement.
- Water sheen uses twelve masks clipped to original wood/foliage silhouettes.
  A reusable pool of 24 droplets (8 Low) releases from measured upper-tree
  points, follows gravity outside reflected tree transforms and ends on impact,
  expiry or leaving the view. Reduced motion retains static wet surfaces.
- Snow-stage blending uses premultiplied additive weights, not opaque previous
  overlays under a new stage. Two reusable buffers are prepared before play;
  a 1/256 alpha cache avoids re-composing all layers at every draw.
- One `foods.mjs` catalogue drives the engine, persistence and journal. Twelve
  resources, four animation frames each, share one mandatory atlas. Stable food
  IDs survive reload. Retired discoveries remain in the player's original
  data and mission credit; they cannot unlock replacement foods. Catalogue
  version 2 is recorded without rewriting old scoreboards.
- Food moisture and snow are clipped to each food's alpha in one reusable
  128px buffer. The journal uses still crops of the same atlas and direct links
  to the source for each food.
- The adaptive-quality fix compares a RAF interval to prior callback work.
  An isolated uncertain gap has a bounded allowance without clearing history;
  repeated cheap-JS gaps remain evidence of possible compositor/GPU pressure.

## Art and removal policy

`runtime-art-data.mjs` records pages, hashes, rectangles and original-cell
offsets. `scripts/build_runtime_art.py` reproduces these from active authoring
sources under `art-source/`. Original tree and character atlases remain intact.
The manual artwork workflow runs the official approved generator and runtime
packer; the superseded procedural snow generator and embedded masks are gone.

Removed after replacement: seven individual food WebPs, six unused full snow
intermediates, six large shedding WebPs and historical unused snake sources.
There are no fallback renderers, backup atlases or abandoned variants. Active
wood/character/winter sources were moved outside the published application and
their generators updated. Recover retired versions through Git history.

## Verification

- `npm test`: simulation, migration, catalogue, canonical hashes/bounds, world
  gravity, gradual wetness/cover and adaptive-quality regressions.
- `npm run test:surface-foods`: browser alpha-silhouette, actual 48 food frames,
  continuity at snow-stage boundaries and the real start flow. Captures are
  attached by CI in `surface-foods/`.
- Existing action-art hashes, pixel masks, winter-art, cross-browser, responsive,
  full-journey and Pages-prefix tests remain required.

Native-device FPS has to be measured with the same seed, viewport and duration
before and after this branch. CI/synthetic clocks are not a guarantee of 60 FPS.


## Rain and snow on animals

Contact positions are measured offline from each unchanged authored flight/A2
frame (`scripts/build_animal_weather.py`, `animal-contact-data.mjs`), including
mirrored A2 strike poses and deliberate v6 flight/landing poses. Bird contacts
use rear wings/back; snake contacts use lower coils, away from eyes and mouths.
Impact/star poses suppress contact overlays. Tiny snow dusting follows global
deposition; wingbeats/botes/dives shake it off and it rebuilds over time.

Wet beads reuse the existing packed water atlas. Attached contacts follow the
sprite's actual canvas transform. Released droplets/crystals are converted
once into world coordinates, scroll with the flight, and fall under gravity.
No animal atlas, hitbox, physics RNG, runtime pixel readback or per-frame image
allocation is added. Former fixed frost and body-relative spray loops were
removed. The renderer owns at most 16 contact records and 24 detached particles
(8 in Low); reduced motion keeps static surface details without moving particles.
Pause/quiz use the frozen scene clock, and a new run resets the effect state.

`tests/animal-weather.test.mjs` verifies release, mirroring, world gravity,
pause/reset and budgets. `tests/browser-animal-weather.cjs` checks all 216
anchors against real opaque artwork, exercises production pose selection and
captures 32 rain/snow poses in `animal-weather/contact-poses.png`.
