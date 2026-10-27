# JackLight Tales — local artwork and speed test

Open http://127.0.0.1:8765/ on this computer. This test copy is based on the newer website revision that includes Dad and Series 2.

Nothing has been pushed or published. This folder is a separate local branch, local/artwork-speed-test, with no Git remote. The normal website folder and the live website are unchanged.

## Start again later

In VS Code choose Terminal → Run Task → Start local website test. Leave that terminal running, then open http://127.0.0.1:8765/.

If a preview is already running, use it rather than starting a second one. The preview is bound to this computer only; a separate phone cannot access this loopback address. Use the browser's phone-size preview for now, or request a separate phone-testing setup.

## What changed

- Corrected the leaf-boat scene against Barnaby, Pip and the frog's portraits. The homepage and artwork gallery use the same corrected image.
- Added smaller transparent character images, with larger versions selected automatically for sharper screens. The eleven 480-pixel portraits total 708,436 bytes instead of 16,914,298 bytes (95.8% smaller). The eleven 960-pixel versions total 2,132,226 bytes (87.4% smaller).
- The game now shares the smaller character files with the main site. Original image masters remain untouched.
- Replaced the game's oversized lantern with a shared 30,534-byte version.
- Combined the homepage stylesheet chain into one file, preserving its order and editable source files. Combined the seven game stylesheets into one too.
- Prioritised entrance artwork, lowered the map's initial download priority and deferred lower-page images until the entrance opens. Native lazy loading then handles scrolling.
- Replaced animated map-marker shadows with a static glow and a small scale animation. Hidden map effects pause while the entrance is showing.
- Deferred the game's voice-file preload until playback is requested.
- New image and stylesheet filenames include content fingerprints so future revisions can be cached safely. Live hosting/cache settings have not been changed.

## Your test checklist

1. Open a fresh private window. Try opening the gate, skipping it, refreshing and replaying the entrance.
2. Scroll the homepage and open Friends. Check every portrait, including Dad, and open/close the character descriptions.
3. Open Artwork and inspect “A leaf becomes a boat” at desktop and phone widths. Check Barnaby's forehead fur and scarf, Pip's tuft, and the frog's face.
4. Open Watch and play the video. Open Listen and try Series 1 and Series 2, play/pause and switching episodes.
5. Try woodland sound on/off and enter the game. Listen for Luna's introduction and hints, check music, find the friend, Heart Seed and secret, and continue through all ten rounds.
6. Check a narrow portrait layout and a landscape layout. Scroll, close/reopen panels and return home from the game.
7. Report any blur, missing images, sound delay, overlap or stuttering. Approve publishing only after you are happy.

## Checks already run

Automated local checks cover desktop (1440 × 1000) and phone-size (390 × 844) layouts, fresh/returning entrance, replay and skip, all 11 character cards, the corrected gallery image, opening all main panels, all 10 game portrait URLs, game start, hints and completing a round. Those checks found no local missing-file responses or JavaScript errors. Normal-motion desktop rendering was also inspected.

External audio/video requests were blocked during the automated walkthrough, so that walkthrough does not certify playback. Test those yourself using the normal local preview, where media is enabled. The preview server relays the site's public audio through the local address because Cloudflare rejects direct local-browser audio requests. This is a development-only adjustment; production audio URLs and Cloudflare settings are unchanged. Local preview traffic is excluded from production analytics.

These checks are not a new public PageSpeed score or a guarantee of frame rate on physical phones.

A separate playback check with the local audio relay confirmed that Luna's voice and the game music both start and advance after entering the game. Full narration sequences, seeking through audiobooks and video playback still belong in your manual test.

## Editing styles

Edit the original CSS files, then choose Terminal → Run Task → Rebuild website styles. This regenerates the bundled styles and updates their links. The preview task does not publish anything.

Before any eventual publish, review the local diff and compare its base revision (1cc7b5e) against the then-current live branch. Do not replace the live site blindly if other changes have been published since this copy was made.
