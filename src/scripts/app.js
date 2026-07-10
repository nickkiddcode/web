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
