'use strict';

(() => {
  const STORAGE_KEY = 'neuropix-theme';
  const themes = {
    night: { label: 'Ночной AI', description: 'Тёмный технологичный стиль с фиолетово-бирюзовыми акцентами.', dot: '#8b5cf6' },
    urban: { label: 'Eco Circuit', description: 'Биофильный городской стиль: лесной графит, мята, лайм и живые линии экосети.', dot: '#c7e85b' },
    archive: { label: 'Archive 1920–30', description: 'Тёплая бумага, сепия и спокойная типографика для семейных архивов.', dot: '#a8754e' }
  };
  const validTheme = (value) => Object.prototype.hasOwnProperty.call(themes, value) ? value : 'night';
  const readTheme = () => {
    try { return validTheme(window.localStorage.getItem(STORAGE_KEY)); } catch (error) { return 'night'; }
  };
  const writeTheme = (theme) => {
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch (error) { /* Storage may be unavailable in private mode. */ }
  };

  const applyTheme = (theme) => {
    const nextTheme = validTheme(theme);
    document.documentElement.dataset.theme = nextTheme;
    document.querySelectorAll('.theme-switcher__label b').forEach((node) => { node.textContent = themes[nextTheme].label; });
    document.querySelectorAll('.theme-switcher__dot').forEach((node) => { node.style.background = themes[nextTheme].dot; });
    document.querySelectorAll('[data-theme-card]').forEach((card) => {
      const selected = card.dataset.themeCard === nextTheme;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-checked', String(selected));
    });
    document.dispatchEvent(new CustomEvent('neuropix:themechange', { detail: { theme: nextTheme } }));
    return nextTheme;
  };

  const pickerMarkup = `
    <div class="theme-picker" id="theme-picker" role="dialog" aria-modal="true" aria-labelledby="theme-picker-title" aria-describedby="theme-picker-description" hidden>
      <div class="theme-picker__backdrop" data-theme-dismiss></div>
      <section class="theme-picker__panel">
        <p class="theme-picker__eyebrow">NEUROPIX AI</p>
        <h2 id="theme-picker-title">Выберите стиль сайта</h2>
        <p class="theme-picker__description" id="theme-picker-description">Выберите настроение интерфейса. Содержимое сайта и услуги останутся теми же.</p>
        <div class="theme-picker__cards" role="radiogroup" aria-label="Стиль сайта">
          <button class="theme-card theme-card--night" type="button" role="radio" aria-checked="false" data-theme-card="night">
            <span class="theme-card__preview"><img src="assets/IMG/theme-night-preview.svg" alt="" aria-hidden="true"></span>
            <span class="theme-card__title">Ночной AI</span>
            <span class="theme-card__text">Технологичный тёмный интерфейс</span>
            <span class="theme-card__check" aria-hidden="true">✓</span>
          </button>
          <button class="theme-card theme-card--urban" type="button" role="radio" aria-checked="false" data-theme-card="urban">
            <span class="theme-card__preview"><img src="assets/IMG/theme-urban-preview.svg" alt="" aria-hidden="true"></span>
            <span class="theme-card__title">Eco Circuit</span>
            <span class="theme-card__text">Экологичный город, органичные формы и живой акцент</span>
            <span class="theme-card__check" aria-hidden="true">✓</span>
          </button>
          <button class="theme-card theme-card--archive" type="button" role="radio" aria-checked="false" data-theme-card="archive">
            <span class="theme-card__preview"><img src="assets/IMG/theme-archive-preview.svg" alt="" aria-hidden="true"></span>
            <span class="theme-card__title">Archive 1920–30</span>
            <span class="theme-card__text">Тёплая фотобумага и высокая читаемость</span>
            <span class="theme-card__check" aria-hidden="true">✓</span>
          </button>
        </div>
        <div class="theme-picker__footer"><p>Дизайн можно сменить в меню в любой момент.</p><button class="button theme-picker__continue" type="button" data-theme-continue>Продолжить</button></div>
      </section>
    </div>`;

  const init = () => {
    const savedTheme = (() => {
      try { return window.localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
    })();
    const initialTheme = applyTheme(savedTheme || document.documentElement.dataset.theme || 'night');
    document.body.insertAdjacentHTML('beforeend', pickerMarkup);
    const picker = document.querySelector('#theme-picker');
    const cards = [...document.querySelectorAll('[data-theme-card]')];
    const openButtons = [...document.querySelectorAll('[data-theme-open]')];
    const continueButton = picker?.querySelector('[data-theme-continue]');
    let draftTheme = initialTheme;
    let firstVisit = !savedTheme;
    let lastFocusedElement = null;

    const syncPicker = () => {
      cards.forEach((card) => {
        const selected = card.dataset.themeCard === draftTheme;
        card.classList.toggle('is-selected', selected);
        card.setAttribute('aria-checked', String(selected));
      });
    };
    const openPicker = (isFirstVisit = false) => {
      firstVisit = isFirstVisit;
      draftTheme = validTheme(document.documentElement.dataset.theme || initialTheme);
      lastFocusedElement = document.activeElement;
      picker.hidden = false;
      requestAnimationFrame(() => picker.classList.add('is-open'));
      document.body.classList.add('theme-picker-open');
      syncPicker();
      cards.find((card) => card.dataset.themeCard === draftTheme)?.focus();
    };
    const closePicker = (commit = true) => {
      if (commit) {
        writeTheme(draftTheme);
        applyTheme(draftTheme);
      } else {
        applyTheme(savedTheme || 'night');
      }
      picker.classList.remove('is-open');
      document.body.classList.remove('theme-picker-open');
      window.setTimeout(() => { picker.hidden = true; }, 180);
      if (!firstVisit && lastFocusedElement?.focus) lastFocusedElement.focus();
    };

    openButtons.forEach((button) => button.addEventListener('click', () => openPicker(false)));
    cards.forEach((card) => card.addEventListener('click', () => {
      draftTheme = validTheme(card.dataset.themeCard);
      applyTheme(draftTheme);
      syncPicker();
    }));
    continueButton?.addEventListener('click', () => closePicker(true));
    picker?.querySelector('[data-theme-dismiss]')?.addEventListener('click', () => {
      if (!firstVisit) closePicker(false);
    });
    picker?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !firstVisit) closePicker(false);
      if (event.key !== 'Tab') return;
      const focusable = [...picker.querySelectorAll('button:not([disabled])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    if (!savedTheme) openPicker(true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
