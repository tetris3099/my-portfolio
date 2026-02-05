window.addEventListener('DOMContentLoaded', () => {
  let languages = null;
  // html elementst;
  const body = document.body;
  const themeButton = document.querySelector('button[data-them-select]');
  const langSelectButton = document.querySelector('button[data-lang-selector]');
  const multiLangElem = document.querySelectorAll('[multi-language]');
  //

  // clicked on a parent or child
  const targetClosest = ({ parent, target }) => {
    if (!parent || !target) {
      console.warn('targetClosest: undefined parent or target');
      return;
    }
    const classes = parent.classList;
    return target.closest(`.${classes[0]}`) === parent;
  };

  // .classlist.toggle one element or array
  class ToggClass {
    constructor({ element = null, className = null, autoStart = false, callback = null }) {
      this.element = element; //variable or variable array
      this.className = className; //string or string array
      this.callback = callback;
      if (autoStart) {
        this.start();
      }
    }

    start() {
      if (!this.element || !this.className) {
        console.warn(`ToggClass: No variable or class name specified`);
        return;
      }
      // is array
      if (Array.isArray(this.element) && Array.isArray(this.className)) {
        this.element.forEach((el, i) => {
          el.classList.toggle(this.className[i]);
        });

        if (this.callback) {
          this.callback();
        }
        return;
      }
      // is not array
      this.element.classList.toggle(this.className);

      if (this.callback) {
        this.callback();
      }
    }
  }

  // page loading, theme checking
  const isTheme = () => {
    const darkThemeOn = new ToggClass({
      element: [themeButton, body],
      className: ['dark', 'dark-mode'],
    });

    const saveTheme = localStorage.getItem('theme');
    if (saveTheme) {
      if (saveTheme === 'dark') darkThemeOn.start();
      return;
    }

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) darkThemeOn.start();
  };
  isTheme();

  // checking text content language
  const isLang = () => {
    const deviceLang = navigator.language;
    const urlParams = new URLSearchParams(location.search).get('lang');

    if (deviceLang.includes('en') && !urlParams) return;

    const loadlang = urlParams ? urlParams : deviceLang.split('-')[0];

    changeLang({
      lang: loadlang,
      loadPage: true,
    });
  };
  isLang();

  // set language page click button lang or checking;
  async function changeLang({ lang, clickButton = null, loadPage = false }) {
    if (lang !== 'en' && lang !== 'uk' && lang !== 'ru') {
      lang = 'en';
    }

    if (!languages) {
      const res = await fetch('./languages.json');
      if (!res.ok) {
        console.warn('Languages error load');
        return;
      }
      languages = await res.json();
    }

    // HTML lang=""
    const langDocument = document.querySelector('[lang]');
    langDocument.setAttribute('lang', lang);

    const selectButtonText = langSelectButton.querySelector('span');
    const prevText = selectButtonText.textContent;
    selectButtonText.textContent = lang;
    const path = new URLSearchParams({
      lang,
    });

    if (!loadPage && clickButton) {
      // Actions of click
      clickButton.textContent = prevText;
      clickButton.setAttribute('data-lang-button', prevText);
      window.history.pushState({ page: 1 }, '', `?${path.toString()}`);
    }

    // call isLang function
    if (loadPage) {
      window.history.replaceState({ page: 2 }, '', `?${path.toString()}`);
      const parent = langSelectButton.parentElement;
      const langButtonst = parent.querySelectorAll('button[data-lang-button]');
      langButtonst.forEach((elem) => {
        if (elem.textContent === lang) {
          elem.textContent = prevText;
          elem.setAttribute('data-lang-button', prevText);
        }
      });
      applyLang();
      return;
    }

    const animChangeLang = new ToggClass({
      element: body,
      className: 'change-lang',
      autoStart: true,
    });

    setTimeout(() => {
      applyLang();
    }, 250);

    setTimeout(() => {
      animChangeLang.start();
    }, 300);

    function applyLang() {
      multiLangElem.forEach((elem) => {
        const keyText = elem.getAttribute('multi-language');
        const keyArr = keyText.split('.');
        elem.textContent = languages[lang][keyArr[0]][keyArr[1]];
      });
    }
  }
  //

  //click theme button
  const changeTheme = new ToggClass({
    element: [themeButton, body],
    className: ['dark', 'dark-mode'],
    callback: () => {
      // recording theme localStorage
      const statusTheme = body.classList.contains('dark-mode');
      if (statusTheme) {
        localStorage.setItem('theme', 'dark');
        return;
      }
      localStorage.setItem('theme', 'light');
    },
  });

  // open or close language menu
  const langMenu = {
    start() {
      const langSelectButtonClass = new ToggClass({
        element: langSelectButton,
        className: 'open',
        autoStart: true,
      });

      const parent = langSelectButton.parentElement;
      const langList = parent.querySelector('ul[data-lang-list]');
      if (!this.statusLangMenu()) {
        this.openList({
          isOpen: false,
          elem: langList,
        });
        return;
      }
      this.openList({
        isOpen: true,
        elem: langList,
      });
    },

    openList({ isOpen, elem }) {
      const heightConteiner = elem.scrollHeight;
      elem.style.maxHeight = isOpen ? `${heightConteiner}px` : null;
    },

    statusLangMenu() {
      return langSelectButton.classList.contains('open');
    },
  };

  // event listener
  document.addEventListener('click', (event) => {
    const target = event.target;

    // THEME
    const isThemeButton = targetClosest({
      parent: themeButton,
      target,
    });
    if (isThemeButton) {
      changeTheme.start();
    }

    // LANGUAGE
    const islangSelectButton = targetClosest({
      parent: langSelectButton,
      target,
    });
    if (islangSelectButton || (langMenu.statusLangMenu() && !islangSelectButton)) {
      const isLangButton = target.hasAttribute('data-lang-button');
      if (isLangButton) {
        const targetLang = target.getAttribute('data-lang-button');
        changeLang({
          lang: targetLang,
          clickButton: target,
        });
      }
      langMenu.start();
    }
  });

  window.addEventListener('popstate', () => {
    const lang = new URLSearchParams(location.search).get('lang') || 'en';
    changeLang({ lang, });
  });
});
