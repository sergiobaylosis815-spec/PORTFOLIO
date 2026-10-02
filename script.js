/* ============================================================
   SERGIO C. BAYLOSIS — PORTFOLIO INTERACTIONS
   Vanilla JS. Every effect respects prefers-reduced-motion.
   ============================================================ */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverMQ = matchMedia('(hover: hover) and (pointer: fine)');

  let animTimer;
  /* Fades colors while the palette changes (theme toggle or robot alert). */
  function palettePulse() {
    if (reduceMQ.matches) return;
    root.classList.add('theme-anim');
    clearTimeout(animTimer);
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), 600);
  }
  const announcePalette = () => document.dispatchEvent(new Event('palettechange'));

  /* ---------- Theme toggle ---------- */
  function initTheme() {
    const toggle = $('#themeToggle');
    const meta = $('meta[name="theme-color"]');
    if (!toggle) return;

    function apply(theme, persist) {
      root.setAttribute('data-theme', theme);
      toggle.setAttribute('aria-checked', String(theme === 'light'));
      if (meta) meta.setAttribute('content', theme === 'light' ? '#eef3f7' : '#05070a');
      if (persist) {
        try { localStorage.setItem('theme', theme); } catch (e) { /* storage blocked */ }
      }
    }

    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);

    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      palettePulse();
      apply(next, true);
      announcePalette();
      if (!reduceMQ.matches) {
        const r = toggle.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'theme-ripple';
        ripple.style.left = `${r.left + r.width / 2}px`;
        ripple.style.top = `${r.top + r.height / 2}px`;
        ripple.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      }
    });
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    const menu = $('#navMenu');
    const burger = $('#hamburger');
    const indicator = $('#navIndicator');
    const links = $$('.nav-links a');

    function setMenu(open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    const isOpen = () => menu.classList.contains('open');

    burger.addEventListener('click', () => setMenu(!isOpen()));
    links.forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) { setMenu(false); burger.focus(); }
    });
    document.addEventListener('click', e => {
      if (isOpen() && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    matchMedia('(min-width: 821px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

    /* Active-section indicator */
    let current = 'home';
    function moveIndicator() {
      const active = links.find(a => a.dataset.section === current);
      links.forEach(a => {
        const on = a === active;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      if (!active || !indicator) { if (indicator) indicator.style.opacity = '0'; return; }
      indicator.style.opacity = '1';
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    }

    const sections = ['home', 'about', 'achievements', 'projects', 'contact']
      .map(id => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { current = en.target.id; moveIndicator(); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));

    window.addEventListener('resize', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

    /* Placeholder links (href="#") shouldn't jump to the top */
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href="#"]');
      if (a) e.preventDefault();
    });
  }

  /* ---------- Terminal boot sequence ---------- */
  function initBoot() {
    const term = $('#bootTerminal');
    if (!term) return;
    const lines = [
      'booting profile.exe ...',
      'loading identity: Sergio C. Baylosis',
      'role: back-end developer [learning]',
      'status: online'
    ];
    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    function makeRow(i) {
      const row = document.createElement('div');
      const prompt = document.createElement('span');
      prompt.className = i === lines.length - 1 ? 'prompt ok' : 'prompt';
      prompt.textContent = '> ';
      const text = document.createElement('span');
      row.append(prompt, text, cursor);
      term.appendChild(row);
      return text;
    }

    if (reduceMQ.matches) {
      lines.forEach((l, i) => { makeRow(i).textContent = l; });
      return;
    }

    let li = 0;
    function nextLine() {
      if (li >= lines.length) return;
      const target = makeRow(li);
      const text = lines[li];
      let i = 0;
      (function tick() {
        if (i < text.length) { target.textContent = text.slice(0, ++i); setTimeout(tick, 22); }
        else { li++; setTimeout(nextLine, 220); }
      })();
    }
    setTimeout(nextLine, 250);
  }

  /* ---------- Robot: eyes, parallax, alert mode ---------- */
  function initRobot() {
    const svg = $('#robotFace');
    const pupils = $('#pupils');
    const stage = $('#robotStage');
    const wrap = $('.robot-wrap');
    if (!svg || !pupils) return;

    let px = 0, py = 0, queued = false;

    function update() {
      queued = false;
      const r = svg.getBoundingClientRect();
      const relX = px - (r.left + r.width / 2);
      const relY = py - (r.top + r.height / 2);
      const angle = Math.atan2(relY, relX);
      const dist = Math.min(8, Math.hypot(relX, relY) / 18);
      pupils.setAttribute('transform',
        `translate(${(Math.cos(angle) * dist).toFixed(2)} ${(Math.sin(angle) * dist).toFixed(2)})`);
      if (stage && !reduceMQ.matches) {
        stage.style.setProperty('--px', (px / innerWidth - .5).toFixed(3));
        stage.style.setProperty('--py', (py / innerHeight - .5).toFixed(3));
      }
    }

    window.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });

    root.addEventListener('mouseleave', () => {
      pupils.setAttribute('transform', 'translate(0 0)');
      if (stage) { stage.style.setProperty('--px', 0); stage.style.setProperty('--py', 0); }
    });

    /* Hovering (or tapping, on touch) the robot shifts the page into "alert mode" */
    function setAlert(on) {
      if (document.body.classList.contains('robot-active') === on) return;
      palettePulse();
      document.body.classList.toggle('robot-active', on);
      announcePalette();
    }
    if (wrap) {
      wrap.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') setAlert(true); });
      wrap.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') setAlert(false); });
      wrap.addEventListener('click', () => {
        if (!hoverMQ.matches) setAlert(!document.body.classList.contains('robot-active'));
      });
    }
  }

  /* ---------- Hero particle network ---------- */
  function initParticles() {
    const canvas = $('#heroCanvas');
    const hero = $('#home');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');

    const LINK = 120, LINK2 = LINK * LINK;
    const MLINK = 160, MLINK2 = MLINK * MLINK;
    let w = 0, h = 0, pts = [], raf = 0, inView = true;
    let rgb = '45, 212, 238';
    const mouse = { x: 0, y: 0, active: false };

    function readColor() {
      const v = getComputedStyle(document.body).getPropertyValue('--accent-rgb').trim();
      if (v) rgb = v;
      if (!raf) draw();
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.max(18, Math.min(60, Math.round(w * h / 20000)));
      pts.length = Math.min(pts.length, target);
      while (pts.length < target) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 });
      }
      pts.forEach(p => { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
      draw();
    }

    function step() {
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx.strokeStyle = `rgba(${rgb}, ${(.12 * (1 - Math.sqrt(d2) / LINK)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MLINK2) {
            ctx.strokeStyle = `rgba(${rgb}, ${(.28 * (1 - Math.sqrt(d2) / MLINK)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${rgb}, .55)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop() { step(); draw(); raf = requestAnimationFrame(loop); }
    function sync() {
      const run = inView && !document.hidden && !reduceMQ.matches;
      if (run && !raf) raf = requestAnimationFrame(loop);
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.active = false; });

    new IntersectionObserver(([en]) => { inView = en.isIntersecting; sync(); }).observe(hero);
    document.addEventListener('visibilitychange', sync);
    reduceMQ.addEventListener('change', () => { sync(); draw(); });
    document.addEventListener('palettechange', readColor);

    let resizeTimer;
    new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); }).observe(hero);

    readColor();
    resize();
    sync();
  }

  /* ---------- Scroll reveal + staggering ---------- */
  function initReveal() {
    $$('[data-stagger]').forEach(group => {
      $$(':scope > .reveal', group).forEach((el, i) => el.style.setProperty('--d', `${i * 90}ms`));
    });
    const items = $$('.reveal');
    const show = el => {
      el.classList.add('in');
      setTimeout(() => el.classList.add('done'), 1000);
    };
    if (reduceMQ.matches || !('IntersectionObserver' in window)) { items.forEach(show); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Skill bars ---------- */
  function initSkills() {
    const rows = $$('.skill-row');
    const animate = reduceMQ.matches ? false : true;

    rows.forEach(row => {
      const pct = $('.skill-pct', row);
      if (animate && pct) pct.textContent = '0%';
    });

    const run = row => {
      const fill = $('.skill-fill', row);
      const pct = $('.skill-pct', row);
      const target = Number(pct?.dataset.value || 0);
      if (fill) fill.classList.add('on');
      if (!pct) return;
      if (!animate) { pct.textContent = `${target}%`; return; }
      const start = performance.now(), dur = 1100;
      (function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        pct.textContent = `${Math.round(target * (1 - Math.pow(1 - t, 3)))}%`;
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    };

    if (!('IntersectionObserver' in window)) { rows.forEach(run); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: .5 });
    rows.forEach((r, i) => { const f = $('.skill-fill', r); if (f) f.style.transitionDelay = `${i * 60}ms`; io.observe(r); });
  }

  /* ---------- Cursor tilt (cards + profile photo) ---------- */
  function tilt(el, { max, scale = 1, lift = 0 }) {
    let raf = 0;
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform =
          `perspective(800px) rotateX(${((y / r.height) - .5) * -max}deg) rotateY(${((x / r.width) - .5) * max}deg) translateY(${-lift}px) scale(${scale})`;
        el.style.setProperty('--mx', `${x}px`);
        el.style.setProperty('--my', `${y}px`);
      });
    });
    el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.style.transform = ''; });
  }

  function initTilt() {
    if (!hoverMQ.matches || reduceMQ.matches) return;
    $$('.project-card').forEach(c => tilt(c, { max: 5, lift: 4 }));
    const photo = $('#profilePhoto');
    if (photo) tilt(photo, { max: 10, scale: 1.04 });
  }

  /* ---------- Image fallbacks ---------- */
  function initImages() {
    $$('img[data-fallback-class]').forEach(img => {
      const swap = () => {
        const box = document.createElement('div');
        box.className = img.dataset.fallbackClass;
        box.setAttribute('role', 'img');
        box.setAttribute('aria-label', img.alt || 'Image unavailable');
        const icon = document.createElement('i');
        icon.className = img.dataset.fallbackIcon || 'fas fa-image';
        icon.setAttribute('aria-hidden', 'true');
        box.appendChild(icon);
        img.replaceWith(box);
      };
      img.addEventListener('error', swap, { once: true });
      if (img.loading !== 'lazy' && img.complete && img.naturalWidth === 0) swap();
    });
  }

  function init() {
    initTheme();
    initNav();
    initBoot();
    initRobot();
    initParticles();
    initReveal();
    initSkills();
    initTilt();
    initImages();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
