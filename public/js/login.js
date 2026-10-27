/* ==========================================================================
   🌿 ERP GLOBAL - CONTROLADOR CENTRAL DE AUTENTICACIÓN Y ACCESO DINÁMICO
   ========================================================================== */

console.log("🔥 login.js cargado y optimizado");

document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');
    const mensajeDiv = document.getElementById('mensaje');

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

        if (mensajeDiv) mensajeDiv.style.display = 'none';

        if (!usuario || !password) {
            if (mensajeDiv) {
                mensajeDiv.textContent = "Debes ingresar usuario y contraseña";
                mensajeDiv.className = "alert alert-warning mt-3";
                mensajeDiv.style.display = 'block';
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos vacíos',
                    text: 'Debes ingresar usuario y contraseña',
                    confirmButtonColor: '#dc3545'
                });
            }
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
                // Limpieza absoluta de sesiones anteriores
                localStorage.clear();
                sessionStorage.clear();

                /* ==========================================================================
                   🎯 EXTRACCIÓN DINÁMICA DE CAMPOS DE BASE DE DATOS
                   ========================================================================== */
                /* ==========================================================================
   🎯 EXTRACCIÓN DINÁMICA DE CAMPOS DE BASE DE DATOS
   ========================================================================== */
const uSource = data.usuario || data;

console.log("📦 RESPUESTA LOGIN:", data);
console.log("👤 DATOS USUARIO:", uSource);

let nombreReal = "";

const posiblesCamposNombre = [
    'nombre_completo',
    'nombre',
    'nombres',
    'empleado',
    'full_name',
    'fullName',
    'usuario_nombre',
    'nombre_usuario',
    'username',
    'usuario'
];

for (const campo of posiblesCamposNombre) {
    if (uSource[campo]) {
        nombreReal = String(uSource[campo]).trim();
        break;
    }
}

if (!nombreReal && (uSource.nombres || uSource.apellidos)) {
    nombreReal = `${uSource.nombres || ''} ${uSource.apellidos || ''}`.trim();
}

if (!nombreReal) {
    nombreReal = "Usuario del Sistema";
}

console.log("✅ NOMBRE DETECTADO:", nombreReal);

                // 2. Mapeo inteligente del Cargo / Rol del empleado
                const rolReal = uSource.puesto || 
                                uSource.rol || 
                                uSource.role || 
                                uSource.rol_name || 
                                uSource.cargo || 
                                "Colaborador";

                // Guardamos la identidad real estructurada
                const sesionUsuario = {
                    nombre: nombreReal,
                    rol: rolReal
                };
                
                localStorage.setItem('usuario', JSON.stringify(sesionUsuario));
                sessionStorage.setItem('usuario', JSON.stringify(sesionUsuario));
                
                const tokenValido = data.token || 'session_cookie_active';
                localStorage.setItem('token', tokenValido);
                sessionStorage.setItem('token', tokenValido);

                console.log(`🔒 Sesión enrutada para: ${nombreReal}`);
                window.location.href = data.redirect || "/dashboard";

            } else {
                Swal.fire({
                    icon: data.inactivo ? 'warning' : 'error',
                    title: data.inactivo ? 'Empleado inactivo' : 'Error de acceso',
                    text: data.message || 'Credenciales incorrectas',
                    confirmButtonColor: '#dc3545'
                });
            }

        } catch (error) {
            console.error("Error en la petición de login:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Red',
                text: 'No se pudo establecer conexión con el servidor local.',
                confirmButtonColor: '#dc3545'
            });
        }

        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
    });
});