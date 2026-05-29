// ============================================
// 🔥 VARIABLES GLOBALES
// ============================================

let tipoActual = '';

let datosActuales = [];

let paginaActual = 1;

const registrosPorPagina = 6;


// ============================================
// 🔥 INICIO
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    cargarDashboardERP();

    cargarEstadisticasERP();

    actualizarFecha();

});


// ============================================
// 🔥 CARGAR DASHBOARD
// ============================================

async function cargarDashboardERP(){

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

        console.log(data);

        const areas =
            data.areas || [];

        const sedes =
            data.sedes || [];

        const cargos =
            data.cargos || [];


        // ====================================
        // 🔥 AREAS
        // ====================================

        document.getElementById(
            'panelAreas'
        ).innerText =

            areas.length;

        document.getElementById(
            'panelCantidadAreas'
        ).innerText =

            `${areas.filter(
                x => x.activo == 'SI'
            ).length} áreas activas`;


        // ====================================
        // 🔥 SEDES
        // ====================================

        document.getElementById(
            'panelSedes'
        ).innerText =

            sedes.length;

        document.getElementById(
            'panelCantidadSedes'
        ).innerText =

            `${sedes.filter(
                x => x.activo == 'SI'
            ).length} sedes activas`;


        // ====================================
        // 🔥 CARGOS
        // ====================================

        document.getElementById(
            'panelCargos'
        ).innerText =

            cargos.length;

        document.getElementById(
            'panelCantidadCargos'
        ).innerText =

            `${cargos.filter(
                x => x.activo == 'SI'
            ).length} cargos activos`;

    }catch(error){

        console.error(error);

        Swal.fire({

            icon:'error',

            title:'Error',

            text:
                'No se pudo cargar la información'

        });

    }

}


// ============================================
// 🔥 ESTADISTICAS ERP
// ============================================

async function cargarEstadisticasERP(){

    try{

        const response =
            await fetch(

                '/api/dashboard-estadisticas',

                {

                    credentials:'include'

                }

            );

        const data =
            await response.json();

        console.log(data);

        if(data.success){

            document.getElementById(
                'totalEmpleados'
            ).innerText =

                data.empleados || 0;


            document.getElementById(
                'totalDocumentos'
            ).innerText =

                data.documentos || 0;


            document.getElementById(
                'totalAcciones'
            ).innerText =

                data.actividad || 0;

        }

    }catch(error){

        console.error(
            'Error estadísticas ERP:',
            error
        );

    }

}


// ============================================
// 🔥 ABRIR GESTION
// ============================================

async function abrirGestion(tipo){

    tipoActual = tipo;

    paginaActual = 1;

    let endpoint = '';

    let titulo = '';

    let boton = '';

    if(tipo === 'area'){

        endpoint = '/api/areas';

        titulo = 'Gestión de Áreas';

        boton = 'Nueva Área';

    }

    if(tipo === 'sede'){

        endpoint = '/api/sedes';

        titulo = 'Gestión de Sedes';

        boton = 'Nueva Sede';

    }

    if(tipo === 'cargo'){

        endpoint = '/api/cargos';

        titulo = 'Gestión de Cargos';

        boton = 'Nuevo Cargo';

    }

    try{

        const response =
            await fetch(

                endpoint,

                {

                    credentials:'include'

                }

            );

        const data =
            await response.json();

        datosActuales =

            Array.isArray(data)

            ? data

            : [];

        document.getElementById(
            'tituloGestion'
        ).innerText = titulo;

        document.querySelector(
            '.btn-nuevo'
        ).innerHTML = `

            <i class="fas fa-plus"></i>

            ${boton}

        `;

        document.getElementById(
            'modalGestion'
        ).classList.add('activo');

        renderizarTablaGestion();

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 TABLA GESTION
// ============================================

function renderizarTablaGestion(){

    const tabla =
        document.getElementById(
            'tablaGestion'
        );

    tabla.innerHTML = '';

    const inicio =
        (paginaActual - 1)
        * registrosPorPagina;

    const fin =
        inicio + registrosPorPagina;

    const registros =
        datosActuales.slice(
            inicio,
            fin
        );


    registros.forEach(item => {

        tabla.innerHTML += `

            <tr>

                <td>

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                        "
                    >

                        <div
                            style="
                                width:42px;
                                height:42px;
                                border-radius:12px;
                                background:#eff6ff;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                color:#2563eb;
                                font-size:18px;
                            "
                        >

                            <i class="
                                fas
                                ${
                                    tipoActual == 'area'
                                    ? 'fa-building'

                                    : tipoActual == 'sede'
                                    ? 'fa-map-marker-alt'

                                    : 'fa-briefcase'
                                }
                            "></i>

                        </div>

                        <span>

                            ${item.nombre}

                        </span>

                    </div>

                </td>

                <td>

                    <span class="${
                        item.activo == 'SI'
                        ? 'estado-activo'
                        : 'estado-inactivo'
                    }">

                        ${
                            item.activo == 'SI'
                            ? 'Activo'
                            : 'Inactivo'
                        }

                    </span>

                </td>

                <td>

                    <div class="acciones-tabla">

                        <button
                            class="btn-tabla editar"

                            onclick="
                                editarRegistro(
                                    ${item.id},
                                    '${item.nombre}'
                                )
                            "
                        >

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            class="
                                btn-tabla
                                ${
                                    item.activo == 'SI'
                                    ? 'eliminar'
                                    : 'activar'
                                }
                            "

                            onclick="
                                desactivarRegistro(
                                    ${item.id}
                                )
                            "
                        >

                            <i class="
                                fas
                                ${
                                    item.activo == 'SI'
                                    ? 'fa-minus'
                                    : 'fa-check'
                                }
                            "></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

    renderizarPaginas();

}


// ============================================
// 🔥 PAGINACION
// ============================================

function renderizarPaginas(){

    const totalPaginas =
        Math.ceil(
            datosActuales.length /
            registrosPorPagina
        );

    const contenedor =
        document.getElementById(
            'numerosPaginas'
        );

    contenedor.innerHTML = '';

    for(let i = 1; i <= totalPaginas; i++){

        contenedor.innerHTML += `

            <button
                class="
                    btn-pagina
                    ${
                        i === paginaActual
                        ? 'pagina-activa'
                        : ''
                    }
                "

                onclick="
                    irPagina(${i})
                "
            >

                ${i}

            </button>

        `;

    }

    const inicio =
        (paginaActual - 1)
        * registrosPorPagina + 1;

    const fin =
        Math.min(

            paginaActual *
            registrosPorPagina,

            datosActuales.length

        );

    document.getElementById(
        'infoPaginacion'
    ).innerText =

        `Mostrando ${inicio} a ${fin}
        de ${datosActuales.length} registros`;

}


// ============================================
// 🔥 PAGINAS
// ============================================

function irPagina(numero){

    paginaActual = numero;

    renderizarTablaGestion();

}


function paginaAnterior(){

    if(paginaActual > 1){

        paginaActual--;

        renderizarTablaGestion();

    }

}


function paginaSiguiente(){

    const totalPaginas =
        Math.ceil(
            datosActuales.length /
            registrosPorPagina
        );

    if(paginaActual < totalPaginas){

        paginaActual++;

        renderizarTablaGestion();

    }

}


// ============================================
// 🔥 BUSCADOR
// ============================================

document.addEventListener('input', e => {

    if(
        e.target.id === 'buscarGestion'
    ){

        const valor =
            e.target.value.toLowerCase();

        const filas =
            document.querySelectorAll(
                '#tablaGestion tr'
            );

        filas.forEach(fila => {

            const texto =
                fila.innerText.toLowerCase();

            fila.style.display =

                texto.includes(valor)

                ? ''

                : 'none';

        });

    }

});


// ============================================
// 🔥 NUEVO REGISTRO
// ============================================

function nuevoDesdeGestion(){

    document.getElementById(
        'modalERP'
    ).style.display = 'flex';

    document.body.style.overflow = 'hidden';

    document.getElementById(
        'tituloModal'
    ).innerText =

        `Nuevo ${tipoActual}`;

    document.getElementById(
        'nombreRegistro'
    ).value = '';

}


// ============================================
// 🔥 GUARDAR
// ============================================

async function guardarRegistro(){

    const nombre =
        document.getElementById(
            'nombreRegistro'
        ).value.trim();

    if(!nombre){

        Swal.fire({

            icon:'warning',

            title:'Campo requerido',

            text:'Ingrese un nombre'

        });

        return;

    }

    try{

        const response =
            await fetch(

                `/api/${tipoActual}s`,

                {

                    credentials:'include',

                    method:'POST',

                    headers:{
                        'Content-Type':
                        'application/json'
                    },

                    body:JSON.stringify({

                        nombre

                    })

                }

            );

        const data =
            await response.json();

        if(data.success){

            Swal.fire({

                icon:'success',

                title:'Registro creado',

                text:
                    'La información se guardó correctamente',

                timer:1800,

                showConfirmButton:false

            });

            cerrarModal();

            abrirGestion(tipoActual);

            cargarDashboardERP();

        }

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 EDITAR
// ============================================

async function editarRegistro(id, nombre){

const { value } =
    await Swal.fire({

        title:'Editar registro',

        input:'text',

        inputValue:nombre,

        showCancelButton:true,

        confirmButtonText:'Guardar',

        cancelButtonText:'Cancelar',

        width:'500px',

        backdrop:true,

        allowOutsideClick:false,

        customClass:{

            popup:'swal-erp-popup'

        }

    });

    if(!value) return;

    try{

        const response =
            await fetch(

                `/api/catalogos/${tipoActual}/${id}`,

                {

                    credentials:'include',

                    method:'PUT',

                    headers:{
                        'Content-Type':
                        'application/json'
                    },

                    body:JSON.stringify({

                        nombre:value

                    })

                }

            );

        const data =
            await response.json();

        if(data.success){

            Swal.fire({

                icon:'success',

                title:'Registro actualizado',

                timer:1600,

                showConfirmButton:false

            });

            abrirGestion(tipoActual);

            cargarDashboardERP();

        }

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 ACTIVAR / DESACTIVAR
// ============================================

async function desactivarRegistro(id){

    const confirmar =
        await Swal.fire({

            title:
                '¿Actualizar estado del registro?',

            icon:'warning',

            showCancelButton:true,

            confirmButtonText:'Sí',

            cancelButtonText:'Cancelar'

        });

    if(!confirmar.isConfirmed) return;

    try{

        const response =
            await fetch(

                `/api/catalogos/estado/${tipoActual}/${id}`,

                {

                    credentials:'include',

                    method:'PUT'

                }

            );

        const data =
            await response.json();

        if(data.success){

            Swal.fire({

                icon:'success',

                title:'Estado actualizado',

                timer:1500,

                showConfirmButton:false

            });

            abrirGestion(tipoActual);

            cargarDashboardERP();

        }

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 CERRAR MODAL
// ============================================

function cerrarModal(){

    document.getElementById(
        'modalERP'
    ).style.display = 'none';

    document.body.style.overflow = 'auto';

}


// ============================================
// 🔥 CERRAR PANEL
// ============================================

function cerrarGestion(){

    document.getElementById(
        'modalGestion'
    ).classList.remove('activo');

}


// ============================================
// 🔥 FECHA
// ============================================

function actualizarFecha(){

    const fecha = new Date();

    const elemento =
        document.getElementById(
            'ultimaActualizacion'
        );

    if(elemento){

        elemento.innerText =

            fecha.toLocaleTimeString();

    }

}