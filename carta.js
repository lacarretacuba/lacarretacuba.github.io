/* La Carreta · la carta
   Pinta la carta desde carta-datos.js en tres partes (cocina, barra y cafetería),
   con índice que sigue al scroll, buscador y español / inglés. */

(function () {
  var datos = window.CARTA;
  var buscar = document.getElementById('buscar');
  var vacio = document.getElementById('sin-resultados');
  var nav = document.getElementById('nav');
  var indiceBarra = document.getElementById('indice');
  var indice = document.getElementById('indice-secciones');
  if (!datos || !indice) return;

  var I = window.IDIOMA || { en: function () { return false; }, t: function (es) { return es; }, alCambiar: function () {} };

  // Cada parte de la carta tiene su bloque y su madera
  var GRUPOS = [
    { id: 'cocina', bloque: 'bloque-cocina' },
    { id: 'bebidas', bloque: 'bloque-barra', clase: 'en-barra',
      sep: { es: 'La barra', en: 'The bar', pes: 'Café, coctelería cubana, rones y algo más.', pen: 'Coffee, Cuban cocktails, rum and a little more.' } },
    { id: 'cafeteria', bloque: 'bloque-cafeteria', clase: 'en-cafe',
      sep: { es: 'La cafetería', en: 'The café', pes: 'Abierta de 8:00 am a 8:00 pm, detrás del Coppelia. Para picar algo rápido.', pen: 'Open 8:00 am to 8:00 pm, behind Coppelia. For a quick bite.' } }
  ];

  // El índice se pega justo debajo de la barra de navegación
  function altoNav() { document.documentElement.style.setProperty('--alto-nav', nav.offsetHeight + 'px'); }
  altoNav();
  window.addEventListener('resize', altoNav);

  // 12000 -> "12.000"
  function precio(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, I.en() ? ',' : '.'); }
  // Para buscar sin importar tildes ni mayúsculas
  function plano(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function bloqueDe(g) { for (var i = 0; i < GRUPOS.length; i++) if (GRUPOS[i].id === g) return GRUPOS[i]; return GRUPOS[0]; }

  var filas = [], secciones = [], enlaces = [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var primeraVez = true;

  // ---- Pintar (también al cambiar de idioma) ----
  function pintar() {
    var en = I.en();
    filas = [];
    indice.textContent = '';
    GRUPOS.forEach(function (g) {
      var cuerpo = document.querySelector('#' + g.bloque + ' .carta-cuerpo');
      cuerpo.textContent = '';
      if (g.sep) {
        var sep = el('div', 'separador');
        sep.id = 'sep-' + g.id;
        sep.innerHTML = '<svg class="separador-rueda" viewBox="0 0 600 600" aria-hidden="true"><use href="#rueda"/></svg>';
        var t = el('h2', 'rotulo-medio'); t.appendChild(el('span', 'trazo visto', en ? g.sep.en : g.sep.es));
        sep.appendChild(t);
        sep.appendChild(el('p', null, en ? g.sep.pen : g.sep.pes));
        cuerpo.appendChild(sep);
      }
    });

    datos.secciones.forEach(function (s) {
      var sec = el('section', 'seccion' + (primeraVez && !reduce ? ' entra' : ''));
      sec.id = s.id;
      sec.dataset.grupo = s.grupo;
      sec.setAttribute('aria-labelledby', 'h-' + s.id);
      var cab = el('header', 'seccion-cabeza');
      var h = el('h2', null, en ? s.en : s.es); h.id = 'h-' + s.id;
      cab.appendChild(h);
      cab.appendChild(el('span', 'estarcido', en ? s.es : s.en));
      sec.appendChild(cab);

      s.items.forEach(function (it) {
        var fila = el('div', 'item-fila');
        var linea = el('div', 'item-linea');
        var nombre = el('h3', 'item-nombre');
        var n = el('span', 'item-n', it[0]);
        nombre.appendChild(n);
        if (it[1]) nombre.appendChild(el('span', 'item-medida', it[1]));
        linea.appendChild(nombre);
        linea.appendChild(el('span', 'item-puntos'));
        var p = el('span', 'item-precio', precio(it[3]));
        p.appendChild(el('small', null, datos.moneda));
        linea.appendChild(p);
        fila.appendChild(linea);
        if (it[2]) fila.appendChild(el('p', 'item-en', it[2]));
        sec.appendChild(fila);
        filas.push({ fila: fila, n: n, nombre: it[0], clave: plano(it[0] + ' ' + it[2] + ' ' + s.es + ' ' + s.en) });
      });
      document.querySelector('#' + bloqueDe(s.grupo).bloque + ' .carta-cuerpo').appendChild(sec);

      var a = el('a', null, en ? s.en : s.es);
      a.href = '#' + s.id;
      a.dataset.grupo = s.grupo;
      a.dataset.id = s.id;
      indice.appendChild(a);
    });

    secciones = Array.prototype.slice.call(document.querySelectorAll('.carta .seccion'));
    enlaces = Array.prototype.slice.call(indice.querySelectorAll('a'));
    actual = null;
    grupoVisible = null;

    // Entrada suave solo la primera vez
    if (primeraVez && 'IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('entra'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      secciones.forEach(function (s) { io.observe(s); });
    }
    primeraVez = false;
    if (buscar.value.trim()) filtrar(); else alScroll();
  }

  // ---- Cocina / La barra / Cafetería ----
  var botones = Array.prototype.slice.call(document.querySelectorAll('.grupo-btn'));
  var grupoVisible = null;
  function mostrarGrupo(g) {
    if (g === grupoVisible) return;
    grupoVisible = g;
    botones.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.grupo === g ? 'true' : 'false'); });
    enlaces.forEach(function (a) { a.hidden = a.dataset.grupo !== g; });
    GRUPOS.forEach(function (x) { if (x.clase) indiceBarra.classList.toggle(x.clase, x.id === g); });
  }
  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      var bloque = document.getElementById(bloqueDe(b.dataset.grupo).bloque);
      var tope = nav.offsetHeight + indiceBarra.offsetHeight;
      window.scrollTo({ top: bloque.getBoundingClientRect().top + window.scrollY - tope + 2, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ---- La sección visible se marca en el índice ----
  var actual = null;
  function marcar(id) {
    if (id === actual) return;
    actual = id;
    enlaces.forEach(function (a) {
      var on = a.dataset.id === id;
      a.classList.toggle('activa', on);
      if (on) a.parentNode.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
    });
  }
  function alScroll() {
    var linea = nav.offsetHeight + indiceBarra.offsetHeight;
    // la parte de la carta es la del último bloque cuya madera ya pasó bajo el índice
    // (si el buscador vació la cocina, se empieza por la primera parte que tenga resultados)
    var grupo = null;
    GRUPOS.forEach(function (g) {
      if (!grupo && !document.getElementById(g.bloque).classList.contains('vacio')) grupo = g.id;
    });
    grupo = grupo || GRUPOS[0].id;
    GRUPOS.forEach(function (g) {
      var b = document.getElementById(g.bloque);
      if (!b.classList.contains('vacio') && b.getBoundingClientRect().top <= linea) grupo = g.id;
    });
    mostrarGrupo(grupo);
    var elegida = null;
    secciones.forEach(function (s) {
      if (!s.classList.contains('oculta') && s.getBoundingClientRect().top <= linea + 40) {
        // en columnas, quedarse con la que esté más abajo de las que ya pasaron
        if (!elegida || s.getBoundingClientRect().top > elegida.getBoundingClientRect().top) elegida = s;
      }
    });
    if (elegida) marcar(elegida.id);
  }
  window.addEventListener('scroll', alScroll, { passive: true });

  // Los rótulos fijos de la página se pintan al entrar en pantalla
  var trazos = Array.prototype.slice.call(document.querySelectorAll('.trazo'));
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io2.unobserve(e.target); } });
    });
    trazos.forEach(function (t) { io2.observe(t); });
  } else {
    trazos.forEach(function (t) { t.classList.add('visto'); });
  }

  // ---- Buscador ----
  function resaltar(f, q) {
    if (!q) { f.n.textContent = f.nombre; return; }
    var i = plano(f.nombre).indexOf(q);
    if (i < 0) { f.n.textContent = f.nombre; return; }
    f.n.textContent = '';
    f.n.appendChild(document.createTextNode(f.nombre.slice(0, i)));
    f.n.appendChild(el('mark', null, f.nombre.slice(i, i + q.length)));
    f.n.appendChild(document.createTextNode(f.nombre.slice(i + q.length)));
  }
  function filtrar() {
    var q = plano(buscar.value.trim());
    var hay = 0;
    filas.forEach(function (f) {
      var ok = !q || f.clave.indexOf(q) > -1;
      f.fila.classList.toggle('oculto', !ok);
      resaltar(f, q);
      if (ok) hay++;
    });
    secciones.forEach(function (s) {
      s.classList.remove('entra');
      s.classList.toggle('oculta', !s.querySelector('.item-fila:not(.oculto)'));
    });
    document.querySelectorAll('.separador').forEach(function (sep) { sep.classList.toggle('oculto', !!q); });
    GRUPOS.forEach(function (g) {
      var b = document.getElementById(g.bloque);
      b.classList.toggle('vacio', !b.querySelector('.seccion:not(.oculta)'));
    });
    vacio.hidden = hay > 0;
    alScroll();
  }
  buscar.addEventListener('input', function () {
    filtrar();
    // Volver al principio de la carta para ver los resultados
    var tope = nav.offsetHeight + indiceBarra.offsetHeight;
    var inicio = document.getElementById('bloque-cocina').getBoundingClientRect().top + window.scrollY - tope;
    if (buscar.value.trim() && window.scrollY > inicio) window.scrollTo(0, inicio);
  });

  // Si se llega con #cafeteria o #la-barra en el enlace, ir a esa parte
  function irAlAncla() {
    var mapa = { '#cafeteria': 'cafeteria', '#la-barra': 'bebidas' };
    var g = mapa[location.hash];
    if (!g) return;
    var bloque = document.getElementById(bloqueDe(g).bloque);
    window.scrollTo(0, bloque.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - indiceBarra.offsetHeight + 2);
  }

  I.alCambiar(pintar);
  pintar();
  // si la web está publicada y la carta se cambió desde el panel, volver a pintarla con los precios nuevos
  if (window.CARTA_ONLINE) window.CARTA_ONLINE.then(function (c) { if (c) { datos = c; pintar(); } });
  irAlAncla();
})();
