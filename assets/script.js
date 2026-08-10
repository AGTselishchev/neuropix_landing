'use strict';

const PRICES = window.NEUROPIX_PRICES || { services: {}, complexity: [], deadlines: [], quantityDiscounts: [], rounding: 1, locale: 'ru-RU', currency: 'RUB' };
const IMAGES = window.NEUROPIX_IMAGES || {};
const root = document.documentElement;

const formatRub = (value) => new Intl.NumberFormat(PRICES.locale || 'ru-RU', {
  style: 'currency',
  currency: PRICES.currency || 'RUB',
  maximumFractionDigits: 0
}).format(value || 0);

const getDiscount = (quantity) => {
  const sorted = [...(PRICES.quantityDiscounts || [])].sort((a, b) => b.min - a.min);
  return sorted.find((item) => quantity >= item.min)?.percent || 0;
};

const roundPrice = (value) => {
  const step = Number(PRICES.rounding) || 1;
  return Math.round(value / step) * step;
};

// Header / menu
const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

// Theme. The page is fully theme-aware: contrast sections, footer, calculator and map overlay
// remain in the same light/dark family instead of switching to the opposite theme.
const themeButton = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const savedTheme = localStorage.getItem('neuropix-theme');
root.dataset.theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';

const syncThemeUI = () => {
  const dark = root.dataset.theme === 'dark';
  if (themeButton) {
    themeButton.textContent = dark ? '☀' : '◐';
    themeButton.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    themeButton.setAttribute('title', dark ? 'Светлая тема' : 'Тёмная тема');
  }
  themeMeta?.setAttribute('content', dark ? '#0c0e13' : '#e3e5ea');
};
syncThemeUI();

themeButton?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('neuropix-theme', root.dataset.theme);
  syncThemeUI();
});

// Prices on page
Object.entries(PRICES.services).forEach(([id, service]) => {
  document.querySelectorAll(`[data-price="${id}"]`).forEach((node) => {
    node.textContent = `${service.pricePrefix || ''} ${formatRub(service.basePrice)} / ${service.unit}`.trim();
  });
});

const pricingGrid = document.querySelector('#pricing-grid');
if (pricingGrid) {
  pricingGrid.innerHTML = Object.entries(PRICES.services).map(([id, service]) => `
    <article class="price-card reveal">
      <p>${service.name}</p>
      <div class="price-card__price"><span>${service.pricePrefix || ''}</span><strong>${formatRub(service.basePrice)}</strong><small>/ ${service.unit}</small></div>
      <ul>${(service.features || []).map((feature) => `<li>${feature}</li>`).join('')}</ul>
      <button class="text-button" type="button" data-open-calculator data-service="${id}">Добавить в расчёт →</button>
    </article>
  `).join('');
}

const discountNote = document.querySelector('#discount-note');
if (discountNote && PRICES.quantityDiscounts?.length) {
  discountNote.textContent = [...PRICES.quantityDiscounts]
    .sort((a, b) => a.min - b.min)
    .map((item) => `от ${item.min} фото — ${item.percent}%`)
    .join(' · ');
}

const contactService = document.querySelector('#contact-service');
if (contactService) {
  contactService.innerHTML = Object.entries(PRICES.services)
    .map(([id, service]) => `<option value="${service.name}" data-service-id="${id}">${service.name}</option>`)
    .join('');
}

// Before / after gallery. No image filters, animation or hover effects are applied.
const comparisonMarkup = (pair, index) => `
  <figure class="compare-card">
    <div class="compare" data-compare style="--position:50%">
      <div class="compare__placeholder">Добавьте файлы<br><code>${pair.before}</code><br><code>${pair.after}</code></div>
      <img class="compare__image compare__image--before" src="${pair.before}" alt="${pair.title}: до" loading="lazy">
      <div class="compare__after"><img class="compare__image" src="${pair.after}" alt="${pair.title}: после" loading="lazy"></div>
      <span class="compare__label compare__label--before">До</span>
      <span class="compare__label compare__label--after">После</span>
      <span class="compare__line" aria-hidden="true"></span>
      <input class="compare__range" type="range" min="0" max="100" value="50" aria-label="Сравнить до и после, пример ${index + 1}">
    </div>
    <figcaption>${pair.title}</figcaption>
  </figure>`;

Object.entries(IMAGES).forEach(([serviceId, pairs]) => {
  const gallery = document.querySelector(`[data-gallery="${serviceId}"]`);
  if (gallery) gallery.innerHTML = pairs.map(comparisonMarkup).join('');
});

const heroCompare = document.querySelector('[data-hero-compare]');
const heroPair = IMAGES.restoration?.[0];
if (heroCompare && heroPair) {
  heroCompare.outerHTML = comparisonMarkup(heroPair, 0).replace('<figure class="compare-card">', '<figure class="compare-card compare-card--hero">');
}

const setupComparison = (element) => {
  const range = element.querySelector('.compare__range');
  if (!range) return;
  const update = () => element.style.setProperty('--position', `${range.value}%`);
  range.addEventListener('input', update);
  update();

  element.querySelectorAll('img').forEach((img) => {
    img.addEventListener('load', () => img.classList.add('is-loaded'));
    img.addEventListener('error', () => {
      img.hidden = true;
      element.classList.add('has-missing-image');
    });
  });
};
document.querySelectorAll('[data-compare]').forEach(setupComparison);

// Reveal simple page elements (not the before/after images).
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Calculator window
const calcWindow = document.querySelector('#calculator-window');
const calcBody = document.querySelector('#calculator-body');
const calcItems = document.querySelector('#calc-items');
const calcAdd = document.querySelector('#calc-add-service');
const calcDeadline = document.querySelector('#calc-deadline');
const calcTotal = document.querySelector('#calc-total');
const calcDiscount = document.querySelector('#calc-discount');
const calcClose = document.querySelector('#calculator-close');
const calcMinimize = document.querySelector('#calculator-minimize');
const calcClear = document.querySelector('#calc-clear');
const calcOrder = document.querySelector('#calc-order');
const dragHandle = document.querySelector('#calculator-drag-handle');
let calcRowCounter = 0;

if (calcDeadline) {
  calcDeadline.innerHTML = PRICES.deadlines.map((item) => `<option value="${item.id}">${item.name}${item.multiplier !== 1 ? ` × ${item.multiplier}` : ''}</option>`).join('');
}

const serviceOptions = (selected = '') => Object.entries(PRICES.services).map(([id, service]) =>
  `<option value="${id}" ${id === selected ? 'selected' : ''}>${service.name} — ${formatRub(service.basePrice)} / ${service.unit}</option>`
).join('');

const complexityOptions = () => PRICES.complexity.map((item) =>
  `<option value="${item.id}">${item.name}${item.multiplier !== 1 ? ` × ${item.multiplier}` : ''}</option>`
).join('');

const addCalcRow = (serviceId = '') => {
  if (!calcItems) return;
  const id = ++calcRowCounter;
  const fallbackService = serviceId && PRICES.services[serviceId] ? serviceId : Object.keys(PRICES.services)[0];
  const row = document.createElement('div');
  row.className = 'calc-item';
  row.dataset.rowId = String(id);
  row.innerHTML = `
    <div class="calc-item__head"><strong>Услуга ${calcItems.children.length + 1}</strong><button type="button" class="calc-item__remove" aria-label="Удалить услугу">Удалить</button></div>
    <label>Услуга<select class="calc-item__service">${serviceOptions(fallbackService)}</select></label>
    <div class="calc-item__grid">
      <label>Количество<input class="calc-item__quantity" type="number" min="1" step="1" value="1" inputmode="numeric"></label>
      <label>Сложность<select class="calc-item__complexity">${complexityOptions()}</select></label>
    </div>
    <div class="calc-item__subtotal"><span>Подытог</span><strong>—</strong></div>`;
  calcItems.appendChild(row);
  row.querySelectorAll('select,input').forEach((control) => control.addEventListener('input', recalculate));
  row.querySelector('.calc-item__remove')?.addEventListener('click', () => {
    row.remove();
    renumberCalcRows();
    if (!calcItems.children.length) addCalcRow();
    recalculate();
  });
  renumberCalcRows();
  recalculate();
};

const renumberCalcRows = () => {
  calcItems?.querySelectorAll('.calc-item').forEach((row, index) => {
    const title = row.querySelector('.calc-item__head strong');
    if (title) title.textContent = `Услуга ${index + 1}`;
  });
};

function recalculate() {
  if (!calcItems) return;
  const deadlineId = calcDeadline?.value || PRICES.deadlines[0]?.id;
  const deadlineMultiplier = PRICES.deadlines.find((item) => item.id === deadlineId)?.multiplier || 1;
  let total = 0;
  const summaries = [];
  const discountsUsed = new Set();

  calcItems.querySelectorAll('.calc-item').forEach((row) => {
    const serviceId = row.querySelector('.calc-item__service')?.value;
    const service = PRICES.services[serviceId];
    const quantity = Math.max(1, Number(row.querySelector('.calc-item__quantity')?.value) || 1);
    const complexityId = row.querySelector('.calc-item__complexity')?.value;
    const complexity = PRICES.complexity.find((item) => item.id === complexityId)?.multiplier || 1;
    const discountPercent = getDiscount(quantity);
    const discount = discountPercent / 100;
    if (discountPercent) discountsUsed.add(discountPercent);
    const subtotal = roundPrice(service.basePrice * quantity * complexity * deadlineMultiplier * (1 - discount));
    total += subtotal;
    const subtotalNode = row.querySelector('.calc-item__subtotal strong');
    if (subtotalNode) subtotalNode.textContent = formatRub(subtotal);
    summaries.push(`${service.shortName || service.name}: ${quantity} × ${formatRub(service.basePrice)} = ${formatRub(subtotal)}`);
  });

  if (calcTotal) calcTotal.textContent = formatRub(total);
  if (calcDiscount) calcDiscount.textContent = discountsUsed.size
    ? `В строках расчёта учтены скидки: ${[...discountsUsed].sort((a, b) => a - b).map((v) => `${v}%`).join(', ')}.`
    : 'Пакетная скидка применяется автоматически по количеству внутри каждой услуги.';
  if (calcOrder) {
    calcOrder.dataset.summary = `${summaries.join('\n')}\nСрок: ${PRICES.deadlines.find((item) => item.id === deadlineId)?.name || ''}\nИтого: ${formatRub(total)}`;
  }
}

calcAdd?.addEventListener('click', () => addCalcRow());
calcDeadline?.addEventListener('input', recalculate);
calcClear?.addEventListener('click', () => {
  if (calcItems) calcItems.innerHTML = '';
  if (calcDeadline) calcDeadline.selectedIndex = 0;
  addCalcRow();
});

const clampCalculator = () => {
  if (!calcWindow || !calcWindow.classList.contains('is-open')) return;
  const rect = calcWindow.getBoundingClientRect();
  const margin = 8;
  let left = rect.left;
  let top = rect.top;
  left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - rect.width - margin));
  top = Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - rect.height - margin));
  calcWindow.style.left = `${left}px`;
  calcWindow.style.top = `${top}px`;
};

const centerCalculator = () => {
  if (!calcWindow) return;
  calcWindow.style.left = `${Math.max(8, (window.innerWidth - Math.min(650, window.innerWidth - 24)) / 2)}px`;
  calcWindow.style.top = `${Math.max(8, window.innerHeight * 0.05)}px`;
};

const openCalculator = (serviceId = '') => {
  if (!calcWindow) return;
  calcWindow.classList.add('is-open');
  calcWindow.classList.remove('is-minimized');
  calcWindow.setAttribute('aria-hidden', 'false');
  if (calcMinimize) calcMinimize.textContent = '−';
  if (!calcItems?.children.length) addCalcRow(serviceId);
  else if (serviceId) addCalcRow(serviceId);
  centerCalculator();
  recalculate();
};

const closeCalculator = () => {
  calcWindow?.classList.remove('is-open', 'is-minimized');
  calcWindow?.setAttribute('aria-hidden', 'true');
};

document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open-calculator]');
  if (!opener) return;
  openCalculator(opener.dataset.service || '');
});
calcClose?.addEventListener('click', closeCalculator);
calcMinimize?.addEventListener('click', () => {
  if (!calcWindow) return;
  const minimized = calcWindow.classList.toggle('is-minimized');
  calcMinimize.textContent = minimized ? '+' : '−';
  calcMinimize.setAttribute('aria-label', minimized ? 'Развернуть калькулятор' : 'Свернуть калькулятор');
  requestAnimationFrame(clampCalculator);
});

// Drag calculator by its header (mouse / pen / touch).
let dragState = null;
dragHandle?.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button') || !calcWindow) return;
  const rect = calcWindow.getBoundingClientRect();
  dragState = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, pointerId: event.pointerId };
  dragHandle.setPointerCapture(event.pointerId);
  calcWindow.classList.add('is-dragging');
  event.preventDefault();
});
dragHandle?.addEventListener('pointermove', (event) => {
  if (!dragState || !calcWindow || event.pointerId !== dragState.pointerId) return;
  const rect = calcWindow.getBoundingClientRect();
  const margin = 8;
  const nextLeft = dragState.left + event.clientX - dragState.x;
  const nextTop = dragState.top + event.clientY - dragState.y;
  calcWindow.style.left = `${Math.min(Math.max(margin, nextLeft), Math.max(margin, window.innerWidth - rect.width - margin))}px`;
  calcWindow.style.top = `${Math.min(Math.max(margin, nextTop), Math.max(margin, window.innerHeight - rect.height - margin))}px`;
});
const finishDrag = (event) => {
  if (!dragState || !calcWindow) return;
  if (event?.pointerId && event.pointerId !== dragState.pointerId) return;
  dragState = null;
  calcWindow.classList.remove('is-dragging');
};
dragHandle?.addEventListener('pointerup', finishDrag);
dragHandle?.addEventListener('pointercancel', finishDrag);
window.addEventListener('resize', clampCalculator);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && calcWindow?.classList.contains('is-open')) closeCalculator();
});

calcOrder?.addEventListener('click', () => {
  const messageField = document.querySelector('#contact-form textarea[name="message"]');
  if (messageField) messageField.value = `Расчёт с сайта:\n${calcOrder.dataset.summary || ''}\n\nДополнительные детали: `;
  closeCalculator();
  document.querySelector('#contacts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Static form for GitHub Pages.
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const formData = new FormData(contactForm);
  const recipient = contactForm.dataset.email || 'yourmail@example.com';
  const subject = `Заявка с сайта NEUROPIX: ${formData.get('service')}`;
  const body = [`Имя: ${formData.get('name')}`, `Контакт: ${formData.get('contact')}`, `Услуга: ${formData.get('service')}`, '', String(formData.get('message') || '')].join('\n');
  if (formStatus) formStatus.textContent = 'Открываем почтовую программу…';
  window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
