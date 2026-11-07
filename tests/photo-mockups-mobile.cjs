"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root,"public_html/htmls/personaliza.html");
const src = fs.readFileSync(path.join(root,"public_html/js/personaliza-bases-lisas.js"),"utf8");
const desktop = fs.readFileSync(path.join(root,"public_html/js/personaliza-desktop.js"),"utf8");
const html = fs.readFileSync(htmlPath,"utf8");
const sandbox = {window:{}};
vm.runInNewContext(src,sandbox,{timeout:2000});
const bases = sandbox.window.PixBenBlankBases;
assert.ok(bases,"Faltan los mockups de PixBen");
assert.equal(bases.fits.length,3);
assert.equal(bases.palette.length,9);
assert.match(html,/personaliza-bases-lisas\.js\?v=2/,"Se debe invalidar la caché del JS nuevo");
assert.match(html,/personaliza-desktop\.js\?v=6/,"Se debe invalidar la caché del JS del móvil");
assert.doesNotMatch(html,/id="pbTemplateSearch"[^>]*autofocus/,"La búsqueda no debe iniciar con autofocus");

let validated=0;
for(const {fit} of bases.fits) for(const {hex} of bases.palette) for(const side of ["frente","espalda"]){
    const url = bases.image(fit,side,hex);
    assert.match(url,/^\.\.\/assets\/mockups\/[\w-]+\.webp$/);
    const filename = path.resolve(path.dirname(htmlPath),url);
    assert.ok(filename.startsWith(root),"Ruta fuera del proyecto");
    const file=fs.readFileSync(filename);
    assert.equal(file.toString("ascii",0,4),"RIFF",filename);
    assert.equal(file.toString("ascii",8,12),"WEBP",filename);
    assert.ok(file.length < 100000,"Un mockup pesa demasiado: "+filename);
    validated++;
}
assert.equal(validated,54,"Deben existir todas las combinaciones de cortes, lados y colores");
const openBlock=desktop.slice(desktop.indexOf('libraryButton?.addEventListener("click"'),
    desktop.indexOf('templateSearch?.addEventListener("input"'));
assert.ok(openBlock.includes('window.matchMedia("(min-width:821px)")'),
    "El enfoque automático del buscador debe estar limitado a escritorio");
assert.ok(openBlock.includes("closeLibraryButton?.focus"),
    "Al abrir en celular se debe enfocar un botón, no el teclado");
console.log("PASS: "+validated+" mockups fotográficos y biblioteca móvil sin teclado automático");
