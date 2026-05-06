/* --------------------------------------------------------------------------
   thisisnsh.com — scroll-driven typing + line reveal
   -------------------------------------------------------------------------- */

(() => {
  const heroEl = document.getElementById('hero');
  const heroPin = heroEl && heroEl.querySelector('.hero-pin');
  const type1 = document.querySelector('.type-1');
  const type2 = document.querySelector('.type-2');
  const NAMASTE = (type1 && type1.dataset.text) || 'Namaste,';
  const TAGLINE = (type2 && type2.dataset.text) || 'I like to flow & build things.';
  const caret1 = document.querySelector('.caret-1');
  const caret2 = document.querySelector('.caret-2');
  const socials = document.querySelector('.socials');
  const reveals = Array.from(document.querySelectorAll('.line, .label.reveal'));

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  // Easing — slight curve so typing feels natural and bio reveal settles softly.
  const easeOut = (t) => 1 - Math.pow(1 - t, 1.6);

  let ticking = false;
  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }

  function update() {
    if (!heroEl) return;

    const vh = window.innerHeight;
    const heroRect = heroEl.getBoundingClientRect();
    const heroProgress = clamp01(-heroRect.top / Math.max(1, heroRect.height - vh));

    // Phase split: 0–0.42 type Namaste / 0.42–0.82 type tagline / 0.82–1.0 socials
    let p1, p2, p3;
    if (heroProgress < 0.42) {
      p1 = heroProgress / 0.42;
      p2 = 0; p3 = 0;
    } else if (heroProgress < 0.82) {
      p1 = 1;
      p2 = (heroProgress - 0.42) / 0.40;
      p3 = 0;
    } else {
      p1 = 1; p2 = 1;
      p3 = (heroProgress - 0.82) / 0.18;
    }

    // Typing — count characters; clamp to length
    const n1 = Math.min(NAMASTE.length, Math.floor(NAMASTE.length * easeOut(p1) + 0.5));
    const n2 = Math.min(TAGLINE.length, Math.floor(TAGLINE.length * easeOut(p2) + 0.5));

    if (type1.textContent !== NAMASTE.slice(0, n1)) {
      type1.textContent = NAMASTE.slice(0, n1);
    }
    if (type2.textContent !== TAGLINE.slice(0, n2)) {
      type2.textContent = TAGLINE.slice(0, n2);
    }

    // Caret state — only one visible at a time, on the active line
    if (p2 === 0 && p1 < 1) {
      caret1.classList.add('on');
      caret2.classList.remove('on');
    } else if (p2 > 0 && p2 < 1) {
      caret1.classList.remove('on');
      caret2.classList.add('on');
    } else if (p2 >= 1) {
      caret1.classList.remove('on');
      caret2.classList.add('on'); // blink at the end of finished tagline
    } else {
      caret1.classList.add('on');
      caret2.classList.remove('on');
    }

    // Scroll-hint visibility (only at the very start of the page)
    if (heroPin) {
      if (heroProgress > 0.02) {
        heroPin.classList.add('typing');
        heroPin.classList.remove('idle');
      } else {
        heroPin.classList.remove('typing');
        heroPin.classList.add('idle');
      }
    }

    // Socials
    if (p3 > 0.05) socials.classList.add('show');
    else socials.classList.remove('show');

    // Hero shrink + lift in the final 18% of typing — sets up the handoff to the bio
    const shrinkStart = 0.82;
    const sp = clamp01((heroProgress - shrinkStart) / (1 - shrinkStart));
    const heroInner = heroPin && heroPin.querySelector('.hero-inner');
    if (heroInner) {
      const scale = 1 - sp * 0.12;        // 1 → 0.88
      const lift = sp * 36;                // 0 → 36px
      const fade = 1 - sp * 0.35;          // 1 → 0.65
      heroInner.style.setProperty('--hero-scale', scale.toFixed(4));
      heroInner.style.setProperty('--hero-lift', lift.toFixed(2));
      heroInner.style.setProperty('--hero-fade', fade.toFixed(3));
    }

    // Bio + project lines — flow up tied to scroll position
    const startY = vh * 0.92;
    const endY = vh * 0.55;
    for (const el of reveals) {
      const r = el.getBoundingClientRect();
      const t = clamp01((startY - r.top) / Math.max(1, startY - endY));
      el.style.setProperty('--rev', t.toFixed(3));
    }
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  document.fonts && document.fonts.ready.then(schedule);
  update();

  // ----- Tooltip touch handling -------------------------------------------

  const tips = Array.from(document.querySelectorAll('.tip'));
  tips.forEach((tip) => {
    tip.setAttribute('tabindex', '0');
    tip.setAttribute('role', 'button');
    tip.setAttribute('aria-label', tip.getAttribute('data-tip') || '');
    tip.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = tip.classList.contains('touched');
      document.querySelectorAll('.tip.touched').forEach((t) => t.classList.remove('touched'));
      if (!wasOpen) tip.classList.add('touched');
    });
    tip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tip.click();
      }
      if (e.key === 'Escape') tip.classList.remove('touched');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.tip.touched').forEach((t) => t.classList.remove('touched'));
  });
})();
