"use strict";
/* PixBen Studio: fotografías de prendas lisas alojadas localmente.
 * Cada combinación tiene un archivo WEBP optimizado; el diseño de Fabric
 * permanece como una capa independiente sobre la foto de referencia. */
(function () {
    const palette = [
        {nombre:"Negro",hex:"#171719",slug:"negro"},
        {nombre:"Blanco",hex:"#f8f8f6",slug:"blanco"},
        {nombre:"Arena",hex:"#d6c7b2",slug:"arena"},
        {nombre:"Beige claro",hex:"#e8d8c0",slug:"beige-claro"},
        {nombre:"Beige oscuro",hex:"#ac9172",slug:"beige-oscuro"},
        {nombre:"Gris",hex:"#929398",slug:"gris"},
        {nombre:"Marrón",hex:"#695043",slug:"marron"},
        {nombre:"Celeste claro",hex:"#a6d0df",slug:"celeste-claro"},
        {nombre:"Azul marino",hex:"#222d41",slug:"azul-marino"}
    ];
    const fits = [
        {selectorId:"base-clasico",nombre:"Polo clásico liso",fit:"clasico",tipo:"Corte regular",descripcion:"Polo de cuello redondo y caída tradicional"},
        {selectorId:"base-boxy",nombre:"Polo boxy fit liso",fit:"boxy",tipo:"Corte boxy",descripcion:"Ancho y ligeramente corto, hombros relajados"},
        {selectorId:"base-oversize",nombre:"Polo oversize liso",fit:"oversize",tipo:"Corte oversize",descripcion:"Hombros caídos y mangas amplias"}
    ];
    const fitsPermitidos = new Set(fits.map(item => item.fit));
    const tonos = new Map(palette.map(item => [item.hex.toLowerCase(),item.slug]));
    function image(fit="clasico",side="frente",hex="#171719") {
        const corte = fitsPermitidos.has(fit) ? fit : "clasico";
        const lado = side === "espalda" ? "espalda" : "frente";
        const color = tonos.get(String(hex || "").toLowerCase()) || "negro";
        return `../assets/mockups/${corte}-${lado}-${color}.webp?v=3`;
    }
    function reference(fit) {
        const corte = fits.find(item => item.fit === fit) || fits[0];
        return {...corte,id:null,esBaseReferencia:true,imagen:image(corte.fit,"frente",palette[0].hex),
            categoria:"Polos",tallasDisponibles:"S,M,L,XL,XXL"};
    }
    window.PixBenBlankBases = Object.freeze({fits,palette,image,reference});
})();