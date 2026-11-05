"use strict";
(function templateLibrary(){
    "use strict";
    const T=(t,y,s,f="Montserrat",o={})=>({type:"text",text:t,x:150,y,size:s,font:f,width:270,color:"ink",weight:"bold",...o});
    const L=(y,o={})=>({type:"line",x1:58,y1:y,x2:242,y2:y,color:"accent",sw:2,...o});
    const R=(x,y,w,h,o={})=>({type:"rect",x,y,w,h,color:"none",stroke:"ink",sw:2,r:0,...o});
    const C=(x,y,r,o={})=>({type:"circle",x,y,r,color:"none",stroke:"accent",sw:2,...o});
    const S=(x,y,r,o={})=>({type:"star",x,y,r,color:"accent",...o});
    const define=(id,name,category,description,theme,parts)=>({id,name,category,description,theme,parts});
    const night=["#221729","#4b2b59","#f5eef9","#c998ee"];
    const slate=["#151719","#3b4247","#f3efe8","#b0adb1"];
    const cream=["#e7dacf","#f8f2e6","#2b2231","#98704f"];
    const black=["#080d11","#2c3339","#fafaf8","#b3ccd3"];
    const sage=["#d8ddd1","#f1efe5","#24392f","#708c70"];
    const sky=["#283d59","#567b99","#f9f8f2","#a3e4ed"];
    const gold=["#32291f","#6f573b","#fff4d9","#d9af63"];
    const rose=["#433043","#79566b","#faf2ed","#efa4c6"];
    const warm=["#f2e6d6","#f6efdf","#39251d","#ba613e"];
    const blue=["#162748","#3462a6","#f7f9ff","#93bbf2"];
    const templates=[
      define("urban-soul","Urban Soul","Urbanos","Frente urbano con sello y rayas",night,[S(150,65,16),T("URBAN",119,52,"Bebas Neue"),T("SOUL",183,66,"Archivo Black",{spacing:-10}),L(224,{x1:44,x2:256,sw:4}),T("OWN YOUR WORLD",257,16,"Montserrat",{spacing:110})]),
      define("no-rules","No Rules","Urbanos","Composición con barras industriales",slate,[T("NO",91,73,"Anton",{align:"center"}),R(150,142,242,6,{color:"accent",stroke:"none"}),T("RULES",195,60,"Anton"),T("EST. YOUR OWN WAY",268,14,"Oswald",{spacing:80}),L(290,{x1:79,x2:221,sw:1})]),
      define("legacy-lines","Legacy","Urbanos","Tipografía vertical y logotipo editorial",black,[T("LEGACY",171,48,"Bebas Neue",{angle:-90,width:320,x:82}),L(94,{x1:139,x2:259,sw:3}),T("BUILT",135,34,"Oswald",{x:210,width:130}),T("DIFFERENT",180,27,"Oswald",{x:208,width:158}),T("SINCE 2026",237,12,"Montserrat",{x:203,width:155,spacing:120}),S(207,278,13)]),
      define("original-wave","Original","Urbanos","Lettering central con símbolos",cream,[C(150,166,109,{stroke:"muted",sw:1.3}),S(77,87,12),S(224,253,14),T("Original",149,54,"Lobster",{weight:"normal",angle:-8}),T("ONE OF ONE",223,18,"Montserrat",{spacing:125}),L(256,{x1:110,x2:190,sw:3})]),
      define("dream-builders","Dream Builders","Urbanos","Diseño de impacto en dos niveles",night,[R(150,176,272,240,{stroke:"accent",sw:2}),T("DREAM",126,58,"Archivo Black"),T("BUILDERS",185,42,"Bebas Neue",{spacing:70}),T("CREATE / REPEAT",238,16,"Montserrat",{spacing:80}),L(272,{x1:79,x2:221,sw:3})]),
      define("new-era","Nueva Era","Urbanos","Estilo streetwear con insignias",sky,[C(150,168,114,{stroke:"accent",sw:3}),T("NUEVA",115,42,"Bebas Neue",{spacing:40}),T("ERA",176,72,"Anton"),S(65,180,14),S(235,180,14),T("SIN LÍMITES",247,17,"Montserrat",{spacing:120})]),
      define("never-basic","Never Basic","Urbanos","Bloques de texto con franjas",slate,[R(150,91,247,53,{color:"accent",stroke:"none"}),T("NEVER",92,45,"Anton",{color:"bg",fillFallback:"#171719"}),T("BASIC",173,70,"Anton"),L(235,{x1:36,x2:264,sw:5}),T("KEEP IT ORIGINAL",274,13,"Montserrat",{spacing:100})]),
      define("gracia","Gracia","Cristianos","Mensaje de fe con estilo editorial",cream,[T("GRACIA",115,52,"Cinzel",{spacing:70}),L(149,{x1:95,x2:205,sw:2}),T("QUE TRANSFORMA",188,24,"Montserrat",{spacing:35}),S(150,239,18),T("UN NUEVO COMIENZO",285,13,"Montserrat",{spacing:80})]),
      define("fe-sobre-miedo","Fe sobre miedo","Cristianos","Tipografía poderosa y cruz discreta",black,[R(150,175,256,260,{stroke:"accent",sw:1}),T("FE",96,78,"Bebas Neue"),T("SOBRE",163,34,"Montserrat",{spacing:80}),T("MIEDO",221,54,"Bebas Neue"),R(150,267,4,26,{color:"accent",stroke:"none"}),R(150,267,23,4,{color:"accent",stroke:"none"})]),
      define("proposito","Propósito","Cristianos","Composición sobria de mensaje inspirador",night,[S(150,62,15),T("PROPÓSITO",149,39,"Cinzel",{spacing:10}),L(196,{x1:55,x2:245,sw:1}),T("CAMINAR CON SENTIDO",237,15,"Montserrat",{spacing:65}),C(150,268,8,{color:"accent",stroke:"none"})]),
      define("camina-en-fe","Camina en fe","Cristianos","Lettering cálido y pequeños detalles",sage,[C(150,166,112,{stroke:"accent",sw:2}),T("Camina",141,46,"Great Vibes",{weight:"normal"}),T("EN FE",207,35,"Cinzel",{spacing:25}),R(150,251,4,23,{color:"accent",stroke:"none"}),R(150,251,19,4,{color:"accent",stroke:"none"})]),
      define("luz-camino","Luz en el camino","Cristianos","Sol naciente y texto inspirador",warm,[C(150,140,54,{color:"accent",stroke:"none"}),R(150,172,200,45,{color:"bg",stroke:"none"}),T("LUZ",167,63,"Bebas Neue"),T("EN MI CAMINO",220,20,"Montserrat",{spacing:70}),L(257,{x1:74,x2:226,sw:2})]),
      define("amor-luz","Amor y Luz","Cristianos","Palabras suaves con cruz ornamental",rose,[T("AMOR",118,56,"Playfair Display"),T("& LUZ",185,50,"Playfair Display",{color:"accent"}),L(236,{x1:72,x2:228,sw:2}),T("CREER · COMPARTIR",274,15,"Montserrat",{spacing:65})]),
      define("essential","Essential","Minimalistas","Tipografía pequeña de lujo",cream,[L(113,{x1:110,x2:190,sw:1}),T("ESSENTIAL",156,27,"Montserrat",{spacing:140}),T("EVERY DAY",195,14,"Montserrat",{spacing:170}),L(230,{x1:110,x2:190,sw:1})]),
      define("studio-01","Studio 01","Minimalistas","Sello monocromático de estudio",slate,[C(150,168,94,{stroke:"accent",sw:1}),T("STUDIO",135,40,"Bebas Neue",{spacing:65}),T("01",197,49,"Anton"),T("CREATIVE APPAREL",256,13,"Montserrat",{spacing:90})]),
      define("menos-mas","Menos es más","Minimalistas","Mensaje minimalista en dos pesos",sage,[T("MENOS",118,41,"Montserrat",{spacing:80}),T("ES MÁS",185,51,"Cormorant Garamond",{weight:"normal"}),L(240,{x1:97,x2:203,sw:3})]),
      define("silencio","Silencio","Minimalistas","Arte editorial con asimetría",cream,[T("silencio.",137,47,"Cormorant Garamond",{weight:"normal",italic:true,x:161}),L(191,{x1:104,x2:225,sw:1}),T("THE ART OF LESS",232,13,"Montserrat",{x:161,spacing:75})]),
      define("la-vida","La Vida","Minimalistas","Caligrafía discreta para camisetas",warm,[T("La vida",146,57,"Great Vibes",{weight:"normal"}),T("ES AHORA",216,24,"Montserrat",{spacing:160}),S(150,265,11)]),
      define("sunset-club","Sunset Club","Retro","Sol setentero con composición circular",warm,[C(150,147,83,{color:"accent",stroke:"none"}),R(150,185,225,75,{color:"bg",stroke:"none"}),T("SUNSET",185,47,"Bebas Neue"),T("CLUB",235,45,"Bebas Neue",{spacing:80}),T("SUMMER EDITION",276,15,"Montserrat",{spacing:65})]),
      define("good-times","Good Times","Retro","Lettering retro con rayos",rose,[S(60,101,15),S(240,248,17),T("Good",130,52,"Lobster",{weight:"normal",angle:-6}),T("Times",195,57,"Lobster",{weight:"normal",angle:-6}),L(264,{x1:100,x2:200,sw:5})]),
      define("west-coast","West Coast","Retro","Inspiración vintage de costa",sky,[T("WEST",116,60,"Bebas Neue",{spacing:65}),T("COAST",175,55,"Bebas Neue",{spacing:65}),L(221,{x1:35,x2:265,sw:3}),T("THE SLOW LIFE",267,16,"Montserrat",{spacing:110})]),
      define("vintage-86","Vintage 86","Retro","Números protagonistas y líneas",gold,[T("VINTAGE",106,27,"Montserrat",{spacing:160}),T("86",183,109,"Alfa Slab One"),L(256,{x1:58,x2:242,sw:4}),T("ORIGINAL SERIES",288,14,"Montserrat",{spacing:90})]),
      define("classic-roots","Classic Roots","Retro","Sello de estilo clásico",cream,[C(150,167,115,{stroke:"accent",sw:3}),C(150,167,99,{stroke:"muted",sw:1}),T("CLASSIC",133,36,"Cinzel"),T("ROOTS",195,40,"Cinzel"),S(150,263,12)]),
      define("no-limits","No Limits","Deportivos","Diseño atlético de alto contraste",black,[T("NO",104,62,"Anton",{x:101,width:140}),T("LIMITS",174,54,"Anton",{x:170,width:240}),L(218,{x1:65,x2:260,sw:5}),T("GO BEYOND",264,19,"Oswald",{spacing:90})]),
      define("athletic-24","Athletic 24","Deportivos","Estilo dorsal deportivo",blue,[T("ATHLETIC",90,28,"Oswald",{spacing:70}),T("24",190,107,"Anton"),T("SPORT CULTURE",279,15,"Montserrat",{spacing:100}),L(311,{x1:80,x2:220,sw:2})]),
      define("beyond","Beyond","Deportivos","Letras inclinadas de competición",night,[L(97,{x1:45,x2:255,sw:5}),T("BEYOND",166,54,"Bebas Neue",{angle:-8,spacing:40}),T("EVERY LIMIT",236,22,"Oswald",{spacing:95}),L(279,{x1:71,x2:229,sw:3})]),
      define("team-pixben","Team PixBen","Deportivos","Diseño de equipo con escudo",sky,[R(150,175,244,250,{stroke:"accent",sw:3}),T("TEAM",102,33,"Montserrat",{spacing:100}),T("PIX",176,75,"Anton"),T("BEN",225,48,"Anton",{color:"accent"}),T("PERÚ / 2026",284,14,"Montserrat",{spacing:80})]),
      define("elevate","Elevate","Deportivos","Tipografía limpia con movimiento",slate,[T("ELEVATE",154,49,"Oswald",{spacing:45,angle:-7}),L(210,{x1:65,x2:255,y2:189,sw:5}),T("MOVE WITH PURPOSE",261,16,"Montserrat",{spacing:75})]),
      define("paradise","Paradise","Lettering","Letra manuscrita con adornos sutiles",rose,[S(74,104,16),T("Paradise",170,57,"Lobster",{weight:"normal",angle:-8}),S(235,242,16),L(251,{x1:85,x2:215,sw:3}),T("FIND YOUR PLACE",293,13,"Montserrat",{spacing:60})]),
      define("keep-going","Keep Going","Lettering","Mensaje motivador en lettering",sage,[T("Keep",130,59,"Pacifico",{weight:"normal",angle:-5}),T("Going",211,59,"Pacifico",{weight:"normal",angle:-5}),L(269,{x1:98,x2:202,sw:4})]),
      define("shine","Shine","Lettering","Firma elegante y luminosa",night,[S(68,96,12),S(232,232,14),T("Shine",160,69,"Great Vibes",{weight:"normal"}),T("EVERY SINGLE DAY",247,14,"Montserrat",{spacing:70})]),
      define("vive-libre","Vive Libre","Lettering","Lettering en español",cream,[T("Vive",129,68,"Lobster",{weight:"normal",angle:-7}),T("Libre",206,61,"Lobster",{weight:"normal",angle:-7}),L(272,{x1:107,x2:193,sw:4})]),
      define("mi-marca","Mi Marca","Negocios","Logo inicial para emprendedores",blue,[R(150,174,257,243,{stroke:"accent",sw:1}),T("TU",124,53,"Archivo Black"),T("MARCA",183,49,"Montserrat",{spacing:45}),L(238,{x1:64,x2:236,sw:3}),T("CREA ALGO ÚNICO",278,14,"Montserrat",{spacing:65})]),
      define("creative-co","Creative Co.","Negocios","Sello para proyectos creativos",slate,[C(150,174,109,{stroke:"accent",sw:2}),T("CREATIVE",139,39,"Bebas Neue",{spacing:65}),T("CO.",191,66,"Anton"),T("DESIGN & PRINT",268,14,"Montserrat",{spacing:75})]),
      define("hecho-pasion","Hecho con pasión","Negocios","Tipografía artesanal para negocios",warm,[T("HECHO",117,49,"Oswald",{spacing:45}),T("con pasión",184,37,"Great Vibes",{weight:"normal"}),L(231,{x1:80,x2:220,sw:2}),T("DE TU IDEA AL MUNDO",268,12,"Montserrat",{spacing:75})]),

      // Moda coreana: composiciones editoriales originales (sin marcas ni logos ajenos).
      define("seoul-atelier","Seoul Atelier","Moda coreana","Sello editorial de moda coreana",cream,[L(75,{x1:53,x2:247,sw:1}),T("SEOUL",117,56,"Bebas Neue",{spacing:120}),T("ATELIER",162,24,"Montserrat",{spacing:180}),C(150,219,49,{stroke:"accent",sw:1.5}),T("S / 26",219,19,"Montserrat"),T("EVERYDAY EDITION",284,11,"Montserrat",{spacing:110})]),
      define("seoul-night","Seoul Night","Moda coreana","Streetwear de Seúl, estilo nocturno",night,[S(72,85,13),T("SEOUL",129,64,"Anton",{spacing:8}),T("AFTER",193,50,"Bebas Neue",{spacing:130}),T("DARK",243,32,"Montserrat",{spacing:160}),L(276,{x1:75,x2:225,sw:2})]),
      define("soft-bloom","Soft Bloom","Moda coreana","Estilo suave y minimalista con flores geométricas",rose,[C(150,131,55,{stroke:"accent",sw:3}),C(104,112,17,{color:"accent",stroke:"none"}),C(192,112,17,{color:"accent",stroke:"none"}),C(150,77,17,{color:"accent",stroke:"none"}),T("soft bloom",210,39,"Cormorant Garamond",{italic:true,weight:"normal"}),T("BE YOUR OWN KIND",275,13,"Montserrat",{spacing:60})]),
      define("jeju-coast","Jeju Coast","Moda coreana","Diseño de inspiración costera coreana",sage,[C(150,141,77,{stroke:"accent",sw:2}),L(155,{x1:58,x2:242,sw:3}),T("JEJU",122,60,"Bebas Neue",{spacing:70}),T("COAST",196,35,"Cormorant Garamond",{weight:"normal"}),T("SLOW DAYS / 2026",269,13,"Montserrat",{spacing:90})]),
      define("han-river","Han River Club","Moda coreana","Lettering de club junto al río Han",slate,[T("HAN RIVER",111,37,"Montserrat",{spacing:40}),R(150,167,254,95,{stroke:"accent",sw:2}),T("CLUB",169,72,"Bebas Neue",{spacing:120}),T("SEOUL CITY EDITION",263,13,"Montserrat",{spacing:65})]),
      define("daily-seoul","Daily Seoul","Moda coreana","Composición de revista de moda",cream,[R(150,177,245,264,{stroke:"muted",sw:1}),T("D A I L Y",111,25,"Montserrat",{spacing:35}),T("SEOUL",179,77,"Cormorant Garamond",{weight:"normal"}),L(223,{x1:55,x2:245,sw:4}),T("CREATIVE LIVING",264,14,"Montserrat",{spacing:65})]),
      define("k-style-01","K-Style 01","Moda coreana","Minimal coreano con líneas y numeración",sky,[T("K-STUDIO",106,27,"Montserrat",{spacing:90}),R(150,188,242,208,{stroke:"accent",sw:1}),T("01",195,118,"Anton",{stroke:"accent",strokeWidth:2}),T("SEOUL / EDITION",293,14,"Montserrat",{spacing:50})]),
      define("tokki-day","Rabbit Day","Moda coreana","Símbolos tiernos y tipografía suave",rose,[C(150,147,63,{stroke:"accent",sw:2}),C(124,138,7,{color:"ink",stroke:"none"}),C(177,138,7,{color:"ink",stroke:"none"}),L(178,{x1:126,x2:174,sw:2}),T("RABBIT DAY",241,26,"Montserrat",{spacing:80}),T("MAKE YOUR DAY",282,12,"Montserrat",{spacing:70})]),
      define("noon-studio","Noon Studio","Moda coreana","Diseño limpio para polos oversize",warm,[T("NOON",143,74,"Cormorant Garamond",{weight:"normal"}),T("STUDIO",207,25,"Montserrat",{spacing:180}),L(249,{x1:56,x2:244,sw:2}),S(150,279,13)]),
      define("youth-seoul","Youth Seoul","Moda coreana","Insignia universitaria moderna",blue,[T("YOUTH",112,58,"Bebas Neue",{spacing:90}),T("SEOUL",173,51,"Bebas Neue",{spacing:80}),T("CULTURE CLUB",247,17,"Montserrat",{spacing:125}),L(277,{x1:63,x2:237,sw:3})]),
      // Juvenil / aesthetic: combinaciones alegres, motivadoras y artísticas.
      define("offline-club","Offline Club","Juvenil / Aesthetic","Estampado juvenil sin distracciones",black,[C(150,165,110,{stroke:"accent",sw:2}),T("OFFLINE",136,51,"Bebas Neue",{spacing:95}),T("CLUB",205,56,"Anton"),T("LIVE MORE • SCROLL LESS",280,12,"Montserrat",{spacing:30})]),
      define("after-hours","After Hours","Juvenil / Aesthetic","Diseño urbano para salidas y conciertos",night,[S(72,104,18),S(222,255,11),T("AFTER",137,62,"Bebas Neue",{angle:-8}),T("HOURS",201,62,"Bebas Neue",{angle:-8}),L(270,{x1:67,x2:233,sw:5})]),
      define("cherry-season","Cherry Season","Juvenil / Aesthetic","Retro divertido con cerezas geométricas",rose,[C(130,112,30,{color:"accent",stroke:"none"}),C(177,117,30,{color:"accent",stroke:"none"}),L(78,{x1:112,x2:154,sw:3}),T("CHERRY",198,40,"Shrikhand"),T("SEASON",251,29,"Montserrat",{spacing:120})]),
      define("young-wild","Young & Wild","Juvenil / Aesthetic","Aesthetic juvenil con tipografía llamativa",cream,[T("YOUNG",119,52,"Bebas Neue",{spacing:75}),S(150,166,20),T("& WILD",219,49,"Bebas Neue",{spacing:80}),T("MAKE MEMORIES",281,14,"Montserrat",{spacing:75})]),
      define("city-waves","City Waves","Juvenil / Aesthetic","Movimiento, líneas y diseño moderno",sky,[L(77,{x1:43,x2:257,sw:5}),T("CITY",140,66,"Anton"),T("WAVES",201,50,"Bebas Neue",{angle:-6,spacing:65}),L(271,{x1:62,x2:238,sw:3})]),
      define("dream-loud","Dream Loud","Juvenil / Aesthetic","Mensaje audaz para camisetas juveniles",slate,[R(150,171,248,254,{stroke:"accent",sw:3}),T("DREAM",137,57,"Anton"),T("LOUD",199,62,"Anton"),T("NO LIMITS NO FEAR",270,15,"Montserrat",{spacing:70})]),
      define("cosmic-vibe","Cosmic Vibe","Juvenil / Aesthetic","Diseño espacial con estrellas y órbitas",blue,[C(150,155,99,{stroke:"accent",sw:3}),S(79,80,20),S(238,239,15),T("COSMIC",155,44,"Bebas Neue",{spacing:60}),T("VIBES",218,44,"Bebas Neue",{spacing:100}),T("INFINITE IDEAS",286,12,"Montserrat",{spacing:80})]),
      define("no-drama","No Drama","Juvenil / Aesthetic","Pop urbano de letras grandes",warm,[R(150,107,248,54,{color:"accent",stroke:"none"}),T("NO",107,51,"Anton",{color:"bg"}),T("DRAMA",180,70,"Anton"),L(243,{x1:60,x2:240,sw:6}),T("JUST GOOD DAYS",277,14,"Montserrat",{spacing:120})]),
      define("good-energy","Good Energy","Juvenil / Aesthetic","Optimismo minimalista con detalles divertidos",sage,[S(83,89,12),S(230,231,19),T("GOOD",138,62,"Bebas Neue",{spacing:40}),T("ENERGY",201,54,"Bebas Neue",{spacing:65}),T("EVERYTHING FLOWS",275,15,"Montserrat",{spacing:65})]),
      define("weekend-mode","Weekend Mode","Juvenil / Aesthetic","Estilo relajado para fines de semana",rose,[C(150,169,106,{stroke:"accent",sw:1}),T("WEEKEND",147,42,"Lobster",{weight:"normal",angle:-6}),T("MODE",208,44,"Bebas Neue",{spacing:80}),T("TAKE IT EASY",270,14,"Montserrat",{spacing:100})]),
      // Números / Jerseys: cada texto marcado con slot es personalizable.
      define("varsity-23","Varsity 23","Números / Jerseys","Dorsal universitario con nombre de equipo",slate,[T("YOUR TEAM",82,30,"Bebas Neue",{slot:"name",spacing:75}),L(111,{x1:54,x2:246,sw:2}),T("23",201,118,"Anton",{slot:"number",stroke:"accent",strokeWidth:3}),T("COLLEGE EDITION",293,13,"Montserrat",{spacing:75})]),
      define("brooklyn-07","Brooklyn 07","Números / Jerseys","Jersey callejero con doble contorno",cream,[T("YOUR CITY",77,25,"Montserrat",{slot:"name",spacing:110}),R(150,184,253,217,{stroke:"accent",sw:2}),T("07",186,116,"Anton",{slot:"number",stroke:"accent",strokeWidth:4}),L(274,{x1:56,x2:244,sw:2})]),
      define("club-93","Club 93","Números / Jerseys","Números gigantes de estilo oversized",black,[T("YOUR CLUB",83,30,"Montserrat",{slot:"name",spacing:90}),T("93",187,128,"Bebas Neue",{slot:"number",stroke:"accent",strokeWidth:3}),T("ONE OF ONE",291,18,"Montserrat",{spacing:100})]),
      define("college-87","College 87","Números / Jerseys","Dorsal retro universitario con estrellas",blue,[S(68,81,16),S(232,81,16),T("COLLEGE",107,32,"Oswald",{slot:"name",spacing:55}),T("87",205,120,"Anton",{slot:"number",stroke:"accent",strokeWidth:4}),L(282,{x1:69,x2:231,sw:3})]),
      define("game-day-10","Game Day 10","Números / Jerseys","Frente deportivo con dorsal protagonista",night,[R(150,167,258,256,{stroke:"accent",sw:3}),T("GAME DAY",88,28,"Montserrat",{slot:"name",spacing:65}),T("10",200,128,"Anton",{slot:"number",stroke:"accent",strokeWidth:3}),T("PLAY YOUR WAY",285,14,"Montserrat",{spacing:75})]),
      define("city-21","City 21","Números / Jerseys","Edición de ciudad con marco moderno",sage,[T("YOUR CITY",86,28,"Montserrat",{slot:"name",spacing:100}),L(117,{x1:70,x2:230,sw:3}),T("21",194,117,"Bebas Neue",{slot:"number",stroke:"accent",strokeWidth:4}),T("URBAN DIVISION",279,15,"Montserrat",{spacing:65})]),
      define("baseball-32","Baseball 32","Números / Jerseys","Estilo béisbol y rayas clásicas",warm,[L(84,{x1:56,x2:244,sw:4}),T("BASEBALL",121,33,"Oswald",{slot:"name",spacing:80}),T("32",208,110,"Anton",{slot:"number",stroke:"accent",strokeWidth:4}),L(284,{x1:56,x2:244,sw:4})]),
      define("racing-46","Racing 46","Números / Jerseys","Velocidad y dorsal de competición",slate,[L(77,{x1:35,x2:260,sw:4}),T("RACING TEAM",112,29,"Oswald",{slot:"name",spacing:65}),T("46",200,123,"Racing Sans One",{slot:"number",stroke:"accent",strokeWidth:3,angle:-5}),L(277,{x1:52,x2:242,sw:6})]),
      define("street-11","Street Eleven","Números / Jerseys","Diseño alternativo con dorsal vertical",gold,[T("YOUR NAME",92,29,"Montserrat",{slot:"name",spacing:100}),T("11",185,129,"Anton",{slot:"number",stroke:"accent",strokeWidth:3,angle:-7}),T("STREET LEAGUE",283,13,"Montserrat",{spacing:75})]),
      define("team-09","Team 09","Números / Jerseys","Número central con emblemas",sky,[C(150,172,117,{stroke:"accent",sw:3}),T("TEAM NAME",91,29,"Montserrat",{slot:"name",spacing:75}),T("09",188,111,"Anton",{slot:"number",stroke:"accent",strokeWidth:3}),S(81,268,14),S(221,268,14)]),
      define("classic-76","Classic 76","Números / Jerseys","Tipografía de campeonato retro",cream,[T("CLASSIC CLUB",96,29,"Bebas Neue",{slot:"name",spacing:65}),L(123,{x1:68,x2:232,sw:2}),T("76",208,122,"Anton",{slot:"number",stroke:"accent",strokeWidth:4}),T("EST. 2026",281,14,"Montserrat",{spacing:130})]),
      define("jersey-24","Jersey 24","Números / Jerseys","Dorsal limpio para equipos o amigos",rose,[T("YOUR TEAM",96,34,"Montserrat",{slot:"name",spacing:90}),T("24",206,124,"Bebas Neue",{slot:"number",stroke:"accent",strokeWidth:4}),L(272,{x1:57,x2:243,sw:3}),T("UNITED IN STYLE",295,13,"Montserrat",{spacing:50})]),
      define("urbano","Urbano clásico","Urbanos","Diseño original de la primera colección",night,[T("STREET",140,52,"Bebas Neue"),T("OWN YOUR WAY",210,19,"Montserrat",{spacing:85}),L(254,{x1:95,x2:205,sw:5})]),
      define("minimal","Minimal clásico","Minimalistas","El diseño esencial de PixBen",cream,[T("LESS",149,56,"Montserrat",{spacing:95}),T("IS MORE",216,23,"Montserrat",{spacing:155}),L(260,{x1:97,x2:203,sw:4})]),
      define("negocio","Tu marca clásico","Negocios","Tu nombre como protagonista",night,[T("TU MARCA",145,45,"Montserrat"),T("IDEAS · IMPACTO",211,18,"Montserrat",{spacing:110}),L(256,{x1:88,x2:212,sw:5})]),
      define("celebracion","Celebración clásica","Lettering","Un regalo con mensaje original",rose,[T("HOY",143,63,"Playfair Display"),T("ES TU DÍA",206,21,"Montserrat",{spacing:95}),S(150,259,19)]),
    ];
    const categories=["Todos","Urbanos","Moda coreana","Juvenil / Aesthetic","Números / Jerseys","Cristianos","Minimalistas","Retro","Deportivos","Lettering","Negocios"];
    const lookup=new Map(templates.map(x=>[x.id,x]));
    const esc=text=>String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
    function palette(t){const [bg1,bg2,ink,accent]=t.theme;return {bg1,bg2,ink,accent,muted:accent,bg:bg1};}
    function resolve(t,token){const p=palette(t);return p[token]||token||"none";}
    function starPoints(x,y,r){
       return Array.from({length:10},(_,i)=>{
          const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.42:r;
          return [x+Math.cos(a)*rad,y+Math.sin(a)*rad].map(n=>n.toFixed(2)).join(",");
       }).join(" ");
    }
    function textSvg(p,t){
      const color=resolve(t,p.color),font=esc(p.font||"Montserrat");
      const a=p.align==="left"?"start":p.align==="right"?"end":"middle";
      const weight=p.weight==="normal"?"400":"700";
      const attrs=`x="${p.x}" y="${p.y}" font-family="${font},sans-serif" font-size="${p.size}" font-weight="${weight}" fill="${esc(color)}" text-anchor="${a}" dominant-baseline="middle"`;
      const transform=p.angle?` transform="rotate(${p.angle} ${p.x} ${p.y})"`:"";
      const tracking=p.spacing?` letter-spacing="${(p.spacing/100).toFixed(2)}"`:"";
      const italic=p.italic?' font-style="italic"':"";
      const stroke=p.stroke?` stroke="${esc(resolve(t,p.stroke))}" stroke-width="${p.strokeWidth||1}" paint-order="stroke"`:"";
      return `<text ${attrs}${transform}${tracking}${italic}${stroke}>${esc(p.text)}</text>`;
    }
    function shapeSvg(p,t){
      const color=resolve(t,p.color),stroke=resolve(t,p.stroke||"none");
      const common=`fill="${esc(color)}" stroke="${esc(stroke)}" stroke-width="${p.sw||0}"`;
      if(p.type==="line")return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${esc(color)}" stroke-width="${p.sw||2}" stroke-linecap="round"/>`;
      if(p.type==="rect")return `<rect x="${p.x-p.w/2}" y="${p.y-p.h/2}" width="${p.w}" height="${p.h}" rx="${p.r||0}" ${common}/>`;
      if(p.type==="circle")return `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" ${common}/>`;
      if(p.type==="star")return `<polygon points="${starPoints(p.x,p.y,p.r)}" ${common}/>`;
      return "";
    }

    // El dorsal y el nombre se sustituyen en copias, sin mutar los diseños maestros.
    function customize(t,values={}){
      if(!t || !t.parts.some(p=>p.slot==="number")) return t;
      const number=String(values.number ?? t.parts.find(p=>p.slot==="number")?.text ?? "23")
          .replace(/[^0-9]/g,"").slice(0,3) || "23";
      const name=String(values.name ?? t.parts.find(p=>p.slot==="name")?.text ?? "YOUR TEAM")
          .replace(/[<>\x00-\x1f\x7f]/g,"").trim().slice(0,18).toUpperCase() || "YOUR TEAM";
      return {...t,parts:t.parts.map(p=>{
        if(p.slot==="name")return {...p,text:name};
        if(p.slot==="number")return {...p,text:number,
            size:Number(p.size)*(number.length>=3?.73:1)};
        return {...p};
      })};
    }
    function renderSvg(t,{download=false}={}){
      const pal=palette(t);
      const id="g"+t.id.replace(/[^a-z0-9]/g,"");
      const markup=t.parts.map(part=>part.type==="text"?textSvg(part,t):shapeSvg(part,t)).join("");
      const sample=download?`<g opacity=".72"><rect x="0" y="307" width="300" height="33" fill="#120d19"/><text x="150" y="328" font-family="Arial,sans-serif" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">PIXBEN · MUESTRA / NO FINAL PARA IMPRESIÓN</text></g>`:"";
      const defs=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${pal.bg1}"/><stop offset="100%" stop-color="${pal.bg2}"/></linearGradient></defs>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" ${download?'width="900" height="1020"':''} role="img" aria-label="${esc(t.name)}">${defs}<rect width="300" height="340" fill="url(#${id})"/><path d="M18 28H282M18 312H282" stroke="${esc(pal.accent)}" stroke-opacity=".35" stroke-width="1"/>${markup}${sample}</svg>`;
    }
    const fontsFor=t=>[...new Set(t.parts.filter(p=>p.type==="text").map(p=>p.font))];
    const loadedFonts=new Set();
    function ensureFonts(visible){
      const families=visible.flatMap(fontsFor).filter(f=>!loadedFonts.has(f));
      const unique=[...new Set(families)].slice(0,25);
      if(!unique.length)return;
      unique.forEach(f=>loadedFonts.add(f));
      const link=document.createElement("link");
      link.rel="stylesheet";
      link.href="https://fonts.googleapis.com/css2?"+unique.map(f=>"family="+encodeURIComponent(f).replace(/%20/g,"+")).join("&")+"&display=swap";
      document.head.appendChild(link);
    }
    function downloadTemplate(t){
      if(!t)return false;
      const blob=new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n`+renderSvg(t,{download:true})],{type:"image/svg+xml;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;a.download=`PixBen-plantilla-${t.id}.svg`;
      document.body.appendChild(a);
      a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),15000);
      return true;
    }
    window.PixBenTemplateLibrary=Object.freeze({
      items:templates,
      categories,
      get:id=>lookup.get(id)||null,
      renderSvg,
      customize,
      ensureFonts,
      downloadTemplate
    });
})();
