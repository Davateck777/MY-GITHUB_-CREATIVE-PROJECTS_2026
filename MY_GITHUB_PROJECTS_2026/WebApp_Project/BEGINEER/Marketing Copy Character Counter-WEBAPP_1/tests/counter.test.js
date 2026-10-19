import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countCodePoints,
  countDisplayWidth,
  countWeighted,
  countWords,
  measureField,
  measurePlatform,
  complianceSummary,
  checkAssetCount,
  worstStatus,
  flattenMeasurements,
  isDoubleWidth,
  STATUS,
  NEAR_LIMIT_RATIO
} from '../js/counter.js';
import { getPlatform, getField, PLATFORMS } from '../js/platforms.js';

const google = getPlatform('google');
const x = getPlatform('x');
const meta = getPlatform('meta');

const headlineField = getField('google', 'headline');
const descriptionField = getField('google', 'description');
const postField = getField('x', 'post');
const primaryTextField = getField('meta', 'primary_text');

test('code points count emoji as one and CJK as one', () => {
  assert.equal(countCodePoints('abc'), 3);
  assert.equal(countCodePoints('🎉'), 1);
  assert.equal(countCodePoints('日本語'), 3);
  assert.equal(countCodePoints(''), 0);
  assert.equal(countCodePoints(undefined), 0);
});

test('display width doubles CJK and non-BMP characters', () => {
  assert.equal(countDisplayWidth('abc'), 3);
  assert.equal(countDisplayWidth('日本語'), 6);
  assert.equal(countDisplayWidth('🎉'), 2);
  assert.equal(countDisplayWidth('aあ'), 3);
  assert.equal(countDisplayWidth(''), 0);
});

test('double-width ranges cover CJK, Hangul and fullwidth forms', () => {
  assert.equal(isDoubleWidth('あ'.codePointAt(0)), true);
  assert.equal(isDoubleWidth('한'.codePointAt(0)), true);
  assert.equal(isDoubleWidth('Ａ'.codePointAt(0)), true);
  assert.equal(isDoubleWidth('a'.codePointAt(0)), false);
  assert.equal(isDoubleWidth('é'.codePointAt(0)), false);
  assert.equal(isDoubleWidth('🎉'.codePointAt(0)), true); // non-BMP
});

test('X weighted counting: plain text, emoji, URLs and CJK', () => {
  assert.equal(countWeighted('hello world'), 11);
  // Every URL counts 23 regardless of real length.
  assert.equal(countWeighted('https://example.com'), 23);
  assert.equal(countWeighted('https://example.com/a/very/long/path/that/is/long'), 23);
  assert.equal(countWeighted('see https://example.com'), 27); // 4 + 23
  assert.equal(countWeighted('🎉'), 2);
  assert.equal(countWeighted('日本語'), 6);
  assert.equal(countWeighted(''), 0);
});

test('X boundary: exactly 280 is valid, 281 is not', () => {
  const atLimit = measureField('a'.repeat(280), postField);
  const overLimit = measureField('a'.repeat(281), postField);

  assert.equal(atLimit.count, 280);
  assert.equal(atLimit.status, STATUS.NEAR); // 280 >= ceil(0.9 * 280)
  assert.equal(atLimit.remaining, 0);
  assert.equal(atLimit.overage, 0);

  assert.equal(overLimit.count, 281);
  assert.equal(overLimit.status, STATUS.OVER);
  assert.equal(overLimit.remaining, -1);
  assert.equal(overLimit.overage, 1);
});

test('X weighted boundary via emoji: 140 emoji is exactly 280', () => {
  const text = '🎉'.repeat(140);
  const measured = measureField(text, postField);
  assert.equal(measured.count, 280);
  assert.equal(measured.status, STATUS.NEAR);
  assert.equal(measureField(`${text}🎉`, postField).status, STATUS.OVER);
});

test('Google headline boundary: 30 characters fits, 31 does not', () => {
  const atLimit = measureField('a'.repeat(30), headlineField);
  const overLimit = measureField('a'.repeat(31), headlineField);

  assert.equal(atLimit.count, 30);
  assert.equal(atLimit.status, STATUS.NEAR);
  assert.equal(atLimit.limitType, 'hard');
  assert.equal(overLimit.count, 31);
  assert.equal(overLimit.status, STATUS.OVER);
  assert.equal(overLimit.overage, 1);
});

test('Google counts a CJK headline at half the characters', () => {
  const fifteen = '日'.repeat(15);
  assert.equal(measureField(fifteen, headlineField).count, 30);
  assert.equal(measureField(fifteen, headlineField).status, STATUS.NEAR);
  assert.equal(measureField(`${fifteen}日`, headlineField).status, STATUS.OVER);
});

test('Google description boundary: 90 fits, 91 is over', () => {
  assert.equal(measureField('a'.repeat(90), descriptionField).status, STATUS.NEAR);
  assert.equal(measureField('a'.repeat(91), descriptionField).status, STATUS.OVER);
});

test('near-limit band starts at 90 percent and empty text is not a failure', () => {
  assert.equal(measureField('a'.repeat(26), headlineField).status, STATUS.WITHIN);
  assert.equal(measureField('a'.repeat(27), headlineField).status, STATUS.NEAR);
  assert.equal(NEAR_LIMIT_RATIO, 0.9);

  const empty = measureField('   ', headlineField);
  assert.equal(empty.status, STATUS.EMPTY);
  assert.equal(empty.isEmpty, true);
});

test('Meta fields are recommendations, not hard limits', () => {
  const beyond = measureField('a'.repeat(126), primaryTextField);
  assert.equal(beyond.status, STATUS.BEYOND);
  assert.equal(beyond.limitType, 'recommendation');
  assert.equal(beyond.overage, 1);

  const atLimit = measureField('a'.repeat(125), primaryTextField);
  assert.equal(atLimit.status, STATUS.NEAR);
});

test('user-defined targets never change compliance status', () => {
  const measured = measureField('a'.repeat(40), primaryTextField, { target: 30 });
  assert.equal(measured.target, 30);
  assert.equal(measured.targetExceeded, true);
  assert.equal(measured.status, STATUS.WITHIN); // 40 < 125 recommendation
});

test('word counts ignore punctuation-only tokens', () => {
  assert.equal(countWords('Hello, world!'), 2);
  assert.equal(countWords('— ..'), 0);
  assert.equal(countWords(''), 0);
  assert.equal(countWords('one two three'), 3);
});

test('asset-count checks enforce Google minimums and maximums', () => {
  assert.equal(checkAssetCount(2, headlineField).status, 'below');
  assert.equal(checkAssetCount(3, headlineField).status, 'ok');
  assert.equal(checkAssetCount(15, headlineField).status, 'ok');
  assert.equal(checkAssetCount(16, headlineField).status, 'above');

  assert.equal(checkAssetCount(1, descriptionField).status, 'below');
  assert.equal(checkAssetCount(2, descriptionField).status, 'ok');
  assert.equal(checkAssetCount(4, descriptionField).status, 'ok');
  assert.equal(checkAssetCount(5, descriptionField).status, 'above');

  const below = checkAssetCount(1, descriptionField);
  assert.match(below.message, /at least 2 descriptions/);
});

test('measurePlatform reports per-field measurements and explains overages', () => {
  const values = {
    headline: ['Same-day repair', 'a'.repeat(31), ''],
    description: ['Fast, booked online in 60 seconds', ''],
    path1: 'boilers',
    path2: ''
  };

  const result = measurePlatform(google, values);
  assert.equal(result.fields.headline.assets.length, 3);
  assert.equal(result.fields.headline.filledCount, 2);
  assert.equal(result.fields.headline.overCount, 1);
  assert.equal(result.fields.headline.assetCheck.status, 'below'); // only 2 headlines

  const overIssue = result.issues.find((issue) => issue.severity === 'error');
  assert.ok(overIssue);
  assert.match(overIssue.message, /over the 30-character limit/);

  // path2 is optional and empty: not an issue, and not counted as filled.
  assert.equal(result.fields.path2.status, STATUS.EMPTY);
});

test('measurePlatform flags a beyond-recommendation field without calling it an error', () => {
  const result = measurePlatform(meta, {
    primary_text: 'a'.repeat(140),
    headline: 'Same-day boiler repair',
    description: ''
  });

  assert.equal(result.fields.primary_text.status, STATUS.BEYOND);
  assert.equal(result.issues.filter((issue) => issue.severity === 'error').length, 0);
  assert.ok(result.issues.some((issue) => issue.severity === 'info' && /display recommendation/.test(issue.message)));
});

test('worstStatus ranks over > beyond > near > within > empty', () => {
  const make = (status) => ({ status, isEmpty: status === STATUS.EMPTY });
  assert.equal(worstStatus([]), STATUS.EMPTY);
  assert.equal(worstStatus([make(STATUS.EMPTY)]), STATUS.EMPTY);
  assert.equal(worstStatus([make(STATUS.WITHIN), make(STATUS.NEAR)]), STATUS.NEAR);
  assert.equal(worstStatus([make(STATUS.NEAR), make(STATUS.BEYOND)]), STATUS.BEYOND);
  assert.equal(worstStatus([make(STATUS.BEYOND), make(STATUS.OVER)]), STATUS.OVER);
});

test('flattenMeasurements expands asset lists', () => {
  const measured = measurePlatform(google, {
    headline: ['One', 'Two'],
    description: ['Desc one'],
    path1: '',
    path2: ''
  });
  const flat = flattenMeasurements(measured.fields);
  const headlineEntries = flat.filter((entry) => entry.field === 'headline');
  assert.equal(headlineEntries.length, 2);
  assert.equal(headlineEntries[0].value, 'One');
});

test('an untouched asset list reports the requirement without raising an issue', () => {
  const result = measurePlatform(google, {
    headline: ['', '', ''],
    description: ['', ''],
    path1: '',
    path2: ''
  });

  assert.equal(result.fields.headline.assetCheck.status, 'below');
  assert.equal(result.issues.length, 0, 'no warnings before the user has typed anything');
  assert.equal(result.status, STATUS.EMPTY);
});

test('an asset list that has started but is under the minimum does warn', () => {
  const result = measurePlatform(google, {
    headline: ['Same-day repair', '', ''],
    description: ['Fast booking', ''],
    path1: '',
    path2: ''
  });

  assert.ok(result.issues.some((issue) => issue.field === 'headline' && issue.severity === 'warning'));
});

test('complianceSummary separates hard failures from recommendations', () => {
  const hardFail = complianceSummary(google, {
    headline: ['a'.repeat(31)],
    description: [],
    path1: '',
    path2: ''
  });
  assert.equal(hardFail.blocking, true);
  assert.equal(hardFail.overCount, 1);

  const soft = complianceSummary(meta, {
    primary_text: 'a'.repeat(200),
    headline: '',
    description: ''
  });
  assert.equal(soft.blocking, false);
  assert.equal(soft.beyondCount, 1);
});

test('every platform field declares a known counting method and a source', () => {
  const methods = new Set(['codepoint', 'display-width', 'weighted']);
  for (const platform of PLATFORMS) {
    assert.ok(platform.sources.length >= 1, `${platform.id} has no sources`);
    for (const field of platform.fields) {
      assert.ok(methods.has(field.method), `${platform.id}.${field.key} has an unknown method`);
      assert.ok(field.limit > 0, `${platform.id}.${field.key} has no limit`);
      assert.ok(['hard', 'recommendation'].includes(field.limitType));
    }
  }
});
