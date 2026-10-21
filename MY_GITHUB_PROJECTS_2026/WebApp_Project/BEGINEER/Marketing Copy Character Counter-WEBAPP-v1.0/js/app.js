/**
 * app.js — shared runtime for every page.
 *
 * Production concerns handled here:
 *   - theme preference (system / light / dark)
 *   - navigation state and the mobile drawer
 *   - storage availability banner
 *   - global error boundary (a failure must never leave a blank page)
 *   - service-worker registration with an explicit update prompt
 *   - version stamp
 *
 * No page-specific logic lives here.
 */

import { loadSettings, saveSettings, storageAvailable } from './storage.js';
import { VERSION_LABEL } from './version.js';
import { applyTheme, el, clear } from './ui.js';

export function initApp() {
  installErrorBoundary();
  applySavedTheme();
  markActiveNav();
  showStorageWarning();
  wireThemeToggle();
  wireNavDrawer();
  stampVersion();
  stampYear();
  reflectSavedCount();
  window.addEventListener('mccc:saved-changed', reflectSavedCount);
  registerServiceWorker();
}

/* ------------------------------------------------------------------ theme */

function applySavedTheme() {
  const settings = loadSettings();
  applyTheme(settings.theme ?? 'system');

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

/* --------------------------------------------------------------- chrome */

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

function stampVersion() {
  for (const node of document.querySelectorAll('[data-version]')) {
    node.textContent = VERSION_LABEL;
  }
}

function stampYear() {
  for (const node of document.querySelectorAll('[data-year]')) {
    node.textContent = String(new Date().getFullYear());
  }
}

function reflectSavedCount() {
  const badge = document.querySelector('[data-saved-count]');
  if (!badge) return;
  import('./storage.js').then(({ listSets }) => {
    const count = listSets().length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  });
}

/* ------------------------------------------------------- error boundary */

/**
 * Anything that escapes a handler is caught here and surfaced as a recoverable
 * banner. A production page must never go blank because one click threw.
 */
function installErrorBoundary() {
  const host = el('div', { className: 'boundary-host', dataset: { errorBoundary: 'true' } });
  document.body.prepend(host);

  let shown = 0;

  const report = (message, source) => {
    // Three is enough to see a repeated fault without covering the page.
    if (shown >= 3) return;
    shown += 1;

    const detail = String(message || 'Unknown error').slice(0, 300);
    host.append(
      el('div', { className: 'banner banner--error boundary', role: 'alert' }, [
        el('div', { className: 'boundary__body' }, [
          el('strong', { text: 'Something went wrong. ' }),
          'Your saved copy is safe. Reload to continue.',
          el('div', { className: 'boundary__detail' }, [
            el('span', { className: 'boundary__label', text: source ? `${source}: ` : '' }),
            el('code', { text: detail })
          ])
        ]),
        el('div', { className: 'boundary__actions' }, [
          el('button', {
            type: 'button',
            className: 'btn btn--small btn--primary',
            text: 'Reload',
            on: { click: () => window.location.reload() }
          }),
          el('button', {
            type: 'button',
            className: 'btn btn--small btn--ghost',
            text: 'Dismiss',
            on: {
              click: (event) => {
                event.target.closest('.boundary')?.remove();
              }
            }
          })
        ])
      ])
    );
  };

  window.addEventListener('error', (event) => {
    if (event.target instanceof HTMLElement) {
      report(`A file failed to load (${event.target.getAttribute('src') ?? event.target.getAttribute('href') ?? 'unknown'})`, 'Resource');
      return;
    }
    report(event.message, 'Script');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : event.reason;
    report(reason, 'Promise');
  });

  // Anything logged as an error by the app's own modules is a bug worth surfacing.
  window.addEventListener('mccc:fatal', (event) => report(event.detail?.message, 'App'));
}

/* ----------------------------------------------------- service worker */

/**
 * Offline support. Registration is best-effort: a browser without service
 * workers, an insecure origin, or a host that forbids the scope all fall through
 * silently, and the app keeps working online.
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const secure = window.isSecureContext || ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!secure) return;

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        // A controller means this page was already running an older worker.
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(registration);
        }
      });
    });
  } catch {
    // No offline support in this environment — not a user-facing problem.
  }
}

function showUpdateBanner(registration) {
  if (document.querySelector('[data-update-banner]')) return;

  const banner = el('div', { className: 'banner banner--info update-banner', dataset: { updateBanner: 'true' }, role: 'status' }, [
    el('div', { className: 'boundary__body' }, [
      el('strong', { text: 'A new version is available. ' }),
      'Reload to pick it up. Your saved copy stays where it is.'
    ]),
    el('div', { className: 'boundary__actions' }, [
      el('button', {
        type: 'button',
        className: 'btn btn--small btn--primary',
        text: 'Reload now',
        on: {
          click: () => {
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      }),
      el('button', {
        type: 'button',
        className: 'btn btn--small btn--ghost',
        text: 'Later',
        on: { click: () => banner.remove() }
      })
    ])
  ]);

  const host = document.querySelector('[data-error-boundary]');
  if (host) host.append(banner);
  else document.body.prepend(banner);
}
