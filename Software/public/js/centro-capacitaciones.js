document.addEventListener("DOMContentLoaded", async () => {

    try {

        const respuesta = await fetch("/api/me", {
            credentials: "include"
        });

        const data = await respuesta.json();

        if (!data.success) {

            window.location.href = "/login";

            return;

        }

        console.log("USUARIO:", data.usuario);

        const rol = (data.usuario.rol || "")
            .toLowerCase()
            .trim();

        console.log("ROL:", rol);

        // ==========================================
        // TARJETAS
        // ==========================================

        const contenedor =
    document.getElementById("modulosCapacitaciones");

        const cardMisCursos =
            document.getElementById("cardMisCursos");

        const cardAdministrar =
            document.getElementById("cardAdministrar");

        const cardSeguimiento =
            document.getElementById("cardSeguimiento");

        // Ocultamos las tarjetas de administración

        if (rol.includes("auxiliar")) {

            cardAdministrar.style.display = "none";

            cardSeguimiento.style.display = "none";

        }

        // Admin y SuperAdmin las ven todas

        if (
            rol.includes("admin")
        ) {

            cardAdministrar.style.display = "flex";

            cardSeguimiento.style.display = "flex";

        }
        // Mostrar el contenedor cuando ya se procesó el rol
contenedor.style.display = "grid";

    } catch (error) {

        console.error(
            "ERROR CENTRO CAPACITACIONES:",
            error
        );

    }

});


// ==========================================
// NAVEGACIÓN
// ==========================================

function abrirMisCursos(){

    window.location.href =
        "/mis-capacitaciones";

}

function abrirAdministracion(){

    window.location.href =
        "/administrar-capacitaciones";

}

function abrirSeguimiento(){

    window.location.href =
        "/seguimiento-capacitaciones";

}