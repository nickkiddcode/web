// Site motion layer: Lenis smooth scroll + GSAP/ScrollTrigger.
// Reproduces the feel of the Webflow interactions (rule 5: behavior, not webflow.js).
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- smooth scroll ----------
if (!reducedMotion) {
  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
  // Late-loading media can still grow the page; keep Lenis's scroll limit in sync
  // or the wheel hits an invisible wall at the stale limit.
  let remeasureTimer;
  const remeasure = new ResizeObserver(() => {
    lenis.resize();
    clearTimeout(remeasureTimer);
    remeasureTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
  remeasure.observe(document.body);
}

// ---------- lazy background video ----------
for (const video of document.querySelectorAll('video[data-lazy-video]')) {
  const attach = () => {
    for (const s of video.querySelectorAll('source[data-src]')) {
      s.src = s.dataset.src;
      s.removeAttribute('data-src');
    }
    video.load();
    if (!reducedMotion) video.play().catch(() => {});
  };
  if (reducedMotion) continue; // poster only
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

// ---------- generic scroll reveals ----------
for (const el of document.querySelectorAll('[data-reveal]')) {
  if (reducedMotion) break;
  gsap.from(el, {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
}

// ---------- feature blocks: rise in on scroll ----------
for (const el of document.querySelectorAll('[data-feature-reveal]')) {
  if (reducedMotion) break;
  gsap.from(el, {
    opacity: 0,
    y: 60,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 80%' },
  });
}

// ---------- project cards: hover reveal of summary + view-project line ----------
for (const card of document.querySelectorAll('[data-project-card]')) {
  const reveals = card.querySelectorAll('[data-card-reveal]');
  const line = card.querySelector('[data-card-line]');
  const overlay = card.querySelector('[data-card-overlay]');
  if (reducedMotion) break;
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
for (const btn of document.querySelectorAll('.nav-button')) {
  const line = btn.querySelector('.button-line');
  if (!line || reducedMotion) break;
  gsap.set(line, { width: '0%' });
  btn.addEventListener('mouseenter', () => gsap.to(line, { width: '100%', duration: 0.3, ease: 'power2.out' }));
  btn.addEventListener('mouseleave', () => gsap.to(line, { width: '0%', duration: 0.3, ease: 'power2.in' }));
}
