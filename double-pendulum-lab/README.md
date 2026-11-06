# Double Pendulum Lab

Interactive browser prototype for a science game about the double pendulum equation. It animates the mechanism, draws the bob trail, plots a phase portrait and angle traces, and scores the run using energy drift plus shadow-pendulum separation.

## Play Online

[Open Double Pendulum Lab](https://fede-science-games.fedefirefox.chatgpt.site/double-pendulum-lab/). The simulation runs in your browser without a download or sign-in.

## Play Offline

1. Download the `double-pendulum-lab` folder.
   - If it comes from GitHub, use **Code > Download ZIP**, then unzip it.
   - Keep the files together in the same folder.
2. Open the folder on your computer.
3. Double-click `index.html`, or right-click it and choose your browser.

The game should open directly in Chrome, Edge, Firefox, or Safari.

No build step, package install, account, or backend is required.

The cat-face bob images and real cat meow sound are included in the download, so the game still works offline.

## Optional Local Server

Opening `index.html` directly is enough for this version. If your browser blocks local files, start a small local server instead.

From inside the `double-pendulum-lab` folder, run:

```powershell
py -3 -m http.server 8000
```

Then visit:

`http://localhost:8000/`

On macOS or Linux, this command is usually:

```bash
python3 -m http.server 8000
```


## Files

- `index.html` - browser entry point
- `styles.css` - responsive app styling
- `assets/cat-faces/` - bundled cat-face bob images
- `assets/audio/` - bundled cat meow audio used by the miao mode
- `src/simulation.js` - double pendulum equations, RK4 integration, energy, and chaos diagnostics
- `src/app.js` - input handling, animation, plotting, scoring, and UI readouts
- `GAME_PLAN.md` - core loop and access plan
- `ASSET_ATTRIBUTION.md` - source and license notes for bundled image assets
