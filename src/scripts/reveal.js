// The hero fills whatever is left under the nav strip.
const nav = document.querySelector('.header');
if (nav) {
  const setNav = () => document.documentElement.style.setProperty('--nav-h', `${Math.round(nav.getBoundingClientRect().height)}px`);
  setNav();
  new ResizeObserver(setNav).observe(nav);
}

// Blur reveal: anything marked [data-blur] arrives out of focus and settles as it comes into view.
// Siblings in the same row stagger slightly so a grid doesn't snap in all at once.
const targets = [...document.querySelectorAll('[data-blur]')];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!targets.length) {
  /* nothing to do */
} else if (reduce || !('IntersectionObserver' in window)) {
  for (const el of targets) el.classList.add('is-in');
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        // things that land together arrive in order rather than at once
        const row = Math.round(entry.boundingClientRect.top / 80);
        const delay = (rows.get(row) ?? 0) * 90;
        rows.set(row, (rows.get(row) ?? 0) + 1);
        setTimeout(() => entry.target.classList.add('is-in'), delay);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );
  const rows = new Map();
  for (const el of targets) io.observe(el);
  // whatever is already on screen at load comes in straight away
  requestAnimationFrame(() => {
    targets
      .filter((el) => el.getBoundingClientRect().top < window.innerHeight * 0.9)
      .forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 120 + i * 110));
  });
}
