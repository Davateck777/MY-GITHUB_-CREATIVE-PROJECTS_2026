/**
 * counter.js — the counting and compliance system.
 *
 * Pure functions only: no DOM, no storage, no side effects. Every count is
 * reproducible and testable with Node's built-in test runner.
 *
 * Three counting methods are supported (see platforms.js):
 *   codepoint      — one count per Unicode code point
 *   display-width  — Google's rule: double-width (CJK) characters count as 2
 *   weighted       — X's official twitter-text weighted length
 */

import parseTweet from '../vendor/twitter-text.js';

/** Anything at or above this share of the limit is reported as "near limit". */
export const NEAR_LIMIT_RATIO = 0.9;

export const STATUS = Object.freeze({
  EMPTY: 'empty',
  WITHIN: 'within',
  NEAR: 'near',
  OVER: 'over',
  BEYOND: 'beyond'
});

export const STATUS_LABELS = Object.freeze({
  [STATUS.EMPTY]: 'No text yet',
  [STATUS.WITHIN]: 'Within limit',
  [STATUS.NEAR]: 'Near limit',
  [STATUS.OVER]: 'Over limit',
  [STATUS.BEYOND]: 'Beyond display recommendation'
});

/**
 * Ranges that Google treats as double-width: Chinese, Japanese, Korean and
 * fullwidth forms. Mirrors the guidance on the responsive search ads help page.
 */
export const DOUBLE_WIDTH_RANGES = Object.freeze([
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0x303e], // CJK radicals, Kangxi, CJK symbols and punctuation
  [0x3041, 0x33ff], // Hiragana, Katakana, Bopomofo, CJK compatibility
  [0x3400, 0x4dbf], // CJK extension A
  [0x4e00, 0x9fff], // CJK unified ideographs
  [0xa000, 0xa4cf], // Yi
  [0xac00, 0xd7a3], // Hangul syllables
  [0xf900, 0xfaff], // CJK compatibility ideographs
  [0xfe30, 0xfe4f], // CJK compatibility forms
  [0xff00, 0xff60], // Fullwidth forms
  [0xffe0, 0xffe6] // Fullwidth signs
]);

/** True when the code point occupies two columns in Google's counting rule. */
export function isDoubleWidth(codePoint) {
  if (codePoint > 0xffff) return true; // non-BMP (emoji, rare scripts): conservative 2
  return DOUBLE_WIDTH_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

/** Number of Unicode code points. Emoji count as 1, not 2. */
export function countCodePoints(text) {
  if (!text) return 0;
  return Array.from(String(text)).length;
}

/**
 * Google's display width: 1 per character, 2 for double-width (CJK) and
 * non-BMP characters.
 */
export function countDisplayWidth(text) {
  if (!text) return 0;
  let total = 0;
  for (const character of String(text)) {
    total += isDoubleWidth(character.codePointAt(0)) ? 2 : 1;
  }
  return total;
}

/**
 * X's weighted length via the official twitter-text parser.
 * URLs always count 23, emoji count 2, CJK counts 2.
 */
export function countWeighted(text) {
  if (!text) return 0;
  return parseTweet(String(text)).weightedLength;
}

/** Full parse result for X (adds the parser's own validity verdict). */
export function parseXText(text) {
  const source = String(text ?? '');
  const result = parseTweet(source);
  return {
    weightedLength: result.weightedLength,
    valid: result.valid,
    permillage: result.permillage,
    validRangeEnd: result.validRangeEnd
  };
}

/** Dispatch to the right counting method. Unknown methods fall back to code points. */
export function countText(text, method = 'codepoint') {
  switch (method) {
    case 'display-width':
      return countDisplayWidth(text);
    case 'weighted':
      return countWeighted(text);
    case 'codepoint':
    default:
      return countCodePoints(text);
  }
}

/** Word count that ignores punctuation-only tokens (works for CJK-free copy). */
export function countWords(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Longest line, used to warn about over-long single lines. */
export function countLines(text) {
  if (!text) return 0;
  return String(text).split('\n').length;
}

/**
 * Measure one field.
 *
 * @param {string} text
 * @param {object} field  a field definition from platforms.js
 * @param {{target?: number}} [options] optional user-defined target
 * @returns {object} measurement
 */
export function measureField(text, field, options = {}) {
  const source = String(text ?? '');
  const count = countText(source, field.method);
  const limit = field.limit;
  const remaining = limit - count;
  const isEmpty = source.trim().length === 0;

  let status = STATUS.WITHIN;
  if (isEmpty) {
    status = STATUS.EMPTY;
  } else if (count > limit) {
    status = field.limitType === 'recommendation' ? STATUS.BEYOND : STATUS.OVER;
  } else if (limit > 0 && count >= Math.ceil(limit * NEAR_LIMIT_RATIO)) {
    status = STATUS.NEAR;
  }

  const target =
    Number.isFinite(options.target) && options.target > 0 ? Math.floor(options.target) : null;

  return {
    count,
    limit,
    limitType: field.limitType,
    method: field.method,
    remaining,
    overage: remaining < 0 ? Math.abs(remaining) : 0,
    status,
    statusLabel: STATUS_LABELS[status],
    isEmpty,
    percent: limit > 0 ? Math.min(100, Math.round((count / limit) * 1000) / 10) : 0,
    rawPercent: limit > 0 ? (count / limit) * 100 : 0,
    words: countWords(source),
    characters: countCodePoints(source),
    target,
    targetExceeded: target !== null && count > target
  };
}

/**
 * Measure every field of a platform from a working-copy object.
 *
 * @param {object} platform  platform definition
 * @param {object} values    { fieldKey: string | string[] }
 * @param {object} [targets] { fieldKey: number }
 * @returns {{ fields: object, issues: object[], status: string }}
 */
export function measurePlatform(platform, values, targets = {}) {
  const fields = {};
  const issues = [];

  for (const field of platform.fields) {
    const raw = values?.[field.key];
    if (field.kind === 'asset-list') {
      const assets = normalizeAssets(raw);
      const measurements = assets.map((asset, index) => ({
        index,
        value: asset,
        ...measureField(asset, field)
      }));
      const filled = measurements.filter((entry) => !entry.isEmpty);
      const assetCheck = checkAssetCount(filled.length, field);
      fields[field.key] = {
        field,
        assets: measurements,
        filledCount: filled.length,
        assetCheck,
        count: filled.reduce((sum, entry) => sum + entry.count, 0),
        total: measurements.reduce((sum, entry) => sum + entry.count, 0),
        overCount: filled.filter((entry) => entry.status === STATUS.OVER).length,
        nearCount: filled.filter((entry) => entry.status === STATUS.NEAR).length
      };

      for (const entry of measurements) {
        if (entry.status === STATUS.OVER) {
          issues.push({
            field: field.key,
            assetIndex: indexOrNull(entry.index),
            severity: 'error',
            message: `${field.label.replace(/s$/, '')} ${entry.index + 1} is ${entry.overage} character${
              entry.overage === 1 ? '' : 's'
            } over the ${field.limit}-character limit.`
          });
        }
      }
      // Only nag about the minimum once the user has started filling the list.
      if (assetCheck.status === 'below' && filled.length > 0) {
        issues.push({
          field: field.key,
          severity: 'warning',
          message: assetCheck.message
        });
      }
    } else {
      const measurement = measureField(raw, field, { target: targets?.[field.key] });
      fields[field.key] = { field, ...measurement };
      if (measurement.status === STATUS.OVER) {
        issues.push({
          field: field.key,
          severity: 'error',
          message: `${field.label} is ${measurement.overage} character${
            measurement.overage === 1 ? '' : 's'
          } over the ${field.limit}-character limit.`
        });
      }
      if (measurement.status === STATUS.BEYOND) {
        issues.push({
          field: field.key,
          severity: 'info',
          message: `${field.label} is ${measurement.overage} character${
            measurement.overage === 1 ? '' : 's'
          } past the ${field.limit}-character display recommendation — likely truncated.`
        });
      }
    }
  }

  const flat = flattenMeasurements(fields);
  const status = worstStatus(flat);

  return { fields, issues, status, hasAnyText: flat.some((entry) => !entry.isEmpty) };
}

function indexOrNull(index) {
  return typeof index === 'number' ? index : null;
}

/** Flatten a platform measurement into a comparable array. */
export function flattenMeasurements(fields) {
  const out = [];
  for (const value of Object.values(fields)) {
    if (Array.isArray(value.assets)) {
      out.push(...value.assets.map((asset) => ({ field: value.field.key, ...asset })));
    } else {
      out.push({ field: value.field.key, ...value });
    }
  }
  return out;
}

/** Severity ranking used for the summary pill. */
export function worstStatus(measurements) {
  const filled = measurements.filter((entry) => !entry.isEmpty);
  if (!filled.length) return STATUS.EMPTY;
  if (filled.some((entry) => entry.status === STATUS.OVER)) return STATUS.OVER;
  if (filled.some((entry) => entry.status === STATUS.BEYOND)) return STATUS.BEYOND;
  if (filled.some((entry) => entry.status === STATUS.NEAR)) return STATUS.NEAR;
  return STATUS.WITHIN;
}

/**
 * Google asset-count compliance: min 3 headlines / 2 descriptions,
 * max 15 headlines / 4 descriptions.
 */
export function checkAssetCount(filledCount, field) {
  const min = field.minAssets ?? 0;
  const max = field.maxAssets ?? Infinity;
  const noun = field.label.replace(/s$/, '').toLowerCase();

  if (filledCount > max) {
    return {
      status: 'above',
      min,
      max,
      message: `${max} ${field.label.toLowerCase()} is the maximum — remove ${
        filledCount - max
      } before submitting.`
    };
  }
  if (filledCount < min) {
    return {
      status: 'below',
      min,
      max,
      message: `Google Ads needs at least ${min} ${field.label.toLowerCase()} — ${filledCount} filled in so far.`
    };
  }
  return {
    status: 'ok',
    min,
    max,
    message: `${filledCount} of ${max} ${field.label.toLowerCase()} filled — asset count is valid.`
  };
}

/** Normalise an asset list to an array of trimmed-source strings. */
export function normalizeAssets(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ''));
  if (typeof value === 'string' && value.length) return [value];
  return [''];
}

/**
 * Per-platform compliance summary, deliberately kept separate from the
 * copy-quality score (Phase 4 ④).
 */
export function complianceSummary(platform, values, targets = {}) {
  const measured = measurePlatform(platform, values, targets);
  const flat = flattenMeasurements(measured.fields);
  const filled = flat.filter((entry) => !entry.isEmpty);

  return {
    status: measured.status,
    statusLabel: STATUS_LABELS[measured.status],
    fieldCount: filled.length,
    overCount: filled.filter((entry) => entry.status === STATUS.OVER).length,
    beyondCount: filled.filter((entry) => entry.status === STATUS.BEYOND).length,
    nearCount: filled.filter((entry) => entry.status === STATUS.NEAR).length,
    assetIssues: Object.values(measured.fields)
      .filter((value) => value.assetCheck && value.assetCheck.status !== 'ok')
      .map((value) => value.assetCheck),
    blocking: filled.some((entry) => entry.status === STATUS.OVER)
  };
}
