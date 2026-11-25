/* Webster FX engine: cursor, reveals, parallax, hover-image lists, slideshows, h-scroll, drag, tilt.
   Add #static to the URL to render everything in its final state (for screenshots). */
(() => {
  const $ = (s, r = document) => [...r.querySelectorAll(s)];
  const STATIC = location.hash === '#static';
  const root = document.documentElement;
  if (STATIC) root.classList.add('static');

  // intro loader
  const ld = document.querySelector('.loader');
  if (ld) { if (STATIC) ld.remove(); else setTimeout(() => ld.classList.add('done'), 1500); }

  // split headings into letters
  $('.split').forEach(el => {
    const words = el.textContent.split(' '); el.textContent = ''; let i = 0;
    words.forEach((w, wi) => {
      const ws = document.createElement('span'); ws.className = 'wd';
      [...w].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = c; ws.appendChild(s); });
      el.appendChild(ws); if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // food-texture titles (Adrianna 11-25 loved Mi Paella's): <h1 class="split foodtext" data-food="img/gm06.jpg">
  // letters are filled with a real food photo that shifts with the mouse (drifts on its own on phones)
  $('.foodtext').forEach(el => {
    const u = new URL(el.dataset.food || '', location.href).href;
    const t = $('.ch', el); (t.length ? t : [el]).forEach(n => { n.style.backgroundImage = `url("${u}")`; n.classList.add('ft'); });
  });

  // scroll reveals
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $('[data-reveal],.split').forEach(el => STATIC ? el.classList.add('in') : io.observe(el));

  // custom cursor
  if (!STATIC && matchMedia('(pointer:fine)').matches) {
    const c = document.createElement('div'); c.className = 'cur'; c.innerHTML = '<span></span>';
    document.body.appendChild(c); root.classList.add('has-cur');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
    (function loop() { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
    $('a,button,[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { c.classList.add('big'); c.firstChild.textContent = el.dataset.cursor || ''; });
      el.addEventListener('mouseleave', () => { c.classList.remove('big'); c.firstChild.textContent = ''; });
    });
  }

  // hover list -> floating photo follows the cursor
  $('.hoverlist').forEach(list => {
    const f = document.createElement('img'); f.className = 'float'; f.alt = ''; list.appendChild(f);
    $('[data-img]', list).forEach(li => {
      li.addEventListener('mouseenter', () => { f.src = li.dataset.img; f.classList.add('on'); });
      li.addEventListener('mouseleave', () => f.classList.remove('on'));
    });
    list.addEventListener('mousemove', e => {
      const r = list.getBoundingClientRect();
      f.style.left = (e.clientX - r.left) + 'px'; f.style.top = (e.clientY - r.top) + 'px';
    });
  });

  // cinematic crossfade slideshow
  $('.kb').forEach(k => {
    const im = $('img', k); let i = 0; im[0].classList.add('on');
    if (!STATIC && im.length > 1) setInterval(() => { im[i].classList.remove('on'); i = (i + 1) % im.length; im[i].classList.add('on'); }, 4200);
  });

  // parallax + horizontal scroll sections
  const par = $('[data-speed]'), hs = $('.hs');
  const MOB = () => matchMedia('(max-width: 820px)').matches;
  const sizeHs = () => hs.forEach(s => { const tr = s.querySelector('.hs-track'); if (MOB()) { s.style.height = ''; tr.style.transform = ''; return; } s.style.height = (tr.scrollWidth - innerWidth + innerHeight) + 'px'; });
  function onScroll() {
    if (!MOB()) par.forEach(el => {
      const r = el.getBoundingClientRect(), off = r.top + r.height / 2 - innerHeight / 2;
      el.style.setProperty('--py', (off * -parseFloat(el.dataset.speed)).toFixed(1) + 'px');
    });
    if (!MOB()) hs.forEach(s => {
      const tr = s.querySelector('.hs-track'), r = s.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (s.offsetHeight - innerHeight)));
      tr.style.transform = `translateX(${-p * (tr.scrollWidth - innerWidth)}px)`;
    });
    root.style.setProperty('--sy', scrollY);
  }
  if (!STATIC) {
    sizeHs(); addEventListener('resize', sizeHs);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    addEventListener('load', () => { sizeHs(); onScroll(); });
  }

  // cursor position as CSS vars (for reactive backgrounds / glows)
  addEventListener('mousemove', e => {
    root.style.setProperty('--mx', (e.clientX / innerWidth).toFixed(3));
    root.style.setProperty('--my', (e.clientY / innerHeight).toFixed(3));
    root.style.setProperty('--cx', e.clientX + 'px'); root.style.setProperty('--cy', e.clientY + 'px');
  });

  // draggable elements
  let z = 30;
  if (matchMedia('(pointer:fine)').matches) $('.drag').forEach(el => {
    let sx, sy, ox = 0, oy = 0, d = false;
    el.addEventListener('pointerdown', e => { d = true; window.__dragged = false; sx = e.clientX - ox; sy = e.clientY - oy; el.setPointerCapture(e.pointerId); el.style.zIndex = ++z; el.classList.add('grab'); });
    el.addEventListener('pointermove', e => { if (!d) return; window.__dragged = true; ox = e.clientX - sx; oy = e.clientY - sy; el.style.translate = `${ox}px ${oy}px`; });
    el.addEventListener('pointerup', () => { d = false; el.classList.remove('grab'); });
  });

  // 3D tilt
  $('.tilt').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateY(${px * 16}deg) rotateX(${-py * 16}deg) scale(1.03)`;
    });
    el.addEventListener('mouseleave', () => el.style.transform = '');
  });

  // PREVIEW MODE: visitors can scroll + hover; any click goes to the booking page.
  const book = document.body.dataset.book;
  if (book) {
    document.addEventListener('click', e => {
      if (window.__dragged) { window.__dragged = false; e.preventDefault(); return; }
      e.preventDefault(); e.stopPropagation(); location.href = book;
    }, true);
    if (!STATIC) {
      const pill = document.createElement('a'); pill.className = 'pv-pill'; pill.href = book;
      pill.innerHTML = '<i></i><span class="pl">' + (document.body.dataset.pvlabel || 'Preview') + '</span><b>Make it real →</b>';
      document.body.appendChild(pill);
    }
  }
})();
