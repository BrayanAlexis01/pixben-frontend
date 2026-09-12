"use strict";
document.querySelectorAll(".faq-question").forEach(boton => {
    boton.addEventListener("click", () => {
        const item = boton.closest(".faq-item");
        const respuesta = item.querySelector(".faq-answer");
        const abierta = item.classList.toggle("abierta");
        boton.setAttribute("aria-expanded", String(abierta));
        respuesta.style.maxHeight = abierta ? `${respuesta.scrollHeight}px` : "0px";
    });
});
