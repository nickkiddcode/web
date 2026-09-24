// Spiral of floating work — a vertical WebGL helix. Cards are wrapped onto a cylinder and ride a
// spiral around it; scroll / drag / keys turn the helix and carry it up. Far, back and top/bottom
// cards blur and fade into the page. Video cards autoplay (muted loop) while they're in front.
// Hover (or tap) reveals name + category; click goes to the project. Data: #spiral-data.
// The Spline mark sits in the hollow of the helix: back-facing cards render on a canvas beneath it,
// front-facing cards on a canvas above it, so cards pass in front of and behind the mark.
// Category pills re-flow the helix to only that category's work.
// The top of the helix is the header: NICK KIDD wrapped round the Spline mark as the spiral's first turn.
// The spiral is finite — it opens on the header and ends on the last piece of work.
// Past the last piece the helix runs on a little and the closing card comes up.
// Spiral / List toggle: the helix spins, shrinks and fades as the work grid staggers in (and back).
import * as THREE from 'three';

const stage = document.getElementById('spiral-stage');
const dataEl = document.getElementById('spiral-data');
if (stage && dataEl) boot();

function boot() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (reduce || !gl) return; // the plain grid stays visible

  const items = JSON.parse(dataEl.textContent);
  if (!items.length) return;
  const chip = document.getElementById('spiral-chip');
  const hint = document.getElementById('spiral-hint');

  // ------------------------------------------------------------------ tunables
  const BG = new THREE.Color('#eff1f3');
  const FOV = 40;
  const R0 = 3.0;            // cylinder radius (world units) — a slim column
  const R_FRAME = 4.2;       // framing reference, so a slimmer helix reads slimmer on screen
  const GROW = 0.15;         // cards swell this much as they reach the middle of the screen
  const CARD_W = 3.19, CARD_H = 2.42;
  const ANG = 1.22;          // radians between neighbours around the axis (~5 per turn) — clear air between pieces
  const DY = 0.7;            // rise per neighbour (one turn ≈ 3.6 units, so turns sit well apart)
  const ANG_NARROW = 1.25;   // portrait phone: ~5 per turn, so side-by-side works clear each other
  const DY_NARROW = 0.75;    // ...and each turn sits a full card-height plus a gap above the last
  const RH = 3.2;            // header band radius — just outside the work
  const HEAD_ARC = 2.15;     // radians one NICK KIDD spans at the front (~125°) — sets the type size
  const HEAD_SLICES = 48;    // one full turn, drawn as slices so it passes in front of and behind the mark
  const BOW = 0.16;          // how far the middle of the column swells toward the viewer
  const MAX_LIVE = 5;        // simultaneous playing videos

  document.documentElement.classList.add('spiral-live');
  if (hint && window.matchMedia('(pointer: coarse)').matches) hint.textContent = 'Swipe to explore · tap to open';
  window.addEventListener('load', () => window.__lenis?.destroy?.()); // this page scrolls itself

  // ------------------------------------------------------------------ renderer
  const makeRenderer = () => {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setClearColor(0x000000, 0);
    return r;
  };
  const rBack = makeRenderer();   // cards on the far side of the helix
  const rFront = makeRenderer();  // cards on the near side
  const splineWrap = document.createElement('div');
  splineWrap.className = 'spiral-spline';
  stage.append(rBack.domElement, splineWrap, rFront.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120);

  // ------------------------------------------------------------------ cards
  const geo = new THREE.PlaneGeometry(1, 1, 32, 12);
  const blank = new THREE.DataTexture(new Uint8Array([223, 226, 230, 255]), 1, 1);
  blank.needsUpdate = true;
  const rand = mulberry(20260919);

  // The plane is sized and wrapped onto the cylinder here, so every card hugs the same helix surface.
  const vert = /* glsl */ `
    uniform vec2 uSize;
    uniform float uR;
    uniform float uSkew;   // lean along the helix pitch (+ a little extra with speed), world units per unit width
    uniform float uHover, uGrow;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec2 s = uSize * (1.0 + uGrow * ${GROW.toFixed(3)}) * (1.0 + uHover * 0.05);
      float px = position.x * s.x;
      vec3 p = vec3(px, position.y * s.y + uSkew * px, 0.0);
      float phi = p.x / uR;
      p = vec3(uR * sin(phi), p.y, uR * (cos(phi) - 1.0));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`;
  const frag = /* glsl */ `
    precision highp float;
    uniform sampler2D uMap;
    uniform vec3 uBg;
    uniform vec2 uSize;
    uniform vec2 uUvScale;
    uniform vec2 uUvOffset;
    uniform float uRadius, uLoaded, uFog, uBlur, uHover, uDim, uAlpha, uFlip;
    varying vec2 vUv;
    float rbox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }
    void main() {
      vec2 p = (vUv - 0.5) * uSize;
      float d = rbox(p, uSize * 0.5, uRadius);
      float aa = fwidth(d) * 1.2;
      float mask = uRadius < 0.0 ? 1.0 : 1.0 - smoothstep(-aa, aa, d);
      vec2 uv = vUv;
      if (!gl_FrontFacing && uFlip > 0.5) uv.x = 1.0 - uv.x;   // cards seen from behind still read the right way round
      vec4 tx = texture2D(uMap, uv * uUvScale + uUvOffset, uBlur);
      vec3 col = tx.rgb;
      col *= 1.0 + uHover * 0.05;
      col = mix(col, col * 0.78, uDim);
      col = mix(col, uBg, uFog);
      gl_FragColor = vec4(col, mask * uAlpha * uLoaded * tx.a);
      #include <colorspace_fragment>
    }`;

  const cards = items.map((d, i) => {
    const imgAspect = d.w / d.h;
    const aspect = Math.min(1.8, Math.max(0.8, imgAspect)); // keep the pieces close in size; extreme shapes get cropped
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: blank },
        uBg: { value: BG },
        uSize: { value: new THREE.Vector2(1, 1) },
        uUvScale: { value: new THREE.Vector2(1, 1) },
        uUvOffset: { value: new THREE.Vector2(0, 0) },
        uR: { value: R0 },
        uRadius: { value: 0.1 },
        uSkew: { value: 0 },
        uLoaded: { value: 0 },
        uFog: { value: 0 },
        uBlur: { value: 0 },
        uHover: { value: 0 },
        uGrow: { value: 0 },
        uDim: { value: 0 },
        uAlpha: { value: 1 },
        uFlip: { value: 1 },
      },
    });
    if (imgAspect < aspect) {            // taller than the card: keep the top
      const f = imgAspect / aspect;
      material.uniforms.uUvScale.value.set(1, f);
      material.uniforms.uUvOffset.value.set(0, 1 - f);
    } else if (imgAspect > aspect) {     // wider than the card: keep the centre
      const f = aspect / imgAspect;
      material.uniforms.uUvScale.value.set(f, 1);
      material.uniforms.uUvOffset.value.set((1 - f) / 2, 0);
    }
    let w, h;
    if (aspect >= CARD_W / CARD_H) { w = CARD_W; h = w / aspect; } else { h = CARD_H; w = h * aspect; }
    material.uniforms.uSize.value.set(w, h);
    material.uniforms.uRadius.value = Math.min(w, h) * 0.07;
    const rj = rand() * 0.45;              // each card floats at its own distance from the axis
    material.uniforms.uR.value = R0 + rj;
    const mesh = new THREE.Mesh(geo, material);
    mesh.visible = false;
    scene.add(mesh);
    return {
      i, d, mesh, material, w, h, rj,
      on: true, pos: i, vis: 1, show: false,
      phase: (rand() - 0.5) * 0.08,
      bob: rand() * Math.PI * 2,
      tilt: (rand() - 0.5) * 0.09,
      state: 'idle', tex: null, loadedAt: 0, hover: 0,
      face: 1, back: 0, ny: 0, alpha: 0, y: 0, grow: 0,
      vid: null, vtex: null,
    };
  });

  // ------------------------------------------------------------------ layout
  let W = 1, H = 1, halfWF = 5, halfHF = 3.4, camZ = 12;
  let ang = ANG, dy = DY; // spacing along the helix; opened up on a portrait phone so works have breathing room
  function resize() {
    W = stage.clientWidth || window.innerWidth;
    H = stage.clientHeight || window.innerHeight;
    rBack.setSize(W, H, false);
    rFront.setSize(W, H, false);
    const a = W / H;
    ang = a < 0.85 ? ANG_NARROW : ANG;
    dy = a < 0.85 ? DY_NARROW : DY;
    camera.aspect = a;
    camera.updateProjectionMatrix();
    // how much of the front surface fits: the helix column fills most of a landscape screen,
    // and overflows a portrait phone on purpose
    halfWF = Math.min(R_FRAME * 1.45, Math.max(R_FRAME * 0.78, R_FRAME * (0.55 + a * 0.5)));
    const tan = Math.tan((FOV * Math.PI) / 360);
    const df = (halfWF * 0.86) / (tan * a);
    halfHF = tan * df;
    camZ = R0 + 0.4 + df;
  }
  window.addEventListener('resize', () => { resize(); heads.forEach(fitBand); });
  resize();

  // ------------------------------------------------------------------ input
  const N = cards.length;
  let P = N;               // pieces on the helix
  let category = null;     // null = all work
  let switching = null;    // { cat, t0 } while the helix fades out ahead of a re-layout
  function layout(cat) {
    const act = cards.filter((c) => !cat || c.d.category === cat);
    P = act.length;
    for (const c of cards) c.on = false;
    act.forEach((c, k) => { c.on = true; c.pos = k; });
    document.querySelectorAll('.spiral-list li').forEach((li) => { li.hidden = !!cat && li.dataset.cat !== cat; });
  }
  layout(null);
  // ------------------------------------------------------------------ view: spiral <-> list
  const views = [...document.querySelectorAll('[data-view]')];
  const work = document.getElementById('spiral-work');
  const srList = document.querySelector('.spiral-list');
  const workItems = work ? [...work.querySelectorAll('[data-cat]')] : [];
  let view = new URLSearchParams(location.search).get('view') === 'list' && work ? 'list' : 'spiral';
  let viewT = view === 'list' ? 1 : 0;       // 0 = spiral, 1 = list
  let viewAnim = null;                        // { from, to, t0, dur, delay }
  let cleared = false;
  let splineApp = null;
  function staggerList() {
    let k = 0;
    for (const el of workItems) {
      el.hidden = !!category && el.dataset.cat !== category;
      if (!el.hidden) el.style.setProperty('--i', String(k++));
    }
  }
  function applyView(v, animate) {
    view = v;
    document.documentElement.classList.toggle('spiral-view-list', v === 'list');
    views.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    if (srList) srList.inert = v === 'list';
    if (work) {
      work.inert = v !== 'list';
      if (v === 'list') {
        staggerList();
        work.scrollTop = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => work.classList.add('is-in')));
      } else {
        work.classList.remove('is-in');
      }
    }
    const url = new URL(location.href);
    if (v === 'list') url.searchParams.set('view', 'list'); else url.searchParams.delete('view');
    history.replaceState(history.state, '', url);
    splineApp?.[v === 'list' ? 'stop' : 'play']?.();
    if (!animate) { viewT = v === 'list' ? 1 : 0; viewAnim = null; return; }
    // spiral -> list: a quick spin-and-shrink away; list -> spiral: turn back in once the list has started leaving
    viewAnim = v === 'list'
      ? { from: viewT, to: 1, t0: performance.now(), dur: 520, delay: 0 }
      : { from: viewT, to: 0, t0: performance.now(), dur: 1000, delay: 140 };
    if (v === 'spiral') { cleared = false; pinned = null; hoverCard = null; }
  }
  views.forEach((b) => b.addEventListener('click', () => { if (b.dataset.view !== view) applyView(b.dataset.view, true); }));

  // the header sits one full turn above the first piece, so it faces front when the page opens
  const headCenter = () => -(Math.PI * 2) / ang;
  const END_PAD = 1.6;       // the helix runs on past the last piece, and the ask arrives there
  const bounds = () => [headCenter(), Math.max(0, P - 1) + END_PAD];

  let target = headCenter();
  let current = target - 5; // intro: the helix turns and rises into place
  let prev = current;
  let vel = 0;
  let lastInput = 0;
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false, down: false, moved: 0, id: null, type: 'mouse', vy: 0 };
  let hoverCard = null;
  let pinned = null;
  let overChip = false;
  let chipCard = null;

  const clampStep = (v, m) => Math.max(-m, Math.min(m, v));
  // signed distance around the loop, in slots, in [-P/2, P/2)
  function wrapS(d) {
    let s = d % P;
    if (s < 0) s += P;
    return s >= P / 2 ? s - P : s;
  }
  stage.addEventListener('wheel', (e) => {
    if (view !== 'spiral') return;
    e.preventDefault();
    e.stopPropagation();
    const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
    const dx = e.deltaMode === 1 ? e.deltaX * 32 : e.deltaX;
    const step = clampStep((dy + dx * 0.6) * 0.0022, 1.0);
    target += step;
    touchInput();
  }, { passive: false });

  stage.addEventListener('pointerdown', (e) => {
    pointer.down = true; pointer.moved = 0; pointer.id = e.pointerId; pointer.type = e.pointerType;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.vy = 0;
    stage.setPointerCapture?.(e.pointerId);
  });
  let splineCanvas = null;
  stage.addEventListener('pointermove', (e) => {
    if (splineCanvas && e.pointerType === 'mouse') {
      const init = { clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, bubbles: false };
      splineCanvas.dispatchEvent(new PointerEvent('pointermove', init));
      splineCanvas.dispatchEvent(new MouseEvent('mousemove', init));
    }
    pointer.type = e.pointerType;
    pointer.nx = (e.clientX / W) * 2 - 1;
    pointer.ny = (e.clientY / H) * 2 - 1;
    pointer.inside = true;
    if (pointer.down) {
      const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
      pointer.moved += Math.abs(dx) + Math.abs(dy);
      if (pointer.moved > 6) {
        stage.classList.add('is-dragging');
        const step = (-dy - dx * 0.5) * 0.006;
        target += step;
        pointer.vy = step;
        touchInput();
      }
    }
    pointer.x = e.clientX; pointer.y = e.clientY;
  });
  const endPointer = (e) => {
    if (!pointer.down) return;
    pointer.down = false;
    stage.classList.remove('is-dragging');
    stage.releasePointerCapture?.(e.pointerId);
    if (pointer.moved <= 6) return tap(e);
    if (pointer.type === 'touch') target += (pointer.vy || 0) * 14; // fling
  };
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('pointerleave', () => { pointer.inside = false; hoverCard = null; });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (view !== 'spiral') return;
    if ((k === ' ' || k === 'Enter') && e.target.closest?.('button, a')) return;
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) target += 1.6;
    else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) target -= 1.6;
    else if (k === 'Home') target = headCenter();
    else if (k === 'End') target = bounds()[1];
    else return;
    if (k === ' ' || k.startsWith('Arrow') || k.startsWith('Page')) e.preventDefault();
    touchInput();
  });

  function touchInput() {
    lastInput = performance.now();
    hint?.classList.add('is-off');
  }

  function tap(e) {
    const hit = pick(e.clientX, e.clientY);
    if (!hit) { pinned = null; return; }
    if (pointer.type === 'touch' && pinned !== hit) { pinned = hit; return; } // first tap reveals, second opens
    window.location.href = `/projects/${hit.d.slug}`;
  }

  // keyboard focus on the (visually hidden) links drives the same chip and turns the card to the front
  document.querySelectorAll('[data-spiral-link]').forEach((a) => {
    const idx = Number(a.dataset.spiralLink);
    a.addEventListener('focus', () => { pinned = cards[idx]; if (cards[idx].on) target = cards[idx].pos; touchInput(); });
    a.addEventListener('blur', () => { if (pinned && pinned.i === idx) pinned = null; });
  });

  // ------------------------------------------------------------------ picking (ray vs each card's plane)
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const inv = new THREE.Matrix4();
  const ro = new THREE.Vector3();
  const rd = new THREE.Vector3();
  function pick(cx, cy) {
    const r = stage.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bestT = Infinity;
    for (const c of cards) {
      if (!c.show || c.alpha < 0.45 || c.back > 0.7 || c.vis < 0.6) continue;
      inv.copy(c.mesh.matrixWorld).invert();
      ro.copy(ray.ray.origin).applyMatrix4(inv);
      rd.copy(ray.ray.direction).transformDirection(inv);
      if (rd.z > -1e-4) continue;                       // card faces away
      const t = -ro.z / rd.z;
      if (t <= 0 || t >= bestT) continue;
      const k = (1 + GROW * c.grow) * (1 + 0.05 * c.hover);
      const lx = ro.x + rd.x * t;
      const ly = ro.y + rd.y * t - c.material.uniforms.uSkew.value * lx;
      if (Math.abs(lx) <= c.w * 0.5 * k && Math.abs(ly) <= c.h * 0.5 * k) { best = c; bestT = t; }
    }
    return best;
  }

  // ------------------------------------------------------------------ textures: posters stream in, videos play in front
  const loader = new THREE.TextureLoader();
  let inflight = 0;
  function stream() {
    const want = cards.filter((c) => c.state === 'idle' && c.show).sort((a, b) => Math.abs(a.y) - Math.abs(b.y));
    for (const c of want) {
      if (inflight >= 8) break;
      c.state = 'loading'; inflight++;
      loader.load(c.d.src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.anisotropy = 4;
        c.tex = tex;
        if (!c.vtex) c.material.uniforms.uMap.value = tex;
        c.state = 'ready'; c.loadedAt = performance.now(); inflight--;
      }, undefined, () => { c.state = 'error'; inflight--; });
    }
    // bound GPU memory: drop poster textures far from the view
    const ready = cards.filter((c) => c.state === 'ready' && !c.vtex);
    if (ready.length > 60) {
      ready.sort((a, b) => Math.abs(b.y) - Math.abs(a.y));
      for (const c of ready.slice(0, ready.length - 60)) {
        if (Math.abs(c.y) < 9) break;
        c.tex.dispose(); c.tex = null; c.material.uniforms.uMap.value = blank;
        c.material.uniforms.uLoaded.value = 0; c.state = 'idle';
      }
    }
  }

  function startVideo(c) {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.src = c.d.video;
    c.vid = v;
    v.addEventListener('playing', () => {
      if (c.vid !== v) return;
      const t = new THREE.VideoTexture(v);
      t.colorSpace = THREE.SRGBColorSpace;
      c.vtex = t;
      c.material.uniforms.uMap.value = t;
      c.material.uniforms.uBlur.value = 0;
      if (c.state !== 'ready') { c.state = 'ready'; c.loadedAt = performance.now(); }
    }, { once: true });
    v.play().catch(() => {});
  }
  function stopVideo(c) {
    const v = c.vid;
    c.vid = null;
    v.pause(); v.removeAttribute('src'); v.load();
    if (c.vtex) { c.vtex.dispose(); c.vtex = null; }
    c.material.uniforms.uMap.value = c.tex || blank;
    if (!c.tex) { c.state = 'idle'; c.material.uniforms.uLoaded.value = 0; }
  }
  function updateVideos() {
    const cand = cards
      .filter((c) => c.d.video && c.show && c.face > 0.72 && c.ny < 0.85)
      .sort((a, b) => a.ny - b.ny);
    const keep = new Set(document.hidden || viewT > 0.5 ? [] : cand.slice(0, MAX_LIVE));
    for (const c of cards) if (c.vid && !keep.has(c)) stopVideo(c);
    for (const c of keep) if (!c.vid) startVideo(c);
  }

  // ------------------------------------------------------------------ frame
  // the column is not a straight cylinder: it bows out where the eye is, mid-screen
  const bow = (y) => {
    const t = Math.min(1, Math.abs(y) / (halfHF * 1.5));
    return 1 + BOW * (1 - t * t);
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const cam = { x: 0, y: 0 };
  let lastT = performance.now(), elapsed = 0, slowUntil = 2.5, frameNo = 0;

  const easeIn = (x) => x * x * x;
  const easeOut = (x) => 1 - (1 - x) ** 3;
  const helix = new THREE.Group();
  for (const c of cards) { scene.remove(c.mesh); helix.add(c.mesh); }
  scene.add(helix);

  // ------------------------------------------------------------------ bands: type wrapped onto the helix
  // (the name at the top, and each role below it as a dated bar)
  const heads = [];
  // a portrait phone sees less of the ring, so the name wears smaller there
  const bandScale = () => (W / H < 0.85 ? 0.68 : 1);
  function fitBand(b) {
    const k = bandScale();
    b.radius = b.baseRadius * k;
    b.material.uniforms.uSize.value.set(b.baseW * k, b.baseH * k);
  }
  function addBand(tex, opts) {
    const { arc, height, slices, radius } = opts;
    const pieces = opts.pieces || Array.from({ length: slices }, (_, k) => [k / slices, (k + 1) / slices]);
    for (const [u0, u1] of pieces) {
      const pieceArc = (u1 - u0) * arc;
      const material = new THREE.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uMap: { value: tex }, uBg: { value: BG },
          uSize: { value: new THREE.Vector2(pieceArc * radius, height) },
          uUvScale: { value: new THREE.Vector2(u1 - u0, 1) },
          uUvOffset: { value: new THREE.Vector2(u0, 0) },
          uR: { value: radius }, uRadius: { value: -1 }, uSkew: { value: 0 }, uLoaded: { value: 1 },
          uFog: { value: 0 }, uBlur: { value: 0 }, uHover: { value: 0 }, uGrow: { value: 0 }, uDim: { value: 0 },
          uAlpha: { value: 0 }, uFlip: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.visible = false;
      helix.add(mesh);
      // keep the angle in (-pi, pi] so a piece past the end of the texture stays on this turn
      let off = ((u0 + u1) / 2 - 0.5) * arc + (opts.offset || 0);
      off = ((off + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const band = { mesh, material, radius, off, face: 1, show: false, baseRadius: radius, baseW: pieceArc * radius, baseH: height };
      heads.push(band);
      fitBand(band);
    }
  }
  async function buildHead() {
    // the band is canvas type, so the face has to be loaded before it can be measured
    let family = stage.dataset.titleFont || 'sans-serif';
    try {
      if (family.endsWith('.ttf') || family.endsWith('.woff2') || family.endsWith('.woff')) {
        const face = new FontFace('NK Head', `url(${family})`, { weight: '200 900' });
        await face.load();
        document.fonts.add(face);
        family = '"NK Head"';
      } else {
        await document.fonts.load(`500 150px ${family}`);
        await document.fonts.ready;
      }
    } catch { family = 'sans-serif'; }
    // one turn of the band: NICK KIDD at the front, NICK KIDD round the back, blank in between
    const size = 150;
    const font = `500 ${size}px ${family}`;
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d');
    ctx.font = font;
    const text = 'NICK KIDD';
    const m = ctx.measureText(text);
    const pad = Math.round(size * 0.12);
    const turnPx = Math.round((m.width * Math.PI * 2) / HEAD_ARC);
    cv.width = turnPx;
    cv.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad * 2);
    ctx.font = font;
    ctx.fillStyle = '#6100b9';
    const base = pad + m.actualBoundingBoxAscent;
    ctx.fillText(text, turnPx * 0.25 - m.width / 2, base);   // front
    ctx.fillText(text, turnPx * 0.75 - m.width / 2, base);   // back
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const h = (Math.PI * 2 * RH) * (cv.height / turnPx);

    // the name is one full turn, so its slices span the whole ring
    tex.wrapS = THREE.RepeatWrapping;   // the second piece runs past the end of the texture
    addBand(tex, {
      arc: Math.PI * 2, height: h, radius: RH, offset: Math.PI * 0.5,
      pieces: [[0.46, 0.96], [0.96, 1.46]],
    });
  }
  buildHead();



  rFront.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    if (viewAnim) {
      const p = Math.min(1, Math.max(0, (now - viewAnim.t0 - viewAnim.delay) / viewAnim.dur));
      const e = viewAnim.to > viewAnim.from ? easeIn(p) : easeOut(p);
      viewT = viewAnim.from + (viewAnim.to - viewAnim.from) * e;
      if (p >= 1) viewAnim = null;
    }
    if (viewT >= 1 && !viewAnim) {
      // resting in the list: nothing to draw, stop the videos, keep the loop idle
      if (!cleared) {
        rBack.clear(); rFront.clear(); cleared = true;
        updateVideos(); setChip(null); hoverCard = null;
      }
      return;
    }
    elapsed += dt;
    const t = elapsed;
    const idle = now - lastInput > 1200;
    const focus = pinned || hoverCard || (overChip ? chipCard : null);

    const [lo, hi] = bounds();
    target = Math.min(hi, Math.max(lo, target));
    prev = current;
    current += (target - current) * (1 - Math.exp(-dt * (elapsed < slowUntil ? 2.2 : 4.6)));
    vel = lerp(vel, (current - prev) / Math.max(dt, 1e-4), 1 - Math.exp(-dt * 8));

    // camera: pointer parallax orbits the helix a little
    cam.x = lerp(cam.x, pointer.inside || pointer.down ? pointer.nx : 0, 1 - Math.exp(-dt * 3));
    cam.y = lerp(cam.y, pointer.inside || pointer.down ? pointer.ny : 0, 1 - Math.exp(-dt * 3));
    camera.position.set(cam.x * 1.3, -cam.y * 0.7, camZ);
    camera.lookAt(0, 0, 0);
    camera.fov = FOV + Math.min(Math.abs(vel) * 1.2, 5);
    camera.updateProjectionMatrix();

    const introFade = smooth(0, 1.4, elapsed);
    // the list toggle: spin a little further round, shrink toward the centre, fade
    const away = viewT;
    helix.scale.setScalar(lerp(1, 0.58, away));
    const spin = away * 1.7;
    // filter change: fade the helix out, re-lay it out for the new category, turn the new set in
    if (switching && now - switching.t0 > 260) {
      category = switching.cat;
      switching = null;
      layout(category);
      current = -3;
      target = 0;
      slowUntil = elapsed + 2.5; // turn the new set in gently
      elapsed = Math.max(elapsed, 1.4); // no second intro fade — the cards fade in through `vis`
    }
    const half = P / 2;
    for (const c of cards) {
      c.vis = lerp(c.vis, switching || !c.on ? 0 : 1, 1 - Math.exp(-dt * 12));
      const s = c.pos - current;
      // the helix climbs to the right: later work sits further round and higher up
      const theta = -s * ang + c.phase + spin;
      const y = -s * dy + Math.sin(t * 0.6 + c.bob) * 0.05;
      c.y = y;
      c.ny = Math.abs(y) / halfHF;
      c.face = Math.cos(theta);
      // the card nearest the middle of the screen (front of the helix, mid-height) is the one in focus
      const dth = Math.atan2(Math.sin(theta), c.face) / 0.6;
      c.grow = Math.exp(-0.5 * (dth * dth + (y / (halfHF * 0.5)) ** 2));
      c.back = 1 - smooth(-0.35, 0.55, c.face);
      c.alpha = lerp(1, 0.34, c.back) * (1 - smooth(1.0, 1.7, c.ny)) * introFade;
      c.alpha *= c.vis * (1 - away) ** 1.5;
      if (c.alpha < 0.01) { c.show = false; continue; }
      c.show = true;

      c.hover = lerp(c.hover, focus === c ? 1 : 0, 1 - Math.exp(-dt * 10));
      const r = (R0 + c.rj) * bow(y) + c.hover * 0.55;
      c.mesh.position.set(Math.sin(theta) * r, y, Math.cos(theta) * r);
      c.material.uniforms.uR.value = r - c.hover * 0.55;
      c.mesh.rotation.set(0, theta, c.tilt + vel * 0.004);

      const u = c.material.uniforms;
      u.uFog.value = Math.min(0.85, c.back * 0.7 + smooth(0.7, 1.5, c.ny) * 0.5);
      if (!c.vtex) u.uBlur.value = Math.max(c.back * 3.6, smooth(0.55, 1.4, c.ny) * 3.4) * (1 - c.hover);
      u.uAlpha.value = c.alpha;
      u.uHover.value = c.hover;
      u.uGrow.value = c.grow;
      u.uDim.value = lerp(u.uDim.value, focus ? (c.hover > 0.5 ? 0 : 0.5) : 0, 1 - Math.exp(-dt * 7));
      // lean each card along the helix pitch, plus a touch more while it's moving
      u.uSkew.value = dy / (ang * ((R0 + c.rj) * bow(y))) + clampStep(vel * 0.004, 0.05);
      u.uLoaded.value = c.state === 'ready' ? Math.min(1, (now - c.loadedAt) / 600) : 0;
      c.mesh.renderOrder = Math.round((1 + c.face) * 100); // back cards draw first, front cards last
    }

    // bands: the name one turn above the work, then the climb above that
    const hc = headCenter();
    for (const hs of heads) {
      const sh = hc - hs.off / ang - current;
      const theta = -sh * ang + spin;
      const y = -sh * dy;
      hs.face = Math.cos(theta);
      const ny = Math.abs(y) / halfHF;
      const back = 1 - smooth(-0.35, 0.55, hs.face);
      const a = lerp(1, 0.3, back) * (1 - smooth(1.0, 1.7, ny)) * introFade * (1 - away) ** 1.5;
      hs.show = a > 0.01;
      if (!hs.show) continue;
      const rb = hs.radius * bow(y);
      hs.mesh.position.set(Math.sin(theta) * rb, y, Math.cos(theta) * rb);
      hs.mesh.rotation.set(0, theta, 0);
      const u = hs.material.uniforms;
      u.uR.value = rb;
      u.uAlpha.value = a;
      u.uFog.value = Math.min(0.85, back * 0.75 + smooth(0.7, 1.5, ny) * 0.5);
      u.uBlur.value = Math.max(back * 3, smooth(0.55, 1.4, ny) * 3);
      u.uSkew.value = dy / (ang * rb);
      hs.mesh.renderOrder = Math.round((1 + hs.face) * 100) + 1;
    }

    cta?.classList.toggle('is-on', view === 'spiral' && current > bounds()[1] - 0.7);

    if (!pointer.down && pointer.inside && pointer.type !== 'touch') hoverCard = pick(pointer.x, pointer.y);
    else if (pointer.type === 'touch') hoverCard = null;
    // with nothing hovered, the chip names the card in the middle of the screen
    let centre = null;
    if (view === 'spiral' && elapsed > 2.2 && !switching) {
      let g = 0.6;
      for (const c of cards) if (c.show && c.grow > g) { g = c.grow; centre = c; }
      if (Math.abs(vel) > 1.2 && chipCard) centre = chipCard; // hold the name while it's spinning fast
    }
    setChip(view !== 'spiral' ? null : pinned || hoverCard || (overChip ? chipCard : null) || centre);
    stage.classList.toggle('is-link', !!hoverCard && !pointer.down);

    if (++frameNo % 4 === 0) stream();
    if (frameNo % 10 === 0) updateVideos();
    // back-facing cards under the Spline mark, front-facing cards over it
    for (const c of cards) c.mesh.visible = c.show && c.face < 0;
    for (const hs of heads) hs.mesh.visible = hs.show && hs.face < 0;
    rBack.render(scene, camera);
    for (const c of cards) c.mesh.visible = c.show && c.face >= 0;
    for (const hs of heads) hs.mesh.visible = hs.show && hs.face >= 0;
    rFront.render(scene, camera);
  });

  // ------------------------------------------------------------------ chip
  const chipImg = chip.querySelector('img');
  const chipTitle = chip.querySelector('.spiral-chip-title');
  const chipMeta = chip.querySelector('.spiral-chip-meta');
  function setChip(card) {
    if (card === chipCard) return;
    chipCard = card;
    if (!card) { chip.classList.remove('is-on'); return; }
    chipImg.src = card.d.src;
    chipTitle.textContent = card.d.title;
    chipMeta.textContent = [card.d.category, card.d.year].filter(Boolean).join('  ·  ');
    chip.href = `/projects/${card.d.slug}`;
    chip.classList.add('is-on');
    hint?.classList.add('is-off');
  }
  // ------------------------------------------------------------------ category filter
  const pills = [...document.querySelectorAll('[data-filter]')];
  const cta = document.getElementById('spiral-cta');
  const fOpen = document.getElementById('spiral-filter-open');
  const fMenu = document.getElementById('spiral-filter-menu');
  const fValue = document.getElementById('spiral-filter-value');
  // progressive disclosure: the categories stay behind one button until asked for
  function openMenu(open) {
    if (!fOpen) return;
    filterEl.classList.toggle('is-open', open);
    fOpen.setAttribute('aria-expanded', String(open));
    fMenu.hidden = !open;
    if (open) fMenu.querySelector('[aria-pressed="true"]')?.focus();
  }
  fOpen?.addEventListener('click', () => openMenu(fMenu.hidden));
  document.addEventListener('pointerdown', (e) => { if (!filterEl?.contains(e.target)) openMenu(false); });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || fMenu?.hidden !== false) return;
    openMenu(false);
    fOpen.focus();
  });
  // the chip and hint sit just above the pills, however many rows they wrap to
  const filterEl = document.querySelector('.spiral-filter');
  const setFilterH = () => {
    if (!filterEl) return;
    const top = filterEl.getBoundingClientRect().top;
    document.documentElement.style.setProperty('--filter-h', `${Math.max(0, Math.round(window.innerHeight - top))}px`);
  };
  setFilterH();
  window.addEventListener('resize', setFilterH);
  pills.forEach((b) => b.addEventListener('click', () => {
    const cat = b.dataset.filter || null;
    if (cat === (switching ? switching.cat : category)) return openMenu(false);
    pills.forEach((p) => p.setAttribute('aria-pressed', String(p === b)));
    if (fValue) fValue.textContent = cat || 'All work';
    openMenu(false);
    pinned = null; hoverCard = null; overChip = false;
    if (view === 'list') {
      category = cat;
      layout(category);
      work.classList.remove('is-in');
      setTimeout(() => { staggerList(); work.scrollTop = 0; requestAnimationFrame(() => work.classList.add('is-in')); }, 240);
      return;
    }
    switching = { cat, t0: performance.now() };
    touchInput();
  }));

  // ------------------------------------------------------------------ Spline mark in the middle of the helix
  async function loadSpline() {
    const { splineUrl, splineData } = stage.dataset;
    if (!splineUrl && !splineData) return;
    try {
      const { Application } = await import('@splinetool/runtime');
      const canvas = document.createElement('canvas');
      splineWrap.appendChild(canvas);
      const app = new Application(canvas);
      if (splineData) {
        const bin = atob(splineData);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        app.start(bytes.buffer);
      } else {
        await app.load(splineUrl);
      }
      splineCanvas = canvas;
      splineApp = app;
      if (view === 'list') app.stop?.();
      splineWrap.classList.add('is-on');
    } catch (e) {
      console.warn('Spline scene failed to load', e);
    }
  }
  if ('requestIdleCallback' in window) requestIdleCallback(loadSpline, { timeout: 2500 });
  else setTimeout(loadSpline, 1200);

  applyView(view, false);
  if (view === 'list') elapsed = 3; // returning to the spiral later skips the page-load intro

  chip.addEventListener('pointerenter', () => { overChip = true; });
  chip.addEventListener('pointerleave', () => { overChip = false; });
  window.addEventListener('blur', () => { hoverCard = null; pointer.down = false; });
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
