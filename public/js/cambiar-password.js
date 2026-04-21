document.getElementById('formPassword').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const mensajeDiv = document.getElementById('mensaje');
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    
    // Función interna para mostrar alertas (Manteniendo tu estilo visual)
    const mostrarAlerta = (texto, tipo) => {
        mensajeDiv.style.display = 'block';
        mensajeDiv.className = `alert-custom alert-${tipo}-custom`;
        const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        mensajeDiv.innerHTML = `<i class="fas ${icono} me-2"></i>${texto}`;
    };

    // Validaciones de cliente
    if (password !== confirmPassword) {
        mostrarAlerta('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Deshabilitar botón para evitar doble click
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando acceso...';
    
    try {
        const response = await fetch('/api/cambiar-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // El servidor destruye la sesión, así que debemos ir al Login
            mostrarAlerta('Contraseña actualizada con éxito. Inicia sesión de nuevo.', 'success');
            
            setTimeout(() => {
                // Usamos la redirección que envía el servidor (que será /login)
                window.location.href = result.redirect || '/login';
            }, 2000);
        } else {
            mostrarAlerta(result.message || 'Error al cambiar contraseña', 'error');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar contraseña';
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión con el servidor', 'error');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar contraseña';
    }
});