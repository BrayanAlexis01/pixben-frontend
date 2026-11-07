"use strict";
// Contrato ligero para evitar regresiones de rendimiento y privacidad en CI.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = relative => fs.readFileSync(path.join(root, relative), "utf8");

const editor = source("public_html/js/personaliza.js");
const html = source("public_html/htmls/personaliza.html");
const worker = source("public_html/service-worker.js");
const netlify = source("netlify.toml");

assert.match(editor, /\/productos\/personalizables/, "El personalizador debe consultar solo las bases habilitadas");
assert.match(editor, /personalizable\s*===\s*true/, "No incluir artículos deshabilitados por el administrador");
assert.doesNotMatch(editor, /fetchConReintentos\(\x60\$\{API_URL\}\/productos\x60/,
  "No descargar todo el catálogo para poblar un solo selector");
assert.match(html, /personaliza\.js\?v=25/, "Debe invalidarse la versión JS al cambiar el endpoint");
assert.match(worker, /CACHE_IMAGENES/, "Separar caché de imágenes de archivos esenciales offline");
assert.match(worker, /MAX_RECURSOS_CACHE\s*=\s*100/, "Limitar el crecimiento del almacenamiento offline");
assert.doesNotMatch(worker, /actualizarEnSegundoPlano\(/,
  "No volver a descargar los mismos recursos tras cada lectura del caché");
assert.match(worker, /pixben-pwa-v22/, "Renovar la caché PWA en el siguiente despliegue");
assert.match(netlify, /Content-Security-Policy\s*=/, "Conservar la CSP de Netlify");
console.log("PASS: selector de productos, caché PWA acotada y CSP conservada");
