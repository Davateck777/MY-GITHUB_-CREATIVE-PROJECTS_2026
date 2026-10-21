/**
 * version.js — single source of truth for the release identity.
 *
 * The service worker cache name, the footer stamp and the release notes all read
 * from here, so a release cannot drift between the UI and the cache.
 */

export const VERSION = '1.0.0';
export const RELEASE_DATE = '2026-10-21';
export const BUILD_CHANNEL = 'production';

/** Cache namespace used by sw.js — bumping VERSION retires old caches. */
export const CACHE_NAME = `mccc-v${VERSION}`;

/** Human-readable stamp for footers and the About panel. */
export const VERSION_LABEL = `v${VERSION} · ${BUILD_CHANNEL}`;
