/* La Carreta · español / inglés
   Cada texto traducible lleva su versión inglesa al lado, en el HTML:
     data-en="..."            texto del elemento
     data-en-html="..."       texto con etiquetas (<br>, <strong>...)
     data-en-placeholder, data-en-aria-label, data-en-content   atributos
   El botón .idioma-btn cambia de idioma y se recuerda en este navegador.
   Si nunca se eligió, se usa el idioma del móvil u ordenador del visitante. */

(function () {
  var CLAVE = 'lacarreta-idioma';
  var ATRIBUTOS = ['placeholder', 'aria-label', 'content', 'title'];
  var actual = null;
  try { actual = localStorage.getItem(CLAVE); } catch (e) {}
  if (actual !== 'es' && actual !== 'en') actual = /^es\b/i.test(navigator.language || 'es') ? 'es' : 'en';
  var oyentes = [];

  // En elementos con iconos dentro, solo se cambia su primer texto
  function primerTexto(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) return n;
    }
    return null;
  }

  function aplicar() {
    var en = actual === 'en';
    document.documentElement.lang = actual;

    document.querySelectorAll('[data-en]').forEach(function (el) {
      var nodo = el.children.length ? primerTexto(el) : null;
      if (!('es' in el.dataset)) el.dataset.es = nodo ? nodo.textContent.trim() : el.textContent;
      var v = en ? el.dataset.en : el.dataset.es;
      if (nodo) nodo.textContent = v + ' ';
      else el.textContent = v;
    });
    document.querySelectorAll('[data-en-html]').forEach(function (el) {
      if (!('esHtml' in el.dataset)) el.dataset.esHtml = el.innerHTML;
      el.innerHTML = en ? el.dataset.enHtml : el.dataset.esHtml;
    });
    ATRIBUTOS.forEach(function (a) {
      document.querySelectorAll('[data-en-' + a + ']').forEach(function (el) {
        if (!el.hasAttribute('data-es-' + a)) el.setAttribute('data-es-' + a, el.getAttribute(a) || '');
        el.setAttribute(a, el.getAttribute('data-' + actual + '-' + a));
      });
    });
    document.querySelectorAll('.idioma-btn').forEach(function (b) {
      b.textContent = en ? 'ES' : 'EN';
      b.setAttribute('aria-label', en ? 'Ver en español' : 'View in English');
      b.setAttribute('lang', en ? 'es' : 'en');
    });
    oyentes.forEach(function (fn) { fn(actual); });
  }

  window.IDIOMA = {
    get actual() { return actual; },
    en: function () { return actual === 'en'; },
    t: function (es, en) { return actual === 'en' ? en : es; },
    // Fechas y números en el idioma activo
    local: function () { return actual === 'en' ? 'en-US' : 'es-ES'; },
    alCambiar: function (fn) { oyentes.push(fn); },
    cambiar: function (l) {
      actual = l;
      try { localStorage.setItem(CLAVE, l); } catch (e) {}
      aplicar();
    }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.idioma-btn');
    if (b) window.IDIOMA.cambiar(actual === 'en' ? 'es' : 'en');
  });

  aplicar();
})();
