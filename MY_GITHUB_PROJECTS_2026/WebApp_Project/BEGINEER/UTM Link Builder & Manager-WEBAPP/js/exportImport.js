/* --------------------------------------------------------------------------
   CSV EXPORT: Escapes cells and converts saved history into a spreadsheet-safe
   comma-separated document.
   -------------------------------------------------------------------------- */
function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

export function linksToCsv(entries) {
  const headers = ['label', 'url', 'baseUrl', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'createdAt'];
  const rows = entries.map((entry) => headers.map((header) => csvCell(entry[header])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

/* DOWNLOAD HELPER: Creates a temporary browser download without a server. */
export function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* BACKUP SERIALIZER: Includes a version field for future migration support. */
export function backupJson(entries) {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), links: entries }, null, 2);
}

export async function readJsonFile(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || !Array.isArray(parsed.links)) throw new Error('This backup does not contain a valid links array.');
  return parsed.links;
}
