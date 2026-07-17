"use strict";

(() => {
    const usuario = obtenerUsuarioSesion();
    const canvas = new fabric.Canvas("editorCanvas", {
        preserveObjectStacking: true,
        selection: true
    });

    const productoSelect = document.getElementById("productoSelect");
    const colorProducto = document.getElementById("colorProducto");
    const tallaProducto = document.getElementById("tallaProducto");
    const cantidadProducto = document.getElementById("cantidadProducto");
    const grupoTalla = document.getElementById("grupoTalla");
    const estadoSolicitud = document.getElementById("estadoSolicitud");
    const botonSolicitar = document.getElementById("btnSolicitar");
    const colorFondoLienzo = document.getElementById("colorFondoLienzo");
    const editarProductoBase = document.getElementById("editarProductoBase");
    const coloresPrenda = {
        Blanco: "#ffffff",
        Negro: "#111111",
        Azul: "#315ca8",
        Rojo: "#b82c3a",
        Gris: "#8d9299",
        Beige: "#d7c4a3"
    };

    let productos = [];
    let productoActual = null;
    let ladoActual = "frente";
    let cargandoEstado = false;
    const estados = {frente: null, espalda: null};
    const historiales = {frente: [], espalda: []};
    const indicesHistorial = {frente: -1, espalda: -1};
    let temporizadorHistorial = null;

    configurarSesion();
    configurarBuscador();
    configurarCanvas();
    conectarEventos();
    cargarProductos();

    function configurarSesion() {
        const ocultar = ids => ids.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.style.display = "none";
        });

        if (usuario) {
            document.getElementById("nombreUsuario").textContent = obtenerNombreVisible(usuario);
            ocultar(["btnLogin", "btnRegistro"]);
        } else {
            ocultar(["btnPerfil", "btnPedidos", "btnHistorial", "btnFavoritos", "btnAdmin", "btnCerrarSesion"]);
        }
        if (!usuario || usuario.rol !== "admin") ocultar(["btnAdmin"]);

        document.getElementById("btnUsuarioMenu")?.addEventListener("click", evento => {
            evento.stopPropagation();
            document.getElementById("menuUsuario").classList.toggle("abierto");
        });
        document.getElementById("btnCerrarSesion")?.addEventListener("click", evento => {
            evento.preventDefault();
            cerrarSesionPixben(window.location.href);
        });
        document.addEventListener("click", () => document.getElementById("menuUsuario")?.classList.remove("abierto"));
    }

    function configurarBuscador() {
        const buscador = document.getElementById("buscador");
        const icono = document.getElementById("iconoBuscar");
        const input = document.getElementById("inputBuscar");
        icono?.addEventListener("click", evento => {
            evento.stopPropagation();
            buscador.classList.toggle("activo");
            if (buscador.classList.contains("activo")) input.focus();
        });
        input?.addEventListener("keydown", evento => {
            if (evento.key === "Enter" && input.value.trim()) {
                window.location.href = `productos.html?buscar=${encodeURIComponent(input.value.trim())}`;
            }
        });
        document.addEventListener("click", evento => {
            if (!buscador?.contains(evento.target)) buscador?.classList.remove("activo");
        });
    }

    function configurarCanvas() {
        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: "#7d2cba",
            borderColor: "#7d2cba",
            cornerStyle: "circle",
            padding: 4
        });
        canvas.on("selection:created", sincronizarControlesObjeto);
        canvas.on("selection:updated", sincronizarControlesObjeto);
        ["object:added", "object:modified", "object:removed"].forEach(evento => {
            canvas.on(evento, () => programarHistorial());
        });
    }

    function conectarEventos() {
        productoSelect.addEventListener("change", cambiarProducto);
        colorProducto.addEventListener("change", () => {
            aplicarColorPrendaSeleccionado();
            actualizarResumen();
        });
        [tallaProducto, cantidadProducto].forEach(elemento => elemento.addEventListener("change", actualizarResumen));
        colorFondoLienzo.addEventListener("input", () => {
            colorProducto.value = "Personalizado";
            aplicarColorFondo();
            actualizarResumen();
        });
        editarProductoBase.addEventListener("change", alternarEdicionBase);
        document.getElementById("btnRestablecerBase").addEventListener("click", restablecerProductoBase);

        document.getElementById("btnSubirImagen").addEventListener("click", () => document.getElementById("inputDiseno").click());
        document.getElementById("inputDiseno").addEventListener("change", importarImagen);
        document.getElementById("btnAgregarTexto").addEventListener("click", agregarTexto);
        document.getElementById("textoEditor").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("fuenteTexto").addEventListener("change", actualizarTextoSeleccionado);
        document.getElementById("tamanoTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("colorTexto").addEventListener("input", actualizarTextoSeleccionado);
        document.getElementById("btnNegrita").addEventListener("click", () => alternarEstilo("fontWeight", "bold", "normal"));
        document.getElementById("btnCursiva").addEventListener("click", () => alternarEstilo("fontStyle", "italic", "normal"));
        document.getElementById("btnSubrayado").addEventListener("click", () => alternarBooleano("underline"));

        document.getElementById("btnEliminar").addEventListener("click", eliminarSeleccionado);
        document.getElementById("btnDuplicar").addEventListener("click", duplicarSeleccionado);
        document.getElementById("btnCentrarH").addEventListener("click", () => centrarSeleccionado("horizontal"));
        document.getElementById("btnCentrarV").addEventListener("click", () => centrarSeleccionado("vertical"));
        document.getElementById("btnAdelante").addEventListener("click", () => moverCapa("adelante"));
        document.getElementById("btnAtras").addEventListener("click", () => moverCapa("atras"));
        document.getElementById("opacidadObjeto").addEventListener("input", actualizarTransformacion);
        document.getElementById("rotacionObjeto").addEventListener("input", actualizarTransformacion);

        document.getElementById("btnFrente").addEventListener("click", () => cambiarLado("frente"));
        document.getElementById("btnEspalda").addEventListener("click", () => cambiarLado("espalda"));
        document.getElementById("btnDeshacer").addEventListener("click", deshacer);
        document.getElementById("btnRehacer").addEventListener("click", rehacer);
        document.getElementById("btnLimpiar").addEventListener("click", limpiarLado);
        document.getElementById("btnVistaPrevia").addEventListener("click", descargarVistaPrevia);
        botonSolicitar.addEventListener("click", enviarSolicitud);
    }

    async function cargarProductos() {
        productoSelect.innerHTML = '<option value="" selected>Lienzo libre (sin producto base)</option>';
        botonSolicitar.disabled = false;
        try {
            const respuesta = await fetch(`${API_URL}/productos/personalizables`);
            if (!respuesta.ok) throw new Error("No se pudieron cargar los productos personalizables");
            productos = await respuesta.json();
            productoSelect.insertAdjacentHTML("beforeend", productos
                    .map(p => `<option value="${p.id}">${escapar(p.nombre)}</option>`)
                    .join(""));
        } catch (error) {
            console.warn(error);
            mostrarEstado("El lienzo libre está disponible. Los productos base no pudieron cargarse en este momento.", false);
        }
        productoSelect.value = "";
        await cambiarProducto();
    }

    async function cambiarProducto() {
        productoActual = productos.find(p => String(p.id) === String(productoSelect.value)) || null;
        estados.frente = null;
        estados.espalda = null;
        historiales.frente = [];
        historiales.espalda = [];
        indicesHistorial.frente = -1;
        indicesHistorial.espalda = -1;
        ladoActual = "frente";
        actualizarBotonesLado();
        grupoTalla.hidden = !productoActual || !productoUsaTalla(productoActual?.categoria, productoActual?.nombre);
        editarProductoBase.checked = false;
        editarProductoBase.disabled = !productoActual;
        document.getElementById("btnRestablecerBase").disabled = !productoActual;
        const colorInicial = coloresPrenda[colorProducto.value];
        if (colorInicial) colorFondoLienzo.value = colorInicial;
        await cargarLado("frente", true);
        actualizarResumen();
    }

    async function asegurarProductoBase() {
        canvas.setBackgroundColor(colorFondoLienzo.value, canvas.renderAll.bind(canvas));
        let base = obtenerProductoBase();
        if (base) {
            configurarInteraccionBase(base);
            canvas.sendToBack(base);
            return;
        }

        if (!productoActual?.imagen) return;
        const url = obtenerUrlImagen(productoActual.imagen);
        await new Promise(resolve => {
            fabric.Image.fromURL(url, imagen => {
                if (!imagen) {
                    resolve();
                    return;
                }
                imagen.set({
                    dataTipo: "producto-base",
                    originX: "center",
                    originY: "center",
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    crossOrigin: "anonymous"
                });
                const escala = Math.min((canvas.width * 0.92) / imagen.width, (canvas.height * 0.92) / imagen.height);
                imagen.scale(Number.isFinite(escala) && escala > 0 ? escala : 1);
                canvas.add(imagen);
                configurarInteraccionBase(imagen);
                canvas.sendToBack(imagen);
                canvas.renderAll();
                resolve();
            }, {crossOrigin: "anonymous"});
        });
    }

    function obtenerProductoBase() {
        return canvas.getObjects().find(objeto => objeto.dataTipo === "producto-base") || null;
    }

    function configurarInteraccionBase(base) {
        const editable = Boolean(editarProductoBase.checked);
        base.set({
            selectable: editable,
            evented: editable,
            lockMovementX: !editable,
            lockMovementY: !editable,
            lockScalingX: !editable,
            lockScalingY: !editable,
            lockRotation: !editable,
            hasControls: editable,
            hoverCursor: editable ? "move" : "default"
        });
        base.setCoords();
    }

    function alternarEdicionBase() {
        const base = obtenerProductoBase();
        if (!base) return;
        configurarInteraccionBase(base);
        if (editarProductoBase.checked) canvas.setActiveObject(base);
        else canvas.discardActiveObject();
        canvas.requestRenderAll();
    }

    function restablecerProductoBase() {
        const base = obtenerProductoBase();
        if (!base) return;
        const escala = Math.min((canvas.width * 0.92) / base.width, (canvas.height * 0.92) / base.height);
        base.set({left: canvas.width / 2, top: canvas.height / 2, angle: 0, scaleX: escala, scaleY: escala, flipX: false, flipY: false});
        canvas.sendToBack(base);
        base.setCoords();
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function aplicarColorPrendaSeleccionado() {
        const color = coloresPrenda[colorProducto.value];
        if (color) colorFondoLienzo.value = color;
        aplicarColorFondo();
    }

    function aplicarColorFondo() {
        canvas.setBackgroundColor(colorFondoLienzo.value, canvas.renderAll.bind(canvas));
        if (!cargandoEstado) registrarHistorialAhora();
    }

    function guardarEstadoActual() {
        estados[ladoActual] = JSON.stringify(canvas.toJSON(["dataTipo"]));
    }

    async function cargarLado(lado, inicial = false) {
        cargandoEstado = true;
        const estado = estados[lado];
        if (estado) {
            await new Promise(resolve => canvas.loadFromJSON(estado, resolve));
        } else {
            canvas.clear();
        }
        await asegurarProductoBase();
        canvas.discardActiveObject();
        canvas.renderAll();
        cargandoEstado = false;
        if (inicial || historiales[lado].length === 0) registrarHistorialAhora();
    }

    async function cambiarLado(nuevoLado) {
        if (nuevoLado === ladoActual) return;
        guardarEstadoActual();
        ladoActual = nuevoLado;
        actualizarBotonesLado();
        await cargarLado(nuevoLado);
    }

    function actualizarBotonesLado() {
        document.getElementById("btnFrente").classList.toggle("lado-activo", ladoActual === "frente");
        document.getElementById("btnEspalda").classList.toggle("lado-activo", ladoActual === "espalda");
    }

    async function importarImagen(evento) {
        const archivo = evento.target.files?.[0];
        evento.target.value = "";
        if (!archivo) return;
        const tipos = ["image/png", "image/jpeg", "image/webp"];
        if (!tipos.includes(archivo.type)) return alert("Solo se permiten PNG, JPG/JPEG o WEBP. No se permite SVG.");
        if (archivo.size > 5 * 1024 * 1024) return alert("La imagen debe pesar como máximo 5 MB.");

        try {
            const dataUrl = await leerImagenValidada(archivo);
            fabric.Image.fromURL(dataUrl, imagen => {
                imagen.set({left: 190, top: 190, dataTipo: "imagen-usuario"});
                imagen.scaleToWidth(Math.min(210, imagen.width));
                canvas.add(imagen);
                canvas.setActiveObject(imagen);
                canvas.renderAll();
            });
        } catch (error) {
            alert(error.message);
        }
    }

    function leerImagenValidada(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
            lector.onload = () => {
                const imagen = new Image();
                imagen.onerror = () => reject(new Error("El archivo no contiene una imagen válida"));
                imagen.onload = () => {
                    if (imagen.width > 6000 || imagen.height > 6000 || imagen.width * imagen.height > 24000000) {
                        reject(new Error("La imagen tiene dimensiones demasiado grandes"));
                        return;
                    }
                    resolve(lector.result);
                };
                imagen.src = lector.result;
            };
            lector.readAsDataURL(archivo);
        });
    }

    function agregarTexto() {
        const contenido = document.getElementById("textoEditor").value.trim() || "Tu texto";
        const texto = new fabric.IText(contenido, {
            left: 180,
            top: 250,
            fontFamily: document.getElementById("fuenteTexto").value,
            fontSize: Number(document.getElementById("tamanoTexto").value) || 34,
            fill: document.getElementById("colorTexto").value,
            dataTipo: "texto-usuario"
        });
        canvas.add(texto);
        canvas.setActiveObject(texto);
        canvas.renderAll();
    }

    function obtenerObjetoActivo() {
        return canvas.getActiveObject();
    }

    function actualizarTextoSeleccionado() {
        const objeto = obtenerObjetoActivo();
        if (!objeto || !["i-text", "text", "textbox"].includes(objeto.type)) return;
        objeto.set({
            text: document.getElementById("textoEditor").value || objeto.text,
            fontFamily: document.getElementById("fuenteTexto").value,
            fontSize: Number(document.getElementById("tamanoTexto").value) || objeto.fontSize,
            fill: document.getElementById("colorTexto").value
        });
        canvas.requestRenderAll();
    }

    function alternarEstilo(propiedad, activo, inactivo) {
        const objeto = obtenerObjetoActivo();
        if (!objeto || !["i-text", "text", "textbox"].includes(objeto.type)) return;
        objeto.set(propiedad, objeto[propiedad] === activo ? inactivo : activo);
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function alternarBooleano(propiedad) {
        const objeto = obtenerObjetoActivo();
        if (!objeto || !["i-text", "text", "textbox"].includes(objeto.type)) return;
        objeto.set(propiedad, !objeto[propiedad]);
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function sincronizarControlesObjeto() {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        document.getElementById("opacidadObjeto").value = Math.round((objeto.opacity ?? 1) * 100);
        document.getElementById("rotacionObjeto").value = Math.round(objeto.angle ?? 0);
        if (["i-text", "text", "textbox"].includes(objeto.type)) {
            document.getElementById("textoEditor").value = objeto.text || "";
            document.getElementById("fuenteTexto").value = objeto.fontFamily || "Arial";
            document.getElementById("tamanoTexto").value = objeto.fontSize || 34;
            document.getElementById("colorTexto").value = /^#[0-9a-f]{6}$/i.test(objeto.fill) ? objeto.fill : "#111111";
        }
    }

    function eliminarSeleccionado() {
        const objetos = canvas.getActiveObjects();
        const eliminables = objetos.filter(objeto => objeto.dataTipo !== "producto-base");
        if (!eliminables.length && objetos.length) return alert("La prenda base no se elimina. Puedes restablecerla o bloquearla.");
        eliminables.forEach(objeto => canvas.remove(objeto));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }

    function duplicarSeleccionado() {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        if (objeto.dataTipo === "producto-base") return alert("La prenda base no puede duplicarse.");
        objeto.clone(clon => {
            clon.set({left: (objeto.left || 0) + 20, top: (objeto.top || 0) + 20});
            canvas.add(clon);
            canvas.setActiveObject(clon);
            canvas.requestRenderAll();
        }, ["dataTipo"]);
    }

    function centrarSeleccionado(eje) {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        if (eje === "horizontal") canvas.centerObjectH(objeto); else canvas.centerObjectV(objeto);
        objeto.setCoords();
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function moverCapa(direccion) {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        if (objeto.dataTipo === "producto-base") return;
        direccion === "adelante" ? canvas.bringForward(objeto) : canvas.sendBackwards(objeto);
        const base = obtenerProductoBase();
        if (base) canvas.sendToBack(base);
        canvas.requestRenderAll();
        registrarHistorialAhora();
    }

    function actualizarTransformacion() {
        const objeto = obtenerObjetoActivo();
        if (!objeto) return;
        objeto.set({
            opacity: Number(document.getElementById("opacidadObjeto").value) / 100,
            angle: Number(document.getElementById("rotacionObjeto").value)
        });
        objeto.setCoords();
        canvas.requestRenderAll();
    }

    function programarHistorial() {
        if (cargandoEstado) return;
        clearTimeout(temporizadorHistorial);
        temporizadorHistorial = setTimeout(registrarHistorialAhora, 120);
    }

    function registrarHistorialAhora() {
        if (cargandoEstado) return;
        const json = JSON.stringify(canvas.toJSON(["dataTipo"]));
        const historial = historiales[ladoActual];
        const indice = indicesHistorial[ladoActual];
        if (historial[indice] === json) return;
        historial.splice(indice + 1);
        historial.push(json);
        if (historial.length > 30) historial.shift();
        indicesHistorial[ladoActual] = historial.length - 1;
        estados[ladoActual] = json;
    }

    async function aplicarHistorial(indice) {
        const historial = historiales[ladoActual];
        if (indice < 0 || indice >= historial.length) return;
        indicesHistorial[ladoActual] = indice;
        estados[ladoActual] = historial[indice];
        await cargarLado(ladoActual);
    }

    function deshacer() { aplicarHistorial(indicesHistorial[ladoActual] - 1); }
    function rehacer() { aplicarHistorial(indicesHistorial[ladoActual] + 1); }

    function limpiarLado() {
        if (!confirm(`¿Limpiar el diseño del ${ladoActual}?`)) return;
        canvas.getObjects().filter(objeto => objeto.dataTipo !== "producto-base").forEach(objeto => canvas.remove(objeto));
        canvas.discardActiveObject();
        canvas.renderAll();
        registrarHistorialAhora();
    }

    function actualizarResumen() {
        const usaTalla = productoActual && productoUsaTalla(productoActual?.categoria, productoActual?.nombre);
        const imagenResumen = document.getElementById("imagenResumen");
        const lienzoLibre = document.getElementById("lienzoLibreResumen");

        document.getElementById("nombreResumen").textContent = productoActual?.nombre || "Lienzo libre";
        if (productoActual?.imagen) {
            imagenResumen.hidden = false;
            imagenResumen.src = obtenerUrlImagen(productoActual.imagen);
            if (lienzoLibre) lienzoLibre.hidden = true;
        } else {
            imagenResumen.hidden = true;
            if (lienzoLibre) lienzoLibre.hidden = false;
        }

        const partes = [productoActual ? colorProducto.value : `Fondo ${colorProducto.value}`];
        if (usaTalla) partes.push(`Talla ${tallaProducto.value}`);
        partes.push(`${cantidadProducto.value} ${Number(cantidadProducto.value) === 1 ? "unidad" : "unidades"}`);
        document.getElementById("varianteResumen").textContent = partes.join(" · ");
    }

    async function descargarVistaPrevia() {
        guardarEstadoActual();
        const blob = await exportarLado(ladoActual);
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `pixben-${ladoActual}.png`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    }

    async function enviarSolicitud() {
        if (!usuario?.id) {
            alert("Debes iniciar sesión para enviar una solicitud personalizada");
            window.location.href = "login.html";
            return;
        }
        guardarEstadoActual();

        const tieneFrente = contarObjetos(estados.frente) > 0;
        const tieneEspalda = contarObjetos(estados.espalda) > 0;
        if (!tieneFrente && !tieneEspalda) return mostrarEstado("Agrega una imagen o un texto antes de enviar tu diseño", true);

        botonSolicitar.disabled = true;
        botonSolicitar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando diseño...';
        mostrarEstado("Generando vistas previas seguras...", false);

        const ladoOriginal = ladoActual;
        try {
            const frenteBlob = tieneFrente ? await exportarLado("frente") : null;
            const espaldaBlob = tieneEspalda ? await exportarLado("espalda") : null;
            await cargarLado(ladoOriginal);

            const datos = {
                ...crearReferenciaUsuario(usuario),
                productoId: productoActual?.id || null,
                productoNombre: productoActual?.nombre || "Diseño libre",
                categoria: productoActual?.categoria || "PERSONALIZADO_LIBRE",
                color: colorProducto.value,
                talla: productoActual && productoUsaTalla(productoActual.categoria, productoActual.nombre) ? tallaProducto.value : "POR_DEFINIR",
                cantidad: Number(cantidadProducto.value),
                notas: document.getElementById("notasPedido").value.trim()
            };

            const formData = new FormData();
            formData.append("datos", JSON.stringify(datos));
            if (frenteBlob) formData.append("frente", frenteBlob, "frente.png");
            if (espaldaBlob) formData.append("espalda", espaldaBlob, "espalda.png");

            const respuesta = await fetchConSesion(`${API_URL}/pedidos-personalizados`, {method: "POST", body: formData});
            if (!respuesta.ok) throw new Error(await obtenerMensajeError(respuesta));
            const solicitud = await respuesta.json();

            const respuestaCarrito = await fetchConSesion(`${API_URL}/carrito`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    productoId: productoActual?.id || null,
                    ...crearReferenciaUsuario(usuario),
                    cantidad: Number(cantidadProducto.value),
                    talla: datos.talla,
                    personalizado: true,
                    pedidoPersonalizadoId: solicitud.id
                })
            });
            if (!respuestaCarrito.ok) throw new Error("La solicitud se guardó, pero no pudo agregarse al carrito");

            mostrarEstado("Solicitud enviada. El precio aparecerá cuando el administrador termine la cotización.", false, true);
            setTimeout(() => { window.location.href = "carrito de compras.html"; }, 1300);
        } catch (error) {
            console.error(error);
            mostrarEstado(error.message || "No se pudo enviar la solicitud", true);
            await cargarLado(ladoOriginal);
        } finally {
            botonSolicitar.disabled = false;
            botonSolicitar.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Enviar solicitud y agregar al carrito';
        }
    }

    function contarObjetos(json) {
        if (!json) return 0;
        try { return (JSON.parse(json).objects || []).filter(objeto => objeto.dataTipo !== "producto-base").length; } catch { return 0; }
    }

    async function exportarLado(lado) {
        const ladoPrevio = ladoActual;
        ladoActual = lado;
        await cargarLado(lado);
        canvas.discardActiveObject();
        canvas.renderAll();
        const dataUrl = canvas.toDataURL({format: "png", quality: 1, multiplier: 1.2});
        ladoActual = ladoPrevio;
        return fetch(dataUrl).then(respuesta => respuesta.blob());
    }

    async function obtenerMensajeError(respuesta) {
        try {
            const json = await respuesta.json();
            return json.message || json.error || "No se pudo procesar la solicitud";
        } catch {
            return await respuesta.text() || "No se pudo procesar la solicitud";
        }
    }

    function mostrarEstado(mensaje, error = false, ok = false) {
        estadoSolicitud.textContent = mensaje;
        estadoSolicitud.className = `estado-solicitud ${error ? "error" : ok ? "ok" : ""}`;
    }

    function escapar(valor) {
        return String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    }
})();
