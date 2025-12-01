/**
 * AI PHOTO EDITOR CAROUSEL - Optimized Version
 * Desktop-only zoom, smooth animations, butter performance
 */

const DEBUG = false;
const log = (...a) => DEBUG && console.log(...a);

console.log('🚀 AI Photo Editor Carousel - Optimized');

// ===== DATA =====
const slides = [
  { id: 1, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/01_Photoshoot.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'', label: 'Photoshoot' },
  { id: 2, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/02_Ad_Creative.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'', label: 'Ad Creative' },
  { id: 3, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/03_upscale.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/hero-action/Upscale_OG_Image.jpg', label: 'Upscale' },
  { id: 4, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/04_Logo.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'', label: 'Logo' },
  { id: 5, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/08_Remove_BG.avif?w=900&h=600&fit=cover&auto=format'],injectUrl:'https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/hero-action/Remove_BG_Original_Image.jpg',  label: 'Remove background' },
  { id: 6, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/07_Social_Media.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'', label: 'Social media' },
  { id: 7, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/09_Digital_Art.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'', label: 'Digital Art' },
  { id: 8, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/06_Wm.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/hero-action/Wm_OG_Image.jpg', label: 'Remove watermarks' },
  { id: 9, images: ['https://cdn.pixelbin.io/v2/falling-surf-7c8bb8/original/webflow-team/Pixelbin-V2/home/Hero-silder-images/05_poster.avif?w=900&h=600&fit=cover&auto=format'], injectUrl:'', label: 'Poster' }
];

const prompts = {
  'Photoshoot': 'A luxury fashion campaign portrait of a confident woman in a blush pink tailored suit with a bralette underneath. She stands against a neutral beige fabric backdrop with soft shadows adding dimension. Her gaze is powerful, hair styled effortlessly sleek. Lighting is soft but directional, highlighting the satin sheen of the suit fabric. Ultra-realistic textures, clean editorial finish, cinematic luxury advertising style.',
  'Ad Creative': 'A playful food campaign visual featuring two colorful eclairs - one chocolate, one strawberry - floating on a pastel blue background. Repeating text pattern reads "So Yum" in centre in all caps white sans-serif font. Soft shadows and realistic textures on the pastries. Fun, graphic, and modern lifestyle branding aesthetic.',
  'Poster': 'A retro-inspired sneaker poster ad featuring a pair of Nike Dunk High sneakers in burnt orange and white, floating mid-air against a bright blue sky with soft white clouds. The sneakers are shown in photorealistic detail with visible leather texture, stitching, and laces, arranged to highlight both the side profile and top view. The composition is minimalist, with the Nike swoosh logo and bold white text placed subtly around the frame, alongside smaller retro tagline text with a slightly blurred, print-like effect. The overall style has a vintage sports ad aesthetic with a dreamy, nostalgic mood, enhanced by a grainy overlay and soft tones, evoking the feel of classic 90s sneaker campaigns',
  'Digital Art': 'A minimalist surreal scene featuring a human silhouette made of translucent water standing on a dry cracked desert floor. The figure mirrors the sky above, reflecting clouds and light. Colors are muted - soft ivory, desaturated cyan, and warm beige. Lighting is cinematic and diffused. Symbolic, emotional, and deeply aesthetic digital artwork.',
  'Social media': 'A lifestyle beverage ad featuring a chilled Corona-style beer bottle leaning casually against a carved sandy surface with soft ripples, surrounded by freshly sliced limes glistening with juice. Golden sunlight spills across the scene, illuminating condensation droplets and highlighting the rich amber tones of the beer. The background features smooth, sunlit sand tones for a relaxed beach-day feel. Overlay elegant, minimalist text at the top that reads "Taste the Sun" in bold modern sans-serif, with a smaller tagline below: "Golden moments. Cold beer. Endless summer." The overall image is cinematic, hyper-detailed, and refreshing - a premium lifestyle campaign visual designed for social media.',
  'Remove watermarks': 'Remove the watermark from this image',
  'Logo': 'A minimalist logo design for a luxury skincare brand named "LUNEA". The logo features thin modern serif typography paired with a delicate crescent moon motif integrated into the text. Only two colors - moss green and ivory. Clean composition with balanced negative space on a textured off-white background. Elegant, calm, and modern wellness-inspired identity.',
  'Remove background': 'Remove background of this image',
  'Upscale': 'Upscale this image'
};

// ===== STATE =====
let currentOffset = 0, snapRaf = null, isMobile = window.innerWidth < 768;
let slideElements = [], sliderTrack, autoInterval = null, isUserActive = false;
let storedPrompt = '', userHasTakenControl = false;
let pendingInjectTimeout = null, injectToken = 0, syncTimer = null, syncInFlight = false;
let _lastRoundedIndex = null;
let isDragging = false, dragStartX = 0, dragStartOffset = 0, suppressNextBlur = false;
let injectionInProgress = false, lastInjectedSlideId = null;
let isFocusZoomed = true, __frameScheduled = false; // Always zoomed by default (always multi-line)
let typewriterInterval = null, typewriterIndex = 0, typewriterTargetPrompt = '';

// ===== CONSTANTS =====
const ROTATION_DELAY = 5000, SNAP_DURATION = 300, AUTO_TRANSFORM_MS = 700;
const FOCUS_SCALE = 1, FOCUS_TRANSITION_MS = 750;
const CENTER_SHADOW = '1px 18px 10px #8543ff08, 1px 3px 4px #630fff0a';
const SOFT_SHADOW = '3px 6px 7px #630fff08, 1px 2px 4px #630fff0a';
const LITE_SHADOW = '0 1px 2px rgba(0,0,0,0.08)';

// Simple gap system - just one value to control spacing
const GAP_NORMAL = 12;      // Gap when not zoomed (user uploaded image)
const GAP_ZOOMED = 12;      // Gap when zoomed (default state)

// ===== MODES =====
let isSnapping = false, currentMode = 'auto', lastMode = null;

const setMode = (mode) => {
  currentMode = mode;
  if (lastMode === mode) return;
  lastMode = mode;

  const sizeFade = 'width 400ms ease, height 400ms ease, opacity 400ms ease';
  const trackTrans = mode === 'auto'
    ? `transform ${FOCUS_TRANSITION_MS}ms ease-out, ${sizeFade}`
    : sizeFade;

  slideElements.forEach(({ wrapper, slideCard, slideImage }) => {
    if (wrapper) wrapper.style.transition = trackTrans;
    if (slideCard) slideCard.style.transition = `transform ${FOCUS_TRANSITION_MS}ms ease-out`;
    if (slideImage) slideImage.style.transition = `object-position ${FOCUS_TRANSITION_MS}ms ease-out, border-radius 400ms ease`;
  });
};

// ===== UTILS =====
const q = (id) => document.getElementById(id);
const getImagesSection = () => q('imagesSection');
const zoomActive = () => !isMobile && isFocusZoomed; // Always multi-line, so zoom is based on isFocusZoomed only
const isInside = (root, node) => !!root && (root === node || root.contains(node));
const getClientX = (e) => (e.touches?.[0]?.clientX) || e.clientX || 0;

function requestUpdate() {
  if (__frameScheduled) return;
  __frameScheduled = true;
  requestAnimationFrame(() => {
    __frameScheduled = false;
    updatePositions_now();
  });
}

function variant(url, w, h) {
  try {
    const u = new URL(url, window.location.href);
    ['w','h','fit','auto','dpr'].forEach(k => u.searchParams.delete(k));
    if (w) u.searchParams.set('w', w);
    if (h) u.searchParams.set('h', h);
    u.searchParams.set('fit', 'cover');
    u.searchParams.set('auto', 'format');
    return u.toString();
  } catch {
    return `${url.split('?')[0]}?w=${w}&h=${h}&fit=cover&auto=format`;
  }
}

const getUIImageURLs = () => {
  const sec = getImagesSection();
  return sec ? Array.from(sec.querySelectorAll('.image-thumbnail')).map(t => t.dataset.url).filter(Boolean) : [];
};

const hasCarouselImage = (url, slideKey) => {
  const sec = getImagesSection();
  return sec ? Array.from(sec.querySelectorAll('.image-thumbnail'))
    .some(t => t.dataset.source === 'carousel' && (t.dataset.url === url || t.dataset.slideKey === slideKey)) : false;
};

const hasUserOwnedImages = () => {
  const sec = getImagesSection();
  return sec ? Array.from(sec.querySelectorAll('.image-thumbnail'))
    .some(t => t.dataset.source === 'user' || !t.dataset.slideKey) : false;
};

// ===== BACKEND SYNC =====
function scheduleSyncBackend() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (!window.searchFeature || syncInFlight) return;
    syncInFlight = true;
    try {
      const urls = getUIImageURLs();
      window.searchFeature.clearImages?.();
      urls.forEach(u => window.searchFeature.setExternalImage?.(u));
      log('🔁 Backend synced:', urls);
    } finally {
      syncInFlight = false;
    }
  }, 50);
}

function proxyBackend() {
  const sf = window.searchFeature;
  if (!sf || sf.__proxied) return;
  const origClear = sf.clearImages?.bind(sf);
  const origSet = sf.setExternalImage?.bind(sf);
  if (origClear) sf.clearImages = (...args) => origClear(...args);
  if (origSet) sf.setExternalImage = (url, ...rest) => origSet(url, ...rest);
  sf.__proxied = true;
}

// ===== CAROUSEL MATH =====
const normIndex = (i) => ((i % slides.length) + slides.length) % slides.length;
const getCurrentSlide = () => slides[normIndex(Math.round(currentOffset))];

function getSignedDistance(absoluteIndex, offset = currentOffset) {
  const total = slides.length;
  const slide = normIndex(absoluteIndex);
  const curr = ((offset % total) + total) % total;
  let d = slide - curr;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

function getAxisSizes() {
  if (!isMobile) {
    // Desktop: Zoomed uses larger center image
    if (zoomActive()) {
      return { center: 748, adjacent: 328, far: 328 };
    }
    // Desktop: Not zoomed uses uniform sizes
    return { center: 328, adjacent: 328, far: 328 };
  }
  // Mobile: Original sizes for proper mobile layout (vertical stack)
  return { center: 420, adjacent: 340, far: 260 };
}

// Simplified - just get the gap based on zoom state
const getCurrentGap = () => zoomActive() ? GAP_ZOOMED : GAP_NORMAL;

const NOMINAL_STEP = () => {
  const { center, adjacent } = getAxisSizes();
  return center/2 + getCurrentGap() + adjacent/2;
};

const pxToOffset = (deltaPx) => -deltaPx / NOMINAL_STEP();

function getCardPosition(absoluteIndex, offset = currentOffset) {
  const d = getSignedDistance(absoluteIndex, offset);
  const ad = Math.abs(d);
  const sgn = d >= 0 ? 1 : -1;
  const { center, adjacent, far } = getAxisSizes();
  const gap = getCurrentGap(); // Simple - just one gap value

  const posAt = (n) => {
    if (n === 0) return 0;
    if (n === 1) return sgn * (center/2 + gap + adjacent/2);
    if (n === 2) return sgn * (center/2 + gap + adjacent + gap + far/2);
    return sgn * (center/2 + gap + adjacent + gap + far/2 + (n - 2) * (far + gap));
  };

  const n0 = Math.floor(ad), n1 = Math.ceil(ad), t = ad - n0;
  return posAt(n0) + (posAt(n1) - posAt(n0)) * t;
}

function getDimsFromDistance(ad) {
  if (ad < 0.5) {
    // Center image
    if (zoomActive()) return { width: 748, height: 437, opacity: 1, yOffset: 0, shadow: true };
    return isMobile
      ? { width: 300, height: 376, opacity: 1, yOffset: 0, shadow: true }  // Mobile center
      : { width: 328, height: 437, opacity: 1, yOffset: 0, shadow: true };  // Desktop center
  } else if (ad < 1.5) {
    // Adjacent images (±1)
    return isMobile
      ? { width: 240, height: 300, opacity: 0.4, yOffset: 0, shadow: false }  // Mobile adjacent
      : { width: 328, height: 437, opacity: 0.9, yOffset: 0, shadow: false };  // Desktop adjacent
  }
  // Far images (±2, ±3, etc.)
  return isMobile
    ? { width: 240, height: 300, opacity: 0.15, yOffset: 0, shadow: false }  // Mobile far
    : { width: 328, height: 437, opacity: 0.9, yOffset: 0, shadow: false };  // Desktop far
}

// ===== DOM BUILD =====
function createSlideHTML(slide, dimensions) {
  const rounded = dimensions.shadow ? (isMobile ? 20.577 : 27.436) : 13.718;
  const shadowStyle = dimensions.shadow ? CENTER_SHADOW : SOFT_SHADOW;
  const bgColor = slide.bgColor || '#e0e0e0';

  return `
    <div class="slide-card" style="border-radius:${rounded}px;box-shadow:${shadowStyle};background:${bgColor};">
      <img alt="${slide.label}" class="slide-card-single-img"
           style="display:block;width:100%;height:100%;object-fit:cover;border-radius:${rounded}px;object-position:50% 50%;"
           loading="eager" decoding="async" fetchpriority="high"
           src="${slide.images[0]}">
      <div class="slide-card-label-wrapper">
        <div class="slide-card-label">
          <div class="slide-card-label-text"><p>${slide.label}</p></div>
        </div>
      </div>
    </div>
  `;
}

function initCarousel() {
  log('🔄 Initializing carousel');
  sliderTrack = q('slider-track');
  if (!sliderTrack) { console.error('❌ Slider track not found!'); return; }

  sliderTrack.innerHTML = '';
  slideElements = [];

  // Preconnect + DNS prefetch for fastest image loading
  if (!document.querySelector('link[rel="preconnect"][href*="pixelbin.io"]')) {
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://cdn.pixelbin.io';
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);

    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = 'https://cdn.pixelbin.io';
    document.head.appendChild(dnsPrefetch);
  }

  // Preloading is handled in init() - no need to duplicate here

  slides.forEach((slide, idx) => {
    const dist0 = Math.abs(getSignedDistance(idx, 0));
    const dims = getDimsFromDistance(dist0);

    const wrapper = document.createElement('div');
    wrapper.className = 'slide-card-wrapper';
    wrapper.dataset.absoluteIndex = String(idx);
    wrapper.style.overflow = 'visible';

    const cardContainer = document.createElement('div');
    cardContainer.style.cssText = 'width:100%;height:100%;';
    cardContainer.innerHTML = createSlideHTML(slide, dims);

    wrapper.appendChild(cardContainer);
    sliderTrack.appendChild(wrapper);

    const slideCard = cardContainer.querySelector('.slide-card');
    const slideImage = cardContainer.querySelector('.slide-card-single-img');

    slideElements.push({ wrapper, cardContainer, slide, absoluteIndex: idx, slideCard, slideImage });

    if (slideImage) {
      slideImage.dataset.srcBase = slide.images[0];

      // Hero section - load all images eagerly for optimal LCP/FCP
      slideImage.loading = 'eager';
      slideImage.fetchPriority = dist0 < 0.5 ? 'high' : 'auto';
      slideImage.src = variant(slideImage.dataset.srcBase, 450, 300);
      slideImage.decode().catch(() => {});
    }
  });

  currentOffset = 0;
  setMode('auto');
  requestUpdate();
  setTimeout(updatePrompt, 100);
  scheduleSyncBackend();
}

function updatePositions_now() {
  slideElements.forEach(({ wrapper, slideCard, slideImage, absoluteIndex }) => {
    const ad = Math.abs(getSignedDistance(absoluteIndex, currentOffset));
    const position = getCardPosition(absoluteIndex, currentOffset);
    const isVisible = ad <= 3.5;
    const dimensions = getDimsFromDistance(ad);
    const isCenter = ad < 0.5;

    // Mark center slide for gradient overlay
    wrapper.setAttribute('data-is-center', String(isCenter));

    // Set dimensions - let CSS transitions handle the animation
    wrapper.style.overflow = 'visible';
    wrapper.style.width = dimensions.width + 'px';
    wrapper.style.height = dimensions.height + 'px';
    wrapper.style.opacity = currentMode === 'user' && ad > 1.5 ? '0.4' : String(dimensions.opacity);
    wrapper.style.visibility = isVisible ? 'visible' : 'hidden';
    wrapper.style.zIndex = String(1000 - Math.round(ad * 10));

    // Use content-visibility for far slides to reduce rendering cost (CLS/TBT optimization)
    wrapper.style.contentVisibility = ad > 2 ? 'auto' : 'visible';
    // Optimize compositing for center and adjacent slides
    wrapper.style.willChange = ad < 1.5 ? 'transform, width, height' : '';

    if (isMobile) {
      wrapper.style.bottom = '';
      wrapper.style.top = '50%';
      wrapper.style.left = '50%';
      wrapper.style.transform = `translate3d(-50%, calc(-50% + ${position}px), 0)`;
    } else {
      wrapper.style.left = '50%';
      wrapper.style.bottom = '0';
      wrapper.style.top = '';
      wrapper.style.transform = `translate3d(${position}px, 0, 0) translateX(-50%)`;
    }

    if (slideCard) {
      const shadowStyle = currentMode === 'user' ? (ad < 0.5 ? CENTER_SHADOW : LITE_SHADOW)
        : (dimensions.shadow ? CENTER_SHADOW : SOFT_SHADOW);
      slideCard.style.borderRadius = '24px';
      slideCard.style.boxShadow = shadowStyle;
      // Optimize GPU acceleration - only hint will-change for actively animating slides
      slideCard.style.willChange = ad < 1.5 ? 'transform, opacity' : '';
      slideCard.style.transformOrigin = '50% 50%'; // Always center to prevent cutoff
      slideCard.style.transform = `scale(${(zoomActive() && ad < 0.5) ? FOCUS_SCALE : 1})`;
    }

    if (slideImage) {
      slideImage.style.borderRadius = '24px';
      slideImage.style.objectPosition = '50% 50%'; // Always center, no offset
    }
  });

  const currIdx = Math.round(currentOffset);
  if (currIdx !== _lastRoundedIndex) {
    _lastRoundedIndex = currIdx;
    // Clear carousel images when slide changes to prevent confusion
    window.searchFeature?.clearImages('carousel');
    lastInjectedSlideId = null; // Allow re-injection on new slide
    updatePrompt();
  }
}

// ===== NAVIGATION =====
function smoothSnapTo(targetOffset) {
  if (snapRaf) cancelAnimationFrame(snapRaf);
  isSnapping = true;
  setMode('snapping');

  const start = performance.now(), from = currentOffset, delta = targetOffset - from;
  const tick = (now) => {
    const k = Math.min(1, (now - start) / SNAP_DURATION);
    // Smooth cubic-bezier easing (0.4, 0, 0.2, 1)
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    currentOffset = from + delta * e;
    requestUpdate();

    if (k < 1) {
      snapRaf = requestAnimationFrame(tick);
    } else {
      isSnapping = false;
      currentOffset = targetOffset;
      setMode('auto');
      setUserActive(false);
      requestUpdate();
      updatePrompt();
    }
  };
  snapRaf = requestAnimationFrame(tick);
}

function nextSlide() {
  injectToken++;
  stopTypewriter(); // Stop typewriter when navigating
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;
  // Clear carousel images when changing slides to prevent confusion
  window.searchFeature?.clearImages('carousel');
  lastInjectedSlideId = null; // Allow re-injection on new slide
  smoothSnapTo(Math.round(currentOffset) + 1);
  log(`➡️ Next`);
}

function prevSlide() {
  injectToken++;
  stopTypewriter(); // Stop typewriter when navigating
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;
  // Clear carousel images when changing slides to prevent confusion
  window.searchFeature?.clearImages('carousel');
  lastInjectedSlideId = null; // Allow re-injection on new slide
  smoothSnapTo(Math.round(currentOffset) - 1);
  log(`⬅️ Prev`);
}

function handleResize() {
  const wasMobile = isMobile;
  isMobile = window.innerWidth < 768;
  if (wasMobile !== isMobile) {
    isFocusZoomed = false;
    const keep = Math.round(currentOffset);
    initCarousel();
    currentOffset = keep;
    requestUpdate();
    const track = q('slider-track');
    if (track) track.style.cursor = isMobile ? '' : 'grab';
  } else {
    requestUpdate();
  }
}

// ===== AUTO-ROTATION =====
function startRotation() {
  if (autoInterval || isUserActive) return;
  autoInterval = setInterval(() => {
    if (!isUserActive && !isSnapping && !isDragging) {
      setMode('auto');
      currentOffset = Math.round(currentOffset) + 1;
      requestUpdate();
      updatePrompt();
    }
  }, ROTATION_DELAY);
  log('▶️ Auto started');
}

function pauseRotation() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
    log('⏸️ Auto paused');
  }
}

function setUserActive(active) {
  isUserActive = active;
  if (active) pauseRotation();
  else setTimeout(() => {
    if (!isUserActive && !isDragging && !userHasTakenControl && !hasUserOwnedImages()) startRotation();
  }, 500);
}

// ===== PROMPT MANAGEMENT =====
function stopTypewriter() {
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  typewriterIndex = 0;
  typewriterTargetPrompt = '';
  // Notify that typewriter stopped
  if (window.searchFeature?.setTypewriterActive) {
    window.searchFeature.setTypewriterActive(false);
  }
}

function startTypewriter(fullPrompt) {
  stopTypewriter();

  if (!window.searchFeature || !fullPrompt) return;

  typewriterTargetPrompt = fullPrompt;
  typewriterIndex = 0;

  // Notify that typewriter is active
  if (window.searchFeature?.setTypewriterActive) {
    window.searchFeature.setTypewriterActive(true);
  }

  // Clear current prompt
  window.searchFeature.setPrompt('');

  // Type one character at a time
  typewriterInterval = setInterval(() => {
    if (typewriterIndex >= typewriterTargetPrompt.length) {
      stopTypewriter();

      // Auto-scroll after 5 seconds with smooth animation
      setTimeout(() => {
        const textArea = q('textArea');
        if (textArea) {
          textArea.scrollTo({
            top: textArea.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 5000); // Wait 5000ms (5 seconds) after typing completes
      return;
    }

    typewriterIndex++;
    const currentText = typewriterTargetPrompt.substring(0, typewriterIndex);
    window.searchFeature.setPrompt(currentText, true); // Pass true to indicate typewriter mode
  }, 30); // 30ms per character for smooth typing
}

function updatePrompt() {
  if (!window.searchFeature) return;
  const active = document.activeElement;

  // If user is focused on textarea, don't update prompt
  if (active && active.id === 'textArea') return;

  const currentSlide = getCurrentSlide();
  const fullPrompt = prompts[currentSlide.label];
  if (!fullPrompt) return;

  storedPrompt = fullPrompt;

  // Use typewriter effect during auto-rotation (when not focused)
  if (!isUserActive && !userHasTakenControl) {
    startTypewriter(fullPrompt);
  } else {
    // Show full prompt immediately if user is active
    stopTypewriter();
    window.searchFeature.setPrompt(fullPrompt);
  }
}

function expandPrompt() {
  // Show full prompt immediately (no typewriter on focus)
  stopTypewriter();
  if (!storedPrompt) return;
  window.searchFeature?.setPrompt(storedPrompt);
}

function handleUserInput(value) {
  if (!storedPrompt || userHasTakenControl) return;
  if (value !== undefined && value.length > 0 && value !== storedPrompt) {
    userHasTakenControl = true;
    stopTypewriter(); // Stop typewriter when user starts typing
  }
}

// ===== MODE SWITCHING (Legacy - kept for compatibility but always multi-line) =====
function switchToMultiline() {
  setUserActive(true);
  pauseRotation();
  isFocusZoomed = !isMobile; // Keep zoom active when not on mobile
  suppressNextBlur = true;

  // Always multi-line - just update prompt and focus
  const textArea = q('textArea');

  if (storedPrompt && window.searchFeature && !userHasTakenControl) {
    window.searchFeature.setPrompt(storedPrompt);
  }

  if (textArea) {
    textArea.focus({ preventScroll: true });
    const end = textArea.value.length;
    try { textArea.setSelectionRange(end, end); } catch {}
  }

  requestUpdate();
}

function switchToSingleLine() {
  // No longer used - always multi-line
  // Keep carousel in normal zoom when user has taken control
  isFocusZoomed = !userHasTakenControl && !isMobile;

  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }

  setUserActive(false);
  requestUpdate();
}

// ===== IMAGE INTEGRATION =====
async function addCurrentSlideImage() {
  const currentSlide = getCurrentSlide();
  const imageUrl = (currentSlide?.injectUrl || '').trim();
  if (!imageUrl) return;

  const slideKey = currentSlide.label.toLowerCase().replace(/\s+/g, '-');
  if (hasCarouselImage(imageUrl, slideKey)) return;
  if (injectionInProgress || lastInjectedSlideId === currentSlide.id) return;

  injectionInProgress = true;
  lastInjectedSlideId = currentSlide.id;

  try {
    if (!userHasTakenControl) window.searchFeature?.clearImages('carousel');
    await window.searchFeature?.setExternalImage(imageUrl, slideKey);
    const addBtn = q('addButton');
    if (addBtn) { addBtn.disabled = false; addBtn.ariaDisabled = 'false'; }
    scheduleSyncBackend(); // Always multi-line, always sync
    // Don't call switchToMultiline() - keeps auto-rotation active
  } finally {
    injectionInProgress = false;
  }
}

// ===== DESKTOP DRAG =====
function beginDesktopDrag(e) {
  if (isMobile) return;
  if (!isUserActive) setUserActive(true);
  if (isSnapping && snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; isSnapping = false; }

  isDragging = true;
  setMode('user');
  dragStartX = getClientX(e);
  dragStartOffset = currentOffset;

  const track = q('slider-track');
  if (track) track.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';

  window.addEventListener('pointermove', onDesktopDragMove, { passive: false });
  window.addEventListener('pointerup', endDesktopDrag, { passive: false, once: true });
  window.addEventListener('pointercancel', endDesktopDrag, { passive: false, once: true });
}

function onDesktopDragMove(e) {
  if (!isDragging || isMobile || (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return;
  e.preventDefault();
  currentOffset = dragStartOffset + pxToOffset(getClientX(e) - dragStartX);
  requestUpdate();
}

function endDesktopDrag() {
  if (!isDragging) return;
  isDragging = false;
  window.removeEventListener('pointermove', onDesktopDragMove);
  const track = q('slider-track');
  if (track) track.style.cursor = 'grab';
  document.body.style.userSelect = '';
  smoothSnapTo(Math.round(currentOffset));
  setTimeout(() => {
    setUserActive(false);
    // Re-enable zoom after dragging stops (if user hasn't taken control)
    if (!userHasTakenControl) {
      isFocusZoomed = !isMobile;
      requestUpdate();
    }
  }, 300);
}

// ===== EVENTS =====
function setupEventHandlers() {
  const textArea = q('textArea');

  if (textArea) {
    textArea.addEventListener('focus', () => {
      setUserActive(true); // This pauses auto-rotation
      pauseRotation(); // Explicitly pause when user focuses
      // Always multi-line, enable zoom
      isFocusZoomed = !isMobile;
      requestUpdate(); // Immediately update dimensions when zoom changes

      if (!userHasTakenControl) {
        expandPrompt();
        if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

        const slideIdAtFocus = getCurrentSlide()?.id;
        const myToken = ++injectToken;

        pendingInjectTimeout = setTimeout(() => {
          if (myToken !== injectToken || getCurrentSlide()?.id !== slideIdAtFocus) return;
          const userHasImgs = hasUserOwnedImages();
          const anyThumbs = getUIImageURLs().length > 0;

          // Always multi-line, inject if no user images
          if (!userHasImgs && !anyThumbs) addCurrentSlideImage();
          requestUpdate();
        }, 80);
      }
    });

    textArea.addEventListener('blur', (e) => {
      if (suppressNextBlur) return;
      const container = q('searchContainer'), addBtn = q('addButton'), genBtn = q('generateButton');
      const rt = e.relatedTarget;
      const focusStayedInside = (rt && container && isInside(container, rt)) ||
        (rt && addBtn && isInside(addBtn, rt)) || (rt && genBtn && isInside(genBtn, rt));

      if (!focusStayedInside) {
        setUserActive(false);
        // Keep zoom active even on blur (always multi-line)
        isFocusZoomed = !isMobile && !userHasTakenControl;
        requestUpdate();
        injectToken++;
        if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

        // Clear carousel images when defocusing to allow clean auto-rotation
        if (!userHasTakenControl) {
          window.searchFeature?.clearImages('carousel');
          lastInjectedSlideId = null; // Allow re-injection on next focus
        }

        // Resume auto-rotation if user hasn't taken control
        if (!userHasTakenControl && !hasUserOwnedImages()) {
          setTimeout(() => {
            if (!isUserActive && !userHasTakenControl) {
              startRotation();
            }
          }, 500);
        }
      }
    });

    textArea.addEventListener('input', (e) => handleUserInput(e.target.value));
    textArea.addEventListener('click', () => {
      setUserActive(true); // Mark user as active
      pauseRotation(); // Pause auto-rotation on click

      if (!userHasTakenControl) {
        expandPrompt();
        if (hasUserOwnedImages()) return;
        injectToken++;
        if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
        addCurrentSlideImage();
      }
    });
  }

  [q('addButton'), q('generateButton')].filter(Boolean).forEach(button => {
    button.setAttribute('tabindex', '0');
    button.addEventListener('click', () => {
      setUserActive(true);
      pauseRotation(); // Pause when user clicks buttons
      setTimeout(() => setUserActive(false), 3000);
    });
  });

  const searchContainer = q('searchContainer');
  if (searchContainer) {
    searchContainer.addEventListener('mouseenter', () => { if (!isUserActive) pauseRotation(); });
    searchContainer.addEventListener('mouseleave', () => {
      if (!isUserActive) setTimeout(() => { if (!isUserActive) startRotation(); }, 500);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (isUserActive) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); setUserActive(true); prevSlide(); setTimeout(() => setUserActive(false), 1000); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setUserActive(true); nextSlide(); setTimeout(() => setUserActive(false), 1000); }
  });

  window.addEventListener('resize', handleResize);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSyncBackend(); // Always multi-line
  });

  // Wheel scroll - optimized for INP
  const wheelSurface = q('slider-track');
  if (wheelSurface) {
    let wheelV = 0, wheelRAF = null, wheelAnimating = false, lastWheelTime = 0;
    const WHEEL_SENSITIVITY = 0.008, WHEEL_FRICTION = 0.88, WHEEL_MIN_V = 0.005, WHEEL_TIMEOUT = 150, SNAP_THRESHOLD = 0.15;
    let wheelTimeout = null, wheelDebounceTimer = null;

    wheelSurface.addEventListener('wheel', (e) => {
      const absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
      const horizontalIntent = absX > absY * 1.2 || (absX > 0 && absY === 0);
      const useShiftAsHorizontal = e.shiftKey && absX < absY;
      if (!horizontalIntent && !useShiftAsHorizontal) return;

      e.preventDefault();

      // Debounce non-critical updates for better INP
      if (wheelDebounceTimer) clearTimeout(wheelDebounceTimer);
      wheelDebounceTimer = setTimeout(() => {
        setUserActive(true);
        // Temporarily disable zoom while scrolling
        isFocusZoomed = false;
        requestUpdate();
      }, 16);

      lastWheelTime = performance.now();

      if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
      if (isSnapping && snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; isSnapping = false; }
      setMode('user');

      const dx = useShiftAsHorizontal ? e.deltaY : e.deltaX;
      if (!dx) return;

      wheelV = dx * WHEEL_SENSITIVITY;

      if (!wheelAnimating) {
        wheelAnimating = true;
        const step = () => {
          currentOffset += wheelV;
          requestUpdate();
          wheelV *= WHEEL_FRICTION;

          if (Math.abs(wheelV) < WHEEL_MIN_V) {
            wheelAnimating = false;
            const nearest = Math.round(currentOffset);
            if (Math.abs(currentOffset - nearest) < SNAP_THRESHOLD || performance.now() - lastWheelTime > WHEEL_TIMEOUT) {
              smoothSnapTo(nearest);
              setTimeout(() => {
                setUserActive(false);
                // Re-enable zoom after small scroll completes
                if (!userHasTakenControl) {
                  isFocusZoomed = !isMobile;
                  requestUpdate();
                }
              }, 300);
              return;
            }
          }
          wheelRAF = requestAnimationFrame(step);
        };
        wheelRAF = requestAnimationFrame(step);
      }

      wheelTimeout = setTimeout(() => {
        if (wheelAnimating) {
          wheelAnimating = false;
          if (wheelRAF) { cancelAnimationFrame(wheelRAF); wheelRAF = null; }
          smoothSnapTo(Math.round(currentOffset));
          setTimeout(() => {
            setUserActive(false);
            // Re-enable zoom after scrolling stops (if user hasn't taken control)
            if (!userHasTakenControl) {
              isFocusZoomed = !isMobile;
              requestUpdate();
            }
          }, 300);
        }
      }, WHEEL_TIMEOUT);
    }, { passive: false });

    if (!isMobile) wheelSurface.style.cursor = 'grab';
    wheelSurface.addEventListener('pointerdown', (e) => {
      if (isMobile || (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return;
      const active = document.activeElement;
      if (active && active.id === 'textArea') return; // Don't drag if textarea is focused
      beginDesktopDrag(e);
    }, { passive: true });
  }
}

// ===== INIT + API =====
function init() {
  log('🏁 Initializing...');

  // Preload hero images for instant display (optimize LCP/FCP)
  slides.forEach((slide, idx) => {
    if (idx < 3) { // Preload first 3 slides for immediate smooth experience
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = variant(slide.images[0], 450, 300);
      link.fetchPriority = idx === 0 ? 'high' : 'auto';
      document.head.appendChild(link);
    }
  });

  proxyBackend();
  initCarousel();
  setupEventHandlers();
  setTimeout(startRotation, 1000);
  log('🎉 Complete!');
}

window.aiPhotoCarousel = {
  next: nextSlide,
  prev: prevSlide,
  getCurrentSlide,
  pauseRotation,
  startRotation,
  expandPrompt,
  clearImages: (scope = 'all') => {
    const sec = getImagesSection();
    if (!sec) return;
    sec.querySelectorAll('.image-thumbnail').forEach(thumb => {
      if (scope === 'carousel' ? thumb.dataset.source === 'carousel' : true) thumb.remove();
    });
    if (!sec.querySelector('.image-thumbnail')) sec.classList.add('hidden');
    if (scope === 'carousel' || scope === 'all') {
      lastInjectedSlideId = null;
      injectionInProgress = false;
    }
    scheduleSyncBackend();
  },
  setUserActive,
  setInjectUrlForSlide(id, url) {
    const s = slides.find(x => x.id === id);
    if (s) s.injectUrl = (url || '').trim();
  },
  markUserUpload(url) {
    userHasTakenControl = true;
    // Don't clear images or sync - homepage.js already handled the user upload
    pauseRotation();
    isFocusZoomed = false; // Disable zoom when user uploads
    requestUpdate();
    // Don't call scheduleSyncBackend() - it would convert the user's File to an external URL
  },
  resetCarouselLandscape() {
    // Reset carousel to normal landscape without resuming rotation (user is in control)
    isFocusZoomed = false; // Disable zoom
    userHasTakenControl = true;
    pauseRotation();
    requestUpdate();
  },
  resetAfterImageRemoval() {
    // Reset carousel state when user removes all images
    userHasTakenControl = false;
    isFocusZoomed = !isMobile; // Re-enable zoom (always multi-line)
    requestUpdate();
    // Resume auto-rotation - always multi-line, always can resume
    if (!hasUserOwnedImages()) {
      startRotation();
    }
  },
  getStoredPrompt: () => storedPrompt,
  clearStoredPrompt() {
    // Clear stored prompt when carousel image is removed
    storedPrompt = '';
  },
  markUserInControl() {
    // Mark that user has taken control and carousel should not interfere
    userHasTakenControl = true;
    setUserActive(true);
    pauseRotation();
  },
  resetAfterCarouselImageRemoval() {
    // Reset carousel state when carousel image is removed
    // DON'T reset lastInjectedSlideId - prevents re-injection of same image on refocus
    // User must change slides or manually scroll to get a new injection
    userHasTakenControl = false;
    storedPrompt = '';
    injectionInProgress = false;
    isFocusZoomed = !isMobile; // Keep zoom active (always multi-line)
    setUserActive(false);
    requestUpdate();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
