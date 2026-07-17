/* Extraído de htmls/detalles-producto.html. Mantener el orden de carga indicado en el HTML. */

const buscador = document.getElementById("buscador");
            const iconoBuscar = document.getElementById("iconoBuscar");
            const inputBuscar = document.getElementById("inputBuscar");

            iconoBuscar.addEventListener("click", function () {
                buscador.classList.toggle("activo");

                if (buscador.classList.contains("activo")) {
                    inputBuscar.focus();
                }
            });

            document.addEventListener("click", function (e) {
                if (!buscador.contains(e.target)) {
                    buscador.classList.remove("activo");
                }
            });
