<script defer src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<script>
/* -----------------------------
   SIMPLE UI SCRIPTS (unchanged)
-------------------------------- */
// Pricing Switch Script
const toggleSwitches = document.querySelectorAll('.toggle-switch');
let isAnnually = true;
toggleSwitches.forEach(switchEl => {
  switchEl.classList.toggle('active', isAnnually);
});

// Range Slider Script
const slider = document.querySelector('.credit_range_wrap input');
const recommendation = document.querySelector('.plan_type');
const tooltip = document.querySelector('.range-tooltip');

const updateSliderUI = () => {
  if (!slider || !recommendation || !tooltip) return;

  const val = parseInt(slider.value);
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  const percent = ((val - min) / (max - min)) * 100;

  slider.style.background = `linear-gradient(to right, #7C3AED 0%, #7C3AED ${percent}%, #ddd ${percent}%, #ddd 100%)`;
  tooltip.textContent = (val === max) ? `${max}+` : val;

  const sliderWidth = slider.offsetWidth;
  const tooltipWidth = tooltip.offsetWidth;
  const thumbWidth = 24;
  const offset = (percent / 100) * (sliderWidth - thumbWidth) + (thumbWidth / 2) - (tooltipWidth / 2);
  tooltip.style.left = `${offset}px`;

  if (val <= 10) recommendation.innerHTML = 'Free plan';
  else if (val <= 50) recommendation.innerHTML = 'Lite plan';
  else if (val <= 200) recommendation.innerHTML = 'Pro plan';
  else recommendation.innerHTML = 'Enterprise plan';
};
if (slider) {
  slider.addEventListener('input', updateSliderUI);
  updateSliderUI();
}

// Pricing Swiper Slider Script
let pricingSwiper = null;
function initOrDestroySwiper() {
  const screenWidth = window.innerWidth;
  if (screenWidth >= 1440) {
    if (pricingSwiper) {
      pricingSwiper.destroy(true, true);
      pricingSwiper = null;
    }
  } else {
    if (!pricingSwiper && window.Swiper) {
      pricingSwiper = new Swiper("#pricingSwiper", {
        spaceBetween: 16,
        loop: false,
        touchStartPreventDefault: false,
        simulateTouch: false,
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        breakpoints: {
          0:   { slidesPerView: 1.15, centeredSlides: true, spaceBetween: 12 },
          480: { slidesPerView: 1.5,  centeredSlides: true },
          640: { slidesPerView: 2,    centeredSlides: true },
          768: { slidesPerView: 2.5 },
          992: { slidesPerView: 3 },
          1279:{ slidesPerView: 4 },
        },
      });
      pricingSwiper.slideTo(2, 500);
    }
  }
}
window.addEventListener("load", initOrDestroySwiper);
window.addEventListener("resize", initOrDestroySwiper);

// Apply Max Height Script
function setIndependentMinHeights() {
  const classGroups = [".pricing_subhead_wrap", ".pricing_plan_title"];
  classGroups.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;
    elements.forEach(el => el.style.minHeight = "0");
    const maxHeight = Math.max(...Array.from(elements).map(el => el.offsetHeight));
    elements.forEach(el => el.style.minHeight = `${maxHeight}px`);
  });
}
setIndependentMinHeights();
window.addEventListener("resize", setIndependentMinHeights);

// Onclick Toggle Sibling Script
function handlePricingToggle() {
  document.querySelectorAll(".pricing22_heading-row").forEach(heading => {
    heading.addEventListener("click", () => {
      const content = heading.nextElementSibling;
      if (window.innerWidth <= 767 && content?.classList.contains("pricing_category_content")) {
        content.style.display = (content.style.display === "block") ? "none" : "block";
      }
    });
  });
}
function resetInlineStylesOnDesktop() {
  if (window.innerWidth > 767) {
    document.querySelectorAll(".pricing_category_content").forEach(content => {
      content.style.display = "";
    });
  } else {
    document.querySelectorAll(".pricing_category_item").forEach((item, index) => {
      const content = item.querySelector(".pricing_category_content");
      if (content) content.style.display = (index === 0) ? "block" : "none";
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  handlePricingToggle();
  resetInlineStylesOnDesktop();
});
window.addEventListener("resize", resetInlineStylesOnDesktop);

/* -----------------------------
   PRICING (PLANS + ADDONS)
-------------------------------- */

// ---- UTM PARAMETER HANDLING ----
function getUTMParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    if (urlParams.has(param)) utmParams[param] = urlParams.get(param);
  });
  if (Object.keys(utmParams).length === 0) utmParams.utm_source = 'pixelbin';
  return utmParams;
}

function buildURLWithParams(baseUrl, paramsObj) {
  const url = new URL(baseUrl);
  const { redirectTo, ...otherParams } = paramsObj;
  Object.entries(otherParams).forEach(([key, value]) => url.searchParams.set(key, value));
  if (redirectTo) {
    const separator = url.search ? '&' : '?';
    return url.toString() + separator + `redirectTo=${redirectTo}`;
  }
  return url.toString();
}

// ---- CONFIG & CONSTANTS ----
const CURR_WITHOUT_LOWER_DENOM = ["JPY", "KRW"];
let skipForbidden = false;

// ---- UTILS ----
async function fetchIpAddress() {
  const ipRes = await fetch("https://api.ipify.org?format=json");
  const ipData = await ipRes.json();
  return ipData.ip;
}

function getApiBaseUrl() {
  const hostname = window.location.hostname;
  if (hostname.includes("webflow.io") || hostname.includes("pixelbinz0.de")) return "api.pixelbinz0.de";
  if (hostname.endsWith("pixelbin.io")) return "api.pixelbin.io";
  return "api.pixelbin.io";
}

function formatPriceCurrency(total, currency, inLowestDenomination = false, maxFractionDigits = 2) {
  if (total === null || total === undefined || isNaN(Number(total))) return "";
  total = typeof total === "string" ? parseFloat(total) : total;
  if (inLowestDenomination && !CURR_WITHOUT_LOWER_DENOM.includes(currency.toUpperCase())) total = total / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: maxFractionDigits,
  }).format(total);
}

// IMPORTANT: for big price, we want ONLY number in the span (no "/credit" inside),
// because "/credit" is a separate DOM node for styling.
function formatPriceOnly(numberValue, currencyCode, fractionDigits = 2) {
  if (numberValue === null || numberValue === undefined || isNaN(Number(numberValue))) return "";
  const n = typeof numberValue === "string" ? parseFloat(numberValue) : numberValue;
  return formatPriceCurrency(n, currencyCode, false, fractionDigits);
}

function getCreditsQty(planOrAddon) {
  if (!planOrAddon) return 0;

  const addonCredits = planOrAddon?.features?.credits?.quantity;
  if (addonCredits !== undefined) {
    const q = parseFloat(addonCredits);
    return isNaN(q) ? 0 : q;
  }

  const cf = planOrAddon?.features?.find?.((f) => f.name === "credits");
  const qty = cf ? parseFloat(cf.quantity) : 0;
  return isNaN(qty) ? 0 : qty;
}

function ensureCreditsLabelClean(targetEl) {
  if (!targetEl) return;
  const subtitle = targetEl.querySelector(".pricing_subtitle");
  if (!subtitle) return;
  subtitle.innerHTML = subtitle.innerHTML.replace(/credits\s*\/\s*credit/gi, "credits");
}

function setUnitToCredit(container) {
  if (!container) return;

  const candidates = [
    ".pricing_price .pricing_price_span",
    ".pricing_price .price-unit",
    ".pricing22_top-row-price .pricing_price_span",
    ".pricing22_top-row-price .price-unit",
    ".pricing22_top-row-price .time",
    ".pricing_price .time",
  ];

  for (const sel of candidates) {
    const el = container.querySelector(sel);
    if (el && (el.textContent || "").trim().startsWith("/")) {
      el.textContent = "/credit";
      return;
    }
  }
}

/* -----------------------------
   NEW: SHOW OFFER ONLY ON YEARLY
-------------------------------- */
function toggleAnnualOfferText(sectionEl, billing) {
  if (!sectionEl) return;

  // NOTE: ids must be unique. Prefer class .pro-pan-free-text.
  const offers = sectionEl.querySelectorAll("#offer-text, .pro-pan-free-text");
  offers.forEach((offer) => {
    offer.style.display = (billing === "yearly") ? "" : "none";
  });

  // Hide spacer on monthly too (optional, matches your HTML)
  const dummies = sectionEl.querySelectorAll(".dummy-text");
  dummies.forEach((d) => {
    d.style.display = (billing === "yearly") ? "" : "none";
  });
}

/* -----------------------------
   NEW: DYNAMIC FEATURE ROWS (monthly vs yearly)
   Add these in Webflow on only the rows that change:

   - Usage row (the "Upto ..." line):
     data-dyn-feature="pro-usage"
     data-dyn-feature="lite-usage" (if needed)

   - Rollover row (monthly only):
     data-dyn-feature="pro-rollover"
     data-dyn-feature="lite-rollover" (if needed)

-------------------------------- */
function setFeatureRowText(rowEl, text) {
  if (!rowEl) return;

  // Your rows are like: <div class="pricing20_feature"><div class="icon"></div><div>TEXT</div></div>
  const textDiv = rowEl.querySelector(":scope > div:last-child") || rowEl;
  textDiv.textContent = text;
}

function updatePlanDynamicFeatures(targetEl, planKey, billingType) {
  if (!targetEl || !planKey) return;

  const usageRow = targetEl.querySelector(`[data-dyn-feature="${planKey}-usage"]`);
  const rolloverRow = targetEl.querySelector(`[data-dyn-feature="${planKey}-rollover"]`);

  // Replace with your exact copy
  const copy = {
    pro: {
      yearlyUsage: "Upto 6000 image transformations or 2000 image generations or 300 video generations",
      monthlyUsage: "Upto 6500 image transformations or 160 image generations",
    },
    lite: {
      // If lite differs, set it here; otherwise keep same text for both.
      yearlyUsage: "",
      monthlyUsage: "",
    },
  };

  const cfg = copy[planKey];
  if (usageRow && cfg) {
    const t = (billingType === "yearly") ? cfg.yearlyUsage : cfg.monthlyUsage;
    if (t) setFeatureRowText(usageRow, t);
  }

  // show rollover only on monthly
  if (rolloverRow) {
    rolloverRow.style.display = (billingType === "monthly") ? "" : "none";
  }
}

/* -----------------------------
   NEW: PAYG TOTAL AMOUNT TEXT
-------------------------------- */
function setPaygTotalAmountText(rootContainer, addon) {
  if (!rootContainer || !addon) return;

  const totalEl =
    rootContainer.querySelector(".pricing_plan_subtitle") ||
    rootContainer.querySelector(".pricing22_top-row-price-subtitle");

  if (!totalEl) return;

  const total = parseFloat(addon.price);
  if (isNaN(total)) return;

  totalEl.textContent = `Total: ${formatPriceCurrency(total, addon.currencyCode, false, 2)}`;
}

// ---- FREE PLAN PRICE ----
function setFreePlanPrice(currencyCode) {
  const freePlanEl = Array.from(document.querySelectorAll(".pricing_plan_title"))
    .find((el) => el.textContent.trim().toLowerCase() === "free plan");

  if (freePlanEl) {
    const priceEl = freePlanEl.closest(".pricing22_top-row-content")
      ?.querySelector(".pricing22_top-row-price span, .pricing22_top-row-price");
    if (priceEl) priceEl.textContent = formatPriceCurrency(0, currencyCode, false, 0);
  }
}

function parseFeatures(features) {
  const map = {};
  (features || []).forEach((feature) => (map[feature.name] = feature));
  return map;
}

// ---- PADDLE INITIALIZATION ----
const initializePaddle = async () => {
  if (!window.Paddle) return;

  const hostname = window.location.hostname;
  let token = "live_66bd537ccea92df4128186a6ef5";

  if (hostname.includes("webflow.io") || hostname.includes("pixelbinz0.de")) {
    Paddle.Environment.set("sandbox");
    token = "test_8b6d6c0f76f361c5b332f9ef8d2";
  }

  Paddle.Initialize({ token, pwCustomer: {} });
};

// ---- LOADER HELPERS ----
function showLoaderAndHideCards() {
  document.querySelectorAll(".pricing20_plan").forEach((card) => card.classList.remove("visible"));
  document.querySelectorAll(".loader").forEach((loader) => (loader.style.display = "block"));
}

function hideLoaderAndShowCards() {
  document.querySelectorAll(".loader").forEach((loader) => (loader.style.display = "none"));
  document.querySelectorAll(".pricing20_plan").forEach((card) => card.classList.add("visible"));
}

function showLoaders(sectionEl, selectors) {
  selectors.forEach((sel) => {
    sectionEl.querySelectorAll(sel).forEach((el) => {
      if (!el.querySelector(".loader")) {
        const l = document.createElement("div");
        l.className = "loader";
        l.innerText = "Loading…";
        el.appendChild(l);
      }
    });
  });
}

function hideLoaders(sectionEl) {
  sectionEl.querySelectorAll(".loader").forEach((el) => el.remove());
}

// ---- PAGINATED FETCH ----
async function fetchPaginatedItems(endpoint, signature, xEbgParam) {
  const allItems = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const response = await fetch(
        `https://${getApiBaseUrl()}/service/panel/payment/v1.0/${endpoint}?custom=false&tag=pixelbin&pageNo=${currentPage}&pageSize=20`,
        {
          headers: { "x-ebg-param": xEbgParam, "x-ebg-signature": signature },
          method: "GET",
        }
      );
      const data = await response.json();
      if (Array.isArray(data.items)) allItems.push(...data.items);
      hasNextPage = data.page?.hasNext || false;
      currentPage++;
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error("Error fetching:", endpoint, err);
      hasNextPage = false;
    }
  }
  return allItems;
}

// ---- UNIFIED PADDLE PRICING ----
async function fetchPlansAddonsAndPrices() {
  const hostname = window.location.hostname;
  let PLANS_SIGNATURE =
    "v1:2114ced7c049c79cbefb4c7ba643de3e53ae5ae2d533b03a10b85777a7cf4c7e";
  let ADDONS_SIGNATURE =
    "v1:2b026ab52ba9c781ea45c9bd632bc8e8e7191772cf35003206cd3aa0aef27e8e";
  let X_EB_PARAM = "TWpBeU5UQTJNRE5VTVRFeE5EUTJXZz09";

  if (hostname.includes("webflow.io") || hostname.includes("pixelbinz0.de")) {
    PLANS_SIGNATURE =
      "v1:e3e9b7efd0cc90d2b58ed7a7c6e1c2a5a2ca3305e38d562e22db95bd626edaf1";
    ADDONS_SIGNATURE =
      "v1:bc78d713bc63b99c20e977e4801a4d19bd41842cf3c1f27da493158d918b13ba";
    X_EB_PARAM = "MjAyNTA2MjdUMTIyOTMxWg==";
  }

  const [plans, addons] = await Promise.all([
    fetchPaginatedItems("plans", PLANS_SIGNATURE, X_EB_PARAM),
    fetchPaginatedItems("addons", ADDONS_SIGNATURE, X_EB_PARAM),
  ]);

  const planItems = plans
    .filter((p) => !p.metadata?.isFreePlan && p.metadata?.paddlePriceId)
    .map((p) => ({ priceId: p.metadata.paddlePriceId, quantity: 1 }));

  const addonItems = addons
    .filter((a) => a.metadata?.paddlePriceId)
    .map((a) => ({ priceId: a.metadata.paddlePriceId, quantity: 1 }));

  const allPriceItems = [...planItems, ...addonItems];
  if (!allPriceItems.length) return { plans, addons };

  try {
    const ipAddress = await fetchIpAddress();
    const request = { items: allPriceItems, customerIpAddress: ipAddress };
    const result = await Paddle.PricePreview(request);

    const prices = result.data.details.lineItems;
    const currencyCode = result.data.currencyCode;

    setFreePlanPrice(currencyCode);

    const denominator = CURR_WITHOUT_LOWER_DENOM.includes(currencyCode.toUpperCase()) ? 1 : 100;

    const priceMap = {};
    prices.forEach((item) => {
      priceMap[item.price.id] = {
        price:
          item.price.billingCycle?.interval === "year"
            ? parseFloat(item.totals.total) / (denominator * 12) // monthly equivalent
            : parseFloat(item.totals.total) / denominator,
      };
    });

    plans.forEach((plan) => {
      if (plan.metadata?.paddlePriceId) {
        const priceInfo = priceMap[plan.metadata.paddlePriceId] || {};
        plan.price = priceInfo.price || plan.amount;
        plan.currencyCode = currencyCode || "USD";
      } else {
        plan.price = plan.amount;
        plan.currencyCode = currencyCode || "USD";
      }
    });

    addons.forEach((addon) => {
      if (addon.metadata?.paddlePriceId) {
        const priceInfo = priceMap[addon.metadata.paddlePriceId] || {};
        addon.price = priceInfo.price || addon.amount;
        addon.currencyCode = currencyCode || "USD";
      } else {
        addon.price = addon.amount;
        addon.currencyCode = currencyCode || "USD";
      }
    });

    return { plans, addons };
  } catch (error) {
    console.error("Paddle pricing error:", error);
    plans.forEach((plan) => { plan.price = plan.amount; plan.currencyCode = "USD"; });
    addons.forEach((addon) => { addon.price = addon.amount; addon.currencyCode = "USD"; });
    return { plans, addons };
  }
}

// ---- CREDIT INJECTION ----
function injectGlobalPlanCreditsBySuffix(plan, totalCredits, suffix) {
  if (!plan || !suffix) return;
  const mapping = plan.TRANSFORMATION_CREDITS_MAPPING || {};
  const features = plan.features || [];
  const forbidden = ["-proplan", "-liteplan", "storage-proplan"];

  Array.from(document.querySelectorAll("*"))
    .filter((el) =>
      Array.from(el.attributes).some((a) => {
        const name = a.name.toLowerCase();
        if (skipForbidden && forbidden.some((f) => name.endsWith(f))) return false;
        return name.endsWith(`-${suffix}`);
      })
    )
    .forEach((el) => {
      [...el.attributes]
        .filter((a) => {
          const name = a.name.toLowerCase();
          return (!skipForbidden && forbidden.some((f) => name.endsWith(f)) && name.endsWith(`-${suffix}`));
        })
        .forEach((attr) => {
          const key = attr.name
            .replace(new RegExp(`-${suffix}$`, "i"), "")
            .replace(/-/g, " ")
            .toUpperCase();

          if (key === "STORAGE") {
            const st = features.find((f) => f.name === "storage");
            if (st) el.textContent = `${parseFloat(st.quantity)} GB`;
            return;
          }

          const mkey = Object.keys(mapping).find((k) => k.toUpperCase() === key);
          if (mkey) {
            const per = mapping[mkey];
            const cnt = Math.floor(totalCredits / per);
            el.textContent = `${cnt} ${cnt === 1 ? "image" : "images"}`;
          }
        });
    });
}

function injectAddonCredits(container, mapping, totalCredits) {
  if (!mapping || !totalCredits) return;
  const elements = Array.from(container.querySelectorAll("*")).filter((el) =>
    Array.from(el.attributes).some((attr) => attr.name.endsWith("-addon"))
  );
  elements.forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.endsWith("-addon")) {
        const key = attr.name.replace("-addon", "").replace(/-/g, " ").toUpperCase();
        const matched = Object.keys(mapping).find((k) => k.toUpperCase() === key);
        if (matched) {
          const value = mapping[matched];
          const divided = Math.floor(totalCredits / value);
          el.textContent = `${divided} ${divided === 1 ? "image" : "images"}`;
        }
      }
    });
  });
}

/* -----------------------------
   RENDERING (price per credit -> 2 decimals)
-------------------------------- */
function renderPlanCard(targetEl, plan, billingType, suffix, priceSelector, monthlyPlan) {
  if (!targetEl) return;

  ensureCreditsLabelClean(targetEl);

  // link
  const link = targetEl.querySelector(".g_clickable_link");
  if (link) {
    const checkoutPath = `/settings/billing/checkout?itemId=${plan._id}&itemType=subscription`;
    const encoded = encodeURIComponent(checkoutPath);
    const consoleOrigin = "https://console.pixelbin.io";
    const utmParams = getUTMParams();
    const loginUrl = buildURLWithParams(`${consoleOrigin}/auth/login`, {
      ...utmParams,
      redirectToPixelbinPropertyFlow: 'false',
      redirectTo: encoded
    });
    link.setAttribute("href", loginUrl);
  }

  const monthlyEquivalentPrice = parseFloat(plan.price);
  const creditsTotal = getCreditsQty(plan);

  const creditsMonthlyEquivalent = billingType === "yearly"
    ? (creditsTotal / 12)
    : creditsTotal;

  const costPerCredit = (creditsMonthlyEquivalent > 0)
    ? (monthlyEquivalentPrice / creditsMonthlyEquivalent)
    : 0;

  // big price: 2 decimals
  const priceSpan = targetEl.querySelector(priceSelector);
  if (priceSpan) {
    priceSpan.textContent = formatPriceOnly(costPerCredit, plan.currencyCode, 2);
  }
  setUnitToCredit(targetEl);

  // subtitle
  const sub = targetEl.querySelector(".pricing_subtitle");
  const time = sub?.querySelector(".time");
  if (sub && time) {
    const qty = getCreditsQty(plan);
    const freq = billingType === "yearly" ? "/year" : "/month";
    sub.innerHTML = (qty > 0 ? `${qty} credits` : "") + `<span class="time">${freq}</span>`;
  }

  // billed text
  const ps = targetEl.querySelector(".pricing_plan_subtitle");
  if (ps) {
    ps.textContent =
      billingType === "yearly"
        ? `${formatPriceCurrency((monthlyEquivalentPrice * 12).toFixed(2), plan.currencyCode)} billed yearly`
        : `Billed monthly`;
  }

  // renews text
  const renewsElements = targetEl.querySelectorAll('[data-pricing="renews"]');
  renewsElements.forEach(renewsEl => {
    renewsEl.textContent = billingType === "yearly"
      ? "Auto-renews annually. Cancel anytime"
      : "Auto-renews monthly. Cancel anytime";
  });

  // original price: 2 decimals
  const orig = targetEl.querySelector(".pricing_price_original");
  if (orig) {
    if (billingType === "monthly") {
      orig.style.display = "none";
    } else {
      if (monthlyPlan && monthlyPlan.price) {
        const monthlyPrice = parseFloat(monthlyPlan.price);
        const monthlyCredits = getCreditsQty(monthlyPlan);
        const monthlyCPC = monthlyCredits > 0 ? (monthlyPrice / monthlyCredits) : 0;
        orig.textContent = `${formatPriceOnly(monthlyCPC, monthlyPlan.currencyCode, 2)}/credit`;
        orig.style.display = "block";
      } else {
        orig.style.display = "none";
      }
    }
  }

  // inject credits
  const total = parseInt(getCreditsQty(plan), 10) || 0;
  injectGlobalPlanCreditsBySuffix(plan, total, suffix);

  // dynamic feature rows (only those with data-dyn-feature)
  const planKey = suffix === "proplan" ? "pro" : (suffix === "liteplan" ? "lite" : "");
  updatePlanDynamicFeatures(targetEl, planKey, billingType);

  ensureCreditsLabelClean(targetEl);
}

function renderPlans(sectionEl, plans, billingType) {
  if (!sectionEl) return;

  const lite = sectionEl.querySelector("[lite-plan]");
  const pro = sectionEl.querySelector("[pro-plan]");
  const is22 = sectionEl.classList.contains("pricing22_component");
  const priceSel = is22 ? ".pricing22_top-row-price span" : ".pricing_price span";

  plans
    .filter((p) => p.interval === billingType)
    .forEach((plan) => {
      const n = (plan.name || "").toLowerCase();

      if (n.includes("lite")) {
        let monthlyPlan = null;
        if (billingType === "yearly") {
          monthlyPlan = plans.find(p => p.interval === "monthly" && (p.name || "").toLowerCase().includes("lite"));
        }
        renderPlanCard(lite, plan, billingType, "liteplan", priceSel, monthlyPlan);
      }

      if (n.includes("pro")) {
        let monthlyPlan = null;
        if (billingType === "yearly") {
          monthlyPlan = plans.find(p => p.interval === "monthly" && (p.name || "").toLowerCase().includes("pro"));
        }
        renderPlanCard(pro, plan, billingType, "proplan", priceSel, monthlyPlan);
      }
    });
}

// ---- ADDONS (PAY AS YOU GO) ----
function formatAddonName(addon) {
  return `${Math.round(getCreditsQty(addon))} credits`;
}

function updateAddonLinkHref(container, itemId) {
  const link = container.querySelector(".g_clickable_link");
  if (link) {
    const checkoutPath = `/settings/billing/checkout?itemId=${itemId}&itemType=addon`;
    const encoded = encodeURIComponent(checkoutPath);
    const consoleOrigin = "https://console.pixelbin.io";
    const utmParams = getUTMParams();
    const loginUrl = buildURLWithParams(`${consoleOrigin}/auth/login`, {
      ...utmParams,
      redirectToPixelbinPropertyFlow: 'false',
      redirectTo: encoded
    });
    link.setAttribute("href", loginUrl);
  }
}

function populateAllDropdowns(addons) {
  const dropdownLists = document.querySelectorAll(".pricing_dropdown.w-dropdown-list");

  dropdownLists.forEach((dropdownList) => {
    dropdownList.innerHTML = "";

    addons.forEach((addon) => {
      const displayName = formatAddonName(addon);

      const credits = getCreditsQty(addon) || parseFloat(addon?.metadata?.paddleCustomData?.credits || 0) || 0;
      const addonPrice = parseFloat(addon.price);
      const pricePerCredit = credits > 0 ? (addonPrice / credits) : 0;

      const anchor = document.createElement("a");
      anchor.href = "#";
      anchor.className = "pricing_dropdown_item w-inline-block";
      anchor.setAttribute("tabindex", "0");

      // dropdown item shows 2 decimals
      anchor.innerHTML = `
        <div>${displayName}</div>
        <div class="price_credit">${formatPriceOnly(pricePerCredit, addon.currencyCode, 2)}/credit</div>
      `;

      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const dropdownWrap = anchor.closest(".w-dropdown");

        const rootContainer =
          dropdownWrap.closest(".pricing20_plan") ||
          dropdownWrap.closest(".pricing22_component");

        const priceEl =
          rootContainer?.querySelector(".pricing_price span") ||
          rootContainer?.querySelector(".pricing22_top-row-price span");

        // big price: 2 decimals
        if (priceEl) priceEl.textContent = formatPriceOnly(pricePerCredit, addon.currencyCode, 2);
        setUnitToCredit(rootContainer);

        // total amount below price
        setPaygTotalAmountText(rootContainer, addon);

        const labelTarget = dropdownWrap.querySelector(
          ".pricing_dropdown_toggle .dropdown-value, .pricing_dropdown_toggle .break-text"
        );
        if (labelTarget) labelTarget.textContent = displayName;

        const totalCredits = credits;
        injectAddonCredits(rootContainer, addon.TRANSFORMATION_CREDITS_MAPPING, totalCredits);

        updateAddonLinkHref(rootContainer, addon._id);

        dropdownList.querySelectorAll(".pricing_dropdown_item").forEach(a => {
          a.classList.remove("is-active");
          a.setAttribute("aria-selected", "false");
        });
        anchor.classList.add("is-active");
        anchor.setAttribute("aria-selected", "true");

        dropdownWrap?.dispatchEvent(new CustomEvent("w-close"));
      });

      dropdownList.appendChild(anchor);
    });

    // Default selection: prefer 200 credits
    const dropdownWrap = dropdownList.closest(".w-dropdown");
    const defaultAddon =
      addons.find(a => (getCreditsQty(a) || 0) === 200) ||
      addons.find(a => /(^|\s)200\s*credits/i.test(a?.name || "")) ||
      addons[0];

    if (defaultAddon) {
      const credits = getCreditsQty(defaultAddon) || parseFloat(defaultAddon?.metadata?.paddleCustomData?.credits || 0) || 0;
      const addonPrice = parseFloat(defaultAddon.price);
      const pricePerCredit = credits > 0 ? (addonPrice / credits) : 0;

      const labelText = formatAddonName(defaultAddon);
      const labelTarget = dropdownWrap.querySelector(
        ".pricing_dropdown_toggle .dropdown-value, .pricing_dropdown_toggle .break-text"
      );
      if (labelTarget) labelTarget.textContent = labelText;

      const rootContainer =
        dropdownWrap.closest(".pricing20_plan") ||
        dropdownWrap.closest(".pricing22_component");

      const priceEl =
        rootContainer?.querySelector(".pricing_price span") ||
        rootContainer?.querySelector(".pricing22_top-row-price span");

      if (priceEl) priceEl.textContent = formatPriceOnly(pricePerCredit, defaultAddon.currencyCode, 2);
      setUnitToCredit(rootContainer);

      // total amount below price
      setPaygTotalAmountText(rootContainer, defaultAddon);

      if (rootContainer && defaultAddon.TRANSFORMATION_CREDITS_MAPPING) {
        injectAddonCredits(rootContainer, defaultAddon.TRANSFORMATION_CREDITS_MAPPING, credits);
      }
      updateAddonLinkHref(rootContainer, defaultAddon._id);

      const items = dropdownList.querySelectorAll(".pricing_dropdown_item");
      const activeItem = Array.from(items).find(a =>
        (a.textContent || "").toLowerCase().trim().startsWith("200 credits")
      ) || items[0];
      if (activeItem) {
        activeItem.classList.add("is-active");
        activeItem.setAttribute("aria-selected", "true");
      }
    }
  });
}

// ---- SWITCHER ----
function setupSwitcher(sectionSelector, plans) {
  const sec = document.querySelector(sectionSelector);
  if (!sec) return;

  const tog = sec.querySelector(".toggle-switch");
  if (!tog) return;

  let billing = "yearly";
  const annualImg = document.getElementById("annually");
  const annualImg2 = document.getElementById("annually2");

  function render() {
    showLoaders(sec, [
      ".pricing_price span",
      ".pricing22_top-row-price span",
      ".pricing_subtitle",
      ".pricing_plan_subtitle",
    ]);

    renderPlans(sec, plans, billing);

    // show offer only on yearly
    toggleAnnualOfferText(sec, billing);

    if (annualImg && annualImg2) {
      annualImg.style.display = billing === "yearly" ? "block" : "none";
      annualImg2.style.display = billing === "yearly" ? "block" : "none";
    }

    hideLoaders(sec);
  }

  render();

  tog.addEventListener("click", () => {
    skipForbidden = sec.matches(".pricing_contain");
    billing = billing === "yearly" ? "monthly" : "yearly";
    tog.classList.toggle("active");
    render();
  });
}

// ---- MASTER INIT ----
async function setupUnifiedPricingPage() {
  showLoaderAndHideCards();

  await initializePaddle();
  let { plans, addons } = await fetchPlansAddonsAndPrices();

  plans = plans
    .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
    .filter((plan) => plan?.metadata?.createdFromPaddle === true);

  addons.forEach((addon) => {
    addon.features = parseFeatures(addon?.features);
  });

  addons = addons
    .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
    .filter((addon) =>
      (getCreditsQty(addon) || 0) <= 1000 &&
      addon?.metadata?.createdFromPaddle === true
    );

  setupSwitcher(".pricing_contain", plans);
  setupSwitcher(".pricing22_component", plans);

  populateAllDropdowns(addons);

  hideLoaderAndShowCards();
}

// ---- ENTRYPOINT ----
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.Paddle) {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = async () => { await setupUnifiedPricingPage(); };
    document.head.appendChild(script);
  } else {
    await setupUnifiedPricingPage();
  }
});
</script>

<!--Hide Signup Link for Logged-in Users -->
<script>
async function handleSignupLinkVisibility() {
  const hostname = window.location.hostname;
  let baseApiUrl, ebgSignature, ebgParam;
  
  if (hostname.includes("webflow.io") || hostname.includes("pixelbinz0.de")) {
    baseApiUrl = "https://api.pixelbinz0.de";
    ebgSignature = "v1:afdecd809329f3827059d4a7c2e9aaf15a98cd46b2b818a3eecee29b64b06066";
    ebgParam = "MjAyNTA1MjhUMDk0MDA5Wg==";
  } else {
    baseApiUrl = "https://api.pixelbin.io";
    ebgSignature = "v1:54c02cba15001bd4ec8059bc1bcd9a2dfe59226eb9ba58b9dd8fa70fe76abc30";
    ebgParam = "MjAyNTA1MjhUMDkyOTMzWg==";
  }
  
  const URL = `${baseApiUrl}/service/panel/users/v1.0/session`;
  const headers = {
    accept: "application/json, text/plain, */*",
    "x-ebg-param": ebgParam,
    "x-ebg-signature": ebgSignature,
  };
  
  const signupLink = document.querySelector("#signup-link");
  
  if (!signupLink) return;
  
  // Initially hide the link while checking
  signupLink.style.display = "none";
  
  try {
    const res = await fetch(URL, { headers, method: "GET", credentials: "include" });
    
    // User is logged out - show signup link
    if (res.status === 401 || !res.ok) {
      signupLink.style.display = "inline";
      return;
    }
    
    const data = await res.json();
    const user = data?.session?.passport?.user;
    
    // Hide signup link if user is logged in, show if not
    signupLink.style.display = user ? "none" : "inline";
    
  } catch (e) {
    // On error, show the signup link
    signupLink.style.display = "inline";
  }
}

document.addEventListener("DOMContentLoaded", handleSignupLinkVisibility);
</script>
