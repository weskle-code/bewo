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
      sessionStorage.setItem(GATE_KEY, "1");
    } catch (_) {}
  };

  const isUnlocked = () => {
    try {
      return sessionStorage.getItem(GATE_KEY) === "1";
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

      if (track.scrollLeft >= setWidth * 2 - 1) {
        isJumping = true;
        track.style.scrollBehavior = "auto";
        track.scrollLeft -= setWidth;
        track.style.scrollBehavior = "";
        requestAnimationFrame(() => {
          isJumping = false;
          syncDots();
        });
      } else if (track.scrollLeft <= 1) {
        isJumping = true;
        track.style.scrollBehavior = "auto";
        track.scrollLeft += setWidth;
        track.style.scrollBehavior = "";
        requestAnimationFrame(() => {
          isJumping = false;
          syncDots();
        });
      } else {
        syncDots();
      }
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

    track.addEventListener("scroll", normalizeScroll, { passive: true });
    track.addEventListener("scrollend", normalizeScroll);

    const scrollByCard = (dir) => {
      track.scrollBy({ left: dir * getStep(), behavior: "smooth" });
    };

    prev?.addEventListener("click", () => scrollByCard(-1));
    next?.addEventListener("click", () => scrollByCard(1));
  };

  initInfiniteCarousel();

  const initAnimations = () => {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ease = "power3.out";
    const scrollFrom = (targets, vars) =>
      gsap.from(targets, {
        immediateRender: false,
        ...vars,
      });

  /* Hero entrance */
  const hero = $("#topo");
  if (hero) {
    const heroTl = gsap.timeline({ defaults: { ease } });

    heroTl
      .from(".hero__watermark img", {
        scale: 1.18,
        opacity: 0,
        duration: 1.2,
      })
      .from(
        ".hero__media img",
        {
          y: 80,
          opacity: 0,
          scale: 0.92,
          duration: 1.05,
        },
        "-=0.75"
      )
      .from(
        ".hero__cta .eyebrow",
        { y: 24, opacity: 0, duration: 0.45 },
        "-=0.45"
      )
      .from(".hero__cta h1", { y: 36, opacity: 0, duration: 0.55 }, "-=0.28")
      .from(".hero__lead", { y: 24, opacity: 0, duration: 0.45 }, "-=0.3")
      .from(".hero__cta .btn", { y: 20, opacity: 0, duration: 0.45 }, "-=0.25");

    /* Continuous hero loops */
    gsap.to(".hero__watermark img", {
      scale: 1.04,
      duration: 5.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    /* Parallax on watermark only */
    gsap.to(".hero__watermark", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  /* Section heads */
  $$(".section-head, .faq__intro").forEach((el) => {
    scrollFrom(el.children, {
      y: 36,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });

  /* Gallery cards */
  scrollFrom(".shot-card:not(.shot-card--clone)", {
    y: 48,
    opacity: 0,
    scale: 0.96,
    duration: 0.65,
    stagger: 0.1,
    ease,
    scrollTrigger: {
      trigger: ".gallery .carousel",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });

  /* Buy block */
  if ($(".buy")) {
    scrollFrom(".buy__media", {
      x: -48,
      opacity: 0,
      duration: 0.85,
      ease,
      scrollTrigger: {
        trigger: ".buy",
        start: "top 78%",
        toggleActions: "play none none none",
      },
    });

    scrollFrom(".buy__info > *", {
      y: 24,
      opacity: 0,
      duration: 0.55,
      stagger: 0.08,
      ease,
      scrollTrigger: {
        trigger: ".buy",
        start: "top 78%",
        toggleActions: "play none none none",
      },
    });
  }

  /* Bento */
  scrollFrom(".bento__cell", {
    y: 50,
    opacity: 0,
    duration: 0.7,
    stagger: 0.08,
    ease,
    scrollTrigger: {
      trigger: ".bento",
      start: "top 78%",
      toggleActions: "play none none none",
    },
  });

  /* FAQ */
  scrollFrom(".faq__list details", {
    y: 28,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease,
    scrollTrigger: {
      trigger: ".faq",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });

  /* Footer */
  scrollFrom(".site-footer", {
    y: 24,
    opacity: 0,
    duration: 0.6,
    ease,
    scrollTrigger: {
      trigger: ".site-footer",
      start: "top 95%",
      toggleActions: "play none none none",
    },
  });

    ScrollTrigger.refresh();
  };

  if (document.readyState === "complete") {
    initAnimations();
  } else {
    window.addEventListener("load", initAnimations, { once: true });
  }

  window.addEventListener("resize", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
