# User test data — Marketing Copy Character Counter

**A hands-on walkthrough written for a person using the app**, not for the test runner.

Work through it top to bottom. Where it says *Paste this*, copy the block exactly. Where it
says *You should see*, the wording is the **actual text the app renders** — if your screen
says something else, that is a bug worth reporting.

- **Time:** about 25 minutes for all 16 scenarios.
- **Device:** a modern browser (Chrome, Edge, Firefox, Safari). Test once on desktop and once
  at phone width.
- **Data:** everything here stays in your browser. Nothing is uploaded.
- **Tester:** ______________________  **Date:** ______________  **Build:** `1.0.0`

> **How this differs from `TEST-DATA.md`** — that file holds engine-level fixtures
> (counting boundaries, validation payloads, storage keys). This file is the *user journey*:
> goals, clicks, exact on-screen responses, and a pass/fail log you can hand to someone else.

---

## Contents

| Part | Scenarios | What it proves |
| --- | --- | --- |
| [Part 1](#part-1--counting) | A–F | Counting, limits and Google asset rules behave as a user expects |
| [Part 2](#part-2--the-three-platforms) | G–I | X weighting, Meta recommendations, keyword handling |
| [Part 3](#part-3--saving-and-moving-copy) | J–M | Working copies, saving, exporting, importing, rejection |
| [Part 4](#part-4--interface-and-failure) | N–P | Previews, themes, keyboard, mobile, storage failure |
| [Log](#results-log) | — | Record pass/fail |
| [Never see this](#you-should-never-see-this) | — | Regression guards |

---

## Before you start (2 minutes)

1. Open the app:
   - **Live / hosted:** the site URL.
   - **Local:** `npm start` in the project folder, then <http://localhost:8080>.
     (ES modules will not load if you double-click the HTML files.)
2. Open **DevTools → Console**. Keep it visible for the whole run.
3. Press **F5** once, so a stale saved session cannot influence results.
4. Have a pen or a notes app ready — you will tick boxes.

**Clean slate (only if you have used the app before):** DevTools → *Application* →
*Local Storage* → delete the keys starting `mccc:`, then reload.

> Expected console output for the entire run: **nothing**. No warnings, no errors.

---

## Test bank — copy-paste strings

Every value below was measured by the shipped code, so it is safe to quote as "expected".

| # | String | Where | Count |
| --- | --- | --- | --- |
| 1 | `Same-day boiler repair` | Google headline / Meta headline | 22 |
| 2 | `Gas Safe engineers, 7 days` | Google headline | 26 — one short of the near-limit band |
| 3 | `Booked online in 60 seconds` | Google headline | 27 — first "Near limit" character |
| 4 | `Same-day boiler repair in Lagos` | Google headline | 31 — over by 1 |
| 5 | `日日日日日日日日日日日日日日日` (15 × 日) | Google headline | **30** (double width) |
| 6 | `🔥 Hot deal` | Google headline | **11** (emoji = 2) |
| 7 | `aaaa…` (280 × a) | X post | 280 |
| 8 | `aaaa…` (281 × a) | X post | 281 |
| 9 | `https://example.com` | X post | **23**, however long the URL is |
| 10 | `Ship it 🎉 https://example.com/launch` | X post | **34** (8 + 2 + 1 + 23) |
| 11 | `We shipped weighted counting. Links count as 23 → https://example.com/notes` | X post | 74 |
| 12 | `aaaa…` (125 × a) | Meta primary text | 125 |
| 13 | `aaaa…` (126 × a) | Meta primary text | 126 |

Handy generators if you would rather not paste:

```js
// 280 characters — run in DevTools
'a'.repeat(280)
```

---

# Part 1 — Counting

## Scenario A — First look at an empty editor

**Goal:** an untouched editor must not look like failing copy.

1. Open **Editor**.
2. Change nothing.

| You should see | Exact text |
| --- | --- |
| Score ring | `—` with `unscored` beneath |
| Grade line | `Not scored yet` (grey, not red) |
| Compliance pill | `No text yet` |
| Compliance detail | `Nothing entered yet.` |
| Issue list | `No limit problems detected.` |
| Headlines footer | `0 of 15 filled — 3 required.` |
| Descriptions footer | `0 of 4 filled — 2 required.` |
| Writing suggestions | *none shown* |

- [ ] No red "Weak" score on an empty editor
- [ ] No warning triangles before I have typed anything

---

## Scenario B — Draft a compliant Google ad

**Goal:** the everyday case. Copy fits, asset count is valid.

Paste into **Headlines** (use *Add headline* to reach five rows):

```
Same-day boiler repair
Gas Safe engineers, 7 days
Booked online in 60 seconds
```

Paste into **Descriptions**:

```
Local engineers across Lagos. Fixed quotes, no call-out fee.
Booked in 60 seconds. Card payment and a 12-month guarantee.
```

Set **Display path 1** to `boilers`. Leave display path 2 empty.

| Where | You should see |
| --- | --- |
| Each asset counter | `22/30`, `26/30`, `27/30`, `60/90`, `60/90` |
| `27/30` counter | amber/near styling |
| Headlines footer | `3 of 15 headlines filled — asset count is valid.` |
| Descriptions footer | `2 of 4 descriptions filled — asset count is valid.` |
| Compliance pill | `Near limit` (because 27 of 30 is inside the last 10%) |
| Issue list | `No limit problems detected.` |
| Score | **97** · `Strong` |
| Preview | Headlines separated by `·`, path shown as `› boilers` |

- [ ] Counters match the table
- [ ] 27/30 is flagged *near*, 26/30 is not
- [ ] Display path 2 simply reads `No text yet` — no error

---

## Scenario C — Go one character over a hard limit

**Goal:** hard limits fail loudly and explain themselves.

1. Click the first headline and paste:

```
Same-day boiler repair in Lagos
```

2. Look at the right-hand panel.

| Where | You should see |
| --- | --- |
| That asset's counter | `31/30` in red |
| Compliance pill | `Over limit` |
| Compliance detail | `1 field over a hard limit.` |
| Issue list | `Headline 1 is 1 character over the 30-character limit.` |
| Preview | the headline still renders (it is your text, not the platform's) |

3. Now delete the words ` in Lagos` and watch the status return to green as you type.

- [ ] The message names the *field* and the *exact overage*
- [ ] Status recovers live while typing — no reload needed
- [ ] The app does not block typing (this is a checker, not an editor lock)

---

## Scenario D — Chinese / Japanese / Korean copy

**Goal:** Google counts double-width characters as two. Half the text, same limit.

Paste into headline 1 (select-all first):

```
日日日日日日日日日日日日日日日
```

| Where | You should see |
| --- | --- |
| Asset counter | `30/30` (15 characters, counted as 30) |
| Status | `Near limit` |
| Words | `1 word` |

Add one more `日`:

| Where | You should see |
| --- | --- |
| Asset counter | `32/30` — over |
| Issue list | `Headline 1 is 2 characters over the 30-character limit.` |

- [ ] 15 CJK characters count as 30, not 15
- [ ] The counter never says "15/30"

---

## Scenario E — Emoji in a headline

**Goal:** emoji are counted without breaking the count or the preview.

Paste into headline 1:

```
🔥 Hot deal
```

| Where | You should see |
| --- | --- |
| Asset counter | `11/30` (9 characters + emoji counted as 2) |
| Preview | the flame renders, no tofu box, no broken layout |

- [ ] Count is 11, not 10 (emoji counted as 2 — a deliberately conservative Google rule)
- [ ] Emoji does not disable saving or analysis

---

## Scenario F — Manage the Google asset list

**Goal:** add, remove, and hit the platform ceilings.

1. Click **Add headline** repeatedly until the button greys out.
2. Count the headline rows.

| Check | Expected |
| --- | --- |
| Number of headline rows | 15 |
| **Add headline** button | disabled |
| Footer | `15 of 15 headlines filled — asset count is valid.` (once all are filled) |
| Removing a headline | button re-enables immediately |
| Removing down to zero rows | impossible — toast: `Keep at least one field, or clear its text instead.` |
| Remove button label (screen reader) | `Remove headline 1` |

3. With only **one** filled headline and 14 empty rows, the footer reads:
   `Google Ads needs at least 3 headlines — 1 filled in so far.`

- [ ] Cannot exceed 15 headlines / 4 descriptions
- [ ] The minimum warning only appears once I have started filling the list
- [ ] Focus stays sensible after adding or removing a row

---

# Part 2 — The three platforms

## Scenario G — X weighted counting

**Goal:** X does not count characters like a text box does.

1. Click the **X** tab.
2. Paste `a` × 280 (see the generator above).

| Where | You should see |
| --- | --- |
| Counter | `280 / 280 characters`, `0 left` |
| Pill | `Near limit` |

3. Add one more `a` (281):

| Where | You should see |
| --- | --- |
| Counter | `281 / 280 characters`, `1 over` |
| Pill | `Over limit` |
| Notice | `Over the hard limit by 1 character. Post text cannot be saved on this platform until it is shorter.` |

4. Replace everything with:

```
https://example.com/a/very/long/path/that/keeps/going
```

| Where | You should see |
| --- | --- |
| Counter | `23 / 280 characters` — the real URL length is 53 |

5. Replace with:

```
Ship it 🎉 https://example.com/launch
```

| Where | You should see |
| --- | --- |
| Counter | `34 / 280 characters` |
| Words | `3 words` |

- [ ] Any URL counts 23, regardless of its real length
- [ ] Emoji counts 2
- [ ] "1 character", not "1 characters"; "3 words", not "3 word"

---

## Scenario H — Meta recommendations are not caps

**Goal:** Meta truncates rather than rejects; the app must not cry "error".

1. Click the **Meta** tab.
2. Paste `a` × 125 into **Primary text**.

| Where | You should see |
| --- | --- |
| Counter | `125 / 125 recommended` |
| Pill | `Near limit` |

3. Paste `a` × 126:

| Where | You should see |
| --- | --- |
| Counter | `126 / 125 recommended`, `1 over` |
| Pill | `Beyond display recommendation` (blue, **not** red) |
| Notice | `This is a display recommendation, not a cap. About 1 character will likely sit behind "See more".` |
| Preview | `…` followed by `See more` |

4. Paste a real sentence instead:

```
Your boiler breaks on a Sunday. We fix it before the kettle boils. Same-day engineers across Lagos.
```

| Where | You should see |
| --- | --- |
| Counter | `99 / 125 recommended` |
| Preview | full text, **no** "See more" |

- [ ] Over-recommendation is never worded as "Over limit"
- [ ] No red error styling for a Meta field
- [ ] "About 1 character" is singular

---

## Scenario I — Target keywords and honest scoring

**Goal:** keywords help you, and their absence must not hurt you.

1. Return to **Google Ads**. Paste the Scenario B copy again.
2. Leave **Target keywords** empty.
3. Read the **Score breakdown** note:

```
Weights are disclosed and re-normalised when a check is unavailable. Excluded: Keyword coverage (15).
```

| Check | Expected |
| --- | --- |
| Score | **97** with keywords empty |
| Keyword coverage row | greyed, labelled `excluded`, `not scored` |

4. Enter keywords: `boiler repair, same-day, Lagos`

| Where | You should see |
| --- | --- |
| Score | **98** |
| Note | `All checks ran.` |
| Keyword coverage row | `100/100`, `3 of 3 keywords present.` |

5. Change keywords to `boiler repair, heat pump`

| Where | You should see |
| --- | --- |
| Score | **90** (2 of 3 checks-worth of coverage) |
| Keyword row | `50/100`, `1 of 2 keywords present.` |
| Breakdown | one deduction naming `"heat pump"` |
| Suggestion | `Work these keywords in naturally: heat pump.` |

- [ ] Empty keywords never zero the score
- [ ] The note states which checks were excluded
- [ ] Missing keywords are named, not just counted

---

# Part 3 — Saving and moving copy

## Scenario J — Nothing is lost when I switch tabs or reload

**Goal:** each platform keeps its own draft.

1. Google: headline 1 = `Same-day boiler repair in Lagos`.
2. Press **Alt+2** → X tab. Type `Ship it 🎉 https://example.com/launch`.
3. Press **Alt+3** → Meta tab. Type `Booked in 60 seconds` in the headline.
4. Press **Alt+1**, then press **F5**.

| Check | Expected |
| --- | --- |
| Google headline 1 after reload | `Same-day boiler repair in Lagos` |
| X post after pressing Alt+2 | `Ship it 🎉 https://example.com/launch` |
| Meta headline after Alt+3 | `Booked in 60 seconds` |
| Leave-site prompt | **none** — every keystroke is already saved, so a warning would be misleading |
| Console | no errors |

- [ ] Three independent working copies
- [ ] Survives a page reload
- [ ] Alt+1 / Alt+2 / Alt+3 switch platforms

---

## Scenario K — Save, rename, duplicate, search, delete

**Goal:** the library behaves like a user expects.

1. In the editor click **Save set**.
2. Dialog appears: title `Save this copy set`, hint
   `Saved in this browser only. Use Export .json for a portable backup.`
3. Type a name — `Boiler campaign — Lagos` — and press **Save set**.

| Where | You should see |
| --- | --- |
| Toast | `Saved "Boiler campaign — Lagos".` |
| Nav badge | `Saved copy 1` |

4. Open **Saved copy**.

| Where | You should see |
| --- | --- |
| Library line | `1 set · ~2 KB used in this browser` |
| Card heading | `Boiler campaign — Lagos` |
| Card subtitle | `Google Ads · Responsive search ad` |
| Card status pill | `Over limit` (if your copy still has the 31-character headline) or `Near limit` |
| Actions | `Load / Rename / Duplicate / Copy / Export .txt / Export .json / Delete` |
| Date line | `Updated <date>, <time>` |

5. **Rename** → `Boiler — Q4` → toast `Renamed.`
6. **Duplicate** → two cards, the new one named `Boiler — Q4 (copy)`
7. Search `gas safe` → narrows to matching sets; search `zzz` → `No saved copy matches "zzz".`
8. **Delete** the copy → dialog title `Delete "Boiler — Q4 (copy)"?`, confirm button `Delete set` →
   toast `Deleted.` → one card remains.
9. Press **Load** on the remaining card.

| Check | Expected |
| --- | --- |
| Lands in the editor on the Google tab | yes |
| Fields restored | yes, including every asset |
| Platform follows the set | yes (an X set opens the X tab) |

- [ ] Every action gives visible confirmation
- [ ] Deleting can be cancelled
- [ ] Loading a set replaces the working copy without touching other platforms

---

## Scenario L — Export and re-import

**Goal:** round-trip my copy without losing anything.

1. Saved copy → **Export all (.json)**.

| Check | Expected |
| --- | --- |
| Downloaded file | `marketing-copy-counter-backup-<date>.json` |
| Toast | `Backup of 1 set downloaded.` |

2. Open the file in a text editor.

| Check | Expected |
| --- | --- |
| `"app"` | `"marketing-copy-counter"` |
| `"schemaVersion"` | `1` |
| Headlines | a JSON array of strings |
| Keywords | a JSON array |

3. Return to Saved copy → **Import backup** → choose that file.
4. A dialog appears: `Import 1 copy set?` with body
   `Merge keeps your 1 existing set and overwrites any with the same id. Replace deletes them and keeps only this file.`
   and buttons `Cancel / Replace all / Merge`.
5. Choose **Merge**.

| Where | You should see |
| --- | --- |
| Report | `Imported 1 set — 0 added, 1 replaced (merge).` |

6. Delete the saved set, then import the same file again (library now empty).

| Where | You should see |
| --- | --- |
| Dialog | **none** — an empty library imports straight away |
| Report | `Imported 1 set — 1 added, 0 replaced (merge).` |
| Toast | `Import complete.` |

7. In the editor, **Export .txt** and **Copy set**.

| Check | Expected |
| --- | --- |
| Text file | `google-copy-<date>.txt` (or `<platform>-copy-<date>.txt`) |
| Text file contents | name, platform, `Headlines (N):` numbered, `Descriptions (N):`, paths, keywords, notes |
| Copy set toast | `Whole copy set copied to the clipboard.` |
| Copy single field | `Post text copied.` |

- [ ] The exported JSON re-imports cleanly
- [ ] Merge keeps my other sets
- [ ] Plain-text export is readable with no JSON punctuation

---

## Scenario M — Import something broken

**Goal:** bad files are refused *before* anything is written.

1. Save this as `bad.json` and import it:

```json
{
  "app": "marketing-copy-counter",
  "schemaVersion": 1,
  "sets": [
    { "name": "", "platformId": "tiktok", "fields": {} },
    { "name": "Typed wrong", "platformId": "google", "fields": { "headline": "text", "description": [] } }
  ]
}
```

| Where | You should see |
| --- | --- |
| Report heading | `Nothing was imported. Fix the issues below and try again.` |
| Error 1 | `sets[0].platformId must be one of: google, x, meta. Received "tiktok".` |
| Error 2 | `sets[1].fields.headline must be an array of strings.` |
| Saved copy list | **unchanged** — my existing sets are still there |

2. Import a file containing `{ not json`.

| Where | You should see |
| --- | --- |
| Error | `The file is not valid JSON (…)` |

3. Import a file with `"schemaVersion": 9`.

| Where | You should see |
| --- | --- |
| Error | `This backup uses schema version 9, but this app understands up to 1. Update the app before importing.` |

4. Import this *warning-only* file and choose **Merge**:

```json
{
  "app": "other-app",
  "schemaVersion": 1,
  "sets": [
    {
      "name": "Warned",
      "platformId": "google",
      "fields": { "headline": ["<a 6000-character string>", "b"], "description": ["c"], "surprise": "ignored" }
    }
  ]
}
```

| Where | You should see |
| --- | --- |
| Report | `Imported 1 set — 1 added, 0 replaced (merge).` |
| Warning 1 | `This file was tagged "other-app", not "marketing-copy-counter". Importing anyway.` |
| Warning 2 | `sets[0].fields.headline[0] was truncated to 5000 characters.` |
| Warning 3 | `sets[0].fields.surprise is not a Google Ads field and was ignored.` |

- [ ] Errors are specific enough to fix the file
- [ ] A failed import changes nothing
- [ ] Warnings still import, and say what was altered

---

# Part 4 — Interface and failure

## Scenario N — Previews

**Goal:** previews help me judge the copy, without pretending to be the platform.

1. Editor → **Google Ads** with copy from Scenario B.

| Where | You should see |
| --- | --- |
| Toggle | `As served` / `All assets` |
| As served | up to 3 headlines joined by `·`, 2 descriptions |
| Note | `Illustrative SERP layout — up to 3 headlines and 2 descriptions can show at once.` |
| All assets | every filled headline on its own line |

2. Add two extra headlines, switch to **All assets** — all five appear, each on its own line.
3. Toggle **Mobile** / **Desktop**.

| Check | Expected |
| --- | --- |
| Desktop | preview widens |
| Mobile | preview narrows to a phone-width frame |
| Every preview carries a caption | `Illustrative … layout — real truncation varies by device, font size and placement.` |

4. Repeat on **X** (post card with link styling) and **Meta** (feed card with creative block, CTA).

- [ ] No preview claims to be exact
- [ ] Google "All assets" shows the copy that will not be on screen at the same time
- [ ] Nothing in a preview is clickable or misleading

---

## Scenario O — Themes, keyboard, phone

**Goal:** usable without a mouse, and on a small screen.

1. Click the theme button three times.

| Click | Button label | Page |
| --- | --- | --- |
| 1 | `☀ Theme: light` | light |
| 2 | `☾ Theme: dark` | dark |
| 3 | `◐ Theme: system` | follows the OS setting |

2. Reload — your last choice is remembered.
3. Keyboard only: press **Tab** from the top of the page.

| Check | Expected |
| --- | --- |
| Focus ring | visible on every link, tab, input and button |
| Platform tabs | reachable by Tab; Arrow keys move between Google / X / Meta |
| Dialogs | focus moves inside, **Escape** closes, Tab does not escape the dialog |
| Skip link | first Tab reveals `Skip to content` |

4. Narrow the window to phone width (or DevTools → iPhone).

| Check | Expected |
| --- | --- |
| Layout | one column; score, preview and breakdown stack under the editor |
| Platform tabs | all three fit in one row, no clipped words |
| Horizontal scrolling | none |
| Menu button | opens the nav; closes when you choose a link |

- [ ] Theme cycles and persists
- [ ] Everything reachable and operable by keyboard
- [ ] No horizontal scrolling at 390 px wide

---

## Scenario P — When storage is blocked

**Goal:** the app degrades honestly instead of losing work silently.

**Firefox:** `about:config` → set `dom.storage.enabled` to `false`, reload the app.
**Chrome/Edge:** DevTools → run `Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } })`
in the console before reloading (or use a strict private window).

| Check | Expected |
| --- | --- |
| Banner | `Local storage is unavailable. Saving, working-copy recovery and import/export history are disabled in this browser session. Counting and analysis still work.` |
| Typing | still counts, still scores, still previews |
| Saving a set | toast with the failure reason, nothing pretends to have saved |
| Console | no unhandled errors |

If instead your storage is *full* (not blocked), saving shows:
`Browser storage is full. Delete a saved copy set and try again.`

- [ ] A clear banner explains the limitation
- [ ] Counting keeps working
- [ ] No silent data loss

---

## Results log

| # | Scenario | Pass | Fail | Notes / evidence |
| --- | --- | --- | --- | --- |
| A | Empty editor | ☐ | ☐ | |
| B | Compliant Google ad | ☐ | ☐ | |
| C | One over a hard limit | ☐ | ☐ | |
| D | CJK double width | ☐ | ☐ | |
| E | Emoji counting | ☐ | ☐ | |
| F | Asset list limits | ☐ | ☐ | |
| G | X weighted counting | ☐ | ☐ | |
| H | Meta recommendations | ☐ | ☐ | |
| I | Keywords and scoring | ☐ | ☐ | |
| J | Working copies persist | ☐ | ☐ | |
| K | Save / rename / duplicate / search / delete | ☐ | ☐ | |
| L | Export and re-import | ☐ | ☐ | |
| M | Broken import rejected | ☐ | ☐ | |
| N | Previews | ☐ | ☐ | |
| O | Themes, keyboard, phone | ☐ | ☐ | |
| P | Storage blocked | ☐ | ☐ | |

**Sign-off:** ______ / 16 scenarios passed. Console clean: ☐ yes ☐ no.

### Bug report template

```
Scenario:        (A–P)
Step:            (the exact click or paste)
Input:           (the exact text, or "see paste block 4")
Expected:        (quote the wording from this file)
Actual:          (what appeared)
Browser / OS:
Console output:
Screenshot:
```

---

## You should never see this

Fast regression checks. If any of these appear, stop and file a bug:

| Never | Why |
| --- | --- |
| `1 words`, `1 characters`, `1 fields` | counts must be pluralised correctly |
| `0` or `Weak` on an untouched editor | an empty workspace is not a bad score |
| `undefined`, `NaN`, `[object Object]` anywhere | a value is escaping unformatted |
| `null / null characters` | a field measurement failed |
| The same warning twice (e.g. minimum headlines in both the issue list and suggestions) | duplicated feedback |
| A Meta field labelled `Over limit` | Meta publishes recommendations, not caps |
| A preview claiming to be exact (`This is how it will look`) | previews are illustrative |
| A red error for having typed nothing in an optional field | optional fields stay quiet |
| An import that writes data *and* reports errors | validation happens before writing |
| Your text rendered as HTML, or a `<script>` tag executing | all copy is inserted as text |
| A white screen after any action | every action must recover |

---

## What this run already found

Kept here as a record, so the same defects are not re-introduced:

| Found during this walkthrough | Status |
| --- | --- |
| Counter read `1 words` for a single word | **Fixed** — counts now use a plural helper |
| Meta notice read `About 1 characters` | **Fixed** |
| Empty editor showed a red `0 · Weak` score | **Fixed** — now `— · Not scored yet` |
| Minimum-asset warning appeared before anything was typed, and was repeated in suggestions | **Fixed** — shown once, only after the first asset is filled |
| `No link in the copy` suggested on Meta and Google | **Fixed** — the link suggestion is scoped to X |
| "Google Ads" wrapped mid-word in the mobile tab strip | **Fixed** — all three tabs fit one row at 390 px |
| Browser "leave site?" prompt on reload after typing, despite the draft already being saved | **Fixed** — the guard was removed rather than left lying to the user |
