import { siteConfig } from "./config/site.config.js?v=20260926-watch-series1";
import { applySiteConfig } from "./core/apply-config.js";
import { initPanelRouter } from "./core/panel-router.js";
import { initAudioPlayer } from "./features/audio-player.js";
import { initContentPanels } from "./features/content-panels.js";
import { initEntrance } from "./features/entrance.js";
import { initSocialLinks } from "./features/social-links.js";
import { initSoundControl } from "./features/sound-control.js";
import { initYouTube } from "./features/youtube.js?v=20260926-cinema-desktop1";
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
