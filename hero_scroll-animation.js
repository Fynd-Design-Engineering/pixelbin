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

  // URLs to auto-inject for Pill 2 and Pill 3
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
  const searchContainer = document.querySelector('.searchContainer'); // <-- NEW

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

  const origHeadlineColor    = headlineEl ? getComputedStyle(headlineEl).color : null;
  const origSubHeadlineColor = subHeadlineEl ? getComputedStyle(subHeadlineEl).color : null;
  const HEADLINE_COLORS = { Default: origHeadlineColor, Create: '#ffffff', Edit: '#ffffff', Enhance: '#ffffff' };
  const SUBHEAD_COLORS   = { Default: origSubHeadlineColor, Create: '#ffffff', Edit: '#ffffff', Enhance: '#ffffff' };

  function setColor(el, colorOrNull) {
    if (!el) return;
    if (colorOrNull == null || colorOrNull === '') el.style.removeProperty('color');
    else el.style.color = colorOrNull;
  }

  // State
  const state = { allowMarquee: false, lockedAtEnd: false };
  console.log('[HERO] ready');

  /******************************************************************
   * INITIAL STATE
   ******************************************************************/
  if (pills[0]) gsap.set(pills[0], SLOTS[0]);
  if (pills[1]) gsap.set(pills[1], SLOTS[1]);
  if (pills[2]) gsap.set(pills[2], SLOTS[2]);
  bgEls.forEach((bg, i) => gsap.set(bg, { autoAlpha: i === 0 ? 1 : 0 }));

  if (headlineEl) setHeadline('default', true);
  if (marqueeWrapper) gsap.set(marqueeWrapper, { autoAlpha: 0 });
  if (genOverlay) gsap.set(genOverlay, { autoAlpha: 0, pointerEvents: 'none' });
  if (inputEl) {
    inputEl.dataset.origPlaceholder = TEXT.PLACEHOLDER.initial;
    inputEl.placeholder = TEXT.PLACEHOLDER.initial;
    inputEl.value = '';
    inputEl.setAttribute('value', '');
  }

  /******************************************************************
   * IMAGE HANDLERS (same as before)
   ******************************************************************/
  let currentRunId = 0;
  let currentAbort = null;
  function bumpRun() { currentRunId++; if (currentAbort) try { currentAbort.abort(); } catch {} currentAbort = ('AbortController' in window) ? new AbortController() : null; return { runId: currentRunId, signal: currentAbort?.signal }; }
  function uiHasImages(){ return !!document.querySelector('#imagesSection .image-thumbnail'); }
  function clearAllInjectedImages({ double = true } = {}){ const doClear=()=>{document.querySelectorAll('#imagesSection .image-close').forEach(btn=>btn.click());const fi=document.getElementById('fileInput');if(fi)fi.value='';};doClear();if(double)requestAnimationFrame(doClear); }
  async function injectImageViaFileInput(url, runId, signal){ if(!url)return;const fi=document.getElementById('fileInput');if(!fi)return;try{const res=await fetch(url,{mode:'cors',signal});if(runId!==currentRunId)return;if(!res.ok)return;const blob=await res.blob();if(runId!==currentRunId)return;const name=(url.split('/').pop()||'image.png').split('?')[0];const file=new File([blob],name,{type:blob.type||'image/png'});const dt=new DataTransfer();dt.items.add(file);fi.files=dt.files;fi.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){if(e?.name!=='AbortError')console.warn(e);} }
  function ensureInputEnabled(el){ if(el){ el.disabled=false; el.readOnly=false; } }
  function setRealInputValue(el,text){ if(!el)return; ensureInputEnabled(el); const next=text||''; el.value=next; el.setAttribute('value',next); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); try{el.setSelectionRange(next.length,next.length);}catch(_){} }

  /******************************************************************
   * VISUAL HELPERS
   ******************************************************************/
  function setGeneratingVisible(flag){ if(genOverlay) gsap.set(genOverlay,{autoAlpha:flag?1:0,pointerEvents:flag?'auto':'none'}); }
  function showBg(n){ const idx=n-1; if(bgEls.length){ gsap.to(bgEls,{autoAlpha:0,duration:0.4,overwrite:true}); if(bgEls[idx])gsap.to(bgEls[idx],{autoAlpha:1,duration:0.4,overwrite:true}); } if(!headlineEl||!subHeadlineEl)return;
    if(n===2){ setColor(headlineEl,HEADLINE_COLORS.Create); setColor(subHeadlineEl,SUBHEAD_COLORS.Create);}
    else if(n===4){ setColor(headlineEl,HEADLINE_COLORS.Edit); setColor(subHeadlineEl,SUBHEAD_COLORS.Edit);}
    else if(n===6){ setColor(headlineEl,HEADLINE_COLORS.Enhance); setColor(subHeadlineEl,SUBHEAD_COLORS.Enhance);}
    else if(n===1){ setColor(headlineEl,HEADLINE_COLORS.Default); setColor(subHeadlineEl,SUBHEAD_COLORS.Default);
      if(marqueeWrapper){ if(state.allowMarquee)gsap.to(marqueeWrapper,{autoAlpha:1,duration:0.5}); else gsap.set(marqueeWrapper,{autoAlpha:0}); } }
    else if(marqueeWrapper)gsap.set(marqueeWrapper,{autoAlpha:0}); }
  function setHeadline(stageKey,instant=false){ const nextH=TEXT.HEADLINE[stageKey]??TEXT.HEADLINE.default; const nextS=TEXT.SUBHEAD[stageKey]??TEXT.SUBHEAD.default; if(!headlineEl)return; if(instant){ headlineEl.textContent=nextH; if(subHeadlineEl)subHeadlineEl.textContent=nextS; return;} gsap.to([headlineEl,subHeadlineEl].filter(Boolean),{duration:0.35,opacity:0,onComplete:()=>{headlineEl.textContent=nextH;if(subHeadlineEl)subHeadlineEl.textContent=nextS;}}); gsap.to([headlineEl,subHeadlineEl].filter(Boolean),{duration:0.35,opacity:1,delay:0.35}); }
  function revHeadlineStep(prevKey,nextKey){ return gsap.to({}, {duration:0.01,onComplete:()=>setHeadline(nextKey,false),onReverseComplete:()=>setHeadline(prevKey,false)}); }
  function revBgStep(prevN,nextN){ return gsap.to({}, {duration:0.01,onComplete:()=>showBg(nextN),onReverseComplete:()=>showBg(prevN)}); }
  function revInputSwap(prevText,nextText){ return gsap.to({}, {duration:0.01,immediateRender:false,onComplete:()=>{setRealInputValue(inputEl,nextText);if(inputEl)inputEl.placeholder='';},onReverseComplete:()=>{setRealInputValue(inputEl,prevText);if(inputEl&&(!prevText||prevText===''))inputEl.placeholder=(inputEl.dataset?.origPlaceholder)||TEXT.PLACEHOLDER.initial||'Type your prompt…';}}); }
  function spacer(d=0.2){ return gsap.to({}, {duration:d,ease:'none'}); }
  function revGen(show){ return gsap.to({}, {duration:0.01,onComplete:()=>setGeneratingVisible(show),onReverseComplete:()=>setGeneratingVisible(!show)}); }

  /******************************************************************
   * SEGMENT BUILDER (symmetric image handling)
   ******************************************************************/
  function segmentForPill(pIndex, prevText, nextText, mapping) {
    const { baseBg, nextBg, headlineAfterInput, onEnterImageUrl, clearOnEnter, prevStageImageUrl } = mapping || {};
    const tl = gsap.timeline();

    if (pIndex !== 0) {
      if (pills[pIndex]) tl.to(pills[pIndex], { ...SLOTS[0], duration: 0.5, ease: 'none' });
      const after1 = pills[pIndex+1], after2 = pills[pIndex+2];
      if (after1) tl.to(after1, { ...SLOTS[1], duration: 0.5, ease: 'none' }, '<');
      if (after2) tl.to(after2, { ...SLOTS[2], duration: 0.5, ease: 'none' }, '<');
    }

    const after1c = pills[pIndex+1], after2c = pills[pIndex+2];
    if (pills[pIndex]) tl.add(gsap.to(pills[pIndex], { yPercent:-120, autoAlpha:0, duration:0.35, ease:'none' }));
    if (after1c) tl.to(after1c, {...SLOTS[0],duration:0.35,ease:'none'},'<');
    if (after2c) tl.to(after2c, {...SLOTS[1],duration:0.35,ease:'none'},'<');

    tl.add(revInputSwap(prevText,nextText));
    if (headlineAfterInput?.from && headlineAfterInput?.to) tl.add(revHeadlineStep(headlineAfterInput.from,headlineAfterInput.to));

    // symmetric image behavior
    if (onEnterImageUrl || clearOnEnter || prevStageImageUrl) {
      tl.add(gsap.to({}, {
        duration: 0.01,
        onStart: () => {
          const { runId, signal } = bumpRun();
          if (clearOnEnter) clearAllInjectedImages({ double: !onEnterImageUrl });
          if (onEnterImageUrl) requestAnimationFrame(() => injectImageViaFileInput(onEnterImageUrl, runId, signal));
        },
        onReverseComplete: () => {
          const { runId, signal } = bumpRun();
          if (prevStageImageUrl) {
            clearAllInjectedImages({ double: false });
            requestAnimationFrame(() => injectImageViaFileInput(prevStageImageUrl, runId, signal));
          } else clearAllInjectedImages();
        }
      }));
    }

    if (baseBg) { tl.add(revBgStep(baseBg,baseBg)); tl.add(revGen(true)); }
    tl.add(spacer(0.2));
    if (nextBg) { tl.add(revBgStep(baseBg||nextBg,nextBg)); tl.add(revGen(false),'<'); }

    return tl;
  }

  /******************************************************************
   * MASTER TIMELINE
   ******************************************************************/
  const master = gsap.timeline({ paused:true });
  master.add(segmentForPill(0, '', pillTexts[0], { headlineAfterInput: { from: 'default', to: 'create' }, baseBg: 1, nextBg: 2 }));
  master.addLabel('seg1End');
  master.add(segmentForPill(1, pillTexts[0], pillTexts[1], { headlineAfterInput: { from: 'create', to: 'edit' }, baseBg: 3, nextBg: 4, onEnterImageUrl: IMG_EDIT }));
  master.addLabel('seg2End');
  master.add(segmentForPill(2, pillTexts[1], pillTexts[2], { headlineAfterInput: { from: 'edit', to: 'enhance' }, baseBg: 5, nextBg: 6, clearOnEnter: true, onEnterImageUrl: IMG_ENHANCE, prevStageImageUrl: IMG_EDIT }));
  master.addLabel('seg3End');

  const endTl=gsap.timeline();
  if (inputEl) endTl.to(inputEl,{yPercent:-30,autoAlpha:0,duration:0.35,ease:'power2.out'});
  endTl.add(gsap.to({},{
    duration:0.01,
    onStart:()=>{ state.allowMarquee=true; },
    onReverseComplete:()=>{ state.allowMarquee=false; if(marqueeWrapper)gsap.set(marqueeWrapper,{autoAlpha:0}); }
  }));
  endTl.add(revBgStep(6,1),'<');
  endTl.add(revHeadlineStep('enhance','default'),'<');
  endTl.add(gsap.to({},{
    duration:0.01,
    onComplete:()=>{ bumpRun(); clearAllInjectedImages(); setRealInputValue(inputEl,''); if (inputEl) inputEl.placeholder = TEXT.PLACEHOLDER.final; setGeneratingVisible(false); },
    onReverseComplete:()=>{ setRealInputValue(inputEl, pillTexts[2] || ''); if (inputEl) inputEl.placeholder = ''; const { runId, signal } = bumpRun(); requestAnimationFrame(() => injectImageViaFileInput(IMG_ENHANCE, runId, signal)); }
  }));
  if (inputEl) endTl.to(inputEl,{yPercent:0,autoAlpha:1,duration:0.25,ease:'power2.out'});
  endTl.add(gsap.to('.anaimtion-promt-pill',{autoAlpha:0,y:-16,duration:0.35}));
  master.add(endTl);
  master.addLabel('end');

  /******************************************************************
   * SCROLLTRIGGER
   ******************************************************************/
  function buildSegments(tl){ const d=tl.duration(); const segEnds=['seg1End','seg2End','seg3End','end'].map(n=>tl.labels[n]); const segStarts=[0,...segEnds.slice(0,-1)]; return segStarts.map((s,i)=>({start:s/d,end:segEnds[i]/d})); }
  const segments=buildSegments(master);
  const FWD_THRESH=0.6;
  function snapToNearestStep(p){ const seg=segments.find(r=>p>=r.start&&p<=r.end)||(p<segments[0].start?segments[0]:segments[segments.length-1]); const local=(p-seg.start)/Math.max(1e-6,(seg.end-seg.start)); const target=(local>=FWD_THRESH)?seg.end:seg.start; return target; }
  ScrollTrigger.create({id:'hero',animation:master,trigger:WRAPPER_SEL,start:'top top',end:'bottom bottom',scrub:1,pin:PINNED_SEL,anticipatePin:1,snap:{snapTo:(value)=>snapToNearestStep(value),duration:{min:0.2,max:0.4},ease:'power1.inOut',delay:0},onUpdate(self){ if(state.lockedAtEnd&&master.progress()<0.999){state.lockedAtEnd=false;} if(state.lockedAtEnd){self.animation.progress(1);self.scroll(self.end);} }});

  /******************************************************************
   * INPUT / CONTAINER FOCUS ESCAPE
   ******************************************************************/
  let jumping=false;
  function isAtEndStrict(){ return master && typeof master.progress==='function' && master.progress()>=0.999; }
  function fadeJumpToEnd(){ if(isAtEndStrict())return; if(jumping)return; jumping=true; setTimeout(()=>jumping=false,0);
    const st=ScrollTrigger.getById('hero'); const tl=gsap.timeline({defaults:{ease:'power2.out'},onComplete:()=>{state.lockedAtEnd=true;if(st)st.scroll(st.end);master.progress(1).pause();}});
    const targets=['.anaimtion-promt-pill',inputEl].filter(Boolean); if(targets.length)tl.to(targets,{autoAlpha:0,yPercent:-10,duration:0.25,stagger:0.05});
    tl.add(()=>{ bumpRun(); state.allowMarquee=true; showBg(1); setHeadline('default',true); setGeneratingVisible(false); ensureInputEnabled(inputEl); setRealInputValue(inputEl,''); if(inputEl)inputEl.placeholder=TEXT.PLACEHOLDER.final; clearAllInjectedImages(); if(st)st.scroll(st.end); master.progress(1).pause(); });
    if(inputEl)tl.to(inputEl,{autoAlpha:1,yPercent:0,duration:0.25}); if(marqueeWrapper)tl.to(marqueeWrapper,{autoAlpha:1,duration:0.35},'<'); }

  if (inputEl) {
    inputEl.addEventListener('focus', fadeJumpToEnd, { passive: true });
    inputEl.addEventListener('pointerdown', fadeJumpToEnd, { passive: true });
  }

  // NEW — also trigger on clicks anywhere in the searchContainer
  if (searchContainer) {
    searchContainer.addEventListener('pointerdown', (e) => {
      if (e.target.closest('input#textInput')) return; // avoid duplicate trigger
      fadeJumpToEnd();
    });
    searchContainer.addEventListener('focusin', (e) => {
      if (e.target.closest('input#textInput')) return;
      fadeJumpToEnd();
    });
  }

  /******************************************************************
   * REDUCED MOTION
   ******************************************************************/
  const mql=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(mql.matches){ ScrollTrigger.getAll().forEach(st=>st.disable()); gsap.set('.anaimtion-promt-pill',{autoAlpha:0}); if(marqueeWrapper)gsap.set(marqueeWrapper,{autoAlpha:1}); showBg(1); setGeneratingVisible(false); setHeadline('default',true); }

  /******************************************************************
   * OPTIONAL CLEANUP
   ******************************************************************/
  window.__heroCleanup=()=>{ try{ if(inputEl){inputEl.removeEventListener('focus',fadeJumpToEnd);inputEl.removeEventListener('pointerdown',fadeJumpToEnd);} if(searchContainer){searchContainer.removeEventListener('pointerdown',fadeJumpToEnd);searchContainer.removeEventListener('focusin',fadeJumpToEnd);} const st=ScrollTrigger.getById('hero'); if(st)st.kill(); master.kill(); bumpRun(); }catch(e){console.warn('[HERO] cleanup error',e);} };
})();
