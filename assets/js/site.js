(() => {
  const storageKey = "stateless-theme";
  const pageEnterDuration = 2900;
  const pageLeaveDuration = 640;
  const themeTransitionDuration = 2000;
  const themeSwapDelay = 900;
  const veilCols = 30;
  const veilRows = 18;
  const veilStepMsPerCell = 22;
  const root = document.documentElement;
  const body = document.body;
  const toggle = document.querySelector("[data-theme-toggle]");
  const veil = document.querySelector(".theme-pixel-veil");
  const internalLinks = Array.from(document.querySelectorAll('a[href]'));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pageEnterTimer = null;
  let themeTransitionTimer = null;
  let themeSwapTimer = null;
  let pendingNavigationHref = null;
  let isThemeTransitioning = false;
  let veilCells = [];

  const buildVeilGrid = () => {
    if (!veil) {
      return;
    }
    veil.style.setProperty("--veil-cols", veilCols);
    veil.style.setProperty("--veil-rows", veilRows);
    const fragment = document.createDocumentFragment();
    const total = veilCols * veilRows;
    for (let i = 0; i < total; i++) {
      const cell = document.createElement("span");
      cell.className = "veil-cell";
      fragment.appendChild(cell);
    }
    veil.appendChild(fragment);
    veilCells = Array.from(veil.querySelectorAll(".veil-cell"));
  };

  /* Compute per-cell animation-delay from Euclidean distance (in cell units)
     to the source point. The toggle's center is the source, so the flood
     emanates from wherever the user clicked. */
  const primeVeilFlood = () => {
    if (!veil || veilCells.length === 0) {
      return;
    }
    let sx, sy;
    if (toggle) {
      const rect = toggle.getBoundingClientRect();
      sx = rect.left + rect.width / 2;
      sy = rect.top + rect.height / 2;
    } else {
      sx = window.innerWidth / 2;
      sy = window.innerHeight / 2;
    }
    const cellW = window.innerWidth / veilCols;
    const cellH = window.innerHeight / veilRows;
    for (let i = 0; i < veilCells.length; i++) {
      const col = i % veilCols;
      const row = Math.floor(i / veilCols);
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2;
      const dx = (cx - sx) / cellW;
      const dy = (cy - sy) / cellH;
      const dist = Math.sqrt(dx * dx + dy * dy);
      veilCells[i].style.setProperty("--cell-d", `${Math.round(dist * veilStepMsPerCell)}ms`);
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // Ignore storage failures.
    }
  };

  const setTheme = (theme) => {
    root.setAttribute("data-theme", theme);

    if (toggle) {
      const isDark = theme === "dark";
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }
  };

  const runThemeTransition = (nextTheme) => {
    const directionClass = nextTheme === "dark" ? "is-darkening" : "is-lightening";
    if (themeTransitionTimer) {
      window.clearTimeout(themeTransitionTimer);
    }
    if (themeSwapTimer) {
      window.clearTimeout(themeSwapTimer);
    }

    isThemeTransitioning = true;
    body.classList.remove("is-darkening", "is-lightening", "theme-transitioning");
    veilCells.forEach((cell) => {
      cell.style.animation = "none";
    });
    void body.offsetWidth;
    primeVeilFlood();
    veilCells.forEach((cell) => {
      cell.style.animation = "";
    });
    body.classList.add("theme-transitioning", directionClass);

    if (prefersReducedMotion.matches) {
      setTheme(nextTheme);
      setStoredTheme(nextTheme);
      body.classList.remove("theme-transitioning", "is-darkening", "is-lightening");
      isThemeTransitioning = false;
      return;
    }

    themeSwapTimer = window.setTimeout(() => {
      setTheme(nextTheme);
      setStoredTheme(nextTheme);
      themeSwapTimer = null;
    }, themeSwapDelay);

    themeTransitionTimer = window.setTimeout(() => {
      body.classList.remove("theme-transitioning", "is-darkening", "is-lightening");
      themeTransitionTimer = null;
      isThemeTransitioning = false;
    }, themeTransitionDuration);
  };

  const toggleTheme = () => {
    if (isThemeTransitioning) {
      return;
    }

    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    runThemeTransition(nextTheme);
  };

  setTheme(root.getAttribute("data-theme") || "light");
  buildVeilGrid();

  if (toggle) {
    toggle.addEventListener("click", toggleTheme);
  }

  const clearPageEnter = () => {
    if (pageEnterTimer) {
      window.clearTimeout(pageEnterTimer);
    }

    pageEnterTimer = window.setTimeout(() => {
      document.body.classList.remove("page-entering");
      pageEnterTimer = null;
    }, pageEnterDuration);
  };

  const replayPageEnter = () => {
    document.body.classList.remove("page-entering", "page-leaving");
    void document.body.offsetWidth;
    document.body.classList.add("page-entering");
    clearPageEnter();
  };

  const isNavigableInternalLink = (link) => {
    if (!link || link.target === "_blank" || link.hasAttribute("download")) {
      return false;
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) {
      return false;
    }

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) {
      return false;
    }

    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }

    return true;
  };

  internalLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !isNavigableInternalLink(link)
      ) {
        return;
      }

      event.preventDefault();
      if (pendingNavigationHref) {
        return;
      }

      pendingNavigationHref = link.href;

      if (prefersReducedMotion.matches) {
        window.location.assign(link.href);
        return;
      }

      if (pageEnterTimer) {
        window.clearTimeout(pageEnterTimer);
        pageEnterTimer = null;
      }

      body.classList.remove("page-entering");
      void body.offsetWidth;
      body.classList.add("page-leaving");

      window.setTimeout(() => {
        window.location.assign(link.href);
      }, pageLeaveDuration);
    });
  });

  window.addEventListener("pageshow", (event) => {
    body.classList.remove("page-leaving");
    pendingNavigationHref = null;

    if (event.persisted) {
      replayPageEnter();
    }
  });

  clearPageEnter();

})();
