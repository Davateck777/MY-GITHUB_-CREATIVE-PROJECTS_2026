/**
 * exportImport.js — the transfer system.
 *
 * Pure functions: no DOM, no localStorage, no network. Backups are validated
 * before anything touches storage, and every rejection explains itself with a
 * field path so a broken file can be fixed rather than guessed at.
 */

import { PLATFORMS, getPlatform } from './platforms.js';

export const APP_ID = 'marketing-copy-counter';
export const BACKUP_VERSION = 1;

const MAX_SETS = 500;
const MAX_TEXT = 5000;
const MAX_NAME = 120;
const MAX_NOTES = 2000;
const MAX_KEYWORDS = 40;

const clip = (value, limit) => String(value).slice(0, limit);

/** A safe, sortable filename stem. */
export function slugify(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'copy-set';
}

export function filenameFor(name, extension) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slugify(name)}-${stamp}.${extension}`;
}

/**
 * Plain-text export: one block per field, easy to paste into an ad platform or
 * a document. No JSON, no markup.
 */
export function toPlainText(set) {
  const platform = getPlatform(set?.platformId);
  const lines = [];
  lines.push(set?.name ? `${set.name}` : 'Copy set');
  lines.push(`${platform?.label ?? set?.platformId ?? 'Unknown platform'} — ${set?.placement ?? platform?.placement ?? ''}`.trim());
  lines.push('');

  if (!platform) return lines.join('\n');

  for (const field of platform.fields) {
    const value = set?.fields?.[field.key];
    if (field.kind === 'asset-list') {
      const assets = Array.isArray(value) ? value.filter((asset) => String(asset ?? '').trim()) : [];
      if (!assets.length) continue;
      lines.push(`${field.label} (${assets.length}):`);
      assets.forEach((asset, index) => lines.push(`${index + 1}. ${asset}`));
      lines.push('');
    } else {
      const text = String(value ?? '').trim();
      if (!text) continue;
      lines.push(`${field.label}:`);
      lines.push(text);
      lines.push('');
    }
  }

  if (set?.keywords?.length) {
    lines.push('Target keywords:');
    lines.push(set.keywords.join(', '));
    lines.push('');
  }

  if (set?.notes) {
    lines.push('Campaign notes:');
    lines.push(set.notes);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** Human-readable multi-set text export. */
export function toPlainTextBundle(sets) {
  return sets
    .map((set) => `${'='.repeat(60)}\n${toPlainText(set)}`)
    .join('\n');
}

/** Build the serialisable backup object. */
export function buildBackup(sets, options = {}) {
  return {
    app: APP_ID,
    schemaVersion: BACKUP_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    count: sets.length,
    sets: sets.map((set) => ({
      id: set.id,
      name: set.name,
      platformId: set.platformId,
      placement: set.placement,
      fields: JSON.parse(JSON.stringify(set.fields ?? {})),
      keywords: Array.isArray(set.keywords) ? [...set.keywords] : [],
      targets: { ...(set.targets ?? {}) },
      notes: set.notes ?? '',
      createdAt: set.createdAt ?? null,
      updatedAt: set.updatedAt ?? null
    }))
  };
}

/** Serialise a backup with a trailing newline (diff-friendly). */
export function serializeBackup(sets, options = {}) {
  return `${JSON.stringify(buildBackup(sets, options), null, 2)}\n`;
}

/**
 * Validate one raw set. Returns { ok, set, errors, warnings }.
 * Never throws, whatever the input is.
 */
export function validateSet(raw, index = 0) {
  const errors = [];
  const warnings = [];
  const path = `sets[${index}]`;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: [`${path} is not an object.`], warnings };
  }

  const platform = getPlatform(raw.platformId);
  if (!platform) {
    const known = PLATFORMS.map((entry) => entry.id).join(', ');
    return {
      ok: false,
      errors: [`${path}.platformId must be one of: ${known}. Received ${JSON.stringify(raw.platformId)}.`],
      warnings
    };
  }

  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : '';
  if (!name) errors.push(`${path}.name is required and must be a non-empty string.`);
  if (name.length > MAX_NAME) {
    errors.push(`${path}.name is longer than ${MAX_NAME} characters.`);
  }

  const fields = {};
  const rawFields = raw.fields && typeof raw.fields === 'object' ? raw.fields : null;
  if (!rawFields) errors.push(`${path}.fields is required and must be an object.`);

  for (const field of platform.fields) {
    const value = rawFields?.[field.key];
    if (field.kind === 'asset-list') {
      if (value === undefined) {
        fields[field.key] = [];
        continue;
      }
      if (!Array.isArray(value)) {
        errors.push(`${path}.fields.${field.key} must be an array of strings.`);
        continue;
      }
      if (value.length > field.maxAssets) {
        warnings.push(
          `${path}.fields.${field.key} has ${value.length} assets; only the first ${field.maxAssets} were kept.`
        );
      }
      const assets = value.slice(0, field.maxAssets).map((asset, assetIndex) => {
        if (typeof asset !== 'string') {
          errors.push(`${path}.fields.${field.key}[${assetIndex}] is not a string.`);
          return '';
        }
        if (asset.length > MAX_TEXT) {
          warnings.push(
            `${path}.fields.${field.key}[${assetIndex}] was truncated to ${MAX_TEXT} characters.`
          );
          return clip(asset, MAX_TEXT);
        }
        return asset;
      });
      fields[field.key] = assets;
    } else if (value === undefined || value === null) {
      fields[field.key] = '';
    } else if (typeof value !== 'string') {
      errors.push(`${path}.fields.${field.key} must be a string.`);
    } else if (value.length > MAX_TEXT) {
      warnings.push(`${path}.fields.${field.key} was truncated to ${MAX_TEXT} characters.`);
      fields[field.key] = clip(value, MAX_TEXT);
    } else {
      fields[field.key] = value;
    }
  }

  const knownFieldKeys = new Set(platform.fields.map((field) => field.key));
  for (const key of Object.keys(rawFields ?? {})) {
    if (!knownFieldKeys.has(key)) {
      warnings.push(`${path}.fields.${key} is not a ${platform.label} field and was ignored.`);
    }
  }

  let keywords = [];
  if (Array.isArray(raw.keywords)) {
    keywords = raw.keywords
      .filter((keyword) => typeof keyword === 'string' && keyword.trim())
      .map((keyword) => keyword.trim().slice(0, 80))
      .slice(0, MAX_KEYWORDS);
    if (raw.keywords.length > MAX_KEYWORDS) {
      warnings.push(`${path}.keywords was capped at ${MAX_KEYWORDS} entries.`);
    }
  } else if (raw.keywords !== undefined) {
    errors.push(`${path}.keywords must be an array of strings.`);
  }

  const targets = {};
  if (raw.targets !== undefined) {
    if (raw.targets && typeof raw.targets === 'object' && !Array.isArray(raw.targets)) {
      for (const [key, value] of Object.entries(raw.targets)) {
        if (!knownFieldKeys.has(key)) continue;
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
          targets[key] = Math.floor(value);
        } else {
          warnings.push(`${path}.targets.${key} is not a positive number and was ignored.`);
        }
      }
    } else {
      warnings.push(`${path}.targets must be an object and was ignored.`);
    }
  }

  let notes = '';
  if (raw.notes !== undefined) {
    if (typeof raw.notes !== 'string') {
      warnings.push(`${path}.notes must be a string and was ignored.`);
    } else {
      notes = clip(raw.notes, MAX_NOTES);
    }
  }

  const id = typeof raw.id === 'string' && /^[A-Za-z0-9_-]{6,80}$/.test(raw.id) ? raw.id : null;

  const set = {
    id,
    name: clip(name, MAX_NAME),
    platformId: platform.id,
    placement: typeof raw.placement === 'string' ? clip(raw.placement, 120) : platform.placement,
    fields,
    keywords,
    targets,
    notes,
    createdAt: isoTimestamp(raw.createdAt),
    updatedAt: isoTimestamp(raw.updatedAt)
  };

  return { ok: errors.length === 0, set, errors, warnings };
}

function isoTimestamp(value) {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Parse and validate a backup string.
 * @returns {{ok:boolean, sets:object[], errors:string[], warnings:string[], meta:object}}
 */
export function parseBackup(jsonText) {
  const errors = [];
  const warnings = [];

  let parsed;
  try {
    parsed = JSON.parse(String(jsonText ?? ''));
  } catch (error) {
    return {
      ok: false,
      sets: [],
      errors: [`The file is not valid JSON (${error.message}).`],
      warnings,
      meta: {}
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, sets: [], errors: ['The backup root must be a JSON object.'], warnings, meta: {} };
  }

  if (parsed.app !== APP_ID) {
    warnings.push(`This file was tagged "${String(parsed.app ?? 'nothing')}", not "${APP_ID}". Importing anyway.`);
  }

  const version = Number(parsed.schemaVersion);
  if (!Number.isInteger(version) || version < 1) {
    errors.push('schemaVersion is missing or not a positive integer.');
  } else if (version > BACKUP_VERSION) {
    errors.push(
      `This backup uses schema version ${version}, but this app understands up to ${BACKUP_VERSION}. Update the app before importing.`
    );
  }

  if (!Array.isArray(parsed.sets)) {
    errors.push('The backup must contain a "sets" array.');
  } else if (parsed.sets.length === 0) {
    errors.push('The backup contains no copy sets.');
  } else if (parsed.sets.length > MAX_SETS) {
    errors.push(`The backup contains ${parsed.sets.length} sets; the maximum is ${MAX_SETS}.`);
  }

  if (errors.length) {
    return { ok: false, sets: [], errors, warnings, meta: { schemaVersion: version } };
  }

  const sets = [];
  const seenIds = new Set();

  parsed.sets.forEach((raw, index) => {
    const result = validateSet(raw, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (!result.ok) return;

    let id = result.set.id;
    if (!id || seenIds.has(id)) {
      // Generate a fresh id; retry a bounded number of times on the (very
      // unlikely) collision, then fall back to a timestamped id.
      let attempt = 0;
      do {
        id = `imported-${index}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 80);
        attempt += 1;
      } while (seenIds.has(id) && attempt < 5);
      if (seenIds.has(id)) id = `imported-${Date.now().toString(36)}-${index}`.slice(0, 80);
    }
    seenIds.add(id);
    sets.push({ ...result.set, id });
  });

  return {
    ok: errors.length === 0 && sets.length > 0,
    sets,
    errors,
    warnings,
    meta: {
      schemaVersion: version,
      exportedAt: isoTimestamp(parsed.exportedAt),
      declaredCount: typeof parsed.count === 'number' ? parsed.count : null
    }
  };
}

/**
 * Merge imported sets into the existing collection.
 * @param {'merge'|'replace'} mode  merge keeps existing sets and overwrites id clashes;
 *                                  replace discards the current collection first.
 */
export function mergeSets(existing, incoming, mode = 'merge') {
  if (mode === 'replace') {
    return {
      sets: [...incoming],
      added: incoming.length,
      replaced: 0,
      removed: existing.length
    };
  }

  const byId = new Map(existing.map((set) => [set.id, set]));
  let added = 0;
  let replaced = 0;

  for (const set of incoming) {
    if (byId.has(set.id)) {
      byId.set(set.id, set);
      replaced += 1;
    } else {
      byId.set(set.id, set);
      added += 1;
    }
  }

  return { sets: [...byId.values()], added, replaced, removed: 0 };
}

/** Copy the fields of one set into a platform working-copy shape. */
export function fieldsForPlatform(set, platform) {
  const out = {};
  for (const field of platform.fields) {
    const value = set?.fields?.[field.key];
    if (field.kind === 'asset-list') {
      out[field.key] = Array.isArray(value)
        ? value.map((asset) => String(asset ?? ''))
        : [''];
    } else {
      out[field.key] = typeof value === 'string' ? value : '';
    }
  }
  return out;
}
