"use strict";
const {chromium} = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

async function main() {
    const root = path.resolve(__dirname, "..");
    const html = fs.readFileSync(path.join(root, "public_html/htmls/personaliza.html"), "utf8");
    const css = fs.readFileSync(path.join(root, "public_html/css/css personaliza.css"), "utf8");
    const match = html.match(/<section class="diseno-asistido-card"[\s\S]*?<\/section>/);
    assert.ok(match, "Debe existir la tarjeta de diseño asistido");
    assert.match(match[0], /id="btnAbrirDisenoAsistido"/, "El botón existente debe conservar su ID");
    assert.match(match[0], /S\/ 15\.00/, "No debe cambiar el adelanto");

    const browser = await chromium.launch({headless: true});
    try {
        for (const width of [1440, 760, 390, 320]) {
            const page = await browser.newPage({viewport: {width, height: 900}, deviceScaleFactor: 1});
            await page.setContent(`<!doctype html>
                <html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1">
                <style>${css}</style>
                <style>.test-editor{width:min(335px, calc(100% - 16px));margin:24px auto}</style>
                </head><body><div class="test-editor"><aside class="panel-editor resumen-pedido">
                ${match[0]}</aside></div></body></html>`);
            const m = await page.evaluate(() => {
                const box = el => {
                    const r = el.getBoundingClientRect();
                    return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,top:r.top};
                };
                const card=document.querySelector(".diseno-asistido-card");
                return {
                    card:box(card),
                    heading:box(document.getElementById("tituloDisenoAsistidoCard")),
                    description:box(document.querySelector(".diseno-asistido-descripcion")),
                    button:box(document.getElementById("btnAbrirDisenoAsistido")),
                    cardOverflows:card.scrollWidth>card.clientWidth+2,
                    viewportOverflows:document.documentElement.scrollWidth>innerWidth+2
                };
            });
            assert.ok(m.heading.width > 100, `${width}px: heading is too narrow: ${JSON.stringify(m)}`);
            assert.ok(m.description.width >= m.card.width * 0.75,
                `${width}px: description must use full card width: ${JSON.stringify(m)}`);
            assert.ok(m.button.width >= m.card.width * 0.75,
                `${width}px: button must use full card width: ${JSON.stringify(m)}`);
            assert.ok(m.button.top >= m.description.bottom,
                `${width}px: button overlaps description: ${JSON.stringify(m)}`);
            assert.ok(!m.cardOverflows && !m.viewportOverflows,
                `${width}px: horizontal overflow: ${JSON.stringify(m)}`);
            console.log(`PASS ${width}px heading=${Math.round(m.heading.width)}px text=${Math.round(m.description.width)}px button=${Math.round(m.button.width)}px`);
            await page.close();
        }
    } finally {
        await browser.close();
    }
}
main().catch(error => {console.error(error); process.exitCode = 1;});
