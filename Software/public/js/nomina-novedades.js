/* ============================================================
   NÓMINA - NOVEDADES
   PROCESADOS MARGARITA
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    console.log('📋 Módulo de Novedades iniciado');


    /* ========================================================
       ELEMENTOS DEL DOM
       ======================================================== */

    const btnRegistrar =
        document.getElementById('btnRegistrarNovedad');

    const btnLimpiar =
        document.getElementById('btnLimpiarFiltros');

    const buscarNovedad =
        document.getElementById('buscarNovedad');

    const filtroTipo =
        document.getElementById('filtroTipo');

    const filtroEstado =
        document.getElementById('filtroEstado');

    const filtroMes =
        document.getElementById('filtroMes');

        /* ========================================================
   REGISTRAR NOVEDAD
   ======================================================== */

const modalRegistrarNovedad =
    document.getElementById('modalRegistrarNovedad');

const registroTipoNovedad =
    document.getElementById('registroTipoNovedad');

const informacionTipoNovedad =
    document.getElementById('informacionTipoNovedad');

const registroTipoNombre =
    document.getElementById('registroTipoNombre');

const registroTipoDescripcion =
    document.getElementById('registroTipoDescripcion');

const formularioNovedadDinamico =
    document.getElementById('formularioNovedadDinamico');

const camposNovedad =
    document.getElementById('camposNovedad');

const seccionSoporteNovedad =
    document.getElementById('seccionSoporteNovedad');

const soporteNovedad =
    document.getElementById('soporteNovedad');

const avisoAprobacionNovedad =
    document.getElementById('avisoAprobacionNovedad');

const btnGuardarNovedad =
    document.getElementById('btnGuardarNovedad');

const errorRegistroNovedad =
    document.getElementById('errorRegistroNovedad');


        /* ========================================================
   HISTORIAL
   ======================================================== */

const historialBuscar =
    document.getElementById('historialBuscar');

const historialTipo =
    document.getElementById('historialTipo');

const historialEstado =
    document.getElementById('historialEstado');

const historialTipoFecha =
    document.getElementById('historialTipoFecha');

const historialFechaContainer =
    document.getElementById('historialFechaContainer');

const historialFechaDia =
    document.getElementById('historialFechaDia');

const historialFechaMes =
    document.getElementById('historialFechaMes');

const historialFechaAno =
    document.getElementById('historialFechaAno');

const historialFechaRango =
    document.getElementById('historialFechaRango');

const historialDia =
    document.getElementById('historialDia');

const historialMes =
    document.getElementById('historialMes');

const historialAno =
    document.getElementById('historialAno');

const historialDesde =
    document.getElementById('historialDesde');

const historialHasta =
    document.getElementById('historialHasta');

const btnBuscarHistorial =
    document.getElementById('btnBuscarHistorial');

const btnLimpiarHistorial =
    document.getElementById('btnLimpiarHistorial');

const historialCargando =
    document.getElementById('historialCargando');

const historialEstadoVacio =
    document.getElementById('historialEstadoVacio');

const historialTablaWrapper =
    document.getElementById('historialTablaWrapper');

const tablaHistorialNovedades =
    document.getElementById('tablaHistorialNovedades');

    const tablaNovedades =
        document.getElementById('tablaNovedades');

    const estadoVacio =
        document.getElementById('estadoVacio');


    /* ========================================================
       KPIs
       ======================================================== */

    const kpiPendientes =
        document.getElementById('kpiPendientes');

    const kpiAprobadas =
        document.getElementById('kpiAprobadas');

    const kpiRechazadas =
        document.getElementById('kpiRechazadas');

    const kpiHistorial =
        document.getElementById('kpiHistorial');


    /* ========================================================
       ESTADO LOCAL
       ======================================================== */

    let novedades = [];



    /* ========================================================
       INICIO
       ======================================================== */

    inicializar();


    async function inicializar() {

        establecerMesActual();

        configurarEventos();

        await cargarNovedades();

    }



    /* ========================================================
       EVENTOS
       ======================================================== */

    function configurarEventos() {

        /* -----------------------------------------------
   REGISTRAR NOVEDAD
------------------------------------------------ */

if (btnRegistrarNovedad) {

    btnRegistrarNovedad.addEventListener(
        'click',
        abrirRegistroNovedad
    );

}


if (registroTipoNovedad) {

    registroTipoNovedad.addEventListener(
        'change',
        seleccionarTipoNovedad
    );

}


if (btnGuardarNovedad) {

    btnGuardarNovedad.addEventListener(
        'click',
        guardarNovedad
    );

}

        /* -----------------------------------------------
   HISTORIAL - TIPO DE FECHA
------------------------------------------------ */

if (historialTipoFecha) {

    historialTipoFecha.addEventListener(
        'change',
        cambiarTipoFechaHistorial
    );

}


/* -----------------------------------------------
   HISTORIAL - BUSCAR
------------------------------------------------ */

if (btnBuscarHistorial) {

    btnBuscarHistorial.addEventListener(
        'click',
        buscarHistorial
    );

}


/* -----------------------------------------------
   HISTORIAL - LIMPIAR
------------------------------------------------ */

if (btnLimpiarHistorial) {

    btnLimpiarHistorial.addEventListener(
        'click',
        limpiarFiltrosHistorial
    );

}

        /* -----------------------------------------------
           REGISTRAR NOVEDAD
        ------------------------------------------------ */

        if (btnRegistrar) {

            btnRegistrar.addEventListener(
                'click',
                abrirRegistroNovedad
            );

        }


        /* -----------------------------------------------
           BUSCADOR
        ------------------------------------------------ */

        if (buscarNovedad) {

            buscarNovedad.addEventListener(
                'input',
                aplicarFiltros
            );

        }


        /* -----------------------------------------------
           FILTRO TIPO
        ------------------------------------------------ */

        if (filtroTipo) {

            filtroTipo.addEventListener(
                'change',
                aplicarFiltros
            );

        }


        /* -----------------------------------------------
           FILTRO ESTADO
        ------------------------------------------------ */

        if (filtroEstado) {

            filtroEstado.addEventListener(
                'change',
                aplicarFiltros
            );

        }


        /* -----------------------------------------------
           FILTRO MES
        ------------------------------------------------ */

        if (filtroMes) {

            filtroMes.addEventListener(
                'change',
                aplicarFiltros
            );

        }


        /* -----------------------------------------------
           LIMPIAR FILTROS
        ------------------------------------------------ */

        if (btnLimpiar) {

            btnLimpiar.addEventListener(
                'click',
                limpiarFiltros
            );

            }

}


/* ========================================================
   AQUÍ VAN LAS FUNCIONES DEL HISTORIAL
   ======================================================== */


/* ========================================================
   CAMBIAR TIPO DE FECHA
   ======================================================== */

function cambiarTipoFechaHistorial() {

    const tipo =
        historialTipoFecha?.value || '';


    if (historialFechaDia) {
        historialFechaDia.style.display = 'none';
    }

    if (historialFechaMes) {
        historialFechaMes.style.display = 'none';
    }

    if (historialFechaAno) {
        historialFechaAno.style.display = 'none';
    }

    if (historialFechaRango) {
        historialFechaRango.style.display = 'none';
    }


    switch (tipo) {

        case 'dia':

            historialFechaDia.style.display = 'block';

            break;


        case 'mes':

            historialFechaMes.style.display = 'block';

            break;


        case 'ano':

            historialFechaAno.style.display = 'block';

            break;


        case 'rango':

            historialFechaRango.style.display = 'grid';

            break;

    }

}


/* ========================================================
   HISTORIAL - BUSCAR
   ======================================================== */

async function buscarHistorial() {

    try {

        const params =
            new URLSearchParams();


        const buscar =
            historialBuscar?.value.trim() || '';

        const tipo =
            historialTipo?.value || '';

        const estado =
            historialEstado?.value || '';

        const tipoFecha =
            historialTipoFecha?.value || '';


        if (buscar) {

            params.append(
                'buscar',
                buscar
            );

        }


        if (tipo) {

            params.append(
                'tipo',
                tipo
            );

        }


        if (estado) {

            params.append(
                'estado',
                estado
            );

        }


        if (tipoFecha) {

            params.append(
                'tipo_fecha',
                tipoFecha
            );


            if (
                tipoFecha === 'dia' &&
                historialDia?.value
            ) {

                params.append(
                    'fecha',
                    historialDia.value
                );

            }


            if (
                tipoFecha === 'mes' &&
                historialMes?.value
            ) {

                params.append(
                    'mes',
                    historialMes.value
                );

            }


            if (
                tipoFecha === 'ano' &&
                historialAno?.value
            ) {

                params.append(
                    'ano',
                    historialAno.value
                );

            }


            if (tipoFecha === 'rango') {

                if (historialDesde?.value) {

                    params.append(
                        'desde',
                        historialDesde.value
                    );

                }

                if (historialHasta?.value) {

                    params.append(
                        'hasta',
                        historialHasta.value
                    );

                }

            }

        }


        /* ==========================================
           MOSTRAR CARGANDO
           ========================================== */

        if (historialCargando) {

            historialCargando.style.display =
                'block';

        }

        if (historialEstadoVacio) {

            historialEstadoVacio.style.display =
                'none';

        }

        if (historialTablaWrapper) {

            historialTablaWrapper.style.display =
                'none';

        }


        /* ==========================================
           CONSULTAR API
           ========================================== */

        const respuesta =
            await fetch(
                `/api/nomina/novedades/historial?${params.toString()}`
            );


        const data =
            await respuesta.json();


        if (!respuesta.ok || !data.success) {

            throw new Error(
                data.message ||
                'No fue posible consultar el historial'
            );

        }


        console.log(
            '📋 Historial:',
            data.novedades
        );


        renderizarHistorial(
            data.novedades || []
        );


    } catch (error) {

        console.error(
            'ERROR HISTORIAL:',
            error
        );

        if (historialEstadoVacio) {

            historialEstadoVacio.style.display =
                'flex';

            historialEstadoVacio.innerHTML = `

                <div class="novedades-empty-icon">
                    <i class="fas fa-circle-exclamation"></i>
                </div>

                <h3>
                    No fue posible consultar el historial
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            `;

        }

    } finally {

        if (historialCargando) {

            historialCargando.style.display =
                'none';

        }

    }

}

/* ========================================================
   RENDERIZAR HISTORIAL
   ======================================================== */

function renderizarHistorial(novedades) {

    if (!tablaHistorialNovedades) {
        return;
    }


    tablaHistorialNovedades.innerHTML = '';


    if (!novedades.length) {

        if (historialTablaWrapper) {

            historialTablaWrapper.style.display =
                'none';

        }

        if (historialEstadoVacio) {

            historialEstadoVacio.style.display =
                'flex';

            historialEstadoVacio.innerHTML = `

                <div class="novedades-empty-icon">
                    <i class="fas fa-clock-rotate-left"></i>
                </div>

                <h3>
                    No hay novedades en el historial
                </h3>

                <p>
                    No se encontraron novedades vencidas
                    con los filtros seleccionados.
                </p>

            `;

        }

        return;

    }


    if (historialEstadoVacio) {

        historialEstadoVacio.style.display =
            'none';

    }

    if (historialTablaWrapper) {

        historialTablaWrapper.style.display =
            'block';

    }


    novedades.forEach(novedad => {

        const fila =
            document.createElement('tr');


        const fecha =
            formatearFecha(
                novedad.fecha_revision ||
                novedad.fecha_creacion
            );


        let cantidad = '-';


        if (
            novedad.cantidad_dias !== null &&
            novedad.cantidad_dias !== undefined
        ) {

            cantidad =
                `${novedad.cantidad_dias} día(s)`;

        } else if (
            novedad.cantidad_horas !== null &&
            novedad.cantidad_horas !== undefined
        ) {

            cantidad =
                `${novedad.cantidad_horas} hora(s)`;

        }


        fila.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(
                        novedad.empleado_nombre || '-'
                    )}
                </strong>

                <small>
                    ${escapeHtml(
                        novedad.numero_documento || ''
                    )}
                </small>
            </td>

            <td>
                ${escapeHtml(
                    novedad.tipo_novedad || '-'
                )}
            </td>

            <td>
                ${fecha}
            </td>

            <td>
                ${escapeHtml(cantidad)}
            </td>

            <td>
                <span class="estado-badge estado-${String(
                    novedad.estado || ''
                ).toLowerCase()}">
                    ${escapeHtml(
                        novedad.estado || '-'
                    )}
                </span>
            </td>

            <td>
                ${formatearFecha(
                    novedad.fecha_creacion
                )}
            </td>

            <td>
                <button
                    type="button"
                    class="btn-accion-novedad btn-ver-novedad"
                    data-id="${novedad.id}"
                    title="Ver novedad"
                >
                    <i class="fas fa-eye"></i>
                </button>
            </td>

        `;


        tablaHistorialNovedades.appendChild(
            fila
        );

    });

}


/* ========================================================
   LIMPIAR FILTROS DEL HISTORIAL
   ======================================================== */

function limpiarFiltrosHistorial() {

    if (historialBuscar) {
        historialBuscar.value = '';
    }

    if (historialTipo) {
        historialTipo.value = '';
    }

    if (historialEstado) {
        historialEstado.value = '';
    }

    if (historialTipoFecha) {
        historialTipoFecha.value = '';
    }

    if (historialDia) {
        historialDia.value = '';
    }

    if (historialMes) {
        historialMes.value = '';
    }

    if (historialAno) {
        historialAno.value = '';
    }

    if (historialDesde) {
        historialDesde.value = '';
    }

    if (historialHasta) {
        historialHasta.value = '';
    }


    cambiarTipoFechaHistorial();


    if (historialTablaWrapper) {
        historialTablaWrapper.style.display = 'none';
    }

    if (historialEstadoVacio) {
        historialEstadoVacio.style.display = 'flex';
    }

}



    /* ========================================================
       CARGAR NOVEDADES
       ======================================================== */

    async function cargarNovedades() {

        try {

            mostrarCargando();


            const respuesta = await fetch(
                '/api/nomina/novedades'
            );


            if (!respuesta.ok) {

                throw new Error(
                    'No fue posible cargar las novedades.'
                );

            }


            const resultado =
                await respuesta.json();


            /*
             * Permitimos diferentes formatos
             * de respuesta del backend.
             */

            if (Array.isArray(resultado)) {

                novedades = resultado;

            } else if (Array.isArray(resultado.data)) {

                novedades = resultado.data;

            } else {

                novedades = [];

            }


            console.log(
                '📋 Novedades cargadas:',
                novedades
            );


            cargarTipos();

            actualizarKPIs();

            renderizarTabla(novedades);

        } catch (error) {

            console.error(
                '❌ Error cargando novedades:',
                error
            );


            mostrarError(
                'No fue posible cargar las novedades.'
            );

        }

    }



    /* ========================================================
       CARGAR TIPOS DE NOVEDAD
       ======================================================== */

    function cargarTipos() {

        if (!filtroTipo) {
            return;
        }


        const tipos = [
            ...new Set(
                novedades
                    .map(novedad =>
                        obtenerTipo(novedad)
                    )
                    .filter(Boolean)
            )
        ];


        const valorActual =
            filtroTipo.value;


        filtroTipo.innerHTML = `
            <option value="">
                Todos los tipos
            </option>
        `;


        tipos
            .sort()
            .forEach(tipo => {

                const option =
                    document.createElement('option');

                option.value = tipo;

                option.textContent =
                    formatearTexto(tipo);

                filtroTipo.appendChild(option);

            });


        filtroTipo.value = valorActual;

    }



    /* ========================================================
       ACTUALIZAR KPIs
       ======================================================== */

    function actualizarKPIs() {

        const pendientes =
            novedades.filter(
                n => obtenerEstado(n) === 'PENDIENTE'
            ).length;


        const aprobadas =
            novedades.filter(
                n => obtenerEstado(n) === 'APROBADA'
            ).length;


        const rechazadas =
            novedades.filter(
                n => obtenerEstado(n) === 'RECHAZADA'
            ).length;


        /*
         * Las anuladas/históricas se mantienen
         * separadas del listado principal.
         */

        const historial =
            novedades.filter(
                n => obtenerEstado(n) === 'ANULADA'
            ).length;


        if (kpiPendientes) {

            kpiPendientes.textContent =
                pendientes;

        }


        if (kpiAprobadas) {

            kpiAprobadas.textContent =
                aprobadas;

        }


        if (kpiRechazadas) {

            kpiRechazadas.textContent =
                rechazadas;

        }


        if (kpiHistorial) {

            kpiHistorial.textContent =
                historial;

        }

    }



    /* ========================================================
       APLICAR FILTROS
       ======================================================== */

    function aplicarFiltros() {

        const texto =
            (buscarNovedad?.value || '')
                .trim()
                .toLowerCase();


        const tipo =
            filtroTipo?.value || '';


        const estado =
            filtroEstado?.value || '';


        const mes =
            filtroMes?.value || '';


        const filtradas =
            novedades.filter(novedad => {

                /* ----------------------------------------
                   BUSCADOR
                ---------------------------------------- */

                if (texto) {

                    const empleado =
                        String(
                            novedad.empleado_nombre ||
                            novedad.empleado ||
                            novedad.nombre_empleado ||
                            ''
                        ).toLowerCase();


                    const documento =
                        String(
                            novedad.documento ||
                            novedad.numero_documento ||
                            ''
                        ).toLowerCase();


                    const tipoNovedad =
                        String(
                            obtenerTipo(novedad) || ''
                        ).toLowerCase();


                    const observacion =
                        String(
                            novedad.observacion ||
                            novedad.observaciones ||
                            ''
                        ).toLowerCase();


                    const coincide =
                        empleado.includes(texto) ||
                        documento.includes(texto) ||
                        tipoNovedad.includes(texto) ||
                        observacion.includes(texto);


                    if (!coincide) {

                        return false;

                    }

                }


                /* ----------------------------------------
                   TIPO
                ---------------------------------------- */

                if (
                    tipo &&
                    obtenerTipo(novedad) !== tipo
                ) {

                    return false;

                }


                /* ----------------------------------------
                   ESTADO
                ---------------------------------------- */

                if (
                    estado &&
                    obtenerEstado(novedad) !== estado
                ) {

                    return false;

                }


                /* ----------------------------------------
                   MES
                ---------------------------------------- */

                if (mes) {

                    const fecha =
                        obtenerFecha(novedad);


                    if (!fecha.startsWith(mes)) {

                        return false;

                    }

                }


                return true;

            });


        renderizarTabla(filtradas);

    }



    /* ========================================================
       RENDERIZAR TABLA
       ======================================================== */

    function renderizarTabla(lista) {

        if (!tablaNovedades) {
            return;
        }


        tablaNovedades.innerHTML = '';


        /*
         * Ocultar estado vacío inicialmente.
         */

        if (estadoVacio) {

            estadoVacio.style.display =
                'none';

        }


        if (!lista.length) {

            if (estadoVacio) {

                estadoVacio.style.display =
                    'flex';

            }

            return;

        }


        lista.forEach(novedad => {

            const fila =
                document.createElement('tr');


            const empleado =
                obtenerEmpleado(novedad);


            const tipo =
                obtenerTipo(novedad);


            const fecha =
                obtenerFecha(novedad);


            const cantidad =
                obtenerCantidad(novedad);


            const estado =
                obtenerEstado(novedad);


            const registro =
                obtenerFechaRegistro(novedad);


            fila.innerHTML = `

                <td>
                    <div class="novedad-empleado">
                        ${escaparHTML(empleado)}
                    </div>
                </td>

                <td>
                    <span class="novedad-tipo">
                        ${escaparHTML(
                            formatearTexto(tipo)
                        )}
                    </span>
                </td>

                <td>
                    ${formatearFecha(fecha)}
                </td>

                <td>
                    ${escaparHTML(
                        cantidad ?? '-'
                    )}
                </td>

                <td>
                    ${crearBadgeEstado(estado)}
                </td>

                <td>
                    ${formatearFechaHora(registro)}
                </td>

                <td>
                    ${crearAcciones(novedad)}
                </td>

            `;


            tablaNovedades.appendChild(fila);

        });


        agregarEventosAcciones();

    }



    /* ========================================================
       ACCIONES
       ======================================================== */

    function crearAcciones(novedad) {

        const estado =
            obtenerEstado(novedad);


        let html = `

            <div class="novedad-acciones">

                <button
                    type="button"
                    class="btn-novedad-action btn-ver-novedad"
                    data-id="${novedad.id}"
                    title="Ver detalle"
                >
                    <i class="fas fa-eye"></i>
                </button>

        `;


        /*
         * Pendiente:
         * posteriormente conectaremos estas acciones
         * con las rutas reales de aprobar/rechazar.
         */

        if (estado === 'PENDIENTE') {

            html += `

                <button
                    type="button"
                    class="btn-novedad-action btn-aprobar-novedad"
                    data-id="${novedad.id}"
                    title="Aprobar"
                >
                    <i class="fas fa-check"></i>
                </button>

                <button
                    type="button"
                    class="btn-novedad-action btn-rechazar-novedad"
                    data-id="${novedad.id}"
                    title="Rechazar"
                >
                    <i class="fas fa-xmark"></i>
                </button>

            `;

        }


        html += `

            </div>

        `;


        return html;

    }



    function agregarEventosAcciones() {

        document
            .querySelectorAll('.btn-ver-novedad')
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        const id =
                            btn.dataset.id;

                        verNovedad(id);

                    }
                );

            });


        document
            .querySelectorAll('.btn-aprobar-novedad')
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        const id =
                            btn.dataset.id;

                        aprobarNovedad(id);

                    }
                );

            });


        document
            .querySelectorAll('.btn-rechazar-novedad')
            .forEach(btn => {

                btn.addEventListener(
                    'click',
                    () => {

                        const id =
                            btn.dataset.id;

                        rechazarNovedad(id);

                    }
                );

            });

    }



    /* ========================================================
       REGISTRAR
       ======================================================== */

    /* ========================================================
   ABRIR REGISTRO DE NOVEDAD
   ======================================================== */

async function abrirRegistroNovedad() {

    limpiarFormularioNovedad();

    await cargarTiposRegistro();


    const modalElement =
        document.getElementById(
            'modalRegistrarNovedad'
        );


    if (!modalElement) {
        return;
    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}

/* ========================================================
   SELECCIONAR TIPO DE NOVEDAD
   ======================================================== */

function seleccionarTipoNovedad() {

    const opcion =
        registroTipoNovedad?.selectedOptions?.[0];

    /* ==========================================
       SIN TIPO SELECCIONADO
       ========================================== */

    if (
        !opcion ||
        !opcion.value
    ) {

        informacionTipoNovedad.style.display = 'none';

        formularioNovedadDinamico.style.display = 'none';

        seccionSoporteNovedad.style.display = 'none';

        avisoAprobacionNovedad.style.display = 'none';

        btnGuardarNovedad.disabled = true;

        return;
    }


    /* ==========================================
       DATOS DEL TIPO
       ========================================== */

    const nombre =
        opcion.dataset.nombre || '';

    const descripcion =
        opcion.dataset.descripcion || '';

    const codigo =
        opcion.dataset.codigo || '';

    const permiteEmpleado =
        Number(
            opcion.dataset.permiteEmpleado
        );

    const requiereSoporte =
        Number(
            opcion.dataset.requiereSoporte
        );

    const requiereAprobacion =
        Number(
            opcion.dataset.requiereAprobacion
        );


    /* ==========================================
       INFORMACIÓN
       ========================================== */

    registroTipoNombre.textContent =
        nombre;

    registroTipoDescripcion.textContent =
        descripcion ||
        'Sin descripción disponible.';

    informacionTipoNovedad.style.display =
        'block';


    /* ==========================================
       PERMISO DEL TIPO
       ========================================== */

    if (!permiteEmpleado) {

        camposNovedad.innerHTML = `

            <div class="alert alert-warning">

                <i class="fas fa-lock"></i>

                Este tipo de novedad no puede ser
                registrado directamente por un empleado.

            </div>

        `;

        formularioNovedadDinamico.style.display =
            'block';

        seccionSoporteNovedad.style.display =
            'none';

        avisoAprobacionNovedad.style.display =
            'none';

        btnGuardarNovedad.disabled =
            true;

        return;
    }


    /* ==========================================
       SOPORTE GENERAL
       ========================================== */

    if (requiereSoporte) {

        seccionSoporteNovedad.style.display =
            'block';

    } else {

        seccionSoporteNovedad.style.display =
            'none';

    }


    /* ==========================================
       APROBACIÓN
       ========================================== */

    if (requiereAprobacion) {

        avisoAprobacionNovedad.style.display =
            'flex';

    } else {

        avisoAprobacionNovedad.style.display =
            'none';

    }


    /* ==========================================
       INCAPACIDAD
       ========================================== */

    if (
        codigo === 'INCAPACIDAD' ||
        nombre.toLowerCase().includes('incapacidad')
    ) {

        camposNovedad.innerHTML = `

            <div class="row g-3">

                <!-- TIPO DE INCAPACIDAD -->

                <div class="col-md-6">

                    <label
                        for="tipoIncapacidad"
                        class="form-label"
                    >
                        Tipo de incapacidad
                        <span class="text-danger">*</span>
                    </label>

                    <select
                        id="tipoIncapacidad"
                        class="form-select"
                        required
                    >

                        <option value="">
                            Selecciona el tipo
                        </option>

                        <option value="ENFERMEDAD_GENERAL">
                            Enfermedad general
                        </option>

                        <option value="ACCIDENTE_TRABAJO">
                            Accidente de trabajo
                        </option>

                        <option value="ACCIDENTE_ORIGEN_COMUN">
                            Accidente de origen común
                        </option>

                    </select>

                </div>


                <!-- FECHA INICIO -->

                <div class="col-md-3">

                    <label
                        for="fechaInicioIncapacidad"
                        class="form-label"
                    >
                        Fecha de inicio
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaInicioIncapacidad"
                        class="form-control"
                        required
                    >

                </div>


                <!-- FECHA FIN -->

                <div class="col-md-3">

                    <label
                        for="fechaFinIncapacidad"
                        class="form-label"
                    >
                        Fecha de finalización
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaFinIncapacidad"
                        class="form-control"
                        required
                    >

                </div>


                <!-- CANTIDAD DE DÍAS -->

                <div class="col-md-4">

                    <label
                        for="cantidadDiasIncapacidad"
                        class="form-label"
                    >
                        Cantidad de días
                    </label>

                    <input
                        type="number"
                        id="cantidadDiasIncapacidad"
                        class="form-control"
                        min="1"
                        step="0.01"
                        readonly
                    >

                    <small class="text-muted">
                        Se calcula automáticamente según
                        las fechas seleccionadas.
                    </small>

                </div>


                <!-- OBSERVACIÓN -->

                <div class="col-md-8">

                    <label
                        for="observacionIncapacidad"
                        class="form-label"
                    >
                        Observación
                    </label>

                    <textarea
                        id="observacionIncapacidad"
                        class="form-control"
                        rows="3"
                        placeholder="Escribe una observación si es necesario..."
                    ></textarea>

                </div>

            </div>

        `;


        /* ==========================================
           SOPORTE EPS
           ========================================== */

        seccionSoporteNovedad.style.display =
            'block';


        /* ==========================================
           OBTENER CAMPOS
           ========================================== */

        const fechaInicio =
            document.getElementById(
                'fechaInicioIncapacidad'
            );

        const fechaFin =
            document.getElementById(
                'fechaFinIncapacidad'
            );

        const cantidadDias =
            document.getElementById(
                'cantidadDiasIncapacidad'
            );


        /* ==========================================
           CALCULAR DÍAS
           ========================================== */

        function calcularDiasIncapacidad() {

            if (
                !fechaInicio?.value ||
                !fechaFin?.value
            ) {

                cantidadDias.value = '';

                return;
            }


            const inicio =
                new Date(
                    fechaInicio.value +
                    'T00:00:00'
                );

            const fin =
                new Date(
                    fechaFin.value +
                    'T00:00:00'
                );


            if (
                Number.isNaN(inicio.getTime()) ||
                Number.isNaN(fin.getTime())
            ) {

                cantidadDias.value = '';

                return;
            }


            if (fin < inicio) {

                cantidadDias.value = '';

                fechaFin.setCustomValidity(
                    'La fecha de finalización no puede ser anterior a la fecha de inicio.'
                );

                return;

            }


            fechaFin.setCustomValidity('');


            const diferencia =
                fin.getTime() -
                inicio.getTime();


            const dias =
                Math.floor(
                    diferencia /
                    (1000 * 60 * 60 * 24)
                ) + 1;


            cantidadDias.value =
                dias;
        }


        fechaInicio?.addEventListener(
            'change',
            calcularDiasIncapacidad
        );

        fechaFin?.addEventListener(
            'change',
            calcularDiasIncapacidad
        );


        /* ==========================================
           MOSTRAR FORMULARIO
           ========================================== */

        formularioNovedadDinamico.style.display =
            'block';


        /*
         * Todavía no guardamos.
         * Primero conectaremos este formulario
         * con el backend.
         */

        btnGuardarNovedad.disabled =
            false;

        return;
    }


    /* ==========================================
       OTROS TIPOS
       ========================================== */

    camposNovedad.innerHTML = `

        <div class="alert alert-info">

            <i class="fas fa-circle-info"></i>

            Tipo seleccionado:

            <strong>
                ${escaparHTML(nombre)}
            </strong>

            <br>

            Los campos específicos de este tipo
            se configurarán en el siguiente paso.

        </div>

    `;


    formularioNovedadDinamico.style.display =
        'block';


    btnGuardarNovedad.disabled =
        false;

}



    /* ========================================================
       VER NOVEDAD
       ======================================================== */

    function verNovedad(id) {

        const novedad =
            novedades.find(
                n => String(n.id) === String(id)
            );


        if (!novedad) {

            return;

        }


        console.log(
            '👁️ Novedad:',
            novedad
        );


        /*
         * Aquí conectaremos el modal
         * de detalle cuando esté definido.
         */

    }

    /* ========================================================
   GUARDAR NOVEDAD
   ======================================================== */

async function guardarNovedad() {

    console.log('💾 Guardar novedad iniciado');

    const opcion =
        registroTipoNovedad?.selectedOptions?.[0];

    if (!opcion || !opcion.value) {

        mostrarMensaje(
            'Debes seleccionar un tipo de novedad.',
            'error'
        );

        return;
    }


    const codigo =
        opcion.dataset.codigo || '';


    /* ==========================================
       INCAPACIDAD
       ========================================== */

    if (
        codigo === 'INCAPACIDAD' ||
        (opcion.dataset.nombre || '')
            .toLowerCase()
            .includes('incapacidad')
    ) {

        const tipoIncapacidad =
            document.getElementById(
                'tipoIncapacidad'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioIncapacidad'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinIncapacidad'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasIncapacidad'
            )?.value;

        const observacion =
            document.getElementById(
                'observacionIncapacidad'
            )?.value.trim();


        console.log('📋 Datos incapacidad:', {
            tipoIncapacidad,
            fechaInicio,
            fechaFin,
            cantidadDias,
            observacion
        });


        if (!tipoIncapacidad) {

            mostrarMensaje(
                'Selecciona el tipo de incapacidad.',
                'error'
            );

            return;
        }


        if (!fechaInicio) {

            mostrarMensaje(
                'Selecciona la fecha de inicio.',
                'error'
            );

            return;
        }


        if (!fechaFin) {

            mostrarMensaje(
                'Selecciona la fecha de finalización.',
                'error'
            );

            return;
        }


        if (!cantidadDias || Number(cantidadDias) <= 0) {

            mostrarMensaje(
                'La cantidad de días de la incapacidad no es válida.',
                'error'
            );

            return;
        }


        const archivo =
            soporteNovedad?.files?.[0];


        if (!archivo) {

            mostrarMensaje(
                'Debes adjuntar el soporte de la incapacidad.',
                'error'
            );

            return;
        }


        console.log('📎 Soporte seleccionado:', archivo);

        /*
         * TODAVÍA NO ENVIAMOS AL BACKEND.
         *
         * En el siguiente paso construiremos
         * el FormData y las rutas de almacenamiento.
         */

        mostrarMensaje(
            'Los datos de la incapacidad fueron validados correctamente.',
            'success'
        );

        return;
    }


    mostrarMensaje(
        'El guardado de este tipo de novedad todavía está pendiente de implementar.',
        'error'
    );

}

    /* ========================================================
   LIMPIAR FORMULARIO
   ======================================================== */

function limpiarFormularioNovedad() {

    if (registroTipoNovedad) {

        registroTipoNovedad.value = '';

    }

    if (informacionTipoNovedad) {

        informacionTipoNovedad.style.display =
            'none';

    }

    if (formularioNovedadDinamico) {

        formularioNovedadDinamico.style.display =
            'none';

    }

    if (seccionSoporteNovedad) {

        seccionSoporteNovedad.style.display =
            'none';

    }

    if (avisoAprobacionNovedad) {

        avisoAprobacionNovedad.style.display =
            'none';

    }

    if (camposNovedad) {

        camposNovedad.innerHTML = '';

    }

    if (soporteNovedad) {

        soporteNovedad.value = '';

    }

    if (errorRegistroNovedad) {

        errorRegistroNovedad.style.display =
            'none';

        errorRegistroNovedad.textContent =
            '';

    }

    if (btnGuardarNovedad) {

        btnGuardarNovedad.disabled =
            true;

    }

}



    /* ========================================================
       APROBAR
       ======================================================== */

    async function aprobarNovedad(id) {

        const confirmar =
            confirm(
                '¿Deseas aprobar esta novedad?'
            );


        if (!confirmar) {
            return;
        }


        try {

            const respuesta =
                await fetch(
                    `/api/nomina/novedades/${id}/aprobar`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json'
                        }
                    }
                );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    resultado.error ||
                    'No fue posible aprobar la novedad.'
                );

            }


            mostrarMensaje(
                resultado.mensaje ||
                'Novedad aprobada correctamente.',
                'success'
            );


            await cargarNovedades();

        } catch (error) {

            console.error(error);

            mostrarMensaje(
                error.message,
                'error'
            );

        }

    }



    /* ========================================================
       RECHAZAR
       ======================================================== */

    async function rechazarNovedad(id) {

        const motivo =
            prompt(
                'Indica el motivo del rechazo:'
            );


        if (
            motivo === null ||
            !motivo.trim()
        ) {

            return;

        }


        try {

            const respuesta =
                await fetch(
                    `/api/nomina/novedades/${id}/rechazar`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body: JSON.stringify({
                            motivo: motivo.trim()
                        })
                    }
                );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                throw new Error(
                    resultado.error ||
                    'No fue posible rechazar la novedad.'
                );

            }


            mostrarMensaje(
                resultado.mensaje ||
                'Novedad rechazada correctamente.',
                'success'
            );


            await cargarNovedades();

        } catch (error) {

            console.error(error);

            mostrarMensaje(
                error.message,
                'error'
            );

        }

    }



    /* ========================================================
       LIMPIAR FILTROS
       ======================================================== */

    function limpiarFiltros() {

        if (buscarNovedad) {

            buscarNovedad.value = '';

        }


        if (filtroTipo) {

            filtroTipo.value = '';

        }


        if (filtroEstado) {

            filtroEstado.value = '';

        }


        establecerMesActual();


        renderizarTabla(novedades);

    }



    /* ========================================================
       MES ACTUAL
       ======================================================== */

    function establecerMesActual() {

        if (!filtroMes) {
            return;
        }


        const ahora =
            new Date();


        const año =
            ahora.getFullYear();


        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, '0');


        filtroMes.value =
            `${año}-${mes}`;

    }

    /* ========================================================
   CARGAR TIPOS PARA REGISTRO
   ======================================================== */

async function cargarTiposRegistro() {

    try {

        const respuesta =
            await fetch(
                '/api/nomina/novedades/tipos'
            );


        const data =
            await respuesta.json();


        if (!respuesta.ok || !data.success) {

            throw new Error(
                data.message ||
                'No fue posible cargar los tipos'
            );

        }


        registroTipoNovedad.innerHTML = `
            <option value="">
                Selecciona un tipo de novedad
            </option>
        `;


        data.tipos.forEach(tipo => {

            const opcion =
                document.createElement('option');

            opcion.value = tipo.id;

            opcion.textContent =
                `${tipo.nombre} — ${tipo.categoria}`;

            opcion.dataset.nombre =
                tipo.nombre;

            opcion.dataset.codigo =
                tipo.codigo;

            opcion.dataset.categoria =
                tipo.categoria;

            opcion.dataset.descripcion =
                tipo.descripcion || '';

            opcion.dataset.permiteEmpleado =
                tipo.permite_empleado;

            opcion.dataset.requiereSoporte =
                tipo.requiere_soporte;

            opcion.dataset.requiereAprobacion =
                tipo.requiere_aprobacion;


            registroTipoNovedad.appendChild(
                opcion
            );

        });


        console.log(
            '📋 Tipos para registro:',
            data.tipos
        );


    } catch (error) {

        console.error(
            'ERROR CARGANDO TIPOS:',
            error
        );

    }

}



    /* ========================================================
       BADGE ESTADO
       ======================================================== */

    function crearBadgeEstado(estado) {

        const configuracion = {

            PENDIENTE: {
                clase: 'pendiente',
                texto: 'Pendiente',
                icono: 'fa-clock'
            },

            APROBADA: {
                clase: 'aprobada',
                texto: 'Aprobada',
                icono: 'fa-circle-check'
            },

            RECHAZADA: {
                clase: 'rechazada',
                texto: 'Rechazada',
                icono: 'fa-circle-xmark'
            },

            ANULADA: {
                clase: 'anulada',
                texto: 'Anulada',
                icono: 'fa-ban'
            }

        };


        const config =
            configuracion[estado] ||
            {
                clase: 'desconocido',
                texto: estado || 'Sin estado',
                icono: 'fa-question'
            };


        return `

            <span class="novedad-estado ${config.clase}">

                <i class="fas ${config.icono}"></i>

                ${config.texto}

            </span>

        `;

    }



    /* ========================================================
       UTILIDADES DE CAMPOS
       ======================================================== */

    function obtenerEmpleado(novedad) {

        return (
            novedad.empleado_nombre ||
            novedad.nombre_empleado ||
            novedad.empleado ||
            novedad.nombre ||
            'Sin empleado'
        );

    }



    function obtenerTipo(novedad) {

        return (
            novedad.tipo_novedad ||
            novedad.tipo ||
            novedad.novedad ||
            ''
        );

    }



    function obtenerEstado(novedad) {

        return String(
            novedad.estado ||
            'PENDIENTE'
        ).toUpperCase();

    }



    function obtenerFecha(novedad) {

        return (
            novedad.fecha_inicio ||
            novedad.fecha ||
            ''
        );

    }



    function obtenerCantidad(novedad) {

        return (
            novedad.cantidad ??
            novedad.valor ??
            novedad.dias ??
            ''
        );

    }



    function obtenerFechaRegistro(novedad) {

        return (
            novedad.created_at ||
            novedad.fecha_registro ||
            novedad.fecha_creacion ||
            ''
        );

    }



    /* ========================================================
       FORMATEAR FECHA
       ======================================================== */

    function formatearFecha(fecha) {

        if (!fecha) {
            return '-';
        }


        const fechaObj =
            new Date(fecha);


        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {

            return fecha;

        }


        return fechaObj.toLocaleDateString(
            'es-CO',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }
        );

    }



    /* ========================================================
       FORMATEAR FECHA Y HORA
       ======================================================== */

    function formatearFechaHora(fecha) {

        if (!fecha) {
            return '-';
        }


        const fechaObj =
            new Date(fecha);


        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {

            return fecha;

        }


        return fechaObj.toLocaleString(
            'es-CO',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    }



    /* ========================================================
       FORMATEAR TEXTO
       ======================================================== */

    function formatearTexto(texto) {

        if (!texto) {
            return '';
        }


        return String(texto)
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, letra =>
                letra.toUpperCase()
            );

    }



    /* ========================================================
       ESCAPAR HTML
       ======================================================== */

    function escaparHTML(valor) {

        const div =
            document.createElement('div');


        div.textContent =
            valor ?? '';


        return div.innerHTML;

    }



    /* ========================================================
       ESTADO DE CARGA
       ======================================================== */

    function mostrarCargando() {

        if (!tablaNovedades) {
            return;
        }


        tablaNovedades.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >

                    <i class="fas fa-spinner fa-spin"></i>

                    Cargando novedades...

                </td>

            </tr>

        `;


        if (estadoVacio) {

            estadoVacio.style.display =
                'none';

        }

    }



    /* ========================================================
       ERROR
       ======================================================== */

    function mostrarError(mensaje) {

        if (!tablaNovedades) {
            return;
        }


        tablaNovedades.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >

                    <i class="fas fa-triangle-exclamation"></i>

                    ${escaparHTML(mensaje)}

                </td>

            </tr>

        `;

    }



    /* ========================================================
       MENSAJE
       ======================================================== */

    function mostrarMensaje(
        mensaje,
        tipo = 'success'
    ) {

        /*
         * Mientras no tengamos el sistema global
         * de alertas del ERP, usamos una alerta
         * sencilla.
         */

        if (tipo === 'error') {

            alert(`❌ ${mensaje}`);

        } else {

            alert(`✅ ${mensaje}`);

        }

    }

});