/* La Carreta · guardar la carta en GitHub (web publicada en GitHub Pages)
   GitHub Pages no tiene servidor, así que el panel guarda el archivo carta-datos.js
   directamente en el repositorio con la API de GitHub. GitHub vuelve a publicar la web sola
   (1-2 minutos) y cada guardado queda como una versión a la que se puede volver.

   El encargado entra con una "llave" de GitHub (token de acceso fino, solo para este
   repositorio y solo con permiso de "Contents"). La llave nunca va en el código. */

(function () {
  var API = 'https://api.github.com';
  var ARCHIVO = 'carta-datos.js';

  // En usuario.github.io/repositorio se deduce todo de la dirección
  function deducir() {
    var prueba = /[?&]github-prueba=([^&]+)/.exec(location.search); // solo para probar en el ordenador
    if (prueba && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      var p = decodeURIComponent(prueba[1]).split('/');
      return { api: 'http://127.0.0.1:5177', owner: p[0], repo: p[1], rama: 'main' };
    }
    var m = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
    if (!m) return null;
    // Se mira dónde está este mismo archivo: "/github-carta.js" -> web en la raíz (repositorio
    // usuario.github.io); "/algo/github-carta.js" -> web de proyecto (repositorio "algo")
    var src = (document.currentScript && document.currentScript.src) || '';
    var carpeta = src ? new URL(src).pathname.split('/').slice(1, -1) : [];
    var repo = carpeta.length ? carpeta[0] : m[1].toLowerCase() + '.github.io';
    return { api: API, owner: m[1], repo: repo, rama: 'main' };
  }

  var cfg = deducir();
  if (!cfg) return;

  function b64aTexto(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  function textoAb64(txt) {
    var bytes = new TextEncoder().encode(txt), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  // carta-datos.js es un script ("window.CARTA = {...}"): se ejecuta aparte para leer la carta
  function leerCarta(texto) {
    var w = {};
    new Function('window', texto)(w);
    if (!w.CARTA || !w.CARTA.secciones) throw new Error('El archivo de la carta no tiene el formato esperado.');
    return w.CARTA;
  }

  function pedir(llave, ruta, opciones) {
    opciones = opciones || {};
    opciones.headers = {
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      authorization: 'Bearer ' + llave,
    };
    if (opciones.body) { opciones.body = JSON.stringify(opciones.body); opciones.headers['content-type'] = 'application/json'; }
    opciones.cache = 'no-store';
    return fetch(cfg.api + ruta, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.ok) return d;
        var e = new Error(mensaje(r.status, d));
        e.estado = r.status;
        throw e;
      });
    });
  }
  function mensaje(estado, d) {
    if (estado === 401) return 'La llave no es válida o ha caducado. Crea una nueva en GitHub.';
    if (estado === 403 || estado === 404) return 'Esa llave no tiene permiso para cambiar esta web. Revisa que sea del repositorio ' + cfg.repo + ' con permiso de «Contents: Read and write».';
    if (estado === 409) return 'Alguien guardó otra versión a la vez. Recarga la página y vuelve a intentarlo.';
    if (estado === 422) return 'GitHub no aceptó el cambio. Recarga la página y vuelve a intentarlo.';
    return (d && d.message) ? 'GitHub: ' + d.message : 'No se pudo conectar con GitHub.';
  }
  var base = '/repos/' + cfg.owner + '/' + cfg.repo;

  window.GITHUB_CARTA = {
    repo: cfg.owner + '/' + cfg.repo,

    // Comprueba la llave: tiene que poder escribir en el repositorio
    comprobar: function (llave) {
      return pedir(llave, base).then(function (d) {
        if (!d.permissions || !d.permissions.push) throw new Error(mensaje(403));
        cfg.rama = d.default_branch || cfg.rama;
        return true;
      });
    },

    // Carta actual del repositorio (y la "sha" que GitHub pide para guardar encima)
    cargar: function (llave) {
      return pedir(llave, base + '/contents/' + ARCHIVO + '?ref=' + encodeURIComponent(cfg.rama)).then(function (d) {
        return { carta: leerCarta(b64aTexto(d.content)), sha: d.sha };
      });
    },

    guardar: function (llave, contenido, sha, mensajeCommit) {
      return pedir(llave, base + '/contents/' + ARCHIVO, { method: 'PUT', body: {
        message: mensajeCommit, content: textoAb64(contenido), sha: sha, branch: cfg.rama,
      } }).then(function (d) { return { sha: d.content.sha }; });
    },

    // Últimas versiones guardadas de la carta
    versiones: function (llave) {
      return pedir(llave, base + '/commits?path=' + ARCHIVO + '&sha=' + encodeURIComponent(cfg.rama) + '&per_page=15').then(function (lista) {
        return lista.map(function (c) { return { id: c.sha, cuando: c.commit.author.date, mensaje: c.commit.message.split('\n')[0] }; });
      });
    },

    // Contenido de la carta en una versión anterior
    version: function (llave, id) {
      return pedir(llave, base + '/contents/' + ARCHIVO + '?ref=' + encodeURIComponent(id)).then(function (d) {
        return leerCarta(b64aTexto(d.content));
      });
    },
  };
})();
