import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyseCopy,
  checkCapitalisation,
  checkKeywords,
  checkRepetition,
  checkScanability,
  checkSpecificity,
  checkCoverage,
  collectCopy,
  gradeFor,
  CHECK_WEIGHTS
} from '../js/analysis.js';
import { getPlatform } from '../js/platforms.js';

const google = getPlatform('google');
const meta = getPlatform('meta');
const x = getPlatform('x');

const metaValues = (overrides = {}) => ({
  primary_text: 'Your boiler breaks on a Sunday. We fix it before the kettle boils.',
  headline: 'Same-day boiler repair',
  description: 'Booked in 60 seconds',
  ...overrides
});

test('weights are disclosed and sum to 100', () => {
  const total = Object.values(CHECK_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  assert.equal(total, 100);
});

test('collectCopy skips empty fields and labels assets', () => {
  const copy = collectCopy(google, {
    headline: ['First', '', 'Third'],
    description: [''],
    path1: '',
    path2: ''
  });
  assert.deepEqual(
    copy.map((item) => item.label),
    ['Headline 1', 'Headline 3']
  );
});

test('scanability penalises very long sentences', () => {
  const short = checkScanability([
    { label: 'Post text', text: 'Short and clear. One idea per sentence.', multiline: true }
  ]);
  const long = checkScanability([
    {
      label: 'Post text',
      text: 'This sentence keeps going well past the point where a reader can comfortably hold the whole idea in their head while also parsing the clause that follows it and the one after that.',
      multiline: true
    }
  ]);

  assert.equal(short.score, 100);
  assert.ok(long.score < 100);
  assert.ok(long.deductions.some((deduction) => /longer than 20 words/.test(deduction.detail)));
});

test('scanability flags unbroken multiline blocks over 220 characters', () => {
  const result = checkScanability([
    { label: 'Primary text', text: 'word '.repeat(60).trim(), multiline: true }
  ]);
  assert.ok(result.deductions.some((deduction) => /no line breaks/.test(deduction.detail)));
});

test('specificity rewards numbers and action verbs, penalises vague phrases', () => {
  const concrete = checkSpecificity([
    { label: 'Headline', text: 'Book boiler repair in 60 seconds — free quote' }
  ]);
  const vague = checkSpecificity([
    { label: 'Headline', text: 'We strive to deliver world-class quality service' }
  ]);

  assert.ok(concrete.score > vague.score);
  assert.ok(vague.deductions.some((deduction) => /world-class/.test(deduction.detail)));
  assert.ok(concrete.signals.includes('number'));
});

test('capitalisation flags ALL-CAPS words and shouty fields', () => {
  const shouty = checkCapitalisation([
    { label: 'Headline', text: 'BEST BOILER DEALS THIS WEEK ONLY' }
  ]);
  const calm = checkCapitalisation([
    { label: 'Headline', text: 'Best boiler deals this week only' }
  ]);

  assert.ok(shouty.score < calm.score);
  assert.equal(calm.score, 100);
  assert.ok(shouty.deductions.some((deduction) => /full capitals/.test(deduction.detail)));
});

test('repetition ignores stop words but catches repeated content words', () => {
  const result = checkRepetition([
    { label: 'Headline 1', text: 'boiler repair lagos' },
    { label: 'Headline 2', text: 'boiler repair fast' },
    { label: 'Headline 3', text: 'boiler repair now' }
  ]);
  assert.ok(result.score < 100);
  assert.ok(result.deductions.some((deduction) => /“boiler” appears/.test(deduction.detail)));

  const clean = checkRepetition([{ label: 'Headline 1', text: 'the and of the' }]);
  assert.equal(clean.score, 100);
});

test('keyword coverage is excluded when no keywords are supplied', () => {
  const excluded = checkKeywords([{ label: 'Post', text: 'anything' }], []);
  assert.equal(excluded.available, false);
  assert.equal(excluded.score, 100);
  assert.match(excluded.detail, /Excluded/);

  const partial = checkKeywords(
    [{ label: 'Post', text: 'same-day boiler repair in Lagos' }],
    ['boiler', 'plumber']
  );
  assert.equal(partial.available, true);
  assert.equal(partial.score, 50);
  assert.deepEqual(partial.missing, ['plumber']);
});

test('coverage counts only required fields', () => {
  const coverage = checkCoverage(meta, { primary_text: 'Copy here', headline: '', description: '' });
  assert.equal(coverage.available, true);
  assert.equal(coverage.score, 50); // primary_text and headline are required
  assert.deepEqual(coverage.empty, ['Headline']);
});

test('excluded checks are removed from the denominator, never scored as zero', () => {
  const values = metaValues();
  const withKeywords = analyseCopy(meta, values, { keywords: ['boiler', 'sunday'] });
  const withoutKeywords = analyseCopy(meta, values, { keywords: [] });

  assert.ok(withoutKeywords.excluded.some((entry) => entry.id === 'keywords'));
  assert.ok(!withKeywords.excluded.some((entry) => entry.id === 'keywords'));
  assert.equal(withKeywords.availableWeight, 100);
  assert.equal(withoutKeywords.availableWeight, 85);
  // The same copy should not be punished for omitting optional keywords.
  assert.ok(withoutKeywords.score >= withKeywords.score);
});

test('an empty keyword field cannot drag a perfect set below the top band', () => {
  const result = analyseCopy(
    meta,
    {
      primary_text: 'Book boiler repair in 60 seconds. Free quote, no call-out fee.',
      headline: 'Same-day boiler repair',
      description: 'Booked in 60 seconds'
    },
    { keywords: [] }
  );
  assert.ok(result.score >= 70);
  assert.ok(['Strong', 'Good'].includes(result.grade));
});

test('analyseCopy exposes a full breakdown with points per deduction', () => {
  const result = analyseCopy(google, {
    headline: ['BEST BOILER DEALS EVER', 'Best boiler deals ever', 'Cheap boiler deals'],
    description: ['We strive to deliver world-class quality service to every single customer we serve.'],
    path1: '',
    path2: ''
  });

  assert.equal(result.checks.length, 6);
  for (const check of result.checks) {
    assert.equal(typeof check.score, 'number');
    assert.equal(typeof check.weight, 'number');
    assert.equal(typeof check.label, 'string');
  }
  const withDeductions = result.checks.find((check) => check.deductions.length > 0);
  assert.ok(withDeductions);
  assert.ok(result.suggestions.length <= 5);
});

test('Google-specific suggestions catch duplicate headlines and asset shortfalls', () => {
  const result = analyseCopy(google, {
    headline: ['Same-day repair', 'Same-day repair'],
    description: ['Fast, booked in 60 seconds', 'Gas Safe engineers, same-day booking'],
    path1: '',
    path2: ''
  });

  const texts = result.suggestions.map((suggestion) => suggestion.id);
  assert.ok(texts.includes('duplicate-assets'));
  assert.ok(texts.includes('assets'));
});

test('the missing-link suggestion only applies to X', () => {
  const xIds = analyseCopy(x, { post: 'Ship it today' }, { keywords: [] }).suggestions.map((s) => s.id);
  const metaIds = analyseCopy(meta, metaValues(), { keywords: [] }).suggestions.map((s) => s.id);
  const googleIds = analyseCopy(
    google,
    { headline: ['Same-day repair'], description: ['Booked in 60 seconds'], path1: '', path2: '' },
    { keywords: [] }
  ).suggestions.map((s) => s.id);

  assert.ok(xIds.includes('url'));
  assert.ok(!metaIds.includes('url'));
  assert.ok(!googleIds.includes('url'));
});

test('an untouched editor produces no minimum-asset suggestions', () => {
  const result = analyseCopy(google, { headline: ['', '', ''], description: ['', ''], path1: '', path2: '' });
  assert.equal(result.suggestions.filter((s) => s.id === 'assets').length, 0);
});

test('grade bands match the published thresholds', () => {
  assert.equal(gradeFor(100).grade, 'Strong');
  assert.equal(gradeFor(85).grade, 'Strong');
  assert.equal(gradeFor(84).grade, 'Good');
  assert.equal(gradeFor(70).grade, 'Good');
  assert.equal(gradeFor(69).grade, 'Needs work');
  assert.equal(gradeFor(50).grade, 'Needs work');
  assert.equal(gradeFor(49).grade, 'Weak');
});

test('analysis runs on an empty working copy without throwing', () => {
  const result = analyseCopy(x, { post: '' });
  assert.equal(result.hasCopy, false);
  assert.equal(result.wordCount, 0);
  assert.equal(typeof result.score, 'number');
  assert.ok(result.excluded.length >= 1); // keyword coverage excluded
});
