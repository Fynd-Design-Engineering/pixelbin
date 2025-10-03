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
      initial:  'What would you like to create today',       // shown on first load
      final:    'What would you like to create today',        // shown after returning to Default at the end
    },
    PROMPTS: [
      'Dramatic woman in black dress, red purple moody light',
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
  const genOverlay     = document.querySelector('.generating'); // generating overlay

  const pill1 = document.querySelector('.promt-pill-1 .promt-pill._1');
  const pill2 = document.querySelector('.promt-pill-2 .promt-pill._1');
  const pill3 = document.querySelector('.promt-pill-3 .promt-pill._1');
  const pills = [pill1, pill2, pill3].filter(Boolean);

  // Use TEXT.PROMPTS if provided; otherwise fallback to DOM pill text
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
  bgEls.forEach((bg, i) => gsap.set(bg, { autoAlpha: i === 0 ? 1 : 0 }));

  if (headlineEl) setHeadline('default', true);
  if (marqueeWrapper) gsap.set(marqueeWrapper, { autoAlpha: 0 });
  if (genOverlay) gsap.set(genOverlay, { autoAlpha: 0 });
  if (inputEl) {
    inputEl.dataset.origPlaceholder = TEXT.PLACEHOLDER.initial;
    inputEl.placeholder = TEXT.PLACEHOLDER.initial;
    inputEl.value = '';
    inputEl.setAttribute('value', '');
  }

  /******************************************************************
   * HELPERS
   ******************************************************************/
  function showBg(n) {
    const idx = n - 1;
    if (!bgEls[idx]) return;
    gsap.to(bgEls, { autoAlpha: 0, duration: 0.4, overwrite: true });
    gsap.to(bgEls[idx], {
      autoAlpha: 1,
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

  // Set headline & subheadline by stage key ('default'|'create'|'edit'|'enhance')
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

  // Reversible headline step using stage keys
  function revHeadlineStep(prevKey, nextKey) {
    return gsap.to({}, {
      duration: 0.01,
      onComplete:        () => setHeadline(nextKey),
      onReverseComplete: () => setHeadline(prevKey)
    });
  }

  function setRealInputValue(el, text) { if (el) { el.value = text||''; el.setAttribute('value', el.value); } }
  function revBgStep(prevN, nextN) { return gsap.to({}, { duration: 0.01, onComplete: () => showBg(nextN), onReverseComplete: () => showBg(prevN) }); }
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
   * SEGMENT BUILDER
   ******************************************************************/
  function segmentForPill(pIndex, prevText, nextText, mapping) {
    const { baseBg, nextBg, headlineAfterInput } = mapping || {};
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

    tl.add(revInputSwap(prevText,nextText));
    if (headlineAfterInput?.from && headlineAfterInput?.to) tl.add(revHeadlineStep(headlineAfterInput.from,headlineAfterInput.to));

    if (baseBg) { tl.add(revBgStep(baseBg,baseBg)); tl.add(revGen(true)); }
    tl.add(spacer(0.2));
    if (nextBg) { tl.add(revBgStep(baseBg||nextBg,nextBg)); tl.add(revGen(false),'<'); }

    return tl;
  }

  /******************************************************************
   * MASTER TIMELINE
   ******************************************************************/
  const master = gsap.timeline({ paused:true });

  // Stage keys used here: 'default' -> 'create' -> 'edit' -> 'enhance'
  master.add(segmentForPill(0, '', pillTexts[0], {
    headlineAfterInput: { from: 'default', to: 'create' },
    baseBg: 1, nextBg: 2
  }));
  master.addLabel('seg1End');

  master.add(segmentForPill(1, pillTexts[0], pillTexts[1], {
    headlineAfterInput: { from: 'create', to: 'edit' },
    baseBg: 3, nextBg: 4
  }));
  master.addLabel('seg2End');

  master.add(segmentForPill(2, pillTexts[1], pillTexts[2], {
    headlineAfterInput: { from: 'edit', to: 'enhance' },
    baseBg: 5, nextBg: 6
  }));
  master.addLabel('seg3End');

  const endTl=gsap.timeline();
  endTl.to(inputEl,{yPercent:-30,autoAlpha:0,duration:0.35,ease:'power2.out'});
  endTl.add(gsap.to({},{
    duration:0.01,
    onStart:()=>{state.allowMarquee=true;},
    onReverseComplete:()=>{state.allowMarquee=false;if(marqueeWrapper)gsap.set(marqueeWrapper,{autoAlpha:0});}
  }));
  endTl.add(revBgStep(6,1),'<');
  endTl.add(revHeadlineStep('enhance','default'),'<');
  endTl.add(gsap.to({},{
    duration:0.01,
    onComplete:()=>{ setRealInputValue(inputEl,''); inputEl.placeholder = TEXT.PLACEHOLDER.final; setGeneratingVisible(false); },
    onReverseComplete:()=>{ setRealInputValue(inputEl,pillTexts[2]||''); inputEl.placeholder=''; }
  }));
  endTl.to(inputEl,{yPercent:0,autoAlpha:1,duration:0.25,ease:'power2.out'});
  endTl.add(gsap.to('.anaimtion-promt-pill',{autoAlpha:0,y:-16,duration:0.35}));
  master.add(endTl);
  master.addLabel('end');

  /******************************************************************
   * SCROLLTRIGGER with SEGMENT SNAP (60% forward else back)
   ******************************************************************/
  function buildSegments(tl) {
    const d = tl.duration();
    const segEnds = ['seg1End','seg2End','seg3End','end'].map(n => tl.labels[n]);
    const segStarts = [0, ...segEnds.slice(0, -1)];
    // return array of {start,end} in timeline progress units (0..1)
    return segStarts.map((s, i) => ({
      start: s / d,
      end:   segEnds[i] / d
    }));
  }
  const segments = buildSegments(master);
  const FWD_THRESH = 0.6; // >=60% → snap to end; otherwise back to start

  function snapToNearestStep(p) {
    // find which segment p is in
    const seg = segments.find(r => p >= r.start && p <= r.end) ||
                (p < segments[0].start ? segments[0] : segments[segments.length - 1]);

    const local = (p - seg.start) / Math.max(1e-6, (seg.end - seg.start)); // 0..1 within segment
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

    // 1) Fade OUT pills + input quickly
    tl.to(['.anaimtion-promt-pill', inputEl].filter(Boolean), {
      autoAlpha: 0, yPercent: -10, duration: 0.25, stagger: 0.05
    });

    // 2) Hard switch to final Default state (no scroll tween)
    tl.add(() => {
      state.allowMarquee = true;       // allow marquee at BG1
      showBg(1);                       // show BG1 (colors sync inside showBg)
      setHeadline('default', true);    // set headline/subheadline copy
      setGeneratingVisible(false);     // hide .generating overlay
      setRealInputValue(inputEl, '');  // clear input
      if (inputEl) inputEl.placeholder = TEXT.PLACEHOLDER.final; // final placeholder

      if (st) st.scroll(st.end);       // clamp the scroll position
      master.progress(1).pause();       // snap timeline to the end
    });

    // 3) Fade IN input + marquee
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
    gsap.set('.anaimtion-promt-pill',{autoAlpha:0});
    gsap.set(marqueeWrapper,{autoAlpha:1});
    showBg(1);
    setGeneratingVisible(false);
    setHeadline('default',true);
  }
})();
