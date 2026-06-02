document.addEventListener(
    'DOMContentLoaded',
    iniciar
);

let registros = [];
let registrosOriginales = [];

let paginaActual = 1;

const registrosPorPagina = 10;

async function iniciar(){

    await cargarDashboard();

    await cargarSeguimiento();

    configurarBuscador();

}

/* =========================================
   DASHBOARD
========================================= */

async function cargarDashboard(){

    try{

        const response =
        await fetch(
            '/api/capacitaciones/dashboard'
        );

        const data =
        await response.json();

        document.getElementById(
            'totalCompletadas'
        ).textContent =
        data.completadas || 0;

        document.getElementById(
            'totalProceso'
        ).textContent =
        data.proceso || 0;

        document.getElementById(
            'totalPendientes'
        ).textContent =
        data.pendientes || 0;

        document.getElementById(
            'totalCertificados'
        ).textContent =
        data.certificados || 0;

    }catch(error){

        console.error(error);

    }

}

/* =========================================
   TABLA
========================================= */

async function cargarSeguimiento(){

    try{

        const response =
        await fetch(
            '/api/capacitaciones/seguimiento'
        );

        const data =
        await response.json();

        registrosOriginales = data;

        registros = [...data];

        renderTablaPaginada();

    }catch(error){

        console.error(error);

    }

}

/* =========================================
   TABLA PAGINADA
========================================= */

function renderTablaPaginada(){

    const inicio =
        (paginaActual - 1)
        *
        registrosPorPagina;

    const fin =
        inicio +
        registrosPorPagina;

    const pagina =
        registros.slice(
            inicio,
            fin
        );

    renderTabla(
        pagina
    );

    renderPaginacion();

}

/* =========================================
   RENDER
========================================= */

function renderTabla(datos){

    const tabla =
    document.getElementById(
        'tablaSeguimiento'
    );

    tabla.innerHTML = '';

    datos.forEach(item=>{

        let badgeEstado='';

        if(item.estado === 'Completada'){

            badgeEstado =
            '<span class="badge-completado">Completada</span>';

        }
        else if(
            item.estado === 'En Proceso'
        ){

            badgeEstado =
            '<span class="badge-proceso">En Proceso</span>';

        }
        else{

            badgeEstado =
            '<span class="badge-pendiente">Sin Iniciar</span>';

        }

        tabla.innerHTML += `

        <tr>

            <td>
                ${item.codigo}
            </td>

            <td>
                ${item.empleado}
            </td>

            <td>
                ${item.usuario}
            </td>

            <td>

                <div class="barra-progreso">

                    <span
                        style="width:${item.progreso}%"
                    ></span>

                </div>

                <small>

                    ${item.progreso}%

                </small>

            </td>

            <td>

                ${item.evaluacion}

            </td>

            <td>

                ${item.certificado}

            </td>

            <td>

                ${badgeEstado}

            </td>

        </tr>

        `;

    });

}

/* =========================================
   PAGINACION
========================================= */

function renderPaginacion(){

    const totalPaginas =
    Math.ceil(
        registros.length /
        registrosPorPagina
    );

    const contenedor =
    document.getElementById(
        'contenedorPaginacion'
    );

    if(!contenedor)
        return;

    contenedor.innerHTML = '';

    for(
        let i = 1;
        i <= totalPaginas;
        i++
    ){

        contenedor.innerHTML += `

        <button
            class="
                btn-pagina
                ${
                    i === paginaActual
                    ?
                    'activa'
                    :
                    ''
                }
            "
            onclick="
                cambiarPagina(${i})
            "
        >

            ${i}

        </button>

        `;

    }

}

/* =========================================
   CAMBIAR PAGINA
========================================= */

function cambiarPagina(pagina){

    paginaActual =
    pagina;

    renderTablaPaginada();

}

window.cambiarPagina =
cambiarPagina;

/* =========================================
   BUSCADOR
========================================= */

function configurarBuscador(){

    const buscador =
    document.getElementById(
        'buscador'
    );

    buscador.addEventListener(
        'input',
        e=>{

            const texto =
            e.target.value
            .toLowerCase();

            if(
                texto === ''
            ){

                registros =
                [...registrosOriginales];

                paginaActual = 1;

                renderTablaPaginada();

                return;

            }

            registros =
            registrosOriginales.filter(x=>

                x.empleado
                .toLowerCase()
                .includes(texto)

                ||

                x.usuario
                .toLowerCase()
                .includes(texto)

                ||

                x.codigo
                .toLowerCase()
                .includes(texto)

            );

            paginaActual = 1;

            renderTablaPaginada();

        }
    );

}