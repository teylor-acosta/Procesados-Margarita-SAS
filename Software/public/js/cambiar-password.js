document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('formPassword');

    // 🔥 OJITOS (para ambos inputs)
    document.querySelectorAll('.toggle-password').forEach(icon => {

        icon.addEventListener('click', () => {

            const inputId = icon.getAttribute('data-target');
            const input = document.getElementById(inputId);

            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;

            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    // 🔥 FORM SUBMIT
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const mensajeDiv = document.getElementById('mensaje');
        const btn = form.querySelector('button');

        const mostrar = (msg, tipo) => {
            mensajeDiv.style.display = 'block';
            mensajeDiv.className = `alert alert-${tipo}`;
            mensajeDiv.innerHTML = msg;
        };

        if (password !== confirmPassword) {
            mostrar('Las contraseñas no coinciden', 'danger');
            return;
        }

        if (password.length < 6) {
            mostrar('Mínimo 6 caracteres', 'warning');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {

            const res = await fetch('/api/cambiar-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (data.success) {
                mostrar('Contraseña actualizada. Redirigiendo...', 'success');

                setTimeout(() => {
                    window.location.href = data.redirect || '/login';
                }, 2000);

            } else {
                mostrar(data.message || 'Error', 'danger');
            }

        } catch (err) {
            mostrar('Error de conexión', 'danger');
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar contraseña';
    });

});