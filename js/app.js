import { siteConfig } from "./config/site.config.js?v=20261005-regression1";
import { applySiteConfig } from "./core/apply-config.js";
import { initPanelRouter } from "./core/panel-router.js?v=20261005-regression1";
import { initAudioPlayer } from "./features/audio-player.js?v=20261005-regression1";
import { initContentPanels } from "./features/content-panels.js?v=20261005-regression1";
import { initEntrance } from "./features/entrance.js?v=20261005-regression1";
import { initSocialLinks } from "./features/social-links.js?v=20261005-regression1";
import { initSoundControl } from "./features/sound-control.js?v=20261006-audit1";
import { initYouTube } from "./features/youtube.js?v=20260927-cinema-playlist1";
import { initWoodlandMap } from "./features/woodland-map.js";
import { initGameTransition } from "./features/game-transition.js";
import { initImageProtection } from "./features/image-protection.js";

function startJackLightTales() {
  applySiteConfig(siteConfig);
  initPanelRouter(siteConfig.partials);
  initAudioPlayer(siteConfig.content.audioLibrary);
  initContentPanels(siteConfig.content);
  initSocialLinks(siteConfig.content.socialLinks, siteConfig.contactEmail);
  initSoundControl(siteConfig.assets.woodlandAudio, siteConfig.assets.woodlandAudioMobile);
  initYouTube(siteConfig.youtube);
  initEntrance(siteConfig.entrance);
  initWoodlandMap();
  initGameTransition();
  initImageProtection();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startJackLightTales, {
    once: true,
  });
} else {
  startJackLightTales();
}
