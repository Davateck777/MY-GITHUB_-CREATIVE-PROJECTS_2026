const canvas = document.getElementById('art-canvas');
const ctx = canvas.getContext('2d');

const settings = {
  rows: 12,
  columns: 18,
  gap: 4,
  hue: 190,
  spread: 72,
  lightness: 55,
  style: 'mix',
  motion: false
};

let cells = [];
let seed = '';
let animationFrame = 0;
let lastRenderTime = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const hsl = (hue, saturation, lightness, alpha = 1) => `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

function createSeed() {
  return Math.random().toString(16).slice(2, 10).toUpperCase();
}

function generatePattern() {
  seed = createSeed();
  cells = [];
  for (let row = 0; row < settings.rows; row += 1) {
    for (let column = 0; column < settings.columns; column += 1) {
      // Each cell receives independent random values. The loop creates the
      // structure; Math.random() creates the controlled visual variation.
      cells.push({
        shape: Math.random(),
        rotation: Math.random() * Math.PI * 2,
        scale: 0.55 + Math.random() * 0.4,
        offset: Math.random(),
        detail: Math.random()
      });
    }
  }
  document.getElementById('seed-readout').textContent = `SEED ${seed}`;
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

function roundRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawSquare(size, item, color) {
  const inset = size * (1 - item.scale) / 2;
  roundRectPath(ctx, -size / 2 + inset, -size / 2 + inset, size - inset * 2, size - inset * 2, size * .07);
  ctx.fillStyle = color;
  ctx.fill();
  if (item.detail > .72) {
    ctx.strokeStyle = hsl(0, 0, 100, .2);
    ctx.lineWidth = Math.max(1, size * .018);
    ctx.stroke();
  }
}

function drawCircle(size, item, color) {
  const radius = size * item.scale * .47;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (item.detail > .42) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * .42, 0, Math.PI * 2);
    ctx.fillStyle = hsl(0, 0, 100, .12);
    ctx.fill();
  }
}

function drawTriangle(size, item, color) {
  const height = size * item.scale * .86;
  const width = size * item.scale;
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(width / 2, height / 2);
  ctx.lineTo(-width / 2, height / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (item.detail > .65) {
    ctx.strokeStyle = hsl(0, 0, 100, .24);
    ctx.lineWidth = Math.max(1, size * .014);
    ctx.stroke();
  }
}

function drawDiamond(size, item, color) {
  const half = size * item.scale * .5;
  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(half, 0);
  ctx.lineTo(0, half);
  ctx.lineTo(-half, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLines(size, item, color) {
  const half = size * item.scale * .5;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * .035);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-half, -half * .7); ctx.lineTo(half, half * .7);
  ctx.moveTo(-half, half * .7); ctx.lineTo(half, -half * .7);
  if (item.detail > .5) {
    ctx.moveTo(-half, 0); ctx.lineTo(half, 0);
  }
  ctx.stroke();
}

function drawShape(size, item, hue, saturation, lightness, time) {
  const shapeNames = ['squares', 'circles', 'triangles', 'diamond', 'lines'];
  const shape = settings.style === 'mix'
    ? shapeNames[Math.floor(item.shape * shapeNames.length)]
    : settings.style;
  const motionHue = settings.motion ? time * .012 : 0;
  const color = hsl((hue + motionHue) % 360, saturation, lightness, .94);
  ctx.save();
  ctx.rotate(item.rotation + (settings.motion ? time * .00015 * (item.detail > .5 ? 1 : -1) : 0));
  if (shape === 'squares') drawSquare(size, item, color);
  if (shape === 'circles') drawCircle(size, item, color);
  if (shape === 'triangles') drawTriangle(size, item, color);
  if (shape === 'diamond') drawDiamond(size, item, color);
  if (shape === 'lines') drawLines(size, item, color);
  ctx.restore();
}

function render(time = performance.now()) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  lastRenderTime = time;

  ctx.clearRect(0, 0, width, height);
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#151a21');
  background.addColorStop(.5, '#10151b');
  background.addColorStop(1, '#0c1015');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const gap = settings.gap;
  const cellWidth = (width - gap * (settings.columns + 1)) / settings.columns;
  const cellHeight = (height - gap * (settings.rows + 1)) / settings.rows;
  const size = Math.min(cellWidth, cellHeight);
  const baseLightness = settings.lightness;

  for (let row = 0; row < settings.rows; row += 1) {
    for (let column = 0; column < settings.columns; column += 1) {
      const index = row * settings.columns + column;
      const item = cells[index];
      if (!item) continue;
      const x = gap + column * (cellWidth + gap) + cellWidth / 2;
      const y = gap + row * (cellHeight + gap) + cellHeight / 2;
      const flow = ((column / Math.max(1, settings.columns - 1)) * 0.62 + (row / Math.max(1, settings.rows - 1)) * .38) * settings.spread;
      const hue = (settings.hue + flow + item.offset * settings.spread * 1.7) % 360;
      const saturation = clamp(62 + item.detail * 28, 50, 95);
      const lightness = clamp(baseLightness + (item.offset - .5) * 20, 20, 82);

      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = hsl(hue, saturation * .38, lightness * .3, .16);
      roundRectPath(ctx, -size / 2, -size / 2, size, size, size * .05);
      ctx.fill();
      drawShape(size * .84, item, hue, saturation, lightness, time);
      ctx.restore();
    }
  }

  if (settings.motion) {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(render);
  }
}

function updateReadouts() {
  document.getElementById('rows-output').value = settings.rows;
  document.getElementById('columns-output').value = settings.columns;
  document.getElementById('gap-output').value = settings.gap;
  document.getElementById('hue-output').value = `${settings.hue}°`;
  document.getElementById('spread-output').value = `${settings.spread}%`;
  document.getElementById('light-output').value = `${settings.lightness}%`;
  document.getElementById('grid-size-value').textContent = `${settings.rows} × ${settings.columns}`;
  document.getElementById('grid-readout').textContent = `${settings.rows} × ${settings.columns} GRID`;
  document.getElementById('color-chip').style.background = `linear-gradient(90deg, hsl(${settings.hue}, 90%, 60%), hsl(${(settings.hue + 100) % 360}, 90%, 60%), hsl(${(settings.hue + 220) % 360}, 90%, 60%))`;
}

function bindRange(id, key, parse = Number) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    const oldRows = settings.rows;
    const oldColumns = settings.columns;
    settings[key] = parse(input.value);
    updateReadouts();
    if (settings.rows !== oldRows || settings.columns !== oldColumns) generatePattern();
    else render();
  });
}

function downloadArtwork() {
  const link = document.createElement('a');
  link.download = `geometria-${seed || 'pattern'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

document.getElementById('randomize-btn').addEventListener('click', generatePattern);
document.getElementById('download-btn').addEventListener('click', downloadArtwork);
bindRange('rows-range', 'rows');
bindRange('columns-range', 'columns');
bindRange('gap-range', 'gap');
bindRange('hue-range', 'hue');
bindRange('spread-range', 'spread');
bindRange('light-range', 'lightness');

document.querySelectorAll('.style-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.style-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    settings.style = button.dataset.style;
    render();
  });
});

document.getElementById('motion-toggle').addEventListener('change', (event) => {
  settings.motion = event.target.checked;
  if (settings.motion) render(lastRenderTime);
  else cancelAnimationFrame(animationFrame);
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    generatePattern();
  }
});

updateReadouts();
generatePattern();
requestAnimationFrame(resizeCanvas);
