/* --------------------------------------------------------------------------
   SHARED APP SHELL: Initializes theme state for both the Builder and History
   pages without assuming either page's feature-specific DOM exists.
   -------------------------------------------------------------------------- */
const settingsKey = 'linkloom.settings.v1';
const savedSettings = readSettings();
setTheme(savedSettings.theme || 'light');

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
});

/* SETTINGS HELPERS: Keep the theme preference shared across separate pages. */
function readSettings() {
  try { return JSON.parse(localStorage.getItem(settingsKey) || '{}'); }
  catch { return {}; }
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(settingsKey, JSON.stringify({ ...readSettings(), theme }));
}
