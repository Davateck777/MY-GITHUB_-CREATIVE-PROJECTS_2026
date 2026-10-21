/**
 * preview.js — the preview system.
 *
 * Illustrative layouts only. Every node is built with textContent, so pasted
 * copy is displayed as text and can never inject markup. Nothing here claims to
 * reproduce a platform's real rendering: truncation depends on device, font,
 * language and the platform's own layout engine.
 */

import { el } from './ui.js';
import { countCodePoints } from './counter.js';

const DEFAULT_BRAND = { name: 'Your brand', domain: 'yourbrand.com', handle: 'yourbrand' };

function brandFrom(options) {
  const source = options?.brand && typeof options.brand === 'object' ? options.brand : {};
  const pick = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
  return {
    name: pick(source.name, DEFAULT_BRAND.name),
    domain: pick(source.domain, DEFAULT_BRAND.domain),
    handle: pick(source.handle, DEFAULT_BRAND.handle)
  };
}

/** First letter of the brand, for avatar placeholders. */
function initial(name) {
  return Array.from(name ?? '')[0] ?? 'Y';
}

function truncate(text, limit) {
  const characters = Array.from(String(text ?? ''));
  if (characters.length <= limit) return { text: characters.join(''), truncated: false };
  return { text: `${characters.slice(0, Math.max(0, limit - 1)).join('').trimEnd()}…`, truncated: true };
}

function nonEmpty(value) {
  return String(value ?? '').trim();
}

function googlePath(values) {
  const parts = [nonEmpty(values.path1), nonEmpty(values.path2)].filter(Boolean);
  return parts.length ? parts.join('/') : null;
}

/**
 * Google responsive search ad.
 *
 * "shown" mode mirrors what could appear in one auction (up to 3 headlines and
 * 2 descriptions). "all" mode lists every filled asset, which is how you audit
 * the ones that were not displayed.
 */
function googlePreview(values, options = {}) {
  const brand = brandFrom(options);
  const allMode = options.asset === 'all';
  const headlineValues = (values.headline ?? []).map(nonEmpty).filter(Boolean);
  const descriptionValues = (values.description ?? []).map(nonEmpty).filter(Boolean);
  const headlines = allMode ? headlineValues : headlineValues.slice(0, 3);
  const descriptions = allMode ? descriptionValues : descriptionValues.slice(0, 2);
  const path = googlePath(values);

  const breadcrumb = el('div', { className: 'pv-google__url' }, [
    el('span', { className: 'pv-google__ad', text: 'Sponsored' }),
    el('span', { className: 'pv-google__domain', text: brand.domain }),
    path ? el('span', { className: 'pv-google__path', text: ` › ${path.replace(/\//g, ' › ')}` }) : null
  ]);

  const headlineRow = el(
    'div',
    { className: `pv-google__headline${allMode ? ' pv-google__headline--list' : ''}` },
    headlines.length
      ? headlines.flatMap((headline, index) => {
          if (allMode) {
            return [el('span', { className: 'pv-google__line', text: headline })];
          }
          const nodes = [];
          if (index > 0) nodes.push(el('span', { className: 'pv-google__sep', text: ' · ' }));
          nodes.push(el('span', { text: headline }));
          return nodes;
        })
      : [el('span', { className: 'pv-empty', text: 'Your headlines appear here' })]
  );

  const descriptionRow = el(
    'div',
    { className: `pv-google__description${allMode ? ' pv-google__description--list' : ''}` },
    descriptions.length
      ? allMode
        ? descriptions.map((description) => el('span', { className: 'pv-google__line', text: description }))
        : [el('span', { text: descriptions.join(' ') })]
      : [el('span', { className: 'pv-empty', text: 'Your descriptions appear here' })]
  );

  return el('div', { className: 'pv pv-google' }, [
    breadcrumb,
    headlineRow,
    descriptionRow,
    el('div', {
      className: 'pv-google__note',
      text: allMode
        ? `All ${headlines.length} headline${headlines.length === 1 ? '' : 's'} and ${descriptions.length} description${
            descriptions.length === 1 ? '' : 's'
          } — each must read well alone, because any combination can serve.`
        : 'Illustrative SERP layout — up to 3 headlines and 2 descriptions can show at once.'
    })
  ]);
}

/** X post with weighted-length awareness. */
function xPreview(values, options = {}) {
  const brand = brandFrom(options);
  const text = nonEmpty(values.post);
  const body = el('div', { className: 'pv-x__text' });
  if (text) {
    // Split on URLs so they can be styled, still using text nodes only.
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    for (const part of parts) {
      if (!part) continue;
      if (/^https?:\/\//.test(part)) {
        body.append(el('span', { className: 'pv-x__link', text: part }));
      } else {
        body.append(document.createTextNode(part));
      }
    }
  } else {
    body.append(el('span', { className: 'pv-empty', text: 'Your post text appears here' }));
  }

  return el('div', { className: 'pv pv-x' }, [
    el('div', { className: 'pv-x__avatar', 'aria-hidden': 'true', text: initial(brand.name) }),
    el('div', { className: 'pv-x__main' }, [
      el('div', { className: 'pv-x__meta' }, [
        el('span', { className: 'pv-x__name', text: brand.name }),
        el('span', { className: 'pv-x__handle', text: `@${brand.handle}` }),
        el('span', { className: 'pv-x__dot', text: '·' }),
        el('span', { className: 'pv-x__time', text: 'now' })
      ]),
      body,
      el('div', { className: 'pv-x__actions', 'aria-hidden': 'true' }, [
        el('span', { text: '💬 0' }),
        el('span', { text: '🔁 0' }),
        el('span', { text: '❤️ 0' })
      ]),
      el('div', { className: 'pv-x__note', text: 'Illustrative timeline layout.' })
    ])
  ]);
}

/** Meta feed ad: primary text with “See more”, creative block, headline, description. */
function metaPreview(values, options = {}) {
  const brand = brandFrom(options);
  const primary = nonEmpty(values.primary_text);
  const headline = nonEmpty(values.headline);
  const description = nonEmpty(values.description);
  const clipped = truncate(primary, 125);

  const body = el('div', { className: 'pv-meta__primary' });
  if (primary) {
    body.append(document.createTextNode(clipped.text));
    if (clipped.truncated) {
      body.append(el('span', { className: 'pv-meta__more', text: ' See more' }));
    }
  } else {
    body.append(el('span', { className: 'pv-empty', text: 'Your primary text appears here' }));
  }

  return el('div', { className: 'pv pv-meta' }, [
    el('div', { className: 'pv-meta__header' }, [
      el('div', { className: 'pv-meta__avatar', 'aria-hidden': 'true', text: initial(brand.name) }),
      el('div', { className: 'pv-meta__who' }, [
        el('span', { className: 'pv-meta__name', text: brand.name }),
        el('span', { className: 'pv-meta__sponsored', text: 'Sponsored · 🌐' })
      ])
    ]),
    body,
    el('div', { className: 'pv-meta__creative', 'aria-hidden': 'true' }, [
      el('span', { className: 'pv-meta__creative-label', text: 'Creative' })
    ]),
    el('div', { className: 'pv-meta__bar' }, [
      el('div', { className: 'pv-meta__copy' }, [
        el('div', { className: 'pv-meta__domain', text: brand.domain.toUpperCase() }),
        el('div', { className: 'pv-meta__headline', text: headline || 'Your headline appears here' }),
        description ? el('div', { className: 'pv-meta__description', text: description }) : null
      ]),
      el('div', { className: 'pv-meta__cta', text: 'Learn more' })
    ]),
    el('div', { className: 'pv-meta__note', text: 'Illustrative Feed layout — placement and device change the real result.' })
  ]);
}

const RENDERERS = {
  google: googlePreview,
  x: xPreview,
  meta: metaPreview
};

/**
 * Build the illustrative preview for a platform.
 * @param {object} platform platform definition
 * @param {object} values   working copy
 * @param {{device?: 'mobile'|'desktop'}} [options]
 */
export function renderPreview(platform, values, options = {}) {
  const renderer = RENDERERS[platform.previewKind] ?? RENDERERS.google;
  const device = options.device === 'desktop' ? 'desktop' : 'mobile';

  return el('div', { className: `preview preview--${device}`, dataset: { device } }, [
    el('div', { className: 'preview__frame' }, [renderer(values ?? {}, options)]),
    el('p', {
      className: 'preview__caption',
      text: `Illustrative ${device} layout — real truncation varies by device, font size and placement.`
    })
  ]);
}

/** Character-count helper used by the preview caption in the editor. */
export function primaryTextVisible(platformId, values) {
  if (platformId === 'meta') {
    const characters = countCodePoints(nonEmpty(values.primary_text));
    return { visible: Math.min(characters, 125), total: characters };
  }
  return null;
}

export { truncate };
