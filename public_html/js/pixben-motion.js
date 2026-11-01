"use strict";
// Animaciones progresivas: visibles por defecto si JS está deshabilitado.
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(".pb-reveal");
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("pb-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px 80px 0px" });
  targets.forEach((target) => observer.observe(target));
  document.documentElement.classList.add("pb-motion-ready");
})();
