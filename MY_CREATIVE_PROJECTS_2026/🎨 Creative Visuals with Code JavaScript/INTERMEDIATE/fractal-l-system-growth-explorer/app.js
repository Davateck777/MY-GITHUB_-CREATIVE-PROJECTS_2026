const canvas = document.getElementById('growth-canvas');
const ctx = canvas.getContext('2d');

const presets = {
  tree: {
    name: 'Classic tree',
    axiom: 'F',
    rules: { F: 'F[+F]F[-F]F' },
    depthCap: 5,
    angle: 25,
    decay: .72,
    initialLength: 1.0
  },
  bush: {
    name: 'Wild bush',
    axiom: 'F',
    rules: { F: 'F[+F]F[-F][F]' },
    depthCap: 4,
    angle: 28,
    decay: .67,
    initialLength: .83
  },
  fern: {
    name: 'Fern spiral',
    axiom: 'X',
    rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' },
    depthCap: 5,
    angle: 23,
    decay: .74,
    initialLength: .66
  },
  coral: {
    name: 'Coral fan',
    axiom: 'F',
    rules: { F: 'FF+[+F-F]-[-F+F]' },
    depthCap: 4,
    angle: 31,
    decay: .7,
    initialLength: .8
  }
};

const palettes = {
  moss: { trunk: ['#5f432e', '#8b623b', '#b2844e'], leaf: ['#7ca650', '#a8c96c', '#d0dc88'], ground: '#516242' },
  sunset: { trunk: ['#59342b', '#965039', '#c17948'], leaf: ['#d06d45', '#e6a158', '#f0c979'], ground: '#765043' },
  ocean: { trunk: ['#294843', '#3e7064', '#65917b'], leaf: ['#5eb1a0', '#89ccaa', '#badb9b'], ground: '#3a6e68' }
};

const settings = { preset: 'tree', depth: 5, angle: 25, decay: .72, drift: 13, wind: 28, windSpeed: 7, windOn: true, palette: 'moss' };
let segments = [];
let leaves = [];
let growth = 0;
let running = true;
let seed = '';
let animationFrame = 0;
let lastTime = performance.now();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toRadians = (degrees) => degrees * Math.PI / 180;
const random = (min = 0, max = 1) => min + Math.random() * (max - min);

function createSeed() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}

function expandLSystem(preset, iterations) {
  let sentence = preset.axiom;
  const limit = 120000;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let next = '';
    for (const symbol of sentence) next += preset.rules[symbol] || symbol;
    sentence = next;
    if (sentence.length > limit) break;
  }
  return sentence;
}

function buildOrganism() {
  seed = createSeed();
  const preset = presets[settings.preset];
  const iterations = Math.min(settings.depth, preset.depthCap);
  const sentence = expandLSystem(preset, iterations);
  const angle = toRadians(settings.angle);
  const drift = toRadians(settings.drift);
  const stack = [];
  const turtle = { x: 0, y: 0, rotation: -Math.PI / 2, length: preset.initialLength, depth: 0 };
  segments = [];
  leaves = [];

  for (const symbol of sentence) {
    if (symbol === 'F' || symbol === 'G') {
      const start = { x: turtle.x, y: turtle.y };
      const end = {
        x: turtle.x + Math.cos(turtle.rotation) * turtle.length,
        y: turtle.y + Math.sin(turtle.rotation) * turtle.length
      };
      segments.push({ start, end, depth: turtle.depth, width: turtle.length, accent: Math.random() });
      turtle.x = end.x;
      turtle.y = end.y;
      if (turtle.depth >= iterations - 1 && Math.random() > .33) {
        leaves.push({ x: end.x, y: end.y, depth: turtle.depth, segmentIndex: segments.length - 1, size: random(.035, .09) });
      }
    } else if (symbol === '+') {
      turtle.rotation += angle + random(-drift, drift);
    } else if (symbol === '-') {
      turtle.rotation -= angle + random(-drift, drift);
    } else if (symbol === '[') {
      stack.push({ ...turtle });
      turtle.depth += 1;
      turtle.length *= settings.decay;
      turtle.rotation += random(-drift, drift);
    } else if (symbol === ']') {
      const restored = stack.pop();
      if (restored) Object.assign(turtle, restored);
    }
  }

  growth = 0;
  running = true;
  document.getElementById('segment-readout').textContent = `${segments.length.toLocaleString()} SEGMENTS`;
  document.getElementById('growth-readout').textContent = '0% GROWN';
  document.getElementById('stage-state').textContent = 'GERMINATING';
  render();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  render();
}

function worldToCanvas(point, depth, width, height, scale, time) {
  const preset = presets[settings.preset];
  const centerX = width * .5;
  const groundY = height * .86;
  const normalizedDepth = clamp(depth / Math.max(1, settings.depth), 0, 1);
  const windAmount = settings.windOn ? settings.wind * .72 * (0.08 + normalizedDepth * .92) : 0;
  const wave = Math.sin(time * .00045 * settings.windSpeed + point.x * 3.6 + point.y * 2.2 + depth) * windAmount;
  const secondWave = Math.cos(time * .00028 * settings.windSpeed + point.y * 4) * windAmount * .22;
  const x = centerX + point.x * scale + wave + secondWave;
  const y = groundY + point.y * scale;
  return { x, y };
}

function drawSegment(segment, start, end, palette, maxDepth) {
  const depthRatio = clamp(segment.depth / Math.max(1, maxDepth), 0, 1);
  const trunkColor = palette.trunk[Math.min(palette.trunk.length - 1, Math.floor(depthRatio * palette.trunk.length))];
  const width = clamp(8.5 - depthRatio * 7.4, 1.1, 8.5);
  ctx.strokeStyle = trunkColor;
  ctx.lineWidth = width;
  ctx.lineCap = depthRatio > .7 ? 'round' : 'butt';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function render(time = performance.now()) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;

  ctx.clearRect(0, 0, width, height);
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#192218');
  background.addColorStop(.6, '#101710');
  background.addColorStop(1, '#0d120e');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const scale = Math.min(width, height) * .205;
  const palette = palettes[settings.palette];
  const visibleSegments = Math.floor(segments.length * growth);
  const maxDepth = Math.max(1, settings.depth);

  // Ground shadow and horizon.
  ctx.fillStyle = 'rgba(0, 0, 0, .22)';
  ctx.beginPath();
  ctx.ellipse(width * .5, height * .87, Math.min(width * .32, 260), 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.ground;
  ctx.globalAlpha = .34;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height * .87);
  ctx.lineTo(width, height * .87);
  ctx.stroke();
  ctx.globalAlpha = 1;

  for (let index = 0; index < visibleSegments; index += 1) {
    const segment = segments[index];
    const start = worldToCanvas(segment.start, segment.depth, width, height, scale, time);
    let end = worldToCanvas(segment.end, segment.depth, width, height, scale, time);
    if (index === visibleSegments - 1 && growth < 1) {
      const partial = (segments.length * growth) % 1;
      end = { x: start.x + (end.x - start.x) * partial, y: start.y + (end.y - start.y) * partial };
    }
    drawSegment(segment, start, end, palette, maxDepth);
  }

  for (const leaf of leaves) {
    if (leaf.segmentIndex >= visibleSegments) continue;
    const point = worldToCanvas(leaf, leaf.depth, width, height, scale, time);
    const leafColor = palette.leaf[leaf.segmentIndex % palette.leaf.length];
    const size = scale * leaf.size * (.8 + leaf.depth / maxDepth);
    ctx.fillStyle = leafColor;
    ctx.globalAlpha = .75;
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, size * 1.35, size, Math.sin(leaf.segmentIndex) * .8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  document.getElementById('growth-readout').textContent = `${Math.floor(growth * 100)}% GROWN`;
  document.getElementById('stage-state').textContent = running ? (growth >= 1 ? 'FULL CANOPY' : 'GROWING') : 'PAUSED';

  if (running || settings.windOn) {
    const now = performance.now();
    const elapsed = Math.min(45, now - lastTime);
    if (running && growth < 1) growth = clamp(growth + elapsed * .00024, 0, 1);
    lastTime = now;
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(render);
  }
}

function updateReadouts() {
  document.getElementById('depth-output').value = settings.depth;
  document.getElementById('angle-output').value = `${settings.angle}°`;
  document.getElementById('length-output').value = `${Math.round(settings.decay * 100)}%`;
  document.getElementById('random-output').value = `${settings.drift}%`;
  document.getElementById('wind-output').value = `${settings.wind}%`;
  document.getElementById('wind-speed-output').value = settings.windSpeed;
  document.getElementById('depth-value').textContent = `Depth ${settings.depth}`;
  document.getElementById('wind-value').textContent = `Wind ${settings.wind}`;
}

function regenerate() {
  updateReadouts();
  buildOrganism();
}

function bindRange(id, key, transform = Number) {
  document.getElementById(id).addEventListener('input', (event) => {
    settings[key] = transform(event.target.value);
    regenerate();
  });
}

function applyPreset(key) {
  const preset = presets[key];
  settings.preset = key;
  settings.angle = preset.angle;
  settings.decay = preset.decay;
  document.getElementById('preset-name').textContent = preset.name;
  document.getElementById('angle-range').value = preset.angle;
  document.getElementById('length-range').value = Math.round(preset.decay * 100);
  regenerate();
}

function downloadGrowth() {
  const link = document.createElement('a');
  link.download = `understory-${seed || 'growth'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('grow-btn').addEventListener('click', buildOrganism);
document.getElementById('download-btn').addEventListener('click', downloadGrowth);
document.getElementById('preset-select').addEventListener('change', (event) => applyPreset(event.target.value));
document.getElementById('wind-toggle').addEventListener('change', (event) => {
  settings.windOn = event.target.checked;
  render();
});
bindRange('depth-range', 'depth');
bindRange('angle-range', 'angle');
bindRange('length-range', 'decay', (value) => Number(value) / 100);
bindRange('random-range', 'drift');
bindRange('wind-range', 'wind');
bindRange('wind-speed-range', 'windSpeed');

document.querySelectorAll('.palette-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.palette-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    settings.palette = button.dataset.palette;
    render();
  });
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    running = !running;
    lastTime = performance.now();
    render();
  }
});

updateReadouts();
buildOrganism();
requestAnimationFrame(resizeCanvas);
