// Loader helpers
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

async function fetchAddons() {
  const allAddons = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const APIresponse = await fetch(
        `https://${getApiBaseUrl()}/service/panel/payment/v1.0/addons?custom=false&tag=pixelbin&pageNo=${currentPage}&pageSize=20`,
        {
          headers: {
            "x-ebg-param": "TWpBeU5UQTJNRE5VTVRFeE5EUTJXZz09",
            "x-ebg-signature":
              "v1:2b026ab52ba9c781ea45c9bd632bc8e8e7191772cf35003206cd3aa0aef27e8e",
          },
          method: "GET",
        }
      );

      const data = await APIresponse.json();

      // Add the current page items to our collection
      if (data.items && Array.isArray(data.items)) {
        allAddons.push(...data.items);
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

  console.log({ allAddons });

  const request = {
    items: allAddons.reduce((acc, addon) => {
      return [...acc, { priceId: addon.metadata.paddlePriceId, quantity: 1 }];
    }, []),
    address: {
      countryCode: country,
    },
  };
  console.log({ request });

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
        price: parseFloat(item.totals.total) / denominator,
      };
    });

    allAddons.forEach((plan) => {
      const priceInfo = priceMap[plan.metadata?.paddlePriceId] || {};
      plan.price = priceInfo.price || plan.amount;
      plan.currencyCode = currencyCode || "USD";
    });
  } catch (err) {
    allAddons.forEach((addon) => {
      addon.price = addon.amount;
      addon.currencyCode = "USD";
    });
  }

  return allAddons;
}

function formatAddonName(name) {
  const match = name.match(/(\d+)\s*Credits/i);
  return match ? `${match[1]} Credits` : name;
}

function injectAddonCredits(container, mapping, totalCredits) {
  if (!mapping || !totalCredits) return;

  const elements = Array.from(container.querySelectorAll("*")).filter(el =>
    Array.from(el.attributes).some(attr => attr.name.endsWith("-addon"))
  );

  elements.forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.endsWith("-addon")) {
        const key = attr.name
          .replace("-addon", "")
          .replace(/-/g, " ")
          .toUpperCase();

        const matched = Object.keys(mapping).find(k => k.toUpperCase() === key);
        if (matched) {
          const value = mapping[matched];
          const divided = Math.floor(totalCredits / value);
          el.textContent = `${divided} ${divided === 1 ? "image" : "images"}`;
        }
      }
    });
  });
}

// ✅ New helper: only added function
function updateAddonLinkHref(container, itemId) {
  const link = container.querySelector(".g_clickable_link");
  if (link) {
    const checkoutPath = `/settings/billing/checkout?itemId=${itemId}&itemType=addon`;
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
}
function populateAllDropdowns(addons) {
  const dropdownLists = document.querySelectorAll(".pricing_dropdown.w-dropdown-list");
  dropdownLists.forEach((dropdownList) => {
    dropdownList.innerHTML = "";
    addons.forEach((addon) => {
      const displayName = formatAddonName(addon.name);
      const pricePerCredit = addon.price / (addon.metadata?.paddleCustomData?.credits || 1);
      const roundedPricePerCredit = pricePerCredit.toFixed(2);
      const finalRoundedPricePerCredit = formatPriceCurrency(roundedPricePerCredit, addon.currencyCode);
      const anchor = document.createElement("a");
      anchor.href = "#";
      anchor.className = "pricing_dropdown_item w-inline-block";
      anchor.setAttribute("data-price", addon.price);
      anchor.setAttribute("tabindex", "0");
      anchor.innerHTML = `
        <div>${displayName}</div>
        <div class="price_credit">${finalRoundedPricePerCredit}/credit</div>
      `;
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const dropdownWrap = anchor.closest(".w-dropdown");
        const rootContainer = dropdownWrap.closest(".pricing20_plan") || dropdownWrap.closest(".pricing22_component");
        const priceEl = rootContainer?.querySelector(".pricing_price span") ||
          dropdownWrap.closest(".pricing22_top-row-content")?.querySelector(".pricing22_top-row-price span");
        if (priceEl) priceEl.textContent = `$${Math.round(addon.price)}`;
        const selectedLabel = anchor.querySelector("div")?.textContent?.trim() || "";
        const labelTarget = dropdownWrap.querySelector(".pricing_dropdown_toggle .dropdown-value");
        if (labelTarget) labelTarget.textContent = selectedLabel;
        const creditMatch = addon.name.match(/(\d+)\s*Credits/i);
        const totalCredits = creditMatch ? parseInt(creditMatch[1]) : 0;
        injectAddonCredits(rootContainer, addon.TRANSFORMATION_CREDITS_MAPPING, totalCredits);
        // ✅ FIXED: update itemid in g_clickable_link
        updateAddonLinkHref(rootContainer, addon._id);
        const toggleBtn = dropdownWrap.querySelector(".w-dropdown-toggle");
        const dropdownList = dropdownWrap.querySelector(".w-dropdown-list");
        if (toggleBtn && dropdownList) {
          toggleBtn.setAttribute("aria-expanded", "false");
          dropdownWrap.classList.remove("w--open");
          toggleBtn.classList.remove("w--open");
          dropdownList.classList.remove("w--open");
        }
      });
      dropdownList.appendChild(anchor);
    });
    // Default selection per dropdown
    const dropdownWrap = dropdownList.closest(".w-dropdown");
    const firstAddon = addons[0];
    if (firstAddon) {
      const finalPrice = formatPriceCurrency(firstAddon.price, firstAddon.currencyCode);
      const defaultPrice = `${finalPrice}`;
      const labelText = formatAddonName(firstAddon.name);
      const labelTarget = dropdownWrap.querySelector(".pricing_dropdown_toggle .dropdown-value, .pricing_dropdown_toggle .break-text");
      if (labelTarget) labelTarget.textContent = labelText;
      const priceEl =
        dropdownWrap.closest(".pricing20_plan")?.querySelector(".pricing_price span") ||
        dropdownWrap.closest(".pricing22_top-row-content")?.querySelector(".pricing22_top-row-price span");
      if (priceEl) priceEl.textContent = defaultPrice;
      const creditMatch = firstAddon.name.match(/(\d+)\s*Credits/i);
      const totalCredits = creditMatch ? parseInt(creditMatch[1]) : 0;
      const creditContainer =
        dropdownWrap.closest(".pricing20_plan") ||
        dropdownWrap.closest(".pricing22_top-row-content");
      // ✅ Apply transformation credit injection
      if (creditContainer && firstAddon.TRANSFORMATION_CREDITS_MAPPING) {
        injectAddonCredits(creditContainer, firstAddon.TRANSFORMATION_CREDITS_MAPPING, totalCredits);
      }
      // ✅ Also update g_clickable_link with default itemid
      updateAddonLinkHref(creditContainer, firstAddon._id);
    }
  });
}
async function initializeAllDropdowns() {
  // Fetch all available add-ons
  const addons = await fetchAddons();
  if (addons.length === 0) return;
  // Sort: put the one with quantity "50.00" at the front
  addons.sort((a, b) => {
    const qa = parseFloat(a.features?.[0]?.quantity ?? 0);
    const qb = parseFloat(b.features?.[0]?.quantity ?? 0);
    return qa - qb;
  });
  // Populate all dropdowns in the newly-sorted order
  populateAllDropdowns(addons);
}

const initailizePricing = () => {
  initializePaddle().then(() => {
    // DOM ready: bind both layouts
    document.addEventListener("DOMContentLoaded", () => {
      setupSwitcher(".pricing_contain");
      setupSwitcher(".pricing22_component");
    });

    document.addEventListener("DOMContentLoaded", () => {
      initializeAllDropdowns().then(() => {
        const firstDropdown = document.querySelector(".pricing_dropdown.second");
        const firstItem = firstDropdown?.querySelector(".pricing_dropdown_item");
        if (firstItem) firstItem.click();
      });
    });
  });
};

loadScript("https://cdn.paddle.com/paddle/v2/paddle.js", initailizePricing);