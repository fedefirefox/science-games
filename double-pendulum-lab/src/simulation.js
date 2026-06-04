(function attachSimulation(global) {
  "use strict";

  const TAU = Math.PI * 2;
  const EPSILON = 1e-9;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function wrapAngle(angle) {
    let wrapped = (angle + Math.PI) % TAU;
    if (wrapped < 0) {
      wrapped += TAU;
    }
    return wrapped - Math.PI;
  }

  function copyState(state) {
    return [state[0], state[1], state[2], state[3]];
  }

  function addScaled(base, delta, scale) {
    return [
      base[0] + delta[0] * scale,
      base[1] + delta[1] * scale,
      base[2] + delta[2] * scale,
      base[3] + delta[3] * scale
    ];
  }

  class DoublePendulumSim {
    constructor(options) {
      const opts = options || {};
      this.params = {
        m1: opts.m1 || 1,
        m2: opts.m2 || 1,
        l1: opts.l1 || 1,
        l2: opts.l2 || 1,
        g: opts.g || 9.81,
        damping: opts.damping === undefined ? 0.004 : opts.damping
      };
      this.initial = {
        theta1: opts.theta1 === undefined ? (120 * Math.PI) / 180 : opts.theta1,
        theta2: opts.theta2 === undefined ? (-30 * Math.PI) / 180 : opts.theta2,
        omega1: opts.omega1 || 0,
        omega2: opts.omega2 || 0
      };
      this.shadowOffset = opts.shadowOffset || 0.001;
      this.reset();
    }

    setParams(nextParams) {
      Object.assign(this.params, nextParams);
      this.params.m1 = Math.max(0.05, this.params.m1);
      this.params.m2 = Math.max(0.05, this.params.m2);
      this.params.l1 = Math.max(0.05, this.params.l1);
      this.params.l2 = Math.max(0.05, this.params.l2);
      this.params.g = Math.max(0.01, this.params.g);
      this.params.damping = Math.max(0, this.params.damping);
      this.energy0 = this.energy(this.state);
    }

    setInitial(nextInitial) {
      Object.assign(this.initial, nextInitial);
      this.initial.theta1 = wrapAngle(this.initial.theta1);
      this.initial.theta2 = wrapAngle(this.initial.theta2);
      this.reset();
    }

    randomize() {
      const theta1 = ((Math.random() * 250 - 125) * Math.PI) / 180;
      const theta2 = ((Math.random() * 290 - 145) * Math.PI) / 180;
      const omega2 = Math.random() * 3.2 - 1.6;
      this.setInitial({ theta1, theta2, omega1: 0, omega2 });
    }

    reset() {
      this.state = [
        this.initial.theta1,
        this.initial.theta2,
        this.initial.omega1,
        this.initial.omega2
      ];
      this.shadow = [
        this.initial.theta1,
        wrapAngle(this.initial.theta2 + this.shadowOffset),
        this.initial.omega1,
        this.initial.omega2
      ];
      this.time = 0;
      this.energy0 = this.energy(this.state);
    }

    derivatives(state) {
      const theta1 = state[0];
      const theta2 = state[1];
      const omega1 = state[2];
      const omega2 = state[3];
      const { m1, m2, l1, l2, g, damping } = this.params;
      const delta = theta1 - theta2;
      const denominator = 2 * m1 + m2 - m2 * Math.cos(2 * delta);
      const safeDenominator = Math.abs(denominator) < EPSILON ? EPSILON : denominator;

      const a1Numerator =
        -g * (2 * m1 + m2) * Math.sin(theta1) -
        m2 * g * Math.sin(theta1 - 2 * theta2) -
        2 *
          Math.sin(delta) *
          m2 *
          (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(delta));

      const a2Numerator =
        2 *
        Math.sin(delta) *
        (omega1 * omega1 * l1 * (m1 + m2) +
          g * (m1 + m2) * Math.cos(theta1) +
          omega2 * omega2 * l2 * m2 * Math.cos(delta));

      const alpha1 = a1Numerator / (l1 * safeDenominator) - damping * omega1;
      const alpha2 = a2Numerator / (l2 * safeDenominator) - damping * omega2;
      return [omega1, omega2, alpha1, alpha2];
    }

    rk4(state, dt) {
      const k1 = this.derivatives(state);
      const k2 = this.derivatives(addScaled(state, k1, dt * 0.5));
      const k3 = this.derivatives(addScaled(state, k2, dt * 0.5));
      const k4 = this.derivatives(addScaled(state, k3, dt));

      const next = [
        state[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
        state[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        state[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
        state[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3])
      ];

      next[0] = wrapAngle(next[0]);
      next[1] = wrapAngle(next[1]);
      next[2] = clamp(next[2], -80, 80);
      next[3] = clamp(next[3], -80, 80);
      return next;
    }

    step(dt) {
      const maxStep = 1 / 240;
      let remaining = clamp(dt, 0, 0.12);
      while (remaining > 0) {
        const h = Math.min(maxStep, remaining);
        this.state = this.rk4(this.state, h);
        this.shadow = this.rk4(this.shadow, h);
        this.time += h;
        remaining -= h;
      }
    }

    positions(state) {
      const activeState = state || this.state;
      const { l1, l2 } = this.params;
      const theta1 = activeState[0];
      const theta2 = activeState[1];
      const x1 = l1 * Math.sin(theta1);
      const y1 = l1 * Math.cos(theta1);
      const x2 = x1 + l2 * Math.sin(theta2);
      const y2 = y1 + l2 * Math.cos(theta2);
      return [
        { x: x1, y: y1 },
        { x: x2, y: y2 }
      ];
    }

    energy(state) {
      const activeState = state || this.state;
      const theta1 = activeState[0];
      const theta2 = activeState[1];
      const omega1 = activeState[2];
      const omega2 = activeState[3];
      const { m1, m2, l1, l2, g } = this.params;
      const kinetic1 = 0.5 * m1 * l1 * l1 * omega1 * omega1;
      const kinetic2 =
        0.5 *
        m2 *
        (l1 * l1 * omega1 * omega1 +
          l2 * l2 * omega2 * omega2 +
          2 * l1 * l2 * omega1 * omega2 * Math.cos(theta1 - theta2));
      const potential =
        (m1 + m2) * g * l1 * (1 - Math.cos(theta1)) +
        m2 * g * l2 * (1 - Math.cos(theta2));
      return kinetic1 + kinetic2 + potential;
    }

    energyDrift() {
      const base = Math.max(Math.abs(this.energy0), EPSILON);
      return (this.energy(this.state) - this.energy0) / base;
    }

    separation() {
      const current = this.positions(this.state)[1];
      const shadow = this.positions(this.shadow)[1];
      const dx = current.x - shadow.x;
      const dy = current.y - shadow.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    snapshot() {
      return {
        time: this.time,
        state: copyState(this.state),
        shadow: copyState(this.shadow),
        positions: this.positions(this.state),
        shadowPositions: this.positions(this.shadow),
        energy: this.energy(this.state),
        energyDrift: this.energyDrift(),
        separation: this.separation(),
        params: Object.assign({}, this.params)
      };
    }
  }

  global.DoublePendulumLab = {
    DoublePendulumSim,
    clamp,
    wrapAngle,
    TAU
  };
})(window);

