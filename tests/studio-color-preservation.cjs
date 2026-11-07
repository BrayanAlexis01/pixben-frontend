"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const src = fs.readFileSync(path.resolve(__dirname,"../public_html/js/personaliza.js"),"utf8");

const start = src.indexOf("    async function aplicarProductoSeleccionado(");
const stop = src.indexOf("\n    function reiniciarEstadosEditor()",start);
assert.ok(start>0 && stop>start,"Debe existir la función de cambio de corte");
const functionSource = src.slice(start,stop).trim();
const state = {
  productoActual:{esBaseReferencia:true,fit:"clasico"},
  productoSelect:{value:"base:boxy"},
  colorProducto:{value:"Blanco"},
  productos:[{id:123,nombre:"Producto real",personalizable:true}],
  basesLisas:{palette:[
    {nombre:"Negro"},{nombre:"Blanco"},{nombre:"Arena"},
    {nombre:"Beige oscuro"},{nombre:"Celeste claro"}
  ]},
  normalizarTexto: value => String(value||"").toLowerCase().trim(),
  actualizarTarjetasBase:()=>{},
  editarProductoBase:{checked:false,disabled:false},
  document:{getElementById:()=>({disabled:false})},
  reiniciarEstadosEditor:()=>{},
  prepararProductoActual:async color=>{state.preparedColor=color},
  actualizarBotonesLado:()=>{},
  cargarLado:async()=>{},
  actualizarResumen:()=>{},
  actualizarResumenDiseno:()=>{},
  ladoActual:"frente",
  preparedColor:undefined,
};
state.esBaseLisa=()=>Boolean(state.productoActual?.esBaseReferencia);
state.seleccionarBaseLisa=fit=>({esBaseReferencia:true,fit});
const change=new Function("state","with (state) {return ("+functionSource+");}")(state);
(async()=>{
  await change(true);
  assert.equal(state.preparedColor,"Blanco","No se debe perder el blanco al cambiar a boxy");
  assert.equal(state.productoActual.fit,"boxy");
  state.productoSelect.value="base:oversize";
  state.colorProducto.value="Beige oscuro";
  await change(true);
  assert.equal(state.preparedColor,"Beige oscuro","El color debe persistir al cambiar a oversize");
  state.productoSelect.value="base:clasico";
  state.colorProducto.value="Celeste claro";
  await change(true);
  assert.equal(state.preparedColor,"Celeste claro","Mantener colores claros entre cortes");
  state.productoSelect.value="123";
  await change(true);
  assert.equal(state.preparedColor,null,"No transferir colores no verificados a un producto real");
  assert.equal(state.productoActual.id,123);
  assert.match(src,/await prepararProductoActual\(colorConservado\)/);
  assert.match(src,/await renderizarColoresProducto\(colorPreferido\)/);
  assert.match(src,/normalizarTexto\(boton.dataset.color\)\s*===\s*normalizarTexto\(colorPreferido\)/);
  console.log("PASS: colores conservados entre cortes lisos; catálogo mantiene sus propias variantes");
})().catch(error=>{console.error(error);process.exitCode=1});
