/**
 * saved.js — the Saved Copy page controller.
 *
 * Load, rename, duplicate, delete, search, export and import saved copy sets.
 * Imports are always validated before storage is touched, and replacing the
 * collection requires explicit confirmation.
 */

import { getPlatform } from './platforms.js';
import { measurePlatform, complianceSummary } from './counter.js';
import {
  listSets,
  deleteSet,
  upsertSet,
  searchSets,
  writeSets,
  saveWorking,
  saveKeywords,
  storageFootprint,
  clearAllData,
  storageAvailable,
  newId
} from './storage.js';
import {
  toPlainText,
  toPlainTextBundle,
  serializeBackup,
  parseBackup,
  mergeSets,
  filenameFor
} from './exportImport.js';
import {
  el,
  clear,
  statusPill,
  copyText,
  toast,
  announce,
  downloadBlob,
  confirmAction,
  promptDialog,
  choiceDialog,
  formatDateTime
} from './ui.js';

let root;
let listRoot;
let emptyRoot;
let metaRoot;
let reportRoot;
let searchInput;
let sets = [];
let query = '';

export function initSaved() {
  root = document.querySelector('[data-saved]');
  if (!root) return;

  listRoot = root.querySelector('[data-saved-list]');
  emptyRoot = root.querySelector('[data-saved-empty]');
  metaRoot = root.querySelector('[data-saved-meta]');
  reportRoot = root.querySelector('[data-import-report]');
  searchInput = root.querySelector('[data-saved-search]');

  searchInput?.addEventListener('input', () => {
    query = searchInput.value;
    render();
  });

  root.querySelector('[data-export-all]')?.addEventListener('click', exportAll);
  root.querySelector('[data-import-input]')?.addEventListener('change', onImportFile);
  root.querySelector('[data-wipe-all]')?.addEventListener('click', wipeAllData);
  root.querySelector('[data-export-all-2]')?.addEventListener('click', exportAll);

  sets = listSets();
  render();

  window.addEventListener('mccc:saved-changed', () => {
    sets = listSets();
    render();
  });
}

function refresh() {
  sets = listSets();
  render();
  reflectBadge();
}

function reflectBadge() {
  const badge = document.querySelector('[data-saved-count]');
  if (!badge) return;
  badge.textContent = String(sets.length);
  badge.hidden = sets.length === 0;
}

function render() {
  clear(listRoot);
  const visible = searchSets(sets, query);

  emptyRoot.hidden = sets.length > 0;
  if (sets.length && !visible.length) {
    listRoot.append(
      el('p', { className: 'empty', text: `No saved copy matches “${query}”.` })
    );
  }

  for (const set of visible) {
    listRoot.append(setCard(set));
  }

  if (metaRoot) {
    clear(metaRoot);
    const bytes = storageFootprint();
    metaRoot.append(
      el('span', {
        text: `${sets.length} set${sets.length === 1 ? '' : 's'} · ~${Math.max(1, Math.round(bytes / 1024))} KB used in this browser`
      })
    );
  }

  renderDataPanel();
}

/**
 * "Your data" panel: what is stored, how to take it with you, and how to remove
 * every trace of it from this browser in one action.
 */
function renderDataPanel() {
  const host = document.querySelector('[data-data-panel]');
  if (!host) return;
  clear(host);

  const available = storageAvailable();
  const bytes = storageFootprint();
  const kilobytes = Math.max(1, Math.round(bytes / 1024));

  host.append(
    el('div', { className: 'data-panel' }, [
      el('div', { className: 'data-panel__facts' }, [
        el('h2', { className: 'data-panel__title', text: 'Your data' }),
        el('p', {
          className: 'data-panel__line',
          text: available
            ? `${sets.length} saved set${sets.length === 1 ? '' : 's'} · about ${kilobytes} KB in this browser · not encrypted, not synced`
            : 'Local storage is unavailable in this browser, so nothing can be stored or removed.'
        })
      ]),
      el('div', { className: 'data-panel__actions' }, [
        el('button', {
          type: 'button',
          className: 'btn btn--small',
          dataset: { exportAll2: 'true' },
          disabled: !sets.length,
          on: { click: exportAll }
        }, ['Download backup']),
        el('button', {
          type: 'button',
          className: 'btn btn--small btn--danger',
          dataset: { wipeAll: 'true' },
          disabled: !available,
          on: { click: wipeAllData }
        }, ['Delete all data'])
      ])
    ])
  );
}

/** Two-step, explicit, irreversible. The only correct way to offer this. */
async function wipeAllData() {
  const first = await confirmAction({
    title: 'Delete all data from this browser?',
    body: `This removes ${sets.length} saved copy set${sets.length === 1 ? '' : 's'}, every platform working copy, your keywords and your settings. It cannot be undone.`,
    confirmLabel: 'Choose what to delete',
    cancelLabel: 'Keep everything',
    danger: true
  });
  if (!first) return;

  const second = await choiceDialog({
    title: 'Confirm deletion',
    body: 'Download a backup first if there is any chance you will want this copy again.',
    options: [
      { id: 'cancel', label: 'Cancel', variant: 'ghost' },
      { id: 'backup', label: 'Backup, then delete' },
      { id: 'delete', label: 'Delete everything', variant: 'danger' }
    ]
  });
  if (!second || second === 'cancel') return;

  if (second === 'backup' && sets.length) exportAll();

  const result = clearAllData();
  if (!result.ok) {
    report({ errors: [result.error] });
    return;
  }

  toast('All local data deleted.', 'success');
  announce('All saved copy, working copies and settings were deleted from this browser.');
  report({
    errors: [],
    warnings: [],
    summary: `Deleted ${result.removed.length} local storage item${result.removed.length === 1 ? '' : 's'}. The app has been reset to its defaults.`
  });

  sets = [];
  render();
  reflectBadge();
  window.dispatchEvent(new CustomEvent('mccc:saved-changed'));

  // Working copies on the editor page are gone; reload so the UI matches storage.
  window.setTimeout(() => window.location.reload(), 1200);
}

function setCard(set) {
  const platform = getPlatform(set.platformId);
  const compliance = platform
    ? complianceSummary(platform, set.fields, set.targets)
    : { status: 'empty', statusLabel: 'Unknown format' };
  const measurement = platform ? measurePlatform(platform, set.fields, set.targets) : null;

  const preview = el('div', { className: 'set-card__preview' });
  if (platform) {
    for (const field of platform.fields) {
      const raw = set.fields?.[field.key];
      const text = Array.isArray(raw) ? raw.filter(Boolean).join(' · ') : String(raw ?? '');
      if (!text.trim()) continue;
      preview.append(
        el('p', { className: 'set-card__line' }, [
          el('span', { className: 'set-card__field', text: `${field.label}: ` }),
          text
        ])
      );
    }
    if (!preview.childElementCount) {
      preview.append(el('p', { className: 'empty', text: 'No text in this set.' }));
    }
  }

  const keywordLine = set.keywords?.length
    ? el('p', { className: 'set-card__keywords', text: `Keywords: ${set.keywords.join(', ')}` })
    : null;

  const issueLine =
    measurement && measurement.issues.length
      ? el('p', {
          className: 'set-card__issues',
          text: `${measurement.issues.length} limit note${measurement.issues.length === 1 ? '' : 's'}`
        })
      : null;

  return el('article', { className: 'set-card', dataset: { setId: set.id } }, [
    el('header', { className: 'set-card__head' }, [
      el('div', {}, [
        el('h3', { className: 'set-card__name', text: set.name }),
        el('p', {
          className: 'set-card__platform',
          text: `${platform?.label ?? set.platformId} · ${set.placement ?? platform?.placement ?? ''}`
        })
      ]),
      statusPill(compliance.status)
    ]),
    preview,
    keywordLine,
    issueLine,
    el('p', { className: 'set-card__dates', text: `Updated ${formatDateTime(set.updatedAt)}` }),
    el('div', { className: 'set-card__actions' }, [
      actionButton('Load', 'load', set, 'primary'),
      actionButton('Rename', 'rename', set),
      actionButton('Duplicate', 'duplicate', set),
      actionButton('Copy', 'copy', set),
      actionButton('Export .txt', 'export-text', set),
      actionButton('Export .json', 'export-json', set),
      actionButton('Delete', 'delete', set, 'danger')
    ])
  ]);
}

function actionButton(label, action, set, variant = '') {
  return el('button', {
    type: 'button',
    className: `btn btn--small${variant ? ` btn--${variant}` : ' btn--ghost'}`,
    dataset: { action, setId: set.id },
    on: { click: () => handleAction(action, set.id) }
  }, [label]);
}

async function handleAction(action, setId) {
  const set = sets.find((entry) => entry.id === setId);
  if (!set) return;

  switch (action) {
    case 'load':
      loadIntoEditor(set);
      break;
    case 'rename':
      await renameSet(set);
      break;
    case 'duplicate':
      duplicateSet(set);
      break;
    case 'copy':
      await copySet(set);
      break;
    case 'export-text':
      downloadBlob(
        filenameFor(set.name, 'txt'),
        new Blob([toPlainText(set)], { type: 'text/plain;charset=utf-8' })
      );
      toast('Text export downloaded.', 'success');
      break;
    case 'export-json':
      downloadBlob(
        filenameFor(set.name, 'json'),
        new Blob([serializeBackup([set])], { type: 'application/json;charset=utf-8' })
      );
      toast('JSON export downloaded.', 'success');
      break;
    case 'delete':
      await deleteSavedSet(set);
      break;
    default:
      break;
  }
}

function loadIntoEditor(set) {
  const platform = getPlatform(set.platformId);
  if (!platform) {
    toast('That set uses an unknown platform and cannot be loaded.', 'error');
    return;
  }
  const result = saveWorking(platform.id, set.fields ?? {});
  if (!result.ok) {
    toast(result.error, 'error');
    return;
  }
  saveKeywords(set.keywords ?? []);
  window.location.href = `editor.html?platform=${encodeURIComponent(platform.id)}`;
}

async function renameSet(set) {
  const name = await promptDialog({
    title: 'Rename copy set',
    label: 'Name',
    value: set.name,
    confirmLabel: 'Rename'
  });
  if (!name || name === set.name) return;
  const result = upsertSet({ ...set, name });
  if (!result.ok) {
    toast(result.error, 'error');
    return;
  }
  toast('Renamed.', 'success');
  refresh();
}

function duplicateSet(set) {
  const copy = {
    ...structuredClone(set),
    id: newId(),
    name: `${set.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const result = upsertSet(copy);
  if (!result.ok) {
    toast(result.error, 'error');
    return;
  }
  toast('Duplicated.', 'success');
  refresh();
}

async function copySet(set) {
  const result = await copyText(toPlainText(set));
  if (result.ok) {
    toast('Copy set copied to the clipboard.', 'success');
    announce('Copy set copied to the clipboard.');
  } else {
    toast(result.error, 'error');
  }
}

async function deleteSavedSet(set) {
  const confirmed = await confirmAction({
    title: `Delete “${set.name}”?`,
    body: 'This removes the set from this browser. Export a backup first if you might want it again.',
    confirmLabel: 'Delete set',
    danger: true
  });
  if (!confirmed) return;
  const result = deleteSet(set.id);
  if (!result.ok) {
    toast(result.error, 'error');
    return;
  }
  toast('Deleted.', 'success');
  refresh();
}

function exportAll() {
  if (!sets.length) {
    toast('Nothing saved to export yet.');
    return;
  }
  downloadBlob(
    `marketing-copy-counter-backup-${new Date().toISOString().slice(0, 10)}.json`,
    new Blob([serializeBackup(sets)], { type: 'application/json;charset=utf-8' })
  );
  toast(`Backup of ${sets.length} set${sets.length === 1 ? '' : 's'} downloaded.`, 'success');
  announce('JSON backup downloaded.');
}

/** Import flow: read → validate → report → confirm → merge. */
async function onImportFile(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (file.size > 4 * 1024 * 1024) {
    report({ errors: ['That file is larger than 4 MB. Check that you selected a Marketing Copy Character Counter backup.'] });
    return;
  }

  let text;
  try {
    text = await file.text();
  } catch {
    report({ errors: ['The file could not be read.'] });
    return;
  }

  const parsed = parseBackup(text);

  if (!parsed.ok) {
    report({
      errors: parsed.errors,
      warnings: parsed.warnings,
      summary: 'Nothing was imported. Fix the issues below and try again.'
    });
    return;
  }

  let finalMode = 'merge';

  if (sets.length) {
    const choice = await choiceDialog({
      title: `Import ${parsed.sets.length} copy set${parsed.sets.length === 1 ? '' : 's'}?`,
      body: `Merge keeps your ${sets.length} existing set${sets.length === 1 ? '' : 's'} and overwrites any with the same id. Replace deletes them and keeps only this file.`,
      options: [
        { id: 'cancel', label: 'Cancel', variant: 'ghost' },
        { id: 'replace', label: 'Replace all', variant: 'danger' },
        { id: 'merge', label: 'Merge', variant: 'primary' }
      ]
    });

    if (!choice || choice === 'cancel') {
      report({ errors: ['Import cancelled. Nothing was changed.'], warnings: parsed.warnings });
      return;
    }
    finalMode = choice;

    if (finalMode === 'replace') {
      const lastChance = await confirmAction({
        title: 'Delete existing saved copy?',
        body: `${sets.length} saved set${sets.length === 1 ? '' : 's'} will be permanently removed from this browser.`,
        confirmLabel: 'Yes, replace',
        danger: true
      });
      if (!lastChance) {
        report({ errors: ['Import cancelled. Nothing was changed.'], warnings: parsed.warnings });
        return;
      }
    }
  }

  const merged = mergeSets(sets, parsed.sets, finalMode);
  const written = writeSets(merged.sets);
  if (!written.ok) {
    report({ errors: [written.error], warnings: parsed.warnings });
    return;
  }

  report({
    errors: [],
    warnings: parsed.warnings,
    summary: `Imported ${parsed.sets.length} set${parsed.sets.length === 1 ? '' : 's'} — ${merged.added} added, ${merged.replaced} replaced${
      merged.removed ? `, ${merged.removed} removed` : ''
    } (${finalMode}).`
  });
  toast('Import complete.', 'success');
  refresh();
}

function report({ errors = [], warnings = [], summary = '' }) {
  if (!reportRoot) return;
  clear(reportRoot);
  reportRoot.hidden = false;

  if (summary) {
    reportRoot.append(
      el('p', {
        className: `notice ${errors.length ? 'notice--error' : 'notice--success'}`,
        role: 'status',
        text: summary
      })
    );
  }

  if (errors.length) {
    reportRoot.append(
      el('div', { className: 'banner banner--error' }, [
        el('strong', { text: `${errors.length} error${errors.length === 1 ? '' : 's'}: ` }),
        el('ul', { className: 'report-list' }, errors.slice(0, 12).map((message) => el('li', { text: message })))
      ])
    );
  }

  if (warnings.length) {
    reportRoot.append(
      el('div', { className: 'banner banner--warning' }, [
        el('strong', { text: `${warnings.length} warning${warnings.length === 1 ? '' : 's'}: ` }),
        el('ul', { className: 'report-list' }, warnings.slice(0, 12).map((message) => el('li', { text: message })))
      ])
    );
  }

  announce(summary || (errors.length ? 'Import failed. See the report for details.' : 'Import finished with warnings.'));
}

export { toPlainTextBundle };
