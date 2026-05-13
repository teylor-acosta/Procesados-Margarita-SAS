document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       🔥 LIMPIAR LOCALSTORAGE SI ES NUEVO
    ========================================= */

    const url = window.location.pathname;

    if (url.includes("crear-empleado")) {

        if (!localStorage.getItem("modoEditar")) {

            localStorage.removeItem("empleadoEditar");

        }

    }


    /* =========================================
       📦 OBTENER EMPLEADO
    ========================================= */

    const emp = JSON.parse(
        localStorage.getItem("empleadoEditar")
    );


    /* =========================================
       🚀 FORMULARIO NUEVO
    ========================================= */

    if (!emp) {

        document.getElementById("formEmpleado").reset();

        cargarCatalogos();

        return;

    }


    /* =========================================
       ✏️ MODO EDITAR
    ========================================= */

    document.getElementById("empleado_id").value =
        emp.id || '';

    document.getElementById("nombres").value =
        emp.nombre || '';

    document.getElementById("apellidos").value =
        emp.apellidos || '';

    document.getElementById("tipo_documento").value =
        emp.tipo_documento || '';

    document.getElementById("numero_documento").value =
        emp.numero_documento || '';

    document.getElementById("fecha_nacimiento").value =
        emp.fecha_nacimiento || '';

    document.getElementById("lugar_nacimiento").value =
        emp.lugar_nacimiento || '';

    document.getElementById("rh").value =
        emp.rh || '';

    document.getElementById("estado_civil").value =
        emp.estado_civil || '';

    document.getElementById("direccion").value =
        emp.direccion || '';

    document.getElementById("barrio_localidad").value =
        emp.barrio_localidad || '';

    document.getElementById("telefono").value =
        emp.telefono || '';

    document.getElementById("email").value =
        emp.email || '';

    cargarCatalogos(emp);

});


/* =========================================
   📚 CARGAR CATÁLOGOS
========================================= */

async function cargarCatalogos(emp = null) {

    try {

        const response = await fetch('/api/catalogos');

        const data = await response.json();


        /* =====================================
           📍 AREAS
        ===================================== */

        const selectArea =
            document.getElementById("area");

        selectArea.innerHTML =
            `<option value="">Seleccione</option>`;

        data.areas.forEach(area => {

            selectArea.innerHTML += `
                <option value="${area.id}">
                    ${area.nombre}
                </option>
            `;

        });


        /* =====================================
           📍 SEDES
        ===================================== */

        const selectSede =
            document.getElementById("sede");

        selectSede.innerHTML =
            `<option value="">Seleccione</option>`;

        data.sedes.forEach(sede => {

            selectSede.innerHTML += `
                <option value="${sede.id}">
                    ${sede.nombre}
                </option>
            `;

        });


        /* =====================================
           📍 CARGOS
        ===================================== */

        const selectCargo =
            document.getElementById("cargo");

        selectCargo.innerHTML =
            `<option value="">Seleccione</option>`;

        data.cargos.forEach(cargo => {

            selectCargo.innerHTML += `
                <option value="${cargo.id}">
                    ${cargo.nombre}
                </option>
            `;

        });


        /* =====================================
           🔥 SI ES EDITAR
        ===================================== */

        if (emp) {

            document.getElementById("area").value =
                emp.area_id || '';

            document.getElementById("sede").value =
                emp.sede_id || '';

            document.getElementById("cargo").value =
                emp.cargo_id || '';

        }

    } catch (error) {

        console.log(error);

    }

}


/* =========================================
   💾 GUARDAR EMPLEADO
========================================= */

document.getElementById("formEmpleado")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const empleado_id =
        document.getElementById("empleado_id").value;


    /* =====================================
       📦 DATOS
    ===================================== */

    const datos = {

        nombre:
            document.getElementById("nombres").value
            + ' ' +
            document.getElementById("apellidos").value,

        tipo_documento:
            document.getElementById("tipo_documento").value,

        numero_documento:
            document.getElementById("numero_documento").value,

        fecha_nacimiento:
            document.getElementById("fecha_nacimiento").value,

        lugar_nacimiento:
            document.getElementById("lugar_nacimiento").value,

        rh:
            document.getElementById("rh").value,

        estado_civil:
            document.getElementById("estado_civil").value,

        direccion:
            document.getElementById("direccion").value,

        barrio_localidad:
            document.getElementById("barrio_localidad").value,

        telefono:
            document.getElementById("telefono").value,

        email:
            document.getElementById("email").value,

        area_id:
            document.getElementById("area").value,

        sede_id:
            document.getElementById("sede").value,

        cargo_id:
            document.getElementById("cargo").value

    };


    try {

        let response;


        /* =====================================
           ✏️ EDITAR
        ===================================== */

        if (empleado_id) {

            datos.id = empleado_id;

            response = await fetch(
                '/api/actualizar-empleado',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(datos)
                }
            );

        }


        /* =====================================
           ➕ CREAR
        ===================================== */

        else {

            response = await fetch(
                '/api/crear-empleado',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(datos)
                }
            );

        }


        const result = await response.json();


        /* =====================================
           ❌ ERROR
        ===================================== */

        if (!result.success) {

            Swal.fire({

                icon: 'error',

                title: 'Error',

                text:
                    result.message ||
                    'No se pudo guardar el empleado',

                confirmButtonColor: '#dc3545'

            });

            return;

        }


        /* =====================================
           ✅ ALERTA
        ===================================== */

        Swal.fire({

            icon: 'success',

            title: empleado_id
                ? 'Empleado actualizado'
                : 'Empleado creado',

            text: empleado_id
                ? 'El empleado fue actualizado correctamente'
                : 'El empleado fue creado correctamente',

            confirmButtonColor: '#2563eb',

            background: '#ffffff',

            color: '#111'

        }).then(() => {

            localStorage.removeItem("empleadoEditar");

            localStorage.removeItem("modoEditar");

            window.location.href = "/empleados";

        });

    }

    catch (error) {

        console.log(error);

        Swal.fire({

            icon: 'error',

            title: 'Error del servidor',

            text: 'Ocurrió un problema al guardar',

            confirmButtonColor: '#dc3545'

        });

    }

});