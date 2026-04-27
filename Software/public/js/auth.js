(async function () {

    const publicPaths = ['/login', '/recuperar'];
    const currentPath = window.location.pathname;

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

        // 🔥 REDIRECCIÓN INTELIGENTE
        if (currentPath !== data.redirect) {
            window.location.href = data.redirect;
        }

    } catch (e) {
        console.error("Error auth:", e);
    }

})();