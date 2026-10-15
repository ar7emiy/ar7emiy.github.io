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

// Flow field — simulated drifting currents (abstract natural process)
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.getElementById('flow');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const N = Math.max(220, Math.min(620, Math.floor(w * h / 2800)));
  const parts = [];
  function spawn(p) {
    p.x = Math.random() * w; p.y = Math.random() * h;
    p.px = p.x; p.py = p.y;
    p.life = 0; p.maxLife = 140 + Math.random() * 240;
    p.speed = 0.35 + Math.random() * 0.55;
    p.lake = Math.random() < 0.28;
    return p;
  }
  for (let i = 0; i < N; i++) parts.push(spawn({}));

  let t = Math.random() * 100, running = true, raf = 0;
  function field(x, y) {
    return (Math.sin(x * 0.0022 + t * 0.12) + Math.cos(y * 0.0026 - t * 0.09)
          + Math.sin((x + y) * 0.0011 + t * 0.05)) * 1.05;
  }
  function frame() {
    if (!running) return;
    t += 0.0035;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.028)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    for (const p of parts) {
      const a = field(p.x, p.y);
      p.px = p.x; p.py = p.y;
      p.x += Math.cos(a) * p.speed;
      p.y += Math.sin(a) * p.speed;
      p.life++;
      ctx.strokeStyle = p.lake ? 'rgba(63, 124, 138, 0.17)' : 'rgba(26, 33, 16, 0.10)';
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      if (p.life > p.maxLife || p.x < -12 || p.x > w + 12 || p.y < -12 || p.y > h + 12) spawn(p);
    }
    raf = requestAnimationFrame(frame);
  }
  function setRunning(on) {
    if (on && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); }
  }
  new IntersectionObserver((es) => {
    es.forEach((e) => setRunning(e.isIntersecting && !document.hidden));
  }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    setRunning(!document.hidden);
  });
  raf = requestAnimationFrame(frame);
})();
