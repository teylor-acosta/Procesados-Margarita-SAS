// ==============================================
// MIS CAPACITACIONES
// ==============================================

let capacitaciones = [];
let capacitacionesFiltradas = [];

document.addEventListener("DOMContentLoaded", () => {

    cargarCapacitaciones();

    configurarEventos();

});

// ==============================================
// CARGAR CAPACITACIONES
// ==============================================

async function cargarCapacitaciones(){

    try{

        const respuesta = await fetch("/api/mis-capacitaciones");

        const datos = await respuesta.json();

        if(!datos.success){

            return;

        }

        console.log("CAPACITACIONES:", datos.capacitaciones);

// Guardar capacitaciones
capacitaciones = datos.capacitaciones || [];

capacitacionesFiltradas = [...capacitaciones];

// Actualizar resumen
actualizarResumen(capacitaciones);

// Mostrar capacitaciones
renderizarCapacitaciones(capacitacionesFiltradas);
    }

    catch(error){

        console.error(error);

    }

}

// ==============================================
// CONFIGURAR EVENTOS
// ==============================================

function configurarEventos(){

    // ==========================================
    // BOTÓN ACTUALIZAR
    // ==========================================

    const btnActualizar =
        document.getElementById("btnActualizar");

    btnActualizar?.addEventListener(
        "click",
        cargarCapacitaciones
    );


    // ==========================================
    // BUSCADOR
    // ==========================================

    const buscador =
        document.getElementById("buscarCapacitacion");

    buscador?.addEventListener(
        "input",
        aplicarFiltros
    );


    // ==========================================
    // FILTRO DE ESTADO
    // ==========================================

    const filtroEstado =
        document.getElementById("filtroEstado");

    filtroEstado?.addEventListener(
        "change",
        aplicarFiltros
    );

}

// ==============================================
// APLICAR FILTROS
// ==============================================

function aplicarFiltros(){

    const buscador =
        document.getElementById("buscarCapacitacion");

    const filtroEstado =
        document.getElementById("filtroEstado");


    const texto =
        (buscador?.value || "")
            .trim()
            .toLowerCase();


    const estado =
        filtroEstado?.value || "";


    capacitacionesFiltradas =
        capacitaciones.filter(capacitacion => {

            const nombre =
                String(
                    capacitacion.nombre || ""
                ).toLowerCase();


            const descripcion =
                String(
                    capacitacion.descripcion || ""
                ).toLowerCase();


            // Buscar por nombre o descripción
            const coincideTexto =
                !texto ||
                nombre.includes(texto) ||
                descripcion.includes(texto);


            // Filtrar por estado
            const coincideEstado =
                !estado ||
                capacitacion.estado === estado;


            return (
                coincideTexto &&
                coincideEstado
            );

        });


    renderizarCapacitaciones(
        capacitacionesFiltradas
    );

}

function actualizarResumen(capacitaciones){

    const total = capacitaciones.length;

    const progreso = capacitaciones.filter(c =>

        c.estado === "EN_PROCESO"

    ).length;

    const finalizadas = capacitaciones.filter(c =>

        c.estado === "FINALIZADA"

    ).length;

    document.getElementById("totalCapacitaciones").textContent = total;

    document.getElementById("capacitacionesProgreso").textContent = progreso;

    document.getElementById("capacitacionesFinalizadas").textContent = finalizadas;

    document.getElementById("certificadosGenerados").textContent = finalizadas;

}

function renderizarCapacitaciones(capacitaciones){

    const contenedor =
        document.getElementById("contenedorCapacitaciones");

    const estadoVacio =
        document.getElementById("estadoVacio");

    contenedor.innerHTML = "";

    if(capacitaciones.length === 0){

        estadoVacio.style.display = "flex";

        return;

    }

    estadoVacio.style.display = "none";

    capacitaciones.forEach(capacitacion=>{

        const tarjeta = crearTarjeta(capacitacion);

        contenedor.appendChild(tarjeta);

    });

}

function crearTarjeta(capacitacion){

    const card = document.createElement("div");

    card.className = "card-capacitacion";

    // ==========================================
    // DETERMINAR SI TIENE CERTIFICADO
    // ==========================================

    const tieneCertificado =
        capacitacion.certificado_id !== null &&
        capacitacion.certificado_id !== undefined;


    // ==========================================
    // BOTÓN SEGÚN ESTADO
    // ==========================================

    let botonAccion = "";


    // ==========================================
    // CAPACITACIÓN FINALIZADA
    // ==========================================

    if(tieneCertificado){

        botonAccion = `

            <div class="estado-certificado">

                <i class="fas fa-circle-check"></i>

                Capacitación finalizada

            </div>

            <button
                class="btn-certificado"
                onclick="verCertificado(${capacitacion.certificado_id})"
            >

                <i class="fas fa-certificate"></i>

                Ver certificado

            </button>

        `;

    }

    // ==========================================
    // CAPACITACIÓN PENDIENTE / EN PROCESO
    // ==========================================

    else {

        botonAccion = `

            <button
                class="btn-continuar"
                onclick="abrirCapacitacion(${capacitacion.id})"
            >

                <i class="fas fa-play"></i>

                ${
                    capacitacion.estado === "PENDIENTE"
                        ? "Iniciar capacitación"
                        : "Continuar capacitación"
                }

            </button>

        `;

    }


    // ==========================================
    // CREAR TARJETA
    // ==========================================

    card.innerHTML = `

        <div class="imagen-capacitacion">

            <img
                src="${
                    capacitacion.imagen ||
                    '/img/capacitacion-default.png'
                }"
                alt="${capacitacion.nombre}"
            >

            ${
                capacitacion.obligatorio
                ?

                `<span class="badge-obligatoria">
                    Obligatoria
                </span>`

                :

                ""
            }

        </div>


        <div class="contenido-capacitacion">

            <h3>

                ${capacitacion.nombre}

            </h3>


            <p>

                ${capacitacion.descripcion || ""}

            </p>


            ${botonAccion}

        </div>

    `;


    return card;

}

// ==============================================
// VER CERTIFICADO
// ==============================================

function verCertificado(certificadoId){

    console.log(
        "ABRIENDO CERTIFICADO:",
        certificadoId
    );

    window.location.href =
        `/certificado-capacitacion/${certificadoId}`;

}


// ==============================================
// ABRIR / INICIAR CAPACITACIÓN
// ==============================================

async function abrirCapacitacion(id){

    console.log(
        "ASIGNACIÓN SELECCIONADA:",
        id
    );

    try {

        const respuesta = await fetch(
            "/api/iniciar-capacitacion",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    asignacionID: id

                })

            }
        );


        const datos = await respuesta.json();


        if (!datos.success) {

            console.error(
                "ERROR:",
                datos.message
            );

            alert(
                datos.message ||
                "No se pudo iniciar la capacitación."
            );

            return;

        }


        console.log(
            "CAPACITACIÓN INICIADA:",
            datos
        );


        // ==========================================
        // ABRIR LA CAPACITACIÓN
        // ==========================================

        if (!datos.cursoAsignadoID) {

            console.error(
                "No se recibió cursoAsignadoID."
            );

            return;

        }


        window.location.href =
            `/capacitacion/${datos.cursoAsignadoID}`;


    }

    catch(error){

        console.error(
            "ERROR INICIANDO CAPACITACIÓN:",
            error
        );

        alert(
            "Ocurrió un error al iniciar la capacitación."
        );

    }

}