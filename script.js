/* ==========================================
   A THOUSAND STARS — FOR RAIN
   Created with love by Kei
========================================== */

const experience = document.getElementById("experience");
const intro = document.getElementById("intro");
const bloomButton = document.getElementById("bloomButton");

const roseSection = document.getElementById("roseSection");
const roseHeading = document.getElementById("roseHeading");
const formationCaption = document.getElementById("formationCaption");
const dedication = document.getElementById("dedication");
const replayButton = document.getElementById("replayButton");

const backgroundCanvas = document.getElementById("starCanvas");
const roseCanvas = document.getElementById("roseCanvas");

const bg = backgroundCanvas.getContext("2d");
const ctx = roseCanvas.getContext("2d");

const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

const CONFIG = {
    particles: 1600,
    duration: reduceMotion ? 1000 : 12500,
    backgroundStars: 170,
    maxDpr: 1.5
};

let width = 0;
let height = 0;
let dpr = 1;

let backgroundStars = [];
let particles = [];
let petals = [];

let animationFrame = null;
let animationStart = 0;
let animationProgress = 0;

let started = false;
let finished = false;
let lastFrame = 0;

const random = (min, max) =>
    Math.random() * (max - min) + min;

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

const lerp = (a, b, t) =>
    a + (b - a) * t;

const ease = t =>
    t * t * (3 - 2 * t);


/* ==========================================
   CANVAS SETUP
========================================== */

function resizeCanvas() {
    const rect = roseCanvas.getBoundingClientRect();

    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);

    dpr = Math.min(
        window.devicePixelRatio || 1,
        CONFIG.maxDpr
    );

    backgroundCanvas.width =
        Math.floor(window.innerWidth * dpr);

    backgroundCanvas.height =
        Math.floor(window.innerHeight * dpr);

    backgroundCanvas.style.width =
        window.innerWidth + "px";

    backgroundCanvas.style.height =
        window.innerHeight + "px";

    bg.setTransform(dpr, 0, 0, dpr, 0, 0);

    roseCanvas.width = Math.floor(width * dpr);
    roseCanvas.height = Math.floor(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createBackgroundStars();

    if (started) {
        createRoseParticles();
        drawRose(1, performance.now());
    }
}

window.addEventListener("resize", resizeCanvas);


/* ==========================================
   BACKGROUND STARS
========================================== */

function createBackgroundStars() {
    backgroundStars = [];

    for (let i = 0; i < CONFIG.backgroundStars; i++) {
        backgroundStars.push({
            x: random(0, window.innerWidth),
            y: random(0, window.innerHeight),
            size: random(0.4, 1.8),
            alpha: random(0.2, 0.85),
            speed: random(0.0007, 0.002),
            phase: random(0, Math.PI * 2),
            color: Math.random() > 0.8
                ? "#ff9b9f"
                : "#f6d6c0"
        });
    }
}

function drawBackground(time) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    bg.clearRect(0, 0, w, h);

    for (const star of backgroundStars) {
        const pulse = Math.sin(
            time * star.speed + star.phase
        );

        const alpha = clamp(
            star.alpha + pulse * 0.22,
            0.05,
            1
        );

        bg.globalAlpha = alpha;
        bg.fillStyle = star.color;

        bg.beginPath();
        bg.arc(
            star.x,
            star.y,
            star.size,
            0,
            Math.PI * 2
        );
        bg.fill();
    }

    bg.globalAlpha = 1;
}


/* ==========================================
   ROSE GEOMETRY
========================================== */

function makeRoseTargets() {
    const points = [];

    const centerX = width * 0.5;
    const centerY = height * 0.34;

    const scale = Math.min(
        width * 0.38,
        height * 0.31,
        205
    );

    /*
       PETALS

       The rose head is built using overlapping
       curved petal layers. Each layer has a
       different size and rotation.
    */

    const layers = [
        {
            count: 340,
            radius: 1.00,
            rotation: 0.0,
            color: "rose"
        },
        {
            count: 290,
            radius: 0.80,
            rotation: 0.42,
            color: "pink"
        },
        {
            count: 250,
            radius: 0.60,
            rotation: 0.15,
            color: "red"
        },
        {
            count: 190,
            radius: 0.41,
            rotation: 0.55,
            color: "pink"
        },
        {
            count: 125,
            radius: 0.24,
            rotation: 0.2,
            color: "gold"
        }
    ];

    for (const layer of layers) {
        for (let i = 0; i < layer.count; i++) {
            const angle = random(0, Math.PI * 2);

            const petalShape =
                0.68 + 0.32 * Math.cos(
                    5 * (angle + layer.rotation)
                );

            const radius = Math.sqrt(Math.random()) *
                scale *
                layer.radius *
                petalShape;

            const x = centerX +
                Math.cos(angle) * radius;

            const y = centerY +
                Math.sin(angle) * radius * 0.77;

            points.push({
                x,
                y,
                color: layer.color,
                size: random(0.65, 1.65),
                brightness: random(0.5, 1)
            });
        }
    }

    /*
       SPIRAL CENTER

       A luminous spiral gives the middle
       of the rose more depth.
    */

    for (let i = 0; i < 160; i++) {
        const t = i / 160;

        const angle = t * Math.PI * 7;

        const radius = 3 + t * scale * 0.21;

        points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius * 0.77,
            color: "gold",
            size: random(0.8, 1.7),
            brightness: random(0.7, 1)
        });
    }

    /*
       STEM

       A slightly curved stem made from
       individual points.
    */

    const stemStartY = centerY + scale * 0.50;
    const stemLength = Math.min(height * 0.42, 260);

    for (let i = 0; i < 170; i++) {
        const t = i / 169;

        const x = centerX +
            Math.sin(t * Math.PI * 0.85) *
            scale * 0.10;

        const y = stemStartY + t * stemLength;

        points.push({
            x: x + random(-2, 2),
            y: y + random(-2, 2),
            color: "gold",
            size: random(0.65, 1.35),
            brightness: random(0.45, 1)
        });
    }

    /*
       LEAVES

       Two curved leaves made from
       glowing points.
    */

    function makeLeaf(direction) {
        const leafCount = 90;

        const startX = centerX +
            direction * scale * 0.025;

        const startY = stemStartY + stemLength * 0.43;

        const length = scale * 0.52;
        const spread = scale * 0.29;

        for (let i = 0; i < leafCount; i++) {
            const t = Math.random();

            const curveX =
                startX + direction * spread * t;

            const curveY =
                startY - length * t;

            const leafWidth =
                Math.sin(t * Math.PI) * scale * 0.105;

            const side = random(-1, 1);

            points.push({
                x: curveX + side * leafWidth,
                y: curveY + side * leafWidth * 0.65,
                color: "leaf",
                size: random(0.7, 1.5),
                brightness: random(0.45, 1)
            });
        }

        /*
           Leaf center vein
        */

        for (let i = 0; i < 28; i++) {
            const t = i / 27;

            points.push({
                x: startX + direction * spread * t,
                y: startY - length * t,
                color: "gold",
                size: random(0.6, 1.1),
                brightness: random(0.5, 1)
            });
        }
    }

    makeLeaf(-1);
    makeLeaf(1);

    /*
       SMALL PARTICLES AROUND THE ROSE
    */

    for (let i = 0; i < 160; i++) {
        const angle = random(0, Math.PI * 2);
        const radius = random(scale * 0.9, scale * 1.3);

        points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            color: "gold",
            size: random(0.5, 1.15),
            brightness: random(0.2, 0.8),
            decorative: true
        });
    }

    return points;
}


/* ==========================================
   CREATE PARTICLES
========================================== */

function createRoseParticles() {
    const targets = makeRoseTargets();

    particles = [];

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];

        const startAngle = random(0, Math.PI * 2);
        const startRadius = random(
            Math.max(width, height) * 0.25,
            Math.max(width, height) * 0.9
        );

        particles.push({
            sx: width * 0.5 +
                Math.cos(startAngle) * startRadius,

            sy: height * 0.5 +
                Math.sin(startAngle) * startRadius,

            tx: target.x,
            ty: target.y,

            color: target.color,
            size: target.size,
            brightness: target.brightness,

            delay: random(0, 0.32),
            drift: random(-20, 20),
            phase: random(0, Math.PI * 2),

            decorative: !!target.decorative
        });
    }
}


/* ==========================================
   PARTICLE COLORS
========================================== */

function getColor(color, alpha) {
    const colors = {
        rose: `rgba(255, 66, 105, ${alpha})`,
        pink: `rgba(255, 145, 170, ${alpha})`,
        red: `rgba(183, 21, 60, ${alpha})`,
        gold: `rgba(255, 208, 148, ${alpha})`,
        leaf: `rgba(117, 178, 131, ${alpha})`
    };

    return colors[color] || colors.rose;
}


/* ==========================================
   DRAW ONE PARTICLE
========================================== */

function drawParticle(x, y, particle, time, progress) {
    const pulse = 0.75 +
        Math.sin(time * 0.002 + particle.phase) * 0.25;

    const alpha = clamp(
        particle.brightness * pulse,
        0.1,
        1
    );

    const size = particle.size * (0.85 + pulse * 0.2);

    /*
       Decorative particles stay a little softer.
    */

    if (!particle.decorative) {
        ctx.shadowBlur = progress > 0.8 ? 8 : 3;
        ctx.shadowColor = getColor(particle.color, 0.8);
    } else {
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(255, 180, 130, 0.4)";
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = getColor(particle.color, alpha);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    /*
       A few particles receive a tiny cross-shaped
       sparkle when the rose is nearly complete.
    */

    if (
        !particle.decorative &&
        progress > 0.72 &&
        particle.brightness > 0.88 &&
        particle.size > 1.1
    ) {
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillRect(x - 3, y - 0.35, 6, 0.7);
        ctx.fillRect(x - 0.35, y - 3, 0.7, 6);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}


/* ==========================================
   DRAW THE ROSE
========================================== */

function drawRose(progress, time) {
    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.34;

    /*
       GLOW BEHIND THE ROSE
    */

    if (progress > 0.2) {
        const glowAlpha = clamp(
            (progress - 0.2) / 0.8,
            0,
            1
        );

        const glow = ctx.createRadialGradient(
            centerX,
            centerY,
            3,
            centerX,
            centerY,
            Math.min(width, height) * 0.43
        );

        glow.addColorStop(0, `rgba(190, 24, 63, ${0.12 * glowAlpha})`);
        glow.addColorStop(0.55, `rgba(120, 8, 40, ${0.07 * glowAlpha})`);
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    }

    /*
       PARTICLES MOVE FROM SCATTERED POSITIONS
       TOWARD THEIR FINAL ROSE POSITIONS.
    */

    for (const particle of particles) {
        const localProgress = clamp(
            (progress - particle.delay) /
            (1 - particle.delay),
            0,
            1
        );

        const movement = ease(localProgress);

        const x = lerp(
            particle.sx,
            particle.tx,
            movement
        );

        const y = lerp(
            particle.sy,
            particle.ty,
            movement
        );

        const floating = Math.sin(
            time * 0.0015 + particle.phase
        ) * (1 - movement) * 9;

        drawParticle(
            x + floating * 0.25,
            y + floating,
            particle,
            time,
            progress
        );
    }

    /*
       ADD A SOFT LIGHT RING UNDER THE STEM
       AFTER THE ROSE IS MOSTLY FORMED.
    */

    if (progress > 0.8) {
        const ringAlpha = clamp(
            (progress - 0.8) * 3,
            0,
            0.25
        );

        ctx.beginPath();

        ctx.ellipse(
            centerX,
            centerY + Math.min(height * 0.37, 245),
            Math.min(width * 0.24, 130),
            5,
            0,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            `rgba(255, 190, 137, ${ringAlpha})`;

        ctx.lineWidth = 1;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "rgba(255, 100, 130, 0.5)";
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
}


/* ==========================================
   ANIMATION LOOP
========================================== */

function animate(time) {
    animationFrame = requestAnimationFrame(animate);

    /*
       Limit drawing to approximately 30 FPS.
       This helps lower-end phones and laptops.
    */

    if (time - lastFrame < 32) return;

    lastFrame = time;

    drawBackground(time);

    if (!started) return;

    const elapsed = time - animationStart;

    animationProgress = clamp(
        elapsed / CONFIG.duration,
        0,
        1
    );

    drawRose(animationProgress, time);

    /*
       CAPTION TIMING
    */

    if (animationProgress > 0.12) {
        formationCaption.textContent =
            "Every little light, finding its way...";
    }

    if (animationProgress > 0.42) {
        formationCaption.textContent =
            "And slowly, something beautiful takes shape.";
    }

    if (animationProgress > 0.78) {
        formationCaption.textContent =
            "A thousand stars, gathered into one rose.";
    }

    /*
       FINISH
    */

    if (animationProgress >= 1 && !finished) {
        finished = true;
        showDedication();
    }
}


/* ==========================================
   BEGIN EXPERIENCE
========================================== */

function beginExperience() {
    if (started) return;

    started = true;
    finished = false;

    intro.style.display = "none";
    roseSection.style.display = "flex";
    dedication.style.display = "none";

    roseHeading.classList.add("visible");
    formationCaption.classList.add("visible");

    resizeCanvas();
    createRoseParticles();

    animationStart = performance.now();
    animationProgress = 0;

    if (!animationFrame) {
        animationFrame = requestAnimationFrame(animate);
    }
}

bloomButton.addEventListener("click", beginExperience);


/* ==========================================
   SHOW DEDICATION
========================================== */

function showDedication() {
    formationCaption.textContent =
        "And this little universe is yours.";

    setTimeout(() => {
        roseSection.style.display = "none";
        dedication.style.display = "flex";

        requestAnimationFrame(() => {
            dedication.classList.add("visible");
        });
    }, 1400);
}


/* ==========================================
   REPLAY
========================================== */

function replayExperience() {
    dedication.classList.remove("visible");

    setTimeout(() => {
        dedication.style.display = "none";

        started = false;
        finished = false;
        animationProgress = 0;

        roseSection.style.display = "none";
        intro.style.display = "flex";

        roseHeading.classList.remove("visible");
        formationCaption.classList.remove("visible");

        ctx.clearRect(0, 0, width, height);
    }, 1000);
}

replayButton.addEventListener("click", replayExperience);


/* ==========================================
   INITIALIZE
========================================== */

resizeCanvas();

drawBackground(performance.now());

animationFrame = requestAnimationFrame(animate);
