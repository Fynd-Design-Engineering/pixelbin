/**
 * AI PHOTO EDITOR CAROUSEL - Delightfully Smooth & Lightweight
 */

const DEBUG = false;
const log = (...a) => DEBUG && console.log(...a);

console.log('✨ AI Photo Editor Carousel - Delightfully Smooth & Lightweight');

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
let dragVelocity = 0, lastDragX = 0, lastDragTime = 0, dragMomentumRAF = null;
let injectionInProgress = false, lastInjectedSlideId = null;
let isFocusZoomed = true, __frameScheduled = false;
let typewriterInterval = null, typewriterIndex = 0, typewriterTargetPrompt = '';

// ===== CONSTANTS =====
const ROTATION_DELAY = 5000;
const SNAP_DURATION = 650;
const DRAG_TRANSITION_MS = 0;
const FOCUS_TRANSITION_MS = 650;
const SIZE_TRANSITION_FAST_MS = 650;
const SIZE_TRANSITION_SMOOTH_MS = 350;
const FOCUS_SCALE = 1;
const CENTER_SHADOW = '1px 18px 10px #8543ff08, 1px 3px 4px #630fff0a';
const SOFT_SHADOW   = '3px 6px 7px #630fff08, 1px 2px 4px #630fff0a';
const LITE_SHADOW   = '0 1px 2px rgba(0,0,0,0.08)';

const EASE_OUT_EXPO   = 'cubic-bezier(0.19, 1, 0.22, 1)';
const EASE_OUT_QUAD   = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

const MANUAL_SCROLL = true;

const GAP_DESKTOP = 12;
const GAP_MOBILE = 100;
const SLIDE_WIDTH = 328;

// ===== MODES =====
let isSnapping = false, currentMode = 'auto', lastMode = null;

const setMode = (mode) => {
  currentMode = mode;
  if (lastMode === mode) return;
  lastMode = mode;

  const transformTime = mode === 'user' ? DRAG_TRANSITION_MS : FOCUS_TRANSITION_MS;
  const transformEasing = mode === 'user' ? 'linear' : EASE_OUT_EXPO;

  const sizeTime = mode === 'user' ? SIZE_TRANSITION_FAST_MS : SIZE_TRANSITION_SMOOTH_MS;
  const sizeEasing = mode === 'user' ? EASE_OUT_EXPO : EASE_OUT_QUAD;
  const sizeFade = `width ${sizeTime}ms ${sizeEasing}, height ${sizeTime}ms ${sizeEasing}, opacity ${sizeTime}ms ${sizeEasing}`;

  const trackTrans = `transform ${transformTime}ms ${transformEasing}, ${sizeFade}`;

  slideElements.forEach(({ wrapper, slideCard, slideImage }) => {
    if (wrapper) wrapper.style.transition = trackTrans;
    if (slideCard) wrapper && (slideCard.style.transition = `transform ${transformTime}ms ${transformEasing}`);
    if (slideImage) slideImage.style.transition = `object-position ${transformTime}ms ${transformEasing}, border-radius ${sizeTime}ms ${sizeEasing}`;
  });
};

// ===== UTILS =====
const q = (id) => document.getElementById(id);
const getImagesSection = () => q('imagesSection');
const zoomActive = () => !isMobile && isFocusZoomed;
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
  if (userHasTakenControl) return true;
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

const getCurrentGap = () => (isMobile ? GAP_MOBILE : GAP_DESKTOP);

const NOMINAL_STEP = () => {
  const gap = getCurrentGap();
  if (isMobile) return SLIDE_WIDTH + gap;
  return zoomActive() ? 550 : SLIDE_WIDTH + gap;
};

const pxToOffset = (deltaPx) => -deltaPx / NOMINAL_STEP();

function getCardPosition(absoluteIndex, offset = currentOffset) {
  const d = getSignedDistance(absoluteIndex, offset);
  const gap = getCurrentGap();

  if (isMobile) return d * (SLIDE_WIDTH + gap);

  if (!zoomActive()) return d * (SLIDE_WIDTH + gap);

  const absD = Math.abs(d);
  const sign = d >= 0 ? 1 : -1;

  const getInterpolatedWidth = (dist) => {
    const ad = Math.abs(dist);
    if (ad <= 0.5) return 748 - (748 - 328) * (ad / 0.5);
    return 328;
  };

  if (absD === 0) return 0;

  let position = 0;

  for (let i = 0; i < Math.floor(absD); i++) {
    const currentWidth = getInterpolatedWidth(i);
    const nextWidth = getInterpolatedWidth(i + 1);
    position += currentWidth / 2 + gap + nextWidth / 2;
  }

  const fractional = absD - Math.floor(absD);
  if (fractional > 0) {
    const currentWidth = getInterpolatedWidth(Math.floor(absD));
    const nextWidth = getInterpolatedWidth(Math.floor(absD) + 1);
    const stepSize = currentWidth / 2 + gap + nextWidth / 2;
    position += fractional * stepSize;
  }

  return position * sign;
}

function getDimsFromDistance(ad) {
  const baseHeight = isMobile ? 376 : 437;
  const opacity = isMobile ? (ad < 0.5 ? 1 : 0.1) : 1;

  if (ad < 0.5) {
    if (zoomActive()) return { width: 748, height: baseHeight, opacity, yOffset: 0, shadow: true };
    return { width: 328, height: baseHeight, opacity, yOffset: 0, shadow: true };
  }
  return { width: 328, height: baseHeight, opacity, yOffset: 0, shadow: false };
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

  slides.forEach((slide, idx) => {
    const dist0 = Math.abs(getSignedDistance(idx, 0));
    const dims = getDimsFromDistance(dist0);

    const wrapper = document.createElement('div');
    wrapper.className = 'slide-card-wrapper';
    wrapper.dataset.absoluteIndex = String(idx);
    wrapper.style.overflow = 'visible';

    // ✅ SINGLE click handler (no duplicates)
    wrapper.addEventListener('click', () => onSlideClickCenter(idx));

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

      if (dist0 < 1.5) {
        slideImage.loading = 'eager';
        slideImage.fetchPriority = 'high';
      } else {
        slideImage.loading = 'lazy';
        slideImage.fetchPriority = 'auto';
      }

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
    const isVisible = ad <= 5;
    const dimensions = getDimsFromDistance(ad);
    const isCenter = ad < 0.5;

    wrapper.setAttribute('data-is-center', String(isCenter));

    if (isCenter && !wrapper.dataset.hoverListenerAdded) {
      wrapper.dataset.hoverListenerAdded = 'true';
      wrapper.addEventListener('mouseenter', () => {
        if (!isUserActive && !userHasTakenControl) pauseRotation();
      });
      wrapper.addEventListener('mouseleave', () => {
        if (!isUserActive && !userHasTakenControl && !hasUserOwnedImages()) startRotation(false);
      });
    }

    wrapper.style.width = dimensions.width + 'px';
    wrapper.style.height = dimensions.height + 'px';
    wrapper.style.opacity = String(dimensions.opacity);
    wrapper.style.visibility = isVisible ? 'visible' : 'hidden';
    wrapper.style.zIndex = String(1000 - Math.floor(ad * 100));

    wrapper.style.contentVisibility = ad > 3 ? 'auto' : 'visible';
    wrapper.style.contain = ad > 2 ? 'layout style paint' : '';
    wrapper.style.willChange = ad < 2.5 ? 'transform, width, height, opacity' : '';

    if (isMobile) {
      wrapper.style.top = '50%';
      wrapper.style.left = '50%';
      wrapper.style.bottom = '';
      wrapper.style.transform = `translate3d(-50%, calc(-50% + ${position}px), 0)`;
    } else {
      wrapper.style.left = '50%';
      wrapper.style.bottom = '0';
      wrapper.style.top = '';
      wrapper.style.transform = `translate3d(${position}px, 0, 0) translateX(-50%)`;
    }

    if (slideCard) {
      const shadowStyle =
        currentMode === 'user'
          ? (ad < 0.5 ? CENTER_SHADOW : LITE_SHADOW)
          : (dimensions.shadow ? CENTER_SHADOW : SOFT_SHADOW);

      slideCard.style.borderRadius = '24px';
      slideCard.style.boxShadow = shadowStyle;
      slideCard.style.willChange = ad < 2.5 ? 'transform, opacity' : '';
      slideCard.style.transformOrigin = '50% 50%';
      slideCard.style.transform = `scale(${(zoomActive() && ad < 0.5) ? FOCUS_SCALE : 1})`;
    }

    if (slideImage) {
      slideImage.style.borderRadius = '24px';
      slideImage.style.objectPosition = '50% 50%';
    }
  });

  const currIdx = Math.round(currentOffset);
  if (currIdx !== _lastRoundedIndex) {
    _lastRoundedIndex = currIdx;
    if (!userHasTakenControl && !injectionInProgress) lastInjectedSlideId = null;
  }
}

// ===== CLICK-TO-CENTER =====
function snapToAbsoluteIndex(absIndex) {
  const d = getSignedDistance(absIndex, currentOffset);
  if (Math.abs(d) < 0.0001) return;
  smoothSnapTo(currentOffset + d);
}

function onSlideClickCenter(absIndex) {
  const active = document.activeElement;
  if (active && active.id === 'textArea') return;
  if (isSnapping || isDragging) return;

  injectToken++;
  stopTypewriter();

  if (pendingInjectTimeout) {
    clearTimeout(pendingInjectTimeout);
    pendingInjectTimeout = null;
  }

  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;

  if (!userHasTakenControl && !injectionInProgress) {
    window.searchFeature?.clearImages('carousel');
    lastInjectedSlideId = null;
  }

  // ✅ IMPORTANT: do NOT setUserActive(true) here (breaks typewriter path)
  pauseRotation();

  snapToAbsoluteIndex(absIndex);
}

// ===== NAVIGATION =====
function smoothSnapTo(targetOffset) {
  if (snapRaf) cancelAnimationFrame(snapRaf);
  isSnapping = true;
  setMode('snapping');

  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  typewriterIndex = 0;
  typewriterTargetPrompt = '';

  // Clear prompt immediately only when truly in "auto" context
  if (window.searchFeature && !isUserActive && !userHasTakenControl) {
    window.searchFeature.setPrompt('', true);
  }

  const start = performance.now(), from = currentOffset, delta = targetOffset - from;

  const tick = (now) => {
    const k = Math.min(1, (now - start) / SNAP_DURATION);

    let e;
    if (k === 1) e = 1;
    else if (k < 0.7) e = 1 - Math.pow(2, -12 * k);
    else {
      const t = (k - 0.7) / 0.3;
      const base = 1 - Math.pow(2, -12 * 0.7);
      e = base + (1 - base) * (1 - Math.pow(1 - t, 3));
    }

    currentOffset = from + delta * e;
    requestUpdate();

    if (k < 1) {
      snapRaf = requestAnimationFrame(tick);
    } else {
      currentOffset = targetOffset;
      requestUpdate();

      // ✅ Always update prompt after snap.
      // ✅ Also allow typewriter to run after click navigation.
      requestAnimationFrame(() => {
        isSnapping = false;

        const active = document.activeElement;
        const inputFocused = active && active.id === 'textArea';

        if (!inputFocused && !userHasTakenControl) {
          // enable typewriter branch in updatePrompt()
          isUserActive = false;
        }

        updatePrompt();
      });
    }
  };

  snapRaf = requestAnimationFrame(tick);
}

function nextSlide() {
  injectToken++;
  stopTypewriter();
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;
  if (!userHasTakenControl && !injectionInProgress) {
    window.searchFeature?.clearImages('carousel');
    lastInjectedSlideId = null;
  }
  smoothSnapTo(Math.round(currentOffset) + 1);
}

function prevSlide() {
  injectToken++;
  stopTypewriter();
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;
  if (!userHasTakenControl && !injectionInProgress) {
    window.searchFeature?.clearImages('carousel');
    lastInjectedSlideId = null;
  }
  smoothSnapTo(Math.round(currentOffset) - 1);
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
    if (track) track.style.cursor = isMobile ? '' : 'pointer';
  } else {
    requestUpdate();
  }
}

// ===== AUTO-ROTATION =====
function startRotation(slideImmediately = false) {
  if (autoInterval || isUserActive) return;

  if (slideImmediately && !isUserActive && !isSnapping && !isDragging) {
    setMode('auto');
    smoothSnapTo(Math.round(currentOffset) + 1);
  }

  autoInterval = setInterval(() => {
    if (!isUserActive && !isSnapping && !isDragging) {
      setMode('auto');
      smoothSnapTo(Math.round(currentOffset) + 1);
    }
  }, ROTATION_DELAY);
}

function pauseRotation() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
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
  const wasTyping = typewriterInterval !== null;
  const fullPrompt = typewriterTargetPrompt;

  if (wasTyping && fullPrompt && window.searchFeature) {
    window.searchFeature.setPrompt(fullPrompt);
  }

  if (typewriterInterval) {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
  }
  typewriterIndex = 0;
  typewriterTargetPrompt = '';
}

function startTypewriter(fullPrompt) {
  stopTypewriter();
  if (!window.searchFeature || !fullPrompt) return;

  typewriterTargetPrompt = fullPrompt;
  typewriterIndex = 0;

  if (window.searchFeature?.setTypewriterActive) {
    window.searchFeature.setTypewriterActive(true);
  }

  window.searchFeature.setPrompt('');

  typewriterInterval = setInterval(() => {
    if (typewriterIndex >= typewriterTargetPrompt.length) {
      stopTypewriter();
      setTimeout(() => {
        const textArea = q('textArea');
        if (textArea) {
          textArea.scrollTo({ top: textArea.scrollHeight, behavior: 'smooth' });
        }
      }, 5000);
      return;
    }

    typewriterIndex++;
    const currentText = typewriterTargetPrompt.substring(0, typewriterIndex);
    window.searchFeature.setPrompt(currentText, true);
  }, 30);
}

function updatePrompt() {
  if (!window.searchFeature) return;
  const active = document.activeElement;

  if (active && active.id === 'textArea') return;
  if (isSnapping) return;

  const currentSlide = getCurrentSlide();
  const fullPrompt = prompts[currentSlide.label];
  if (!fullPrompt) return;

  storedPrompt = fullPrompt;

  if (!isUserActive && !userHasTakenControl) {
    startTypewriter(fullPrompt);
  } else {
    stopTypewriter();
    window.searchFeature.setPrompt(fullPrompt);
  }
}

function expandPrompt() {
  stopTypewriter();
  if (!storedPrompt) return;
  window.searchFeature?.setPrompt(storedPrompt);
}

function handleUserInput(value) {
  if (!storedPrompt || userHasTakenControl) return;
  if (value !== undefined && value.length > 0 && value !== storedPrompt) {
    userHasTakenControl = true;
    stopTypewriter();
  }
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
    await window.searchFeature?.setExternalImage(imageUrl, slideKey);
    const addBtn = q('addButton');
    if (addBtn) { addBtn.disabled = false; addBtn.ariaDisabled = 'false'; }
    scheduleSyncBackend();
    await new Promise(resolve => setTimeout(resolve, 100));
  } finally {
    injectionInProgress = false;
  }
}

// ===== EVENTS =====
function setupEventHandlers() {
  const textArea = q('textArea');

  if (textArea) {
    textArea.addEventListener('focus', () => {
      setUserActive(true);
      pauseRotation();

      const userHasOwnImage = hasUserOwnedImages();
      isFocusZoomed = !isMobile && !userHasOwnImage;
      requestUpdate();

      if (!userHasTakenControl) {
        expandPrompt();
        if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

        const slideIdAtFocus = getCurrentSlide()?.id;
        const myToken = ++injectToken;

        pendingInjectTimeout = setTimeout(() => {
          if (myToken !== injectToken || getCurrentSlide()?.id !== slideIdAtFocus) return;
          const userHasImgs = hasUserOwnedImages();
          const anyThumbs = getUIImageURLs().length > 0;
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
        isUserActive = false;

        const currentPrompt = window.searchFeature?.getLivePrompt?.() || '';
        if (!currentPrompt.trim() && !hasUserOwnedImages()) {
          userHasTakenControl = false;
        }

        const userHasOwnImage = hasUserOwnedImages();
        isFocusZoomed = !isMobile && !userHasTakenControl && !userHasOwnImage;
        requestUpdate();

        injectToken++;
        if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

        if (!userHasTakenControl && !injectionInProgress) {
          window.searchFeature?.clearImages('carousel');
          lastInjectedSlideId = null;
        }

        setTimeout(() => {
          if (!isUserActive && !isDragging && !userHasTakenControl && !hasUserOwnedImages()) {
            startRotation(true);
          }
        }, 20);
      }
    });

    textArea.addEventListener('input', (e) => handleUserInput(e.target.value));
    textArea.addEventListener('click', () => {
      setUserActive(true);
      pauseRotation();

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
      pauseRotation();
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
    if (document.visibilityState === 'visible') scheduleSyncBackend();
  });

  const wheelSurface = q('slider-track');
  if (wheelSurface) {
    let wheelV = 0, wheelRAF = null, wheelAnimating = false, lastWheelTime = 0;
    const WHEEL_SENSITIVITY = 0.0045;
    const WHEEL_FRICTION = 0.94;
    const WHEEL_MIN_V = 0.0015;
    const WHEEL_TIMEOUT = 80;
    const SNAP_THRESHOLD = 0.25;
    let wheelTimeout = null;

    wheelSurface.addEventListener('wheel', (e) => {
      if (!MANUAL_SCROLL) return;
      if (userHasTakenControl) return;

      const absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
      const horizontalIntent = absX > absY * 1.2 || (absX > 0 && absY === 0);
      const useShiftAsHorizontal = e.shiftKey && absX < absY;

      if (window.searchFeature?.isInputFocused?.()) return;
      if (!horizontalIntent && !useShiftAsHorizontal) return;

      e.preventDefault();
      setUserActive(true);

      if (isFocusZoomed) isFocusZoomed = false;
      setMode('user');

      lastWheelTime = performance.now();

      if (wheelTimeout) { clearTimeout(wheelTimeout); wheelTimeout = null; }
      if (isSnapping && snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; isSnapping = false; }

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
                if (!userHasTakenControl) {
                  isFocusZoomed = !isMobile;
                  requestUpdate();
                }
              }, SNAP_DURATION);
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
            if (!userHasTakenControl) {
              isFocusZoomed = !isMobile;
              requestUpdate();
            }
          }, SNAP_DURATION);
        }
      }, WHEEL_TIMEOUT);
    }, { passive: false });

    if (!isMobile) wheelSurface.style.cursor = userHasTakenControl ? 'default' : 'pointer';

    // ✅ Drag disabled (desktop)
    wheelSurface.addEventListener('pointerdown', () => {
      return;
    }, { passive: true });

    // Mobile touch swipe remains unchanged (you can remove it too if you want)
    if (isMobile) {
      let touchStartY = 0, touchStartOffset = 0;
      let isTouching = false, touchVelocity = 0, lastTouchY = 0, lastTouchTime = 0;

      wheelSurface.addEventListener('touchstart', (e) => {
        if (userHasTakenControl || e.touches.length !== 1) return;
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchStartOffset = currentOffset;
        isTouching = true;

        touchVelocity = 0;
        lastTouchY = touchStartY;
        lastTouchTime = performance.now();

        if (!isUserActive) setUserActive(true);
        if (isSnapping && snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; isSnapping = false; }

        setMode('user');
      }, { passive: true });

      wheelSurface.addEventListener('touchmove', (e) => {
        if (!isTouching || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const currentY = touch.clientY;
        const currentTime = performance.now();
        const deltaY = currentY - lastTouchY;
        const deltaTime = currentTime - lastTouchTime;

        if (deltaTime > 0) touchVelocity = deltaY / deltaTime;

        lastTouchY = currentY;
        lastTouchTime = currentTime;

        const deltaOffset = -(currentY - touchStartY) / (SLIDE_WIDTH + getCurrentGap());
        currentOffset = touchStartOffset + deltaOffset;
        requestUpdate();
      }, { passive: true });

      wheelSurface.addEventListener('touchend', () => {
        if (!isTouching) return;
        isTouching = false;

        const TOUCH_FRICTION = 0.94;
        const TOUCH_MIN_VELOCITY = 0.002;
        let velocity = -touchVelocity / (SLIDE_WIDTH + getCurrentGap());

        const finish = () => {
          setMode('snapping');
          smoothSnapTo(Math.round(currentOffset));
          setTimeout(() => {
            setUserActive(false);
            if (!userHasTakenControl && !hasUserOwnedImages()) startRotation();
          }, SNAP_DURATION);
        };

        if (Math.abs(velocity) > TOUCH_MIN_VELOCITY) {
          const applyMomentum = () => {
            currentOffset += velocity;
            requestUpdate();
            velocity *= TOUCH_FRICTION;
            if (Math.abs(velocity) < TOUCH_MIN_VELOCITY) finish();
            else requestAnimationFrame(applyMomentum);
          };
          requestAnimationFrame(applyMomentum);
        } else {
          finish();
        }
      }, { passive: true });
    }
  }
}

// ===== INIT + API =====
function init() {
  log('🏁 Initializing...');

  slides.forEach((slide, idx) => {
    if (idx < 3) {
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
  stopTypewriter,
  getFullPrompt: () => typewriterTargetPrompt || storedPrompt,
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
    stopTypewriter();
    userHasTakenControl = true;
    pauseRotation();
    isFocusZoomed = false;

    const track = q('slider-track');
    if (track && !isMobile) track.style.cursor = 'default';

    requestUpdate();
  },
  resetCarouselLandscape() {
    isFocusZoomed = false;
    userHasTakenControl = true;
    pauseRotation();

    const track = q('slider-track');
    if (track && !isMobile) track.style.cursor = 'default';

    requestUpdate();
  },
  resetAfterImageRemoval() {
    userHasTakenControl = false;
    const stillHasUserImages = hasUserOwnedImages();
    isFocusZoomed = !isMobile && !stillHasUserImages;

    const track = q('slider-track');
    if (track && !isMobile) track.style.cursor = 'pointer';

    requestUpdate();
    if (!stillHasUserImages) startRotation();
  },
  getStoredPrompt: () => storedPrompt,
  clearStoredPrompt() { storedPrompt = ''; },
  markUserInControl() {
    userHasTakenControl = true;
    setUserActive(true);
    pauseRotation();
  },
  resetAfterCarouselImageRemoval() {
    userHasTakenControl = false;
    storedPrompt = '';
    injectionInProgress = false;
    isFocusZoomed = !isMobile;
    setUserActive(false);
    requestUpdate();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}