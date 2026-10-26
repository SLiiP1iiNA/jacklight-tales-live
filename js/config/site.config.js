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
    woodlandAudio: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2.mp3",
    woodlandAudioMobile: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2_-24dB.mp3",
    woodlandTracks: [
      {
        desktop: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2.mp3",
        mobile: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2_-24dB.mp3",
      },
      {
        desktop: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Barnabys_Quiet_Stroll_Website.mp3",
        mobile: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Barnabys_Quiet_Stroll_Website_-24dB.mp3",
      },
      {
        desktop: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Where_The_Ferns_Awaken_Website.mp3",
        mobile: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Where_The_Ferns_Awaken_Website_-24dB.mp3",
      },
    ],
    entranceVideo: "",
  },

  partials: {
    watch: "partials/watch.html",
    listen: "partials/listen.html",
    explore: "partials/explore.html",
    games: "partials/games.html?v=20261011-ten-friends1",
    grownups: "partials/grownups.html",
  },

  content: {
    stories: "content/stories.json",
    characters: "content/characters.json",
    gallery: "content/gallery.json?v=20261011-full-scour-final1",
    socialLinks: "content/social-links.json",
    audioLibrary: "content/audio-library.json?v=20261025-series2",
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
