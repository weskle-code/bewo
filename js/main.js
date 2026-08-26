(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ——— UI: cart / carousel ——— */
  const cartEls = $$("[data-cart-count]");
  const toast = $("[data-toast]");
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

  const track = $("[data-carousel-track]");
  const prev = $("[data-carousel-prev]");
  const next = $("[data-carousel-next]");

  const scrollByCard = (dir) => {
    if (!track) return;
    const card = track.querySelector(".shot-card");
    const amount = (card?.getBoundingClientRect().width || 260) + 16;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  prev?.addEventListener("click", () => scrollByCard(-1));
  next?.addEventListener("click", () => scrollByCard(1));

  /* ——— GSAP ——— */
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const ease = "power3.out";

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
    gsap.from(el.children, {
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
  gsap.from(".shot-card", {
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
    gsap.set(".buy__info > *", { clearProps: "transform" });

    gsap.from(".buy__media", {
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

    gsap.from(".buy__info > *", {
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

  /* Promo duo */
  gsap.from(".promo-tile", {
    y: 56,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease,
    scrollTrigger: {
      trigger: ".promo-duo",
      start: "top 80%",
      toggleActions: "play none none none",
    },
  });

  /* Quad grid */
  gsap.from(".quad__cell", {
    y: 50,
    opacity: 0,
    duration: 0.7,
    stagger: 0.12,
    ease,
    scrollTrigger: {
      trigger: ".quad",
      start: "top 78%",
      toggleActions: "play none none none",
    },
  });

  /* FAQ */
  gsap.from(".faq__list details", {
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
  gsap.from(".site-footer", {
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
})();
