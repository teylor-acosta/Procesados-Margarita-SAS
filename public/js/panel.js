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

                <!-- [AGREGADO] Botón de Novedades para Admin -->
                <div
                    class="modulo-card novedades"
                    onclick="irNovedades()">

                    <i class="fas fa-bell icono-modulo"></i>

                    <span>Novedades</span>

                    <small>
                        Pagos y nómina
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
        // AUXILIAR (Usuario Normal)
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

                <!-- [AGREGADO] Botón de Novedades para Usuario Normal -->
                <div
                    class="modulo-card mis-novedades"
                    onclick="irmisNovedades()">

                    <i class="fas fa-bell icono-modulo"></i>

                    <span>Novedades</span>

                    <small>
                        Consulta tus pagos y nómina
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

// [MODIFICADO] Función para ir a la ventana de novedades de ADMIN
function irNovedades() {

    // Los administradores van a la vista con todos los permisos
    window.location.href = "/nomina/novedades"; 

}

// [MODIFICADO] Función para ir a la ventana de novedades del USUARIO NORMAL
function irmisNovedades() {

    // Ahora apunta a la misma ruta del backend, y el backend decide qué HTML mostrar
    window.location.href = "/nomina/novedades";

}