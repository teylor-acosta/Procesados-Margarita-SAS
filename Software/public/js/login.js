console.log("🔥 login.js cargado");

document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const mensajeDiv = document.getElementById('mensaje');

    // 🔥 OJITO
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword) {
        togglePassword.addEventListener('click', () => {

            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;

            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.innerHTML;

        const usuario = loginForm.usuario.value.trim();
        const password = loginForm.password.value.trim();

        mensajeDiv.style.display = 'none';

        if (!usuario || !password) {
            mensajeDiv.textContent = "Debes ingresar usuario y contraseña";
            mensajeDiv.className = "alert alert-warning mt-3";
            mensajeDiv.style.display = 'block';
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validando...';

        try {

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ usuario, password })
            });

            const data = await response.json();

            if (data.success) {

    window.location.href =
        data.redirect || "/dashboard";

} else {

    Swal.fire({

        icon: data.inactivo
            ? 'warning'
            : 'error',

        title: data.inactivo
            ? 'Empleado inactivo'
            : 'Error de acceso',

        text:
            data.message ||
            'Credenciales incorrectas',

        confirmButtonColor: '#dc3545'

    });

}

        } catch (error) {

            mensajeDiv.textContent = "Error de conexión con el servidor";
            mensajeDiv.className = "alert alert-danger mt-3";
            mensajeDiv.style.display = 'block';
        }

        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
    });

});