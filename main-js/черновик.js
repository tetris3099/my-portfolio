const I18N = (() => {
  const cache = new Map();
  const supported = ["en", "uk", "ru"];

  function getLangFromUrl() {
    return new URLSearchParams(location.search).get("lang");
  }

  function getLangFromStorage() {
    return localStorage.getItem("lang");
  }

  function guessLangFromBrowser() {
    const l = (navigator.language || "").slice(0, 2);
    return supported.includes(l) ? l : "en";
  }

  function getInitialLanguage() {
    return getLangFromUrl() || getLangFromStorage() || guessLangFromBrowser();
  }
  
  async function loadDict(lang) {
    if (cache.has(lang)) return cache.get(lang);

    const res = await fetch(`/i18n/${lang}.json`);
    if (!res.ok) throw new Error(`i18n load failed: ${lang}`);

    const dict = await res.json();
    cache.set(lang, dict);
    return dict;
  }
  // 
  function applyTranslations(dict) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const path = el.dataset.i18n.split(".");
      let value = dict;
      for (const key of path) value = value?.[key];

      if (value != null) el.textContent = value;
    });
  }

  function saveLang(lang) {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }

  function syncUrl(lang, { push = true } = {}) {
    const url = new URL(location.href);
    url.searchParams.set("lang", lang);
    push ? history.pushState({}, "", url) : history.replaceState({}, "", url);
  }

  function syncActiveButton(lang) {
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.langBtn === lang);
    });
  }

  async function setLanguage(lang, { updateUrl = true, pushHistory = true } = {}) {
    if (!supported.includes(lang)) lang = "en";

    const dict = await loadDict(lang);
    applyTranslations(dict);

    saveLang(lang);
    syncActiveButton(lang);

    if (updateUrl) syncUrl(lang, { push: pushHistory });
  }

  function bindUI() {
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.langBtn));
    });

    window.addEventListener("popstate", () => {
      const lang = getLangFromUrl() || getLangFromStorage() || "en";
      setLanguage(lang, { updateUrl: false });
    });
  }

  return { setLanguage, bindUI, getInitialLanguage };
})();

// запуск
I18N.bindUI();
I18N.setLanguage(I18N.getInitialLanguage(), { updateUrl: false });
