const PARTICLE_COUNT = 120000;
const canvas = document.getElementById('universe-canvas');
const unsupported = document.getElementById('unsupported');
const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, alpha: false });

if (!gl) {
  unsupported.hidden = false;
  throw new Error('WebGL2 is not supported by this browser.');
}

gl.getExtension('EXT_color_buffer_float');

const vertexSource = `#version 300 es
precision highp float;

in vec4 aSeed;
uniform float uTime;
uniform float uSensitivity;
uniform float uBass;
uniform float uMid;
uniform float uAir;
uniform float uEnergy;
uniform float uOrbitSpeed;
uniform float uPointerX;
uniform float uPointerY;
uniform float uPalette;
uniform float uAudioEnabled;
uniform vec2 uResolution;

out float vEnergy;
out float vDepth;
out vec3 vColor;

mat3 rotateX(float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat3(1., 0., 0., 0., c, -s, 0., s, c);
}
mat3 rotateY(float angle) {
  float c = cos(angle); float s = sin(angle);
  return mat3(c, 0., s, 0., 1., 0., -s, 0., c);
}

float hash(float value) {
  return fract(sin(value * 127.1) * 43758.5453);
}

void main() {
  float id = float(gl_VertexID);
  float n = aSeed.x;
  float ring = aSeed.y;
  float phase = aSeed.z * 6.28318;
  float drift = aSeed.w;
  float liveAudio = uAudioEnabled * (uBass * .7 + uMid * .2 + uAir * .1);
  float energy = clamp(uEnergy + liveAudio * uSensitivity * .9, 0., 1.5);

  float orbit = uTime * (.055 + uOrbitSpeed * .0007) + phase * .14;
  float spiral = orbit + n * 6.28318 + sin(uTime * .23 + drift * 8.) * .22;
  float radius = 1.2 + ring * 4.6 + sin(n * 31. + uTime * .12) * .26;
  radius += energy * (0.7 + n * 1.4);

  vec3 position;
  position.x = cos(spiral) * radius;
  position.z = sin(spiral) * radius * .62;
  position.y = (drift - .5) * 4.2 + sin(spiral * 2. + phase + uTime * .35) * (.16 + energy * .9);

  float pulse = sin(radius * 2.5 - uTime * (1.2 + energy * 3.) + phase) * energy * .26;
  position += normalize(position + vec3(.001)) * pulse;
  position.x += sin(uTime * .17 + position.y * 1.8 + phase) * (0.08 + uMid * 1.2);

  float pointerBend = uPointerX * (0.35 + ring * .45);
  position.x += pointerBend;
  position.y += uPointerY * (0.18 + ring * .32);

  float cameraYaw = uTime * uOrbitSpeed * .00014 + uPointerX * .14;
  float cameraPitch = uPointerY * .1 - .08;
  position = rotateX(cameraPitch) * rotateY(cameraYaw) * position;

  float cameraDistance = 9.2;
  float depth = position.z + cameraDistance;
  float perspective = 1.7 / depth;
  gl_Position = vec4(position.xy * perspective, 0., 1.);
  gl_PointSize = clamp((1.8 + aSeed.w * 4.2 + energy * 5.5) * (1.3 / depth) * 8.0, 1.1, 8.5);

  float colorWave = sin(spiral * .55 + uTime * .25) * .5 + .5;
  if (uPalette < .5) {
    vColor = mix(vec3(.39, .95, .82), vec3(.63, .54, 1.0), colorWave);
  } else if (uPalette < 1.5) {
    vColor = mix(vec3(1.0, .34, .62), vec3(1.0, .84, .38), colorWave);
  } else {
    vColor = mix(vec3(.22, .58, .96), vec3(.44, 1.0, .78), colorWave);
  }
  vEnergy = clamp(.25 + energy * .65 + aSeed.w * .3, 0., 1.);
  vDepth = clamp(1. - depth / 14., 0., 1.);
}`;

const fragmentSource = `#version 300 es
precision highp float;

in float vEnergy;
in float vDepth;
in vec3 vColor;
out vec4 outColor;

void main() {
  vec2 point = gl_PointCoord - .5;
  float distanceFromCenter = length(point);
  float alpha = smoothstep(.5, .08, distanceFromCenter);
  float core = smoothstep(.22, 0., distanceFromCenter);
  vec3 color = vColor * (0.72 + core * .72 + vDepth * .25);
  outColor = vec4(color, alpha * (.42 + vEnergy * .55));
}`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram() {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

const program = createProgram();
const vao = gl.createVertexArray();
const seedBuffer = gl.createBuffer();
const seeds = new Float32Array(PARTICLE_COUNT * 4);
for (let index = 0; index < PARTICLE_COUNT; index += 1) {
  const offset = index * 4;
  seeds[offset] = Math.random();
  seeds[offset + 1] = Math.random();
  seeds[offset + 2] = Math.random();
  seeds[offset + 3] = Math.random();
}

gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
const seedLocation = gl.getAttribLocation(program, 'aSeed');
gl.enableVertexAttribArray(seedLocation);
gl.vertexAttribPointer(seedLocation, 4, gl.FLOAT, false, 0, 0);
gl.bindVertexArray(null);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
gl.disable(gl.DEPTH_TEST);

const uniforms = {
  time: gl.getUniformLocation(program, 'uTime'),
  sensitivity: gl.getUniformLocation(program, 'uSensitivity'),
  bass: gl.getUniformLocation(program, 'uBass'),
  mid: gl.getUniformLocation(program, 'uMid'),
  air: gl.getUniformLocation(program, 'uAir'),
  energy: gl.getUniformLocation(program, 'uEnergy'),
  orbitSpeed: gl.getUniformLocation(program, 'uOrbitSpeed'),
  pointerX: gl.getUniformLocation(program, 'uPointerX'),
  pointerY: gl.getUniformLocation(program, 'uPointerY'),
  palette: gl.getUniformLocation(program, 'uPalette'),
  audioEnabled: gl.getUniformLocation(program, 'uAudioEnabled'),
  resolution: gl.getUniformLocation(program, 'uResolution')
};

const state = {
  running: true,
  audioEnabled: true,
  micActive: false,
  micStream: null,
  analyser: null,
  audioContext: null,
  sensitivity: 1,
  orbitSpeed: .42,
  palette: 0,
  pointerX: 0,
  pointerY: 0,
  frequencyData: new Uint8Array(128),
  bands: new Float32Array(32),
  energy: 0,
  bass: 0,
  mid: 0,
  air: 0,
  lastFrame: performance.now(),
  frameCount: 0,
  fpsTime: performance.now(),
  fps: 60
};

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(window.innerWidth * ratio);
  const height = Math.floor(window.innerHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

function updateAudio() {
  if (state.micActive && state.analyser) {
    state.analyser.getByteFrequencyData(state.frequencyData);
    for (let band = 0; band < state.bands.length; band += 1) {
      const start = Math.floor(band * state.frequencyData.length / state.bands.length);
      const end = Math.max(start + 1, Math.floor((band + 1) * state.frequencyData.length / state.bands.length));
      let total = 0;
      for (let index = start; index < end; index += 1) total += state.frequencyData[index];
      state.bands[band] = (total / (end - start)) / 255;
    }
    state.bass = state.bands.slice(0, 4).reduce((sum, value) => sum + value, 0) / 4;
    state.mid = state.bands.slice(5, 16).reduce((sum, value) => sum + value, 0) / 11;
    state.air = state.bands.slice(18, 32).reduce((sum, value) => sum + value, 0) / 14;
    state.energy = state.energy * .86 + (state.bass * .58 + state.mid * .3 + state.air * .12) * .14;
  } else {
    const time = performance.now() * .001;
    const pulse = .22 + Math.max(0, Math.sin(time * 1.7)) * .24 + Math.max(0, Math.sin(time * .47)) * .12;
    state.bass = pulse;
    state.mid = .18 + Math.max(0, Math.sin(time * 2.4 + 1)) * .16;
    state.air = .11 + Math.max(0, Math.sin(time * 3.1 + 2)) * .12;
    state.energy = pulse;
  }
  document.getElementById('energy-meter').style.width = `${Math.round(Math.min(1, state.energy * state.sensitivity) * 100)}%`;
  document.getElementById('energy-output').value = `${Math.round(Math.min(1, state.energy * state.sensitivity) * 100)}%`;
  document.getElementById('bass-output').textContent = Math.round(state.bass * 100);
  document.getElementById('mid-output').textContent = Math.round(state.mid * 100);
  document.getElementById('air-output').textContent = Math.round(state.air * 100);
}

function draw(time) {
  gl.clearColor(.015, .018, .03, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.uniform1f(uniforms.time, time * .001);
  gl.uniform1f(uniforms.sensitivity, state.sensitivity);
  gl.uniform1f(uniforms.bass, state.bass);
  gl.uniform1f(uniforms.mid, state.mid);
  gl.uniform1f(uniforms.air, state.air);
  gl.uniform1f(uniforms.energy, state.energy);
  gl.uniform1f(uniforms.orbitSpeed, document.getElementById('orbit-toggle').checked ? state.orbitSpeed : 0);
  gl.uniform1f(uniforms.pointerX, state.pointerX);
  gl.uniform1f(uniforms.pointerY, state.pointerY);
  gl.uniform1f(uniforms.palette, state.palette);
  gl.uniform1f(uniforms.audioEnabled, state.audioEnabled ? 1 : 0);
  gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
  gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
  gl.bindVertexArray(null);
}

function updateFps(time) {
  state.frameCount += 1;
  if (time - state.fpsTime > 500) {
    state.fps = Math.round(state.frameCount * 1000 / (time - state.fpsTime));
    state.frameCount = 0;
    state.fpsTime = time;
    document.getElementById('fps-output').textContent = state.fps;
  }
}

function frame(time) {
  resize();
  if (state.running) updateAudio();
  draw(time);
  updateFps(time);
  state.lastFrame = time;
  requestAnimationFrame(frame);
}

async function enableMicrophone() {
  const button = document.getElementById('mic-button');
  const message = document.getElementById('mic-message');
  if (!navigator.mediaDevices?.getUserMedia) {
    message.textContent = 'Microphone input is not available in this browser.';
    return;
  }
  try {
    button.disabled = true;
    message.textContent = 'Waiting for microphone permission…';
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    const source = state.audioContext.createMediaStreamSource(stream);
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 256;
    state.analyser.smoothingTimeConstant = .78;
    source.connect(state.analyser);
    state.micStream = stream;
    state.micActive = true;
    document.getElementById('input-status').textContent = 'MIC LIVE';
    document.getElementById('runtime-state').textContent = 'AUDIO LINK ACTIVE';
    button.querySelector('strong').textContent = 'Microphone active';
    button.querySelector('small').textContent = 'Live frequency field connected';
    message.textContent = 'Audio is analyzed locally in this browser session.';
    button.disabled = false;
  } catch (error) {
    button.disabled = false;
    message.textContent = 'Permission was not granted. Demo signal remains active.';
    document.getElementById('input-status').textContent = 'DEMO SIGNAL';
  }
}

document.getElementById('mic-button').addEventListener('click', enableMicrophone);
document.getElementById('sensitivity-range').addEventListener('input', (event) => {
  state.sensitivity = Number(event.target.value) / 100;
  document.getElementById('sensitivity-output').value = `${event.target.value}%`;
});
document.getElementById('motion-range').addEventListener('input', (event) => {
  state.orbitSpeed = Number(event.target.value) / 100;
  document.getElementById('motion-output').value = `${event.target.value}%`;
});
document.getElementById('audio-field-toggle').addEventListener('change', (event) => { state.audioEnabled = event.target.checked; });
document.getElementById('orbit-toggle').addEventListener('change', () => {});
document.getElementById('pause-button').addEventListener('click', () => {
  state.running = !state.running;
  document.getElementById('pause-button').innerHTML = state.running ? '<span>Ⅱ</span> Pause universe' : '<span>▶</span> Resume universe';
  document.getElementById('runtime-state').textContent = state.running ? 'SHADER RUNNING' : 'SHADER PAUSED';
});
document.getElementById('download-btn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'sonorum-particle-universe.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
document.querySelectorAll('.palette-button').forEach((button, index) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.palette-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.palette = index;
  });
});
window.addEventListener('pointermove', (event) => {
  state.pointerX = (event.clientX / window.innerWidth - .5) * 2;
  state.pointerY = (event.clientY / window.innerHeight - .5) * -2;
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'BUTTON'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    document.getElementById('pause-button').click();
  }
});
window.addEventListener('beforeunload', () => state.micStream?.getTracks().forEach((track) => track.stop()));

resize();
requestAnimationFrame(frame);
