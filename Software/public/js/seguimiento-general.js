// =====================================================
// SEGUIMIENTO GENERAL
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    cargarResumen();

    cargarEmpleados();

    configurarTabs();

});


// =====================================================
// RESUMEN
// =====================================================

async function cargarResumen() {

    try {

        const respuesta = await fetch(
            "/api/seguimiento-general/resumen"
        );

        const data = await respuesta.json();

        if (!data.success) return;

        document.getElementById("totalEmpleados").textContent =
            data.resumen.empleados;

        document.getElementById("totalAsignaciones").textContent =
            data.resumen.asignaciones;

        document.getElementById("totalProceso").textContent =
            data.resumen.proceso;

        document.getElementById("totalFinalizadas").textContent =
            data.resumen.finalizadas;

    } catch (error) {

        console.error(error);

    }

}
// =====================================================
// EMPLEADOS
// =====================================================

async function cargarEmpleados() {

    try {

        const respuesta = await fetch(
            "/api/seguimiento-general/empleados"
        );

        const data = await respuesta.json();

        if (!data.success) return;

        const lista = document.getElementById("listaEmpleados");

        lista.innerHTML = "";

        document.getElementById("cantidadEmpleados").textContent =
            `${data.empleados.length} empleados`;

        // =========================================
        // CREAR TARJETAS
        // =========================================

        data.empleados.forEach(empleado => {

            lista.innerHTML += `

                <div
                    class="empleado-card"
                    data-id="${empleado.id}">

                    <div class="empleado-avatar">

                        <i class="fas fa-user"></i>

                    </div>

                    <div class="empleado-info">

                        <h4>${empleado.nombre}</h4>

                        <small>${empleado.cargo}</small>

                        <span>${empleado.area}</span>

                    </div>

                </div>

            `;

        });

        // =========================================
        // EVENTO CLICK
        // =========================================

        document
            .querySelectorAll(".empleado-card")
            .forEach(card => {

                card.addEventListener("click", () => {

                    document
                        .querySelectorAll(".empleado-card")
                        .forEach(c => c.classList.remove("active"));

                    card.classList.add("active");

                    cargarDetalleEmpleado(card.dataset.id);

                });

            });

    } catch (error) {

        console.error(error);

    }

}

// =====================================================
// CARGAR DETALLE EMPLEADO
// =====================================================

async function cargarDetalleEmpleado(id) {

    try {

        const respuesta = await fetch(
            `/api/seguimiento-general/empleado/${id}`
        );

        const data = await respuesta.json();

        if (!data.success) return;

        document
            .getElementById("estadoInicial")
            .classList.add("d-none");

        const detalle = document.getElementById("detalleEmpleado");

detalle.classList.remove("d-none");

const panelInduccion =
    document.getElementById("panelInduccion");

const panelCapacitaciones =
    document.getElementById("panelCapacitaciones");

        panelInduccion.innerHTML = `

    <!-- ===================================== -->
    <!-- TARJETA EMPLEADO -->
    <!-- ===================================== -->

    <div class="panel-detalle-card">

    <div class="empleado-detalle-card">

        <div class="empleado-icono">

            <i class="fas fa-user-circle"></i>

        </div>

        <div class="empleado-datos">

            <h2>${data.empleado.nombre}</h2>

            <span class="codigo-empleado">

                ${data.empleado.codigo}

            </span>

            <div class="empleado-extra">

                <span>

                    <i class="fas fa-briefcase"></i>

                    ${data.empleado.cargo}

                </span>

                <span>

                    <i class="fas fa-building"></i>

                    ${data.empleado.area}

                </span>

                <span>

                    <i class="fas fa-location-dot"></i>

                    ${data.empleado.sede}

                </span>

            </div>

        </div>

    </div>

    <!-- ===================================== -->
    <!-- RESUMEN -->
    <!-- ===================================== -->

    <div class="resumen-empleado">

        <div class="mini-card">

            <i class="fas fa-user-graduate"></i>

            <h4>Inducción</h4>

            <strong>

                ${
                    data.induccion?.aprobado
                    ? "Completada"
                    : "Pendiente"
                }

            </strong>

            <small>

                Nota:
                ${data.induccion?.nota ?? "-"}

            </small>

        </div>

        <div class="mini-card">

            <i class="fas fa-book-open"></i>

            <h4>Capacitaciones</h4>

            <strong>

                ${data.capacitaciones.length}

            </strong>

            <small>

                Asignadas

            </small>

        </div>

        <div class="mini-card">

            <i class="fas fa-award"></i>

            <h4>Certificados</h4>

            <strong>

                0

            </strong>

            <small>

                Disponibles

            </small>

        </div>

    </div>

    <!-- ===================================== -->
    <!-- BOTONES -->
    <!-- ===================================== -->

    <div class="acciones-empleado">

        <button
            class="btn btn-warning"
            id="btnReasignarInduccion">

            <i class="fas fa-rotate-right"></i>

            Reasignar inducción

        </button>

        <button
            class="btn btn-success"
            id="btnAsignarCapacitacion">

            <i class="fas fa-plus"></i>

            Asignar capacitación

        </button>

    </div>

    <!-- ===================================== -->
    <!-- CAPACITACIONES -->
    <!-- ===================================== -->

    <div class="seccion-panel">

        <h3>

            <i class="fas fa-book-open"></i>

            Capacitaciones asignadas

        </h3>

        <div id="listaCapacitacionesEmpleado">

        </div>

    </div>

    <!-- ===================================== -->
    <!-- HISTORIAL -->
    <!-- ===================================== -->

    <div class="seccion-panel">

        <h3>

            <i class="fas fa-clock-rotate-left"></i>

            Historial

        </h3>

        <div class="historial-vacio">

            El historial aparecerá aquí.

        </div>

    </div>

    </div>

`;

        // =========================================
// CARGAR CAPACITACIONES
// =========================================

const listaCapacitaciones = document.getElementById(
    "listaCapacitacionesEmpleado"
);

if (data.capacitaciones.length === 0) {

    listaCapacitaciones.innerHTML = `

        <div class="alert alert-light mt-3">

            <i class="fas fa-circle-info"></i>

            Este colaborador aún no tiene capacitaciones asignadas.

        </div>

    `;

} else {

    data.capacitaciones.forEach(cap => {

        listaCapacitaciones.innerHTML += `

            <div class="capacitacion-item">

                <div>

                    <h5>${cap.nombre}</h5>

                    <small>

                        Estado:
                        <strong>${cap.estado}</strong>

                    </small>

                </div>

                <button
                    class="btn btn-outline-success btn-sm">

                    Reasignar

                </button>

            </div>

        `;

    });

}

    // =========================================
// PANEL CAPACITACIONES
// =========================================

panelCapacitaciones.innerHTML = `

    <div class="panel-detalle-card">

        <h2>

            <i class="fas fa-book-open"></i>

            Seguimiento de Capacitaciones

        </h2>

        <p>

            Aquí aparecerán las capacitaciones asignadas al colaborador.

        </p>

    </div>

`;

    } catch (error) {

        console.error(error);

    }

}

// =====================================================
// TABS
// =====================================================

function configurarTabs() {

    const btnInduccion =
        document.getElementById("tabInduccion");

    const btnCapacitaciones =
        document.getElementById("tabCapacitaciones");

    btnInduccion.addEventListener("click", () => {

        btnInduccion.classList.add("active");

        btnCapacitaciones.classList.remove("active");

        document
            .getElementById("panelInduccion")
            ?.classList.remove("d-none");

        document
            .getElementById("panelCapacitaciones")
            ?.classList.add("d-none");

    });

    btnCapacitaciones.addEventListener("click", () => {

        btnCapacitaciones.classList.add("active");

        btnInduccion.classList.remove("active");

        document
            .getElementById("panelCapacitaciones")
            ?.classList.remove("d-none");

        document
            .getElementById("panelInduccion")
            ?.classList.add("d-none");

    });

}