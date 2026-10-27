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

        // ============================================
        // NORMALIZAR ROL
        // ============================================

        const rol = (data.usuario.rol || "")
            .toLowerCase()
            .trim();

        console.log("ROL NORMALIZADO:", rol);

        let html = "";

        // ============================================
        // SUPERADMIN / ADMIN
        // ============================================

        if (rol.includes("super") || rol.includes("admin")) {

            html += `

                <div
                    class="modulo-card rh"
                    onclick="irRecursosHumanos()">

                    <i class="fas fa-user-tie icono-modulo"></i>

                    <span>Recursos Humanos</span>

                    <small>
                        Empleados y usuarios
                    </small>

                </div>

                <div
                    class="modulo-card capacitaciones"
                    onclick="irCapacitaciones()">

                    <i class="fas fa-graduation-cap icono-modulo"></i>

                    <span>Capacitaciones</span>

                    <small>
                        Cursos, evaluaciones y certificados
                    </small>

                </div>

                <div class="modulo-card proximamente">

                    <i class="fas fa-boxes-stacked icono-modulo"></i>

                    <span>Inventarios</span>

                    <small>
                        Próximamente
                    </small>

                </div>

                <div class="modulo-card proximamente">

                    <i class="fas fa-truck icono-modulo"></i>

                    <span>Logística</span>

                    <small>
                        Próximamente
                    </small>

                </div>

                <div class="modulo-card proximamente">

                    <i class="fas fa-coins icono-modulo"></i>

                    <span>Finanzas</span>

                    <small>
                        Próximamente
                    </small>

                </div>

                <div class="modulo-card proximamente">

                    <i class="fas fa-chart-line icono-modulo"></i>

                    <span>Reportes</span>

                    <small>
                        Próximamente
                    </small>

                </div>

            `;

        }

        // ============================================
        // AUXILIAR
        // ============================================

        else if (rol.includes("auxiliar")) {

            html += `

                <div
                    class="modulo-card"
                    onclick="window.location.href='/perfil'">

                    <i class="fas fa-user icono-modulo"></i>

                    <span>Mi Perfil</span>

                    <small>
                        Información personal
                    </small>

                </div>

                <div
                    class="modulo-card capacitaciones"
                    onclick="irCapacitaciones()">

                    <i class="fas fa-graduation-cap icono-modulo"></i>

                    <span>Capacitaciones</span>

                    <small>
                        Cursos, evaluaciones y certificados
                    </small>

                </div>

            `;

        }

        // ============================================
        // FALLBACK
        // ============================================

        if (html === "") {

            html = `
                <p class="text-warning text-center">

                    Rol no reconocido: ${rol}

                </p>
            `;

        }

        // ============================================
        // RENDER
        // ============================================

        contenedor.innerHTML = `

            <div class="modulos-container">

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


// ============================================
// NAVEGACIÓN
// ============================================

function irRecursosHumanos() {

    window.location.href = "/recursos-humanos";

}

function irEmpleados() {

    window.location.href = "/empleados-menu";

}

function irCapacitaciones() {

    window.location.href = "/centro-capacitaciones";

}