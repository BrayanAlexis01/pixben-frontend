"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "public_html/js/paginas/mis-pedidos.js"), "utf8");
const html = fs.readFileSync(path.join(root, "public_html/htmls/mis-pedidos.html"), "utf8");
const ids = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map(match => match[1]));

function fakeElement() {
    return {
        hidden: false, textContent: "", innerHTML: "", value: "",
        classList: {toggle() {}, add() {}, remove() {}},
        addEventListener() {}, querySelector() {return {disabled:false};}
    };
}

async function scenario({user = null, failure = false}) {
    const elements = new Map();
    const document = {
        hidden: false,
        getElementById(id) {
            if (!ids.has(id)) return null; // catches stale references in production HTML
            if (!elements.has(id)) elements.set(id, fakeElement());
            return elements.get(id);
        },
        addEventListener() {}
    };
    const state = new Map();
    const item = {id: "pedido-prueba",codigoSeguimiento:"PX-PRUEBA",
        fecha:"2026-10-11T00:00:00Z",items:[{nombre:"Polo prueba",cantidad:1}],
        subtotal:49,estado:"PENDIENTE"};
    const ctx = {
        document, URL, URLSearchParams, console, setTimeout, clearTimeout,
        window: {
            location:{href:"https://pixben.netlify.app/htmls/mis-pedidos.html",search:""},
            history:{replaceState() {}},
            setInterval() {},
            PixBenPWA:{mostrarNotificacion() {}}
        },
        history:{replaceState() {}},navigator:{onLine:true},
        localStorage:{
            getItem(k) {return state.get(k) || null;},
            setItem(k,v) {state.set(k,v);},
            removeItem(k) {state.delete(k);}
        },
        obtenerUsuarioSesion() {return user;},
        tieneSesionValida(u) {return Boolean(u?.id && u?.token);},
        async obtenerColeccionUsuario(recurso) {
            if(recurso==="pedidos-personalizados" && failure) throw Error("Timeout en personalizados");
            return recurso==="pedidos" ? [item] : [];
        },
        obtenerPedidosInvitadoGuardados() {return [];},
        guardarReferenciaPedidoInvitado() {},
        obtenerMensajeRespuesta() {},
        API_URL:"http://localhost:8080",
        fetch() {throw Error("No se esperaba consulta externa");}
    };
    vm.runInNewContext(source,ctx,{filename:"mis-pedidos.js"});
    await new Promise(resolve => setImmediate(resolve));
    return elements;
}

(async () => {
    let elements = await scenario({user:{id:42,token:"token-prueba"}});
    assert.match(elements.get("listaPedidos").innerHTML,/PX-PRUEBA/);
    assert.equal(elements.get("estadoPedidos").hidden,true,"La carga debe desaparecer al terminar");

    elements = await scenario({user:{id:42,token:"token-prueba"},failure:true});
    assert.match(elements.get("listaPedidos").innerHTML,/PX-PRUEBA/,
        "Una consulta de personalizados fallida no debe ocultar los pedidos normales");
    assert.match(elements.get("estadoPedidos").textContent,/Algunos pedidos/);

    elements = await scenario({});
    assert.equal(elements.get("consultaPedidoInvitado").hidden,false);
    assert.match(elements.get("estadoPedidos").textContent,/Escribe los datos/);
    console.log("PASS: signed-in orders, partial fallback, guest lookup");
})().catch(err => {console.error(err);process.exitCode=1;});
