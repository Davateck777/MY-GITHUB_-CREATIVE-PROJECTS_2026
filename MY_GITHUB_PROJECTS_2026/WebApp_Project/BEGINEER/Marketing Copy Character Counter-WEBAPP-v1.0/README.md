# Marketing Copy Character Counter

A responsive, dependency-free web app that counts marketing copy against **Google Ads**,
**X** and **Meta** rules using each platform's real counting method, then explains its
writing feedback line by line.

Built by **Mr DAVE ADEX | DAVA TECK**.

**v1.0.0 · production** — installable, works offline, and holds no data anywhere but your browser.

- HTML5 + CSS3 + vanilla JavaScript ES modules
- No framework, no build step, no backend, no API keys, no network calls
- X counting uses the **official `twitter-text` parser (v3.1.0)**, bundled locally
- 73 tests with Node's built-in test runner, plus an optional DOM smoke test
- Service worker offline support, PWA manifest, CSP on every page
- Light and dark themes, full keyboard support

---

## Quick start

```bash
# any static server works; ES modules require http(s), not file://
npm start            # zero-dependency Node static server on http://localhost:8080
# or
npx serve .
# or
python3 -m http.server 8080
```

Open <http://localhost:8080>.

Run the tests:

```bash
npm test                     # 61 pure-logic tests, no dependencies
npm install --no-save jsdom@24 && npm run test:dom   # optional UI smoke test
```

---

## What it does

**Three formats, three counting rules**

| Platform | Placement | Fields | Counting method |
| --- | --- | --- | --- |
| Google Ads | Responsive search ad | 3–15 headlines × 30, 2–4 descriptions × 90, 2 display paths × 15 | Display width — CJK double-width characters count 2 |
| X | Standard post | 1 field × 280 weighted | twitter-text weighted length — URLs always 23, emoji 2, CJK 2 |
| Meta | Feed ad (single image/video) | Primary text 125, headline 40, description 30 | Unicode code points — **recommendations, not caps** |

**Two signals, never blended**

1. **Limit compliance** — counts, remaining allowance, overage, near-limit warnings, and
   Google asset-count minimums. Hard limits and display recommendations are labelled and
   coloured differently because they fail differently.
2. **Copy Readiness Score** — a writing-quality score from six disclosed checks with
   published weights. Every deduction is listed with the points it removed.

**Also included**

- Per-platform working copies that survive tab switches and reloads
- Add/remove Google assets with live per-asset counters and limits
- Optional target length per field, independent of compliance
- Optional keyword coverage that is **excluded rather than penalised** when unused
- Illustrative Google / X / Meta previews with mobile and desktop widths, plus
  **As served** / **All assets** modes for Google (any 3 of 15 headlines can appear together)
- Save, rename, duplicate, search, delete, copy, and version-export copy sets
- Plain-text export, JSON backups, and imports validated before anything is written
- Light/dark/system themes, keyboard navigation, screen-reader announcements

---

## Architecture

Seven systems, one direction of dependency. Pure logic never imports DOM code.

```
platforms.js ──► counter.js ──► analysis.js
      │              │              │
      │              ▼              ▼
      │           preview.js     editor.js ◄── storage.js
      │                              │
      └──────────────────────► exportImport.js
                                     │
                                  saved.js
```

| Module | Responsibility |
| --- | --- |
| `js/platforms.js` | Format rules: limits, limit kind, counting method, sources, review dates |
| `js/counter.js` | Counting (code points / display width / X weighted) and compliance status |
| `js/analysis.js` | Readiness checks, weights, deductions, suggestions |
| `js/editor.js` | Workspace controller: tabs, fields, live measurement, persistence |
| `js/preview.js` | Illustrative layouts, built with `textContent` only |
| `js/storage.js` | localStorage: settings, working copies, saved sets, quota handling |
| `js/exportImport.js` | Pure text/JSON export, validation, merge — no DOM |
| `js/saved.js` | Saved Copy page controller |
| `js/ui.js` | Accessible primitives: elements, pills, meters, dialogs, toasts, clipboard |
| `js/app.js` | Shared page behaviour: theme, nav, storage banner |
| `js/main.js` | Single entry point |
| `js/version.js` | Release identity: version, cache name, footer stamp |
| `sw.js` | Offline shell cache, update prompt, cross-page offline navigation |

**Changing a platform rule** is a one-file edit in `js/platforms.js`. Update the limit,
the `limitType`, and the source note — the counter, editor, preview and tests all read
from that configuration.

### Storage keys

```
mccc:settings:v1            theme, last platform, preview width, targets
mccc:working:<platform>:v1  per-platform working copy
mccc:keywords:v1            draft target keywords
mccc:sets:v1                saved copy sets
```

Every write is guarded. A full or blocked `localStorage` produces a visible message and
leaves counting fully functional.

---

## File structure

```
marketing-copy-counter/
├── sw.js                 Service worker (offline shell, update prompt)
├── manifest.webmanifest  PWA manifest
├── icons/                App icons (SVG + PNG, maskable)
├── _headers              Netlify / Cloudflare Pages headers + CSP
├── _redirects            Netlify / Cloudflare Pages clean URLs
├── vercel.json           Vercel headers and clean URLs
├── index.html            Overview and rules summary
├── editor.html           Platform-aware workspace
├── saved.html            Saved copy management
├── guide.html            Rules, scoring, privacy, limitations, notices
├── css/
│   ├── styles.css        Layout, components, responsive behaviour
│   └── themes.css        All colour tokens (light + dark)
├── js/
│   ├── main.js           Entry point
│   ├── version.js        Release identity (version + cache name)
│   ├── app.js            Shared page behaviour
│   ├── platforms.js      Rules and source metadata
│   ├── counter.js        Counting and compliance
│   ├── analysis.js       Copy-quality checks and scoring
│   ├── editor.js         Workspace controller
│   ├── preview.js        Illustrative previews
│   ├── storage.js        Working copies, saved sets, settings
│   ├── saved.js          Saved-copy controller
│   ├── exportImport.js   Text/JSON transfers and backup validation
│   └── ui.js             Accessible UI helpers
├── vendor/
│   └── twitter-text.js   Bundled official X parser (Apache-2.0)
├── tests/
│   ├── counter.test.js
│   ├── analysis.test.js
│   ├── exportImport.test.js
│   └── dom.smoke.mjs     Optional jsdom UI smoke test
├── scripts/
│   └── dev-server.mjs    Zero-dependency static server
├── USER-TEST-DATA.md     Hands-on walkthrough: 16 scenarios, exact expected text
├── CHANGELOG.md          Version history
├── RELEASE-NOTES-v1.0.md What shipped in 1.0 and how it was verified
├── TEST-DATA.md          Fixtures, boundaries, manual checklist
├── THIRD-PARTY-NOTICES.md
├── README.md
├── LICENSE
└── package.json
```

---

## Testing

```bash
npm test
```

Covers:

- **Boundaries:** 30/31 Google headline, 90/91 description, 15/16 paths, 280/281 X post
- **Weighting:** URL = 23, emoji = 2, CJK = 2, 140 emoji = 280 exactly
- **Near-limit band:** `ceil(0.9 × limit)` — 27 of 30, 252 of 280
- **Asset counts:** Google minimums and maximums, message wording
- **Score rules:** disclosed weights sum to 100, unavailable checks excluded from the
  denominator, grade bands, per-check deductions
- **Backups:** round-trip, schema-version refusal, wrong types, unknown fields,
  truncation warnings, duplicate ids, merge vs replace, prototype-pollution payloads

`USER-TEST-DATA.md` is the human version: 16 user scenarios with copy-paste inputs and the
exact wording you should see on screen, plus a pass/fail log and a "never see this" list.

`tests/dom.smoke.mjs` additionally drives the real DOM (jsdom) to prove live counting,
asset add/remove limits, per-platform persistence, preview rendering and saved-page
search all work end to end.

---

## Deployment

Static hosting only — no build step, no environment variables, no server.

```bash
# GitHub Pages
git init && git add . && git commit -m "Marketing Copy Character Counter v1.0.0"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
# Settings -> Pages -> Source: Deploy from branch -> main / (root)

# Netlify (drag the folder, or CLI)
npx netlify deploy --prod --dir .

# Vercel
npx vercel --prod          # framework preset: Other, output directory: .

# Cloudflare Pages: build command empty, output directory /
```

**Serve over HTTPS.** The service worker and the clipboard API both require a secure
origin (`localhost` is treated as secure for development).

### Included production config

| File | Purpose |
| --- | --- |
| `_headers` | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, cache rules (Netlify, Cloudflare Pages) |
| `_redirects` | `/editor`, `/saved`, `/guide`, `/home` clean URLs |
| `vercel.json` | Same headers and clean URLs for Vercel |
| per-page `<meta http-equiv="Content-Security-Policy">` | GitHub Pages, which cannot send custom headers |

`sw.js` must stay at the site root and must not be cached — both `_headers` and
`vercel.json` set `Cache-Control: no-cache` for it.

### Releasing an update

1. Edit the app.
2. Bump `VERSION` in **`js/version.js`** (the cache name, footer stamp and release
   checks all follow it).
3. Run `npm test` — it fails if `sw.js`, `package.json`, the manifest, the precache list
   or the CSP disagree with the new version.
4. Deploy. Returning users see a "Reload to update" prompt; their saved copy is untouched.

### Post-deploy smoke test (2 minutes)

1. Open the site. DevTools → Application → Service Workers: one active worker.
2. Reload once so the page is controlled by the worker.
3. **Go offline** and reload: the editor must still load, count and save.
4. Saved copy → **Your data** → verify the counts, then *Download backup*.
5. Confirm the footer reads `v1.0.0 · production`.

## Limits of the tool

- **Not platform approval.** The readiness score is a transparent heuristic, not Google Ads
  Quality Score, not an approval, not a performance forecast.
- **Previews are illustrative.** Real truncation depends on placement, device, font size,
  language and the platform's layout engine.
- **Scope:** standard X posts (no premium long posts or threads), Google responsive search
  ad text assets (no Performance Max, Demand Gen or callouts), one Meta feed-ad preset.
- **Emoji on Google** are counted as 2 — a conservative assumption, since Google documents
  double-width CJK only. The live Google Ads editor is authoritative.
- **Local storage is not encrypted or synced.** Export a JSON backup before clearing
  browser data. *Saved copy → Your data → Delete all data* removes every trace in one step.
- **Not included:** publishing, account connections, live policy review, collaboration,
  AI rewrites.

---

## Licence

Application code: MIT © 2026 Mr DAVE ADEX | DAVA TECK.
Bundled `twitter-text`: Apache License 2.0, © Twitter, Inc. — see
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
