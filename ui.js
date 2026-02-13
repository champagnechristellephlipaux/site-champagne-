/* Immersive UI helpers (nav + reveal) — Champagne Christelle Phlipaux */
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupNav(){
    const header = document.querySelector('header');
    const nav = document.querySelector('.nav');
    const menu = document.querySelector('.menu');
    if(!header || !nav || !menu) return;

    // Create toggle (mobile) if not present
    if(nav.querySelector('.nav-toggle')) return;

    const btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label','Ouvrir le menu');
    btn.setAttribute('aria-expanded','false');

    const dots = document.createElement('span');
    dots.className = 'nav-toggle-icon';
    dots.innerHTML = '<span></span><span></span><span></span>';
    btn.appendChild(dots);

    nav.insertBefore(btn, menu);

    const closeMenu = () => {
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded','false');
      btn.setAttribute('aria-label','Ouvrir le menu');
    };

    btn.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });

    // Close on link click
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if(a) closeMenu();
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeMenu();
    });

    // Close when resizing up
    window.addEventListener('resize', () => {
      if(window.innerWidth > 900) closeMenu();
    });
  }

  function setupReveal(){
    const items = Array.from(document.querySelectorAll('.reveal, [data-reveal]'));
    if(!items.length) return;
    if(prefersReduced){
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {root: null, threshold: 0.14, rootMargin: '0px 0px -6% 0px'});

    items.forEach(el => io.observe(el));
  }

  function setupSmoothAnchors(){
    // CSS handles smooth scroll; this adds focus management
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if(!a) return;
      const id = a.getAttribute('href').slice(1);
      if(!id) return;
      const target = document.getElementById(id);
      if(!target) return;
      // Allow default scroll, then focus
      setTimeout(() => {
        target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
        setTimeout(() => target.removeAttribute('tabindex'), 500);
      }, 450);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNav();
    setupReveal();
    setupSmoothAnchors();
  });
})();