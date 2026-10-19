/* --------------------------------------------------------------------------
   UTM CONSTANTS: Defines the recommended and optional campaign parameters.
   -------------------------------------------------------------------------- */
export const RECOMMENDED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'];
export const OPTIONAL_PARAMS = ['utm_term', 'utm_content'];
export const ALL_PARAMS = [...RECOMMENDED_PARAMS, ...OPTIONAL_PARAMS];

/* --------------------------------------------------------------------------
   URL NORMALIZATION: Converts user input into a safe HTTP(S) URL while keeping
   existing non-UTM query parameters and hash fragments intact.
   -------------------------------------------------------------------------- */
export function normalizeBaseUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) throw new Error('Destination URL is required.');
  if (/\s/.test(raw)) throw new Error('Destination URL cannot contain spaces.');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Destination URL must use http:// or https://.');
  return url;
}

/* --------------------------------------------------------------------------
   VALIDATION: Returns blocking errors and friendly warnings without mutating
   the form, allowing the UI to show live feedback as fields change.
   -------------------------------------------------------------------------- */
export function validate(values) {
  const errors = [];
  const warnings = [];
  try { normalizeBaseUrl(values.baseUrl); } catch (error) { errors.push(error.message); }
  ALL_PARAMS.forEach((key) => {
    if (String(values[key] ?? '').trim() && /\s/.test(String(values[key]))) errors.push(`${key} cannot contain spaces.`);
  });
  RECOMMENDED_PARAMS.forEach((key) => { if (!String(values[key] ?? '').trim()) warnings.push(`${key} is recommended for useful analytics.`); });
  return { valid: errors.length === 0, errors, warnings };
}

/* --------------------------------------------------------------------------
   URL BUILDER: Adds non-empty UTM parameters using URLSearchParams so values
   are encoded correctly and repeated parameters are replaced consistently.
   -------------------------------------------------------------------------- */
export function buildUrl(values) {
  const url = normalizeBaseUrl(values.baseUrl);
  ALL_PARAMS.forEach((key) => {
    const value = String(values[key] ?? '').trim();
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  return url.toString();
}

/* --------------------------------------------------------------------------
   PARAMETER PARSER: Reads UTM fields back from an existing URL for editing or
   duplicate-as-template workflows.
   -------------------------------------------------------------------------- */
export function parseParams(value) {
  const url = normalizeBaseUrl(value);
  const params = { baseUrl: `${url.origin}${url.pathname}${url.searchParams.toString() ? '' : ''}` };
  const cleanUrl = new URL(url.toString());
  ALL_PARAMS.forEach((key) => { params[key] = cleanUrl.searchParams.get(key) || ''; cleanUrl.searchParams.delete(key); });
  params.baseUrl = cleanUrl.toString();
  return params;
}

/* --------------------------------------------------------------------------
   LABEL FALLBACK: Creates a readable internal label when the user leaves it
   blank, based on campaign and source values.
   -------------------------------------------------------------------------- */
export function defaultLabel(values) {
  return String(values.label || values.utm_campaign || values.utm_source || 'Untitled campaign').trim();
}
