// Prepara La Carreta para un hosting con PHP (los que trabajan con Cuba: Neothek, Hosting del Caribe…).
//   E:\Edit\node\node.exe hosting-php\preparar.mjs
// Crea "La Carreta - hosting Cuba" (carpeta y .zip) junto a la carpeta la-carreta, listo para subir.
// Pide la contraseña del panel sin mostrarla y guarda solo su huella (hash) en api/datos/config.php.

import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(AQUI, "..");
const SALIDA = path.resolve(WEB, "..", "La Carreta - hosting Cuba");
const ZIP = SALIDA + ".zip";
// Lo que NO se sube: cosas de Netlify, de desarrollo o notas internas
const FUERA = new Set(["netlify", "node_modules", ".netlify", ".impeccable", "hosting-php", "package.json", "package-lock.json", "netlify.toml", "PRODUCT.md", "DESIGN.md"]);

function pedirOculto(pregunta) {
  return new Promise((listo) => {
    process.stdout.write(pregunta);
    const e = process.stdin; e.setRawMode(true); e.resume(); e.setEncoding("utf8");
    let v = "";
    const tecla = (t) => {
      for (const c of t) {
        if (c === "\r" || c === "\n") { e.setRawMode(false); e.pause(); e.removeListener("data", tecla); process.stdout.write("\n"); return listo(v); }
        if (c === "\u0003") { process.stdout.write("\nCancelado.\n"); process.exit(1); }
        if (c === "\u0008" || c === "\u007f") { if (v) { v = v.slice(0, -1); process.stdout.write("\b \b"); } continue; }
        v += c; process.stdout.write("*");
      }
    };
    e.on("data", tecla);
  });
}

if (fs.existsSync(SALIDA) || fs.existsSync(ZIP)) {
  console.log(`Ya existe "${path.basename(SALIDA)}". Bórrala o cámbiale el nombre y vuelve a ejecutar.`);
  process.exit(1);
}

console.log("La Carreta · preparar la web para el hosting de Cuba\n");
console.log("Contraseña del panel (/atras1836). Mínimo 8 caracteres. Solo verás asteriscos.");
const a = await pedirOculto("Escribe la contraseña:   ");
const b = await pedirOculto("Repítela para confirmar: ");
if (a !== b) { console.log("\nNo coinciden. Vuelve a ejecutar el programa."); process.exit(1); }
if (a.length < 8) { console.log(`\nEs demasiado corta (${a.length} caracteres). Usa 8 o más.`); process.exit(1); }

// 1. Copiar la web
fs.cpSync(WEB, SALIDA, { recursive: true, filter: (origen) => {
  const rel = path.relative(WEB, origen);
  return rel === "" || !FUERA.has(rel.split(path.sep)[0]);
}});
// 2. Servidor PHP y reglas de Apache
fs.cpSync(path.join(AQUI, "api"), path.join(SALIDA, "api"), { recursive: true });
fs.copyFileSync(path.join(AQUI, "raiz.htaccess"), path.join(SALIDA, ".htaccess"));
fs.writeFileSync(path.join(SALIDA, "api", "datos", "index.html"), ""); // por si el hosting ignora el .htaccess
// 3. Configuración: huella de la clave, nunca la clave
const sal = randomBytes(16).toString("hex");
const conf = `<?php\n// Generado por hosting-php/preparar.mjs el ${new Date().toISOString()}.\n// No contiene la contraseña, solo su huella. Para cambiar la contraseña, vuelve a preparar la web.\nreturn [\n  'sal' => '${sal}',\n  'huella' => '${createHash("sha256").update(sal + "|" + a).digest("hex")}',\n  'secreto' => '${randomBytes(32).toString("hex")}',\n];\n`;
fs.writeFileSync(path.join(SALIDA, "api", "datos", "config.php"), conf);
// 4. Comprimir (tar de Windows incluye los .htaccess)
const r = spawnSync("tar", ["-a", "-c", "-f", ZIP, "-C", SALIDA, "."], { encoding: "utf8" });
if (r.status !== 0) { console.log("No se pudo crear el .zip:", r.stderr); process.exit(1); }

const contar = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, x) => n + (x.isDirectory() ? contar(path.join(d, x.name)) : 1), 0);
console.log(`\nLISTO: ${contar(SALIDA)} archivos en "${path.basename(SALIDA)}" y "${path.basename(ZIP)}".`);
console.log("Sube el contenido del .zip a la carpeta public_html del hosting y descomprímelo allí.");
