/** Tests keep keyword matching deterministic and Unicode-aware. */
import test from "node:test";
import assert from "node:assert/strict";
import { parseKeywords, keywordMetrics, words } from "../js/keywords.js";
test("keywords are normalized, deduplicated and punctuation-only entries ignored", () =>
  assert.deepEqual(parseKeywords(" Brand,brand, strategy, !!!"), [
    "brand",
    "strategy",
  ]));
test("keywords are capped at 30", () =>
  assert.equal(
    parseKeywords(Array.from({ length: 40 }, (_, i) => `term${i}`)).length,
    30,
  ));
test("whole words do not match substrings", () =>
  assert.equal(keywordMetrics("branding", "brand").rows[0].count, 0));
test("phrases are case-insensitive and punctuation insensitive", () =>
  assert.equal(
    keywordMetrics("Brand-strategy and BRAND strategy.", "brand strategy")
      .rows[0].count,
    2,
  ));
test("density counts phrase occurrences over total words", () =>
  assert.ok(
    Math.abs(
      keywordMetrics("brand strategy works", "brand strategy").rows[0].density -
        100 / 3,
    ) < 1e-10,
  ));
test("Unicode letters are retained", () =>
  assert.equal(
    keywordMetrics("Stratégie numérique", "stratégie").rows[0].count,
    1,
  ));
test("empty word count avoids NaN", () =>
  assert.equal(keywordMetrics("", "brand").rows[0].density, 0));
test("apostrophes remain inside tokens", () =>
  assert.deepEqual(words("let’s build"), ["let’s", "build"]));
