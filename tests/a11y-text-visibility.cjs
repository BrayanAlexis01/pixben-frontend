"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const {chromium} = require("playwright");
const root = path.resolve(__dirname, "..");
const read = pathName => fs.readFileSync(path.join(root,pathName),"utf8");

const home = read("public_html/index.html");
const customize = read("public_html/htmls/personaliza.html");
const css = [
    read("public_html/css/css index.css"),
    read("public_html/css/css personaliza.css"),
    read("public_html/css/accessibility.css")
].join("\n");

assert.match(home, /accessibility\.css\?v=6/);
assert.match(customize, /accessibility\.css\?v=6/);
const steps = home.match(/<section class="pasos">[\s\S]*?<\/section>/)?.[0];
const assisted = customize.match(/<section class="diseno-asistido-card"[\s\S]*?<\/section>/)?.[0];
assert.ok(steps && assisted, "Must test actual PixBen home and personalizer markup");
function srgb(x) {
    x/=255;
    return x<=0.04045 ? x/12.92 : ((x+.055)/1.055)**2.4;
}
function lum(x){
    const n=x.match(/[\d.]+/g)?.slice(0,3).map(Number);
    assert.equal(n?.length,3,"Expected RGB computed color: "+x);
    return .2126*srgb(n[0])+.7152*srgb(n[1])+.0722*srgb(n[2]);
}
function contrast(a,b){
    const x=lum(a),y=lum(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
async function main(){
    const browser=await chromium.launch({headless:true});
    try {
        for(const highContrast of [false,true]){
            for(const width of [1440,820,390,320]){
                const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
                const html=`<!doctype html><html lang="es" class="${highContrast?"a11y-high-contrast":""}">
                    <head><meta name="viewport" content="width=device-width,initial-scale=1">
                    <style>${css}</style></head>
                    <body><main>
                        ${steps}
                        <section class="personalizador-page">
                           <div class="editor-layout">
                              <aside class="panel-editor resumen-pedido">${assisted}</aside>
                           </div>
                        </section>
                    </main></body></html>`;
                await page.setContent(html);
                const actual=await page.evaluate(()=>{
                    const css=selector=>{
                        const e=document.querySelector(selector);
                        const s=getComputedStyle(e),b=e.getBoundingClientRect();
                        return {color:s.color,background:s.backgroundColor,
                            width:b.width,height:b.height,scrollWidth:e.scrollWidth,
                            clientWidth:e.clientWidth,x:b.x,right:b.right,display:s.display};
                    };
                    return {
                        steps:css(".pasos"),stepTitle:css(".pasos > h2"),
                        tiles:css(".paso"),tileHeading:css(".paso h3"),
                        tileText:css(".paso p"),secondText:css(".paso2 p"),
                        card:css(".diseno-asistido-card"),
                        cardHeader:css(".diseno-asistido-card h3"),
                        cardText:css(".diseno-asistido-descripcion"),
                        cardKicker:css(".diseno-asistido-card .panel-kicker"),
                        button:css("#btnAbrirDisenoAsistido"),
                        overflow:document.documentElement.scrollWidth>innerWidth+2
                    };
                });
                if(highContrast){
                    const checks=[
                        ["step title",actual.stepTitle.color,actual.steps.background],
                        ["step heading",actual.tileHeading.color,actual.tiles.background],
                        ["step paragraph",actual.tileText.color,actual.tiles.background],
                        ["third step",actual.secondText.color,actual.tiles.background],
                        ["card heading",actual.cardHeader.color,actual.card.background],
                        ["card paragraph",actual.cardText.color,actual.card.background],
                        ["card kicker",actual.cardKicker.color,actual.card.background],
                        ["card button",actual.button.color,actual.button.background]
                    ];
                    for(const [label,foreground,background] of checks){
                        const score=contrast(foreground,background);
                        assert.ok(score>=4.5, `${width}px ${label}: contrast ${score.toFixed(2)}:1 (${foreground} / ${background})`);
                    }
                    assert.ok(lum(actual.steps.background)<.15, "High contrast steps background must not be white");
                    assert.ok(lum(actual.card.background)<.15, "High contrast assisted card must not be pastel");
                } else {
                    assert.ok(contrast(actual.stepTitle.color,actual.steps.background)>=4.5,
                        "Normal-mode step heading lost contrast");
                }
                assert.ok(!actual.overflow,`${width}px: page horizontal overflow ${JSON.stringify(actual)}`);
                assert.ok(actual.card.scrollWidth<=actual.card.clientWidth+2,`${width}px: assisted card clips content`);
                assert.ok(actual.button.width>=actual.card.width*.7,"Action too narrow");
                console.log(`PASS ${highContrast?"HIGH CONTRAST":"NORMAL"} ${width}px | steps=${actual.steps.background}, card=${actual.card.background}`);
                await page.close();
            }
        }
    }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
