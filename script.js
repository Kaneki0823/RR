
"use strict";

(() => {
  const $ = id => document.getElementById(id);

  const experience = $("experience");
  const button = $("bloomButton");
  const replayButton = $("replayButton");
  const scene = $("roseScene");
  const caption = $("roseCaption");
  const dedication = $("dedication");
  const canvas = $("roseCanvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  if (!ctx) return;

  const reducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let W = 1, H = 1, DPR = 1;
  let started = false, finished = false;
  let startTime = 0, frameId = 0, lastFrame = 0;
  let stars = [];
  let targets = [];
  let backgroundStars = [];
  let petals = [];

  const DURATION = reducedMotion ? 1000 : 11000;
  const FPS_INTERVAL = 1000 / 30;
  const COUNT = 1050;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = v => 1 - Math.pow(1 - clamp(v), 3);

  function resize() {
    const rect = scene.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);

    // Limit pixel density for mobile performance.
    DPR = Math.min(window.devicePixelRatio || 1, 1.15);

    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (!started) drawBackground(performance.now());
  }

  function makeBackground() {
    backgroundStars = Array.from({ length: 75 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      size: rand(0.35, 1.15),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.12, 0.55),
      gold: Math.random() > 0.62
    }));

    petals = Array.from({ length: 10 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      size: rand(3, 6),
      speed: rand(0.1, 0.3),
      drift: rand(-0.14, 0.14),
      angle: rand(0, Math.PI * 2)
    }));
  }

  // Point-in-shape tests let us create particles in the outline
  // of the rose rather than arranging them randomly.
  function insideEllipse(x, y, rx, ry, rotation = 0) {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const xx = x * c + y * s;
    const yy = -x * s + y * c;
    return (xx * xx) / (rx * rx) +
           (yy * yy) / (ry * ry) <= 1;
  }

  function makeRoseTargets() {
    targets = [];

    const cx = W * 0.5;
    const cy = H * 0.38;
    const radius = Math.min(W * 0.29, H * 0.19);

    // Sample layered curved petals. Each layer has a different
    // radius, giving the rose its many overlapping petal shapes.
    const layers = [
      { count: 11, rx: radius * 0.94, ry: radius * 0.73,
        rotation: 0, color: 0 },
      { count: 9, rx: radius * 0.69, ry: radius * 0.58,
        rotation: 0.2, color: 1 },
      { count: 7, rx: radius * 0.43, ry: radius * 0.39,
        rotation: 0.4, color: 2 },
      { count: 5, rx: radius * 0.22, ry: radius * 0.25,
        rotation: 0.25, color: 3 }
    ];

    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];

      for (let i = 0; i < layer.count; i++) {
        const angle =
          (i / layer.count) * Math.PI * 2 + layer.rotation;

        const petalCX = Math.cos(angle) * layer.rx * 0.31;
        const petalCY = Math.sin(angle) * layer.ry * 0.31;

        // Fill each petal with sampled points.
        for (let j = 0; j < Math.floor(COUNT / 43); j++) {
          const a = rand(0, Math.PI * 2);
          const r = Math.sqrt(Math.random());

          const px = Math.cos(a) * layer.rx * 0.42 * r;
          const py = Math.sin(a) * layer.ry * 0.72 * r;

          const rotation = angle + Math.PI / 2;
          const rx = px * Math.cos(rotation) - py * Math.sin(rotation);
          const ry = px * Math.sin(rotation) + py * Math.cos(rotation);

          targets.push({
            x: cx + petalCX + rx,
            y: cy + petalCY + ry,
            color: layer.color,
            size: rand(0.65, 1.65),
            phase: rand(0, Math.PI * 2)
          });
        }
      }
    }

    // A tighter spiral creates the curled center of the rose.
    for (let i = 0; i < 100; i++) {
      const a = i * 0.23;
      const r = radius * (0.015 + i / 100 * 0.2);

      targets.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        color: 3,
        size: rand(0.8, 1.8),
        phase: rand(0, Math.PI * 2)
      });
    }

    // Stem, composed of a curved line of target points.
    const stemTop = cy + radius * 0.75;
    const stemBottom = H * 0.88;

    for (let i = 0; i < 180; i++) {
      const t = i / 179;
      const y = stemTop + (stemBottom - stemTop) * t;
      const x = cx + Math.sin(t * Math.PI * 1.5) * 5;

      targets.push({
        x: x + rand(-2.2, 2.2),
        y,
        color: 4,
        size: rand(0.7, 1.5),
        phase: rand(0, Math.PI * 2)
      });
    }

    // Leaf-shaped clusters, made from ellipses tilted around
    // their attachment points on the stem.
    const leaves = [
      { x: cx - 19, y: H * 0.65, rx: 36, ry: 12, a: -0.55 },
      { x: cx + 20, y: H * 0.73, rx: 39, ry: 13, a: 0.48 },
      { x: cx - 14, y: H * 0.79, rx: 29, ry: 10, a: -0.52 }
    ];

    for (const leaf of leaves) {
      for (let i = 0; i < 65; i++) {
        const a = rand(0, Math.PI * 2);
        const r = Math.sqrt(Math.random());
        const lx = Math.cos(a) * leaf.rx * r;
        const ly = Math.sin(a) * leaf.ry * r;

        targets.push({
          x: leaf.x + lx * Math.cos(leaf.a) - ly * Math.sin(leaf.a),
          y: leaf.y + lx * Math.sin(leaf.a) + ly * Math.cos(leaf.a),
          color: 4,
          size: rand(0.7, 1.4),
          phase: rand(0, Math.PI * 2)
        });
      }
    }

    // Keep particle count bounded on smaller screens.
    if (targets.length > COUNT) {
      const selected = [];
      for (let i = 0; i < COUNT; i++) {
        selected.push(targets[Math.floor(i * targets.length / COUNT)]);
      }
      targets = selected;
    }

    // Distribute all stars throughout the scene before the bloom.
    stars = targets.map(target => ({
      x: rand(-W * 0.2, W * 1.2),
      y: rand(-H * 0.2, H * 1.2),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.3, 0.3),
      tx: target.x,
      ty: target.y,
      color: target.color,
      size: target.size,
      phase: target.phase,
      startDelay: rand(0, 0.32)
    }));
  }

  function drawBackground(time) {
    ctx.clearRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(
      W / 2, H * 0.4, 0,
      W / 2, H * 0.4, Math.min(W, H) * 0.6
    );

    glow.addColorStop(0, "rgba(96, 16, 40, 0.18)");
    glow.addColorStop(0.5, "rgba(54, 12, 27, 0.08)");
    glow.addColorStop(1, "rgba(16, 8, 12, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    for (const s of backgroundStars) {
      ctx.globalAlpha =
        s.alpha * (0.6 + 0.4 * Math.sin(time * 0.0015 + s.phase));

      ctx.fillStyle = s.gold ? "#efd3a0" : "#f3a7b6";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    for (const p of petals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#d05a77";

      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.6, p.size, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (started && !finished) {
        p.y += p.speed;
        p.x += p.drift;
        p.angle += 0.003;

        if (p.y > H + 10) {
          p.y = -10;
          p.x = rand(0, W);
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  function drawStars(progress, time) {
    const p = ease(progress);

    const palette = [
      [239, 89, 120],  // deep rose pink
      [255, 154, 177], // soft pink
      [255, 211, 218], // pale petal
      [255, 222, 160], // gold
      [91, 153, 100]   // leaf green
    ];

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      const local = ease(
        (progress - s.startDelay) / (1 - s.startDelay)
      );

      // Stars fly toward their own destinations gradually.
      const driftX = Math.sin(time * 0.0007 + s.phase) *
                     (1 - local) * 16;
      const driftY = Math.cos(time * 0.0009 + s.phase) *
                     (1 - local) * 12;

      const x = s.x + (s.tx - s.x) * local + driftX;
      const y = s.y + (s.ty - s.y) * local + driftY;

      const [r, g, b] = palette[s.color];
      const shimmer = 0.7 +
        0.3 * Math.sin(time * 0.002 + s.phase);

      const alpha = (0.2 + 0.8 * local) * shimmer;
      const size = s.size * (0.5 + local * 0.5);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // A small fraction of stars get a tiny cross-shaped sparkle.
      if (i % 37 === 0 && local > 0.65) {
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillRect(x - size * 2, y - 0.35, size * 4, 0.7);
        ctx.fillRect(x - 0.35, y - size * 2, 0.7, size * 4);
      }
    }

    ctx.globalAlpha = 1;
  }

  function render(time, progress) {
    drawBackground(time);
    drawStars(progress, time);
  }

  function finish() {
    if (finished) return;
    finished = true;

    render(performance.now(), 1);
    experience.classList.add("finished");

    setTimeout(() => caption.classList.add("visible"), 350);
    setTimeout(() => dedication.classList.add("visible"), 1500);
    setTimeout(() => replayButton.classList.add("visible"), 2600);
  }

  function animate(time) {
    if (!started || finished) return;

    frameId = requestAnimationFrame(animate);

    if (time - lastFrame < FPS_INTERVAL) return;
    lastFrame = time;

    const progress = clamp((time - startTime) / DURATION);
    render(time, progress);

    if (progress >= 1) {
      cancelAnimationFrame(frameId);
      finish();
    }
  }

  function startBloom() {
    if (started) return;

    started = true;
    finished = false;
    button.disabled = true;

    experience.classList.add("started");
    experience.classList.remove("finished");
    caption.classList.remove("visible");
    dedication.classList.remove("visible");
    replayButton.classList.remove("visible");

    setTimeout(() => {
      scene.classList.add("visible");

      requestAnimationFrame(() => {
        resize();
        makeBackground();
        makeRoseTargets();

        startTime = performance.now();
        lastFrame = 0;

        if (reducedMotion) {
          render(startTime + DURATION, 1);
          finish();
        } else {
          cancelAnimationFrame(frameId);
          frameId = requestAnimationFrame(animate);
        }
      });
    }, reducedMotion ? 0 : 550);
  }

  function replay() {
    cancelAnimationFrame(frameId);

    started = false;
    finished = false;
    startTime = 0;

    experience.classList.remove("started", "finished");
    scene.classList.remove("visible");
    caption.classList.remove("visible");
    dedication.classList.remove("visible");
    replayButton.classList.remove("visible");

    button.disabled = false;
    render(performance.now(), 0);

    setTimeout(startBloom, 500);
  }

  button.addEventListener("click", startBloom);
  replayButton.addEventListener("click", replay);

  window.addEventListener("resize", () => {
    resize();

    if (started) {
      makeRoseTargets();

      // Preserve the current stage if the phone rotates.
      if (!finished) {
        const progress = clamp(
          (performance.now() - startTime) / DURATION
        );
        render(performance.now(), progress);
      } else {
        render(performance.now(), 1);
      }
    }
  });

  resize();
  makeBackground();
  render(performance.now(), 0);
})();
