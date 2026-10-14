# Generative Geometric Art Grid

A creative visual coding project built with vanilla HTML, CSS, and JavaScript.

## Core algorithm

- Nested `for` loops create a responsive row × column grid.
- `Math.random()` assigns each cell its shape, rotation, scale, offset, and detail level.
- HSL/HSLA color values rotate through the grid using the base hue, cell position, and random offset.
- Canvas rendering keeps the artwork fluid and performant.
- Ambient motion animates hue and rotation without rebuilding the random structure.

## Features

- Randomize pattern with the button or `Space` key
- Adjust rows, columns, cell gap, hue rotation, spectrum spread, and lightness
- Shape modes: Mix, Squares, Circles, and Triangles
- Ambient motion toggle
- Download the canvas as a PNG
- Responsive layout for desktop and mobile

## Run locally

```bash
cd generative-geometric-art-grid
python3 -m http.server 4174 --bind 0.0.0.0
```

Open `http://localhost:4174`.
