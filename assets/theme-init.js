'use strict';

(() => {
  const allowedThemes = new Set(['night', 'urban', 'archive']);
  try {
    const savedTheme = window.localStorage.getItem('neuropix-theme');
    if (allowedThemes.has(savedTheme)) document.documentElement.dataset.theme = savedTheme;
  } catch (error) {
    // The default theme remains active when storage is unavailable.
  }
})();
