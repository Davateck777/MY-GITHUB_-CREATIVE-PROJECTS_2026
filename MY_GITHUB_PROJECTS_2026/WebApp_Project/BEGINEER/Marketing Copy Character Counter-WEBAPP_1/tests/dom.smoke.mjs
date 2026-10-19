/**
 * dom.smoke.mjs — optional browser-workflow smoke test.
 *
 * Not part of `npm test` (which runs pure logic only, no dependencies).
 * Requires jsdom:  npm install --no-save jsdom@24  &&  npm run test:dom
 *
 * Covers: field rendering, live counting, asset add/remove limits, X weighted
 * counting through the UI, Meta recommendation wording, preview rendering for
 * all three platforms, device toggle, per-platform persistence, and the saved
 * copy page including search filtering.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let JSDOM;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  console.log('SKIP: jsdom is not installed. Run `npm install --no-save jsdom@24` first.');
  process.exit(0);
}

const editorHtml = readFileSync(join(root, 'editor.html'), 'utf8');
const savedHtml = readFileSync(join(root, 'saved.html'), 'utf8');

const dom = new JSDOM(editorHtml, { url: 'https://example.test/editor.html', pretendToBeVisual: true });
const { window } = dom;

global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.HTMLInputElement = window.HTMLInputElement;
global.Node = window.Node;
global.Event = window.Event;
global.CustomEvent = window.CustomEvent;
global.localStorage = window.localStorage;
global.navigator = window.navigator;
global.Blob = window.Blob ?? Blob;
global.URL = window.URL;
window.matchMedia = window.matchMedia ?? (() => ({ matches: false, addEventListener() {} }));
global.matchMedia = window.matchMedia;

const { initEditor } = await import(join(root, 'js/editor.js'));
const { initSaved } = await import(join(root, 'js/saved.js'));

let failures = 0;
const check = (condition, message) => {
  if (condition) {
    console.log(`ok   ${message}`);
  } else {
    failures += 1;
    console.error(`FAIL ${message}`);
  }
};

const fire = (node, type) => node.dispatchEvent(new window.Event(type, { bubbles: true }));

initEditor();

const panel = document.querySelector('[data-editor-panel]');

check(panel.querySelectorAll('.field').length === 5, 'editor renders 5 fields for Google');
check(panel.querySelectorAll('[data-assets="headline"] .asset').length === 3, 'headline list opens with 3 rows');
check(document.querySelectorAll('.tab').length === 3, 'three platform tabs render');

const headlineInput = panel.querySelector('[data-field="headline"][data-index="0"]');
headlineInput.value = 'Same-day boiler repair in Lagos'; // 31 display-width characters
fire(headlineInput, 'input');
const counter = panel.querySelector('[data-assetcounter="headline:0"]');
check(/31\/30/.test(counter.textContent), `asset counter shows 31/30 (got "${counter.textContent}")`);
check(counter.querySelector('.asset__count--over') !== null, 'over-limit asset is styled as over');
const summaryText = () => document.querySelector('[data-editor-summary]').textContent;
check(/over the 30-character limit/.test(summaryText()), 'summary explains the overage');
check(/Over limit/.test(summaryText()), 'compliance pill reports Over limit');

headlineInput.value = '日'.repeat(15);
fire(headlineInput, 'input');
check(/30\/30/.test(panel.querySelector('[data-assetcounter="headline:0"]').textContent), 'CJK headline of 15 characters counts as 30');

const addBtn = panel.querySelector('[data-add="description"]');
check(addBtn.disabled === false, 'add description enabled at 2 of 4');
fire(addBtn, 'click');
check(panel.querySelectorAll('[data-assets="description"] .asset').length === 3, 'adding a description row works');
fire(addBtn, 'click');
check(addBtn.disabled === true, 'add description disabled at 4 of 4');

fire(document.querySelector('#tab-x'), 'click');
const postArea = panel.querySelector('#input-x-post');
check(postArea !== null, 'X tab renders the post textarea');
postArea.value = 'Ship it 🎉 https://example.com/launch'; // 8 + 2 + 1 + 23 = 34 weighted
fire(postArea, 'input');
const xFoot = panel.querySelector('[data-counter="post"]').textContent.replace(/\s+/g, ' ');
check(/34 \/ 280/.test(xFoot), `X weighted count is 34/280 (got "${xFoot}")`);

fire(document.querySelector('#tab-meta'), 'click');
const primary = panel.querySelector('#input-meta-primary_text');
primary.value = 'a'.repeat(140);
fire(primary, 'input');
check(/display recommendation/.test(summaryText()), 'Meta overage is described as a display recommendation');
check(/Beyond display recommendation/.test(summaryText()), 'Meta uses the Beyond display recommendation label');
check(document.querySelector('.pv-meta__more') !== null, 'Meta preview marks truncation with See more');

let previewOk = true;
for (const id of ['google', 'x', 'meta']) {
  fire(document.querySelector(`#tab-${id}`), 'click');
  if (!document.querySelector('[data-editor-preview] .pv')) previewOk = false;
}
check(previewOk, 'illustrative preview renders for all three platforms');

fire(document.querySelector('[data-device="desktop"]'), 'click');
check(document.querySelector('.preview--desktop') !== null, 'desktop preview toggle works');

const ring = document.querySelector('.score__ring');
check(Boolean(ring && ring.style.getPropertyValue('--score-percent')), 'score ring receives its percentage');

const metaStored = window.localStorage.getItem('mccc:working:meta:v1');
check(Boolean(metaStored && JSON.parse(metaStored).primary_text.length === 140), 'Meta working copy persisted');
const xStored = window.localStorage.getItem('mccc:working:x:v1');
check(Boolean(xStored && /Ship it/.test(JSON.parse(xStored).post)), 'X working copy persisted independently');

// Saved page
const savedBody = savedHtml.replace(/^[\s\S]*<body[^>]*>/, '').replace(/<\/body>[\s\S]*$/, '');
window.document.body.innerHTML = savedBody;
window.localStorage.setItem('mccc:sets:v1', JSON.stringify([{
  id: 'set-abc123',
  name: 'Boiler campaign',
  platformId: 'google',
  placement: 'Responsive search ad',
  fields: { headline: ['Same-day repair', 'Gas Safe'], description: ['Booked in 60 seconds.'], path1: '', path2: '' },
  keywords: ['boiler'],
  targets: {},
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}]));
initSaved();
const cards = document.querySelectorAll('.set-card');
check(cards.length === 1, 'saved page renders a stored set');
check(/Boiler campaign/.test(cards[0].textContent), 'saved card shows the set name');

const search = document.querySelector('[data-saved-search]');
search.value = 'zzzz';
fire(search, 'input');
check(document.querySelectorAll('.set-card').length === 0, 'search filters out non-matching sets');

if (failures) {
  console.error(`\n${failures} DOM check(s) failed.`);
  process.exit(1);
}
console.log('\nAll DOM checks passed.');
