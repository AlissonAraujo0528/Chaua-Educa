# Active authoring sheets

These lossless WebPs are the active inputs to `scripts/build_runtime_art.py`.
All five new illustrations were produced with the built-in image-generation tool
using the game's original guava and tree atlases as references. No old character
or tree was redrawn in the runtime. The packer crops, registers, masks water to
the original alpha silhouettes and exports lossless runtime WebPs and metadata.

Prompt set used:

- `foods.webp`: transparent 8×6 grid, twelve foods with four adjacent subtle
  animation frames each. Soft rounded clay-style volumes, fixed centers and
  lighting; guava/mango, papaya/banana, cashew/cajá, jackfruit aril/jambo,
  acerola/forest seeds, shoot/yellow ipê petals. Petals were refined in a second image-generated
  2×2 sheet of three loose flat petals, avoiding whole trumpet flowers, and
  registered into the active food source. No labels or backgrounds.
- `wet-upper.webp`, `wet-lower.webp`, `wet-variants.webp`: water-only transparent
  sheen on the exact reference 2×2 tree layout, following bark grooves, leaf
  fringes and exposed cut faces. No wood, leaves, snow or detached drops.
- `water-fx.webp`: transparent 4×4 water-bead formation, detachment and small
  splash sequences, matching the soft clay-game lighting.
- `snow-shedding.webp`: unchanged authored six snow times concatenated only as
  an offline source. The packer preserves every original nontransparent pixel
  and its cell offset while removing unused transparent runtime area.

Generated temporary proposals and original PNG copies are not part of this
branch. These source files are necessary for reproducible active assets;
runtime only loads `Chaua-Educa-main/assets/runtime/` pages. Rerun `npm run
art:build` and review hashes plus visual parity after changing a source.
