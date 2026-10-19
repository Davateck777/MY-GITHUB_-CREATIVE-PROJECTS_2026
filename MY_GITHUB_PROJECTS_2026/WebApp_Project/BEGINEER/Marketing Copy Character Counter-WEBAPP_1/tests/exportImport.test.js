import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APP_ID,
  BACKUP_VERSION,
  buildBackup,
  serializeBackup,
  parseBackup,
  validateSet,
  mergeSets,
  toPlainText,
  toPlainTextBundle,
  slugify,
  filenameFor,
  fieldsForPlatform
} from '../js/exportImport.js';
import { getPlatform } from '../js/platforms.js';

const google = getPlatform('google');

const sampleSet = (overrides = {}) => ({
  id: 'set-abc123',
  name: 'Boiler campaign — UK',
  platformId: 'google',
  placement: 'Responsive search ad',
  fields: {
    headline: ['Same-day boiler repair', 'Gas Safe engineers'],
    description: ['Booked online in 60 seconds. No call-out fee.'],
    path1: 'boilers',
    path2: ''
  },
  keywords: ['boiler repair', 'same-day'],
  targets: { headline: 25 },
  notes: 'Spring promo.',
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-02T09:00:00.000Z',
  ...overrides
});

test('backup round-trips through serialise and parse', () => {
  const json = serializeBackup([sampleSet()], { exportedAt: '2026-10-19T10:00:00.000Z' });
  const parsed = parseBackup(json);

  assert.equal(parsed.ok, true, parsed.errors.join('; '));
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.sets.length, 1);
  assert.equal(parsed.sets[0].name, 'Boiler campaign — UK');
  assert.deepEqual(parsed.sets[0].fields.headline, ['Same-day boiler repair', 'Gas Safe engineers']);
  assert.deepEqual(parsed.sets[0].keywords, ['boiler repair', 'same-day']);
  assert.equal(parsed.sets[0].targets.headline, 25);
  assert.equal(parsed.meta.schemaVersion, BACKUP_VERSION);
});

test('backup root carries the app id, schema version and count', () => {
  const backup = buildBackup([sampleSet(), sampleSet({ id: 'set-def456' })]);
  assert.equal(backup.app, APP_ID);
  assert.equal(backup.schemaVersion, BACKUP_VERSION);
  assert.equal(backup.count, 2);
  assert.equal(backup.sets.length, 2);
});

test('invalid JSON is rejected with a readable error', () => {
  const parsed = parseBackup('{ not json');
  assert.equal(parsed.ok, false);
  assert.match(parsed.errors[0], /not valid JSON/);
});

test('a backup from a newer schema is refused', () => {
  const parsed = parseBackup(
    JSON.stringify({ app: APP_ID, schemaVersion: BACKUP_VERSION + 1, sets: [sampleSet()] })
  );
  assert.equal(parsed.ok, false);
  assert.match(parsed.errors.join(' '), /schema version/);
});

test('missing or empty sets array is rejected', () => {
  assert.equal(parseBackup(JSON.stringify({ app: APP_ID, schemaVersion: 1 })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: APP_ID, schemaVersion: 1, sets: [] })).ok, false);
});

test('an unknown platform is rejected per set', () => {
  const parsed = parseBackup(
    JSON.stringify({
      app: APP_ID,
      schemaVersion: BACKUP_VERSION,
      sets: [sampleSet({ platformId: 'tiktok' })]
    })
  );
  assert.equal(parsed.ok, false);
  assert.match(parsed.errors.join(' '), /platformId must be one of/);
});

test('wrong field types are rejected with a field path', () => {
  const parsed = parseBackup(
    JSON.stringify({
      app: APP_ID,
      schemaVersion: BACKUP_VERSION,
      sets: [
        sampleSet({
          fields: { headline: 'not-an-array', description: ['ok'], path1: '', path2: '' }
        })
      ]
    })
  );
  assert.equal(parsed.ok, false);
  assert.match(parsed.errors.join(' '), /sets\[0\]\.fields\.headline must be an array/);
});

test('non-string asset entries are rejected', () => {
  const result = validateSet({
    name: 'Bad',
    platformId: 'google',
    fields: { headline: ['ok', 42], description: [], path1: '', path2: '' }
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /headline\[1\] is not a string/);
});

test('unknown fields and over-long assets are warnings, not failures', () => {
  const result = validateSet({
    name: 'Warned',
    platformId: 'google',
    fields: {
      headline: ['a'.repeat(6000), 'b'],
      description: ['c'],
      path1: '',
      path2: '',
      surprise: 'ignored'
    }
  });

  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((warning) => /was truncated/.test(warning)));
  assert.ok(result.warnings.some((warning) => /surprise is not a Google Ads field/.test(warning)));
  assert.equal(result.set.fields.headline[0].length, 5000);
  assert.equal('surprise' in result.set.fields, false);
});

test('asset arrays are clipped to the platform maximum', () => {
  const result = validateSet({
    name: 'Many descriptions',
    platformId: 'google',
    fields: {
      headline: ['a'],
      description: ['1', '2', '3', '4', '5'],
      path1: '',
      path2: ''
    }
  });
  assert.equal(result.set.fields.description.length, 4);
  assert.ok(result.warnings.some((warning) => /only the first 4 were kept/.test(warning)));
});

test('missing name is an error', () => {
  const result = validateSet({ platformId: 'x', fields: { post: 'hi' } });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /name is required/);
});

test('names longer than 120 characters are rejected', () => {
  const result = validateSet({ name: 'n'.repeat(121), platformId: 'x', fields: { post: '' } });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /longer than 120 characters/);
});

test('a set without an id gets a generated one', () => {
  const parsed = parseBackup(
    JSON.stringify({
      app: APP_ID,
      schemaVersion: BACKUP_VERSION,
      sets: [{ name: 'No id', platformId: 'x', fields: { post: 'hello' } }]
    })
  );
  assert.equal(parsed.ok, true, parsed.errors.join('; '));
  assert.match(parsed.sets[0].id, /^[A-Za-z0-9_-]{6,80}$/);
});

test('duplicate ids inside one file are made unique', () => {
  const json = JSON.stringify({
    app: APP_ID,
    schemaVersion: BACKUP_VERSION,
    sets: [sampleSet(), sampleSet()]
  });
  const parsed = parseBackup(json);
  assert.equal(parsed.ok, true);
  assert.notEqual(parsed.sets[0].id, parsed.sets[1].id);
});

test('field keys from another platform do not leak into the set', () => {
  const result = validateSet({
    name: 'Mixed',
    platformId: 'x',
    fields: { post: 'hi', headline: ['nope'] }
  });
  assert.equal(result.ok, true);
  assert.equal(result.set.fields.post, 'hi');
  assert.equal(result.set.fields.headline, undefined);
  assert.ok(result.warnings.some((warning) => /headline is not a X field/.test(warning)));
});

test('merge keeps existing sets and overwrites id clashes', () => {
  const existing = [sampleSet({ name: 'Old name' })];
  const incoming = [sampleSet({ name: 'New name' }), sampleSet({ id: 'set-new999', name: 'Fresh' })];

  const merged = mergeSets(existing, incoming, 'merge');
  assert.equal(merged.sets.length, 2);
  assert.equal(merged.added, 1);
  assert.equal(merged.replaced, 1);
  assert.equal(merged.sets.find((set) => set.id === 'set-abc123').name, 'New name');
});

test('replace discards everything currently stored', () => {
  const existing = [sampleSet({ id: 'set-old111' })];
  const incoming = [sampleSet({ id: 'set-new999' })];

  const merged = mergeSets(existing, incoming, 'replace');
  assert.equal(merged.sets.length, 1);
  assert.equal(merged.sets[0].id, 'set-new999');
  assert.equal(merged.removed, 1);
});

test('plain-text export orders fields and numbers assets', () => {
  const text = toPlainText(sampleSet());
  assert.match(text, /Boiler campaign — UK/);
  assert.match(text, /Google Ads/);
  assert.match(text, /Headlines \(2\):/);
  assert.match(text, /1\. Same-day boiler repair/);
  assert.match(text, /2\. Gas Safe engineers/);
  assert.match(text, /Descriptions \(1\):/);
  assert.match(text, /Display path 1:\nboilers/);
  assert.match(text, /Target keywords:\nboiler repair, same-day/);
  assert.doesNotMatch(text, /Display path 2:/); // empty fields are omitted
});

test('plain-text bundle separates multiple sets', () => {
  const bundle = toPlainTextBundle([sampleSet(), sampleSet({ id: 'set-def456', name: 'Second' })]);
  assert.equal((bundle.match(/={60}/g) ?? []).length, 2);
  assert.match(bundle, /Second/);
});

test('slugify produces safe filename stems', () => {
  assert.equal(slugify('Boiler Campaign — UK / Spring'), 'boiler-campaign-uk-spring');
  assert.equal(slugify('   '), 'copy-set');
  assert.equal(slugify('Café Déjà Vu'), 'cafe-deja-vu');
  assert.match(filenameFor('Boiler Campaign', 'json'), /^boiler-campaign-\d{4}-\d{2}-\d{2}\.json$/);
});

test('fieldsForPlatform normalises values for the editor', () => {
  const fields = fieldsForPlatform(sampleSet(), google);
  assert.deepEqual(fields.headline, ['Same-day boiler repair', 'Gas Safe engineers']);
  assert.equal(fields.path2, '');

  const sparse = fieldsForPlatform({ fields: {} }, google);
  assert.deepEqual(sparse.headline, ['']);
  assert.equal(sparse.path1, '');
});

test('prototype-pollution style payloads do not escape validation', () => {
  const parsed = parseBackup(
    JSON.stringify({
      app: APP_ID,
      schemaVersion: BACKUP_VERSION,
      sets: [{ name: 'Pollute', platformId: 'x', fields: { post: 'hi', __proto__: { evil: true } } }]
    })
  );
  assert.equal(parsed.ok, true);
  assert.equal({}.evil, undefined);
  assert.equal(Object.getPrototypeOf(parsed.sets[0].fields), Object.prototype);
});
