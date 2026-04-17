(() => {
  const storageKey = "stateless-theme";
  const pageEnterDuration = 2900;
  const pageLeaveDuration = 640;
  const themeTransitionDuration = 800;
  const themeSwapDelay = 400;
  const root = document.documentElement;
  const body = document.body;
  const toggle = document.querySelector("[data-theme-toggle]");
  const internalLinks = Array.from(document.querySelectorAll('a[href]'));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pageEnterTimer = null;
  let themeTransitionTimer = null;
  let themeSwapTimer = null;
  let pendingNavigationHref = null;
  let isThemeTransitioning = false;

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
    body.classList.remove("is-darkening", "is-lightening");
    void body.offsetWidth;
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
