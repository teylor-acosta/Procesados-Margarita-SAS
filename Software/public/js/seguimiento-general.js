// =====================================================
// VARIABLES DE EMPLEADOS
// =====================================================

let empleadosSeguimiento = [];
let empleadosFiltrados = [];


// =====================================================
// SEGUIMIENTO GENERAL
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    cargarResumen();
    cargarEmpleados();
    configurarTabs();
    configurarModalAsignacion();
    configurarFiltrosEmpleados();

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

        // Guardar empleados para búsqueda y filtros
empleadosSeguimiento = data.empleados || [];
empleadosFiltrados = [...empleadosSeguimiento];

// Llenar los filtros con los datos de los empleados
llenarFiltrosEmpleados();

        const lista = document.getElementById("listaEmpleados");

        lista.innerHTML = "";

        document.getElementById("cantidadEmpleados").textContent =
            `${data.empleados.length} empleados`;

        // =========================================
        // CREAR TARJETAS
        // =========================================

       empleadosFiltrados.forEach(empleado => {

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
// EVENTO CLICK - SELECCIONAR / DESELECCIONAR
// =========================================

document
    .querySelectorAll(".empleado-card")
    .forEach(card => {

        card.addEventListener("click", () => {

            // =====================================
            // SI YA ESTÁ SELECCIONADO
            // =====================================
            if (card.classList.contains("active")) {

                // Quitar selección
                card.classList.remove("active");

                // Ocultar panel derecho
                const detalleEmpleado =
                    document.getElementById("detalleEmpleado");

                const estadoInicial =
                    document.getElementById("estadoInicial");

                detalleEmpleado?.classList.add("d-none");
                estadoInicial?.classList.remove("d-none");

                return;
            }

            // =====================================
            // SELECCIONAR NUEVO COLABORADOR
            // =====================================

            // Quitar selección de los demás
            document
                .querySelectorAll(".empleado-card")
                .forEach(c => {
                    c.classList.remove("active");
                });

            // Seleccionar este colaborador
            card.classList.add("active");

            // Cargar información
            cargarDetalleEmpleado(card.dataset.id);

        });

    });

    } catch (error) {

        console.error(error);

    }

}

// =====================================================
// CONFIGURAR BÚSQUEDA Y FILTROS DE COLABORADORES
// =====================================================

function configurarFiltrosEmpleados() {

    const buscador = document.getElementById("buscarEmpleado");
    const filtroSede = document.getElementById("filtroSede");
    const filtroArea = document.getElementById("filtroArea");
    const filtroCargo = document.getElementById("filtroCargo");

    // Buscar mientras se escribe
    buscador?.addEventListener("input", aplicarFiltrosEmpleados);

    // Filtros
    filtroSede?.addEventListener("change", aplicarFiltrosEmpleados);
    filtroArea?.addEventListener("change", aplicarFiltrosEmpleados);
    filtroCargo?.addEventListener("change", aplicarFiltrosEmpleados);
}


// =====================================================
// APLICAR FILTROS
// =====================================================

function aplicarFiltrosEmpleados() {

    const buscador = document.getElementById("buscarEmpleado");
    const filtroSede = document.getElementById("filtroSede");
    const filtroArea = document.getElementById("filtroArea");
    const filtroCargo = document.getElementById("filtroCargo");

    const texto = (buscador?.value || "").trim().toLowerCase();
    const sede = filtroSede?.value || "";
    const area = filtroArea?.value || "";
    const cargo = filtroCargo?.value || "";

    empleadosFiltrados = empleadosSeguimiento.filter(empleado => {

        const nombre = String(empleado.nombre || "").toLowerCase();
        const codigo = String(empleado.codigo || "").toLowerCase();
        const documento = String(empleado.numero_documento || "").toLowerCase();
        const cargoEmpleado = String(empleado.cargo || "").toLowerCase();
        const areaEmpleado = String(empleado.area || "").toLowerCase();
        const sedeEmpleado = String(empleado.sede || "").toLowerCase();

        // Búsqueda general
        const coincideBusqueda =
            !texto ||
            nombre.includes(texto) ||
            codigo.includes(texto) ||
            documento.includes(texto) ||
            cargoEmpleado.includes(texto) ||
            areaEmpleado.includes(texto) ||
            sedeEmpleado.includes(texto);

        // Filtros
        const coincideSede =
            !sede || empleado.sede === sede;

        const coincideArea =
            !area || empleado.area === area;

        const coincideCargo =
            !cargo || empleado.cargo === cargo;

        return (
            coincideBusqueda &&
            coincideSede &&
            coincideArea &&
            coincideCargo
        );
    });

    mostrarEmpleadosFiltrados();
}


// =====================================================
// MOSTRAR EMPLEADOS FILTRADOS
// =====================================================

function mostrarEmpleadosFiltrados() {

    const lista = document.getElementById("listaEmpleados");

    if (!lista) return;

    lista.innerHTML = "";

    if (empleadosFiltrados.length === 0) {

        lista.innerHTML = `
            <div class="sin-resultados-empleados">
                <i class="fas fa-user-slash"></i>

                <h4>No se encontraron colaboradores</h4>

                <p>
                    Intenta cambiar los filtros
                    o realizar otra búsqueda.
                </p>
            </div>
        `;

        return;
    }

    empleadosFiltrados.forEach(empleado => {

        const tarjeta = document.createElement("div");

        tarjeta.className = "empleado-card";

        tarjeta.dataset.id = empleado.id;

        tarjeta.innerHTML = `
            <div class="empleado-avatar">
                <i class="fas fa-user"></i>
            </div>

            <div class="empleado-info">

                <h4>
                    ${empleado.nombre || "Sin nombre"}
                </h4>

                <small>
                    ${empleado.cargo || "Sin cargo"}
                </small>

                <span>
                    ${empleado.area || "Sin área"}
                </span>

            </div>
        `;

        tarjeta.addEventListener("click", () => {

            document
                .querySelectorAll(".empleado-card")
                .forEach(card =>
                    card.classList.remove("active")
                );

            tarjeta.classList.add("active");

            cargarDetalleEmpleado(empleado.id);
        });

        lista.appendChild(tarjeta);

    });
}

// =====================================================
// LLENAR FILTROS DE COLABORADORES
// =====================================================

function llenarFiltrosEmpleados() {

    const filtroSede =
        document.getElementById("filtroSede");

    const filtroArea =
        document.getElementById("filtroArea");

    const filtroCargo =
        document.getElementById("filtroCargo");


    // =================================================
    // SEDE
    // =================================================

    if (filtroSede) {

        const sedes = [
            ...new Set(
                empleadosSeguimiento
                    .map(empleado => empleado.sede)
                    .filter(sede => sede)
            )
        ].sort((a, b) =>
            a.localeCompare(b, "es")
        );

        filtroSede.innerHTML = `
            <option value="">
                Todas las sedes
            </option>
        `;

        sedes.forEach(sede => {

            const opcion =
                document.createElement("option");

            opcion.value = sede;
            opcion.textContent = sede;

            filtroSede.appendChild(opcion);

        });
    }


    // =================================================
    // ÁREA
    // =================================================

    if (filtroArea) {

        const areas = [
            ...new Set(
                empleadosSeguimiento
                    .map(empleado => empleado.area)
                    .filter(area => area)
            )
        ].sort((a, b) =>
            a.localeCompare(b, "es")
        );

        filtroArea.innerHTML = `
            <option value="">
                Todas las áreas
            </option>
        `;

        areas.forEach(area => {

            const opcion =
                document.createElement("option");

            opcion.value = area;
            opcion.textContent = area;

            filtroArea.appendChild(opcion);

        });
    }


    // =================================================
    // CARGO
    // =================================================

    if (filtroCargo) {

        const cargos = [
            ...new Set(
                empleadosSeguimiento
                    .map(empleado => empleado.cargo)
                    .filter(cargo => cargo)
            )
        ].sort((a, b) =>
            a.localeCompare(b, "es")
        );

        filtroCargo.innerHTML = `
            <option value="">
                Todos los cargos
            </option>
        `;

        cargos.forEach(cargo => {

            const opcion =
                document.createElement("option");

            opcion.value = cargo;
            opcion.textContent = cargo;

            filtroCargo.appendChild(opcion);

        });
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

        <!-- Avatar -->
        <div class="empleado-icono">
            <i class="fas fa-user"></i>
        </div>

        <!-- Información principal -->
        <div class="empleado-datos">

            <div class="empleado-titulo">
                <div>
                    <h2>${data.empleado.nombre}</h2>

                    <span class="codigo-empleado">
                        <i class="fas fa-id-card"></i>
                        ${data.empleado.codigo}
                    </span>
                </div>

                <span class="estado-empleado activo">
                    <span class="estado-punto"></span>
                    Activo
                </span>
            </div>

            <div class="empleado-extra">

                <span>
                    <i class="fas fa-briefcase"></i>
                    <strong>Cargo:</strong>
                    ${data.empleado.cargo}
                </span>

                <span>
                    <i class="fas fa-building"></i>
                    <strong>Área:</strong>
                    ${data.empleado.area}
                </span>

                <span>
                    <i class="fas fa-location-dot"></i>
                    <strong>Sede:</strong>
                    ${data.empleado.sede}
                </span>

            </div>

        </div>

    </div>

    <!-- ===================================== -->
    <!-- RESUMEN -->
    <!-- ===================================== -->

    <div class="resumen-empleado">

    <!-- INDUCCIÓN -->
    <div class="mini-card mini-card-induccion">

        <div class="mini-card-icon">
            <i class="fas fa-user-graduate"></i>
        </div>

        <div class="mini-card-contenido">

            <span class="mini-card-label">
                Inducción
            </span>

            <strong>
                ${
                    data.induccion?.aprobado
                    ? "Completada"
                    : "Pendiente"
                }
            </strong>

            <small>
                <i class="fas fa-star"></i>
                Nota: ${data.induccion?.nota ?? "-"}
            </small>

        </div>

    </div>


    <!-- CAPACITACIONES -->
    <div class="mini-card mini-card-capacitaciones">

        <div class="mini-card-icon">
            <i class="fas fa-book-open"></i>
        </div>

        <div class="mini-card-contenido">

            <span class="mini-card-label">
                Capacitaciones
            </span>

            <strong>
                ${data.capacitaciones.length}
            </strong>

            <small>
                capacitaciones asignadas
            </small>

        </div>

    </div>


    <!-- CERTIFICADOS -->
    <div class="mini-card mini-card-certificados">

        <div class="mini-card-icon">
            <i class="fas fa-award"></i>
        </div>

        <div class="mini-card-contenido">

            <span class="mini-card-label">
                Certificados
            </span>

            <strong>
                0
            </strong>

            <small>
                certificados disponibles
            </small>

        </div>

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

    <div class="seccion-panel historial-panel">

    <div class="seccion-panel-header">

        <div>
            <h3>
                <i class="fas fa-clock-rotate-left"></i>
                Historial
            </h3>

            <span class="historial-subtitulo">
                Actividad reciente del colaborador
            </span>
        </div>

    </div>

    <div class="historial-lista">

        <div class="historial-vacio">

            <div class="historial-vacio-icono">
                <i class="fas fa-clock"></i>
            </div>

            <div>
                <strong>
                    Sin actividad registrada
                </strong>

                <p>
                    Los movimientos y actividades del colaborador
                    aparecerán aquí.
                </p>
            </div>

        </div>

    </div>

</div>

    </div>

`;

try {

    const respuestaCapacitaciones = await fetch(
        `/api/seguimiento-general/capacitaciones/${id}`
    );

    const dataCapacitaciones =
        await respuestaCapacitaciones.json();

    if (!dataCapacitaciones.success) {
        throw new Error(
            dataCapacitaciones.message ||
            "No se pudo cargar el seguimiento."
        );
    }

    const capacitaciones =
        dataCapacitaciones.capacitaciones || [];

       const capacitacionesActivas =
    capacitaciones.filter(cap => cap.estado !== "FINALIZADA");

const capacitacionesFinalizadas =
    capacitaciones.filter(cap => cap.estado === "FINALIZADA");

    // =========================================
    // SIN CAPACITACIONES
    // =========================================

    if (
    capacitacionesActivas.length === 0 &&
    capacitacionesFinalizadas.length === 0
) {

        panelCapacitaciones.innerHTML = `
            <div class="panel-detalle-card">

                <h2>
                    <i class="fas fa-book-open"></i>
                    Seguimiento de Capacitaciones
                </h2>

                <div class="alert alert-light mt-4">
                    <i class="fas fa-circle-info"></i>
                    Este colaborador aún no tiene capacitaciones asignadas.
                </div>

            </div>
        `;

    } else {

        // =========================================
        // GENERAR CAPACITACIONES
        // =========================================

        let htmlCapacitaciones = "";

        capacitacionesActivas.forEach((cap, index) => {

    const progreso = Number(cap.progreso || 0);
    const completados = Number(cap.capitulos_completados || 0);
    const totales = Number(cap.capitulos_totales || 0);

    let estadoTexto = "Pendiente";
    let estadoClase = "pendiente";
    let estadoIcono = "fa-clock";

    if (cap.estado === "EN_PROCESO") {
        estadoTexto = "En proceso";
        estadoClase = "proceso";
        estadoIcono = "fa-spinner";
    }

    if (cap.estado === "FINALIZADA") {
        estadoTexto = "Finalizada";
        estadoClase = "finalizada";
        estadoIcono = "fa-check-circle";
    }

    htmlCapacitaciones += `

        <div class="capacitacion-expandible">

            <!-- TARJETA COMPACTA -->
            <div
                class="capacitacion-resumen"
                onclick="toggleDetalleCapacitacion(${index})"
            >

                <div class="capacitacion-icono">
                    <i class="fas fa-book-open"></i>
                </div>

                <div class="capacitacion-info">

                    <strong>
                        ${cap.nombre}
                    </strong>

                    <small>
                        ${cap.descripcion || "Sin descripción"}
                    </small>

                </div>

                <div class="capacitacion-progreso">

                    <span>
                        ${progreso}%
                    </span>

                    <div class="mini-progress">

                        <div
                            style="width:${progreso}%">
                        </div>

                    </div>

                </div>

                <div class="capacitacion-estado ${estadoClase}">

                    <i class="fas ${estadoIcono}"></i>

                    ${estadoTexto}

                </div>

                <div class="capacitacion-flecha">

                    <i
                        id="flecha-cap-${index}"
                        class="fas fa-chevron-down">
                    </i>

                </div>

            </div>


            <!-- INFORMACIÓN EXPANDIBLE -->

            <div
                id="detalle-cap-${index}"
                class="capacitacion-detalle"
            >

                <div class="capacitacion-detalle-grid">

                    <div>

                        <small>
                            <i class="fas fa-layer-group"></i>
                            Capítulos
                        </small>

                        <strong>
                            ${completados} / ${totales}
                        </strong>

                    </div>


                    <div>

                        <small>
                            <i class="fas fa-calendar-check"></i>
                            Asignada
                        </small>

                        <strong>

                            ${
                                cap.fecha_asignacion
                                    ? new Date(
                                        cap.fecha_asignacion
                                      ).toLocaleDateString("es-CO")
                                    : "-"
                            }

                        </strong>

                    </div>


                    <div>

                        <small>
                            <i class="fas fa-calendar-xmark"></i>
                            Fecha límite
                        </small>

                        <strong>

                            ${
                                cap.fecha_limite
                                    ? new Date(
                                        cap.fecha_limite
                                      ).toLocaleDateString("es-CO")
                                    : "Sin límite"
                            }

                        </strong>

                    </div>

                </div>


                <div class="detalle-progreso">

                    <div class="d-flex justify-content-between">

                        <span>
                            Progreso de la capacitación
                        </span>

                        <strong>
                            ${progreso}%
                        </strong>

                    </div>

                    <div class="progress">

                        <div
                            class="progress-bar bg-success"
                            style="width:${progreso}%">
                        </div>

                    </div>

                </div>


                ${
                    progreso === 0

                    ? `

                        <div class="detalle-mensaje pendiente-msg">

                            <i class="fas fa-circle-exclamation"></i>

                            El colaborador aún no ha iniciado esta capacitación.

                        </div>

                    `

                    : progreso < 100

                    ? `

                        <div class="detalle-mensaje proceso-msg">

                            <i class="fas fa-spinner"></i>

                            El colaborador está realizando esta capacitación.

                            Le faltan

                            <strong>
                                ${Math.max(totales - completados, 0)}
                            </strong>

                            capítulo(s).

                        </div>

                    `

                    : `

                        <div class="detalle-mensaje finalizada-msg">

                            <i class="fas fa-check-circle"></i>

                            El colaborador ha completado esta capacitación.

                        </div>

                    `
                }

            </div>

        </div>

    `;
});

// =====================================================
// CAPACITACIONES FINALIZADAS
// =====================================================

let htmlCapacitacionesFinalizadas = "";

if (capacitacionesFinalizadas.length > 0) {

    htmlCapacitacionesFinalizadas = `

        <div class="capacitaciones-finalizadas-seccion">

            <div class="finalizadas-titulo">

                <div>
                    <i class="fas fa-circle-check"></i>

                    <strong>
                        Capacitaciones finalizadas
                    </strong>

                    <span>
                        ${capacitacionesFinalizadas.length}
                    </span>
                </div>

            </div>

            <div class="lista-finalizadas">

    `;

    capacitacionesFinalizadas.forEach((cap, index) => {

        const progreso =
            Number(cap.progreso || 0);

        const completados =
            Number(cap.capitulos_completados || 0);

        const totales =
            Number(cap.capitulos_totales || 0);

        const indiceFinal =
            `final-${index}`;

        htmlCapacitacionesFinalizadas += `

            <div class="capacitacion-expandible">

                <!-- TARJETA FINALIZADA -->

                <div
                    class="capacitacion-resumen finalizada-resumen"
                    onclick="toggleDetalleCapacitacion('${indiceFinal}')"
                >

                    <div class="capacitacion-icono finalizada-icono">
                        <i class="fas fa-check"></i>
                    </div>

                    <div class="capacitacion-info">

                        <strong>
                            ${cap.nombre}
                        </strong>

                        <small>
                            ${cap.descripcion || "Sin descripción"}
                        </small>

                    </div>

                    <div class="capacitacion-progreso">

                        <span>
                            ${progreso}%
                        </span>

                        <div class="mini-progress">

                            <div
                                style="width:${progreso}%">
                            </div>

                        </div>

                    </div>

                    <div class="capacitacion-estado finalizada">

                        <i class="fas fa-check-circle"></i>

                        Finalizada

                    </div>

                    <div class="capacitacion-flecha">

                        <i class="fas fa-chevron-down"></i>

                    </div>

                </div>


                <!-- DETALLE FINALIZADA -->

                <div
                    id="detalle-cap-${indiceFinal}"
                    class="capacitacion-detalle"
                >

                    <div class="capacitacion-detalle-grid">

                        <div>

                            <small>
                                <i class="fas fa-layer-group"></i>
                                Capítulos
                            </small>

                            <strong>
                                ${completados} / ${totales}
                            </strong>

                        </div>


                        <div>

                            <small>
                                <i class="fas fa-calendar-check"></i>
                                Asignada
                            </small>

                            <strong>
                                ${
                                    cap.fecha_asignacion
                                        ? new Date(
                                            cap.fecha_asignacion
                                          ).toLocaleDateString("es-CO")
                                        : "-"
                                }
                            </strong>

                        </div>


                        <div>

                            <small>
                                <i class="fas fa-calendar-check"></i>
                                Fecha de finalización
                            </small>

                            <strong>
                                ${
                                    cap.fecha_finalizacion
                                        ? new Date(
                                            cap.fecha_finalizacion
                                          ).toLocaleDateString("es-CO")
                                        : "-"
                                }
                            </strong>

                        </div>

                    </div>


                    <div class="detalle-progreso">

                        <div class="d-flex justify-content-between">

                            <span>
                                Progreso de la capacitación
                            </span>

                            <strong>
                                ${progreso}%
                            </strong>

                        </div>

                        <div class="progress">

                            <div
                                class="progress-bar bg-success"
                                style="width:${progreso}%">
                            </div>

                        </div>

                    </div>


                    <div class="detalle-mensaje finalizada-msg">

                        <i class="fas fa-check-circle"></i>

                        El colaborador ha completado esta capacitación.

                    </div>

                </div>

            </div>

        `;

    });

    htmlCapacitacionesFinalizadas += `

            </div>

        </div>

    `;

}

// =====================================================
// EXPANDIR / CONTRAER CAPACITACIÓN
// =====================================================

function toggleDetalleCapacitacion(index) {

    const detalle = document.getElementById(`detalle-cap-${index}`);
    const tarjeta = detalle?.previousElementSibling;

    if (!detalle || !tarjeta) {
        console.error("No se encontró la capacitación:", index);
        return;
    }

    const estaAbierta = detalle.classList.contains("mostrar");

    // Cerrar todas las capacitaciones
    document
        .querySelectorAll(".capacitacion-detalle")
        .forEach(det => {
            det.classList.remove("mostrar");
        });

    document
        .querySelectorAll(".capacitacion-resumen")
        .forEach(card => {
            card.classList.remove("expandida");
        });

    document
        .querySelectorAll(".capacitacion-flecha i")
        .forEach(flecha => {
            flecha.classList.remove("rotada");
        });

    // Si estaba cerrada, abrirla
    if (!estaAbierta) {

        detalle.classList.add("mostrar");
        tarjeta.classList.add("expandida");

        const flecha =
            tarjeta.querySelector(".capacitacion-flecha i");

        if (flecha) {
            flecha.classList.add("rotada");
        }
    }
}


// =========================================
// MOSTRAR RESULTADO
// =========================================

panelCapacitaciones.innerHTML = `

    <div class="panel-detalle-card">

        <!-- ENCABEZADO -->

        <div class="d-flex justify-content-between align-items-center mb-3">

            <div>

                <h2 class="mb-1">
                    <i class="fas fa-book-open"></i>
                    Seguimiento de Capacitaciones
                </h2>

                <p class="text-muted mb-0">
                    Progreso y estado de las capacitaciones asignadas.
                </p>

            </div>

            <div class="text-end">

                <small class="text-muted d-block">
                    Capacitaciones asignadas
                </small>

                <strong class="fs-4 text-success">
                    ${capacitacionesActivas.length}
                </strong>

            </div>

        </div>


        <!-- LISTA DE CAPACITACIONES -->

        <div class="lista-seguimiento-capacitaciones">

    ${htmlCapacitaciones}

</div>

${htmlCapacitacionesFinalizadas}

    </div>

`;
    }

} catch (error) {

    console.error(
        "Error cargando capacitaciones:",
        error
    );

    panelCapacitaciones.innerHTML = `

        <div class="panel-detalle-card">

            <div class="alert alert-danger">

                <i class="fas fa-triangle-exclamation"></i>

                No se pudo cargar el seguimiento de las capacitaciones.

            </div>

        </div>

    `;
}

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

// =====================================================
// MODAL DE ASIGNACIÓN
// =====================================================

let empleadoSeleccionado = null;
let capacitacionesModal = [];
let empleadosModal = [];

document.addEventListener("DOMContentLoaded", () => {

    configurarModalAsignacion();

});


// =====================================================
// CONFIGURAR MODAL
// =====================================================

function configurarModalAsignacion() {

    // -----------------------------------------
    // BOTÓN ASIGNAR CAPACITACIÓN
    // -----------------------------------------

    document.addEventListener("click", (e) => {

        if (e.target.closest("#btnAsignarCapacitacion")) {

            abrirModalAsignacion();

        }

    });

    document.addEventListener("click", (e) => {
    if (e.target.closest("#btnAsignacionMasiva")) {
        abrirModalAsignacion();
    }
});


    // -----------------------------------------
    // MODO INDIVIDUAL
    // -----------------------------------------

    document
        .getElementById("modoIndividual")
        ?.addEventListener("click", () => {

            cambiarModoAsignacion("individual");

        });


    // -----------------------------------------
    // MODO MASIVO
    // -----------------------------------------

    document
        .getElementById("modoMasivo")
        ?.addEventListener("click", () => {

            cambiarModoAsignacion("masivo");

        });


    // -----------------------------------------
    // GUARDAR
    // -----------------------------------------

    document
        .getElementById("btnGuardarAsignacion")
        ?.addEventListener("click", guardarAsignacion);

}


// =====================================================
// ABRIR MODAL
// =====================================================

async function abrirModalAsignacion() {

    const modalElement =
        document.getElementById("modalAsignarCapacitacion");

    if (!modalElement) return;

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    // -----------------------------------------
    // EMPLEADO ACTUAL
    // -----------------------------------------

    const empleadoCard =
        document.querySelector(".empleado-card.active");

    if (empleadoCard) {

        empleadoSeleccionado =
            empleadoCard.dataset.id;

    }

    // -----------------------------------------
    // CARGAR CAPACITACIONES
    // -----------------------------------------

    await cargarCapacitacionesModal();

    // -----------------------------------------
    // CARGAR EMPLEADOS
    // -----------------------------------------

    await cargarEmpleadosModal();

    // -----------------------------------------
    // CONSTRUIR SELECT DE EMPLEADOS
    // -----------------------------------------

    construirSelectEmpleado();

    // -----------------------------------------
    // INICIAR EN INDIVIDUAL
    // -----------------------------------------

    cambiarModoAsignacion("individual");

    modal.show();
}


// =====================================================
// CARGAR CAPACITACIONES DEL MODAL
// =====================================================

async function cargarCapacitacionesModal() {

    try {

        const respuesta =
            await fetch("/api/cursos");

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );

        }

        const data =
            await respuesta.json();

        if (!data.success) {

            console.error(
                "No se pudieron cargar las capacitaciones."
            );

            capacitacionesModal = [];

             construirListaCapacitacionesIndividual();

            return;
        }

        capacitacionesModal =
            data.cursos || [];

            construirListaCapacitacionesIndividual();

    } catch (error) {

        console.error(
            "Error cargando capacitaciones:",
            error
        );

        capacitacionesModal = [];

        construirListaCapacitacionesIndividual();

    }
}

// =====================================================
// CAMBIAR MODO
// =====================================================

function cambiarModoAsignacion(modo) {

    const btnIndividual =
        document.getElementById("modoIndividual");

    const btnMasivo =
        document.getElementById("modoMasivo");

    const individual =
        document.getElementById("contenidoIndividual");

    const masivo =
        document.getElementById("contenidoMasivo");


    // =========================================
    // INDIVIDUAL
    // =========================================

    if (modo === "individual") {

        btnIndividual?.classList.add("active");
        btnMasivo?.classList.remove("active");

        individual?.classList.remove("d-none");
        masivo?.classList.add("d-none");

        // NO llamar construirAsignacionIndividual()
        // porque no existe en la versión actual.

        return;
    }


    // =========================================
    // MASIVO
    // =========================================

    if (modo === "masivo") {

        btnMasivo?.classList.add("active");
        btnIndividual?.classList.remove("active");

        individual?.classList.add("d-none");
        masivo?.classList.remove("d-none");

        construirAsignacionMasiva();

    }

}
// =====================================================
// CAPACITACIONES INDIVIDUAL
// =====================================================

function construirListaCapacitacionesIndividual() {

    const contenedor =
        document.querySelector(
            ".contenedor-capacitaciones-modal"
        );

    if (!contenedor) return;

    if (capacitacionesModal.length === 0) {

        contenedor.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-circle-info"></i>
                No hay capacitaciones activas disponibles.
            </div>
        `;

        return;
    }

    contenedor.innerHTML = `

        <div class="selector-capacitaciones-individual">

            <div class="encabezado-selector-capacitacion">

                <div>
                    <label class="titulo-selector-capacitacion">
                        Selecciona una capacitación
                    </label>

                    <p class="subtitulo-selector-capacitacion">
                        Elige la capacitación que deseas asignar al colaborador.
                    </p>
                </div>

                <div class="contador-capacitacion-seleccionada">
                    <i class="fas fa-book-open"></i>
                    <span id="textoCapacitacionSeleccionada">
                        Ninguna seleccionada
                    </span>
                </div>

            </div>

            <input
                type="hidden"
                id="capacitacionSeleccionada"
                value=""
            >

            <div class="grid-capacitaciones-individual">

                ${capacitacionesModal.map(cap => `

                    <button
                        type="button"
                        class="tarjeta-capacitacion-individual"
                        data-capacitacion-id="${cap.id}"
                    >

                        <div class="icono-tarjeta-capacitacion">

                            <i class="fas fa-book-open"></i>

                        </div>

                        <div class="contenido-tarjeta-capacitacion">

                            <h4>
                                ${cap.nombre || cap.titulo}
                            </h4>

                            <span>
                                <i class="fas fa-graduation-cap"></i>
                                Capacitación disponible
                            </span>

                        </div>

                        <div class="indicador-seleccion-capacitacion">

                            <i class="fas fa-check"></i>

                        </div>

                    </button>

                `).join("")}

            </div>

        </div>
    `;


    // =====================================================
    // SELECCIONAR CAPACITACIÓN
    // =====================================================

    const tarjetas =
        contenedor.querySelectorAll(
            ".tarjeta-capacitacion-individual"
        );

    const inputSeleccion =
        document.getElementById(
            "capacitacionSeleccionada"
        );

    const textoSeleccion =
        document.getElementById(
            "textoCapacitacionSeleccionada"
        );


    tarjetas.forEach(tarjeta => {

    tarjeta.addEventListener("click", () => {

        // -----------------------------------------
        // ALTERNAR SELECCIÓN
        // -----------------------------------------

        tarjeta.classList.toggle("seleccionada");

        // -----------------------------------------
        // OBTENER TODAS LAS CAPACITACIONES
        // SELECCIONADAS
        // -----------------------------------------

        const seleccionadas =
            Array.from(tarjetas)
                .filter(item =>
                    item.classList.contains("seleccionada")
                );

        // -----------------------------------------
        // GUARDAR LOS IDS SELECCIONADOS
        // -----------------------------------------

        const idsSeleccionados =
            seleccionadas.map(item =>
                item.dataset.capacitacionId
            );

        if (inputSeleccion) {

            inputSeleccion.value =
                JSON.stringify(idsSeleccionados);

        }

        // -----------------------------------------
        // ACTUALIZAR TEXTO DEL CONTADOR
        // -----------------------------------------

        if (textoSeleccion) {

            if (seleccionadas.length === 0) {

                textoSeleccion.innerHTML = `
                    <i class="fas fa-book-open"></i>
                    Ninguna seleccionada
                `;

            } else {

                textoSeleccion.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    ${seleccionadas.length}
                    capacitación${seleccionadas.length !== 1 ? "es" : ""}
                    seleccionada${seleccionadas.length !== 1 ? "s" : ""}
                `;

            }

        }

    });

});

}


// =====================================================
// CARGAR EMPLEADOS PARA ASIGNACIÓN MASIVA
// =====================================================

async function cargarEmpleadosModal() {

    try {

        const respuesta = await fetch(
            "/api/seguimiento-general/empleados"
        );

        const data = await respuesta.json();

        if (!data.success) {

            console.error(
                "No se pudieron cargar los empleados."
            );

            return;
        }

        empleadosModal = data.empleados || [];

    } catch (error) {

        console.error(
            "Error cargando empleados:",
            error
        );

    }

}

// =====================================================
// SELECT EMPLEADO - ASIGNACIÓN INDIVIDUAL
// =====================================================

function construirSelectEmpleado() {

    const select =
        document.getElementById("empleadoSeleccionado");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Seleccionar empleado...
        </option>
    `;

    empleadosModal.forEach(empleado => {

        const option =
            document.createElement("option");

        option.value = empleado.id;

        option.textContent =
            `${empleado.nombre} — ${empleado.cargo || "Sin cargo"} — ${empleado.area || "Sin área"}`;

        select.appendChild(option);

    });

    // -----------------------------------------
    // SI YA HABÍA UN EMPLEADO SELECCIONADO
    // -----------------------------------------

    if (empleadoSeleccionado) {

        select.value =
            empleadoSeleccionado;

    }

    // -----------------------------------------
    // CUANDO CAMBIE EL EMPLEADO
    // -----------------------------------------

    select.addEventListener("change", function () {

        empleadoSeleccionado =
            this.value || null;

        console.log(
            "Empleado seleccionado:",
            empleadoSeleccionado
        );

    });

}

// =====================================================
// CONSTRUIR ASIGNACIÓN MASIVA
// =====================================================

function construirAsignacionMasiva() {

    const contenedor =
        document.getElementById("contenidoMasivo");

    if (!contenedor) return;

    contenedor.innerHTML = `

        <div class="mb-4">

            <label class="form-label fw-bold">

                <i class="fas fa-book-open"></i>

                Capacitación

            </label>

            <select
                id="capacitacionMasiva"
                class="form-select">

                <option value="">

                    Seleccionar capacitación...

                </option>

                ${
                    capacitacionesModal.map(cap => `

                        <option value="${cap.id}">
    ${cap.titulo}
</option>

                    `).join("")
                }

            </select>

        </div>


        <div class="row g-2 mb-3">

            <div class="col-md-5">

                <div class="input-group">

                    <span class="input-group-text">

                        <i class="fas fa-search"></i>

                    </span>

                    <input
                        type="text"
                        id="buscarEmpleadoMasivo"
                        class="form-control"
                        placeholder="Buscar empleado...">

                </div>

            </div>


            <div class="col-md-3">

                <select
                    id="filtroSedeMasivo"
                    class="form-select">

                    <option value="">

                        Todas las sedes

                    </option>

                </select>

            </div>


            <div class="col-md-4">

                <select
                    id="filtroAreaMasivo"
                    class="form-select">

                    <option value="">

                        Todas las áreas

                    </option>

                </select>

            </div>

        </div>


        <div class="d-flex justify-content-between align-items-center mb-3">

            <div>

                <input
                    type="checkbox"
                    id="seleccionarTodosMasivo"
                    class="form-check-input">

                <label
                    for="seleccionarTodosMasivo"
                    class="form-check-label fw-bold">

                    Seleccionar todos

                </label>

            </div>

            <span
                id="contadorSeleccionados"
                class="badge bg-success">

                0 seleccionados

            </span>

        </div>


        <div
            id="listaEmpleadosMasivo"
            class="lista-empleados-masivo">

        </div>

    `;

    cargarFiltrosMasivos();

    renderizarEmpleadosMasivo();

    configurarEventosMasivos();

}

// =====================================================
// CARGAR FILTROS MASIVOS
// =====================================================

function cargarFiltrosMasivos() {

    const sedes = [
        ...new Set(
            empleadosModal
                .map(e => e.sede)
                .filter(Boolean)
        )
    ].sort();

    const areas = [
        ...new Set(
            empleadosModal
                .map(e => e.area)
                .filter(Boolean)
        )
    ].sort();


    const selectSede =
        document.getElementById("filtroSedeMasivo");

    const selectArea =
        document.getElementById("filtroAreaMasivo");


    if (selectSede) {

        selectSede.innerHTML = `

            <option value="">

                Todas las sedes

            </option>

            ${
                sedes.map(sede => `

                    <option value="${sede}">

                        ${sede}

                    </option>

                `).join("")
            }

        `;

    }


    if (selectArea) {

        selectArea.innerHTML = `

            <option value="">

                Todas las áreas

            </option>

            ${
                areas.map(area => `

                    <option value="${area}">

                        ${area}

                    </option>

                `).join("")
            }

        `;

    }

}

// =====================================================
// MOSTRAR EMPLEADOS MASIVOS
// =====================================================

function renderizarEmpleadosMasivo() {

    const contenedor =
        document.getElementById(
            "listaEmpleadosMasivo"
        );

    if (!contenedor) return;


    const buscar =
        document.getElementById(
            "buscarEmpleadoMasivo"
        )?.value
        .toLowerCase()
        .trim() || "";


    const sede =
        document.getElementById(
            "filtroSedeMasivo"
        )?.value || "";


    const area =
        document.getElementById(
            "filtroAreaMasivo"
        )?.value || "";


    const empleadosFiltrados =
        empleadosModal.filter(empleado => {

            const nombre =
                (empleado.nombre || "")
                    .toLowerCase();

            const coincideNombre =
                nombre.includes(buscar);

            const coincideSede =
                !sede ||
                empleado.sede === sede;

            const coincideArea =
                !area ||
                empleado.area === area;

            return (
                coincideNombre &&
                coincideSede &&
                coincideArea
            );

        });


    if (empleadosFiltrados.length === 0) {

        contenedor.innerHTML = `

            <div class="alert alert-light text-center">

                <i class="fas fa-user-slash"></i>

                No se encontraron empleados.

            </div>

        `;

        return;

    }


    contenedor.innerHTML =
    empleadosFiltrados.map(empleado => `

        <label class="empleado-masivo-card">

            <div class="empleado-masivo-check">

                <input
                    type="checkbox"
                    class="form-check-input empleado-masivo"
                    value="${empleado.id}">

            </div>

            <div class="empleado-masivo-avatar">

                <i class="fas fa-user"></i>

            </div>

            <div class="empleado-masivo-info">

                <strong>
                    ${empleado.nombre}
                </strong>

                <small>
                    <i class="fas fa-briefcase"></i>
                    ${empleado.cargo || "Sin cargo"}
                </small>

                <span>
                    <i class="fas fa-building"></i>
                    ${empleado.area || "Sin área"}
                </span>

                <span>
                    <i class="fas fa-location-dot"></i>
                    ${empleado.sede || "Sin sede"}
                </span>

            </div>

        </label>

    `).join("");


    actualizarContadorMasivo();

}

// =====================================================
// EVENTOS ASIGNACIÓN MASIVA
// =====================================================

function configurarEventosMasivos() {

    document
        .getElementById("buscarEmpleadoMasivo")
        ?.addEventListener(
            "input",
            renderizarEmpleadosMasivo
        );


    document
        .getElementById("filtroSedeMasivo")
        ?.addEventListener(
            "change",
            renderizarEmpleadosMasivo
        );


    document
        .getElementById("filtroAreaMasivo")
        ?.addEventListener(
            "change",
            renderizarEmpleadosMasivo
        );


    document
        .getElementById("seleccionarTodosMasivo")
        ?.addEventListener(
            "change",
            function () {

                document
                    .querySelectorAll(
                        ".empleado-masivo"
                    )
                    .forEach(checkbox => {

                        checkbox.checked =
                            this.checked;

                    });

                actualizarContadorMasivo();

            }
        );


    document
        .getElementById("listaEmpleadosMasivo")
        ?.addEventListener(
            "change",
            event => {

                if (
                    event.target.classList
                        .contains("empleado-masivo")
                ) {

                    actualizarContadorMasivo();

                }

            }
        );

}

// =====================================================
// ACTUALIZAR CONTADOR
// =====================================================

function actualizarContadorMasivo() {

    const seleccionados =
        document.querySelectorAll(
            ".empleado-masivo:checked"
        );


    const contador =
        document.getElementById(
            "contadorSeleccionados"
        );


    if (contador) {

        contador.textContent =
            `${seleccionados.length} seleccionados`;

    }

}

// =====================================================
// GUARDAR ASIGNACIÓN
// =====================================================

async function guardarAsignacion() {

    try {

        console.log("Guardando asignación...");

        // =====================================================
        // DETERMINAR MODO
        // =====================================================

        const modoMasivo =
            !document
                .getElementById("contenidoMasivo")
                ?.classList.contains("d-none");


        // =====================================================
        // INDIVIDUAL
        // =====================================================

        if (!modoMasivo) {

            // -----------------------------------------
            // VALIDAR EMPLEADO
            // -----------------------------------------

            if (!empleadoSeleccionado) {

                return Swal.fire({
                    icon: "warning",
                    title: "Empleado no seleccionado",
                    text: "Seleccione un empleado antes de asignar."
                });

            }


            // -----------------------------------------
            // OBTENER CAPACITACIONES
            // -----------------------------------------

            const capacitacionSeleccionada =
                document.getElementById(
                    "capacitacionSeleccionada"
                )?.value;


            if (!capacitacionSeleccionada) {

                return Swal.fire({
                    icon: "warning",
                    title: "Capacitación no seleccionada",
                    text: "Seleccione al menos una capacitación."
                });

            }


            // -----------------------------------------
            // CONVERTIR A ARRAY
            // -----------------------------------------

            let capacitaciones = [];

            try {

                capacitaciones =
                    JSON.parse(
                        capacitacionSeleccionada
                    );

            } catch (error) {

                capacitaciones = [
                    capacitacionSeleccionada
                ];

            }


            if (
                !Array.isArray(capacitaciones) ||
                capacitaciones.length === 0
            ) {

                return Swal.fire({
                    icon: "warning",
                    title: "Capacitación no seleccionada",
                    text: "Seleccione al menos una capacitación."
                });

            }


            // -----------------------------------------
            // CONFIRMACIÓN
            // -----------------------------------------

            const confirmacion =
    await Swal.fire({

        icon: "question",

        title: "¿Asignar capacitaciones?",

        text:
            `Se asignarán ${capacitaciones.length} capacitación${capacitaciones.length !== 1 ? "es" : ""} al colaborador seleccionado.`,

        showCancelButton: true,

        confirmButtonText:
            "Sí, asignar",

        cancelButtonText:
            "Cancelar",

        confirmButtonColor:
            "#198754"

    });


            if (!confirmacion.isConfirmed) {
                return;
            }


            // -----------------------------------------
            // ENVIAR AL BACKEND
            // -----------------------------------------

            const respuesta =
                await fetch(
                    "/api/seguimiento-general/asignar-capacitacion",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            capacitacion_ids:
                                capacitaciones,

                            empleados: [
                                empleadoSeleccionado
                            ]

                        })
                    }
                );


            const data =
                await respuesta.json();


            // -----------------------------------------
            // ERROR DEL BACKEND
            // -----------------------------------------

            if (!respuesta.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "No se pudo realizar la asignación."
                );

            }


            // -----------------------------------------
            // CERRAR MODAL
            // -----------------------------------------

            const modalElement =
                document.getElementById(
                    "modalAsignarCapacitacion"
                );

            const modal =
                bootstrap.Modal
                    .getInstance(modalElement);

            modal?.hide();


            // -----------------------------------------
            // ACTUALIZAR INFORMACIÓN
            // -----------------------------------------

            await cargarResumen();

            await cargarDetalleEmpleado(
                empleadoSeleccionado
            );


            // -----------------------------------------
            // MOSTRAR RESULTADO
            // -----------------------------------------

            await Swal.fire({

                icon: "success",

                title: "Asignación realizada",

                text:
                    data.message ||
                    "Las capacitaciones fueron asignadas correctamente.",

                confirmButtonColor:
                    "#198754"

            });

            return;
        }


        // =====================================================
        // MASIVA
        // =====================================================

        const empleadosSeleccionados =
            document.querySelectorAll(
                ".empleado-masivo:checked"
            );


        if (
            empleadosSeleccionados.length === 0
        ) {

            return Swal.fire({

                icon: "warning",

                title: "Sin empleados",

                text:
                    "Seleccione al menos un empleado."

            });

        }


        // -----------------------------------------
        // CAPACITACIÓN
        // -----------------------------------------

        const capacitacionMasiva =
            document.getElementById(
                "capacitacionMasiva"
            )?.value;


        if (!capacitacionMasiva) {

            return Swal.fire({

                icon: "warning",

                title: "Capacitación no seleccionada",

                text:
                    "Seleccione la capacitación que desea asignar."

            });

        }


        // -----------------------------------------
        // OBTENER IDS DE EMPLEADOS
        // -----------------------------------------

        const empleados =
            Array.from(
                empleadosSeleccionados
            ).map(
                checkbox => checkbox.value
            );


        console.log(
            "Asignación masiva:",
            {
                capacitaciones: [
                    capacitacionMasiva
                ],
                empleados
            }
        );


        // -----------------------------------------
        // CONFIRMACIÓN
        // -----------------------------------------

        const confirmacion =
            await Swal.fire({

                icon: "question",

                title: "¿Realizar asignación masiva?",

                text:
                    `Se asignará la capacitación a ${empleados.length} colaboradores.`,

                showCancelButton: true,

                confirmButtonText:
                    "Sí, asignar",

                cancelButtonText:
                    "Cancelar",

                confirmButtonColor:
                    "#198754"

            });


        if (!confirmacion.isConfirmed) {
            return;
        }


        // -----------------------------------------
        // ENVIAR AL BACKEND
        // -----------------------------------------

        const respuesta =
            await fetch(
                "/api/seguimiento-general/asignar-capacitacion",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        capacitacion_ids: [
                            capacitacionMasiva
                        ],

                        empleados: empleados

                    })

                }
            );


        const data =
            await respuesta.json();


        // -----------------------------------------
        // ERROR
        // -----------------------------------------

        if (!respuesta.ok || !data.success) {

            throw new Error(
                data.message ||
                "No se pudo realizar la asignación masiva."
            );

        }


        // -----------------------------------------
        // CERRAR MODAL
        // -----------------------------------------

        const modalElement =
            document.getElementById(
                "modalAsignarCapacitacion"
            );

        const modal =
            bootstrap.Modal
                .getInstance(modalElement);

        modal?.hide();


        // -----------------------------------------
        // ACTUALIZAR RESUMEN
        // -----------------------------------------

        await cargarResumen();


        // -----------------------------------------
        // ACTUALIZAR EMPLEADO ACTUAL
        // -----------------------------------------

        const empleadoActivo =
            document.querySelector(
                ".empleado-card.active"
            );

        if (empleadoActivo) {

            await cargarDetalleEmpleado(
                empleadoActivo.dataset.id
            );

        }


        // -----------------------------------------
        // RESULTADO
        // -----------------------------------------

        const resultados =
            data.resultados || {};


        await Swal.fire({

            icon: "success",

            title: "Asignación completada",

            html: `
                <div style="text-align:left">

                    <p>
                        <strong>
                            Las capacitaciones fueron procesadas correctamente.
                        </strong>
                    </p>

                    <p>
                        <i class="fas fa-check-circle"
                           style="color:#198754"></i>
                        Nuevas asignaciones:
                        <strong>
                            ${resultados.asignados || 0}
                        </strong>
                    </p>

                    <p>
                        <i class="fas fa-info-circle"></i>
                        Ya existentes:
                        <strong>
                            ${resultados.existentes || 0}
                        </strong>
                    </p>

                </div>
            `,

            confirmButtonColor:
                "#198754"

        });


    } catch (error) {

        console.error(
            "Error guardando asignación:",
            error
        );


        Swal.fire({

            icon: "error",

            title: "Error al asignar",

            text:
                error.message ||
                "Ocurrió un error al guardar la asignación."

        });

    }

}

window.toggleDetalleCapacitacion = function(index) {

    const detalle =
        document.getElementById(`detalle-cap-${index}`);

    const flecha =
        document.getElementById(`flecha-cap-${index}`);

    if (!detalle) {
        console.error(
            "No se encontró el detalle de la capacitación:",
            index
        );
        return;
    }

    const estaAbierto =
        detalle.classList.contains("abierto");

    if (estaAbierto) {

        detalle.classList.remove("abierto");

        if (flecha) {
            flecha.classList.remove("fa-chevron-up");
            flecha.classList.add("fa-chevron-down");
        }

    } else {

        detalle.classList.add("abierto");

        if (flecha) {
            flecha.classList.remove("fa-chevron-down");
            flecha.classList.add("fa-chevron-up");
        }

    }

};
