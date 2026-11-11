/* Fox Media Agency — site behaviour
   Plain JS, no dependencies. Everything degrades: if JS fails the page is fully readable. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- loader (home only) ---------- */
  var loader = $('#loader');
  if (loader) {
    if (reduce) { loader.remove(); }
    else { setTimeout(function () { loader.classList.add('off'); setTimeout(function () { loader.remove(); }, 1100); }, 1000); }
  }

  /* ---------- hero phones: video with image fallback, then idle bob ---------- */
  var phones = $('#phones');
  if (phones) {
    $$('video.media', phones).forEach(function (v) {
      var fail = function () { v.remove(); };
      v.addEventListener('error', fail, true);
      $$('source', v).forEach(function (s) { s.addEventListener('error', fail); });
      v.play && v.play().catch(function () { /* autoplay blocked: poster/image shows */ });
    });
    if (!reduce) setTimeout(function () { phones.classList.add('settled'); }, loader ? 3400 : 1800);
  }

  function drawn(el) { var m = $('#methodTrack'); if (m && el.closest('#methodTrack')) m.classList.add('drawn'); }

  /* ---------- nav: hide on scroll down, show on scroll up; watermark parallax ---------- */
  var topNav = $('#nav'), lastY = 0, wm = $('.watermark'), ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (topNav) {
      if (y > 140 && y > lastY + 4) topNav.classList.add('hide');
      else if (y < lastY - 4) topNav.classList.remove('hide');
    }
    lastY = y;
    if (wm && !reduce && y < 1400) wm.style.transform = 'translateY(calc(-50% + ' + (y * 0.18) + 'px))';
    /* anything the viewer has jumped past should not stay hidden */
    $$('.r.pre:not(.in)').forEach(function (e) { if (e.getBoundingClientRect().bottom < 0) { e.classList.add('in'); drawn(e); } });
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* mobile nav toggle */
  var burger = $('#burger'), menu = $('#menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); }); });
  }

  /* ---------- headings: split into words for the masked rise ---------- */
  $$('.section-head h2, .roster-head h2, .page-head h1').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'hw';
            var w = document.createElement('span'); w.className = 'hwi'; w.textContent = part;
            w.style.setProperty('--d', (0.1 + i * 0.07) + 's'); i++;
            o.appendChild(w); frag.appendChild(o);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) { walk(c); }
      });
    })(h);
  });

  /* ---------- reveal on scroll ---------- */
  var els = $$('.r');
  var method = $('#methodTrack');
  if (!('IntersectionObserver' in window) || reduce) {
    root.classList.add('no-split');
    els.forEach(function (e) { e.classList.add('in'); });
    if (method) method.classList.add('drawn');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = [].slice.call(el.parentElement.querySelectorAll(':scope > .r'));
        var i = sibs.indexOf(el);
        el.style.transitionDelay = (Math.max(0, i) * (el.classList.contains('rx') ? 120 : 140)) + 'ms';
        el.classList.add('in'); drawn(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    els.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) { e.classList.add('in'); drawn(e); }
      else { e.classList.add('pre'); io.observe(e); }
    });
  }

  /* ---------- count-up stats ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to')), suf = el.getAttribute('data-suffix') || '';
    if (reduce || to === 0) { el.textContent = to + suf; return; }
    var start = null, dur = 2000;
    function tick(t) { if (!start) start = t; var p = Math.min(1, (t - start) / dur); p = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(to * p) + suf; if (p < 1) requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }
  var statsEl = $('.stats');
  if (statsEl) {
    var counted = false;
    var maybeCount = function () { if (counted) return; var r = statsEl.getBoundingClientRect(); if (r.top < window.innerHeight * 0.95) { counted = true; $$('[data-to]').forEach(countUp); } };
    maybeCount(); window.addEventListener('scroll', maybeCount, { passive: true });
  }

  /* ---------- LIVE viewer counters drift ---------- */
  if (!reduce) $$('[data-count]').forEach(function (el) {
    var v = parseInt(el.getAttribute('data-count'), 10);
    setInterval(function () { v += Math.round((Math.random() - 0.4) * 9); if (v < 50) v = 50; el.textContent = v.toLocaleString('en-GB'); }, 1500);
  });

  /* ---------- frosted roster cards: tap toggles on touch ---------- */
  $$('.card .frost').forEach(function (f) {
    f.parentElement.addEventListener('click', function () { this.classList.toggle('open'); });
  });

  /* ---------- reviews: full-width rail. Drifts on its own, eases to a stop under the pointer, grows the card
     in place while its neighbours make room, counts down 'LIVE in 5', then fades the creator's clip in under
     the overlays. Touch: tap a card (1.5s countdown). Reduced motion: a plain scrollable row. ---------- */
  var touchOnly = window.matchMedia('(hover: none)').matches;
  var GROW_MS = 1150; /* matches the width transition in site.css */

  function initRail(section) {
    var rail = section.querySelector('.rv-rail');
    var belt = rail && rail.querySelector('.rv-belt');
    if (!belt || rail.dataset.ready || !rail.offsetParent) return;
    rail.dataset.ready = '1';

    var DELAY = touchOnly ? 1500 : 5000;
    section.style.setProperty('--delay', DELAY + 'ms');
    var BASE = 26; /* px per second */

    var originals = [].slice.call(belt.children);
    originals.forEach(function (c) { c.setAttribute('tabindex', '0'); });

    var toggle = section.querySelector('.rv-toggle');

    if (reduce) {
      rail.classList.add('static');
      if (toggle) toggle.hidden = true;
      originals.forEach(function (c) { wire(c); });
      return;
    }

    /* clones so the belt never runs out; they are decorative copies */
    var sets = [originals];
    function addSet() {
      var set = originals.map(function (c) {
        var k = c.cloneNode(true);
        k.setAttribute('aria-hidden', 'true'); k.removeAttribute('tabindex');
        [].forEach.call(k.querySelectorAll('a'), function (a) { a.tabIndex = -1; });
        belt.appendChild(k); wire(k); return k;
      });
      sets.push(set);
    }
    function period() { return sets[1][0].offsetLeft - sets[0][0].offsetLeft; }
    function fill() {
      if (sets.length < 2) addSet();
      if (period() <= 0) return;
      var need = Math.ceil((rail.clientWidth + 2 * period()) / period()) + 1;
      while (sets.length < need) addSet();
    }
    originals.forEach(wire);
    fill();

    var offset = -period() * 0.35, vel = BASE, last = 0, running = false, visible = false, paused = false;
    var active = null, anchor = null, anchorX = 0, anchorUntil = 0;
    var dragging = false;

    function wire(card) {
      var video = card.querySelector('.rv-video');
      card._t0 = 0;
      card._on = function () {
        if (active && active !== card) active._off();
        active = card; belt.classList.add('has-on');
        card.classList.add('is-on'); card._t0 = performance.now(); card._count = -1; card._fired = false;
        setAnchor(card);
        if (video && !video.src && card.dataset.video) { video.preload = 'auto'; video.src = card.dataset.video; video.load(); }
      };
      card._off = function () {
        card.classList.remove('is-on', 'is-live'); card._t0 = 0;
        var s = card.querySelector('.rv-state'); if (s) s.textContent = 'Fox Media creator';
        if (active === card) { active = null; belt.classList.remove('has-on'); }
        anchorUntil = performance.now() + GROW_MS;
        if (video) setTimeout(function () { if (!card.classList.contains('is-on')) video.pause(); }, 1400);
      };
      card._live = function () {
        if (!video || !video.src) return;
        var go = function () {
          if (!card.classList.contains('is-on')) return;
          var p = video.play();
          var show = function () { if (card.classList.contains('is-on')) card.classList.add('is-live'); };
          if (p && p.then) p.then(show, function () {}); else show();
        };
        if (video.readyState >= 3) go(); else video.addEventListener('canplay', go, { once: true });
      };
      if (touchOnly) {
        card.addEventListener('click', function (e) {
          if (e.target.closest('a') || rail.dataset.dragged) return;
          card.classList.contains('is-on') ? card._off() : card._on();
        });
      } else {
        card.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !dragging) card._on(); });
        card.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && active === card) card._off(); });
      }
      card.addEventListener('focus', function () {
        if (!card.matches(':focus-visible')) return;
        if (!reduce) { rail.scrollLeft = 0; var r = card.getBoundingClientRect(), rr = rail.getBoundingClientRect(); offset += (rr.left + rr.width / 2) - (r.left + r.width / 2); }
        card._on();
      });
      card.addEventListener('blur', function () { if (active === card) card._off(); });
    }

    function setAnchor(card) {
      if (reduce) return;
      anchor = card;
      var r = card.getBoundingClientRect(); anchorX = r.left + r.width / 2;
    }

    function tick(t) {
      if (!running) return;
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;

      /* target speed: zero while a card is on or the viewer has paused it */
      var target = (active || paused) ? 0 : BASE;
      if (!dragging) vel += (target - vel) * Math.min(1, dt * (active ? 5 : 2.2));
      if (!dragging) offset -= vel * dt;

      belt.style.transform = 'translate3d(' + offset + 'px,0,0)';

      /* keep the growing (or shrinking) card centred where it was, so it grows out both sides */
      if (anchor && (anchor.classList.contains('is-on') || t < anchorUntil)) {
        anchorX -= vel * dt;
        var r = anchor.getBoundingClientRect();
        offset += anchorX - (r.left + r.width / 2);
        belt.style.transform = 'translate3d(' + offset + 'px,0,0)';
      } else {
        anchor = null;
        var p = period();
        if (p <= 0) { stop(); return; }
        while (offset <= -p) offset += p;
        while (offset > 0) offset -= p;
      }

      /* the countdown */
      if (active && active._t0) {
        var el = t - active._t0;
        var n = Math.max(0, Math.ceil((DELAY - el) / 1000));
        if (n !== active._count) { active._count = n; var s = active.querySelector('.rv-state'); if (s) s.textContent = n > 0 ? 'LIVE in ' + n : 'LIVE'; }
        if (el >= DELAY && !active._fired) { active._fired = true; active._live(); }
      }
      requestAnimationFrame(tick);
    }
    function start() { if (running || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(tick); }
    function stop() { running = false; }

    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(rail);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    window.addEventListener('resize', function () { fill(); });

    if (toggle) toggle.addEventListener('click', function () {
      paused = !paused; toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
      toggle.setAttribute('aria-label', paused ? 'Play the reviews' : 'Pause the reviews');
    });

    /* drag / swipe, with a little throw */
    var px = 0, pt = 0, down = false, moved = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('a')) return;
      down = true; moved = 0; px = e.clientX; pt = performance.now(); delete rail.dataset.dragged;
    });
    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - px, now = performance.now();
      moved += Math.abs(dx);
      if (!dragging && moved > 8) {
        dragging = true; rail.classList.add('dragging'); rail.dataset.dragged = '1';
        try { rail.setPointerCapture(e.pointerId); } catch (_) {}
        if (active) active._off(); anchor = null;
      }
      if (dragging) { offset += dx; vel = -dx / Math.max(0.008, (now - pt) / 1000); }
      px = e.clientX; pt = now;
    });
    function up() {
      if (!down) return; down = false;
      if (dragging) { dragging = false; rail.classList.remove('dragging'); setTimeout(function () { delete rail.dataset.dragged; }, 50); }
    }
    rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up);

    /* sideways trackpad swipes move it too */
    rail.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); if (active) active._off(); anchor = null; offset -= e.deltaX;
    }, { passive: false });
  }

  $$('.reviews-sec').forEach(initRail);

  /* ---------- chip groups write to a hidden input ---------- */
  $$('.chips').forEach(function (g) {
    var input = $('input[type="hidden"]', g.parentElement);
    g.addEventListener('click', function (ev) {
      var b = ev.target.closest('.chip'); if (!b) return;
      $$('.chip', g).forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      if (input) input.value = b.textContent.trim();
      g.classList.remove('invalid');
    });
  });

  /* ---------- multi-step application form (real submit on the last step) ---------- */
  var form = $('#applyForm');
  if (form) {
    var steps = $$('[data-step]', form);
    var bars = $$('.progress i', form);
    var back = $('#backBtn'), next = $('#nextBtn');
    var cur = 1, total = steps.length;
    function show(n) {
      cur = n;
      steps.forEach(function (s) { s.hidden = parseInt(s.getAttribute('data-step'), 10) !== n; });
      bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
      back.hidden = (n === 1);
      next.setAttribute('type', n === total ? 'submit' : 'button');
      next.firstChild.textContent = (n === total ? 'Send application' : 'Continue');
      var first = $('input:not([type=hidden]), select', steps[n - 1]);
      if (first && n > 1) first.focus({ preventScroll: true });
    }
    function validStep(n) {
      var ok = true, s = steps[n - 1];
      $$('[required]', s).forEach(function (f) {
        var good = f.type === 'checkbox' ? f.checked : !!f.value.trim();
        if (f.type === 'email' && good) good = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value);
        var wrap = f.closest('.field') || f.closest('.check');
        if (wrap) wrap.classList.toggle('invalid', !good);
        if (f.type === 'hidden') { var chips = $('.chips', f.parentElement); if (chips) chips.classList.toggle('invalid', !good); }
        if (!good) ok = false;
      });
      return ok;
    }
    next.addEventListener('click', function (e) {
      if (cur < total) { e.preventDefault(); if (validStep(cur)) show(cur + 1); }
      else if (!validStep(cur)) { e.preventDefault(); }
    });
    back.addEventListener('click', function () { if (cur > 1) show(cur - 1); });
    form.addEventListener('submit', function (e) { if (!validStep(cur)) e.preventDefault(); });
    show(1);
  }

  /* ---------- simple enquiry form validation ---------- */
  var enq = $('#enquiryForm');
  if (enq) enq.addEventListener('submit', function (e) {
    var ok = true;
    $$('[required]', enq).forEach(function (f) { var good = !!f.value.trim(); (f.closest('.field') || f).classList.toggle('invalid', !good); if (!good) ok = false; });
    if (!ok) e.preventDefault();
  });

  /* ---------- footer year ---------- */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
