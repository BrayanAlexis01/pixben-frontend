"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const root=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const theme=read("public_html/css/accessibility.css");
const responsive=read("public_html/css/responsive-global.css");
const cartHTML=read("public_html/htmls/carrito de compras.html");
const privacyHTML=read("public_html/htmls/politica de privacidad.html");
const faqHTML=read("public_html/htmls/preguntas frecuentes.html");
const shippingHTML=read("public_html/htmls/politica de envios.html");
const cartCSS=read("public_html/css/css carrito de compras.css");
const legalCSS=read("public_html/css/politicas.css");
const shippingCSS=read("public_html/css/css politica de envios.css");

function mainFrom(html) {
    const match=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);
    assert.ok(match,"Main content must exist in the real page");
    return match[0];
}
let cartMain=mainFrom(cartHTML);
const item='<article class="producto-carrito">'+
    '<img alt="Polo de prueba" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">'+
    '<div class="producto-info"><h3>Polo Money Crazy</h3>'+
    '<p>Color: <b>Beige crema / Hueso</b></p><p>Talla: M</p>'+
    '<p class="precio">S/ 49.00</p><p class="subtotal-linea">Subtotal: S/ 49.00</p></div>'+
    '<div class="cantidad-producto"><input type="number" value="1" aria-label="Cantidad"></div>'+
    '<button class="btn-eliminar">Eliminar</button></article>';
cartMain=cartMain.replace(/(<div class="lista-carrito" id="listaCarrito">)/,'$1'+item);
assert.ok(cartMain.includes('Polo Money Crazy'));
const fixtures=[
 {name:"Carrito",html:cartMain,css:cartCSS+"\n"+responsive,selectors:[
    [".carrito-titulo p",null],
    [".producto-carrito",null],
    [".producto-info h3",null],
    [".producto-info .subtotal-linea",null],
    [".resumen-carrito h2",null],
    ["#envioResumen",null],
    [".resumen-carrito .btn-checkout",null],
    [".resumen-carrito .btn-vaciar",null],
 ]},
 {name:"Privacidad",html:mainFrom(privacyHTML),css:legalCSS+"\n"+responsive,selectors:[
    [".policy-card",null],
    [".policy-card h2",null],
    [".policy-card p",null],
    [".policy-section h2",null],
    [".policy-section p",null],
    [".policy-note",null],
    [".policy-note strong",null]
 ]},
 {name:"FAQ",html:mainFrom(faqHTML),css:legalCSS+"\n"+responsive,selectors:[
    [".policy-hero h1",null],
    [".faq-question",null],
    [".faq-question i",null],
    [".policy-contact h2",null],
    [".policy-btn",null]
 ]},
 {name:"Envios",html:mainFrom(shippingHTML),css:shippingCSS+"\n"+responsive,selectors:[
    [".hero-envios h1",null],
    [".opciones-envio article",null],
    [".opciones-envio article h2",null],
    [".opciones-envio article p",null],
    [".pasos-envio li",null],
    [".nota-envio",null]
 ]}
];

function luminance(rgb){
    const nums=rgb.match(/[\d.]+/g)?.slice(0,3).map(Number);
    assert.equal(nums?.length,3,"Expected opaque RGB: "+rgb);
    const linear=n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4};
    return .2126*linear(nums[0])+.7152*linear(nums[1])+.0722*linear(nums[2]);
}
function contrast(a,b){
    const x=luminance(a),y=luminance(b);
    return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
async function main() {
    const browser=await chromium.launch({headless:true});
    try{
        for(const fixture of fixtures){
            for(const width of [1360,390,320]){
                const page=await browser.newPage({viewport:{width,height:850}});
                const contents='<!doctype html><html lang="es" class="a11y-high-contrast"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
                    fixture.css+"\n"+theme+'</style></head><body>'+fixture.html+'</body></html>';
                await page.setContent(contents);
                const readings=await page.evaluate(selectors=>selectors.map(selector=>{
                    const el=document.querySelector(selector);
                    if(!el)return {selector,missing:true};
                    let surface=el;
                    const fore=getComputedStyle(el).color;
                    let bg="";
                    while(surface){
                        const candidate=getComputedStyle(surface).backgroundColor;
                        if(!candidate.includes("rgba(0, 0, 0, 0)") && candidate!=="transparent" && candidate!=="rgba(0, 0, 0, 0)"){
                            bg=candidate;break;
                        }
                        surface=surface.parentElement;
                    }
                    return {selector,foreground:fore,background:bg||"rgb(0,0,0)"};
                }),fixture.selectors.map(x=>x[0]));
                for(const row of readings){
                    assert.ok(!row.missing,fixture.name+" missing "+row.selector);
                    const value=contrast(row.foreground,row.background);
                    assert.ok(value>=4.5,fixture.name+" "+width+"px "+row.selector+
                        " poor contrast "+value.toFixed(2)+":1 ("+row.foreground+" / "+row.background+")");
                }
                const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
                assert.ok(!overflow,fixture.name+" "+width+"px has horizontal overflow");
                console.log("PASS "+fixture.name+" "+width+"px, "+readings.length+" readable elements");
                await page.close();
            }
        }
        for(const name of ["public_html/index.html","public_html/htmls/carrito de compras.html",
            "public_html/htmls/politica de privacidad.html","public_html/htmls/personaliza.html"]){
            assert.match(read(name),/accessibility\.css\?v=6/);
        }
    }finally{await browser.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
