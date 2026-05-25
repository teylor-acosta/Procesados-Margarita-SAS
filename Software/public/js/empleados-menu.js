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

    actualizarFecha();

});


// ============================================
// 🔥 CARGAR DASHBOARD
// ============================================

async function cargarDashboardERP(){

    try{

        const response = await fetch('/api/catalogos');

        const data = await response.json();

        console.log(data);

        const areas = data.areas || [];
        const sedes = data.sedes || [];
        const cargos = data.cargos || [];


        // ====================================
        // 🔥 ESTADISTICAS
        // ====================================

        document.getElementById('totalAreas').innerText =
            areas.length;

        document.getElementById('totalSedes').innerText =
            sedes.length;

        document.getElementById('totalCargos').innerText =
            cargos.length;

        document.getElementById('cantidadAreas').innerText =
            `${areas.length} áreas activas`;

        document.getElementById('cantidadSedes').innerText =
            `${sedes.length} sedes activas`;

        document.getElementById('cantidadCargos').innerText =
            `${cargos.length} cargos activos`;


        // ====================================
        // 🔥 TABLAS PRINCIPALES
        // ====================================

        cargarTablaPrincipal(
            'tablaAreas',
            areas,
            'Activa'
        );

        cargarTablaPrincipal(
            'tablaSedes',
            sedes,
            'Activa'
        );

        cargarTablaPrincipal(
            'tablaCargos',
            cargos,
            'Activo'
        );

    }catch(error){

        console.error(error);

        Swal.fire({

            icon:'error',

            title:'Error',

            text:'No se pudo cargar la información'

        });

    }

}


// ============================================
// 🔥 TABLAS PRINCIPALES
// ============================================

function cargarTablaPrincipal(id, datos, estado){

    const tabla = document.getElementById(id);

    if(!tabla) return;

    tabla.innerHTML = '';

    const limite = datos.slice(0, 6);

    limite.forEach(item => {

        tabla.innerHTML += `

            <tr>

                <td>

                    ${item.nombre}

                </td>

                <td>

                    <span class="estado-activo">

                        ${estado}

                    </span>

                </td>

            </tr>

        `;

    });

}


// ============================================
// 🔥 ABRIR GESTION
// ============================================

async function abrirGestion(tipo){

    tipoActual = tipo;

    paginaActual = 1;

    let endpoint = '';

    let titulo = '';

    if(tipo === 'area'){

        endpoint = '/api/areas';
        titulo = 'Gestión de Áreas';

    }

    if(tipo === 'sede'){

        endpoint = '/api/sedes';
        titulo = 'Gestión de Sedes';

    }

    if(tipo === 'cargo'){

        endpoint = '/api/cargos';
        titulo = 'Gestión de Cargos';

    }

    try{

        const response = await fetch(endpoint);

        const data = await response.json();

        datosActuales = data;

        document.getElementById('tituloGestion').innerText =
            titulo;

        document.getElementById('modalGestion').style.display =
            'flex';

        renderizarTablaGestion();

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 RENDER TABLA GESTION
// ============================================

function renderizarTablaGestion(){

    const tabla = document.getElementById('tablaGestion');

    tabla.innerHTML = '';

    const inicio =
        (paginaActual - 1) * registrosPorPagina;

    const fin =
        inicio + registrosPorPagina;

    const registros =
        datosActuales.slice(inicio, fin);


    registros.forEach(item => {

        tabla.innerHTML += `

            <tr>

                <td>

                    ${item.nombre}

                </td>

                <td>

                    <span class="estado-activo">

                        Activo

                    </span>

                </td>

                <td>

                    <div class="acciones-tabla">

                        <button
                            class="btn-tabla editar"
                            onclick="editarRegistro(
                                ${item.id},
                                '${item.nombre}'
                            )"
                        >

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            class="btn-tabla eliminar"
                            onclick="desactivarRegistro(
                                ${item.id}
                            )"
                        >

                            <i class="fas fa-minus"></i>

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
                    ${i === paginaActual
                        ? 'pagina-activa'
                        : ''
                    }
                "
                onclick="irPagina(${i})"
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

        const response = await fetch(

            `/api/${tipoActual}s`,

            {

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

                title:'Registro creado'

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

    const { value } = await Swal.fire({

        title:'Editar registro',

        input:'text',

        inputValue:nombre,

        showCancelButton:true

    });

    if(!value) return;

    try{

        const response = await fetch(

            `/api/catalogos/${tipoActual}/${id}`,

            {

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

                title:'Registro actualizado'

            });

            abrirGestion(tipoActual);

            cargarDashboardERP();

        }

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 DESACTIVAR
// ============================================

async function desactivarRegistro(id){

    const confirmar =
        await Swal.fire({

            title:'¿Desactivar registro?',

            icon:'warning',

            showCancelButton:true,

            confirmButtonText:'Sí'

        });

    if(!confirmar.isConfirmed) return;

    try{

        const response = await fetch(

            `/api/catalogos/estado/${tipoActual}/${id}`,

            {

                method:'PUT'

            }

        );

        const data =
            await response.json();

        if(data.success){

            Swal.fire({

                icon:'success',

                title:'Registro actualizado'

            });

            abrirGestion(tipoActual);

            cargarDashboardERP();

        }

    }catch(error){

        console.error(error);

    }

}


// ============================================
// 🔥 MODALES
// ============================================

function cerrarModal(){

    document.getElementById(
        'modalERP'
    ).style.display = 'none';

}

function cerrarGestion(){

    document.getElementById(
        'modalGestion'
    ).style.display = 'none';

}


// ============================================
// 🔥 FECHA
// ============================================

function actualizarFecha(){

    const fecha = new Date();

    document.getElementById(
        'ultimaActualizacion'
    ).innerText =

        `Última actualización:
        ${fecha.toLocaleDateString()}
        ${fecha.toLocaleTimeString()}`;

}