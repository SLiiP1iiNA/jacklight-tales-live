export function applySiteConfig(config) {
  const root = document.documentElement;
  const assets = config?.assets ?? {};

  function setImageProperty(propertyName, imagePath) {
    if (imagePath) {
      root.style.setProperty(propertyName, `url("${imagePath}")`);
    }
  }

  setImageProperty("--home-background", assets.homeBackground);
  setImageProperty("--home-background-mobile", assets.homeBackgroundMobile);
  setImageProperty("--entrance-background", assets.entranceBackground);
  setImageProperty("--entrance-background-mobile", assets.entranceBackgroundMobile);
  setImageProperty("--world-map", assets.worldMap);
  setImageProperty("--world-map-mobile", assets.worldMapMobile);

  const cardProperties = {
    watch: "--card-image-watch",
    listen: "--card-image-listen",
    characters: "--card-image-characters",
    artwork: "--card-image-artwork",
  };

  Object.entries(cardProperties).forEach(([cardName, propertyName]) => {
    setImageProperty(propertyName, assets.cardImages?.[cardName]);
  });
}
