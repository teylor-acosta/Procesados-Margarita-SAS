/* ==========================================================================
   SIDEBAR GLOBAL ERP - PROCESADOS MARGARITA
   ========================================================================== */
   /* ==========================================================================
   VARIABLES GLOBALES
   ========================================================================== */

let menuSistema = [];

let paginaActual = "";

let tipoMenu = "ERP";

document.addEventListener("DOMContentLoaded", async () => {

    paginaActual =
        document.body.dataset.pagina || "";

    detectarTipoMenu();

    await cargarSidebar();

});
/* ==========================================================================
   DETERMINAR TIPO DE MENÚ
   ========================================================================== */

function detectarTipoMenu() {

    const onboarding = [

        "induccion",

        "evaluacion",

        "firma",

        "certificado"

    ];

    tipoMenu =

        onboarding.includes(paginaActual)

            ? "ONBOARDING"

            : "ERP";

}

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

await cargarMenuBD();

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
   

/* ==========================================================================
   OBTENER MENÚ DESDE BASE DE DATOS
   ========================================================================== */

async function cargarMenuBD() {

    try {

        const response =
            await fetch(
                `/api/sidebar/menu?tipo=${tipoMenu}`
            );

        const result =
            await response.json();

        if (!result.success) {

            console.error(
                "No fue posible obtener el menú."
            );

            return;

        }

        menuSistema =
            result.menu || [];

    }

    catch (error) {

        console.error(
            "Error cargando menú:",
            error
        );

    }

}

/* ==========================================================================
   FUNCIONES AUXILIARES DEL MENÚ
   ========================================================================== */

function obtenerModulo(nombre, modulos = menuSistema) {

    for (const modulo of modulos) {

        if (modulo.nombre === nombre) {

            return modulo;

        }

        if (modulo.hijos && modulo.hijos.length) {

            const encontrado = obtenerModulo(

                nombre,

                modulo.hijos

            );

            if (encontrado) {

                return encontrado;

            }

        }

    }

    return null;

}

function obtenerHijos(idPadre) {

    function buscar(modulos) {

        for (const modulo of modulos) {

            if (modulo.id === idPadre) {

                return modulo.hijos || [];

            }

            if (modulo.hijos && modulo.hijos.length) {

                const hijos = buscar(modulo.hijos);

                if (hijos) {

                    return hijos;

                }

            }

        }

        return null;

    }

    return buscar(menuSistema) || [];

}
function obtenerModuloPorId(id) {

    return menuSistema.find(modulo =>
        modulo.id === id
    );

}

function obtenerPadre(idHijo) {

    function buscar(modulos, padre = null) {

        for (const modulo of modulos) {

            if (modulo.id === idHijo) {

                return padre;

            }

            if (modulo.hijos?.length) {

                const encontrado =
                    buscar(
                        modulo.hijos,
                        modulo
                    );

                if (encontrado) {

                    return encontrado;

                }

            }

        }

        return null;

    }

    return buscar(menuSistema);

}
function obtenerModuloActual() {

    const ruta = window.location.pathname;

    function buscar(modulos) {

        for (const modulo of modulos) {

            if (modulo.ruta === ruta) {

                return modulo;

            }

            if (modulo.hijos?.length) {

                const encontrado = buscar(modulo.hijos);

                if (encontrado) {

                    return encontrado;

                }

            }

        }

        return null;

    }

    return buscar(menuSistema);

}

function obtenerRutaModulo(modulo) {

    const ruta = [];

    let actual = modulo;

    while (actual) {

        ruta.unshift(actual);

        actual = obtenerPadre(actual.id);

    }

    return ruta;

}


/* ==========================================================================
   RENDERIZAR MENÚ DINÁMICO
   ========================================================================== */

function renderizarMenuDinamico(modulos) {

    const menu = document.getElementById(
        "menuDinamico"
    );

    if (!menu) return;

    let html = "";

    modulos.forEach(modulo => {

        html += crearNodoMenu(modulo);

    });

    menu.innerHTML = html;

    activarEventosMenu();

}

/* ==========================================================================
   ACTIVAR EVENTOS DEL MENÚ
   ========================================================================== */

function activarEventosMenu() {

    document
        .querySelectorAll(".menu-parent")
        .forEach(parent => {

            parent.addEventListener("click", () => {

                const grupo =
                    parent.closest(".menu-group");

                grupo.classList.toggle("open");

            });

        });

}

/* ==========================================================================
   CREAR NODO DEL MENÚ
   ========================================================================== */

function crearNodoMenu(modulo) {

    // ==========================================
    // MÓDULO SIN HIJOS
    // ==========================================

    if (!modulo.hijos || modulo.hijos.length === 0) {

        return `

            <a
                href="${modulo.ruta}"
                class="menu-item">

                <i class="fas ${modulo.icono}"></i>

                <span>

                    ${modulo.nombre}

                </span>

            </a>

        `;

    }

    // ==========================================
    // MÓDULO CON HIJOS
    // ==========================================

    return `

        <div class="menu-group">

            <div class="menu-parent">

                <div class="menu-parent-left">

                    <i class="fas ${modulo.icono}"></i>

                    <span>

                        ${modulo.nombre}

                    </span>

                </div>

                <i class="fas fa-chevron-down menu-arrow"></i>

            </div>

            <div class="submenu">

                ${modulo.hijos
                    .map(hijo => crearNodoMenu(hijo))
                    .join("")}

            </div>

        </div>

    `;

}

function tieneModulo(nombre) {

    return menuSistema.some(modulo =>
        modulo.nombre === nombre
    );

}

function moduloActivo(nombre) {

    const modulo = obtenerModulo(nombre);

    if (!modulo) return false;

    return modulo.ruta === window.location.pathname;

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
    const empleados =
    obtenerModuloPorId(4);

const hijosEmpleados =
    obtenerHijos(4);

    const mostrarModuloEmpleados =
        paginasEmpleados.includes(paginaActiva);
        const recursosHumanos =
    obtenerModulo(
        "Recursos Humanos"
    );

const modulosRH =
    recursosHumanos
        ? obtenerHijos(
            recursosHumanos.id
        )
        : [];
        console.log(
    "MODULOS RH:",
    modulosRH
);


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

${modulosRH.map(modulo => `

    <a
        href="${modulo.ruta}"
        class="menu-item submenu-item ${paginaActiva === modulo.ruta.substring(1) ? 'active' : ''}">

        <i class="fas ${modulo.icono}"></i>

        <span>${modulo.nombre}</span>

    </a>

`).join("")}

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

function menuCapacitaciones(paginaActiva) {

    const usuario =
        JSON.parse(
            localStorage.getItem("usuario")
        ) || {};

    const rol =
        (usuario.rol || "").toLowerCase();

    const esAdministrador =

    rol === "admin" ||

    rol === "administrador" ||

    rol === "superadmin" ||

    rol === "superadministrador";
    return `

        <span class="menu-section-title">
            Navegación
        </span>

        <a href="/dashboard"
           class="menu-item">

            <i class="fas fa-home"></i>

            <span>Inicio</span>

        </a>

         ${
            paginaActiva === "capacitacion"
            ? `
                <a href="/mis-capacitaciones"
                   class="menu-item">

                    <i class="fas fa-arrow-left"></i>

                    <span>Volver a mis capacitaciones</span>

                </a>
            `
            : ""
        }


        <a href="/panel"
           class="menu-item">

            <i class="fas fa-th-large"></i>

            <span>Panel</span>

        </a>

        <div class="menu-group open">

            <div class="menu-item menu-parent">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <i class="fas fa-graduation-cap"></i>

                    <span>
                        Capacitaciones
                    </span>

                </div>

                <i class="fas fa-chevron-down menu-arrow"></i>

            </div>

            <div class="submenu">

                <a href="/centro-capacitaciones"
                   class="menu-item submenu-item ${paginaActiva === "centro-capacitaciones" ? "active" : ""}">

                    <i class="fas fa-house"></i>

                    <span>
                        Inicio
                    </span>

                </a>

                <a href="/mis-capacitaciones"
                   class="menu-item submenu-item ${paginaActiva === "mis-capacitaciones" ? "active" : ""}">

                    <i class="fas fa-book-open"></i>

                    <span>
                        Mis Capacitaciones
                    </span>

                </a>

                ${esAdministrador ? `

                <a href="/administrar-capacitaciones"
                   class="menu-item submenu-item ${paginaActiva === "administrar-capacitaciones" ? "active" : ""}">

                    <i class="fas fa-chalkboard-teacher"></i>

                    <span>
                        Administrar Capacitaciones
                    </span>

                </a>

                <a href="/seguimiento-general"
                   class="menu-item submenu-item ${paginaActiva === "seguimiento-general" ? "active" : ""}">

                    <i class="fas fa-chart-line"></i>

                    <span>
                        Seguimiento General
                    </span>

                </a>

                ` : ""}

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
        const moduloActual =
    obtenerModuloActual();
    const rutaActual =
    obtenerRutaModulo(
        moduloActual
    );

console.log(
    "RUTA:",
    rutaActual
);

console.log(
    "MODULO ACTUAL:",
    moduloActual
);

    const menu =
        document.getElementById(
            "menuDinamico"
        );

    if (!menu) return;
    const menuPanel =
    obtenerModulo("Panel");

const menuDashboard =
    obtenerModulo("Inicio");

const menuPerfil =
    obtenerModulo("Mi Perfil");

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

/* =====================================
   CENTRO DE CAPACITACIONES
===================================== */

else if (pagina === "centro-capacitaciones") {

    menu.innerHTML =
        menuCapacitaciones(
            "centro-capacitaciones"
        );

}

else if (pagina === "mis-capacitaciones") {

    menu.innerHTML =
        menuCapacitaciones(
            "mis-capacitaciones"
        );

}

else if (pagina === "capacitacion") {

    menu.innerHTML = `

        <span class="menu-section-title">
            Navegación
        </span>

        <a href="/dashboard"
           class="menu-item">

            <i class="fas fa-home"></i>

            <span>Inicio</span>

        </a>

        <a href="/mis-capacitaciones"
           class="menu-item">

            <i class="fas fa-arrow-left"></i>

            <span>Volver a mis capacitaciones</span>

        </a>

    `;

}

else if (pagina === "administrar-capacitaciones") {

    menu.innerHTML =
        menuCapacitaciones(
            "administrar-capacitaciones"
        );

}

else if (pagina === "seguimiento-general") {

    menu.innerHTML =
        menuCapacitaciones(
            "seguimiento-general"
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