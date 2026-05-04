console.log("🔥 login.js cargado");

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const mensajeDiv = document.getElementById('mensaje');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        console.log("🔥 SUBMIT FUNCIONA");
        e.preventDefault();

        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.innerHTML;

        const usuario = loginForm.querySelector('input[name="usuario"]').value.trim();
        const password = loginForm.querySelector('input[name="password"]').value.trim();

        // Reset mensaje
        mensajeDiv.style.display = 'none';
        mensajeDiv.className = 'alert-custom';

        // Validación básica
        if (!usuario || !password) {
            mensajeDiv.textContent = "Debes ingresar usuario y contraseña";
            mensajeDiv.classList.add('alert', 'alert-warning', 'mt-3');
            mensajeDiv.style.display = 'block';
            return;
        }

        // UI loading
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validando...';

        try {
            console.log("🚀 ANTES DEL FETCH");

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ usuario, password })
            });

            console.log("✅ DESPUÉS DEL FETCH");

            const data = await response.json();
            console.log("📩 RESPUESTA:", data);

            if (data.success) {
                // 🔥 AQUÍ ESTÁ LA MEJORA CLAVE
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    window.location.href = "/dashboard";
                }
            } else {
                mensajeDiv.textContent = data.message || "Credenciales incorrectas";
                mensajeDiv.classList.add('alert', 'alert-danger', 'mt-3');
                mensajeDiv.style.display = 'block';

                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }

        } catch (error) {
            console.error("❌ ERROR FETCH:", error);

            mensajeDiv.textContent = "Error de conexión con el servidor";
            mensajeDiv.classList.add('alert', 'alert-danger', 'mt-3');
            mensajeDiv.style.display = 'block';

            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
        }
    });
});