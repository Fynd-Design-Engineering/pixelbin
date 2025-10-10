(() => {
  gsap.registerPlugin(ScrollTrigger);

  /******************************************************************
   * TEXT CONFIG
   ******************************************************************/
  const TEXT = {
    HEADLINE: {
      start:   'Creation made easy',
      create:  'Creation made easy',
      edit:    'Editing made easy',
      enhance: 'Enhancing made easy',
      end:     'What will you make today',
    },
    SUBHEAD: {
      start:   'Create, edit and deliver images within seconds',
      create:  'Create, edit and deliver images within seconds',
      edit:    'Create, edit and deliver images within seconds',
      enhance: 'Create, edit and deliver images within seconds',
      end:     'Create, edit and deliver images within seconds',
    },
    PLACEHOLDER: {
      initial:  'Describe your edit or generation',
      final:    'Describe your edit or generation',
    },
    PROMPTS: [
      'Contemplative astronaut in cave, glowing crystals, cosmic wonder',
      'Show an asian model holding this bottle',
      'Change the background to vibrant seaside sunset view',
      'Upscale this image to 4K, sharper, detailed, ultra-real'
    ],
  };

  /******************************************************************
   * DOM HOOKS
   ******************************************************************/
  const WRAPPER_SEL = '.promt-animtion-wapper';
  const PINNED_SEL  = '#home-hero.section_ai-photo-editor.is-diff';

  const headlineEl     = document.querySelector('.hero-header_component .u-text-style-displayl');
  const subHeadlineEl  = document.querySelector('.hero-header_para-wrapper .u-text-style-l');
  const inputEl        = document.querySelector('input#textInput.text-input');
  const marqueeWrapper = document.querySelector('.marquee-wrapper');
  const genOverlay     = document.querySelector('.generating');
  const scrollMore     = document.querySelector('.scroll-more');

  const pill1 = document.querySelector('.promt-pill-1 .promt-pill._1');
  const pill2 = document.querySelector('.promt-pill-2 .promt-pill._1');
  const pill3 = document.querySelector('.promt-pill-3 .promt-pill._1');
  const pills = [pill1, pill2, pill3].filter(Boolean);

  const pillTexts = TEXT.PROMPTS;

  const bgEls = Array.from(document.querySelectorAll('.promt-image-gen'))
    .sort((a, b) => suffixNum(a) - suffixNum(b));
  function suffixNum(el) { 
    for (const c of el.classList) 
      if (/^_\d+$/.test(c)) return parseInt(c.slice(1), 10); 
    return 0; 
  }

  /******************************************************************
   * CONFIG
   ******************************************************************/
  const SLOTS = [
    { y: 0,  scale: 1.0, opacity: 1.0 },
    { y: 32, scale: 0.8, opacity: 0.8 },
    { y: 56, scale: 0.7, opacity: 0.6 }
  ];

  let origHeadlineColor    = headlineEl ? getComputedStyle(headlineEl).color : '';
  let origSubHeadlineColor = subHeadlineEl ? getComputedStyle(subHeadlineEl).color : '';
  
  const HEADLINE_COLORS = { 
    Default: origHeadlineColor, 
    White: '#ffffff'
  };

  const state = { allowMarquee: false, lockedAtEnd: false };

  /******************************************************************
   * INITIAL STATE - START at bg0 with white styling
   ******************************************************************/
  gsap.set(pills[0], SLOTS[0]);
  gsap.set(pills[1], SLOTS[1]);
  gsap.set(pills[2], SLOTS[2]);

  // Start with bg0 visible
  bgEls.forEach((bg, i) => gsap.set(bg, {
    opacity: i === 0 ? 1 : 0,
    visibility: i === 0 ? 'visible' : 'hidden',
    display: i === 0 ? 'block' : 'none'
  }));

  if (headlineEl) {
    headlineEl.textContent = TEXT.HEADLINE.start;
    headlineEl.style.color = HEADLINE_COLORS.White;
  }
  if (subHeadlineEl) {
    subHeadlineEl.textContent = TEXT.SUBHEAD.start;
    subHeadlineEl.style.color = HEADLINE_COLORS.White;
  }

  if (marqueeWrapper) gsap.set(marqueeWrapper, { autoAlpha: 0 });
  if (genOverlay) gsap.set(genOverlay, { display: 'none', visibility: 'hidden', autoAlpha: 0 });
  if (scrollMore) gsap.set(scrollMore, { autoAlpha: 1 }); // Visible at start
  
  if (inputEl) {
    inputEl.value = TEXT.PROMPTS[0];
    inputEl.setAttribute('value', TEXT.PROMPTS[0]);
    inputEl.placeholder = '';
  }

  setPillsDisplay(true);
  setTryImagesDisplay(false);
  setPlaceholderState('default');
  setNavWhiteMode(true);
  setPillGlass(true);
  applyWhiteInputStyle();

  /******************************************************************
   * HELPER FUNCTIONS
   ******************************************************************/
  function setPillsDisplay(show) {
    const nodes = document.querySelectorAll('.anaimtion-promt-pill');
    nodes.forEach(n => {
      if (show) {
        gsap.set(n, { clearProps: 'all' });
        n.style.display = 'flex';
        n.style.visibility = 'visible';
      } else {
        n.style.cssText += 'display: none !important; visibility: hidden !important;';
      }
    });
  }

  function setTryImagesDisplay(show) {
    const n = document.querySelector('.pb_try-images');
    if (!n) return;
    gsap.set(n, { display: show ? 'block' : 'none', visibility: show ? 'visible' : 'hidden' });
  }

  function setPlaceholderState(mode) {
    const img1 = document.querySelector('.placeholderimage1');
    const img2 = document.querySelector('.placeholderimage2');
    const img3 = document.querySelector('.placeholderimage3');
    const addBtn = document.getElementById('addButton');

    const show = (el) => el && gsap.set(el, { display: 'flex', visibility: 'visible', autoAlpha: 1 });
    const hide = (el) => el && gsap.set(el, { display: 'none', visibility: 'hidden', autoAlpha: 0 });

    switch(mode) {
      case 'p1': show(img1); hide(img2); hide(img3); hide(addBtn); break;
      case 'p2': hide(img1); show(img2); hide(img3); hide(addBtn); break;
      case 'p3': hide(img1); hide(img2); show(img3); hide(addBtn); break;
      default:   hide(img1); hide(img2); hide(img3); show(addBtn);
    }
  }

  function ensureNavWhiteCSS() {
    const prev = document.getElementById('nav-white-mode-css');
    if (prev) prev.remove();

    const css = `
    .nav_component.nav-white-mode .nav_menu-link,
    .nav_component.nav-white-mode .nav_menu-link:hover,
    .nav_component.nav-white-mode .nav_menu-link:focus,
    .nav_component.nav-white-mode .nav_menu-link:active,
    .nav_component.nav-white-mode .nav_dropdown-component,
    .nav_component.nav-white-mode .nav_dropdown-component:hover,
    .nav_component.nav-white-mode .nav_dropdown-component:focus,
    .nav_component.nav-white-mode .nav_dropdown-component:active,
    .nav_component.nav-white-mode .nav_auth_sign_in,
    .nav_component.nav-white-mode .nav_auth_sign_in:hover,
    .nav_component.nav-white-mode .nav_auth_sign_in:focus,
    .nav_component.nav-white-mode .nav_auth_sign_in:active,
    .nav_component.nav-white-mode .is-nav-button,
    .nav_component.nav-white-mode .is-nav-button:hover,
    .nav_component.nav-white-mode .is-nav-button:focus,
    .nav_component.nav-white-mode .is-nav-button:active,
    .nav_component.nav-white-mode .nav_dashboard_btn,
    .nav_component.nav-white-mode .nav_dashboard_btn:hover,
    .nav_component.nav-white-mode .nav_dashboard_btn:focus,
    .nav_component.nav-white-mode .nav_dashboard_btn:active {
      color: #ffffff !important;
    }
    .nav_component.nav-white-mode .is-nav-button,
    .nav_component.nav-white-mode .is-nav-button:hover,
    .nav_component.nav-white-mode .is-nav-button:focus,
    .nav_component.nav-white-mode .is-nav-button:active,
    .nav_component.nav-white-mode .nav_dashboard_btn,
    .nav_component.nav-white-mode .nav_dashboard_btn:hover,
    .nav_component.nav-white-mode .nav_dashboard_btn:focus,
    .nav_component.nav-white-mode .nav_dashboard_btn:active {
      border-color: currentColor !important;
      background-color: transparent !important;
      outline-color: currentColor !important;
    }
    .nav_component.nav-white-mode .nav_dashboard_btn svg,
    .nav_component.nav-white-mode .nav_dashboard_btn:hover svg,
    .nav_component.nav-white-mode .nav_dashboard_btn:focus svg,
    .nav_component.nav-white-mode .nav_dashboard_btn:active svg {
      color: currentColor !important;
      fill: currentColor !important;
      stroke: currentColor !important;
    }
    .nav_component.nav-white-mode .nav_logo-motif,
    .nav_component.nav-white-mode .nav_logo-text,
    .nav_component.nav-white-mode .nav_logo-motif *,
    .nav_component.nav-white-mode .nav_logo-text * {
      fill: #ffffff !important;
      stroke: #ffffff !important;
      color: #ffffff !important;
    }`;

    const style = document.createElement('style');
    style.id = 'nav-white-mode-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function setNavWhiteMode(on) {
    ensureNavWhiteCSS();
    const nav   = document.querySelector('.nav_component');
    const navBg = document.querySelector('.nav_bg-shape');
    const logoNodes = document.querySelectorAll(
      '.nav_logo-motif, .nav_logo-text, .nav_logo-motif *, .nav_logo-text *'
    );

    if (on) {
      nav && nav.classList.add('nav-white-mode');
      if (navBg) gsap.set(navBg, { autoAlpha: 0, display: 'none' });
      gsap.set(logoNodes, { fill: '#ffffff', stroke: '#ffffff', color: '#ffffff' });
    } else {
      nav && nav.classList.remove('nav-white-mode');
      if (navBg) gsap.set(navBg, { clearProps: 'display,visibility,opacity,autoAlpha' });
      gsap.set(logoNodes, { clearProps: 'fill,stroke,color' });
    }
  }

  function setPillGlass(on) {
    const sel = '.promt-pill';
    if (on) {
      gsap.set(sel, { background: 'rgba(255, 255, 255, 0.60)' });
    } else {
      gsap.set(sel, { clearProps: 'background' });
    }
  }

  function applyWhiteInputStyle() {
    const searchForm     = document.querySelector('.search-form');
    const charCounter    = document.querySelector('.char-counter');
    const generateButton = document.querySelector('.generate-button');

    const inputStyle = {
      backdropFilter: 'blur(100px)',
      WebkitBackdropFilter: 'blur(100px)',
      border: '1px solid rgba(255, 255, 255, 1)',
      background: 'rgba(255, 255, 255, 0.3)',
      color: '#ffffff',
      boxShadow: `
        0px 2px 5px 0px rgba(47, 40, 53, 0.15),
        0px 10px 10px 0px rgba(47, 40, 53, 0.13),
        0px 21px 13px 0px rgba(47, 40, 53, 0.08),
        0px 38px 15px 0px rgba(47, 40, 53, 0.02),
        0px 60px 17px 0px rgba(47, 40, 53, 0)
      `
    };

    if (searchForm) gsap.set(searchForm, inputStyle);
    if (inputEl) inputEl.style.color = '#ffffff';
    if (charCounter) gsap.set(charCounter, { color: '#ffffff' });
    if (generateButton) gsap.set(generateButton, { background: '#ffffff', color: '#000000' });
  }

  function removeWhiteInputStyle() {
    const searchForm     = document.querySelector('.search-form');
    const charCounter    = document.querySelector('.char-counter');
    const generateButton = document.querySelector('.generate-button');

    if (searchForm) gsap.set(searchForm, { clearProps: 'all' });
    if (inputEl) inputEl.style.color = '';
    if (charCounter) gsap.set(charCounter, { clearProps: 'color' });
    if (generateButton) gsap.set(generateButton, { clearProps: 'background,color' });
  }

  function prepareAllBgs() {
    bgEls.forEach(bg => {
      gsap.set(bg, { display: 'block', visibility: 'visible' });
    });
  }

  function setHeadline(text, color) {
    if (!headlineEl) return;
    headlineEl.textContent = text;
    headlineEl.style.color = color;
    if (subHeadlineEl) {
      subHeadlineEl.style.color = color;
    }
  }

  function setRealInputValue(el, text) {
    if (!el) return;
    const next = String(text ?? '');
    el.value = next;
    el.setAttribute('value', next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /******************************************************************
   * MASTER TIMELINE - FLUID ANIMATIONS
   ******************************************************************/
  const master = gsap.timeline({ paused: true });

  // Prepare all backgrounds to be visible for crossfading
  prepareAllBgs();

  // PILL 1 JOURNEY - FLUID MOVEMENTS
  // Scroll 1-2: Pill 1 moves up and exits (ANIMATED - user sees movement)
  master.to(pills[0], { ...SLOTS[0], duration: 1, ease: 'none' });
  if (pills[1]) master.to(pills[1], { ...SLOTS[1], duration: 1, ease: 'none' }, '<');
  if (pills[2]) master.to(pills[2], { ...SLOTS[2], duration: 1, ease: 'none' }, '<');
  
  master.to(pills[0], { yPercent: -120, autoAlpha: 0, duration: 1, ease: 'none' });
  if (pills[1]) master.to(pills[1], { ...SLOTS[0], duration: 1, ease: 'none' }, '<');
  if (pills[2]) master.to(pills[2], { ...SLOTS[1], duration: 1, ease: 'none' }, '<');

  // Scroll 3: Text changes + thumbnail 1 shows (INSTANT snap point)
  master.add(() => {
    setRealInputValue(inputEl, TEXT.PROMPTS[1]);
    setPlaceholderState('p1');
  });

  // Scroll 4: Background crossfade bg0 → bg1 (ANIMATED - user sees fade)
  master.to(bgEls[0], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[1], { opacity: 1, duration: 1.5, ease: 'none' }, '<');

  // Scroll 5: Generating shows (ANIMATED - user sees fade in)
  master.to(genOverlay, { 
    display: 'block',
    visibility: 'visible',
    autoAlpha: 1, 
    duration: 0.8, 
    ease: 'none',
    onStart: () => {
      if (genOverlay) {
        genOverlay.style.display = 'block';
        genOverlay.style.visibility = 'visible';
      }
    }
  });

  // Scroll 6: bg1 → bg2, generating hides (ANIMATED crossfade)
  master.to(bgEls[1], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[2], { opacity: 1, duration: 1.5, ease: 'none' }, '<');
  master.to(genOverlay, { 
    autoAlpha: 0, 
    duration: 0.8, 
    ease: 'none',
    onComplete: () => {
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<');
  
  master.addLabel('pill1End');

  // PILL 2 JOURNEY - FLUID MOVEMENTS
  // Scroll 7: Pill 2 exits (ANIMATED)
  master.to(pills[1], { yPercent: -120, autoAlpha: 0, duration: 1, ease: 'none' });
  if (pills[2]) master.to(pills[2], { ...SLOTS[0], duration: 1, ease: 'none' }, '<');

  // Scroll 8: Text + headline + thumbnail changes (INSTANT snap point)
  master.add(() => {
    setRealInputValue(inputEl, TEXT.PROMPTS[2]);
    setHeadline(TEXT.HEADLINE.edit, HEADLINE_COLORS.White);
    setPlaceholderState('p2');
  });

  // Scroll 9: Background bg2 → bg3 (ANIMATED crossfade)
  master.to(bgEls[2], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[3], { opacity: 1, duration: 1.5, ease: 'none' }, '<');

  // Scroll 10: Generating shows (ANIMATED)
  master.to(genOverlay, { 
    display: 'block',
    visibility: 'visible',
    autoAlpha: 1, 
    duration: 0.8, 
    ease: 'none',
    onStart: () => {
      if (genOverlay) {
        genOverlay.style.display = 'block';
        genOverlay.style.visibility = 'visible';
      }
    }
  });

  // Scroll 11: bg3 → bg4, generating hides (ANIMATED)
  master.to(bgEls[3], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[4], { opacity: 1, duration: 1.5, ease: 'none' }, '<');
  master.to(genOverlay, { 
    autoAlpha: 0, 
    duration: 0.8, 
    ease: 'none',
    onComplete: () => {
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<');
  
  master.addLabel('pill2End');

  // PILL 3 JOURNEY - FLUID MOVEMENTS
  // Scroll 12: Pill 3 exits (ANIMATED)
  master.to(pills[2], { yPercent: -120, autoAlpha: 0, duration: 1, ease: 'none' });

  // Scroll 13: Text + headline + thumbnail changes (INSTANT snap point)
  master.add(() => {
    setRealInputValue(inputEl, TEXT.PROMPTS[3]);
    setHeadline(TEXT.HEADLINE.enhance, HEADLINE_COLORS.White);
    setPlaceholderState('p3');
  });

  // Scroll 14: Background bg4 → bg5 (ANIMATED crossfade)
  master.to(bgEls[4], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[5], { opacity: 1, duration: 1.5, ease: 'none' }, '<');

  // Scroll 15: Generating shows (ANIMATED)
  master.to(genOverlay, { 
    display: 'block',
    visibility: 'visible',
    autoAlpha: 1, 
    duration: 0.8, 
    ease: 'none',
    onStart: () => {
      if (genOverlay) {
        genOverlay.style.display = 'block';
        genOverlay.style.visibility = 'visible';
      }
    }
  });

  // Scroll 16: bg5 → bg6, generating hides (ANIMATED)
  master.to(bgEls[5], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[6], { opacity: 1, duration: 1.5, ease: 'none' }, '<');
  master.to(genOverlay, { 
    autoAlpha: 0, 
    duration: 0.8, 
    ease: 'none',
    onComplete: () => {
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<');
  
  master.addLabel('pill3End');

  // END STAGE - FLUID TRANSITION
  // Input fades out (ANIMATED)
  master.to(inputEl, { autoAlpha: 0, duration: 0.8, ease: 'none' });
  
  // Style changes (INSTANT snap point)
  master.add(() => {
    setHeadline(TEXT.HEADLINE.end, HEADLINE_COLORS.Default);
    setNavWhiteMode(false);
    removeWhiteInputStyle();
    setPillGlass(false);
    setPlaceholderState('default');
    state.allowMarquee = true;
    setRealInputValue(inputEl, '');
    if (inputEl) inputEl.placeholder = TEXT.PLACEHOLDER.final;
    setPillsDisplay(false);
    setTryImagesDisplay(true);
    
    // Hide scroll-more indicator at end
    if (scrollMore) gsap.set(scrollMore, { autoAlpha: 0 });
  });

  // Background bg6 → bg7 (ANIMATED crossfade)
  master.to(bgEls[6], { opacity: 0, duration: 1.5, ease: 'none' });
  master.to(bgEls[7], { opacity: 1, duration: 1.5, ease: 'none' }, '<');
  
  // Input fades back in + marquee (ANIMATED)
  master.to(inputEl, { autoAlpha: 1, duration: 0.8, ease: 'none' });
  if (marqueeWrapper) {
    master.to(marqueeWrapper, { autoAlpha: 1, duration: 1, ease: 'none' }, '<');
  }
  
  master.addLabel('end');

  /******************************************************************
   * SCROLLTRIGGER - SMOOTH SCRUB, NO SNAP
   ******************************************************************/
  function lockToEnd() {
    const st = ScrollTrigger.getById('hero');
    state.lockedAtEnd = true;
    if (st) {
      st.animation.progress(1).pause();
      st.scroll(st.end);
    }
  }

  ScrollTrigger.create({
    id: 'hero',
    animation: master,
    trigger: WRAPPER_SEL,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5, // Smooth scrub - animations follow scroll immediately
    pin: PINNED_SEL,
    anticipatePin: 1,
    // NO SNAP - pure fluid scroll
    onUpdate(self) {
      if (!state.lockedAtEnd && (self.progress >= 0.999 || self.animation.progress() >= 0.999)) {
        lockToEnd();
        return;
      }
      if (state.lockedAtEnd) {
        self.animation.progress(1);
        self.scroll(self.end);
      }
    },
    onLeave() {
      if (!state.lockedAtEnd) lockToEnd();
    }
  });

  /******************************************************************
   * JUMP TO END ON INPUT FOCUS
   ******************************************************************/
  function fadeJumpToEnd() {
    if (state.lockedAtEnd) return;

    const st = ScrollTrigger.getById('hero');
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        state.lockedAtEnd = true;
        if (st) st.scroll(st.end);
        master.progress(1).pause();
      }
    });

    tl.to(['.anaimtion-promt-pill', inputEl].filter(Boolean), {
      autoAlpha: 0, yPercent: -10, duration: 0.25, stagger: 0.05
    });
    
    tl.add(() => {
      setPillsDisplay(false);
      setTryImagesDisplay(true);
      state.allowMarquee = true;
      
      // Show bg7
      bgEls.forEach((bg, i) => {
        gsap.set(bg, { opacity: i === 7 ? 1 : 0 });
      });
      
      setHeadline(TEXT.HEADLINE.end, HEADLINE_COLORS.Default);
      setNavWhiteMode(false);
      removeWhiteInputStyle();
      setPillGlass(false);
      setPlaceholderState('default');
      
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
      
      // Hide scroll-more indicator at end
      if (scrollMore) gsap.set(scrollMore, { autoAlpha: 0 });
      
      setRealInputValue(inputEl, '');
      if (inputEl) inputEl.placeholder = TEXT.PLACEHOLDER.final;
      
      if (st) st.scroll(st.end);
      master.progress(1).pause();
    });

    tl.to(inputEl, { autoAlpha: 1, yPercent: 0, duration: 0.25 });
    if (marqueeWrapper) tl.to(marqueeWrapper, { autoAlpha: 1, duration: 0.35 }, '<');
  }

  if (inputEl) {
    inputEl.addEventListener('focus', fadeJumpToEnd, { passive: true });
    inputEl.addEventListener('pointerdown', fadeJumpToEnd, { passive: true });
  }

  /******************************************************************
   * REDUCED MOTION
   ******************************************************************/
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mql.matches) {
    ScrollTrigger.getAll().forEach(st => st.disable());
    gsap.set('.anaimtion-promt-pill', { autoAlpha: 1, display: 'flex', visibility: 'visible' });
    setTryImagesDisplay(false);
    gsap.set(marqueeWrapper, { autoAlpha: 1 });
    bgEls.forEach((bg, i) => gsap.set(bg, { opacity: i === 0 ? 1 : 0 }));
    if (genOverlay) {
      genOverlay.style.display = 'none';
      genOverlay.style.visibility = 'hidden';
    }
    setHeadline(TEXT.HEADLINE.start, HEADLINE_COLORS.White);
    setPlaceholderState('default');
    setNavWhiteMode(true);
    applyWhiteInputStyle();
    setPillGlass(true);
  }
})();
