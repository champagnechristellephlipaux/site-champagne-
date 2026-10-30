(function () {
  const loaders = document.querySelectorAll("[data-map-loader]");

  loaders.forEach((loader) => {
    const button = loader.querySelector("[data-map-load]");
    const placeholder = loader.querySelector("[data-map-placeholder]");
    const frame = loader.querySelector("iframe[data-map-src]");
    const status = loader.parentElement?.querySelector("[data-map-status]");

    if (!button || !placeholder || !frame) return;

    button.addEventListener("click", () => {
      if (frame.hasAttribute("src")) return;

      const source = frame.dataset.mapSrc;
      if (!source) return;

      button.disabled = true;
      button.setAttribute("aria-expanded", "true");
      if (status) status.textContent = "Chargement de la carte Google Maps.";

      frame.addEventListener(
        "load",
        () => {
          if (status) status.textContent = "Carte Google Maps chargée.";
          frame.focus({ preventScroll: true });
        },
        { once: true },
      );

      frame.src = source;
      frame.hidden = false;
      frame.tabIndex = 0;
      placeholder.hidden = true;
      window.ccpTrack?.("depositary_map_load", { source: "depositaires" });
    });
  });
})();
