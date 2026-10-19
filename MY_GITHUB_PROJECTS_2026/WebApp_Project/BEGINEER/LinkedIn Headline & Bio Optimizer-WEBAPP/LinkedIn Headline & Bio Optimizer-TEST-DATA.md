# LinkedIn Headline & Bio Optimizer — Test Data

**App:** Profilecraft  
**Author:** Mr DAVE ADEX | DAVA TECK  
**Prepared:** 2026-10-14

## How to use

1. Open the Optimizer and choose **New draft**. Save or export any existing work first.
2. Paste a case exactly, including the blank lines in its About section. Do not paste code fences.
3. Use limits **220 headline / 2,600 About** unless a case says otherwise.
4. Switch between Headline and About analysis. The large score is the overall average, not the selected-field score.
5. Save named versions for draft management and comparison tests.

All examples are **fictional QA fixtures**, not claims about the author or any real person. Expected analysis below was calculated using the existing application engine. Scores are editing guidance, not LinkedIn ranking predictions.

Characters count Unicode code points, including spaces and line breaks. Keyword matching is case-insensitive and uses complete word tokens. Density is phrase occurrences / field word count × 100, displayed to one decimal place. Multiword phrases count as one occurrence; overlapping selected terms count independently.

## Expected-results summary

| Case | Headline chars | About chars | Headline score | About score | Overall score |
|---|---:|---:|---:|---:|---:|
| TD-01 | 58 | 268 | 100 | 100 | 100 |
| TD-02 | 50 | 330 | 100 | 100 | 100 |
| TD-03 | 60 | 247 | 80 | 80 | 80 |
| TD-04 | 49 | 170 | 100 | 100 | 100 |
| TD-05 | 41 | 101 | 83 | 83 | 83 |
| TD-06 | 49 | 131 | 100 | 100 | 100 |
| TD-07 | 35 | 167 | 100 | 100 | 100 |
| TD-08 | 0 | 0 | 0 | 0 | 0 |
| TD-09 | 28 | 86 | 100 | 100 | 100 |
| TD-10 | 11 | 8 | 64 | 100 | 82 |
| TD-11 | 26 | 404 | 100 | 84 | 92 |

## TD-01 — Brand strategy consultant

**Purpose:** Clear positioning with all selected terms present.

| Planning field | Input |
|---|---|
| Draft name | Brand strategy consultant |
| Target role | Personal brand consultant |
| Audience | Founders and independent professionals |
| Keywords | personal branding, brand strategy, founders |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Personal Branding Consultant | Brand Strategy for Founders
```

**About / executive bio**

```text
I help founders clarify their personal branding and communicate their expertise.

My work combines brand strategy, audience research, and practical writing. I focus on a clear message that people can understand and use.

Message me to discuss your next profile update.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 58 | 7 | 100% | 100/100 |
| About | 268 | 41 | 100% | 100/100 |

**Overall score:** 100/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| personal branding | 1 | 14.3% | 1 | 2.4% |
| brand strategy | 1 | 14.3% | 1 | 2.4% |
| founders | 1 | 14.3% | 1 | 2.4% |

**Headline suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

**About suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

## TD-02 — Executive positioning

**Purpose:** Executive-style bio, readable paragraphs, and relevant keywords.

| Planning field | Input |
|---|---|
| Draft name | Executive positioning |
| Target role | Operations executive |
| Audience | Business leaders and growing teams |
| Keywords | operations, leadership, transformation |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Operations Executive | Leadership & Transformation
```

**About / executive bio**

```text
I work with business leaders to improve operations and support growing teams.

My leadership approach focuses on clear priorities, useful processes, and open communication. I support transformation by helping teams understand what needs to change and why.

Connect with me to exchange ideas about building effective organisations.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 50 | 4 | 100% | 100/100 |
| About | 330 | 47 | 100% | 100/100 |

**Overall score:** 100/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| operations | 1 | 25.0% | 1 | 2.1% |
| leadership | 1 | 25.0% | 1 | 2.1% |
| transformation | 1 | 25.0% | 1 | 2.1% |

**Headline suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

**About suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

## TD-03 — Career transition

**Purpose:** Missing keywords should be disclosed without inventing experience.

| Planning field | Input |
|---|---|
| Draft name | Career transition |
| Target role | Aspiring product manager |
| Audience | Hiring teams |
| Keywords | product management, user research, roadmap |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Customer Success Specialist | Moving into Product Management
```

**About / executive bio**

```text
I am exploring product management after working in customer-facing roles.

I enjoy understanding customer needs and explaining complex ideas clearly. I am looking for opportunities to learn and contribute to a product team.

Message me to connect.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 60 | 7 | 33% | 80/100 |
| About | 247 | 38 | 33% | 80/100 |

**Overall score:** 80/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| product management | 1 | 14.3% | 1 | 2.6% |
| user research | 0 | 0.0% | 0 | 0.0% |
| roadmap | 0 | 0.0% | 0 | 0.0% |

**Headline suggestions:**
- Consider naturally including: user research, roadmap.

**About suggestions:**
- Consider naturally including: user research, roadmap.

## TD-04 — No keywords

**Purpose:** Keyword coverage is excluded from scoring; other weights are rescaled.

| Planning field | Input |
|---|---|
| Draft name | No keywords |
| Target role | Independent designer |
| Audience | Small businesses |
| Keywords | (leave blank) |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Independent Designer | Clear Visual Communication
```

**About / executive bio**

```text
I help small businesses communicate through thoughtful design.

My focus is clarity, consistency, and accessible visual content.

Message me to discuss your next project.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 49 | 5 | Not evaluated | 100/100 |
| About | 170 | 24 | Not evaluated | 100/100 |

**Overall score:** 100/100.

**Headline suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

**About suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

## TD-05 — Buzzwords and repetition

**Purpose:** Trigger generic-phrase and excessive repetition warnings.

| Planning field | Input |
|---|---|
| Draft name | Buzzwords and repetition |
| Target role | Marketing consultant |
| Audience | Business owners |
| Keywords | brand |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Brand guru | Brand ninja | Brand rockstar
```

**About / executive bio**

```text
Brand brand brand. I am a results-driven thought leader who delivers synergy.

Message me to connect.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 41 | 6 | 100% | 83/100 |
| About | 101 | 17 | 100% | 83/100 |

**Overall score:** 83/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| brand | 3 | 50.0% | 3 | 17.6% |

**Headline suggestions:**
- Replace generic phrases with specific expertise or evidence.
- Reduce repeated keywords; prioritise natural language.

**About suggestions:**
- Replace generic phrases with specific expertise or evidence.
- Reduce repeated keywords; prioritise natural language.

## TD-06 — Whole-word and phrase matching

**Purpose:** Branding alone does not match brand; Brand-strategy matches the multiword phrase.

| Planning field | Input |
|---|---|
| Draft name | Whole-word and phrase matching |
| Target role | Brand strategist |
| Audience | Founders |
| Keywords | brand, brand strategy, strategy |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Branding Consultant | Brand-strategy for Founders
```

**About / executive bio**

```text
Brand strategy helps founders communicate clearly. My branding work starts with the audience.

Connect with me to discuss strategy.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 49 | 6 | 100% | 100/100 |
| About | 131 | 19 | 100% | 100/100 |

**Overall score:** 100/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| brand | 1 | 16.7% | 1 | 5.3% |
| brand strategy | 1 | 16.7% | 1 | 5.3% |
| strategy | 1 | 16.7% | 2 | 10.5% |

**Headline suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

**About suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

## TD-07 — Unicode profile

**Purpose:** Exercise Unicode matching and code-point counts. The globe emoji counts as one code point.

| Planning field | Input |
|---|---|
| Draft name | Unicode profile |
| Target role | Communication consultant |
| Audience | International professionals |
| Keywords | stratégie, leadership |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Conseil en stratégie | Leadership 🌍
```

**About / executive bio**

```text
J’accompagne les professionnels dans leur stratégie de communication.

Mon approche du leadership privilégie la clarté et l’écoute.

Connect with me to exchange ideas.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 35 | 4 | 100% | 100/100 |
| About | 167 | 23 | 100% | 100/100 |

**Overall score:** 100/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| stratégie | 1 | 25.0% | 1 | 4.3% |
| leadership | 1 | 25.0% | 1 | 4.3% |

**Headline suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

**About suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

## TD-08 — Empty profile

**Purpose:** Both field scores and overall score should be zero. Saving a completely empty profile should be refused.

| Planning field | Input |
|---|---|
| Draft name | Empty profile |
| Target role | (leave blank) |
| Audience | (leave blank) |
| Keywords | brand strategy |
| Limits | Headline 220; About 2600 |

**Headline**

Leave this field completely blank.

**About / executive bio**

Leave this field completely blank.

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 0 | 0 | 0% | 0/100 |
| About | 0 | 0 | 0% | 0/100 |

**Overall score:** 0/100.

| Keyword | Headline occurrences | Headline density | About occurrences | About density |
|---|---:|---:|---:|---:|
| brand strategy | 0 | 0.0% | 0 | 0.0% |

**Headline suggestions:**
- Write your headline to get feedback.
- Consider naturally including: brand strategy.

**About suggestions:**
- Write your About section to get feedback.
- Consider naturally including: brand strategy.

## TD-09 — Safe rendering

**Purpose:** HTML-like content should appear literally. No injected elements or alerts should execute.

| Planning field | Input |
|---|---|
| Draft name | Safe rendering |
| Target role | Security test |
| Audience | QA reviewers |
| Keywords | (leave blank) |
| Limits | Headline 220; About 2600 |

**Headline**

```text
<img src=x onerror=alert(1)>
```

**About / executive bio**

```text
<script>alert("test")</script>

This is a rendering test, not a real professional bio.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 28 | 6 | Not evaluated | 100/100 |
| About | 86 | 14 | Not evaluated | 100/100 |

**Overall score:** 100/100.

**Headline suggestions:**
- Try separating your role, speciality, and value with a divider.

**About suggestions:**
- Consider ending with a clear invitation to connect.

## TD-10 — Custom limit overflow

**Purpose:** Set headline limit to 10. Eleven characters should trigger overflow. Restore the limit to 220 afterward.

| Planning field | Input |
|---|---|
| Draft name | Custom limit overflow |
| Target role | Length test |
| Audience | QA reviewers |
| Keywords | (leave blank) |
| Limits | Headline 10; About 2600 |

**Headline**

```text
ABCDEFGHIJK
```

**About / executive bio**

```text
Connect.
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 11 | 1 | Not evaluated | 64/100 |
| About | 8 | 1 | Not evaluated | 100/100 |

**Overall score:** 82/100.

**Headline suggestions:**
- Trim 1 characters to fit the configured limit.
- Try separating your role, speciality, and value with a divider.

**About suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

## TD-11 — Long sentence and paragraph

**Purpose:** A deliberately artificial 81-word sentence/paragraph triggers both readability warnings.

| Planning field | Input |
|---|---|
| Draft name | Long sentence and paragraph |
| Target role | Readability test |
| Audience | QA reviewers |
| Keywords | (leave blank) |
| Limits | Headline 220; About 2600 |

**Headline**

```text
Consultant | Communication
```

**About / executive bio**

```text
work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work work
```

**Expected analysis**

| Field | Characters | Words | Keyword coverage | Field score |
|---|---:|---:|---:|---:|
| Headline | 26 | 2 | Not evaluated | 100/100 |
| About | 404 | 81 | Not evaluated | 84/100 |

**Overall score:** 92/100.

**Headline suggestions:**
- No rule-based flags. The app shows a reminder to review specificity and accuracy.

**About suggestions:**
- Break sentences over 30 words into shorter ideas.
- Split paragraphs over 80 words for easier scanning.
- Consider ending with a clear invitation to connect.

## Backup/import fixture

Copy only the JSON below to a UTF-8 file named **profilecraft-test-backup.json**. Choose Import backup on Saved Drafts and accept the confirmation. The Markdown document itself is not an importable backup.

Expected: two drafts imported. Reimporting this fixture replaces those same IDs instead of duplicating them. Other drafts and the active working copy remain unchanged.

```json
{
  "version": 1,
  "exportedAt": "2026-10-14T12:00:00.000Z",
  "drafts": [
    {
      "id": "profilecraft-test-1",
      "name": "Brand strategy consultant",
      "headline": "Personal Branding Consultant | Brand Strategy for Founders",
      "about": "I help founders clarify their personal branding and communicate their expertise.\n\nMy work combines brand strategy, audience research, and practical writing. I focus on a clear message that people can understand and use.\n\nMessage me to discuss your next profile update.",
      "role": "Personal brand consultant",
      "audience": "Founders and independent professionals",
      "keywords": "personal branding, brand strategy, founders",
      "updatedAt": "2026-10-14T12:00:00.000Z"
    },
    {
      "id": "profilecraft-test-2",
      "name": "Executive positioning",
      "headline": "Operations Executive | Leadership & Transformation",
      "about": "I work with business leaders to improve operations and support growing teams.\n\nMy leadership approach focuses on clear priorities, useful processes, and open communication. I support transformation by helping teams understand what needs to change and why.\n\nConnect with me to exchange ideas about building effective organisations.",
      "role": "Operations executive",
      "audience": "Business leaders and growing teams",
      "keywords": "operations, leadership, transformation",
      "updatedAt": "2026-10-14T12:00:00.000Z"
    }
  ]
}
```

## Workflow checklist

| Test | Action | Expected outcome |
|---|---|---|
| Save / edit | Save TD-01; open Saved Drafts; choose Edit | Named draft appears and its fields restore. |
| Working-copy autosave | Change editor text, then refresh | Working copy restores on the same browser/origin. Named versions change only after Save draft. |
| Baseline comparison | Save TD-05; start TD-01; select TD-05 as baseline | Overall score changes 83 → 100 (+17); character deltas also appear. |
| Duplicate / rename | Duplicate TD-01 and rename the copy | A separate ID appears; renaming leaves profile text unchanged. |
| Search / sort | Search by name, headline, or role; switch sorting | Results filter; ordering follows the selected option. Draft-list scores use default limits. |
| Theme | Switch theme and move between pages | Theme persists across pages. |
| Preview | Toggle Desktop / Mobile | Preview width changes without changing text. |
| About expansion | Use TD-02; toggle See more / Show less | Full text and the illustrative 320-character cutoff alternate. |
| Templates | Apply Executive / founder to a disposable draft | Placeholder text replaces headline and About after confirmation when required. |
| Clipboard | Copy headline and About | Exact text copies if permissions allow; otherwise a warning appears. |
| Text export | Export TD-01 | Download includes the name, HEADLINE, and ABOUT. |
| Backup export | Export saved drafts | Version 1 JSON includes named drafts, not the unsaved working copy. |
| Delete / cancel | Delete a disposable copy; test cancellation separately | Confirmed copy disappears; cancellation leaves it intact. |
| Planning notes | Change only target role/audience | Notes save; scores and preview text do not change. |

## Boundary and negative tests

Use disposable drafts and backup files. Never clear real browser data without exporting it first.

| ID | Input / action | Expected outcome |
|---|---|---|
| B-01 | Headline limit 10; text `ABCDEFGHIJ` | 10/10; Length check 100/100. |
| B-02 | Same limit; text `ABCDEFGHIJK` | 11/10; overflow indication; Length check 0/100. Restore limit to 220. |
| B-03 | About limit 10; compare `ABCDEFGHIJ` and `ABCDEFGHIJK` | Exact limit passes; one-character overflow fails Length. Restore limit to 2,600. |
| B-04 | Commit a limit of 0, a fraction, or above 20,000 | Error shown; previous valid limit restored. |
| B-05 | Keywords `Brand, brand, strategy, !!!` | Two valid unique terms: brand and strategy. |
| B-06 | More than 30 unique keywords | Only the first 30 normalized valid terms are evaluated. |
| B-07 | Headline `Branding consultant`; keyword `brand` | Brand is missing; substring matching does not apply. |
| B-08 | Import malformed JSON such as `{` | Error; no saved drafts changed. |
| B-09 | Change fixture version to 2 | Backup rejected; no saved drafts changed. |
| B-10 | Remove About, use numeric About, invalid date, or duplicate IDs in a backup | Validation rejects the entire file before writing. |
| B-11 | Import a file over 5 MB or more than 500 entries | Rejected. |
| B-12 | Cancel import confirmation | Existing saved drafts remain unchanged. |
| B-13 | Block browser storage in a test browser | Autosave/storage warning appears; text export is still available. |
| B-14 | Inspect TD-09 preview | Content is literal text, not executable HTML. |
| B-15 | Test ordinary fixtures at 320px and 390px widths | Panels stack; controls remain usable without horizontal page overflow. |

## Manual result log

Record actual outcomes here. Expected fixture values do not imply every workflow in this document was executed during its preparation.

| Case / workflow | Browser & viewport | Actual outcome | Pass / Fail | Notes |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

**Reminder:** A high score does not prove accuracy, persuasion, or search ranking. Do not publish fictional examples as real achievements.
