/* MM://CONTROL — front-end logic (no deps, no build) */
(() => {
  'use strict';

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem('mm-theme');
  if (saved) root.dataset.theme = saved;
  document.getElementById('themeToggle').addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mm-theme', root.dataset.theme);
  });

  /* ---------- starfield + radar canvas ---------- */
  const cv = document.getElementById('starfield');
  const ctx = cv.getContext('2d');
  let stars = [], W = 0, H = 0, sweep = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    stars = Array.from({ length: Math.min(160, W / 9) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + .3, s: Math.random() * .25 + .05
    }));
  }
  size(); addEventListener('resize', size);

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const dark = root.dataset.theme !== 'light';
    ctx.fillStyle = dark ? 'rgba(120,200,255,.5)' : 'rgba(40,80,110,.4)';
    for (const st of stars) {
      ctx.globalAlpha = .3 + .7 * Math.abs(Math.sin(st.y + Date.now() * st.s * .002));
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // radar sweep in hero area
    const cx = W - 140, cy = 140, R = 90;
    ctx.strokeStyle = dark ? 'rgba(57,255,156,.14)' : 'rgba(10,155,88,.18)';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * .6, 0, 7); ctx.stroke();
    sweep += .012;
    const g = ctx.createConicGradient ? null : null;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(sweep);
    const grad = ctx.createLinearGradient(0, 0, R, 0);
    grad.addColorStop(0, dark ? 'rgba(57,255,156,.35)' : 'rgba(10,155,88,.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); ctx.stroke();
    ctx.restore(); ctx.lineWidth = 1;
    if (!reduced) requestAnimationFrame(frame);
  }
  frame();

  /* ---------- boot sequence ---------- */
  const LINES = [
    ['dim', '$ ssh martin@agent-fleet.local'],
    ['', 'establishing uplink…'],
    ['ok',   '[OK] paperclip core online'],
    ['ok',   '[OK] agent fleet: chief / devin / researcher'],
    ['ok',   '[OK] tunnel: *.martin-agent.win reachable'],
    ['warn', '[..] dossier: compiling operator profile'],
    ['', ''],
    ['', 'OPERATOR: Martin Meyer'],
    ['', 'BASE:     Berlin, DE'],
    ['', 'DAY OPS:  data & AI engineering @ DB Systel · Deutsche Bahn'],
    ['', 'MISSION:  ship useful data & AI systems'],
    ['dim', '// scroll for fleet manifest'],
  ];
  const log = document.getElementById('bootlog');
  let li = 0;
  function typeLine() {
    if (li >= LINES.length) { log.insertAdjacentHTML('beforeend', '<span class="cursor">&nbsp;</span>'); return; }
    const [cls, text] = LINES[li++];
    const span = document.createElement('span');
    if (cls) span.className = cls;
    log.appendChild(span);
    let ci = 0;
    (function typeChar() {
      span.textContent = text.slice(0, ++ci);
      if (ci < text.length) setTimeout(typeChar, 12 + Math.random() * 18);
      else { log.appendChild(document.createTextNode('\n')); setTimeout(typeLine, 120); }
    })();
  }
  setTimeout(typeLine, 400);

  /* ---------- scroll reveal + skill bars + nav spy ---------- */
  const revealEls = [];
  document.querySelectorAll('.file-grid, .fleet-grid, .systems-grid, .timeline, .community, .repo-grid, .skills-grid, .offduty-grid, .contact-grid, .section-lede')
    .forEach(el => { el.classList.add('reveal'); revealEls.push(el); });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('.bar-fill').forEach(b => b.classList.add('on'));
    io.unobserve(e.target);
  }), { threshold: .12 });
  revealEls.forEach(el => io.observe(el));

  // safety net: if the observer never delivers (quirky webviews, print),
  // reveal whatever is already in view — content must never stay invisible.
  const revealCheck = () => revealEls.forEach(el => {
    if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * .9) {
      el.classList.add('in');
      el.querySelectorAll('.bar-fill').forEach(b => b.classList.add('on'));
    }
  });
  addEventListener('scroll', revealCheck, { passive: true });
  setTimeout(revealCheck, 120);

  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('section[id]').forEach(s => spy.observe(s));

  /* ---------- UTC clock ---------- */
  const clock = document.getElementById('clock');
  setInterval(() => { clock.textContent = new Date().toISOString().slice(11, 19); }, 1000);

  /* ---------- GitHub repos: live fetch + static fallback ---------- */
  const FALLBACK = [
    { name: 'de-energy-live', desc: 'Real-time German electricity supply & demand — energy-charts, SMARD, MaStR register (~9.7M units).', lang: 'Python', stars: 0, url: 'https://github.com/martinmeyer489/de-energy-live', pushed: '2026-11-01' },
    { name: 'Databricks-Apply-Agent', desc: 'AI job-exploration app on Databricks — LLM-enriched listings, map + grounded chat, Databricks App.', lang: 'Python', stars: 0, url: 'https://github.com/martinmeyer489/Databricks-Apply-Agent', pushed: '2026-09-10' },
    { name: 'ted-agent', desc: 'Chat interface for searching EU tender opportunities (TED) — FastAPI + Agno + Next.js.', lang: 'TypeScript', stars: 0, url: 'https://github.com/martinmeyer489/ted-agent', pushed: '2026-05-10' },
    { name: 'Vehicle_detection_tracking_YOLO', desc: 'Real-time vehicle detection & tracking — custom YOLOv4-tiny, centroid tracking, 25 FPS.', lang: 'Python', stars: 2, url: 'https://github.com/martinmeyer489/Vehicle_detection_tracking_YOLO', pushed: '2022-03-03' },
    { name: 'IDACasestudy', desc: 'Data analysis & visualization with R — logistics delays, interactive Shiny app.', lang: 'R', stars: 0, url: 'https://github.com/martinmeyer489/IDACasestudy', pushed: '2022-02-28' },
  ];

  const grid = document.getElementById('repoGrid');
  const srcNote = document.getElementById('repoSource');

  function renderRepos(repos) {
    grid.innerHTML = repos.map(r => `
      <a class="repo-card" href="${r.url}" target="_blank" rel="noopener">
        <span class="repo-name">${r.name}</span>
        <span class="repo-desc">${r.desc || '// no description'}</span>
        <span class="repo-meta">
          ${r.lang ? `<span class="repo-lang">${r.lang}</span>` : ''}
          ${r.stars ? `<span>★ ${r.stars}</span>` : ''}
          <span>push ${r.pushed}</span>
        </span>
      </a>`).join('');
    grid.classList.add('in');
  }

  (async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch('https://api.github.com/users/martinmeyer489/repos?per_page=100&sort=pushed', { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const repos = data.filter(r => !r.fork).map(r => ({
        name: r.name,
        desc: r.description,
        lang: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        pushed: (r.pushed_at || '').slice(0, 10),
      }));
      if (!repos.length) throw new Error('empty');
      renderRepos(repos);
      srcNote.textContent = `live feed · api.github.com · ${repos.length} public repos · ${new Date().toISOString().slice(0, 10)}`;
    } catch {
      renderRepos(FALLBACK);
      srcNote.textContent = '// github api unreachable — showing cached manifest';
    }
  })();

  /* ---------- playable pong easter egg ---------- */
  const pongTable = document.getElementById('pongTable');
  const pongScore = document.getElementById('pongScore');
  let pongOn = false;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function startPong() {
    if (pongOn) return;
    pongOn = true;
    pongTable.classList.add('playing');
    pongTable.innerHTML = '';
    const pcv = document.createElement('canvas');
    pcv.className = 'pong-cv';
    pongTable.appendChild(pcv);
    const pctx = pcv.getContext('2d');
    const PW = pcv.width = pongTable.clientWidth;
    const PH = pcv.height = pongTable.clientHeight;
    const PAD_W = 7, PAD_H = 48, WIN = 5;
    let py = PH / 2, ay = PH / 2;
    let bx = PW / 2, by = PH / 2, speed = 4.4;
    let vx = speed * (Math.random() < .5 ? -1 : 1), vy = (Math.random() * 4 - 2);
    let pScore = 0, aScore = 0, over = false, raf = 0;
    const keys = {};

    function serve(dir) {
      bx = PW / 2; by = PH / 2;
      vx = speed * dir; vy = (Math.random() * 4 - 2);
    }
    function end(msg) {
      over = true;
      pongScore.textContent = msg + ' — click the table for a rematch';
    }
    function reset() {
      pScore = 0; aScore = 0; over = false; serve(Math.random() < .5 ? -1 : 1);
      pongScore.textContent = 'FIRST TO ' + WIN + ' — you are LEFT paddle';
    }

    function step() {
      if (!over) {
        if (keys.ArrowUp || keys.KeyW) py -= 6;
        if (keys.ArrowDown || keys.KeyS) py += 6;
        py = Math.max(PAD_H / 2, Math.min(PH - PAD_H / 2, py));
        // CPU: imperfect tracking
        const target = by + Math.sin(Date.now() * .01) * 10;
        ay += Math.sign(target - ay) * Math.min(3.4, Math.abs(target - ay));
        ay = Math.max(PAD_H / 2, Math.min(PH - PAD_H / 2, ay));

        bx += vx; by += vy;
        if (by < 5) { by = 5; vy = -vy; }
        if (by > PH - 5) { by = PH - 5; vy = -vy; }
        // left paddle (player) at x=14
        if (vx < 0 && bx < 14 + PAD_W + 5 && bx > 14 && Math.abs(by - py) < PAD_H / 2 + 5) {
          vx = Math.abs(vx) * 1.06; vy = (by - py) / (PAD_H / 2) * 5;
          bx = 14 + PAD_W + 5;
        }
        // right paddle (cpu) at x=PW-14-PAD_W
        if (vx > 0 && bx > PW - 14 - PAD_W - 5 && bx < PW - 14 && Math.abs(by - ay) < PAD_H / 2 + 5) {
          vx = -Math.abs(vx) * 1.06; vy = (by - ay) / (PAD_H / 2) * 5;
          bx = PW - 14 - PAD_W - 5;
        }
        if (bx < -8) { aScore++; aScore >= WIN ? end('FLEET AI TAKES IT ' + pScore + ':' + aScore) : serve(1); }
        if (bx > PW + 8) { pScore++; pScore >= WIN ? end('YOU WIN ' + pScore + ':' + aScore + ' — clean footwork') : serve(-1); }
        if (!over) pongScore.textContent = 'YOU ' + pScore + ' : ' + aScore + ' FLEET AI';
      }

      pctx.clearRect(0, 0, PW, PH);
      const fg = cssVar('--text') || '#d7e6ee';
      const acc = cssVar('--accent') || '#39ff9c';
      const line = cssVar('--line') || '#1c2f42';
      pctx.strokeStyle = line; pctx.setLineDash([6, 8]);
      pctx.beginPath(); pctx.moveTo(PW / 2, 0); pctx.lineTo(PW / 2, PH); pctx.stroke();
      pctx.setLineDash([]);
      pctx.fillStyle = acc;
      pctx.fillRect(14, py - PAD_H / 2, PAD_W, PAD_H);
      pctx.fillRect(PW - 14 - PAD_W, ay - PAD_H / 2, PAD_W, PAD_H);
      pctx.fillStyle = fg;
      pctx.beginPath(); pctx.arc(bx, by, 5, 0, 7); pctx.fill();
      raf = requestAnimationFrame(step);
    }

    pongTable.addEventListener('mousemove', e => {
      const r = pongTable.getBoundingClientRect();
      py = Math.max(PAD_H / 2, Math.min(PH - PAD_H / 2, e.clientY - r.top));
    });
    pongTable.addEventListener('touchmove', e => {
      const r = pongTable.getBoundingClientRect();
      py = Math.max(PAD_H / 2, Math.min(PH - PAD_H / 2, e.touches[0].clientY - r.top));
      e.preventDefault();
    }, { passive: false });
    addEventListener('keydown', e => {
      keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => { keys[e.code] = false; });
    pongTable.addEventListener('click', () => { if (over) reset(); });

    reset();
    step();
  }

  pongTable.addEventListener('click', startPong);
  pongTable.addEventListener('keydown', e => {
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); startPong(); }
  });

  /* ---------- konami: ↑↑↓↓←→←→BA → table-tennis match ---------- */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
  let kIdx = 0;
  addEventListener('keydown', e => {
    kIdx = e.code === KONAMI[kIdx] ? kIdx + 1 : (e.code === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      document.getElementById('offduty').scrollIntoView({ behavior: 'smooth' });
      setTimeout(startPong, 600);
      // accent party for 6s
      let hue = 0;
      const party = setInterval(() => {
        hue = (hue + 37) % 360;
        root.style.setProperty('--accent', `hsl(${hue} 100% 62%)`);
      }, 90);
      setTimeout(() => { clearInterval(party); root.style.removeProperty('--accent'); }, 6000);
    }
  });
})();
