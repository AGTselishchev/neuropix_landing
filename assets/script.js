'use strict';

const PRICES = window.NEUROPIX_PRICES || { services: {}, complexity: [], deadlines: [], quantityDiscounts: [], rounding: 1, locale: 'ru-RU', currency: 'RUB' };
const IMAGES = window.NEUROPIX_IMAGES || {};
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);
const safeIdentifier = (value) => /^[a-z0-9_-]+$/i.test(String(value || '')) ? String(value) : '';
const safePhotoPath = (value) => /^photo\/[a-z0-9._/-]+$/i.test(String(value || '')) ? String(value) : '';
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
const scrollProgress = document.querySelector('.scroll-progress');
const scrollProgressThumb = scrollProgress?.querySelector('.scroll-progress__thumb');
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);
const updateScrollProgress = () => {
  if (!scrollProgressThumb) return;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const progress = maxScroll ? window.scrollY / maxScroll : 0;
  const thumbHeight = scrollProgressThumb.getBoundingClientRect().height;
  const trackHeight = scrollProgress?.getBoundingClientRect().height || window.innerHeight;
  const maxThumbY = Math.max(0, trackHeight - thumbHeight);
  scrollProgressThumb.style.setProperty('--scroll-thumb-y', `${maxThumbY * progress}px`);
  scrollProgress?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
};
updateHeader();
updateScrollProgress();
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

const scrollToProgress = (clientY, behavior = 'smooth') => {
  if (!scrollProgress) return;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const rect = scrollProgress.getBoundingClientRect();
  const thumbHeight = scrollProgressThumb?.getBoundingClientRect().height || 0;
  const maxThumbY = Math.max(1, rect.height - thumbHeight);
  const progress = Math.min(1, Math.max(0, (clientY - rect.top - thumbHeight / 2) / maxThumbY));
  window.scrollTo({ top: progress * maxScroll, behavior });
};

let scrollPointerId = null;
scrollProgress?.addEventListener('pointerdown', (event) => {
  scrollPointerId = event.pointerId;
  scrollProgress.setPointerCapture?.(event.pointerId);
  scrollToProgress(event.clientY, 'auto');
});
scrollProgress?.addEventListener('pointermove', (event) => {
  if (scrollPointerId !== event.pointerId) return;
  scrollToProgress(event.clientY, 'auto');
});
const stopScrollPointer = (event) => {
  if (scrollPointerId !== event.pointerId) return;
  scrollPointerId = null;
  scrollProgress.releasePointerCapture?.(event.pointerId);
};
scrollProgress?.addEventListener('pointerup', stopScrollPointer);
scrollProgress?.addEventListener('pointercancel', stopScrollPointer);
scrollProgress?.addEventListener('keydown', (event) => {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const step = Math.max(120, window.innerHeight * .16);
  let top = window.scrollY;
  if (event.key === 'ArrowDown' || event.key === 'PageDown') top += step;
  else if (event.key === 'ArrowUp' || event.key === 'PageUp') top -= step;
  else if (event.key === 'Home') top = 0;
  else if (event.key === 'End') top = maxScroll;
  else return;
  event.preventDefault();
  window.scrollTo({ top: Math.min(maxScroll, Math.max(0, top)), behavior: 'smooth' });
});

// Decorative parallax scene: subtle dust, film and archival photo move with the page.
const parallaxObjects = [...document.querySelectorAll('[data-parallax-speed]')];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const renderParallax = (time) => {
  if (motionPreference.matches) {
    parallaxObjects.forEach((object) => object.style.setProperty('--parallax-y', '0px'));
    return;
  }
  const seconds = time / 1000;
  parallaxObjects.forEach((object, index) => {
    const speed = Number(object.dataset.parallaxSpeed) || 0;
    const drift = Number(object.dataset.parallaxDrift) || 0;
    const y = window.scrollY * speed + Math.sin(seconds * (.55 + index * .16) + index) * drift;
    object.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
  });
  requestAnimationFrame(renderParallax);
};
if (parallaxObjects.length && !motionPreference.matches) requestAnimationFrame(renderParallax);

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

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
      <p>${escapeHTML(service.name)}</p>
      <div class="price-card__price"><span>${escapeHTML(service.pricePrefix || '')}</span><strong>${escapeHTML(formatRub(service.basePrice))}</strong><small>/ ${escapeHTML(service.unit)}</small></div>
      <ul>${(service.features || []).map((feature) => `<li>${escapeHTML(feature)}</li>`).join('')}</ul>
      <button class="text-button" type="button" data-open-calculator data-service="${safeIdentifier(id)}">Добавить в расчёт →</button>
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
    .map(([id, service]) => `<option value="${escapeHTML(service.name)}" data-service-id="${safeIdentifier(id)}">${escapeHTML(service.name)}</option>`)
    .join('');
}

// Before / after gallery. Images remain natural; only their appearance is animated.
const comparisonMarkup = (pair, index) => `
  <figure class="compare-card">
    <div class="compare" data-compare style="--position:50%">
      <div class="compare__placeholder">Добавьте файлы<br><code>${escapeHTML(pair.before)}</code><br><code>${escapeHTML(pair.after)}</code></div>
      <img class="compare__image compare__image--before" src="${safePhotoPath(pair.before)}" alt="${escapeHTML(pair.title)}: до" loading="lazy">
      <div class="compare__after"><img class="compare__image" src="${safePhotoPath(pair.after)}" alt="${escapeHTML(pair.title)}: после" loading="lazy"></div>
      <span class="compare__label compare__label--before">До</span>
      <span class="compare__label compare__label--after">После</span>
      <span class="compare__line" aria-hidden="true"></span>
      <input class="compare__range" type="range" min="0" max="100" value="50" aria-label="Сравнить до и после, пример ${index + 1}">
    </div>
    <figcaption>${escapeHTML(pair.title)}</figcaption>
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
  const update = () => {
    const position = Number(range.value) || 0;
    element.style.setProperty('--position', `${position}%`);
    element.style.setProperty('--before-label-opacity', (0.25 + position / 100 * 0.75).toFixed(2));
    element.style.setProperty('--after-label-opacity', (0.25 + (100 - position) / 100 * 0.75).toFixed(2));
  };
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

// Reveal page elements on every entry into the viewport, including gallery images.
const revealItems = document.querySelectorAll('.reveal');
const floatingTimers = new WeakMap();
revealItems.forEach((item) => {
  const delay = Number(item.dataset.delay);
  if (Number.isFinite(delay)) item.style.transitionDelay = `${delay}ms`;
});
const replayLoadedImages = (item) => {
  item.querySelectorAll('.compare__image').forEach((image) => {
    if (!image.complete || !image.naturalWidth) return;
    image.classList.remove('is-loaded');
    void image.offsetWidth;
    image.classList.add('is-loaded');
  });
};
const showReveal = (item) => {
  const previousTimer = floatingTimers.get(item);
  if (previousTimer) window.clearTimeout(previousTimer);
  item.classList.remove('is-visible', 'is-floating');
  requestAnimationFrame(() => {
    item.classList.add('is-visible');
    replayLoadedImages(item);
    const timer = window.setTimeout(() => {
      if (item.classList.contains('is-visible')) item.classList.add('is-floating');
    }, 1200);
    floatingTimers.set(item, timer);
  });
};
const hideReveal = (item) => {
  const previousTimer = floatingTimers.get(item);
  if (previousTimer) window.clearTimeout(previousTimer);
  item.classList.remove('is-visible', 'is-floating');
};
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        showReveal(entry.target);
      } else {
        hideReveal(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '-8% 0px -8% 0px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach(showReveal);
}

// Testimonials carousel
const testimonials = document.querySelector('[data-testimonials]');
const testimonialTrack = testimonials?.querySelector('.testimonials-track');
const testimonialCards = testimonials ? [...testimonials.querySelectorAll('.testimonial-card')] : [];
const testimonialDots = testimonials?.querySelector('[data-testimonial-dots]');
const testimonialPrev = testimonials?.querySelector('[data-testimonial-prev]');
const testimonialNext = testimonials?.querySelector('[data-testimonial-next]');
let testimonialIndex = 0;

const getVisibleTestimonials = () => {
  if (window.matchMedia('(max-width: 620px)').matches) return 1;
  if (window.matchMedia('(max-width: 820px)').matches) return 2;
  return 3;
};

const renderTestimonialDots = () => {
  if (!testimonialDots) return;
  const dotCount = Math.max(1, testimonialCards.length - getVisibleTestimonials() + 1);
  testimonialDots.innerHTML = '';
  Array.from({ length: dotCount }, (_, index) => {
    const dot = document.createElement('button');
    dot.className = 'testimonial-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Показать отзывы ${index + 1}–${Math.min(index + getVisibleTestimonials(), testimonialCards.length)}`);
    dot.addEventListener('click', () => updateTestimonials(index));
    testimonialDots.appendChild(dot);
  });
};

const updateTestimonials = (nextIndex = testimonialIndex) => {
  if (!testimonialTrack || !testimonialCards.length) return;
  const visible = getVisibleTestimonials();
  const maxIndex = Math.max(0, testimonialCards.length - visible);
  testimonialIndex = Math.min(Math.max(nextIndex, 0), maxIndex);
  const cardStep = testimonialCards[0].getBoundingClientRect().width + 16;
  testimonialTrack.style.transform = `translateX(-${testimonialIndex * cardStep}px)`;
  testimonialCards.forEach((card, index) => card.setAttribute('aria-hidden', String(index < testimonialIndex || index >= testimonialIndex + visible)));
  testimonialDots?.querySelectorAll('button').forEach((dot, index) => {
    const active = index === testimonialIndex;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-current', active ? 'true' : 'false');
  });
  if (testimonialPrev) testimonialPrev.disabled = testimonialIndex === 0;
  if (testimonialNext) testimonialNext.disabled = testimonialIndex === maxIndex;
};

if (testimonials && testimonialTrack) {
  renderTestimonialDots();
  testimonialPrev?.addEventListener('click', () => updateTestimonials(testimonialIndex - 1));
  testimonialNext?.addEventListener('click', () => updateTestimonials(testimonialIndex + 1));
  window.addEventListener('resize', () => {
    renderTestimonialDots();
    updateTestimonials();
  });
  updateTestimonials();
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
  calcDeadline.innerHTML = PRICES.deadlines.map((item) => `<option value="${safeIdentifier(item.id)}">${escapeHTML(item.name)}${item.multiplier !== 1 ? ` × ${escapeHTML(item.multiplier)}` : ''}</option>`).join('');
}

const serviceOptions = (selected = '') => Object.entries(PRICES.services).map(([id, service]) =>
  `<option value="${safeIdentifier(id)}" ${id === selected ? 'selected' : ''}>${escapeHTML(service.name)} — ${escapeHTML(formatRub(service.basePrice))} / ${escapeHTML(service.unit)}</option>`
).join('');

const complexityOptions = () => PRICES.complexity.map((item) =>
  `<option value="${safeIdentifier(item.id)}">${escapeHTML(item.name)}${item.multiplier !== 1 ? ` × ${escapeHTML(item.multiplier)}` : ''}</option>`
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

// Static form for GitHub Pages → Google Apps Script → Google Sheets.
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const formStartedAt = document.querySelector('#form-started-at');
const resetFormTimer = () => {
  if (formStartedAt) formStartedAt.value = String(Date.now());
};
resetFormTimer();
contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const formData = new FormData(contactForm);
  if (String(formData.get('website') || '').trim()) return;
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const payload = new URLSearchParams({
    name: String(formData.get('name') || '').trim().slice(0, 120),
    contact: String(formData.get('contact') || '').trim().slice(0, 200),
    service: String(formData.get('service') || '').trim().slice(0, 120),
    message: String(formData.get('message') || '').trim().slice(0, 2000),
    theme: ['night', 'urban', 'archive'].includes(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : 'night',
    consent: String(formData.get('consent') || ''),
    website: '',
    startedAt: String(formData.get('startedAt') || '')
  });
  if (submitButton) submitButton.disabled = true;
  if (formStatus) formStatus.textContent = 'Сохраняем заявку…';
  try {
    await fetch(contactForm.action, { method:'POST', mode:'no-cors', body:payload, keepalive:true, referrerPolicy:'no-referrer' });
    contactForm.reset();
    resetFormTimer();
    if (formStatus) formStatus.textContent = 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.';
  } catch (error) {
    if (formStatus) formStatus.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз.';
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
