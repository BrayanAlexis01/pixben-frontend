"use strict";
/* Control de interfaz: usa exclusivamente la API acotada del personalizador.
   No toca la estructura interna de Fabric ni los datos de las cotizaciones. */
(() => {
    const mq = window.matchMedia("(min-width: 1321px)");
    const studio = window.PixBenStudioEditor;
    const tools = document.getElementById("pbStudioTools");
    const rail = [...document.querySelectorAll("[data-pb-desktop-tool]")];
    const details = [...(tools?.querySelectorAll(":scope > details.grupo-editor") || [])];
    const templates = document.getElementById("pbProTemplates");
    const printPanel = document.getElementById("pbProPrintPanel");
    const stage = document.getElementById("pbProProductStage");
    const image = document.getElementById("pbProProductImage");
    const empty = document.getElementById("pbProProductEmpty");
    const stageButtons = [...document.querySelectorAll("[data-pb-stage-mode]")];
    const previewButtons = [...document.querySelectorAll("[data-pb-preview-mode]")];
    const canvasShell = document.getElementById("canvasShell");
    const sideLabel = document.getElementById("pbProStageSide");
    const liveState = document.getElementById("pbProLiveState");
    let current = "producto";
    let stageMode = "design";
    let lastSelected = "ninguno";
    let lastSide = "";
    let ultimaCaptura = 0;
    let temporizadorVista = null;
    function programarVistaProducto() {
        if (!mq.matches || stageMode !== "product") return;
        clearTimeout(temporizadorVista);
        temporizadorVista = setTimeout(refreshProductStage, 280);
    }
    if (!studio || !tools || details.length !== 7 || !templates || !printPanel || !stage || !image) return;

    const sections = {
        producto:[0], plantillas:[], texto:[1,2], imagen:[1,3],
        elementos:[1,4,5], capas:[5,6], calidad:[]
    };

    function chooseTool(name, options = {}) {
        if (!mq.matches || !Object.prototype.hasOwnProperty.call(sections,name)) return;
        current = name;
        tools.classList.add("pb-pro-rail-active");
        details.forEach((group,index) => {
            const show = sections[name].includes(index);
            group.classList.toggle("pb-pro-group-active",show);
            if (show && !group.hidden) group.open = true;
        });
        templates.hidden = name !== "plantillas";
        printPanel.hidden = name !== "calidad";
        rail.forEach(button => {
            const active = button.dataset.pbDesktopTool === name;
            button.setAttribute("aria-pressed",String(active));
            button.classList.toggle("pb-pro-rail-selected",active);
        });
        if (options.focusFirst) {
            const target = name === "plantillas" ? templates.querySelector("button") :
                name === "calidad" ? printPanel.querySelector("input") :
                tools.querySelector(".grupo-editor.pb-pro-group-active:not([hidden]) summary");
            target?.focus({preventScroll:true});
        }
    }

    function showDesign() {
        stageMode="design";
        ultimaCaptura++;
        stage.hidden=true;
        canvasShell.removeAttribute("aria-hidden");
        stageButtons.forEach(b => b.setAttribute("aria-pressed",String(b.dataset.pbStageMode==="design")));
    }
    async function refreshProductStage() {
        if (!mq.matches || stageMode!=="product") return;
        const captura = ++ultimaCaptura;
        try {
            const imageData = await studio.capturarProductoActual();
            if (captura !== ultimaCaptura || !mq.matches || stageMode!=="product") return;
            if (imageData) {
                image.src=imageData;
                image.hidden=false;
                empty.hidden=true;
            } else {
                image.removeAttribute("src");
                image.hidden=true;
                empty.hidden=false;
            }
        } catch(error) {
            image.removeAttribute("src");
            image.hidden=true;
            empty.hidden=false;
            const label = empty.querySelector("span");
            if(label) label.textContent="No se pudo generar la simulación. Revisa la imagen del producto o vuelve al modo Diseño.";
        }
    }
    function showProduct() {
        if (!mq.matches) return;
        stageMode="product";
        stage.hidden=false;
        canvasShell.setAttribute("aria-hidden","true");
        stageButtons.forEach(b => b.setAttribute("aria-pressed",String(b.dataset.pbStageMode==="product")));
        lastSide=studio.getState().lado;
        refreshProductStage();
    }

    function syncMode() {
        if (!mq.matches) {
            tools.classList.remove("pb-pro-rail-active");
            details.forEach(group=>group.classList.remove("pb-pro-group-active"));
            const tablet = window.innerWidth > 820;
            if(tablet) details.forEach(group=>group.open=true);
            // En tablet las herramientas siguen en su layout tradicional, pero
            // plantillas y ayudas quedan accesibles. En móvil las controla su barra inferior.
            if(tablet) {
                templates.hidden=false;
                printPanel.hidden=false;
            } else {
                // Al entrar al editor móvil el panel Calidad no debe interrumpir
                // ninguna pestaña; Producto habilita sus plantillas al abrirse.
                templates.hidden=true;
                printPanel.hidden=true;
            }
            showDesign();
            return;
        }
        chooseTool(current);
    }
    rail.forEach(button=>button.addEventListener("click",()=>chooseTool(button.dataset.pbDesktopTool,{focusFirst:true})));
    document.querySelectorAll("[data-pb-proxy]").forEach(button=>{
        button.addEventListener("click",()=>document.getElementById(button.dataset.pbProxy)?.click());
    });

    /* Biblioteca original: el catálogo y sus SVG no se descargan hasta pulsar
       Explorar plantillas. Se renderizan 8 tarjetas por lote para ahorrar memoria. */
    const libraryButton = document.getElementById("pbLoadTemplateLibrary");
    const libraryIntro = document.getElementById("pbTemplateLibraryIntro");
    const libraryBody = document.getElementById("pbTemplateLibraryBody");
    const libraryBackdrop = document.getElementById("pbTemplateLibraryBackdrop");
    const closeLibraryButton = document.getElementById("pbCloseTemplateLibrary");
    const libraryMessage = document.getElementById("pbTemplateLibraryMessage");
    const categoryList = document.getElementById("pbTemplateCategories");
    const templateGallery = document.getElementById("pbTemplateGallery");
    const templateSearch = document.getElementById("pbTemplateSearch");
    const templateCount = document.getElementById("pbTemplateCount");
    const showMore = document.getElementById("pbTemplateMore");
    const templateFeedback = document.getElementById("pbProTemplateFeedback");
    let templatePackRequest = null;
    let selectedCategory = "Todos";
    let visibleTemplateCount = 8;
    let templateSearchTerm = "";
    let previewDialog=null;
    let previewBackdrop=null;
    let previewTrigger=null;
    let previewItem=null;
    let previewDialogFocus=null;
    let lastTemplateCount=0;
    const originalTemplateParent = libraryBody?.parentElement;
    const originalBackdropParent = libraryBackdrop?.parentElement;
    function restoreTemplateLocation() {
        if(originalBackdropParent && libraryBackdrop?.parentElement !== originalBackdropParent) {
            originalBackdropParent.append(libraryBackdrop);
        }
        if(originalTemplateParent && libraryBody?.parentElement !== originalTemplateParent) {
            originalTemplateParent.append(libraryBody);
        }
    }

    function closeTemplateGallery() {
        if (previewDialog && !previewDialog.hidden) closeTemplatePreview();
        if (!libraryBody || libraryBody.hidden) return;
        libraryBody.hidden=true;
        libraryBody.classList.remove("pb-template-library-overlay");
        restoreTemplateLocation();
        libraryBody.removeAttribute("role");
        libraryBody.removeAttribute("aria-modal");
        if(libraryBackdrop)libraryBackdrop.hidden=true;
        if(libraryIntro)libraryIntro.hidden=false;
        libraryButton?.setAttribute("aria-expanded","false");
        if(libraryMessage)libraryMessage.textContent="";
        libraryButton?.focus({preventScroll:true});
    }
    function openTemplateGallery() {
        if(!libraryBody)return;
        libraryBody.hidden=false;
        if(libraryIntro)libraryIntro.hidden=true;
        const wide=window.innerWidth>820;
        // Los paneles laterales tienen overflow; movemos el overlay al body
        // solo mientras está abierto para que el lienzo no lo recorte.
        if(wide){
            if(libraryBackdrop)document.body.append(libraryBackdrop);
            document.body.append(libraryBody);
        } else restoreTemplateLocation();
        libraryBody.classList.toggle("pb-template-library-overlay",wide);
        if(libraryBackdrop)libraryBackdrop.hidden=!wide;
        if(wide) {
            libraryBody.setAttribute("role","dialog");
            libraryBody.setAttribute("aria-modal","true");
        } else {
            libraryBody.removeAttribute("role");
            libraryBody.removeAttribute("aria-modal");
        }
        libraryButton?.setAttribute("aria-expanded","true");
    }
    closeLibraryButton?.addEventListener("click",closeTemplateGallery);
    libraryBackdrop?.addEventListener("click",closeTemplateGallery);
    document.addEventListener("keydown",event=>{
        if (previewDialog && !previewDialog.hidden) return;
        if(libraryBody?.hidden||!libraryBody?.classList.contains("pb-template-library-overlay"))return;
        if(event.key==="Escape"){
            event.preventDefault();
            event.stopImmediatePropagation();
            closeTemplateGallery();
        } else if(event.key==="Tab") {
            const focusables=[...libraryBody.querySelectorAll("button:not([disabled]),input:not([disabled])")].filter(el=>!el.hidden&&el.getClientRects().length);
            if(!focusables.length)return;
            const first=focusables[0],last=focusables[focusables.length-1];
            if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
    },true);
    window.addEventListener("resize",()=>{
        if(libraryBody&&!libraryBody.hidden)openTemplateGallery();
    },{passive:true});

    function normalizeTemplateText(text) {
        return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    }

    function requestTemplatePack() {
        if (window.PixBenTemplateLibrary) return Promise.resolve(window.PixBenTemplateLibrary);
        if (!templatePackRequest) {
            templatePackRequest = new Promise((resolve,reject)=>{
                const script=document.createElement("script");
                script.src="../js/personaliza-template-library.js?v=2";
                script.async=true;
                script.onload=()=>{
                    if (window.PixBenTemplateLibrary) resolve(window.PixBenTemplateLibrary);
                    else reject(new Error("La biblioteca de plantillas no está disponible."));
                };
                script.onerror=()=>reject(new Error("No se pudo cargar la biblioteca. Revisa tu conexión."));
                document.head.appendChild(script);
            }).catch(err=>{
                templatePackRequest=null;
                throw err;
            });
        }
        return templatePackRequest;
    }

    function getFilteredTemplates() {
        const pack=window.PixBenTemplateLibrary;
        if (!pack) return [];
        const term=normalizeTemplateText(templateSearchTerm);
        return pack.items.filter(t=>{
            const categoryMatch=selectedCategory==="Todos"||selectedCategory===t.category;
            const textMatch=!term||normalizeTemplateText(
                [t.name,t.category,t.description,t.id].join(" ")
            ).includes(term);
            return categoryMatch&&textMatch;
        });
    }

    function renderTemplateCategories() {
        const pack=window.PixBenTemplateLibrary;
        if (!pack||!categoryList) return;
        categoryList.replaceChildren();
        pack.categories.forEach(category=>{
            const button=document.createElement("button");
            button.type="button";
            button.textContent=category;
            button.setAttribute("aria-pressed",String(category===selectedCategory));
            button.className=category===selectedCategory?"pb-template-category-selected":"";
            button.addEventListener("click",()=>{
                selectedCategory=category;
                visibleTemplateCount=8;
                renderTemplateCategories();
                renderTemplateCards({resetScroll:true});
            });
            categoryList.append(button);
        });
    }

    function makeTemplateCard(template,library) {
        const card=document.createElement("article");
        card.className="pb-template-card";
        const picture=document.createElement("button");
        picture.type="button";
        picture.className="pb-template-card__art";
        picture.dataset.templateId=template.id;
        picture.dataset.templateAction="preview";
        picture.setAttribute("aria-label","Ver en grande la plantilla "+template.name);
        picture.title="Ver plantilla en grande";
        // Solo se inserta SVG generado desde definiciones originales del repositorio,
        // no desde nombres ni HTML introducidos por usuarios.
        picture.innerHTML=library.renderSvg(template)+
          '<span class="pb-template-card__zoom"><i class="fa-solid fa-magnifying-glass-plus" aria-hidden="true"></i> Ver grande</span>';
        const info=document.createElement("div");
        info.className="pb-template-card__info";
        const label=document.createElement("span");
        label.className="pb-template-card__category";
        label.textContent=template.category;
        if(template.parts.some(p=>p.slot==="number")) {
            const editable=document.createElement("span");
            editable.className="pb-template-card__editable";
            editable.innerHTML='<i class="fa-solid fa-pen" aria-hidden="true"></i> Número editable';
            info.append(editable);
        }
        const title=document.createElement("strong");
        title.textContent=template.name;
        const description=document.createElement("small");
        description.textContent=template.description;
        info.append(label,title,description);
        const actions=document.createElement("div");
        actions.className="pb-template-card__actions";
        const use=document.createElement("button");
        use.type="button";
        use.dataset.templateId=template.id;
        use.dataset.templateAction="apply";
        use.innerHTML='<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Usar';
        use.className="pb-template-card__apply";
        use.setAttribute("aria-label","Usar plantilla "+template.name);
        const download=document.createElement("button");
        download.type="button";
        download.dataset.templateId=template.id;
        download.dataset.templateAction="download";
        download.innerHTML='<i class="fa-solid fa-download" aria-hidden="true"></i> Descargar muestra';
        download.className="pb-template-card__download";
        download.setAttribute("aria-label","Descargar muestra de "+template.name+" en SVG");
        actions.append(use,download);
        card.append(picture,info,actions);
        return card;
    }


    function renderTemplateCards({resetScroll=false,revealNew=false} = {}) {
        if (!templateGallery || !window.PixBenTemplateLibrary) return;
        const pack=window.PixBenTemplateLibrary;
        const list=getFilteredTemplates();
        const subset=list.slice(0,visibleTemplateCount);
        const current=[...templateGallery.querySelectorAll("article[data-template-id]")];
        const canAppend=!resetScroll && current.length>0 &&
            current.length<subset.length &&
            current.every((card,index)=>card.dataset.templateId===subset[index].id);
        const start=canAppend?current.length:0;
        const oldScroll=resetScroll?0:templateGallery.scrollTop;
        if(!canAppend) templateGallery.replaceChildren();
        const fragment=document.createDocumentFragment();
        subset.slice(start).forEach(template=>{
            const card=makeTemplateCard(template,pack);
            card.dataset.templateId=template.id;
            fragment.appendChild(card);
        });
        const firstNewCard=fragment.firstElementChild;
        templateGallery.appendChild(fragment);
        if(!subset.length) {
            const note=document.createElement("p");
            note.className="pb-template-gallery-empty";
            note.textContent="No encontramos diseños con esos filtros. Prueba otra categoría o palabra.";
            templateGallery.append(note);
        }
        templateGallery.scrollTop=oldScroll;
        if(revealNew && firstNewCard && window.innerWidth>820) {
            const firstCard=templateGallery.querySelector(".pb-template-card");
            if(firstCard){
                const targetTop=firstNewCard.offsetTop-firstCard.offsetTop;
                templateGallery.scrollTo({
                    top:Math.max(0,targetTop-8),
                    behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"
                });
            }
        }
        const visible=subset.length;
        lastTemplateCount=visible;
        if(templateCount)templateCount.textContent="Mostrando "+visible+" de "+list.length+" diseños";
        if(showMore){
            const remain=list.length-visible;
            showMore.hidden=remain===0;
            showMore.innerHTML=remain===0?"":'<i class="fa-solid fa-chevron-down" aria-hidden="true"></i> Mostrar '+Math.min(remain,8)+' más ('+remain+' restantes)';
        }
        pack.ensureFonts(subset);
    }

    function createTemplatePreview(){
        if(previewDialog)return;
        previewBackdrop=document.createElement("div");
        previewBackdrop.className="pb-template-preview-backdrop";
        previewBackdrop.hidden=true;
        previewDialog=document.createElement("section");
        previewDialog.className="pb-template-preview";
        previewDialog.hidden=true;
        previewDialog.setAttribute("role","dialog");
        previewDialog.setAttribute("aria-modal","true");
        previewDialog.setAttribute("aria-labelledby","pbTemplatePreviewTitle");
        previewDialog.innerHTML=[
           '<div class="pb-template-preview__dialog">',
           '  <div class="pb-template-preview__visual">',
           '    <div class="pb-template-preview__design" id="pbTemplatePreviewArt"></div>',
           '    <div class="pb-template-preview__navigation">',
           '      <button type="button" data-pb-preview-nav="-1" aria-label="Plantilla anterior"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>',
           '      <span id="pbTemplatePreviewPosition"></span>',
           '      <button type="button" data-pb-preview-nav="1" aria-label="Siguiente plantilla"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>',
           '    </div>',
           '  </div>',
           '  <div class="pb-template-preview__info">',
           '    <button type="button" class="pb-template-preview__close" data-pb-preview-close aria-label="Cerrar vista previa"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>',
           '    <span class="pb-template-preview__label" id="pbTemplatePreviewCategory"></span>',
           '    <h3 class="pb-template-preview__title" id="pbTemplatePreviewTitle"></h3>',
           '    <p class="pb-template-preview__description" id="pbTemplatePreviewDescription"></p>',
           '    <div class="pb-template-preview__customize" id="pbTemplateJerseyCustomize" hidden>',
           '      <strong><i class="fa-solid fa-shirt" aria-hidden="true"></i> Personaliza tu dorsal</strong>',
           '      <div class="pb-template-preview__fields">',
           '        <label for="pbTemplateJerseyNumber">Número (1 a 3 dígitos)<input type="text" id="pbTemplateJerseyNumber" inputmode="numeric" pattern="[0-9]{1,3}" maxlength="3" autocomplete="off" placeholder="23"></label>',
           '        <label for="pbTemplateJerseyName">Nombre o equipo<input type="text" id="pbTemplateJerseyName" maxlength="18" autocomplete="off" placeholder="TU EQUIPO"></label>',
           '      </div>',
           '      <small>Visualiza el resultado al escribir. Después podrás editar cada texto en el lienzo.</small>',
           '    </div>',
           '    <p class="pb-template-preview__tip"><strong>Diseño ampliado:</strong> comprueba las letras, la composición y los detalles antes de elegir. Cada parte se puede editar en PixBen Studio.</p>',
           '    <div class="pb-template-preview__actions">',
           '      <button type="button" data-pb-preview-action="use"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Usar este diseño</button>',
           '      <button type="button" data-pb-preview-action="download"><i class="fa-solid fa-download" aria-hidden="true"></i> Descargar muestra SVG</button>',
           '    </div>',
           '    <p class="pb-template-preview__smallprint">La descarga incluye una marca de muestra PixBen y no es el archivo final de impresión.</p>',
           '    <p class="pb-template-preview__status" id="pbTemplatePreviewStatus" role="status" aria-live="polite"></p>',
           '  </div>',
           '</div>'
        ].join("");
        document.body.append(previewBackdrop,previewDialog);
        previewBackdrop.addEventListener("click",closeTemplatePreview);
        previewDialog.querySelector("[data-pb-preview-close]").addEventListener("click",closeTemplatePreview);
        previewDialog.querySelectorAll("[data-pb-preview-nav]").forEach(button=>
            button.addEventListener("click",()=>navigateTemplatePreview(Number(button.dataset.pbPreviewNav)))
        );
        previewDialog.querySelector('[data-pb-preview-action="use"]').addEventListener("click",async event=>{
            if(!previewItem)return;
            await applyLibraryTemplate(previewItem,event.currentTarget,true);
        });
        previewDialog.querySelector('[data-pb-preview-action="download"]').addEventListener("click",event=>{
            if(previewItem)downloadLibraryTemplate(previewItem,true);
        });
        const dorsalInput=previewDialog.querySelector("#pbTemplateJerseyNumber");
        const nameInput=previewDialog.querySelector("#pbTemplateJerseyName");
        dorsalInput.addEventListener("input",()=>{
            dorsalInput.value=dorsalInput.value.replace(/[^0-9]/g,"").slice(0,3);
            updateTemplatePreviewArtwork();
        });
        nameInput.addEventListener("input",()=>{
            nameInput.value=nameInput.value.replace(/[<>]/g,"").slice(0,18);
            updateTemplatePreviewArtwork();
        });
    }
    function getTemplateOptions(item,fromPreview=false){
        if(!item?.parts.some(p=>p.slot==="number")||!fromPreview||!previewDialog)return {};
        return {
            number:previewDialog.querySelector("#pbTemplateJerseyNumber")?.value||undefined,
            name:previewDialog.querySelector("#pbTemplateJerseyName")?.value||undefined
        };
    }
    function updateTemplatePreviewArtwork(){
        if(!previewDialog||!previewItem)return;
        const lib=window.PixBenTemplateLibrary;
        const customized=lib.customize(previewItem,getTemplateOptions(previewItem,true));
        previewDialog.querySelector("#pbTemplatePreviewArt").innerHTML=lib.renderSvg(customized);
    }
    function fillTemplatePreview(item){
        const pack=window.PixBenTemplateLibrary;
        if(!item||!pack||!previewDialog)return;
        previewItem=item;
        const editableNumber=item.parts.some(p=>p.slot==="number");
        const editPanel=previewDialog.querySelector("#pbTemplateJerseyCustomize");
        editPanel.hidden=!editableNumber;
        if(editableNumber){
            previewDialog.querySelector("#pbTemplateJerseyNumber").value=
                item.parts.find(p=>p.slot==="number")?.text||"23";
            previewDialog.querySelector("#pbTemplateJerseyName").value=
                item.parts.find(p=>p.slot==="name")?.text||"TU EQUIPO";
        }
        updateTemplatePreviewArtwork();
        previewDialog.querySelector("#pbTemplatePreviewTitle").textContent=item.name;
        previewDialog.querySelector("#pbTemplatePreviewCategory").textContent=item.category;
        previewDialog.querySelector("#pbTemplatePreviewDescription").textContent=item.description;
        const list=getFilteredTemplates();
        const position=list.findIndex(t=>t.id===item.id);
        previewDialog.querySelector("#pbTemplatePreviewPosition").textContent=position+1+" / "+list.length;
        previewDialog.querySelector("#pbTemplatePreviewStatus").textContent="";
        pack.ensureFonts([item]);
    }
    function openTemplatePreview(item,button){
        createTemplatePreview();
        previewTrigger=button;
        previewDialogFocus=document.activeElement;
        if(libraryBody) {
            libraryBody.setAttribute("aria-hidden","true");
            libraryBody.inert=true;
        }
        fillTemplatePreview(item);
        previewBackdrop.hidden=false;
        previewDialog.hidden=false;
        document.body.classList.add("pb-template-preview-open");
        previewDialog.querySelector("[data-pb-preview-close]")?.focus({preventScroll:true});
    }
    function closeTemplatePreview(){
        if(!previewDialog||previewDialog.hidden)return;
        previewDialog.hidden=true;
        previewBackdrop.hidden=true;
        document.body.classList.remove("pb-template-preview-open");
        if(libraryBody){
            libraryBody.removeAttribute("aria-hidden");
            libraryBody.inert=false;
        }
        const previous=previewTrigger||previewDialogFocus;
        previewItem=null;
        if(previous?.isConnected)previous.focus({preventScroll:true});
    }
    function navigateTemplatePreview(offset){
        const list=getFilteredTemplates();
        if(!list.length||!previewItem)return;
        const idx=list.findIndex(t=>t.id===previewItem.id);
        const next=(idx+offset+list.length)%list.length;
        fillTemplatePreview(list[next]);
    }
    document.addEventListener("keydown",event=>{
        if(!previewDialog||previewDialog.hidden)return;
        if(event.key==="Escape"){
            event.preventDefault();
            event.stopImmediatePropagation();
            closeTemplatePreview();
        }else if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
            event.preventDefault();
            navigateTemplatePreview(event.key==="ArrowRight"?1:-1);
        }else if(event.key==="Tab"){
            const focusables=[...previewDialog.querySelectorAll('button:not([disabled])')]
               .filter(el=>el.getClientRects().length>0);
            if(!focusables.length)return;
            const first=focusables[0],last=focusables[focusables.length-1];
            if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
            if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
    },true);

    function downloadLibraryTemplate(item,inPreview=false){
        const pack=window.PixBenTemplateLibrary;
        try{
            const personalized=pack?.customize(item,getTemplateOptions(item,inPreview))||item;
            pack?.downloadTemplate(personalized);
            const status="Se solicitó la descarga de «"+item.name+"» en SVG de muestra.";
            if(libraryMessage)libraryMessage.textContent=status;
            if(inPreview&&previewDialog)previewDialog.querySelector("#pbTemplatePreviewStatus").textContent=status;
        }catch(err){
            const status="No se pudo generar la muestra. Inténtalo nuevamente.";
            if(libraryMessage)libraryMessage.textContent=status;
            if(inPreview&&previewDialog)previewDialog.querySelector("#pbTemplatePreviewStatus").textContent=status;
        }
    }
    async function applyLibraryTemplate(item,button,fromPreview=false){
        if(button.disabled)return;
        button.disabled=true;
        const original=button.innerHTML;
        button.innerHTML='<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Añadiendo...';
        try{
            const applied=await studio.aplicarPlantillaEstudio(item.id,getTemplateOptions(item,fromPreview));
            if(applied){
                if(templateFeedback)templateFeedback.textContent=
                  "Plantilla «"+item.name+"» añadida. Ya puedes editar sus textos y formas.";
                if(fromPreview)closeTemplatePreview();
                closeTemplateGallery();
                if(mq.matches)chooseTool("texto");
                else if(window.matchMedia("(max-width:820px)").matches){
                    document.querySelector("[data-pb-mobile-close]")?.click();
                }
            }else{
                const status="No se realizaron cambios en el diseño.";
                if(templateFeedback)templateFeedback.textContent=status;
                if(fromPreview&&previewDialog)previewDialog.querySelector("#pbTemplatePreviewStatus").textContent=status;
            }
        }catch(err){
            const status=err.message||"No se pudo aplicar la plantilla.";
            if(templateFeedback)templateFeedback.textContent=status;
            if(fromPreview&&previewDialog)previewDialog.querySelector("#pbTemplatePreviewStatus").textContent=status;
        }finally{
            button.disabled=false;
            button.innerHTML=original;
        }
    }

    libraryButton?.addEventListener("click",async()=>{
        if(libraryButton.disabled)return;
        libraryButton.disabled=true;
        const original=libraryButton.innerHTML;
        libraryButton.innerHTML='<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Cargando galería...';
        if(templateFeedback)templateFeedback.textContent="";
        try {
            const pack=await requestTemplatePack();
            openTemplateGallery();
            renderTemplateCategories();
            renderTemplateCards();
            if (templateFeedback) templateFeedback.textContent=
                pack.items.length+" plantillas disponibles. Puedes elegir o descargar una muestra.";
            templateSearch?.focus({preventScroll:true});
        } catch(err) {
            if (templateFeedback) templateFeedback.textContent=
                err.message||"No pudimos cargar la biblioteca. Intenta de nuevo.";
        } finally {
            libraryButton.disabled=false;
            libraryButton.innerHTML=original;
        }
    });
    templateSearch?.addEventListener("input",event=>{
        templateSearchTerm=event.target.value.slice(0,80);
        visibleTemplateCount=8;
        renderTemplateCards({resetScroll:true});
    });
    showMore?.addEventListener("click",()=>{
        visibleTemplateCount+=8;
        renderTemplateCards({revealNew:true});
    });
    templateGallery?.addEventListener("click",async event=>{
        const button=event.target.closest("button[data-template-action]");
        if(!button||button.disabled)return;
        const item=window.PixBenTemplateLibrary?.get(button.dataset.templateId);
        if(!item)return;
        const jersey=item.parts.some(part=>part.slot==="number");
        if(button.dataset.templateAction==="preview" || jersey) {
            // Los dorsales se personalizan antes de aplicar o descargar.
            openTemplatePreview(item,button);
        } else if(button.dataset.templateAction==="download") {
            downloadLibraryTemplate(item);
        } else if(button.dataset.templateAction==="apply") {
            await applyLibraryTemplate(item,button);
        }
    });

    document.getElementById("pbProSnapEnabled")?.addEventListener("change",event=>
        studio.activarGuiasMagneticas(event.target.checked)
    );
    stageButtons.forEach(button=>button.addEventListener("click",()=>{
        if(button.dataset.pbStageMode==="product") showProduct();
        else showDesign();
    }));
    document.getElementById("pbProChooseProduct")?.addEventListener("click",()=>{
        showDesign();
        chooseTool("producto",{focusFirst:true});
        document.getElementById("productoSelect")?.focus({preventScroll:true});
    });
    previewButtons.forEach(button=>button.addEventListener("click",()=>{
        const isProduct=button.dataset.pbPreviewMode==="product";
        if (isProduct && !studio.getState().tieneProducto) {
            alert("Selecciona un producto base para ver una presentación realista de la prenda.");
            return;
        }
        document.getElementById("modalPreview")?.classList.toggle("pb-pro-modal-product",isProduct);
        previewButtons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
    }));
    document.addEventListener("pixben:studio-update",event=>{
        const state=studio.getState();
        if(sideLabel) sideLabel.textContent=state.lado==="frente"?"Vista del frente":"Vista de la espalda";
        if(liveState) liveState.innerHTML='<i class="fa-solid fa-circle" aria-hidden="true"></i> '+(state.elementos ? state.elementos+" elementos en "+state.lado : "Editor listo");
        if(mq.matches) {
            if (stageMode === "product") programarVistaProducto();
            const picked=state.seleccionado;
            if(picked!==lastSelected && picked!=="ninguno" && picked!=="producto") {
                chooseTool(picked==="forma"?"elementos":picked);
            }
            if(lastSide!==state.lado && stageMode==="product") {
                lastSide=state.lado;
                // El cambio de cara ya está resuelto por el editor principal.
                refreshProductStage();
            }
            lastSelected=picked;
        }
    });
    // Los cambios en color, tamaño, cantidad o textos también actualizan la
    // simulación, sin capturar cada pulsación ni ralentizar el editor.
    tools.addEventListener("input", programarVistaProducto);
    tools.addEventListener("change", programarVistaProducto);
    mq.addEventListener?.("change",syncMode);
    syncMode();
})();