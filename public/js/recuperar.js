document.getElementById('recuperarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const documento = document.getElementById('documento').value.trim();
    const alertBox = document.getElementById('mensaje-alerta');
    const btnSubmit = e.target.querySelector('button[type="submit"]');

    if (!documento) {
        alertBox.className = "alert alert-warning";
        alertBox.textContent = "Por favor, ingresa tu número de documento.";
        alertBox.style.display = 'block';
        return;
    }

    // Feedback visual en el botón
    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';

    try {
        // La ruta /api/recuperar debe estar definida en tu app.js
        const res = await fetch('/api/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento })
        });
        
        const data = await res.json();

        if (data.success) {
            // El servidor devuelve: "Contraseña restablecida a 123456. Por seguridad, cámbiala al ingresar."
            alertBox.className = "alert alert-success shadow-sm";
            alertBox.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-check-circle fa-2x me-3"></i>
                    <div>
                        <strong>¡Proceso Exitoso!</strong><br>
                        ${data.message}
                    </div>
                </div>
            `;
            
            // Opcional: Limpiar el formulario tras el éxito
            document.getElementById('recuperarForm').reset();
        } else {
            alertBox.className = "alert alert-danger shadow-sm";
            alertBox.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${data.message}`;
        }
    } catch (error) {
        console.error('Error:', error);
        alertBox.className = "alert alert-danger";
        alertBox.textContent = "Error de conexión con el servidor. Inténtalo más tarde.";
    } finally {
        // Mostrar el mensaje y restaurar el botón
        alertBox.style.display = 'block';
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
    }
});