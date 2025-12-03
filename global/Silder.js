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
const ROTATION_DELAY = 5000; // Time between auto-rotations
const SNAP_DURATION = 1000; // Carousel snap animation duration (matches CSS transitions)
const FOCUS_TRANSITION_MS = 750; // Focus transition timing
const FOCUS_SCALE = 1; // No zoom effect
const CENTER_SHADOW = '1px 18px 10px #8543ff08, 1px 3px 4px #630fff0a';
const SOFT_SHADOW = '3px 6px 7px #630fff08, 1px 2px 4px #630fff0a';
const LITE_SHADOW = '0 1px 2px rgba(0,0,0,0.08)';

// Configuration
const MANUAL_SCROLL = false; // Set to true to enable manual wheel scrolling

// Simple gap system - just one value to control spacing
const GAP_NORMAL = 12;      // Gap when not zoomed (user uploaded image)
const GAP_ZOOMED = 12;      // Gap when zoomed (default state)
const GAP_MOBILE = 100;     // Gap for mobile devices - increased to prevent overlap

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
  // First check if userHasTakenControl is true (most reliable)
  if (userHasTakenControl) return true;

  // Then check DOM as fallback
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
    // Zoomed: use actual rendered widths for correct positioning
    if (zoomActive()) {
      return { center: 748, adjacent: 328, far: 328 };
    }
    // Not zoomed: normal sizes
    return { center: 328, adjacent: 328, far: 328 };
  }
  // Mobile sizes
  return { center: 328, adjacent: 328, far: 328 };
}

// Simplified - just get the gap based on zoom state and device
const getCurrentGap = () => {
  if (isMobile) return GAP_MOBILE;
  return zoomActive() ? GAP_ZOOMED : GAP_NORMAL;
};

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
    if (zoomActive()) return { width: 748, height: 437, opacity: 1, yOffset: 0, shadow: true };
    return isMobile
      ? { width: 328, height: 376, opacity: 1, yOffset: 0, shadow: true }  // Reduced from 360x451 to fit 320px screens
      : { width: 328, height: 437, opacity: 1, yOffset: 0, shadow: true };
  } else if (ad < 1.5) {
    return isMobile
      ? { width: 328, height: 437, opacity: 0.3, yOffset: 0, shadow: false }  // Adjacent images at -1 and +1 position
      : { width: 328, height: 437, opacity: 0.9, yOffset: 0, shadow: false };
  }
  return isMobile
    ? { width: 328, height: 437, opacity: 0.5, yOffset: 0, shadow: false }  // Reduced opacity from 0.2 to 0.15 for better text visibility
    : { width: 328, height: 437, opacity: 0.5, yOffset: 0, shadow: false };  // Reduced opacity from 0.2 to 0.15 for better text visibility
}

// ===== DOM BUILD =====
function createSlideHTML(slide, dimensions) {
  const rounded = dimensions.shadow ? (isMobile ? 20.577 : 27.436) : 13.718;
  const shadowStyle = dimensions.shadow ? CENTER_SHADOW : SOFT_SHADOW;
  const bgGradient = slide.bgColor || 'linear-gradient(135deg, rgba(79, 0, 158, 0.08) 0%, rgba(79, 0, 158, 0.04) 50%, rgba(79, 0, 158, 0.01) 100%)';

  return `
    <div class="slide-card" style="border-radius:${rounded}px;box-shadow:${shadowStyle};background:${bgGradient};">
      <img alt="${slide.label}" class="slide-card-single-img"
           style="display:block;width:100%;height:100%;object-fit:cover;border-radius:${rounded}px;object-position:50% 50%;opacity:0;transition:opacity 250ms ease-out;"
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

      // Smart loading strategy for performance
      // Center + Adjacent (±1): eager + high priority for smooth transitions
      // Far slides (±2+): lazy load to save bandwidth
      if (dist0 < 1.5) {
        slideImage.loading = 'eager';
        slideImage.fetchPriority = 'high'; // High priority for both center and adjacent
      } else {
        slideImage.loading = 'lazy';
        slideImage.fetchPriority = 'auto';
      }

      // Natural fade-in when image loads
      if (slideImage.complete) {
        slideImage.classList.add('loaded');
        slideImage.style.opacity = '1';
      } else {
        slideImage.addEventListener('load', () => {
          slideImage.classList.add('loaded');
          slideImage.style.opacity = '1';
        }, { once: true });
      }
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

    // Add/remove hover listeners for center slide to pause auto-rotation
    if (isCenter && !wrapper.dataset.hoverListenerAdded) {
      wrapper.dataset.hoverListenerAdded = 'true';
      wrapper.addEventListener('mouseenter', () => {
        if (!isUserActive && !userHasTakenControl) {
          pauseRotation();
        }
      });
      wrapper.addEventListener('mouseleave', () => {
        if (!isUserActive && !userHasTakenControl && !hasUserOwnedImages()) {
          // Resume rotation with immediate slide when mouse leaves
          if (!isUserActive && !userHasTakenControl) {
            startRotation(true);
          }
        }
      });
    }

    // Set dimensions - let CSS transitions handle the animation
    wrapper.style.overflow = 'visible';
    wrapper.style.width = dimensions.width + 'px';
    wrapper.style.height = dimensions.height + 'px';
    wrapper.style.opacity = currentMode === 'user' && ad > 1.5 ? '0.4' : String(dimensions.opacity);
    wrapper.style.visibility = isVisible ? 'visible' : 'hidden';
    // Smoother z-index calculation - use finer granularity to prevent overlapping during transitions
    wrapper.style.zIndex = String(1000 - Math.floor(ad * 100));

    // Use content-visibility for far slides to reduce rendering cost (CLS/TBT optimization)
    wrapper.style.contentVisibility = ad > 2 ? 'auto' : 'visible';
    // Optimize compositing for center and adjacent slides
    wrapper.style.willChange = ad < 1.5 ? 'transform, width, height, opacity' : '';

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
    // Only clear carousel images when slide changes if user hasn't taken control
    // Don't clear during injection to prevent thumbnails from disappearing
    if (!userHasTakenControl && !injectionInProgress) {
      window.searchFeature?.clearImages('carousel');
      lastInjectedSlideId = null; // Allow re-injection on new slide
    }
    // Don't call updatePrompt here - let smoothSnapTo handle it after CSS transitions complete
  }
}

// ===== NAVIGATION =====
function smoothSnapTo(targetOffset) {
  if (snapRaf) cancelAnimationFrame(snapRaf);
  isSnapping = true;
  setMode('snapping');

  // Clear old prompt immediately when carousel starts moving
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  typewriterIndex = 0;
  typewriterTargetPrompt = '';
  // Clear the input immediately
  if (window.searchFeature && !isUserActive && !userHasTakenControl) {
    window.searchFeature.setPrompt('', true);
  }

  const start = performance.now(), from = currentOffset, delta = targetOffset - from;
  const tick = (now) => {
    const k = Math.min(1, (now - start) / SNAP_DURATION);
    // Luxurious ease-out easing for wow effect - starts fast, ends smooth
    const e = 1 - Math.pow(1 - k, 3);
    currentOffset = from + delta * e;
    requestUpdate();

    if (k < 1) {
      snapRaf = requestAnimationFrame(tick);
    } else {
      // Smoothly set final position - no jarring snap
      currentOffset = targetOffset;
      requestUpdate(); // One final smooth update

      // CSS transitions run in parallel with JS snap (both 1000ms)
      // When snap completes, CSS is also complete - start typing immediately
      // Use requestAnimationFrame for one frame delay to ensure rendering is complete
      requestAnimationFrame(() => {
        isSnapping = false; // Now safe to allow prompt updates
        if (!isUserActive && !userHasTakenControl) {
          updatePrompt();
        }
      });
    }
  };
  snapRaf = requestAnimationFrame(tick);
}

function nextSlide() {
  injectToken++;
  stopTypewriter(); // Stop typewriter when navigating
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;
  // Only clear carousel images if user hasn't taken control and not injecting
  if (!userHasTakenControl && !injectionInProgress) {
    window.searchFeature?.clearImages('carousel');
    lastInjectedSlideId = null; // Allow re-injection on new slide
  }
  smoothSnapTo(Math.round(currentOffset) + 1);
  log(`➡️ Next`);
}

function prevSlide() {
  injectToken++;
  stopTypewriter(); // Stop typewriter when navigating
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;
  // Only clear carousel images if user hasn't taken control and not injecting
  if (!userHasTakenControl && !injectionInProgress) {
    window.searchFeature?.clearImages('carousel');
    lastInjectedSlideId = null; // Allow re-injection on new slide
  }
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
function startRotation(slideImmediately = false) {
  if (autoInterval || isUserActive) return;

  // Only slide immediately when resuming (blur/hover), not on page load
  if (slideImmediately && !isUserActive && !isSnapping && !isDragging) {
    setMode('auto');
    const target = Math.round(currentOffset) + 1;
    smoothSnapTo(target);
    // updatePrompt will be called by smoothSnapTo after snap completes
  }

  // Then continue with regular intervals
  autoInterval = setInterval(() => {
    if (!isUserActive && !isSnapping && !isDragging) {
      setMode('auto');
      const target = Math.round(currentOffset) + 1;
      smoothSnapTo(target);
      // updatePrompt will be called by smoothSnapTo after snap completes
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
  }, 20);
}

// ===== PROMPT MANAGEMENT =====
function stopTypewriter() {
  // If typewriter was running, show the FULL prompt immediately
  const wasTyping = typewriterInterval !== null;
  const fullPrompt = typewriterTargetPrompt;

  // Show full prompt FIRST before clearing anything
  if (wasTyping && fullPrompt && window.searchFeature) {
    console.log('[SILDER] Stopping typewriter, setting full prompt:', fullPrompt.substring(0, 50) + '...');
    window.searchFeature.setPrompt(fullPrompt);
  }

  // THEN clear the typewriter state
  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  typewriterIndex = 0;
  typewriterTargetPrompt = '';

  // NOTE: Don't call setTypewriterActive(false) here to avoid circular calls
  // The caller (promtbox.js) already set state.isTypewriterActive = false
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

  // Don't update prompt while carousel is snapping - wait for transition to complete
  if (isSnapping) return;

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

    // Keep injection flag true for a bit longer to protect during rendering
    await new Promise(resolve => setTimeout(resolve, 100));
  } finally {
    injectionInProgress = false;
  }
}

// ===== DESKTOP DRAG =====
function beginDesktopDrag(e) {
  if (isMobile) return;
  // Block dragging if user has taken control
  if (userHasTakenControl) return;

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

      // Only enable zoom if user hasn't uploaded their own image
      // If user has their own image, carousel dimensions should stay normal
      const userHasOwnImage = hasUserOwnedImages();
      isFocusZoomed = !isMobile && !userHasOwnImage;
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
        // Mark user as no longer active
        isUserActive = false;

        // If prompt is empty and no user images, reset user control
        const currentPrompt = window.searchFeature?.getLivePrompt?.() || '';
        if (!currentPrompt.trim() && !hasUserOwnedImages()) {
          userHasTakenControl = false;
        }

        // Only re-enable zoom if user doesn't have their own image
        const userHasOwnImage = hasUserOwnedImages();
        isFocusZoomed = !isMobile && !userHasTakenControl && !userHasOwnImage;
        requestUpdate();
        injectToken++;
        if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

        // Clear carousel images when defocusing to allow clean auto-rotation
        // Don't clear during injection to prevent thumbnails from disappearing
        if (!userHasTakenControl && !injectionInProgress) {
          window.searchFeature?.clearImages('carousel');
          lastInjectedSlideId = null; // Allow re-injection on next focus
        }

        // Start rotation with immediate first transition when defocusing
        setTimeout(() => {
          if (!isUserActive && !isDragging && !userHasTakenControl && !hasUserOwnedImages()) {
            startRotation(true);
          }
        }, 20);
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
    const WHEEL_SENSITIVITY = 0.004, WHEEL_FRICTION = 0.93, WHEEL_MIN_V = 0.002, WHEEL_TIMEOUT = 100, SNAP_THRESHOLD = 0.25;
    let wheelTimeout = null;

    wheelSurface.addEventListener('wheel', (e) => {
      // If manual scroll is disabled, don't handle wheel events
      if (!MANUAL_SCROLL) return;

      // Block wheel scrolling if user has taken control
      if (userHasTakenControl) return;

      const absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
      const horizontalIntent = absX > absY * 1.2 || (absX > 0 && absY === 0);
      const useShiftAsHorizontal = e.shiftKey && absX < absY;

      // Don't allow carousel navigation when input is focused - allow all scrolling
      if (window.searchFeature?.isInputFocused?.()) return;

      // If not horizontal intent, allow page scroll
      if (!horizontalIntent && !useShiftAsHorizontal) return;

      // Only prevent default when we're actually handling horizontal scroll
      e.preventDefault();

      // Set user active immediately to avoid flickering
      setUserActive(true);

      // Temporarily disable zoom while scrolling (do it once, not repeatedly)
      if (isFocusZoomed) {
        isFocusZoomed = false;
        requestUpdate();
      }

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

    // Set cursor based on user control state
    if (!isMobile) {
      wheelSurface.style.cursor = userHasTakenControl ? 'default' : 'grab';
    }
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
  stopTypewriter, // Expose stopTypewriter
  getFullPrompt: () => typewriterTargetPrompt || storedPrompt, // Get the full prompt
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
    if (!isSingleLineMode) scheduleSyncBackend();
  },
  setUserActive,
  setInjectUrlForSlide(id, url) {
    const s = slides.find(x => x.id === id);
    if (s) s.injectUrl = (url || '').trim();
  },
  markUserUpload() {
    stopTypewriter(); // Stop typewriter immediately when user uploads
    userHasTakenControl = true;
    // Don't clear images or sync - homepage.js already handled the user upload
    pauseRotation();
    isFocusZoomed = false; // Disable zoom when user uploads

    // Update cursor to default (not grabbable)
    const track = q('slider-track');
    if (track && !isMobile) track.style.cursor = 'default';

    requestUpdate();
    // Don't call scheduleSyncBackend() - it would convert the user's File to an external URL
  },
  resetCarouselLandscape() {
    // Reset carousel to normal landscape without resuming rotation (user is in control)
    isFocusZoomed = false; // Disable zoom
    userHasTakenControl = true;
    pauseRotation();

    // Update cursor to default (not grabbable)
    const track = q('slider-track');
    if (track && !isMobile) track.style.cursor = 'default';

    requestUpdate();
  },
  resetAfterImageRemoval() {
    // Reset carousel state when user removes all images
    userHasTakenControl = false;
    // Only re-enable zoom if user has removed all their images
    const stillHasUserImages = hasUserOwnedImages();
    isFocusZoomed = !isMobile && !stillHasUserImages;

    // Restore cursor to grab when user releases control
    const track = q('slider-track');
    if (track && !isMobile) track.style.cursor = 'grab';

    requestUpdate();
    // Resume auto-rotation only if no user images remain
    if (!stillHasUserImages) {
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
