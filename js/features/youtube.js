function makeEmbedUrl(source = {}) {
  const query = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (source.playlistId) {
    query.set("list", source.playlistId);
    return "https://www.youtube-nocookie.com/embed/videoseries?" + query;
  }

  if (source.videoId) {
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(source.videoId) + "?" + query;
  }

  return "";
}

function youtubeUrl(source = {}, channelUrl = "") {
  if (source.playlistId) {
    return "https://www.youtube.com/playlist?list=" + encodeURIComponent(source.playlistId);
  }

  if (source.videoId) {
    return "https://www.youtube.com/watch?v=" + encodeURIComponent(source.videoId);
  }

  return channelUrl;
}

function setLink(link, href) {
  if (!link || !href) return;
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

function makeIframe(source) {
  const iframe = document.createElement("iframe");
  iframe.title = "JackLight Tales landscape adventures on YouTube";
  iframe.src = makeEmbedUrl(source);
  iframe.loading = "eager";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  return iframe;
}

function showPlaceholder(frame, message) {
  if (!frame) return;
  frame.innerHTML = '<div class="youtube-placeholder"><span aria-hidden="true">✦</span><p>' + message + '</p></div>';
}

export function initYouTube(config = {}) {
  const channelUrl = config.channelUrl || "";
  const verticalUrl = config.verticalPlaylistUrl || channelUrl;
  const landscape = config.landscape || {};

  function wire(root) {
    const frame = root.querySelector("[data-cinema-landscape-player]");
    const src = makeEmbedUrl(landscape);

    setLink(root.querySelector("[data-youtube-channel]"), channelUrl);
    setLink(root.querySelector("[data-cinema-vertical-link]"), verticalUrl);
    setLink(root.querySelector("[data-cinema-landscape-link]"), youtubeUrl(landscape, channelUrl));

    if (!frame) return;

    if (!src) {
      showPlaceholder(frame, "The landscape playlist is ready to connect.");
      return;
    }

    frame.replaceChildren(makeIframe(landscape));
  }

  document.addEventListener("jacklight:panel-opened", (event) => {
    if (event.detail.panelName !== "watch") return;
    wire(event.detail.content);
  });
}
