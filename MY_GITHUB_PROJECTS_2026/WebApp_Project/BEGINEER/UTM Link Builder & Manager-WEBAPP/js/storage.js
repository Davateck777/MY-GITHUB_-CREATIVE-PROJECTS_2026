/* --------------------------------------------------------------------------
   STORAGE KEYS: Namespaced localStorage keys make the app safe to embed beside
   other local-first tools.
   -------------------------------------------------------------------------- */
const HISTORY_KEY = 'linkloom.history.v1';
const SETTINGS_KEY = 'linkloom.settings.v1';

/* STORAGE READERS: Return safe defaults when storage is empty or malformed. */
function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

/* HISTORY CRUD: Provides the local repository used by the history table. */
export function listLinks() { return readJson(HISTORY_KEY, []); }
export function saveLink(entry) {
  const history = listLinks();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return entry;
}
export function deleteLink(id) {
  const next = listLinks().filter((entry) => entry.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
export function clearLinks() { localStorage.removeItem(HISTORY_KEY); }
export function replaceLinks(entries) {
  if (!Array.isArray(entries)) throw new Error('Backup must contain a links array.');
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  return entries;
}

/* SETTINGS: Persists only non-sensitive UI preferences such as the theme. */
export function getSettings() { return readJson(SETTINGS_KEY, { theme: 'light' }); }
export function saveSettings(settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
