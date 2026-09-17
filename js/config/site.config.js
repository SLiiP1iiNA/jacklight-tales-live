export const siteConfig = {
  entrance: {
    transitionMs: 1450,
    showOncePerSession: false,
  },

  assets: {
    homeBackground: "assets/images/prototype/world-map-desktop.webp",
    homeBackgroundMobile: "assets/images/prototype/world-map-mobile.webp",
    entranceBackground: "assets/images/prototype/gateway-desktop.webp",
    entranceBackgroundMobile: "assets/images/prototype/gateway-mobile.webp",
    worldMap: "assets/images/prototype/world-map-desktop.webp",
    worldMapMobile: "assets/images/prototype/world-map-mobile.webp",
    cardImages: {
      watch: "assets/images/cards/watch.png",
      listen: "assets/images/cards/listen.png",
      characters: "assets/images/cards/characters.png",
      artwork: "assets/images/cards/artwork.png",
    },
    woodlandAudio: "",
    entranceVideo: "",
  },

  partials: {
    watch: "partials/watch.html",
    listen: "partials/listen.html",
    explore: "partials/explore.html",
    games: "partials/games.html",
    grownups: "partials/grownups.html",
  },

  content: {
    stories: "content/stories.json",
    characters: "content/characters.json",
    gallery: "content/gallery.json",
    socialLinks: "content/social-links.json",
    audioLibrary: "content/audio-library.json",
  },

  youtube: {
    channelUrl: "https://www.youtube.com/@JackLightTalesTV",
    channelId: "UCkVmyA-xY2LVIy46WfHV-DQ",
    playlistId: "PLLLqtNZiTQjo",
    featuredVideoId: "ZxmrxHcUXWY",
    watchModes: {
      shorts: {
        label: "Shorts · vertical",
        playlistId: "PLLLqtNZiTQjo",
        aspect: "vertical",
      },
      landscape: {
        label: "Landscape · wide",
        playlistId: "",
        aspect: "landscape",
        startDate: "2026-09-26",
      },
    },
  },

  contactEmail: "contact@jacklighttales.com",
};
