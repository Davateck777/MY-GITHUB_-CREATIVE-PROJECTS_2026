# GPGPU Audio-Reactive Particle Universe

A browser-based creative coding experiment built with vanilla HTML, CSS, JavaScript, WebGL2, GLSL shaders, and the Web Audio API.

## Features

- 120,000 particles rendered as GPU point sprites
- Particle positions, orbits, pulsing, and color fields calculated in the vertex shader
- Live microphone frequency analysis with `AnalyserNode`
- Bass, mid, air, and total-energy readouts
- Demo signal fallback when microphone access is not enabled
- Sensitivity and orbit controls
- Aurora, Plasma, and Deep Sea palettes
- Pointer-driven field bending
- Pause/resume controls
- PNG download
- Responsive HUD interface

## GPU approach

JavaScript generates a static seed buffer once. Every frame, the WebGL2 vertex shader uses those seeds, time, pointer position, and audio uniforms to calculate the 3D particle positions. The CPU does not update 120,000 particle positions each frame.

## Run locally

Microphone access generally requires a secure context such as `localhost` or HTTPS.

```bash
cd gpgpu-audio-reactive-particle-universe
python -m http.server 4200 --bind 127.0.0.1
```

Open `http://localhost:4176` in a WebGL2-capable browser and click **Enable microphone**.

## Browser requirements

- WebGL2 support
- Web Audio API support
- Microphone permission for live input

If microphone permission is declined, the universe continues with a synthetic demo signal.
