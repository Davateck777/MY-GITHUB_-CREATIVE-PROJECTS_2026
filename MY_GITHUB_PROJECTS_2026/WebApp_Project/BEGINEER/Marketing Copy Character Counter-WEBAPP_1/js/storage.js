/**
 * storage.js — the persistence system.
 *
 * Everything lives in localStorage under a single namespace. Every write is
 * guarded: storage can be full, disabled (Safari private mode), or hold data
 * written by an older version. Failures are returned, never thrown, so the UI
 * can show a message instead of dying.
 */

import { PLATFORMS, emptyFields } from './platforms.js';

export const NAMESPACE = 'mccc';
export const SCHEMA_VERSION = 1;

const KEYS = {
  settings: `${NAMESPACE}:settings:v${SCHEMA_VERSION}`,
  working: (platformId) => `${NAMESPACE}:working:${platformId}:v${SCHEMA_VERSION}`,
  sets: `${NAMESPACE}:sets:v${SCHEMA_VERSION}`,
  draftKeywords: `${NAMESPACE}:keywords:v${SCHEMA_VERSION}`
};

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'system', // 'system' | 'light' | 'dark'
  lastPlatform: 'google',
  previewDevice: 'mobile', // 'mobile' | 'desktop'
  showGuidePanel: true
});

/** Detect storage availability without throwing. */
export function storageAvailable() {
  try {
    const probe = `${NAMESPACE}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return { __error: error };
  }
}

function readJSON(key, fallback) {
  const raw = readRaw(key);
  if (raw && typeof raw === 'object' && raw.__error) return fallback;
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    const quotaExceeded =
      error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);
    return {
      ok: false,
      error: quotaExceeded
        ? 'Browser storage is full. Delete a saved copy set and try again.'
        : 'This browser blocked local storage. Nothing was saved.'
    };
  }
}

export function loadSettings() {
  const stored = readJSON(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
}

export function saveSettings(settings) {
  return writeJSON(KEYS.settings, { ...DEFAULT_SETTINGS, ...settings });
}

export function loadKeywords() {
  const stored = readJSON(KEYS.draftKeywords, []);
  return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string') : [];
}

export function saveKeywords(keywords) {
  return writeJSON(KEYS.draftKeywords, Array.isArray(keywords) ? keywords : []);
}

/** Working copy for one platform, normalised against the current field schema. */
export function loadWorking(platformId) {
  const platform = PLATFORMS.find((entry) => entry.id === platformId);
  if (!platform) return {};
  const template = emptyFields(platform);
  const stored = readJSON(KEYS.working(platformId), null);
  if (!stored || typeof stored !== 'object') return template;

  const merged = { ...template };
  for (const field of platform.fields) {
    const value = stored[field.key];
    if (field.kind === 'asset-list') {
      merged[field.key] = Array.isArray(value)
        ? value.map((item) => String(item ?? ''))
        : template[field.key];
    } else if (typeof value === 'string') {
      merged[field.key] = value;
    }
  }
  return merged;
}

export function saveWorking(platformId, values) {
  return writeJSON(KEYS.working(platformId), values);
}

export function clearWorking(platformId) {
  try {
    window.localStorage.removeItem(KEYS.working(platformId));
    return { ok: true };
  } catch {
    return { ok: false, error: 'This browser blocked local storage.' };
  }
}

/** All saved copy sets, newest first. */
export function listSets() {
  const stored = readJSON(KEYS.sets, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((set) => set && typeof set === 'object' && typeof set.id === 'string')
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
}

export function writeSets(sets) {
  return writeJSON(KEYS.sets, sets);
}

export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `set-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Persist one set, replacing any existing set with the same id. */
export function upsertSet(set) {
  const sets = listSets();
  const index = sets.findIndex((entry) => entry.id === set.id);
  const now = new Date().toISOString();
  const next = { ...set, updatedAt: now, createdAt: set.createdAt ?? now };
  if (index >= 0) sets[index] = next;
  else sets.unshift(next);
  const result = writeSets(sets);
  return result.ok ? { ok: true, set: next } : result;
}

export function deleteSet(id) {
  const sets = listSets().filter((set) => set.id !== id);
  return writeSets(sets);
}

export function getSet(id) {
  return listSets().find((set) => set.id === id);
}

/** Case-insensitive search across name, platform label and copy text. */
export function searchSets(sets, query) {
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle) return sets;
  return sets.filter((set) => {
    const haystack = [
      set.name,
      set.platformId,
      set.placement,
      ...Object.values(set.fields ?? {}).flat()
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

/** Rough storage footprint, for the Saved Copy footer. */
export function storageFootprint() {
  let bytes = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(NAMESPACE)) continue;
      bytes += key.length + String(window.localStorage.getItem(key) ?? '').length;
    }
  } catch {
    return 0;
  }
  return bytes;
}

export { KEYS };
