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
  const val = parseInt(slider.value);
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  const percent = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #7C3AED 0%, #7C3AED ${percent}%, #ddd ${percent}%, #ddd 100%)`;
  // 👉 Show "250+" at the max
  tooltip.textContent = (val === max) ? `${max}+` : val;
  const sliderWidth = slider.offsetWidth;
  const tooltipWidth = tooltip.offsetWidth;
  const thumbWidth = 24;
  const offset = (percent / 100) * (sliderWidth - thumbWidth) + (thumbWidth / 2) - (tooltipWidth / 2);
  tooltip.style.left = `${offset}px`;
  // Plan recommendation logic
  if (val <= 10) {
    recommendation.innerHTML = 'Free plan';
  } else if (val <= 50) {
    recommendation.innerHTML = 'Lite plan';
  } else if (val <= 200) {
    recommendation.innerHTML = 'Pro plan';
  } else {
    recommendation.innerHTML = 'Enterprise plan';
  }
};
slider.addEventListener('input', updateSliderUI);
updateSliderUI(); // Run on load




// Pricing Swiper Slider Script
let pricingSwiper = null;
function initOrDestroySwiper() {
  const screenWidth = window.innerWidth;
  if (screenWidth >= 1440) {
    // Destroy swiper if it exists
    if (pricingSwiper) {
      pricingSwiper.destroy(true, true);
      pricingSwiper = null;
    }
  } else {
    // Initialize swiper if not already initialized
    if (!pricingSwiper) {
      pricingSwiper = new Swiper("#pricingSwiper", {
        spaceBetween: 16,
        loop: false,
        touchStartPreventDefault: false,
        simulateTouch: false,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        breakpoints: {
          0: {
            slidesPerView: 1.15,
            centeredSlides: true,
            spaceBetween: 12,
          },
          480: {
            slidesPerView: 1.5,
            centeredSlides: true,
          },
          640: {
            slidesPerView: 2,
            centeredSlides: true,
          },
          768: {
            slidesPerView: 2.5,
          },
          992: {
            slidesPerView: 3,
          },
        },
      });
      pricingSwiper.slideTo(2, 500);
    }
  }
}
// Run on load
window.addEventListener("load", initOrDestroySwiper);
// Run on resize
window.addEventListener("resize", initOrDestroySwiper);



// Apply Max Height Script
function setIndependentMinHeights() {
  const classGroups = [".pricing_subhead_wrap", ".pricing_plan_title"];
  classGroups.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;
    // Reset any previously set min-height
    elements.forEach(el => el.style.minHeight = "0");
    // Calculate max height for this group
    const maxHeight = Math.max(...Array.from(elements).map(el => el.offsetHeight));
    // Apply max height as min-height to maintain layout consistency
    elements.forEach(el => el.style.minHeight = `${maxHeight}px`);
  });
}
// Call on load
setIndependentMinHeights();
// Call on resize
window.addEventListener("resize", setIndependentMinHeights);



// Onclick Toggle Sibling Script
function handlePricingToggle() {
  document.querySelectorAll(".pricing22_heading-row").forEach(heading => {
    heading.addEventListener("click", () => {
      const content = heading.nextElementSibling;
      if (window.innerWidth <= 767 && content?.classList.contains("pricing_category_content")) {
        // Toggle on all, including the first
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
    // Ensure only the first item is open by default on mobile
    document.querySelectorAll(".pricing_category_item").forEach((item, index) => {
      const content = item.querySelector(".pricing_category_content");
      if (content) {
        content.style.display = (index === 0) ? "block" : "none";
      }
    });
  }
}
// Run on DOM load
document.addEventListener("DOMContentLoaded", () => {
  handlePricingToggle();
  resetInlineStylesOnDesktop();
});
// Re-check on resize
window.addEventListener("resize", resetInlineStylesOnDesktop);