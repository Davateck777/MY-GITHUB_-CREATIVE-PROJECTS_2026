/** Tests verify explainable scoring and counting, including empty and over-limit input. */
import test from "node:test";
import assert from "node:assert/strict";
import { charCount, analyzeField, analyzeDraft } from "../js/analysis.js";
test("counts Unicode code points", () => assert.equal(charCount("A😀"), 2));
test("empty text has zero score", () =>
  assert.equal(analyzeDraft({}).score, 0));
test("nonempty within-limit text with no keywords rescales weights", () =>
  assert.equal(
    analyzeField("Brand consultant | Strategy", "headline", "").score,
    100,
  ));
test("length overflow is flagged", () => {
  const a = analyzeField("abcdef", "headline", "", 5);
  assert.equal(a.checks[0].value, 0);
  assert.ok(a.suggestions[0].includes("1 characters"));
});
test("coverage penalizes missing keywords", () => {
  const a = analyzeField("Brand strategist", "headline", "brand, leadership");
  assert.equal(a.metrics.coverage, 50);
  assert.equal(a.score, 85);
});
test("readability identifies long sentences and paragraphs", () => {
  const a = analyzeField(Array(81).fill("work").join(" "), "about", "");
  assert.equal(a.longSentences, 1);
  assert.equal(a.longParagraphs, 1);
  assert.equal(a.checks[2].value, 55);
});
test("repetition and generic terms are disclosed", () => {
  const a = analyzeField("Guru brand brand brand", "headline", "brand");
  assert.equal(a.checks[3].value, 55);
  assert.ok(a.suggestions.some((x) => x.includes("Reduce repeated")));
});
test("overall score equally averages fields", () => {
  const a = analyzeDraft({
    headline: "Consultant | Brand",
    about: "",
    keywords: "",
  });
  assert.equal(a.score, 50);
});
