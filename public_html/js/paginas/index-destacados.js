/* Extraído de index.html. Mantener el orden de carga indicado en el HTML. */

document.addEventListener("DOMContentLoaded", () => {

                fetch(`${API_URL}/productos`)
                        .then(response => response.json())
                        .then(productos => {

                            const contenedor =
                                    document.getElementById("productosDestacados");

                            contenedor.innerHTML = "";

                            productos.forEach(producto => {

                                if (producto.destacado === true) {

                                    contenedor.innerHTML += `
<div class="producto fadeIn"
     onclick="window.location.href='htmls/detalles-producto.html?id=${producto.id}'">

   <img src="${obtenerUrlImagen(producto.imagen)}" alt="${producto.nombre}">

    <h3>${producto.nombre}</h3>

    <p>S/ ${producto.precio}</p>

</div>
`;
                                }

                            });

                        })
                        .catch(error => {
                            console.error("Error:", error);
                        });

            });
