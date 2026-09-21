# Woodland Search v4 — immersive rebuild

This version fixes the two big gameplay/layout problems from the previous build:

1. **Desktop no longer uses three columns.** The 16:9 woodland board expands to the largest uncropped size the viewport can hold. Target, status, audio shelf and action buttons are now HUD overlays, so they do not shrink the scene.
2. **Hidden characters cannot hang off an edge.** Every scene now has hand-picked safe hiding spots, plus a runtime clipping guard that measures the real PNG and nudges it fully back inside the scene after load, resize or rotation.

## Files

- `tokens.css` — shared colours, scene ratio and character sizes.
- `base.css` — shared component styling.
- `desktop.css` — desktop ≥ 1101px; full image-first board with overlay HUD.
- `tablet.css` — tablet rules.
- `phone-portrait.css` — portrait phone rules.
- `phone-landscape.css` — landscape phone HUD.
- `celebration.css` — found-character celebration.
- `game-data.js` — characters, scenes, safe spots and real scenery hints.
- `game-settings.js` — timing and edge-clamp settings.
- `game.js` — selection, safe positioning, two-stage hints, resize handling and game flow.

## Background asset naming

Woodland Search now uses one fixed landscape naming convention:

`whispering-woods-landscape-01.webp` through `whispering-woods-landscape-10.webp`

The ten scene definitions in `game-data.js` reference these filenames directly in numerical order. The old `woods-*.webp`, `village.png`, `moonlit-grove.webp`, `heart-tree.webp` and `barnaby-burrow.webp` background names are no longer used by Woodland Search.

## Hint behaviour

The first press gives a short clue that matches the actual hiding area (rocks, flowers, stream, roots, etc.). The second press briefly shows the golden glow. This keeps the game useful for children without immediately giving the answer away.

## Desktop design rule

The scene is always shown at its original 16:9 ratio with no crop. On a normal 16:9 monitor it can use almost the whole screen. On an ultrawide monitor the image is height-limited, so side gutters remain rather than stretching or cropping the artwork.
