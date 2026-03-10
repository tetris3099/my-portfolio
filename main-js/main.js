window.addEventListener('DOMContentLoaded', () => {
  let languages = null;
  let projects = null;
  // html elementst;
  const body = document.body;
  const themeButton = document.querySelector('button[data-them-select]');
  const langSelectButton = document.querySelector('button[data-lang-selector]');
  const multiLangElem = document.querySelectorAll('[multi-language]');
  const portfolio = document.querySelector('.portfolio');
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
      const res = await fetch('./main-json/languages.json');
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

    projectsRender.langFn(lang);

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
        keyText === 'about.description'
          ? (elem.innerHTML = languages[lang][keyArr[0]][keyArr[1]])
          : (elem.textContent = languages[lang][keyArr[0]][keyArr[1]]);
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

  window.addEventListener('popstate', () => {
    const lang = new URLSearchParams(location.search).get('lang') || 'en';
    changeLang({ lang });
  });

  // render projects card
  class ProjectsList {
    constructor({ section, arr, autoStart = false }) {
      this.section = section;
      this.arr = arr;
      if (autoStart) {
        this.start();
      }
    }

    renderList() {
      this.section.insertAdjacentHTML('beforeend', '<ul class="projects" data-projects></ul>');
      this.projects = this.section.querySelector('ul[data-projects]');
    }

    renderCard(lang = document.documentElement.lang) {
      this.arr.forEach((element) => {
        const { name, visitBtn, description, features, used, pathImage, link } = element;
        const isObjPathImage =
          typeof pathImage === 'object' && typeof pathImage !== null && !Array.isArray(pathImage);
        this.projects.insertAdjacentHTML(
          'beforeend',
          `<li class="projects__item">
            <div>
              <div class="projects__links-head">
                <a href="${link}" target="_blank" class="projects-link">${name}</a>
                <a href="${link}" target="_blank" class="visit-website">${visitBtn[lang]}</a>
              </div>
              <p class="projects__description" adapt-language="description">
                ${description[lang]}
              </p>
            </div>
            <div class="projects__description">
              <h5>Features:</h5>
              <p adapt-language="features">${features[lang]}</p>
            </div>
            <div class="projects__description">
              <h5>Used:</h5>
              <span>${used}</span>
            </div>
            <div class="projects-thumbnail" data-project-image="${link}">
            <button class="projects-thumbnail__close" data-project-close>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 20 20"><path d="M2.93 17.07A9.97 9.97 0 0 1-.123 9.877c0-5.523 4.477-10 10-10a9.97 9.97 0 0 1 7.19 3.05l.003.003a9.96 9.96 0 0 1 2.807 6.947c0 5.523-4.477 10-10 10-2.7 0-5.151-1.07-6.95-2.81zm1.41-1.41A8.004 8.004 0 1 0 15.66 4.34 8.004 8.004 0 1 0 4.34 15.66m9.9-8.49L11.41 10l2.83 2.83-1.41 1.41L10 11.41l-2.83 2.83-1.41-1.41L8.59 10 5.76 7.17l1.41-1.41L10 8.59l2.83-2.83z"></path></svg>
            </button>
              <picture>
                ${isObjPathImage ? `<source srcset="${pathImage.srcsetWebp}" type="image/webp" />` : ''}
                ${
                  isObjPathImage && pathImage.srcsetJpg
                    ? `<source srcset="${pathImage.srcsetJpg}" type="image/jpg" />`
                    : ''
                }
                <img
                  src="${isObjPathImage ? pathImage.defaultSrc : pathImage}"
                  alt="Project images"
                  class="projects__img"
                  width="100%"
                  height="100%"
                />
              </picture>
            </div>
          </li>`
        );
      });
    }

    imgControl() {
      document.addEventListener('click', (event) => {
        const target = event.target;
        const image = target.closest('div[data-project-image]');
        const prevActive = this.projects.querySelector('div[data-project-image].active');
        const isCloseBtn = target.closest('[data-project-close]');

        if (isCloseBtn) {
          const closeImg = isCloseBtn.closest('div[data-project-image]');
          closeImg.classList.remove('active');
          setTimeout(() => {
            closeImg.style.zIndex = null;
          }, 250);
          return;
        }

        if (image && image === prevActive) {
          const link = image.getAttribute('data-project-image');
          image.classList.remove('active');
          setTimeout(() => {
            prevActive.style.zIndex = null;
            window.open(link, '_blank');
          }, 250);
          return;
        }

        if (prevActive) {
          prevActive.classList.remove('active');
          setTimeout(() => {
            prevActive.style.zIndex = null;
            image.style.zIndex = 10000;
            image.classList.add('active');
          }, 250);
          return;
        }

        if (image) {
          image.style.zIndex = 10000;
          image.classList.add('active');
        }
      });
    }

    langFn(lang) {
      const projectsItem = this.projects.querySelectorAll('.projects__item');
      projectsItem.forEach(el => {
        el.remove();
      });
      this.renderCard(lang);
    } 

    start() {
      this.renderList();
      this.renderCard();
      this.imgControl();
    }
  }

  // Загрузка и рендер проэктов
  async function loadProjects() {
    const res = await fetch('./main-json/projects.json');
    projects = await res.json();
    const projectsRender = await new ProjectsList({
      section: portfolio,
      arr: projects,
      autoStart: true,
    });
    return projectsRender;
  }

  let projectsRender ;
  loadProjects()
  .then(res => projectsRender = res)
  .catch(err => console.log(err)); // Загрузка и рендер проэктов

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
  // EVENTS END
});
