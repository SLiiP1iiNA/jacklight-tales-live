/*
 * Optional JackLight Narrator TTS and jingle hooks.
 * Drop the matching MP3 files into ../../assets/audio/game/.
 * Missing files are ignored so the game remains fully playable without audio.
 */
(() => {
  const root = '../../assets/audio/game/';
  const cues = {
    welcome: 'voice-welcome.mp3',
    found: 'voice-well-done.mp3',
    next: 'voice-find-next.mp3',
    hint: 'jingle-hint.mp3',
    transition: 'jingle-transition.mp3'
  };
  let enabled = true;

  function play(name) {
    if (!enabled || !cues[name]) return;
    const player = new Audio(`${root}${cues[name]}`);
    player.preload = 'auto';
    player.volume = 0.82;
    player.play().catch(() => {});
    return player;
  }

  window.jltGameAudio = {
    play,
    setEnabled(value) { enabled = Boolean(value); },
    cues: { ...cues }
  };
})();
