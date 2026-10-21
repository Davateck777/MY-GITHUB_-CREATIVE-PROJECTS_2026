



Got it — new project, separate from BookKeeper. Filling the spec table below. Per `DEVELOP_FINALIZED [MVP]`, I will **NOT** create any files yet — waiting for your go-ahead after you review this.

## 📋 FILLED SPEC TABLE

| SECTOR                              | Digital Marketing & Media                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **NICHE**                           | Personal Branding Consulting                                                                                                                                                                                                                                                                                                                                       |
| **YOUR_ROLE( FUNC. )**              | SOFTWARE_ENGINEER                                                                                                                                                                                                                                                                                                                                                  |
| **TARGET_AUDIENCE / JOB_ROLE**      | Personal branding consultants, coaches, solopreneurs & content creators who run campaigns across multiple channels (Instagram bio, LinkedIn, newsletters, podcasts, guest features)                                                                                                                                                                                |
| **JOB_ROLE( FUNC. )**               | Needs to know which channel/post/campaign is actually driving traffic & leads to their personal site or booking page — without hiring an analyst                                                                                                                                                                                                                   |
| **WHAT_PROBLEM**                    | Consultants post links everywhere but rarely tag them consistently with UTM parameters, so Google Analytics (or any analytics tool) can't tell them which channel, post, or campaign is actually working. Links get built by hand, inconsistently, with no record of what was created or reused                                                                    |
| **WHY_PROBLEM**                     | Google's own Campaign URL Builder is bare — no saving, no history, no templates, no QR codes, nothing reusable. Full marketing suites (HubSpot, etc.) are overkill and expensive for a solo consultant who just needs consistent, trackable links                                                                                                                  |
| **ANALYSIS (PROBLEM)**              | Root causes: (1) inconsistent UTM naming breaks analytics segmentation, (2) no history → can't audit, reuse, or avoid duplicate campaign names, (3) manual building is slow & typo-prone, (4) no quick way to QR-code a link for offline use (business cards, slides, print), (5) no repeatable templates for recurring channels (weekly newsletter, IG bio, etc.) |
| **SOLUTION**                        | UTM Link Builder & Manager                                                                                                                                                                                                                                                                                                                                         |
| **SOLUTION_FORMAT**                 | Web App                                                                                                                                                                                                                                                                                                                                                            |
| **IMPORTANT_STACK**                 | **Chosen: HTML5 / CSS3 / Vanilla JS (ES modules), no framework, no build step.** Rationale below ⬇️                                                                                                                                                                                                                                                                |
| **WHY_SOLUTION**                    | A lightweight, focused web utility to generate, validate, save, and manage trackable marketing URLs with custom UTM parameters — purpose-built for a personal brand's recurring channels, not a bloated suite                                                                                                                                                      |
| **HOW_IMPLEMENT_SOLUTION**          | See Features/Design/Implementation breakdown below ⬇️                                                                                                                                                                                                                                                                                                              |
| **WHERE_IMPLEMENT_SOLUTION(s)**     | Static web app — deployable free on GitHub Pages / Netlify / Vercel / Cloudflare Pages; runs entirely client-side, works offline after first load                                                                                                                                                                                                                  |
| **WHAT_MUST_BE CONNECTED TOGETHER** | Builder form UI ↔ URL-construction/validation engine ↔ localStorage history repository ↔ QR code generator ↔ CSV/JSON export ↔ Clipboard API — all client-side, zero external APIs/servers for the MVP                                                                                                                                                             |
| **TARGET_AUDIENCE**                 | Personal branding consultants, coaches, solo marketers & creators managing multi-channel campaigns who need consistent, trackable links without a full marketing-suite subscription                                                                                                                                                                                |
| **SYSTEMS + FILE STRUCTURE**        | See below ⬇️                                                                                                                                                                                                                                                                                                                                                       |
| **AUTHOR**                          | Mr Dave Adex \| DAVA TECK                                                                                                                                                                                                                                                                                                                                          |
| **RETURN-FILLED-TABLE**             | ✅ YES (this table)                                                                                                                                                                                                                                                                                                                                                 |
| **DEVELOP_FINALIZED [MVP]**         | ⏸️ Awaiting your command before file creation                                                                                                                                                                                                                                                                                                                      |
| **DESIRED_OUTPUT**                  | UTM Link Builder & Manager — Web App                                                                                                                                                                                                                                                                                                                               |

### Why Vanilla JS over a framework (justifying "Choose_Best_Efficient_Tech-Stack")
This tool's whole job is: a form → string-building logic → a saved list. That doesn't need React/Vue's overhead. Plain HTML/CSS/JS (ES modules) means: **zero build tooling** (no bundler/version-conflict risk — a real lesson from the last build), **instant static hosting anywhere for free**, **tiny/fast page load**, and it's just as "production-ready" if written in clean, modular files with real unit tests for the core logic.

### Features (MVP)
- **Builder form**: base URL + `utm_source` / `utm_medium` / `utm_campaign` / `utm_term` / `utm_content`, live URL preview, validation (valid URL, no spaces, warns on missing recommended params)
- **Presets/templates**: one-click fill for recurring channels (Instagram Bio, LinkedIn Post, Newsletter, YouTube Description, Podcast Show Notes, etc.)
- **History**: every generated link is saved locally (label, date, full URL) — searchable/sortable table, copy / edit / duplicate-as-template / delete
- **QR code** generated per link (for bio links, print, slides)
- **Export**: CSV of all saved links; JSON backup/restore (same pattern as BookKeeper)
- **Copy to clipboard** with toast confirmation, light/dark theme, fully responsive

### Proposed file structure
```
utm-link-builder/
├── index.html
├── css/
│   ├── styles.css
│   └── themes.css
├── js/
│   ├── app.js            # entry point, wires modules together
│   ├── utmBuilder.js      # pure functions: buildUrl(), validate(), parseParams()
│   ├── presets.js         # channel templates
│   ├── storage.js         # localStorage CRUD for history + settings
│   ├── qrcode.js          # vendored QR generator (no npm dependency)
│   ├── exportImport.js    # CSV export + JSON backup/restore
│   ├── ui.js              # DOM rendering & event binding
│   └── toast.js
├── tests/
│   └── utmBuilder.test.js # Node-run unit tests for the core logic
├── package.json           # dev-only (test runner, local static server) — no runtime deps
└── README.md
```

### Implementation phases
1. Scaffold project + base HTML/CSS layout
2. Core UTM builder logic (pure, unit-tested functions)
3. Presets/template system
4. localStorage persistence (history CRUD)
5. History UI (table, search, actions)
6. QR code generation
7. Export/import (CSV + JSON)
8. Polish: theming, responsiveness, accessibility, toasts
9. Deployment docs

---

**Reply with your go-ahead (e.g. "GO" / "BEGIN") to start creating the files**, or tell me what to adjust first.


---

# WHAT_UTM

UTM parameters are ==short text codes added to the end of a website link to track where your visitors come from==. [1, 2]

UTM stands for [Urchin Tracking Module](https://linkutm.com/blog/utm-meaning). The name comes from an old analytics company called Urchin that Google bought in 2005 to help build Google Analytics. [2, 3, 4]

## Main Parts of a UTM Code

A UTM code uses tags and values. It starts with a question mark `?` after your web address, and uses symbols like `&` to join pieces together. [5, 6, 7]

There are three required tags and two optional tags: [7, 8]

- `utm_source` (Required): Tells you the specific platform or site sending the traffic, such as `google`, `facebook`, or `newsletter`. [8, 9]
- `utm_medium` (Required): Tells you the marketing channel or how the user got there, such as `cpc` (cost-per-click), `email`, or `social`. [8, 9, 10]
- `utm_campaign` (Required): Names the specific project, sale, or product promotion, such as `spring_sale` or `product_launch`. [8, 9]
- `utm_term` (Optional): Tracks paid search keywords or specific search terms. [7, 8]
- `utm_content` (Optional): Used for A/B testing or to tell apart different links in the same ad or email (like a top button vs. a footer link). [7, 8]

## Example of a Tracked Link

If you run an email campaign for a sale, your link might look like this:  
`https://example.com`

When a user clicks that link, your analytics tool records the exact source and campaign so you know your marketing effort worked. You can build these links easily using the [Campaign URL Builder](https://support.bitly.com/hc/en-us/articles/230632067-What-are-UTM-parameters). [1, 8, 10]

If you want, tell me:

- What marketing channel you want to track
- What tool you use to view your web traffic

I can help you write a custom UTM link for your project.

  

[1] [https://www.uschamber.com](https://www.uschamber.com/co/grow/marketing/how-to-use-utm-codes)

[2] [https://www.mightyroar.com](https://www.mightyroar.com/blog/utm-parameters-guide)

[3] [https://linkutm.com](https://linkutm.com/blog/utm-meaning)

[4] [https://www.mtu.edu](https://www.mtu.edu/umc/services/websites/advertising/utm/)

[5] [https://blog.ringostat.com](https://blog.ringostat.com/en/what-utm-tags-are-and-how-to-use-them-correctly/)

[6] [https://www.flowmatters.com](https://www.flowmatters.com/blog/whats-utm-tracking-how-its-helpful-and-how-to-use-it/)

[7] [https://www.campaigntrackly.com](https://www.campaigntrackly.com/utm-tags/)

[8] [https://support.bitly.com](https://support.bitly.com/hc/en-us/articles/230632067-What-are-UTM-parameters)

[9] [https://www.youtube.com](https://www.youtube.com/watch?v=Fiyqf9q7V5A&t=13)

[10] [https://www.youtube.com](https://www.youtube.com/watch?v=97rbAj1-m_I&t=15)