// Selector de idioma
(function () {
  const LANGS = { 'Español': 'es', 'English': 'en' };

  function applyLang(name) {
    const code = LANGS[name] || 'es';
    document.querySelectorAll('[data-es]').forEach(el => {
      el.textContent = el.dataset[code] || el.dataset.es;
    });
    const label = document.querySelector('[data-lang-label]');
    if (label) label.textContent = name;
  }

  // aplica el idioma guardado al cargar la página
  let saved = 'Español';
  try { saved = localStorage.getItem('helenne-lang') || 'Español'; } catch (e) {}
  if (saved !== 'Español') applyLang(saved);

  const switcher = document.getElementById('langSwitcher');
  if (!switcher) return;

  const toggle = switcher.querySelector('.lang-switcher__toggle');

  toggle.addEventListener('click', () => {
    const open = switcher.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });

  switcher.querySelectorAll('[data-lang]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      applyLang(a.dataset.lang);
      try { localStorage.setItem('helenne-lang', a.dataset.lang); } catch (e2) {}
      switcher.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', e => {
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
