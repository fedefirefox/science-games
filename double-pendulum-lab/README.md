# Double Pendulum Lab

Interactive browser prototype for a science game about the double pendulum equation. It animates the mechanism, draws the bob trail, plots a phase portrait and angle traces, and scores the run using energy drift plus shadow-pendulum separation.

## Open It

Open this file in a browser:

`C:\Users\feder\Documents\GitHub\science games\double-pendulum-lab\index.html`

No build step, package install, or backend is required.

## Optional Local Server

From this folder:

```powershell
py -3 -m http.server 8000
```

Then open:

`http://localhost:8000/`

## Public Access

This can be published as a static site. The simplest routes are:

- Put the `science games` folder in a GitHub repository and enable GitHub Pages.
- Deploy `double-pendulum-lab` to Netlify, Vercel, or Cloudflare Pages.
- Share the resulting HTTPS URL.

If this becomes a multi-project collection, the public version should usually have a small landing index that links to `/double-pendulum-lab/`.

## Files

- `index.html` - browser entry point
- `styles.css` - responsive app styling
- `src/simulation.js` - double pendulum equations, RK4 integration, energy, and chaos diagnostics
- `src/app.js` - input handling, animation, plotting, scoring, and UI readouts
- `GAME_PLAN.md` - core loop and access plan

