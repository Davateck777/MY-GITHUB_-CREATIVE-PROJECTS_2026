/* --------------------------------------------------------------------------
   BUILDER IMPORTS: Loads only the modules needed on the separate Builder page.
   -------------------------------------------------------------------------- */
import { buildUrl, defaultLabel, validate } from './utmBuilder.js';
import { PRESETS, getPreset } from './presets.js';
import { getFormValues, clearForm, renderValidation, setFormValues } from './ui.js';
import { listLinks, saveLink } from './storage.js';
import { showToast } from './toast.js';

const form = document.getElementById('builder-form');
const validationBox = document.getElementById('validation-box');
const preview = document.getElementById('preview-url');

/* --------------------------------------------------------------------------
   PREVIEW STATE: Rebuilds the URL and recommended-parameter progress while the
   user edits any builder field.
   -------------------------------------------------------------------------- */
function refreshPreview() {
  const values = getFormValues(form);
  const result = validate(values);
  renderValidation(validationBox, result);
  const count = ['utm_source', 'utm_medium', 'utm_campaign'].filter((key) => values[key]).length;
  document.getElementById('parameter-count').textContent = `${count} / 3 recommended`;
  document.getElementById('parameter-progress').style.width = `${(count / 3) * 100}%`;
  if (!result.valid) { preview.textContent = result.errors[0] || 'Enter a valid destination URL.'; document.getElementById('copy-preview').disabled = true; return ''; }
  try { const url = buildUrl(values); preview.textContent = url; document.getElementById('copy-preview').disabled = false; return url; }
  catch (error) { preview.textContent = error.message; document.getElementById('copy-preview').disabled = true; return ''; }
}

/* --------------------------------------------------------------------------
   PRESET SETUP: Adds channel templates to the Builder page's select control.
   -------------------------------------------------------------------------- */
const presetSelect = document.getElementById('preset-select');
PRESETS.forEach((preset) => { const option = document.createElement('option'); option.value = preset.id; option.textContent = preset.name; presetSelect.appendChild(option); });
presetSelect.addEventListener('change', () => { const preset = getPreset(presetSelect.value); if (!preset) return; setFormValues(form, preset.values); document.getElementById('link-label').value = preset.name; refreshPreview(); showToast(`${preset.name} template applied.`); });

/* --------------------------------------------------------------------------
   BUILDER ACTIONS: Saves generated links to the shared localStorage shelf and
   supports clearing/copying the live preview.
   -------------------------------------------------------------------------- */
form.addEventListener('input', refreshPreview);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = getFormValues(form);
  const result = validate(values);
  if (!result.valid) { showToast(result.errors[0], 'error'); return; }
  const url = buildUrl(values);
  const id = globalThis.crypto?.randomUUID?.() || `link-${Date.now()}`;
  saveLink({ id, label: defaultLabel(values), url, baseUrl: values.baseUrl, utm_source: values.utm_source || '', utm_medium: values.utm_medium || '', utm_campaign: values.utm_campaign || '', utm_term: values.utm_term || '', utm_content: values.utm_content || '', createdAt: new Date().toISOString() });
  document.getElementById('hero-count').textContent = listLinks().length;
  showToast('Campaign link saved to your shelf.');
});
document.getElementById('reset-form').addEventListener('click', () => { clearForm(form); refreshPreview(); });
document.getElementById('copy-preview').addEventListener('click', async () => { const url = refreshPreview(); if (!url) return; await copyText(url); showToast('Preview URL copied.'); });

/* CLIPBOARD HELPER: Uses the modern API first and a textarea fallback second. */
async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea'); textarea.value = text; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
}

/* INITIALIZATION: Loads an optional history template, then renders preview and count. */
const editTemplate = (() => { try { const value = JSON.parse(localStorage.getItem('linkloom.editTemplate.v1') || 'null'); localStorage.removeItem('linkloom.editTemplate.v1'); return value; } catch { return null; } })();
if (editTemplate) { setFormValues(form, editTemplate); }
document.getElementById('hero-count').textContent = listLinks().length;
refreshPreview();
