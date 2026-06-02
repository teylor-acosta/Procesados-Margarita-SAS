document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // 🔥 VARIABLES
    // =========================================

    let empleados = [];

    let filtrados = [];

    let pagina = 1;

    const porPagina = 5;

    const modal =
        new bootstrap.Modal(
            document.getElementById('modalEmpleado')
        );

    // =========================================
    // 🔥 FORMATEAR FECHA TABLA
    // =========================================

    function formatearFecha(fecha){

        if(!fecha) return '';

        const f = new Date(fecha);

        const dia =
            String(f.getDate()).padStart(2,'0');

        const mes =
            String(f.getMonth()+1).padStart(2,'0');

        const anio =
            f.getFullYear();

        return `${dia}/${mes}/${anio}`;

    }

    // =========================================
    // 🔥 FORMATEAR FECHA INPUT
    // =========================================

    function formatearFechaInput(fecha){

        if(!fecha) return '';

        const f = new Date(fecha);

        const anio =
            f.getFullYear();

        const mes =
            String(f.getMonth()+1).padStart(2,'0');

        const dia =
            String(f.getDate()).padStart(2,'0');

        return `${anio}-${mes}-${dia}`;

    }

    // =========================================
    // 🔥 LOADER
    // =========================================

    function mostrarLoader(){

        Swal.fire({

            title:'Cargando empleados...',

            allowOutsideClick:false,

            didOpen:() => {

                Swal.showLoading();

            }

        });

    }

    // =========================================
    // 🔥 CARGAR EMPLEADOS
    // =========================================

    async function cargar(){

        try{

            mostrarLoader();

            const response =
                await fetch('/api/empleados', {

                    credentials:'include',

                    cache:'no-store'

                });

            empleados =
                await response.json();

            filtrados =
                [...empleados];

            actualizarContador();

            await llenarFiltros();

            render();

            Swal.close();

        }catch(error){

            console.error(error);

            Swal.fire({

                icon:'error',

                title:'Error cargando empleados'

            });

        }

    }

    // =========================================
    // 🔥 CONTADOR
    // =========================================

    function actualizarContador(){

        const total =
            empleados.length;

        const elemento =
            document.getElementById('totalEmpleados');

        if(elemento){

            elemento.textContent =
                total;

        }

    }

    // =========================================
    // 🔥 RENDER TABLA
    // =========================================

    function render(){

        const inicio =
            (pagina - 1) * porPagina;

        const data =
            filtrados.slice(
                inicio,
                inicio + porPagina
            );

        tablaEmpleados.innerHTML = '';

        data.forEach(emp => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `

                <td>

                    <span class="codigo-empleado">

                        ${emp.codigo || ''}

                    </span>

                </td>

                <td>${emp.nombre || ''}</td>

                <td>${emp.numero_documento || ''}</td>

                <td>${emp.tipo_documento || ''}</td>

                <td>

                    ${formatearFecha(
                        emp.fecha_nacimiento
                    )}

                </td>

                <td>${emp.lugar_nacimiento || ''}</td>

                <td>${emp.rh || ''}</td>

                <td>${emp.estado_civil || ''}</td>

                <td>${emp.direccion || ''}</td>

                <td>${emp.barrio_localidad || ''}</td>

                <td>${emp.telefono || ''}</td>

                <td>${emp.email || ''}</td>

                <td>${emp.area || ''}</td>

                <td>${emp.sede || ''}</td>

                <td>${emp.cargo || ''}</td>

                <td>

                    <span class="badge-activo">

                        Activo

                    </span>

                </td>

            `;

            fila.style.cursor = 'pointer';

            fila.addEventListener(
                'click',
                () => abrirModal(emp)
            );

            tablaEmpleados.appendChild(fila);

        });

        paginar();

    }

    // =========================================
    // 🔥 PAGINACION
    // =========================================

    function paginar(){

        const total =
            Math.ceil(
                filtrados.length / porPagina
            );

        paginacion.innerHTML = '';

        for(let i=1; i<=total; i++){

            paginacion.innerHTML += `

                <li class="page-item ${i===pagina?'active':''}">

                    <button
                    class="page-link"
                    onclick="irPagina(${i})"
                    >

                        ${i}

                    </button>

                </li>

            `;

        }

    }

    window.irPagina = (p) => {

        pagina = p;

        render();

    };

    // =========================================
    // 🔥 LLENAR FILTROS
    // =========================================

    async function llenarFiltros(){

        try{

            const response =
                await fetch('/api/filtros-empleado', {

                    credentials:'include'

                });

            const data =
                await response.json();

            cargarFiltro(
                'filtroArea',
                data.areas
            );

            cargarFiltro(
                'filtroSede',
                data.sedes
            );

            cargarFiltro(
                'filtroCargo',
                data.cargos
            );

            cargarFiltro(
                'filtroTipoDoc',
                data.tipos_documentos
            );

        }catch(error){

            console.error(error);

        }

    }

    // =========================================
    // 🔥 CARGAR FILTRO
    // =========================================

    function cargarFiltro(id, lista){

        const select =
            document.getElementById(id);

        const texto =
            select.options[0].text;

        select.innerHTML = `

            <option value="">
                ${texto}
            </option>

        `;

        (lista || []).forEach(item => {

            select.innerHTML += `

                <option value="${item.nombre}">
                    ${item.nombre}
                </option>

            `;

        });

    }

    // =========================================
    // 🔥 FILTRAR
    // =========================================

    function filtrar(){

        const texto =
            buscadorEmpleado.value
            .toLowerCase();

        const area =
            filtroArea.value;

        const sede =
            filtroSede.value;

        const cargo =
            filtroCargo.value;

        const tipoDoc =
            filtroTipoDoc.value;

        filtrados =
            empleados.filter(e =>

                (!texto ||

                    e.nombre
                    ?.toLowerCase()
                    .includes(texto)

                )

                &&

                (!area ||

                    e.area === area

                )

                &&

                (!sede ||

                    e.sede === sede

                )

                &&

                (!cargo ||

                    e.cargo === cargo

                )

                &&

                (!tipoDoc ||

                    e.tipo_documento === tipoDoc

                )

            );

        pagina = 1;

        render();

    }

    // =========================================
    // 🔥 EVENTOS FILTROS
    // =========================================

    buscadorEmpleado.oninput =
        filtrar;

    filtroArea.onchange =
        filtrar;

    filtroSede.onchange =
        filtrar;

    filtroCargo.onchange =
        filtrar;

    filtroTipoDoc.onchange =
        filtrar;

    // =========================================
    // 🔥 LIMPIAR FILTROS
    // =========================================

    btnLimpiar.onclick = () => {

        buscadorEmpleado.value = '';

        filtroArea.value = '';

        filtroSede.value = '';

        filtroCargo.value = '';

        filtroTipoDoc.value = '';

        filtrados =
            [...empleados];

        pagina = 1;

        render();

    };

    // =========================================
    // 🔥 ABRIR MODAL
    // =========================================

    async function abrirModal(emp){

        edit_id.value =
            emp.id;

        edit_nombre.value =
            emp.nombre || '';

        edit_documento.value =
            emp.numero_documento || '';

        edit_tipo_documento.value =
            emp.tipo_documento || '';

        edit_fecha_nacimiento.value =
            formatearFechaInput(
                emp.fecha_nacimiento
            );

        edit_telefono.value =
            emp.telefono || '';

        edit_email.value =
            emp.email || '';

        edit_direccion.value =
            emp.direccion || '';

        edit_barrio.value =
            emp.barrio_localidad || '';

        edit_lugar_nacimiento.value =
            emp.lugar_nacimiento || '';

        edit_rh.value =
            emp.rh || '';

        edit_estado_civil.value =
            emp.estado_civil || '';

        try{

            const response =
                await fetch('/api/filtros-empleado', {

                    credentials:'include'

                });

            const data =
                await response.json();

            cargarSelectModal(
                'edit_area',
                data.areas,
                emp.area_id
            );

            cargarSelectModal(
                'edit_sede',
                data.sedes,
                emp.sede_id
            );

            cargarSelectModal(
                'edit_cargo',
                data.cargos,
                emp.cargo_id
            );

        }catch(error){

            console.error(error);

        }

        modal.show();

    }

    // =========================================
    // 🔥 CARGAR SELECT MODAL
    // =========================================

    function cargarSelectModal(
        id,
        lista,
        selected
    ){

        const select =
            document.getElementById(id);

        select.innerHTML = `

            <option value="">
                Seleccione
            </option>

        `;

        (lista || []).forEach(x => {

            select.innerHTML += `

                <option
                value="${x.id}"
                ${x.id==selected?'selected':''}
                >

                    ${x.nombre}

                </option>

            `;

        });

    }

    // =========================================
    // 🔥 ACTUALIZAR EMPLEADO
    // =========================================

    window.actualizarEmpleado =
    async () => {

        const data = {

            id:
                edit_id.value,

            nombre:
                edit_nombre.value,

            numero_documento:
                edit_documento.value,

            tipo_documento:
                edit_tipo_documento.value,

            fecha_nacimiento:
                edit_fecha_nacimiento.value,

            telefono:
                edit_telefono.value,

            email:
                edit_email.value,

            direccion:
                edit_direccion.value,

            barrio_localidad:
                edit_barrio.value,

            lugar_nacimiento:
                edit_lugar_nacimiento.value,

            rh:
                edit_rh.value,

            estado_civil:
                edit_estado_civil.value,

            area_id:
                edit_area.value,

            sede_id:
                edit_sede.value,

            cargo_id:
                edit_cargo.value

        };

        try{

            Swal.fire({

                title:'Actualizando...',

                allowOutsideClick:false,

                didOpen:() => {

                    Swal.showLoading();

                }

            });

            const response =
                await fetch('/api/actualizar-empleado', {

                    method:'PUT',

                    headers:{

                        'Content-Type':
                        'application/json'

                    },

                    body:
                        JSON.stringify(data)

                });

            const result =
                await response.json();

            Swal.close();

            if(result.success){

                Swal.fire({

                    icon:'success',

                    title:'Empleado actualizado'

                });

                modal.hide();

                cargar();

            }

        }catch(error){

            console.error(error);

            Swal.fire({

                icon:'error',

                title:'Error actualizando'

            });

        }

    };

    // =========================================
    // 🔥 DESACTIVAR EMPLEADO
    // =========================================

    window.desactivarDesdeModal =
async () => {

    const id =
        edit_id.value;

    modal.hide();

    const confirmacion =
        await Swal.fire({

            title:
                '¿Deseas desactivar el empleado?',

            text:
                'Esta acción desactivará el empleado.',

            icon:'warning',

            showCancelButton:true,

            confirmButtonText:'Sí, desactivar',

            cancelButtonText:'Cancelar',

            allowOutsideClick:false

        });

    if(!confirmacion.isConfirmed){

        modal.show();

        return;

    }

    try{

        await fetch('/api/desactivar-empleado', {

            method:'PUT',

            headers:{

                'Content-Type':
                'application/json'

            },

            body:
                JSON.stringify({id})

        });

        await Swal.fire({

            icon:'success',

            title:'Empleado desactivado',

            text:'El empleado fue desactivado correctamente',

            confirmButtonText:'Aceptar'

        });

        cargar();

    }catch(error){

        console.error(error);

        await Swal.fire({

            icon:'error',

            title:'Error',

            text:'No fue posible desactivar el empleado'

        });

        modal.show();

    }

};

    // =========================================
    // 🔥 INICIAR
    // =========================================

    cargar();

});