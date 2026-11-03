// Función de Netlify: guarda la carta en Netlify Blobs.
// Toda la lógica está en ../lib/carta-servidor.mjs
import { getStore } from "@netlify/blobs";
import { crearServidor } from "../lib/carta-servidor.mjs";

export default async (req, context) => {
  const store = getStore({ name: "carreta", consistency: "strong" });
  const atender = crearServidor({ store, env: { CARRETA_CLAVE: Netlify.env.get("CARRETA_CLAVE"), CARRETA_SECRETO: Netlify.env.get("CARRETA_SECRETO") } });
  return atender(req, context.ip);
};

export const config = {
  path: ["/api/estado", "/api/carta", "/api/sesion", "/api/copias", "/api/restaurar"],
};
