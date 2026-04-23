(async function checkAuth() {

    const publicPaths = ['/login', '/recuperar', '/cambiar-password'];
    const currentPath = window.location.pathname;

    try {

        const res = await fetch('/api/check-acceso', {
            credentials: 'include'
        });

        if (!res.ok) {
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login';
            }
            return;
        }

        const data = await res.json();

        if (!data.success) {
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login';
            }
            return;
        }

        // 🔥 SI YA ESTÁ EN LA RUTA CORRECTA → NO HACE NADA
        if (currentPath === data.redirect) return;

        // 🔥 SI ESTÁ EN DASHBOARD Y TIENE CERTIFICADO → NO MOVERLO
        if (currentPath === '/dashboard' && data.tiene_certificado) return;

        // 🔥 SOLO REDIRIGE SI REALMENTE ESTÁ EN OTRA RUTA
        if (data.redirect && currentPath !== data.redirect) {
            window.location.href = data.redirect;
        }

    } catch (e) {
        console.error("Error auth:", e);

        if (!publicPaths.includes(currentPath)) {
            window.location.href = '/login';
        }
    }

})();