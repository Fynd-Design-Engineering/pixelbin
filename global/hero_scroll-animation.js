(() => {
  gsap.registerPlugin(ScrollTrigger);

  /******************************************************************
   * TEXT CONFIG (Edit everything here)
   ******************************************************************/
  const TEXT = {
    HEADLINE: {
      default:  'What will you make today',
      create:   'Creation made easy',
      edit:     'Editing made easy',
      enhance:  'Enhancing made easy',
    },
    SUBHEAD: {
      default:  'Create, edit and deliver images within seconds',
      create:   'Create, edit and deliver images within seconds',
      edit:     'Create, edit and deliver images within seconds',
      enhance:  'Create, edit and deliver images within seconds',
    },
    PLACEHOLDER: {
      initial:  'What would you like to create today',
      final:    'What would you like to create today',
    },
    PROMPTS: [
      'Dramatic woman in black dress, red purple moody light',
      'Change the background to vibrant seaside sunset view',
      'Upscale this image to 4K, sharper, detailed, ultra-real'
    ],
  };

  // Image URLs used for auto-injection
  const IMG_EDIT =
    'https://cdn.prod.website-files.com/673193e0642e6ad25696fcd4/68d4eaa730a11decd3b6fef1_Editing-1.png';
  const IMG_ENHANCE =
    'https://cdn.prod.website-files.com/673193e0642e6ad25696fcd4/68d4eae9f081f193bcf87c14_Before%20-%20enhance.png';

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

  const pill1 = document.querySelector('.promt-pill-1 .promt-pill._1');
  const pill2 = document.querySelector('.promt-pill-2 .promt-pill._1');
  const pill3 = document.querySelector('.promt-pill-3 .promt-pill._1');
  const pills = [pill1, pill2, pill3].filter(Boolean);

  const pillTexts = [0,1,2].map(i => {
    const fromConfig = TEXT.PROMPTS[i] && TEXT.PROMPTS[i].trim();
    if (fromConfig) return fromConfig;
    const p = pills[i];
    return p?.querySelector('.gen_text')?.textContent?.trim() || '';
  });

  const bgEls = Array.from(document.querySelectorAll('.promt-image-gen'))
    .sort((a, b) => suffixNum(a) - suffixNum(b));
  function suffixNum(el) { for (const c of el.classList) if (/^_\d+$/.test(c)) return parseInt(c.slice(1), 10); return 0; }

  /******************************************************************
   * CONFIG (colors, geometry)
   ******************************************************************/
  const SLOTS = [
    { y: 0,  scale: 1.0, opacity: 1.0 },
    { y: 32, scale: 0.8, opacity: 0.8 },
    { y: 56, scale: 0.7, opacity: 0.6 }
  ];

  let origHeadlineColor    = headlineEl ? getComputedStyle(headlineEl).color : '';
  let origSubHeadlineColor = subHeadlineEl ? getComputedStyle(subHeadlineEl).color : '';
  const HEADLINE_COLORS = { Default: origHeadlineColor, Create: '#ffffff', Edit: '#ffffff', Enhance: '#ffffff' };
  const SUBHEAD_COLORS   = { Default: origSubHeadlineColor, Create: '#ffffff', Edit: '#ffffff', Enhance: '#ffffff' };

  // State
  const state = { allowMarquee: false, lockedAtEnd: false };

  /******************************************************************
   * INITIAL STATE
   ******************************************************************/
  gsap.set(pills[0], SLOTS[0]);
  gsap.set(pills[1], SLOTS[1]);
  gsap.set(pills[2], SLOTS[2]);

  // backgrounds: hidden ones take no space
  bgEls.forEach((bg, i) => gsap.set(bg, {
    opacity: i === 0 ? 1 : 0,
    visibility: i === 0 ? 'visible' : 'hidden',
    display: i === 0 ? 'block' : 'none'
  }));

  if (headlineEl) setHeadline('default', true);
  if (marqueeWrapper) gsap.set(marqueeWrapper, { autoAlpha: 0 });
  if (genOverlay) gsap.set(genOverlay, { autoAlpha: 0 });
  if (inputEl) {
    inputEl.dataset.origPlaceholder = TEXT.PLACEHOLDER.initial;
    inputEl.placeholder = TEXT.PLACEHOLDER.initial;
    inputEl.value = '';
    inputEl.setAttribute('value', '');
  }

  // ★ Ensure Start layout: pills visible (flex), try-images hidden
  setPillsDisplay(true);
  setTryImagesDisplay(false);

  /******************************************************************
   * IMAGE INJECTION HELPERS
   ******************************************************************/
  let _runId = 0;
  let _abort = null;
  function bumpRun() {
    _runId++;
    try { _abort?.abort(); } catch (_) {}
    _abort = ('AbortController' in window) ? new AbortController() : null;
    return { runId: _runId, signal: _abort?.signal };
  }

  function clearAllInjectedImages({ double = true } = {}) {
    const doClear = () => {
      document.querySelectorAll('#imagesSection .image-close').forEach(btn => btn.click());
      const fi = document.getElementById('fileInput');
      if (fi) fi.value = '';
    };
    doClear();
    if (double) requestAnimationFrame(doClear);
  }

  async function injectImageViaFileInput(url, runId, signal) {
    const fi = document.getElementById('fileInput');
    if (!fi || !url) return;
    try {
      const res = await fetch(url, { mode: 'cors', signal });
      if (runId !== _runId) return;
      if (!res.ok) return;
      const blob = await res.blob();
      if (runId !== _runId) return;
      const name = (url.split('/').pop() || 'image.png').split('?')[0];
      const file = new File([blob], name, { type: blob.type || 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      fi.files = dt.files;
      fi.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {
      if (err?.name !== 'AbortError') console.warn('[HERO] inject error', err);
    }
  }

  /******************************************************************
   * HELPERS (‼️ restored)
   ******************************************************************/
  // Use flex so your pill row layout stays intact
function setPillsDisplay(show) {
  const nodes = document.querySelectorAll('.anaimtion-promt-pill');
  nodes.forEach(n => {
    if (show) {
      gsap.set(n, { clearProps: 'all' }); // remove any inline overrides
      n.style.display = 'flex';
      n.style.visibility = 'visible';
    } else {
      // use cssText to force !important
      n.style.cssText += 'display: none !important; visibility: hidden !important;';
    }
  });
}


  // Toggle the Try Images container per your rules
  function setTryImagesDisplay(show) {
    const n = document.querySelector('.pb_try-images');
    if (!n) return;
    gsap.set(n, { display: show ? 'block' : 'none', visibility: show ? 'visible' : 'hidden' });
  }

  function showBg(n) {
    const idx = n - 1;
    if (!bgEls[idx]) return;

    // Hide others
    bgEls.forEach((el, i) => {
      if (i === idx) return;
      gsap.to(el, {
        opacity: 0,
        duration: 0.4,
        overwrite: true,
        onComplete: () => {
          gsap.set(el, { visibility: 'hidden', display: 'none' });
        }
      });
    });

    // Show target
    gsap.set(bgEls[idx], { display: 'block', visibility: 'visible' });
    gsap.to(bgEls[idx], {
      opacity: 1,
      duration: 0.4,
      overwrite: true,
      onStart: () => {
        if (!headlineEl || !subHeadlineEl) return;
        if (n === 2) {
          headlineEl.style.color    = HEADLINE_COLORS.Create;
          subHeadlineEl.style.color = SUBHEAD_COLORS.Create;
        } else if (n === 4) {
          headlineEl.style.color    = HEADLINE_COLORS.Edit;
          subHeadlineEl.style.color = SUBHEAD_COLORS.Edit;
        } else if (n === 6) {
          headlineEl.style.color    = HEADLINE_COLORS.Enhance;
          subHeadlineEl.style.color = SUBHEAD_COLORS.Enhance;
        } else if (n === 1) {
          headlineEl.style.color    = HEADLINE_COLORS.Default;
          subHeadlineEl.style.color = SUBHEAD_COLORS.Default;
          if (marqueeWrapper) {
            if (state.allowMarquee) {
              gsap.to(marqueeWrapper, { autoAlpha: 1, duration: 0.5 });
            } else {
              gsap.set(marqueeWrapper, { autoAlpha: 0 });
            }
          }
        } else {
          if (marqueeWrapper) gsap.set(marqueeWrapper, { autoAlpha: 0 });
        }
      }
    });
  }

  function setHeadline(stageKey, instant = false) {
    const nextH = TEXT.HEADLINE[stageKey] ?? TEXT.HEADLINE.default;
    const nextS = TEXT.SUBHEAD[stageKey] ?? TEXT.SUBHEAD.default;
    if (!headlineEl) return;
    if (instant) {
      headlineEl.textContent = nextH;
      if (subHeadlineEl) subHeadlineEl.textContent = nextS;
      return;
    }
    gsap.to([headlineEl, subHeadlineEl].filter(Boolean), {
      duration: 0.35,
      opacity: 0,
      onComplete: () => {
        headlineEl.textContent = nextH;
        if (subHeadlineEl) subHeadlineEl.textContent = nextS;
      }
    });
    gsap.to([headlineEl, subHeadlineEl].filter(Boolean), { duration: 0.35, opacity: 1, delay: 0.35 });
  }

  function revHeadlineStep(prevKey, nextKey) {
    return gsap.to({}, {
      duration: 0.01,
      onComplete:        () => setHeadline(nextKey),
      onReverseComplete: () => setHeadline(prevKey)
    });
  }

  function setRealInputValue(el, text) {
    if (!el) return;
    el.disabled = false;
    el.readOnly = false;
    const next = String(text ?? '');
    el.value = next;
    el.setAttribute('value', next);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    requestAnimationFrame(() => {
      if (el.value !== next) {
        el.value = next;
        el.setAttribute('value', next);
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    try { el.setSelectionRange(next.length, next.length); } catch (_) {}
  }

  function revBgStep(prevN, nextN) {
    return gsap.to({}, { duration: 0.01, onComplete: () => showBg(nextN), onReverseComplete: () => showBg(prevN) });
  }

  // ‼️ This is what writes the pill prompt into the input field
  function revInputSwap(prevText, nextText) {
    return gsap.to({}, {
      duration: 0.01,
      immediateRender: false,
      onComplete: () => {
        setRealInputValue(inputEl, nextText);
        if (inputEl) inputEl.placeholder = '';
      },
      onReverseComplete: () => {
        setRealInputValue(inputEl, prevText);
        if (inputEl && (!prevText || prevText === '')) {
          inputEl.placeholder = (inputEl.dataset?.origPlaceholder) || TEXT?.PLACEHOLDER?.initial || 'Type your prompt…';
        }
      }
    });
  }
  function spacer(d=0.2){ return gsap.to({}, {duration:d,ease:'none'}); }
  function setGeneratingVisible(flag){ if(genOverlay) gsap.set(genOverlay,{autoAlpha:flag?1:0}); }
  function revGen(show){ return gsap.to({}, {duration:0.01,onComplete:()=>setGeneratingVisible(show),onReverseComplete:()=>setGeneratingVisible(!show)}); }

  /******************************************************************
   * SEGMENT BUILDER (restored with input swaps)
   ******************************************************************/
  function segmentForPill(pIndex, prevText, nextText, mapping) {
    const { baseBg, nextBg, headlineAfterInput, image } = mapping || {};
    const tl = gsap.timeline();

    if (pIndex !== 0) {
      tl.to(pills[pIndex], { ...SLOTS[0], duration: 0.5, ease: 'none' });
      const after1 = pills[pIndex+1], after2 = pills[pIndex+2];
      if (after1) tl.to(after1, { ...SLOTS[1], duration: 0.5, ease: 'none' }, '<');
      if (after2) tl.to(after2, { ...SLOTS[2], duration: 0.5, ease: 'none' }, '<');
    }

    const after1c = pills[pIndex+1], after2c = pills[pIndex+2];
    tl.add(gsap.to(pills[pIndex], { yPercent:-120, autoAlpha:0, duration:0.35, ease:'none' }));
    if (after1c) tl.to(after1c, {...SLOTS[0],duration:0.35,ease:'none'},'<');
    if (after2c) tl.to(after2c, {...SLOTS[1],duration:0.35,ease:'none'},'<');

    // ✅ Put the pill text into the input at each step
    tl.add(revInputSwap(prevText,nextText));
    if (headlineAfterInput?.from && headlineAfterInput?.to) tl.add(revHeadlineStep(headlineAfterInput.from,headlineAfterInput.to));

    // Image swap symmetry
    if (image && (image.url || image.clear || image.prevUrl)) {
      tl.add(gsap.to({}, {
        duration: 0.01,
        onStart: () => {
          const { runId, signal } = bumpRun();
          if (image.clear) clearAllInjectedImages({ double: !image.url });
          if (image.url) requestAnimationFrame(() => injectImageViaFileInput(image.url, runId, signal));
        },
        onReverseComplete: () => {
          const { runId, signal } = bumpRun();
          if (image.prevUrl) {
            clearAllInjectedImages({ double: false });
            requestAnimationFrame(() => injectImageViaFileInput(image.prevUrl, runId, signal));
          } else {
            clearAllInjectedImages();
          }
        }
      }));
    }

    if (baseBg) { tl.add(revBgStep(baseBg,baseBg)); tl.add(revGen(true)); }
    tl.add(spacer(0.2));
    if (nextBg) { tl.add(revBgStep(baseBg||nextBg,nextBg)); tl.add(revGen(false),'<'); }

    return tl;
  }

  /******************************************************************
   * MASTER TIMELINE (restored)
   ******************************************************************/
  const master = gsap.timeline({ paused:true });

  master.add(segmentForPill(0, '', pillTexts[0], {
    headlineAfterInput: { from: 'default', to: 'create' },
    baseBg: 1, nextBg: 2
  }));
  master.addLabel('seg1End');

  master.add(segmentForPill(1, pillTexts[0], pillTexts[1], {
    headlineAfterInput: { from: 'create', to: 'edit' },
    baseBg: 3, nextBg: 4,
    image: { url: IMG_EDIT }
  }));
  master.addLabel('seg2End');

  master.add(segmentForPill(2, pillTexts[1], pillTexts[2], {
    headlineAfterInput: { from: 'edit', to: 'enhance' },
    baseBg: 5, nextBg: 6,
    image: { clear: true, url: IMG_ENHANCE, prevUrl: IMG_EDIT }
  }));
  master.addLabel('seg3End');

  // END STAGE — keeps snap + reverse working, plus toggles try-images
  const endTl=gsap.timeline();
  endTl.to(inputEl,{yPercent:0,autoAlpha:0,duration:0.35,ease:'power2.out'});
  endTl.add(gsap.to({},{
    duration:0.01,
    onStart:()=>{state.allowMarquee=true;},
    onReverseComplete:()=>{state.allowMarquee=false;if(marqueeWrapper)gsap.set(marqueeWrapper,{autoAlpha:0});}
  }));
  endTl.add(revBgStep(6,1),'<');
  endTl.add(revHeadlineStep('enhance','default'),'<');
  endTl.add(gsap.to({},{
    duration:0.01,
    onComplete:()=>{ 
      bumpRun();
      clearAllInjectedImages();
      setRealInputValue(inputEl,''); 
      inputEl.placeholder = TEXT.PLACEHOLDER.final; 
      setGeneratingVisible(false); 
    },
    onReverseComplete:()=>{ 
      setRealInputValue(inputEl,pillTexts[2]||''); 
      inputEl.placeholder=''; 
      const { runId, signal } = bumpRun();
      requestAnimationFrame(() => injectImageViaFileInput(IMG_ENHANCE, runId, signal));
    }
  }));
  // Pills fade → remove from layout; reverse restores. Also toggle try-images here.
  endTl.add(gsap.to('.anaimtion-promt-pill', {
    autoAlpha: 0,
    y: -16,
    duration: 0.35,
    onComplete: () => { setPillsDisplay(false); setTryImagesDisplay(true); },     // END: show try-images
    onReverseComplete: () => { setTryImagesDisplay(false); setPillsDisplay(true); } // REVERSE: back to Start
  }));
  endTl.to(inputEl,{yPercent:0,autoAlpha:1,duration:0.25,ease:'power2.out'});
  master.add(endTl);
  master.addLabel('end');

  /******************************************************************
   * SCROLLTRIGGER with SEGMENT SNAP (no snap-back on final)
   ******************************************************************/
  function buildSegments(tl) {
    const d = tl.duration();
    const segEnds = ['seg1End','seg2End','seg3End','end'].map(n => tl.labels[n]);
    const segStarts = [0, ...segEnds.slice(0, -1)];
    return segStarts.map((s, i) => ({
      start: s / d,
      end:   segEnds[i] / d
    }));
  }
  const segments = buildSegments(master);
  const FWD_THRESH = 0.6;

  function snapToNearestStep(p) {
    const seg = segments.find(r => p >= r.start && p <= r.end) ||
                (p < segments[0].start ? segments[0] : segments[segments.length - 1]);

    const isLast = seg.end === segments[segments.length - 1].end;
    if (isLast) return seg.end;

    const local = (p - seg.start) / Math.max(1e-6, (seg.end - seg.start));
    return (local >= FWD_THRESH) ? seg.end : seg.start;
  }

  ScrollTrigger.create({
    id:'hero',
    animation: master,
    trigger: WRAPPER_SEL,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    pin: PINNED_SEL,
    anticipatePin: 1,
    snap: {
      snapTo: (value) => snapToNearestStep(value),
      duration: { min: 0.2, max: 0.4 },
      ease: 'power1.inOut',
      delay: 0
    },
    onUpdate(self){
      if(state.lockedAtEnd){
        self.animation.progress(1);
        self.scroll(self.end);
      }
    }
  });

  /******************************************************************
   * JUMP TO END ON INPUT FOCUS (fade-out → switch → fade-in)
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

    // fade out pills + input
    tl.to(['.anaimtion-promt-pill', inputEl].filter(Boolean), {
      autoAlpha: 0, yPercent: -10, duration: 0.25, stagger: 0.05
    });
    // after fade, hide pills from layout & show try-images at END
    tl.add(() => { setPillsDisplay(false); setTryImagesDisplay(true); });

    // switch visual state to END baseline
    tl.add(() => {
      bumpRun();
      clearAllInjectedImages();

      state.allowMarquee = true;
      showBg(1);
      setHeadline('default', true);
      setGeneratingVisible(false);
      setRealInputValue(inputEl, '');
      if (inputEl) inputEl.placeholder = TEXT.PLACEHOLDER.final;
      if (st) st.scroll(st.end);
      master.progress(1).pause();
    });

    tl.to(inputEl, { autoAlpha: 1, yPercent: 0, duration: 0.25 });
    if (marqueeWrapper) tl.to(marqueeWrapper, { autoAlpha: 1, duration: 0.35 }, '<');
  }

  if (inputEl) {
    inputEl.addEventListener('focus',       fadeJumpToEnd, { passive: true });
    inputEl.addEventListener('pointerdown', fadeJumpToEnd, { passive: true });
  }

  /******************************************************************
   * REDUCED MOTION
   ******************************************************************/
  const mql=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(mql.matches){
    ScrollTrigger.getAll().forEach(st=>st.disable());
    // Keep Start layout in reduced motion
    gsap.set('.anaimtion-promt-pill',{autoAlpha:1, display:'flex', visibility:'visible'});
    setTryImagesDisplay(false);
    gsap.set(marqueeWrapper,{autoAlpha:1});
    showBg(1);
    setGeneratingVisible(false);
    setHeadline('default',true);
  }

  /******************************************************************
   * INTERACTION LOGGING (no logic changes)
   ******************************************************************/
  (function setupInteractionLogging(){
    const ROOT = document.querySelector(WRAPPER_SEL) || document;

    // --- tiny helpers
    const LOG_EVENT = 'HERO_INTERACTION';
    const selPath = (el) => {
      if (!el || el === document || el === window) return String(el);
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && parts.length < 5) {
        let s = node.nodeName.toLowerCase();
        if (node.id) s += `#${node.id}`;
        if (node.classList && node.classList.length) s += '.' + Array.from(node.classList).slice(0,3).join('.');
        parts.unshift(s);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };
    const emit = (name, extra={}) => {
      const payload = {
        ts: Date.now(),
        event: name,
        target: selPath(extra.el || extra.targetEl),
        ...extra
      };
      // Console
      try { console.log('[HERO_LOG]', payload); } catch(_) {}
      // GTM/GA dataLayer
      try { window.dataLayer && window.dataLayer.push({ event: LOG_EVENT, name, ...payload }); } catch(_) {}
      // Custom analytics
      try { window.__ANALYTICS?.track && window.__ANALYTICS.track(name, payload); } catch(_) {}
    };

    // --- generic container listeners (capture phase to catch deep targets)
    ROOT.addEventListener('click',       (e)=>emit('click',       { el:e.target }), true);
    ROOT.addEventListener('pointerdown', (e)=>emit('pointerdown', { el:e.target }), true);
    ROOT.addEventListener('pointerup',   (e)=>emit('pointerup',   { el:e.target }), true);
    ROOT.addEventListener('mouseenter',  (e)=>emit('hover_in',    { el:e.target }), true);
    ROOT.addEventListener('mouseleave',  (e)=>emit('hover_out',   { el:e.target }), true);

    // --- input field specifics
    if (inputEl) {
      inputEl.addEventListener('focus',   (e)=>emit('input_focus',   { el:e.target }), { passive:true });
      inputEl.addEventListener('blur',    (e)=>emit('input_blur',    { el:e.target }), { passive:true });
      inputEl.addEventListener('input',   (e)=>emit('input_change',  { el:e.target, value: e.target.value }));
      inputEl.addEventListener('change',  (e)=>emit('input_commit',  { el:e.target, value: e.target.value }));
      inputEl.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter') emit('input_enter', { el:e.target, value: e.target.value });
      });
    }

    // --- pill interactions
    pills.forEach((pill, i)=>{
      pill && pill.addEventListener('click', (e)=>emit('pill_click', {
        el:e.currentTarget,
        index:i,
        text:pillTexts[i] || ''
      }));
      pill && pill.addEventListener('mouseenter', (e)=>emit('pill_hover', { el:e.currentTarget, index:i }));
    });

    // --- buttons inside wrapper
    ROOT.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', (e)=>emit('button_click', {
        el:e.currentTarget,
        label: (btn.getAttribute('aria-label') || btn.textContent || '').trim()
      }));
    });

    // --- file upload + drag/drop
    const fi = document.getElementById('fileInput');
    if (fi) {
      fi.addEventListener('change', (e)=>{
        const f = e.target.files && e.target.files[0];
        emit('file_change', { el:e.target, fileName: f?.name, fileType: f?.type, fileSize: f?.size });
      });
      fi.addEventListener('click', (e)=>emit('file_click', { el:e.target }));
    }
    ROOT.addEventListener('dragover', (e)=>{ emit('drag_over', { el:e.target }); }, true);
    ROOT.addEventListener('drop',     (e)=>{
      const f = e.dataTransfer?.files && e.dataTransfer.files[0];
      emit('drop', { el:e.target, fileName: f?.name, fileType: f?.type, fileSize: f?.size });
    }, true);
  })();

  /******************************************************************
   * UTILS
   ******************************************************************/
  // (duplicate suffixNum removed intentionally)
})();
