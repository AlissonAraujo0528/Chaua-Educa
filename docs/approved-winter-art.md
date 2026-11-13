# Approved winter artwork — current integration

The authored winter WebPs are installed and required by CI. Original v7/v9
wood remains unchanged beneath the transparent authored snow masks. No ZIP,
manual asset installation or prompt is needed to play the published game.

- Active tree cover: eight transparent progressive overlays and two final
  `trees-{upper,lower}-snow-04.webp` atlases.
- Active variants: `assets/v10/tree-variants-snow.webp`.
- The six authored shedding times are now cropped in `assets/runtime/weather-fx-*`
  with exact cell offsets in `js/runtime-art-data.mjs`.
- JPEG authoring inputs live in `art-source/winter/`, outside the published app.
- Removed intermediate full snowy atlases and standalone shedding files must
  not be restored as runtime fallbacks.

Rebuild with `python scripts/build_approved_winter_art.py` and
`python scripts/build_runtime_art.py`. Dependencies are in
`scripts/requirements-art.txt`. Review hashes and visual results before commit.
The manual workflow produces review artifacts and never pushes over artwork.

Required checks: `npm test`, `npm run test:winter-art`,
`npm run test:surface-foods` and the complete CI. See
[surface weather and food atlas implementation](surface-weather-foods.md).
