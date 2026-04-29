document.addEventListener("DOMContentLoaded", async () => {

    const contenedor = document.getElementById("contenedorModulos");

    try {

        const res = await fetch('/api/me', {
            credentials: 'include'
        });

        const data = await res.json();

        console.log("DATA PANEL:", data);

        if (!data.success) {
            window.location.href = "/login";
            return;
        }

        // 🔥 NORMALIZAR ROL
        const rol = (data.usuario.rol || "").toLowerCase().trim();

        console.log("ROL NORMALIZADO:", rol);

        let html = "";

        // ============================================
        // 🔥 SUPER ADMIN
        // ============================================
        if (rol.includes("super")) {

            html += `
                <div class="col-md-3 col-sm-6 mb-4 d-flex justify-content-center">

                    <a href="/empleados-menu" class="card-opcion text-center">

                        <i class="fas fa-users fa-3x mb-3"></i>

                        <p>Empleados</p>

                    </a>

                </div>
            `;
        }

        // ============================================
        // 🔥 ADMIN
        // ============================================
        else if (rol.includes("admin")) {

            html += `
                <div class="col-md-3 col-sm-6 mb-4 d-flex justify-content-center">

                    <a href="/empleados-menu" class="card-opcion text-center">

                        <i class="fas fa-users fa-3x mb-3"></i>

                        <p>Empleados</p>

                    </a>

                </div>
            `;
        }

        // ============================================
        // 🔥 AUXILIAR
        // ============================================
        else if (rol.includes("auxiliar")) {

            html += `
                <div class="col-md-3 col-sm-6 mb-4 d-flex justify-content-center">

                    <a href="/perfil" class="card-opcion text-center">

                        <i class="fas fa-user fa-3x mb-3"></i>

                        <p>Mi perfil</p>

                    </a>

                </div>
            `;
        }

        // ============================================
        // 🔥 FALLBACK
        // ============================================
        if (html === "") {
            html = `<p class="text-warning text-center">Rol no reconocido: ${rol}</p>`;
        }

        contenedor.innerHTML = `
            <div class="row justify-content-center">
                ${html}
            </div>
        `;

    } catch (error) {

        console.error("ERROR PANEL:", error);

        contenedor.innerHTML = `
            <p class="text-danger text-center">
                Error cargando módulos
            </p>
        `;
    }

});