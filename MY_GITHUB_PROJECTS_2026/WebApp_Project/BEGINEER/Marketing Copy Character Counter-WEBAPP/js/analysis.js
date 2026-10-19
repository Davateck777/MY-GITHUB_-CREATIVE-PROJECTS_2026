/**
 * analysis.js — the copy-analysis system.
 *
 * Produces an explainable Copy Readiness Score. Every check declares its weight
 * and its individual deductions, so a user can see exactly why a score moved.
 *
 * Deliberate separation (Phase 4 ④): limit compliance is reported by counter.js
 * and is NOT part of this score. A message can be perfectly compliant and still
 * be vague, so the two signals are shown side by side rather than blended.
 *
 * Unavailable checks (for example keyword coverage with no keywords entered) are
 * excluded from the weighted average instead of being scored as failures.
 */

import { countWords, measurePlatform, flattenMeasurements } from './counter.js';

/** Disclosed weights. Kept in one place so the UI and the guide cannot drift. */
export const CHECK_WEIGHTS = Object.freeze({
  scanability: 25,
  specificity: 20,
  capitalisation: 15,
  repetition: 15,
  keywords: 15,
  coverage: 10
});

export const CHECK_LABELS = Object.freeze({
  scanability: 'Scanability & sentence length',
  specificity: 'Specificity & concrete detail',
  capitalisation: 'Capitalisation discipline',
  repetition: 'Repetition control',
  keywords: 'Keyword coverage',
  coverage: 'Message coverage'
});

/** Filler and vague-marketing phrases with a stated reason for each. */
export const GENERIC_PHRASES = Object.freeze([
  { phrase: 'world-class', reason: 'unverifiable superlative' },
  { phrase: 'cutting-edge', reason: 'unverifiable superlative' },
  { phrase: 'state-of-the-art', reason: 'unverifiable superlative' },
  { phrase: 'game-changer', reason: 'hype instead of a benefit' },
  { phrase: 'best-in-class', reason: 'unverifiable superlative' },
  { phrase: 'top-notch', reason: 'unverifiable superlative' },
  { phrase: 'look no further', reason: 'filler' },
  { phrase: 'in today\u2019s', reason: 'throat-clearing opener' },
  { phrase: "in today's", reason: 'throat-clearing opener' },
  { phrase: 'one-stop shop', reason: 'cliché' },
  { phrase: 'leverage', reason: 'jargon' },
  { phrase: 'synergy', reason: 'jargon' },
  { phrase: 'solutions provider', reason: 'jargon' },
  { phrase: 'we strive to', reason: 'vague commitment' },
  { phrase: 'quality service', reason: 'unfalsifiable claim' },
  { phrase: 'unlock the power', reason: 'hype instead of a benefit' },
  { phrase: 'revolutionary', reason: 'unverifiable superlative' },
  { phrase: 'seamless', reason: 'vague adjective' }
]);

/** Words ignored when looking for repetition. */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have', 'in',
  'is', 'it', 'its', 'of', 'on', 'or', 'our', 'that', 'the', 'their', 'this', 'to', 'was',
  'we', 'were', 'with', 'you', 'your', 'will', 'can', 'if', 'so', 'not', 'all', 'up'
]);

/** Concrete-detail signals: numbers, time promises, prices, guarantees. */
const CONCRETE_PATTERNS = [
  { id: 'number', pattern: /\d/, label: 'contains a number' },
  { id: 'time', pattern: /\b(60 seconds|minutes?|hours?|same[- ]day|today|tomorrow|tonight|within \d+)\b/i, label: 'names a time frame' },
  { id: 'money', pattern: /([$£€₦¥]\s?\d|\b\d+\s?%|\bfree\b|\bno fee\b)/i, label: 'mentions price, percentage or free offer' },
  { id: 'action', pattern: /\b(book|buy|start|get|claim|try|download|join|call|order|reserve|save)\b/i, label: 'contains a clear action verb' }
];

/**
 * Collect the analysable copy for a platform, field by field.
 * @returns {{label:string, text:string, fieldKey:string, optional:boolean, multiline:boolean}[]}
 */
export function collectCopy(platform, values) {
  const out = [];
  for (const field of platform.fields) {
    const raw = values?.[field.key];
    if (field.kind === 'asset-list') {
      const list = Array.isArray(raw) ? raw : [raw ?? ''];
      list.forEach((asset, index) => {
        const text = String(asset ?? '').trim();
        if (!text) return;
        out.push({
          label: `${field.label.replace(/s$/, '')} ${index + 1}`,
          fieldKey: field.key,
          text,
          optional: Boolean(field.optional),
          multiline: false
        });
      });
    } else {
      const text = String(raw ?? '').trim();
      if (!text) continue;
      out.push({
        label: field.label,
        fieldKey: field.key,
        text,
        optional: Boolean(field.optional),
        multiline: Boolean(field.multiline)
      });
    }
  }
  return out;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function words(text) {
  return String(text)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? [];
}

function sentences(text) {
  return String(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/**
 * Scanability: penalise long sentences and hard-to-scan blocks.
 * Baseline 100, deductions only.
 */
export function checkScanability(copy) {
  const deductions = [];
  let score = 100;

  for (const item of copy) {
    const sentenceList = sentences(item.text);
    const longSentences = sentenceList.filter((sentence) => countWords(sentence) > 20);
    if (longSentences.length) {
      const points = Math.min(25, longSentences.length * 12);
      score -= points;
      deductions.push({
        points,
        detail: `${item.label}: ${longSentences.length} sentence${
          longSentences.length === 1 ? '' : 's'
        } longer than 20 words.`
      });
    }

    if (item.multiline && item.text.length > 220 && !item.text.includes('\n')) {
      score -= 10;
      deductions.push({
        points: 10,
        detail: `${item.label}: ${item.text.length} characters with no line breaks.`
      });
    }

    const averageWords = sentenceList.length
      ? Math.round(sentenceList.reduce((sum, sentence) => sum + countWords(sentence), 0) / sentenceList.length)
      : 0;
    if (averageWords > 16) {
      score -= 8;
      deductions.push({
        points: 8,
        detail: `${item.label}: average sentence length is ${averageWords} words.`
      });
    }
  }

  return {
    id: 'scanability',
    available: copy.length > 0,
    score: clamp(score),
    deductions,
    detail: copy.length
      ? 'Looks for sentences over 20 words, unbroken blocks of text, and long average sentence length.'
      : 'Add copy to run this check.'
  };
}

/** Specificity: concrete detail earns back points, vague phrasing loses them. */
export function checkSpecificity(copy) {
  if (!copy.length) {
    return {
      id: 'specificity',
      available: false,
      score: 100,
      deductions: [],
      detail: 'Add copy to run this check.'
    };
  }

  const joined = copy.map((item) => item.text).join(' ');
  const lower = joined.toLowerCase();
  const deductions = [];

  const hits = CONCRETE_PATTERNS.filter((entry) => entry.pattern.test(joined));
  let score = 55 + hits.length * 11;

  const generics = GENERIC_PHRASES.filter((entry) => lower.includes(entry.phrase));
  for (const generic of generics) {
    score -= 9;
    deductions.push({
      points: 9,
      detail: `“${generic.phrase}” reads as ${generic.reason}.`
    });
  }

  if (!hits.length) {
    deductions.push({
      points: 0,
      detail: 'No numbers, time frames, prices or action verbs found — the copy stays abstract.'
    });
  }

  return {
    id: 'specificity',
    available: true,
    score: clamp(score),
    deductions,
    detail: `Signals found: ${hits.length ? hits.map((hit) => hit.label).join(', ') : 'none'}.`,
    signals: hits.map((hit) => hit.id)
  };
}

/** Capitalisation: flags ALL-CAPS words and shouty ratios. */
export function checkCapitalisation(copy) {
  if (!copy.length) {
    return {
      id: 'capitalisation',
      available: false,
      score: 100,
      deductions: [],
      detail: 'Add copy to run this check.'
    };
  }

  const deductions = [];
  let score = 100;

  for (const item of copy) {
    const letters = item.text.match(/\p{L}/gu) ?? [];
    const uppercase = item.text.match(/\p{Lu}/gu) ?? [];
    const shoutWords = item.text.match(/\b[A-Z]{4,}\b/g) ?? [];

    if (shoutWords.length) {
      const points = Math.min(30, shoutWords.length * 12);
      score -= points;
      deductions.push({
        points,
        detail: `${item.label}: ${shoutWords.join(', ')} in full capitals.`
      });
    }

    if (letters.length >= 12) {
      const ratio = uppercase.length / letters.length;
      if (ratio > 0.4) {
        score -= 15;
        deductions.push({
          points: 15,
          detail: `${item.label}: ${Math.round(ratio * 100)}% of letters are uppercase.`
        });
      }
    }
  }

  return {
    id: 'capitalisation',
    available: true,
    score: clamp(score),
    deductions,
    detail: 'Flags words of four or more characters in full capitals and fields that are mostly uppercase.'
  };
}

/** Repetition: repeated content words and repeated two-word phrases. */
export function checkRepetition(copy) {
  if (!copy.length) {
    return {
      id: 'repetition',
      available: false,
      score: 100,
      deductions: [],
      detail: 'Add copy to run this check.'
    };
  }

  const deductions = [];
  let score = 100;
  const joined = copy.map((item) => item.text).join(' \n ');
  const tokens = words(joined).filter((token) => token.length > 2 && !STOPWORDS.has(token));

  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);

  for (const [token, count] of counts) {
    if (count > 2) {
      const points = Math.min(18, (count - 2) * 8);
      score -= points;
      deductions.push({
        points,
        detail: `“${token}” appears ${count} times across the copy set.`
      });
    }
  }

  const bigrams = new Map();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const phrase = `${tokens[i]} ${tokens[i + 1]}`;
    bigrams.set(phrase, (bigrams.get(phrase) ?? 0) + 1);
  }
  for (const [phrase, count] of bigrams) {
    if (count > 1 && count < 4) {
      score -= 10;
      deductions.push({ points: 10, detail: `The phrase “${phrase}” repeats ${count} times.` });
    }
  }

  return {
    id: 'repetition',
    available: true,
    score: clamp(score),
    deductions,
    detail: 'Ignores common stop words; flags content words used more than twice and repeated phrases.'
  };
}

/**
 * Keyword coverage: excluded entirely when no keywords are supplied
 * (Phase 4 ⑤ — never penalise an omitted optional check).
 */
export function checkKeywords(copy, keywords = []) {
  const cleaned = (keywords ?? [])
    .map((keyword) => String(keyword).trim())
    .filter(Boolean);

  if (!cleaned.length) {
    return {
      id: 'keywords',
      available: false,
      score: 100,
      deductions: [],
      detail: 'Excluded — no target keywords entered. It will not lower your score.',
      matched: [],
      missing: []
    };
  }

  if (!copy.length) {
    return {
      id: 'keywords',
      available: true,
      score: 0,
      deductions: [{ points: 100, detail: 'No copy yet, so no keywords can appear.' }],
      detail: `${cleaned.length} keyword${cleaned.length === 1 ? '' : 's'} to check.`,
      matched: [],
      missing: cleaned
    };
  }

  const haystack = copy
    .map((item) => item.text)
    .join(' ')
    .toLowerCase();

  const matched = cleaned.filter((keyword) => haystack.includes(keyword.toLowerCase()));
  const missing = cleaned.filter((keyword) => !haystack.includes(keyword.toLowerCase()));
  const score = Math.round((matched.length / cleaned.length) * 100);

  return {
    id: 'keywords',
    available: true,
    score,
    deductions: missing.map((keyword) => ({
      points: Math.round(100 / cleaned.length),
      detail: `“${keyword}” does not appear in the copy.`
    })),
    detail: `${matched.length} of ${cleaned.length} keywords present.`,
    matched,
    missing
  };
}

/** Message coverage: required (non-optional) fields that carry text. */
export function checkCoverage(platform, values) {
  const required = platform.fields.filter((field) => !field.optional);
  const filled = [];
  const empty = [];

  for (const field of required) {
    const raw = values?.[field.key];
    const hasText =
      field.kind === 'asset-list'
        ? (Array.isArray(raw) ? raw : [raw]).some((asset) => String(asset ?? '').trim().length > 0)
        : String(raw ?? '').trim().length > 0;
    if (hasText) filled.push(field.label);
    else empty.push(field.label);
  }

  if (!required.length) {
    return {
      id: 'coverage',
      available: false,
      score: 100,
      deductions: [],
      detail: 'No required fields for this format.'
    };
  }

  const score = Math.round((filled.length / required.length) * 100);
  return {
    id: 'coverage',
    available: true,
    score,
    deductions: empty.map((label) => ({
      points: Math.round(100 / required.length),
      detail: `${label} is empty.`
    })),
    detail: `${filled.length} of ${required.length} required field${
      required.length === 1 ? '' : 's'
    } have copy.`,
    filled,
    empty
  };
}

/** Grade bands for the readiness score. */
export function gradeFor(score) {
  if (score >= 85) return { grade: 'Strong', tone: 'excellent' };
  if (score >= 70) return { grade: 'Good', tone: 'good' };
  if (score >= 50) return { grade: 'Needs work', tone: 'caution' };
  return { grade: 'Weak', tone: 'poor' };
}

/**
 * Run every check and combine the available ones by weight.
 *
 * @param {object} platform platform definition
 * @param {object} values   working copy
 * @param {{keywords?: string[]}} [options]
 */
export function analyseCopy(platform, values, options = {}) {
  const copy = collectCopy(platform, values);
  const keywords = options.keywords ?? [];

  const results = [
    checkScanability(copy),
    checkSpecificity(copy),
    checkCapitalisation(copy),
    checkRepetition(copy),
    checkKeywords(copy, keywords),
    checkCoverage(platform, values)
  ].map((result) => ({
    ...result,
    label: CHECK_LABELS[result.id],
    weight: CHECK_WEIGHTS[result.id]
  }));

  const available = results.filter((result) => result.available);
  const unavailable = results.filter((result) => !result.available);
  const totalWeight = available.reduce((sum, result) => sum + result.weight, 0);
  const score = totalWeight
    ? Math.round(
        available.reduce((sum, result) => sum + result.score * result.weight, 0) / totalWeight
      )
    : 0;

  const suggestions = buildSuggestions(results, copy, platform, values);

  return {
    score,
    ...gradeFor(score),
    checks: results,
    availableWeight: totalWeight,
    excluded: unavailable.map((result) => ({ id: result.id, label: result.label, weight: result.weight })),
    suggestions,
    wordCount: copy.reduce((sum, item) => sum + countWords(item.text), 0),
    copyItems: copy.length,
    hasCopy: copy.length > 0
  };
}

/** Turn deductions into at most five ranked, actionable suggestions. */
export function buildSuggestions(results, copy, platform, values) {
  const suggestions = [];
  const byId = Object.fromEntries(results.map((result) => [result.id, result]));

  const scan = byId.scanability;
  if (scan?.available && scan.score < 100) {
    suggestions.push({
      id: 'shorten',
      priority: 1,
      text: 'Break long sentences into one idea each — aim for 20 words or fewer.'
    });
  }

  const specificity = byId.specificity;
  if (specificity?.available && specificity.score < 70) {
    suggestions.push({
      id: 'concretise',
      priority: 2,
      text: 'Add a number, time frame or price so the promise is checkable.'
    });
  }

  const capitalisation = byId.capitalisation;
  if (capitalisation?.available && capitalisation.score < 100) {
    suggestions.push({
      id: 'caps',
      priority: 3,
      text: 'Switch full-capital words to sentence case; emphasis in capitals reads as shouting.'
    });
  }

  const repetition = byId.repetition;
  if (repetition?.available && repetition.score < 100) {
    suggestions.push({
      id: 'vary',
      priority: 4,
      text: 'Vary repeated words and phrases so each asset adds something new.'
    });
  }

  const keywords = byId.keywords;
  if (keywords?.available && keywords.missing?.length) {
    suggestions.push({
      id: 'keywords',
      priority: 5,
      text: `Work these keywords in naturally: ${keywords.missing.join(', ')}.`
    });
  }

  if (platform.id === 'google') {
    const measured = measurePlatform(platform, values);
    for (const value of Object.values(measured.fields)) {
      // Do not nudge about minimums before anything has been typed.
      if (value.assetCheck?.status === 'below' && value.filledCount > 0) {
        suggestions.push({
          id: 'assets',
          priority: 6,
          text: value.assetCheck.message
        });
      }
    }
    const headlines = flattenMeasurements(measured.fields).filter(
      (entry) => entry.field === 'headline' && !entry.isEmpty
    );
    if (headlines.length >= 2) {
      const unique = new Set(headlines.map((entry) => entry.value.trim().toLowerCase()));
      if (unique.size < headlines.length) {
        suggestions.push({
          id: 'duplicate-assets',
          priority: 7,
          text: 'Two headlines are identical — Google gains nothing from duplicates.'
        });
      }
      const firstWords = headlines.map((entry) => entry.value.trim().split(/\s+/)[0]?.toLowerCase());
      const repeatedOpeners = firstWords.length !== new Set(firstWords).size;
      if (repeatedOpeners) {
        suggestions.push({
          id: 'openers',
          priority: 8,
          text: 'Vary the first word of each headline so combinations do not all start the same way.'
        });
      }
    }
  }

  // Only X carries the destination inside the copy. Google ads use a final URL
  // field, and a Meta link lives in the CTA button rather than the text.
  if (
    platform.id === 'x' &&
    copy.length &&
    !/https?:\/\//i.test(copy.map((item) => item.text).join(' '))
  ) {
    suggestions.push({
      id: 'url',
      priority: 9,
      text: 'No link in the copy — add the destination if the platform allows one.'
    });
  }

  return suggestions.slice(0, 5);
}
