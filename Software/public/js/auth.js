(async function checkAuth() {

    const publicPaths = ['/login', '/recuperar', '/cambiar-password'];
    const currentPath = window.location.pathname;

    try {

        const res = await fetch('/api/check-acceso', {
            credentials: 'include'
        });

        const data = await res.json();

        // ❌ NO LOGUEADO
        if (!data.success) {
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login';
            }
            return;
        }

        // 🔥 SI ESTÁ EN LOGIN Y YA ESTÁ LOGUEADO → REDIRIGIR
        if (publicPaths.includes(currentPath)) {
            window.location.href = data.redirect;
            return;
        }

        // 🔥 SI YA ESTÁ EN LA RUTA CORRECTA → NO HACER NADA
        if (currentPath === data.redirect) {
            return;
        }

        // 🔥 SOLO REDIRIGIR SI ES OTRA RUTA DIFERENTE
        // (esto evita loops)
        // ⚠️ puedes incluso comentar esto si quieres máxima estabilidad
        // window.location.href = data.redirect;

    } catch (e) {
        console.error("Error auth:", e);
    }

})();