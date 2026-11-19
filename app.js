// A tiny test runner. The six "this page" tests are real assertions against the live DOM;
// the rest replay the CV as a report. English lives in the HTML, French in data-fr attributes.
(() => {
  const $ = id => document.getElementById(id);
  const body = document.body;
  const main = $('main');
  const hero = $('hero');
  const rows = [...document.querySelectorAll('.row')];
  const summary = $('summary');
  const verdict = $('verdict');
  const fixBtn = $('fix');
  const rerunBtn = $('rerun');
  const langBtn = $('lang');
  const nameEl = $('name');
  const lede = document.querySelector('.lede');
  const contact = $('contact');
  const actions = $('actions');
  const cookie = $('cookie');
  const track = $('track');
  const chaosBtn = $('chaos');
  const favicon = $('favicon');
  const bugButtons = [...document.querySelectorAll('.bug[data-bug]')];
  const motionBtn = $('motion');
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Reduced motion is respected by default; the visitor can opt back in for this page.
  const calm = () => reduced.matches && !root.classList.contains('motion');

  const T = {
    en: {
      title: 'Alexandru Ilie · QA automation tester',
      running: n => `running ${n} tests`,
      failed: n => `${n} failed`, passed: n => `${n} passed`, flaky: n => `${n} flaky`, skipped: n => `${n} skipped`,
      ok: 'Every claim on this page is a test, and right now they all pass.',
      broken: n => `Something is broken, and ${n === 1 ? 'a test' : `${n} tests`} caught it. That is the job.`,
      expected: 'Expected', received: 'Received',
      inside: 'button inside its container', outside: px => `button ${px}px outside its container`,
      uncovered: 'nothing on top of the button', covered: p => `a cookie banner covering ${p}% of the button`,
      rowsMoved: n => `${n} rows transformed`,
      ratioMin: 'at least 4.5:1', ratio: r => `${r}:1`,
      upright: 'no rotation', flipped: 'rotated 180°',
      band: { passed: 'PASSED', failed: 'FAILED', running: 'RUNNING' },
      switchLabel: 'FR, passer en français', switchText: 'FR', switchLang: 'fr',
    },
    fr: {
      title: 'Alexandru Ilie · Testeur QA automatisation',
      running: n => `${n} tests en cours`,
      failed: n => `${n} échoué${n > 1 ? 's' : ''}`, passed: n => `${n} réussi${n > 1 ? 's' : ''}`, flaky: n => `${n} instable${n > 1 ? 's' : ''}`, skipped: n => `${n} ignoré${n > 1 ? 's' : ''}`,
      ok: 'Chaque affirmation de cette page est un test, et pour l\'instant tous passent.',
      broken: n => `Quelque chose est cassé, et ${n === 1 ? 'un test' : `${n} tests`} l'${n === 1 ? 'a' : 'ont'} détecté. C'est le métier.`,
      expected: 'Attendu', received: 'Reçu',
      inside: 'bouton dans son conteneur', outside: px => `bouton à ${px}px hors de son conteneur`,
      uncovered: 'rien au-dessus du bouton', covered: p => `un bandeau cookies qui couvre ${p} % du bouton`,
      rowsMoved: n => `${n} ligne${n > 1 ? 's' : ''} transformée${n > 1 ? 's' : ''}`,
      ratioMin: 'au moins 4,5:1', ratio: r => `${String(r).replace('.', ',')}:1`,
      upright: 'aucune rotation', flipped: 'rotation de 180°',
      band: { passed: 'RÉUSSI', failed: 'ÉCHEC', running: 'EN COURS' },
      switchLabel: 'EN, switch to English', switchText: 'EN', switchLang: 'en',
    },
  };

  let lang = 'en';
  const t = () => T[lang];

  // WCAG relative luminance and contrast ratio
  const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const [hi, lo] = [lum(rgb(a)), lum(rgb(b))].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

  const checks = {
    name() {
      const expected = nameEl.dataset.expected;
      const received = nameEl.textContent.trim();
      return { ok: received === expected, expected: `"${expected}"`, received: `"${received}"` };
    },
    contact() {
      const b = contact.getBoundingClientRect();
      const c = actions.getBoundingClientRect();
      const out = Math.round(Math.max(c.left - b.left, b.right - c.right, c.top - b.top, b.bottom - c.bottom, 0));
      return { ok: out <= 1, expected: t().inside, received: t().outside(out) };
    },
    cover() {
      // Layout boxes, so a button that has wandered off still counts as covered where it belongs.
      const box = el => ({ left: el.offsetLeft, top: el.offsetTop, right: el.offsetLeft + el.offsetWidth, bottom: el.offsetTop + el.offsetHeight, width: el.offsetWidth, height: el.offsetHeight });
      const b = box(contact);
      let worst = 0;
      hero.querySelectorAll('*').forEach(el => {
        if (el === contact || contact.contains(el) || el.offsetParent !== contact.offsetParent) return;
        const cs = getComputedStyle(el);
        if ((cs.position !== 'absolute' && cs.position !== 'fixed') || cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = box(el);
        const w = Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left));
        const h = Math.max(0, Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top));
        worst = Math.max(worst, (w * h) / (b.width * b.height));
      });
      const pct = Math.round(worst * 100);
      return { ok: pct === 0, expected: t().uncovered, received: t().covered(pct) };
    },
    layout() {
      const moved = rows.filter(r => getComputedStyle(r).transform !== 'none').length;
      return { ok: moved === 0, expected: t().rowsMoved(0), received: t().rowsMoved(moved) };
    },
    contrast() {
      const ratio = contrast(getComputedStyle(lede).color, getComputedStyle(body).backgroundColor);
      return { ok: ratio >= 4.5, expected: t().ratioMin, received: t().ratio(ratio.toFixed(1)) };
    },
    upright() {
      const flipped = getComputedStyle(main).transform !== 'none';
      return { ok: !flipped, expected: t().upright, received: t().flipped };
    },
  };

  // Status drives the page colour, the ticker, the favicon and the tab title.
  const ICON = {
    passed: ['#0d5c3a', 'M8 17l5.5 5.5L24 10'],
    failed: ['#9a1d18', 'M10 10l12 12M22 10L10 22'],
    running: ['#6b5200', 'M16 8v8l5 3'],
  };
  let bandWord = '';

  function setStatus(status, failed = 0) {
    body.dataset.status = status;
    const [color, path] = ICON[status];
    document.querySelector('meta[name="theme-color"]').content = color;
    favicon.href = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${color}'/><path d='${path}' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/></svg>`);
    document.title = (failed ? `(${t().failed(failed)}) ` : '') + t().title;
    const word = t().band[status];
    if (word !== bandWord) {
      bandWord = word;
      track.innerHTML = `<span>${word}<i></i></span>`.repeat(12);
    }
  }

  let runId = 0;
  let busy = false;
  let lastSettled = 'passed';

  function finish(row, keepOpen) {
    const diff = row.querySelector('.diff');
    const dur = row.querySelector('.dur');
    const check = checks[row.dataset.check];
    if (!check) { row.dataset.state = row.dataset.final; return; }
    const t0 = performance.now();
    // Measure the settled layout, not a frame halfway through a transition.
    body.classList.add('measuring');
    const result = check();
    body.classList.remove('measuring');
    dur.textContent = `${Math.max(1, Math.round(performance.now() - t0))} ms`;
    if (result.ok) {
      row.dataset.state = 'pass';
      diff.hidden = true;
      if (!keepOpen) row.open = false;
    } else {
      row.dataset.state = 'fail';
      diff.textContent = `${t().expected}: ${result.expected}\n${t().received}: ${result.received}`;
      diff.hidden = false;
      row.open = true;
    }
  }

  function report(fresh) {
    const count = s => rows.filter(r => r.dataset.state === s).length;
    const failed = count('fail');
    const parts = [];
    if (failed) parts.push(t().failed(failed));
    parts.push(t().passed(count('pass')), t().flaky(count('flaky')), t().skipped(count('skip')));
    summary.textContent = parts.join(' · ');
    setStatus(failed ? 'failed' : 'passed', failed);
    fixBtn.hidden = !failed;
    verdict.textContent = failed ? t().broken(failed) : t().ok;
    if (!fresh) return;
    if (failed) {
      if (!calm()) {
        body.classList.remove('shake');
        void body.offsetWidth;
        body.classList.add('shake');
      }
      rows.find(r => r.dataset.state === 'fail').scrollIntoView({ block: 'center', behavior: calm() ? 'auto' : 'smooth' });
    } else if (lastSettled === 'failed') {
      celebrate();
    }
    lastSettled = failed ? 'failed' : 'passed';
  }

  function run() {
    const id = ++runId;
    // Let transitions from an injected bug settle before measuring.
    const settle = calm() ? 0 : 680;
    const step = calm() ? 0 : 50;
    busy = true;
    setStatus('running');
    summary.textContent = t().running(rows.length);
    rows.forEach(r => { r.dataset.state = 'pending'; });
    rows.forEach((row, i) => {
      setTimeout(() => {
        if (id !== runId) return;
        finish(row);
        if (i === rows.length - 1) { busy = false; report(true); }
      }, settle + i * step);
    });
  }

  // A burst of ticks when a broken build goes green again.
  function celebrate() {
    if (calm()) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    body.append(canvas);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = canvas.width = innerWidth * dpr;
    const H = canvas.height = innerHeight * dpr;
    const ctx = canvas.getContext('2d');
    const colors = ['#f2f8f0', '#9cf2b6', '#ffd866', '#c2dfcb'];
    const bits = Array.from({ length: 150 }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const speed = (9 + Math.random() * 15) * dpr;
      return {
        x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.38,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        spin: (Math.random() - 0.5) * 0.4, rot: Math.random() * 6.28,
        size: (9 + Math.random() * 13) * dpr, color: colors[i % colors.length], tick: i % 3 === 0,
      };
    });
    const start = performance.now();
    const life = 2600;
    (function frame(now) {
      const age = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - life * 0.6) / (life * 0.4));
      bits.forEach(p => {
        p.vy += 0.45 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.tick) {
          ctx.strokeStyle = p.color; ctx.lineWidth = p.size * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.5, 0); ctx.lineTo(-p.size * 0.15, p.size * 0.35); ctx.lineTo(p.size * 0.55, -p.size * 0.4);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.4, -p.size * 0.18, p.size * 0.8, p.size * 0.36);
        }
        ctx.restore();
      });
      if (age < life) requestAnimationFrame(frame); else canvas.remove();
    })(start);
  }

  // Language
  const translatable = [...document.querySelectorAll('[data-fr]')];
  translatable.forEach(el => { el.dataset.en = el.innerHTML; });

  function setLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    translatable.forEach(el => { el.innerHTML = el.dataset[lang]; });
    langBtn.textContent = t().switchText;
    langBtn.setAttribute('aria-label', t().switchLabel);
    langBtn.lang = t().switchLang;
    try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
    if (busy) { setStatus('running'); summary.textContent = t().running(rows.length); }
    else { rows.forEach(r => finish(r, true)); report(false); }
  }

  langBtn.addEventListener('click', () => setLang(lang === 'en' ? 'fr' : 'en'));

  // Motion opt-in, offered only to visitors whose system asks for reduced motion.
  function setMotion(on) {
    root.classList.toggle('motion', on);
    motionBtn.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('motion', on ? '1' : '0'); } catch (e) { /* private mode */ }
  }
  if (reduced.matches) {
    motionBtn.hidden = false;
    let wanted = null;
    try { wanted = localStorage.getItem('motion'); } catch (e) { /* private mode */ }
    setMotion(wanted === '1');
    motionBtn.addEventListener('click', () => { setMotion(!root.classList.contains('motion')); run(); });
  }

  // Bugs
  const dodge = () => {
    contact.style.setProperty('--rx', `${30 + Math.random() * 40}vw`);
    contact.style.setProperty('--ry', `${-8 + Math.random() * 10}rem`);
  };
  const toggleClass = name => ({
    on() { body.classList.add(name); },
    off() { body.classList.remove(name); },
  });

  const bugs = {
    typo: {
      on() { nameEl.textContent = 'Alexandru Ille'; },
      off() { nameEl.textContent = nameEl.dataset.expected; },
    },
    runaway: {
      on() { body.classList.add('bug-runaway'); contact.addEventListener('pointerenter', dodge); },
      off() { body.classList.remove('bug-runaway'); contact.removeEventListener('pointerenter', dodge); contact.style.removeProperty('--rx'); contact.style.removeProperty('--ry'); },
    },
    cookie: {
      on() { cookie.hidden = false; },
      off() { cookie.hidden = true; },
    },
    layout: toggleClass('bug-layout'),
    contrast: toggleClass('bug-contrast'),
    flip: toggleClass('bug-flip'),
  };
  const active = name => bugButtons.find(b => b.dataset.bug === name).getAttribute('aria-pressed') === 'true';

  function setBug(name, on) {
    if (active(name) !== on) bugs[name][on ? 'on' : 'off']();
    bugButtons.find(b => b.dataset.bug === name).setAttribute('aria-pressed', String(on));
    chaosBtn.setAttribute('aria-pressed', String(Object.keys(bugs).every(active)));
  }
  const setAll = on => Object.keys(bugs).forEach(name => setBug(name, on));

  bugButtons.forEach(btn => btn.addEventListener('click', () => {
    setBug(btn.dataset.bug, !active(btn.dataset.bug));
    run();
  }));

  chaosBtn.addEventListener('click', () => {
    setAll(chaosBtn.getAttribute('aria-pressed') !== 'true');
    run();
  });

  function fix() {
    setAll(false);
    run();
    scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
  }
  fixBtn.addEventListener('click', fix);
  rerunBtn.addEventListener('click', run);

  // The banner behaves like the real thing: "Accept" does nothing useful, "Reject" is small.
  $('cookie-accept').addEventListener('click', () => {
    cookie.classList.remove('wiggle');
    void cookie.offsetWidth;
    cookie.classList.add('wiggle');
  });
  $('cookie-reject').addEventListener('click', () => { setBug('cookie', false); run(); });

  // Keyboard: B breaks something, F fixes, R reruns, L switches language.
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const key = e.key.toLowerCase();
    if (key === 'b') {
      const idle = Object.keys(bugs).filter(name => !active(name));
      if (!idle.length) return;
      setBug(idle[Math.floor(Math.random() * idle.length)], true);
      run();
    } else if (key === 'f') { if (Object.keys(bugs).some(active)) fix(); }
    else if (key === 'r') run();
    else if (key === 'l') langBtn.click();
  });

  console.log('%cYou opened DevTools. Of course you did.', 'font: 700 16px sans-serif; color: #0d5c3a');
  console.log('The runner is ~300 lines in app.js with no dependencies. If you find a real bug, I would like to hear about it: alexandru.ilie.eu@gmail.com');

  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) { /* private mode */ }
  const initial = saved || ((navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en');
  busy = true;
  if (initial !== 'en') setLang(initial);
  run();
})();
