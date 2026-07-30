// ============ Selector de idioma ============
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

// ============ Carrito ============
(function () {
  const WHATSAPP_NUM = '34623050329';
  const KEY = 'helenne-cart';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }
  function fmt(cents) {
    return '€' + (cents / 100).toFixed(2).replace('.', ',');
  }

  // --- construye el panel lateral ---
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.setAttribute('aria-label', 'Carrito');
  drawer.innerHTML =
    '<div class="cart-drawer__head">' +
    '  <h2 class="cart-drawer__title">Carrito</h2>' +
    '  <button class="drawer-close" type="button">Cerrar</button>' +
    '</div>' +
    '<div class="cart-drawer__items"></div>' +
    '<div class="cart-drawer__foot">' +
    '  <div class="cart-drawer__subtotal"><span>Subtotal</span><span data-subtotal></span></div>' +
    '  <a class="cart-drawer__checkout" href="#" target="_blank" rel="noopener">Pedir por WhatsApp</a>' +
    '  <p class="cart-drawer__note">Te responderemos por WhatsApp para confirmar el pedido y el envío.</p>' +
    '</div>';

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  const itemsBox = drawer.querySelector('.cart-drawer__items');
  const subtotalEl = drawer.querySelector('[data-subtotal]');
  const checkoutBtn = drawer.querySelector('.cart-drawer__checkout');

  // --- contador sobre el icono ---
  const cartIcon = document.querySelector('.js-open-cart');
  let badge = null;
  if (cartIcon) {
    badge = document.createElement('span');
    badge.className = 'cart-count';
    badge.innerHTML = '<span></span>';
    cartIcon.appendChild(badge);
  }

  function render() {
    const items = load();
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

    if (badge) {
      badge.style.display = count ? '' : 'none';
      badge.querySelector('span').textContent = count;
    }

    if (!items.length) {
      itemsBox.innerHTML = '<p class="cart-drawer__empty">Tu carrito está vacío.</p>';
    } else {
      itemsBox.innerHTML = items.map((i, idx) =>
        '<div class="cart-item">' +
        '  <img src="' + i.img + '" alt="' + i.name + '">' +
        '  <div>' +
        '    <span class="cart-item__name">' + i.name + '</span>' +
        '    <span class="cart-item__price">' + fmt(i.price) + '</span>' +
        '    <span class="cart-item__qty">' +
        '      <button type="button" data-dec="' + idx + '" aria-label="Quitar uno">−</button>' +
        '      <span>' + i.qty + '</span>' +
        '      <button type="button" data-inc="' + idx + '" aria-label="Añadir uno">+</button>' +
        '    </span>' +
        '  </div>' +
        '  <button class="cart-item__remove" type="button" data-del="' + idx + '" aria-label="Eliminar">×</button>' +
        '</div>'
      ).join('');
    }

    subtotalEl.textContent = fmt(subtotal);

    // enlace de pedido por WhatsApp
    if (items.length) {
      const msg = 'Hola, me gustaría hacer un pedido en Helenne:\n\n' +
        items.map(i => '• ' + i.name + ' ×' + i.qty + ' — ' + fmt(i.price * i.qty)).join('\n') +
        '\n\nTotal: ' + fmt(subtotal);
      checkoutBtn.href = 'https://wa.me/' + WHATSAPP_NUM + '?text=' + encodeURIComponent(msg);
      checkoutBtn.style.pointerEvents = '';
      checkoutBtn.style.opacity = '';
    } else {
      checkoutBtn.href = '#';
      checkoutBtn.style.pointerEvents = 'none';
      checkoutBtn.style.opacity = '.4';
    }
  }

  function open() {
    render();
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
  }
  function close() {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
  }

  // --- eventos ---
  if (cartIcon) cartIcon.addEventListener('click', e => { e.preventDefault(); open(); });
  drawer.querySelector('.drawer-close').addEventListener('click', close);
  backdrop.addEventListener('click', () => { close(); closeSearchPanel(); });

  itemsBox.addEventListener('click', e => {
    const items = load();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.inc !== undefined) items[+b.dataset.inc].qty++;
    if (b.dataset.dec !== undefined) {
      const it = items[+b.dataset.dec];
      it.qty--; if (it.qty <= 0) items.splice(+b.dataset.dec, 1);
    }
    if (b.dataset.del !== undefined) items.splice(+b.dataset.del, 1);
    save(items);
    render();
  });

  // botones "Añadir al carrito" de la página
  document.querySelectorAll('.js-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const items = load();
      const found = items.find(i => i.id === btn.dataset.id);
      if (found) found.qty++;
      else items.push({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: +btn.dataset.price,
        img: btn.dataset.img,
        qty: 1
      });
      save(items);
      open();
    });
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  render();

  // ============ Buscador ============
  const CATALOG = [
    { name: 'Estuche Hestia', meta: 'Accesorios — €12,00', href: 'accesorios.html',
      img: 'productos/hestia-thumb.jpg' },
    { name: 'Estuche Flora', meta: 'Accesorios — €24,00', href: 'accesorios.html',
      img: 'https://images.unsplash.com/photo-1606417465691-cd430ee3f624?w=200&h=200&q=70&auto=format&fit=crop' },
    { name: 'Estuche Alba', meta: 'Accesorios — €28,00', href: 'accesorios.html',
      img: 'https://images.unsplash.com/photo-1718692786594-6427da90c4d9?w=200&h=200&q=70&auto=format&fit=crop' },
    { name: 'Accesorios', meta: 'Colección', href: 'accesorios.html' },
    { name: 'Ropa', meta: 'Colección — próximamente', href: 'ropa.html' },
    { name: 'Cerámica', meta: 'Colección — próximamente', href: 'ceramica.html' },
    { name: 'Tienda', meta: 'Todas las colecciones', href: 'tienda.html' },
    { name: 'Personalizar', meta: 'Piezas a medida', href: 'personalizar.html' }
  ];

  const panel = document.createElement('div');
  panel.className = 'search-panel';
  panel.innerHTML =
    '<div class="search-panel__inner">' +
    '  <div class="search-panel__row">' +
    '    <input class="search-panel__input" type="search" placeholder="Buscar" aria-label="Buscar">' +
    '    <button class="drawer-close" type="button">Cerrar</button>' +
    '  </div>' +
    '  <div class="search-panel__results"></div>' +
    '</div>';
  document.body.appendChild(panel);

  const input = panel.querySelector('.search-panel__input');
  const results = panel.querySelector('.search-panel__results');

  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function renderResults(q) {
    const query = norm(q.trim());
    if (!query) { results.innerHTML = ''; return; }
    const hits = CATALOG.filter(c => norm(c.name + ' ' + c.meta).includes(query));
    if (!hits.length) {
      results.innerHTML = '<p class="search-panel__none">No hemos encontrado nada con «' + q + '».</p>';
      return;
    }
    results.innerHTML = hits.map(h =>
      '<a class="search-result" href="' + h.href + '">' +
      (h.img ? '<img src="' + h.img + '" alt="">' : '') +
      '  <span><span class="search-result__name">' + h.name + '</span>' +
      '  <span class="search-result__meta">' + h.meta + '</span></span>' +
      '</a>'
    ).join('');
  }

  function openSearch() {
    close(); // cierra el carrito si estaba abierto
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    setTimeout(() => input.focus(), 380);
  }
  function closeSearchPanel() {
    panel.classList.remove('is-open');
    if (!drawer.classList.contains('is-open')) backdrop.classList.remove('is-open');
  }

  const searchIcon = document.querySelector('.js-open-search');
  if (searchIcon) searchIcon.addEventListener('click', e => { e.preventDefault(); openSearch(); });
  panel.querySelector('.drawer-close').addEventListener('click', closeSearchPanel);

  // ============ Menú móvil ============
  const menu = document.createElement('aside');
  menu.className = 'menu-drawer';
  menu.setAttribute('aria-label', 'Menú');
  menu.innerHTML =
    '<div class="menu-drawer__head">' +
    '  <h2 class="menu-drawer__title">Menú</h2>' +
    '  <button class="drawer-close" type="button">Cerrar</button>' +
    '</div>' +
    '<nav class="menu-drawer__nav">' +
    '  <a class="menu-drawer__link" href="tienda.html">Tienda</a>' +
    '  <a class="menu-drawer__link" href="personalizar.html" data-es="Personalizar" data-en="Personalice">Personalizar</a>' +
    '</nav>' +
    '<div class="menu-drawer__langs">' +
    '  <a href="#" data-lang="Español">Español</a>' +
    '  <a href="#" data-lang="English">English</a>' +
    '</div>';
  document.body.appendChild(menu);

  function openMenu() {
    close(); closeSearchPanel();
    menu.classList.add('is-open');
    backdrop.classList.add('is-open');
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    if (!drawer.classList.contains('is-open') && !panel.classList.contains('is-open')) {
      backdrop.classList.remove('is-open');
    }
  }

  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) menuToggle.addEventListener('click', e => { e.preventDefault(); openMenu(); });
  menu.querySelector('.drawer-close').addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // idioma también desde el menú móvil (el selector de cabecera está oculto en móvil)
  menu.querySelectorAll('[data-lang]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      try { localStorage.setItem('helenne-lang', a.dataset.lang); } catch (err) {}
      const code = a.dataset.lang === 'English' ? 'en' : 'es';
      document.querySelectorAll('[data-es]').forEach(el => {
        el.textContent = el.dataset[code] || el.dataset.es;
      });
      const label = document.querySelector('[data-lang-label]');
      if (label) label.textContent = a.dataset.lang;
      menu.querySelectorAll('[data-lang]').forEach(x => x.classList.toggle('is-current', x === a));
    });
  });
  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = results.querySelector('a');
      if (first) window.location.href = first.getAttribute('href');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchPanel(); });
})();

// ============ Galería de fotos del producto ============
(function () {
  const triggers = document.querySelectorAll('.js-open-gallery');
  if (!triggers.length) return;

  const box = document.createElement('div');
  box.className = 'gallery-lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML =
    '<div class="gallery-lightbox__head">' +
    '  <h2 class="gallery-lightbox__title"></h2>' +
    '  <span class="gallery-lightbox__count"></span>' +
    '  <button class="drawer-close" type="button">Cerrar</button>' +
    '</div>' +
    '<div class="gallery-lightbox__stage">' +
    '  <button class="gallery-nav gallery-nav--prev" type="button" aria-label="Foto anterior">‹</button>' +
    '  <img alt="">' +
    '  <button class="gallery-nav gallery-nav--next" type="button" aria-label="Foto siguiente">›</button>' +
    '</div>' +
    '<div class="gallery-lightbox__thumbs"></div>';
  document.body.appendChild(box);

  const titleEl = box.querySelector('.gallery-lightbox__title');
  const countEl = box.querySelector('.gallery-lightbox__count');
  const stageImg = box.querySelector('.gallery-lightbox__stage img');
  const thumbsBox = box.querySelector('.gallery-lightbox__thumbs');

  let photos = [];
  let title = '';
  let index = 0;
  let lastTrigger = null;

  function show(i) {
    if (!photos.length) return;
    index = (i + photos.length) % photos.length;
    stageImg.src = photos[index];
    stageImg.alt = title + ' — foto ' + (index + 1) + ' de ' + photos.length;
    countEl.textContent = (index + 1) + ' / ' + photos.length;
    thumbsBox.querySelectorAll('button').forEach((b, n) => {
      b.classList.toggle('is-current', n === index);
    });
  }

  function open(trigger) {
    photos = (trigger.dataset.gallery || '').split(',').map(s => s.trim()).filter(Boolean);
    title = trigger.dataset.galleryTitle || '';
    if (!photos.length) return;
    lastTrigger = trigger;
    titleEl.textContent = title;
    thumbsBox.innerHTML = photos.map((src, n) =>
      '<button type="button" data-go="' + n + '" aria-label="Foto ' + (n + 1) + '">' +
      '<img src="' + src + '" alt="" loading="lazy"></button>'
    ).join('');
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    show(0);
    box.querySelector('.drawer-close').focus();
  }

  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  triggers.forEach(t => t.addEventListener('click', () => open(t)));
  box.querySelector('.drawer-close').addEventListener('click', close);
  box.querySelector('.gallery-nav--prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.gallery-nav--next').addEventListener('click', () => show(index + 1));

  thumbsBox.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) show(+b.dataset.go);
  });

  document.addEventListener('keydown', e => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // deslizar con el dedo en móvil
  let startX = null;
  box.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();
