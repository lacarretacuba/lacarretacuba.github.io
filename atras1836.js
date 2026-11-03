/* La Carreta · panel para administrar la carta
   Funciona de tres maneras:

   GITHUB (web publicada en GitHub Pages): se entra con una llave de GitHub y el panel guarda
   carta-datos.js en el repositorio (ver github-carta.js). Se ve en la web en 1-2 minutos.

   ONLINE (web publicada en Netlify): la clave se comprueba en el servidor (variable CARRETA_CLAVE
   en Netlify), los cambios se guardan en internet y se ven al momento en la carta y la portada.
   Antes de cada cambio queda una copia, para poder volver atrás.

   LOCAL (abierta desde la carpeta o la memoria USB, sin servidor): edita los datos y vuelve a
   escribir el archivo carta-datos.js. Aquí la clave es solo de cortesía: quien sepa abrir este
   archivo la puede leer. Por eso el modo local solo se permite en el propio ordenador. */

(function () {
  var CLAVE_LOCAL = 'carreta2026';     // solo para el modo local; online manda la clave de Netlify
  var puerta = document.getElementById('puerta');
  var panel = document.getElementById('panel');
  var estado = document.getElementById('estado');
  var contenedor = document.getElementById('secciones');
  var errorPuerta = document.getElementById('puerta-error');
  var botonEntrar = document.querySelector('#puerta-form button');

  var enEsteOrdenador = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var modo = null;            // 'github' | 'online' | 'local'
  var token = null;
  var GH = window.GITHUB_CARTA || null;
  var shaActual = null;       // modo GitHub: versión del archivo sobre la que se guarda
  var BORRADOR = 'lacarreta-carta-borrador';
  var original, carta, cambios = false;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function plano(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  // ---- ¿Hay servidor? ----
  function api(ruta, opciones) {
    opciones = opciones || {};
    opciones.headers = opciones.headers || {};
    if (token) opciones.headers.authorization = 'Bearer ' + token;
    if (opciones.body && typeof opciones.body !== 'string') {
      opciones.body = JSON.stringify(opciones.body);
      opciones.headers['content-type'] = 'application/json';
    }
    opciones.cache = 'no-store';
    return fetch(ruta, opciones).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { estado: r.status, datos: d }; });
    });
  }

  var listo = (GH ? Promise.resolve('github') : location.protocol === 'file:' ? Promise.resolve(null) : api('api/estado').catch(function () { return null; }))
    .then(function (r) {
      if (r === 'github') {
        modo = 'github';
        document.body.dataset.modo = 'github';
        BORRADOR = 'lacarreta-carta-borrador-github';
        prepararPuertaGithub();
        try { token = sessionStorage.getItem('lacarreta-gh') || localStorage.getItem('lacarreta-gh'); } catch (e) {}
        if (token) return GH.comprobar(token).then(cargarYAbrir).catch(function (e) { cerrarSesion(e.message); });
        return;
      }
      if (r && r.estado === 200 && r.datos.ok) modo = 'online';
      else if (r && r.estado === 503) { modo = 'online'; errorPuerta.textContent = r.datos.error; }
      else if (enEsteOrdenador) modo = 'local';
      else { modo = null; errorPuerta.textContent = 'No se puede conectar con el servidor. Revisa la conexión y recarga la página.'; }
      document.body.dataset.modo = modo || 'sin-servidor';
      if (modo === 'online') BORRADOR = 'lacarreta-carta-borrador-online';
      try { token = sessionStorage.getItem('lacarreta-token'); } catch (e) {}
      if (modo === 'online' && token) return cargarYAbrir();
      if (modo === 'local') { try { if (sessionStorage.getItem('lacarreta-admin') === '1') cargarYAbrir(); } catch (e) {} }
    });

  // ---- Entrada ----
  document.getElementById('puerta-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var campo = document.getElementById('clave');
    listo.then(function () {
      if (modo === 'local') {
        if (campo.value === CLAVE_LOCAL) {
          try { sessionStorage.setItem('lacarreta-admin', '1'); } catch (err) {}
          cargarYAbrir();
        } else { errorPuerta.textContent = 'Clave incorrecta.'; campo.select(); }
        return;
      }
      if (modo === 'github') {
        var llave = campo.value.trim();
        if (!llave) return;
        botonEntrar.disabled = true;
        errorPuerta.textContent = 'Comprobando la llave…';
        GH.comprobar(llave).then(function () {
          botonEntrar.disabled = false;
          errorPuerta.textContent = '';
          token = llave;
          var recordar = document.getElementById('recordar');
          try {
            sessionStorage.setItem('lacarreta-gh', llave);
            if (recordar && recordar.checked) localStorage.setItem('lacarreta-gh', llave);
          } catch (err) {}
          campo.value = '';
          cargarYAbrir();
        }).catch(function (err) { botonEntrar.disabled = false; errorPuerta.textContent = err.message || 'No se pudo conectar con GitHub.'; });
        return;
      }
      if (modo !== 'online') return;
      botonEntrar.disabled = true;
      errorPuerta.textContent = '';
      api('api/sesion', { method: 'POST', body: { clave: campo.value } }).then(function (r) {
        botonEntrar.disabled = false;
        if (r.estado !== 200) { errorPuerta.textContent = r.datos.error || 'No se pudo entrar.'; campo.select(); return; }
        token = r.datos.token;
        try { sessionStorage.setItem('lacarreta-token', token); } catch (err) {}
        campo.value = '';
        cargarYAbrir();
      }).catch(function () { botonEntrar.disabled = false; errorPuerta.textContent = 'Sin conexión. Inténtalo de nuevo.'; });
    });
  });

  function cerrarSesion(msg) {
    token = null;
    try { sessionStorage.removeItem('lacarreta-token'); sessionStorage.removeItem('lacarreta-gh'); } catch (e) {}
    panel.hidden = true;
    puerta.hidden = false;
    errorPuerta.textContent = msg || '';
  }

  // ---- Datos de trabajo: el borrador, la carta online o el archivo ----
  function cargarYAbrir() {
    var base = modo === 'github'
      ? GH.cargar(token).then(function (r) { shaActual = r.sha; return r.carta; })
      : modo === 'online'
      ? api('api/carta').then(function (r) { return r.estado === 200 ? r.datos : window.CARTA; })
      : Promise.resolve(window.CARTA);
    return base.then(function (c) {
      original = JSON.stringify({ moneda: c.moneda, secciones: c.secciones });
      carta = null;
      try {
        var b = localStorage.getItem(BORRADOR);
        if (b && b === original) localStorage.removeItem(BORRADOR); // ya guardado
        else if (b) carta = JSON.parse(b);
      } catch (err) {}
      if (!carta) carta = JSON.parse(original);
      cambios = JSON.stringify(carta) !== original;
      abrir();
    }).catch(function (e) { cerrarSesion(modo === 'github' && e && e.message ? e.message : 'Sin conexión. Inténtalo de nuevo.'); });
  }

  function pintarEstado(msg) {
    estado.textContent = msg || (cambios ? 'Cambios sin guardar' : 'Sin cambios');
    estado.classList.toggle('pendiente', cambios && !msg);
  }
  function anotar() {
    cambios = JSON.stringify(carta) !== original;
    try {
      if (cambios) localStorage.setItem(BORRADOR, JSON.stringify(carta));
      else localStorage.removeItem(BORRADOR);
    } catch (err) {}
    pintarEstado();
  }

  // ---- Pintar el editor ----
  function campo(valor, etiqueta, tipo, alCambiar, cls) {
    var l = el('label', 'celda ' + (cls || ''));
    l.appendChild(el('span', 'celda-etiqueta', etiqueta));
    var i = el('input');
    i.type = tipo || 'text';
    i.value = valor;
    if (tipo === 'number') { i.min = '0'; i.step = '1'; i.inputMode = 'numeric'; }
    i.addEventListener('input', function () { alCambiar(i); anotar(); });
    l.appendChild(i);
    return l;
  }

  function filaPlato(sec, it) {
    var fila = el('div', 'fila');
    fila.appendChild(campo(it[0], 'Nombre', 'text', function (i) { it[0] = i.value; i.setAttribute('aria-invalid', i.value.trim() ? 'false' : 'true'); }, 'c-nombre'));
    fila.appendChild(campo(it[1], 'Medida', 'text', function (i) { it[1] = i.value; }, 'c-medida'));
    fila.appendChild(campo(it[2], 'En inglés / descripción', 'text', function (i) { it[2] = i.value; }, 'c-en'));
    fila.appendChild(campo(it[3], 'Precio (CUP)', 'number', function (i) {
      var n = Number(i.value);
      var ok = i.value !== '' && n >= 0;
      i.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (ok) it[3] = Math.round(n);
    }, 'c-precio'));
    var quitar = el('button', 'quitar', '×');
    quitar.type = 'button';
    quitar.setAttribute('aria-label', 'Quitar ' + (it[0] || 'este plato'));
    quitar.addEventListener('click', function () {
      if (!confirm('¿Quitar «' + (it[0] || 'este plato') + '» de la carta?')) return;
      sec.items.splice(sec.items.indexOf(it), 1);
      fila.remove();
      anotar();
    });
    fila.appendChild(quitar);
    return fila;
  }

  function pintar() {
    contenedor.textContent = '';
    var grupo = null;
    carta.secciones.forEach(function (sec) {
      if (sec.grupo !== grupo) {
        grupo = sec.grupo;
        contenedor.appendChild(el('h2', 'grupo-titulo', { cocina: 'Cocina', bebidas: 'La barra', cafeteria: 'Cafetería' }[grupo] || grupo));
      }
      var caja = el('details', 'seccion-admin');
      var sum = el('summary');
      sum.appendChild(el('span', 'sec-nombre', sec.es));
      var cuenta = el('span', 'sec-cuenta', sec.items.length + (sec.items.length === 1 ? ' plato' : ' platos'));
      sum.appendChild(cuenta);
      caja.appendChild(sum);

      var lista = el('div', 'lista');
      sec.items.forEach(function (it) { lista.appendChild(filaPlato(sec, it)); });
      caja.appendChild(lista);

      var nuevo = el('button', 'btn btn-oscuro btn-mini anadir', '+ Añadir plato en ' + sec.es);
      nuevo.type = 'button';
      nuevo.addEventListener('click', function () {
        var it = ['', '', '', 0];
        sec.items.push(it);
        var f = filaPlato(sec, it);
        lista.appendChild(f);
        f.querySelector('input').focus();
        anotar();
      });
      caja.appendChild(nuevo);

      // la cuenta de platos se actualiza sola
      new MutationObserver(function () { cuenta.textContent = lista.children.length + (lista.children.length === 1 ? ' plato' : ' platos'); }).observe(lista, { childList: true });
      contenedor.appendChild(caja);
    });
  }

  // ---- Buscar ----
  document.getElementById('filtro').addEventListener('input', function (e) {
    var q = plano(e.target.value.trim());
    contenedor.querySelectorAll('.seccion-admin').forEach(function (d) {
      var hay = 0;
      d.querySelectorAll('.fila').forEach(function (f) {
        var nombre = plano(f.querySelector('.c-nombre input').value + ' ' + f.querySelector('.c-en input').value);
        var ok = !q || nombre.indexOf(q) > -1;
        f.hidden = !ok;
        if (ok) hay++;
      });
      d.hidden = q && !hay;
      if (q && hay) d.open = true;
    });
  });

  // ---- Ajuste general de precios ----
  document.getElementById('ajuste-aplicar').addEventListener('click', function () {
    var pct = Number(document.getElementById('ajuste-pct').value);
    var paso = Number(document.getElementById('ajuste-redondeo').value);
    if (!pct) return;
    var total = 0;
    carta.secciones.forEach(function (s) { total += s.items.length; });
    if (!confirm('¿' + (pct > 0 ? 'Subir' : 'Bajar') + ' un ' + Math.abs(pct) + ' % los ' + total + ' precios de la carta?')) return;
    carta.secciones.forEach(function (s) {
      s.items.forEach(function (it) { it[3] = Math.max(0, Math.round(it[3] * (1 + pct / 100) / paso) * paso); });
    });
    var abiertas = Array.prototype.map.call(contenedor.querySelectorAll('.seccion-admin'), function (d) { return d.open; });
    pintar();
    contenedor.querySelectorAll('.seccion-admin').forEach(function (d, i) { d.open = abiertas[i]; });
    anotar();
  });

  // ---- Guardar ----
  function limpia() {
    return {
      moneda: carta.moneda,
      secciones: carta.secciones.map(function (s) {
        return { id: s.id, grupo: s.grupo, es: s.es, en: s.en, items: s.items
          .filter(function (it) { return String(it[0]).trim(); })
          .map(function (it) { return [String(it[0]).trim(), String(it[1]).trim(), String(it[2]).trim(), Math.round(Number(it[3]) || 0)]; }) };
      })
    };
  }

  function validar() {
    var malo = contenedor.querySelector('[aria-invalid="true"]');
    if (!malo) return true;
    var d = malo.closest('details'); if (d) d.open = true;
    malo.focus();
    pintarEstado('Revisa el campo marcado en rojo');
    return false;
  }

  function guardado(msg) {
    original = JSON.stringify(carta);
    anotar();
    pintarEstado(msg || 'Carta guardada ✓');
    setTimeout(function () { pintarEstado(); }, 5000);
  }

  var botonGuardar = document.getElementById('guardar');
  botonGuardar.addEventListener('click', function () {
    if (!validar()) return;
    if (modo === 'github') return guardarGithub();
    if (modo === 'online') return guardarOnline();
    guardarArchivo();
  });

  function guardarGithub() {
    var datos = limpia();
    botonGuardar.disabled = true;
    pintarEstado('Guardando en GitHub…');
    var cuantos = datos.secciones.reduce(function (n, s) { return n + s.items.length; }, 0);
    GH.guardar(token, texto(), shaActual, 'Carta actualizada desde el panel (' + cuantos + ' platos)').then(function (r) {
      botonGuardar.disabled = false;
      shaActual = r.sha;
      carta = datos;
      try { localStorage.removeItem(BORRADOR); } catch (e) {}
      guardado('Guardada ✓ Se verá en la web en 1-2 minutos');
      cargarCopias();
    }).catch(function (e) {
      botonGuardar.disabled = false;
      if (e.estado === 401) { cerrarSesion(e.message + ' Tus cambios siguen guardados en este navegador.'); return; }
      pintarEstado(e.message || 'No se pudo guardar. Tus cambios siguen en este navegador.');
    });
  }

  function guardarOnline() {
    var datos = limpia();
    botonGuardar.disabled = true;
    pintarEstado('Guardando…');
    api('api/carta', { method: 'PUT', body: datos }).then(function (r) {
      botonGuardar.disabled = false;
      if (r.estado === 401) { cerrarSesion('La sesión ha caducado. Vuelve a entrar: tus cambios siguen guardados en este navegador.'); return; }
      if (r.estado !== 200) { pintarEstado(r.datos.error || 'No se pudo guardar. Inténtalo de nuevo.'); return; }
      carta = datos;
      try { localStorage.removeItem(BORRADOR); } catch (e) {}
      guardado('Guardada en internet ✓ Ya se ve en la carta');
      cargarCopias();
    }).catch(function () {
      botonGuardar.disabled = false;
      pintarEstado('Sin conexión: no se guardó. Tus cambios siguen en este navegador.');
    });
  }

  // Modo local: escribir carta-datos.js
  function texto() {
    var q = JSON.stringify;
    var c = limpia();
    var out = '/* La Carreta · datos de la carta\n' +
      '   Este es el ÚNICO archivo que hay que tocar para cambiar platos o precios.\n' +
      '   Cada plato: [nombre, medida, nombre en inglés o descripción, precio en CUP]\n' +
      '   Guardado desde el panel de administración el ' + new Date().toLocaleString('es-ES') + '. */\n\n' +
      'window.CARTA = {\n  moneda: ' + q(c.moneda) + ',\n  secciones: [\n';
    out += c.secciones.map(function (s) {
      var items = s.items.map(function (it) { return '      [' + q(it[0]) + ', ' + q(it[1]) + ', ' + q(it[2]) + ', ' + it[3] + ']'; });
      return '    { id: ' + q(s.id) + ', grupo: ' + q(s.grupo) + ', es: ' + q(s.es) + ', en: ' + q(s.en) + ', items: [\n' +
        items.join(',\n') + '\n    ]}';
    }).join(',\n') + '\n  ]\n};\n';
    return out;
  }
  function guardarArchivo() {
    var contenido = texto();
    var copia = function () { try { localStorage.setItem(BORRADOR, JSON.stringify(carta)); } catch (e) {} };
    // Chrome y Edge: se elige el archivo y se sobrescribe directamente
    if (window.showSaveFilePicker) {
      window.showSaveFilePicker({
        suggestedName: 'carta-datos.js',
        types: [{ description: 'Datos de la carta', accept: { 'text/javascript': ['.js'] } }]
      }).then(function (h) {
        return h.createWritable().then(function (w) { return w.write(contenido).then(function () { return w.close(); }); });
      }).then(function () { guardado(); copia(); }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // canceló el diálogo
        descargar(contenido);
      });
    } else {
      descargar(contenido);
    }
  }
  // Otros navegadores: se descarga y hay que moverlo a la carpeta la-carreta
  function descargar(contenido) {
    var a = el('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: 'text/javascript' }));
    a.download = 'carta-datos.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    guardado('Descargado: mueve carta-datos.js a la carpeta la-carreta');
    try { localStorage.setItem(BORRADOR, JSON.stringify(carta)); } catch (e) {}
  }

  // ---- Copias de seguridad (online) ----
  var copiasLista = document.getElementById('copias-lista');
  var registroLista = document.getElementById('registro-lista');
  function fecha(iso) {
    return new Date(iso).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function fechaDeCopia(clave) {
    // copias/2026-11-03T10-00-00-000Z -> fecha
    var m = clave.replace('copias/', '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/);
    return m ? fecha(m[1] + 'T' + m[2] + ':' + m[3] + ':' + m[4] + '.' + m[5] + 'Z') : clave;
  }
  function cargarCopias() {
    if (modo === 'github' && copiasLista) return cargarVersionesGithub();
    if (modo !== 'online' || !copiasLista) return;
    api('api/copias').then(function (r) {
      if (r.estado !== 200) return;
      copiasLista.textContent = '';
      if (!r.datos.copias.length) copiasLista.appendChild(el('li', 'copia-vacia', 'Todavía no hay copias. Se crea una cada vez que guardas.'));
      r.datos.copias.slice(0, 10).forEach(function (k) {
        var li = el('li', 'copia');
        li.appendChild(el('span', null, 'Carta de antes del ' + fechaDeCopia(k)));
        var b = el('button', 'btn btn-linea-oscuro btn-mini', 'Volver a esta');
        b.type = 'button';
        b.addEventListener('click', function () { restaurar(k); });
        li.appendChild(b);
        copiasLista.appendChild(li);
      });
      registroLista.textContent = '';
      r.datos.registro.slice(0, 8).forEach(function (x) {
        registroLista.appendChild(el('li', null, fecha(x.cuando) + ' · ' + (x.accion === 'restaurar' ? 'Se volvió a una copia' : 'Guardada (' + x.detalle + ')')));
      });
    });
  }
  function cargarVersionesGithub() {
    GH.versiones(token).then(function (lista) {
      copiasLista.textContent = '';
      registroLista.textContent = '';
      // la primera es la actual; las demás son versiones anteriores a las que volver
      lista.slice(1, 11).forEach(function (v) {
        var li = el('li', 'copia');
        li.appendChild(el('span', null, 'Carta del ' + fecha(v.cuando)));
        var b = el('button', 'btn btn-linea-oscuro btn-mini', 'Volver a esta');
        b.type = 'button';
        b.addEventListener('click', function () { restaurarGithub(v); });
        li.appendChild(b);
        copiasLista.appendChild(li);
      });
      if (lista.length < 2) copiasLista.appendChild(el('li', 'copia-vacia', 'Todavía no hay versiones anteriores. Se crea una cada vez que guardas.'));
      lista.slice(0, 8).forEach(function (v) { registroLista.appendChild(el('li', null, fecha(v.cuando) + ' · ' + v.mensaje)); });
    }).catch(function () {});
  }
  function restaurarGithub(v) {
    if (cambios && !confirm('Tienes cambios sin guardar que se perderán. ¿Seguir?')) return;
    if (!confirm('¿Volver a la carta del ' + fecha(v.cuando) + '? Se verá en la web en 1-2 minutos.')) return;
    pintarEstado('Recuperando esa versión…');
    GH.version(token, v.id).then(function (c) {
      carta = { moneda: c.moneda, secciones: c.secciones };
      return GH.guardar(token, texto(), shaActual, 'Vuelta a la carta del ' + fecha(v.cuando));
    }).then(function (r) {
      shaActual = r.sha;
      try { localStorage.removeItem(BORRADOR); } catch (e) {}
      pintar();
      guardado('Carta restaurada ✓ Se verá en la web en 1-2 minutos');
      cargarCopias();
    }).catch(function (e) { pintarEstado(e.message || 'No se pudo restaurar.'); });
  }

  // La puerta pide la llave de GitHub en vez de la clave
  function prepararPuertaGithub() {
    var etiqueta = document.querySelector('label[for="clave"]');
    if (etiqueta) etiqueta.textContent = 'Llave de GitHub';
    var campo = document.getElementById('clave');
    campo.autocomplete = 'off';
    campo.placeholder = 'github_pat_…';
    var ayuda = document.getElementById('puerta-ayuda');
    if (ayuda) ayuda.hidden = false;
  }

  function restaurar(k) {
    if (cambios && !confirm('Tienes cambios sin guardar que se perderán. ¿Seguir?')) return;
    if (!confirm('¿Volver a la carta de antes del ' + fechaDeCopia(k) + '? Se verá al momento en la web.')) return;
    api('api/restaurar', { method: 'POST', body: { copia: k } }).then(function (r) {
      if (r.estado === 401) { cerrarSesion('La sesión ha caducado. Vuelve a entrar.'); return; }
      if (r.estado !== 200) { pintarEstado(r.datos.error || 'No se pudo restaurar.'); return; }
      carta = { moneda: r.datos.carta.moneda, secciones: r.datos.carta.secciones };
      try { localStorage.removeItem(BORRADOR); } catch (e) {}
      pintar();
      guardado('Carta restaurada ✓');
      cargarCopias();
    });
  }

  document.getElementById('salir').addEventListener('click', function () {
    if (cambios && !confirm('Tienes cambios sin guardar. Se quedan en este navegador. ¿Salir?')) return;
    try { sessionStorage.removeItem('lacarreta-admin'); localStorage.removeItem('lacarreta-gh'); } catch (e) {}
    cerrarSesion('');
  });

  window.addEventListener('beforeunload', function (e) {
    if (cambios) { e.preventDefault(); e.returnValue = ''; }
  });

  function abrir() {
    puerta.hidden = true;
    panel.hidden = false;
    pintar();
    pintarEstado();
    cargarCopias();
  }
})();
