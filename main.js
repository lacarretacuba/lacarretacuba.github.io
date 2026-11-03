/* La Carreta · movimiento
   Una idea: la rueda manda. Gira con el scroll y el carro avanza. */

(function () {
  var root = document.documentElement;
  var nav = document.getElementById('nav');

  // Si GSAP no carga, la página queda visible tal cual.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js');
  }

  // ---- Barra de navegación: se hace sólida al salir del hero ----
  function onScroll() {
    nav.classList.toggle('solida', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Formulario: compone el mensaje y abre WhatsApp ----
  var I = window.IDIOMA || { t: function (es) { return es; }, local: function () { return 'es-ES'; } };
  var WHATSAPP = '5350990383'; // +53 5099 0383, el número de reservas de su cartel

  var form = document.getElementById('form-reserva');
  var aviso = document.getElementById('ticket-aviso');
  var fecha = document.getElementById('f-fecha');
  var hoy = new Date();
  fecha.min = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  function setError(name, msg) {
    var campo = form.elements[name];
    var out = form.querySelector('[data-error="' + name + '"]');
    if (out) out.textContent = msg;
    if (campo) campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  // "2026-11-04" -> "miércoles 4 de noviembre" (o "Wednesday, November 4")
  function diaEnPalabras(v) {
    var p = v.split('-');
    var t = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(I.local(), { weekday: 'long', day: 'numeric', month: 'long' });
    return I.local() === 'es-ES' ? t.replace(',', '') : t;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var ok = true;
    var nombre = (d.get('nombre') || '').trim();
    setError('nombre', nombre ? '' : I.t('tu nombre', 'your name')); if (!nombre) ok = false;
    setError('fecha', d.get('fecha') ? '' : I.t('el día', 'the day')); if (!d.get('fecha')) ok = false;
    setError('hora', d.get('hora') ? '' : I.t('la hora', 'the time')); if (!d.get('hora')) ok = false;
    if (!ok) {
      aviso.textContent = I.t('Completa los campos marcados para enviar la reserva.', 'Fill in the marked fields to send your booking.');
      var primero = form.querySelector('[aria-invalid="true"]');
      if (primero) primero.focus();
      return;
    }
    var texto = I.t('Hola, quiero reservar en La Carreta.', 'Hi, I would like to book a table at La Carreta.') + '\n' +
      I.t('Nombre: ', 'Name: ') + nombre + '\n' +
      I.t('Día: ', 'Day: ') + diaEnPalabras(d.get('fecha')) + '\n' +
      I.t('Hora: ', 'Time: ') + d.get('hora') + '\n' +
      I.t('Personas: ', 'Guests: ') + d.get('personas') +
      ((d.get('notas') || '').trim() ? '\n' + I.t('Notas: ', 'Notes: ') + d.get('notas').trim() : '');
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    aviso.textContent = I.t('Abriendo WhatsApp con tu reserva escrita. La mesa queda confirmada cuando el restaurante te responda.', 'Opening WhatsApp with your booking written out. Your table is confirmed once the restaurant replies.');
    window.open(url, '_blank', 'noopener');
  });

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var ease = 'expo.out';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wipe = { clipPath: 'inset(-12% -6% -12% -6%)' };

  if (reduce) return;

  // ---- Hero: el rotulista pinta, la tablilla cuelga ----
  var tl = gsap.timeline({ defaults: { ease: ease } });
  tl.to('.r1 .trazo', Object.assign({ duration: 1.1 }, wipe), 0.15)
    .to('.r2 .trazo', Object.assign({ duration: 1.5 }, wipe), 0.5)
    .to('.hero-lema', { opacity: 1, translate: '0 0', duration: 1 }, 1.15)
    .to('.hero-lede', { opacity: 1, translate: '0 0', duration: 1 }, 1.3)
    .fromTo('.tablilla', { opacity: 0, y: -90 }, { opacity: 1, y: 0, duration: 1.6, ease: 'elastic.out(1, 0.55)' }, 0.9)
    .from('#rueda-hero', { scale: 0.86, duration: 2.4 }, 0)
    .from('.hero-rueda', { opacity: 0, duration: 1.6 }, 0);

  // ---- La rueda del hero gira con el scroll de toda la página ----
  gsap.to('#rueda-hero', {
    rotation: 540, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.6 }
  });
  gsap.to('#rueda-pie', {
    rotation: -200, ease: 'none',
    scrollTrigger: { trigger: '#reservar', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 }
  });

  // ---- Titulares: cada sección los pinta a su manera ----
  gsap.utils.toArray('.rotulo-medio .trazo').forEach(function (el, i) {
    gsap.to(el, Object.assign({
      duration: 1.4, ease: ease,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    }, wipe));
  });

  // ---- La casa: fotos entran como cajas descargadas ----
  gsap.from('.ph-casa', {
    y: 90, rotate: 7, opacity: 0, duration: 1.4, ease: ease,
    scrollTrigger: { trigger: '.casa-grid', start: 'top 70%' }
  });
  gsap.from('.ph-casa-2', {
    y: 120, rotate: -10, opacity: 0, duration: 1.4, delay: 0.15, ease: ease,
    scrollTrigger: { trigger: '.casa-grid', start: 'top 70%' }
  });
  gsap.from('.caja-estarcida', {
    y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: ease,
    scrollTrigger: { trigger: '.estarcidos', start: 'top 88%' }
  });

  // ---- Platos: las tablillas se descargan una a una; la rueda del fondo gira con la sección ----
  gsap.utils.toArray('.plato').forEach(function (el, i) {
    var lado = (i % 2 ? 1 : -1);
    gsap.from(el, {
      y: 90, x: lado * 24, rotate: lado * 5, opacity: 0, duration: 1.3, ease: ease,
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });
  gsap.to('#rueda-carga', {
    rotation: 360, ease: 'none',
    scrollTrigger: { trigger: '#platos', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
  });
  // ---- Voces: las notas caen colgadas y se balancean ----
  gsap.utils.toArray('.nota').forEach(function (el, i) {
    gsap.from(el, {
      rotate: i % 2 ? -14 : 14, y: -70, opacity: 0, duration: 1.8, delay: i * 0.12,
      ease: 'elastic.out(1, 0.5)',
      scrollTrigger: { trigger: '.voces-colgadas', start: 'top 72%' }
    });
  });

  // ---- Reservar: el ticket sale de la pared ----
  gsap.from('.ticket', {
    y: 80, rotate: 2.5, opacity: 0, duration: 1.3, ease: ease,
    scrollTrigger: { trigger: '.ticket', start: 'top 85%' }
  });
  gsap.from('.datos > div', {
    x: -30, opacity: 0, duration: 0.9, stagger: 0.1, ease: ease,
    scrollTrigger: { trigger: '.datos', start: 'top 88%' }
  });

  // ---- Botones principales: imán suave (solo con ratón) ----
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.tablilla .btn, .btn-grande').forEach(function (btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.12);
        qy((e.clientY - (r.top + r.height / 2)) * 0.25);
      });
      btn.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();

/* Los precios de «Lo mejor de la carta» y de la cafetería salen de carta-datos.js,
   así lo que se cambie en el panel de administración también se ve aquí. */
(function () {
  if (!window.CARTA) return;
  var I = window.IDIOMA || { en: function () { return false; }, alCambiar: function () {} };
  var precios = {};
  function leer() {
    precios = {};
    window.CARTA.secciones.forEach(function (s) {
      s.items.forEach(function (it) { precios[it[0]] = it; });
    });
  }
  function cup(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, I.en() ? ',' : '.') + ' ' + window.CARTA.moneda; }
  function pintar() {
    leer();
    document.querySelectorAll('#platos .plato').forEach(function (art) {
      var h = art.querySelector('.plato-nombre');
      var p = art.querySelector('.plato-precio');
      var it = h && p && precios[h.textContent.trim()];
      if (!it) return;
      p.querySelector('span').textContent = it[1];
      p.querySelector('strong').textContent = cup(it[3]);
    });
    document.querySelectorAll('.cafe-item').forEach(function (li) {
      var it = precios[li.dataset.plato];
      if (it) li.querySelector('.cafe-precio').textContent = cup(it[3]);
    });
  }
  pintar();
  I.alCambiar(pintar);
  // si la web está publicada y la carta se cambió desde el panel, poner los precios nuevos
  if (window.CARTA_ONLINE) window.CARTA_ONLINE.then(function (c) { if (c) pintar(); });
})();

/* Jueves: fecha del próximo concierto y reserva por WhatsApp con nombre y personas */
(function () {
  var fecha = document.getElementById('jueves-fecha');
  var boleto = document.getElementById('boleto');
  if (!fecha || !boleto) return;
  var RESERVAS = '5350990383'; // número de reservas del cartel de La Carreta
  var ENTRADA = 1000;          // CUP por persona
  var MIN = 1, MAX = 20;

  var I = window.IDIOMA || { t: function (es) { return es; }, en: function () { return false; }, local: function () { return 'es-ES'; }, alCambiar: function () {} };
  var hoy = new Date();
  var dias = (4 - hoy.getDay() + 7) % 7; // 4 = jueves
  var jueves = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias);
  var texto;
  function pintarFecha() {
    texto = jueves.toLocaleDateString(I.local(), { day: 'numeric', month: 'long' });
    fecha.textContent = dias === 0 ? I.t('Hoy, ', 'Today, ') + texto : texto;
  }
  pintarFecha();

  var nombre = document.getElementById('j-nombre');
  var salida = document.getElementById('j-personas');
  var total = document.getElementById('j-total');
  var error = document.getElementById('j-error');
  var aviso = document.getElementById('j-aviso');
  var personas = 2;

  function cup(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, I.en() ? ',' : '.') + ' CUP'; }
  function pintar() {
    salida.textContent = personas;
    total.textContent = cup(personas * ENTRADA);
    boleto.querySelector('[data-paso="-1"]').disabled = personas <= MIN;
    boleto.querySelector('[data-paso="1"]').disabled = personas >= MAX;
  }
  boleto.querySelectorAll('[data-paso]').forEach(function (b) {
    b.addEventListener('click', function () {
      personas = Math.min(MAX, Math.max(MIN, personas + Number(b.dataset.paso)));
      pintar();
    });
  });
  nombre.addEventListener('input', function () {
    if (nombre.value.trim()) { error.textContent = ''; nombre.setAttribute('aria-invalid', 'false'); }
  });

  boleto.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = nombre.value.trim();
    if (!n) {
      error.textContent = I.t('Escribe a nombre de quién va la reserva.', 'Write the name for the booking.');
      nombre.setAttribute('aria-invalid', 'true');
      nombre.focus();
      return;
    }
    var msg = I.t('Hola, quiero reservar para la Noche romántica con Elioveliz.', 'Hi, I would like to book for the Romantic Night with Elioveliz.') + '\n' +
      I.t('Jueves: ', 'Thursday: ') + texto + '\n' +
      I.t('A nombre de: ', 'Name: ') + n + '\n' +
      I.t('Personas: ', 'Guests: ') + personas + '\n' +
      I.t('Entrada: ', 'Entry: ') + cup(personas * ENTRADA) + ' (' + cup(ENTRADA) + I.t(' por persona)', ' per person)');
    aviso.textContent = I.t('Abriendo WhatsApp con tu reserva escrita. Queda confirmada cuando el restaurante te responda.', 'Opening WhatsApp with your booking written out. It is confirmed once the restaurant replies.');
    window.open('https://wa.me/' + RESERVAS + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });

  pintar();
  I.alCambiar(function () { pintarFecha(); pintar(); error.textContent = ''; aviso.textContent = ''; });
})();

/* Jueves: guirnalda de bombillas que se encienden una a una al llegar */
(function () {
  var cable = document.getElementById('cable');
  var caja = document.getElementById('bombillas');
  if (!cable || !caja) return;
  var largo = cable.getTotalLength();
  var N = 15;
  var bombillas = [];
  // Se colocan en % sobre el mismo cable, así siguen redondas aunque el SVG se estire
  for (var i = 1; i <= N; i++) {
    var pt = cable.getPointAtLength(largo * i / (N + 1));
    var b = document.createElement('span');
    b.className = 'bombilla';
    b.style.left = (pt.x / 1200 * 100) + '%';
    b.style.top = (pt.y / 110 * 100) + '%';
    caja.appendChild(b);
    bombillas.push(b);
  }

  function encender() {
    bombillas.forEach(function (b, i) { setTimeout(function () { b.classList.add('encendida'); }, i * 90); });
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { bombillas.forEach(function (b) { b.classList.add('encendida'); }); return; }
  var io = new IntersectionObserver(function (e) {
    if (e[0].isIntersecting) { encender(); io.disconnect(); }
  }, { threshold: 0.25 });
  io.observe(document.getElementById('jueves'));
})();
