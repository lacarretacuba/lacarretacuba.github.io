/* La Carreta · carta al día desde internet
   - Con servidor (Netlify o hosting PHP): pide la carta guardada desde el panel (api/carta).
   - En GitHub Pages: vuelve a pedir carta-datos.js saltándose la caché, por si se acaba de cambiar.
   - Sin internet, o abierta desde una memoria USB: se queda con la de carta-datos.js.
   window.CARTA_ONLINE es una promesa: devuelve la carta nueva, o null si no hay cambios. */

(function () {
  var local = window.CARTA;
  var enGithub = /\.github\.io$/i.test(location.hostname);
  window.CARTA_ONLINE = new Promise(function (listo) {
    if (location.protocol === 'file:' || !window.fetch) return listo(null);
    var hecho = false;
    function fin(v) { if (!hecho) { hecho = true; listo(v); } }
    function usar(c) {
      if (c && c.secciones && c.secciones.length && JSON.stringify(c.secciones) !== JSON.stringify(local.secciones)) {
        window.CARTA = c;
        fin(c);
      } else fin(null);
    }
    setTimeout(function () { fin(null); }, 4000); // conexión lenta: no esperar más

    if (enGithub) {
      fetch('carta-datos.js?v=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.text() : null; })
        .then(function (t) {
          if (!t) return fin(null);
          var w = {};
          new Function('window', t)(w);
          usar(w.CARTA);
        })
        .catch(function () { fin(null); });
      return;
    }

    fetch('api/carta', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(usar)
      .catch(function () { fin(null); });
  });
})();
