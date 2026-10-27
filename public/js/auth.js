(async function () {

    const publicPaths = [

        '/login',
        '/recuperar'

    ];

    const paginasProtegidas = [

        '/dashboard',
        '/induccion',
        '/evaluacion',
        '/firma',
        '/perfil',
        '/certificado',
        '/panel'

    ];

    const currentPath = window.location.pathname;

    // ============================================
    // 🔥 SOLO EJECUTAR EN PÁGINAS NECESARIAS
    // ============================================

    if (

        !paginasProtegidas.includes(currentPath) &&

        !publicPaths.includes(currentPath)

    ) {

        return;

    }

    try {

        // 🔥 SIN CACHE
        const res = await fetch('/api/me', {

            credentials: 'include',

            cache: 'no-store',

            headers: {

                'Cache-Control': 'no-cache'

            }

        });

        // 🔥 SI FALLA
        if (!res.ok) {

            if (!publicPaths.includes(currentPath)) {

                window.location.href = '/login';

            }

            return;

        }

        const data = await res.json();

        console.log("AUTH:", data);

        // ============================================
        // ❌ NO LOGUEADO
        // ============================================

        if (!data.success) {

            // 🔥 LIMPIAR STORAGE
            localStorage.clear();

            sessionStorage.clear();

            if (!publicPaths.includes(currentPath)) {

                window.location.href = '/login';

            }

            return;

        }

        // ============================================
        // ✅ SI YA ESTÁ LOGUEADO
        // ============================================

    if (

    currentPath === '/login' &&

    document.referrer.indexOf('/logout') === -1

) {

    window.location.href =

        data.redirect || '/dashboard';

}

    } catch (error) {

        console.error(

            "Error auth:",

            error

        );

        localStorage.clear();

        sessionStorage.clear();

        window.location.href = '/login';

    }

})();