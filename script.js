const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const introScreen = document.querySelector("#intro-screen");
const introEnter = document.querySelector("#intro-enter");
const heroSection = document.querySelector("#hero");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function closeIntro(options = {}) {
  if (!introScreen) {
    return;
  }

  const { scrollToPortfolio = false } = options;

  introScreen.classList.add("is-hidden");
  document.body.classList.remove("intro-active");

  try {
    sessionStorage.setItem("portfolioIntroSeen", "true");
  } catch (error) {
    // Ignore storage issues and continue with the page.
  }

  if (scrollToPortfolio && heroSection) {
    window.requestAnimationFrame(() => {
      heroSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

if (introScreen) {
  let introSeen = false;

  try {
    introSeen = sessionStorage.getItem("portfolioIntroSeen") === "true";
  } catch (error) {
    introSeen = false;
  }

  if (prefersReducedMotion || introSeen) {
    closeIntro();
  }

  if (introEnter) {
    introEnter.addEventListener("click", () => {
      closeIntro({ scrollToPortfolio: true });
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === "Escape" || event.key === " ") {
      closeIntro();
    }
  });
}

if (menuToggle && siteNav) {
  // Small mobile-nav helper for better usability on narrow screens.
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll("[data-cert-carousel]").forEach((carousel) => {
  const viewport = carousel.querySelector(".certification-carousel__viewport");
  const track = carousel.querySelector("[data-cert-track]");
  const cards = Array.from(track?.children ?? []);
  const prevButton = carousel.querySelector("[data-cert-prev]");
  const nextButton = carousel.querySelector("[data-cert-next]");
  const dotsContainer = carousel.querySelector("[data-cert-dots]");

  if (!viewport || !track || !cards.length) {
    return;
  }

  let pageIndex = 0;
  let pages = [];
  let slidesPerView = 1;
  let touchStartX = 0;
  let touchDeltaX = 0;

  const getSlidesPerView = () => 1;

  const buildPages = () => {
    slidesPerView = getSlidesPerView();
    carousel.style.setProperty("--certificates-per-view", String(slidesPerView));

    pages = [];

    for (let start = 0; start < cards.length; start += slidesPerView) {
      pages.push(start);
    }

    pageIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  };

  const renderDots = () => {
    if (!dotsContainer) {
      return;
    }

    dotsContainer.replaceChildren();

    pages.forEach((_, currentPage) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "certification-carousel__dot";
      dot.setAttribute("aria-label", `Go to certificate page ${currentPage + 1}`);
      dot.classList.toggle("is-active", currentPage === pageIndex);
      dot.addEventListener("click", () => {
        pageIndex = currentPage;
        renderCarousel();
      });
      dotsContainer.append(dot);
    });
  };

  const renderCarousel = () => {
    const offset = pageIndex * viewport.clientWidth;
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    if (prevButton) {
      prevButton.disabled = pageIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = pageIndex >= pages.length - 1;
    }

    if (dotsContainer) {
      Array.from(dotsContainer.children).forEach((dot, currentPage) => {
        dot.classList.toggle("is-active", currentPage === pageIndex);
      });
    }
  };

  const syncCarousel = () => {
    buildPages();
    renderDots();
    renderCarousel();
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (pageIndex === 0) {
        return;
      }

      pageIndex -= 1;
      renderCarousel();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (pageIndex >= pages.length - 1) {
        return;
      }

      pageIndex += 1;
      renderCarousel();
    });
  }

  carousel.tabIndex = 0;

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" && pageIndex > 0) {
      event.preventDefault();
      pageIndex -= 1;
      renderCarousel();
    }

    if (event.key === "ArrowRight" && pageIndex < pages.length - 1) {
      event.preventDefault();
      pageIndex += 1;
      renderCarousel();
    }
  });

  carousel.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchDeltaX = 0;
  }, { passive: true });

  carousel.addEventListener("touchmove", (event) => {
    touchDeltaX = event.changedTouches[0].clientX - touchStartX;
  }, { passive: true });

  carousel.addEventListener("touchend", () => {
    if (Math.abs(touchDeltaX) < 48) {
      return;
    }

    if (touchDeltaX < 0 && pageIndex < pages.length - 1) {
      pageIndex += 1;
      renderCarousel();
      return;
    }

    if (touchDeltaX > 0 && pageIndex > 0) {
      pageIndex -= 1;
      renderCarousel();
    }
  });

  window.addEventListener("resize", syncCarousel);
  syncCarousel();
});

document.querySelectorAll("[data-slider]").forEach((slider) => {
  const slides = Array.from(slider.querySelectorAll("[data-slide]"));
  const prevButton = slider.querySelector("[data-slider-prev]");
  const nextButton = slider.querySelector("[data-slider-next]");
  const status = slider.querySelector("[data-slider-status]");
  const isLooping = slider.hasAttribute("data-slider-loop");
  const supportsSwipe = slider.hasAttribute("data-slider-swipe");

  if (!slides.length) {
    return;
  }

  let index = 0;
  let touchStartX = 0;
  let touchDeltaX = 0;

  const goToSlide = (nextIndex) => {
    if (!slides.length) {
      return;
    }

    if (isLooping) {
      index = (nextIndex + slides.length) % slides.length;
    } else {
      index = Math.max(0, Math.min(nextIndex, slides.length - 1));
    }

    renderSlider();
  };

  const renderSlider = () => {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === index);
    });

    if (status) {
      status.textContent = `${index + 1} / ${slides.length}`;
    }

    if (prevButton) {
      prevButton.disabled = slides.length <= 1 || (!isLooping && index === 0);
    }

    if (nextButton) {
      nextButton.disabled = slides.length <= 1 || (!isLooping && index === slides.length - 1);
    }
  };

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      goToSlide(index - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      goToSlide(index + 1);
    });
  }

  if (supportsSwipe) {
    slider.tabIndex = 0;

    slider.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchDeltaX = 0;
    }, { passive: true });

    slider.addEventListener("touchmove", (event) => {
      touchDeltaX = event.changedTouches[0].clientX - touchStartX;
    }, { passive: true });

    slider.addEventListener("touchend", () => {
      if (Math.abs(touchDeltaX) < 48) {
        return;
      }

      if (touchDeltaX < 0) {
        goToSlide(index + 1);
        return;
      }

      goToSlide(index - 1);
    });

    slider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(index - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(index + 1);
      }
    });
  }

  renderSlider();
});

/* ---------------------------------------------------------------------------
 * UI polish: scroll reveal, scroll-spy nav, progress bar, header state,
 * stat counters, role rotator, card glow, and back-to-top.
 * ------------------------------------------------------------------------- */

// 1. Reveal-on-scroll using IntersectionObserver
const revealEls = document.querySelectorAll("[data-reveal]");

if (revealEls.length) {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }
}

// 2. Scroll-spy: highlight the nav link for the section in view
const sections = Array.from(document.querySelectorAll("main section[id]"));
const navLinkMap = new Map();
navLinks.forEach((link) => {
  const id = link.getAttribute("href")?.replace("#", "");
  if (id) {
    navLinkMap.set(id, link);
  }
});

if (sections.length && "IntersectionObserver" in window) {
  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = navLinkMap.get(entry.target.id);
          if (!link) {
            return;
          }
          navLinks.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => spyObserver.observe(section));
}

// 3. Scroll progress bar + sticky header state + back-to-top visibility
const progressBar = document.querySelector("#scroll-progress-bar");
const siteHeader = document.querySelector("#site-header");
const backToTop = document.querySelector("#back-to-top");
let scrollTicking = false;

const updateOnScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  if (siteHeader) {
    siteHeader.classList.toggle("is-scrolled", scrollTop > 12);
  }

  if (backToTop) {
    backToTop.classList.toggle("is-visible", scrollTop > 600);
  }

  scrollTicking = false;
};

window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateOnScroll);
      scrollTicking = true;
    }
  },
  { passive: true }
);

updateOnScroll();

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

// 4. Animated stat counters in the hero
const counters = document.querySelectorAll("[data-count-target]");

const runCounter = (el) => {
  const target = Number(el.getAttribute("data-count-target")) || 0;

  if (prefersReducedMotion) {
    el.textContent = String(target);
    return;
  }

  const duration = 1200;
  let startTime = null;

  const step = (timestamp) => {
    if (startTime === null) {
      startTime = timestamp;
    }
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(eased * target));

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

if (counters.length && "IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => counterObserver.observe(el));
} else {
  counters.forEach((el) => {
    el.textContent = el.getAttribute("data-count-target") || el.textContent;
  });
}

// 5. Rotating hero role words
const rotateEl = document.querySelector("#hero-rotate");

if (rotateEl && !prefersReducedMotion) {
  const words = [
    "clean web interfaces",
    "responsive layouts",
    "smooth user experiences",
    "modern front-ends",
  ];
  let wordIndex = 0;

  setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    rotateEl.style.opacity = "0";
    rotateEl.style.transform = "translateY(6px)";
    rotateEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    setTimeout(() => {
      rotateEl.textContent = words[wordIndex];
      rotateEl.style.opacity = "1";
      rotateEl.style.transform = "translateY(0)";
    }, 300);
  }, 2600);
}
