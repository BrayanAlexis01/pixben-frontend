"use strict";

const VERSION = "pixben-pwa-v20";
const CACHE_ESTATICO = `${VERSION}-static`;
const CACHE_PAGINAS = `${VERSION}-pages`;
const CACHE_META = "pixben-meta";

const RECURSOS_BASE = [
    "/",
    "/index.html",
    "/offline.html",
    "/site.webmanifest",
    "/css/pwa-premium.css",
    "/css/accessibility.css",
    "/js/pwa-premium.js",
    "/js/accessibility.js",
    "/js/config.js",
    "/imagensponsor/logopixben.webp",
    "/imagensponsor/app-icon-v4-192.png",
    "/imagensponsor/app-icon-v4-512.png",
    "/imagensponsor/app-icon-maskable-v4-192.png",
    "/imagensponsor/app-icon-maskable-v4-512.png",
    "/imagensponsor/polo-ocean.webp",
    "/htmls/productos.html",
    "/htmls/personaliza.html",
    "/htmls/carrito%20de%20compras.html",
    "/htmls/login.html",
    "/htmls/mis-pedidos.html"
];

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_ESTATICO);
        await Promise.allSettled(
            RECURSOS_BASE.map((url) => cache.add(new Request(url, {cache: "reload"})))
        );
    })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const nombres = await caches.keys();
        await Promise.all(
            nombres
                .filter((nombre) => nombre.startsWith("pixben-pwa-") &&
                    nombre !== CACHE_ESTATICO && nombre !== CACHE_PAGINAS)
                .map((nombre) => caches.delete(nombre))
        );
        await self.clients.claim();
    })());
});

async function paginaConRedPrimero(request) {
    const cache = await caches.open(CACHE_PAGINAS);
    try {
        const respuesta = await fetch(request);
        if (respuesta?.ok) cache.put(request, respuesta.clone());
        return respuesta;
    } catch {
        return (await cache.match(request, {ignoreSearch: true})) ||
               (await caches.match(request, {ignoreSearch: true})) ||
               (await caches.match("/offline.html"));
    }
}

async function recursoRedPrimero(request) {
    const cache = await caches.open(CACHE_ESTATICO);
    try {
        const respuesta = await fetch(request, {cache: "no-cache"});
        if (respuesta?.ok) await cache.put(request, respuesta.clone());
        return respuesta;
    } catch {
        const guardado = await caches.match(request, {ignoreSearch: false});
        if (guardado) return guardado;
        throw new Error("Recurso no disponible sin conexión");
    }
}

async function recursoCachePrimero(request) {
    const guardado = await caches.match(request, {ignoreSearch: true});
    if (guardado) {
        actualizarEnSegundoPlano(request);
        return guardado;
    }

    try {
        const respuesta = await fetch(request);
        if (respuesta?.ok) {
            const cache = await caches.open(CACHE_ESTATICO);
            cache.put(request, respuesta.clone());
        }
        return respuesta;
    } catch {
        if (request.destination === "image") {
            return caches.match("/imagensponsor/polo-ocean.webp");
        }
        throw new Error("Recurso no disponible sin conexión");
    }
}

function actualizarEnSegundoPlano(request) {
    fetch(request).then(async (respuesta) => {
        if (!respuesta?.ok) return;
        const cache = await caches.open(CACHE_ESTATICO);
        await cache.put(request, respuesta.clone());
    }).catch(() => {});
}

self.addEventListener("fetch", (event) => {
    const {request} = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname === "/service-worker.js") return;

    if (request.mode === "navigate") {
        event.respondWith(paginaConRedPrimero(request));
        return;
    }

    const esCodigo = ["style", "script"].includes(request.destination) ||
        /\.(?:css|js)$/i.test(url.pathname);

    // Código primero desde la red: evita que una versión anterior del JS siga
    // mostrando un catálogo viejo después de un deploy.
    if (esCodigo) {
        event.respondWith(recursoRedPrimero(request));
        return;
    }

    const esEstatico = ["image", "font", "manifest"].includes(request.destination) ||
        /\.(?:webp|png|jpe?g|gif|svg|ico|woff2?)$/i.test(url.pathname);

    if (esEstatico) {
        event.respondWith(recursoCachePrimero(request));
    }
});

async function guardarContextoPush(contexto) {
    const cache = await caches.open(CACHE_META);
    const seguro = {
        modo: contexto?.modo === "admin" ? "admin" : "cliente",
        url: contexto?.modo === "admin"
                ? "/htmls/admin.html#seccionPedidos"
                : "/htmls/mis-pedidos.html"
    };
    await cache.put("/__pixben_push_context__", new Response(JSON.stringify(seguro), {
        headers: {"Content-Type": "application/json"}
    }));
}

async function obtenerContextoPush() {
    try {
        const cache = await caches.open(CACHE_META);
        const respuesta = await cache.match("/__pixben_push_context__");
        if (!respuesta) return {modo: "cliente", url: "/htmls/mis-pedidos.html"};
        return await respuesta.json();
    } catch {
        return {modo: "cliente", url: "/htmls/mis-pedidos.html"};
    }
}

self.addEventListener("message", (event) => {
    if (event.data?.tipo === "SKIP_WAITING") {
        self.skipWaiting();
        return;
    }
    if (event.data?.tipo === "CONFIG_PUSH_CONTEXT") {
        event.waitUntil(guardarContextoPush(event.data.contexto || {}));
    }
});

/* Push sin payload: el contexto guardado permite mostrar un aviso distinto al administrador. */
self.addEventListener("push", (event) => {
    event.waitUntil((async () => {
        let datos = {};
        try {
            datos = event.data ? event.data.json() : {};
        } catch {
            datos = {body: event.data?.text() || ""};
        }

        const contexto = await obtenerContextoPush();
        const esAdmin = contexto?.modo === "admin";
        const titulo = datos.title || (esAdmin ? "Nuevo pedido en PixBen" : "PixBen");
        const cuerpo = datos.body || (esAdmin
                ? "Tienes un pedido nuevo. Toca la notificación para revisarlo."
                : "Tienes una novedad en tu pedido.");
        const destino = datos.url || contexto?.url || (esAdmin
                ? "/htmls/admin.html#seccionPedidos"
                : "/htmls/mis-pedidos.html");

        await self.registration.showNotification(titulo, {
            body: cuerpo,
            icon: datos.icon || "/imagensponsor/app-icon-v4-192.png",
            badge: datos.badge || "/imagensponsor/favicon-192.png",
            tag: datos.tag || (esAdmin ? "pixben-admin-pedido" : "pixben-pedido"),
            renotify: true,
            data: {url: destino},
            vibrate: [160, 80, 160, 80, 220]
        });
    })());
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const destino = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil((async () => {
        const ventanas = await self.clients.matchAll({type: "window", includeUncontrolled: true});
        for (const ventana of ventanas) {
            if ("focus" in ventana) {
                await ventana.navigate(destino);
                return ventana.focus();
            }
        }
        if (self.clients.openWindow) return self.clients.openWindow(destino);
        return null;
    })());
});
