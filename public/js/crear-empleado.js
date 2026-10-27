// ============================================
// 🔥 VARIABLES
// ============================================

const form =
    document.getElementById(
        'formEmpleado'
    );

const empleadoId =
    document.getElementById(
        'empleado_id'
    );


// ============================================
// 🔥 INICIO
// ============================================

document.addEventListener(

    'DOMContentLoaded',

    async () => {

        await cargarCatalogos();

        obtenerEmpleadoEditar();

    }

);


// ============================================
// 🔥 CARGAR CATALOGOS
// ============================================

async function cargarCatalogos(){

    try{

        const response =
            await fetch(

                '/api/catalogos',

                {

                    credentials:'include'

                }

            );

        const data =
            await response.json();

        cargarSelect(

            'area',

            data.areas

        );

        cargarSelect(

            'sede',

            data.sedes

        );

        cargarSelect(

            'cargo',

            data.cargos

        );

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 LLENAR SELECTS
// ============================================

function cargarSelect(id, datos){

    const select =
        document.getElementById(id);

    select.innerHTML = `
        <option value="">
            Seleccione
        </option>
    `;

    datos
    .filter(x => x.activo == 'SI')
    .forEach(item => {

        select.innerHTML += `

            <option value="${item.id}">
                ${item.nombre}
            </option>

        `;

    });

}


// ============================================
// 🔥 OBTENER PARAMETRO
// ============================================

function obtenerParametro(nombre){

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(nombre);

}


// ============================================
// 🔥 EDITAR EMPLEADO
// ============================================

async function obtenerEmpleadoEditar(){

    const id =
        obtenerParametro('id');

    if(!id) return;

    try{

        Swal.fire({

            title:'Cargando empleado...',

            allowOutsideClick:false,

            didOpen:() => {

                Swal.showLoading();

            }

        });

        const response =
            await fetch(

                `/api/empleado/${id}`,

                {

                    credentials:'include'

                }

            );

        const data =
            await response.json();

        Swal.close();

        if(!data.ok){

            Swal.fire({

                icon:'error',

                title:'Empleado no encontrado'

            });

            return;

        }

        const e =
            data.empleado;

        empleadoId.value =
            e.id || '';

        document.getElementById(
            'nombres'
        ).value =
            e.nombre || '';

        document.getElementById(
            'tipo_documento'
        ).value =
            e.tipo_documento || '';

        document.getElementById(
            'numero_documento'
        ).value =
            e.numero_documento || '';

        document.getElementById(
            'fecha_nacimiento'
        ).value =
            e.fecha_nacimiento
            ?.split('T')[0] || '';

        document.getElementById(
            'lugar_nacimiento'
        ).value =
            e.lugar_nacimiento || '';

        document.getElementById(
            'rh'
        ).value =
            e.rh || '';

        document.getElementById(
            'estado_civil'
        ).value =
            e.estado_civil || '';

        document.getElementById(
            'direccion'
        ).value =
            e.direccion || '';

        document.getElementById(
            'barrio_localidad'
        ).value =
            e.barrio_localidad || '';

        document.getElementById(
            'telefono'
        ).value =
            e.telefono || '';

        document.getElementById(
            'email'
        ).value =
            e.email || '';

        document.getElementById(
            'area'
        ).value =
            e.area_id || '';

        document.getElementById(
            'sede'
        ).value =
            e.sede_id || '';

        document.getElementById(
            'cargo'
        ).value =
            e.cargo_id || '';

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 GUARDAR
// ============================================

form.addEventListener(

    'submit',

    async e => {

        e.preventDefault();

        const datos =
            Object.fromEntries(

                new FormData(form)

            );

        // ====================================
        // VALIDACIONES
        // ====================================

        if(!datos.nombres){

            Swal.fire({

                icon:'warning',

                title:'Ingrese nombres'

            });

            return;

        }

        if(!datos.numero_documento){

            Swal.fire({

                icon:'warning',

                title:'Ingrese documento'

            });

            return;

        }

        try{

            Swal.fire({

                title:'Guardando información...',

                allowOutsideClick:false,

                didOpen:() => {

                    Swal.showLoading();

                }

            });

            const endpoint =

                datos.id

                ? '/api/actualizar-empleado'

                : '/api/crear-empleado';

            const response =
                await fetch(

                    endpoint,

                    {

                        method:

                            datos.id
                            ? 'PUT'
                            : 'POST',

                        credentials:'include',

                        headers:{

                            'Content-Type':
                            'application/json'

                        },

                        body:JSON.stringify(datos)

                    }

                );

            const data =
                await response.json();

            Swal.close();

            if(data.success){

                await Swal.fire({

                    icon:'success',

                    title:

                        datos.id

                        ? 'Empleado actualizado'

                        : 'Empleado creado',

                    text:

                        datos.id

                        ? 'La información fue actualizada'

                        : 'El empleado fue registrado correctamente',

                    confirmButtonColor:'#2563eb'

                });

                window.location.href =
                    '/empleados';

            }else{

                Swal.fire({

                    icon:'error',

                    title:'Error',

                    text:
                        data.error ||
                        'No se pudo guardar'

                });

            }

        }catch(error){

            console.error(error);

            Swal.fire({

                icon:'error',

                title:'Error servidor'

            });

        }

    }

);