console.log("🔥 recuperar.js cargado");

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // ELEMENTOS
    // ============================================

    const form =
        document.getElementById('recuperarForm');

    const btn =
        document.getElementById('btnRecuperar');

    const mensaje =
        document.getElementById('mensaje');

    // ============================================
    // VALIDAR FORM
    // ============================================

    if (!form) return;

    // ============================================
    // SUBMIT
    // ============================================

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        // ========================================
        // DOCUMENTO
        // ========================================

        const documento =
            document
            .getElementById('documento')
            .value
            .trim();

        // ========================================
        // VALIDACIÓN
        // ========================================

        if (!documento) {

            Swal.fire({

                icon:'warning',

                title:'Campo requerido',

                text:'Ingrese su número de documento',

                confirmButtonColor:'#2563eb'

            });

            return;

        }

        // ========================================
        // LOADING BOTON
        // ========================================

        const originalText = btn.innerHTML;

        btn.disabled = true;

        btn.innerHTML = `

            <i class="fas fa-spinner fa-spin me-2"></i>

            Consultando...

        `;

        // ========================================
        // LIMPIAR MENSAJE
        // ========================================

        mensaje.style.display = 'none';

        try {

            // ====================================
            // FETCH API
            // ====================================

            const response = await fetch(

                '/api/recuperar',

                {

                    method:'POST',

                    headers:{
                        'Content-Type':'application/json'
                    },

                    body:JSON.stringify({

                        documento

                    })

                }

            );

            const data = await response.json();

            // ====================================
            // RESPUESTA EXITOSA
            // ====================================

            if (data.success) {

                Swal.fire({

                    icon:'success',

                    title:'Solicitud procesada',

                    html:`

                        <p>

                            Si la cuenta existe,
                            se enviará un enlace
                            de recuperación al
                            correo registrado.

                        </p>

                    `,

                    confirmButtonColor:'#198754'

                });

                // 🔥 LIMPIAR FORM
                form.reset();

            }

            // ====================================
            // ERROR CONTROLADO
            // ====================================

            else {

                Swal.fire({

                    icon:'error',

                    title:'Error',

                    text:
                        data.message ||
                        'No fue posible procesar la solicitud',

                    confirmButtonColor:'#dc2626'

                });

            }

        }

        // ========================================
        // ERROR SERVIDOR
        // ========================================

        catch (error) {

            console.error(

                '🔥 ERROR RECUPERAR:',

                error

            );

            Swal.fire({

                icon:'error',

                title:'Error de conexión',

                text:
                    'No fue posible conectar con el servidor',

                confirmButtonColor:'#dc2626'

            });

        }

        // ========================================
        // RESTAURAR BOTÓN
        // ========================================

        btn.disabled = false;

        btn.innerHTML = originalText;

    });

});