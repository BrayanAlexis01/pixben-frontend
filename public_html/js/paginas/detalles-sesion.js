/* Extraído de htmls/detalles-producto.html. Mantener el orden de carga indicado en el HTML. */

const usuarioResena = obtenerUsuarioSesion();

            if (usuarioResena) {

                document.getElementById("nombreUsuario").textContent = obtenerNombreVisible(usuarioResena);

                document.getElementById("btnLogin").style.display = "none";
                document.getElementById("btnRegistro").style.display = "none";

            } else {

                document.getElementById("btnPerfil").style.display = "none";
                document.getElementById("btnPedidos").style.display = "none";
                document.getElementById("btnHistorial").style.display = "none";
                document.getElementById("btnFavoritos").style.display = "none";
                document.getElementById("btnAdmin").style.display = "none";
                document.getElementById("btnCerrarSesion").style.display = "none";

            }

            if (!usuarioResena || usuarioResena.rol !== "admin") {
                document.getElementById("btnAdmin").style.display = "none";
            }

            function toggleMenuUsuario() {

                const menu =
                        document.getElementById("menuUsuario");

                if (menu.style.display === "block") {

                    menu.style.display = "none";

                } else {

                    menu.style.display = "block";
                }
            }

            async function cerrarSesion() {
    await cerrarSesionPixben(window.location.href);
}
