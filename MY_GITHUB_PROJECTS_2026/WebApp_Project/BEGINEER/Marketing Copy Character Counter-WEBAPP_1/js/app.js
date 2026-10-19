/**
 * app.js — shared page behaviour for every page.
 *
 * Handles the theme (system/light/dark), navigation state, the storage
 * availability banner, and the footer year. No page-specific logic lives here.
 */

import { loadSettings, saveSettings, storageAvailable } from './storage.js';
import { applyTheme, el, clear } from './ui.js';

export function initApp() {
  applySavedTheme();
  markActiveNav();
  showStorageWarning();
  wireThemeToggle();
  wireNavDrawer();
  stampYear();
  reflectSavedCount();
  window.addEventListener('mccc:saved-changed', reflectSavedCount);
}

function applySavedTheme() {
  const settings = loadSettings();
  applyTheme(settings.theme ?? 'system');

  // Follow OS changes while the preference is "system".
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change', () => {
    if (loadSettings().theme === 'system') applyTheme('system');
  });
}

function wireThemeToggle() {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  const order = ['system', 'light', 'dark'];
  const labels = { system: 'Theme: system', light: 'Theme: light', dark: 'Theme: dark' };
  const icons = { system: '◐', light: '☀', dark: '☾' };

  const render = () => {
    const theme = loadSettings().theme ?? 'system';
    button.textContent = `${icons[theme]} ${labels[theme]}`;
    button.setAttribute('aria-label', `${labels[theme]}. Activate to change.`);
  };

  button.addEventListener('click', () => {
    const current = loadSettings().theme ?? 'system';
    const next = order[(order.indexOf(current) + 1) % order.length];
    const settings = loadSettings();
    saveSettings({ ...settings, theme: next });
    applyTheme(next);
    render();
  });

  render();
}

function markActiveNav() {
  const page = document.body.dataset.page;
  for (const link of document.querySelectorAll('[data-nav-link]')) {
    const isActive = link.dataset.navLink === page;
    link.classList.toggle('is-active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
  }
}

function wireNavDrawer() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('a')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function showStorageWarning() {
  const host = document.querySelector('[data-storage-warning]');
  if (!host) return;
  clear(host);
  if (storageAvailable()) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.append(
    el('div', { className: 'banner banner--error', role: 'alert' }, [
      el('strong', { text: 'Local storage is unavailable. ' }),
      'Saving, working-copy recovery and import/export history are disabled in this browser session. Counting and analysis still work.'
    ])
  );
}

function stampYear() {
  for (const node of document.querySelectorAll('[data-year]')) {
    node.textContent = String(new Date().getFullYear());
  }
}

function reflectSavedCount() {
  const badge = document.querySelector('[data-saved-count]');
  if (!badge) return;
  // Imported lazily to keep app.js free of set-management logic at load time.
  import('./storage.js').then(({ listSets }) => {
    const count = listSets().length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
}
