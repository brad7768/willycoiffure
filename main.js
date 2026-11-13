(function () {
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.getElementById("site-menu");
    const backdrop = document.querySelector(".site-menu-backdrop");
    if (!toggle || !menu) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      if (backdrop) {
        backdrop.classList.toggle("is-open", open);
        backdrop.removeAttribute("hidden");
        if (!open) {
          window.setTimeout(function () {
            if (!isOpen()) backdrop.setAttribute("hidden", "");
          }, reduceMotion.matches ? 0 : 280);
        }
      }
      document.body.classList.toggle("menu-open", open);
      if (open) {
        const first = menu.querySelector("a");
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!isOpen());
    });
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (!isOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll("a, button")));
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && index === focusable.length - 1) {
        event.preventDefault();
        focusable[0].focus();
      }
    });
  }

  initMenu();

  function initTheme() {
    const root = document.documentElement;
    const key = "willy-theme";
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const switches = document.querySelectorAll(".theme-switch");

    function choice() {
      return root.getAttribute("data-theme-choice") || "auto";
    }

    function resolve(selected) {
      if (selected === "light" || selected === "dark") return selected;
      return mq.matches ? "dark" : "light";
    }

    function apply(selected) {
      const next = selected === "light" || selected === "dark" ? selected : "auto";
      root.setAttribute("data-theme-choice", next);
      root.setAttribute("data-theme", resolve(next));
      try { localStorage.setItem(key, next); } catch (e) {}
      switches.forEach(function (group) {
        group.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
          const on = btn.getAttribute("data-theme-choice") === next;
          btn.setAttribute("aria-checked", on ? "true" : "false");
        });
      });
    }

    apply(choice());

    switches.forEach(function (group) {
      const opts = Array.prototype.slice.call(group.querySelectorAll("[data-theme-choice]"));
      opts.forEach(function (btn, index) {
        btn.addEventListener("click", function () {
          apply(btn.getAttribute("data-theme-choice"));
        });
        btn.addEventListener("keydown", function (event) {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          const dir = event.key === "ArrowRight" ? 1 : -1;
          const next = (index + dir + opts.length) % opts.length;
          opts[next].focus();
          apply(opts[next].getAttribute("data-theme-choice"));
        });
      });
    });

    function onSchemeChange() {
      if (choice() === "auto") apply("auto");
    }
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onSchemeChange);
    else if (typeof mq.addListener === "function") mq.addListener(onSchemeChange);
  }

  initTheme();

  function initLightbox() {
    const triggers = document.querySelectorAll("[data-lightbox]");
    if (!triggers.length) return;

    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Aperçu de la photo");
    box.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Fermer">&times;</button>' +
      '<img class="lightbox-img" alt="">';
    document.body.appendChild(box);

    const img = box.querySelector(".lightbox-img");
    const closeBtn = box.querySelector(".lightbox-close");
    let lastFocus = null;

    function openLightbox(src, alt) {
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt || "";
      box.classList.add("open");
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function closeLightbox() {
      box.classList.remove("open");
      document.body.classList.remove("lightbox-open");
      img.removeAttribute("src");
      img.alt = "";
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    triggers.forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        const src = el.getAttribute("href") || (el.querySelector("img") && el.querySelector("img").src);
        const photo = el.querySelector("img");
        const alt = el.getAttribute("data-alt") || (photo && photo.getAttribute("alt")) || "";
        if (src) openLightbox(src, alt);
      });
    });

    closeBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      closeLightbox();
    });
    box.addEventListener("click", closeLightbox);
    img.addEventListener("click", function (event) {
      event.stopPropagation();
      closeLightbox();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && box.classList.contains("open")) closeLightbox();
    });
  }

  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    document.querySelectorAll(".reveal-stagger").forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, i) {
        if (child.classList.contains("reveal")) {
          child.style.setProperty("--reveal-delay", String(i));
        }
      });
    });

    if (reduceMotion.matches) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function initHeroSlider() {
    const hero = document.querySelector(".hero");
    if (!hero || !hero.querySelector(".hero-bg")) return;

    const photos = Array.prototype.slice.call(hero.querySelectorAll(".hero-bg-img"));
    const headlines = Array.prototype.slice.call(hero.querySelectorAll(".hero-headline"));
    const buttons = Array.prototype.slice.call(hero.querySelectorAll(".hero-progress-btn"));
    const layer = hero.querySelector(".hero-bg");
    if (!photos.length || !headlines.length) return;

    const DURATION = 35000;
    const EXIT_MS = 700;
    let tick = 0;
    let startedAt = performance.now();
    let carried = 0;
    let paused = false;
    let exitTimer = 0;
    let paraY = 0;
    let paraEnabled = false;
    let paraTicking = false;

    headlines.forEach(function (el) {
      if (el.getAttribute("data-anim") !== "stagger") return;
      if (el.querySelector(".word")) return;
      const text = el.textContent;
      el.textContent = "";
      text.split(/(\s+)/).forEach(function (part) {
        if (/^\s+$/.test(part)) {
          el.appendChild(document.createTextNode(part));
          return;
        }
        if (!part) return;
        const wordIndex = el.querySelectorAll(".word").length;
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = part;
        span.style.setProperty("--i", String(wordIndex));
        el.appendChild(span);
      });
    });

    function imageIndex() { return ((tick % photos.length) + photos.length) % photos.length; }
    function textIndex() { return ((tick % headlines.length) + headlines.length) % headlines.length; }

    function preload(i) {
      const photo = photos[((i % photos.length) + photos.length) % photos.length];
      if (!photo) return;
      photo.loading = "eager";
      const src = photo.getAttribute("src");
      if (!src) return;
      const im = new Image();
      im.src = src;
    }

    function restartKenBurns(photo) {
      photo.style.animation = "none";
      void photo.offsetWidth;
      photo.style.animation = "";
    }

    function setHeadline(index, animate) {
      headlines.forEach(function (el, i) {
        const on = i === index;
        el.classList.toggle("is-leaving", false);
        el.classList.toggle("is-active", on);
        el.setAttribute("aria-hidden", on ? "false" : "true");
        if (on && animate && !reduceMotion.matches) {
          el.style.animation = "none";
          void el.offsetWidth;
          el.style.animation = "";
          el.querySelectorAll(".word").forEach(function (word) {
            word.style.animation = "none";
            void word.offsetWidth;
            word.style.animation = "";
          });
        }
      });
    }

    function setPhoto(index) {
      photos.forEach(function (el, i) {
        const on = i === index;
        el.classList.toggle("is-active", on);
        if (on && !reduceMotion.matches) restartKenBurns(el);
      });
      buttons.forEach(function (btn, i) {
        const on = i === index;
        btn.classList.toggle("is-active", on);
        if (on) btn.setAttribute("aria-current", "true");
        else btn.removeAttribute("aria-current");
      });
      preload(index + 1);
    }

    function show(nextTick, immediate) {
      const prevText = textIndex();
      tick = nextTick;
      const nextText = textIndex();
      const nextPhoto = imageIndex();
      setPhoto(nextPhoto);

      if (immediate || reduceMotion.matches || prevText === nextText) {
        setHeadline(nextText, !immediate);
        return;
      }

      const current = headlines[prevText];
      if (current) {
        current.classList.add("is-leaving");
        current.classList.remove("is-active");
      }
      window.clearTimeout(exitTimer);
      exitTimer = window.setTimeout(function () {
        if (current) current.classList.remove("is-leaving");
        setHeadline(nextText, true);
      }, EXIT_MS);
    }

    function elapsed() {
      if (paused) return carried;
      return carried + (performance.now() - startedAt);
    }

    function setProgress(ratio) {
      const i = imageIndex();
      buttons.forEach(function (btn, idx) {
        const fill = btn.querySelector(".hero-progress-fill");
        if (!fill) return;
        const value = idx === i ? Math.max(0, Math.min(1, ratio)) : 0;
        fill.style.transform = "scaleX(" + value.toFixed(4) + ")";
      });
    }

    function jump(nextTick) {
      window.clearTimeout(exitTimer);
      headlines.forEach(function (el) { el.classList.remove("is-leaving"); });
      carried = 0;
      startedAt = performance.now();
      show(nextTick, false);
      setProgress(0);
    }

    function onFrame() {
      if (!paused) {
        let t = elapsed();
        if (t >= DURATION) {
          const steps = Math.floor(t / DURATION);
          carried = t - steps * DURATION;
          startedAt = performance.now();
          show(tick + steps, false);
          t = carried;
        }
        setProgress(t / DURATION);
      }
      requestAnimationFrame(onFrame);
    }

    function pause() {
      if (paused) return;
      carried = elapsed();
      paused = true;
      hero.classList.add("is-paused");
    }
    function resume() {
      if (!paused) return;
      startedAt = performance.now();
      paused = false;
      hero.classList.remove("is-paused");
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else resume();
    });

    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        jump(i);
      });
    });

    hero.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (!hero.contains(document.activeElement)) return;
      event.preventDefault();
      const dir = event.key === "ArrowRight" ? 1 : -1;
      jump(tick + dir);
    });

    function canParallax() {
      return (
        !reduceMotion.matches &&
        window.matchMedia("(min-width: 861px)").matches
      );
    }
    function applyParallax() {
      paraTicking = false;
      if (!paraEnabled) {
        layer.style.transform = "";
        return;
      }
      layer.style.transform = "translate3d(0, " + paraY.toFixed(2) + "px, 0)";
    }
    function updateParallax() {
      if (!paraEnabled) return;
      const rect = hero.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const mid = rect.top + rect.height / 2;
      const offset = (mid - view / 2) / view;
      paraY = Math.max(-28, Math.min(28, offset * -36));
      if (!paraTicking) {
        paraTicking = true;
        requestAnimationFrame(applyParallax);
      }
    }
    function syncParallax() {
      paraEnabled = canParallax();
      if (!paraEnabled) {
        paraY = 0;
        layer.style.transform = "";
      } else {
        updateParallax();
      }
    }
    window.addEventListener("scroll", function () { if (paraEnabled) updateParallax(); }, { passive: true });
    window.addEventListener("resize", syncParallax);
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", syncParallax);
    }
    syncParallax();

    preload(1);
    setPhoto(imageIndex());
    setHeadline(textIndex(), true);
    setProgress(0);
    requestAnimationFrame(onFrame);
  }

  initLightbox();
  initReveal();
  initHeroSlider();
})();
