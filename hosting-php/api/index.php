<?php
// La Carreta · servidor de la carta para hosting con PHP (versión para Cuba).
// Hace lo mismo que netlify/lib/carta-servidor.mjs, con las mismas rutas:
//   GET  api/estado            -> { ok: true }
//   GET  api/carta             -> carta guardada (404 si todavía no hay)
//   POST api/sesion  { clave } -> { token } válido 8 horas
//   PUT  api/carta   (token)   -> guarda la carta, con copia de la anterior
//   GET  api/copias  (token)   -> copias y registro de cambios
//   POST api/restaurar (token) { copia } -> vuelve a una copia
// La clave NO está aquí: en datos/config.php solo hay una huella (hash) de ella.

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

const HORAS_SESION = 8;
const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;
const MAX_COPIAS = 30;
const MAX_REGISTRO = 200;
const GRUPOS = ['cocina', 'bebidas', 'cafeteria'];
define('DATOS', __DIR__ . '/datos');

function responder($cuerpo, int $estado = 200): void {
  http_response_code($estado);
  echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function leer(string $nombre) {
  $f = DATOS . '/' . $nombre . '.json';
  if (!is_file($f)) return null;
  $d = json_decode((string) file_get_contents($f), true);
  return $d === null ? null : $d;
}
function escribir(string $nombre, $valor): void {
  $f = DATOS . '/' . $nombre . '.json';
  $dir = dirname($f);
  if (!is_dir($dir)) mkdir($dir, 0700, true);
  $tmp = $f . '.' . bin2hex(random_bytes(4)) . '.tmp';
  file_put_contents($tmp, json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
  rename($tmp, $f); // escritura atómica: nunca queda un archivo a medias
}
function borrar(string $nombre): void { @unlink(DATOS . '/' . $nombre . '.json'); }
function ahora(): int { return (int) round(microtime(true) * 1000); }
function iso(int $ms): string { return gmdate('Y-m-d\TH:i:s', intdiv($ms, 1000)) . sprintf('.%03dZ', $ms % 1000); }

$config = DATOS . '/config.php';
if (!is_file($config)) responder(['error' => 'Falta configurar la clave del panel (datos/config.php).'], 503);
$CONF = require $config; // ['sal' => ..., 'huella' => ..., 'secreto' => ...]

function claveCorrecta(string $clave, array $c): bool {
  return hash_equals($c['huella'], hash('sha256', $c['sal'] . '|' . $clave));
}
function firmar(string $texto, array $c): string {
  return rtrim(strtr(base64_encode(hash_hmac('sha256', $texto, $c['secreto'] . '|' . $c['huella'], true)), '+/', '-_'), '=');
}
function crearToken(array $c): string { $hasta = (string) (ahora() + HORAS_SESION * 3600 * 1000); return $hasta . '.' . firmar($hasta, $c); }
function tokenValido(array $c): bool {
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if ($h === '' && function_exists('getallheaders')) { foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $h = $v; }
  $t = strncmp($h, 'Bearer ', 7) === 0 ? substr($h, 7) : '';
  $p = explode('.', $t);
  if (count($p) !== 2) return false;
  return hash_equals(firmar($p[0], $c), $p[1]) && (int) $p[0] > ahora();
}

// Cuenta caracteres (no bytes) aunque el hosting no tenga la extensión mbstring
function largo(string $v): int {
  return function_exists('mb_strlen') ? mb_strlen($v, 'UTF-8') : (int) preg_match_all('/./us', $v);
}

function validarCarta($c): ?string {
  $texto = fn($v, $max) => is_string($v) && largo($v) <= $max;
  if (!is_array($c)) return 'La carta no tiene el formato correcto.';
  if (!$texto($c['moneda'] ?? null, 8)) return 'Falta la moneda.';
  $sec = $c['secciones'] ?? null;
  if (!is_array($sec) || count($sec) === 0 || count($sec) > 60) return 'Las secciones no tienen el formato correcto.';
  foreach ($sec as $s) {
    if (!is_array($s) || !preg_match('/^[a-z0-9-]{1,40}$/', (string) ($s['id'] ?? ''))) return 'Una sección tiene un identificador no válido.';
    if (!in_array($s['grupo'] ?? '', GRUPOS, true)) return "La sección {$s['id']} tiene un grupo no válido.";
    if (!$texto($s['es'] ?? null, 80) || !$texto($s['en'] ?? null, 80)) return "La sección {$s['id']} tiene un nombre no válido.";
    if (!is_array($s['items'] ?? null) || count($s['items']) > 250) return "La sección {$s['id']} tiene demasiados platos.";
    foreach ($s['items'] as $it) {
      if (!is_array($it) || count($it) !== 4) return "Un plato de {$s['es']} no tiene el formato correcto.";
      if (!$texto($it[0], 140) || trim((string) $it[0]) === '') return "Hay un plato sin nombre en {$s['es']}.";
      if (!$texto($it[1], 40) || !$texto($it[2], 240)) return "«{$it[0]}» tiene un texto demasiado largo.";
      if (!is_int($it[3]) || $it[3] < 0 || $it[3] > 100000000) return "El precio de «{$it[0]}» no es válido.";
    }
  }
  return null;
}

function registrar(string $accion, string $detalle): void {
  $reg = leer('registro') ?? [];
  array_unshift($reg, ['cuando' => iso(ahora()), 'accion' => $accion, 'detalle' => $detalle]);
  escribir('registro', array_slice($reg, 0, MAX_REGISTRO));
}
function listaCopias(): array {
  $l = [];
  foreach (glob(DATOS . '/copias/*.json') ?: [] as $f) $l[] = 'copias/' . basename($f, '.json');
  rsort($l);
  return $l;
}
function guardarCopia(): void {
  $actual = leer('carta');
  if (!$actual) return;
  $clave = 'copias/' . str_replace([':', '.'], '-', iso(ahora()));
  escribir($clave, $actual);
  foreach (array_slice(listaCopias(), MAX_COPIAS) as $vieja) borrar($vieja);
}
function resumen(array $c): string { $n = 0; foreach ($c['secciones'] as $s) $n += count($s['items']); return $n . ' platos'; }
function cuerpoJson() { $d = json_decode((string) file_get_contents('php://input'), true); return is_array($d) ? $d : []; }

$ruta = trim((string) ($_GET['ruta'] ?? ''), '/');
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($ruta === 'estado' && $metodo === 'GET') responder(['ok' => true]);

if ($ruta === 'carta' && $metodo === 'GET') {
  $c = leer('carta');
  $c ? responder($c) : responder(['error' => 'Todavía no hay carta guardada online.'], 404);
}

if ($ruta === 'sesion' && $metodo === 'POST') {
  $k = 'intentos/' . substr(hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'desconocida')), 0, 24);
  $int = leer($k) ?? ['n' => 0, 'hasta' => 0];
  if ($int['hasta'] > ahora()) responder(['error' => 'Demasiados intentos. Prueba otra vez en ' . (int) ceil(($int['hasta'] - ahora()) / 60000) . ' min.'], 429);
  $clave = (string) (cuerpoJson()['clave'] ?? '');
  if (!claveCorrecta($clave, $CONF)) {
    $int['n']++;
    if ($int['n'] >= MAX_INTENTOS) { $int['n'] = 0; $int['hasta'] = ahora() + BLOQUEO_MIN * 60000; }
    escribir($k, $int);
    responder(['error' => 'Clave incorrecta.'], 401);
  }
  borrar($k);
  responder(['token' => crearToken($CONF), 'horas' => HORAS_SESION]);
}

$privada = ($ruta === 'carta' && $metodo === 'PUT') || $ruta === 'copias' || $ruta === 'restaurar';
if (!$privada) responder(['error' => 'No encontrado.'], 404);
if (!tokenValido($CONF)) responder(['error' => 'La sesión ha caducado. Vuelve a entrar.'], 401);

if ($ruta === 'carta') {
  $texto = (string) file_get_contents('php://input');
  if (strlen($texto) > 400000) responder(['error' => 'La carta es demasiado grande.'], 413);
  $carta = json_decode($texto, true);
  if (!is_array($carta)) responder(['error' => 'La carta no tiene el formato correcto.'], 400);
  if ($fallo = validarCarta($carta)) responder(['error' => $fallo], 400);
  $limpia = ['moneda' => $carta['moneda'], 'actualizado' => iso(ahora()), 'secciones' => $carta['secciones']];
  guardarCopia();
  escribir('carta', $limpia);
  registrar('guardar', resumen($limpia));
  responder(['ok' => true, 'actualizado' => $limpia['actualizado']]);
}

if ($ruta === 'copias' && $metodo === 'GET') {
  responder(['copias' => listaCopias(), 'registro' => array_slice(leer('registro') ?? [], 0, 30)]);
}

if ($ruta === 'restaurar' && $metodo === 'POST') {
  $copia = (string) (cuerpoJson()['copia'] ?? '');
  if (!preg_match('/^copias\/[0-9T-]+Z$/', $copia)) responder(['error' => 'Copia no válida.'], 400);
  $datos = leer($copia);
  if (!$datos) responder(['error' => 'Esa copia ya no existe.'], 404);
  guardarCopia();
  $datos['actualizado'] = iso(ahora());
  escribir('carta', $datos);
  registrar('restaurar', str_replace('copias/', '', $copia));
  responder(['ok' => true, 'carta' => $datos]);
}

responder(['error' => 'No encontrado.'], 404);
