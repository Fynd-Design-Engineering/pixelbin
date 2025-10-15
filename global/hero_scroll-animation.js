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
      'Remove the sofa and table from this image'
    ],
  };

  /******************************************************************
   * DOM HOOKS
   ******************************************************************/
  const WRAPPER_SEL = '.promt-animtion-wapper';
  const PINNED_SEL  = '#home-hero.section_ai-photo-editor.is-diff';

  const headlineEl     = document.querySelector('.hero-header_component .u-text-style-displayl');
  const subHeadlineEl  = document.querySelector('.hero-header_para-wrapper .u-text-style-l');
  const pageTitleEl    = document.querySelector('.page-title');
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
    { y: 32, scale: 0.92, opacity: 0.85 },
    { y: 56, scale: 0.85, opacity: 0.7 }
  ];

  let origHeadlineColor    = headlineEl ? getComputedStyle(headlineEl).color : '';
  let origSubHeadlineColor = subHeadlineEl ? getComputedStyle(subHeadlineEl).color : '';
  let origPageTitleColor   = pageTitleEl ? getComputedStyle(pageTitleEl).color : '';
  
  const HEADLINE_COLORS = { 
    Default: origHeadlineColor, 
    White: '#ffffff'
  };
  const PAGETITLE_COLORS = {
    Default: origPageTitleColor,
    White: '#ffffff'
  };

  const state = { allowMarquee: false, lockedAtEnd: false };

  /******************************************************************
   * PREMIUM ENHANCEMENTS SETUP
   ******************************************************************/
  function setupPremiumEffects() {
    bgEls.forEach((bg, i) => {
      if (!bg) return;
      
      gsap.set(bg, {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        visibility: 'visible',
        transformOrigin: 'center center'
      });
      
      if (i === 0) {
        gsap.set(bg, { 
          opacity: 1, 
          zIndex: -10,
          scale: 1,
          filter: 'blur(0px)'
        });
      } 
      else if (i === 1 || i === 3 || i === 5) {
        gsap.set(bg, { 
          opacity: 1, 
          zIndex: -9,
          scale: 1.1,
          clipPath: 'circle(0% at 50% 50%)',
          webkitClipPath: 'circle(0% at 50% 50%)',
          filter: 'blur(0px)'
        });
      } 
      else {
        gsap.set(bg, { 
          opacity: 0, 
          zIndex: -8,
          scale: 1,
          filter: 'blur(0px)'
        });
      }
    });

    if (scrollMore) {
      gsap.to(scrollMore, {
        y: 10,
        opacity: 0.6,
        duration: 1.5,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true
      });
    }
  }

  /******************************************************************
   * INITIAL STATE
   ******************************************************************/
  gsap.set(pills[0], SLOTS[0]);
  gsap.set(pills[1], SLOTS[1]);
  gsap.set(pills[2], SLOTS[2]);

  setupPremiumEffects();

  if (headlineEl) {
    headlineEl.textContent = TEXT.HEADLINE.start;
    headlineEl.style.color = HEADLINE_COLORS.White;
  }
  if (subHeadlineEl) {
    subHeadlineEl.textContent = TEXT.SUBHEAD.start;
    subHeadlineEl.style.color = HEADLINE_COLORS.White;
  }
  if (pageTitleEl) {
    pageTitleEl.style.color = PAGETITLE_COLORS.White;
  }

  if (marqueeWrapper) gsap.set(marqueeWrapper, { autoAlpha: 0 });
  if (genOverlay) gsap.set(genOverlay, { display: 'none', visibility: 'hidden', autoAlpha: 0 });
  if (scrollMore) gsap.set(scrollMore, { display: 'block', visibility: 'visible', autoAlpha: 1 });
  
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
      transition: color 0.3s ease, opacity 0.3s ease !important;
    }
    .nav_component.nav-white-mode .nav_menu-link:hover,
    .nav_component.nav-white-mode .nav_dropdown-component:hover {
      opacity: 0.8 !important;
    }
    .nav_component.nav-white-mode .is-nav-button,
    .nav_component.nav-white-mode .is-nav-button:hover,
    .nav_component.nav-white-mode .is-nav-button:focus,
    .nav_component.nav-white-mode .is-nav-button:active,
    .nav_component.nav-white-mode .nav_dashboard_btn,
    .nav_component.nav-white-mode .nav_dashboard_btn:hover,
    .nav_component.nav-white-mode .nav_dashboard_btn:focus,
    .nav_component.nav-white-mode .nav_dashboard_btn:active {
      border-color: rgba(255, 255, 255, 0.3) !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px) !important;
      transition: all 0.3s ease !important;
    }
    .nav_component.nav-white-mode .is-nav-button:hover,
    .nav_component.nav-white-mode .nav_dashboard_btn:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
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
      transition: opacity 0.3s ease !important;
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
      if (navBg) gsap.to(navBg, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' });
      gsap.to(logoNodes, { fill: '#ffffff', stroke: '#ffffff', color: '#ffffff', duration: 0.6, ease: 'power2.out' });
    } else {
      nav && nav.classList.remove('nav-white-mode');
      if (navBg) gsap.to(navBg, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' });
      gsap.to(logoNodes, { clearProps: 'fill,stroke,color', duration: 0.6, ease: 'power2.out' });
    }
  }

  function setPillGlass(on) {
    const sel = '.promt-pill';
    if (on) {
      gsap.to(sel, { 
        background: 'rgba(255, 255, 255, 0.60)',
        backdropFilter: 'blur(20px)',
        duration: 0.4,
        ease: 'power2.out'
      });
    } else {
      gsap.to(sel, { clearProps: 'background,backdropFilter', duration: 0.4, ease: 'power2.out' });
    }
  }

  function applyWhiteInputStyle() {
    const searchForm     = document.querySelector('.search-form');
    const charCounter    = document.querySelector('.char-counter');
    const generateButton = document.querySelector('.generate-button');

    const inputStyle = {
      backdropFilter: 'blur(100px)',
      WebkitBackdropFilter: 'blur(100px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.15)',
      color: '#ffffff',
      boxShadow: `
        0px 4px 6px -1px rgba(0, 0, 0, 0.1),
        0px 2px 4px -1px rgba(0, 0, 0, 0.06),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset
      `
    };

    if (searchForm) gsap.to(searchForm, { ...inputStyle, duration: 0.6, ease: 'power2.out' });
    if (inputEl) gsap.to(inputEl, { color: '#ffffff', duration: 0.6, ease: 'power2.out' });
    if (charCounter) gsap.to(charCounter, { color: 'rgba(255, 255, 255, 0.7)', duration: 0.6, ease: 'power2.out' });
    if (generateButton) gsap.to(generateButton, { 
      background: '#ffffff', 
      color: '#000000',
      duration: 0.6,
      ease: 'power2.out'
    });
  }

  function removeWhiteInputStyle() {
    const searchForm     = document.querySelector('.search-form');
    const charCounter    = document.querySelector('.char-counter');
    const generateButton = document.querySelector('.generate-button');

    if (searchForm) gsap.to(searchForm, { clearProps: 'all', duration: 0.6, ease: 'power2.out' });
    if (inputEl) gsap.to(inputEl, { clearProps: 'color', duration: 0.6, ease: 'power2.out' });
    if (charCounter) gsap.to(charCounter, { clearProps: 'color', duration: 0.6, ease: 'power2.out' });
    if (generateButton) gsap.to(generateButton, { clearProps: 'background,color', duration: 0.6, ease: 'power2.out' });
  }

  function setHeadline(text, color) {
    if (!headlineEl) return;
    
    gsap.to(headlineEl, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        headlineEl.textContent = text;
        headlineEl.style.color = color;
        gsap.fromTo(headlineEl, 
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    });
    
    if (subHeadlineEl) {
      gsap.to(subHeadlineEl, { color: color, duration: 0.6, ease: 'power2.out' });
    }
    if (pageTitleEl) {
      gsap.to(pageTitleEl, { color: color, duration: 0.6, ease: 'power2.out' });
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
   * MASTER TIMELINE - WITH SYNCED OVERLAY
   ******************************************************************/
  const master = gsap.timeline({ paused: true });

  // PILL 1 JOURNEY
  master.to(pills[0], { yPercent: -120, autoAlpha: 0, duration: 2.5, ease: 'power2.inOut' });
  if (pills[1]) master.to(pills[1], { ...SLOTS[0], duration: 2.5, ease: 'power2.inOut' }, '<');
  if (pills[2]) master.to(pills[2], { ...SLOTS[1], duration: 2.5, ease: 'power2.inOut' }, '<');

  master.add(gsap.to({}, {
    duration: 0.01,
    onComplete: () => {
      setRealInputValue(inputEl, TEXT.PROMPTS[1]);
      setPlaceholderState('p1');
    },
    onReverseComplete: () => {
      setRealInputValue(inputEl, TEXT.PROMPTS[0]);
      setPlaceholderState('default');
    }
  }));

  // ✨ IRIS REVEAL: bg1
  master.to(bgEls[1], {
    clipPath: 'circle(150% at 50% 50%)',
    webkitClipPath: 'circle(150% at 50% 50%)',
    scale: 1,
    duration: 4,
    ease: 'power3.out',
    onStart: () => {
      if (bgEls[1]) gsap.set(bgEls[1], { zIndex: -8 });
    },
    onReverseComplete: () => {
      if (bgEls[1]) {
        bgEls[1].style.clipPath = 'circle(0% at 50% 50%)';
        bgEls[1].style.webkitClipPath = 'circle(0% at 50% 50%)';
        gsap.set(bgEls[1], { zIndex: -9, scale: 1.1 });
      }
    }
  });

  master.to(bgEls[0], { 
    filter: 'blur(10px)', 
    opacity: 0.3,
    duration: 2,
    ease: 'power2.out'
  }, '<');

  // 🟦 GENERATING OVERLAY - SYNCED WITH IRIS!
  master.to(genOverlay, { 
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    clipPath: 'circle(150% at 50% 50%)',
    webkitClipPath: 'circle(150% at 50% 50%)',
    duration: 4,
    ease: 'power3.out',
    onStart: () => {
      if (genOverlay) {
        genOverlay.style.display = 'block';
        genOverlay.style.visibility = 'visible';
        genOverlay.style.clipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.webkitClipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.opacity = '1';
      }
    },
    onReverseComplete: () => {
      if (genOverlay) {
        genOverlay.style.clipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.webkitClipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<');

  master.to(bgEls[2], { 
    opacity: 1, 
    zIndex: -7,
    scale: 1,
    duration: 2.5, 
    ease: 'power2.out'
  });
  
  master.to(genOverlay, { 
    opacity: 0,
    duration: 1.2, 
    ease: 'power2.in',
    onComplete: () => {
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<+=0.5');
  
  master.addLabel('pill1End');

  // PILL 2 JOURNEY
  master.to(pills[1], { yPercent: -120, autoAlpha: 0, duration: 2.5, ease: 'power2.inOut' });
  if (pills[2]) master.to(pills[2], { ...SLOTS[0], duration: 2.5, ease: 'power2.inOut' }, '<');

  master.add(gsap.to({}, {
    duration: 0.01,
    onComplete: () => {
      setRealInputValue(inputEl, TEXT.PROMPTS[2]);
      setHeadline(TEXT.HEADLINE.edit, HEADLINE_COLORS.White);
      setPlaceholderState('p2');
    },
    onReverseComplete: () => {
      setRealInputValue(inputEl, TEXT.PROMPTS[1]);
      setHeadline(TEXT.HEADLINE.create, HEADLINE_COLORS.White);
      setPlaceholderState('p1');
    }
  }));

  // ✨ IRIS REVEAL: bg3
  master.to(bgEls[3], {
    clipPath: 'circle(150% at 50% 50%)',
    webkitClipPath: 'circle(150% at 50% 50%)',
    scale: 1,
    duration: 4,
    ease: 'power3.out',
    onStart: () => {
      if (bgEls[3]) gsap.set(bgEls[3], { zIndex: -6 });
    },
    onReverseComplete: () => {
      if (bgEls[3]) {
        bgEls[3].style.clipPath = 'circle(0% at 50% 50%)';
        bgEls[3].style.webkitClipPath = 'circle(0% at 50% 50%)';
        gsap.set(bgEls[3], { zIndex: -9, scale: 1.1 });
      }
    }
  });

  master.to(bgEls[2], { 
    filter: 'blur(10px)', 
    opacity: 0.3,
    duration: 2,
    ease: 'power2.out'
  }, '<');

  // 🟦 GENERATING OVERLAY - SYNCED WITH IRIS!
  master.to(genOverlay, { 
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    clipPath: 'circle(150% at 50% 50%)',
    webkitClipPath: 'circle(150% at 50% 50%)',
    duration: 4,
    ease: 'power3.out',
    onStart: () => {
      if (genOverlay) {
        genOverlay.style.display = 'block';
        genOverlay.style.visibility = 'visible';
        genOverlay.style.clipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.webkitClipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.opacity = '1';
      }
    },
    onReverseComplete: () => {
      if (genOverlay) {
        genOverlay.style.clipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.webkitClipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<');

  master.to(bgEls[4], { 
    opacity: 1, 
    zIndex: -5,
    scale: 1,
    duration: 2.5, 
    ease: 'power2.out'
  });
  
  master.to(genOverlay, { 
    opacity: 0,
    duration: 1.2, 
    ease: 'power2.in',
    onComplete: () => {
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<+=0.5');
  
  master.addLabel('pill2End');

  // PILL 3 JOURNEY
  master.to(pills[2], { yPercent: -120, autoAlpha: 0, duration: 2.5, ease: 'power2.inOut' });

  master.add(gsap.to({}, {
    duration: 0.01,
    onComplete: () => {
      setRealInputValue(inputEl, TEXT.PROMPTS[3]);
      setHeadline(TEXT.HEADLINE.enhance, HEADLINE_COLORS.White);
      setPlaceholderState('p3');
    },
    onReverseComplete: () => {
      setRealInputValue(inputEl, TEXT.PROMPTS[2]);
      setHeadline(TEXT.HEADLINE.edit, HEADLINE_COLORS.White);
      setPlaceholderState('p2');
    }
  }));

  // ✨ IRIS REVEAL: bg5
  master.to(bgEls[5], {
    clipPath: 'circle(150% at 50% 50%)',
    webkitClipPath: 'circle(150% at 50% 50%)',
    scale: 1,
    duration: 4,
    ease: 'power3.out',
    onStart: () => {
      if (bgEls[5]) gsap.set(bgEls[5], { zIndex: -4 });
    },
    onReverseComplete: () => {
      if (bgEls[5]) {
        bgEls[5].style.clipPath = 'circle(0% at 50% 50%)';
        bgEls[5].style.webkitClipPath = 'circle(0% at 50% 50%)';
        gsap.set(bgEls[5], { zIndex: -9, scale: 1.1 });
      }
    }
  });

  master.to(bgEls[4], { 
    filter: 'blur(10px)', 
    opacity: 0.3,
    duration: 2,
    ease: 'power2.out'
  }, '<');

  // 🟦 GENERATING OVERLAY - SYNCED WITH IRIS!
  master.to(genOverlay, { 
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    clipPath: 'circle(150% at 50% 50%)',
    webkitClipPath: 'circle(150% at 50% 50%)',
    duration: 4,
    ease: 'power3.out',
    onStart: () => {
      if (genOverlay) {
        genOverlay.style.display = 'block';
        genOverlay.style.visibility = 'visible';
        genOverlay.style.clipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.webkitClipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.opacity = '1';
      }
    },
    onReverseComplete: () => {
      if (genOverlay) {
        genOverlay.style.clipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.webkitClipPath = 'circle(0% at 50% 50%)';
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<');

  master.to(bgEls[6], { 
    opacity: 1, 
    zIndex: -3,
    scale: 1,
    duration: 2.5, 
    ease: 'power2.out'
  });
  
  master.to(genOverlay, { 
    opacity: 0,
    duration: 1.2, 
    ease: 'power2.in',
    onComplete: () => {
      if (genOverlay) {
        genOverlay.style.display = 'none';
        genOverlay.style.visibility = 'hidden';
      }
    }
  }, '<+=0.5');
  
  master.addLabel('pill3End');

  // END STAGE
  master.to(inputEl, { autoAlpha: 0, y: -20, duration: 1.2, ease: 'power2.in' });
  
  master.add(gsap.to({}, {
    duration: 0.01,
    onComplete: () => {
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
      if (scrollMore) gsap.to(scrollMore, { autoAlpha: 0, duration: 0.6, ease: 'power2.out' });
    },
    onReverseComplete: () => {
      setHeadline(TEXT.HEADLINE.enhance, HEADLINE_COLORS.White);
      setNavWhiteMode(true);
      applyWhiteInputStyle();
      setPillGlass(true);
      setPlaceholderState('p3');
      state.allowMarquee = false;
      setRealInputValue(inputEl, TEXT.PROMPTS[3]);
      if (inputEl) inputEl.placeholder = '';
      setPillsDisplay(true);
      setTryImagesDisplay(false);
      if (scrollMore) gsap.to(scrollMore, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' });
    }
  }));

  master.fromTo(bgEls[7], 
    { opacity: 0, scale: 1.05 },
    { 
      opacity: 1, 
      scale: 1,
      zIndex: -2,
      duration: 3, 
      ease: 'power3.out'
    }
  );
  
  master.to(inputEl, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' });
  if (marqueeWrapper) {
    master.to(marqueeWrapper, { autoAlpha: 1, duration: 2, ease: 'power2.out' }, '<');
  }
  
  master.addLabel('end');

  /******************************************************************
   * SCROLLTRIGGER
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
    scrub: 1.2,
    pin: PINNED_SEL,
    anticipatePin: 1,
    onUpdate(self) {
      if (state.lockedAtEnd) {
        if (self.progress < 0.999) {
          self.scroll(self.end);
        }
        return;
      }
      
      if (self.progress >= 0.999 || self.animation.progress() >= 0.999) {
        lockToEnd();
      }
    },
    onLeave() {
      if (!state.lockedAtEnd) lockToEnd();
    }
  });

  /******************************************************************
   * JUMP TO END
   ******************************************************************/
  function fadeJumpToEnd() {
    if (state.lockedAtEnd) return;

    const currentInputValue = inputEl ? inputEl.value : '';

    const st = ScrollTrigger.getById('hero');
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        state.lockedAtEnd = true;
        if (st) {
          st.scroll(st.end);
        }
        master.progress(1).pause();
      }
    });

    tl.to(['.anaimtion-promt-pill', inputEl].filter(Boolean), {
      autoAlpha: 0, 
      yPercent: -20, 
      scale: 0.95,
      duration: 0.4, 
      stagger: 0.08,
      ease: 'power2.in'
    });
    
    tl.add(() => {
      setPillsDisplay(false);
      setTryImagesDisplay(true);
      state.allowMarquee = true;
      
      bgEls.forEach((bg, i) => {
        gsap.set(bg, { 
          opacity: i === 7 ? 1 : 0, 
          zIndex: -10 + i,
          scale: i === 7 ? 1 : 1.05,
          filter: i === 7 ? 'blur(0px)' : 'blur(10px)'
        });
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
      
      if (scrollMore) gsap.to(scrollMore, { autoAlpha: 0, duration: 0.4 });
      
      setRealInputValue(inputEl, currentInputValue);
      if (inputEl) inputEl.placeholder = currentInputValue ? '' : TEXT.PLACEHOLDER.final;
      
      if (st) st.scroll(st.end);
      master.progress(1).pause();
    });

    tl.to(inputEl, { 
      autoAlpha: 1, 
      yPercent: 0, 
      scale: 1,
      duration: 0.5,
      ease: 'power3.out'
    });
    if (marqueeWrapper) tl.to(marqueeWrapper, { autoAlpha: 1, duration: 0.6 }, '<+=0.2');
  }

  if (inputEl) {
    inputEl.addEventListener('focus', fadeJumpToEnd, { passive: true });
    inputEl.addEventListener('pointerdown', fadeJumpToEnd, { passive: true });
  }

  const addButton = document.getElementById('addButton');
  if (addButton) {
    addButton.addEventListener('click', fadeJumpToEnd, { passive: true });
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
    if (scrollMore) gsap.set(scrollMore, { display: 'block', visibility: 'visible', autoAlpha: 1 });
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
