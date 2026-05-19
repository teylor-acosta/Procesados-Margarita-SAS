// ============================================
// 🔥 CREAR-USUARIO.JS
// ============================================

console.log('🔥 crear-usuario.js cargado');

// ============================================
// 🔥 VARIABLES
// ============================================

const form =
    document.getElementById('formCrearUsuario');

const empleadoInput =
    document.getElementById('empleado');

const buscarEmpleado =
    document.getElementById('buscarEmpleado');

const listaEmpleados =
    document.getElementById('listaEmpleados');

const rolSelect =
    document.getElementById('rol');

const usuarioInput =
    document.getElementById('usuario');

const passwordInput =
    document.getElementById('password');

const mensaje =
    document.getElementById('mensaje');

const togglePassword =
    document.getElementById('togglePassword');

let empleadosGlobal = [];

// ============================================
// 🔥 MOSTRAR PASSWORD
// ============================================

togglePassword.addEventListener('click', () => {

    const type =
        passwordInput.type === 'password'
        ? 'text'
        : 'password';

    passwordInput.type = type;

    togglePassword.classList.toggle('fa-eye');

    togglePassword.classList.toggle('fa-eye-slash');

});

// ============================================
// 🔥 CARGAR EMPLEADOS
// ============================================

async function cargarEmpleados() {

    try {

        const res =
            await fetch('/api/usuarios/empleados');

        const data =
            await res.json();

        if (!data.success) return;

        empleadosGlobal =
            data.empleados;

    } catch (error) {

        console.error(
            'Error empleados:',
            error
        );

    }

}

// ============================================
// 🔥 MOSTRAR EMPLEADOS
// ============================================

function mostrarEmpleados(texto = '') {

    listaEmpleados.innerHTML = '';

    const textoBusqueda =
        texto.toLowerCase().trim();

    const filtrados =
        empleadosGlobal.filter(emp =>

            emp.nombre
            .toLowerCase()
            .includes(textoBusqueda)

            ||

            emp.numero_documento
            .includes(textoBusqueda)

        );

    if (filtrados.length === 0) {

        listaEmpleados.style.display =
            'none';

        return;

    }

    filtrados.forEach(emp => {

        const div =
            document.createElement('div');

        div.className =
            'item-empleado';

        div.innerHTML = `

            <strong>

                ${emp.nombre}

            </strong>

            <br>

            <small>

                ${emp.numero_documento}

            </small>

        `;

        div.addEventListener('click', () => {

            buscarEmpleado.value =
                emp.nombre;

            empleadoInput.value =
                emp.id;

            usuarioInput.value =
                emp.numero_documento;

            listaEmpleados.style.display =
                'none';

        });

        listaEmpleados.appendChild(div);

    });

    listaEmpleados.style.display =
        'block';

}

// ============================================
// 🔥 MOSTRAR TODOS
// ============================================

buscarEmpleado.addEventListener('focus', () => {

    mostrarEmpleados('');

});

// ============================================
// 🔥 FILTRAR
// ============================================

buscarEmpleado.addEventListener('input', () => {

    mostrarEmpleados(

        buscarEmpleado.value

    );

});

// ============================================
// 🔥 CERRAR LISTA
// ============================================

document.addEventListener('click', (e) => {

    if (

        !e.target.closest('.buscador-container')

    ) {

        listaEmpleados.style.display =
            'none';

    }

});

// ============================================
// 🔥 CARGAR ROLES
// ============================================

async function cargarRoles() {

    try {

        const res =
            await fetch('/api/usuarios/roles');

        const data =
            await res.json();

        if (!data.success) return;

        rolSelect.innerHTML = `

            <option value="">
                Seleccione rol
            </option>

        `;

        data.roles.forEach(rol => {

            const option =
                document.createElement('option');

            option.value =
                rol.ID;

            option.textContent =
                rol.Nombre;

            rolSelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            'Error roles:',
            error
        );

    }

}

// ============================================
// 🔥 CREAR USUARIO
// ============================================

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const empleado_id =
        empleadoInput.value;

    const rol_id =
        rolSelect.value;

    const usuario =
        usuarioInput.value.trim();

    const password =
        passwordInput.value.trim();

    const primera_vez =
        document.getElementById('primeraVez').checked
        ? 1
        : 0;

    const cambio_password =
        document.getElementById('cambioPassword').checked
        ? 1
        : 0;

    const bloqueado =
        document.getElementById('bloqueado').checked
        ? 1
        : 0;

    // ========================================
    // 🔥 VALIDAR
    // ========================================

    if (

        !empleado_id ||

        !rol_id ||

        !usuario ||

        !password

    ) {

        mensaje.innerHTML = `

            <i class="fas fa-circle-xmark"></i>

            Complete todos los campos

        `;

        mensaje.className =
            'alerta-error mostrar';

        setTimeout(() => {

            mensaje.classList.remove('mostrar');

        }, 4000);

        return;

    }

    try {

        const res =
            await fetch('/api/usuarios/crear', {

                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify({

                    empleado_id,
                    rol_id,
                    usuario,
                    password,
                    primera_vez,
                    cambio_password,
                    bloqueado

                })

            });

        const data =
            await res.json();

        // ====================================
        // ✅ EXITO
        // ====================================

        if (data.success) {

            mensaje.innerHTML = `

                <i class="fas fa-circle-check"></i>

                Usuario creado correctamente

            `;

            mensaje.className =
                'alerta-exito mostrar';

            form.reset();

            buscarEmpleado.value = '';

            empleadoInput.value = '';

            usuarioInput.value = '';

            listaEmpleados.innerHTML = '';

            listaEmpleados.style.display =
                'none';

            setTimeout(() => {

                mensaje.classList.remove('mostrar');

            }, 3500);

        }

        // ====================================
        // ❌ ERROR
        // ====================================

        else {

            mensaje.innerHTML = `

                <i class="fas fa-circle-xmark"></i>

                ${data.message || 'No se pudo crear el usuario'}

            `;

            mensaje.className =
                'alerta-error mostrar';

            setTimeout(() => {

                mensaje.classList.remove('mostrar');

            }, 4000);

        }

    } catch (error) {

        console.error(error);

        mensaje.innerHTML = `

            <i class="fas fa-triangle-exclamation"></i>

            Error del servidor

        `;

        mensaje.className =
            'alerta-error mostrar';

        setTimeout(() => {

            mensaje.classList.remove('mostrar');

        }, 4000);

    }

});

// ============================================
// 🔥 INIT
// ============================================

cargarEmpleados();

cargarRoles();