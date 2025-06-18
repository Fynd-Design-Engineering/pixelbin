function loadScript(url, callback) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  script.onload = function () {
    if (callback) callback();
  };
  document.head.appendChild(script);
}

const initializePaddle = async () => {
  Paddle.Initialize({
    token: "live_66bd537ccea92df4128186a6ef5", // replace with a client-side token
    pwCustomer: {}
  });
};

//Fetch Plans Script
let skipForbidden = false; // control whether to skip forbidden attributes on click

//Plan Script
function getApiBaseUrl() {
  const hostname = window.location.hostname;
  if (hostname.includes("webflow.io") || hostname.includes("pixelbinz0.de")) {
    return "api.pixelbinz0.de";
  } else if (hostname.endsWith("pixelbin.io")) {
    return "api.pixelbin.io";
  } else {
    return "api.pixelbin.io";
  }
}

async function fetchPlans() {
  const allPlans = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const APIresponse = await fetch(
        `https://${getApiBaseUrl()}/service/panel/payment/v1.0/plans?custom=false&tag=pixelbin&pageNo=${currentPage}&pageSize=20`,
        {
          headers: {
            "x-ebg-param": "TWpBeU5UQTJNRE5VTVRFeE5EUTJXZz09",
            "x-ebg-signature":
              "v1:2114ced7c049c79cbefb4c7ba643de3e53ae5ae2d533b03a10b85777a7cf4c7e",
          },
          method: "GET",
        }
      );

      const data = await APIresponse.json();

      // Add the current page items to our collection
      if (data.items && Array.isArray(data.items)) {
        allPlans.push(...data.items);
      }

      // Check if there are more pages
      hasNextPage = data.page?.hasNext || false;
      currentPage++;

      // Optional: Add a small delay to avoid hammering the API
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      console.error("Error fetching plans:", err);
      hasNextPage = false; // Stop on error
    }
  }

  const request = {
    items: allPlans.reduce((acc, plan) => {
      if (!plan.metadata.isFreePlan) {
        return [...acc, { priceId: plan.metadata.paddlePriceId, quantity: 1 }];
      }
      return acc;
    }, []),
    address: {
      countryCode: country,
    },
  };

  try {
    const result = await Paddle.PricePreview(request);
    const prices = result.data.details.lineItems;
    const currencyCode = result.data.currencyCode;

    const priceMap = {};
    const denominator = CURR_WITHOUT_LOWER_DENOM.includes(
      currencyCode.toUpperCase()
    )
      ? 1
      : 100;

    prices.forEach((item) => {
      priceMap[item.price.id] = {
        price:
          item.price.billingCycle?.interval === "year"
            ? parseFloat(item.totals.total) / (denominator * 12)
            : parseFloat(item.totals.total) / denominator,
      };
    });

    allPlans.forEach((plan) => {
      const priceInfo = priceMap[plan.metadata?.paddlePriceId] || {};
      plan.price = priceInfo.price || plan.amount;
      plan.currencyCode = currencyCode || "USD";
    });
  } catch (err) {
    allPlans.forEach((plan) => {
      plan.price = plan.amount;
      plan.currencyCode = "USD";
    });
  }

  return allPlans;
}

const formatPriceCurrency = (
  total,
  currency,
  inLowestDenomination = false,
  maxFractionDigits = 2,
) => {
  if (!total) return "";
  total = typeof total === "string" ? parseFloat(total) : total;
  if (inLowestDenomination && !CURR_WITHOUT_LOWER_DENOM.includes(currency.toUpperCase()))
    total = total / 100; // convert to higher denomination
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: maxFractionDigits,
  }).format(total);
};

// 3) Loader helpers
function showLoaders(sectionEl, selectors) {
  selectors.forEach(sel => {
    sectionEl.querySelectorAll(sel).forEach(el => {
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
  sectionEl.querySelectorAll(".loader").forEach(el => el.remove());
}

// 4) Credit-mapping helper
//    Skips attributes ending with -proplan, -liteplan, storage-proplan when skipForbidden=true
function injectGlobalPlanCreditsBySuffix(plan, totalCredits, suffix) {
  if (!plan || !suffix) return;
  const mapping = plan.TRANSFORMATION_CREDITS_MAPPING || {};
  const features = plan.features || [];
  const forbidden = ["-proplan", "-liteplan", "storage-proplan"];
  Array.from(document.querySelectorAll("*")).
    filter(el => Array.from(el.attributes)
      .some(a => {
        const name = a.name.toLowerCase();
        if (skipForbidden && forbidden.some(f => name.endsWith(f))) return false;
        return name.endsWith(`-${suffix}`);
      })).
    forEach(el => {
      [...el.attributes]
        .filter(a => {
          const name = a.name.toLowerCase();
          return !(skipForbidden && forbidden.some(f => name.endsWith(f)))
            && name.endsWith(`-${suffix}`);
        })
        .forEach(attr => {
          const key = attr.name
            .replace(new RegExp(`-${suffix}$`, "i"), "")
            .replace(/-/g, " ").toUpperCase();
          if (key === "STORAGE") {
            const st = features.find(f => f.name === "storage");
            if (st) el.textContent = `${parseFloat(st.quantity)} GB`;
            return;
          }
          const mkey = Object.keys(mapping)
            .find(k => k.toUpperCase() === key);
          if (mkey) {
            const per = mapping[mkey];
            const cnt = Math.floor(totalCredits / per);
            el.textContent = `${cnt} ${cnt === 1 ? "image" : "images"}`;
          }
        });
    });
}

// 5) Single-card renderer
function renderPlanCard(targetEl, plan, billingType, suffix, priceSelector, monthlyPlan) {
  console.log("plan", plan)
  console.log("monthlyPlan", monthlyPlan)
  if (!targetEl) return;

  const link = targetEl.querySelector(".g_clickable_link");
  if (link) {
    const checkoutPath = `/settings/billing/checkout?itemId=${plan._id}&itemType=subscription`;
    const encoded = encodeURIComponent(checkoutPath);

    // ← include full protocol+host here!
    const consoleOrigin = 'https://console.pixelbin.io';
    const loginUrl =
      `${consoleOrigin}/auth/login` +
      `?utm_source=pixelbin` +
      `&redirectToPixelbinPropertyFlow=false` +
      `&redirectTo=${encoded}`;

    link.setAttribute("href", loginUrl);
  }

  // — price
  const raw = parseFloat(plan.price);
  const amt = raw;

  // — price span (monthly)
  const priceSpan = targetEl.querySelector(priceSelector);
  if (priceSpan) {
    priceSpan.textContent = formatPriceCurrency(amt.toFixed(2), plan.currencyCode);
  }

  // — credits + freq (unchanged)
  const sub = targetEl.querySelector(".pricing_subtitle");
  const time = sub?.querySelector(".time");
  if (sub && time) {
    const cf = plan.features.find(f => f.name === "credits");
    const qty = cf ? parseFloat(cf.quantity) : 0;
    const freq = billingType === "yearly" ? "/year" : "/month";
    sub.innerHTML = (qty > 0 ? `${qty} credits` : "") + `<span class="time">${freq}</span>`;
  }

  // — billed-text uses the same exact formatter for the annual total
  const ps = targetEl.querySelector(".pricing_plan_subtitle");
  if (ps) {
    ps.textContent = billingType === "yearly"
      ? `${formatPriceCurrency((amt * 12).toFixed(2), plan.currencyCode)} billed yearly`
      : `Billed monthly`;
  }

  // — original price
  const orig = targetEl.querySelector(".pricing_price_original");
  if (orig) {
    if (billingType === "monthly") {
      orig.style.display = "none";
    } else {
      const finalPrice = formatPriceCurrency(monthlyPlan.price, monthlyPlan.currencyCode)
      if (finalPrice) orig.textContent = `${finalPrice}`;
      orig.style.display = "block";
    }
  }

  // — inject credits
  const cf2 = plan.features.find(f => f.name === "credits");
  const total = cf2 ? parseInt(cf2.quantity, 10) : 0;
  injectGlobalPlanCreditsBySuffix(plan, total, suffix);
}

// 6) Unified pricing updater
function updatePricing(sectionEl, plans, billingType) {
  hideLoaders(sectionEl);
  const lite = sectionEl.querySelector("[lite-plan]");
  const pro = sectionEl.querySelector("[pro-plan]");
  const is22 = sectionEl.classList.contains("pricing22_component");
  const priceSel = is22
    ? ".pricing22_top-row-price span"
    : ".pricing_price span";

  plans
    .filter(p => p.interval === billingType)
    .forEach(plan => {
      const n = plan.name.toLowerCase();
      if (n.includes("lite")) {
        let monthlyPlan = [];
        if (billingType === "yearly") {
          monthlyPlan = plans
            .filter(p => p.interval === "monthly")
            .filter(plan => plan.name.toLowerCase().includes("lite"))
        }
        renderPlanCard(lite, plan, billingType, "liteplan", priceSel, monthlyPlan?.[0]);
        console.log("monthlyPlan 1", monthlyPlan);
      } else if (n.includes("pro")) {
        let monthlyPlan = [];
        if (billingType === "yearly") {
          monthlyPlan = plans
            .filter(p => p.interval === "monthly")
            .filter(plan => plan.name.toLowerCase().includes("pro"))
        }
        renderPlanCard(pro, plan, billingType, "proplan", priceSel, monthlyPlan?.[0]);
        console.log("monthlyPlan 2", monthlyPlan);
      }
    });
}

// 7) Switcher wiring
function setupSwitcher(sectionSelector) {
  const sec = document.querySelector(sectionSelector);
  if (!sec) return;
  const tog = sec.querySelector(".toggle-switch");
  if (!tog) return;

  let billing = "yearly";
  function render(plans) {
    showLoaders(sec, [
      ".pricing_price span",
      ".pricing22_top-row-price span",
      ".pricing_subtitle",
      ".pricing_plan_subtitle"
    ]);
    updatePricing(sec, plans, billing);
  }

  fetchPlans().then(plans => {
    console.log("plans => ", plans)
    render(plans); // initial load uses skipForbidden=false
    tog.addEventListener("click", () => {
      skipForbidden = sec.matches(".pricing_contain");
      billing = billing === "yearly" ? "monthly" : "yearly";
      tog.classList.toggle("active");
      render(plans);
    });
  });
}