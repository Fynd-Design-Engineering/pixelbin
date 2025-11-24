
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("searchContainer");
  if (!container) { console.error("[UI] #searchContainer not found"); return; }

  const TOOL_NAME = (container.dataset.toolName || "ai-editor").trim();
  const MAX_CHARS = parseInt(container.dataset.maxChars || "1000", 10);
  const HINT_ON_SUBMIT_ONLY = true;

  // Loader image (will render INSIDE the thumbnail slot only)
  const LOADER_URL = "https://cdn.prod.website-files.com/673193e0642e6ad25696fcd4/6921902dc9c1daf39440e804_image%20(8).png";

  // Only require an image if the FIRST word is one of these actions
  const ACTION_FIRST_WORDS = ["remove","erase","delete","replace","edit","upscale"];
  function keywordNeedsImage(text) {
    if (!text) return false;
    const first = (text.trim().toLowerCase().match(/^[^\p{L}\p{N}]*(\p{L}+)/u) || [,""])[1];
    return ACTION_FIRST_WORDS.includes(first);
  }

  // DOM refs
  const form = document.getElementById("searchForm");
  const formContent = document.getElementById("formContent");
  const imagesSection = document.getElementById("imagesSection");
  const textInput = document.getElementById("textInput");
  const textArea = document.getElementById("textArea");
  const toolbar = document.getElementById("toolbar");
  const addButton = document.getElementById("addButton");
  const generateButton = document.getElementById("generateButton");
  const generateText = generateButton?.querySelector(".generate-text");
  const tooltip = document.getElementById("tooltip");
  const fileInput = document.getElementById("fileInput");
  const charCounter = document.getElementById("charCounter");

  // Image constraints
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp"];
  const MAX_MB = 25;
  const MAX_IMAGES = 1;

  // State
  const state = {
    inputValue: "",
    images: [],                // [{ file|null, url, slideKey?, source? }]
    active: false,
    mode: "empty",
    maxChars: MAX_CHARS,
    loadingImage: false,       // only while a thumbnail-slot loader is active
    isGenerating: false,       // "Generate" -> "Generating…"
  };

  function setGenerating(on) { state.isGenerating = !!on; updateUI(false); }

  // ===== Live DOM sync helpers =====
  function activeEditor() {
    if (textArea && !textArea.classList.contains("hidden")) return textArea;
    return textInput;
  }
  function getLivePrompt() {
    const el = activeEditor();
    return el ? String(el.value || "") : state.inputValue || "";
  }
  function syncPromptFromDOM() {
    const live = getLivePrompt();
    if (live !== state.inputValue) {
      state.inputValue = live;
      updateState();
    }
  }
  // ===== Submit-time full prompt restore (fix truncation) =====
  function truncateForUI(text, max = 64) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.substring(0, max).trim() + "...";
  }
  function resolvePromptForSubmit(liveValue) {
    try {
      const raw = window.aiPhotoCarousel?.getStoredPrompt?.() || "";
      if (!raw) return liveValue;

      const truncated = truncateForUI(raw, 64);
      if (liveValue === truncated) return raw;

      if (/\.\.\.$/.test(liveValue)) {
        const base = liveValue.replace(/\.\.\.$/, "").trim();
        if (base && raw.startsWith(base)) return raw;
      }
    } catch {}
    return liveValue;
  }
  // ========================================

  // Validation
  const isValidImageFile = (f) => {
    if (!f) return false;
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    return f.type.startsWith("image/") &&
           (ALLOWED_TYPES.includes(f.type) || ALLOWED_EXTS.includes(ext)) &&
           f.size <= MAX_MB * 1024 * 1024;
  };

  // Convert external URL → File (for upload path)
  async function externalUrlToFile(url, slideKey = "carousel") {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const blob = await res.blob();
    const mime = blob.type || "image/jpeg";
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const safeKey = (slideKey || "carousel").toLowerCase().replace(/[^\w-]+/g, "-");
    return new File([blob], `carousel-${safeKey}-${Date.now()}.${ext}`, { type: mime });
  }

  // Image preloader
  function preloadImage(url) {
    return new Promise((resolve) => {
      const i = new Image();
      i.onload = () => resolve(true);
      i.onerror = () => resolve(false);
      i.src = url;
    });
  }

  // ===== Thumbnail-slot loader (ONLY where the image will appear) =====
  function createSlotLoader() {
    if (!imagesSection) return null;
    imagesSection.classList.remove("hidden");

    const slot = document.createElement("div");
    slot.className = "image-thumbnail loading-slot";
    Object.assign(slot.style, {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.04)",
      borderRadius: "8px",
      minWidth: "72px",
      minHeight: "72px",
      overflow: "hidden",
    });

    const spin = document.createElement("img");
    spin.src = LOADER_URL;
    spin.alt = "Loading…";
    Object.assign(spin.style, { width: "48px", height: "48px", objectFit: "contain", opacity: "0.85" });
    slot.appendChild(spin);

    imagesSection.appendChild(slot);
    state.loadingImage = true;
    updateUI(false);
    return slot;
  }
  function removeSlotLoader(slot) {
    if (slot && slot.parentNode) slot.parentNode.removeChild(slot);
    state.loadingImage = false;
    updateUI(false);
  }
  // ===================================================================

  // Helpers for images
  function hasExternalImage(url, slideKey) {
    return state.images.some(x => x.url === url || (slideKey && x.slideKey === slideKey));
  }

  async function addExternalImage(url, slideKey, source = "carousel") {
    if (!url) return;
    if (state.images.length >= MAX_IMAGES) return;
    if (hasExternalImage(url, slideKey)) return;

    const slot = createSlotLoader();
    await preloadImage(url);
    if (slot) removeSlotLoader(slot);

    state.images.push({ file: null, url, slideKey, source });
    updateState();
    updateAddButtonState();
  }

  function clearImagesByScope(scope = "all") {
    if (scope === "carousel") {
      state.images = state.images.filter((x) => x.source !== "carousel");
    } else {
      state.images.forEach((x) => { if (x.file && x.url?.startsWith("blob:")) URL.revokeObjectURL(x.url); });
      state.images = [];
    }
    updateState();
    updateAddButtonState();
  }

  // Textarea rows rule: 2 rows if image present, else 5
  function applyTextAreaRows() {
    if (!textArea) return;
    textArea.rows = state.images.length > 0 ? 2 : 5;
  }

  // Responsive tweaks
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
      charCounter.textContent = `${len}/${state.maxChars}`;
      charCounter.classList.toggle("over", len > state.maxChars);
    }
    form?.classList.toggle("over-limit", len > state.maxChars);
  };

  function updateAddButtonState() {
    const blocked = state.images.length >= MAX_IMAGES || state.loadingImage || state.isGenerating;
    if (addButton) {
      addButton.disabled = blocked;
      addButton.classList.toggle("is-disabled", blocked);
      addButton.setAttribute("aria-disabled", String(blocked));
    }
    if (state.images.length >= MAX_IMAGES) hideImageHint();
  }

  // Render thumbnails
  const renderImages = () => {
    if (!imagesSection) return;
    imagesSection.innerHTML = "";
    state.images.forEach((img, idx) => {
      const div = document.createElement("div");
      div.className = "image-thumbnail";
      div.style.backgroundImage = `url(${img.url})`;
      div.style.backgroundSize = "cover";
      div.style.backgroundPosition = "center";
      div.style.borderRadius = "8px";
      div.style.minWidth = "72px";
      div.style.minHeight = "72px";
      div.style.position = "relative";
      if (img.source)   div.dataset.source   = img.source;
      if (img.slideKey) div.dataset.slideKey = img.slideKey;
      div.dataset.url = img.url;

      const close = document.createElement("button");
      close.type = "button";
      close.className = "image-close";
      close.setAttribute("aria-label", "Remove image");
      close.textContent = "×";
      Object.assign(close.style, {
        position: "absolute", top: "4px", right: "6px",
        background: "rgba(0,0,0,0.55)", color: "#fff",
        border: "0", borderRadius: "12px", width: "20px", height: "20px", lineHeight: "20px", cursor: "pointer"
      });
      close.addEventListener("click", () => {
        if (state.images[idx]?.file && state.images[idx]?.url?.startsWith("blob:")) {
          URL.revokeObjectURL(state.images[idx].url);
        }
        state.images.splice(idx, 1);
        updateState();
        updateAddButtonState();
      });

      div.appendChild(close);
      imagesSection.appendChild(div);
    });
  };

  // Layout switching without animation jank
  // Around line 280 in UI script
function switchLayoutWithoutAnimation(multi) {
  const els = [form, formContent, toolbar].filter(Boolean); // ✅ Filter out nulls
  const prevTransitions = els.map((el) => el.style.transition);
  els.forEach((el) => { el.style.transition = "none"; });

  form?.classList.toggle("multi-line", multi);
  form?.classList.toggle("single-line", !multi);
  container?.classList.toggle("multi-line", multi);
  container?.classList.toggle("single-line", !multi);
  formContent?.classList.toggle("single-line", !multi);
  toolbar?.classList.toggle("single-line", !multi);

  // Force reflow - but check element exists
  if (form) form.offsetHeight; // ✅ Only if form exists
  
  requestAnimationFrame(() => { 
    els.forEach((el, i) => { el.style.transition = prevTransitions[i]; }); 
  });
}

  // UI update
  const updateUI = (flipLayout = false) => {
    const multi = state.mode === "multiline" || state.mode === "image-attached";
    if (flipLayout) switchLayoutWithoutAnimation(multi);

    if (multi) {
      textInput?.classList.add("hidden");
      textArea?.classList.remove("hidden");
      if (textArea) { textArea.value = state.inputValue; applyTextAreaRows(); }
    } else {
      textInput?.classList.remove("hidden");
      textArea?.classList.add("hidden");
      if (textInput) textInput.value = state.inputValue;
    }

    if (imagesSection) {
      if (state.images.length > 0 || state.loadingImage) {
        imagesSection.classList.remove("hidden");
        renderImages();
      } else {
        imagesSection.classList.add("hidden");
        imagesSection.innerHTML = "";
      }
    }

    applyTextAreaRows();

    const promptPresent = state.inputValue.trim().length > 0;
    const overLimit = state.inputValue.length > state.maxChars;
    const canGenerate = promptPresent && !overLimit && !state.loadingImage && !state.isGenerating;

    generateButton?.classList.toggle("active", canGenerate);
    generateButton?.classList.toggle("inactive", !canGenerate);
    if (generateButton) {
      generateButton.disabled = !canGenerate;
      generateButton.classList.toggle("is-generating", state.isGenerating);
      generateButton.setAttribute("aria-busy", String(state.isGenerating));
      if (generateText) {
        generateText.textContent = state.isGenerating ? "Generating…" : "Generate";
      } else {
        generateButton.textContent = state.isGenerating ? "Generating…" : "Generate";
      }
    }

    updateAddButtonState();
  };

  // State recompute
  const updateState = () => {
    const prevMode = state.mode;
    if (state.images.length > 0) state.mode = "image-attached";
    else if (state.inputValue.length > 67) state.mode = "multiline";
    else if (state.inputValue.length > 0) state.mode = "filled";
    else if (state.active) state.mode = "active";
    else state.mode = "empty";

    const layoutChanged = prevMode !== state.mode;
    updateUI(layoutChanged);
    updateCharCounter();
    applyTextAreaRows();
  };

  // Events
  window.addEventListener("resize", setMobileStyles);
  setMobileStyles();

  textInput?.addEventListener("input", (e) => { state.inputValue = e.target.value; updateState(); });
  textInput?.addEventListener("focus", () => { state.active = true; updateState(); });
  textInput?.addEventListener("blur", () => { if (!state.inputValue && state.images.length === 0) { state.active = false; updateState(); } });

  textArea?.addEventListener("input", (e) => { state.inputValue = e.target.value; applyTextAreaRows(); updateState(); });
  textArea?.addEventListener("focus", () => { state.active = true; updateState(); });
  textArea?.addEventListener("blur", () => { if (!state.inputValue && state.images.length === 0) { state.active = false; updateState(); } });

  // IME-safe syncing and Enter-to-submit
  [textInput, textArea].forEach(el => {
    el?.addEventListener("compositionend", () => { syncPromptFromDOM(); });
    el?.addEventListener("change", () => { syncPromptFromDOM(); });
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !(e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        generateButton?.click();
      }
    });
  });

  addButton?.addEventListener("click", () => {
    if (state.images.length >= MAX_IMAGES) { flashError(`Maximum ${MAX_IMAGES} images allowed.`); return; }
    fileInput?.click();
  });
  addButton?.addEventListener("mouseenter", () => { addButton.classList.add("active"); if (!HINT_ON_SUBMIT_ONLY) tooltip?.classList.add("show"); });
  addButton?.addEventListener("mouseleave", () => { addButton.classList.remove("active"); tooltip?.classList.remove("show"); });

  // File upload → show loader in the thumbnail slot only
  fileInput?.addEventListener("change", async (e) => {
  const incoming = Array.from(e.target.files || []);
  if (!incoming.length) return;

  const remaining = Math.max(0, MAX_IMAGES - state.images.length);
  const selected = incoming.slice(0, remaining);
  const ignored = incoming.length - selected.length;

for (const f of selected) {
  if (!isValidImageFile(f)) { 
    flashError(`Only JPG, JPEG, PNG, WEBP up to ${MAX_MB} MB are allowed.`); 
    continue; 
  }
  const slot = createSlotLoader();
  try {
    const url = URL.createObjectURL(f);
    await preloadImage(url);
    if (slot) removeSlotLoader(slot);
    state.images.push({ file: f, url, source: "user" }); // ✅ Mark as user
    
    // ✅ Pause carousel permanently until image removed
    window.aiPhotoCarousel?.markUserUpload?.(url);
    
    updateState();
    updateAddButtonState();
  } finally {}
}
  if (ignored > 0) flashError(`You can upload up to ${MAX_IMAGES} images. Ignored ${ignored} file(s).`);
  e.target.value = "";
});

  // Generate click — NO overlay; only button text/state changes
  generateButton?.addEventListener("click", (e) => {
    e.preventDefault();

    // Ensure latest text, then restore full prompt if carousel truncated it
    syncPromptFromDOM();
    const promptLive = state.inputValue.trim();
    const prompt = resolvePromptForSubmit(promptLive);
    const needs = keywordNeedsImage(prompt);

    if (!prompt) { flashError("Please enter a prompt."); return; }
    if (prompt.length > state.maxChars) { flashError(`Prompt too long. Max ${state.maxChars} characters.`); return; }
    if (state.loadingImage) { flashError("Please wait for the image to finish loading."); return; }

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

    const studioRoute = `/studio/${TOOL_NAME}`;
    setGenerating(true); // switch button to "Generating…"

    // Prompt-only path
    if (!needs && files.length === 0 && !externalImageUrl) {
      const redirectURL = pbBuildStudioRedirect(studioRoute, undefined, prompt);
      window.location.href = redirectURL;
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

        const redirectURL = pbBuildStudioRedirect(studioRoute, resp.url, prompt);
        window.location.href = redirectURL;
      } catch (err) {
        console.error("[submit fail]", err);
        try { flashErrorInline?.(err?.message || "Upload failed. Please try again."); }
        catch { flashError(err?.message || "Upload failed. Please try again."); }
        setGenerating(false);
      } finally {
        try { hideProgress?.(); } catch {}
      }
    })();
  });

  // Error UI
  function flashError(msg) {
    console.error(msg);
    const box = document.getElementById("uploadError");
    const txt = document.getElementById("uploadErrorText");
    if (box && txt) { txt.textContent = msg; box.style.display = "block"; }
    form?.classList.add("error");
    setTimeout(() => form?.classList.remove("error"), 1200);
  }

  // Public API for carousel/chips
  window.searchFeature = {
    setPrompt(text) {
      const next = text || "";
      state.inputValue = next;
      if (form?.classList.contains("multi-line")) { if (textArea) textArea.value = next; }
      else { if (textInput) textInput.value = next; }
      updateState();
    },
    setExternalImage(url, slideKey) { addExternalImage(url, slideKey, "carousel"); },
    clearImages(scope = "all") { clearImagesByScope(scope); },
  };

  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".pb_input_pill");
    if (!pill) return;
    const prompt = (pill.dataset.prompt || pill.querySelector(".gen_text")?.textContent || "").trim();
    if (!prompt) return;
    window.searchFeature.setPrompt(prompt);
  });
});




(() => {
  const PB_DEBUG = true;

  const host = location.hostname;
  const isStaging =
    host.includes("webflow.io") || host.includes("pixelbinz0.de");

  const searchContainer = document.getElementById("searchContainer");
  const dataset = searchContainer ? searchContainer.dataset : {};
  const readDataset = (key) => {
    const value = dataset?.[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const defaultClientKey = readDataset("clientKey");
  const stagingClientKey =
    readDataset("clientKeyStaging") || readDataset("stagingClientKey");
  const productionClientKey =
    readDataset("clientKeyProduction") || readDataset("productionClientKey");
  const resolvedProdKey = productionClientKey || defaultClientKey || "1234567";
  const resolvedStagingKey =
    stagingClientKey || defaultClientKey || resolvedProdKey;
  const PB_ENV = {
    API_URL: isStaging
      ? "https://api.pixelbinz0.de/service/panel/assets/v1.0/upload/direct"
      : "https://api.pixelbin.io/service/panel/assets/v1.0/upload/direct",
    SITE_KEY: isStaging
      ? "6LeJwSsdAAAAACEftEzfp4h_f520nfzmrhbrc3Q3"
      : "6LcgwSsdAAAAAJO_QsCkkQuSlkOal2jqXic2Zuvj",
    CONSOLE_BASE: isStaging
      ? "https://console.pixelbinz0.de"
      : "https://console.pixelbin.io",
    CLIENT_KEY: isStaging ? resolvedStagingKey : resolvedProdKey,
  };
  window.PB_ENV = PB_ENV;
  if (PB_DEBUG) console.info("[PB_ENV]", PB_ENV);

  const buildUploadUrl = (orgId) => {
    if (!orgId) return PB_ENV.API_URL;
    try {
      const url = new URL(PB_ENV.API_URL);
      url.pathname = url.pathname.replace(
        /\/upload\/direct$/,
        `/org/${encodeURIComponent(orgId)}/upload/direct`
      );
      return url.toString();
    } catch (e) {
      if (PB_DEBUG)
        console.error("[upload] failed to build org upload URL; using default", e);
      return PB_ENV.API_URL;
    }
  };

  const hexSha256 = (s) => CryptoJS.SHA256(s).toString();
  const hexHmac = (k, s) => CryptoJS.HmacSHA256(s, k).toString();
  const encRFC3986 = (s) =>
    encodeURIComponent(s).replace(
      /[!'()*]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
    );

  class PB_RequestSigner {
    constructor(req) {
      let u;
      if (typeof req === "string") u = new URL(req, location.origin);
      else if (req.host && req.path)
        u = new URL(req.path, `https://${req.host}`);
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
        this.r.headers.Host =
          this.r.hostname + (this.r.port ? ":" + this.r.port : "");
      }
    }
    _ts() {
      return (this.__ts ||= new Date()
        .toISOString()
        .replace(/[:\-]|\.\d{3}/g, ""));
    }
    _canonHeaders() {
      const h = this.r.headers,
        IGN = {
          authorization: 1,
          connection: 1,
          "x-amzn-trace-id": 1,
          "user-agent": 1,
          expect: 1,
          "presigned-expires": 1,
          range: 1,
        };
      const INC = ["x-ebg-.*", "host"];
      return Object.keys(h)
        .filter(
          (k) =>
            !IGN[k.toLowerCase()] &&
            INC.some((rx) => new RegExp(rx, "i").test(k))
        )
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .map(
          (k) =>
            k.toLowerCase() + ":" + String(h[k]).trim().replace(/\s+/g, " ")
        )
        .join("\n");
    }
    _signedHeaders() {
      const h = this.r.headers,
        IGN = {
          authorization: 1,
          connection: 1,
          "x-amzn-trace-id": 1,
          "user-agent": 1,
          expect: 1,
          "presigned-expires": 1,
          range: 1,
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
      Object.keys(q)
        .sort()
        .forEach((k) => {
          const key = encRFC3986(k);
          const vals = Array.isArray(q[k]) ? q[k] : [q[k]];
          vals
            .map(String)
            .map(encRFC3986)
            .sort()
            .forEach((v) => parts.push(`${key}=${v}`));
        });
      return parts.join("&");
    }
    _canonPath() {
      let p = this.r.path || "/";
      if (/[^0-9A-Za-z;,/?:@&=+$\-_.!~*'()#%]/.test(p))
        p = encodeURI(decodeURI(p));
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
      if (PB_DEBUG) console.debug("[Signer] canonicalRequest\n", s);
      return s;
    }
    _stringToSign() {
      const sts = [this._ts(), hexSha256(this._canonRequest())].join("\n");
      if (PB_DEBUG) console.debug("[Signer] stringToSign\n", sts);
      return sts;
    }
    sign() {
      const h = this.r.headers;
      if (!h["x-ebg-param"]) h["x-ebg-param"] = this._ts();
      delete h["x-ebg-signature"];
      delete h["X-Ebg-Signature"];
      const clientKeyCandidate =
        typeof PB_ENV?.CLIENT_KEY === "string" ? PB_ENV.CLIENT_KEY.trim() : "";
      const clientKey = clientKeyCandidate || "1234567";
      if (
        !clientKeyCandidate &&
        PB_DEBUG &&
        !PB_ENV.__warnedFallbackClientKey
      ) {
        PB_ENV.__warnedFallbackClientKey = true;
        console.warn(
          "[Signer] Using fallback client key; set data-client-key attributes for production values."
        );
      }
      h["x-ebg-signature"] = "v1:" + hexHmac(clientKey, this._stringToSign());
      if (PB_DEBUG) console.debug("[Signer] headers", h);
      return this.r;
    }
  }

  // reCAPTCHA (invisible)
  let widgetId = null,
    apiReady = null,
    pendingResolve = null;
  function loadRecaptcha() {
    if (apiReady) return apiReady;
    apiReady = new Promise((resolve, reject) => {
      if (!document.getElementById("recaptcha-container")) {
        console.error("[reCAPTCHA] #recaptcha-container not found");
        reject(new Error("recaptcha-container missing"));
        return;
      }
      const s = document.createElement("script");
      s.src =
        "https://www.google.com/recaptcha/api.js?render=explicit&onload=__pbRcOnLoad";
      s.async = s.defer = true;
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(s);
      window.__pbRcOnLoad = () => {
        try {
          widgetId = grecaptcha.render("recaptcha-container", {
            sitekey: PB_ENV.SITE_KEY,
            size: "invisible",
            callback: (token) => {
              if (PB_DEBUG) console.debug("[reCAPTCHA] token", token);
              if (pendingResolve) pendingResolve(token);
              pendingResolve = null;
              grecaptcha.reset(widgetId);
            },
          });
          if (PB_DEBUG)
            console.info("[reCAPTCHA] rendered, widgetId=", widgetId);
          resolve();
        } catch (e) {
          console.error("[reCAPTCHA] render error", e);
          reject(e);
        }
      };
    });
    return apiReady;
  }

  window.pbGetRecaptchaToken = () =>
    loadRecaptcha().then(
      () =>
        new Promise((resolve, reject) => {
          pendingResolve = resolve;
          try {
            if (PB_DEBUG) console.debug("[reCAPTCHA] executing");
            grecaptcha.execute(widgetId);
          } catch (e) {
            pendingResolve = null;
            console.error("[reCAPTCHA] execute error", e);
            reject(e);
          }
        })
    );

  // direct upload (XHR)
  window.pbDirectUpload = async function (
    file,
    requestId,
    captchaCode,
    orgId = null,
    filenameOverride = true,
    onProgress = () => {}
  ) {
    console.group("[pbDirectUpload]");
    console.log(
      "file:",
      file?.name,
      file?.type,
      file?.size,
      "requestId:",
      requestId
    );
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("filenameOverride", JSON.stringify(filenameOverride));
    const datePart = new Date().toISOString().split("T")[0];
    form.append("path", filenameOverride ? `__editor/${datePart}` : "");

    const apiUrl = buildUploadUrl(orgId);
    const { host, pathname, search } = new URL(apiUrl);
    const signed = new PB_RequestSigner({
      host,
      method: "POST",
      path: pathname + search,
      headers: {},
      body: "",
    }).sign();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl);
      xhr.withCredentials = true;
      xhr.setRequestHeader(
        "x-ebg-signature",
        signed.headers["x-ebg-signature"]
      );
      xhr.setRequestHeader("x-ebg-param", btoa(signed.headers["x-ebg-param"]));
      if (captchaCode) xhr.setRequestHeader("captcha-code", captchaCode);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = (e.loaded / e.total) * 100;
          if (PB_DEBUG)
            console.debug("[upload] progress", pct.toFixed(1) + "%");
          onProgress(pct, requestId);
        }
      };
      xhr.onreadystatechange = () => {
        if (PB_DEBUG)
          console.debug(
            "[upload] readyState",
            xhr.readyState,
            "status",
            xhr.status
          );
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const json = JSON.parse(xhr.response);
            console.log("[upload] success", json);
            console.groupEnd();
            resolve(json);
          } catch {
            console.error("[upload] invalid JSON");
            console.groupEnd();
            reject({ status: 200, message: "Invalid JSON" });
          }
        } else {
          let msg = "";
          try {
            msg = JSON.parse(xhr.response);
          } catch {
            msg = xhr.statusText;
          }
          console.error("[upload] error", xhr.status, msg);
          console.groupEnd();
          reject({ status: xhr.status, message: msg });
        }
      };
      xhr.onerror = () => {
        console.error("[upload] network error", xhr.status, xhr.statusText);
        console.groupEnd();
        reject({ status: xhr.status, message: xhr.statusText });
      };
      if (PB_DEBUG) console.info("[upload] POST", PB_ENV.API_URL);
      xhr.send(form);
    });
  };

  // redirect helper (image optional)
  window.pbBuildStudioRedirect = function (toolRoute, imageUrl, prompt) {
    const params = new URLSearchParams();
    if (imageUrl) params.set("imageUrl", imageUrl);
    if (prompt) params.set("transformationPrompt", prompt);
    const redirectTo = params.toString()
      ? `${toolRoute}?${params.toString()}`
      : toolRoute;
    const final = `${
      PB_ENV.CONSOLE_BASE
    }/choose-org?redirectTo=${encodeURIComponent(redirectTo)}`;
    if (PB_DEBUG) console.info("[redirect]", final);
    return final;
  };
})();

(() => {
  if (
    typeof window.pbGetRecaptchaToken !== "function" ||
    typeof window.pbDirectUpload !== "function" ||
    typeof window.pbBuildStudioRedirect !== "function"
  ) {
    console.error(
      "[integration] Core upload functions missing. Ensure CryptoJS + Core Upload load BEFORE this script."
    );
    return;
  }

  const PROGRESS_BLOCK = "[pb-indicator-block='upload-progress']";
  const PROGRESS_TEXT = "[pb-indicator='progress-text']";
  const showProgress = () => {
    const el = document.querySelector(PROGRESS_BLOCK);
    if (el) el.style.display = "flex";
  };
  const hideProgress = () => {
    const el = document.querySelector(PROGRESS_BLOCK);
    if (el) el.style.display = "none";
  };
  const setProgress = (p) => {
    const t = document.querySelector(PROGRESS_TEXT);
    if (t) t.textContent = `${Math.round(p)}%`;
  };
  const flashErrorInline = (msg) => {
    console.error("[integration] ", msg);
    const box = document.getElementById("uploadError");
    const txt = document.getElementById("uploadErrorText");
    if (box && txt) {
      txt.textContent = msg;
      box.style.display = "block";
    }
  };

  async function handleSubmit(detail) {
    console.group("[aiSearchSubmit]");
    console.log("detail:", detail);

    const tool = detail.tool || "ai-editor";
    const prompt = (detail.prompt || "").trim();
    const files = Array.isArray(detail.files) ? detail.files : [];
    const needs = !!detail.needsImage;

    if (!prompt) {
      flashErrorInline("Please enter a prompt.");
      console.groupEnd();
      return;
    }

    // Case 1: needs image but none provided
    const externalUrl = detail.externalImageUrl;

    if (needs && files.length === 0 && !externalUrl) {
      flashErrorInline("This prompt needs an image. Please upload one.");
      console.groupEnd();
      return;
    }

    // Case 2: external URL only
    if (externalUrl && files.length === 0) {
      const studioRoute = `/studio/${tool}`;
      const redirectURL = pbBuildStudioRedirect(studioRoute, externalUrl, prompt);
      console.log("[step] redirecting (external image url)", redirectURL);
      window.location.href = redirectURL;
      console.groupEnd();
      return;
    }

    // Case 3: have a file -> upload then redirect
    const file = files[0];
    if (!file) {
      flashErrorInline("No file selected.");
      console.groupEnd();
      return;
    }

    try {
      showProgress();
      setProgress(0);

      console.log("[step] get reCAPTCHA token");
      const captcha = await pbGetRecaptchaToken();
      if (!captcha) {
        throw new Error("reCAPTCHA token missing");
      }
      console.log("[ok] captcha");

      console.log("[step] upload file");
      const resp = await pbDirectUpload(file, 1, captcha, null, true, (pct) =>
        setProgress(pct)
      );
      if (!resp?.url) throw new Error("Upload succeeded but no URL returned");
      console.log("[ok] upload ->", resp.url);

      const studioRoute = `/studio/${tool}`;
      const redirectURL = pbBuildStudioRedirect(studioRoute, resp.url, prompt);
      console.log("[step] redirecting (with image)", redirectURL);
      window.location.href = redirectURL;
    } catch (err) {
      console.error("[fail]", err);
      flashErrorInline(err?.message || "Upload failed. Please try again.");
    } finally {
      hideProgress();
      console.groupEnd();
    }
  }

  window.addEventListener("aiSearchSubmit", (e) => {
    if (!e?.detail) {
      console.warn("[aiSearchSubmit] missing detail");
      return;
    }
    handleSubmit(e.detail);
  });
})();
