(async function () {

    const publicPaths = ['/login', '/recuperar'];
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

    // 🔥 SOLO ejecutar en páginas necesarias
    if (!paginasProtegidas.includes(currentPath) && !publicPaths.includes(currentPath)) {
        return;
    }

    try {

        const res = await fetch('/api/me', {
            credentials: 'include'
        });

        const data = await res.json();

        console.log("AUTH:", data);

        // ❌ NO LOGUEADO
        if (!data.success) {
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login';
            }
            return;
        }

        // 🔥 SOLO redirigir si estás en login
        if (currentPath === '/login') {
            window.location.href = data.redirect;
        }

    } catch (error) {
        console.error("Error auth:", error);
        window.location.href = '/login';
    }

})();