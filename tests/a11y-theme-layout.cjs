"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const {chromium} = require("playwright");

const root = path.resolve(__dirname, "..");
const read = filename => fs.readFileSync(path.join(root, filename), "utf8");
const accessibilityCSS = read("public_html/css/accessibility.css");
const favoriteCSS = read("public_html/css/cuenta-listados.css");
const contactCSS = read("public_html/css/css contacto.css");
const personalizeCSS = read("public_html/css/css personaliza.css");
const contactHTML = read("public_html/htmls/contacto.html");
const favoritesHTML = read("public_html/htmls/favoritos.html");
const personalizerHTML = read("public_html/htmls/personaliza.html");

assert.ok(!accessibilityCSS.includes("#ffe45c"), "El modo alto contraste aun usa amarillo");
assert.ok(!accessibilityCSS.includes("--a11y-focus:#ffcc33"), "El foco sigue siendo amarillo");
assert.match(contactHTML, /<a class="faq-cta-link" href="preguntas frecuentes.html">/);
assert.doesNotMatch(contactHTML, /<button[^>]*>\s*<a[^>]*preguntas frecuentes/i);
assert.ok(favoritesHTML.includes("cuenta-listados.css?v=7"));
assert.ok(personalizerHTML.includes("accessibility.css?v=4"));
assert.match(read("public_html/js/paginas/favoritos.js"), /productos\/por-ids/);

function channel(c) {
    c/=255;
    return c<=0.04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4);
}
function luminance(rgb){
    const numbers=rgb.match(/[0-9.]+/g).slice(0,3).map(Number);
    return .2126*channel(numbers[0])+.7152*channel(numbers[1])+.0722*channel(numbers[2]);
}
function ratio(a,b) {
    const x=luminance(a), y=luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
async function main(){
    const browser=await chromium.launch({headless:true});
    try{
        for(const width of [1440,760,390,320]){
            const page=await browser.newPage({viewport:{width,height:900}});
            const fixtures=`
                <header class="site-header-pixben"><a href="#">PixBen</a></header>
                <main>
                    <section class="catalogo">
                        <button class="categoria-filtro seleccionado">Todos los productos</button>
                        <button class="categoria-filtro">Polos</button>
                        <div class="paginacion"><button class="activo">1</button><button>2</button></div>
                    </section>
                    <section class="cuenta-contenedor">
                      <div class="grid-cuenta-productos">
                         <article class="tarjeta-cuenta">
                           <div class="tarjeta-cuenta-contenido">
                             <h2>Polo Money Crazy</h2>
                             <p class="variante-favorito">Color: Beige crema / Hueso · Talla: M</p>
                             <p class="tarjeta-cuenta-precio">S/ 49.00</p>
                           </div>
                         </article>
                      </div>
                    </section>
                    <section class="faq-box"><div><h3>¿Tienes dudas frecuentes?</h3>
                    <p>Encuentra información de tus pedidos</p></div>
                    <a class="faq-cta-link" href="#">Ver preguntas frecuentes</a></section>
                    <div class="editor-layout">
                      <aside class="panel-editor panel-configuracion">Herramientas</aside>
                      <section class="lienzo-seccion"><div class="canvas-shell">Vista previa</div></section>
                      <aside class="panel-editor resumen-pedido">Resumen del pedido</aside>
                    </div>
                </main>
                <div class="a11y-modal">
                  <section class="a11y-modal-contenido"><header class="a11y-modal-cabecera"><h2>Accesibilidad y preferencias</h2></header>
                    <button class="a11y-opcion" aria-pressed="true">A Normal</button>
                    <button class="a11y-opcion" aria-pressed="false">A+ Mediano</button>
                  </section>
                </div>
                <footer class="footer-contenido"><a href="#">Términos y condiciones</a><a href="#">Privacidad</a></footer>`;
            await page.setContent(`<!doctype html><html class="a11y-high-contrast" lang="es">
                <head><meta name="viewport" content="width=device-width, initial-scale=1">
                <style>${favoriteCSS}\n${contactCSS}\n${personalizeCSS}\n${accessibilityCSS}</style></head>
                <body>${fixtures}</body></html>`);
            const result=await page.evaluate(()=>{
                const measure=selector=>{
                    const el=document.querySelector(selector);
                    const css=getComputedStyle(el),box=el.getBoundingClientRect();
                    return {color:css.color,background:css.backgroundColor,
                       width:box.width,height:box.height,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
                       overflowY:css.overflowY,maxHeight:css.maxHeight};
                };
                return {
                   selected:measure(".categoria-filtro.seleccionado"),
                   pager:measure(".paginacion button.activo"),
                   a11yPressed:measure(".a11y-opcion[aria-pressed=true]"),
                   favorite:measure(".tarjeta-cuenta"),
                   variant:measure(".variante-favorito"),
                   faq:measure(".faq-cta-link"),
                   footerLink:measure(".footer-contenido a"),
                   canvas:measure(".canvas-shell"),
                   sidebar:measure(".panel-configuracion"),
                   horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
                };
            });
            for(const key of ["selected","pager","a11yPressed","faq"]){
                assert.ok(ratio(result[key].color,result[key].background)>=4.5,
                    `${width}px: insufficient text contrast on ${key}: ${JSON.stringify(result[key])}`);
            }
            assert.ok(ratio(result.footerLink.color,"rgb(13,12,16)")>4.5,
                `${width}px: footer link low contrast`);
            assert.ok(!result.horizontalOverflow,`${width}px: horizontal overflow`);
            assert.ok(result.variant.scrollWidth <= result.variant.clientWidth+2,
                `${width}px: favorite variant text clipped`);
            assert.ok(result.favorite.width>180,`${width}px: favorite card too narrow`);
            if(width===1440){
                assert.equal(result.sidebar.maxHeight,"none","Unexpected nested scroll inside personalizer");
                assert.equal(result.sidebar.overflowY,"visible","Unexpected internal scrollbar");
            }
            console.log(`PASS ${width}px: selected=${ratio(result.selected.color,result.selected.background).toFixed(2)}:1, favorite=${Math.round(result.favorite.width)}px, no overflow`);
            await page.close();
        }
    }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
