# Local website preview

This is the one working website folder.
In VS Code choose Terminal > Run Task > Start local website test.
Open http://127.0.0.1:8765/ or http://127.0.0.1:8765/games/woodland-search/.

The game, original artwork, audio and planning files now all live under games/woodland-search.
Nothing is published by running this preview.

## Local games showcase — 13 November 2026

The local server now previews the proposed two-game layout on the homepage and in the Games panel. Christmas is the larger first card; Woodland Search remains alongside it on desktop and underneath on phones. Both buttons open their existing local games.

The showcase is inserted into local responses by tools/preview.mjs. Public index.html, partials/games.html and the Christmas exclusion in _config.yml are unchanged. Opening the HTML file directly will not show the local showcase. No publication is performed.

The Christmas button opens the current prototype. This website presentation change does not integrate the newly generated artwork into gameplay or complete the lantern reward journey. Its new review scenery is used on the website card only.

Use the Games navigation button to review both cards. The local preview label is for testing; release wording and public access must wait until completion and Jack's approval at the beginning of Series 4. Use the existing local preview task to restart the server when needed.
