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

  /* ---------- reviews carousel: controls appear only when the cards overflow ---------- */
  $$('.rv-track').forEach(function (track) {
    var sec = track.closest('section'), nav = $('.rv-nav', sec), dots = $('.rv-dots', sec);
    var cards = [].slice.call(track.children);
    function mark() {
      if (!dots || dots.hidden) return;
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      [].slice.call(dots.children).forEach(function (d, i) { d.classList.toggle('on', i === best); });
    }
    function sync() {
      var over = track.scrollWidth > track.clientWidth + 4;
      if (nav) nav.hidden = !over;
      if (dots) { dots.hidden = !over; if (over && !dots.children.length) cards.forEach(function () { dots.appendChild(document.createElement('i')); }); }
      mark();
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(mark); }, { passive: true });
    $$('.rv-arrow', sec).forEach(function (b) { b.addEventListener('click', function () {
      track.scrollBy({ left: parseInt(b.getAttribute('data-dir'), 10) * (cards[0].offsetWidth + 24), behavior: reduce ? 'auto' : 'smooth' });
    }); });
    window.addEventListener('resize', sync); sync();
  });

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
