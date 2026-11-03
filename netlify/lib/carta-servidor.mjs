// La Carreta · lógica del servidor para cambiar la carta por internet.
// Separada de la función de Netlify para poder probarla con un almacén falso.
//
// Rutas:
//   GET  /api/estado               -> { ok: true }  (para que el panel sepa que hay servidor)
//   GET  /api/carta                -> la carta guardada (404 si todavía no se guardó ninguna)
//   POST /api/sesion   { clave }   -> { token } válido 8 horas
//   PUT  /api/carta    (token)     -> guarda la carta, con copia de la anterior
//   GET  /api/copias   (token)     -> últimas copias y registro de cambios
//   POST /api/restaurar (token) { copia } -> vuelve a una copia
//
// La contraseña NO está en el código: se pone en Netlify como variable CARRETA_CLAVE.

import { createHmac, createHash, timingSafeEqual } from "node:crypto";

const HORAS_SESION = 8;
const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;
const MAX_COPIAS = 30;
const MAX_REGISTRO = 200;
const GRUPOS = ["cocina", "bebidas", "cafeteria"];

const json = (cuerpo, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function secreto(env) {
  // la firma de las sesiones depende de la clave: si se cambia la clave, se cierran todas las sesiones
  return createHash("sha256").update("lacarreta|" + (env.CARRETA_SECRETO || "") + "|" + env.CARRETA_CLAVE).digest();
}
function firmar(texto, env) { return createHmac("sha256", secreto(env)).update(texto).digest("base64url"); }
function iguales(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function crearToken(env, ahora) {
  const hasta = ahora + HORAS_SESION * 3600 * 1000;
  const cuerpo = String(hasta);
  return cuerpo + "." + firmar(cuerpo, env);
}
function tokenValido(req, env, ahora) {
  const h = req.headers.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [cuerpo, firma] = t.split(".");
  if (!cuerpo || !firma) return false;
  if (!iguales(firma, firmar(cuerpo, env))) return false;
  return Number(cuerpo) > ahora;
}

// Comprueba que la carta tiene la forma correcta antes de guardarla
export function validarCarta(c) {
  const texto = (v, max) => typeof v === "string" && v.length <= max;
  if (!c || typeof c !== "object") return "La carta no tiene el formato correcto.";
  if (!texto(c.moneda, 8)) return "Falta la moneda.";
  if (!Array.isArray(c.secciones) || c.secciones.length === 0 || c.secciones.length > 60) return "Las secciones no tienen el formato correcto.";
  for (const s of c.secciones) {
    if (!s || !/^[a-z0-9-]{1,40}$/.test(s.id || "")) return "Una sección tiene un identificador no válido.";
    if (!GRUPOS.includes(s.grupo)) return `La sección ${s.id} tiene un grupo no válido.`;
    if (!texto(s.es, 80) || !texto(s.en, 80)) return `La sección ${s.id} tiene un nombre no válido.`;
    if (!Array.isArray(s.items) || s.items.length > 250) return `La sección ${s.id} tiene demasiados platos.`;
    for (const it of s.items) {
      if (!Array.isArray(it) || it.length !== 4) return `Un plato de ${s.es} no tiene el formato correcto.`;
      if (!texto(it[0], 140) || !it[0].trim()) return `Hay un plato sin nombre en ${s.es}.`;
      if (!texto(it[1], 40) || !texto(it[2], 240)) return `«${it[0]}» tiene un texto demasiado largo.`;
      if (!Number.isInteger(it[3]) || it[3] < 0 || it[3] > 100000000) return `El precio de «${it[0]}» no es válido.`;
    }
  }
  return null;
}

export function crearServidor({ store, env, ahora = () => Date.now() }) {
  const ipClave = (ip) => "intentos/" + createHash("sha256").update(String(ip || "desconocida")).digest("hex").slice(0, 24);

  async function registrar(accion, detalle) {
    const reg = (await store.get("registro", { type: "json" })) || [];
    reg.unshift({ cuando: new Date(ahora()).toISOString(), accion, detalle });
    await store.setJSON("registro", reg.slice(0, MAX_REGISTRO));
  }

  async function guardarCopia() {
    const actual = await store.get("carta", { type: "json" });
    if (!actual) return;
    const clave = "copias/" + new Date(ahora()).toISOString().replace(/[:.]/g, "-");
    await store.setJSON(clave, actual);
    const { blobs } = await store.list({ prefix: "copias/" });
    const viejas = blobs.map((b) => b.key).sort().reverse().slice(MAX_COPIAS);
    for (const k of viejas) await store.delete(k);
  }

  function resumen(carta) {
    return carta.secciones.reduce((n, s) => n + s.items.length, 0) + " platos";
  }

  return async function atender(req, ip) {
    const url = new URL(req.url);
    const ruta = url.pathname.replace(/\/+$/, "");
    const metodo = req.method;

    if (!env.CARRETA_CLAVE) return json({ error: "Falta configurar la clave del panel en Netlify (CARRETA_CLAVE)." }, 503);

    if (ruta === "/api/estado" && metodo === "GET") return json({ ok: true });

    if (ruta === "/api/carta" && metodo === "GET") {
      const carta = await store.get("carta", { type: "json" });
      return carta ? json(carta) : json({ error: "Todavía no hay carta guardada online." }, 404);
    }

    if (ruta === "/api/sesion" && metodo === "POST") {
      const k = ipClave(ip);
      const intento = (await store.get(k, { type: "json" })) || { n: 0, hasta: 0 };
      if (intento.hasta > ahora()) {
        const min = Math.ceil((intento.hasta - ahora()) / 60000);
        return json({ error: `Demasiados intentos. Prueba otra vez en ${min} min.` }, 429);
      }
      let clave = "";
      try { clave = String((await req.json()).clave || ""); } catch {}
      if (!iguales(createHash("sha256").update(clave).digest("hex"), createHash("sha256").update(env.CARRETA_CLAVE).digest("hex"))) {
        intento.n += 1;
        if (intento.n >= MAX_INTENTOS) { intento.n = 0; intento.hasta = ahora() + BLOQUEO_MIN * 60000; }
        await store.setJSON(k, intento);
        return json({ error: "Clave incorrecta." }, 401);
      }
      await store.delete(k);
      return json({ token: crearToken(env, ahora()), horas: HORAS_SESION });
    }

    // A partir de aquí, todo necesita sesión
    const privada = (ruta === "/api/carta" && metodo === "PUT") || ruta === "/api/copias" || ruta === "/api/restaurar";
    if (!privada) return json({ error: "No encontrado." }, 404);
    if (!tokenValido(req, env, ahora())) return json({ error: "La sesión ha caducado. Vuelve a entrar." }, 401);

    if (ruta === "/api/carta") {
      const texto = await req.text();
      if (texto.length > 400000) return json({ error: "La carta es demasiado grande." }, 413);
      let carta;
      try { carta = JSON.parse(texto); } catch { return json({ error: "La carta no tiene el formato correcto." }, 400); }
      const fallo = validarCarta(carta);
      if (fallo) return json({ error: fallo }, 400);
      const limpia = { moneda: carta.moneda, actualizado: new Date(ahora()).toISOString(), secciones: carta.secciones };
      await guardarCopia();
      await store.setJSON("carta", limpia);
      await registrar("guardar", resumen(limpia));
      return json({ ok: true, actualizado: limpia.actualizado });
    }

    if (ruta === "/api/copias" && metodo === "GET") {
      const { blobs } = await store.list({ prefix: "copias/" });
      const copias = blobs.map((b) => b.key).sort().reverse();
      const registro = (await store.get("registro", { type: "json" })) || [];
      return json({ copias, registro: registro.slice(0, 30) });
    }

    if (ruta === "/api/restaurar" && metodo === "POST") {
      let copia = "";
      try { copia = String((await req.json()).copia || ""); } catch {}
      if (!/^copias\/[0-9T-]+Z$/.test(copia)) return json({ error: "Copia no válida." }, 400);
      const datos = await store.get(copia, { type: "json" });
      if (!datos) return json({ error: "Esa copia ya no existe." }, 404);
      await guardarCopia();
      const limpia = { ...datos, actualizado: new Date(ahora()).toISOString() };
      await store.setJSON("carta", limpia);
      await registrar("restaurar", copia.replace("copias/", ""));
      return json({ ok: true, carta: limpia });
    }

    return json({ error: "No encontrado." }, 404);
  };
}
