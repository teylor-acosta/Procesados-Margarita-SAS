// Script de protección de rutas - Ejecución inmediata
(async function checkAuth() {
    // Rutas que no necesitan validación (evita bucles infinitos)
    const publicPaths = ['/login', '/recuperar', '/cambiar-password'];
    const currentPath = window.location.pathname;

    try {
        const res = await fetch('/api/check-acceso');
        
        // Si el servidor no responde o hay error de sesión (401/403)
        if (!res.ok) {
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login';
            }
            return;
        }

        const data = await res.json();

        if (data.success) {
            // Lógica de Redirección Inteligente
            // Si el servidor sugiere una ruta y no estamos en ella, redirigimos.
            // Excepción: Si estamos en una ruta pública pero ya tenemos sesión válida.
            if (data.redirect && currentPath !== data.redirect) {
                
                // Evitamos redirigir si el usuario ya está en el dashboard y el server sugiere dashboard
                if (currentPath === '/dashboard' && data.redirect === '/dashboard') return;
                
                window.location.href = data.redirect;
            }
        } else {
            // Si el éxito es falso y no estamos en login, a loguearse
            if (!publicPaths.includes(currentPath)) {
                window.location.href = '/login';
            }
        }
    } catch (e) {
        console.error("Error crítico de autenticación:", e);
        // En caso de caída del servidor, protegemos la entrada
        if (!publicPaths.includes(currentPath)) {
            window.location.href = '/login';
        }
    }
})();