/**
 * platforms.js — the platform-rules system.
 *
 * Single source of truth for supported formats, field limits, counting methods,
 * recommendation types, source references and review dates.
 *
 * Three limit kinds are deliberately kept distinct (Phase 1 ④):
 *   - "hard"           : the platform refuses to save the asset over this length.
 *   - "recommendation" : the platform may truncate or hide the overflow; not a cap.
 *   - "target"         : a user-defined goal, stored per field in settings.
 */

export const RULES_REVIEWED = '2026-10-19';
export const RULES_VERSION = 1;

/** Counting methods. Implementations live in counter.js. */
export const COUNTING_METHODS = {
  'codepoint': {
    id: 'codepoint',
    label: 'Unicode code points',
    explanation: 'Each visible character counts as 1, including emoji and CJK characters.'
  },
  'display-width': {
    id: 'display-width',
    label: 'Display width (Google rule)',
    explanation:
      'Every character counts as 1, but characters in double-width languages (Chinese, Japanese, Korean) count as 2. Non-BMP characters such as emoji also count as 2.'
  },
  'weighted': {
    id: 'weighted',
    label: 'X weighted length',
    explanation:
      'X weights characters by script: most Latin/Cyrillic text counts 1, CJK characters count 2, emoji count 2, and every URL counts 23 regardless of its real length.'
  }
};

/**
 * Field schema
 * ------------
 * key            unique within a platform; also the storage key
 * kind           "single" (one input) | "asset-list" (repeatable assets)
 * limit          numeric threshold
 * limitType      "hard" | "recommendation"
 * method         key into COUNTING_METHODS
 * minAssets / maxAssets   only for "asset-list"
 */
export const PLATFORMS = [
  {
    id: 'google',
    label: 'Google Ads',
    shortLabel: 'Google',
    placement: 'Responsive search ad',
    previewKind: 'google',
    summary:
      'Up to 15 headlines at 30 characters and 4 descriptions at 90 characters. Google rotates assets, so every asset must read well on its own.',
    rulesNote:
      'Character limits are enforced by the Google Ads editor. Double-width characters (Chinese, Japanese, Korean) count as 2; emoji are counted as 2 here as a conservative assumption, which the Google help pages do not document.',
    fields: [
      {
        key: 'headline',
        label: 'Headlines',
        kind: 'asset-list',
        method: 'display-width',
        limit: 30,
        limitType: 'hard',
        minAssets: 3,
        maxAssets: 15,
        placeholder: 'Same-day boiler repair',
        helper: '3–15 headlines. Each must stand alone.'
      },
      {
        key: 'description',
        label: 'Descriptions',
        kind: 'asset-list',
        method: 'display-width',
        limit: 90,
        limitType: 'hard',
        minAssets: 2,
        maxAssets: 4,
        placeholder: 'Gas Safe engineers across Lagos, booked online in 60 seconds.',
        helper: '2–4 descriptions. Two can show at once.'
      },
      {
        key: 'path1',
        label: 'Display path 1',
        kind: 'single',
        method: 'display-width',
        limit: 15,
        limitType: 'hard',
        optional: true,
        placeholder: 'boilers',
        helper: 'Optional. Appears after your domain.'
      },
      {
        key: 'path2',
        label: 'Display path 2',
        kind: 'single',
        method: 'display-width',
        limit: 15,
        limitType: 'hard',
        optional: true,
        placeholder: 'same-day',
        helper: 'Optional. Requires display path 1.'
      }
    ],
    sources: [
      {
        label: 'About responsive search ads — Google Ads Help',
        url: 'https://support.google.com/google-ads/answer/7684791',
        note: '30-character headlines, 90-character descriptions, 15 headlines / 4 descriptions, double-width characters count as 2.'
      },
      {
        label: 'Search campaigns specs — Google Ads Help',
        url: 'https://support.google.com/google-ads/answer/17092074',
        note: 'Text asset specification table: 1–15 headlines at 30, 1–4 descriptions at 90.'
      }
    ]
  },
  {
    id: 'x',
    label: 'X',
    shortLabel: 'X',
    placement: 'Standard post',
    previewKind: 'x',
    summary:
      'One standard post of up to 280 weighted characters. URLs are shortened to t.co and always count as 23 characters, whatever their real length.',
    rulesNote:
      'Counts come from the bundled official twitter-text parser (v3.1.0, v2 configuration), so weighting, URL handling and invalid-character checks match X. Premium long posts and threads are not counted here.',
    fields: [
      {
        key: 'post',
        label: 'Post text',
        kind: 'single',
        method: 'weighted',
        limit: 280,
        limitType: 'hard',
        multiline: true,
        rows: 7,
        placeholder: 'We shipped the thing. Here is why it matters → https://example.com/launch',
        helper: 'Standard post limit is 280 weighted characters.'
      }
    ],
    sources: [
      {
        label: 'twitter-text — official counting library',
        url: 'https://github.com/twitter/twitter-text',
        note: 'Weighted length, v2 ranges, transformedURLLength = 23.'
      },
      {
        label: 'Counting characters — X Help Center',
        url: 'https://help.x.com/en/using-x/counting-characters',
        note: '280 weighted characters per standard post; links count as 23.'
      }
    ]
  },
  {
    id: 'meta',
    label: 'Meta',
    shortLabel: 'Meta',
    placement: 'Feed ad — single image or video',
    previewKind: 'meta',
    summary:
      'Meta publishes recommendations rather than hard caps. Copy past the recommended length is usually truncated behind “See more” instead of being rejected.',
    rulesNote:
      'These are display recommendations, not submission limits. Ads Manager will accept far longer text, but most people only see the first ~125 characters of primary text. Headline recommendations vary by placement (about 27 on Facebook Feed, up to 40 on Instagram Feed and Stories).',
    fields: [
      {
        key: 'primary_text',
        label: 'Primary text',
        kind: 'single',
        method: 'codepoint',
        limit: 125,
        limitType: 'recommendation',
        multiline: true,
        rows: 5,
        placeholder: 'Your boiler breaks on a Sunday. We fix it before the kettle boils.',
        helper: 'About 125 characters stay visible before “See more”.'
      },
      {
        key: 'headline',
        label: 'Headline',
        kind: 'single',
        method: 'codepoint',
        limit: 40,
        limitType: 'recommendation',
        placeholder: 'Same-day boiler repair',
        helper: 'Recommended 40; Facebook Feed shows closer to 27.'
      },
      {
        key: 'description',
        label: 'Description',
        kind: 'single',
        method: 'codepoint',
        limit: 30,
        limitType: 'recommendation',
        optional: true,
        placeholder: 'Booked in 60 seconds',
        helper: 'Optional. Only renders on some placements (Marketplace, Search, in-stream).'
      }
    ],
    sources: [
      {
        label: 'Meta Ads Guide — feed ad specs',
        url: 'https://www.facebook.com/business/ads-guide',
        note: 'Recommended primary text, headline and description lengths by placement.'
      },
      {
        label: 'Meta Business Help Center — text in ads',
        url: 'https://www.facebook.com/business/help/223764258858791',
        note: 'Recommended text lengths; overlong text may be truncated by placement and device.'
      }
    ]
  }
];

/** Look up a platform by id. Returns undefined when unknown. */
export function getPlatform(id) {
  return PLATFORMS.find((platform) => platform.id === id);
}

/** Look up a field definition. */
export function getField(platformId, fieldKey) {
  const platform = getPlatform(platformId);
  if (!platform) return undefined;
  return platform.fields.find((field) => field.key === fieldKey);
}

/** Every field across every platform, flattened (used by validation). */
export function allFields() {
  return PLATFORMS.flatMap((platform) =>
    platform.fields.map((field) => ({ ...field, platformId: platform.id }))
  );
}

/**
 * Create an empty field value for a platform.
 * asset-list → array of "" (length = minAssets so the editor opens ready to use)
 * single     → ""
 */
export function emptyFields(platform) {
  const value = {};
  for (const field of platform.fields) {
    value[field.key] =
      field.kind === 'asset-list'
        ? Array.from({ length: Math.max(field.minAssets, 1) }, () => '')
        : '';
  }
  return value;
}

/** Empty working state for every platform. */
export function emptyWorkingState() {
  return Object.fromEntries(PLATFORMS.map((platform) => [platform.id, emptyFields(platform)]));
}
