/**
 * ui.js — accessible feedback helpers shared by every page.
 *
 * No template strings that interpolate user copy: everything is built with
 * createElement + textContent, so pasted marketing text can never become markup.
 */

import { STATUS_LABELS, STATUS } from './counter.js';

/** Create an element with attributes, properties and children. */
export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  const { className, text, html, dataset, on, ...attributes } = options;

  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  if (html !== undefined) node.innerHTML = html; // only for trusted, static strings
  if (dataset) {
    for (const [key, value] of Object.entries(dataset)) node.dataset[key] = value;
  }
  if (on) {
    for (const [event, handler] of Object.entries(on)) node.addEventListener(event, handler);
  }
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'value') node.value = String(value);
    else if (key === 'checked' || key === 'disabled' || key === 'readOnly' || key === 'selected') node[key] = Boolean(value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Status pill. `beyond` is neutral-warning, not an error. */
export function statusPill(status, labelOverride) {
  const label = labelOverride ?? STATUS_LABELS[status] ?? status;
  return el('span', {
    className: `pill pill--${status}`,
    text: label,
    dataset: { status }
  });
}

/**
 * Length meter: a progress bar that caps visually at 100% but keeps an
 * over-limit stripe so users can see how far over they are.
 */
export function meter({ count, limit, status, label }) {
  const percent = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
  const bar = el('div', { className: 'meter__fill', dataset: { status } });
  bar.style.width = `${percent}%`;

  return el(
    'div',
    {
      className: 'meter',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': String(limit),
      'aria-valuenow': String(count),
      'aria-valuetext': `${count} of ${limit} characters, ${STATUS_LABELS[status] ?? status}`,
      'aria-label': label ?? 'Character usage'
    },
    [bar]
  );
}

/** Screen-reader announcement region (polite by default). */
let liveRegion;
export function announce(message, assertive = false) {
  if (!liveRegion) {
    liveRegion = el('div', {
      className: 'visually-hidden',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    });
    document.body.append(liveRegion);
  }
  liveRegion.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  liveRegion.textContent = '';
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 40);
}

/** Small centred toast for confirms and failures. */
export function toast(message, tone = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const node = el('div', { className: `toast toast--${tone}`, role: 'status', text: message });
  document.body.append(node);
  window.setTimeout(() => node.classList.add('toast--visible'), 10);
  window.setTimeout(() => {
    node.classList.remove('toast--visible');
    window.setTimeout(() => node.remove(), 250);
  }, 3200);
}

/** "1 word" / "3 words" — used everywhere a count is shown to a person. */
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

/** Copy text to the clipboard with a fallback for older/insecure contexts. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = el('textarea', { className: 'visually-hidden', value: text });
    area.setAttribute('readonly', '');
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok ? { ok: true } : { ok: false, error: 'Copy failed — select the text manually.' };
  } catch {
    return { ok: false, error: 'Copy failed — select the text manually.' };
  }
}

/** Download a Blob under a filename. */
export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = el('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Accessible confirmation that never uses window.confirm. */
export function confirmAction({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement;

    const close = (result) => {
      dialog.remove();
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
      resolve(result);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      }
      if (event.key === 'Tab') {
        const focusable = dialog.querySelectorAll('button, [href], input, select, textarea');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const dialog = el(
      'div',
      {
        className: 'dialog-backdrop',
        on: {
          click: (event) => {
            if (event.target === dialog) close(false);
          }
        }
      },
      [
        el('div', { className: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title' }, [
          el('h2', { className: 'dialog__title', id: 'dialog-title', text: title }),
          el('p', { className: 'dialog__body', text: body }),
          el('div', { className: 'dialog__actions' }, [
            el('button', {
              type: 'button',
              className: 'btn btn--ghost',
              text: cancelLabel,
              on: { click: () => close(false) }
            }),
            el('button', {
              type: 'button',
              className: `btn ${danger ? 'btn--danger' : 'btn--primary'}`,
              text: confirmLabel,
              on: { click: () => close(true) }
            })
          ])
        ])
      ]
    );

    document.body.append(dialog);
    document.addEventListener('keydown', onKey);
    dialog.querySelector('.btn--primary, .btn--danger')?.focus();
  });
}

/** Single-line text prompt dialog. Resolves with the trimmed value, or null. */
export function promptDialog({
  title,
  label,
  value = '',
  hint = '',
  confirmLabel = 'Save',
  maxLength = 120
}) {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement;
    const inputId = `prompt-${Math.random().toString(36).slice(2, 8)}`;

    const close = (result) => {
      dialog.remove();
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
      resolve(result);
    };

    const submit = () => {
      const trimmed = input.value.trim();
      if (!trimmed) {
        input.setAttribute('aria-invalid', 'true');
        error.textContent = 'Enter a name first.';
        input.focus();
        return;
      }
      close(trimmed);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(null);
      }
    };

    const input = el('input', {
      id: inputId,
      type: 'text',
      className: 'input',
      value,
      maxlength: String(maxLength),
      autocomplete: 'off',
      on: {
        keydown: (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submit();
          }
        },
        input: () => {
          input.removeAttribute('aria-invalid');
          error.textContent = '';
        }
      }
    });

    const error = el('p', { className: 'field__error', role: 'alert' });

    const dialog = el(
      'div',
      {
        className: 'dialog-backdrop',
        on: {
          click: (event) => {
            if (event.target === dialog) close(null);
          }
        }
      },
      [
        el('div', { className: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'prompt-title' }, [
          el('h2', { className: 'dialog__title', id: 'prompt-title', text: title }),
          el('label', { className: 'field__label', for: inputId, text: label }),
          input,
          hint ? el('p', { className: 'hint', text: hint }) : null,
          error,
          el('div', { className: 'dialog__actions' }, [
            el('button', {
              type: 'button',
              className: 'btn btn--ghost',
              text: 'Cancel',
              on: { click: () => close(null) }
            }),
            el('button', {
              type: 'button',
              className: 'btn btn--primary',
              text: confirmLabel,
              on: { click: submit }
            })
          ])
        ])
      ]
    );

    document.body.append(dialog);
    document.addEventListener('keydown', onKey);
    input.focus();
    input.select();
  });
}

/** Multi-option dialog. Resolves with the chosen option id, or null. */
export function choiceDialog({ title, body, options = [] }) {
  return new Promise((resolve) => {
    const previouslyFocused = document.activeElement;

    const close = (result) => {
      dialog.remove();
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
      resolve(result);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(null);
      }
    };

    const dialog = el(
      'div',
      {
        className: 'dialog-backdrop',
        on: {
          click: (event) => {
            if (event.target === dialog) close(null);
          }
        }
      },
      [
        el('div', { className: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'choice-title' }, [
          el('h2', { className: 'dialog__title', id: 'choice-title', text: title }),
          el('p', { className: 'dialog__body', text: body }),
          el(
            'div',
            { className: 'dialog__actions' },
            options.map((option) =>
              el('button', {
                type: 'button',
                className: `btn${option.variant ? ` btn--${option.variant}` : ''}`,
                text: option.label,
                on: { click: () => close(option.id) }
              })
            )
          )
        ])
      ]
    );

    document.body.append(dialog);
    document.addEventListener('keydown', onKey);
    dialog.querySelector('.btn')?.focus();
  });
}

/** Theme handling: system / light / dark, persisted in settings. */
export function applyTheme(theme) {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = theme;
  document.dispatchEvent(new CustomEvent('mccc:theme', { detail: { theme, resolved } }));
}

export { STATUS };
