document.addEventListener(
    'DOMContentLoaded',
    iniciar
);

let rolSeleccionado = null;

function iniciar(){

    cargarDashboard();

    const btnNuevoRol =
    document.getElementById(
        'btnNuevoRol'
    );

    if(btnNuevoRol){

        btnNuevoRol.addEventListener(
            'click',
            abrirModalNuevoRol
        );

    }

    const btnGuardarRol =
    document.getElementById(
        'btnGuardarRol'
    );

    if(btnGuardarRol){

        btnGuardarRol.addEventListener(
            'click',
            crearRol
        );

    }

    const btnGuardarPermisos =
    document.getElementById(
        'guardarPermisos'
    );

    if(btnGuardarPermisos){

        btnGuardarPermisos.addEventListener(
            'click',
            guardarPermisos
        );

    }

}

/* =========================================
   DASHBOARD
========================================= */

async function cargarDashboard(){

    await cargarRoles();

}

/* =========================================
   CARGAR ROLES
========================================= */

async function cargarRoles(){

    try{

        const resp =
        await fetch(
            '/api/roles-accesos/roles'
        );

        const data =
        await resp.json();

        if(!data.success){

            return;

        }

        const roles =
        data.roles || [];

        const rolesGrid =
        document.getElementById(
            'rolesGrid'
        );

        const tablaRoles =
        document.getElementById(
            'tablaRoles'
        );

        rolesGrid.innerHTML = '';
        tablaRoles.innerHTML = '';

        document.getElementById(
            'totalRoles'
        ).textContent =
        roles.length;

        let totalUsuarios = 0;

        let totalPermisos = 0;

        roles.forEach(rol=>{

            totalUsuarios +=
            Number(
                rol.total_usuarios || 0
            );

            totalPermisos +=
            Number(
                rol.total_modulos || 0
            );

            rolesGrid.innerHTML += `

            <div class="rol-card-premium">

                <div class="rol-header">

                    <div class="rol-icon-premium">

                        <i class="fas fa-user-shield"></i>

                    </div>

                    <h3>

                        ${rol.Nombre}

                    </h3>

                    <span class="estado-activo">

                        Activo

                    </span>

                </div>

                <div class="rol-datos">

                    <div class="dato-rol">

                        <i class="fas fa-users"></i>

                        <span>

                            Usuarios

                        </span>

                        <strong>

                            ${rol.total_usuarios || 0}

                        </strong>

                    </div>

                    <div class="dato-rol">

                        <i class="fas fa-key"></i>

                        <span>

                            Permisos

                        </span>

                        <strong>

                            ${rol.total_modulos || 0}

                        </strong>

                    </div>

                </div>

                <div class="descripcion-rol-premium">

                    ${
                        rol.descripcion ||
                        'Sin descripción'
                    }

                </div>

                <div class="acciones-rol">

                    <button
                    class="btn btn-primary"

                    onclick="abrirPermisos(
                        ${rol.ID},
                        '${rol.Nombre}'
                    )">

                        <i class="fas fa-cog"></i>

                        Configurar

                    </button>

                </div>

            </div>

            `;

            tablaRoles.innerHTML += `

            <tr>

                <td>

                    ${rol.Nombre}

                </td>

                <td>

                    ${
                        rol.descripcion ||
                        '-'
                    }

                </td>

                <td>

                    ${rol.total_usuarios || 0}

                </td>

                <td>

                    ${rol.total_modulos || 0}

                </td>

                <td>

                    <span
                    class="badge bg-success">

                        Activo

                    </span>

                </td>

                <td>

                    <button

                    class="btn btn-sm btn-primary"

                    onclick="abrirPermisos(
                        ${rol.ID},
                        '${rol.Nombre}'
                    )">

                        <i class="fas fa-cog"></i>

                    </button>

                </td>

            </tr>

            `;

        });

        document.getElementById(
            'totalUsuarios'
        ).textContent =
        totalUsuarios;

        document.getElementById(
            'totalModulos'
        ).textContent =
        totalPermisos;

    }catch(error){

        console.error(error);

    }

}
/* =========================================
   MODAL NUEVO ROL
========================================= */

function abrirModalNuevoRol(){

    const modal =
    new bootstrap.Modal(
        document.getElementById(
            'modalNuevoRol'
        )
    );

    modal.show();

}

/* =========================================
   CREAR ROL
========================================= */

async function crearRol(){

    try{

        const codigo =
        document.getElementById(
            'codigoRol'
        ).value.trim();

        const nombre =
        document.getElementById(
            'nombreRolNuevo'
        ).value.trim();

        const descripcion =
        document.getElementById(
            'descripcionRol'
        ).value.trim();

        if(
            !codigo ||
            !nombre
        ){

            alert(
                'Complete todos los campos'
            );

            return;

        }

        const resp =
        await fetch(

            '/api/roles-accesos/crear',

            {

                method:'POST',

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:JSON.stringify({

                    codigo,
                    nombre,
                    descripcion

                })

            }

        );

        const data =
        await resp.json();

        if(!data.success){

            alert(
                data.message ||
                'Error creando rol'
            );

            return;

        }

        location.reload();

    }catch(error){

        console.error(error);

    }

}

/* =========================================
   ABRIR PERMISOS
========================================= */

async function abrirPermisos(
    id,
    nombre
){

    rolSeleccionado = id;

    document.getElementById(
        'nombreRol'
    ).innerText =
    `Permisos - ${nombre}`;

    const contenedor =
    document.getElementById(
        'contenedorModulos'
    );

    contenedor.innerHTML = `
        <div class="text-center">
            Cargando módulos...
        </div>
    `;

    try{

        const resp =
        await fetch(
            '/api/roles-accesos/modulos'
        );

        const data =
        await resp.json();

        let html = '';

        data.modulos.forEach(modulo=>{

            html += `

            <label
            class="modulo-check">

                <input
                    type="checkbox"
                    value="${modulo.nombre}">

                <i class="
                ${modulo.icono || 'fas fa-cube'}
                "></i>

                ${modulo.nombre}

            </label>

            `;

        });

        contenedor.innerHTML =
        html;

        const modal =
        new bootstrap.Modal(
            document.getElementById(
                'modalPermisos'
            )
        );

        modal.show();

    }catch(error){

        console.error(error);

    }

}

/* =========================================
   GUARDAR PERMISOS
========================================= */

async function guardarPermisos(){

    try{

        if(!rolSeleccionado){

            alert(
                'Seleccione un rol'
            );

            return;

        }

        const checks =
        document.querySelectorAll(
            '#contenedorModulos input:checked'
        );

        const modulos = [];

        checks.forEach(check=>{

            modulos.push(
                check.value
            );

        });

        const resp =
        await fetch(

            '/api/roles-accesos/guardar',

            {

                method:'POST',

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:JSON.stringify({

                    rol_id:
                    rolSeleccionado,

                    modulos

                })

            }

        );

        const data =
        await resp.json();

        if(!data.success){

            alert(
                data.message ||
                'Error guardando permisos'
            );

            return;

        }

        alert(
            'Permisos actualizados'
        );

        const modal =
        bootstrap.Modal.getInstance(
            document.getElementById(
                'modalPermisos'
            )
        );

        if(modal){

            modal.hide();

        }

        cargarRoles();

    }catch(error){

        console.error(error);

        alert(
            'Error de conexión'
        );

    }

}
/* =========================================
   MODAL NUEVO ROL
========================================= */

function abrirModalNuevoRol(){

    const modal =
    new bootstrap.Modal(
        document.getElementById(
            'modalNuevoRol'
        )
    );

    modal.show();

}

/* =========================================
   CREAR ROL
========================================= */

async function crearRol(){

    try{

        const codigo =
        document.getElementById(
            'codigoRol'
        ).value.trim();

        const nombre =
        document.getElementById(
            'nombreRolNuevo'
        ).value.trim();

        const descripcion =
        document.getElementById(
            'descripcionRol'
        ).value.trim();

        if(
            !codigo ||
            !nombre
        ){

            alert(
                'Complete todos los campos'
            );

            return;

        }

        const resp =
        await fetch(

            '/api/roles-accesos/crear',

            {

                method:'POST',

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:JSON.stringify({

                    codigo,
                    nombre,
                    descripcion

                })

            }

        );

        const data =
        await resp.json();

        if(!data.success){

            alert(
                data.message ||
                'Error creando rol'
            );

            return;

        }

        location.reload();

    }catch(error){

        console.error(error);

    }

}

/* =========================================
   ABRIR PERMISOS
========================================= */

async function abrirPermisos(
    id,
    nombre
){

    rolSeleccionado = id;

    document.getElementById(
        'nombreRol'
    ).innerText =
    `Permisos - ${nombre}`;

    const contenedor =
    document.getElementById(
        'contenedorModulos'
    );

    contenedor.innerHTML = `
        <div class="text-center p-4">
            Cargando módulos...
        </div>
    `;

    try{

        /* ==========================
           CARGAR TODOS LOS MODULOS
        ========================== */

        const resp =
        await fetch(
            '/api/roles-accesos/modulos'
        );

        const data =
        await resp.json();

        let html = '';

        data.modulos.forEach(modulo=>{

            html += `

            <label class="modulo-check">

                <input
                    type="checkbox"

                    data-id="${modulo.id}"

                    value="${modulo.nombre}"
                >

                <i class="${modulo.icono}"></i>

                ${modulo.nombre}

            </label>

            `;

        });

        contenedor.innerHTML = html;

        /* ==========================
           CARGAR PERMISOS DEL ROL
        ========================== */

        const permisosResp =
        await fetch(
            `/api/roles-accesos/permisos/${id}`
        );

        const permisosData =
        await permisosResp.json();

        if(permisosData.success){

            const permisos =
            permisosData.permisos.map(
                permiso =>
                Number(
                    permiso.modulo_id
                )
            );

            document
            .querySelectorAll(
                '#contenedorModulos input'
            )
            .forEach(check=>{

                const moduloId =
                Number(
                    check.dataset.id
                );

                if(
                    permisos.includes(
                        moduloId
                    )
                ){

                    check.checked = true;

                }

            });

        }

        const modal =
        new bootstrap.Modal(
            document.getElementById(
                'modalPermisos'
            )
        );

        modal.show();

    }catch(error){

        console.error(error);

    }

}

/* =========================================
   GUARDAR PERMISOS
========================================= */

async function guardarPermisos(){

    try{

        if(!rolSeleccionado){

            alert(
                'Seleccione un rol'
            );

            return;

        }

        const checks =
        document.querySelectorAll(
            '#contenedorModulos input:checked'
        );

        const modulos = [];

        checks.forEach(check=>{

            modulos.push(
                check.value
            );

        });

        const resp =
        await fetch(

            '/api/roles-accesos/guardar',

            {

                method:'POST',

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:JSON.stringify({

                    rol_id:
                    rolSeleccionado,

                    modulos

                })

            }

        );

        const data =
        await resp.json();

        if(!data.success){

            alert(
                data.message ||
                'Error guardando permisos'
            );

            return;

        }

        alert(
            'Permisos actualizados'
        );

        const modal =
        bootstrap.Modal.getInstance(
            document.getElementById(
                'modalPermisos'
            )
        );

        if(modal){

            modal.hide();

        }

        cargarRoles();

    }catch(error){

        console.error(error);

        alert(
            'Error de conexión'
        );

    }

}