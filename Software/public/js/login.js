document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const mensajeDiv = document.getElementById('mensaje'); // Coincide con tu HTML

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Referencia al botón para feedback visual
        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.innerHTML;

        // CAPTURA DE DATOS: Usamos querySelector porque tu HTML usa 'name' en vez de 'id'
        const usuario = loginForm.querySelector('input[name="usuario"]').value.trim();
        const password = loginForm.querySelector('input[name="password"]').value.trim();

        // Limpiar mensajes previos
        mensajeDiv.style.display = 'none';
        mensajeDiv.className = 'alert-custom'; // Clase base de tu CSS

        // Feedback visual
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validando...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });

            const data = await response.json();

            if (data.success) {
                // Redirigir según indique el servidor (dashboard o cambio de clave)
                window.location.href = data.redirect;
            } else {
                // Mostrar error del servidor
                mensajeDiv.textContent = data.message || "Credenciales incorrectas";
                mensajeDiv.classList.add('alert', 'alert-danger', 'mt-3'); // Clases de Bootstrap para visibilidad
                mensajeDiv.style.display = 'block';
                
                // Restaurar botón
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }
        } catch (error) {
            console.error('Error:', error);
            mensajeDiv.textContent = "Error de conexión con el servidor";
            mensajeDiv.classList.add('alert', 'alert-danger', 'mt-3');
            mensajeDiv.style.display = 'block';
            
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
        }
    });
});