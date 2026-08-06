// ==============================================
// MIS CAPACITACIONES
// ==============================================

document.addEventListener("DOMContentLoaded", () => {

    cargarCapacitaciones();

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

        console.log("RUTA:", datos.capacitaciones);

        actualizarResumen(datos.capacitaciones);

    }

    catch(error){

        console.error(error);

    }

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

    card.innerHTML = `

        <div class="imagen-capacitacion">

            <img
                src="${
                    capacitacion.imagen ||
                    '/img/capacitacion-default.png'
                }">

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

            <button class="btn-continuar">

                <i class="fas fa-play"></i>

                Continuar capacitación

            </button>

        </div>

    `;

    return card;

}