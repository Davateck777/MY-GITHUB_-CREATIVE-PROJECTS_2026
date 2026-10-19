# LinkedIn Headline & Bio Optimizer — Profilecraft

**Author: Mr DAVE ADEX | DAVA TECK**

A dependency-free, browser-local professional-profile editing studio. Separate Optimizer, Saved Drafts, and Guide pages support live counts, transparent writing checks, keyword coverage/density, illustrative desktop/mobile previews, templates, baseline comparison, browser-local drafts, clipboard, text export, JSON backup/import, and persistent themes.

## Run locally

Use Python 3 to serve this folder:

```bash
# Serve ES modules over HTTP, not file://.
python3 -m http.server 4180 --bind 0.0.0.0
```

Open `http://localhost:4180/`. Node 20+ users can also run `npm start` (requires Python) and `npm test`. No `npm install` is needed. No production build is required.

## Deployment

Upload the contents of this folder to any static host. `index.html` redirects to `optimizer.html`; all navigation and imports are relative, including subdirectory deployments.

- **GitHub Pages:** commit the folder contents to a repository and publish the branch/root under Settings → Pages. If storing in a larger repository, configure the published folder accordingly.
- **Netlify / Cloudflare Pages:** no build command; use the directory containing `index.html` as the publish/output directory, or upload the folder directly where supported.
- **Vercel:** use the Other/static project preset; no build command. Serve the project root.

No environment variables, backend, account, API key, CDN, analytics, or remote assets are required. Use HTTPS for reliable clipboard access. The live preview runs a development static server, not a hardened production server.

## Usage

1. Write your headline and About section; use target role/audience as planning notes.
2. Add up to 30 comma-separated target keywords.
3. Switch analysis between Headline and About. Counts and previews update as you type.
4. Optionally apply an editable template, adjust reference limits, or switch preview width.
5. Save a named version and compare it against a saved baseline.
6. Manage drafts on Saved Drafts; export a JSON backup regularly.

The active working copy autosaves, but named versions update only when you press Save draft. New draft resets the working copy after confirmation. Editing from Saved Drafts opens that version. Drafts and settings are local to the browser origin; a different domain or port has different storage. Only named drafts are included in JSON backup.

## Scoring and limitations

The Guide documents all scoring rules. Length (25), keyword coverage (30), readability (25), and specific-language checks (20) are weighted to 100. Missing keyword input excludes that check and rescales the others. Overall score is the average of the two field scores. Scores describe writing rules, **not LinkedIn ranking, searchability predictions, factual accuracy, or employment outcomes**.

Keyword density is phrase occurrence count / word count × 100. There is no ideal density target. Matching is case-insensitive, token-based, and Unicode-aware. Sentence splitting and generic-phrase checks are simple heuristics that may misinterpret abbreviations or context.

Reference limits default to 220 headline / 2,600 About characters, but are not live-verified platform rules. Confirm current limits on LinkedIn. Counters use Unicode code points, not visual grapheme clusters; platform counting may differ. Preview truncation at 320 characters is illustrative, not a platform rule. No content is automatically published.

## Privacy, security, and data recovery

Local storage is not encrypted. Shared-device users can see drafts. Clearing site data, private-mode restrictions, or storage quota failures may lose data. Storage errors are surfaced; text export remains available. Keep exported backups secure because they contain personal information.

User content is rendered with `textContent`, not injected HTML. Import validates version, field types, dates, duplicate IDs, entry count (500), and file size (5 MB) before writing. Imports merge by ID after confirmation; matching IDs are replaced. Unknown fields are discarded. A new import does not alter the active working copy.

## Structure

- `optimizer.html`, `drafts.html`, `guide.html`: separate application pages
- `css/styles.css`, `css/themes.css`: responsive layout and shared theme tokens
- `js/analysis.js`, `js/keywords.js`: pure analysis logic
- `js/optimizer.js`, `js/drafts.js`: page controllers
- `js/storage.js`, `js/exportImport.js`: browser persistence and validated backups
- `js/preview.js`, `js/templates.js`: illustrative rendering and editable starters
- `js/app.js`, `js/ui.js`: shared theme and interface helpers
- `tests/`: Node built-in test-runner checks

Code modules include explanatory comment blocks. Browser controls use labels, keyboard focus styles, semantic markup, status messages, pressed states, and responsive layouts. Final accessibility and cross-browser review in your target browsers is recommended before production use.
