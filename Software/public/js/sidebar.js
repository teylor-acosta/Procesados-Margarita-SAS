/* ==========================================================================
   SIDEBAR GLOBAL ERP - PROCESADOS MARGARITA
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    await cargarSidebar();

});

/* ==========================================================================
   CARGAR SIDEBAR
   ========================================================================== */

async function cargarSidebar() {

    const container =
        document.getElementById(
            "sidebarContainer"
        );

    if (!container) return;

    try {

        const response =
            await fetch(
                "/components/sidebar.html"
            );

        const html =
            await response.text();

        container.innerHTML =
            html;

        construirMenu();

        cargarDatosUsuario();

        configurarLogout();

        configurarMenuMovil();

    } catch (error) {

        console.error(
            "Error cargando sidebar:",
            error
        );
    }
}


/* =====================================
   MENU RECURSOS HUMANOS
===================================== */

function menuRecursosHumanos(paginaActiva) {

    const paginasEmpleados = [
        'empleados-menu',
        'empleados',
        'crear-empleado',
        'empleados-inactivos',
        'documentacion',
        'centro-actividad'
    ];

    const mostrarModuloEmpleados =
        paginasEmpleados.includes(paginaActiva);

    return `

        <span class="menu-section-title">
            Recursos Humanos
        </span>

        <a href="/panel"
           class="menu-item">
            <i class="fas fa-th-large"></i>
            <span>Panel</span>
        </a>

        <div class="menu-group ">

            <div class="menu-item menu-parent">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <i class="fas fa-users-cog"></i>

                    <span>
                        Recursos Humanos
                    </span>

                </div>

                <i class="fas fa-chevron-down menu-arrow"></i>

            </div>

            <div class="submenu">

                <a href="/recursos-humanos"
                   class="menu-item submenu-item ${paginaActiva === 'recursos-humanos' ? 'active' : ''}">

                    <i class="fas fa-house"></i>

                    <span>
                        Inicio Recursos Humanos
                    </span>

                </a>

                <a href="/empleados-menu"
                   class="menu-item submenu-item">

                    <i class="fas fa-users"></i>

                    <span>
                        Empleados
                    </span>

                </a>

                <a href="/usuarios"
                   class="menu-item submenu-item">

                    <i class="fas fa-user-shield"></i>

                    <span>
                        Usuarios
                    </span>

                </a>

                <a href="#"
                   class="menu-item submenu-item">

                    <i class="fas fa-graduation-cap"></i>

                    <span>
                        Capacitaciones
                    </span>

                </a>

            </div>

        </div>

        ${mostrarModuloEmpleados ? `

        <div class="menu-group open">

            <div class="menu-item menu-parent">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <i class="fas fa-users"></i>

                    <span>
                        Módulo Empleados
                    </span>

                </div>

                <i class="fas fa-chevron-down menu-arrow"></i>

            </div>

            <div class="submenu">

                <a href="/empleados-menu"
                   class="menu-item submenu-item ${paginaActiva === 'empleados-menu' ? 'active' : ''}">
                    <i class="fas fa-layer-group"></i>
                    <span>Inicio Módulo</span>
                </a>

                <a href="/empleados"
                   class="menu-item submenu-item ${paginaActiva === 'empleados' ? 'active' : ''}">
                    <i class="fas fa-list"></i>
                    <span>Listado Empleados</span>
                </a>

                <a href="/crear-empleado"
                   class="menu-item submenu-item ${paginaActiva === 'crear-empleado' ? 'active' : ''}">
                    <i class="fas fa-user-plus"></i>
                    <span>Crear Empleado</span>
                </a>

                <a href="/empleados-inactivos"
                   class="menu-item submenu-item ${paginaActiva === 'empleados-inactivos' ? 'active' : ''}">
                    <i class="fas fa-user-slash"></i>
                    <span>Empleados Inactivos</span>
                </a>

                <a href="/documentacion-empleados"
                   class="menu-item submenu-item ${paginaActiva === 'documentacion' ? 'active' : ''}">
                    <i class="fas fa-folder-open"></i>
                    <span>Gestión Documental</span>
                </a>

                <a href="/centro-actividad"
                   class="menu-item submenu-item ${paginaActiva === 'centro-actividad' ? 'active' : ''}">
                    <i class="fas fa-history"></i>
                    <span>Centro de Actividad</span>
                </a>

            </div>

        </div>

        ` : ''}

    `;
}
function menuUsuarios(paginaActiva) {

    return `

    <span class="menu-section-title">
        Recursos Humanos
    </span>

    <a href="/panel"
       class="menu-item">

        <i class="fas fa-th-large"></i>

        <span>Panel</span>

    </a>

    <div class="menu-group ">

        <div class="menu-item menu-parent">

            <div style="
                display:flex;
                align-items:center;
                gap:10px;
            ">

                <i class="fas fa-users-cog"></i>

                <span>
                    Recursos Humanos
                </span>

            </div>

            <i class="fas fa-chevron-down menu-arrow"></i>

        </div>

        <div class="submenu">

            <a href="/recursos-humanos"
               class="menu-item submenu-item">

                <i class="fas fa-house"></i>

                <span>
                    Inicio Recursos Humanos
                </span>

            </a>

            <a href="/empleados-menu"
               class="menu-item submenu-item">

                <i class="fas fa-users"></i>

                <span>
                    Empleados
                </span>

            </a>

            <a href="/usuarios"
               class="menu-item submenu-item active">

                <i class="fas fa-user-shield"></i>

                <span>
                    Usuarios
                </span>

            </a>

            <a href="#"
               class="menu-item submenu-item">

                <i class="fas fa-graduation-cap"></i>

                <span>
                    Capacitaciones
                </span>

            </a>

        </div>

    </div>

    <div class="menu-group open">

        <div class="menu-item menu-parent">

            <div style="
                display:flex;
                align-items:center;
                gap:10px;
            ">

                <i class="fas fa-user-shield"></i>

                <span>
                    Módulo Usuarios
                </span>

            </div>

            <i class="fas fa-chevron-down menu-arrow"></i>

        </div>

        <div class="submenu">

            <a href="/usuarios"
               class="menu-item submenu-item ${paginaActiva === 'usuarios' ? 'active' : ''}">

                <i class="fas fa-house"></i>

                <span>
                    Inicio Usuarios
                </span>

            </a>

            <a href="/crear-usuario"
               class="menu-item submenu-item ${paginaActiva === 'crear-usuario' ? 'active' : ''}">

                <i class="fas fa-user-plus"></i>

                <span>
                    Crear Usuario
                </span>

            </a>

            <a href="/usuarios-registrados"
               class="menu-item submenu-item ${paginaActiva === 'usuarios-registrados' ? 'active' : ''}">

                <i class="fas fa-users"></i>

                <span>
                    Usuarios Registrados
                </span>

            </a>

            <a href="/roles-accesos"
               class="menu-item submenu-item ${paginaActiva === 'roles-accesos' ? 'active' : ''}">

                <i class="fas fa-user-shield"></i>

                <span>
                    Roles y Accesos
                </span>

            </a>

            <a href="/historial-usuarios"
               class="menu-item submenu-item ${paginaActiva === 'historial-usuarios' ? 'active' : ''}">

                <i class="fas fa-history"></i>

                <span>
                    Centro de Actividad
                </span>

            </a>

        </div>

    </div>

`;
}

/* ==========================================================================
   MENÚ DINÁMICO
   ========================================================================== */

function construirMenu() {

    const pagina =
        document.body.dataset.pagina;

    const menu =
        document.getElementById(
            "menuDinamico"
        );

    if (!menu) return;

    /* ======================
       DASHBOARD
    ====================== */

    if (pagina === "dashboard") {

        menu.innerHTML = `
            <span class="menu-section-title">
                Navegación
            </span>

            <a href="/dashboard" class="menu-item active">
                <i class="fas fa-home"></i>
                Inicio
            </a>

            <a href="/panel" class="menu-item">
                <i class="fas fa-th-large"></i>
                Panel
            </a>

            <a href="/perfil" class="menu-item">
                <i class="fas fa-user-circle"></i>
                Mi Perfil
            </a>
        `;
    }

    /* ======================
       INDUCCIÓN
    ====================== */

    else if (pagina === "induccion") {

        menu.innerHTML = `
            <span class="menu-section-title">
                Navegación
            </span>

            <a href="/induccion" class="menu-item active">
                <i class="fas fa-graduation-cap"></i>
                Inducción SST
            </a>
        `;
    }

    /* ======================
       FIRMA
    ====================== */

    else if (pagina === "firma") {

        menu.innerHTML = `
            <span class="menu-section-title">
                Navegación
            </span>

            <a href="/induccion" class="menu-item">
                <i class="fas fa-graduation-cap"></i>
                Inducción SST
            </a>

            <a href="/firma" class="menu-item active">
                <i class="fas fa-signature"></i>
                Firma Digital
            </a>
        `;
    }

    /* ======================
       CERTIFICADO
    ====================== */

    else if (pagina === "certificado") {

    menu.innerHTML = `
        <span class="menu-section-title">
            Navegación
        </span>

        <a href="/dashboard" class="menu-item">
            <i class="fas fa-home"></i>
            Inicio
        </a>

        <a href="/certificado" class="menu-item active">
            <i class="fas fa-certificate"></i>
            Certificado
        </a>
    `;

    const sidebarBottom =
        document.querySelector(
            ".sidebar-bottom"
        );

    if (sidebarBottom) {

        sidebarBottom.insertAdjacentHTML(
            "afterbegin",
            `
            <button
                id="btnDescargarPDF"
                class="sidebar-pdf">

                <i class="fas fa-file-pdf"></i>

                <div class="pdf-info">
                    <span>Descargar PDF</span>
                    <small>Certificado Oficial</small>
                </div>

            </button>
            `
        );
    }
}

    /* ======================
       PERFIL
    ====================== */

    else if (pagina === "perfil") {

        menu.innerHTML = `
            <span class="menu-section-title">
                Navegación
            </span>

            <a href="/dashboard" class="menu-item">
                <i class="fas fa-home"></i>
                Inicio
            </a>

            <a href="/perfil" class="menu-item active">
                <i class="fas fa-user-circle"></i>
                Mi Perfil
            </a>
        `;
    }

    /* ======================
       PANEL
    ====================== */

    else if (pagina === "panel") {

        menu.innerHTML = `
            <span class="menu-section-title">
                Navegación
            </span>

            <a href="/dashboard" class="menu-item">
                <i class="fas fa-home"></i>
                Inicio
            </a>

            <a href="/panel" class="menu-item active">
                <i class="fas fa-th-large"></i>
                Panel
            </a>
        <a href="/perfil" class="menu-item">
        <i class="fas fa-user-circle"></i>
        Mi Perfil
    </a>
`;
    }



    /*Recursos humanos*/
    else if (pagina === "recursos-humanos") {

    menu.innerHTML =
        menuRecursosHumanos(
            "recursos-humanos"
        );

}
/* =====================================
   EMPLEADOS
===================================== */

else if (pagina === "empleados") {

    menu.innerHTML =
        menuRecursosHumanos(
            "empleados"
        );

}


/* =====================================
   CREAR EMPLEADO
===================================== */

else if (pagina === "crear-empleado") {

    menu.innerHTML =
        menuRecursosHumanos(
            "crear-empleado"
        );

}

/* =====================================
   MENU EMPLEADOS
===================================== */

else if (pagina === "empleados-menu") {

    menu.innerHTML =
        menuRecursosHumanos(
            "empleados-menu"
        );

}

/* =====================================
   EMPLEADOS INACTIVOS
===================================== */

else if (pagina === "empleados-inactivos") {

    menu.innerHTML =
        menuRecursosHumanos(
            "empleados-inactivos"
        );

}


/* =====================================
   DOCUMENTACION
===================================== */

else if (pagina === "documentacion") {

    menu.innerHTML =
        menuRecursosHumanos(
            "documentacion"
        );

}

/* =====================================
   CENTRO ACTIVIDAD
===================================== */

else if (pagina === "centro-actividad") {

    menu.innerHTML =
        menuRecursosHumanos(
            "centro-actividad"
        );

}


else if (pagina === "usuarios") {

    menu.innerHTML =
        menuUsuarios(
            "usuarios"
        );

}


else if (pagina === "crear-usuario") {

    menu.innerHTML =
        menuUsuarios(
            "crear-usuario"
        );

}

else if (pagina === "usuarios-registrados") {

    menu.innerHTML =
        menuUsuarios(
            "usuarios-registrados"
        );

}

else if (pagina === "roles-accesos") {

    menu.innerHTML =
        menuUsuarios(
            "roles-accesos"
        );

}

else if (pagina === "historial-usuarios") {

    menu.innerHTML =
        menuUsuarios(
            "historial-usuarios"
        );

}


    /* ======================
       DEFAULT
    ====================== */

    else {

    menu.innerHTML = `
        <span class="menu-section-title">
            Navegación
        </span>

        <a href="/dashboard" class="menu-item active">
            <i class="fas fa-home"></i>
            Inicio
        </a>
    `;
}

/* =====================================
   ACTIVAR SUBMENUS
===================================== */

document
    .querySelectorAll(
        '.menu-parent'
    )
    .forEach(item => {

        item.addEventListener(
            'click',
            () => {

                const grupo =
                    item.closest(
                        '.menu-group'
                    );

                grupo.classList.toggle(
                    'open'
                );

            }
        );

    });

}

/* ==========================================================================
   DATOS USUARIO
   ========================================================================== */

function cargarDatosUsuario() {

    try {

        const usuario =
            JSON.parse(
                localStorage.getItem("usuario")
            ) || {};

        const nombreSidebar =
            document.getElementById(
                "nombreSidebar"
            );

        const rolSidebar =
            document.getElementById(
                "rolSidebar"
            );

        const cargoSidebar =
            document.getElementById(
                "cargoSidebar"
            );

        if (nombreSidebar) {

            nombreSidebar.textContent =
                usuario.nombre ||
                "Usuario";
        }

        if (rolSidebar) {

            rolSidebar.textContent =
                usuario.rol ||
                "Empleado";
        }

        if (cargoSidebar) {

            cargoSidebar.textContent =
                usuario.cargo ||
                "";
        }

    } catch (error) {

        console.error(
            "Error cargando usuario:",
            error
        );
    }
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */

function configurarLogout() {

    const btnLogout =
        document.getElementById(
            "btnLogout"
        );

    if (!btnLogout) return;

    btnLogout.addEventListener(
        "click",
        (e) => {

            e.preventDefault();

            localStorage.removeItem(
                "usuario"
            );

            localStorage.removeItem(
                "token"
            );

            sessionStorage.clear();

            window.location.href =
                "/logout";
        }
    );
}

/* ==========================================================================
   MENÚ MÓVIL
   ========================================================================== */

function configurarMenuMovil() {

    const btnOpen =
        document.getElementById(
            "btnOpenSidebar"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!btnOpen || !sidebar || !overlay) {
        return;
    }

    btnOpen.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );

            if (
                sidebar.classList.contains(
                    "active"
                )
            ) {

                overlay.classList.add(
                    "active"
                );

            } else {

                overlay.classList.remove(
                    "active"
                );
            }
        }
    );

    overlay.addEventListener(
        "click",
        () => {

            sidebar.classList.remove(
                "active"
            );

            overlay.classList.remove(
                "active"
            );

        }
    );

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth > 992
            ) {

                sidebar.classList.remove(
                    "active"
                );

                overlay.classList.remove(
                    "active"
                );
            }
        }
    );
}