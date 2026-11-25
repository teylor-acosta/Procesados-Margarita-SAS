
'use strict';

(async function verificarAutenticacion() {
    // === CONFIGURACIÓN DE PÁGINAS PÚBLICAS ===
    const publicPaths = [
        '/login',
        '/recuperar'
    ];

    // === CONFIGURACIÓN DE PÁGINAS PROTEGIDAS ===
    const paginasProtegidas = [
        '/dashboard',
        '/induccion',
        '/evaluacion',
        '/firma',
        '/perfil',
        '/certificado',
        '/panel',
        '/cronograma-transformin',
        '/cambiar-password',
        '/documentos-lectura'
    ];

    // === RUTAS DE CUMPLIMIENTO OBLIGATORIO ===
    const rutasObligatorias = [
        '/cambiar-password',
        '/induccion',
        '/firma',
        '/documentos-lectura'
    ];

    // === IDENTIFICAR LA RUTA ACTUAL ===
    const currentPath =
        window.location.pathname.replace(/\/+$/, '') || '/';

    const esPublica = publicPaths.includes(currentPath);
    const esProtegida = paginasProtegidas.includes(currentPath);

    // === EVITAR EJECUCIONES INNECESARIAS ===
    if (!esPublica && !esProtegida) return;

    // === CONTROL DE REDIRECCIONES ===
    function redirigir(ruta) {
        if (typeof ruta !== 'string' || !ruta.startsWith('/') || ruta.startsWith('//')) {
            return;
        }

        const destino = new URL(ruta, window.location.origin);

        if (destino.origin !== window.location.origin) return;

        if (window.location.pathname + window.location.search !== destino.pathname + destino.search) {
            window.location.replace(destino.pathname + destino.search);
        }
    }

    // === LIMPIAR DATOS TEMPORALES DE AUTENTICACIÓN ===
    function limpiarDatosSesion() {
        try {
            sessionStorage.removeItem('usuario');
            sessionStorage.removeItem('auth');
            localStorage.removeItem('usuario');
            localStorage.removeItem('auth');
        } catch (error) {
            console.warn('No fue posible limpiar los datos temporales.');
        }
    }

    // === VALIDAR RESPUESTA DE AUTENTICACIÓN ===
    function sesionValida(data) {
        return Boolean(
            data &&
            typeof data === 'object' &&
            data.success === true
        );
    }

    // === CONTROL DE ACCESO ===
    try {
        const response = await fetch('/api/me', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            redirect: 'error',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        // === RESPUESTA HTTP NO AUTORIZADA ===
        if (response.status === 401 || response.status === 403) {
            limpiarDatosSesion();

            if (esProtegida) {
                redirigir('/login');
            }

            return;
        }

        // === OTROS ERRORES DEL SERVIDOR ===
        if (!response.ok) {
            console.error(
                'Error verificando autenticación:',
                response.status
            );

            return;
        }

        // === VERIFICAR FORMATO DE RESPUESTA ===
        const contentType =
            response.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            console.error(
                'La respuesta de autenticación no contiene JSON.'
            );

            return;
        }

        // === OBTENER INFORMACIÓN DE LA SESIÓN ===
        const data = await response.json();

        // === USUARIO SIN SESIÓN ACTIVA ===
        if (!sesionValida(data)) {
            limpiarDatosSesion();

            if (esProtegida) {
                redirigir('/login');
            }

            return;
        }

        // === USUARIO AUTENTICADO ===
        const destino =
            typeof data.redirect === 'string' &&
            data.redirect.startsWith('/') &&
            !data.redirect.startsWith('//')
                ? data.redirect
                : '/dashboard';

        // === REDIRECCIÓN DESDE LOGIN ===
        if (currentPath === '/login') {
            redirigir(destino);
            return;
        }

        // === REDIRECCIÓN DESDE RECUPERACIÓN ===
        if (currentPath === '/recuperar') {
            redirigir(destino);
            return;
        }

        // === VALIDAR REQUISITOS OBLIGATORIOS ===
        if (
            esProtegida &&
            rutasObligatorias.includes(destino) &&
            currentPath !== destino
        ) {
            redirigir(destino);
            return;
        }

        // === VALIDAR ACCESO A CRONOGRAMA DE TRANSFORMÍN ===
        if (currentPath === '/cronograma-transformin') {
            // La sesión se encuentra activa.
            // Los permisos de administrador y demás roles
            // deben verificarse en el backend del cronograma.
        }

        // === AUTENTICACIÓN COMPLETADA ===
        // El usuario puede continuar utilizando la página.
        // No se modifica el almacenamiento de otros módulos.

    } catch (error) {
        // === ERROR DE RED O SERVIDOR ===
        console.error(
            'No fue posible verificar la sesión:',
            error
        );

        // No eliminar datos ni cerrar la sesión por
        // problemas temporales de conectividad.
    }
})();
