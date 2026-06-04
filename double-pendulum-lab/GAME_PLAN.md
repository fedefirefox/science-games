# Double Pendulum Lab Game Plan

## Concept

The player tunes a chaotic mechanical system, launches it, and learns from the animation and plots. The simulation solves the double pendulum equations in real time with RK4 integration, while a shadow pendulum with a tiny initial offset exposes sensitivity to initial conditions.

## Core Loop

1. Pick a preset or tune the initial angles, kick, gravity, mass, thread lengths, damping, and speed.
2. Launch the pendulum and watch the physical animation, bob trail, phase portrait, and angle traces.
3. Read score, energy drift, and chaos separation. If miao mode is enabled, each full 360-degree turn plays a real cat meow cue.
4. Retune the setup to produce a calmer orbit, a larger chaotic bloom, or a cleaner low-drift run.
5. Later progression can add timed challenge cards: calm orbit, chaos bloom, energy conservation, target phase-shape, and prediction rounds.

## Current Prototype

- Static HTML/CSS/JavaScript, no build step and no dependency install.
- `src/simulation.js` owns the equation solver and saveable state.
- `src/app.js` owns browser input, canvas rendering, plotting, score calculation, and the animation loop.
- `styles.css` owns responsive layout and visual treatment.
- `assets/cat-faces/` provides bundled local SVG cat faces for the pendulum bobs.
- `assets/audio/` provides the bundled local cat meow used by miao mode.

## Equation Solver

The solver uses the standard two-mass double pendulum equations:

- State: `theta1`, `theta2`, `omega1`, `omega2`
- Parameters: `m1`, `m2`, `l1`, `l2`, `g`, `damping`
- Integrator: fixed-substep RK4 at up to 240 Hz
- Diagnostics: total mechanical energy drift and shadow-pendulum bob separation

## Access Model

This first version is a static browser app. A person can access it in three ways:

1. Local file: open `index.html` in a browser.
2. Local server: run `py -3 -m http.server 8000` from this project folder and visit `http://localhost:8000/`.
3. Public web: push the folder to a static host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages and share the generated URL.

Because the page uses normal script tags instead of module imports, opening the local file directly works for this prototype.
