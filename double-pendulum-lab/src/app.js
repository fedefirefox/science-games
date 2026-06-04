(function attachApp(global) {
  "use strict";

  const { DoublePendulumSim, clamp, wrapAngle } = global.DoublePendulumLab;
  const DEG = 180 / Math.PI;
  const RAD = Math.PI / 180;
  const HISTORY_LIMIT = 980;

  const sim = new DoublePendulumSim();
  const history = [];
  const catFaces = {
    first: new Image(),
    second: new Image()
  };
  const turnTracker = {
    previous: [0, 0],
    marker: [0, 0],
    accumulated: [0, 0]
  };
  const sound = {
    enabled: false,
    clip: null,
    lastPlayedAt: 0
  };
  let running = true;
  let lastTimestamp = 0;
  let sampleCarry = 0;

  catFaces.first.src = "assets/cat-faces/noto-cat-open-mouth.svg";
  catFaces.second.src = "assets/cat-faces/noto-cat-heart-eyes.svg";

  sound.clip = createMiaoClip();

  const els = {
    pendulumCanvas: document.getElementById("pendulumCanvas"),
    plotCanvas: document.getElementById("plotCanvas"),
    toggleButton: document.getElementById("toggleButton"),
    resetButton: document.getElementById("resetButton"),
    randomButton: document.getElementById("randomButton"),
    miaoButton: document.getElementById("miaoButton"),
    theta1Input: document.getElementById("theta1Input"),
    theta2Input: document.getElementById("theta2Input"),
    kickInput: document.getElementById("kickInput"),
    gravityInput: document.getElementById("gravityInput"),
    mass2Input: document.getElementById("mass2Input"),
    length1Input: document.getElementById("length1Input"),
    length2Input: document.getElementById("length2Input"),
    dampingInput: document.getElementById("dampingInput"),
    speedInput: document.getElementById("speedInput"),
    theta1Value: document.getElementById("theta1Value"),
    theta2Value: document.getElementById("theta2Value"),
    kickValue: document.getElementById("kickValue"),
    gravityValue: document.getElementById("gravityValue"),
    mass2Value: document.getElementById("mass2Value"),
    length1Value: document.getElementById("length1Value"),
    length2Value: document.getElementById("length2Value"),
    dampingValue: document.getElementById("dampingValue"),
    speedValue: document.getElementById("speedValue"),
    timeReadout: document.getElementById("timeReadout"),
    energyReadout: document.getElementById("energyReadout"),
    chaosReadout: document.getElementById("chaosReadout"),
    scoreReadout: document.getElementById("scoreReadout"),
    theta1Readout: document.getElementById("theta1Readout"),
    theta2Readout: document.getElementById("theta2Readout"),
    omega1Readout: document.getElementById("omega1Readout"),
    omega2Readout: document.getElementById("omega2Readout")
  };

  const presets = {
    calm: { theta1: 55, theta2: 35, kick: 0, gravity: 9.81, mass2: 1, length1: 0.9, length2: 1.05, damping: 0.009 },
    chaos: { theta1: 128, theta2: -73, kick: 0.35, gravity: 9.81, mass2: 1.25, length1: 1, length2: 0.92, damping: 0.002 },
    swing: { theta1: 170, theta2: -12, kick: 1.25, gravity: 7.2, mass2: 0.85, length1: 1.18, length2: 1.22, damping: 0.004 }
  };

  function formatDegrees(radians) {
    return `${Math.round(wrapAngle(radians) * DEG)} deg`;
  }

  function setCanvasScale(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, global.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width: rect.width, height: rect.height };
  }

  function clearHistory() {
    history.length = 0;
    sampleCarry = 0;
    pushHistory();
  }

  function resetTurnTracker() {
    const state = sim.snapshot().state;
    turnTracker.previous = [state[0], state[1]];
    turnTracker.marker = [0, 0];
    turnTracker.accumulated = [0, 0];
  }

  function pushHistory() {
    const snap = sim.snapshot();
    history.push({
      time: snap.time,
      theta1: wrapAngle(snap.state[0]),
      theta2: wrapAngle(snap.state[1]),
      omega1: snap.state[2],
      omega2: snap.state[3],
      energyDrift: snap.energyDrift,
      separation: snap.separation,
      x: snap.positions[1].x,
      y: snap.positions[1].y
    });
    while (history.length > HISTORY_LIMIT) {
      history.shift();
    }
  }

  function currentScore(snapshot) {
    const driftPenalty = Math.abs(snapshot.energyDrift) * 1150;
    const chaosPenalty = Math.log10(1 + snapshot.separation * 1500) * 16;
    return Math.round(clamp(100 - driftPenalty - chaosPenalty, 0, 100));
  }

  function applyInputs(options) {
    const shouldReset = !(options && options.keepTime);
    sim.setParams({
      g: Number(els.gravityInput.value),
      m2: Number(els.mass2Input.value),
      l1: Number(els.length1Input.value),
      l2: Number(els.length2Input.value),
      damping: Number(els.dampingInput.value)
    });

    if (shouldReset) {
      sim.setInitial({
        theta1: Number(els.theta1Input.value) * RAD,
        theta2: Number(els.theta2Input.value) * RAD,
        omega1: 0,
        omega2: Number(els.kickInput.value)
      });
      resetTurnTracker();
      clearHistory();
    }
    syncOutputLabels();
  }

  function syncOutputLabels() {
    els.theta1Value.textContent = `${els.theta1Input.value} deg`;
    els.theta2Value.textContent = `${els.theta2Input.value} deg`;
    els.kickValue.textContent = Number(els.kickInput.value).toFixed(2);
    els.gravityValue.textContent = Number(els.gravityInput.value).toFixed(2);
    els.mass2Value.textContent = Number(els.mass2Input.value).toFixed(2);
    els.length1Value.textContent = Number(els.length1Input.value).toFixed(2);
    els.length2Value.textContent = Number(els.length2Input.value).toFixed(2);
    els.dampingValue.textContent = Number(els.dampingInput.value).toFixed(3);
    els.speedValue.textContent = `${Number(els.speedInput.value).toFixed(2)}x`;
    els.miaoButton.textContent = sound.enabled ? "Miao: On" : "Miao: Off";
    els.miaoButton.setAttribute("aria-pressed", sound.enabled ? "true" : "false");
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) {
      return;
    }
    els.theta1Input.value = preset.theta1;
    els.theta2Input.value = preset.theta2;
    els.kickInput.value = preset.kick;
    els.gravityInput.value = preset.gravity;
    els.mass2Input.value = preset.mass2;
    els.length1Input.value = preset.length1;
    els.length2Input.value = preset.length2;
    els.dampingInput.value = preset.damping;
    applyInputs();
  }

  function randomizeInputs() {
    const theta1 = Math.round(Math.random() * 250 - 125);
    const theta2 = Math.round(Math.random() * 290 - 145);
    const kick = Math.random() * 3.2 - 1.6;
    els.theta1Input.value = theta1;
    els.theta2Input.value = theta2;
    els.kickInput.value = kick.toFixed(2);
    applyInputs();
  }

  function createMiaoClip() {
    const clip = document.createElement("audio");
    const canUseOgg = clip.canPlayType('audio/ogg; codecs="vorbis"') !== "";
    clip.src = canUseOgg ? "assets/audio/miao-cat.ogg" : "assets/audio/miao-cat.mp3";
    clip.preload = "auto";
    clip.volume = 0.82;
    clip.load();
    return clip;
  }

  function playMiao(force) {
    if (!force && !sound.enabled) {
      return;
    }
    const now = global.performance.now();
    if (!force && now - sound.lastPlayedAt < 650) {
      return;
    }
    sound.lastPlayedAt = now;

    if (!sound.clip) {
      return;
    }
    sound.clip.pause();
    try {
      sound.clip.currentTime = 0;
    } catch (error) {
      // Some browsers delay seeking local media until metadata is available.
    }
    const playPromise = sound.clip.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {});
    }
  }

  function updateTurnSounds(snapshot) {
    snapshot.state.slice(0, 2).forEach((angle, index) => {
      const delta = wrapAngle(angle - turnTracker.previous[index]);
      turnTracker.accumulated[index] += delta;
      turnTracker.previous[index] = angle;
      if (Math.abs(turnTracker.accumulated[index] - turnTracker.marker[index]) >= Math.PI * 2) {
        turnTracker.marker[index] = turnTracker.accumulated[index];
        playMiao(false);
      }
    });
  }

  function drawBackground(context, width, height) {
    context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#fffdf8");
    gradient.addColorStop(0.55, "#f8f2e8");
    gradient.addColorStop(1, "#eef7f6");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.strokeStyle = "rgba(102, 112, 122, 0.13)";
    context.lineWidth = 1;
    const grid = 42;
    for (let x = 0; x < width; x += grid) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += grid) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.restore();
  }

  function drawPendulum() {
    const { context, width, height } = setCanvasScale(els.pendulumCanvas);
    drawBackground(context, width, height);

    const snapshot = sim.snapshot();
    const totalLength = snapshot.params.l1 + snapshot.params.l2;
    const pivot = { x: width * 0.5, y: height * 0.29 };
    const scale = Math.min(width * 0.4, height * 0.48) / totalLength;

    function map(point) {
      return {
        x: pivot.x + point.x * scale,
        y: pivot.y + point.y * scale
      };
    }

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    if (history.length > 2) {
      for (let i = 1; i < history.length; i += 1) {
        const prev = map(history[i - 1]);
        const next = map(history[i]);
        const progress = i / history.length;
        context.strokeStyle = `rgba(${Math.round(13 + progress * 187)}, ${Math.round(124 - progress * 38)}, ${Math.round(131 - progress * 62)}, ${0.07 + progress * 0.42})`;
        context.lineWidth = 1.2 + progress * 1.8;
        context.beginPath();
        context.moveTo(prev.x, prev.y);
        context.lineTo(next.x, next.y);
        context.stroke();
      }
    }

    const p1 = map(snapshot.positions[0]);
    const p2 = map(snapshot.positions[1]);
    const s1 = map(snapshot.shadowPositions[0]);
    const s2 = map(snapshot.shadowPositions[1]);

    context.strokeStyle = "rgba(200, 86, 69, 0.28)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(pivot.x, pivot.y);
    context.lineTo(s1.x, s1.y);
    context.lineTo(s2.x, s2.y);
    context.stroke();

    context.strokeStyle = "#27313a";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(pivot.x, pivot.y);
    context.lineTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.stroke();

    context.fillStyle = "#27313a";
    context.beginPath();
    context.arc(pivot.x, pivot.y, 7, 0, Math.PI * 2);
    context.fill();

    drawCatBob(context, catFaces.first, p1, 42, "#0d7c83", snapshot.state[2]);
    drawCatBob(context, catFaces.second, p2, 52, "#c85645", snapshot.state[3]);

    context.strokeStyle = "rgba(29, 35, 41, 0.18)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(pivot.x, pivot.y, snapshot.params.l1 * scale, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(p1.x, p1.y, snapshot.params.l2 * scale, 0, Math.PI * 2);
    context.stroke();

    context.restore();
  }

  function drawCatBob(context, image, point, size, fallbackColor, omega) {
    context.save();
    context.translate(point.x, point.y);
    context.rotate(clamp(omega * 0.04, -0.32, 0.32));
    context.fillStyle = "rgba(29, 35, 41, 0.18)";
    context.beginPath();
    context.arc(3, 5, size * 0.47, 0, Math.PI * 2);
    context.fill();

    if (image.complete && image.naturalWidth > 0) {
      context.drawImage(image, -size * 0.5, -size * 0.5, size, size);
    } else {
      context.fillStyle = fallbackColor;
      context.beginPath();
      context.arc(0, 0, size * 0.38, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  function drawPlotFrame(context, rect, title) {
    context.fillStyle = "rgba(255, 253, 248, 0.76)";
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
    context.strokeStyle = "rgba(102, 112, 122, 0.22)";
    context.strokeRect(rect.x, rect.y, rect.w, rect.h);
    context.fillStyle = "#1d2329";
    context.font = "700 13px Inter, system-ui, sans-serif";
    context.fillText(title, rect.x + 12, rect.y + 22);

    context.strokeStyle = "rgba(102, 112, 122, 0.16)";
    context.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const x = rect.x + (rect.w * i) / 4;
      const y = rect.y + (rect.h * i) / 4;
      context.beginPath();
      context.moveTo(x, rect.y);
      context.lineTo(x, rect.y + rect.h);
      context.stroke();
      context.beginPath();
      context.moveTo(rect.x, y);
      context.lineTo(rect.x + rect.w, y);
      context.stroke();
    }
  }

  function drawPlot() {
    const { context, width, height } = setCanvasScale(els.plotCanvas);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fbfaf6";
    context.fillRect(0, 0, width, height);

    const pad = Math.max(16, Math.min(width, height) * 0.04);
    const phaseRect = { x: pad, y: pad, w: width - pad * 2, h: height * 0.45 - pad };
    const traceRect = { x: pad, y: phaseRect.y + phaseRect.h + pad, w: width - pad * 2, h: height - phaseRect.h - pad * 3 };

    drawPlotFrame(context, phaseRect, "phase portrait");
    drawPlotFrame(context, traceRect, "angle traces");

    if (history.length < 2) {
      return;
    }

    function phaseX(theta) {
      return phaseRect.x + ((theta + Math.PI) / (Math.PI * 2)) * phaseRect.w;
    }

    function phaseY(theta) {
      return phaseRect.y + phaseRect.h - ((theta + Math.PI) / (Math.PI * 2)) * phaseRect.h;
    }

    context.lineWidth = 2;
    for (let i = 1; i < history.length; i += 1) {
      const previous = history[i - 1];
      const current = history[i];
      const alpha = 0.08 + (i / history.length) * 0.52;
      context.strokeStyle = `rgba(13, 124, 131, ${alpha})`;
      context.beginPath();
      context.moveTo(phaseX(previous.theta1), phaseY(previous.theta2));
      context.lineTo(phaseX(current.theta1), phaseY(current.theta2));
      context.stroke();
    }

    const last = history[history.length - 1];
    context.fillStyle = "#c85645";
    context.beginPath();
    context.arc(phaseX(last.theta1), phaseY(last.theta2), 4, 0, Math.PI * 2);
    context.fill();

    function traceX(index) {
      return traceRect.x + (index / (HISTORY_LIMIT - 1)) * traceRect.w;
    }

    function angleY(theta) {
      return traceRect.y + traceRect.h * 0.5 - (theta / Math.PI) * (traceRect.h * 0.42);
    }

    function energyY(drift) {
      return traceRect.y + traceRect.h * 0.5 - clamp(drift * 10, -1, 1) * (traceRect.h * 0.38);
    }

    function drawTrace(field, color, yMapper) {
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.beginPath();
      history.forEach((point, index) => {
        const x = traceX(index + HISTORY_LIMIT - history.length);
        const y = yMapper(point[field]);
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
    }

    drawTrace("theta1", "#0d7c83", angleY);
    drawTrace("theta2", "#c85645", angleY);
    drawTrace("energyDrift", "#b6811d", energyY);

    const legendY = traceRect.y + 24;
    const legend = [
      ["theta 1", "#0d7c83"],
      ["theta 2", "#c85645"],
      ["energy", "#b6811d"]
    ];
    context.font = "700 12px Inter, system-ui, sans-serif";
    legend.forEach((item, index) => {
      const x = traceRect.x + 118 + index * 86;
      context.fillStyle = item[1];
      context.fillRect(x, legendY - 9, 16, 3);
      context.fillStyle = "#66707a";
      context.fillText(item[0], x + 22, legendY - 4);
    });
  }

  function updateReadouts() {
    const snapshot = sim.snapshot();
    const chaos = Math.round(Math.log10(1 + snapshot.separation * 2500) * 100);
    els.timeReadout.textContent = `${snapshot.time.toFixed(1)}s`;
    els.energyReadout.textContent = `${(snapshot.energyDrift * 100).toFixed(2)}%`;
    els.chaosReadout.textContent = `${chaos}`;
    els.scoreReadout.textContent = `${currentScore(snapshot)}`;
    els.theta1Readout.textContent = formatDegrees(snapshot.state[0]);
    els.theta2Readout.textContent = formatDegrees(snapshot.state[1]);
    els.omega1Readout.textContent = snapshot.state[2].toFixed(2);
    els.omega2Readout.textContent = snapshot.state[3].toFixed(2);
    els.toggleButton.textContent = running ? "Pause" : "Play";
  }

  function frame(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }
    const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
    lastTimestamp = timestamp;

    if (running) {
      const speed = Number(els.speedInput.value);
      sim.step(dt * speed);
      updateTurnSounds(sim.snapshot());
      sampleCarry += dt * speed;
      if (sampleCarry >= 1 / 30) {
        pushHistory();
        sampleCarry = 0;
      }
    }

    drawPendulum();
    drawPlot();
    updateReadouts();
    global.requestAnimationFrame(frame);
  }

  els.toggleButton.addEventListener("click", () => {
    running = !running;
    updateReadouts();
  });

  els.resetButton.addEventListener("click", () => {
    applyInputs();
    running = true;
  });

  els.randomButton.addEventListener("click", () => {
    randomizeInputs();
    running = true;
  });

  els.miaoButton.addEventListener("click", () => {
    sound.enabled = !sound.enabled;
    if (sound.enabled) {
      playMiao(true);
    }
    syncOutputLabels();
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
      running = true;
    });
  });

  [
    els.theta1Input,
    els.theta2Input,
    els.kickInput,
    els.gravityInput,
    els.mass2Input,
    els.length1Input,
    els.length2Input,
    els.dampingInput
  ].forEach((input) => {
    input.addEventListener("input", () => applyInputs());
  });

  els.speedInput.addEventListener("input", () => syncOutputLabels());

  document.addEventListener("keydown", (event) => {
    if (event.target && event.target.matches && event.target.matches("input")) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      running = !running;
    }
    if (event.key.toLowerCase() === "r") {
      applyInputs();
      running = true;
    }
  });

  applyInputs();
  global.requestAnimationFrame(frame);
})(window);
