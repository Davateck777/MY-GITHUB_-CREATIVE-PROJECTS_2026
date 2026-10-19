/* --------------------------------------------------------------------------
   CORE UNIT TESTS: Verifies URL construction, validation, parsing, and labels
   without requiring a browser or DOM test framework.
   -------------------------------------------------------------------------- */
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUrl, defaultLabel, parseParams, validate } from '../js/utmBuilder.js';

test('buildUrl encodes parameters and preserves existing query parameters', () => {
  const url = buildUrl({ baseUrl: 'https://example.com/book?ref=homepage#top', utm_source: 'LinkedIn', utm_medium: 'social', utm_campaign: 'spring launch', utm_term: '', utm_content: 'hero cta' });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('ref'), 'homepage');
  assert.equal(parsed.searchParams.get('utm_source'), 'LinkedIn');
  assert.equal(parsed.searchParams.get('utm_campaign'), 'spring launch');
  assert.equal(parsed.searchParams.get('utm_content'), 'hero cta');
  assert.equal(parsed.hash, '#top');
});

test('validate blocks invalid URLs and warns on missing recommended fields', () => {
  const result = validate({ baseUrl: 'not a url', utm_source: '', utm_medium: '', utm_campaign: '' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('validate returns warnings when the URL is valid but recommended parameters are absent', () => {
  const result = validate({ baseUrl: 'https://example.com', utm_source: '', utm_medium: '', utm_campaign: '' });
  assert.equal(result.valid, true);
  assert.equal(result.warnings.length, 3);
});

test('parseParams removes UTM fields from the editable base URL', () => {
  const parsed = parseParams('https://example.com/book?ref=site&utm_source=instagram&utm_campaign=launch');
  assert.equal(parsed.baseUrl, 'https://example.com/book?ref=site');
  assert.equal(parsed.utm_source, 'instagram');
  assert.equal(parsed.utm_campaign, 'launch');
});

test('defaultLabel falls back to campaign, source, then a safe placeholder', () => {
  assert.equal(defaultLabel({ label: '', utm_campaign: 'launch', utm_source: 'linkedin' }), 'launch');
  assert.equal(defaultLabel({ label: '', utm_campaign: '', utm_source: 'linkedin' }), 'linkedin');
  assert.equal(defaultLabel({ label: '' }), 'Untitled campaign');
});
