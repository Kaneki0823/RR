
"use strict";

(() => {
  const $ = (id) => document.getElementById(id);

  const experience = $("experience");
  const button = $("bloomButton");
  const replayButton = $("replayButton");
  const scene = $("roseScene");
  const caption = $("roseCaption");
  const dedication = $("dedication");
  const canvas = $("roseCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let W = 1;
  let H = 1;
  let DPR = 1;
  let started = false;
  let finished = false;
  let startTime = 0;
  let frameId = 0;
  let lastFrame = 0;
  let stars = [];
  let petals = [];
  let resizeObserver = null;

  const DURATION = reducedMotion ? 1000 : 10000;
  const FRAME_INTERVAL = 1000 / 30;

  const rand = (a, b) => a + Math.random() * (b - a);

  const clamp = (v, a = 0, b = 1) =>
    Math.max(a, Math.min(b, v));

  const ease = (v) => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  };

  const easeOut = (v) => {
    v = clamp(v);
    return 1 - Math.pow(1 - v, 3);
  };

  function resize() {
    const rect = scene.getBoundingClientRect();

    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    DPR = Math.min(window.devicePixelRatio || 1, 1.25);

    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    if (!started) drawBackground(performance.now());
  }

  function makeParticles() {
    stars = Array.from({ length: 65 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.5, 1.5),
      speed: rand(0.1, 0.35),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.2, 0.65),
      gold: Math.random() > 0.6
    }));

    petals = Array.from({ length: 9 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      size: rand(3, 6),
      speed: rand(0.12, 0.35),
      drift: rand(-0.15, 0.15),
      rotation: rand(0, Math.PI * 2),
      spin: rand(-0.004, 0.004)
    }));
  }

  function drawBackground(time) {
    ctx.clearRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(
      W / 2, H * 0.43, 0,
      W / 2, H * 0.43, Math.min(W, H) * 0.55
    );

    glow.addColorStop(0, "rgba(104, 20, 43, 0.17)");
    glow.addColorStop(0.55, "rgba(70, 14, 32, 0.07)");
    glow.addColorStop(1, "rgba(16, 8, 12, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const shimmer =
        0.7 + Math.sin(time * 0.0015 + s.phase) * 0.3;

      ctx.globalAlpha = s.alpha * shimmer;
      ctx.fillStyle = s.gold ? "#e7c58d" : "#e99aaa";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (started && !finished) {
        s.y -= s.speed * 0.3;
        if (s.y < -3) s.y = H + 3;
      }
    }

    ctx.globalAlpha = 1;

    for (const p of petals) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#bf5972";

      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(
        p.size, -p.size * 0.5,
        p.size, p.size * 0.6,
        0, p.size
      );
      ctx.bezierCurveTo(
        -p.size, p.size * 0.6,
        -p.size, -p.size * 0.5,
        0, -p.size
      );
      ctx.fill();
      ctx.restore();

      if (started && !finished) {
        p.y += p.speed;
        p.x += p.drift;
        p.rotation += p.spin;

        if (p.y > H + 10) {
          p.y = -10;
          p.x = rand(0, W);
        }
      }
    }

    ctx.globalAlpha = 1;
  }

  // Every petal has its own opening progress.
  // The shape starts small, then opens and moves outward.
  function drawPetal(options) {
    const {
      angle,
      length,
      breadth,
      distance,
      progress,
      colors,
      curl = 0
    } = options;

    if (progress <= 0.001) return;

    const p = easeOut(progress);
    const openAngle = angle;
    const openedLength = length * (0.16 + p * 0.84);
    const openedWidth = breadth * (0.16 + p * 0.84);
    const openedDistance = distance * p;

    ctx.save();
    ctx.rotate(openAngle);
    ctx.translate(0, -openedDistance);

    const gradient = ctx.createLinearGradient(
      -openedWidth * 0.7,
      -openedLength * 0.4,
      openedWidth * 0.6,
      openedLength * 0.6
    );

    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.48, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.fillStyle = gradient;
    ctx.beginPath();

    ctx.moveTo(0, openedLength * 0.55);

    ctx.bezierCurveTo(
      -openedWidth * 0.95,
      openedLength * 0.35,
      -openedWidth * 0.95 + curl,
      -openedLength * 0.3,
      0,
      -openedLength * 0.5
    );

    ctx.bezierCurveTo(
      openedWidth * 0.95 + curl,
      -openedLength * 0.3,
      openedWidth * 0.95,
      openedLength * 0.35,
      0,
      openedLength * 0.55
    );

    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 207, 213, 0.18)";
    ctx.lineWidth = Math.max(0.5, openedLength * 0.009);

    ctx.beginPath();
    ctx.moveTo(0, openedLength * 0.4);
    ctx.quadraticCurveTo(
      -openedWidth * 0.08,
      0,
      0,
      -openedLength * 0.34
    );
    ctx.stroke();

    ctx.restore();
  }

  const outerColors = [
    ["#a63852", "#68162e", "#310b1c"],
    ["#8f2441", "#541027", "#260916"],
    ["#bb425b", "#77162f", "#3b0b1d"],
    ["#7e1c38", "#4a0d24", "#220814"]
  ];

  const middleColors = [
    ["#f29aaa", "#b52b4a", "#65132c"],
    ["#e96c83", "#98203e", "#4c0e25"],
    ["#ffc0c7", "#cf405d", "#77152f"],
    ["#d84a66", "#8c1937", "#450c22"]
  ];

  const innerColors = [
    ["#ffd0d2", "#e66b83", "#a02040"],
    ["#f69aad", "#c63454", "#74142e"],
    ["#ffb4c0", "#e05270", "#8b1b39"],
    ["#f7c0c4", "#ce3e5b", "#79142f"]
  ];

  function drawRose(cx, cy, scale, progress, time) {
    const radius = Math.min(W * 0.29, H * 0.19);
    const breathing =
      1 + Math.sin(time * 0.001) * 0.008;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale * breathing, scale * breathing);

    // Soft light behind the flower.
    const halo = ctx.createRadialGradient(
      0, 0, 1, 0, 0, radius * 1.65
    );

    halo.addColorStop(0, "rgba(154, 28, 53, 0.22)");
    halo.addColorStop(0.55, "rgba(100, 20, 38, 0.08)");
    halo.addColorStop(1, "rgba(16, 8, 12, 0)");

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.65, 0, Math.PI * 2);
    ctx.fill();

    // Stage 1: outer petals open first.
    for (let i = 0; i < 11; i++) {
      const angle = (i / 11) * Math.PI * 2 + 0.12;
      const delay = i * 0.025;
      const local = ease(
        (progress - delay) / 0.45
      );

      drawPetal({
        angle,
        length: radius * 1.42,
        breadth: radius * 0.53,
        distance: radius * 0.34,
        progress: local,
        colors: outerColors[i % outerColors.length],
        curl: Math.sin(angle * 2) * 2
      });
    }

    // Stage 2: middle petals unfold after the outer petals.
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2 + 0.35;
      const delay = 0.24 + i * 0.022;
      const local = ease(
        (progress - delay) / 0.44
      );

      drawPetal({
        angle,
        length: radius * 1.02,
        breadth: radius * 0.41,
        distance: radius * 0.13,
        progress: local,
        colors: middleColors[i % middleColors.length]
      });
    }

    // Stage 3: inner petals curl into the center.
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + 0.5;
      const delay = 0.48 + i * 0.018;
      const local = ease(
        (progress - delay) / 0.38
      );

      drawPetal({
        angle,
        length: radius * 0.66,
        breadth: radius * 0.28,
        distance: radius * 0.035,
        progress: local,
        colors: innerColors[i % innerColors.length]
      });
    }

    // Stage 4: the central bud appears last.
    const centerProgress = ease(
      (progress - 0.7) / 0.27
    );

    if (centerProgress > 0) {
      const budScale = 0.1 + centerProgress * 0.9;
      const budGradient = ctx.createRadialGradient(
        -radius * 0.06,
        -radius * 0.12,
        1,
        0, 0, radius * 0.29 * budScale
      );

      budGradient.addColorStop(0, "#ffd2d3");
      budGradient.addColorStop(0.3, "#f38ca0");
      budGradient.addColorStop(0.7, "#c23453");
      budGradient.addColorStop(1, "#74132d");

      ctx.fillStyle = budGradient;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -radius * 0.04,
        radius * 0.26 * budScale,
        radius * 0.31 * budScale,
        -0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 218, 218, 0.6)";
      ctx.lineWidth = Math.max(0.7, radius * 0.016);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.06, radius * 0.1);
      ctx.bezierCurveTo(
        -radius * 0.25, -radius * 0.08,
        radius * 0.12, -radius * 0.29,
        radius * 0.13, -radius * 0.07
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawLeaf(x, y, length, angle, growth) {
    if (growth <= 0.001) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(growth, growth);

    const gradient = ctx.createLinearGradient(
      0, -length * 0.4, length, length * 0.2
    );

    gradient.addColorStop(0, "#769c70");
    gradient.addColorStop(0.45, "#356746");
    gradient.addColorStop(1, "#183b2a");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      length * 0.18, -length * 0.6,
      length * 0.82, -length * 0.42,
      length, 0
    );
    ctx.bezierCurveTo(
      length * 0.72, length * 0.34,
      length * 0.25, length * 0.28,
      0, 0
    );
    ctx.fill();

    ctx.strokeStyle = "rgba(208, 225, 177, 0.45)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -length * 0.05, length * 0.95, 0);
    ctx.stroke();

    ctx.restore();
  }

  function drawStem(cx, top, bottom, progress, scale) {
    const length = bottom - top;
    const visible = length * ease(progress);

    if (visible <= 1) return;

    const gradient = ctx.createLinearGradient(
      cx - 4 * scale, top,
      cx + 4 * scale, bottom
    );

    gradient.addColorStop(0, "#668c57");
    gradient.addColorStop(0.45, "#315e3e");
    gradient.addColorStop(1, "#193b2a");

    ctx.save();
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.bezierCurveTo(
      cx + 8 * scale, top + visible * 0.3,
      cx - 8 * scale, top + visible * 0.7,
      cx + 1 * scale, top + visible
    );

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4.8 * scale;
    ctx.stroke();

    ctx.strokeStyle = "rgba(180, 207, 142, 0.35)";
    ctx.lineWidth = 0.9 * scale;
    ctx.beginPath();
    ctx.moveTo(cx - scale, top + 6 * scale);
    ctx.lineTo(cx + scale, top + visible);
    ctx.stroke();

    const leaves = [
      { fraction: 0.33, length: 48 * scale, angle: -2.7 },
      { fraction: 0.51, length: 59 * scale, angle: -0.35 },
      { fraction: 0.69, length: 44 * scale, angle: -2.65 }
    ];

    for (const leaf of leaves) {
      const leafY = top + length * leaf.fraction;

      if (visible > length * leaf.fraction) {
        const leafGrowth = ease(
          (visible / length - leaf.fraction) / 0.17
        );

        drawLeaf(cx, leafY, leaf.length, leaf.angle, leafGrowth);
      }
    }

    ctx.restore();
  }

  function drawScene(time, progress) {
    ctx.clearRect(0, 0, W, H);
    drawBackground(time);

    const scale = Math.min(1, W / 360, H / 390);
    const cx = W / 2;
    const flowerY = H * 0.36;
    const stemBottom = H * 0.87;

    // 0–40%: stem grows.
    const stemProgress = ease(progress / 0.4);

    // 35–100%: the flower opens in several stages.
    const flowerProgress = ease(
      (progress - 0.34) / 0.66
    );

    drawStem(
      cx,
      flowerY + 5 * scale,
      stemBottom,
      stemProgress,
      scale
    );

    // The flower grows only after the stem begins appearing.
    if (progress > 0.34) {
      const flowerScale = scale * (
        0.12 + 0.88 * easeOut(flowerProgress)
      );

      drawRose(
        cx,
        flowerY,
        flowerScale,
        flowerProgress,
        time
      );
    }
  }

  function finish() {
    if (finished) return;

    finished = true;

    drawScene(performance.now(), 1);

    experience.classList.add("finished");

    setTimeout(() => caption.classList.add("visible"), 300);
    setTimeout(() => dedication.classList.add("visible"), 1500);
    setTimeout(() => replayButton.classList.add("visible"), 2600);
  }

  function animate(time) {
    if (!started || finished) return;

    frameId = requestAnimationFrame(animate);

    if (time - lastFrame < FRAME_INTERVAL) return;
    lastFrame = time;

    // Calculate progress from the actual animation start time.
    // This prevents the initial fade-in delay from skipping the bloom.
    const elapsed = Math.max(0, time - startTime);
    const progress = clamp(elapsed / DURATION);

    drawScene(time, progress);

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

    // Clear any previous animation and dedication state.
    experience.classList.remove("finished");
    caption.classList.remove("visible");
    dedication.classList.remove("visible");
    replayButton.classList.remove("visible");

    setTimeout(() => {
      scene.classList.add("visible");

      // Wait for the scene to become visible before starting the clock.
      requestAnimationFrame(() => {
        resize();
        makeParticles();

        startTime = performance.now();
        lastFrame = 0;

        if (reducedMotion) {
          drawScene(startTime + DURATION, 1);
          finish();
        } else {
          cancelAnimationFrame(frameId);
          frameId = requestAnimationFrame(animate);
        }
      });
    }, reducedMotion ? 0 : 550);
  }

  function replayBloom() {
    cancelAnimationFrame(frameId);

    started = false;
    finished = false;
    startTime = 0;
    lastFrame = 0;

    experience.classList.remove("started", "finished");
    scene.classList.remove("visible");
    caption.classList.remove("visible");
    dedication.classList.remove("visible");
    replayButton.classList.remove("visible");

    button.disabled = false;

    drawBackground(performance.now());

    setTimeout(startBloom, 500);
  }

  button.addEventListener("click", startBloom);
  replayButton.addEventListener("click", replayBloom);

  window.addEventListener("resize", () => {
    resize();

    if (started && !finished) {
      makeParticles();
      drawScene(performance.now(), clamp(
        (performance.now() - startTime) / DURATION
      ));
    } else if (finished) {
      drawScene(performance.now(), 1);
    }
  });

  resize();
  makeParticles();
})();
