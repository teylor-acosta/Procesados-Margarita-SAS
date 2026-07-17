// ============================================
// 🔥 USUARIOS-REGISTRADOS.JS
// ============================================

console.log('🔥 usuarios-registrados.js cargado');

// ============================================
// 🔥 VARIABLES
// ============================================

const tbody =
    document.getElementById('tbodyUsuarios');

const buscarUsuario =
    document.getElementById('buscarUsuario');

const totalActivos =
    document.getElementById('totalActivos');

const totalBloqueados =
    document.getElementById('totalBloqueados');

const totalPrimeraVez =
    document.getElementById('totalPrimeraVez');

const totalCambioPassword =
    document.getElementById('totalCambioPassword');

const mensaje =
    document.getElementById('mensaje');

const botonesFiltro =
    document.querySelectorAll('.filtro-btn');

let usuariosGlobal = [];

let filtroActual = 'Todos';

// ============================================
// 🔥 CARGAR USUARIOS
// ============================================

async function cargarUsuarios() {

    try {

        const res =
            await fetch('/api/usuarios/listar');

        const data =
            await res.json();

        if (!data.success) {

            mostrarError(
                'No se pudieron cargar usuarios'
            );

            return;

        }

        usuariosGlobal =
            data.usuarios;

        renderUsuarios(
            usuariosGlobal
        );

        actualizarStats(
            usuariosGlobal
        );

    } catch (error) {

        console.error(error);

        mostrarError(
            'Error cargando usuarios'
        );

    }

}

// ============================================
// 🔥 RENDER TABLA
// ============================================

function renderUsuarios(usuarios) {

    tbody.innerHTML = '';

    if (usuarios.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="text-center py-5">

                        <i
                            class="fas fa-users-slash"
                            style="
                                font-size:55px;
                                color:#94a3b8;
                                margin-bottom:15px;
                            "
                        ></i>

                        <h5>
                            No hay usuarios registrados
                        </h5>

                    </div>

                </td>

            </tr>

        `;

        return;

    }

    usuarios.forEach(usuario => {

        // ========================================
        // FOTO
        // ========================================

        let foto = '/img/defecto.jpg';

if (
    usuario.foto &&
    usuario.foto !== 'null' &&
    usuario.foto !== ''
) {

    foto = `/uploads/fotos/${usuario.foto}`;

}

        // ========================================
        // ESTADOS
        // ========================================

        let estadoHTML = '';

        if (usuario.bloqueado == 1) {

            estadoHTML += `

                <span class="badge-estado badge-bloqueado">

                    Bloqueado

                </span>

            `;

        } else {

            estadoHTML += `

                <span class="badge-estado badge-activo">

                    Activo

                </span>

            `;

        }

        if (usuario.cambio_password == 1) {

            estadoHTML += `

                <span class="badge-estado badge-password">

                    Cambio contraseña

                </span>

            `;

        }

        if (usuario.primera_vez == 1) {

            estadoHTML += `

                <span class="badge-estado badge-primera">

                    Primera vez

                </span>

            `;

        }

        // ========================================
        // LOGIN
        // ========================================

        const ultimoLogin =

            usuario.fecha_ultimo_login

            ? formatearFecha(
                usuario.fecha_ultimo_login
            )

            : 'Nunca';

        // ========================================
        // BOTON BLOQUEAR
        // ========================================

        const botonBloqueo =

            usuario.bloqueado == 1

            ? `

                <button
                    class="btn-accion btn-desbloquear"
                    onclick="toggleBloqueo(${usuario.ID},0)"
                    title="Desbloquear"
                >

                    <i class="fas fa-lock-open"></i>

                </button>

            `

            : `

                <button
                    class="btn-accion btn-bloquear"
                    onclick="toggleBloqueo(${usuario.ID},1)"
                    title="Bloquear"
                >

                    <i class="fas fa-user-lock"></i>

                </button>

            `;

        // ========================================
        // RENDER
        // ========================================

        tbody.innerHTML += `

            <tr>

                <!-- FOTO -->

                <td>

                    <img
                        src="${foto}"
                        class="foto-usuario"
                        onerror="this.src='/img/defecto.jpg'"
                    >

                </td>

                <!-- EMPLEADO -->

                <!-- EMPLEADO -->

<td>

    <div class="nombre-usuario">

        ${usuario.nombre || 'Sin empleado'}

    </div>

</td>

                <!-- USUARIO -->

                <td>

                    <div class="nombre-usuario">

                        ${usuario.Usuario}

                    </div>

                </td>

                <!-- ROL -->

                <td>

                    <span class="badge-estado badge-primera">

                        ${usuario.rol || 'Sin rol'}

                    </span>

                </td>

                <!-- ESTADOS -->

                <td>

                    ${estadoHTML}

                </td>

                <!-- LOGIN -->

                <td>

                    ${ultimoLogin}

                </td>

                <!-- ACCIONES -->

                <td>

                    <div class="acciones-tabla">

                        <!-- VER -->

                        <button
                            class="btn-accion btn-ver"
                            onclick='verUsuario(${JSON.stringify(usuario)})'
                            title="Ver usuario"
                        >

                            <i class="fas fa-eye"></i>

                        </button>

                        <!-- BLOQUEAR -->

                        ${botonBloqueo}

                        <!-- RESET -->

                        <button
                            class="btn-accion btn-reset"
                            onclick="abrirModalReset(${usuario.ID})"
                            title="Reset contraseña"
                        >

                            <i class="fas fa-key"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}

// ============================================
// 🔥 ESTADISTICAS
// ============================================

function actualizarStats(usuarios) {

    totalActivos.textContent =

        usuarios.filter(
            u => u.bloqueado == 0
        ).length;

    totalBloqueados.textContent =

        usuarios.filter(
            u => u.bloqueado == 1
        ).length;

    totalPrimeraVez.textContent =

        usuarios.filter(
            u => u.primera_vez == 1
        ).length;

    totalCambioPassword.textContent =

        usuarios.filter(
            u => u.cambio_password == 1
        ).length;

}

// ============================================
// 🔥 BUSCADOR
// ============================================

buscarUsuario.addEventListener('input', () => {

    filtrarUsuarios();

});

// ============================================
// 🔥 FILTROS
// ============================================

botonesFiltro.forEach(btn => {

    btn.addEventListener('click', () => {

        botonesFiltro.forEach(b => {

            b.classList.remove('activo');

        });

        btn.classList.add('activo');

        filtroActual =
            btn.textContent.trim();

        filtrarUsuarios();

    });

});

// ============================================
// 🔥 FILTRAR
// ============================================

function filtrarUsuarios() {

    const texto =

        buscarUsuario.value
        .toLowerCase()
        .trim();

    let filtrados =
        [...usuariosGlobal];

    filtrados = filtrados.filter(u =>

        (u.nombre || '')
        .toLowerCase()
        .includes(texto)

        ||

        (u.Usuario || '')
        .toLowerCase()
        .includes(texto)

        ||

        (u.numero_documento || '')
        .includes(texto)

    );

    if (filtroActual === 'Activos') {

        filtrados =
            filtrados.filter(
                u => u.bloqueado == 0
            );

    }

    if (filtroActual === 'Bloqueados') {

        filtrados =
            filtrados.filter(
                u => u.bloqueado == 1
            );

    }

    if (filtroActual === 'Primera vez') {

        filtrados =
            filtrados.filter(
                u => u.primera_vez == 1
            );

    }

    if (filtroActual === 'Cambio contraseña') {

        filtrados =
            filtrados.filter(
                u => u.cambio_password == 1
            );

    }

    renderUsuarios(
        filtrados
    );

}

// ============================================
// 🔥 VER USUARIO
// ============================================

function verUsuario(usuario) {

    let foto = '/img/defecto.jpg';

    if (

        usuario.foto &&
        usuario.foto !== '' &&
        usuario.foto !== 'null'

    ) {

        foto = usuario.foto;

    }

    document.getElementById(
        'detalleFoto'
    ).src = foto;

    document.getElementById(
        'detalleNombre'
    ).textContent =

        usuario.nombre || 'Usuario ERP';

    document.getElementById(
        'detalleRol'
    ).textContent =

        usuario.rol || 'Sin rol';

    document.getElementById(
        'detalleUsuario'
    ).textContent =

        usuario.Usuario;

    document.getElementById(
        'detalleLogin'
    ).textContent =

        usuario.fecha_ultimo_login

        ? formatearFecha(
            usuario.fecha_ultimo_login
        )

        : 'Nunca';

    document.getElementById(
        'detalleIntentos'
    ).textContent =

        usuario.intentos_fallidos;

    document.getElementById(
        'detalleFechaPassword'
    ).textContent =

        usuario.fecha_creacion_password

        ? formatearFecha(
            usuario.fecha_creacion_password
        )

        : '-';

    const modal =

        new bootstrap.Modal(

            document.getElementById(
                'modalUsuario'
            )

        );

    modal.show();

}

// ============================================
// 🔥 BLOQUEAR / DESBLOQUEAR
// ============================================

async function toggleBloqueo(id, estado) {

    try {

        const res =

            await fetch(

                '/api/usuarios/bloquear',

                {

                    method:'POST',

                    headers:{
                        'Content-Type':'application/json'
                    },

                    body:JSON.stringify({

                        id,
                        bloqueado:estado

                    })

                }

            );

        const data =
            await res.json();

        if (data.success) {

            mostrarExito(

                estado == 1

                ? 'Usuario bloqueado'

                : 'Usuario desbloqueado'

            );

            cargarUsuarios();

        } else {

            mostrarError(
                data.message
            );

        }

    } catch (error) {

        console.error(error);

        mostrarError(
            'Error actualizando usuario'
        );

    }

}

// ============================================
// 🔥 RESET PASSWORD SWEETALERT
// ============================================

async function abrirModalReset(id) {

    const confirmar = await Swal.fire({

        title: '¿Restablecer contraseña?',

        html: `
            Se generará una contraseña temporal para este usuario.
            <br><br>
            <b>El usuario deberá cambiarla al iniciar sesión.</b>
        `,

        icon: 'warning',

        showCancelButton: true,

        confirmButtonText: 'Sí, restablecer',

        cancelButtonText: 'Cancelar',

        confirmButtonColor: '#16a34a',

        cancelButtonColor: '#dc2626'

    });

    if (!confirmar.isConfirmed) return;

    try {

        const res = await fetch(

            '/api/usuarios/reset-password',

            {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    id

                })

            }

        );

        const data = await res.json();

        if (!data.success) {

            return Swal.fire({

                icon: 'error',

                title: 'Error',

                text: data.message

            });

        }

        await Swal.fire({

            icon: 'success',

            title: 'Contraseña restablecida',

            html: `

                <p>

                    La contraseña temporal es:

                </p>

                <h2 style="
                    color:#16a34a;
                    letter-spacing:2px;
                    margin:15px 0;
                ">

                    ${data.password}

                </h2>

                <p>

                    El usuario deberá cambiarla
                    cuando vuelva a iniciar sesión.

                </p>

            `,

            confirmButtonText: 'Aceptar',

            confirmButtonColor: '#16a34a'

        });

        cargarUsuarios();

    }

    catch (error) {

        console.error(error);

        Swal.fire({

            icon: 'error',

            title: 'Error',

            text: 'No fue posible restablecer la contraseña.'

        });

    }

}

// ============================================
// 🔥 FECHAS
// ============================================

function formatearFecha(fecha) {

    return new Date(fecha)
    .toLocaleString('es-CO');

}

// ============================================
// 🔥 INIT
// ============================================

cargarUsuarios();