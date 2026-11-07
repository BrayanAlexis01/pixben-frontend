"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const src=rel=>fs.readFileSync(path.join(root,rel),"utf8");
const editor=src("public_html/js/personaliza.js");
const config=src("public_html/js/config.js");
const profile=src("public_html/js/paginas/perfil.js");
const header=src("public_html/js/header-global.js");
const login=src("public_html/js/login.js");
const html=src("public_html/htmls/personaliza.html");

assert.doesNotMatch(editor,/return\s+fetch\(dataUrl\)/,"Nunca usar fetch(data:) para generar vistas previas con CSP");
assert.match(editor,/function imagenDataUrlABlob\(dataUrl\)/);
assert.match(editor,/exportarLadoBlob\(lado\)[\s\S]*?imagenDataUrlABlob\(await exportarLadoDataUrl\(lado\)\)/);
assert.match(editor,/No se pudo agregar al carrito|no se pudo agregar al carrito/i);
assert.match(editor,/agregadoAlCarrito/);
assert.match(editor,/login\.html\?return=personaliza\.html/);
assert.match(profile,/await recuperarSesionPixben\(\)/);
assert.match(header,/tieneSesionValida\(usuario\)/);
assert.match(login,/rutasPermitidas\.has\(retorno\)/);
assert.match(html,/personaliza\.js\?v=26/);
const begin=editor.indexOf("    function imagenDataUrlABlob(dataUrl) {");
const end=editor.indexOf("\n\n    async function exportarLadoBlob",begin);
assert.ok(begin>=0&&end>begin);
const convert=vm.runInNewContext("("+editor.slice(begin,end).trim()+")",{Blob,Uint8Array,atob});
(async()=>{
  const png="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==";
  const blob=convert(png);
  assert.equal(blob.type,"image/png");
  assert.ok(blob.size>20);
  assert.equal(Buffer.from(await blob.arrayBuffer()).subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.throws(()=>convert("data:text/html;base64,PHNjcmlwdD4="),/No se pudo preparar/);

  class Store {
    constructor(){this.map=new Map()}
    getItem(key){return this.map.has(key)?this.map.get(key):null}
    setItem(key,value){this.map.set(key,String(value))}
    removeItem(key){this.map.delete(key)}
    key(n){return [...this.map.keys()][n]||null}
    get length(){return this.map.size}
  }
  const openChannels=[];
  class FakeBroadcastChannel {
    constructor(name){this.name=name;this.listeners=new Set();openChannels.push(this)}
    addEventListener(_type,fn){this.listeners.add(fn)}
    removeEventListener(_type,fn){this.listeners.delete(fn)}
    postMessage(payload){
      for(const channel of openChannels){
        if(channel!==this && channel.name===this.name) {
          queueMicrotask(()=>{for(const listener of channel.listeners)listener({data:payload})});
        }
      }
    }
  }
  const sharedStorage=new Store();
  const browserTab=sessionStorage=>{
    const window={dispatchEvent(){}};
    const sandbox={
      window,
      localStorage:sharedStorage,sessionStorage,
      BroadcastChannel:FakeBroadcastChannel,
      crypto:require("node:crypto").webcrypto,
      Event:class Event{constructor(type){this.type=type}},
      document:{addEventListener(){}},
      setTimeout,clearTimeout,
      Headers,Blob,Uint8Array,
      location:{pathname:"/htmls/perfil.html"},
    };
    vm.createContext(sandbox);
    vm.runInContext(config,sandbox,{timeout:3000});
    return sandbox;
  };
  const adminTab=browserTab(new Store());
  vm.runInContext('guardarUsuarioSesion({id:5,rol:"admin",correo:"admin@example.com",nombre:"Demo",token:"valid-demo-token"})',adminTab);
  const profileTab=browserTab(new Store());
  assert.equal(vm.runInContext("tieneSesionValida(obtenerUsuarioSesion())",profileTab),false);
  const recovered=await vm.runInContext("recuperarSesionPixben()",profileTab);
  assert.equal(recovered.token,"valid-demo-token");
  assert.equal(vm.runInContext("tieneSesionValida(obtenerUsuarioSesion())",profileTab),true);
  assert.equal(JSON.parse(sharedStorage.getItem("usuario")).token,"","Token admin no debe persistirse en localStorage");

  // Nunca heredar un token privilegiado al cambiar a otro usuario.
  vm.runInContext('guardarUsuarioSesion({id:42,rol:"admin",correo:"otro@example.com",nombre:"Otro"})',profileTab);
  assert.equal(vm.runInContext("tieneSesionValida(obtenerUsuarioSesion())",profileTab),false);
  console.log("PASS: PNG preparado sin red, sesión admin entre pestañas y sin heredar tokens de otra cuenta");
})().catch(err=>{console.error(err);process.exitCode=1});
