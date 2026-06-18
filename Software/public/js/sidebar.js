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

    menu.innerHTML = `
    <span class="menu-section-title">
        Navegación
    </span>

    <a href="/dashboard" class="menu-item">
        <i class="fas fa-home"></i>
        Inicio
    </a>

    <a href="/panel" class="menu-item">
        <i class="fas fa-th-large"></i>
        Panel
    </a>

    <a href="/recursos-humanos" class="menu-item active">
        <i class="fas fa-users-cog"></i>
        Recursos Humanos
    </a>

    <a href="/perfil" class="menu-item">
        <i class="fas fa-user-circle"></i>
        Mi Perfil
    </a>
`;
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

        const nombre =
            document.getElementById(
                "nombre"
            );

        const rol =
            document.getElementById(
                "rol"
            );

        const cargo =
            document.getElementById(
                "cargo"
            );

        if (nombre) {

            nombre.textContent =
                usuario.nombre ||
                "Usuario";
        }

        if (rol) {

            rol.textContent =
                usuario.rol ||
                "Empleado";
        }

        if (cargo) {

            cargo.textContent =
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