document.addEventListener(
    'DOMContentLoaded',
    iniciar
);

let registros = [];
let registrosOriginales = [];
let filtroActual = 'todos';
let paginaActual = 1;

const registrosPorPagina = 10;

async function iniciar(){

    await cargarDashboard();

    await cargarSeguimiento();

    configurarBuscador();
    configurarFiltros();
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
            <td>

    <button
        class="btn-ver-detalle"
        onclick="verDetalle('${item.usuario}')"
    >

        <i class="fas fa-eye"></i>

    </button>

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
async function verDetalle(usuario){

    try{

        const response =
        await fetch(

            `/api/capacitaciones/detalle/${usuario}`

        );

        const data =
        await response.json();

        let htmlCapitulos = '';

        data.capitulos.forEach(c=>{

            htmlCapitulos += `

                <div
                    style="
                        padding:8px;
                        border-bottom:1px solid #eee;
                    "
                >

                    ${
                        c.visto
                        ?
                        '✅'
                        :
                        '❌'
                    }

                    ${c.titulo}

                </div>

            `;

        });

        document.getElementById(
            'contenidoDetalle'
        ).innerHTML = `

            <div class="row mb-3">

                <div class="col-md-4">

                    <strong>Código:</strong><br>

                    ${data.empleado.codigo}

                </div>

                <div class="col-md-4">

                    <strong>Usuario:</strong><br>

                    ${data.empleado.Usuario}

                </div>

                <div class="col-md-4">

                    <strong>Empleado:</strong><br>

                    ${data.empleado.nombre}

                </div>

            </div>

            <hr>

            <h5>

                <i class="fas fa-list-check"></i>

                Capítulos

            </h5>

            <div
                style="
                    max-height:250px;
                    overflow:auto;
                    border:1px solid #eee;
                    border-radius:10px;
                    padding:10px;
                    margin-bottom:20px;
                "
            >

                ${htmlCapitulos}

            </div>

            <div class="row">

                <div class="col-md-6">

                    <strong>Evaluación:</strong>

                    ${
                        data.evaluacion
                        ?
                        (
                            data.evaluacion.aprobado
                            ?
                            `✅ Aprobado (${data.evaluacion.nota})`
                            :
                            `❌ Reprobado (${data.evaluacion.nota})`
                        )
                        :
                        'Pendiente'
                    }

                </div>

                <div class="col-md-6">

                    <strong>Certificado:</strong>

                    ${
                        data.certificado
                        ?
                        '📄 Emitido'
                        :
                        '⏳ No emitido'
                    }

                </div>

            </div>

        `;

        new bootstrap.Modal(

            document.getElementById(
                'modalDetalle'
            )

        ).show();

    }catch(error){

        console.error(error);

    }

}

window.verDetalle =
verDetalle;

function configurarFiltros(){

    document
    .querySelectorAll(
        '.btn-filtro'
    )
    .forEach(btn=>{

        btn.addEventListener(
            'click',
            ()=>{

                document
                .querySelectorAll(
                    '.btn-filtro'
                )
                .forEach(b=>

                    b.classList.remove(
                        'activo'
                    )

                );

                btn.classList.add(
                    'activo'
                );

                filtroActual =
                btn.dataset.filtro;

                aplicarFiltros();

            }
        );

    });

}

function aplicarFiltros(){

    let resultado =
    [...registrosOriginales];

    switch(
        filtroActual
    ){

        case 'completada':

            resultado =
            resultado.filter(x=>

                x.estado ===
                'Completada'

            );

        break;

        case 'proceso':

            resultado =
            resultado.filter(x=>

                x.estado ===
                'En Proceso'

            );

        break;

        case 'pendiente':

            resultado =
            resultado.filter(x=>

                x.estado ===
                'Sin Iniciar'

            );

        break;

        case 'certificado':

            resultado =
            resultado.filter(x=>

                x.certificado ===
                'Sí'

            );

        break;

        case 'sin-certificado':

            resultado =
            resultado.filter(x=>

                x.certificado ===
                'No'

            );

        break;

    }

    registros =
    resultado;

    paginaActual = 1;

    renderTablaPaginada();

}

document
.getElementById(
    'btnExcel'
)
.addEventListener(
    'click',
    ()=>{

        window.open(

            '/api/capacitaciones/exportar-excel',

            '_blank'

        );

    }
);