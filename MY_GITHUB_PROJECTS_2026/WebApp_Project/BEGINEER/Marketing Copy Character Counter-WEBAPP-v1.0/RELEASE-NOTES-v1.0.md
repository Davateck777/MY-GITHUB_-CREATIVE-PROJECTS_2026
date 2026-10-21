# Release notes — v1.0.0

**Release date:** 21 October 2026 · **Channel:** production · **Platform rules reviewed:** 19 October 2026

This is the first release intended for real users. Everything below has been exercised in
a real browser (Chromium) as part of the release check.

---

## What a user gets

**Count copy the way each platform counts it**

| Platform | Format | Counting rule |
| --- | --- | --- |
| Google Ads | Responsive search ad (3–15 headlines × 30, 2–4 descriptions × 90, 2 paths × 15) | Display width — CJK characters count 2 |
| X | Standard post, 280 | Official `twitter-text` weighting — URLs 23, emoji 2, CJK 2 |
| Meta | Feed ad (125 / 40 / 30) | Unicode code points, labelled as recommendations, not caps |

**Two signals, never blended** — limit compliance (does it fit?) and a Copy Readiness Score
(does it read well?) are reported side by side. Six checks, published weights, every
deduction itemised. Optional keyword coverage is excluded from the maths when unused,
so an empty keyword field can never lower a score.

**A workspace that survives** — three independent working copies, autosaved per keystroke,
restored on reload, saved as named sets, exported as plain text or validated JSON, and
synchronised nowhere (there is no server).

---

## What is new in this release, versus the MVP

| Area | MVP | v1.0 |
| --- | --- | --- |
| Offline | required a connection | **fully offline** after first load; 24-entry shell cache |
| Install | browser tab only | **installable PWA**, maskable icon, app shortcuts |
| Previews | fixed placeholder identity | **your brand name, handle and domain** |
| Data removal | clear browser data manually | **two-step "Delete all data"** with backup option |
| Failures | blank page on an uncaught error | **error boundary** with message + reload |
| Security | none declared | **CSP on every page** + host headers |
| Versioning | implicit | **`v1.0.0` stamped**, cache name locked to it, drift-tested |
| Language | "MVP", "specification only" | production copy throughout |

---

## Verified in the release check

- 73 automated tests pass (`npm test`), including new release-consistency tests.
- Service worker registers, activates, and caches 24 shell entries.
- With the network cut: editor loads, counting works, a set saves, Saved copy loads.
- `localStorage` is empty after "Delete all data"; the app resets to defaults.
- An injected uncaught error shows the boundary banner; dismissing it leaves the app working.
- Zero console errors across Overview, Editor, Saved copy and Guide.
- No unlabelled form controls, no unnamed buttons, exactly one `h1` per page.
- No horizontal scrolling at 390 px; tabs, panels and dialogs remain usable.

---

## Upgrading from the MVP build

Nothing to migrate. Saved sets, working copies and settings use the same keys
(`mccc:*:v1`), and the first load after deploying will install the service worker.
Because the worker caches the shell, **bump `VERSION` in `js/version.js` on every future
release** — the cache name follows it automatically and `npm test` fails if the service
worker drifts.

---

## Known limitations (unchanged)

- Standard X posts only; premium long posts and threads are out of scope.
- Google responsive search-ad text assets only — not Performance Max, Demand Gen or callouts.
- One Meta feed-ad preset (single image or video).
- Google does not document emoji counting; this app counts them as 2, which can
  under-report allowance. The Google Ads editor remains authoritative.
- Previews are illustrative. Verify in the platform's own preview tool before publishing.
- Local storage is not encrypted or synced: export JSON backups for anything you would miss.

---

## Deployment in one page

1. Upload the folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
2. Serve over **HTTPS** — required for the service worker and clipboard API.
3. Keep `sw.js` at the site root and **uncached** (`_headers` and `vercel.json` do this).
4. `_headers`, `_redirects` and `vercel.json` are included; GitHub Pages ignores them and
   relies on the CSP declared in each HTML `<head>`.
5. Smoke-test after deploying: load the site once, go offline, reload, and confirm the
   editor still counts. That single check validates the whole release.
