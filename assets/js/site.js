(() => {
  const storageKey = "stateless-theme";
  const pageEnterDuration = 2900;
  const pageLeaveDuration = 1344;
  const themeTransitionDuration = 1500;
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  const internalLinks = Array.from(document.querySelectorAll('a[href]'));
  let pageEnterTimer = null;
  let themeDelayTimer = null;

  const getStoredTheme = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
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
    document.body.classList.remove("is-darkening", "is-lightening");
    void document.body.offsetWidth;
    document.body.classList.add("theme-transitioning", directionClass);

    window.setTimeout(() => {
      document.body.classList.remove("theme-transitioning", "is-darkening", "is-lightening");
    }, themeTransitionDuration);
  };

  const toggleTheme = () => {
    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    runThemeTransition(nextTheme);

    if (themeDelayTimer) {
      window.clearTimeout(themeDelayTimer);
    }

    themeDelayTimer = window.setTimeout(() => {
      setTheme(nextTheme);
      setStoredTheme(nextTheme);
      themeDelayTimer = null;
    }, 420);
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
      if (pageEnterTimer) {
        window.clearTimeout(pageEnterTimer);
        pageEnterTimer = null;
      }

      document.body.classList.remove("page-entering");
      void document.body.offsetWidth;
      document.body.classList.add("page-leaving");

      window.setTimeout(() => {
        window.location.assign(link.href);
      }, pageLeaveDuration);
    });
  });

  window.addEventListener("pageshow", (event) => {
    document.body.classList.remove("page-leaving");

    if (event.persisted) {
      replayPageEnter();
    }
  });

  clearPageEnter();

})();
