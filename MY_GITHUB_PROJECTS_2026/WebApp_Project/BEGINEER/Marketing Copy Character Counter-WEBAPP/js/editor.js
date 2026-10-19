/**
 * editor.js — the workspace controller.
 *
 * Owns: platform tabs, per-platform field rendering, live measurement,
 * readiness analysis, preview, and working-copy persistence.
 *
 * Rendering strategy: inputs are built once per platform and never re-created on
 * typing (so the caret is never stolen). Only the measurement side-panels are
 * re-rendered, from the same pure functions the tests exercise.
 */

import { PLATFORMS, COUNTING_METHODS, getPlatform } from './platforms.js';
import {
  measurePlatform,
  parseXText,
  complianceSummary,
  STATUS,
  STATUS_LABELS
} from './counter.js';
import { analyseCopy } from './analysis.js';
import {
  loadWorking,
  saveWorking,
  loadKeywords,
  saveKeywords,
  loadSettings,
  saveSettings,
  upsertSet,
  listSets,
  newId
} from './storage.js';
import { renderPreview } from './preview.js';
import { toPlainText, filenameFor, serializeBackup } from './exportImport.js';
import {
  el,
  clear,
  statusPill,
  meter,
  announce,
  toast,
  copyText,
  downloadBlob,
  promptDialog,
  plural
} from './ui.js';

const state = {
  platformId: 'google',
  values: {},
  keywords: [],
  targets: {},
  device: 'mobile',
  assetMode: 'shown',
  sets: []
};

let root;
let panel;
let summaryRoot;
let analysisRoot;
let previewRoot;
let tabsRoot;
let saveTimer;

/** Boot the editor page. */
export function initEditor() {
  root = document.querySelector('[data-editor]');
  if (!root) return;

  panel = root.querySelector('[data-editor-panel]');
  summaryRoot = root.querySelector('[data-editor-summary]');
  analysisRoot = root.querySelector('[data-editor-analysis]');
  previewRoot = root.querySelector('[data-editor-preview]');
  tabsRoot = root.querySelector('[data-platform-tabs]');

  const settings = loadSettings();
  const requested = new URLSearchParams(window.location.search).get('platform');
  state.platformId = getPlatform(requested)
    ? requested
    : getPlatform(settings.lastPlatform)
      ? settings.lastPlatform
      : 'google';
  state.device = settings.previewDevice === 'desktop' ? 'desktop' : 'mobile';
  state.targets = settings.targets && typeof settings.targets === 'object' ? settings.targets : {};
  state.keywords = loadKeywords();

  for (const platform of PLATFORMS) {
    state.values[platform.id] = loadWorking(platform.id);
  }

  buildTabs();
  buildActions();
  renderPlatform(state.platformId);
  bindGlobalKeys();
  // No beforeunload guard: every keystroke is written to localStorage
  // synchronously, so a reload cannot lose work. Warning anyway would be a lie.
}

function currentPlatform() {
  return getPlatform(state.platformId) ?? PLATFORMS[0];
}

function currentValues() {
  return state.values[state.platformId];
}

function currentTargets() {
  return state.targets[state.platformId] ?? {};
}

/* ------------------------------------------------------------------ tabs */

function buildTabs() {
  clear(tabsRoot);
  tabsRoot.setAttribute('role', 'tablist');
  tabsRoot.setAttribute('aria-label', 'Platform');

  for (const platform of PLATFORMS) {
    const tab = el('button', {
      type: 'button',
      role: 'tab',
      className: 'tab',
      id: `tab-${platform.id}`,
      'aria-controls': 'editor-panel',
      'aria-selected': String(platform.id === state.platformId),
      tabindex: platform.id === state.platformId ? '0' : '-1',
      dataset: { platform: platform.id },
      on: {
        click: () => selectPlatform(platform.id),
        keydown: (event) => onTabKeydown(event, platform.id)
      }
    }, [
      el('span', { className: 'tab__label', text: platform.label }),
      el('span', { className: 'tab__meta', text: platform.placement })
    ]);
    tabsRoot.append(tab);
  }
}

function onTabKeydown(event, platformId) {
  const keys = { ArrowRight: 1, ArrowLeft: -1 };
  if (!(event.key in keys)) return;
  event.preventDefault();
  const index = PLATFORMS.findIndex((platform) => platform.id === platformId);
  const next = PLATFORMS[(index + keys[event.key] + PLATFORMS.length) % PLATFORMS.length];
  selectPlatform(next.id);
  tabsRoot.querySelector(`#tab-${next.id}`)?.focus();
}

function selectPlatform(platformId) {
  if (platformId === state.platformId) return;
  state.platformId = platformId;
  for (const tab of tabsRoot.querySelectorAll('.tab')) {
    const selected = tab.dataset.platform === platformId;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  const settings = loadSettings();
  saveSettings({ ...settings, lastPlatform: platformId });
  renderPlatform(platformId);
  announce(`${currentPlatform().label} selected. Your text for each platform is kept separately.`);
}

/* --------------------------------------------------------------- actions */

function buildActions() {
  const bar = root.querySelector('[data-editor-actions]');
  if (!bar) return;
  clear(bar);

  bar.append(
    el('button', {
      type: 'button',
      className: 'btn btn--primary',
      dataset: { action: 'save-set' },
      on: { click: saveCurrentSet }
    }, ['Save set']),
    el('button', {
      type: 'button',
      className: 'btn',
      dataset: { action: 'copy-all' },
      on: { click: copyAll }
    }, ['Copy set']),
    el('button', {
      type: 'button',
      className: 'btn',
      dataset: { action: 'export-text' },
      on: { click: exportText }
    }, ['Export .txt']),
    el('button', {
      type: 'button',
      className: 'btn',
      dataset: { action: 'export-json' },
      on: { click: exportJson }
    }, ['Export .json']),
    el('button', {
      type: 'button',
      className: 'btn btn--ghost',
      dataset: { action: 'clear' },
      on: { click: clearFields }
    }, ['Clear fields'])
  );
}

function snapshotSet(name) {
  const platform = currentPlatform();
  return {
    id: newId(),
    name: name ?? `${platform.label} — ${platform.placement}`,
    platformId: platform.id,
    placement: platform.placement,
    fields: JSON.parse(JSON.stringify(currentValues())),
    keywords: [...state.keywords],
    targets: { ...currentTargets() },
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function saveCurrentSet() {
  const platform = currentPlatform();
  const name = await promptDialog({
    title: 'Save this copy set',
    label: 'Name',
    value: `${platform.label} — ${platform.placement}`,
    hint: 'Saved in this browser only. Use Export .json for a portable backup.',
    confirmLabel: 'Save set'
  });
  if (!name) return;

  const set = snapshotSet(name);
  const result = upsertSet(set);
  if (!result.ok) {
    toast(result.error, 'error');
    announce(result.error, true);
    return;
  }
  toast(`Saved “${name}”.`, 'success');
  announce(`Saved ${name}. Open the Saved copy page to manage it.`);
  window.dispatchEvent(new CustomEvent('mccc:saved-changed'));
}

async function copyAll() {
  const text = toPlainText(snapshotSet(`${currentPlatform().label} working copy`));
  const result = await copyText(text);
  if (result.ok) {
    toast('Whole copy set copied to the clipboard.', 'success');
    announce('Copy set copied to the clipboard.');
  } else {
    toast(result.error, 'error');
    announce(result.error, true);
  }
}

function exportText() {
  const text = toPlainText(snapshotSet(`${currentPlatform().label} working copy`));
  downloadBlob(
    filenameFor(`${currentPlatform().label} copy`, 'txt'),
    new Blob([text], { type: 'text/plain;charset=utf-8' })
  );
  toast('Text export downloaded.', 'success');
}

async function exportJson() {
  const all = listSets();
  const set = snapshotSet(`${currentPlatform().label} working copy`);
  const payload = serializeBackup(all.length ? all : [set]);
  downloadBlob(
    `marketing-copy-counter-backup-${new Date().toISOString().slice(0, 10)}.json`,
    new Blob([payload], { type: 'application/json;charset=utf-8' })
  );
  toast(
    all.length
      ? `Backup of ${all.length} saved set${all.length === 1 ? '' : 's'} downloaded. Working copy is not included.`
      : 'Backup downloaded. Save this copy set first if you want it in the backup.',
    'success'
  );
}

async function clearFields() {
  const platform = currentPlatform();
  const values = currentValues();
  const hasText = Object.values(values).some((value) =>
    Array.isArray(value) ? value.some((item) => String(item).trim()) : String(value).trim()
  );
  if (!hasText) {
    toast('Nothing to clear.');
    return;
  }
  const confirmed = await confirmInline(
    'Clear this platform?',
    `This empties every ${platform.label} field in the working copy. Saved copy sets are not affected.`
  );
  if (!confirmed) return;

  for (const field of platform.fields) {
    values[field.key] = field.kind === 'asset-list' ? ['', '', ''] : '';
  }
  persistWorking();
  renderPlatform(platform.id);
  toast('Fields cleared.');
  announce(`${platform.label} fields cleared.`);
}

/** Minimal confirm dialog (kept local so editor.js has one dependency less). */
function confirmInline(title, body) {
  return new Promise((resolve) => {
    const close = (value) => {
      dialog.remove();
      resolve(value);
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
        el('div', { className: 'dialog', role: 'dialog', 'aria-modal': 'true' }, [
          el('h2', { className: 'dialog__title', text: title }),
          el('p', { className: 'dialog__body', text: body }),
          el('div', { className: 'dialog__actions' }, [
            el('button', {
              type: 'button',
              className: 'btn btn--ghost',
              text: 'Keep my text',
              on: { click: () => close(false) }
            }),
            el('button', {
              type: 'button',
              className: 'btn btn--danger',
              text: 'Clear fields',
              on: { click: () => close(true) }
            })
          ])
        ])
      ]
    );
    document.body.append(dialog);
    dialog.querySelector('.btn--danger')?.focus();
  });
}

/* ---------------------------------------------------------------- fields */

function renderPlatform(platformId) {
  const platform = getPlatform(platformId) ?? PLATFORMS[0];
  clear(panel);
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${platform.id}`);
  panel.dataset.platform = platform.id;

  const methods = [...new Set(platform.fields.map((field) => field.method))];

  panel.append(
    el('header', { className: 'editor__intro' }, [
      el('h2', { className: 'editor__title', text: `${platform.label} · ${platform.placement}` }),
      el('p', { className: 'editor__summary', text: platform.summary }),
      el('p', { className: 'editor__rules', text: platform.rulesNote }),
      el(
        'ul',
        { className: 'editor__methods' },
        methods.map((methodId) => {
          const method = COUNTING_METHODS[methodId];
          return el('li', {}, [
            el('strong', { text: `Counting: ${method?.label ?? methodId}. ` }),
            document.createTextNode(method?.explanation ?? '')
          ]);
        })
      )
    ])
  );

  for (const field of platform.fields) {
    panel.append(field.kind === 'asset-list' ? assetListField(field) : singleField(field));
  }

  panel.append(keywordsField());

  panel.addEventListener('input', onPanelInput);
  panel.addEventListener('click', onPanelClick);
  panel.addEventListener('blur', onPanelBlur, true);

  updateOutputs();
}

function fieldHeader(field) {
  const labelId = `label-${state.platformId}-${field.key}`;
  const isSingle = field.kind !== 'asset-list';
  const targetId = `target-${state.platformId}-${field.key}`;
  const targetValue = currentTargets()[field.key];

  const targetInput = el('input', {
    id: targetId,
    type: 'number',
    min: '1',
    max: '9999',
    inputmode: 'numeric',
    className: 'input input--target',
    value: targetValue ? String(targetValue) : '',
    placeholder: '—',
    'aria-label': `Optional target length for ${field.label}, in characters`,
    dataset: { target: field.key }
  });

  return el('div', { className: 'field__head' }, [
    el('div', { className: 'field__titles' }, [
      el('label', {
        className: 'field__label',
        id: labelId,
        ...(isSingle ? { for: `input-${state.platformId}-${field.key}` } : {})
      }, [field.label]),
      el('span', { className: 'field__helper', text: field.helper ?? '' })
    ]),
    el('div', { className: 'field__tools' }, [
      el('label', { className: 'field__target-label', for: targetId }, ['Target ', targetInput]),
      isSingle
        ? el('button', {
            type: 'button',
            className: 'btn btn--ghost btn--tiny',
            dataset: { copyField: field.key },
            'aria-label': `Copy ${field.label}`,
            on: { click: () => {} }
          }, ['Copy'])
        : null
    ])
  ]);
}

function singleField(field) {
  const id = `input-${state.platformId}-${field.key}`;
  const value = currentValues()[field.key] ?? '';

  const control = field.multiline
    ? el('textarea', {
        id,
        className: 'input input--area',
        rows: String(field.rows ?? 4),
        placeholder: field.placeholder ?? '',
        dataset: { field: field.key, index: '' },
        value
      })
    : el('input', {
        id,
        type: 'text',
        className: 'input',
        placeholder: field.placeholder ?? '',
        dataset: { field: field.key, index: '' },
        value,
        autocomplete: 'off',
        spellcheck: 'true'
      });

  return el('section', { className: 'field', dataset: { field: field.key } }, [
    fieldHeader(field),
    control,
    el('div', { className: 'field__foot', dataset: { counter: field.key } }),
    el('div', { className: 'field__extra', dataset: { extra: field.key } })
  ]);
}

function assetListField(field) {
  const values = currentValues()[field.key];
  const list = Array.isArray(values) ? values : [''];

  const container = el('div', { className: 'assets', dataset: { assets: field.key } });

  list.forEach((asset, index) => container.append(assetRow(field, index, asset)));

  const addButton = el('button', {
    type: 'button',
    className: 'btn btn--small',
    dataset: { add: field.key },
    on: { click: () => addAsset(field) }
  }, [`Add ${field.label.replace(/s$/, '').toLowerCase()}`]);

  return el('section', { className: 'field field--assets', dataset: { field: field.key } }, [
    fieldHeader(field),
    container,
    el('div', { className: 'assets__footer' }, [
      addButton,
      el('button', {
        type: 'button',
        className: 'btn btn--ghost btn--small',
        dataset: { copyField: field.key },
        on: { click: () => {} }
      }, [`Copy all ${field.label.toLowerCase()}`]),
      el('div', { className: 'asset-check', dataset: { assetcheck: field.key } })
    ])
  ]);
}

function assetRow(field, index, value) {
  const id = `asset-${state.platformId}-${field.key}-${index}`;
  return el('div', { className: 'asset', dataset: { assetIndex: String(index), assetField: field.key } }, [
    el('label', { className: 'visually-hidden', for: id, text: `${field.label.replace(/s$/, '')} ${index + 1}` }),
    el('input', {
      id,
      type: 'text',
      className: 'input input--asset',
      value,
      placeholder: field.placeholder ?? '',
      autocomplete: 'off',
      dataset: { field: field.key, index: String(index) }
    }),
    el('div', { className: 'asset__side' }, [
      el('div', { className: 'asset__counter', dataset: { assetcounter: `${field.key}:${index}` } }),
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: `Remove ${field.label.replace(/s$/, '').toLowerCase()} ${index + 1}`,
        'aria-label': `Remove ${field.label.replace(/s$/, '').toLowerCase()} ${index + 1}`,
        dataset: { remove: field.key, index: String(index) },
        on: { click: () => removeAsset(field, index) }
      }, ['✕'])
    ])
  ]);
}

function addAsset(field) {
  const values = currentValues()[field.key];
  if (values.length >= field.maxAssets) {
    toast(`${field.maxAssets} ${field.label.toLowerCase()} is the maximum for this format.`);
    return;
  }
  values.push('');
  refreshAssetList(field, values.length - 1);
  announce(`${field.label.replace(/s$/, '')} added. ${values.length} of ${field.maxAssets} used.`);
}

function removeAsset(field, index) {
  const values = currentValues()[field.key];
  if (values.length <= 1) {
    toast('Keep at least one field, or clear its text instead.');
    return;
  }
  values.splice(index, 1);
  refreshAssetList(field, Math.max(0, index - 1));
  announce(`${field.label.replace(/s$/, '')} removed. ${values.length} remain.`);
}

function refreshAssetList(field, focusIndex) {
  const container = panel.querySelector(`[data-assets="${field.key}"]`);
  if (!container) return;
  const values = currentValues()[field.key];
  clear(container);
  values.forEach((asset, index) => container.append(assetRow(field, index, asset)));
  persistWorking();
  updateOutputs();
  const next = container.querySelector(`[data-index="${focusIndex}"]`);
  if (next) next.focus();
}

function keywordsField() {
  const id = 'keywords-input';
  return el('section', { className: 'field field--keywords' }, [
    el('div', { className: 'field__head' }, [
      el('div', { className: 'field__titles' }, [
        el('label', { className: 'field__label', for: id, text: 'Target keywords' }),
        el('span', { className: 'field__helper', text: 'Optional. Separate with commas. Keyword coverage is excluded from the score when empty.' })
      ])
    ]),
    el('input', {
      id,
      type: 'text',
      className: 'input',
      placeholder: 'boiler repair, same-day, Lagos',
      autocomplete: 'off',
      value: state.keywords.join(', '),
      dataset: { keywords: 'true' }
    })
  ]);
}

/* ----------------------------------------------------------- interactions */

function onPanelInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.keywords) {
    state.keywords = String(target.value)
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    saveKeywords(state.keywords);
    updateOutputs();
    return;
  }

  if (target.dataset.target) {
    const key = target.dataset.target;
    const numeric = Number(String(target.value).trim());
    const targets = state.targets[state.platformId] ?? {};
    if (Number.isFinite(numeric) && numeric > 0) {
      targets[key] = Math.floor(numeric);
    } else {
      delete targets[key];
    }
    state.targets[state.platformId] = targets;
    const settings = loadSettings();
    saveSettings({ ...settings, targets: state.targets });
    updateOutputs();
    return;
  }

  const fieldKey = target.dataset.field;
  if (!fieldKey) return;
  const field = currentPlatform().fields.find((entry) => entry.key === fieldKey);
  if (!field) return;

  if (field.kind === 'asset-list') {
    const index = Number(target.dataset.index);
    currentValues()[fieldKey][index] = target.value;
  } else {
    currentValues()[fieldKey] = target.value;
  }
  persistWorking();
  updateOutputs();
}

function onPanelBlur(event) {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.dataset.target) {
    if (target.value && Number(target.value) <= 0) target.value = '';
  }
}

function onPanelClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const copyButton = target.closest('[data-copy-field]');
  if (copyButton) {
    const key = copyButton.dataset.copyField;
    const field = currentPlatform().fields.find((entry) => entry.key === key);
    if (!field) return;
    const value = currentValues()[key];
    const text = Array.isArray(value) ? value.filter(Boolean).join('\n') : String(value ?? '');
    if (!text.trim()) {
      toast('Nothing to copy in that field.');
      return;
    }
    copyText(text).then((result) => {
      if (result.ok) {
        toast(`${field.label} copied.`, 'success');
        announce(`${field.label} copied to the clipboard.`);
      } else {
        toast(result.error, 'error');
      }
    });
  }
}

function bindGlobalKeys() {
  document.addEventListener('keydown', (event) => {
    if (!(event.altKey && !event.ctrlKey && !event.metaKey)) return;
    const index = Number(event.key) - 1;
    if (index >= 0 && index < PLATFORMS.length) {
      event.preventDefault();
      selectPlatform(PLATFORMS[index].id);
      tabsRoot.querySelector(`#tab-${PLATFORMS[index].id}`)?.focus();
    }
  });
}

function persistWorking() {
  // Written synchronously: a debounce window can drop text if the tab closes.
  window.clearTimeout(saveTimer);
  const result = saveWorking(state.platformId, currentValues());
  if (!result.ok) {
    toast(result.error, 'error');
    announce(result.error, true);
  }
}

/* ------------------------------------------------------------ output side */

function updateOutputs() {
  const platform = currentPlatform();
  const values = currentValues();
  const targets = currentTargets();
  const measured = measurePlatform(platform, values, targets);

  for (const field of platform.fields) {
    const measurement = measured.fields[field.key];

    if (field.kind === 'asset-list') {
      measurement.assets.forEach((asset, index) => {
        const counter = panel.querySelector(`[data-assetcounter="${field.key}:${index}"]`);
        if (counter) renderAssetCounter(counter, asset);
      });
      const check = panel.querySelector(`[data-assetcheck="${field.key}"]`);
      if (check) renderAssetCheck(check, measurement.assetCheck, measurement.filledCount);
      const section = panel.querySelector(`[data-field="${field.key}"]`);
      section?.querySelector('[data-add]')?.toggleAttribute('disabled', values[field.key].length >= field.maxAssets);
    } else {
      const foot = panel.querySelector(`[data-counter="${field.key}"]`);
      if (foot) renderSingleCounter(foot, measurement, field);
      const extra = panel.querySelector(`[data-extra="${field.key}"]`);
      if (extra) renderExtra(extra, measurement, field);
    }
  }

  renderSummary(platform, measured);
  renderAnalysis(platform, values, targets);
  renderPreviewPanel(platform, values);
}

function renderAssetCounter(node, asset) {
  clear(node);
  const limitStatus = asset.status;
  node.append(
    el('span', { className: `asset__count asset__count--${limitStatus}`, text: `${asset.count}/${asset.limit}` })
  );
  node.setAttribute(
    'aria-label',
    `${asset.count} of ${asset.limit} characters, ${STATUS_LABELS[limitStatus]}`
  );
}

function renderSingleCounter(node, measurement, field) {
  clear(node);
  node.append(
    el('div', { className: 'counter' }, [
      statusPill(measurement.status),
      el('span', { className: 'counter__numbers' }, [
        el('strong', { text: String(measurement.count) }),
        el('span', { text: ` / ${measurement.limit} ${field.limitType === 'hard' ? 'characters' : 'recommended'}` })
      ]),
      el('span', {
        className: 'counter__remaining',
        text: measurement.remaining >= 0
          ? `${measurement.remaining} left`
          : `${measurement.overage} over`
      })
    ])
  );
  node.append(meter({ count: measurement.count, limit: measurement.limit, status: measurement.status, label: `${field.label} length` }));
  node.append(
    el('div', { className: 'counter__meta' }, [
      el('span', { text: plural(measurement.words, 'word') }),
      el('span', { text: COUNTING_METHODS[field.method]?.label ?? field.method }),
      measurement.target
        ? el('span', {
            className: measurement.targetExceeded ? 'counter__target counter__target--over' : 'counter__target',
            text: `target ${measurement.target}${measurement.targetExceeded ? ' exceeded' : ''}`
          })
        : null
    ])
  );
}

function renderExtra(node, measurement, field) {
  clear(node);

  if (field.method === 'weighted' && measurement.count >= 0) {
    const parsed = parseXText(currentValues()[field.key]);
    if (parsed.weightedLength > 0 && !parsed.valid) {
      node.append(
        el('p', {
          className: 'notice notice--warning',
          role: 'status',
          text: 'The X parser reports this post as invalid. Check for disallowed characters or an empty post.'
        })
      );
    }
  }

  if (measurement.status === STATUS.OVER) {
    node.append(
      el('p', {
        className: 'notice notice--error',
        role: 'status',
        text: `Over the hard limit by ${plural(measurement.overage, 'character')}. ${field.label} cannot be saved on this platform until it is shorter.`
      })
    );
  } else if (measurement.status === STATUS.BEYOND) {
    node.append(
      el('p', {
        className: 'notice notice--info',
        role: 'status',
        text: `This is a display recommendation, not a cap. About ${plural(
          measurement.overage,
          'character'
        )} will likely sit behind “See more”.`
      })
    );
  } else if (measurement.status === STATUS.NEAR) {
    node.append(
      el('p', {
        className: 'notice notice--info',
        text: `Close to the ${measurement.limit}-character ${measurement.limitType === 'hard' ? 'limit' : 'recommendation'} — ${measurement.remaining} left.`
      })
    );
  }
}

function renderAssetCheck(node, check, filledCount = 0) {
  clear(node);
  if (!check) return;
  // Nothing entered yet: state the requirement plainly instead of warning.
  const tone =
    check.status === 'ok' ? 'ok' : check.status === 'below' && filledCount === 0 ? 'idle' : check.status === 'below' ? 'warning' : 'error';
  const message =
    check.status === 'below' && filledCount === 0
      ? `0 of ${check.max} filled — ${check.min} required.`
      : check.message;
  node.append(el('span', { className: `asset-check__text asset-check__text--${tone}`, text: message }));
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/* ------------------------------------------------------------- summaries */

function renderSummary(platform, measured) {
  clear(summaryRoot);
  const scored = analyseCopy(platform, currentValues(), { keywords: state.keywords }).hasCopy;
  const compliance = complianceSummary(platform, currentValues(), currentTargets());
  const analysis = analyseCopy(platform, currentValues(), { keywords: state.keywords });

  const ring = el(
    'div',
    { className: 'score__ring', dataset: { tone: scored ? analysis.tone : 'none' } },
    [
      el('span', { className: 'score__value', text: scored ? String(analysis.score) : '—' }),
      el('span', { className: 'score__unit', text: scored ? '/100' : 'unscored' })
    ]
  );
  ring.style.setProperty('--score-percent', String(scored ? analysis.score : 0));
  ring.setAttribute('role', 'img');
  ring.setAttribute(
    'aria-label',
    scored
      ? `Copy Readiness Score ${analysis.score} out of 100, ${analysis.grade}`
      : 'Copy Readiness Score not calculated yet'
  );

  summaryRoot.append(
    el('div', { className: 'score' }, [
      ring,
      el('div', { className: 'score__body' }, [
        el('h2', { className: 'score__title', id: 'readiness-title', text: 'Copy Readiness Score' }),
        el('p', {
          className: 'score__grade',
          dataset: { tone: scored ? analysis.tone : 'none' },
          text: scored ? analysis.grade : 'Not scored yet'
        }),
        el('p', {
          className: 'score__hint',
          text: analysis.hasCopy
            ? 'Writing quality only. Limit compliance is reported separately below.'
            : 'Start typing to see writing-quality feedback.'
        })
      ])
    ])
  );

  const complianceRow = el('div', { className: 'compliance' }, [
    el('div', { className: 'compliance__head' }, [
      el('h3', { className: 'compliance__title', text: 'Limit compliance' }),
      statusPill(compliance.status)
    ]),
    el('p', { className: 'compliance__detail', text: complianceDetail(compliance) })
  ]);

  const issuesList = el('ul', { className: 'issue-list' });
  if (measured.issues.length) {
    for (const issue of measured.issues) {
      issuesList.append(
        el('li', { className: `issue issue--${issue.severity}` }, [issue.message])
      );
    }
  } else {
    issuesList.append(el('li', { className: 'issue issue--ok', text: 'No limit problems detected.' }));
  }
  complianceRow.append(issuesList);
  summaryRoot.append(complianceRow);

  // The asset-count warnings already appear under Limit compliance — do not repeat them.
  const issueTexts = new Set(measured.issues.map((issue) => issue.message));
  const uniqueSuggestions = analysis.suggestions.filter(
    (suggestion) => !issueTexts.has(suggestion.text)
  );

  if (uniqueSuggestions.length) {
    summaryRoot.append(
      el('div', { className: 'suggestions' }, [
        el('h3', { className: 'suggestions__title', text: 'Writing suggestions' }),
        el('ol', { className: 'suggestions__list' }, uniqueSuggestions.map((suggestion) =>
          el('li', { text: suggestion.text })
        ))
      ])
    );
  }

  summaryRoot.append(
    el('div', { className: 'summary__actions' }, [
      el('button', {
        type: 'button',
        className: 'btn btn--small',
        dataset: { action: 'focus-keywords' },
        on: {
          click: () => panel.querySelector('[data-keywords]')?.focus()
        }
      }, ['Edit keywords'])
    ])
  );
}

function complianceDetail(compliance) {
  if (compliance.status === STATUS.EMPTY) return 'Nothing entered yet.';
  const parts = [];
  if (compliance.overCount) parts.push(`${compliance.overCount} field${compliance.overCount === 1 ? '' : 's'} over a hard limit`);
  if (compliance.beyondCount) parts.push(`${compliance.beyondCount} past a display recommendation`);
  if (compliance.nearCount) parts.push(`${compliance.nearCount} near the limit`);
  if (!parts.length) parts.push(`${compliance.fieldCount} field${compliance.fieldCount === 1 ? '' : 's'} within limits`);
  return capitalize(parts.join(' · ')) + '.';
}

function renderAnalysis(platform, values, targets) {
  clear(analysisRoot);
  const analysis = analyseCopy(platform, values, { keywords: state.keywords });

  analysisRoot.append(
    el('h3', { className: 'panel__title', text: 'Score breakdown' }),
    el('p', {
      className: 'panel__note',
      text: `Weights are disclosed and re-normalised when a check is unavailable. ${analysis.excluded.length ? `Excluded: ${analysis.excluded.map((entry) => `${entry.label} (${entry.weight})`).join(', ')}.` : 'All checks ran.'}`
    }),
    el('ul', { className: 'checks' }, analysis.checks.map((check) => checkRow(check)))
  );
}

function checkRow(check) {
  const row = el('li', {
    className: `check ${check.available ? '' : 'check--unavailable'}`.trim()
  }, [
    el('div', { className: 'check__head' }, [
      el('span', { className: 'check__label', text: check.label }),
      el('span', { className: 'check__weight', text: check.available ? `weight ${check.weight}` : 'excluded' })
    ]),
    check.available
      ? meter({ count: check.score, limit: 100, status: check.score >= 85 ? 'within' : check.score >= 60 ? 'near' : 'over', label: `${check.label} score` })
      : null,
    el('div', { className: 'check__row' }, [
      el('span', { className: 'check__score', text: check.available ? `${check.score}/100` : 'not scored' }),
      el('span', { className: 'check__detail', text: check.detail })
    ])
  ]);

  if (check.available && check.deductions?.length) {
    const details = el('details', { className: 'check__details' }, [
      el('summary', { text: `${check.deductions.length} note${check.deductions.length === 1 ? '' : 's'}` }),
      el('ul', { className: 'check__deductions' }, check.deductions.map((deduction) =>
        el('li', {
          text: deduction.points ? `−${deduction.points} · ${deduction.detail}` : deduction.detail
        })
      ))
    ]);
    row.append(details);
  }
  return row;
}

function renderPreviewPanel(platform, values) {
  clear(previewRoot);

  const deviceGroup = el('div', { className: 'segmented', role: 'group', 'aria-label': 'Preview width' }, [
    deviceButton('mobile', 'Mobile'),
    deviceButton('desktop', 'Desktop')
  ]);

  previewRoot.append(
    el('div', { className: 'panel__head' }, [
      el('h3', { className: 'panel__title', text: 'Illustrative preview' }),
      deviceGroup
    ])
  );

  // Google rotates assets, so users need to audit the ones that will not show.
  if (platform.id === 'google') {
    previewRoot.append(
      el('div', { className: 'segmented segmented--wide', role: 'group', 'aria-label': 'Preview contents' }, [
        assetModeButton('shown', 'As served'),
        assetModeButton('all', 'All assets')
      ])
    );
  }

  previewRoot.append(renderPreview(platform, values, { device: state.device, asset: state.assetMode }));
}

function assetModeButton(value, label) {
  const active = state.assetMode === value;
  return el('button', {
    type: 'button',
    className: `segmented__btn${active ? ' is-active' : ''}`,
    'aria-pressed': String(active),
    on: {
      click: () => {
        state.assetMode = value;
        renderPreviewPanel(currentPlatform(), currentValues());
        announce(value === 'all' ? 'Showing all assets.' : 'Showing only assets that can serve together.');
      }
    }
  }, [label]);
}

function deviceButton(value, label) {
  const active = state.device === value;
  return el('button', {
    type: 'button',
    className: `segmented__btn${active ? ' is-active' : ''}`,
    'aria-pressed': String(active),
    dataset: { device: value },
    on: {
      click: () => {
        state.device = value;
        const settings = loadSettings();
        saveSettings({ ...settings, previewDevice: value });
        renderPreviewPanel(currentPlatform(), currentValues());
        announce(`${label} preview selected.`);
      }
    }
  }, [label]);
}
