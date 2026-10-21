# Changelog

All notable changes to this project. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-10-21 — production release

First production release. The MVP training wheels are off: this build is intended for
real users preparing real copy.

### Added
- **Offline support.** A service worker precaches the whole app shell (24 entries) with
  network-first navigation and stale-while-revalidate assets, so the editor opens, counts,
  scores, and saves with no connection. New releases surface a "Reload to update" prompt
  instead of swapping under the user.
- **Installable PWA.** `manifest.webmanifest` with standalone display, maskable icon,
  app shortcuts to Editor / Saved copy / Guide, and theme colours per scheme.
- **Custom preview identity.** Brand name, X handle and domain now drive all three
  illustrative previews and persist per browser, instead of a hardcoded placeholder.
- **Data ownership controls.** A "Your data" panel on the Saved copy page reports what is
  stored and offers *Download backup* plus a two-step **Delete all data** wipe
  (with a "backup, then delete" option). No other trace is left in `localStorage`.
- **Global error boundary.** Uncaught errors and failed resource loads surface as a
  dismissible banner with the message and a reload action; the page never goes blank.
- **Content-Security-Policy** on every page (`default-src 'self'`, no `unsafe-inline`,
  no `unsafe-eval`) plus production headers for Netlify, Cloudflare Pages and Vercel.
- **Rules freshness notice.** The editor warns when the stored platform rules have not
  been reviewed in 180 days.
- **Release tooling.** `js/version.js` is the single source of truth for the version and
  cache name, asserted by `tests/release.test.js` alongside manifest, CSP, precache and
  hosting-config checks.

### Changed
- Footer on every page now carries the build stamp (`v1.0.0 · production`).
- Preview captions and the Guide explain the preview-identity control and offline behaviour.
- `js/app.js` restructured as the production runtime (theme, chrome, boundary, service worker).
- Copy in `js/platforms.js` no longer refers to an MVP.

### Fixed
- **Service worker never registered** — `sw.js` used ES module syntax in a classic worker.
  Now dependency-free classic syntax, with a test preventing version drift.
- Counts previously read "1 words" / "About 1 characters"; all counts use a plural helper.
- An untouched editor displayed a red `0 · Weak` score; it now reads `— · Not scored yet`.
- Minimum-asset warnings fired before any typing and were duplicated in suggestions.
- The "no link in the copy" suggestion appeared on Meta and Google, where the link is not
  part of the copy.
- Browser "leave site?" prompt on reload, despite every keystroke already being saved.
- Mobile tab strip wrapped "Google Ads" mid-word at 390 px.
- Import de-duplication could loop forever on a file with duplicate set ids.

### Security
- All user copy is rendered with `textContent`; imports are validated before any write.
- `base-uri 'none'`, `form-action 'none'`, `object-src 'none'`, `frame-ancestors 'self'`.
- No third-party requests, no analytics, no cookies, no remote fonts.

### Known limitations
- Standard X posts only; no premium long posts or threads.
- Google responsive search ad text assets only; no Performance Max, Demand Gen or callouts.
- One Meta feed-ad preset.
- Emoji are counted as 2 on Google, a conservative assumption Google does not document.
- Previews are illustrative, never a guarantee of rendering.
