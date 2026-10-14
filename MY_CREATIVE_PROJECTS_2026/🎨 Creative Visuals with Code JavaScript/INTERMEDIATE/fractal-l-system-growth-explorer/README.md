# Fractal & L-System Growth Explorer

A creative visual coding project built with vanilla HTML, CSS, and JavaScript.

## What it does

The explorer expands L-system grammars into turtle-graphics instructions, then renders the resulting branching organism on a responsive canvas.

Presets:

- Classic tree
- Wild bush
- Fern spiral
- Coral fan

Controls include iterations, branch angle, length decay, organic drift, wind strength, wind rhythm, palette, and animated growth.

## Core algorithm

1. Start with an axiom such as `F` or `X`.
2. Expand symbols using preset production rules.
3. Interpret `F`, `+`, `-`, `[`, and `]` as turtle commands.
4. Use a stack to save and restore branch position, rotation, length, and depth.
5. Animate visible segments from zero to the full generated structure.
6. Apply time-based wind offsets to deeper branch points and leaves.

## Run locally

```bash
cd fractal-l-system-growth-explorer
python3 -m http.server 4175 --bind 0.0.0.0
```

Open `http://localhost:4175`.

Press **Space** to pause or resume growth. Use the download icon to save a PNG of the current specimen.
