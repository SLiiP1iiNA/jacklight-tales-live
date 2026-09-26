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
    channelId: "UCkVmyA-xY2LVIy46WfHV-DQ",
    defaultSeries: "series2",
    defaultWatchMode: "episodes",
    comingSoonAudio: "https://pub-9ea739df2a0c435bbc605d2f4bfc6fb5.r2.dev/Website%20-%20Jingles/Morning_in_the_Clearing-v2.mp3",
    series: {
      series1: {
        label: "Series 1",
        statusLabel: "Complete",
        title: "First adventures",
        episodes: "Episodes 01–30",
        description: "The complete first path through the Whispering Woods.",
        modes: {
          episodes: {
            label: "Episodes · vertical",
            playlistId: "PLLLqtNZiTQjo",
            aspect: "vertical",
            nowShowing: "Now showing Series 1 · Episodes 01–30",
          },
          landscape: {
            label: "Full series · landscape",
            videoId: "QVXn6WzFrL4",
            aspect: "landscape",
            startDate: "2026-09-26T10:30:00+01:00",
            releaseMessage: "The complete Series 1 landscape collection opens here on 26 September at 10:30.",
            nowShowing: "Now showing the complete Series 1 landscape collection",
          },
        },
      },
      series2: {
        label: "Series 2",
        statusLabel: "Now showing",
        title: "Woodland lessons",
        episodes: "Episodes 31–60",
        description: "The current story path, with new episodes joining the collection as they are released.",
        modes: {
          episodes: {
            label: "Episodes · vertical",
            playlistId: "",
            aspect: "vertical",
            nowShowing: "Now showing Series 2 · Episodes 31–60",
            unavailableMessage: "Series 2 is now showing. Its website playlist is ready to connect.",
          },
          landscape: {
            label: "Full series · later",
            aspect: "landscape",
            available: false,
            unavailableMessage: "The Series 2 landscape collection will open after the series is complete.",
          },
        },
      },
    },
  },

  contactEmail: "contact@jacklighttales.com",
};
