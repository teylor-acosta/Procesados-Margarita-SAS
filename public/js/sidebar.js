/* ==========================================================================
   SIDEBAR GLOBAL ERP - PROCESADOS MARGARITA
   ========================================================================== */

/* ==========================================================================
   VARIABLES GLOBALES
   ========================================================================== */

let menuSistema = [];
let paginaActual = "";
let tipoMenu = "ERP";

/* ==========================================================================
   INICIALIZACIÓN DEL SIDEBAR
   ========================================================================== */

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

        container.innerHTML = html;

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

    } catch (error) {

        console.error(
            "Error cargando menú:",
            error
        );

    }

}

/* ==========================================================================
   FUNCIONES AUXILIARES DEL MENÚ
   ========================================================================== */

// Buscar un módulo por nombre en todos los niveles del menú.
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

// Obtener los módulos hijos de un módulo padre.
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

// Buscar un módulo por ID de manera recursiva.
// Permite encontrar módulos principales y secundarios.
function obtenerModuloPorId(id, modulos = menuSistema) {

    for (const modulo of modulos) {

        if (String(modulo.id) === String(id)) {
            return modulo;
        }

        if (modulo.hijos?.length) {

            const encontrado = obtenerModuloPorId(
                id,
                modulo.hijos
            );

            if (encontrado) {
                return encontrado;
            }

        }

    }

    return null;

}

// Obtener el módulo padre de un módulo hijo.
function obtenerPadre(idHijo) {

    function buscar(modulos, padre = null) {

        for (const modulo of modulos) {

            if (modulo.id === idHijo) {
                return padre;
            }

            if (modulo.hijos?.length) {

                const encontrado = buscar(
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

// Identificar el módulo correspondiente a la ruta actual.
function obtenerModuloActual() {

    const ruta = window.location.pathname;

    function buscar(modulos) {

        for (const modulo of modulos) {

            if (modulo.ruta === ruta) {
                return modulo;
            }

            if (modulo.hijos?.length) {

                const encontrado = buscar(
                    modulo.hijos
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

// Construir la ruta jerárquica del módulo.
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

                const grupo = parent.closest(
                    ".menu-group"
                );

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

/* ==========================================================================
   VERIFICACIÓN DE MÓDULOS Y PERMISOS
   ========================================================================== */

// Verificar si el módulo existe dentro del menú autorizado.
// Utiliza la búsqueda recursiva para incluir los submenús.
function tieneModulo(nombre) {

    return obtenerModulo(nombre) !== null;

}

// Verificar si el módulo corresponde a la página actual.
function moduloActivo(nombre) {

    const modulo = obtenerModulo(nombre);

    if (!modulo) return false;

    return modulo.ruta === window.location.pathname;

}

/* ==========================================================================
   MENÚ RECURSOS HUMANOS
   ========================================================================== */

function menuRecursosHumanos(paginaActiva) {

    // Páginas pertenecientes al módulo de empleados.
    const paginasEmpleados = [
        'empleados-menu',
        'empleados',
        'crear-empleado',
        'empleados-inactivos',
        'documentacion',
        'documentos-lectura-admin',
        'centro-actividad'
    ];

    // Obtener módulo de empleados.
    const empleados = obtenerModuloPorId(4);

    // Obtener submódulos de empleados.
    const hijosEmpleados = obtenerHijos(4);

    // Determinar si debe mostrarse el módulo de empleados.
    const mostrarModuloEmpleados =
        paginasEmpleados.includes(paginaActiva);

    // Obtener módulo principal de Recursos Humanos.
    const recursosHumanos = obtenerModulo(
        "Recursos Humanos"
    );

    // Obtener módulos autorizados desde la base de datos.
    const modulosRH = recursosHumanos
        ? obtenerHijos(recursosHumanos.id)
        : [];

    console.log(
        "MODULOS RH:",
        modulosRH
    );

    return `

        <!-- ==========================================
             TÍTULO DE RECURSOS HUMANOS
        =========================================== -->

        <span class="menu-section-title">

            Recursos Humanos

        </span>

        <!-- ==========================================
             ACCESO AL PANEL PRINCIPAL
        =========================================== -->

        <a href="/panel"
           class="menu-item">

            <i class="fas fa-th-large"></i>

            <span>Panel</span>

        </a>

        <!-- ==========================================
             MENÚ PRINCIPAL DE RECURSOS HUMANOS
        =========================================== -->

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

                <!-- INICIO RECURSOS HUMANOS -->

                <a href="/recursos-humanos"
                   class="menu-item submenu-item ${
                       paginaActiva === 'recursos-humanos'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-house"></i>

                    <span>

                        Inicio Recursos Humanos

                    </span>

                </a>

                <!-- MÓDULOS DINÁMICOS -->

                ${modulosRH.map(modulo => `

                    <a href="${modulo.ruta}"
                       class="menu-item submenu-item ${
                           paginaActiva === modulo.ruta.substring(1)
                               ? 'active'
                               : ''
                       }">

                        <i class="fas ${modulo.icono}"></i>

                        <span>${modulo.nombre}</span>

                    </a>

                `).join("")}

                <!-- ACCESO AL MÓDULO DE NÓMINA -->

                <a href="/nomina"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-money-check-dollar"></i>

                    <span>

                        Nómina

                    </span>

                </a>

            </div>

        </div>

        <!-- ==========================================
             MÓDULO DE EMPLEADOS
        =========================================== -->

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

                    <!-- INICIO DEL MÓDULO -->

                    <a href="/empleados-menu"
                       class="menu-item submenu-item ${
                           paginaActiva === 'empleados-menu'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-layer-group"></i>

                        <span>Inicio Módulo</span>

                    </a>

                    <!-- LISTADO DE EMPLEADOS -->

                    <a href="/empleados"
                       class="menu-item submenu-item ${
                           paginaActiva === 'empleados'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-list"></i>

                        <span>Listado Empleados</span>

                    </a>

                    <!-- CREAR EMPLEADO -->

                    <a href="/crear-empleado"
                       class="menu-item submenu-item ${
                           paginaActiva === 'crear-empleado'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-user-plus"></i>

                        <span>Crear Empleado</span>

                    </a>

                    <!-- EMPLEADOS INACTIVOS -->

                    <a href="/empleados-inactivos"
                       class="menu-item submenu-item ${
                           paginaActiva === 'empleados-inactivos'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-user-slash"></i>

                        <span>Empleados Inactivos</span>

                    </a>

                    <!-- GESTIÓN DOCUMENTAL -->

                    <a href="/documentacion-empleados"
                       class="menu-item submenu-item ${
                           paginaActiva === 'documentacion'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-folder-open"></i>

                        <span>Gestión Documental</span>

                    </a>

                    <!-- DOCUMENTOS Y POLÍTICAS -->

                    <a href="/documentos-lectura-admin"
                       class="menu-item submenu-item ${
                           paginaActiva === 'documentos-lectura-admin'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-book-open"></i>

                        <span>Documentos y Políticas</span>

                    </a>

                    <!-- CENTRO DE ACTIVIDAD -->

                    <a href="/centro-actividad"
                       class="menu-item submenu-item ${
                           paginaActiva === 'centro-actividad'
                               ? 'active'
                               : ''
                       }">

                        <i class="fas fa-history"></i>

                        <span>Centro de Actividad</span>

                    </a>

                </div>

            </div>

        ` : ''}

    `;

}

/* ==========================================================================
   FIN DEL MENÚ DE RECURSOS HUMANOS
   ========================================================================== */

   /* ==========================================================================
   MENÚ DEL MÓDULO DE USUARIOS
   ========================================================================== */

function menuUsuarios(paginaActiva) {

    return `

        <!-- ==========================================
             TÍTULO DE LA SECCIÓN
        =========================================== -->

        <span class="menu-section-title">

            Recursos Humanos

        </span>

        <!-- ==========================================
             ACCESO AL PANEL PRINCIPAL
        =========================================== -->

        <a href="/panel"
           class="menu-item">

            <i class="fas fa-th-large"></i>

            <span>Panel</span>

        </a>

        <!-- ==========================================
             MENÚ PRINCIPAL DE RECURSOS HUMANOS
        =========================================== -->

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

                <!-- INICIO DE RECURSOS HUMANOS -->

                <a href="/recursos-humanos"
                   class="menu-item submenu-item">

                    <i class="fas fa-house"></i>

                    <span>

                        Inicio Recursos Humanos

                    </span>

                </a>

                <!-- MÓDULO DE EMPLEADOS -->

                <a href="/empleados-menu"
                   class="menu-item submenu-item">

                    <i class="fas fa-users"></i>

                    <span>

                        Empleados

                    </span>

                </a>

                <!-- MÓDULO DE USUARIOS -->

                <a href="/usuarios"
                   class="menu-item submenu-item active">

                    <i class="fas fa-user-shield"></i>

                    <span>

                        Usuarios

                    </span>

                </a>

                <!-- MÓDULO DE CAPACITACIONES -->

                <a href="#"
                   class="menu-item submenu-item">

                    <i class="fas fa-graduation-cap"></i>

                    <span>

                        Capacitaciones

                    </span>

                </a>

            </div>

        </div>

        <!-- ==========================================
             MENÚ INTERNO DEL MÓDULO DE USUARIOS
        =========================================== -->

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

                <!-- ==================================
                     INICIO DEL MÓDULO DE USUARIOS
                =================================== -->

                <a href="/usuarios"
                   class="menu-item submenu-item ${
                       paginaActiva === 'usuarios'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-house"></i>

                    <span>

                        Inicio Usuarios

                    </span>

                </a>

                <!-- ==================================
                     CREACIÓN DE USUARIOS
                =================================== -->

                <a href="/crear-usuario"
                   class="menu-item submenu-item ${
                       paginaActiva === 'crear-usuario'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-user-plus"></i>

                    <span>

                        Crear Usuario

                    </span>

                </a>

                <!-- ==================================
                     USUARIOS REGISTRADOS
                =================================== -->

                <a href="/usuarios-registrados"
                   class="menu-item submenu-item ${
                       paginaActiva === 'usuarios-registrados'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-users"></i>

                    <span>

                        Usuarios Registrados

                    </span>

                </a>

                <!-- ==================================
                     GESTIÓN DE ROLES Y ACCESOS
                =================================== -->

                <a href="/roles-accesos"
                   class="menu-item submenu-item ${
                       paginaActiva === 'roles-accesos'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-user-shield"></i>

                    <span>

                        Roles y Accesos

                    </span>

                </a>

                <!-- ==================================
                     HISTORIAL Y CENTRO DE ACTIVIDAD
                =================================== -->

                <a href="/historial-usuarios"
                   class="menu-item submenu-item ${
                       paginaActiva === 'historial-usuarios'
                           ? 'active'
                           : ''
                   }">

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
   FIN DEL MENÚ DEL MÓDULO DE USUARIOS
   ========================================================================== */

   /* ==========================================================================
   MENÚ DEL MÓDULO DE NÓMINA
   ========================================================================== */

function menuNomina(paginaActiva) {

    return `

        <!-- ==========================================
             TÍTULO DE LA SECCIÓN
        =========================================== -->

        <span class="menu-section-title">

            Recursos Humanos

        </span>

        <!-- ==========================================
             ACCESO AL PANEL PRINCIPAL
        =========================================== -->

        <a href="/panel"
           class="menu-item">

            <i class="fas fa-th-large"></i>

            <span>

                Panel

            </span>

        </a>

        <!-- ==========================================
             MENÚ PRINCIPAL DE RECURSOS HUMANOS
        =========================================== -->

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

                <!-- INICIO DE RECURSOS HUMANOS -->

                <a href="/recursos-humanos"
                   class="menu-item submenu-item">

                    <i class="fas fa-house"></i>

                    <span>

                        Inicio Recursos Humanos

                    </span>

                </a>

                <!-- MÓDULO DE EMPLEADOS -->

                <a href="/empleados-menu"
                   class="menu-item submenu-item">

                    <i class="fas fa-users"></i>

                    <span>

                        Empleados

                    </span>

                </a>

                <!-- MÓDULO DE USUARIOS -->

                <a href="/usuarios"
                   class="menu-item submenu-item">

                    <i class="fas fa-user-shield"></i>

                    <span>

                        Usuarios

                    </span>

                </a>

                <!-- MÓDULO DE NÓMINA -->

                <a href="/nomina"
                   class="menu-item submenu-item active">

                    <i class="fas fa-money-check-dollar"></i>

                    <span>

                        Nómina

                    </span>

                </a>

            </div>

        </div>

        <!-- ==========================================
             MENÚ INTERNO DEL MÓDULO DE NÓMINA
        =========================================== -->

        <div class="menu-group open">

            <div class="menu-item menu-parent">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <i class="fas fa-money-check-dollar"></i>

                    <span>

                        Módulo Nómina

                    </span>

                </div>

                <i class="fas fa-chevron-down menu-arrow"></i>

            </div>

            <div class="submenu">

                <!-- ==================================
                     INICIO DEL MÓDULO
                =================================== -->

                <a href="/nomina"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-house"></i>

                    <span>

                        Inicio Módulo

                    </span>

                </a>

                <!-- ==================================
                     LIQUIDACIÓN DE NÓMINA
                =================================== -->

                <a href="/nomina/liquidacion"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina-liquidacion'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-calculator"></i>

                    <span>

                        Liquidación de Nómina

                    </span>

                </a>

                <!-- ==================================
                     NOVEDADES DE NÓMINA
                =================================== -->

                <a href="/nomina/novedades"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina-novedades'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-file-circle-plus"></i>

                    <span>

                        Novedades

                    </span>

                </a>

                <!-- ==================================
                     GESTIÓN DE PRÉSTAMOS
                =================================== -->

                <a href="/nomina/prestamos"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina-prestamos'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-hand-holding-dollar"></i>

                    <span>

                        Préstamos

                    </span>

                </a>

                <!-- ==================================
                     LIQUIDACIÓN POR PRODUCCIÓN
                =================================== -->

                <a href="/nomina/produccion"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina-produccion'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-industry"></i>

                    <span>

                        Liquidación por Producción

                    </span>

                </a>

                <!-- ==================================
                     CONFIGURACIÓN DE NÓMINA
                =================================== -->

                <a href="/nomina/configuracion"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina-configuracion'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-gear"></i>

                    <span>

                        Configuración

                    </span>

                </a>

                <!-- ==================================
                     HISTORIAL Y REPORTES
                =================================== -->

                <a href="/nomina/historial"
                   class="menu-item submenu-item ${
                       paginaActiva === 'nomina-historial'
                           ? 'active'
                           : ''
                   }">

                    <i class="fas fa-chart-line"></i>

                    <span>

                        Historial y Reportes

                    </span>

                </a>

            </div>

        </div>

    `;

}

/* ==========================================================================
   FIN DEL MENÚ DEL MÓDULO DE NÓMINA
   ========================================================================== */

   /* ==========================================================================
   MENÚ DEL MÓDULO DE CAPACITACIONES
   ========================================================================== */

function menuCapacitaciones(paginaActiva) {

    /* ==========================================
       OBTENER INFORMACIÓN DEL USUARIO
       ========================================== */

    const usuario = JSON.parse(
        localStorage.getItem("usuario")
    ) || {};

    const rol =
        (usuario.rol || "").toLowerCase();

    /* ==========================================
       IDENTIFICAR ROL ADMINISTRATIVO
       ========================================== */

    const esAdministrador =
        rol === "admin" ||
        rol === "administrador" ||
        rol === "superadmin" ||
        rol === "superadministrador";

    /* ==========================================
       CONSTRUIR MENÚ DE CAPACITACIONES
       ========================================== */

    return `

        <!-- ==========================================
             TÍTULO DE NAVEGACIÓN
        =========================================== -->

        <span class="menu-section-title">

            Navegación

        </span>

        <!-- ==========================================
             ACCESO AL INICIO
        =========================================== -->

        <a href="/dashboard"
           class="menu-item">

            <i class="fas fa-home"></i>

            <span>Inicio</span>

        </a>

        <!-- ==========================================
             REGRESAR A MIS CAPACITACIONES
        =========================================== -->

        ${paginaActiva === "capacitacion" ? `

            <a href="/mis-capacitaciones"
               class="menu-item">

                <i class="fas fa-arrow-left"></i>

                <span>

                    Volver a mis capacitaciones

                </span>

            </a>

        ` : ""}

        <!-- ==========================================
             ACCESO AL PANEL PRINCIPAL
        =========================================== -->

        <a href="/panel"
           class="menu-item">

            <i class="fas fa-th-large"></i>

            <span>Panel</span>

        </a>

        <!-- ==========================================
             MENÚ PRINCIPAL DE CAPACITACIONES
        =========================================== -->

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

                <!-- ==================================
                     CENTRO DE CAPACITACIONES
                =================================== -->

                <a href="/centro-capacitaciones"
                   class="menu-item submenu-item ${
                       paginaActiva === "centro-capacitaciones"
                           ? "active"
                           : ""
                   }">

                    <i class="fas fa-house"></i>

                    <span>

                        Inicio

                    </span>

                </a>

                <!-- ==================================
                     MIS CAPACITACIONES
                =================================== -->

                <a href="/mis-capacitaciones"
                   class="menu-item submenu-item ${
                       paginaActiva === "mis-capacitaciones"
                           ? "active"
                           : ""
                   }">

                    <i class="fas fa-book-open"></i>

                    <span>

                        Mis Capacitaciones

                    </span>

                </a>

                <!-- ==================================
                     OPCIONES ADMINISTRATIVAS
                =================================== -->

                ${esAdministrador ? `

                    <!-- ADMINISTRAR CAPACITACIONES -->

                    <a href="/administrar-capacitaciones"
                       class="menu-item submenu-item ${
                           paginaActiva === "administrar-capacitaciones"
                               ? "active"
                               : ""
                       }">

                        <i class="fas fa-chalkboard-teacher"></i>

                        <span>

                            Administrar Capacitaciones

                        </span>

                    </a>

                    <!-- SEGUIMIENTO GENERAL -->

                    <a href="/seguimiento-general"
                       class="menu-item submenu-item ${
                           paginaActiva === "seguimiento-general"
                               ? "active"
                               : ""
                       }">

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
   FIN DEL MENÚ DEL MÓDULO DE CAPACITACIONES
   ========================================================================== */

   /* ==========================================================================
   MENÚ DEL CRONOGRAMA DE TRANSFORMÍN
   ========================================================================== */

function menuTransformin(paginaActiva) {

    /* ==========================================
       OBTENER MÓDULOS AUTORIZADOS
       ========================================== */

    const inicio = obtenerModulo("Inicio");

    const panel = obtenerModulo("Panel");

    const perfil = obtenerModulo("Perfil");

    const transformin = obtenerModulo(
        "Cronograma de Transformín"
    );

    /* ==========================================
       VERIFICAR ACCESO AL MÓDULO
       ========================================== */

    const tieneAccesoTransformin =
        transformin !== null &&
        transformin.ruta === "/cronograma-transformin";

    /* ==========================================
       IDENTIFICAR PÁGINA ACTIVA
       ========================================== */

    const esPaginaTransformin =
        paginaActiva === "cronograma-transformin" ||
        window.location.pathname === "/cronograma-transformin";

    /* ==========================================
       CONSTRUIR MENÚ DE TRANSFORMÍN
       ========================================== */

    return `

        <!-- ==========================================
             TÍTULO DE NAVEGACIÓN
        =========================================== -->

        <span class="menu-section-title">

            Navegación

        </span>

        <!-- ==========================================
             ACCESO AL INICIO
        =========================================== -->

        ${inicio ? `

            <a href="/dashboard"
               class="menu-item">

                <i class="fas fa-home"></i>

                <span>

                    Inicio

                </span>

            </a>

        ` : ""}

        <!-- ==========================================
             ACCESO AL PANEL PRINCIPAL
        =========================================== -->

        ${panel ? `

            <a href="/panel"
               class="menu-item">

                <i class="fas fa-th-large"></i>

                <span>

                    Panel

                </span>

            </a>

        ` : ""}

        <!-- ==========================================
             MÓDULO CRONOGRAMA DE TRANSFORMÍN
        =========================================== -->

        ${tieneAccesoTransformin ? `

            <span class="menu-section-title">

                Gestión de Transformín

            </span>

            <div class="menu-group open">

                <div class="menu-item menu-parent">

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                    ">

                        <i class="fas fa-calendar-alt"></i>

                        <span>

                            Transformín

                        </span>

                    </div>

                    <i class="fas fa-chevron-down menu-arrow"></i>

                </div>

                <div class="submenu">

                    <!-- CRONOGRAMA PRINCIPAL -->

                    <a href="/cronograma-transformin"
                       class="menu-item submenu-item ${
                           esPaginaTransformin
                               ? "active"
                               : ""
                       }">

                        <i class="fas fa-calendar-alt"></i>

                        <span>

                            Cronograma de Transformín

                        </span>

                    </a>

                </div>

            </div>

        ` : ""}

        <!-- ==========================================
             ACCESO AL PERFIL DEL USUARIO
        =========================================== -->

        ${perfil ? `

            <a href="/perfil"
               class="menu-item">

                <i class="fas fa-user-circle"></i>

                <span>

                    Mi Perfil

                </span>

            </a>

        ` : ""}

    `;

}

/* ==========================================================================
   FIN DEL MENÚ DEL CRONOGRAMA DE TRANSFORMÍN
   ========================================================================== */

   /* ==========================================================================
   CONSTRUCCIÓN GENERAL DEL MENÚ DINÁMICO
   ========================================================================== */

function construirMenu() {

    /* ==========================================
       IDENTIFICAR PÁGINA Y MÓDULO ACTUAL
       ========================================== */

    const pagina =
        document.body.dataset.pagina;

    const moduloActual =
        obtenerModuloActual();

    const rutaActual =
        obtenerRutaModulo(moduloActual);

    /* ==========================================
       OBTENER CONTENEDOR DEL MENÚ
       ========================================== */

    const menu =
        document.getElementById(
            "menuDinamico"
        );

    if (!menu) return;

    /* ==========================================
       OBTENER MÓDULOS PRINCIPALES
       ========================================== */

    const menuPanel =
        obtenerModulo("Panel");

    const menuDashboard =
        obtenerModulo("Inicio");

    const menuPerfil =
        obtenerModulo("Perfil");

    /* ==========================================
       OBTENER MÓDULO DE TRANSFORMÍN
       ========================================== */

    const moduloTransformin =
        obtenerModulo("Cronograma de Transformín");

    const tieneAccesoTransformin =
        moduloTransformin !== null &&
        moduloTransformin.ruta === "/cronograma-transformin";

    /* ==========================================
       DASHBOARD
       ========================================== */

    if (pagina === "dashboard") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/dashboard"
               class="menu-item active">

                <i class="fas fa-home"></i>

                Inicio

            </a>

            <a href="/panel"
               class="menu-item">

                <i class="fas fa-th-large"></i>

                Panel

            </a>

            <a href="/perfil"
               class="menu-item">

                <i class="fas fa-user-circle"></i>

                Mi Perfil

            </a>

        `;

    }

    /* ==========================================
       INDUCCIÓN
       ========================================== */

    else if (pagina === "induccion") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/induccion"
               class="menu-item active">

                <i class="fas fa-graduation-cap"></i>

                Inducción SST

            </a>

        `;

    }

    /* ==========================================
       FIRMA DIGITAL
       ========================================== */

    else if (pagina === "firma") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/induccion"
               class="menu-item">

                <i class="fas fa-graduation-cap"></i>

                Inducción SST

            </a>

            <a href="/firma"
               class="menu-item active">

                <i class="fas fa-signature"></i>

                Firma Digital

            </a>

        `;

    }

    /* ==========================================
       CERTIFICADO
       ========================================== */

    else if (pagina === "certificado") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/dashboard"
               class="menu-item">

                <i class="fas fa-home"></i>

                Inicio

            </a>

            <a href="/certificado"
               class="menu-item active">

                <i class="fas fa-certificate"></i>

                Certificado

            </a>

        `;

        /* ======================================
           BOTÓN DE DESCARGA DEL CERTIFICADO
           ====================================== */

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

                        <span>

                            Descargar PDF

                        </span>

                        <small>

                            Certificado Oficial

                        </small>

                    </div>

                </button>

                `

            );

        }

    }

    /* ==========================================
       PERFIL DEL USUARIO
       ========================================== */

    else if (pagina === "perfil") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/dashboard"
               class="menu-item">

                <i class="fas fa-home"></i>

                Inicio

            </a>

            <a href="/perfil"
               class="menu-item active">

                <i class="fas fa-user-circle"></i>

                Mi Perfil

            </a>

        `;

    }

    /* ==========================================
       PANEL PRINCIPAL DEL ERP
       ========================================== */

    else if (pagina === "panel") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/dashboard"
               class="menu-item">

                <i class="fas fa-home"></i>

                Inicio

            </a>

            <a href="/panel"
               class="menu-item active">

                <i class="fas fa-th-large"></i>

                Panel

            </a>

            <!-- ==================================
                 CRONOGRAMA DE TRANSFORMÍN
                 VISIBLE SEGÚN PERMISOS DEL SERVIDOR
            =================================== -->

            ${tieneAccesoTransformin ? `

                <a href="/cronograma-transformin"
                   class="menu-item">

                    <i class="fas fa-calendar-alt"></i>

                    <span>

                        Cronograma de Transformín

                    </span>

                </a>

            ` : ""}

            <a href="/perfil"
               class="menu-item">

                <i class="fas fa-user-circle"></i>

                Mi Perfil

            </a>

        `;

    }

    /* ==========================================
       CRONOGRAMA DE TRANSFORMÍN
       ========================================== */

    else if (

        pagina === "cronograma-transformin" ||

        window.location.pathname === "/cronograma-transformin"

    ) {

        menu.innerHTML =
            menuTransformin(
                "cronograma-transformin"
            );

    }

    /* ==========================================
       RECURSOS HUMANOS
       ========================================== */

    else if (pagina === "recursos-humanos") {

        menu.innerHTML =
            menuRecursosHumanos(
                "recursos-humanos"
            );

    }

    /* ==========================================
       LISTADO DE EMPLEADOS
       ========================================== */

    else if (pagina === "empleados") {

        menu.innerHTML =
            menuRecursosHumanos(
                "empleados"
            );

    }

    /* ==========================================
       CREAR EMPLEADO
       ========================================== */

    else if (pagina === "crear-empleado") {

        menu.innerHTML =
            menuRecursosHumanos(
                "crear-empleado"
            );

    }

    /* ==========================================
       MENÚ PRINCIPAL DE EMPLEADOS
       ========================================== */

    else if (pagina === "empleados-menu") {

        menu.innerHTML =
            menuRecursosHumanos(
                "empleados-menu"
            );

    }

    /* ==========================================
       EMPLEADOS INACTIVOS
       ========================================== */

    else if (pagina === "empleados-inactivos") {

        menu.innerHTML =
            menuRecursosHumanos(
                "empleados-inactivos"
            );

    }

    /* ==========================================
       GESTIÓN DOCUMENTAL
       ========================================== */

    else if (pagina === "documentacion") {

        menu.innerHTML =
            menuRecursosHumanos(
                "documentacion"
            );

    }

    /* ==========================================
       DOCUMENTOS Y POLÍTICAS
       ========================================== */

    else if (pagina === "documentos-lectura-admin") {

        menu.innerHTML =
            menuRecursosHumanos(
                "documentos-lectura-admin"
            );

    }

    /* ==========================================
       CENTRO DE ACTIVIDAD
       ========================================== */

    else if (pagina === "centro-actividad") {

        menu.innerHTML =
            menuRecursosHumanos(
                "centro-actividad"
            );

    }

        /* ==========================================
       MÓDULO DE USUARIOS
       ========================================== */

    else if (pagina === "usuarios") {

        menu.innerHTML =
            menuUsuarios(
                "usuarios"
            );

    }

    /* ==========================================
       CREAR USUARIO
       ========================================== */

    else if (pagina === "crear-usuario") {

        menu.innerHTML =
            menuUsuarios(
                "crear-usuario"
            );

    }

    /* ==========================================
       USUARIOS REGISTRADOS
       ========================================== */

    else if (pagina === "usuarios-registrados") {

        menu.innerHTML =
            menuUsuarios(
                "usuarios-registrados"
            );

    }

    /* ==========================================
       ROLES Y ACCESOS
       ========================================== */

    else if (pagina === "roles-accesos") {

        menu.innerHTML =
            menuUsuarios(
                "roles-accesos"
            );

    }

    /* ==========================================
       HISTORIAL DE USUARIOS
       ========================================== */

    else if (pagina === "historial-usuarios") {

        menu.innerHTML =
            menuUsuarios(
                "historial-usuarios"
            );

    }

    /* ==========================================
       MÓDULO DE NÓMINA
       ========================================== */

    else if (pagina === "nomina") {

        menu.innerHTML =
            menuNomina(
                "nomina"
            );

    }

    /* ==========================================
       LIQUIDACIÓN DE NÓMINA
       ========================================== */

    else if (pagina === "nomina-liquidacion") {

        menu.innerHTML =
            menuNomina(
                "nomina-liquidacion"
            );

    }

    /* ==========================================
       NOVEDADES DE NÓMINA
       VISTA DE USUARIO Y ADMINISTRADOR
       ========================================== */

    else if (pagina === "nomina-novedades") {

        // Obtener información del usuario actual.
        const usuario = JSON.parse(
            localStorage.getItem("usuario")
        ) || {};

        const rol =
            (usuario.rol || "").toLowerCase();

        // Identificar si el usuario tiene rol Auxiliar.
        const esAuxiliar =
            rol.includes("auxiliar");

        /* ======================================
           MENÚ PARA USUARIOS AUXILIARES
           ====================================== */

        if (esAuxiliar) {

            menu.innerHTML = `

                <span class="menu-section-title">

                    Navegación

                </span>

                <!-- ACCESO AL PANEL -->

                <a href="/panel"
                   class="menu-item">

                    <i class="fas fa-th-large"></i>

                    <span>Panel</span>

                </a>

                <!-- ACCESO AL PERFIL -->

                <a href="/perfil"
                   class="menu-item">

                    <i class="fas fa-user-circle"></i>

                    <span>Mi Perfil</span>

                </a>

                <!-- ACCESO A CAPACITACIONES -->

                <a href="/centro-capacitaciones"
                   class="menu-item">

                    <i class="fas fa-graduation-cap"></i>

                    <span>Capacitaciones</span>

                </a>

                <!-- ACCESO A NOVEDADES -->

                <a href="/nomina/novedades"
                   class="menu-item active">

                    <i class="fas fa-bell"></i>

                    <span>Novedades</span>

                </a>

            `;

        }

        /* ======================================
           MENÚ COMPLETO DE NÓMINA
           ====================================== */

        else {

            menu.innerHTML =
                menuNomina(
                    "nomina-novedades"
                );

        }

    }

    /* ==========================================
       PRÉSTAMOS
       ========================================== */

    else if (pagina === "nomina-prestamos") {

        menu.innerHTML =
            menuNomina(
                "nomina-prestamos"
            );

    }

    /* ==========================================
       LIQUIDACIÓN POR PRODUCCIÓN
       ========================================== */

    else if (pagina === "nomina-produccion") {

        menu.innerHTML =
            menuNomina(
                "nomina-produccion"
            );

    }

    /* ==========================================
       CONFIGURACIÓN DE NÓMINA
       ========================================== */

    else if (pagina === "nomina-configuracion") {

        menu.innerHTML =
            menuNomina(
                "nomina-configuracion"
            );

    }

    /* ==========================================
       HISTORIAL Y REPORTES
       ========================================== */

    else if (pagina === "nomina-historial") {

        menu.innerHTML =
            menuNomina(
                "nomina-historial"
            );

    }

    /* ==========================================
       CENTRO DE CAPACITACIONES
       ========================================== */

    else if (pagina === "centro-capacitaciones") {

        menu.innerHTML =
            menuCapacitaciones(
                "centro-capacitaciones"
            );

    }

    /* ==========================================
       MIS CAPACITACIONES
       ========================================== */

    else if (pagina === "mis-capacitaciones") {

        menu.innerHTML =
            menuCapacitaciones(
                "mis-capacitaciones"
            );

    }

    /* ==========================================
       VISUALIZACIÓN INDIVIDUAL DE CAPACITACIÓN
       ========================================== */

    else if (pagina === "capacitacion") {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <!-- ACCESO AL INICIO -->

            <a href="/dashboard"
               class="menu-item">

                <i class="fas fa-home"></i>

                <span>Inicio</span>

            </a>

            <!-- REGRESAR A MIS CAPACITACIONES -->

            <a href="/mis-capacitaciones"
               class="menu-item">

                <i class="fas fa-arrow-left"></i>

                <span>

                    Volver a mis capacitaciones

                </span>

            </a>

        `;

    }

    /* ==========================================
       ADMINISTRAR CAPACITACIONES
       ========================================== */

    else if (pagina === "administrar-capacitaciones") {

        menu.innerHTML =
            menuCapacitaciones(
                "administrar-capacitaciones"
            );

    }

    /* ==========================================
       SEGUIMIENTO GENERAL DE CAPACITACIONES
       ========================================== */

    else if (pagina === "seguimiento-general") {

        menu.innerHTML =
            menuCapacitaciones(
                "seguimiento-general"
            );

    }

    /* ==========================================
       MENÚ PREDETERMINADO
       ========================================== */

    else {

        menu.innerHTML = `

            <span class="menu-section-title">

                Navegación

            </span>

            <a href="/dashboard"
               class="menu-item active">

                <i class="fas fa-home"></i>

                Inicio

            </a>

        `;

    }

    /* ==========================================
       ACTIVAR EVENTOS DE LOS SUBMENÚS
       ========================================== */

    document
        .querySelectorAll(".menu-parent")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const grupo =
                        item.closest(
                            ".menu-group"
                        );

                    // Evitar errores si el grupo no existe.
                    if (!grupo) return;

                    grupo.classList.toggle(
                        "open"
                    );

                }
            );

        });

}

/* ==========================================================================
   FIN DE LA CONSTRUCCIÓN GENERAL DEL MENÚ
   ========================================================================== */

   /* ==========================================================================
   DATOS DEL USUARIO
   ========================================================================== */

function cargarDatosUsuario() {

    try {

        /* ==========================================
           OBTENER INFORMACIÓN DEL USUARIO
           ========================================== */

        const usuario = JSON.parse(
            localStorage.getItem("usuario")
        ) || {};

        /* ==========================================
           OBTENER ELEMENTOS DEL SIDEBAR
           ========================================== */

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

        /* ==========================================
           MOSTRAR NOMBRE DEL USUARIO
           ========================================== */

        if (nombreSidebar) {

            nombreSidebar.textContent =
                usuario.nombre ||
                "Usuario";

        }

        /* ==========================================
           MOSTRAR ROL DEL USUARIO
           ========================================== */

        if (rolSidebar) {

            rolSidebar.textContent =
                usuario.rol ||
                "Empleado";

        }

        /* ==========================================
           MOSTRAR CARGO DEL USUARIO
           ========================================== */

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
   CIERRE DE SESIÓN
   ========================================================================== */

function configurarLogout() {

    /* ==========================================
       OBTENER BOTÓN DE CIERRE DE SESIÓN
       ========================================== */

    const btnLogout =
        document.getElementById(
            "btnLogout"
        );

    if (!btnLogout) return;

    /* ==========================================
       CONFIGURAR EVENTO DE CIERRE DE SESIÓN
       ========================================== */

    btnLogout.addEventListener(
        "click",
        (e) => {

            e.preventDefault();

            /* ==================================
               ELIMINAR INFORMACIÓN DEL USUARIO
               ================================== */

            localStorage.removeItem(
                "usuario"
            );

            /* ==================================
               ELIMINAR TOKEN ALMACENADO
               ================================== */

            localStorage.removeItem(
                "token"
            );

            /* ==================================
               LIMPIAR ALMACENAMIENTO DE SESIÓN
               ================================== */

            sessionStorage.clear();

            /* ==================================
               REDIRIGIR AL CIERRE DE SESIÓN
               DEL SERVIDOR
               ================================== */

            window.location.href =
                "/logout";

        }
    );

}

/* ==========================================================================
   CONFIGURACIÓN DEL MENÚ MÓVIL
   ========================================================================== */

function configurarMenuMovil() {

    /* ==========================================
       OBTENER ELEMENTOS DEL MENÚ RESPONSIVE
       ========================================== */

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

    /* ==========================================
       VALIDAR EXISTENCIA DE LOS ELEMENTOS
       ========================================== */

    if (!btnOpen || !sidebar || !overlay) {

        return;

    }

    /* ==========================================
       ABRIR Y CERRAR EL MENÚ LATERAL
       ========================================== */

    btnOpen.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );

            /* ==================================
               MOSTRAR FONDO SUPERPUESTO
               ================================== */

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

    /* ==========================================
       CERRAR SIDEBAR AL PULSAR EL OVERLAY
       ========================================== */

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

    /* ==========================================
       CONTROLAR CAMBIOS DE TAMAÑO DE PANTALLA
       ========================================== */

    window.addEventListener(
        "resize",
        () => {

            /* ==================================
               RESTABLECER MENÚ EN ESCRITORIO
               ================================== */

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

/* ==========================================================================
   FIN DEL ARCHIVO SIDEBAR.JS

   PROCESADOS MARGARITA S.A.S.
   SISTEMA ERP CORPORATIVO
   ========================================================================== */