console.log("🔥 reset-password.js cargado");

/* =========================================
   👁 MOSTRAR / OCULTAR PASSWORD
========================================= */

document
.querySelectorAll('.toggle-password')

.forEach(icon => {

    icon.addEventListener('click', () => {

        const targetId =
            icon.getAttribute('data-target');

        const input =
            document.getElementById(targetId);

        if (!input) return;

        /* 🔥 CAMBIAR TYPE */

        const type =
            input.type === 'password'
            ? 'text'
            : 'password';

        input.type = type;

        /* 🔥 CAMBIAR ICONO */

        icon.classList.toggle('fa-eye');

        icon.classList.toggle('fa-eye-slash');

    });

});

/* =========================================
   🔐 CAMBIO PASSWORD
========================================= */

const form =
    document.getElementById('formPassword');

const mensaje =
    document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const password =
        document
        .getElementById('password')
        .value
        .trim();

    const confirmPassword =
        document
        .getElementById('confirmPassword')
        .value
        .trim();

    /* =====================================
       🔥 VALIDAR
    ===================================== */

    if (password.length < 6) {

        mensaje.style.display = 'block';

        mensaje.className =
            'mensaje-cambiar alert alert-danger';

        mensaje.innerHTML =
            'La contraseña debe tener mínimo 6 caracteres';

        return;

    }

    if (password !== confirmPassword) {

        mensaje.style.display = 'block';

        mensaje.className =
            'mensaje-cambiar alert alert-danger';

        mensaje.innerHTML =
            'Las contraseñas no coinciden';

        return;

    }

    try {

        /* =====================================
           🔥 VALIDAR SI HAY TOKEN
        ===================================== */

        const token =
            window.location.pathname
            .includes('/reset/')

            ? window.location.pathname
                .split('/reset/')[1]
                ?.split('?')[0]

            : null;

        /* =====================================
           🔥 URL
        ===================================== */

        let url = '';

        let body = {};

        // =====================================
        // 🔥 RECUPERAR PASSWORD
        // =====================================

        if (token) {

            url =
                '/api/reset-password';

            body = {

                token,
                password

            };

        }

        // =====================================
        // 🔥 CAMBIO PASSWORD LOGUEADO
        // =====================================

        else {

            url =
                '/api/cambiar-password';

            body = {

                nuevaPassword: password

            };

        }

        /* =====================================
           🔥 FETCH
        ===================================== */

        const response =
            await fetch(url, {

                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify(body)

            });

        const data =
            await response.json();

        /* =====================================
           🔥 EXITO
        ===================================== */

        if (data.success) {

            mensaje.style.display = 'block';

            mensaje.className =
                'mensaje-cambiar alert alert-success';

            mensaje.innerHTML = token

                ? '✅ Contraseña recuperada correctamente'

                : '✅ Contraseña actualizada correctamente';

            setTimeout(() => {

                // =================================
                // 🔥 RECUPERAR PASSWORD
                // =================================

                if (token) {

                    window.location.href =
                        '/login';

                }

                // =================================
                // 🔥 CAMBIO OBLIGATORIO
                // =================================

                else {

                    window.location.href =
                        '/induccion';

                }

            }, 2500);

        }

        /* =====================================
           🔥 ERROR
        ===================================== */

        else {

            mensaje.style.display = 'block';

            mensaje.className =
                'mensaje-cambiar alert alert-danger';

            mensaje.innerHTML =
                data.message || 'Error';

        }

    }

    catch(error){

        console.error(error);

        mensaje.style.display = 'block';

        mensaje.className =
            'mensaje-cambiar alert alert-danger';

        mensaje.innerHTML =
            'Error de conexión';

    }

});