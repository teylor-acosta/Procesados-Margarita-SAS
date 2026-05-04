document.getElementById('recuperarForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const documento = e.target.querySelector('input[name="documento"]').value.trim();
    const alertBox = document.getElementById('mensaje');
    const btnSubmit = e.target.querySelector('button[type="submit"]');

    if (!documento) {
        alertBox.className = "alert alert-warning";
        alertBox.textContent = "Por favor, ingresa tu número de documento.";
        alertBox.style.display = 'block';
        return;
    }

    const originalText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';

    try {
        const res = await fetch('/api/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento })
        });

        const data = await res.json();

        if (data.success) {
            alertBox.className = "alert alert-success";
            alertBox.innerHTML = `
                <strong>✔ Contraseña temporal:</strong><br>
                <span style="font-size:18px">${data.password}</span>
                <br><small>Debes cambiarla al iniciar sesión</small>
            `;
        } else {
            alertBox.className = "alert alert-danger";
            alertBox.textContent = data.message;
        }

    } catch (error) {
        console.error(error);
        alertBox.className = "alert alert-danger";
        alertBox.textContent = "Error del servidor";
    }

    alertBox.style.display = 'block';
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
});