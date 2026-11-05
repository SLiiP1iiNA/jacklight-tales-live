# Woodland Search: changing the season

The active season is `seasons/woodland.js`. It contains the ten scenes and their hiding places, treasure images, all Luna URLs, music playlists, welcome artwork/text, ending text, four accent colours and decorative particles.

For Christmas:

1. Copy `seasons/woodland.js` to `seasons/christmas.js`.
2. Replace the seasonal artwork, treasures, wording and any audio/music that should change. Keep shared Luna lines where they still fit. Keep ten scenes and an existing voice entry for every scene's voiceCue.
3. Review hiding places against each new picture, including a cropped phone view. New artwork still needs this visual check; copying coordinates does not guarantee a good hiding place.
4. Change the one seasonal script reference in `index.html` to the Christmas file. Update its version suffix when changing content. Update the page's fallback title/description/art and the main website Games card for the Christmas release.
5. Run `node tools/check-woodland.mjs` from the website folder. If styles changed, run `node tools/build-styles.mjs`.
6. Play all ten rounds, test portrait/landscape, hints, sound, replay and leaving. Check that every recording describes the current season.

Keep the woodland file for the return after Christmas. Switching seasons does not require changing the game rules or the audio player. Nothing switches automatically by date.

The small discovery collection is for the current journey only; it does not create an account or store a child's details.
