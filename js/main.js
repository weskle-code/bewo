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

  /* ——— Toast ——— */
  const toast = $("[data-toast]");
  let toastTimer;

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

  /* ——— Mini-cart + products (Yampi cart/items) ——— */
  const CATALOG = {
    kit: {
      id: "kit",
      name: "Esfoliante + Necessaire",
      price: 69.9,
      image: "./assets/shop/kit.webp",
      lines: [
        { optionId: "304074940", ratio: 1 }, // necessaire brinde
        { optionId: "304074941", ratio: 1 }, // esfoliante
      ],
    },
    espuma: {
      id: "espuma",
      name: "Espuma",
      price: 49.9,
      image: "./assets/shop/espuma.webp",
      lines: [{ optionId: "290986638", ratio: 1 }],
      token: "S5SWOJ4NQ5",
    },
    bruma: {
      id: "bruma",
      name: "Bruma pós depilatória",
      price: 79.9,
      image: "./assets/shop/bruma.webp",
      lines: [{ optionId: "290986637", ratio: 1 }],
      token: "F9FTYAOSLY",
    },
  };

  const CART_KEY = "bewo-prevenda-cart";
  const STORE_TOKEN = "KUnrhC4TpVRWiAQLILVoXtrsLhzfxyw6ARpQlKzP";

  const money = (n) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const loadCart = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_) {
      return [];
    }
  };

  let cart = loadCart();

  const saveCart = () => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (_) {}
  };

  const cartCount = () => cart.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = () =>
    cart.reduce((sum, line) => {
      const product = CATALOG[line.id];
      return sum + (product ? product.price * line.qty : 0);
    }, 0);

  const buildCheckoutUrl = (lines = cart) => {
    if (!lines.length) return null;
    const params = new URLSearchParams({
      clearCart: "1",
      redirectTo: "checkout",
      skipToCheckout: "1",
      store_token: STORE_TOKEN,
    });
    let i = 0;
    lines.forEach((line) => {
      const product = CATALOG[line.id];
      if (!product) return;
      product.lines.forEach((opt) => {
        params.set(`product_option_id[${i}]`, opt.optionId);
        params.set(`quantity[${i}]`, String(line.qty * (opt.ratio || 1)));
        i += 1;
      });
    });
    return `https://seguro.bewo.com.br/cart/items?${params.toString()}`;
  };

  const renderCart = () => {
    const list = $("[data-cart-list]");
    const empty = $("[data-cart-empty]");
    const totalEl = $("[data-cart-total]");
    const checkoutBtn = $("[data-cart-checkout]");
    const countEls = $$("[data-cart-count]");
    countEls.forEach((el) => {
      el.textContent = String(cartCount());
    });
    if (totalEl) totalEl.textContent = money(cartTotal());
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (!list) return;
    list.innerHTML = "";
    if (!cart.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    cart.forEach((line) => {
      const product = CATALOG[line.id];
      if (!product) return;
      const row = document.createElement("article");
      row.className = "cart-line";
      row.innerHTML = `
        <img class="cart-line__img" src="${product.image}" alt="" width="72" height="72" />
        <div>
          <p class="cart-line__name">${product.name}</p>
          <p class="cart-line__price">${money(product.price * line.qty)}</p>
          <div class="cart-line__row">
            <div class="cart-line__qty">
              <button type="button" data-cart-dec="${product.id}" aria-label="Diminuir">−</button>
              <span>${line.qty}</span>
              <button type="button" data-cart-inc="${product.id}" aria-label="Aumentar">+</button>
            </div>
            <button type="button" class="cart-line__remove" data-cart-remove="${product.id}">Remover</button>
          </div>
        </div>`;
      list.appendChild(row);
    });
  };

  const addToCart = (id, qty = 1) => {
    if (!CATALOG[id]) return;
    const existing = cart.find((line) => line.id === id);
    if (existing) existing.qty = Math.min(20, existing.qty + qty);
    else cart.push({ id, qty: Math.min(20, qty) });
    saveCart();
    renderCart();
    showToast();
  };

  const setQty = (id, qty) => {
    const line = cart.find((item) => item.id === id);
    if (!line) return;
    if (qty <= 0) cart = cart.filter((item) => item.id !== id);
    else line.qty = Math.min(20, qty);
    saveCart();
    renderCart();
  };

  const openCart = () => {
    const drawer = $("[data-cart-drawer]");
    if (!drawer) return;
    drawer.hidden = false;
    document.body.classList.add("is-cart-open");
  };

  const closeCart = () => {
    const drawer = $("[data-cart-drawer]");
    if (!drawer) return;
    drawer.hidden = true;
    document.body.classList.remove("is-cart-open");
  };

  /* kit qty UI (price only) */
  const initBuyQuantity = () => {
    const wrap = $("[data-buy-qty]");
    const input = $("[data-buy-qty-input]");
    const minus = $("[data-buy-qty-minus]");
    const plus = $("[data-buy-qty-plus]");
    const priceEl = $("[data-buy-price]");
    const installmentEl = $("[data-buy-installment]");
    if (!wrap || !input) return;

    const UNIT = CATALOG.kit.price;
    const clamp = (n) => Math.min(20, Math.max(1, n | 0 || 1));

    const sync = () => {
      const qty = clamp(Number(input.value));
      input.value = String(qty);
      const total = UNIT * qty;
      if (priceEl) priceEl.textContent = money(total);
      if (installmentEl) {
        installmentEl.textContent = `3x de ${money(total / 3)} sem juros`;
      }
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

  /* shop product qty selectors */
  const clampQty = (n) => Math.min(20, Math.max(1, n | 0 || 1));

  $$("[data-shop-qty]").forEach((wrap) => {
    const input = $("[data-shop-qty-input]", wrap);
    const minus = $("[data-shop-qty-minus]", wrap);
    const plus = $("[data-shop-qty-plus]", wrap);
    if (!input) return;

    const sync = () => {
      input.value = String(clampQty(Number(input.value)));
    };

    minus?.addEventListener("click", () => {
      input.value = String(clampQty(Number(input.value) - 1));
    });
    plus?.addEventListener("click", () => {
      input.value = String(clampQty(Number(input.value) + 1));
    });
    input.addEventListener("change", sync);
    input.addEventListener("input", sync);
  });

  renderCart();

  $$("[data-add-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add-product");
      let qty = 1;
      if (id === "kit") {
        qty = clampQty(Number($("[data-buy-qty-input]")?.value) || 1);
      } else {
        const card = btn.closest("[data-product-card]");
        qty = clampQty(Number($("[data-shop-qty-input]", card || document)?.value) || 1);
      }
      addToCart(id, qty);
      openCart();
    });
  });

  $$("[data-buy-now]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-buy-now");
      if (!CATALOG[id]) return;
      let qty = 1;
      if (id === "kit") {
        qty = Math.min(20, Math.max(1, Number($("[data-buy-qty-input]")?.value) || 1));
      }
      const url = buildCheckoutUrl([{ id, qty }]);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });

  $("[data-cart-open]")?.addEventListener("click", openCart);
  $$("[data-cart-close]").forEach((el) => el.addEventListener("click", closeCart));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("is-cart-open")) {
      closeCart();
    }
  });

  $("[data-cart-list]")?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const idInc = t.getAttribute("data-cart-inc");
    const idDec = t.getAttribute("data-cart-dec");
    const idRm = t.getAttribute("data-cart-remove");
    if (idInc) {
      const line = cart.find((item) => item.id === idInc);
      if (line) setQty(idInc, line.qty + 1);
    } else if (idDec) {
      const line = cart.find((item) => item.id === idDec);
      if (line) setQty(idDec, line.qty - 1);
    } else if (idRm) {
      setQty(idRm, 0);
    }
  });

  $("[data-cart-checkout]")?.addEventListener("click", () => {
    const url = buildCheckoutUrl();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
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
