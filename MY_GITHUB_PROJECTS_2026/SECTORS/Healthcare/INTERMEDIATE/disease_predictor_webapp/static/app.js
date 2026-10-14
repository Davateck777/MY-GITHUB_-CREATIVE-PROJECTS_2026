// -----------------------------------------------------------------------------
// APPLICATION STATE: Keeps the active dataset, model metadata, and latest
// prediction in one small client-side object.
// -----------------------------------------------------------------------------
const state = {
  catalog: [],
  selectedDataset: '',
  activeModel: null,
  lastPrediction: null
};

const $ = (selector) => document.querySelector(selector);
const byId = (id) => document.getElementById(id);

// -----------------------------------------------------------------------------
// API CLIENT: All browser-to-Python communication goes through same-origin
// JSON routes so the WebApp works locally without a frontend build tool.
// -----------------------------------------------------------------------------
async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed with HTTP ${response.status}`);
  return payload;
}

function showNotice(message, kind = 'error') {
  const notice = byId('notice');
  notice.textContent = message;
  notice.className = `notice ${kind === 'success' ? 'success' : ''}`;
  notice.hidden = false;
  clearTimeout(showNotice.timer);
  showNotice.timer = setTimeout(() => { notice.hidden = true; }, 5500);
}

function displayName(value) {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// -----------------------------------------------------------------------------
// DATASET METADATA: Builds the model selector and feature form from the model
// service, avoiding duplicated feature definitions in the browser code.
// -----------------------------------------------------------------------------
async function loadCatalog() {
  try {
    const [health, catalogPayload] = await Promise.all([api('/api/health'), api('/api/datasets')]);
    state.catalog = catalogPayload.datasets || [];
    if (!state.catalog.length) throw new Error('No trained models are available.');
    byId('service-state').textContent = health.status === 'ok' ? 'ONLINE' : 'CHECK';
    const selector = byId('dataset-select');
    selector.innerHTML = '';
    state.catalog.forEach((model) => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.label;
      selector.appendChild(option);
    });
    state.selectedDataset = state.catalog[0].id;
    selector.value = state.selectedDataset;
    renderModel(state.catalog[0]);
  } catch (error) {
    byId('service-state').textContent = 'OFFLINE';
    byId('dataset-info').textContent = error.message;
    showNotice(error.message);
  }
}

function renderModel(model) {
  state.activeModel = model;
  state.selectedDataset = model.id;
  byId('feature-count').textContent = `${model.features.length} features`;
  byId('dataset-info').innerHTML = '';
  const description = document.createElement('span');
  description.textContent = `${model.rowsUsed?.toLocaleString() || '—'} rows · target: ${model.targetColumn} · ${model.modelType}`;
  byId('dataset-info').appendChild(description);
  byId('trained-at').textContent = model.trainedAt ? `Trained ${new Date(model.trainedAt).toLocaleDateString()}` : 'Saved model';
  renderFeatureFields(model.features);
  clearResult();
}

// -----------------------------------------------------------------------------
// FEATURE FORM: Creates safe number/select controls from server-provided model
// metadata and applies simple demo defaults to make the first run discoverable.
// -----------------------------------------------------------------------------
function defaultValue(feature) {
  if (feature.type === 'select') return feature.options?.[0] || '';
  const defaults = { age: 54, bmi: 27.32, HbA1c_level: 6.1, blood_glucose_level: 140, trestbps: 125, chol: 212, thalach: 150, oldpeak: 1 };
  return defaults[feature.name] ?? 0;
}

function renderFeatureFields(features) {
  const grid = byId('feature-grid');
  grid.innerHTML = '';
  features.forEach((feature) => {
    const label = document.createElement('label');
    label.className = 'feature-field';
    label.textContent = feature.label || displayName(feature.name);
    let control;
    if (feature.type === 'select') {
      control = document.createElement('select');
      (feature.options || []).forEach((optionValue) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        control.appendChild(option);
      });
    } else {
      control = document.createElement('input');
      control.type = 'number';
      control.step = 'any';
      control.inputMode = 'decimal';
    }
    control.name = feature.name;
    control.required = feature.required !== false;
    control.value = defaultValue(feature);
    label.appendChild(control);
    grid.appendChild(label);
  });
}

// -----------------------------------------------------------------------------
// PREDICTION OUTPUT: Converts the API response into probability, class, band,
// model provenance, and a persistent non-diagnostic disclaimer.
// -----------------------------------------------------------------------------
function clearResult() {
  state.lastPrediction = null;
  byId('empty-result').hidden = false;
  byId('prediction-result').hidden = true;
  byId('result-status').textContent = 'WAITING';
}

function renderPrediction(result) {
  state.lastPrediction = result;
  byId('empty-result').hidden = true;
  byId('prediction-result').hidden = false;
  byId('result-status').textContent = 'COMPLETE';
  byId('result-label').textContent = `${result.label} · positive-class probability`;
  byId('probability').textContent = `${result.percentage.toFixed(2)}%`;
  byId('probability-bar').style.width = `${result.percentage}%`;
  byId('risk-band').textContent = result.riskBand;
  byId('risk-band').className = result.riskBand.toLowerCase().includes('elevated') ? 'elevated' : result.riskBand.toLowerCase().includes('moderate') ? 'moderate' : '';
  byId('predicted-class').textContent = result.predictedClass;
  byId('model-type').textContent = result.modelType;
  byId('dataset-label').textContent = result.dataset;
  byId('result-disclaimer').textContent = result.disclaimer;
}

// -----------------------------------------------------------------------------
// FORM EVENTS: Sends the selected dataset and feature values to the Python
// predictor, then restores the button after success or validation failure.
// -----------------------------------------------------------------------------
byId('dataset-select').addEventListener('change', (event) => {
  const model = state.catalog.find((item) => item.id === event.target.value);
  if (model) renderModel(model);
});

byId('prediction-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = byId('predict-button');
  button.disabled = true;
  const features = {};
  new FormData(event.target).forEach((value, key) => {
    const control = event.target.elements[key];
    features[key] = control?.type === 'number' ? Number(value) : value;
  });
  try {
    const payload = await api('/api/predict', {
      method: 'POST',
      body: JSON.stringify({ dataset: state.selectedDataset, features })
    });
    renderPrediction(payload.result);
    showNotice('Prediction generated from the saved model pipeline.', 'success');
  } catch (error) {
    showNotice(error.message);
  } finally {
    button.disabled = false;
  }
});

// -----------------------------------------------------------------------------
// STARTUP: Loads metadata and leaves the app ready with the first model's
// example values. No real patient data is stored by the frontend.
// -----------------------------------------------------------------------------
loadCatalog();
