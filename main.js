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

  function initHeroDepth() {
    const frame = document.querySelector(".hero-frame");
    if (!frame) return;
    const photo = frame.querySelector("img");
    if (!photo) return;

    let enabled = false;
    let tiltX = 0;
    let tiltY = 0;
    let paraY = 0;
    let ticking = false;

    function canMotion() {
      return (
        !reduceMotion.matches &&
        window.matchMedia("(min-width: 861px)").matches &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches
      );
    }

    function apply() {
      ticking = false;
      if (!enabled) {
        photo.style.transform = "";
        frame.style.transform = "";
        return;
      }
      photo.style.transform = "translate3d(0, " + paraY.toFixed(2) + "px, 0) scale(1.12)";
      frame.style.transform =
        "perspective(900px) rotateX(" + tiltX.toFixed(2) + "deg) rotateY(" + tiltY.toFixed(2) + "deg)";
    }

    function requestApply() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    function updateParallax() {
      if (!enabled) return;
      const rect = frame.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const mid = rect.top + rect.height / 2;
      const offset = (mid - view / 2) / view;
      paraY = Math.max(-18, Math.min(18, offset * -26));
      requestApply();
    }

    frame.addEventListener("mousemove", function (event) {
      if (!enabled) return;
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tiltY = x * 6;
      tiltX = y * -5;
      requestApply();
    });

    frame.addEventListener("mouseleave", function () {
      tiltX = 0;
      tiltY = 0;
      requestApply();
    });

    function syncEnabled() {
      enabled = canMotion();
      if (!enabled) {
        tiltX = 0;
        tiltY = 0;
        paraY = 0;
        photo.style.transform = "";
        frame.style.transform = "";
      } else {
        updateParallax();
      }
    }

    window.addEventListener(
      "scroll",
      function () {
        if (enabled) updateParallax();
      },
      { passive: true }
    );
    window.addEventListener("resize", syncEnabled);
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", syncEnabled);
    }
    syncEnabled();
  }

  initLightbox();
  initReveal();
  initHeroDepth();
})();
