"use strict";
(function jerseyLibrary(){
"use strict";
const base=window.PixBenTemplateLibrary;
if(!base||base.jerseysPro)return;
const T=(text,y,size,font="Anton",opts={})=>({type:"text",text,x:150,y,size,font,width:270,color:"ink",weight:"bold",...opts});
const R=(x,y,w,h,opts={})=>({type:"rect",x,y,w,h,color:"none",stroke:"accent",sw:2,...opts});
const L=(x1,y1,x2,y2,opts={})=>({type:"line",x1,y1,x2,y2,color:"accent",sw:3,...opts});
const C=(x,y,r,opts={})=>({type:"circle",x,y,r,color:"none",stroke:"accent",sw:2,...opts});
const S=(x,y,r,opts={})=>({type:"star",x,y,r,color:"accent",...opts});
const themes={
navy:["#dde1e6","#c6cbd4","#1c263e","#8b9ebb","#f5f4ed"],
vintage:["#e9dfd1","#d2c6b8","#22212a","#a56e55","#fcf5ea"],
noir:["#39363d","#24222a","#fff9ee","#a184ac","#222129"],
wine:["#e4ced0","#cbb3bd","#672b36","#c37b76","#fbede6"],
royal:["#dfe4f1","#b4c5dd","#233b6c","#d5a762","#faf8f0"],
forest:["#e3e6d9","#bbc8bc","#234d43","#bd8b5b","#f5f2e8"],
ink:["#2e3439","#1c2328","#f7f5f0","#a0c0d1","#21272c"],
cream:["#eee6d9","#d7c9b5","#26212a","#9b7055","#f7f1e6"],
cherry:["#efe1e2","#d5c4c7","#7e2935","#e5b4a0","#f9f1ea"],
earth:["#ddd3c4","#b1a594","#473c34","#a07e4f","#f2eadc"]
};
const specs=[
["la-varsity","Los Angeles 23","College / Varsity","LOS ANGELES","23","WEST COAST LEAGUE","navy","Graduate"],
["ny-academy","New York 07","College / Varsity","NEW YORK","07","ATHLETIC DEPT.","vintage","Graduate"],
["boston-classic","Boston 58","College / Varsity","BOSTON","58","COLLEGE 1976","royal","Alfa Slab One"],
["california-league","California 86","College / Varsity","CALIFORNIA","86","GOLDEN STATE","forest","Graduate"],
["chicago-23","Chicago 23","College / Varsity","CHICAGO","23","URBAN ATHLETIC","noir","Black Ops One"],
["east-campus","East Campus 19","College / Varsity","EAST CAMPUS","19","VARSITY CLUB","cherry","Graduate"],
["brooklyn-pinstripe","Brooklyn 93","Baseball / Pinstripe","BROOKLYN","93","CITY BASEBALL CLUB","navy","Alfa Slab One"],
["ny-pinstripe","NY Pinstripe 28","Baseball / Pinstripe","NEW YORK","28","DIAMOND LEAGUE","cream","Graduate"],
["westside-diamond","Westside 08","Baseball / Pinstripe","WESTSIDE","08","BASEBALL SEASON","forest","Bungee"],
["seoul-ballclub","Seoul Baseball 17","Baseball / Pinstripe","SEOUL","17","BALL CLUB 2026","wine","Graduate"],
["la-diamond","LA Diamond 32","Baseball / Pinstripe","LOS ANGELES","32","DIAMOND SERIES","royal","Alfa Slab One"],
["metro-baseball","Metro 64","Baseball / Pinstripe","METRO","64","NATIONAL LEAGUE","earth","Graduate"],
["street-brooklyn","Brooklyn 99","Sport Streetwear","BROOKLYN","99","CITY OF DREAMERS","noir","Anton"],
["street-south","South Side 11","Sport Streetwear","SOUTH SIDE","11","EST. 2026","ink","Bungee"],
["tokyo-motion","Tokyo Motion 09","Sport Streetwear","TOKYO","09","STREET DIVISION","cherry","Black Ops One"],
["zero-limits","Zero Limits 00","Sport Streetwear","NO LIMITS","00","ZERO FEAR / ZERO RULES","cream","Anton"],
["north-district","North District 21","Sport Streetwear","NORTH DISTRICT","21","STREET TEAM","forest","Bungee"],
["underground","Underground 77","Sport Streetwear","UNDERGROUND","77","CITY UNIFORM","wine","Anton"],
["racing-motorsport","Motorsport 46","Racing / Team","MOTORSPORT","46","RACING DIVISION","noir","Racing Sans One"],
["racing-pitcrew","Pit Crew 07","Racing / Team","PIT CREW","07","HIGH SPEED DEPT.","royal","Racing Sans One"],
["racing-track","Track 24","Racing / Team","TRACK UNIT","24","FAST / FOCUSED","wine","Black Ops One"],
["racing-speedline","Speedline 88","Racing / Team","SPEEDLINE","88","MAXIMUM VELOCITY","navy","Racing Sans One"],
["racing-redline","Redline 05","Racing / Team","REDLINE","05","MOTION CREW","cherry","Racing Sans One"],
["racing-grid","Starting Grid 12","Racing / Team","GRID TEAM","12","FULL THROTTLE","forest","Black Ops One"],
["oversize-01","Oversize 01","Oversize Numbers","ONE OF ONE","01","LARGE FORMAT","cream","Bebas Neue"],
["oversize-90","Statement 90","Oversize Numbers","STATEMENT","90","NO SMALL IDEAS","ink","Bungee"],
["oversize-13","Thirteen 13","Oversize Numbers","THIRTEEN","13","STREET STANDARD","forest","Anton"],
["oversize-77","Lucky 77","Oversize Numbers","LUCKY CLUB","77","NEW ERA EDITION","cherry","Alfa Slab One"],
["oversize-23","The Original 23","Oversize Numbers","ORIGINAL","23","YOUR OWN STORY","royal","Anton"],
["oversize-10","10 Club","Oversize Numbers","THE CLUB","10","WE MAKE HISTORY","earth","Bebas Neue"],
["retro-league","Retro League 87","Retro Athletic","RETRO LEAGUE","87","CHAMPIONSHIP 1987","earth","Graduate"],
["retro-athletic","Athletic Dept 68","Retro Athletic","ATHLETIC DEPT","68","CLASSIC SPORTSWEAR","wine","Alfa Slab One"],
["retro-west","West Coast 79","Retro Athletic","WEST COAST","79","DIVISION 1979","forest","Graduate"],
["retro-varsity","Old School 04","Retro Athletic","OLD SCHOOL","04","UNIVERSITY ERA","navy","Bungee"],
["retro-club","Heritage 16","Retro Athletic","HERITAGE","16","EST. 1986","cream","Graduate"],
["retro-boston","Boston Retro 91","Retro Athletic","BOSTON","91","ATHLETIC ASSOCIATION","noir","Alfa Slab One"]
];
function composition(style,team,number,sub,font,variation){
const variants=variation%6;
const main={slot:"number",stroke:"accent",strokeWidth:variants%2?4:2.5,shadow:variants%3===0?{x:4,y:5,color:"accent"}:null};
const teamOpts={slot:"name",color:"ink",spacing:variants%2?90:65};
if(style==="College / Varsity")return [
C(150,179,116,{stroke:"accent",sw:2}),C(150,179,107,{stroke:"ink",sw:1}),S(55,104,17),S(245,104,17),L(42,123,258,123,{sw:2}),
T(team,91,29,"Graduate",{...teamOpts,width:272}),T(number,202,118,font,{...main,width:255}),L(45,266,255,266,{sw:4}),
T(sub,295,15,"Montserrat",{slot:"subtitle",spacing:80}),S(65,300,9),S(235,300,9)];
if(style==="Baseball / Pinstripe")return [
L(48,66,252,66,{sw:3}),T(team,110,37,"Graduate",{...teamOpts,angle:-7}),
R(150,172,243,178,{stroke:"accent",sw:1,r:8}),T(number,199,113,font,{...main,width:255,strokeWidth:4}),
T(sub,282,14,"Oswald",{slot:"subtitle",spacing:95}),S(56,277,15),S(244,277,15)];
if(style==="Sport Streetwear")return [
R(76,165,31,220,{color:"accent",stroke:"none"}),T("STREET",85,25,"Bebas Neue",{x:75,width:195,angle:-90,color:"bg"}),
R(204,93,155,6,{color:"accent",stroke:"none"}),T(team,94,29,"Oswald",{...teamOpts,x:207,width:175,spacing:55}),
T(number,199,128,font,{...main,x:173,width:225,angle:variants%2?-5:0}),
R(220,278,93,5,{color:"accent",stroke:"none"}),T(sub,298,14,"Montserrat",{slot:"subtitle",x:190,width:199,spacing:25}),S(250,68,12)];
if(style==="Racing / Team")return [
R(150,85,238,59,{color:"accent",stroke:"none"}),T(team,84,31,"Oswald",{...teamOpts,color:"bg",spacing:45,width:266}),
L(48,128,258,107,{sw:5}),L(43,148,251,127,{sw:2}),
T(number,203,116,font,{...main,angle:-8,width:270,strokeWidth:3}),
L(68,264,270,244,{sw:5}),L(68,274,257,254,{sw:2}),
T(sub,303,13,"Montserrat",{slot:"subtitle",spacing:90})];
if(style==="Oversize Numbers")return [
L(57,69,242,69,{sw:2}),T(team,97,28,"Oswald",{...teamOpts,spacing:135}),
T(number,203,152,font,{...main,width:290,strokeWidth:5,shadow:{x:7,y:7,color:"accent"}}),
T(sub,288,16,"Montserrat",{slot:"subtitle",spacing:90}),L(56,311,244,311,{sw:2})];
return [
C(150,179,112,{stroke:"accent",sw:3}),R(150,82,184,40,{color:"accent",stroke:"none",r:4}),
T(team,82,26,"Graduate",{...teamOpts,color:"bg",spacing:50}),T(number,201,118,font,{...main,width:249,strokeWidth:3}),
L(48,268,252,268,{sw:3}),T(sub,294,13,"Montserrat",{slot:"subtitle",spacing:55}),S(72,124,14),S(228,124,14)];
}
const jerseys=specs.map(([id,name,style,team,number,subtitle,theme,font],index)=>({
id:"pro-"+id,name,category:"Números / Jerseys",jerseyStyle:style,description:style+" · dorsal y letras personalizables",
theme:themes[theme].slice(0,4),shirtColor:themes[theme][4],bodyType:style,parts:composition(style,team,number,subtitle,font,index)}));
const items=base.items.filter(t=>t.category!=="Números / Jerseys").concat(jerseys);
const lookup=new Map(items.map(t=>[t.id,t]));
const escape=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const palette=t=>({bg1:t.theme[0],bg2:t.theme[1],ink:t.theme[2],accent:t.theme[3],muted:t.theme[3],bg:t.theme[0]});
const paint=(t,c)=>palette(t)[c]||c||"none";
const numeric=t=>t.parts.some(p=>p.slot==="number");
function customize(t,opts={}){
if(!t)return t;
if(!numeric(t))return base.customize(t,opts);
const number=String(opts.number??t.parts.find(p=>p.slot==="number")?.text??"23").replace(/[^0-9]/g,"").slice(0,3)||"23";
const name=String(opts.name??t.parts.find(p=>p.slot==="name")?.text??"YOUR TEAM").replace(/[<>\u0000-\u001f]/g,"").trim().slice(0,18).toUpperCase()||"YOUR TEAM";
const subtitle=String(opts.subtitle??t.parts.find(p=>p.slot==="subtitle")?.text??"TEAM SPIRIT").replace(/[<>\u0000-\u001f]/g,"").trim().slice(0,24).toUpperCase()||"TEAM SPIRIT";
return {...t,parts:t.parts.map(p=>{
if(!p.slot)return p;
if(p.slot==="number")return{...p,text:number,size:Number(p.size)*(number.length===3?.76:1)};
if(p.slot==="name")return{...p,text:name,size:Number(p.size)*(name.length>13?.82:1)};
if(p.slot==="subtitle")return{...p,text:subtitle,size:Number(p.size)*(subtitle.length>17?.85:1)};
return p;
})};
}
function starPoints(x,y,r){return Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,k=i%2?.44:1;return[(x+Math.cos(a)*r*k).toFixed(2),(y+Math.sin(a)*r*k).toFixed(2)].join(",")}).join(" ")}
function svgPart(p,t){
const c=paint(t,p.color),stroke=paint(t,p.stroke||"none"),sw=p.strokeWidth||1;
const xy=q=>Number(q||0).toFixed(2);
if(p.type==="text"){
const a=p.align==="left"?"start":p.align==="right"?"end":"middle";
const attrs=`x="${xy(p.x)}" y="${xy(p.y)}" text-anchor="${a}" dominant-baseline="central" font-family="${escape(p.font)},sans-serif" font-size="${xy(p.size)}" font-weight="${p.weight==="normal"?400:850}" letter-spacing="${xy((p.spacing||0)/100)}"`;
const rot=p.angle?` transform="rotate(${p.angle} ${xy(p.x)} ${xy(p.y)})"`:"";
const shadow=p.shadow?`<text ${attrs} fill="${escape(paint(t,p.shadow.color))}" stroke="${escape(paint(t,p.shadow.color))}" stroke-width="${sw+2}" transform="translate(${p.shadow.x||3} ${p.shadow.y||4})${p.angle?' rotate('+p.angle+' '+xy(p.x)+' '+xy(p.y)+')':''}">${escape(p.text)}</text>`:"";
return shadow+`<text ${attrs}${rot} fill="${escape(c)}" stroke="${escape(stroke)}" stroke-width="${p.stroke?sw:0}" stroke-linejoin="round" paint-order="stroke">${escape(p.text)}</text>`;
}
if(p.type==="line")return`<line x1="${xy(p.x1)}" y1="${xy(p.y1)}" x2="${xy(p.x2)}" y2="${xy(p.y2)}" stroke="${escape(c)}" stroke-width="${p.sw||2}" stroke-linecap="round"/>`;
if(p.type==="rect")return`<rect x="${xy(p.x-p.w/2)}" y="${xy(p.y-p.h/2)}" width="${xy(p.w)}" height="${xy(p.h)}" rx="${p.r||0}" fill="${escape(c)}" stroke="${escape(stroke)}" stroke-width="${p.sw||0}"/>`;
if(p.type==="circle")return`<circle cx="${xy(p.x)}" cy="${xy(p.y)}" r="${xy(p.r)}" fill="${escape(c)}" stroke="${escape(stroke)}" stroke-width="${p.sw||0}"/>`;
if(p.type==="star")return`<polygon points="${starPoints(p.x,p.y,p.r)}" fill="${escape(c)}" stroke="${escape(stroke)}" stroke-width="${p.sw||0}"/>`;
return "";
}
function renderSvg(t,{download=false}={}){
if(!t?.jerseyStyle)return base.renderSvg(t,{download});
const accent=t.theme[3],shirt=t.shirtColor||"#faf9f5";
const jersey=t.jerseyStyle,mode=jersey==="Baseball / Pinstripe"?"baseball":jersey==="Racing / Team"?"racing":jersey==="College / Varsity"?"varsity":jersey==="Sport Streetwear"?"street":"simple";
const neck=mode==="baseball"?'M130 60 Q150 95 170 60':mode==="varsity"?'M128 60 L150 88 L172 60':'M125 64 Q150 88 175 64';
const bodyPath="M103 54 L123 64 Q150 89 177 64 L197 54 L263 95 L235 154 L227 139 L228 311 Q150 321 72 311 L73 139 L65 154 L37 95 Z";
const mk="jerseymock"+t.id.replace(/[^a-z0-9]/gi,"");
const shirtArt=`<defs><linearGradient id="${mk}" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="${shirt}"/><stop offset=".62" stop-color="${shirt}"/><stop offset="1" stop-color="${t.theme[1]}"/></linearGradient><clipPath id="${mk}clip"><path d="${bodyPath}"/></clipPath></defs>`;
const stripes=mode==="baseball"?Array.from({length:19},(_,i)=>`<line x1="${57+i*11}" x2="${57+i*11}" y1="76" y2="321" stroke="${accent}" opacity=".28" stroke-width="1.4"/>`).join(""):"";
const panels=mode==="racing"?`<path d="M31 95L114 59L123 74L41 126ZM260 95L185 59L176 74L253 126Z" fill="${accent}" opacity=".66"/>`:mode==="street"?`<path d="M37 95L103 54L114 93L51 130Z" fill="${accent}" opacity=".3"/>`:"";
const sleeve=mode==="varsity"||mode==="baseball"?`<path d="M44 122L66 132M256 122L234 132" stroke="${accent}" stroke-width="4"/>`:"";
const body=`<path d="${bodyPath}" fill="url(#${mk})" stroke="${escape(t.theme[2])}" stroke-opacity=".2" stroke-width="2" stroke-linejoin="round"/>`+`<g clip-path="url(#${mk}clip)">${stripes}${panels}<path d="${neck}" fill="none" stroke="${escape(t.theme[2])}" stroke-width="8" stroke-linecap="round" opacity=".9"/>${sleeve}</g>`+`<path d="M73 139L73 307M227 139L227 307" stroke="#000" opacity=".075" stroke-width="1.5"/>`;
const parts=t.parts.map(p=>svgPart(p,t)).join("");
const watermark=download?`<rect x="0" y="313" width="300" height="27" fill="#15111c" opacity=".88"/><text x="150" y="330" fill="#fff" font-family="Arial,sans-serif" font-size="10" font-weight="700" text-anchor="middle">PIXBEN · MUESTRA, NO ARCHIVO FINAL</text>`:"";
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" ${download?'width="900" height="1020"':''} role="img" aria-label="Mockup ilustrativo del diseño ${escape(t.name)}">`+`<defs><linearGradient id="background${mk}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eceaf0"/><stop offset="100%" stop-color="#b8b6c0"/></linearGradient></defs>`+`<rect width="300" height="340" fill="url(#background${mk})"/>`+`<ellipse cx="151" cy="317" rx="104" ry="13" fill="#26222c" opacity=".16"/>${shirtArt}${body}`+`<g transform="translate(68 95) scale(.55 .59)">${parts}</g>`+`<rect x="10" y="9" width="91" height="23" rx="11.5" fill="#21152c" opacity=".87"/>`+`<text x="55" y="24.5" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif" font-size="8.5" font-weight="700">PIX BEN STUDIO</text>`+`${watermark}</svg>`;
}
function downloadTemplate(t){
if(!t?.jerseyStyle)return base.downloadTemplate(t);
const svg='<?xml version="1.0" encoding="UTF-8"?>\n'+renderSvg(t,{download:true});
const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml;charset=utf-8"}));
const a=document.createElement("a");a.href=url;a.download="PixBen-muestra-"+t.id+".svg";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);return true;
}
window.PixBenTemplateLibrary=Object.freeze({
...base,jerseysPro:true,items,get:key=>lookup.get(key)||null,renderSvg,customize,downloadTemplate,
jerseyStyles:["College / Varsity","Baseball / Pinstripe","Sport Streetwear","Racing / Team","Oversize Numbers","Retro Athletic"]
});
})();
