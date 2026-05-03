'use strict';

/* ══════════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════════ */
const FORMSPREE_ID  = 'YOUR_FORM_ID'; // ← Nahraďte ID z formspree.io
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`;

/* ══════════════════════════════════════════════════════════════
   NAV SCROLL EFFECT
══════════════════════════════════════════════════════════════ */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive:true });

/* ══════════════════════════════════════════════════════════════
   EMBER PARTICLE CANVAS
══════════════════════════════════════════════════════════════ */
(function initEmbers() {
  const canvas = document.getElementById('ember-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive:true });

  class Ember {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x    = Math.random() * canvas.width;
      this.y    = init ? Math.random() * canvas.height : canvas.height + 10;
      this.size = Math.random() * 2.5 + .5;
      this.speedY = -(Math.random() * .8 + .3);
      this.speedX = (Math.random() - .5) * .4;
      this.life   = 0;
      this.maxLife = Math.random() * 220 + 120;
      this.hue    = Math.random() * 30 + 15; // orange-yellow range
    }
    update() {
      this.x += this.speedX + Math.sin(this.life * .05) * .3;
      this.y += this.speedY;
      this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset();
    }
    draw() {
      const t = this.life / this.maxLife;
      const alpha = t < .2 ? t / .2 : t > .8 ? (1 - t) / .2 : 1;
      ctx.save();
      ctx.globalAlpha = alpha * .65;
      ctx.fillStyle = `hsl(${this.hue}, 100%, 65%)`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const embers = Array.from({ length: 80 }, () => new Ember());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    embers.forEach(e => { e.update(); e.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
  .forEach(el => revealObserver.observe(el));

/* ══════════════════════════════════════════════════════════════
   ANIMATED COUNTERS
══════════════════════════════════════════════════════════════ */
function animateCounter(el, target, suffix = '', duration = 1800) {
  const start    = performance.now();
  const startVal = 0;
  const update   = (now) => {
    const t       = Math.min((now - start) / duration, 1);
    const eased   = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const current = Math.round(startVal + (target - startVal) * eased);
    el.textContent = current + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el     = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]')
  .forEach(el => counterObserver.observe(el));

/* ══════════════════════════════════════════════════════════════
   FORMULÁŘ
══════════════════════════════════════════════════════════════ */
const form       = document.getElementById('poptavka-form');
const btnText    = document.getElementById('btn-text');
const btnSpin    = document.getElementById('btn-spin');
const submitBtn  = document.getElementById('submit-btn');

if (form) {

  function validateField(input) {
    const group   = input.closest('.fg');
    const errEl   = group?.querySelector('.field-err');
    let msg = '';

    if (input.required && input.type !== 'checkbox' && !input.value.trim()) {
      msg = 'Toto pole je povinné.';
    } else if (input.type === 'email' && input.value &&
               !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      msg = 'Zadejte platnou e-mailovou adresu.';
    } else if (input.type === 'checkbox' && input.required && !input.checked) {
      msg = 'Souhlas je povinný.';
    }

    if (errEl) { errEl.textContent = msg; errEl.style.display = msg ? 'block' : 'none'; }
    input.style.borderColor = msg ? '#FF4D00' : '';
    return !msg;
  }

  form.querySelectorAll('input[required], textarea[required]').forEach(el => {
    el.addEventListener('blur',  () => { el.dataset.t = '1'; validateField(el); });
    el.addEventListener('input', () => { if (el.dataset.t) validateField(el); });
  });

  window.resetForm = function () {
    form.reset();
    form.querySelectorAll('.field-err').forEach(e => { e.textContent=''; e.style.display='none'; });
    form.querySelectorAll('input,textarea').forEach(e => { e.style.borderColor=''; delete e.dataset.t; });
    submitBtn.disabled = false;
    btnText.style.display = 'inline'; btnSpin.style.display = 'none';
    document.getElementById('form-wrapper').style.display = 'block';
    document.getElementById('form-success').style.display = 'none';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields   = [...form.querySelectorAll('input[required], textarea[required]')];
    const gdpr     = document.getElementById('f-gdpr');
    const allValid = [...fields, gdpr].map(validateField).every(Boolean);
    if (!allValid) return;

    const hp = form.querySelector('[name="_gotcha"]');
    if (hp?.value) return;

    submitBtn.disabled = true;
    btnText.style.display = 'none'; btnSpin.style.display = 'inline';
    document.getElementById('form-net-err').style.display = 'none';

    try {
      const res = await fetch(FORMSPREE_URL, {
        method:  'POST',
        headers: { Accept: 'application/json' },
        body:    new FormData(form),
      });

      if (res.ok) {
        document.getElementById('form-wrapper').style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
        if (typeof gtag === 'function') gtag('event','form_submit');
      } else throw new Error();

    } catch {
      document.getElementById('form-net-err').style.display = 'block';
      submitBtn.disabled = false;
      btnText.style.display = 'inline'; btnSpin.style.display = 'none';
    }
  });
}
