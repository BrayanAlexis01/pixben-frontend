"use strict";
(function blankBasesModule() {
  "use strict";
  const palette=[
    {nombre:"Negro",hex:"#171719"},
    {nombre:"Blanco",hex:"#f8f8f6"},
    {nombre:"Arena",hex:"#d6c7b2"},
    {nombre:"Beige claro",hex:"#e8d8c0"},
    {nombre:"Beige oscuro",hex:"#ac9172"},
    {nombre:"Gris",hex:"#929398"},
    {nombre:"Marrón",hex:"#695043"},
    {nombre:"Celeste claro",hex:"#a6d0df"},
    {nombre:"Azul marino",hex:"#222d41"}
  ];
  const fits=[
    {selectorId:"base-clasico",nombre:"Polo clásico liso",fit:"clasico",tipo:"Corte regular",descripcion:"Polo de cuello redondo y caída tradicional"},
    {selectorId:"base-boxy",nombre:"Polo boxy fit liso",fit:"boxy",tipo:"Corte boxy",descripcion:"Ancho y ligeramente corto, hombros relajados"},
    {selectorId:"base-oversize",nombre:"Polo oversize liso",fit:"oversize",tipo:"Corte oversize",descripcion:"Hombros caídos, mangas amplias y volumen"}
  ];
  const normalizeColor=s=>/^#[0-9a-f]{6}$/i.test(s||"")?s:"#171719";
  function RGB(hex){
    const n=parseInt(normalizeColor(hex).slice(1),16);
    return [(n>>16)&255,(n>>8)&255,n&255];
  }
  function shade(hex,amount){
    return "#"+RGB(hex).map(c=>Math.max(0,Math.min(255,Math.round(c+(amount>0?(255-c)*amount:c*amount))))).map(x=>x.toString(16).padStart(2,"0")).join("");
  }
  const shape={
    clasico:{
      body:"M190 112 L227 99 Q280 110 333 99 L370 112 Q410 118 447 146 L516 242 L457 294 L429 262 L425 541 Q280 552 135 541 L131 262 L103 294 L44 242 L113 146 Q150 118 190 112 Z",
      arms:"M119 151L68 238L104 268 M441 151L492 238L456 268",
      seams:"M144 264L144 529 M416 264L416 529",neckTop:93,hem:542
    },
    boxy:{
      body:"M179 113 L222 99 Q280 111 338 99 L381 113 Q433 118 465 160 L529 251 L469 304 L445 268 L447 515 Q280 528 113 515 L115 268 L91 304 L31 251 L95 160 Q127 118 179 113 Z",
      arms:"M100 163L52 252L91 280 M460 163L508 252L469 280",
      seams:"M123 274L123 502 M437 274L437 502",neckTop:91,hem:518
    },
    oversize:{
      body:"M174 114 L218 99 Q280 113 342 99 L386 114 Q444 123 473 171 L537 287 L476 336 L450 292 L456 560 Q280 574 104 560 L110 292 L84 336 L23 287 L87 171 Q116 123 174 114 Z",
      arms:"M89 179L38 287L84 311 M471 179L522 287L476 311",
      seams:"M117 298L117 549 M443 298L443 549",neckTop:93,hem:563
    }
  };
  function makeSvg(fit="clasico",side="frente",hex="#171719"){
    const type=shape[fit]||shape.clasico;
    const bg=normalizeColor(hex),lit=shade(bg,.22),shadow=shade(bg,-.28),mid=shade(bg,-.12);
    const back=side==="espalda",neck=back
      ? "M221 100 Q280 128 339 100":"M217 101 Q280 179 343 101";
    const under=back?"M228 107 Q280 135 332 107":"M230 113 Q280 157 330 113";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="640" viewBox="0 0 560 640">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fbfaf8"/><stop offset=".55" stop-color="#eeeae6"/><stop offset="1" stop-color="#e6e2df"/></linearGradient>
  <linearGradient id="fabric" x1="0" y1=".13" x2="1" y2=".85"><stop stop-color="${lit}"/><stop offset=".23" stop-color="${bg}"/><stop offset=".49" stop-color="${shade(bg,.06)}"/><stop offset=".76" stop-color="${mid}"/><stop offset="1" stop-color="${lit}"/></linearGradient>
  <linearGradient id="wrinkle" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff" stop-opacity=".13"/><stop offset=".4" stop-color="#000" stop-opacity=".1"/><stop offset=".65" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient>
  <filter id="drop" x="-35%" y="-35%" width="170%" height="190%"><feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur"/><feOffset dy="15" dx="3"/><feComponentTransfer><feFuncA type="linear" slope=".18"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".035"/></feComponentTransfer></filter>
  <clipPath id="shirt"><path d="${type.body}"/></clipPath>
</defs>
<rect width="560" height="640" fill="url(#bg)"/>
<rect width="560" height="640" filter="url(#grain)" opacity=".15"/>
<ellipse cx="282" cy="${type.hem+22}" rx="173" ry="18" fill="#3d3630" opacity=".11"/>
<g filter="url(#drop)"><path d="${type.body}" fill="url(#fabric)" stroke="${mid}" stroke-opacity=".5" stroke-width="2"/></g>
<g clip-path="url(#shirt)">
  <path d="M110 137C154 248 164 299 145 523M433 140C403 250 394 355 420 539M204 180C184 322 206 403 197 528M353 170C380 345 351 456 363 531" fill="none" stroke="url(#wrinkle)" stroke-width="33" opacity=".42"/>
  <path d="M112 153C151 253 155 400 161 506M439 157C406 263 413 406 405 523M190 255C210 303 231 342 231 409M370 259C348 316 339 356 340 416" fill="none" stroke="${shadow}" stroke-opacity=".12" stroke-width="4"/>
  <path d="${type.arms}" fill="none" stroke="${shadow}" stroke-width="4" stroke-opacity=".18"/>
  <path d="${type.seams}" fill="none" stroke="${lit}" stroke-width="2" opacity=".28"/>
  <path d="M113 ${type.hem-17}Q280 ${type.hem-3} 447 ${type.hem-17}" fill="none" stroke="${shadow}" stroke-opacity=".28" stroke-width="3"/>
  <path d="M113 ${type.hem-11}Q280 ${type.hem+3} 447 ${type.hem-11}" fill="none" stroke="${lit}" stroke-opacity=".17" stroke-width="2"/>
  <rect width="560" height="640" filter="url(#grain)" opacity=".17"/>
</g>
<path d="${neck}" fill="none" stroke="${shadow}" stroke-width="16" opacity=".83"/>
<path d="${under}" fill="none" stroke="${lit}" stroke-opacity=".46" stroke-width="3"/>
${back
 ? `<path d="M220 101Q280 129 340 101" stroke="${lit}" opacity=".5" stroke-width="1.6" fill="none"/>
    <path d="M185 112Q231 127 252 137M375 112Q329 127 309 137" stroke="${shadow}" opacity=".15" stroke-width="2" fill="none"/>`
 : `<path d="M241 132Q280 148 319 132" stroke="${shadow}" stroke-opacity=".16" stroke-width="2" fill="none"/>
    <rect x="268" y="129" width="24" height="9" rx="2" fill="${mid}" opacity=".34"/>`}
<path d="M190 112L161 140M370 112L399 140" fill="none" stroke="${lit}" stroke-opacity=".35" stroke-width="3"/>
<text x="280" y="604" text-anchor="middle" fill="#9c9391" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="2">${fit.toUpperCase()} · ${back?"ESPALDA":"FRENTE"} · MOCKUP DE REFERENCIA</text>
</svg>`;
  }
  function image(fit,side,hex){return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(makeSvg(fit,side,hex))}
  function reference(fit){
    const item=fits.find(x=>x.fit===fit)||fits[0];
    return{...item,id:null,esBaseReferencia:true,imagen:image(item.fit,"frente",palette[0].hex),categoria:"Polos",tallasDisponibles:"S,M,L,XL,XXL"};
  }
  window.PixBenBlankBases=Object.freeze({fits,palette,reference,image,makeSvg});
})();
