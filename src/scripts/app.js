// Site motion layer — Lenis smooth scroll + simple scroll reveals (fade in, rise).
// Reveals use IntersectionObserver and fire exactly once per element, so nothing
// re-hides or replays while scrolling back (no rubber-band feel).
import Lenis from 'lenis';
import { gsap } from 'gsap';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- smooth scroll ----------
if (!reducedMotion) {
  const lenis = new Lenis();
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
  // keep the scroll limit in sync if late-loading media grows the page
  new ResizeObserver(() => lenis.resize()).observe(document.body);
}

// ---------- lazy background video ----------
for (const video of document.querySelectorAll('video[data-lazy-video]')) {
  if (reducedMotion) continue; // poster only
  const attach = () => {
    for (const s of video.querySelectorAll('source[data-src]')) {
      s.src = s.dataset.src;
      s.removeAttribute('data-src');
    }
    video.load();
    video.play().catch(() => {});
  };
  if ('requestIdleCallback' in window) requestIdleCallback(attach, { timeout: 2500 });
  else setTimeout(attach, 1500);
}

// ---------- Spline hero scene (carried over, lazy) ----------
async function loadSpline() {
  const scenes = [...document.querySelectorAll('[data-spline-url]')].filter(
    (el) => el.offsetParent !== null // only the visible responsive variant
  );
  if (!scenes.length) return;
  try {
    const { Application } = await import(
      /* @vite-ignore */ 'https://unpkg.com/@splinetool/runtime@1.9.28/build/runtime.js'
    );
    for (const el of scenes) {
      const canvas = el.querySelector('canvas');
      if (!canvas) continue;
      new Application(canvas).load(el.dataset.splineUrl);
    }
  } catch (e) {
    console.warn('Spline scene failed to load', e);
  }
}
if (!reducedMotion) {
  if ('requestIdleCallback' in window) requestIdleCallback(loadSpline, { timeout: 4000 });
  else setTimeout(loadSpline, 2000);
}

// ---------- hero entrance (after the loader clears at ~2s on first paint) ----------
const heroDelay = document.querySelector('.loader') && !reducedMotion ? 2.1 : 0;
if (!reducedMotion) {
  gsap.from('[data-hero-rise]', {
    opacity: 0,
    y: 25,
    duration: 0.9,
    ease: 'power2.out',
    stagger: 0.12,
    delay: heroDelay,
  });
  gsap.from('[data-hero-fade]', {
    opacity: 0,
    duration: 0.9,
    ease: 'power1.out',
    stagger: 0.1,
    delay: heroDelay + 0.25,
  });
  gsap.from('[data-hero-scale]', {
    opacity: 0,
    scale: 0.9,
    duration: 1.1,
    ease: 'power2.out',
    delay: heroDelay,
  });
}

// ---------- scroll reveals: fade in + rise, once ----------
if (!reducedMotion) {
  const targets = document.querySelectorAll('[data-reveal], [data-feature-reveal]');
  gsap.set(targets, { opacity: 0, y: 24 });
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', overwrite: true });
      }
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  for (const el of targets) io.observe(el);
}

// ---------- marquees: seamless infinite drift (text duplicated in markup) ----------
if (!reducedMotion) {
  for (const m of document.querySelectorAll('[data-marquee]')) {
    gsap.to(m, { xPercent: -50, repeat: -1, ease: 'none', duration: 30 });
  }
}

// ---------- project cards: hover reveal of summary + view-project line ----------
if (!reducedMotion) {
  for (const card of document.querySelectorAll('[data-project-card]')) {
    const reveals = card.querySelectorAll('[data-card-reveal]');
    const line = card.querySelector('[data-card-line]');
    const overlay = card.querySelector('[data-card-overlay]');
    gsap.set(reveals, { opacity: 0, height: 0 });
    gsap.set(line, { width: '0%' });
    gsap.set(overlay, { opacity: 0 });
    const tl = gsap
      .timeline({ paused: true })
      .to(overlay, { opacity: 1, duration: 0.25 }, 0)
      .to(reveals, { opacity: 1, height: 'auto', duration: 0.35, ease: 'power2.out' }, 0)
      .to(line, { width: '100%', duration: 0.45, ease: 'power2.out' }, 0.1);
    card.addEventListener('mouseenter', () => tl.play());
    card.addEventListener('mouseleave', () => tl.reverse());
  }
}

// ---------- bento micro-interactions (behaviors recovered from Webflow IX2 data) ----------
// User-initiated (click/hover) — active under reduced motion too; the automatic
// billboard loop and scroll parallax are individually motion-guarded below.
{
  // statusblocks: hover flips the label (statusstart <-> statuscomplete)
  for (const block of document.querySelectorAll('[data-status]')) {
    const start = block.querySelector('.statusstart');
    const done = block.querySelector('.statuscomplete');
    if (!start || !done) continue;
    done.style.display = 'none';
    const flip = (showDone) => {
      start.style.display = showDone ? 'none' : 'block';
      done.style.display = showDone ? 'block' : 'none';
    };
    block.addEventListener('mouseenter', () => flip(true));
    block.addEventListener('mouseleave', () => block.closest('.builder_feature-2_ui-left')?.dataset.kidd !== 'on' && flip(false));
  }

  // "See The Kidd Effect": every status flips to its complete state and goes green (IX2 a-60)
  const kiddBtn = document.querySelector('[data-kidd-effect]');
  const runKidd = () => {
    const wrap = kiddBtn.closest('.builder_feature-2_ui-left');
    if (wrap) wrap.dataset.kidd = 'on';
    for (const block of document.querySelectorAll('[data-status]')) {
      block.querySelector('.statusstart').style.display = 'none';
      block.querySelector('.statuscomplete').style.display = 'block';
      gsap.to(block, { backgroundColor: 'rgb(104,255,134)', duration: 0.2 });
    }
  };
  kiddBtn?.addEventListener('click', runKidd);
  kiddBtn?.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && runKidd());

  // science card: each plus click pops the next fact in (IX2 a-46/a-38/a-49, outBack scale)
  const facts = [...document.querySelectorAll('[data-science-fact]')];
  gsap.set(facts, { display: 'none', opacity: 0, scale: 0.9 });
  let revealed = 0;
  const plusButtons = [...document.querySelectorAll('[data-science-plus]')];
  if (plusButtons[1]) plusButtons[1].style.display = 'none';
  const addScience = () => {
    if (revealed >= 3) return;
    const batch = revealed === 2 ? facts.slice(2) : [facts[revealed]]; // click 3 reveals both _4 facts
    gsap.set(batch, { display: 'flex' });
    gsap.to(batch, { opacity: 1, duration: 0.3, ease: 'power1.out' });
    gsap.to(batch, { scale: 1, duration: 0.3, ease: 'back.out(1.7)' });
    revealed++;
    if (revealed === 2 && plusButtons[1]) {
      // IX2 a-38 swaps which plus button shows for the final click
      plusButtons[0].style.display = 'none';
      plusButtons[1].style.display = 'flex';
    }
    if (revealed >= 3) for (const b of plusButtons) b.style.display = 'none';
  };
  for (const b of plusButtons) {
    b.addEventListener('click', addScience);
    b.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && addScience());
  }

  // KERNING: the .wrong letters sit +3px; "Fix it!" slides them into place (IX2 a-62)
  const kernBtn = document.querySelector('[data-kerning-fix]');
  const fixKerning = () => gsap.to('.text-block-8.wrong', { x: -3, duration: 0.5, ease: 'power2.out' });
  kernBtn?.addEventListener('click', fixKerning);
  kernBtn?.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && fixKerning());

  // Marketing Maestro billboards: auto slideshow — stack up one per second, then reset (IX2 a-63)
  const stack = document.querySelector('[data-billboards]');
  if (stack) {
    const layers = [...stack.querySelectorAll('.image-12')];
    for (const l of layers.slice(1)) l.style.display = 'none';
    let step = 0;
    let timer;
    const tick = () => {
      step++;
      if (step < layers.length) layers[step].style.display = 'block';
      else if (step === layers.length) {
        for (const l of layers.slice(1, -1)) l.style.display = 'none';
      } else {
        layers[layers.length - 1].style.display = 'none';
        step = 0;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer && !reducedMotion) timer = setInterval(tick, 1000);
      else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
    });
    io.observe(stack);
  }

  // Midnight Oil switch: knob slides 3.9rem + spins 360°, card goes dark (IX2 a-64/a-65)
  const toggle = document.querySelector('[data-mode-toggle]');
  if (toggle) {
    const knob = toggle.querySelector('.switch-button');
    const card = toggle.closest('.builder_feature-card');
    const sun = toggle.querySelectorAll('[data-sun]');
    const moon = toggle.querySelector('[data-moon]');
    let on = false;
    const flip = () => {
      on = !on;
      toggle.setAttribute('aria-checked', String(on));
      gsap.to(knob, { x: on ? '3.9rem' : 0, rotation: on ? 360 : 0, duration: 0.5, ease: 'power1.inOut' });
      gsap.to(card, { backgroundColor: on ? '#1c1c1d' : '#e7e7e7', duration: 0.5 });
      gsap.to(card.querySelectorAll('.oil'), { color: on ? '#f2f0ef' : '#161616', duration: 0.5 });
      gsap.to(toggle, { borderColor: on ? '#f2f0ef' : '#141414', duration: 0.5 });
      gsap.to(sun, { opacity: on ? 0 : 1, duration: 0.3 });
      gsap.to(moon, { opacity: on ? 1 : 0, duration: 0.3 });
    };
    toggle.addEventListener('click', flip);
    toggle.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), flip()));
  }

  // kanban wireframes: gentle scroll parallax (IX2 a-42, ±3rem)
  if (!reducedMotion && window.__lenis) {
    const frames = [...document.querySelectorAll('[data-wireframe]')];
    if (frames.length) {
      window.__lenis.on('scroll', () => {
        const vh = innerHeight;
        for (const f of frames) {
          const r = f.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) continue;
          const progress = 1 - (r.top + r.height / 2) / vh; // 0 entering → 1 leaving
          const dir = +f.dataset.wireframe;
          f.style.transform = `translateY(${(progress - 0.5) * 2 * 3 * dir}rem)`;
        }
      });
    }
  }
}

// ---------- custom "view case" cursor ----------
const cursor = document.querySelector('.cursor');
if (cursor && !reducedMotion && matchMedia('(pointer: fine)').matches) {
  gsap.set(cursor, { scale: 0, xPercent: -50, yPercent: -50 });
  const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('mousemove', (e) => {
    x(e.clientX);
    y(e.clientY);
  });
  const targets = document.querySelectorAll('[data-project-card] .link-block, .link-block-2');
  for (const t of targets) {
    t.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 1, duration: 0.25 }));
    t.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 0, duration: 0.25 }));
  }
}

// ---------- nav hover underline ----------
if (!reducedMotion) {
  for (const btn of document.querySelectorAll('.nav-button')) {
    const line = btn.querySelector('.button-line');
    if (!line) continue;
    gsap.set(line, { width: '0%' });
    btn.addEventListener('mouseenter', () => gsap.to(line, { width: '100%', duration: 0.3, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(line, { width: '0%', duration: 0.3, ease: 'power2.in' }));
  }
}
