// assets/js/site.js
// Consolidated site script: menu, smooth-scroll, contact form, and unified carousel
// Load with <script defer src="assets/js/site.js"></script>

(function () {
  'use strict';

  /* ===== Menu (off-canvas) ===== */
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const closeMenu = document.getElementById('closeMenu');

  function openMenu() {
    sideMenu.classList.add('open');
    sideMenu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const first = sideMenu.querySelector('a:not(#closeMenu)');
    if (first) first.focus();
  }
  function closeMenuFn() {
    sideMenu.classList.remove('open');
    sideMenu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuBtn.focus();
  }
  if (menuBtn && sideMenu) {
    menuBtn.addEventListener('click', () => (sideMenu.classList.contains('open') ? closeMenuFn() : openMenu()));
    closeMenu && closeMenu.addEventListener('click', closeMenuFn);
    sideMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenuFn));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && sideMenu.classList.contains('open')) closeMenuFn(); });
  }

  /* ===== Smooth anchor navigation ===== */
  function sameFile(a, b) {
    const x = a.split('/').pop() || '';
    const y = b.split('/').pop() || '';
    return x === y || (x === '' && y === 'index.html') || (y === '' && x === 'index.html');
  }
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('https://wa.me') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let url;
    try { url = new URL(href, window.location.href); } catch { return; }
    const path = url.pathname;
    const hash = url.hash;
    if (hash && (path === window.location.pathname || path === '' || sameFile(path, window.location.pathname))) {
      e.preventDefault();
      const id = hash.substring(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try { history.replaceState(null, '', hash); } catch (_) {}
      }
    }
  }, { passive: false });

  /* ===== Contact form -> WhatsApp ===== */
  (function () {
    const form = document.getElementById('formContato');
    if (!form) return;
    const whatsapp = 'https://wa.me/5511952544885';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const nome = document.getElementById('nome')?.value || '';
      const serv = document.getElementById('servico')?.value || '';
      const local = document.getElementById('local')?.value || '';
      const msg = `Olá, me chamo ${nome}. Preciso do serviço: ${serv}. Local: ${local}.`;
      window.open(`${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  })();

  /* ===== Unified carousel =====
     - HTML: .carousel > .track (children are .card)
     - Optional: .prev and .next buttons
     - Optional: .indicators container
     - data-speed attribute in px/sec (default 36)
     - data-friction attribute optional (default 0.92)
  */
  (function () {
    const carousels = Array.from(document.querySelectorAll('.carousel'));
    if (!carousels.length) return;

    carousels.forEach(initCarousel);

    function initCarousel(car) {
      const track = car.querySelector('.track');
      if (!track) return;
      const originals = Array.from(track.children);
      if (!originals.length) return;
      const templates = originals.map(n => n.cloneNode(true));
      const prevBtn = car.querySelector('.prev');
      const nextBtn = car.querySelector('.next');
      const indicatorsRoot = car.querySelector('.indicators');

      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const speed = Math.max(6, parseFloat(car.getAttribute('data-speed')) || 36);
      const frictionAttr = parseFloat(car.getAttribute('data-friction'));
      const friction = !Number.isNaN(frictionAttr) ? frictionAttr : 0.92;

      let itemWidths = [];
      let origSetWidth = 0;
      let pos = 0;
      let raf = null;
      let lastTime = null;
      let playing = true;

      let drag = { active: false, lastX: 0, lastTime: 0, velocity: 0 };

      function measure() {
        itemWidths = [];
        origSetWidth = 0;
        for (let i = 0; i < originals.length; i++) {
          const el = track.children[i];
          const w = (el ? el.offsetWidth : (originals[i].offsetWidth || 260)) + gap;
          itemWidths.push(w);
          origSetWidth += w;
        }
      }

      function resetClones() {
        while (track.children.length > originals.length) track.removeChild(track.lastChild);
      }

      function ensureClones() {
        resetClones();
        measure();
        let totalW = track.scrollWidth;
        const contW = car.offsetWidth;
        let i = 0;
        let safety = 0;
        while (totalW < contW * 2 && safety < 60) {
          const clone = templates[i % templates.length].cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
          totalW += (clone.offsetWidth || itemWidths[i % itemWidths.length] || 260) + gap;
          i++; safety++;
        }
        if (track.scrollWidth < origSetWidth * 2) {
          for (let k = 0; k < originals.length; k++) {
            const c = templates[k].cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
          }
        }
      }

      function wrapAt() { return origSetWidth || (track.scrollWidth / 2); }
      function wrapPos() {
        const w = wrapAt();
        if (!w) return;
        if (pos <= -w) pos += w;
        if (pos > 0) pos -= w;
      }

      function step(ts) {
        if (!lastTime) lastTime = ts;
        const dt = (ts - lastTime) / 1000;
        lastTime = ts;
        if (playing && !drag.active) pos -= speed * dt;
        wrapPos();
        track.style.transform = `translateX(${pos}px)`;
        raf = requestAnimationFrame(step);
      }

      function start() { if (raf) cancelAnimationFrame(raf); lastTime = null; raf = requestAnimationFrame(step); }

      function onDown(e) {
        drag.active = true;
        drag.lastX = e.touches ? e.touches[0].clientX : e.clientX;
        drag.lastTime = performance.now();
        drag.velocity = 0;
        playing = false;
      }
      function onMove(e) {
        if (!drag.active) return;
        const now = performance.now();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = clientX - drag.lastX;
        const dt = Math.max(1, now - drag.lastTime);
        const instV = (dx / dt) * 1000;
        drag.velocity = drag.velocity * 0.75 + instV * 0.25;
        drag.lastX = clientX;
        drag.lastTime = now;
        pos += dx;
        track.style.transform = `translateX(${pos}px)`;
      }
      function onUp() {
        if (!drag.active) return;
        drag.active = false;
        const v0 = drag.velocity || 0;
        if (Math.abs(v0) < 30) { playing = true; lastTime = null; return; }
        let v = v0;
        let prev = performance.now();
        (function momentum(now) {
          const dt = (now - prev) / 1000; prev = now;
          pos += v * dt;
          v *= Math.pow(friction, dt * 60);
          wrapPos();
          track.style.transform = `translateX(${pos}px)`;
          if (Math.abs(v) < 10) { playing = true; lastTime = null; return; }
          requestAnimationFrame(momentum);
        })(performance.now());
      }

      function arrow(dir) {
        const w = itemWidths[0] || (originals[0].offsetWidth + gap) || 260;
        pos += (dir === 'prev') ? w : -w;
        playing = false;
        track.style.transform = `translateX(${pos}px)`;
        setTimeout(() => { playing = true; lastTime = null; }, 260);
      }

      function buildIndicators() {
        if (!indicatorsRoot) return;
        indicatorsRoot.innerHTML = '';
        const count = originals.length;
        for (let i = 0; i < count; i++) {
          const b = document.createElement('button');
          b.setAttribute('aria-label', `Ir para slide ${i + 1}`);
          if (i === 0) b.classList.add('active');
          b.addEventListener('click', () => {
            const w = itemWidths[0] || (originals[0].offsetWidth + gap) || 260;
            pos = -(i * w);
            wrapPos();
            track.style.transform = `translateX(${pos}px)`;
            Array.from(indicatorsRoot.children).forEach(x => x.classList.remove('active'));
            b.classList.add('active');
          });
          indicatorsRoot.appendChild(b);
        }
      }
      function updateIndicators() {
        if (!indicatorsRoot) return;
        const buttons = Array.from(indicatorsRoot.children);
        if (!buttons.length) return;
        const w = itemWidths[0] || (originals[0].offsetWidth + gap);
        const wrap = wrapAt();
        let norm = pos % wrap; if (norm > 0) norm -= wrap;
        const idx = Math.round(Math.abs(norm) / w) % originals.length;
        buttons.forEach((b, i) => b.classList.toggle('active', i === idx));
      }

      function initialize() {
        ensureClones();
        measure();
        buildIndicators();
        start();

        car.addEventListener('mouseenter', () => playing = false);
        car.addEventListener('mouseleave', () => { playing = true; lastTime = null; });

        car.addEventListener('pointerdown', (e) => { onDown(e); try { car.setPointerCapture && car.setPointerCapture(e.pointerId); } catch (_) {} }, { passive: false });
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);

        car.addEventListener('touchstart', (e) => onDown(e), { passive: true });
        car.addEventListener('touchmove', (e) => onMove(e), { passive: false });
        car.addEventListener('touchend', onUp);

        prevBtn && prevBtn.addEventListener('click', () => arrow('prev'));
        nextBtn && nextBtn.addEventListener('click', () => arrow('next'));

        setInterval(updateIndicators, 220);

        const ro = new ResizeObserver(() => {
          measure();
          resetClones();
          ensureClones();
          buildIndicators();
        });
        ro.observe(car);
      }

      const imgs = Array.from(track.querySelectorAll('img'));
      const unloaded = imgs.filter(i => !i.complete);
      if (unloaded.length) {
        let loaded = 0;
        unloaded.forEach(img => img.addEventListener('load', () => { loaded++; if (loaded === unloaded.length) setTimeout(initialize, 60); }));
        setTimeout(() => { if (!raf) initialize(); }, 1000);
      } else {
        setTimeout(initialize, 60);
      }

      // expose minimal API
      car.__carousel = { pause: () => playing = false, play: () => playing = true };
    }
  })();

})();
