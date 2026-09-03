"use strict";

const usuarioAdmin = obtenerUsuarioSesion();
if (!tieneSesionValida(usuarioAdmin) || usuarioAdmin.rol !== "admin") {
    alert("Acceso exclusivo para administradores");
    window.location.replace("login.html");
}

const MAXIMO_IMAGENES = 7;
const MAXIMO_COLORES = 7;
const TALLAS_ORDENADAS = ["XS", "S", "M", "L", "XL", "XXL"];
const formularioProducto = document.getElementById("formProducto");
const inputImagenes = document.getElementById("imagenes");
const botonGuardar = formularioProducto.querySelector(".btn-guardar");
let categoriasDisponibles = [];
let cantidadImagenesActuales = 0;
let productosAdmin = [];
let paginaProductosAdmin = 1;
const PRODUCTOS_ADMIN_POR_PAGINA = 20;
const productosSeleccionadosAdmin = new Set();

configurarTabs();
configurarEventos();
Promise.all([cargarCategorias(), cargarProductos(), cargarPersonalizados(), cargarPedidosAdmin(), cargarMensajes(), cargarAnalitica()]);

function configurarTabs() {
    document.querySelectorAll(".admin-tabs button[data-seccion]").forEach(boton => {
        boton.addEventListener("click", () => {
            document.querySelectorAll(".admin-tabs button").forEach(b => b.classList.remove("tab-activo"));
            document.querySelectorAll(".admin-seccion").forEach(s => s.classList.remove("seccion-activa"));
            boton.classList.add("tab-activo");
            document.getElementById(boton.dataset.seccion).classList.add("seccion-activa");
            if (boton.dataset.seccion === "seccionAnalitica") cargarAnalitica();
        });
    });
}

function configurarEventos() {
    document.getElementById("categoria").addEventListener("change", actualizarAyudaCategoria);
    inputImagenes.addEventListener("change", actualizarPrevisualizacion);
    document.getElementById("btnAgregarColor").addEventListener("click", () => agregarFilaColor());
    document.getElementById("listaColoresAdmin").addEventListener("click", evento => {
        const boton = evento.target.closest("[data-eliminar-color]");
        if (!boton) return;
        boton.closest(".fila-color-admin")?.remove();
        reindexarColoresAdmin();
        actualizarStockColoresAdmin();
    });
    document.getElementById("listaColoresAdmin").addEventListener("input", actualizarStockColoresAdmin);
    formularioProducto.addEventListener("submit", guardarProducto);
    document.getElementById("btnLimpiarProducto").addEventListener("click", limpiarFormulario);
    document.getElementById("btnRecargarPersonalizados").addEventListener("click", cargarPersonalizados);
    document.getElementById("btnRecargarPedidos").addEventListener("click", cargarPedidosAdmin);
    document.getElementById("btnRecargarMensajes").addEventListener("click", cargarMensajes);
    document.getElementById("btnRecargarAnalitica")?.addEventListener("click", cargarAnalitica);
    document.getElementById("btnBorrarAnaliticaAntigua")?.addEventListener("click", () => borrarAnalitica(false));
    document.getElementById("btnBorrarAnalitica")?.addEventListener("click", () => borrarAnalitica(true));
    document.getElementById("btnDescargarRespaldo")?.addEventListener("click", descargarRespaldo);
    document.getElementById("buscarProductoAdmin")?.addEventListener("input", () => {paginaProductosAdmin = 1; renderizarProductosAdmin();});
    document.getElementById("campoBusquedaProductoAdmin")?.addEventListener("change", () => {paginaProductosAdmin = 1; renderizarProductosAdmin();});
    document.getElementById("filtroCategoriaProductoAdmin")?.addEventListener("change", () => {paginaProductosAdmin = 1; renderizarProductosAdmin();});
    document.getElementById("ordenProductoAdmin")?.addEventListener("change", () => {paginaProductosAdmin = 1; renderizarProductosAdmin();});
    document.getElementById("btnLimpiarFiltrosProductos")?.addEventListener("click", limpiarFiltrosProductosAdmin);
    document.getElementById("seleccionarTodosProductos")?.addEventListener("change", alternarSeleccionPaginaProductos);
    document.getElementById("btnEliminarSeleccionados")?.addEventListener("click", eliminarProductosSeleccionados);
    document.getElementById("modalVistaProductoAdmin")?.addEventListener("click", evento => { if (evento.target.closest("[data-cerrar-preview]")) cerrarVistaPreviaProductoAdmin(); });
    document.getElementById("btnEditarDesdePreview")?.addEventListener("click", () => { const id = Number(document.getElementById("modalVistaProductoAdmin")?.dataset.productoId); if (id) { cerrarVistaPreviaProductoAdmin(); editarProducto(id); } });

    document.querySelector("#tablaProductos tbody").addEventListener("click", evento => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        if (boton.dataset.accion === "editar") editarProducto(id);
        else if (boton.dataset.accion === "preview") abrirVistaPreviaProductoAdmin(id);
        else if (boton.dataset.accion === "eliminar") eliminarProducto(id);
    });
    document.querySelector("#tablaProductos tbody").addEventListener("change", evento => {
        const check = evento.target.closest("input[data-seleccionar-producto]");
        if (!check) return;
        const id = Number(check.dataset.seleccionarProducto);
        if (check.checked) productosSeleccionadosAdmin.add(id); else productosSeleccionadosAdmin.delete(id);
        actualizarSeleccionProductosAdmin();
    });

    document.getElementById("listaPersonalizados").addEventListener("click", evento => {
        const guardar = evento.target.closest("button[data-guardar-personalizado]");
        const eliminar = evento.target.closest("button[data-eliminar-personalizado]");
        if (guardar) guardarCotizacion(guardar.dataset.guardarPersonalizado);
        if (eliminar) eliminarPersonalizado(eliminar.dataset.eliminarPersonalizado);
    });

    document.getElementById("tablaPedidos").addEventListener("click", evento => {
        const guardar = evento.target.closest("button[data-guardar-pedido]");
        const eliminar = evento.target.closest("button[data-eliminar-pedido]");
        if (guardar) guardarEstadoPedido(guardar.dataset.guardarPedido);
        if (eliminar) eliminarPedido(eliminar.dataset.eliminarPedido);
    });

    document.getElementById("listaMensajes").addEventListener("click", evento => {
        const guardar = evento.target.closest("button[data-guardar-mensaje]");
        const eliminar = evento.target.closest("button[data-eliminar-mensaje]");
        if (guardar) guardarEstadoMensaje(guardar.dataset.guardarMensaje);
        if (eliminar) eliminarMensaje(eliminar.dataset.eliminarMensaje);
    });
}

async function cargarCategorias() {
    const respaldo = ["Polos", "Hoodies / Poleras", "Gorras", "Tazas", "Mousepads", "Bolsos / Totebags", "Accesorios"];
    try {
        const respuesta = await fetchConSesion(`${API_URL}/categorias`);
        if (!respuesta.ok) throw new Error();
        const categorias = await respuesta.json();
        categoriasDisponibles = [...new Set([...(categorias || []).map(c => c.nombre).filter(Boolean), ...respaldo])];
    } catch {
        categoriasDisponibles = respaldo;
    }
    completarSelectCategorias(categoriasDisponibles);
}

function completarSelectCategorias(categorias) {
    const select = document.getElementById("categoria");
    const actual = select.value;
    select.innerHTML = categorias.map(nombre => `<option value="${escaparHtml(nombre)}">${escaparHtml(nombre)}</option>`).join("");
    if (actual && categorias.includes(actual)) select.value = actual;
    actualizarAyudaCategoria();
}

function actualizarAyudaCategoria() {
    const categoria = document.getElementById("categoria").value;
    const usaTallas = productoUsaTalla(categoria);
    document.getElementById("mensajeTallaCategoria").textContent = usaTallas
            ? "Esta categoría usa tallas. Marca solo las que están disponibles."
            : "Se venderá por unidad y no pedirá talla.";

    const grupo = document.getElementById("grupoTallasDisponibles");
    grupo.hidden = !usaTallas;

    if (!usaTallas) {
        document.querySelectorAll('input[name="tallaDisponible"]').forEach(input => input.checked = false);
    } else if (!obtenerTallasSeleccionadas().length && !document.getElementById("productoId").value) {
        ["S", "M", "L", "XL"].forEach(talla => {
            const input = document.querySelector(`input[name="tallaDisponible"][value="${talla}"]`);
            if (input) input.checked = true;
        });
    }
}

function obtenerTallasSeleccionadas() {
    return Array.from(document.querySelectorAll('input[name="tallaDisponible"]:checked'))
            .map(input => input.value)
            .filter(talla => TALLAS_ORDENADAS.includes(talla));
}

function marcarTallasDisponibles(valor) {
    const recibidas = Array.isArray(valor)
            ? valor
            : String(valor || "").split(",").map(talla => talla.trim().toUpperCase()).filter(Boolean);
    document.querySelectorAll('input[name="tallaDisponible"]').forEach(input => {
        input.checked = recibidas.includes(input.value);
    });
}

function agregarFilaColor(datos = {}) {
    const lista = document.getElementById("listaColoresAdmin");
    if (lista.children.length >= MAXIMO_COLORES) {
        alert("Solo puedes configurar hasta 7 colores por producto.");
        return;
    }
    const fila = document.createElement("div");
    fila.className = "fila-color-admin";
    fila.innerHTML = `
        <span class="orden-color-admin"></span>
        <label>Nombre<input type="text" data-color-nombre maxlength="60" placeholder="Ej. Beige" value="${escaparAtributo(datos.nombre || "")}"></label>
        <label>Muestra<input type="color" data-color-hex value="${/^#[0-9a-f]{6}$/i.test(String(datos.codigoHex || "")) ? datos.codigoHex : "#808080"}"></label>
        <label>Stock<input type="number" data-color-stock min="0" max="9999" value="${Math.max(0, Number(datos.stock || 0))}"></label>
        <button type="button" class="accion-eliminar" data-eliminar-color aria-label="Eliminar color"><i class="fa-solid fa-trash"></i></button>`;
    lista.appendChild(fila);
    reindexarColoresAdmin();
    actualizarStockColoresAdmin();
    fila.querySelector("[data-color-nombre]")?.focus();
}

function reindexarColoresAdmin() {
    document.querySelectorAll("#listaColoresAdmin .fila-color-admin").forEach((fila, indice) => {
        fila.querySelector(".orden-color-admin").textContent = `Imagen ${indice + 1}`;
    });
}

function obtenerColoresAdmin() {
    const colores = Array.from(document.querySelectorAll("#listaColoresAdmin .fila-color-admin")).map((fila, indice) => ({
        nombre: fila.querySelector("[data-color-nombre]").value.trim(),
        codigoHex: fila.querySelector("[data-color-hex]").value,
        stock: Number(fila.querySelector("[data-color-stock]").value || 0),
        imagenIndice: indice
    }));
    const incompletos = colores.some(color => !color.nombre || !Number.isInteger(color.stock) || color.stock < 0);
    if (incompletos) throw new Error("Completa el nombre y stock de cada color.");
    const unicos = new Set(colores.map(color => normalizarTexto(color.nombre)));
    if (unicos.size !== colores.length) throw new Error("No repitas el mismo color.");
    return colores;
}

function cargarColoresAdmin(colores) {
    const lista = document.getElementById("listaColoresAdmin");
    lista.innerHTML = "";
    (Array.isArray(colores) ? colores : []).slice(0, MAXIMO_COLORES).forEach(color => agregarFilaColor(color));
    actualizarStockColoresAdmin();
}

function actualizarStockColoresAdmin() {
    const filas = Array.from(document.querySelectorAll("#listaColoresAdmin .fila-color-admin"));
    const stock = document.getElementById("stock");
    const ayuda = document.getElementById("ayudaStockColores");
    if (!filas.length) {
        stock.readOnly = false;
        ayuda.textContent = "Se usa cuando el producto no tiene variantes de color.";
        return;
    }
    const total = filas.reduce((suma, fila) => suma + Math.max(0, Number(fila.querySelector("[data-color-stock]").value || 0)), 0);
    stock.value = total;
    stock.readOnly = true;
    ayuda.textContent = `Calculado automáticamente: ${total} unidad(es) sumando todos los colores.`;
}

function obtenerArchivosSeleccionados() { return Array.from(inputImagenes.files || []); }

function validarImagenes(archivos, esNuevo) {
    if (archivos.length > MAXIMO_IMAGENES) throw new Error("Solo puedes seleccionar hasta 7 imágenes.");
    if (esNuevo && archivos.length === 0) throw new Error("Selecciona al menos una imagen.");
    const tipos = ["image/png", "image/jpeg", "image/webp"];
    for (const archivo of archivos) {
        if (!tipos.includes(archivo.type)) throw new Error(`El archivo ${archivo.name} no es PNG, JPG o WEBP.`);
        if (archivo.size > 8 * 1024 * 1024) throw new Error(`La imagen ${archivo.name} supera 8 MB.`);
    }
}

function actualizarPrevisualizacion() {
    const archivos = obtenerArchivosSeleccionados();
    document.getElementById("contadorImagenes").textContent = `${archivos.length} de 7 imágenes seleccionadas`;
    const contenedor = document.getElementById("previsualizacionImagenes");
    contenedor.innerHTML = "";
    archivos.slice(0, 7).forEach((archivo, indice) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "preview-imagen";
        const imagen = document.createElement("img");
        imagen.src = URL.createObjectURL(archivo);
        imagen.onload = () => URL.revokeObjectURL(imagen.src);
        const etiqueta = document.createElement("span");
        etiqueta.textContent = indice === 0 ? "Portada" : `Imagen ${indice + 1}`;
        tarjeta.append(imagen, etiqueta);
        contenedor.appendChild(tarjeta);
    });
}

async function subirGaleria(productoId, archivos) {
    if (!archivos.length) return;
    const formData = new FormData();
    archivos.forEach(archivo => formData.append("archivos", archivo));
    const respuesta = await fetchConSesion(`${API_URL}/imagenes/${productoId}`, {method: "POST", body: formData});
    if (!respuesta.ok) throw new Error(await obtenerMensajeError(respuesta));
}

async function guardarProducto(evento) {
    evento.preventDefault();
    const id = document.getElementById("productoId").value;
    const archivos = obtenerArchivosSeleccionados();
    try {
        validarImagenes(archivos, !id);
        botonGuardar.disabled = true;
        botonGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        const categoriaSeleccionada = document.getElementById("categoria").value;
        const tallasSeleccionadas = obtenerTallasSeleccionadas();
        const colores = obtenerColoresAdmin();
        const totalImagenesDisponibles = archivos.length || cantidadImagenesActuales;
        if (colores.length > totalImagenesDisponibles) {
            throw new Error(`Configuraste ${colores.length} colores, pero solo hay ${totalImagenesDisponibles} imagen(es). Agrega una imagen por color o elimina variantes.`);
        }
        if (productoUsaTalla(categoriaSeleccionada) && tallasSeleccionadas.length === 0) {
            throw new Error("Selecciona al menos una talla disponible.");
        }

        const producto = {
            nombre: document.getElementById("nombre").value.trim(),
            descripcion: document.getElementById("descripcion").value.trim(),
            precio: Number(document.getElementById("precio").value),
            stock: colores.length ? colores.reduce((suma, color) => suma + color.stock, 0) : Number(document.getElementById("stock").value),
            categoria: categoriaSeleccionada,
            colores,
            tallasDisponibles: tallasSeleccionadas.join(","),
            destacado: document.getElementById("destacado").checked,
            personalizable: document.getElementById("personalizable").checked
        };
        const respuesta = await fetchConSesion(id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`, {
            method: id ? "PUT" : "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(producto)
        });
        if (!respuesta.ok) throw new Error(await obtenerMensajeError(respuesta));
        const guardado = await respuesta.json();
        await subirGaleria(guardado.id, archivos);
        alert("Producto guardado correctamente");
        limpiarFormulario();
        await cargarProductos();
    } catch (error) {
        console.error(error);
        alert(error.message || "No se pudo guardar el producto");
    } finally {
        botonGuardar.disabled = false;
        botonGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar producto';
    }
}

async function cargarProductos() {
    const tbody = document.querySelector("#tablaProductos tbody");
    try {
        const respuesta = await fetchConSesion(`${API_URL}/productos`, {cache: "no-store"});
        if (!respuesta.ok) throw new Error("No se pudieron cargar los productos");
        const data = await respuesta.json();
        productosAdmin = Array.isArray(data) ? data : [];
        productosSeleccionadosAdmin.clear();
        paginaProductosAdmin = 1;
        actualizarFiltroCategoriasAdmin();
        renderizarProductosAdmin();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="11" class="error-admin">${escaparHtml(error.message)}</td></tr>`;
    }
}

function actualizarFiltroCategoriasAdmin() {
    const select = document.getElementById("filtroCategoriaProductoAdmin");
    if (!select) return;
    const actual = select.value;
    const categorias = [...new Set(productosAdmin.map(p => String(p.categoria || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
    select.innerHTML = '<option value="">Todas las categorías</option>' + categorias.map(c => `<option value="${escaparAtributo(c)}">${escaparHtml(c)}</option>`).join("");
    if (categorias.includes(actual)) select.value = actual;
}

function obtenerProductosFiltradosAdmin() {
    const texto = normalizarTexto(document.getElementById("buscarProductoAdmin")?.value || "");
    const campo = document.getElementById("campoBusquedaProductoAdmin")?.value || "todo";
    const categoria = normalizarTexto(document.getElementById("filtroCategoriaProductoAdmin")?.value || "");
    const orden = document.getElementById("ordenProductoAdmin")?.value || "id-desc";
    const lista = productosAdmin.filter(p => {
        const valores = {
            nombre: normalizarTexto(p.nombre),
            categoria: normalizarTexto(p.categoria),
            id: String(p.id ?? "")
        };
        const base = campo === "todo" ? normalizarTexto(`${p.id} ${p.nombre} ${p.categoria} ${p.descripcion}`) : valores[campo] || "";
        return (!texto || base.includes(texto)) && (!categoria || valores.categoria === categoria);
    });
    lista.sort((a,b) => {
        if (orden === "id-asc") return Number(a.id)-Number(b.id);
        if (orden === "nombre") return String(a.nombre||"").localeCompare(String(b.nombre||""),"es");
        if (orden === "categoria") return String(a.categoria||"").localeCompare(String(b.categoria||""),"es") || String(a.nombre||"").localeCompare(String(b.nombre||""),"es");
        if (orden === "stock") return Number(a.stock||0)-Number(b.stock||0);
        return Number(b.id)-Number(a.id);
    });
    return lista;
}

function renderizarProductosAdmin() {
    const tbody = document.querySelector("#tablaProductos tbody");
    const lista = obtenerProductosFiltradosAdmin();
    const totalPaginas = Math.max(1, Math.ceil(lista.length / PRODUCTOS_ADMIN_POR_PAGINA));
    paginaProductosAdmin = Math.min(paginaProductosAdmin, totalPaginas);
    const inicio = (paginaProductosAdmin - 1) * PRODUCTOS_ADMIN_POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + PRODUCTOS_ADMIN_POR_PAGINA);
    document.getElementById("contadorProductosAdmin").textContent = `${lista.length} producto${lista.length===1?"":"s"} encontrado${lista.length===1?"":"s"}`;
    if (!pagina.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="estado-carga">No hay productos que coincidan con los filtros.</td></tr>';
    } else {
        tbody.innerHTML = pagina.map(p => {
            const tallas = productoUsaTalla(p.categoria, p.nombre) ? obtenerTallasProducto(p).join(", ") : "Unidad";
            const colores = obtenerVariantesColorProducto(p);
            const detalleColores = colores.length ? colores.map(color => `${color.nombre} (${color.stock})`).join(", ") : "Sin variantes";
            return `<tr>
                <td><input type="checkbox" data-seleccionar-producto="${p.id}" ${productosSeleccionadosAdmin.has(Number(p.id))?"checked":""} aria-label="Seleccionar ${escaparAtributo(p.nombre||"producto")}"></td>
                <td><button type="button" class="thumb-producto-admin" data-accion="preview" data-id="${p.id}" title="Vista previa"><img src="${escaparAtributo(obtenerUrlImagen(p.imagen))}" alt="${escaparAtributo(p.nombre||"Producto")}" onerror="manejarErrorImagen(this)"><span><i class="fa-solid fa-eye"></i></span></button></td>
                <td>${p.id}</td><td><b>${escaparHtml(p.nombre)}</b></td><td>${escaparHtml(p.categoria || "Sin categoría")}</td><td>S/ ${Number(p.precio || 0).toFixed(2)}</td><td>${Number(p.stock || 0)}</td><td>${escaparHtml(detalleColores)}</td><td>${escaparHtml(tallas)}</td><td>${p.personalizable ? '<span class="chip-si">Sí</span>' : '<span class="chip-no">No</span>'}</td>
                <td class="acciones-producto-admin"><button data-accion="preview" data-id="${p.id}"><i class="fa-solid fa-eye"></i> Ver</button><button data-accion="editar" data-id="${p.id}"><i class="fa-solid fa-pen"></i> Editar</button><button class="accion-eliminar" data-accion="eliminar" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        }).join("");
    }
    renderizarPaginacionProductosAdmin(totalPaginas);
    actualizarSeleccionProductosAdmin();
}

function renderizarPaginacionProductosAdmin(totalPaginas) {
    const cont = document.getElementById("paginacionProductosAdmin");
    if (!cont) return;
    cont.innerHTML = "";
    if (totalPaginas <= 1) return;
    const crear = (texto,pagina,deshabilitado=false,activo=false) => {
        const b=document.createElement("button");b.type="button";b.textContent=texto;b.disabled=deshabilitado;b.classList.toggle("activo",activo);b.addEventListener("click",()=>{paginaProductosAdmin=pagina;renderizarProductosAdmin();document.querySelector(".card-productos-admin")?.scrollIntoView({behavior:"smooth",block:"start"});});cont.appendChild(b);
    };
    crear("‹",Math.max(1,paginaProductosAdmin-1),paginaProductosAdmin===1);
    const desde=Math.max(1,paginaProductosAdmin-2), hasta=Math.min(totalPaginas,desde+4);
    for(let i=desde;i<=hasta;i++) crear(String(i),i,false,i===paginaProductosAdmin);
    crear("›",Math.min(totalPaginas,paginaProductosAdmin+1),paginaProductosAdmin===totalPaginas);
}

function limpiarFiltrosProductosAdmin() {
    document.getElementById("buscarProductoAdmin").value="";
    document.getElementById("campoBusquedaProductoAdmin").value="todo";
    document.getElementById("filtroCategoriaProductoAdmin").value="";
    document.getElementById("ordenProductoAdmin").value="id-desc";
    paginaProductosAdmin=1;
    renderizarProductosAdmin();
}

function alternarSeleccionPaginaProductos(evento) {
    const checked=evento.target.checked;
    document.querySelectorAll('input[data-seleccionar-producto]').forEach(input=>{input.checked=checked;const id=Number(input.dataset.seleccionarProducto);if(checked)productosSeleccionadosAdmin.add(id);else productosSeleccionadosAdmin.delete(id);});
    actualizarSeleccionProductosAdmin();
}

function actualizarSeleccionProductosAdmin() {
    const cantidad=productosSeleccionadosAdmin.size;
    const boton=document.getElementById("btnEliminarSeleccionados");
    if(boton) boton.disabled=cantidad===0;
    const contador=document.getElementById("contadorSeleccionados"); if(contador) contador.textContent=cantidad;
    const todos=Array.from(document.querySelectorAll('input[data-seleccionar-producto]'));
    const general=document.getElementById("seleccionarTodosProductos");
    if(general){general.checked=todos.length>0&&todos.every(i=>i.checked);general.indeterminate=todos.some(i=>i.checked)&&!todos.every(i=>i.checked);}
}

async function eliminarProductosSeleccionados() {
    const ids=[...productosSeleccionadosAdmin];
    if(!ids.length) return;
    if(!confirm(`¿Eliminar ${ids.length} producto(s) seleccionados? Esta acción no se puede deshacer.`)) return;
    const boton=document.getElementById("btnEliminarSeleccionados"); boton.disabled=true;
    let errores=0;
    for(const id of ids){try{const r=await fetchConSesion(`${API_URL}/productos/${id}`,{method:"DELETE"});if(!r.ok)errores++;}catch{errores++;}}
    productosSeleccionadosAdmin.clear();
    await cargarProductos();
    if(errores) alert(`${errores} producto(s) no pudieron eliminarse.`);
}

async function abrirVistaPreviaProductoAdmin(id) {
    const p=productosAdmin.find(item=>Number(item.id)===Number(id)); if(!p)return;
    const modal=document.getElementById("modalVistaProductoAdmin"); modal.dataset.productoId=String(id); modal.hidden=false; document.body.classList.add("modal-admin-abierto");
    document.getElementById("categoriaPreviewProducto").textContent=p.categoria||"Sin categoría";
    document.getElementById("tituloPreviewProducto").textContent=p.nombre||"Producto";
    document.getElementById("precioPreviewProducto").textContent=`S/ ${Number(p.precio||0).toFixed(2)}`;
    document.getElementById("descripcionPreviewProducto").textContent=p.descripcion||"Sin descripción";
    const tallas=productoUsaTalla(p.categoria,p.nombre)?obtenerTallasProducto(p).join(", "):"Unidad";
    const colores=obtenerVariantesColorProducto(p).map(c=>`${c.nombre} (${c.stock})`).join(", ")||"Sin variantes";
    document.getElementById("metaPreviewProducto").innerHTML=`<div><dt>ID</dt><dd>${p.id}</dd></div><div><dt>Stock</dt><dd>${Number(p.stock||0)}</dd></div><div><dt>Tallas</dt><dd>${escaparHtml(tallas)}</dd></div><div><dt>Colores</dt><dd>${escaparHtml(colores)}</dd></div><div><dt>Destacado</dt><dd>${p.destacado?"Sí":"No"}</dd></div><div><dt>Personalizable</dt><dd>${p.personalizable?"Sí":"No"}</dd></div>`;
    const urls=[]; if(p.imagen)urls.push(obtenerUrlImagen(p.imagen));
    try{const r=await fetchConSesion(`${API_URL}/imagenes/${id}`);if(r.ok){const g=await r.json();(g.imagenes||[]).forEach(img=>{const u=obtenerUrlImagen(img);if(!urls.includes(u))urls.push(u);});}}catch{}
    const galeria=document.getElementById("galeriaPreviewProductoAdmin");
    galeria.innerHTML=(urls.length?urls:[IMAGEN_FALLBACK]).map((u,i)=>`<img src="${escaparAtributo(u)}" alt="${escaparAtributo(p.nombre||"Producto")} ${i+1}" onerror="manejarErrorImagen(this)">`).join("");
}
function cerrarVistaPreviaProductoAdmin(){const modal=document.getElementById("modalVistaProductoAdmin");if(modal)modal.hidden=true;document.body.classList.remove("modal-admin-abierto");}

async function editarProducto(id) {
    try {
        const respuesta = await fetchConSesion(`${API_URL}/productos/${id}`);
        if (!respuesta.ok) throw new Error("Producto no encontrado");
        const p = await respuesta.json();
        document.getElementById("productoId").value = id;
        document.getElementById("nombre").value = p.nombre || "";
        document.getElementById("descripcion").value = p.descripcion || "";
        document.getElementById("precio").value = p.precio ?? "";
        document.getElementById("stock").value = p.stock ?? "";
        cargarColoresAdmin(p.colores || []);
        if (p.categoria && !categoriasDisponibles.includes(p.categoria)) {
            categoriasDisponibles.push(p.categoria);
            completarSelectCategorias(categoriasDisponibles);
        }
        document.getElementById("categoria").value = p.categoria || categoriasDisponibles[0];
        marcarTallasDisponibles(obtenerTallasProducto(p));
        actualizarAyudaCategoria();
        document.getElementById("destacado").checked = Boolean(p.destacado);
        document.getElementById("personalizable").checked = Boolean(p.personalizable);
        inputImagenes.value = "";
        actualizarPrevisualizacion();
        await mostrarImagenesActuales(id, p.imagen);
        formularioProducto.scrollIntoView({behavior: "smooth"});
    } catch (error) { alert(error.message); }
}

async function mostrarImagenesActuales(productoId, principal) {
    const urls = principal ? [obtenerUrlImagen(principal)] : [];
    try {
        const respuesta = await fetchConSesion(`${API_URL}/imagenes/${productoId}`);
        if (respuesta.ok) {
            const galeria = await respuesta.json();
            (galeria.imagenes || []).forEach(i => {
                const url = obtenerUrlImagen(i);
                if (!urls.includes(url)) urls.push(url);
            });
        }
    } catch {}
    cantidadImagenesActuales = urls.length;
    const contenedor = document.getElementById("imagenesActuales");
    contenedor.innerHTML = urls.map((url, indice) => `<figure><img src="${escaparAtributo(url)}" alt="Imagen actual ${indice + 1}"><figcaption>Imagen ${indice + 1}</figcaption></figure>`).join("");
}

async function eliminarProducto(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/productos/${id}`, {method: "DELETE"});
    if (!respuesta.ok) return alert("No se pudo eliminar");
    await cargarProductos();
}

function limpiarFormulario() {
    formularioProducto.reset();
    document.getElementById("productoId").value = "";
    inputImagenes.value = "";
    document.getElementById("previsualizacionImagenes").innerHTML = "";
    document.getElementById("imagenesActuales").innerHTML = "";
    cantidadImagenesActuales = 0;
    document.getElementById("contadorImagenes").textContent = "0 de 7 imágenes seleccionadas";
    document.getElementById("personalizable").checked = false;
    cargarColoresAdmin([]);
    document.getElementById("stock").readOnly = false;
    marcarTallasDisponibles([]);
    actualizarAyudaCategoria();
}

async function cargarPersonalizados() {
    const contenedor = document.getElementById("listaPersonalizados");
    contenedor.innerHTML = '<p class="estado-carga">Cargando solicitudes...</p>';
    try {
        const respuesta = await fetchConSesion(`${API_URL}/pedidos-personalizados/admin/todos`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar las solicitudes personalizadas");
        const solicitudes = await respuesta.json();
        document.getElementById("contadorPersonalizados").textContent = solicitudes.filter(s => ["PENDIENTE_COTIZACION", "EN_REVISION"].includes(s.estado)).length;
        if (!solicitudes.length) {
            contenedor.innerHTML = '<p class="estado-carga">No hay solicitudes personalizadas.</p>';
            return;
        }
        contenedor.innerHTML = solicitudes.map(s => tarjetaPersonalizado(s)).join("");
    } catch (error) {
        contenedor.innerHTML = `<p class="error-admin">${escaparHtml(error.message)}</p>`;
    }
}

function tarjetaPersonalizado(s) {
    const id = escaparAtributo(s.id);
    const fecha = formatearFecha(s.fechaCreacion);
    const imagenes = [s.imagenFrente, s.imagenEspalda].filter(Boolean);
    return `<article class="tarjeta-personalizado">
        <div class="personalizado-grid">
            <div class="galeria-solicitud">${imagenes.map((url, i) => `<a href="${escaparAtributo(url)}" target="_blank" rel="noopener"><img src="${escaparAtributo(url)}" alt="${i ? "Espalda" : "Frente"}"></a>`).join("")}</div>
            <div class="datos-solicitud">
                <span class="estado-chip">${escaparHtml(formatearEstado(s.estado))}</span>
                <h3>${escaparHtml(s.productoNombre || "Producto personalizado")}</h3>
                <p><b>Cliente:</b> ${escaparHtml(s.usuario)} ${s.correo ? `· ${escaparHtml(s.correo)}` : ""}</p>
                <p><b>Variante:</b> ${escaparHtml(s.color || "Sin color")} · ${escaparHtml(s.talla || "Unidad")} · ${Number(s.cantidad || 1)} unidad(es)</p>
                <p><b>Fecha:</b> ${escaparHtml(fecha)}</p>
                <p><b>Indicaciones:</b> ${escaparHtml(s.notas || "Sin indicaciones adicionales")}</p>
            </div>
            <div class="cotizacion-form" data-form-personalizado="${id}">
                <label>Precio final (S/)</label>
                <input type="number" min="0" step="0.01" data-precio value="${s.precio ?? ""}" placeholder="Ej. 89.90">
                <label>Estado</label>
                <select data-estado>${opcionesEstadoPersonalizado(s.estado)}</select>
                <label>Mensaje para el cliente</label>
                <textarea data-mensaje maxlength="800">${escaparHtml(s.mensajeAdmin || "")}</textarea>
                <div class="acciones-registro-admin"><button class="accion-guardar" data-guardar-personalizado="${id}">Guardar cotización</button><button class="accion-eliminar" type="button" data-eliminar-personalizado="${id}"><i class="fa-solid fa-trash"></i> Eliminar</button></div>
            </div>
        </div>
    </article>`;
}

function opcionesEstadoPersonalizado(actual) {
    const estados = ["PENDIENTE_COTIZACION", "EN_REVISION", "COTIZADO", "APROBADO", "EN_PRODUCCION", "LISTO", "ENVIADO", "CANCELADO"];
    return estados.map(e => `<option value="${e}" ${e === actual ? "selected" : ""}>${formatearEstado(e)}</option>`).join("");
}

async function guardarCotizacion(id) {
    const form = document.querySelector(`[data-form-personalizado="${CSS.escape(id)}"]`);
    const precioTexto = form.querySelector("[data-precio]").value;
    const datos = {
        precio: precioTexto === "" ? null : Number(precioTexto),
        estado: form.querySelector("[data-estado]").value,
        mensajeAdmin: form.querySelector("[data-mensaje]").value.trim()
    };
    const respuesta = await fetchConSesion(`${API_URL}/pedidos-personalizados/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify(datos)
    });
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    alert("Cotización actualizada");
    cargarPersonalizados();
}

async function cargarPedidosAdmin() {
    const tbody = document.querySelector("#tablaPedidos tbody");
    try {
        const respuesta = await fetchConSesion(`${API_URL}/pedidos/admin/todos`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los pedidos");
        const pedidos = await respuesta.json();
        tbody.innerHTML = pedidos.length ? pedidos.slice().reverse().map(renderizarPedidoAdmin).join("") : '<tr><td colspan="7">No hay pedidos.</td></tr>';
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="error-admin">${escaparHtml(error.message)}</td></tr>`;
    }
}

function renderizarPedidoAdmin(p) {
    const id = escaparAtributo(p.id);
    const productos = Array.isArray(p.items) && p.items.length
            ? p.items.map(item => {
                const variante = [
                    item.color && item.color !== "SIN_COLOR" ? `Color: ${escaparHtml(item.color)}` : "",
                    item.talla && item.talla !== "UNIDAD" ? `Talla: ${escaparHtml(item.talla)}` : ""
                ].filter(Boolean).join(" · ");
                return `${Number(item.cantidad || 1)}× ${escaparHtml(item.nombre || "Producto")}${variante ? `<br><small>${variante}</small>` : ""}`;
            }).join("<br>")
            : "Detalle no registrado";
    const subtotal = Number(p.subtotal ?? p.total ?? 0);
    const pago = `${formatearEstado(p.metodoPago || "Sin método")}<br><small>Op.: ${escaparHtml(p.referenciaPago || "Sin referencia")}</small>`;
    const envio = `${formatearEstado(p.metodoEnvio || "Por coordinar")}<br>
        <small>${escaparHtml(p.destinoEnvio || "Sin destino")}</small>
        <span class="envio-pago-directo"><i class="fa-solid fa-hand-holding-dollar"></i> El cliente paga directamente al transportista</span>`;
    return `<tr data-pedido-admin="${id}">
        <td><b>${escaparHtml(p.codigoSeguimiento || `#${(p.id || "").slice(-8).toUpperCase()}`)}</b><br><small>${escaparHtml(formatearFecha(p.fecha))}</small>${p.invitado ? '<br><span class="chip-invitado">Invitado</span>' : ""}</td>
        <td><b>${escaparHtml(p.nombreCliente || p.usuario || "Cliente")}</b><br><small>${escaparHtml(p.correo || "")}${p.telefono ? ` · ${escaparHtml(p.telefono)}` : ""}</small><div class="detalle-items-admin">${productos}</div></td>
        <td>${pago}</td>
        <td>${envio}</td>
        <td><b>S/ ${subtotal.toFixed(2)}</b><br><small>Cobrado por PixBen</small></td>
        <td class="estados-pedido-admin">
            <label>Pedido<select data-estado-pedido>${opcionesEstado(["PENDIENTE","PAGADO","EN_PREPARACION","LISTO_PARA_DESPACHO","ENVIADO","ENTREGADO","CANCELADO"], p.estado)}</select></label>
            <label>Pago<select data-estado-pago>${opcionesEstado(["POR_VERIFICAR","VERIFICADO","RECHAZADO","REEMBOLSADO"], p.estadoPago)}</select></label>
            <label>Envío<select data-estado-envio>${opcionesEstado(["PENDIENTE_COORDINACION","LISTO_PARA_DESPACHO","ENTREGADO_TRANSPORTISTA","EN_CAMINO","ENTREGADO"], p.estadoEnvio)}</select></label>
        </td>
        <td><div class="acciones-registro-admin"><button class="accion-guardar" data-guardar-pedido="${id}">Guardar</button><button class="accion-eliminar" type="button" data-eliminar-pedido="${id}"><i class="fa-solid fa-trash"></i></button></div></td>
    </tr>`;
}

function opcionesEstado(estados, actual) {
    const valorActual = String(actual || estados[0]).toUpperCase();
    return estados.map(e => `<option value="${e}" ${e === valorActual ? "selected" : ""}>${formatearEstado(e)}</option>`).join("");
}

async function guardarEstadoPedido(id) {
    const fila = document.querySelector(`[data-pedido-admin="${CSS.escape(id)}"]`);
    const datos = {
        estado: fila.querySelector("[data-estado-pedido]").value,
        estadoPago: fila.querySelector("[data-estado-pago]").value,
        estadoEnvio: fila.querySelector("[data-estado-envio]").value
    };
    const respuesta = await fetchConSesion(`${API_URL}/pedidos/${encodeURIComponent(id)}/gestion`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(datos)
    });
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    alert("Pedido actualizado");
    cargarPedidosAdmin();
}

async function cargarMensajes() {
    const contenedor = document.getElementById("listaMensajes");
    contenedor.innerHTML = '<p class="estado-carga">Cargando mensajes...</p>';
    try {
        const respuesta = await fetchConSesion(`${API_URL}/contactos/admin/todos`);
        if (!respuesta.ok) throw new Error("No se pudieron cargar los mensajes");
        const mensajes = await respuesta.json();
        document.getElementById("contadorMensajes").textContent = mensajes.filter(m => m.estado === "NUEVO").length;
        contenedor.innerHTML = mensajes.length ? mensajes.map(m => `<article class="tarjeta-mensaje">
            <div class="mensaje-cabecera"><div><h3>${escaparHtml(m.asunto)}</h3><p class="mensaje-meta">${escaparHtml(m.nombre)} · ${escaparHtml(m.correo)} · ${escaparHtml(formatearFecha(m.fecha))}</p></div><span class="estado-chip">${escaparHtml(formatearEstado(m.estado))}</span></div>
            <p class="mensaje-cuerpo">${escaparHtml(m.mensaje)}</p>
            <div class="mensaje-acciones"><select data-estado-mensaje="${escaparAtributo(m.id)}">${["NUEVO","EN_REVISION","RESPONDIDO","CERRADO"].map(e => `<option value="${e}" ${e === m.estado ? "selected" : ""}>${formatearEstado(e)}</option>`).join("")}</select><button class="accion-guardar" data-guardar-mensaje="${escaparAtributo(m.id)}">Guardar estado</button><button class="accion-eliminar" type="button" data-eliminar-mensaje="${escaparAtributo(m.id)}"><i class="fa-solid fa-trash"></i> Eliminar</button></div>
        </article>`).join("") : '<p class="estado-carga">No hay mensajes.</p>';
    } catch (error) { contenedor.innerHTML = `<p class="error-admin">${escaparHtml(error.message)}</p>`; }
}

async function guardarEstadoMensaje(id) {
    const select = document.querySelector(`[data-estado-mensaje="${CSS.escape(id)}"]`);
    const respuesta = await fetchConSesion(`${API_URL}/contactos/${encodeURIComponent(id)}/estado?estado=${encodeURIComponent(select.value)}`, {method: "PATCH"});
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    cargarMensajes();
}

async function eliminarPersonalizado(id) {
    if (!confirm("¿Eliminar definitivamente esta solicitud personalizada?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/pedidos-personalizados/${encodeURIComponent(id)}`, {method: "DELETE"});
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    cargarPersonalizados();
}

async function eliminarPedido(id) {
    if (!confirm("¿Eliminar definitivamente este pedido?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/pedidos/${encodeURIComponent(id)}`, {method: "DELETE"});
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    cargarPedidosAdmin();
}

async function eliminarMensaje(id) {
    if (!confirm("¿Eliminar definitivamente este mensaje?")) return;
    const respuesta = await fetchConSesion(`${API_URL}/contactos/${encodeURIComponent(id)}`, {method: "DELETE"});
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    cargarMensajes();
}

async function descargarRespaldo() {
    const boton = document.getElementById("btnDescargarRespaldo");
    try {
        boton.disabled = true;
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando...';
        const respuesta = await fetchConSesion(`${API_URL}/admin/respaldo`);
        if (!respuesta.ok) throw new Error(await obtenerMensajeError(respuesta));
        const blob = await respuesta.blob();
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `pixben-respaldo-${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert(error.message || "No se pudo descargar el respaldo");
    } finally {
        boton.disabled = false;
        boton.innerHTML = '<i class="fa-solid fa-download"></i> Descargar respaldo';
    }
}

function formatearFecha(valor) {
    if (!valor) return "Sin fecha";
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleString("es-PE");
}
function formatearEstado(valor) { return String(valor || "PENDIENTE").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()); }
function escaparHtml(valor) { return String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escaparAtributo(valor) { return escaparHtml(valor); }
async function obtenerMensajeError(respuesta) { try { const json = await respuesta.json(); return json.message || json.error || "Error"; } catch { return await respuesta.text() || "Error"; } }


async function borrarAnalitica(todo) {
    const mensaje = todo
            ? "¿Borrar toda la analítica? Esta acción no se puede deshacer."
            : "¿Borrar las visitas con más de 30 días?";
    if (!confirm(mensaje)) return;
    const url = todo ? `${API_URL}/visitas/admin/todas` : `${API_URL}/visitas/admin/anteriores?dias=30`;
    const respuesta = await fetchConSesion(url, {method: "DELETE"});
    if (!respuesta.ok) return alert(await obtenerMensajeError(respuesta));
    const resultado = await respuesta.json();
    alert(`Se eliminaron ${Number(resultado.eliminadas || 0)} registros de analítica.`);
    cargarAnalitica();
}

async function cargarAnalitica() {
    const estado = document.getElementById("estadoAnalitica");
    if (!estado) return;
    estado.textContent = "Actualizando métricas...";
    try {
        const respuesta = await fetchConSesion(`${API_URL}/visitas/admin/resumen`);
        if (!respuesta.ok) throw new Error("No se pudo cargar la analítica");
        const datos = await respuesta.json();
        document.getElementById("metricaVistasHoy").textContent = Number(datos.vistasHoy || 0);
        document.getElementById("metricaVistasTotales").textContent = Number(datos.vistasTotales || 0);
        document.getElementById("metricaAnonimos").textContent = Number(datos.visitantesAnonimos || 0);
        document.getElementById("metricaUsuarios").textContent = Number(datos.usuariosAutenticados || 0);
        estado.textContent = datos.privacidad || "No se almacenan IP de visitantes anónimos.";

        const dias = Object.entries(datos.visitasPorDia || {});
        const maximo = Math.max(1, ...dias.map(([, cantidad]) => Number(cantidad)));
        document.getElementById("graficoVisitas").innerHTML = dias.length ? dias.map(([dia, cantidad]) => `
            <div class="barra-dia"><span>${escaparHtml(dia.slice(5))}</span><div><i style="height:${Math.max(8, Number(cantidad) / maximo * 100)}%"></i></div><strong>${Number(cantidad)}</strong></div>`).join("") : '<p class="estado-carga">Todavía no hay suficientes visitas para mostrar el gráfico.</p>';

        const recientes = datos.recientesAutenticadas || [];
        document.getElementById("tablaVisitasAutenticadas").innerHTML = recientes.length ? recientes.map(v => `<tr><td>${escaparHtml(v.correo || "Usuario")}</td><td>${escaparHtml(v.ruta || "/")}</td><td>${escaparHtml(formatearFecha(v.fecha))}</td></tr>`).join("") : '<tr><td colspan="3">Aún no hay visitas autenticadas.</td></tr>';
    } catch (error) {
        estado.textContent = error.message;
        estado.classList.add("error-admin");
    }
}
