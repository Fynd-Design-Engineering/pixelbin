/**
 * AI PHOTO EDITOR CAROUSEL - Webflow Version
 * Focus-zoom works on DESKTOP ONLY (no zoom on mobile). Spacing prevents overlap.
 * Fully self-contained replacement. Drop in for your existing script.
 */

const DEBUG = false;
const log = (...a) => { if (DEBUG) console.log(...a); };

console.log('🚀 AI Photo Editor Carousel - Butter Smooth (desktop-only zoom)');

////////////////////////////////////////////////////////////////////////////////
// DATA
////////////////////////////////////////////////////////////////////////////////


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
  'Ad Creative': 'A playful food campaign visual featuring two colorful eclairs — one chocolate, one strawberry — floating on a pastel blue background. Repeating text pattern reads ‘ So Yum’ in centre in all caps white sans-serif font. Soft shadows and realistic textures on the pastries. Fun, graphic, and modern lifestyle branding aesthetic.',
  'Poster': 'A retro-inspired sneaker poster ad featuring a pair of Nike Dunk High sneakers in burnt orange and white, floating mid-air against a bright blue sky with soft white clouds. The sneakers are shown in photorealistic detail with visible leather texture, stitching, and laces, arranged to highlight both the side profile and top view. The composition is minimalist, with the Nike swoosh logo and bold white text placed subtly around the frame, alongside smaller retro tagline text with a slightly blurred, print-like effect. The overall style has a vintage sports ad aesthetic with a dreamy, nostalgic mood, enhanced by a grainy overlay and soft tones, evoking the feel of classic 90s sneaker campaigns',
  'Digital Art': 'A minimalist surreal scene featuring a human silhouette made of translucent water standing on a dry cracked desert floor. The figure mirrors the sky above, reflecting clouds and light. Colors are muted - soft ivory, desaturated cyan, and warm beige. Lighting is cinematic and diffused. Symbolic, emotional, and deeply aesthetic digital artwork.',
  'Social media': 'A lifestyle beverage ad featuring a chilled Corona-style beer bottle leaning casually against a carved sandy surface with soft ripples, surrounded by freshly sliced limes glistening with juice. Golden sunlight spills across the scene, illuminating condensation droplets and highlighting the rich amber tones of the beer. The background features smooth, sunlit sand tones for a relaxed beach-day feel. Overlay elegant, minimalist text at the top that reads “Taste the Sun” in bold modern sans-serif, with a smaller tagline below: “Golden moments. Cold beer. Endless summer.” The overall image is cinematic, hyper-detailed, and refreshing — a premium lifestyle campaign visual designed for social media.',
  'Remove watermarks': 'Remove the watermark from this image',
  'Logo': 'A minimalist logo design for a luxury skincare brand named ‘LUNEA’. The logo features thin modern serif typography paired with a delicate crescent moon motif integrated into the text. Only two colors - moss green and ivory. Clean composition with balanced negative space on a textured off-white background. Elegant, calm, and modern wellness-inspired identity.',
  'Remove background': 'Remove background of this image',
  'Upscale': 'Upscale this image'
};
////////////////////////////////////////////////////////////////////////////////
/* STATE */
////////////////////////////////////////////////////////////////////////////////

let currentOffset = 0;
let snapRaf = null;

let isMobile = window.innerWidth < 768;
let slideElements = [];
let sliderTrack;

let autoInterval = null;
let isUserActive = false;
const ROTATION_DELAY = 3000;

let storedPrompt = '';
let isPromptExpanded = false;
let userHasTakenControl = false;

let pendingInjectTimeout = null;
let injectToken = 0;

let syncTimer = null;
let syncInFlight = false;

let isSingleLineMode = false;

let wheelEndTimer = null;
let wheelLastT = 0;

let _lastRoundedIndex = null;

// Desktop drag-only state
let isDragging = false;
let dragStartX = 0;
let dragStartOffset = 0;

// Focus-zoom state & tuning (applies on DESKTOP only)
let isFocusZoomed = false;
const FOCUS_SCALE = 1;          // 1.3x scale on center card
const FOCUS_SPREAD = 4;        // neighbors push outward to make room
const FOCUS_TRANSITION_MS = 750;  // scale/landscape transition

// Helper: zoom is active only when not mobile and focus-zoom flag is on
const zoomActive = () => (!isMobile && isFocusZoomed);

////////////////////////////////////////////////////////////////////////////////
// MODES
////////////////////////////////////////////////////////////////////////////////

let isSnapping = false;
let currentMode = 'auto';
const SNAP_DURATION = 300;
const AUTO_TRANSFORM_MS = 700;

function setModeAuto()     { currentMode = 'auto'; }
function setModeUser()     { currentMode = 'user'; }
function setModeSnapping() { currentMode = 'snapping'; }

function applyWrapperTransition(wrapper) {
  const sizeFade = 'width 300ms ease, height 300ms ease, opacity 300ms ease';
  if (currentMode === 'auto') {
    wrapper.style.transition = `transform ${AUTO_TRANSFORM_MS}ms ease-out, ${sizeFade}`;
  } else {
    wrapper.style.transition = sizeFade;
  }
  const card = wrapper.querySelector('.slide-card');
  if (card) {
    card.style.transition = `transform ${FOCUS_TRANSITION_MS}ms ease`;
  }
  const img = wrapper.querySelector('.slide-card-single-img');
  if (img) {
    img.style.transition = `object-position ${FOCUS_TRANSITION_MS}ms ease, border-radius 300ms ease`;
  }
}

////////////////////////////////////////////////////////////////////////////////
// UTIL
////////////////////////////////////////////////////////////////////////////////

function q(id) { return document.getElementById(id); }
function getImagesSection() { return q('imagesSection'); }

function truncateText(text, maxLength = 64) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function getUIImageURLs() {
  const sec = getImagesSection();
  if (!sec) return [];
  return Array.from(sec.querySelectorAll('.image-thumbnail'))
    .map(t => t.dataset.url)
    .filter(Boolean);
}

function hasCarouselImage(url, slideKey) {
  const sec = getImagesSection();
  if (!sec) return false;
  return Array.from(sec.querySelectorAll('.image-thumbnail'))
    .some(t => t.dataset.source === 'carousel' &&
               (t.dataset.url === url || t.dataset.slideKey === slideKey));
}

function hasUserOwnedImages() {
  const sec = getImagesSection();
  if (!sec) return false;
  return Array.from(sec.querySelectorAll('.image-thumbnail'))
    .some(t => t.dataset.source === 'user' || !t.dataset.slideKey);
}

// Idempotent variant builder; always derive from the base URL
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
    const base = url.split('?')[0];
    const qp = `w=${w}&h=${h}&fit=cover&auto=format`;
    return `${base}?${qp}`;
  }
}

function smallVariant(url){ return variant(url, 600, 400); }
function tinyVariant(url){  return variant(url, 450, 300); }
function largeVariant(url){ return variant(url, 900, 600); }


/**
 * Axis sizes for spacing. On desktop, we expand the *visual* center width
 * when zoomActive() so neighbors shift out enough to avoid overlap.
 * On mobile, zoom never activates, so sizes remain constant.
 */
function getAxisSizes() {
  if (!isMobile) {
    // Desktop moves horizontally → use widths
    const centerBase = zoomActive() ? 480 : 335; // landscape when zoomed, portrait otherwise
    const center = zoomActive() ? centerBase * FOCUS_SCALE : centerBase;

    const adjacent = 272; // neighbor base width
    const far = 208;

    return { center, adjacent, far };
  } else {
    // Mobile moves vertically → use heights (no zoom on mobile)
    const center = 420;  // portrait center height
    const adjacent = 340;
    const far = 260;

    return { center, adjacent, far };
  }
}

// Dynamic step with spread when zoom is active (desktop only)
const NOMINAL_STEP = () => {
  const { center, adjacent } = getAxisSizes();
  const gap = 45 * (zoomActive() ? FOCUS_SPREAD : 1);
  return center/2 + gap + adjacent/2;
};

function pxToOffset(deltaPx) {
  return -deltaPx / NOMINAL_STEP();
}

function isInside(root, node) {
  return !!root && (root === node || root.contains(node));
}

function getClientX(e) {
  return (e.touches && e.touches[0]?.clientX) || e.clientX || 0;
}

////////////////////////////////////////////////////////////////////////////////
// SHADOWS
////////////////////////////////////////////////////////////////////////////////

const CENTER_SHADOW = '1px 18px 10px #8543ff08, 1px 3px 4px #630fff0a';
const SOFT_SHADOW   = '3px 6px 7px #630fff08, 1px 2px 4px #630fff0a';

////////////////////////////////////////////////////////////////////////////////
// BACKEND SYNC (UI is source of truth)
////////////////////////////////////////////////////////////////////////////////

function scheduleSyncBackend() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncBackendFromUI, 50);
}

function syncBackendFromUI() {
  if (!window.searchFeature) return;
  if (syncInFlight) return;
  syncInFlight = true;

  const urls = getUIImageURLs();
  try {
    window.searchFeature.clearImages?.();
    urls.forEach(u => window.searchFeature.setExternalImage?.(u));
    log('🔁 Backend synced from UI:', urls);
  } finally {
    syncInFlight = false;
  }
}

function proxyBackend() {
  const sf = window.searchFeature;
  if (!sf || sf.__proxied) return;

  const origClear = sf.clearImages?.bind(sf);
  const origSet   = sf.setExternalImage?.bind(sf);

  if (origClear) {
    sf.clearImages = function(...args) {
      return origClear(...args);
    };
  }
  if (origSet) {
    sf.setExternalImage = function(url, ...rest) {
      return origSet(url, ...rest);
    };
  }
  sf.__proxied = true;
}

////////////////////////////////////////////////////////////////////////////////
// CAROUSEL MATH
////////////////////////////////////////////////////////////////////////////////

function normIndex(i) {
  const n = slides.length;
  return ((i % n) + n) % n;
}

function getCurrentSlide() {
  const idx = Math.round(currentOffset);
  return slides[normIndex(idx)];
}

function getSignedDistance(absoluteIndex, offset = currentOffset) {
  const total = slides.length;
  const slide = normIndex(absoluteIndex);
  const curr  = ((offset % total) + total) % total;
  let d = slide - curr;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

function getCardPosition(absoluteIndex, offset = currentOffset) {
  const d = getSignedDistance(absoluteIndex, offset);
  const ad = Math.abs(d);
  const sgn = d >= 0 ? 1 : -1;

  const { center, adjacent, far } = getAxisSizes();
  const baseGap = 45 * (zoomActive() ? FOCUS_SPREAD : 1);

  function posAt(n) {
    if (n === 0) return 0;
    if (n === 1) return sgn * (center/2 + baseGap + adjacent/2);
    if (n === 2) return sgn * (center/2 + baseGap + adjacent + baseGap + far/2);
    return sgn * (center/2 + baseGap + adjacent + baseGap + far/2 + (n - 2) * (far + baseGap));
  }

  const n0 = Math.floor(ad);
  const n1 = Math.ceil(ad);
  const t  = ad - n0;
  const p0 = posAt(n0);
  const p1 = posAt(n1);
  return p0 + (p1 - p0) * t;
}


function getDimsFromDistance(ad) {
  // Center card: on desktop when zoomActive → landscape size; mobile stays portrait
  if (ad < 0.5) {
    if (zoomActive()) {
      return { width: 748, height: 437, opacity: 1, yOffset: 0, shadow: true }; // desktop landscape
    }
    return isMobile
      ? { width: 360, height: 451, opacity: 1, yOffset: 0, shadow: true }    // mobile portrait
      : { width: 328, height: 437, opacity: 1, yOffset: 0, shadow: true };   // desktop portrait
  } else if (ad < 1.5) {
    return isMobile
      ? { width: 240, height: 300, opacity: 0.2, yOffset: 0, shadow: false }
      : { width: 272, height: 340, opacity: 0.2, yOffset: 0, shadow: false };
  }
  return isMobile
    ? { width: 240, height: 300, opacity: 0.05, yOffset: 0, shadow: false }
    : { width: 208, height: 260, opacity: 0.05, yOffset: 0, shadow: false };
}

////////////////////////////////////////////////////////////////////////////////
// DOM BUILD
////////////////////////////////////////////////////////////////////////////////

function createSlideHTML(slide, dimensions) {
  const rounded = dimensions.shadow ? (isMobile ? 20.577 : 27.436) : 13.718;
  const shadowStyle = dimensions.shadow ? CENTER_SHADOW : SOFT_SHADOW;
  const bgColor = slide.bgColor || '#e0e0e0';

  return `
    <div class="slide-card" style="border-radius:${rounded}px;box-shadow:${shadowStyle};background:${bgColor};">
      <img alt="${slide.label}" class="slide-card-single-img"
           style="display:block;width:100%;height:100%;object-fit:cover;border-radius:${rounded}px;object-position:50% 50%;"
           loading="lazy" decoding="async" fetchpriority="low"
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
  log('🔄 Initializing carousel...');
  sliderTrack = q('slider-track');
  if (!sliderTrack) { console.error('❌ Slider track not found!'); return; }

  sliderTrack.innerHTML = '';
  slideElements = [];

  for (let set = 0; set < 3; set++) {
    slides.forEach((slide, idx) => {
      const absoluteIndex = -slides.length + set * slides.length + idx;
      const dims = getDimsFromDistance(Math.abs(getSignedDistance(absoluteIndex, 0)));

      const wrapper = document.createElement('div');
      wrapper.className = 'slide-card-wrapper';
      wrapper.dataset.absoluteIndex = String(absoluteIndex);

      const cardContainer = document.createElement('div');
      cardContainer.style.cssText = 'width:100%;height:100%;';
      cardContainer.innerHTML = createSlideHTML(slide, dims);

      wrapper.appendChild(cardContainer);
      sliderTrack.appendChild(wrapper);

      const slideCard  = cardContainer.querySelector('.slide-card');
      const slideImage = cardContainer.querySelector('.slide-card-single-img');

      slideElements.push({
        wrapper,
        cardContainer,
        slide,
        absoluteIndex,
        slideCard,
        slideImage
      });

      // --- Assign optimized image variant + priorities ---
      if (slideImage) {
        // store the unmodified base URL once
        slideImage.dataset.srcBase = slide.images[0];

        const dist0 = Math.abs(getSignedDistance(absoluteIndex, 0));
        // Priority hints BEFORE setting src
        if (dist0 < 1.5) {
          slideImage.loading = 'eager';
          slideImage.decoding = 'async';
          slideImage.fetchPriority = 'high';
        } else {
          slideImage.loading = 'lazy';
          slideImage.decoding = 'async';
          slideImage.fetchPriority = 'low';
        }

        // Choose size by distance from center
        if (dist0 < 0.5) {
          slideImage.src = largeVariant(slideImage.dataset.srcBase);
        } else if (dist0 < 1.5) {
          slideImage.src = smallVariant(slideImage.dataset.srcBase);
        } else {
          slideImage.src = tinyVariant(slideImage.dataset.srcBase);
        }

        // Pre-decode near-center to avoid first-motion jank
        if (dist0 < 1.5) {
          Promise.resolve().then(() => slideImage.decode?.().catch(() => {}));
        }
      }
    });
  }

  currentOffset = 0;
  updatePositions();
  setTimeout(updatePrompt, 100);
  scheduleSyncBackend();
}



function updatePositions() {
  requestAnimationFrame(() => {
    slideElements.forEach(({ wrapper, slideCard, slideImage, absoluteIndex }) => {
      applyWrapperTransition(wrapper);

      const dSigned = getSignedDistance(absoluteIndex, currentOffset);
      const ad = Math.abs(dSigned);
      const position = getCardPosition(absoluteIndex, currentOffset);
      const isVisible = ad <= 3.5;
      const dimensions = getDimsFromDistance(ad);
      

      wrapper.style.overflow = 'visible';
      wrapper.style.width = dimensions.width + 'px';
      wrapper.style.height = dimensions.height + 'px';
      wrapper.style.opacity = String(dimensions.opacity);
      wrapper.style.visibility = isVisible ? 'visible' : 'hidden';

      // Layering so center is above neighbors
      wrapper.style.zIndex = String(1000 - Math.round(ad * 10));

      if (isMobile) {
        wrapper.style.bottom = '';
        wrapper.style.top = '50%';
        wrapper.style.left = '50%';
        wrapper.style.transform = `translate(-50%, calc(-50% + ${position}px))`;
      } else {
        wrapper.style.left = '50%';
        wrapper.style.bottom = '22%';
        wrapper.style.top = '';
        wrapper.style.transform = `translate3d(${position}px, 0, 0) translateX(-50%)`;
      }

      if (slideCard) {
        const rounded = dimensions.shadow ? (isMobile ? 20.577 : 27.436) : 13.718;
        const shadowStyle = dimensions.shadow ? CENTER_SHADOW : SOFT_SHADOW;
        slideCard.style.borderRadius = rounded + 'px';
        slideCard.style.boxShadow = shadowStyle;

        // Anchor bottom so scale grows upward (desktop), center on mobile
        slideCard.style.transformOrigin = isMobile ? '50% 50%' : '50% 100%';

        // Scale only on desktop and only for center card
        const scale = (zoomActive() && ad < 0.5) ? FOCUS_SCALE : 1;
        slideCard.style.transform = `scale(${scale})`;
      }

      if (slideImage) {
        const rounded = dimensions.shadow ? (isMobile ? 20.577 : 27.436) : 13.718;
        slideImage.style.borderRadius = rounded + 'px';

        // Subtle upward framing only when desktop zoom is active
        if (zoomActive() && ad < 0.5) {
          slideImage.style.objectFit = 'cover';
          slideImage.style.objectPosition = '50% 45%';
        } else {
          slideImage.style.objectPosition = '50% 50%';
        }
      }
    });

    const currIdx = Math.round(currentOffset);
    if (currIdx !== _lastRoundedIndex) {
        _lastRoundedIndex = currIdx;
         updatePrompt();
          }
  });
}

////////////////////////////////////////////////////////////////////////////////
// NAVIGATION + RESIZE
////////////////////////////////////////////////////////////////////////////////

function smoothSnapTo(targetOffset) {
  if (snapRaf) cancelAnimationFrame(snapRaf);
  isSnapping = true;
  setModeSnapping();

  const start = performance.now();
  const from  = currentOffset;
  const delta = targetOffset - from;

  const tick = (now) => {
    const k = Math.min(1, (now - start) / SNAP_DURATION);
    const e = 1 - Math.pow(1 - k, 4);
    currentOffset = from + delta * e;
    updatePositions();

    if (k < 1) {
      snapRaf = requestAnimationFrame(tick);
    } else {
      isSnapping = false;
      currentOffset = targetOffset;
      setModeAuto();
      setUserActive(false);
      updatePositions();
      updatePrompt();
    }
  };
  snapRaf = requestAnimationFrame(tick);
}

function nextSlide() {
  injectToken++;
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;

  window.searchFeature?.clearImages('carousel');

  smoothSnapTo(Math.round(currentOffset) + 1);
  log(`➡️ Next slide`);
}

function prevSlide() {
  injectToken++;
  if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

  if (!isUserActive && !hasUserOwnedImages()) userHasTakenControl = false;

  window.searchFeature?.clearImages('carousel');

  smoothSnapTo(Math.round(currentOffset) - 1);
  log(`⬅️ Previous slide`);
}

function handleResize() {
  const wasMobile = isMobile;
  isMobile = window.innerWidth < 768;

  // If we crossed the breakpoint, re-init and reset zoom state for safety
  if (wasMobile !== isMobile) {
    isFocusZoomed = false;
    const keep = Math.round(currentOffset);
    initCarousel();
    currentOffset = keep;
    updatePositions();

    const track = q('slider-track');
    if (track) track.style.cursor = isMobile ? '' : 'grab';
  } else {
    updatePositions();
  }
}

////////////////////////////////////////////////////////////////////////////////
// AUTO-ROTATION
////////////////////////////////////////////////////////////////////////////////

function startRotation() {
  if (autoInterval || isUserActive) return;
  autoInterval = setInterval(() => {
    if (!isUserActive && !isSnapping && !isDragging) {
      setModeAuto();
      currentOffset = Math.round(currentOffset) + 1;
      updatePositions();
      updatePrompt();
    }
  }, ROTATION_DELAY);
  log('▶️ Auto-rotation started');
}

function pauseRotation() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
    log('⏸️ Auto-rotation paused');
  }
}

function setUserActive(active) {
  isUserActive = active;
  if (active) pauseRotation();
  else setTimeout(() => { if (!isUserActive && !isDragging) startRotation(); }, 500);
}

////////////////////////////////////////////////////////////////////////////////
// PROMPT + INPUT MODE
////////////////////////////////////////////////////////////////////////////////

function updatePrompt() {
  if (!window.searchFeature) return;

  const active = document.activeElement;
  const typing =
    active && (active.id === 'textInput' || active.id === 'textArea');
  if (typing) return;

  const currentSlide = getCurrentSlide();
  const fullPrompt = prompts[currentSlide.label];
  if (!fullPrompt) return;

  storedPrompt = fullPrompt;

  const isMultiline = q('searchForm')?.classList.contains('multi-line');
  if (isMultiline || isPromptExpanded) {
    window.searchFeature.setPrompt(fullPrompt);
    isPromptExpanded = true;
  } else {
    window.searchFeature.setPrompt(truncateText(fullPrompt));
  }
}

function expandPrompt() {
  if (!storedPrompt || isPromptExpanded) return;
  const input = getActiveInput();
  if (!input) return;

  const current = input.value;
  const truncated = truncateText(storedPrompt);

  if (current === truncated) {
    isPromptExpanded = true;
    window.searchFeature?.setPrompt(storedPrompt);
  }
}

function getActiveInput() {
  const textArea = q('textArea');
  const textInput = q('textInput');
  if (textArea && !textArea.classList.contains('hidden')) return textArea;
  if (textInput && !textInput.classList.contains('hidden')) return textInput;
  return null;
}

function handleUserInput(value) {
  if (!storedPrompt || userHasTakenControl) return;
  const truncated = truncateText(storedPrompt);
  if (value !== undefined && value.length > 0 && value !== truncated && value !== storedPrompt) {
    userHasTakenControl = true;
    isPromptExpanded = false;
  }
}

function switchToMultiline() {
  const els = {
    searchForm: q('searchForm'),
    formContent: q('formContent'),
    toolbar: q('toolbar'),
    textInput: q('textInput'),
    textArea: q('textArea'),
    container: q('searchContainer'),
  };

  els.searchForm?.classList.remove('single-line');
  els.searchForm?.classList.add('multi-line');

  els.formContent?.classList.remove('single-line');
  els.toolbar?.classList.remove('single-line');

  els.container?.classList.remove('single-line');
  els.container?.classList.add('multi-line');

  if (els.textInput && els.textArea) {
    els.textArea.value = els.textInput.value;
    els.textInput.classList.add('hidden');
    els.textArea.classList.remove('hidden');
    els.textArea.focus();
  }
  isSingleLineMode = false;
}

function switchToSingleLine() {
  const els = {
    searchForm: q('searchForm'),
    formContent: q('formContent'),
    toolbar: q('toolbar'),
    textInput: q('textInput'),
    textArea: q('textArea'),
    container: q('searchContainer'),
  };

  els.searchForm?.classList.remove('multi-line');
  els.searchForm?.classList.add('single-line');

  els.formContent?.classList.add('single-line');
  els.toolbar?.classList.add('single-line');

  els.container?.classList.remove('multi-line');
  els.container?.classList.add('single-line');

  if (els.textInput && els.textArea) {
    els.textInput.value = els.textArea.value || '';
    els.textArea.classList.add('hidden');
    els.textInput.classList.remove('hidden');
  }

  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
  window.searchFeature?.clearImages('all');

  userHasTakenControl = false;
  isPromptExpanded = false;

  if (storedPrompt && window.searchFeature) {
    window.searchFeature.setPrompt(truncateText(storedPrompt));
  }
  isSingleLineMode = true;
}

////////////////////////////////////////////////////////////////////////////////
// IMAGE INTEGRATION (DOM-only helpers for sync; no direct ownership)
////////////////////////////////////////////////////////////////////////////////

function clearImages(force = false, scope = 'all') {
  const sec = getImagesSection();
  if (!sec) return;

  const thumbs = sec.querySelectorAll('.image-thumbnail');
  thumbs.forEach(thumb => {
    if (scope === 'carousel') {
      if (thumb.dataset.source === 'carousel') thumb.remove();
    } else {
      thumb.remove();
    }
  });

  if (!sec.querySelector('.image-thumbnail')) sec.classList.add('hidden');

  if (!isSingleLineMode) scheduleSyncBackend();
}

function createThumbnail(imageUrl, slideKey) {
  // Not used by carousel anymore. UI script renders thumbnails.
}

function shouldShowImage() {
  const searchForm = q('searchForm');
  return searchForm && searchForm.classList.contains('multi-line');
}

function addCurrentSlideImage() {
  const currentSlide = getCurrentSlide();
  const imageUrl = (currentSlide && currentSlide.injectUrl)
    ? String(currentSlide.injectUrl).trim()
    : '';
  if (!imageUrl) return; // skip when empty

  const slideKey = currentSlide.label.toLowerCase().replace(/\s+/g, '-');

  if (hasCarouselImage(imageUrl, slideKey)) {
    switchToMultiline();
    if (!isSingleLineMode) scheduleSyncBackend();
    // Keep Upload enabled after our injection
    const addBtn = q('addButton');
    if (addBtn) { addBtn.disabled = false; addBtn.ariaDisabled = 'false'; }
    return;
  }

  if (!userHasTakenControl) window.searchFeature?.clearImages('carousel');

  window.searchFeature?.setExternalImage(imageUrl, slideKey);
  switchToMultiline();

  // Enable Upload only for our injected images
  const addBtn = q('addButton');
  if (addBtn) { addBtn.disabled = false; addBtn.ariaDisabled = 'false'; }
}


function injectCurrentImageURL() {
  if (!isSingleLineMode) scheduleSyncBackend();
}

////////////////////////////////////////////////////////////////////////////////
// DESKTOP DRAG-TO-SLIDE (mouse/pen only)
////////////////////////////////////////////////////////////////////////////////

function beginDesktopDrag(e) {
  if (isMobile) return; // desktop only
  if (isUserActive === false) setUserActive(true);
  if (isSnapping && snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = null; isSnapping = false; }

  isDragging = true;
  setModeUser();
  dragStartX = getClientX(e);
  dragStartOffset = currentOffset;

  const track = q('slider-track');
  if (track) track.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';

  window.addEventListener('pointermove', onDesktopDragMove, { passive: false });
  window.addEventListener('pointerup',   endDesktopDrag,     { passive: false, once: true });
  window.addEventListener('pointercancel', endDesktopDrag,   { passive: false, once: true });
}

function onDesktopDragMove(e) {
  if (!isDragging || isMobile) return;
  if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;

  e.preventDefault();
  const dx = getClientX(e) - dragStartX;
  currentOffset = dragStartOffset + pxToOffset(+dx); // drag right → next slide, consistent with wheel
  updatePositions();
}

function endDesktopDrag() {
  if (!isDragging) return;
  isDragging = false;

  window.removeEventListener('pointermove', onDesktopDragMove);

  const track = q('slider-track');
  if (track) track.style.cursor = 'grab';
  document.body.style.userSelect = '';

  const target = Math.round(currentOffset);
  smoothSnapTo(target);
  setTimeout(() => setUserActive(false), 300);
}

////////////////////////////////////////////////////////////////////////////////
// EVENTS
////////////////////////////////////////////////////////////////////////////////

function setupEventHandlers() {
  // Wheel tuning (keep old logic; just smoother values)
let wheelV = 0, wheelRAF = null, wheelAnimating = false;
const WHEEL_ACCEL        = 0.0012; // how much deltaX/Y turns into velocity
const WHEEL_FRICTION     = 0.92;   // glide: higher = longer coast
const WHEEL_MIN_V        = 0.5015; // stop threshold
const WHEEL_MAX_V        = 2.14;   // absolute velocity ceiling
const PER_FRAME_VEL_CAP  = 0.20;   // max delta per frame (prevents bursts)
const DEADZONE_PX        = 3;      // ignore micro scrolls/touchpad noise


  const inputs = [q('textInput'), q('textArea')].filter(Boolean);

  inputs.forEach(input => {
input.addEventListener('focus', () => {
  setUserActive(true);
  isFocusZoomed = !isMobile;
  updatePositions();


  const wasSingleLine = q('searchForm')?.classList.contains('single-line');
  if (wasSingleLine) {
    switchToMultiline();
    // ensure zoomed sizing applies after DOM class changes
    requestAnimationFrame(updatePositions);
  }

      if (!userHasTakenControl) {
        expandPrompt();

        if (pendingInjectTimeout) {
          clearTimeout(pendingInjectTimeout);
          pendingInjectTimeout = null;
        }

        const slideIdAtFocus = getCurrentSlide()?.id;
        const myToken = ++injectToken;

        pendingInjectTimeout = setTimeout(() => {
          if (myToken !== injectToken) return;
          if (getCurrentSlide()?.id !== slideIdAtFocus) return;

          const multiline = q('searchForm')?.classList.contains('multi-line');
          const userHasImgs = hasUserOwnedImages();
          const anyThumbs   = getUIImageURLs().length > 0;

          if (multiline && !userHasImgs && !anyThumbs) {
            addCurrentSlideImage();
            injectCurrentImageURL();
          }
        }, 80);
      }
    });

input.addEventListener('blur', (e) => {
  const container = q('searchContainer');
  const addBtn = q('addButton');
  const genBtn = q('generateButton');
  const rt = e.relatedTarget;

  // Treat textarea, container, and upload buttons as "inside"
  const focusStayedInside =
    (rt && container && isInside(container, rt)) ||
    (rt && addBtn && isInside(addBtn, rt)) ||
    (rt && genBtn && isInside(genBtn, rt));

  if (!focusStayedInside) {
    setUserActive(false);
    isFocusZoomed = false;
    updatePositions();

    injectToken++;
    if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }

    switchToSingleLine();
    window.searchFeature?.clearImages('all');
  }
});




    input.addEventListener('input', (e) => {
      handleUserInput(e.target.value);
    });

input.addEventListener('click', () => {
  if (!userHasTakenControl) {
    expandPrompt();

    // If the user already has images, do NOT inject ours
    if (hasUserOwnedImages()) return;

    injectToken++;
    if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }

    addCurrentSlideImage();
    injectCurrentImageURL();
  }
});

  });

  [q('addButton'), q('generateButton')].filter(Boolean).forEach(button => {
    button.setAttribute('tabindex', '0');
    button.addEventListener('click', () => {
      setUserActive(true);
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
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setUserActive(true);
      prevSlide();
      setTimeout(() => setUserActive(false), 1000);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setUserActive(true);
      nextSlide();
      setTimeout(() => setUserActive(false), 1000);
    }
  });

  window.addEventListener('resize', handleResize);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isSingleLineMode) scheduleSyncBackend();
  });

  // Outside-click collapse → also clear images and exit zoom
  document.addEventListener('pointerdown', (e) => {
    const form = q('searchForm');
    if (!form || !form.classList.contains('multi-line')) return;

    const container = q('searchContainer');
    const addBtn = q('addButton');
    const genBtn = q('generateButton');
    const images = q('imagesSection');

    if (isInside(container, e.target)) return;
    if (isInside(addBtn, e.target)) return;
    if (isInside(genBtn, e.target)) return;
    if (isInside(images, e.target)) return;

    injectToken++;
    if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }

    isFocusZoomed = false;
    updatePositions();

    switchToSingleLine();
    window.searchFeature?.clearImages('all');
  });

  const imagesEl = q('imagesSection');
  if (imagesEl) {
    imagesEl.addEventListener('click', (e) => {
      if (e.target.closest('.image-thumbnail')) return;
      if (!q('searchForm')?.classList.contains('multi-line')) return;

      injectToken++;
      if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
      if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }

      isFocusZoomed = false;
      updatePositions();

      switchToSingleLine();
      window.searchFeature?.clearImages('all');
    });
  }

  // ESC collapse → also clear images and exit zoom
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!q('searchForm')?.classList.contains('multi-line')) return;

    injectToken++;
    if (pendingInjectTimeout) { clearTimeout(pendingInjectTimeout); pendingInjectTimeout = null; }
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }

    isFocusZoomed = false;
    updatePositions();

    switchToSingleLine();
    window.searchFeature?.clearImages('all');
  });

  // Wheel: only horizontal moves slider (old logic, retuned)
  const wheelSurface = q('slider-track');
  if (wheelSurface) {
    wheelSurface.addEventListener('wheel', (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const HORIZONTAL_RATIO = 1.2;
      const horizontalIntent =
        absX > absY * HORIZONTAL_RATIO || (absX > 0 && absY === 0);
      const useShiftAsHorizontal = e.shiftKey && absX < absY;

      if (!horizontalIntent && !useShiftAsHorizontal) return;

      e.preventDefault();
      setUserActive(true);

      if (isSnapping && snapRaf) {
        cancelAnimationFrame(snapRaf);
        snapRaf = null;
        isSnapping = false;
      }

      setModeUser();

      const dx = useShiftAsHorizontal ? e.deltaY : e.deltaX;
      if (!dx) return;

      // tiny deadzone
      if (Math.abs(dx) < DEADZONE_PX) return;

      // accumulate velocity
      wheelV -= -dx * WHEEL_ACCEL;
      // clamp running velocity
      if (wheelV >  WHEEL_MAX_V) wheelV =  WHEEL_MAX_V;
      if (wheelV < -WHEEL_MAX_V) wheelV = -WHEEL_MAX_V;

      if (!wheelAnimating) {
        wheelAnimating = true;
        const step = () => {
          // cap per-frame motion to avoid jumps
          if (wheelV >  PER_FRAME_VEL_CAP) wheelV =  PER_FRAME_VEL_CAP;
          if (wheelV < -PER_FRAME_VEL_CAP) wheelV = -PER_FRAME_VEL_CAP;

          currentOffset += wheelV;
          updatePositions();

          // friction
          wheelV *= WHEEL_FRICTION;

          if (Math.abs(wheelV) < WHEEL_MIN_V) {
            wheelAnimating = false;
            const target = Math.round(currentOffset);
            smoothSnapTo(target);
            setTimeout(() => setUserActive(false), 300);
            return;
          }
          wheelRAF = requestAnimationFrame(step);
        };
        wheelRAF = requestAnimationFrame(step);
      }
    }, { passive: false });

    
    // Desktop drag-to-slide (pointer-based, desktop only)
    if (!isMobile) wheelSurface.style.cursor = 'grab';
    wheelSurface.addEventListener('pointerdown', (e) => {
      if (isMobile) return;
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;

      // If user is actively editing in multi-line, don’t steal pointer
      const form = q('searchForm');
      if (form && form.classList.contains('multi-line')) {
        const active = document.activeElement;
        if (active && (active.id === 'textInput' || active.id === 'textArea')) return;
      }

      beginDesktopDrag(e);
    }, { passive: true });
  }
}


////////////////////////////////////////////////////////////////////////////////
// INIT + PUBLIC API
////////////////////////////////////////////////////////////////////////////////

function init() {
  log('🏁 Initializing AI Photo Editor Carousel...');
  proxyBackend();
  initCarousel();
  setupEventHandlers();
  setTimeout(startRotation, 1000);
  log('🎉 Carousel initialization complete!');
}

window.aiPhotoCarousel = {
  next: nextSlide,
  prev: prevSlide,
  getCurrentSlide,
  pauseRotation,
  startRotation,
  expandPrompt,
  clearImages,  // legacy DOM helper
  setUserActive,
  setInjectUrlForSlide(id, url) {
    const s = slides.find(x => x.id === id);
    if (s) s.injectUrl = (url || '').trim();
  },
markUserUpload(url) {
  userHasTakenControl = true;
  window.searchFeature?.clearImages('carousel');
  pauseRotation(); // fully stop auto-rotation
  if (!isSingleLineMode) scheduleSyncBackend();
}
};


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
