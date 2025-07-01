// SECTION 5 TOOL CARDS HOVER ANIM

// Helper: Check if device is desktop
const isDesktop = () => window.innerWidth >= 1024;

// Select all the cards
const cards = document.querySelectorAll(".home-tools_card");

cards.forEach((card) => {
  const video = card.querySelector(".tools-video");

  // Safari/iOS-safe video setup
  video.muted = true;
  video.setAttribute("muted", ""); // Required for iOS autoplay
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";

  // Optional warm preload if needed (only on desktop)
  if (isDesktop()) {
    video.load(); // Begin loading the video file
  }

  let hoverInTimeline, hoverOutTimeline;

  // Hover In
  card.addEventListener("mouseenter", () => {
    if (!isDesktop()) return;

    if (hoverOutTimeline) hoverOutTimeline.kill();

    try {
      video.pause();
      video.currentTime = 0;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Hover play failed:", err);
        });
      }
    } catch (err) {
      console.error("Video play error:", err);
    }
  });

  // Hover Out
  card.addEventListener("mouseleave", () => {
    if (!isDesktop()) return;

    if (hoverInTimeline) hoverInTimeline.kill();

    try {
      video.pause();
      video.currentTime = 0;
    } catch (err) {
      console.error("Video reset error:", err);
    }
  });
});