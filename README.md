# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rektPanda/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rektPanda/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) — a GTA-style cover art maker. Referral: https://make.fun/r/1e8h8xtg

## What it does

Vice Cover Studio turns a photo and a caption into multi-panel cover art in the style of GTA 6's posters, exported as a PNG to share.

- **Any photo**: pick a photo from your machine (file input or drag-drop), or drop three at once. Crop and position each panel by dragging the preview or with the zoom and move sliders.
- **Multi-panel layouts**: Solo (one full-bleed photo), Duo (two panels) or Trio (three panels). One photo can span all panels as a continuous image, or each panel can hold its own photo.
- **Caption**: bold Anton lettering (SIL Open Font License, shipped under `app/fonts/`), with a subtitle, top or bottom placement, and adjustable size.
- **Colour grade**: Sunset, Neon, Noir or Vice — a Vice City sunset or neon grade over the photos.
- **Export PNG**: one click exports 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

Static files, no build step, works offline. Serve `app/` with any static server and open `app/index.html` in desktop Chrome. No network requests: every script, font and sample image is a file under `app/`.

## Files

- `app/` — the web app (`index.html`, `style.css`, `src/cover.js`, `src/main.js`, `src/shots.js`, `fonts/Anton-Regular.ttf`, `samples/`)
- `main.ts` — entry program (Node 22): copies `app/` and `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-app.ts`
- `screenshots/` — 4 screenshots (cover first, then the editor with a photo loaded, plus two more exported covers)
- `LICENSE` — MIT

All artwork is original. No Rockstar Games logo, artwork or font is used. The sample photos were generated for this entry.
