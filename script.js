// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Nav shadow on scroll
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10 ? '0 8px 30px rgba(0,0,0,0.4)' : 'none';
  }, { passive: true });
}


// Living blueprint — a fall maple tree assembled from triangle scaffolding.
// Abstract simulation of natural process: wind loops, triangles attach/detach.
(function () {
  const canvas = document.getElementById('scene');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const FALL = ['#c0392b', '#d94f2b', '#e8a93d', '#c97b2d', '#a83a26', '#d97b2e', '#7a8c3f', '#5f7a35'];
  const BARK = ['#4a382c', '#54402f', '#423226'];

  let W = 0, H = 0, dpr = 1, bg = null;
  let tris = [], flakes = [];
  let treeX = 0, groundY = 0, treeH = 1, S = 1;
  let assembly = 0, windT = 0, lastT = 0;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    treeX = W < 720 ? W * 0.60 : W * 0.72;
    groundY = H * 0.88;
    S = Math.max(0.62, Math.min(1.35, Math.min(W, H) / 430));
    treeH = H * 0.52;

    buildBackground();
    buildTree();
    buildSnow();
  }

  function ridge(b, r, baseY, amp, color) {
    b.fillStyle = color; b.beginPath();
    b.moveTo(-20, H + 20); b.lineTo(-20, baseY);
    for (let x = 0; x <= W + 20; x += W / 16) b.lineTo(x, baseY - r() * amp * (0.5 + r()));
    b.lineTo(W + 20, H + 20); b.closePath(); b.fill();
  }

  function buildBackground() {
    bg = document.createElement('canvas');
    bg.width = canvas.width; bg.height = canvas.height;
    const b = bg.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = mulberry32(77);

    // faint mountains
    ridge(b, r, H * 0.32, H * 0.11, 'rgba(110,130,150,0.13)');
    ridge(b, r, H * 0.45, H * 0.08, 'rgba(95,115,135,0.17)');

    // canyon river — winding band
    const ry = H * 0.68;
    b.beginPath();
    b.moveTo(-20, ry - 12);
    b.bezierCurveTo(W * 0.28, ry - 34, W * 0.55, ry + 10, W + 20, ry - 16);
    b.lineTo(W + 20, ry + 18);
    b.bezierCurveTo(W * 0.55, ry + 40, W * 0.28, ry + 2, -20, ry + 22);
    b.closePath();
    const rg = b.createLinearGradient(0, ry - 30, 0, ry + 40);
    rg.addColorStop(0, 'rgba(88,148,160,0.60)');
    rg.addColorStop(1, 'rgba(52,100,114,0.62)');
    b.fillStyle = rg; b.fill();

    // slightly snowy green grass
    const gy = H * 0.74;
    const gg = b.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, '#7fa06b'); gg.addColorStop(1, '#5d7d51');
    b.fillStyle = gg; b.fillRect(0, gy, W, H - gy);
    for (let i = 0; i < 700; i++) {
      const x = r() * W, y = gy + r() * (H - gy);
      const patch = Math.sin(x * 0.011 + 2.1) + Math.sin(x * 0.033 + y * 0.02) * 0.7;
      if (patch > 0.55) {
        b.fillStyle = 'rgba(255,255,255,' + (0.08 + r() * 0.20).toFixed(2) + ')';
        b.beginPath(); b.arc(x, y, 0.8 + r() * 2.4, 0, TAU); b.fill();
      }
    }
    b.fillStyle = 'rgba(60,80,55,0.22)';
    b.fillRect(0, gy - 3, W, 3);

    // soft ground shadow under the tree
    b.fillStyle = 'rgba(40,60,40,0.25)';
    b.beginPath(); b.ellipse(treeX, groundY + 8 * S, 78 * S, 13 * S, 0, 0, TAU); b.fill();
  }

  function buildTree() {
    tris = [];
    const r = mulberry32(20261015);
    const baseX = treeX, baseY = groundY;
    const trunkLen = treeH * 0.40, trunkWid = 11 * S;

    function addTri(x1, y1, x2, y2, x3, y3, kind, color, hgt, phase) {
      const cx = (x1 + x2 + x3) / 3, cy = (y1 + y2 + y3) / 3;
      const dx = cx - baseX, dy = cy - baseY;
      tris.push({
        hx: cx, hy: cy,
        v: [[x1 - cx, y1 - cy], [x2 - cx, y2 - cy], [x3 - cx, y3 - cy]],
        kind: kind, color: color, hgt: hgt, phase: phase,
        delay: 0,
        sx: r() * W, sy: H * 0.35 + r() * H * 0.65,
        sr: (r() - 0.5) * 5,
        flutter: kind === 'leaf' ? 0.5 + r() : 0,
        _dist: Math.sqrt(dx * dx + dy * dy)
      });
    }

    function canopy(x, y, rad, hgt) {
      const n = Math.max(7, Math.floor(rad * 0.45));
      for (let i = 0; i < n; i++) {
        const a = r() * TAU, d = Math.pow(r(), 0.6) * rad;
        const cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.8;
        const s = (4.5 + r() * 8) * S, ra = r() * TAU;
        const pick = r();
        const c = pick < 0.30 ? FALL[0] : pick < 0.52 ? FALL[1] : pick < 0.70 ? FALL[2]
              : pick < 0.82 ? FALL[3] : pick < 0.90 ? FALL[4] : FALL[6 + Math.floor(r() * 2)];
        addTri(
          cx + Math.cos(ra) * s, cy + Math.sin(ra) * s,
          cx + Math.cos(ra + 2.1) * s * 0.9, cy + Math.sin(ra + 2.1) * s * 0.9,
          cx + Math.cos(ra + 4.2) * s * 0.9, cy + Math.sin(ra + 4.2) * s * 0.9,
          'leaf', c, hgt, r() * TAU
        );
      }
    }

    function branch(x, y, ang, len, wid, depth) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      const px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2);
      const w2 = wid * 0.62;
      const c = BARK[Math.floor(r() * BARK.length)];
      const hgt = Math.max(0, Math.min(1, (baseY - y) / treeH));
      addTri(x + px * wid, y + py * wid, x2 + px * w2, y2 + py * w2, x2 - px * w2, y2 - py * w2, 'bark', c, hgt, r() * TAU);
      addTri(x + px * wid, y + py * wid, x2 - px * w2, y2 - py * w2, x - px * wid, y - py * wid, 'bark', c, hgt, r() * TAU);
      if (depth === 0) { canopy(x2, y2, len * (0.85 + r() * 0.3), hgt); return; }
      if (depth <= 2 && r() < 0.6) canopy(x + (x2 - x) * 0.55, y + (y2 - y) * 0.55, len * 0.55, hgt);
      const n = depth >= 3 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const spread = (r() - 0.5) * 0.9 + (i - (n - 1) / 2) * 0.5;
        branch(x2, y2, ang + spread * 0.8 - 0.10, len * (0.66 + r() * 0.12), w2, depth - 1);
      }
    }
    branch(baseX, baseY, -Math.PI / 2, trunkLen, trunkWid, 4);

    // assembly order grows outward from the trunk base
    let maxD = 1;
    for (const t of tris) maxD = Math.max(maxD, t._dist);
    for (const t of tris) { t.delay = (t._dist / maxD) * 0.72; delete t._dist; }
  }

  function buildSnow() {
    flakes = [];
    const r = mulberry32(99);
    for (let i = 0; i < 44; i++) {
      flakes.push({ x: r() * W, y: r() * H, rad: 0.8 + r() * 1.8, sp: 12 + r() * 22, ph: r() * TAU });
    }
  }

  function targetAssembly() {
    const rct = hero.getBoundingClientRect(), vh = window.innerHeight || 800;
    const p = rct.top / vh;
    if (p >= 0.02) return 1;
    return Math.max(0, Math.min(1, 1 + (p - 0.02) / 0.6));
  }

  function drawTri(t, x, y, rot, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(t.v[0][0], t.v[0][1]);
    ctx.lineTo(t.v[1][0], t.v[1][1]);
    ctx.lineTo(t.v[2][0], t.v[2][1]);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(26,33,16,0.14)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  function draw(now) {
    requestAnimationFrame(draw);
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    const rct = hero.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const visible = rct.bottom > -40 && rct.top < vh + 40;
    const tgt = targetAssembly();
    assembly += (tgt - assembly) * 0.05;
    if (Math.abs(tgt - assembly) < 0.0005) assembly = tgt;
    if (!visible || document.hidden) return;
    windT += dt;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);

    // river shimmer — looped dashes drifting downstream
    ctx.strokeStyle = 'rgba(255,255,255,0.26)';
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    const ry = H * 0.68;
    for (let i = 0; i < 7; i++) {
      const sx = ((windT * 26 + i * W / 7) % (W + 120)) - 60;
      const yy = ry - 8 + ((i * 37) % 26);
      ctx.beginPath(); ctx.moveTo(sx, yy); ctx.lineTo(sx + 26, yy - 3); ctx.stroke();
    }

    // looped wind: branches sway with height, leaves flutter (seamless 9s / 13s cycles)
    const w1 = TAU * windT / 9, w2 = TAU * windT / 4.6, w3 = TAU * windT / 3.9;
    const gust = 0.65 + 0.35 * Math.sin(TAU * windT / 13 + 1.2);
    for (const t of tris) {
      let la = (assembly - t.delay) / 0.28;
      la = la <= 0 ? 0 : la >= 1 ? 1 : la * la * (3 - 2 * la);
      if (la <= 0.001) continue;
      const x = t.sx + (t.hx - t.sx) * la;
      const y = t.sy + (t.hy - t.sy) * la;
      const sway = Math.sin(w1 + t.hy * 0.004) * 7 * t.hgt * gust * la;
      let fx = 0, fy = 0, fr = 0;
      if (t.kind === 'leaf') {
        fx = Math.sin(w2 + t.phase) * 3.2 * t.flutter * gust * la;
        fy = Math.cos(w3 + t.phase * 1.7) * 2.4 * t.flutter * gust * la;
        fr = Math.sin(w2 * 0.8 + t.phase) * 0.30 * gust * la;
      }
      drawTri(t, x + sway + fx, y + fy, t.sr * (1 - la) + fr, Math.min(1, la * 1.7));
    }

    // sparse slow snow
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const f of flakes) {
      f.y += f.sp * dt;
      f.x += Math.sin(TAU * windT / 7 + f.ph) * 0.25;
      if (f.y > H + 4) { f.y = -4; f.x = ((f.x + W * 0.13) % W + W) % W; }
      ctx.beginPath(); ctx.arc(f.x, f.y, f.rad, 0, TAU); ctx.fill();
    }
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200); // seeded rebuild — same tree, no refresh
  });

  build();
  if (reduceMotion) {
    // one static, fully assembled frame
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);
    for (const t of tris) drawTri(t, t.hx, t.hy, 0, 1);
    return;
  }
  requestAnimationFrame(draw);
})();
