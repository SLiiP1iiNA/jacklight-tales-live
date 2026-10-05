export const siteConfig = {
  entrance: {
    transitionMs: 1450,
    showOncePerSession: true,
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
    woodlandAudio: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2.mp3",
    woodlandAudioMobile: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2_-24dB.mp3",
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
    verticalPlaylistUrl: "https://www.youtube.com/playlist?list=PLLLqtNZiTQjo",
    landscape: {
      playlistId: "PLJQCais5TxzQ",
      videoId: "QVXn6WzFrL4",
    },
  },

  contactEmail: "contact@jacklighttales.com",
};
