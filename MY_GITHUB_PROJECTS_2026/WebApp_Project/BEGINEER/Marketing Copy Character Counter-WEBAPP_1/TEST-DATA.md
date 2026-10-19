# Test data — Marketing Copy Character Counter

Manual and semi-automated test data for the counting engine, the readiness score,
Google asset checks and backup import. Every expected value below was measured
by running the shipped code, not estimated.

Automated tests live in `tests/` and run with `npm test` (Node's built-in runner,
no dependencies):

| File | Covers |
| --- | --- |
| `tests/counter.test.js` | code points, display width, X weighted length, 280/281 and 30/31 boundaries, asset counts, compliance summaries |
| `tests/analysis.test.js` | each readiness check, exclusion of unavailable checks, grade bands, Google-specific suggestions |
| `tests/exportImport.test.js` | backup round-trip, validation errors, merge/replace, plain-text export, slugging, prototype-pollution payloads |
| `tests/dom.smoke.mjs` | optional UI smoke test (needs `jsdom`), covers live counting, add/remove, persistence, saved page |

---

## 1. Counting boundaries

| # | Input | Platform field | Expected count | Expected status |
| --- | --- | --- | --- | --- |
| 1 | `Same-DAY Emergency Plumber NYC` (exactly 30 characters) | Google headline | 30 | Near limit |
| 2 | The same string plus one character (31) | Google headline | 31 | Over limit (overage 1) |
| 3 | `日` × 15 | Google headline | 30 (display width) | Near limit |
| 4 | `日` × 16 | Google headline | 32 | Over limit |
| 5 | `🔥 Hot deal` | Google headline | 11 display width (10 code points) | Within limit |
| 6 | `A` × 280 | X post | 280 | Near limit |
| 7 | `A` × 281 | X post | 281 | Over limit (overage 1) |
| 8 | `🎉` × 140 | X post | 280 | Near limit |
| 9 | `🎉` × 141 | X post | 282 | Over limit |
| 10 | `https://example.com` | X post | 23 | — |
| 11 | `Ship it 🎉 https://example.com/launch` | X post | 34 weighted (8 + 2 + 1 + 23) | Within limit |
| 12 | `お得な情報をお届けします` | X post | 24 weighted (12 CJK × 2) | Within limit |
| 13 | `a` × 125 | Meta primary text | 125 | Near limit |
| 14 | `a` × 126 | Meta primary text | 126 | Beyond display recommendation |
| 15 | 26 characters | Google headline | 26 | Within limit (near band starts at 27 = ceil(0.9 × 30)) |

Copy-paste blocks for browser testing:

```
Same-DAY Emergency Plumber NYC
```

```
日日日日日日日日日日日日日日日
```

```
Ship it 🎉 https://example.com/launch
```

---

## 2. Google asset-count rules

| # | Headlines filled | Descriptions filled | Expected message |
| --- | --- | --- | --- |
| 1 | 2 | 2 | “Google Ads needs at least 3 headlines — 2 filled in so far.” |
| 2 | 3 | 1 | “Google Ads needs at least 2 descriptions — 1 filled in so far.” |
| 3 | 3 | 2 | “3 of 15 headlines filled — asset count is valid.” |
| 4 | 15 | 4 | Valid; “Add headline” / “Add description” disabled |
| 5 | 2 identical headlines | 2 | Extra suggestion: “Two headlines are identical…” |

---

## 3. Readiness score scenarios

| # | Scenario | Expected behaviour |
| --- | --- | --- |
| 1 | No keywords entered | Keyword coverage listed under “Excluded”; available weight = 85, not penalised |
| 2 | Keywords entered, none present | Keyword coverage scored 0 with one deduction per missing keyword |
| 3 | `we strive to deliver world-class quality service` in a headline | Specificity deductions naming each vague phrase |
| 4 | `BEST BOILER DEALS THIS WEEK ONLY` | Capitalisation deductions for full-capital words |
| 5 | `boiler repair` in three headlines | Repetition deduction: ““boiler” appears 3 times” |
| 6 | A single sentence over 20 words | Scanability deduction; suggestion to shorten |
| 7 | Multiline field over 220 characters with no line breaks | Scanability deduction for unbroken text |
| 8 | Copy at 85+ | Grade “Strong”; 70–84 “Good”; 50–69 “Needs work”; ≤49 “Weak” |

A strong sample to start from:

```
Book boiler repair in 60 seconds. Free quote, no call-out fee.
```

---

## 4. Import / export fixtures

### 4.1 Valid minimal backup

```json
{
  "app": "marketing-copy-counter",
  "schemaVersion": 1,
  "exportedAt": "2026-10-19T10:00:00.000Z",
  "count": 1,
  "sets": [
    {
      "id": "set-abc123",
      "name": "Boiler campaign — UK",
      "platformId": "google",
      "placement": "Responsive search ad",
      "fields": {
        "headline": ["Same-day boiler repair", "Gas Safe engineers", "Booked online"],
        "description": ["Fast, booked online in 60 seconds. No call-out fee.", "Local engineers, 7 days a week."],
        "path1": "boilers",
        "path2": ""
      },
      "keywords": ["boiler repair", "same-day"],
      "targets": { "headline": 25 },
      "notes": "Spring promo.",
      "createdAt": "2026-10-01T09:00:00.000Z",
      "updatedAt": "2026-10-02T09:00:00.000Z"
    }
  ]
}
```

Expected: import succeeds; 1 set added; 0 warnings.

### 4.2 Rejection cases

| # | Mutation | Expected error |
| --- | --- | --- |
| 1 | `{ not json` | “The file is not valid JSON (…)” |
| 2 | `schemaVersion: 2` | “This backup uses schema version 2, but this app understands up to 1…” |
| 3 | `sets: []` | “The backup contains no copy sets.” |
| 4 | `platformId: "tiktok"` | “sets[0].platformId must be one of: google, x, meta…” |
| 5 | `fields.headline: "text"` | “sets[0].fields.headline must be an array of strings.” |
| 6 | `fields.headline: ["ok", 42]` | “sets[0].fields.headline[1] is not a string.” |
| 7 | `name: ""` | “sets[0].name is required and must be a non-empty string.” |

### 4.3 Warning cases (import still succeeds)

| # | Mutation | Expected warning |
| --- | --- | --- |
| 1 | `fields.headline` with 6 descriptions | “only the first 4 were kept” |
| 2 | A single asset of 6,000 characters | “was truncated to 5000 characters” |
| 3 | `fields.surprise: "x"` on Google | “surprise is not a Google Ads field and was ignored” |
| 4 | `app: "something-else"` | “This file was tagged … Importing anyway.” |
| 5 | Two sets with the same `id` | Second id replaced by a generated one |

---

## 5. Storage failure behaviour

| # | How to simulate | Expected result |
| --- | --- | --- |
| 1 | Block storage for the origin (Firefox: `dom.storage.enabled=false`, or a private window with strict settings) | Red banner: “Local storage is unavailable… Counting and analysis still work.” |
| 2 | Fill localStorage to quota, then save | Toast: “Browser storage is full. Delete a saved copy set and try again.” |
| 3 | Corrupt a value, e.g. `localStorage.setItem('mccc:sets:v1', '{oops')` | Saved page renders the empty state; the app keeps working |
| 4 | Write `mccc:working:x:v1` with an unknown field | Unknown fields are ignored; known fields are restored |

Storage keys, for manual inspection:

```
mccc:settings:v1
mccc:working:google:v1
mccc:working:x:v1
mccc:working:meta:v1
mccc:keywords:v1
mccc:sets:v1
```

---

## 6. Browser workflow checklist

1. Type in a Google headline until it crosses 30 → counter turns red, summary pill reads “Over limit”, message states the overage.
2. Press Alt+2 → X tab keeps the Google text untouched; press Alt+1 → Google text is still there.
3. Reload the page → both working copies are restored.
4. Add headlines to 15 → “Add headline” disables; remove one → it re-enables and focus moves sensibly.
5. Enter 140 characters in Meta primary text → status “Beyond display recommendation”, preview shows “See more”.
6. Save a copy set → appears on the Saved copy page with a compliance pill; load it back → editor fields are replaced.
7. Export `.json`, delete the set, re-import the file → the set returns.
8. Import a file with `platformId: "tiktok"` → nothing is written and the error names the field.
9. Toggle the theme to Dark, reload → preference persists; “System” follows the OS setting.
10. Tab through the editor → visible focus rings on tabs, inputs, add/remove buttons, and dialogs trap focus with Escape closing them.
11. Resize to 375 px wide → tabs wrap, the side panels stack, no horizontal scrolling.
12. Paste `<script>alert(1)</script>` into a field → it renders as literal text in the editor, preview and saved card, and never executes.
