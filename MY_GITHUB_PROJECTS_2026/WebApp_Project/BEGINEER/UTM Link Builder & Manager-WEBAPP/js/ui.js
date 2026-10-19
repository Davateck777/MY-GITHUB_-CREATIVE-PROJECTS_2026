/* --------------------------------------------------------------------------
   FORM HELPERS: Read and write builder controls without coupling core logic to
   a particular rendering implementation.
   -------------------------------------------------------------------------- */
export function getFormValues(form) {
  const values = {};
  new FormData(form).forEach((value, key) => { values[key] = String(value).trim(); });
  return values;
}

export function setFormValues(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    const control = form.elements.namedItem(key);
    if (control) control.value = value ?? '';
  });
}

export function clearForm(form) {
  form.reset();
}

/* --------------------------------------------------------------------------
   VALIDATION RENDERING: Separates warning/error presentation from validation
   rules so the rules remain testable without a DOM.
   -------------------------------------------------------------------------- */
export function renderValidation(container, result) {
  container.className = 'validation-box';
  if (result.errors.length) {
    container.innerHTML = `<ul>${result.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`;
    return;
  }
  if (result.warnings.length) {
    container.innerHTML = `<ul>${result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>`;
    return;
  }
  container.className = 'validation-box success';
  container.textContent = 'Ready to save — all recommended campaign fields are present.';
}

/* --------------------------------------------------------------------------
   HISTORY TABLE: Creates safe rows and attaches action metadata for the app
   controller to handle with event delegation.
   -------------------------------------------------------------------------- */
export function renderHistory(entries, body, emptyState) {
  body.innerHTML = '';
  emptyState.hidden = entries.length > 0;
  entries.forEach((entry) => {
    const row = document.createElement('tr');
    row.dataset.id = entry.id;
    row.innerHTML = `
      <td class="link-cell"><strong></strong><small></small></td>
      <td class="campaign-cell"></td>
      <td><span class="channel-pill"></span></td>
      <td class="created-cell"></td>
      <td><div class="row-actions"><button class="row-action" data-action="copy" title="Copy URL" aria-label="Copy URL">⧉</button><button class="row-action" data-action="qr" title="Show QR code" aria-label="Show QR code">▦</button><button class="row-action" data-action="edit" title="Edit as template" aria-label="Edit as template">✎</button><button class="row-action" data-action="delete" title="Delete link" aria-label="Delete link">×</button></div></td>
    `;
    row.querySelector('.link-cell strong').textContent = entry.label || 'Untitled campaign';
    row.querySelector('.link-cell small').textContent = entry.url;
    row.querySelector('.campaign-cell').textContent = entry.utm_campaign || '—';
    row.querySelector('.channel-pill').textContent = [entry.utm_source, entry.utm_medium].filter(Boolean).join(' / ') || 'Uncategorized';
    row.querySelector('.created-cell').textContent = formatDate(entry.createdAt);
    body.appendChild(row);
  });
}

/* SMALL UTILITIES: Keep formatting and escaping consistent in the table. */
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char])); }
