(function codexskinDoraemon() {
  const root = document.documentElement;
  const THEME_CLASS = "codexskin-doraemon";
  const STYLE_LINK = "codexskin-doraemon-css";
  const CHROME_ID = "codexskin-doraemon-chrome";
  const STATE_KEY = "__CODEXSKIN_DORAEMON_STATE__";

  const previous = window[STATE_KEY];
  if (previous?.observer) previous.observer.disconnect();
  if (previous?.timer) window.clearInterval(previous.timer);
  if (previous?.timeout) window.clearTimeout(previous.timeout);
  if (previous?.resizeHandler) window.removeEventListener("resize", previous.resizeHandler);

  root.classList.add(THEME_CLASS);
  root.dataset.codexskin = "doraemon";

  function installCssLink() {
    if (document.getElementById(STYLE_LINK)) return;
    const currentScript = document.currentScript;
    const href = currentScript
      ? new URL("doraemon.css", currentScript.src).toString()
      : "./codexskin/doraemon.css";
    const link = document.createElement("link");
    link.id = STYLE_LINK;
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.codexskinTheme = "doraemon";
    document.head.appendChild(link);
  }

  function clearMarker(name, keep) {
    for (const el of document.querySelectorAll(`[data-${name}="true"]`)) {
      if (el !== keep) el.removeAttribute(`data-${name}`);
    }
  }

  function findSidebar() {
    const stable = document.querySelector("aside.app-shell-left-panel");
    if (stable) return stable;

    const candidates = document.querySelectorAll('aside, nav, [class*="sidebar" i], [class*="side-bar" i], [data-testid*="sidebar" i]');
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width >= 160 && rect.width <= 380 && rect.left <= 40 && rect.height > window.innerHeight * 0.55) {
        return el;
      }
    }

    const textPattern = /(Codex|新建任务|已安排|插件|站点|拉取请求|聊天|项目)/;
    for (const el of document.querySelectorAll("body div")) {
      const rect = el.getBoundingClientRect();
      if (rect.width >= 180 && rect.width <= 360 && rect.left <= 40 && rect.height > window.innerHeight * 0.65) {
        if (textPattern.test(el.innerText || "")) return el;
      }
    }
    return null;
  }

  function findMain() {
    return document.querySelector("main.main-surface") || document.querySelector("main");
  }

  function findHome() {
    const stable = [...document.querySelectorAll('[role="main"]')].find((candidate) =>
      candidate.querySelector('[data-feature="game-source"]') &&
      candidate.querySelector(".group\\/home-suggestions"));
    if (stable) return stable;

    const labels = /(我们应该在|What should we build|What do you want to build)/;
    for (const candidate of document.querySelectorAll('[role="main"], main section, main > div')) {
      if (labels.test(candidate.innerText || "")) return candidate;
    }
    return null;
  }

  function findHeading(home) {
    if (!home) return null;
    const stable = home.querySelector('[data-feature="game-source"]');
    if (stable) return stable;
    const labels = /(我们应该在.*构建什么|What should we build|What do you want to build)/;
    return [...home.querySelectorAll("h1, h2, [role=heading], div")].find((el) => {
      const text = (el.innerText || "").trim();
      const rect = el.getBoundingClientRect();
      return labels.test(text) && rect.width >= 260 && rect.height <= 160;
    }) || null;
  }

  function findHero(home, heading) {
    if (!home || !heading) return null;
    let node = heading.parentElement;
    let best = null;
    for (let depth = 0; node && node !== home && depth < 8; depth += 1, node = node.parentElement) {
      const containsComposer = Boolean(node.querySelector('.composer-surface-chrome, [role="textbox"], textarea'));
      const containsBanner = Boolean(node.querySelector(".home-banners"));
      if (containsComposer || containsBanner) continue;

      const hasSuggestionPortal = [...node.children].some((child) =>
        child.matches('div[class*="top-full"], div[class*="composer-suggestion-inline-inset"]'));
      if (hasSuggestionPortal) return node;

      const rect = node.getBoundingClientRect();
      if (rect.width >= 560 && rect.height >= 72 && rect.height <= 320) best = node;
    }
    return best;
  }

  function markCards(home) {
    for (const el of document.querySelectorAll('[data-codexskin-home-card="true"]')) {
      el.removeAttribute("data-codexskin-home-card");
    }
    if (!home) return;

    const group = home.querySelector(".group\\/home-suggestions");
    const stableButtons = group ? [...group.querySelectorAll(":scope > button")] : [];
    if (stableButtons.length) {
      for (const button of stableButtons) button.dataset.codexskinHomeCard = "true";
      return;
    }

    const labels = /(探索并理解代码|构建新功能|审查代码|修复问题|Explore and understand|Build new|Review code|Fix bugs)/;
    for (const el of home.querySelectorAll('button, a, [role="button"]')) {
      const text = (el.innerText || "").trim();
      const rect = el.getBoundingClientRect();
      if (labels.test(text) && rect.width >= 110 && rect.height >= 50 && rect.height <= 180) {
        el.dataset.codexskinHomeCard = "true";
      }
    }
  }

  function findComposer() {
    const stable = document.querySelector(".composer-surface-chrome");
    if (stable) return stable;

    const inputs = document.querySelectorAll('textarea, [contenteditable="true"], [role="textbox"], input[type="text"]');
    let best = null;
    let bestScore = -Infinity;
    for (const input of inputs) {
      let node = input;
      for (let depth = 0; node && depth < 7; depth += 1, node = node.parentElement) {
        const rect = node.getBoundingClientRect();
        if (rect.width > 420 && rect.height >= 64 && rect.height <= 180 && rect.bottom > window.innerHeight - 210) {
          const score = rect.width - Math.abs(rect.height - 105) * 4 - Math.abs(window.innerHeight - rect.bottom);
          if (score > bestScore) {
            best = node;
            bestScore = score;
          }
        }
      }
    }
    return best;
  }

  function markSendButton(composer) {
    let best = composer?.querySelector('button[class~="bg-token-foreground"]') || null;
    let bestRight = best?.getBoundingClientRect().right || -Infinity;
    if (composer && !best) {
      const composerRect = composer.getBoundingClientRect();
      for (const button of composer.querySelectorAll('button, [role="button"]')) {
        const rect = button.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 20 || rect.bottom > composerRect.bottom + 2) continue;
        if (rect.right > bestRight) {
          best = button;
          bestRight = rect.right;
        }
      }
    }
    clearMarker("codexskin-send", best);
    if (best) best.dataset.codexskinSend = "true";
  }

  function ensureChrome(main, home) {
    if (!document.body || !main) return;
    let chrome = document.getElementById(CHROME_ID);
    if (!chrome) {
      chrome = document.createElement("div");
      chrome.id = CHROME_ID;
      chrome.setAttribute("aria-hidden", "true");
      chrome.innerHTML = [
        '<div class="codexskin-brand">',
        '<span class="codexskin-brand__bell"></span>',
        '<span><b>机器猫 · 时光工作台</b><small>DORAEMON CODE LAB</small></span>',
        "</div>",
        '<div class="codexskin-status"><i></i><span>TIME MACHINE READY</span></div>',
      ].join("");
      document.body.appendChild(chrome);
    }
    const rect = main.getBoundingClientRect();
    chrome.style.left = `${Math.round(rect.left)}px`;
    chrome.style.top = `${Math.round(rect.top)}px`;
    chrome.style.width = `${Math.round(rect.width)}px`;
    chrome.style.height = `${Math.round(rect.height)}px`;
    chrome.classList.toggle("codexskin-home-shell", Boolean(home));
  }

  function ensure() {
    const sidebar = findSidebar();
    clearMarker("codexskin-sidebar", sidebar);
    if (sidebar) {
      sidebar.dataset.codexskinSidebar = "true";
      for (const old of document.querySelectorAll('[data-codexskin-nav-item="true"]')) {
        old.removeAttribute("data-codexskin-nav-item");
      }
      for (const el of sidebar.querySelectorAll("button, a")) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 90 && rect.height > 24) el.dataset.codexskinNavItem = "true";
      }
    }

    const main = findMain();
    clearMarker("codexskin-main", main);
    if (main) main.dataset.codexskinMain = "true";

    const home = findHome();
    for (const old of document.querySelectorAll(".codexskin-home")) {
      old.classList.remove("codexskin-home");
    }
    if (main) main.classList.toggle("codexskin-home-shell", Boolean(home));

    const heading = null;
    clearMarker("codexskin-heading", heading);

    const hero = null;
    clearMarker("codexskin-hero", hero);

    markCards(null);

    const composer = findComposer();
    clearMarker("codexskin-composer", composer);
    if (composer) composer.dataset.codexskinComposer = "true";
    markSendButton(composer);
    ensureChrome(main, home);
  }

  let timeout = null;
  function scheduleEnsure() {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      timeout = null;
      ensure();
    }, 120);
    window[STATE_KEY].timeout = timeout;
  }

  installCssLink();

  const observer = new MutationObserver(scheduleEnsure);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "aria-current", "data-state"],
  });
  const timer = window.setInterval(ensure, 3000);
  const resizeHandler = scheduleEnsure;
  window.addEventListener("resize", resizeHandler, { passive: true });

  window[STATE_KEY] = { observer, timer, timeout, resizeHandler, ensure };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEnsure, { once: true });
  } else {
    scheduleEnsure();
  }
})();
