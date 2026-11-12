(function () {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

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
})();
