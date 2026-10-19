/* --------------------------------------------------------------------------
   HISTORY IMPORTS: Loads persistence, table rendering, exports, QR generation,
   and toast feedback for the separate History page.
   -------------------------------------------------------------------------- */
import { parseParams } from './utmBuilder.js';
import { backupJson, downloadText, linksToCsv, readJsonFile } from './exportImport.js';
import { deleteLink, listLinks, replaceLinks } from './storage.js';
import { createQrSvg } from './qrcode.js';
import { renderHistory } from './ui.js';
import { showToast } from './toast.js';

const historyBody = document.getElementById('history-body');
const historyEmpty = document.getElementById('history-empty');
const state = { links: listLinks(), activeQr: null };

/* --------------------------------------------------------------------------
   HISTORY RENDERING: Filters and sorts the local campaign shelf before sending
   it to the shared table renderer.
   -------------------------------------------------------------------------- */
function refreshHistory() {
  const query = document.getElementById('history-search').value.trim().toLowerCase();
  const sort = document.getElementById('history-sort').value;
  const filtered = state.links.filter((entry) => [entry.label, entry.url, entry.utm_source, entry.utm_medium, entry.utm_campaign].join(' ').toLowerCase().includes(query));
  filtered.sort((a, b) => sort === 'label' ? (a.label || '').localeCompare(b.label || '') : sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt));
  renderHistory(filtered, historyBody, historyEmpty);
  document.getElementById('hero-count').textContent = state.links.length;
}

/* --------------------------------------------------------------------------
   QR MODAL: Displays and downloads the inline QR representation of a saved URL.
   -------------------------------------------------------------------------- */
function openQr(entry) { state.activeQr = entry; document.getElementById('qr-code').innerHTML = createQrSvg(entry.url, 220); document.getElementById('qr-label').textContent = entry.url; document.getElementById('qr-dialog').showModal(); }
function closeQr() { document.getElementById('qr-dialog').close(); }

/* --------------------------------------------------------------------------
   ROW ACTIONS: Handles copy, QR, edit-as-template, and deletion for table rows.
   -------------------------------------------------------------------------- */
historyBody.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const entry = state.links.find((item) => item.id === button.closest('tr').dataset.id);
  if (!entry) return;
  if (button.dataset.action === 'copy') { await copyText(entry.url); showToast('Link copied.'); }
  if (button.dataset.action === 'qr') openQr(entry);
  if (button.dataset.action === 'edit') { localStorage.setItem('linkloom.editTemplate.v1', JSON.stringify({ ...parseParams(entry.url), label: entry.label })); window.location.href = 'builder.html'; }
  if (button.dataset.action === 'delete' && confirm('Delete this saved link?')) { state.links = deleteLink(entry.id); refreshHistory(); showToast('Saved link deleted.'); }
});

/* --------------------------------------------------------------------------
   EXPORT / RESTORE: Moves campaign history between browser storage and portable
   CSV/JSON files without sending data to a server.
   -------------------------------------------------------------------------- */
document.getElementById('export-csv').addEventListener('click', () => { downloadText('linkloom-links.csv', linksToCsv(state.links), 'text/csv;charset=utf-8'); showToast('CSV export downloaded.'); });
document.getElementById('backup-json').addEventListener('click', () => { downloadText('linkloom-backup.json', backupJson(state.links), 'application/json'); showToast('JSON backup downloaded.'); });
document.getElementById('restore-json').addEventListener('change', async (event) => { const file = event.target.files[0]; if (!file) return; try { const entries = await readJsonFile(file); if (!entries.every((entry) => entry.id && entry.url && entry.createdAt)) throw new Error('Backup entries are missing required fields.'); state.links = replaceLinks(entries); refreshHistory(); showToast('Backup restored.'); } catch (error) { showToast(error.message, 'error'); } event.target.value = ''; });

/* --------------------------------------------------------------------------
   DIALOG + CLIPBOARD: Wires shared modal controls and copy fallback behavior.
   -------------------------------------------------------------------------- */
document.getElementById('close-qr').addEventListener('click', closeQr);
document.getElementById('qr-dialog').addEventListener('click', (event) => { if (event.target === event.currentTarget) closeQr(); });
document.getElementById('download-qr').addEventListener('click', () => { if (state.activeQr) { downloadText('campaign-qr.svg', createQrSvg(state.activeQr.url, 800), 'image/svg+xml'); showToast('QR code downloaded.'); } });
async function copyText(text) { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text); const textarea = document.createElement('textarea'); textarea.value = text; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove(); }

/* INITIALIZATION: Renders the saved-link shelf as soon as the separate page loads. */
refreshHistory();
