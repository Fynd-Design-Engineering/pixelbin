// ===== MAIN UI CONTROLLER =====
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("searchContainer");

  const TOOL_NAME = (container.dataset.toolName || "ai-editor").trim();
  const MAX_CHARS = parseInt(container.dataset.maxChars || "1000", 10);
  const HINT_ON_SUBMIT_ONLY = false;

  const ACTION_FIRST_WORDS = ["remove","erase","delete","replace","edit","upscale"];
  const keywordNeedsImage = (text) => {
    if (!text) return false;
    const first = (text.trim().toLowerCase().match(/^[^\p{L}\p{N}]*(\p{L}+)/u) || [,""])[1];
    return ACTION_FIRST_WORDS.includes(first);
  };

  // DOM refs
  const q = (id) => document.getElementById(id);
  const form = q("searchForm"), formContent = q("formContent"), imagesSection = q("imagesSection");
  const textInput = q("textInput"), textArea = q("textArea"), toolbar = q("toolbar");
  const addButton = q("addButton"), generateButton = q("generateButton");
  const generateText = generateButton?.querySelector(".generate-text");
  const tooltip = q("tooltip"), fileInput = q("fileInput"), charCounter = q("charCounter");

  // Image constraints
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp"];
  const MAX_MB = 25, MAX_IMAGES = 1;

  // State
  const state = {
    inputValue: "",
    images: [],
    active: false,
    mode: "empty",
    maxChars: MAX_CHARS,
    loadingImage: false,
    isGenerating: false,
    isTypewriterActive: false,
  };

  const setGenerating = (on) => { state.isGenerating = !!on; updateUI(false); };

  // Helpers
  const getLivePrompt = () => textArea?.value || state.inputValue || "";
  const syncPromptFromDOM = () => {
    const live = getLivePrompt();
    if (live !== state.inputValue) { state.inputValue = live; updateState(); }
  };

  const resolvePromptForSubmit = (liveValue) => {
    // Always multi-line - no truncation, just return the live value
    return liveValue;
  };

  // Validation
  const isValidImageFile = (f) => {
    if (!f) return false;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    return f.type.startsWith("image/") &&
           (ALLOWED_TYPES.includes(f.type) || ALLOWED_EXTS.includes(ext)) &&
           f.size <= MAX_MB * 1024 * 1024;
  };

  // Convert external URL to File
  const externalUrlToFile = async (url, slideKey = "carousel") => {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const blob = await res.blob();
    const mime = blob.type || "image/jpeg";
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const safeKey = (slideKey || "carousel").toLowerCase().replace(/[^\w-]+/g, "-");
    return new File([blob], `carousel-${safeKey}-${Date.now()}.${ext}`, { type: mime });
  };

  // Removed loader and preload - direct URL injection is faster and cleaner

  // Image management
  const hasExternalImage = (url, slideKey) => state.images.some(x => x.url === url || (slideKey && x.slideKey === slideKey));

  const addExternalImage = async (url, slideKey, source = "carousel") => {
    if (!url || state.images.length >= MAX_IMAGES || hasExternalImage(url, slideKey)) return;

    // Direct injection - no loader
    state.images.push({ file: null, url, slideKey, source });
    updateState();
    updateAddButtonState();
  };

  const clearImagesByScope = (scope = "all") => {
    if (scope === "carousel") {
      state.images = state.images.filter((x) => x.source !== "carousel");
    } else {
      state.images.forEach((x) => { if (x.file && x.url?.startsWith("blob:")) URL.revokeObjectURL(x.url); });
      state.images = [];
    }
    updateState();
    updateAddButtonState();
  };

  // Textarea rows - 1 row when image attached or not focused, 5 rows when focused with no image
  const applyTextAreaRows = () => {
    if (!textArea) return;
    const hasImages = state.images.length > 0;
    const isFocused = document.activeElement === textArea;

    // Calculate target rows
    const targetRows = hasImages ? 1 : (isFocused ? 5 : 1);

    // Set explicit height for smooth transition
    const lineHeight = 28; // Updated for better single-row visibility
    const targetHeight = targetRows * lineHeight;

    // Apply height directly for smooth expand/collapse animation
    textArea.style.height = `${targetHeight}px`;
    textArea.rows = targetRows;
  };

  // Responsive
  const setMobileStyles = () => {
    const isMobile = window.innerWidth < 768;
    container.classList.toggle("mobile", isMobile);
    textInput?.classList.toggle("mobile", isMobile);
    if (generateText) generateText.style.display = isMobile ? "none" : "inline";
    generateButton?.classList.toggle("mobile-icon", isMobile);
  };

  // Hints and counters
  const showImageHint = () => { tooltip?.classList.add("show"); addButton?.classList.add("active"); };
  const hideImageHint = () => { tooltip?.classList.remove("show"); addButton?.classList.remove("active"); };

  const updateCharCounter = () => {
    const len = state.inputValue.length;
    if (charCounter) {
      // Only update counter when user is focused, not during typewriter animation
      const isFocused = document.activeElement === textArea;
      if (!state.isTypewriterActive || isFocused) {
        charCounter.textContent = `${len}/${state.maxChars}`;
        charCounter.classList.toggle("over", len > state.maxChars);
      }
    }
    form?.classList.toggle("over-limit", len > state.maxChars);
  };

  const updateAddButtonState = () => {
    // Allow upload if: no images, OR only carousel image exists (user can replace it)
    const hasUserImage = state.images.some(x => x.source !== "carousel");
    const blocked = (hasUserImage && state.images.length >= MAX_IMAGES) || state.isGenerating;

    if (addButton) {
      addButton.disabled = blocked;
      addButton.classList.toggle("is-disabled", blocked);
      addButton.setAttribute("aria-disabled", String(blocked));
    }
    if (hasUserImage && state.images.length >= MAX_IMAGES) hideImageHint();
  };

  // Track rendered images to prevent unnecessary re-renders
  let lastRenderedUrls = [];
  let lastRenderedCount = 0;

  // Render thumbnails
  const renderImages = () => {
    if (!imagesSection) return;

    // Check if images actually changed
    const currentUrls = state.images.map(img => img.url);
    const currentCount = state.images.length;

    // Check if DOM is out of sync with state (images in state but not in DOM)
    const domChildCount = imagesSection.children.length;
    const domOutOfSync = currentCount > 0 && domChildCount === 0;

    // Always re-render if count changed (even if URLs are the same)
    // This handles clear + re-inject scenarios
    const hasChanged = currentCount !== lastRenderedCount ||
                       currentUrls.some((url, idx) => url !== lastRenderedUrls[idx]) ||
                       domOutOfSync; // Force render if DOM was cleared but state has images

    // Skip re-render if nothing changed
    if (!hasChanged) return;

    lastRenderedUrls = [...currentUrls];
    lastRenderedCount = currentCount;
    imagesSection.innerHTML = "";

    state.images.forEach((img, idx) => {
      const div = document.createElement("div");
      div.className = "image-thumbnail";
      Object.assign(div.style, {
        backgroundImage: `url(${img.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "8px",
        width: "72px",      // Fixed width to match loader
        height: "72px",     // Fixed height to match loader
        minWidth: "72px",
        minHeight: "72px",
        flexShrink: "0",    // Prevent shrinking
        position: "relative",
        opacity: "0",       // Start invisible for fade-in effect
        transition: "opacity 250ms ease-out"  // Fast, smooth fade-in
      });
      if (img.source) div.dataset.source = img.source;
      if (img.slideKey) div.dataset.slideKey = img.slideKey;
      div.dataset.url = img.url;

      const close = document.createElement("button");
      close.type = "button";
      close.className = "image-close";
      close.setAttribute("aria-label", "Remove image");
      close.textContent = "×";
      const isMobile = window.innerWidth < 768;
      Object.assign(close.style, {
        position: "absolute", top: "4px", right: "6px", background: "rgba(0,0,0,0.75)", color: "#fff",
        border: "0", borderRadius: "12px", width: "20px", height: "20px", lineHeight: "20px", cursor: "pointer",
        opacity: isMobile ? "1" : "0.8",  // Always visible on mobile
        transition: "opacity 0.2s ease"
      });

      // Make close button always visible on mobile, show on hover for desktop
      if (!isMobile) {
        close.style.opacity = "0";
        div.addEventListener("mouseenter", () => { close.style.opacity = "1"; });
        div.addEventListener("mouseleave", () => { close.style.opacity = "0"; });
      }

      close.addEventListener("click", (e) => {
        // Prevent event from bubbling
        e.stopPropagation();

        const wasUserImage = state.images[idx]?.source === "user";
        const wasCarouselImage = state.images[idx]?.source === "carousel";

        if (state.images[idx]?.file && state.images[idx]?.url?.startsWith("blob:")) {
          URL.revokeObjectURL(state.images[idx].url);
        }
        state.images.splice(idx, 1);

        // If user removed their uploaded image and no images left, allow carousel to resume
        if (wasUserImage && state.images.length === 0) {
          // Carousel will detect this via its own event listeners
        }

        // If carousel image was removed, reset everything to allow re-injection on next focus
        if (wasCarouselImage) {
          const storedPrompt = window.aiPhotoCarousel?.getStoredPrompt?.() || "";
          if (storedPrompt && state.inputValue === storedPrompt) {
            // Clear input value to reset state
            state.inputValue = "";
            if (textArea) textArea.value = "";
          }
          // Carousel will detect this via its own event listeners
        }

        updateState();
        updateAddButtonState();
      });

      div.appendChild(close);
      imagesSection.appendChild(div);

      // Trigger fade-in animation - use double RAF for safety
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Only fade in if element is still in DOM
          if (div.parentElement) {
            div.style.opacity = "1";
          }
        });
      });
    });
  };

  // Always multi-line - no layout switching needed

  // UI update - always multi-line mode
  const updateUI = (flipLayout = false) => {
    // Always show textarea, hide textInput
    if (textInput) textInput.classList.add("hidden");
    if (textArea) {
      textArea.classList.remove("hidden");
      textArea.value = state.inputValue;
      applyTextAreaRows();
    }

    if (imagesSection) {
      if (state.images.length > 0) {
        imagesSection.classList.remove("hidden");
        renderImages();
      } else {
        imagesSection.classList.add("hidden");
        imagesSection.innerHTML = "";
      }
    }

    // Don't disable button during typewriter animation - only when user has control
    const promptPresent = state.inputValue.trim().length > 0;
    const overLimit = state.inputValue.length > state.maxChars;
    const canGenerate = (state.isTypewriterActive || promptPresent) && !overLimit && !state.isGenerating;

    generateButton?.classList.toggle("active", canGenerate);
    generateButton?.classList.toggle("inactive", !canGenerate);
    if (generateButton) {
      generateButton.disabled = !canGenerate;
      generateButton.classList.toggle("is-generating", state.isGenerating);
      generateButton.setAttribute("aria-busy", String(state.isGenerating));
      const text = state.isGenerating ? "Generating…" : "Generate";
      if (generateText) generateText.textContent = text;
      else generateButton.textContent = text;
    }

    updateAddButtonState();
  };

  // State recompute - always multi-line
  const updateState = () => {
    const prevMode = state.mode;

    // Simple mode logic - always multiline
    if (state.images.length > 0) state.mode = "image-attached";
    else if (state.inputValue.length > 0) state.mode = "filled";
    else if (state.active) state.mode = "active";
    else state.mode = "empty";

    updateUI(prevMode !== state.mode);
    updateCharCounter();
    applyTextAreaRows();
  };

  // Events
  window.addEventListener("resize", setMobileStyles);
  setMobileStyles();

  const handleInputChange = (e) => { state.inputValue = e.target.value; updateState(); };
  const handleFocus = () => {
    state.active = true;
    applyTextAreaRows(); // Update rows when focused (5 rows)
    updateState();
  };
  const handleBlur = () => {
    state.active = false;
    applyTextAreaRows(); // Update rows when blurred (2 rows)
    updateState();
  };

  // Only textArea is used now
  textArea?.addEventListener("input", (e) => {
    // Stop typewriter immediately when user starts typing
    if (state.isTypewriterActive) {
      window.searchFeature?.setTypewriterActive?.(false);
    }

    state.inputValue = e.target.value;
    updateState();
  });
  textArea?.addEventListener("focus", handleFocus);
  textArea?.addEventListener("blur", handleBlur);

  // IME-safe syncing and Enter-to-submit
  textArea?.addEventListener("compositionend", syncPromptFromDOM);
  textArea?.addEventListener("change", syncPromptFromDOM);
  textArea?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !(e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)) {
      e.preventDefault();
      generateButton?.click();
    }
  });

  // Allow textarea to scroll its content, and allow page scroll when at boundaries
  // The textarea naturally handles its own scrolling, no need to prevent anything

  // Add button
  addButton?.addEventListener("click", () => {
    // Check if we have user images at max limit (carousel images can be replaced)
    const hasUserImage = state.images.some(x => x.source !== "carousel");
    if (hasUserImage && state.images.length >= MAX_IMAGES) {
      flashError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    fileInput?.click();
    // NOTE: Carousel will detect user control via its own event listeners
  });
  addButton?.addEventListener("mouseenter", () => { addButton.classList.add("active"); if (!HINT_ON_SUBMIT_ONLY) tooltip?.classList.add("show"); });
  addButton?.addEventListener("mouseleave", () => { addButton.classList.remove("active"); tooltip?.classList.remove("show"); });

  // File upload
  fileInput?.addEventListener("change", async (e) => {
    const incoming = Array.from(e.target.files || []);
    if (!incoming.length) return;

    // If carousel image exists, remove it to make room for user upload
    const carouselIndex = state.images.findIndex(x => x.source === "carousel");
    if (carouselIndex !== -1) {
      state.images.splice(carouselIndex, 1);
    }

    // No truncation logic needed - always multi-line
    const remaining = Math.max(0, MAX_IMAGES - state.images.length);
    const selected = incoming.slice(0, remaining);
    const ignored = incoming.length - selected.length;

    for (const f of selected) {
      if (!isValidImageFile(f)) { flashError(`Only JPG, JPEG, PNG, WEBP up to ${MAX_MB} MB are allowed.`); continue; }

      const url = URL.createObjectURL(f);
      state.images.push({ file: f, url, source: "user" });

      updateState();
      updateAddButtonState();
    }
    if (ignored > 0) flashError(`You can upload up to ${MAX_IMAGES} images. Ignored ${ignored} file(s).`);
    e.target.value = "";
  });

  // Generate click
  generateButton?.addEventListener("click", (e) => {
    e.preventDefault();

    const currentSlide = window.aiPhotoCarousel?.getCurrentSlide?.();
    if (currentSlide?.label === "Video Generator") {
      window.location.href = "https://console.pixelbin.io/auth/login?redirectTo=/studio/video-generator";
      return;
    }

    let promptLive;

    // If typewriter is active, get the FULL prompt directly from carousel
    if (state.isTypewriterActive) {
      // Stop typewriter animation
      window.searchFeature?.setTypewriterActive?.(false);
      // Get the FULL prompt that was being typed
      const fullPrompt = window.aiPhotoCarousel?.getFullPrompt?.();
      if (fullPrompt) {
        promptLive = fullPrompt;
        // Update the UI with full prompt
        state.inputValue = fullPrompt;
        if (textArea) textArea.value = fullPrompt;
      } else {
        // Fallback to current value
        syncPromptFromDOM();
        promptLive = state.inputValue.trim();
      }
    } else {
      // Normal flow - sync from DOM
      syncPromptFromDOM();
      promptLive = state.inputValue.trim();
    }

    const prompt = resolvePromptForSubmit(promptLive);
    const needs = keywordNeedsImage(prompt);

    if (!prompt) { flashError("Please enter a prompt."); return; }
    if (prompt.length > state.maxChars) { flashError(`Prompt too long. Max ${state.maxChars} characters.`); return; }

    const files = state.images.map(x => x.file).filter(Boolean);
    const externalEntry = state.images.find(x => !x.file);
    const externalImageUrl = externalEntry?.url;
    const externalSlideKey = externalEntry?.slideKey || "carousel";

    if (needs && files.length === 0 && !externalImageUrl) {
      showImageHint();
      addButton?.focus({ preventScroll: false });
      flashError("This prompt needs an image. Please upload one.");
      return;
    }

    // Check if carousel has an injectable image but user hasn't focused yet
    const hasInjectableImage = currentSlide?.injectUrl?.trim();

    // If no images and carousel has injectable image, show tooltip and trigger injection
    if (files.length === 0 && !externalImageUrl && hasInjectableImage) {
      showImageHint();
      setTimeout(() => hideImageHint(), 2000); // Auto-hide after 2 seconds
      // Trigger focus to inject the carousel image
      textArea?.focus({ preventScroll: true });
      return;
    }

    const studioRoute = `/studio/${TOOL_NAME}`;
    setGenerating(true);

    // Prompt-only path
    if (!needs && files.length === 0 && !externalImageUrl) {
      window.location.href = pbBuildStudioRedirect(studioRoute, undefined, prompt);
      return;
    }

    // Image path
    (async () => {
      try {
        let file = files[0];
        if (!file && externalImageUrl) {
          file = await externalUrlToFile(externalImageUrl, externalSlideKey);
          if (!isValidImageFile(file)) { flashError("Only JPG, JPEG, PNG, WEBP up to 25 MB are allowed."); setGenerating(false); return; }
        }
        if (!file) { flashError("No file selected."); setGenerating(false); return; }

        try { showProgress?.(); setProgress?.(0); } catch {}

        const captcha = await pbGetRecaptchaToken();
        if (!captcha) throw new Error("reCAPTCHA token missing");

        const resp = await pbDirectUpload(file, 1, captcha, null, true, (pct) => { try { setProgress?.(pct); } catch {} });
        if (!resp?.url) throw new Error("Upload succeeded but no URL returned");

        window.location.href = pbBuildStudioRedirect(studioRoute, resp.url, prompt);
      } catch (err) {
        try { flashErrorInline?.(err?.message || "Upload failed. Please try again."); }
        catch { flashError(err?.message || "Upload failed. Please try again."); }
        setGenerating(false);
      } finally {
        try { hideProgress?.(); } catch {}
      }
    })();
  });

  // Error UI
  const flashError = (msg) => {
    const box = q("uploadError"), txt = q("uploadErrorText");
    if (box && txt) { txt.textContent = msg; box.style.display = "block"; }
    form?.classList.add("error");
    setTimeout(() => form?.classList.remove("error"), 1200);
  };

  // Public API
  window.searchFeature = {
    setPrompt(text, isTypewriter = false) {
      const next = text || "";
      state.inputValue = next;
      if (textArea) textArea.value = next;
      // Don't update char counter during typewriter animation
      if (!isTypewriter) {
        updateState();
      } else {
        // During typewriter, only update UI elements except char counter
        updateUI(false);
      }
    },
    setExternalImage(url, slideKey) { addExternalImage(url, slideKey, "carousel"); },
    clearImages(scope = "all") { clearImagesByScope(scope); },
    getImageCount(source = "all") {
      if (source === "all") return state.images.length;
      return state.images.filter(img => img.source === source).length;
    },
    isInputFocused: () => state.active, // Expose focus state for carousel wheel navigation check
    getLivePrompt: () => getLivePrompt(), // Expose current prompt value
    setTypewriterActive(active) {
      const wasActive = state.isTypewriterActive;
      state.isTypewriterActive = !!active;
      // Stop typewriter in carousel when user takes control (prevent circular calls)
      if (!active && wasActive) {
        window.aiPhotoCarousel?.stopTypewriter?.();
        updateCharCounter();
      }
    },
  };

  // Pill click handler
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".pb_input_pill");
    if (!pill) return;
    const prompt = (pill.dataset.prompt || pill.querySelector(".gen_text")?.textContent || "").trim();
    if (prompt) window.searchFeature.setPrompt(prompt);
  });
});

// ===== PIXELBIN ENV & UPLOAD =====
(() => {
  const PB_DEBUG = true;
  const host = location.hostname;
  const isStaging = host.includes("webflow.io") || host.includes("pixelbinz0.de");

  const searchContainer = document.getElementById("searchContainer");
  const dataset = searchContainer?.dataset || {};
  const readDataset = (key) => {
    const value = dataset?.[key];
    return typeof value === "string" ? value.trim() : "";
  };

  const defaultClientKey = readDataset("clientKey");
  const stagingClientKey = readDataset("clientKeyStaging") || readDataset("stagingClientKey");
  const productionClientKey = readDataset("clientKeyProduction") || readDataset("productionClientKey");
  const resolvedProdKey = productionClientKey || defaultClientKey || "1234567";
  const resolvedStagingKey = stagingClientKey || defaultClientKey || resolvedProdKey;

  const PB_ENV = {
    API_URL: isStaging ? "https://api.pixelbinz0.de/service/panel/assets/v1.0/upload/direct"
      : "https://api.pixelbin.io/service/panel/assets/v1.0/upload/direct",
    SITE_KEY: isStaging ? "6LeJwSsdAAAAACEftEzfp4h_f520nfzmrhbrc3Q3"
      : "6LcgwSsdAAAAAJO_QsCkkQuSlkOal2jqXic2Zuvj",
    CONSOLE_BASE: isStaging ? "https://console.pixelbinz0.de" : "https://console.pixelbin.io",
    CLIENT_KEY: isStaging ? resolvedStagingKey : resolvedProdKey,
  };

  window.PB_ENV = PB_ENV;

  const buildUploadUrl = (orgId) => {
    if (!orgId) return PB_ENV.API_URL;
    try {
      const url = new URL(PB_ENV.API_URL);
      url.pathname = url.pathname.replace(/\/upload\/direct$/, `/org/${encodeURIComponent(orgId)}/upload/direct`);
      return url.toString();
    } catch (e) {
      return PB_ENV.API_URL;
    }
  };

  const hexSha256 = (s) => CryptoJS.SHA256(s).toString();
  const hexHmac = (k, s) => CryptoJS.HmacSHA256(s, k).toString();
  const encRFC3986 = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

  class PB_RequestSigner {
    constructor(req) {
      let u;
      if (typeof req === "string") u = new URL(req, location.origin);
      else if (req.host && req.path) u = new URL(req.path, `https://${req.host}`);
      else throw new TypeError("Invalid request");
      this.r = {
        method: req.method || (req.body ? "POST" : "GET"),
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        headers: Object.assign({}, req.headers),
        body: req.body || "",
        query: Object.fromEntries(u.searchParams.entries()),
      };
      if (!this.r.headers.Host && !this.r.headers.host) {
        this.r.headers.Host = this.r.hostname + (this.r.port ? ":" + this.r.port : "");
      }
    }
    _ts() {
      return (this.__ts ||= new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ""));
    }
    _canonHeaders() {
      const h = this.r.headers, IGN = {
        authorization: 1, connection: 1, "x-amzn-trace-id": 1, "user-agent": 1,
        expect: 1, "presigned-expires": 1, range: 1
      };
      const INC = ["x-ebg-.*", "host"];
      return Object.keys(h)
        .filter((k) => !IGN[k.toLowerCase()] && INC.some((rx) => new RegExp(rx, "i").test(k)))
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .map((k) => k.toLowerCase() + ":" + String(h[k]).trim().replace(/\s+/g, " "))
        .join("\n");
    }
    _signedHeaders() {
      const h = this.r.headers, IGN = {
        authorization: 1, connection: 1, "x-amzn-trace-id": 1, "user-agent": 1,
        expect: 1, "presigned-expires": 1, range: 1
      };
      const INC = ["x-ebg-.*", "host"];
      return Object.keys(h)
        .map((k) => k.toLowerCase())
        .filter((k) => !IGN[k] && INC.some((rx) => new RegExp(rx, "i").test(k)))
        .sort()
        .join(";");
    }
    _canonQuery() {
      const q = this.r.query;
      if (!q || !Object.keys(q).length) return "";
      const parts = [];
      Object.keys(q).sort().forEach((k) => {
        const key = encRFC3986(k);
        const vals = Array.isArray(q[k]) ? q[k] : [q[k]];
        vals.map(String).map(encRFC3986).sort().forEach((v) => parts.push(`${key}=${v}`));
      });
      return parts.join("&");
    }
    _canonPath() {
      let p = this.r.path || "/";
      if (/[^0-9A-Za-z;,/?:@&=+$\-_.!~*'()#%]/.test(p)) p = encodeURI(decodeURI(p));
      const parts = p.split("/").reduce((acc, seg) => {
        if (!seg || seg === ".") return acc;
        if (seg === "..") acc.pop();
        else acc.push(encRFC3986(seg));
        return acc;
      }, []);
      return "/" + parts.join("/");
    }
    _canonRequest() {
      const bodyHash = hexSha256(this.r.body || "");
      const s = [
        this.r.method || "GET",
        this._canonPath(),
        this._canonQuery(),
        this._canonHeaders() + "\n",
        this._signedHeaders(),
        bodyHash,
      ].join("\n");
      return s;
    }
    _stringToSign() {
      const sts = [this._ts(), hexSha256(this._canonRequest())].join("\n");
      return sts;
    }
    sign() {
      const h = this.r.headers;
      if (!h["x-ebg-param"]) h["x-ebg-param"] = this._ts();
      delete h["x-ebg-signature"];
      delete h["X-Ebg-Signature"];
      const clientKeyCandidate = typeof PB_ENV?.CLIENT_KEY === "string" ? PB_ENV.CLIENT_KEY.trim() : "";
      const clientKey = clientKeyCandidate || "1234567";
      if (!clientKeyCandidate && PB_DEBUG && !PB_ENV.__warnedFallbackClientKey) {
        PB_ENV.__warnedFallbackClientKey = true;
      }
      h["x-ebg-signature"] = "v1:" + hexHmac(clientKey, this._stringToSign());
      return this.r;
    }
  }

  // reCAPTCHA
  let widgetId = null, apiReady = null, pendingResolve = null;
  const loadRecaptcha = () => {
    if (apiReady) return apiReady;
    apiReady = new Promise((resolve, reject) => {
      if (!document.getElementById("recaptcha-container")) {
        reject(new Error("recaptcha-container missing"));
        return;
      }
      const s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=__pbRcOnLoad";
      s.async = s.defer = true;
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(s);
      window.__pbRcOnLoad = () => {
        try {
          widgetId = grecaptcha.render("recaptcha-container", {
            sitekey: PB_ENV.SITE_KEY,
            size: "invisible",
            callback: (token) => {
              if (pendingResolve) pendingResolve(token);
              pendingResolve = null;
              grecaptcha.reset(widgetId);
            },
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      };
    });
    return apiReady;
  };

  window.pbGetRecaptchaToken = () => loadRecaptcha().then(() => new Promise((resolve, reject) => {
    pendingResolve = resolve;
    try {
      grecaptcha.execute(widgetId);
    } catch (e) {
      pendingResolve = null;
      reject(e);
    }
  }));

  // Direct upload (XHR)
  window.pbDirectUpload = async (file, requestId, captchaCode, orgId = null, filenameOverride = true, onProgress = () => {}) => {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("filenameOverride", JSON.stringify(filenameOverride));
    const datePart = new Date().toISOString().split("T")[0];
    form.append("path", filenameOverride ? `__editor/${datePart}` : "");

    const apiUrl = buildUploadUrl(orgId);
    const { host, pathname, search } = new URL(apiUrl);
    const signed = new PB_RequestSigner({
      host, method: "POST", path: pathname + search, headers: {}, body: ""
    }).sign();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl);
      xhr.withCredentials = true;
      xhr.setRequestHeader("x-ebg-signature", signed.headers["x-ebg-signature"]);
      xhr.setRequestHeader("x-ebg-param", btoa(signed.headers["x-ebg-param"]));
      if (captchaCode) xhr.setRequestHeader("captcha-code", captchaCode);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          onProgress(pct, requestId);
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const json = JSON.parse(xhr.response);
            resolve(json);
          } catch {
            reject({ status: 200, message: "Invalid JSON" });
          }
        } else {
          let msg = "";
          try { msg = JSON.parse(xhr.response); } catch { msg = xhr.statusText; }
          reject({ status: xhr.status, message: msg });
        }
      };
      xhr.onerror = () => {
        reject({ status: xhr.status, message: xhr.statusText });
      };
      xhr.send(form);
    });
  };

  // Redirect helper
  window.pbBuildStudioRedirect = (toolRoute, imageUrl, prompt) => {
    const params = new URLSearchParams();
    if (imageUrl) params.set("imageUrl", imageUrl);
    if (prompt) params.set("transformationPrompt", prompt);
    const redirectTo = params.toString() ? `${toolRoute}?${params.toString()}` : toolRoute;
    const final = `${PB_ENV.CONSOLE_BASE}/choose-org?redirectTo=${encodeURIComponent(redirectTo)}`;
    return final;
  };
})();

// ===== PROGRESS & ERROR INTEGRATION =====
(() => {
  if (typeof window.pbGetRecaptchaToken !== "function" ||
      typeof window.pbDirectUpload !== "function" ||
      typeof window.pbBuildStudioRedirect !== "function") {
    return;
  }

  const PROGRESS_BLOCK = "[pb-indicator-block='upload-progress']";
  const PROGRESS_TEXT = "[pb-indicator='progress-text']";

  window.showProgress = () => {
    const el = document.querySelector(PROGRESS_BLOCK);
    if (el) el.style.display = "flex";
  };
  window.hideProgress = () => {
    const el = document.querySelector(PROGRESS_BLOCK);
    if (el) el.style.display = "none";
  };
  window.setProgress = (p) => {
    const t = document.querySelector(PROGRESS_TEXT);
    if (t) t.textContent = `${Math.round(p)}%`;
  };
  window.flashErrorInline = (msg) => {
    const box = document.getElementById("uploadError");
    const txt = document.getElementById("uploadErrorText");
    if (box && txt) {
      txt.textContent = msg;
      box.style.display = "block";
    }
  };

  // aiSearchSubmit event handler (legacy support)
  window.addEventListener("aiSearchSubmit", (e) => {
    if (!e?.detail) {
      return;
    }
    handleSubmit(e.detail);
  });

  async function handleSubmit(detail) {
    const tool = detail.tool || "ai-editor";
    const prompt = (detail.prompt || "").trim();
    const files = Array.isArray(detail.files) ? detail.files : [];
    const needs = !!detail.needsImage;
    const externalUrl = detail.externalImageUrl;

    if (!prompt) {
      flashErrorInline("Please enter a prompt.");
      return;
    }

    if (needs && files.length === 0 && !externalUrl) {
      flashErrorInline("This prompt needs an image. Please upload one.");
      return;
    }

    if (externalUrl && files.length === 0) {
      const studioRoute = `/studio/${tool}`;
      const redirectURL = pbBuildStudioRedirect(studioRoute, externalUrl, prompt);
      window.location.href = redirectURL;
      return;
    }

    const file = files[0];
    if (!file) {
      flashErrorInline("No file selected.");
      return;
    }

    try {
      showProgress();
      setProgress(0);

      const captcha = await pbGetRecaptchaToken();
      if (!captcha) throw new Error("reCAPTCHA token missing");

      const resp = await pbDirectUpload(file, 1, captcha, null, true, (pct) => setProgress(pct));
      if (!resp?.url) throw new Error("Upload succeeded but no URL returned");

      const studioRoute = `/studio/${tool}`;
      const redirectURL = pbBuildStudioRedirect(studioRoute, resp.url, prompt);
      window.location.href = redirectURL;
    } catch (err) {
      flashErrorInline(err?.message || "Upload failed. Please try again.");
    } finally {
      hideProgress();
    }
  }
})();
