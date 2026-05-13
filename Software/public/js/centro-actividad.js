const timeline =
    document.getElementById('timelineActividad');

const buscar =
    document.getElementById('buscarActividad');

const filtro =
    document.getElementById('filtroAccion');

let actividadesGlobal = [];


/* =========================================
   🚀 CARGAR ACTIVIDADES
========================================= */

async function cargarActividades(){

    try{

         const response = await fetch('/api/centro-actividad', {
            credentials: 'include'
        });

        const data =
            await response.json();

        if(!data.ok){

            timeline.innerHTML = `

                <div class="alert alert-danger">

                    Error al cargar actividades

                </div>

            `;

            return;

        }

        actividadesGlobal =
            data.actividades;

        renderizarActividades(
            actividadesGlobal
        );

        actualizarResumen(
            actividadesGlobal
        );

    }

    catch(error){

        console.log(error);

    }

}


/* =========================================
   🎨 RENDER ACTIVIDADES
========================================= */

function renderizarActividades(lista){

    timeline.innerHTML = "";

    if(lista.length === 0){

        timeline.innerHTML = `

            <div class="alert alert-warning">

                No hay actividad registrada

            </div>

        `;

        return;

    }

    lista.forEach(act => {

        const color =
            act.color || 'azul';

        const icono =
            act.icono || 'fa-clock';

        const fecha =
            formatearFecha(act.fecha);

        const card = document.createElement('div');

        card.className =
            `actividad-card ${color}`;

        card.innerHTML = `

            <div class="icono-actividad">

                <i class="fas ${icono}"></i>

            </div>

            <div class="contenido-actividad">

                <div class="header-actividad">

                    <h4>

                        ${act.accion}

                    </h4>

                    <span class="hora-actividad">

                        ${fecha}

                    </span>

                </div>

                <p>

                    ${act.descripcion}

                </p>

                ${act.valor_anterior || act.valor_nuevo ? `

                <div class="cambios-box">

                    <div>

                        <span class="antes">

                            ANTES

                        </span>

                        <p>

                            ${act.valor_anterior || '---'}

                        </p>

                    </div>

                    <div>

                        <span class="despues">

                            AHORA

                        </span>

                        <p>

                            ${act.valor_nuevo || '---'}

                        </p>

                    </div>

                </div>

                ` : ''}

                <div class="footer-actividad">

                    <span>

                        <i class="fas fa-user"></i>

                        ${act.usuario_nombre || 'Sistema'}

                    </span>

                    <span class="badge-accion ${color}">

                        ${act.modulo}

                    </span>

                </div>

            </div>

        `;

        timeline.appendChild(card);

    });

}


/* =========================================
   📊 RESUMEN
========================================= */

function actualizarResumen(lista){

    let crear = 0;
    let actualizar = 0;
    let documento = 0;
    let desactivar = 0;

    lista.forEach(act => {

        if(act.accion === 'CREAR') crear++;

        if(act.accion === 'ACTUALIZAR') actualizar++;

        if(act.accion === 'DOCUMENTO') documento++;

        if(act.accion === 'DESACTIVAR') desactivar++;

    });

    document.getElementById(
        'totalCreaciones'
    ).textContent = crear;

    document.getElementById(
        'totalActualizaciones'
    ).textContent = actualizar;

    document.getElementById(
        'totalDocumentos'
    ).textContent = documento;

    document.getElementById(
        'totalDesactivados'
    ).textContent = desactivar;

}


/* =========================================
   🔍 FILTROS
========================================= */

function aplicarFiltros(){

    const texto =
        buscar.value.toLowerCase();

    const accion =
        filtro.value;

    const filtradas =
        actividadesGlobal.filter(act => {

            const coincideTexto =

                act.descripcion
                .toLowerCase()
                .includes(texto);

            const coincideAccion =

                accion === ''
                ||
                act.accion === accion;

            return (
                coincideTexto &&
                coincideAccion
            );

        });

    renderizarActividades(filtradas);

    actualizarResumen(filtradas);

}

buscar.addEventListener(
    'input',
    aplicarFiltros
);

filtro.addEventListener(
    'change',
    aplicarFiltros
);


/* =========================================
   🕒 FORMATEAR FECHA
========================================= */

function formatearFecha(fecha){

    return new Date(fecha)
    .toLocaleString('es-CO');

}


/* =========================================
   🚀 INIT
========================================= */

cargarActividades();