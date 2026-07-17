"use strict";

const VERSION = "pixben-pwa-v2";
const CACHE_ESTATICO = `${VERSION}-static`;
const CACHE_PAGINAS = `${VERSION}-pages`;

const RECURSOS_BASE = [
    "/",
    "/index.html",
    "/offline.html",
    "/site.webmanifest",
    "/css/pwa-premium.css",
    "/js/pwa-premium.js",
    "/js/config.js",
    "/imagensponsor/logopixben.webp",
    "/imagensponsor/favicon-192.png",
    "/imagensponsor/favicon-512.png",
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

    const esEstatico = ["style", "script", "image", "font", "manifest"].includes(request.destination) ||
        /\.(?:css|js|webp|png|jpe?g|gif|svg|ico|woff2?)$/i.test(url.pathname);

    if (esEstatico) {
        event.respondWith(recursoCachePrimero(request));
    }
});

self.addEventListener("message", (event) => {
    if (event.data?.tipo === "SKIP_WAITING") self.skipWaiting();
});

/* Preparado para Web Push. El envío desde el servidor requiere claves VAPID. */
self.addEventListener("push", (event) => {
    let datos = {};
    try {
        datos = event.data ? event.data.json() : {};
    } catch {
        datos = {body: event.data?.text() || "Tienes una novedad en PixBen."};
    }

    event.waitUntil(self.registration.showNotification(datos.title || "PixBen", {
        body: datos.body || "Tienes una novedad en tu pedido.",
        icon: datos.icon || "/imagensponsor/favicon-192.png",
        badge: datos.badge || "/imagensponsor/favicon-192.png",
        tag: datos.tag || "pixben-pedido",
        renotify: true,
        data: {url: datos.url || "/htmls/mis-pedidos.html"},
        vibrate: [120, 70, 120]
    }));
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
