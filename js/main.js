(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ——— Password gate ——— */
  const GATE_KEY = "bewo-prevenda-unlock";
  const GATE_PASS = "FINALMENTE";
  const gate = $("[data-gate]");
  const gateForm = $("[data-gate-form]");
  const gateInput = $("[data-gate-input]");
  const gateError = $("[data-gate-error]");

  const unlockGate = () => {
    document.body.classList.remove("is-locked");
    try {
      localStorage.setItem(GATE_KEY, "1");
    } catch (_) {}
  };

  const isUnlocked = () => {
    try {
      return localStorage.getItem(GATE_KEY) === "1";
    } catch (_) {
      return false;
    }
  };

  if (isUnlocked()) {
    unlockGate();
  } else {
    document.body.classList.add("is-locked");
    gateInput?.focus();
  }

  gateForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = (gateInput?.value || "").trim();
    if (value.toUpperCase() === GATE_PASS) {
      if (gateError) gateError.hidden = true;
      unlockGate();
      return;
    }
    if (gateError) gateError.hidden = false;
    if (gateInput) {
      gateInput.value = "";
      gateInput.focus();
    }
    if (window.gsap && gate) {
      gsap.fromTo(gate.querySelector(".gate__card"), { x: -8 }, { x: 0, duration: 0.35, ease: "elastic.out(1, 0.4)" });
    }
  });

  /* ——— UI: cart / carousel ——— */
  const cartEls = $$("[data-cart-count]");
  const toast = $("[data-toast]");
  let cartCount = 0;
  let toastTimer;

  const syncCart = () => cartEls.forEach((el) => (el.textContent = String(cartCount)));

  const showToast = () => {
    if (!toast) return;
    toast.hidden = false;
    if (window.gsap) {
      gsap.fromTo(
        toast,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      );
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (window.gsap) {
        gsap.to(toast, {
          y: 16,
          opacity: 0,
          duration: 0.25,
          onComplete: () => {
            toast.hidden = true;
          },
        });
      } else {
        toast.hidden = true;
      }
    }, 2200);
  };

  $$("[data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      cartCount += 1;
      syncCart();
      showToast();
      const original = btn.textContent;
      btn.textContent = "Adicionado";
      btn.disabled = true;
      if (window.gsap) {
        gsap.fromTo(btn, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
      }
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1400);
    });
  });

  /* ——— Buy gallery thumbs ——— */
  const initBuyGallery = () => {
    const gallery = $("[data-buy-gallery]");
    const featured = $("[data-buy-featured]");
    const thumbs = $$("[data-buy-thumb]", gallery || document);
    if (!gallery || !featured || !thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const img = thumb.querySelector("img");
        if (!img?.src) return;
        featured.src = img.currentSrc || img.src;
        thumbs.forEach((t) => {
          t.classList.toggle("is-active", t === thumb);
          if (t === thumb) t.setAttribute("aria-current", "true");
          else t.removeAttribute("aria-current");
        });
      });
    });
  };

  initBuyGallery();

  /* ——— Buy quantity → Yampi /r/TOKEN:qty ——— */
  const initBuyQuantity = () => {
    const wrap = $("[data-buy-qty]");
    const input = $("[data-buy-qty-input]");
    const minus = $("[data-buy-qty-minus]");
    const plus = $("[data-buy-qty-plus]");
    const priceEl = $("[data-buy-price]");
    const installmentEl = $("[data-buy-installment]");
    const ctas = $$("[data-buy-cta]");
    if (!wrap || !input) return;

    const UNIT = 69.9;
    const TOKEN = "8EO7JYYGRF8C";
    const MIN = 1;
    const MAX = 20;

    const money = (n) =>
      n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const clamp = (n) => Math.min(MAX, Math.max(MIN, n | 0 || MIN));

    const sync = () => {
      const qty = clamp(Number(input.value));
      input.value = String(qty);
      const total = UNIT * qty;
      const parcel = total / 3;
      if (priceEl) priceEl.textContent = money(total);
      if (installmentEl) {
        installmentEl.textContent = `3x de ${money(parcel)} sem juros`;
      }
      const href = `https://seguro.bewo.com.br/r/${TOKEN}:${qty}`;
      ctas.forEach((a) => {
        a.href = href;
      });
      $$('a[href*="seguro.bewo.com.br"]').forEach((a) => {
        if (a.hasAttribute("data-buy-cta")) return;
        if (/\/[br]\//.test(a.getAttribute("href") || "")) a.href = href;
      });
    };

    minus?.addEventListener("click", () => {
      input.value = String(clamp(Number(input.value) - 1));
      sync();
    });
    plus?.addEventListener("click", () => {
      input.value = String(clamp(Number(input.value) + 1));
      sync();
    });
    input.addEventListener("change", sync);
    input.addEventListener("input", sync);
    sync();
  };

  initBuyQuantity();

  const initInfiniteCarousel = () => {
    const track = $("[data-carousel-track]");
    const prev = $("[data-carousel-prev]");
    const next = $("[data-carousel-next]");
    const dotsWrap = $("[data-carousel-dots]");
    if (!track) return;

    const originals = $$(".shot-card", track).filter(
      (el) => !el.classList.contains("shot-card--clone")
    );
    if (originals.length < 2) return;

    const cloneSlide = (item, position) => {
      const clone = item.cloneNode(true);
      clone.classList.add("shot-card--clone");
      clone.setAttribute("aria-hidden", "true");
      const media = clone.querySelector(".shot-card__media");
      media?.setAttribute("tabindex", "-1");
      clone.querySelector("img")?.setAttribute("alt", "");
      if (position === "prepend") track.insertBefore(clone, track.firstChild);
      else track.appendChild(clone);
    };

    [...originals].reverse().forEach((item) => cloneSlide(item, "prepend"));
    originals.forEach((item) => cloneSlide(item, "append"));

    const getGap = () =>
      parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;

    const getStep = () => originals[0].getBoundingClientRect().width + getGap();

    const getSetWidth = () => getStep() * originals.length;

    let isJumping = false;
    let activeIndex = 0;

    const dots = originals.map((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "carousel__dot";
      btn.setAttribute("aria-label", `Ir para foto ${i + 1}`);
      btn.addEventListener("click", () => {
        track.scrollTo({ left: getSetWidth() + i * getStep(), behavior: "smooth" });
      });
      dotsWrap?.appendChild(btn);
      return btn;
    });

    const syncDots = () => {
      if (!dots.length) return;
      const step = getStep();
      if (!step) return;
      const setWidth = getSetWidth();
      const raw = Math.round((track.scrollLeft - setWidth) / step);
      const index = ((raw % originals.length) + originals.length) % originals.length;
      if (index === activeIndex) return;
      activeIndex = index;
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    };

    const normalizeScroll = () => {
      if (isJumping) return;
      const setWidth = getSetWidth();
      if (!setWidth) return;

      if (track.scrollLeft >= setWidth * 2 - 1) {
        isJumping = true;
        const prev = track.style.scrollBehavior;
        track.style.scrollBehavior = "auto";
        track.scrollLeft -= setWidth;
        track.style.scrollBehavior = prev;
        requestAnimationFrame(() => {
          isJumping = false;
          syncDots();
        });
      } else if (track.scrollLeft <= 1) {
        isJumping = true;
        const prev = track.style.scrollBehavior;
        track.style.scrollBehavior = "auto";
        track.scrollLeft += setWidth;
        track.style.scrollBehavior = prev;
        requestAnimationFrame(() => {
          isJumping = false;
          syncDots();
        });
      } else {
        syncDots();
      }
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        normalizeScroll();
      });
    };

    track.style.scrollBehavior = "auto";
    track.scrollLeft = getSetWidth();
    track.style.scrollBehavior = "";
    syncDots();
    dots[0]?.classList.add("is-active");

    window.addEventListener(
      "load",
      () => {
        track.style.scrollBehavior = "auto";
        track.scrollLeft = getSetWidth();
        track.style.scrollBehavior = "";
        syncDots();
      },
      { once: true }
    );

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", normalizeScroll);

    const scrollByCard = (dir) => {
      track.scrollBy({ left: dir * getStep(), behavior: "smooth" });
    };

    prev?.addEventListener("click", () => scrollByCard(-1));
    next?.addEventListener("click", () => scrollByCard(1));

    /* Lightbox: open on shot click (ignore drag-scroll) */
    let pointerX = 0;
    let pointerY = 0;
    track.addEventListener("pointerdown", (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
    });
    track.addEventListener("click", (e) => {
      const btn = e.target.closest(".shot-card__media");
      if (!btn || !track.contains(btn)) return;
      const moved =
        Math.abs(e.clientX - pointerX) > 8 || Math.abs(e.clientY - pointerY) > 8;
      if (moved) return;
      const img = btn.querySelector("img");
      if (!img?.src) return;
      openLightbox(img.src, img.getAttribute("alt") || "");
    });
  };

  const lightbox = $("[data-lightbox]");
  const lightboxImg = $("[data-lightbox-img]");
  let lightboxLastFocus = null;

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("is-lightbox-open");
    lightboxLastFocus?.focus?.();
  };

  const openLightbox = (src, alt) => {
    if (!lightbox || !lightboxImg) return;
    lightboxLastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.hidden = false;
    document.body.classList.add("is-lightbox-open");
    $("[data-lightbox-close].lightbox__close")?.focus();
  };

  $$("[data-lightbox-close]").forEach((el) => {
    el.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  initInfiniteCarousel();

  /* ——— Hero banner carousel ——— */
  const initHeroCarousel = () => {
    const root = $("[data-hero-carousel]");
    if (!root) return;

    const slides = $$("[data-hero-slide]", root);
    const dotsWrap = $("[data-hero-dots]", root);
    const prev = $("[data-hero-prev]", root);
    const next = $("[data-hero-next]", root);
    if (slides.length < 2) return;

    let index = 0;
    let timer;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dots = slides.map((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hero__dot";
      btn.setAttribute("aria-label", `Ir para slide ${i + 1}`);
      btn.addEventListener("click", () => goTo(i));
      dotsWrap?.appendChild(btn);
      return btn;
    });

    const render = () => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
      });
    };

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      render();
      restart();
    };

    const stop = () => clearInterval(timer);
    const restart = () => {
      stop();
      if (reduceMotion) return;
      timer = setInterval(() => goTo(index + 1), 5200);
    };

    prev?.addEventListener("click", () => goTo(index - 1));
    next?.addEventListener("click", () => goTo(index + 1));

    const buySection = $("#comprar");
    $$(".hero__slide-link", root).forEach((link) => {
      link.addEventListener("click", (e) => {
        if (!buySection) return;
        e.preventDefault();
        buySection.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", "#comprar");
      });
    });

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", restart);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", restart);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) restart();
          else stop();
        },
        { threshold: 0.2 }
      );
      io.observe(root);
    }

    let touchX = 0;
    root.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].clientX;
        stop();
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
        else restart();
      },
      { passive: true }
    );

    render();
    restart();
  };

  initHeroCarousel();

  /* ——— Light reveal (sem ScrollTrigger — evita jank no scroll) ——— */
  const initAnimations = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const heroViewport = $(".hero__viewport");
    if (heroViewport && window.gsap) {
      gsap.from(heroViewport, {
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
      });
    }

    if (!("IntersectionObserver" in window)) return;

    const targets = $$(".section-head, .buy, .bento__cell, .faq__list details, .site-footer");
    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity 0.45s ease, transform 0.45s ease";
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.style.opacity = "1";
          el.style.transform = "none";
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach((el) => io.observe(el));
  };

  if (document.readyState === "complete") {
    initAnimations();
  } else {
    window.addEventListener("load", initAnimations, { once: true });
  }
})();
