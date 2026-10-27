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

/* ====================================================
   REGISTRAR LICENCIA EN BACKEND
   ==================================================== */

async function registrarLicencia(datos) {

    try {

        console.log(
            '📋 Datos de licencia:',
            datos
        );

        const response = await fetch(
            '/api/nomina/novedades/licencia',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    tipo_novedad_id:
                        datos.tipoNovedadId,

                    empleado_id:
                        datos.empleadoId,

                    tipo_licencia:
                        datos.tipoLicencia,

                    fecha_inicio:
                        datos.fechaInicio,

                    fecha_fin:
                        datos.fechaFin,

                    cantidad_dias:
                        Number(datos.cantidadDias),

                    motivo:
                        datos.motivo,

                    observacion:
                        datos.observacion || null

                })
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                'No fue posible registrar la licencia.'
            );

        }

        console.log(
            '✅ LICENCIA REGISTRADA:',
            data
        );

        mostrarMensaje(
            data.message ||
            'La licencia fue registrada y aprobada correctamente.',
            'success'
        );

        await cargarNovedades();

        setTimeout(
            async () => {

                await abrirRegistroNovedad();

            },
            800
        );

    } catch (error) {

        console.error(
            '❌ ERROR REGISTRANDO LICENCIA:',
            error
        );

        mostrarMensaje(
            error.message ||
            'No fue posible registrar la licencia.',
            'error'
        );

    }

}

/* ========================================================
   SELECCIONAR TIPO DE NOVEDAD
   ======================================================== */

async function seleccionarTipoNovedad() {

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

    const categoria =
    opcion.dataset.categoria || '';

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

    /* ==========================================
   PERMISO DEL TIPO
   ========================================== */

if (
    !permiteEmpleado &&
    codigo !== 'LICENCIA'
) {

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
   AUSENCIA
   ========================================== */

const textoTipo = `
    ${nombre}
    ${codigo}
    ${categoria}
    ${opcion.textContent}
`.toLowerCase();

const esAusencia =
    textoTipo.includes('ausencia') ||
    textoTipo.includes('asistencia');

if (esAusencia) {

    camposNovedad.innerHTML = `
        <div class="row g-3">

        <!-- EMPLEADO - SOLO SUPERADMIN -->
<div class="col-12">

    <div class="col-md-12">
        <label for="empleadoAusencia" class="form-label">
            Empleado
            <span class="text-danger">*</span>
        </label>

        <input
            type="text"
            id="empleadoAusencia"
            class="form-control"
            placeholder="Escribe el nombre del empleado..."
            autocomplete="off"
            required
        >

        <div
            id="listaEmpleadosAusencia"
            class="list-group mt-1"
            style="display: none;"
        ></div>

<input
    type="hidden"
    id="empleadoAusenciaId"
>
</div>

<!-- TIPO DE AUSENCIA -->
<div class="col-md-6">

                <label
                    for="tipoAusencia"
                    class="form-label"
                >
                    Tipo de ausencia
                    <span class="text-danger">*</span>
                </label>

                <select
                    id="tipoAusencia"
                    class="form-select"
                    required
                >
                    <option value="">
                        Selecciona el tipo
                    </option>

                    <option value="JUSTIFICADA">
                        Ausencia justificada
                    </option>

                    <option value="INJUSTIFICADA">
                        Ausencia injustificada
                    </option>
                </select>

            </div>

            <!-- FECHA INICIO -->
            <div class="col-md-3">

                <label
                    for="fechaInicioAusencia"
                    class="form-label"
                >
                    Fecha de inicio
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="date"
                    id="fechaInicioAusencia"
                    class="form-control"
                    required
                >

            </div>

            <!-- FECHA FIN -->
            <div class="col-md-3">

                <label
                    for="fechaFinAusencia"
                    class="form-label"
                >
                    Fecha de finalización
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="date"
                    id="fechaFinAusencia"
                    class="form-control"
                    required
                >

            </div>

            <!-- CANTIDAD DE DÍAS -->
            <div class="col-md-4">

                <label
                    for="cantidadDiasAusencia"
                    class="form-label"
                >
                    Cantidad de días
                </label>

                <input
                    type="number"
                    id="cantidadDiasAusencia"
                    class="form-control"
                    readonly
                >

                <small class="text-muted">
                    Se calcula automáticamente según las fechas.
                </small>

            </div>

            <!-- MOTIVO -->
            <div class="col-md-8">

                <label
                    for="motivoAusencia"
                    class="form-label"
                >
                    Motivo
                    <span class="text-danger">*</span>
                </label>

                <textarea
                    id="motivoAusencia"
                    class="form-control"
                    rows="2"
                    placeholder="Indica el motivo de la ausencia..."
                    required
                ></textarea>

            </div>

            <!-- OBSERVACIÓN -->
            <div class="col-12">

                <label
                    for="observacionAusencia"
                    class="form-label"
                >
                    Observación
                </label>

                <textarea
                    id="observacionAusencia"
                    class="form-control"
                    rows="3"
                    placeholder="Escribe una observación si es necesario..."
                ></textarea>

            </div>

        </div>
    `;

    /* ------------------------------------------
       SOPORTE OCULTO AL INICIO
       ------------------------------------------ */

    seccionSoporteNovedad.style.display = 'none';

    if (soporteNovedad) {
        soporteNovedad.value = '';
    }

    /* ==========================================
   BUSCADOR DE EMPLEADOS PARA AUSENCIA
   ========================================== */

const inputEmpleadoAusencia =
    document.getElementById('empleadoAusencia');

const listaEmpleadosAusencia =
    document.getElementById('listaEmpleadosAusencia');

const empleadoAusenciaId =
    document.getElementById('empleadoAusenciaId');

let empleadosAusencia = [];

try {

    const respuestaEmpleados =
        await fetch('/api/empleados', {
            credentials: 'include'
        });

    const datosEmpleados =
        await respuestaEmpleados.json();

    if (!respuestaEmpleados.ok) {
        throw new Error(
            datosEmpleados.message ||
            'No fue posible cargar los empleados.'
        );
    }

    empleadosAusencia =
        datosEmpleados.empleados ||
        datosEmpleados.data ||
        datosEmpleados;

    console.log(
        'Empleados cargados para ausencia:',
        empleadosAusencia
    );

} catch (error) {

    console.error(
        'Error cargando empleados:',
        error
    );

    empleadosAusencia = [];
}


/* ==========================================
   BUSCAR EMPLEADO MIENTRAS ESCRIBE
   ========================================== */

inputEmpleadoAusencia?.addEventListener(
    'input',
    function () {

        const texto =
            this.value
                .trim()
                .toLowerCase();

        empleadoAusenciaId.value = '';

        if (!texto) {

            listaEmpleadosAusencia.style.display =
                'none';

            listaEmpleadosAusencia.innerHTML =
                '';

            return;
        }

        const resultados =
            empleadosAusencia.filter(empleado => {

                const nombre =
                    empleado.nombre_completo ||
                    empleado.nombre ||
                    `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim();

                return nombre
                    .toLowerCase()
                    .includes(texto);
            });

        listaEmpleadosAusencia.innerHTML =
            '';

        if (resultados.length === 0) {

            listaEmpleadosAusencia.innerHTML = `
                <div class="list-group-item">
                    No se encontraron empleados.
                </div>
            `;

            listaEmpleadosAusencia.style.display =
                'block';

            return;
        }

        resultados.forEach(empleado => {

            const nombre =
                empleado.nombre_completo ||
                empleado.nombre ||
                `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim();

            const opcion =
                document.createElement('button');

            opcion.type = 'button';

            opcion.className =
                'list-group-item list-group-item-action';

            opcion.textContent = nombre;

            opcion.addEventListener(
                'click',
                function () {

                    inputEmpleadoAusencia.value =
                        nombre;

                    empleadoAusenciaId.value =
                        empleado.id;

                    listaEmpleadosAusencia.style.display =
                        'none';

                    listaEmpleadosAusencia.innerHTML =
                        '';
                }
            );

            listaEmpleadosAusencia.appendChild(
                opcion
            );
        });

        listaEmpleadosAusencia.style.display =
            'block';
    }
);

    /* ------------------------------------------
       MOSTRAR SOPORTE SOLO SI ES JUSTIFICADA
       ------------------------------------------ */

    const tipoAusenciaSelect =
        document.getElementById('tipoAusencia');

        const empleadoAusencia =
    document.getElementById('empleadoAusencia')?.value;

    tipoAusenciaSelect?.addEventListener(
        'change',
        function () {

            if (this.value === 'JUSTIFICADA') {

                seccionSoporteNovedad.style.display = 'block';

            } else {

                seccionSoporteNovedad.style.display = 'none';

                if (soporteNovedad) {
                    soporteNovedad.value = '';
                }

            }

        }
    );

    /* ------------------------------------------
       CALCULAR DÍAS
       ------------------------------------------ */

    const fechaInicio =
        document.getElementById('fechaInicioAusencia');

    const fechaFin =
        document.getElementById('fechaFinAusencia');

    const cantidadDias =
        document.getElementById('cantidadDiasAusencia');

    function calcularDiasAusencia() {

        if (
            !fechaInicio?.value ||
            !fechaFin?.value
        ) {
            cantidadDias.value = '';
            return;
        }

        const inicio =
            new Date(fechaInicio.value + 'T00:00:00');

        const fin =
            new Date(fechaFin.value + 'T00:00:00');

        if (fin < inicio) {
            cantidadDias.value = '';
            return;
        }

        const diferencia =
            fin.getTime() - inicio.getTime();

        const dias =
            Math.floor(
                diferencia /
                (1000 * 60 * 60 * 24)
            ) + 1;

        cantidadDias.value = dias;
    }

    fechaInicio?.addEventListener(
        'change',
        calcularDiasAusencia
    );

    fechaFin?.addEventListener(
        'change',
        calcularDiasAusencia
    );

    formularioNovedadDinamico.style.display = 'block';

    btnGuardarNovedad.disabled = false;

    return;
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
   LICENCIA
   ========================================== */

if (
    codigo.toUpperCase() === 'LICENCIA' ||
    nombre
        .toUpperCase()
        .includes('LICENCIA')
) {

    camposNovedad.innerHTML = `
    <div class="row g-3">

        <!-- EMPLEADO -->
        <div class="col-12">

            <label
                for="empleadoLicencia"
                class="form-label"
            >
                Empleado
                <span class="text-danger">*</span>
            </label>

            <div
    class="empleado-autocomplete"
    style="position: relative;"
>

    <input
        type="text"
        id="buscarEmpleadoLicencia"
        class="form-control"
        placeholder="Escribe el nombre o código del empleado..."
        autocomplete="off"
    >

    <input
        type="hidden"
        id="empleadoLicencia"
    >

    <div
        id="resultadosEmpleadoLicencia"
        class="list-group"
        style="
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            z-index: 2000;
            max-height: 220px;
            overflow-y: auto;
            display: none;
        "
    ></div>

</div>

<small class="text-muted">
    Escribe el nombre o código del empleado y selecciona el empleado correspondiente.
</small>

        </div>


        <!-- TIPO DE LICENCIA -->
        <div class="col-md-6">

                <label
                    for="tipoLicencia"
                    class="form-label"
                >
                    Tipo de licencia
                    <span class="text-danger">*</span>
                </label>

                <select
                    id="tipoLicencia"
                    class="form-select"
                    required
                >

                    <option value="">
                        Selecciona una opción
                    </option>

                    <option value="MATERNIDAD">
                        Maternidad
                    </option>

                    <option value="PATERNIDAD">
                        Paternidad
                    </option>

                </select>

            </div>


            <!-- CONTENEDOR MATERNIDAD -->
            <div
                id="camposLicenciaMaternidad"
                class="row g-3"
                style="display: none;"
            >

                <!-- FECHA PROBABLE DE PARTO -->
                <div class="col-md-6">

                    <label
                        for="fechaProbableParto"
                        class="form-label"
                    >
                        Fecha probable de parto
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaProbableParto"
                        class="form-control"
                    >

                </div>


                <!-- PREPARTO -->
                <div class="col-md-6">

                    <label
                        for="semanasPreparto"
                        class="form-label"
                    >
                        Preparto
                        <span class="text-danger">*</span>
                    </label>

                    <select
                        id="semanasPreparto"
                        class="form-select"
                    >

                        <option value="">
                            Selecciona
                        </option>

                        <option value="1">
                            1 semana
                        </option>

                        <option value="2">
                            2 semanas
                        </option>

                    </select>

                    <small class="text-muted">
                        Selecciona la cantidad de semanas
                        de preparto.
                    </small>

                </div>


                <!-- FECHA INICIO -->
                <div class="col-md-4">

                    <label
                        for="fechaInicioLicencia"
                        class="form-label"
                    >
                        Fecha de inicio
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaInicioLicencia"
                        class="form-control"
                    >

                </div>


                <!-- FECHA FIN -->
                <div class="col-md-4">

                    <label
                        for="fechaFinLicencia"
                        class="form-label"
                    >
                        Fecha de finalización
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaFinLicencia"
                        class="form-control"
                        readonly
                    >

                </div>


                <!-- DÍAS PREPARTO -->
                <div class="col-md-4">

                    <label
                        for="diasPreparto"
                        class="form-label"
                    >
                        Días de preparto
                    </label>

                    <input
                        type="number"
                        id="diasPreparto"
                        class="form-control"
                        readonly
                    >

                </div>


                <!-- DÍAS POSPARTO -->
                <div class="col-md-4">

                    <label
                        for="diasPosparto"
                        class="form-label"
                    >
                        Días de posparto
                    </label>

                    <input
                        type="number"
                        id="diasPosparto"
                        class="form-control"
                        readonly
                    >

                </div>


                <!-- TOTAL DÍAS -->
                <div class="col-md-4">

                    <label
                        for="cantidadDiasLicencia"
                        class="form-label"
                    >
                        Total días
                    </label>

                    <input
                        type="number"
                        id="cantidadDiasLicencia"
                        class="form-control"
                        readonly
                    >

                </div>

            </div>


            <!-- CONTENEDOR PATERNIDAD -->
            <div
                id="camposLicenciaPaternidad"
                class="row g-3"
                style="display: none;"
            >

                <!-- FECHA NACIMIENTO -->
                <div class="col-md-6">

                    <label
                        for="fechaNacimientoHijo"
                        class="form-label"
                    >
                        Fecha de nacimiento del hijo
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaNacimientoHijo"
                        class="form-control"
                    >

                </div>


                <!-- FECHA INICIO -->
                <div class="col-md-6">

                    <label
                        for="fechaInicioPaternidad"
                        class="form-label"
                    >
                        Fecha de inicio
                        <span class="text-danger">*</span>
                    </label>

                    <input
                        type="date"
                        id="fechaInicioPaternidad"
                        class="form-control"
                    >

                </div>


                <!-- FECHA FIN -->
                <div class="col-md-6">

                    <label
                        for="fechaFinPaternidad"
                        class="form-label"
                    >
                        Fecha de finalización
                    </label>

                    <input
                        type="date"
                        id="fechaFinPaternidad"
                        class="form-control"
                        readonly
                    >

                </div>


                <!-- DÍAS -->
                <div class="col-md-6">

                    <label
                        for="cantidadDiasPaternidad"
                        class="form-label"
                    >
                        Cantidad de días
                    </label>

                    <input
                        type="number"
                        id="cantidadDiasPaternidad"
                        class="form-control"
                        value="14"
                        readonly
                    >

                </div>

            </div>


            <!-- OBSERVACIÓN -->
            <div class="col-12">

                <label
                    for="observacionLicencia"
                    class="form-label"
                >
                    Observación
                </label>

                <textarea
                    id="observacionLicencia"
                    class="form-control"
                    rows="3"
                    placeholder="Escribe una observación si es necesario..."
                ></textarea>

            </div>

        </div>
    `;


    /* ==========================================
       OBTENER ELEMENTOS
       ========================================== */

    const tipoLicencia =
        document.getElementById(
            'tipoLicencia'
        );

    const camposMaternidad =
        document.getElementById(
            'camposLicenciaMaternidad'
        );

    const camposPaternidad =
        document.getElementById(
            'camposLicenciaPaternidad'
        );

    const fechaProbableParto =
        document.getElementById(
            'fechaProbableParto'
        );

    const semanasPreparto =
        document.getElementById(
            'semanasPreparto'
        );

    const fechaInicioLicencia =
        document.getElementById(
            'fechaInicioLicencia'
        );

    const fechaFinLicencia =
        document.getElementById(
            'fechaFinLicencia'
        );

    const diasPreparto =
        document.getElementById(
            'diasPreparto'
        );

    const diasPosparto =
        document.getElementById(
            'diasPosparto'
        );

    const cantidadDiasLicencia =
        document.getElementById(
            'cantidadDiasLicencia'
        );

    const fechaNacimientoHijo =
        document.getElementById(
            'fechaNacimientoHijo'
        );

    const fechaInicioPaternidad =
        document.getElementById(
            'fechaInicioPaternidad'
        );

    const fechaFinPaternidad =
        document.getElementById(
            'fechaFinPaternidad'
        );

    const cantidadDiasPaternidad =
        document.getElementById(
            'cantidadDiasPaternidad'
        );

        /* ==========================================
   CARGAR EMPLEADOS
   ========================================== */

const empleadoLicencia =
    document.getElementById(
        'empleadoLicencia'
    );


async function cargarEmpleadosLicencia() {

    const inputEmpleadoLicencia =
        document.getElementById(
            'buscarEmpleadoLicencia'
        );

    const listaEmpleadosLicencia =
        document.getElementById(
            'resultadosEmpleadoLicencia'
        );

    const empleadoLicenciaId =
        document.getElementById(
            'empleadoLicencia'
        );


    if (
        !inputEmpleadoLicencia ||
        !listaEmpleadosLicencia ||
        !empleadoLicenciaId
    ) {
        return;
    }


    let empleadosLicencia = [];


    try {

        const respuestaEmpleados =
            await fetch(
                '/api/empleados',
                {
                    credentials: 'include'
                }
            );


        const datosEmpleados =
            await respuestaEmpleados.json();


        if (!respuestaEmpleados.ok) {

            throw new Error(
                datosEmpleados.message ||
                'No fue posible cargar los empleados.'
            );

        }


        empleadosLicencia =
            datosEmpleados.empleados ||
            datosEmpleados.data ||
            datosEmpleados;


    } catch (error) {

        console.error(
            'Error cargando empleados para licencia:',
            error
        );

        return;

    }


    /* ==========================================
       BUSCAR EMPLEADO MIENTRAS ESCRIBE
       ========================================== */

    inputEmpleadoLicencia.addEventListener(
        'input',
        function () {

            const texto =
                this.value
                    .trim()
                    .toLowerCase();


            empleadoLicenciaId.value = '';


            if (!texto) {

                listaEmpleadosLicencia.style.display =
                    'none';

                listaEmpleadosLicencia.innerHTML =
                    '';

                return;

            }


            const resultados =
                empleadosLicencia.filter(
                    empleado => {

                        const nombre =
                            empleado.nombre_completo ||
                            empleado.nombre ||
                            `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim();

                        const codigo =
                            empleado.codigo || '';


                        return (
                            nombre
                                .toLowerCase()
                                .includes(texto) ||

                            codigo
                                .toLowerCase()
                                .includes(texto)
                        );

                    }
                );


            listaEmpleadosLicencia.innerHTML =
                '';


            if (!resultados.length) {

                listaEmpleadosLicencia.innerHTML = `
                    <div class="list-group-item">
                        No se encontraron empleados.
                    </div>
                `;

                listaEmpleadosLicencia.style.display =
                    'block';

                return;

            }


            resultados
                .slice(0, 10)
                .forEach(
                    empleado => {

                        const nombre =
                            empleado.nombre_completo ||
                            empleado.nombre ||
                            `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim();


                        const opcion =
                            document.createElement(
                                'button'
                            );


                        opcion.type =
                            'button';


                        opcion.className =
                            'list-group-item list-group-item-action';


                        opcion.innerHTML = `
                            <strong>
                                ${nombre}
                            </strong>
                            <br>
                            <small class="text-muted">
                                ${empleado.codigo || ''}
                            </small>
                        `;


                        opcion.addEventListener(
                            'click',
                            function () {

                                inputEmpleadoLicencia.value =
                                    `${nombre} — ${empleado.codigo || ''}`;


                                empleadoLicenciaId.value =
                                    empleado.id;


                                listaEmpleadosLicencia.style.display =
                                    'none';


                                listaEmpleadosLicencia.innerHTML =
                                    '';

                            }
                        );


                        listaEmpleadosLicencia.appendChild(
                            opcion
                        );

                    }
                );


            listaEmpleadosLicencia.style.display =
                'block';

        }
    );


    /* ==========================================
       CERRAR LISTA AL HACER CLIC AFUERA
       ========================================== */

    document.addEventListener(
        'click',
        function (event) {

            if (
                !event.target.closest(
                    '#buscarEmpleadoLicencia'
                ) &&
                !event.target.closest(
                    '#resultadosEmpleadoLicencia'
                )
            ) {

                listaEmpleadosLicencia.style.display =
                    'none';

            }

        }
    );

}


    /* ==========================================
       CAMBIAR TIPO DE LICENCIA
       ========================================== */

    tipoLicencia?.addEventListener(
        'change',
        () => {

            camposMaternidad.style.display =
                'none';

            camposPaternidad.style.display =
                'none';


            if (
                tipoLicencia.value ===
                'MATERNIDAD'
            ) {

                camposMaternidad.style.display =
                    'flex';

            }


            if (
                tipoLicencia.value ===
                'PATERNIDAD'
            ) {

                camposPaternidad.style.display =
                    'flex';

            }

        }
    );


    /* ==========================================
       CALCULAR MATERNIDAD
       ========================================== */

    function calcularLicenciaMaternidad() {

        if (
            !fechaProbableParto?.value ||
            !semanasPreparto?.value
        ) {

            return;

        }


        const parto =
            new Date(
                fechaProbableParto.value +
                'T00:00:00'
            );

        const semanas =
            Number(
                semanasPreparto.value
            );

        const diasPre =
            semanas * 7;


        diasPreparto.value =
            diasPre;


        /*
         * La fecha de inicio corresponde
         * al inicio del preparto.
         */

        const inicio =
            new Date(parto);

        inicio.setDate(
            inicio.getDate() -
            diasPre
        );


        fechaInicioLicencia.value =
            inicio
                .toISOString()
                .split('T')[0];


        /*
         * Días posparto:
         *
         * 1 semana preparto = 17 semanas
         * 2 semanas preparto = 16 semanas
         */

        const semanasPosparto =
            semanas === 1
                ? 17
                : 16;


        const diasPost =
            semanasPosparto * 7;


        diasPosparto.value =
            diasPost;


        const totalDias =
            diasPre +
            diasPost;


        cantidadDiasLicencia.value =
            totalDias;


        /*
         * La finalización se calcula
         * desde la fecha de inicio.
         */

        const fin =
            new Date(inicio);

        fin.setDate(
            fin.getDate() +
            totalDias -
            1
        );


        fechaFinLicencia.value =
            fin
                .toISOString()
                .split('T')[0];

    }


    fechaProbableParto?.addEventListener(
        'change',
        calcularLicenciaMaternidad
    );

    semanasPreparto?.addEventListener(
        'change',
        calcularLicenciaMaternidad
    );


    /* ==========================================
       CALCULAR PATERNIDAD
       ========================================== */

    function calcularLicenciaPaternidad() {

        if (
            !fechaInicioPaternidad?.value
        ) {

            return;

        }


        const inicio =
            new Date(
                fechaInicioPaternidad.value +
                'T00:00:00'
            );


        const dias =
            14;


        cantidadDiasPaternidad.value =
            dias;


        const fin =
            new Date(inicio);


        fin.setDate(
            fin.getDate() +
            dias -
            1
        );


        fechaFinPaternidad.value =
            fin
                .toISOString()
                .split('T')[0];

    }


    fechaNacimientoHijo?.addEventListener(
        'change',
        () => {

            /*
             * Por defecto la licencia
             * puede iniciar desde la
             * fecha de nacimiento.
             */

            if (
                fechaNacimientoHijo.value &&
                !fechaInicioPaternidad.value
            ) {

                fechaInicioPaternidad.value =
                    fechaNacimientoHijo.value;

            }

            calcularLicenciaPaternidad();

        }
    );


    fechaInicioPaternidad?.addEventListener(
        'change',
        calcularLicenciaPaternidad
    );


    /* ==========================================
       MOSTRAR FORMULARIO
       ========================================== */

    seccionSoporteNovedad.style.display =
        'none';

    formularioNovedadDinamico.style.display =
        'block';

        await cargarEmpleadosLicencia();

    btnGuardarNovedad.disabled =
        false;

    return;
}

/* ====================================================
   LICENCIA
   ==================================================== */

if (
    codigo === 'LICENCIA' ||
    (opcion.dataset.nombre || '')
        .toLowerCase()
        .includes('licencia')
) {

    const empleadoId =
        document.getElementById(
            'empleadoLicencia'
        )?.value;

    const tipoLicencia =
        document.getElementById(
            'tipoLicencia'
        )?.value;

    const observacion =
        document.getElementById(
            'observacionLicencia'
        )?.value.trim();


    /* ==========================================
       VALIDAR EMPLEADO
       ========================================== */

    if (!empleadoId) {

        mostrarMensaje(
            'Debes seleccionar el empleado al que se le registrará la licencia.',
            'error'
        );

        return;
    }


    /* ==========================================
       VALIDAR TIPO
       ========================================== */

    if (!tipoLicencia) {

        mostrarMensaje(
            'Debes seleccionar el tipo de licencia.',
            'error'
        );

        return;
    }


    /* ==========================================
       MATERNIDAD
       ========================================== */

    if (
        tipoLicencia === 'MATERNIDAD'
    ) {

        const fechaProbableParto =
            document.getElementById(
                'fechaProbableParto'
            )?.value;

        const semanasPreparto =
            document.getElementById(
                'semanasPreparto'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioLicencia'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinLicencia'
            )?.value;

        const diasPreparto =
            document.getElementById(
                'diasPreparto'
            )?.value;

        const diasPosparto =
            document.getElementById(
                'diasPosparto'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasLicencia'
            )?.value;


        /* ==========================================
           VALIDACIONES
           ========================================== */

        if (!fechaProbableParto) {

            mostrarMensaje(
                'Debes seleccionar la fecha probable de parto.',
                'error'
            );

            return;
        }


        if (!semanasPreparto) {

            mostrarMensaje(
                'Debes seleccionar las semanas de preparto.',
                'error'
            );

            return;
        }


        if (!fechaInicio || !fechaFin) {

            mostrarMensaje(
                'No se pudieron calcular las fechas de la licencia.',
                'error'
            );

            return;
        }


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días de la licencia no es válida.',
                'error'
            );

            return;
        }


        /* ==========================================
           MOTIVO
           ========================================== */

        const motivo =
            `Licencia de maternidad | ` +
            `Fecha probable de parto: ${fechaProbableParto} | ` +
            `Preparto: ${semanasPreparto} semana(s) | ` +
            `Días preparto: ${diasPreparto} | ` +
            `Días posparto: ${diasPosparto}`;


        /* ==========================================
           ENVIAR AL BACKEND
           ========================================== */

        try {

            const response =
                await fetch(
                    '/api/nomina/novedades/licencia',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            tipo_novedad_id:
                                opcion.value,

                            empleado_id:
                                empleadoId,

                            tipo_licencia:
                                tipoLicencia,

                            fecha_inicio:
                                fechaInicio,

                            fecha_fin:
                                fechaFin,

                            cantidad_dias:
                                Number(
                                    cantidadDias
                                ),

                            motivo:
                                motivo,

                            observacion:
                                observacion || null

                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    'No fue posible registrar la licencia.'
                );

            }


            mostrarMensaje(
                data.message ||
                'La licencia fue registrada y aprobada correctamente.',
                'success'
            );


            console.log(
                '✅ Licencia de maternidad registrada:',
                data
            );


            limpiarFormularioNovedad();


            if (
                typeof cargarNovedades ===
                'function'
            ) {

                await cargarNovedades();

            }


        } catch (error) {

            console.error(
                '❌ Error registrando licencia:',
                error
            );


            mostrarMensaje(
                error.message ||
                'No fue posible registrar la licencia.',
                'error'
            );

        }


        return;
    }


    /* ==========================================
       PATERNIDAD
       ========================================== */

    if (
        tipoLicencia === 'PATERNIDAD'
    ) {

        const fechaNacimientoHijo =
            document.getElementById(
                'fechaNacimientoHijo'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioPaternidad'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinPaternidad'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasPaternidad'
            )?.value;


        /* ==========================================
           VALIDACIONES
           ========================================== */

        if (!fechaNacimientoHijo) {

            mostrarMensaje(
                'Debes seleccionar la fecha de nacimiento del hijo.',
                'error'
            );

            return;
        }


        if (!fechaInicio) {

            mostrarMensaje(
                'Debes seleccionar la fecha de inicio de la licencia.',
                'error'
            );

            return;
        }


        if (!fechaFin) {

            mostrarMensaje(
                'No se pudo calcular la fecha de finalización.',
                'error'
            );

            return;
        }


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días de la licencia no es válida.',
                'error'
            );

            return;
        }


        /* ==========================================
           MOTIVO
           ========================================== */

        const motivo =
            `Licencia de paternidad | ` +
            `Fecha de nacimiento del hijo: ${fechaNacimientoHijo}`;


        /* ==========================================
           ENVIAR AL BACKEND
           ========================================== */

        try {

            const response =
                await fetch(
                    '/api/nomina/novedades/licencia',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            tipo_novedad_id:
                                opcion.value,

                            empleado_id:
                                empleadoId,

                            tipo_licencia:
                                tipoLicencia,

                            fecha_inicio:
                                fechaInicio,

                            fecha_fin:
                                fechaFin,

                            cantidad_dias:
                                Number(
                                    cantidadDias
                                ),

                            motivo:
                                motivo,

                            observacion:
                                observacion || null

                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    'No fue posible registrar la licencia.'
                );

            }


            mostrarMensaje(
                data.message ||
                'La licencia fue registrada y aprobada correctamente.',
                'success'
            );


            console.log(
                '✅ Licencia de paternidad registrada:',
                data
            );


            limpiarFormularioNovedad();


            if (
                typeof cargarNovedades ===
                'function'
            ) {

                await cargarNovedades();

            }


        } catch (error) {

            console.error(
                '❌ Error registrando licencia:',
                error
            );


            mostrarMensaje(
                error.message ||
                'No fue posible registrar la licencia.',
                'error'
            );

        }


        return;
    }


    mostrarMensaje(
        'Debes seleccionar un tipo de licencia válido.',
        'error'
    );

    return;
}


    /* ==========================================
   PERMISO
   ========================================== */

if (
    codigo === 'PERMISO' ||
    nombre.toLowerCase().includes('permiso')
) {

    camposNovedad.innerHTML = `

        <div class="row g-3">

            <!-- TIPO DE PERMISO -->
            <div class="col-md-6">

                <label
                    for="tipoPermiso"
                    class="form-label"
                >
                    Tipo de permiso
                    <span class="text-danger">*</span>
                </label>

                <select
                    id="tipoPermiso"
                    class="form-select"
                    required
                >

                    <option value="">
                        Selecciona el tipo
                    </option>

                    <option value="REMUNERADO">
                        Remunerado
                    </option>

                    <option value="NO_REMUNERADO">
                        No remunerado
                    </option>

                    <option value="COMPENSATORIO">
                        Compensatorio
                    </option>

                </select>

            </div>


            <!-- FECHA -->
            <div class="col-md-6">

                <label
                    for="fechaPermiso"
                    class="form-label"
                >
                    Fecha del permiso
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="date"
                    id="fechaPermiso"
                    class="form-control"
                    required
                >

            </div>


            <!-- HORA INICIO -->
            <div class="col-md-4">

                <label
                    for="horaInicioPermiso"
                    class="form-label"
                >
                    Hora de inicio
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="time"
                    id="horaInicioPermiso"
                    class="form-control"
                    required
                >

            </div>


            <!-- HORA FIN -->
            <div class="col-md-4">

                <label
                    for="horaFinPermiso"
                    class="form-label"
                >
                    Hora de finalización
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="time"
                    id="horaFinPermiso"
                    class="form-control"
                    required
                >

            </div>


            <!-- CANTIDAD DE HORAS -->
            <div class="col-md-4">

                <label
                    for="cantidadHorasPermiso"
                    class="form-label"
                >
                    Cantidad de horas
                </label>

                <input
                    type="number"
                    id="cantidadHorasPermiso"
                    class="form-control"
                    min="0"
                    step="0.01"
                    readonly
                >

                <small class="text-muted">
                    Se calcula automáticamente según
                    la hora de inicio y finalización.
                </small>

            </div>


            <!-- MOTIVO -->
            <div class="col-md-6">

                <label
                    for="motivoPermiso"
                    class="form-label"
                >
                    Motivo
                    <span class="text-danger">*</span>
                </label>

                <textarea
                    id="motivoPermiso"
                    class="form-control"
                    rows="3"
                    placeholder="Indica el motivo del permiso..."
                    required
                ></textarea>

            </div>


            <!-- OBSERVACIÓN -->
            <div class="col-md-6">

                <label
                    for="observacionPermiso"
                    class="form-label"
                >
                    Observación
                </label>

                <textarea
                    id="observacionPermiso"
                    class="form-control"
                    rows="3"
                    placeholder="Escribe una observación si es necesario..."
                ></textarea>

            </div>

        </div>

    `;


    /* ==========================================
       SOPORTE
       ========================================== */

    /*
     * Permiso no requiere soporte
     * según la configuración del tipo.
     */
    seccionSoporteNovedad.style.display = 'none';


    /* ==========================================
       OBTENER CAMPOS
       ========================================== */

    const horaInicio =
        document.getElementById(
            'horaInicioPermiso'
        );

    const horaFin =
        document.getElementById(
            'horaFinPermiso'
        );

    const cantidadHoras =
        document.getElementById(
            'cantidadHorasPermiso'
        );


    /* ==========================================
       CALCULAR HORAS
       ========================================== */

    function calcularHorasPermiso() {

        if (
            !horaInicio?.value ||
            !horaFin?.value
        ) {

            cantidadHoras.value = '';

            return;
        }


        const [horaInicioH, horaInicioM] =
            horaInicio.value
                .split(':')
                .map(Number);

        const [horaFinH, horaFinM] =
            horaFin.value
                .split(':')
                .map(Number);


        const minutosInicio =
            (horaInicioH * 60) +
            horaInicioM;

        const minutosFin =
            (horaFinH * 60) +
            horaFinM;


        if (
            minutosFin <= minutosInicio
        ) {

            cantidadHoras.value = '';

            horaFin.setCustomValidity(
                'La hora de finalización debe ser posterior a la hora de inicio.'
            );

            return;
        }


        horaFin.setCustomValidity('');


        const diferenciaMinutos =
            minutosFin -
            minutosInicio;


        const horas =
            diferenciaMinutos / 60;


        cantidadHoras.value =
            horas.toFixed(2);

    }


    horaInicio?.addEventListener(
        'change',
        calcularHorasPermiso
    );

    horaFin?.addEventListener(
        'change',
        calcularHorasPermiso
    );


    /* ==========================================
       MOSTRAR FORMULARIO
       ========================================== */

    formularioNovedadDinamico.style.display =
        'block';


    /*
     * La aprobación ya viene determinada
     * por nomina_novedades_tipos:
     *
     * requiere_aprobacion = 1
     *
     * Por eso el aviso de aprobación
     * ya se muestra arriba.
     */

    btnGuardarNovedad.disabled =
        false;

    return;
}

/* ====================================================
   LICENCIA
   ==================================================== */

if (
    codigo === 'LICENCIA' ||
    (opcion.dataset.nombre || '')
        .toLowerCase()
        .includes('licencia')
) {

    console.log('📋 Registrando licencia');


    const empleadoId =
        document.getElementById(
            'empleadoLicencia'
        )?.value;


    const tipoLicencia =
        document.getElementById(
            'tipoLicencia'
        )?.value;


    const observacion =
        document.getElementById(
            'observacionLicencia'
        )?.value.trim();


    /* ==========================================
       VALIDAR EMPLEADO
       ========================================== */

    if (!empleadoId) {

        mostrarMensaje(
            'Debes seleccionar el empleado.',
            'error'
        );

        return;
    }


    /* ==========================================
       VALIDAR TIPO
       ========================================== */

    if (!tipoLicencia) {

        mostrarMensaje(
            'Debes seleccionar el tipo de licencia.',
            'error'
        );

        return;
    }


    /* ==========================================
       MATERNIDAD
       ========================================== */

    if (
        tipoLicencia === 'MATERNIDAD'
    ) {

        const fechaProbableParto =
            document.getElementById(
                'fechaProbableParto'
            )?.value;

        const semanasPreparto =
            document.getElementById(
                'semanasPreparto'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioLicencia'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinLicencia'
            )?.value;

        const diasPreparto =
            document.getElementById(
                'diasPreparto'
            )?.value;

        const diasPosparto =
            document.getElementById(
                'diasPosparto'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasLicencia'
            )?.value;


        if (!fechaProbableParto) {

            mostrarMensaje(
                'Debes seleccionar la fecha probable de parto.',
                'error'
            );

            return;
        }


        if (!semanasPreparto) {

            mostrarMensaje(
                'Debes seleccionar las semanas de preparto.',
                'error'
            );

            return;
        }


        if (
            !fechaInicio ||
            !fechaFin
        ) {

            mostrarMensaje(
                'No se pudieron calcular las fechas de la licencia.',
                'error'
            );

            return;
        }


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días no es válida.',
                'error'
            );

            return;
        }


        const motivo =
            `Licencia de maternidad | ` +
            `Fecha probable de parto: ${fechaProbableParto} | ` +
            `Preparto: ${semanasPreparto} semana(s) | ` +
            `Días preparto: ${diasPreparto} | ` +
            `Días posparto: ${diasPosparto}`;


        await registrarLicencia({

            tipoNovedadId:
                opcion.value,

            empleadoId,

            tipoLicencia,

            fechaInicio,

            fechaFin,

            cantidadDias,

            motivo,

            observacion

        });


        return;
    }


    /* ==========================================
       PATERNIDAD
       ========================================== */

    if (
        tipoLicencia === 'PATERNIDAD'
    ) {

        const fechaNacimientoHijo =
            document.getElementById(
                'fechaNacimientoHijo'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioPaternidad'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinPaternidad'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasPaternidad'
            )?.value;


        if (!fechaNacimientoHijo) {

            mostrarMensaje(
                'Debes seleccionar la fecha de nacimiento del hijo.',
                'error'
            );

            return;
        }


        if (!fechaInicio) {

            mostrarMensaje(
                'Debes seleccionar la fecha de inicio.',
                'error'
            );

            return;
        }


        if (!fechaFin) {

            mostrarMensaje(
                'No se pudo calcular la fecha de finalización.',
                'error'
            );

            return;
        }


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días no es válida.',
                'error'
            );

            return;
        }


        const motivo =
            `Licencia de paternidad | ` +
            `Fecha de nacimiento del hijo: ${fechaNacimientoHijo}`;


        await registrarLicencia({

            tipoNovedadId:
                opcion.value,

            empleadoId,

            tipoLicencia,

            fechaInicio,

            fechaFin,

            cantidadDias,

            motivo,

            observacion

        });


        return;
    }


    mostrarMensaje(
        'Debes seleccionar un tipo de licencia válido.',
        'error'
    );

    return;
}
/* ==========================================
   HORAS EXTRA / RECARGOS
   ========================================== */

if (
    codigo.toUpperCase() === 'HORAS_EXTRA' ||
    nombre.toUpperCase().includes('HORA EXTRA') ||
    nombre.toUpperCase().includes('RECARGO')
) {

    console.log(
        '🟢 ENTRÓ AL BLOQUE HORAS EXTRA / RECARGOS'
    );

    camposNovedad.innerHTML = `

        <div class="row g-3">

            <!-- TIPO DE HORA -->
            <div class="col-md-6">

                <label
                    for="tipoHoraExtra"
                    class="form-label"
                >
                    Tipo de hora / recargo
                    <span class="text-danger">*</span>
                </label>

                <select
    id="tipoHoraExtra"
    class="form-select"
    required
>
    <option value="">
        Cargando tipos...
    </option>
</select>

            </div>


            <!-- FECHA -->
            <div class="col-md-6">

                <label
                    for="fechaTrabajoHoraExtra"
                    class="form-label"
                >
                    Fecha de trabajo
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="date"
                    id="fechaTrabajoHoraExtra"
                    class="form-control"
                    required
                >

            </div>


            <!-- HORA INICIO -->
            <div class="col-md-4">

                <label
                    for="horaInicioHoraExtra"
                    class="form-label"
                >
                    Hora de inicio
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="time"
                    id="horaInicioHoraExtra"
                    class="form-control"
                    required
                >

            </div>


            <!-- HORA FIN -->
            <div class="col-md-4">

                <label
                    for="horaFinHoraExtra"
                    class="form-label"
                >
                    Hora de finalización
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="time"
                    id="horaFinHoraExtra"
                    class="form-control"
                    required
                >

            </div>


            <!-- CANTIDAD -->
            <div class="col-md-4">

                <label
                    for="cantidadHorasExtra"
                    class="form-label"
                >
                    Cantidad de horas
                    <span class="text-danger">*</span>
                </label>

                <input
                    type="number"
                    id="cantidadHorasExtra"
                    class="form-control"
                    min="0.01"
                    step="0.01"
                    readonly
                >

                <small class="text-muted">
                    Se calcula automáticamente según la hora de inicio y finalización.
                </small>

            </div>


            <!-- OBSERVACIÓN -->
            <div class="col-12">

                <label
                    for="observacionHoraExtra"
                    class="form-label"
                >
                    Observación
                </label>

                <textarea
                    id="observacionHoraExtra"
                    class="form-control"
                    rows="3"
                    placeholder="Indica el motivo o detalle de las horas trabajadas..."
                ></textarea>

            </div>

        </div>

    `;
 
        /* ==========================================
       CARGAR HORAS EXTRA Y RECARGOS
       ========================================== */

    const tipoHoraExtra =
        document.getElementById('tipoHoraExtra');

    try {

        const [
            respuestaHorasExtra,
            respuestaRecargos
        ] = await Promise.all([

            fetch(
                '/api/nomina/configuracion/horas-extra',
                {
                    credentials: 'include'
                }
            ),

            fetch(
                '/api/nomina/configuracion/recargos',
                {
                    credentials: 'include'
                }
            )

        ]);


        if (!respuestaHorasExtra.ok) {

            throw new Error(
                'No fue posible cargar la configuración de horas extra.'
            );

        }


        if (!respuestaRecargos.ok) {

            throw new Error(
                'No fue posible cargar la configuración de recargos.'
            );

        }


        const datosHorasExtra =
            await respuestaHorasExtra.json();

        const datosRecargos =
            await respuestaRecargos.json();


        const horasExtra =
            Array.isArray(datosHorasExtra)
                ? datosHorasExtra
                : (
                    Array.isArray(datosHorasExtra.data)
                        ? datosHorasExtra.data
                        : []
                );


        const recargos =
            Array.isArray(datosRecargos)
                ? datosRecargos
                : (
                    Array.isArray(datosRecargos.data)
                        ? datosRecargos.data
                        : []
                );


        console.log(
            '⏱️ Horas extra cargadas:',
            horasExtra
        );

        console.log(
            '🌙 Recargos cargados:',
            recargos
        );


        tipoHoraExtra.innerHTML = `
            <option value="">
                Selecciona el tipo de hora o recargo
            </option>
        `;


        /* ==========================================
           HORAS EXTRA
           ========================================== */

        if (horasExtra.length > 0) {

            const grupoHorasExtra =
                document.createElement('optgroup');

            grupoHorasExtra.label =
                'Horas extra';


            horasExtra.forEach(tipo => {

                if (!tipo.codigo || !tipo.nombre) {
                    return;
                }


                const option =
                    document.createElement('option');


                option.value =
                    tipo.codigo;

                option.textContent =
                    tipo.nombre;


                grupoHorasExtra.appendChild(
                    option
                );

            });


            tipoHoraExtra.appendChild(
                grupoHorasExtra
            );

        }


        /* ==========================================
           RECARGOS
           ========================================== */

        if (recargos.length > 0) {

            const grupoRecargos =
                document.createElement('optgroup');

            grupoRecargos.label =
                'Recargos';


            recargos.forEach(recargo => {

                if (
                    !recargo.codigo ||
                    !recargo.nombre
                ) {
                    return;
                }


                const option =
                    document.createElement('option');


                option.value =
                    recargo.codigo;

                option.textContent =
                    recargo.nombre;


                grupoRecargos.appendChild(
                    option
                );

            });


            tipoHoraExtra.appendChild(
                grupoRecargos
            );

        }


        if (
            !horasExtra.length &&
            !recargos.length
        ) {

            tipoHoraExtra.innerHTML = `
                <option value="">
                    No hay tipos configurados
                </option>
            `;

        }

    } catch (error) {

        console.error(
            '❌ Error cargando horas extra y recargos:',
            error
        );


        tipoHoraExtra.innerHTML = `
            <option value="">
                No fue posible cargar los tipos
            </option>
        `;


        mostrarMensaje(
            error.message ||
            'No fue posible cargar la configuración de horas extra y recargos.',
            'error'
        );

    }


    /* ==========================================
       OBTENER CAMPOS
       ========================================== */

    const fechaTrabajo =
        document.getElementById(
            'fechaTrabajoHoraExtra'
        );

    const horaInicio =
        document.getElementById(
            'horaInicioHoraExtra'
        );

    const horaFin =
        document.getElementById(
            'horaFinHoraExtra'
        );

    const cantidadHoras =
        document.getElementById(
            'cantidadHorasExtra'
        );

        


    /* ==========================================
       CALCULAR HORAS
       ========================================== */

    function calcularHorasExtra() {

        if (
            !horaInicio?.value ||
            !horaFin?.value
        ) {

            cantidadHoras.value = '';

            return;
        }


        const [horaInicioValor, minutoInicio] =
            horaInicio.value
                .split(':')
                .map(Number);


        const [horaFinValor, minutoFin] =
            horaFin.value
                .split(':')
                .map(Number);


        const minutosInicio =
            (horaInicioValor * 60) +
            minutoInicio;


        const minutosFin =
            (horaFinValor * 60) +
            minutoFin;


        if (
            minutosFin <=
            minutosInicio
        ) {

            cantidadHoras.value = '';

            horaFin.setCustomValidity(
                'La hora de finalización debe ser posterior a la hora de inicio.'
            );

            return;
        }


        horaFin.setCustomValidity('');


        const diferenciaMinutos =
            minutosFin -
            minutosInicio;


        const horas =
            diferenciaMinutos / 60;


        cantidadHoras.value =
            horas.toFixed(2);

    }


    horaInicio?.addEventListener(
        'change',
        calcularHorasExtra
    );

    horaFin?.addEventListener(
        'change',
        calcularHorasExtra
    );


    /* ==========================================
       MOSTRAR FORMULARIO
       ========================================== */

    formularioNovedadDinamico.style.display =
        'block';

    btnGuardarNovedad.disabled =
        false;

    return;
}

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

        const nombreNovedad =
    opcion.dataset.nombre || '';

    console.log('🔎 TIPO SELECCIONADO:', {
    value: opcion.value,
    codigo: codigo,
    nombre: nombreNovedad,
    texto: opcion.textContent
});


    /* ====================================================
       INCAPACIDAD
       ==================================================== */

    if (
        codigo.toUpperCase() === 'INCAPACIDAD' ||
        nombreNovedad
            .toUpperCase()
            .includes('INCAPACIDAD')
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

        const archivo =
            soporteNovedad?.files?.[0];


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


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días de la incapacidad no es válida.',
                'error'
            );

            return;
        }


        if (!archivo) {

            mostrarMensaje(
                'Debes adjuntar el soporte de la incapacidad.',
                'error'
            );

            return;
        }


        console.log(
            '📎 Soporte seleccionado:',
            archivo
        );


        const tipoNovedadId =
            opcion.value;


        if (!tipoNovedadId) {

            mostrarMensaje(
                'No se pudo identificar el tipo de novedad.',
                'error'
            );

            return;
        }


        const formData =
            new FormData();


        formData.append(
            'tipo_novedad_id',
            tipoNovedadId
        );

        formData.append(
    'empleado_id',
    empleadoAusencia
);

        formData.append(
            'tipo_incapacidad',
            tipoIncapacidad
        );

        formData.append(
            'fecha_inicio',
            fechaInicio
        );

        formData.append(
            'fecha_fin',
            fechaFin
        );

        formData.append(
            'cantidad_dias',
            cantidadDias
        );

        formData.append(
            'observacion',
            observacion || ''
        );

        formData.append(
            'soporte',
            archivo
        );


        try {

            const response =
                await fetch(
                    '/api/nomina/novedades/incapacidad',
                    {
                        method: 'POST',
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    'No fue posible registrar la incapacidad.'
                );
            }


            mostrarMensaje(
                data.message ||
                'La incapacidad fue registrada correctamente y quedó pendiente de aprobación.',
                'success'
            );


            console.log(
                '✅ Incapacidad registrada:',
                data
            );


            setTimeout(() => {
    limpiarFormularioNovedad();
}, 300);


            if (
                typeof cargarNovedades ===
                'function'
            ) {

                await cargarNovedades();
            }


        } catch (error) {

            console.error(
                '❌ Error registrando incapacidad:',
                error
            );


            mostrarMensaje(
                error.message ||
                'No fue posible registrar la incapacidad.',
                'error'
            );
        }


        return;
    }


    /* ====================================================
       PERMISO
       ==================================================== */

    if (
        codigo === 'PERMISO' ||
        (opcion.dataset.nombre || '')
            .toLowerCase()
            .includes('permiso')
    ) {

        const tipoPermiso =
            document.getElementById(
                'tipoPermiso'
            )?.value;

        const fechaPermiso =
            document.getElementById(
                'fechaPermiso'
            )?.value;

        const horaInicio =
            document.getElementById(
                'horaInicioPermiso'
            )?.value;

        const horaFin =
            document.getElementById(
                'horaFinPermiso'
            )?.value;

        const cantidadHoras =
            document.getElementById(
                'cantidadHorasPermiso'
            )?.value;

        const motivo =
            document.getElementById(
                'motivoPermiso'
            )?.value.trim();

        const observacion =
            document.getElementById(
                'observacionPermiso'
            )?.value.trim();


        console.log(
            '📋 Datos permiso:',
            {
                tipoPermiso,
                fechaPermiso,
                horaInicio,
                horaFin,
                cantidadHoras,
                motivo,
                observacion
            }
        );


        /* ==========================================
           VALIDACIONES
           ========================================== */

        if (!tipoPermiso) {

            mostrarMensaje(
                'Selecciona el tipo de permiso.',
                'error'
            );

            return;
        }


        if (!fechaPermiso) {

            mostrarMensaje(
                'Selecciona la fecha del permiso.',
                'error'
            );

            return;
        }


        if (!horaInicio) {

            mostrarMensaje(
                'Selecciona la hora de inicio.',
                'error'
            );

            return;
        }


        if (!horaFin) {

            mostrarMensaje(
                'Selecciona la hora de finalización.',
                'error'
            );

            return;
        }


        if (
            !cantidadHoras ||
            Number(cantidadHoras) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de horas del permiso no es válida.',
                'error'
            );

            return;
        }


        if (!motivo) {

            mostrarMensaje(
                'Debes indicar el motivo del permiso.',
                'error'
            );

            return;
        }


        /* ==========================================
           VALIDAR HORA
           ========================================== */

        const minutosInicio =
            (() => {

                const [h, m] =
                    horaInicio
                        .split(':')
                        .map(Number);

                return (h * 60) + m;

            })();


        const minutosFin =
            (() => {

                const [h, m] =
                    horaFin
                        .split(':')
                        .map(Number);

                return (h * 60) + m;

            })();


        if (
            minutosFin <=
            minutosInicio
        ) {

            mostrarMensaje(
                'La hora de finalización debe ser posterior a la hora de inicio.',
                'error'
            );

            return;
        }


        console.log(
            '✅ Permiso validado correctamente:',
            {
                tipoNovedadId: opcion.value,
                tipoPermiso,
                fechaPermiso,
                horaInicio,
                horaFin,
                cantidadHoras,
                motivo,
                observacion
            }
        );


        /*
         * Por ahora solamente validamos.
         * En el siguiente paso conectaremos
         * el permiso con su ruta del backend.
         */

        try {

    const response = await fetch(
        '/api/nomina/novedades/permiso',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo_novedad_id: opcion.value,
                tipo_permiso: tipoPermiso,
                fecha_permiso: fechaPermiso,
                hora_inicio: horaInicio,
                hora_fin: horaFin,
                cantidad_horas: Number(cantidadHoras),
                motivo: motivo,
                observacion: observacion || null
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message ||
            'No fue posible registrar el permiso.'
        );
    }

    console.log(
        '✅ Permiso registrado correctamente:',
        data
    );

    mostrarMensaje(
        data.message ||
        'El permiso fue registrado correctamente y quedó pendiente de aprobación.',
        'success'
    );

    limpiarFormularioNovedad();

    if (typeof cargarNovedades === 'function') {
        await cargarNovedades();
    }

} catch (error) {

    console.error(
        '❌ Error registrando permiso:',
        error
    );

    mostrarMensaje(
        error.message ||
        'No fue posible registrar el permiso.',
        'error'
    );
}

return;
    }

        /* ====================================================
       AUSENCIA
       ==================================================== */

    if (
        codigo === 'AUSENCIA' ||
        (opcion.dataset.nombre || '')
            .toLowerCase()
            .includes('ausencia') ||
        (opcion.dataset.categoria || '')
            .toLowerCase()
            .includes('ausencia')
    ) {

        const empleadoId =
            document.getElementById('empleadoAusenciaId')?.value;

        const tipoAusencia =
            document.getElementById('tipoAusencia')?.value;

        const fechaInicio =
            document.getElementById('fechaInicioAusencia')?.value;

        const fechaFin =
            document.getElementById('fechaFinAusencia')?.value;

        const cantidadDias =
            document.getElementById('cantidadDiasAusencia')?.value;

        const motivo =
            document.getElementById('motivoAusencia')?.value.trim();

        const observacion =
            document.getElementById('observacionAusencia')?.value.trim();

        const archivo =
            soporteNovedad?.files?.[0];


        console.log('📋 Datos ausencia:', {
            empleadoId,
            tipoAusencia,
            fechaInicio,
            fechaFin,
            cantidadDias,
            motivo,
            observacion,
            archivo
        });


        /* ==========================================
           VALIDACIONES
           ========================================== */

        if (!empleadoId) {
            mostrarMensaje(
                'Debes seleccionar un empleado.',
                'error'
            );
            return;
        }

        if (!tipoAusencia) {
            mostrarMensaje(
                'Selecciona el tipo de ausencia.',
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

        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {
            mostrarMensaje(
                'La cantidad de días de la ausencia no es válida.',
                'error'
            );
            return;
        }

        if (!motivo) {
            mostrarMensaje(
                'Debes indicar el motivo de la ausencia.',
                'error'
            );
            return;
        }


        /* ==========================================
           SOPORTE PARA AUSENCIA JUSTIFICADA
           ========================================== */

        if (
            tipoAusencia === 'JUSTIFICADA' &&
            !archivo
        ) {
            mostrarMensaje(
                'Debes adjuntar el documento de soporte para una ausencia justificada.',
                'error'
            );
            return;
        }


        /* ==========================================
           CREAR FORMDATA
           ========================================== */

        const formData = new FormData();

        formData.append(
            'tipo_novedad_id',
            opcion.value
        );

        formData.append(
            'empleado_id',
            empleadoId
        );

        formData.append(
            'tipo_ausencia',
            tipoAusencia
        );

        formData.append(
            'fecha_inicio',
            fechaInicio
        );

        formData.append(
            'fecha_fin',
            fechaFin
        );

        formData.append(
            'cantidad_dias',
            cantidadDias
        );

        formData.append(
            'motivo',
            motivo
        );

        formData.append(
            'observacion',
            observacion || ''
        );

        if (archivo) {
            formData.append(
                'soporte',
                archivo
            );
        }


        /* ==========================================
           ENVIAR AL BACKEND
           ========================================== */

        try {

            const response = await fetch(
                '/api/nomina/novedades/ausencia',
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    'No fue posible registrar la ausencia.'
                );
            }


            console.log(
                '✅ Ausencia registrada correctamente:',
                data
            );


            mostrarMensaje(
                data.message ||
                'La ausencia fue registrada correctamente y quedó pendiente de aprobación.',
                'success'
            );


            /* ==========================================
               LIMPIAR Y ACTUALIZAR
               ========================================== */

            setTimeout(() => {

                limpiarFormularioNovedad();

            }, 300);


            if (
                typeof cargarNovedades ===
                'function'
            ) {
                await cargarNovedades();
            }


        } catch (error) {

            console.error(
                '❌ Error registrando ausencia:',
                error
            );

            mostrarMensaje(
                error.message ||
                'No fue posible registrar la ausencia.',
                'error'
            );
        }


        return;
    }

    /* ====================================================
   LICENCIA
   ==================================================== */

if (
    codigo.toUpperCase() === 'LICENCIA' ||
    nombreNovedad
        .toUpperCase()
        .includes('LICENCIA')
) {

    const empleadoId =
        document.getElementById(
            'empleadoLicencia'
        )?.value;

    const tipoLicencia =
        document.getElementById(
            'tipoLicencia'
        )?.value;

    const observacion =
        document.getElementById(
            'observacionLicencia'
        )?.value.trim() || '';


    /* ==========================================
       VALIDAR EMPLEADO
       ========================================== */

    if (!empleadoId) {

        mostrarMensaje(
            'Debes seleccionar el empleado.',
            'error'
        );

        return;
    }


    /* ==========================================
       VALIDAR TIPO
       ========================================== */

    if (!tipoLicencia) {

        mostrarMensaje(
            'Debes seleccionar el tipo de licencia.',
            'error'
        );

        return;
    }


    /* ==========================================
       MATERNIDAD
       ========================================== */

    if (
        tipoLicencia === 'MATERNIDAD'
    ) {

        const fechaProbableParto =
            document.getElementById(
                'fechaProbableParto'
            )?.value;

        const semanasPreparto =
            document.getElementById(
                'semanasPreparto'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioLicencia'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinLicencia'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasLicencia'
            )?.value;

        const diasPreparto =
            document.getElementById(
                'diasPreparto'
            )?.value;

        const diasPosparto =
            document.getElementById(
                'diasPosparto'
            )?.value;


        if (!fechaProbableParto) {

            mostrarMensaje(
                'Debes seleccionar la fecha probable de parto.',
                'error'
            );

            return;
        }


        if (!semanasPreparto) {

            mostrarMensaje(
                'Debes seleccionar las semanas de preparto.',
                'error'
            );

            return;
        }


        if (!fechaInicio || !fechaFin) {

            mostrarMensaje(
                'No se pudieron calcular las fechas de la licencia.',
                'error'
            );

            return;
        }


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días de la licencia no es válida.',
                'error'
            );

            return;
        }


        const motivo =
            `Licencia de maternidad | ` +
            `Fecha probable de parto: ${fechaProbableParto} | ` +
            `Preparto: ${semanasPreparto} semana(s) | ` +
            `Días preparto: ${diasPreparto} | ` +
            `Días posparto: ${diasPosparto}`;


        await registrarLicencia({

            tipoNovedadId:
                opcion.value,

            empleadoId,

            tipoLicencia,

            fechaInicio,

            fechaFin,

            cantidadDias,

            motivo,

            observacion

        });


        return;
    }


    /* ==========================================
       PATERNIDAD
       ========================================== */

    if (
        tipoLicencia === 'PATERNIDAD'
    ) {

        const fechaNacimientoHijo =
            document.getElementById(
                'fechaNacimientoHijo'
            )?.value;

        const fechaInicio =
            document.getElementById(
                'fechaInicioPaternidad'
            )?.value;

        const fechaFin =
            document.getElementById(
                'fechaFinPaternidad'
            )?.value;

        const cantidadDias =
            document.getElementById(
                'cantidadDiasPaternidad'
            )?.value;


        if (!fechaNacimientoHijo) {

            mostrarMensaje(
                'Debes seleccionar la fecha de nacimiento del hijo.',
                'error'
            );

            return;
        }


        if (!fechaInicio) {

            mostrarMensaje(
                'Debes seleccionar la fecha de inicio.',
                'error'
            );

            return;
        }


        if (!fechaFin) {

            mostrarMensaje(
                'No se pudo calcular la fecha de finalización.',
                'error'
            );

            return;
        }


        if (
            !cantidadDias ||
            Number(cantidadDias) <= 0
        ) {

            mostrarMensaje(
                'La cantidad de días de la licencia no es válida.',
                'error'
            );

            return;
        }


        const motivo =
            `Licencia de paternidad | ` +
            `Fecha de nacimiento del hijo: ${fechaNacimientoHijo}`;


        await registrarLicencia({

            tipoNovedadId:
                opcion.value,

            empleadoId,

            tipoLicencia,

            fechaInicio,

            fechaFin,

            cantidadDias,

            motivo,

            observacion

        });


        return;
    }

    /* ====================================================
   HORAS EXTRA / RECARGOS
   ==================================================== */

if (
    codigo.toUpperCase() === 'HORAS_EXTRA' ||
    nombreNovedad
        .toUpperCase()
        .includes('HORA EXTRA') ||
    nombreNovedad
        .toUpperCase()
        .includes('RECARGO')
) {

    const tipoHora =
        document.getElementById(
            'tipoHoraExtra'
        )?.value;

    const fechaTrabajo =
        document.getElementById(
            'fechaTrabajoHoraExtra'
        )?.value;

    const horaInicio =
        document.getElementById(
            'horaInicioHoraExtra'
        )?.value;

    const horaFin =
        document.getElementById(
            'horaFinHoraExtra'
        )?.value;

    const cantidadHoras =
        document.getElementById(
            'cantidadHorasExtra'
        )?.value;

    const observacion =
        document.getElementById(
            'observacionHoraExtra'
        )?.value.trim();


    /* ==========================================
       VALIDACIONES
       ========================================== */

    if (!tipoHora) {

        mostrarMensaje(
            'Selecciona el tipo de hora o recargo.',
            'error'
        );

        return;
    }


    if (!fechaTrabajo) {

        mostrarMensaje(
            'Selecciona la fecha de trabajo.',
            'error'
        );

        return;
    }


    if (!horaInicio) {

        mostrarMensaje(
            'Selecciona la hora de inicio.',
            'error'
        );

        return;
    }


    if (!horaFin) {

        mostrarMensaje(
            'Selecciona la hora de finalización.',
            'error'
        );

        return;
    }


    if (
        !cantidadHoras ||
        Number(cantidadHoras) <= 0
    ) {

        mostrarMensaje(
            'La cantidad de horas no es válida.',
            'error'
        );

        return;
    }


    /* ==========================================
       VALIDAR HORARIO
       ========================================== */

    const [horaInicioNumero, minutoInicio] =
        horaInicio
            .split(':')
            .map(Number);

    const [horaFinNumero, minutoFin] =
        horaFin
            .split(':')
            .map(Number);


    const minutosInicio =
        (horaInicioNumero * 60) +
        minutoInicio;

    const minutosFin =
        (horaFinNumero * 60) +
        minutoFin;


    if (
        minutosFin <=
        minutosInicio
    ) {

        mostrarMensaje(
            'La hora de finalización debe ser posterior a la hora de inicio.',
            'error'
        );

        return;
    }


    /* ==========================================
       ENVIAR AL BACKEND
       ========================================== */

    try {

        const response =
            await fetch(
                '/api/nomina/novedades/horas-extra',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        tipo_novedad_id:
                            opcion.value,

                        tipo_hora:
                            tipoHora,

                        fecha_trabajo:
                            fechaTrabajo,

                        hora_inicio:
                            horaInicio,

                        hora_fin:
                            horaFin,

                        cantidad_horas:
                            Number(cantidadHoras),

                        observacion:
                            observacion || null

                    })
                }
            );


        const data =
    await response.json();

console.log(
    '📥 RESPUESTA HORAS EXTRA:',
    {
        status: response.status,
        ok: response.ok,
        data: data
    }
);

if (
    !response.ok ||
    !data.success
) {
            throw new Error(
                data.message ||
                'No fue posible registrar las horas extra.'
            );

        }


        console.log(
    '✅ Horas extra / recargo registrado:',
    data
);

/* ==========================================
   MOSTRAR MENSAJE DE ÉXITO
   ========================================== */

mostrarMensaje(
    data.message ||
    'La hora extra o recargo fue registrado correctamente y quedó pendiente de aprobación.',
    'success'
);


/* ==========================================
   ACTUALIZAR LISTADO
   ========================================== */

await cargarNovedades();


/* ==========================================
   VOLVER A REGISTRAR NOVEDAD
   ========================================== */

setTimeout(async () => {

    await abrirRegistroNovedad();

}, 800);

    } catch (error) {

    console.error(
        '❌ Error registrando horas extra / recargo:',
        error
    );

    // Cerrar el modal para poder visualizar el mensaje
    const modalElement =
        document.getElementById('modalRegistrarNovedad');

    if (modalElement) {

        const modalActual =
            bootstrap.Modal.getInstance(modalElement) ||
            bootstrap.Modal.getOrCreateInstance(modalElement);

        modalActual.hide();
    }

    // Mostrar el error claramente
    setTimeout(() => {

        mostrarMensaje(
            error.message ||
            'No fue posible registrar las horas extra o recargo.',
            'error'
        );

    }, 300);

}


    return;
}


    /* ====================================================
       OTROS TIPOS
       ==================================================== */

    mostrarMensaje(
        'El guardado de este tipo de novedad todavía está pendiente de implementar.',
        'error'
    );
}
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

    // Eliminar alerta anterior si existe
    const alertaAnterior =
        document.querySelector(
            '.alerta-novedades'
        );

    if (alertaAnterior) {
        alertaAnterior.remove();
    }


    // Crear alerta
    const alerta =
        document.createElement('div');

    alerta.className =
        `alerta-novedades alerta-${tipo}`;


    // Icono según el tipo
    let icono = '✓';

    if (tipo === 'error') {
        icono = '✕';
    }

    else if (tipo === 'warning') {
        icono = '⚠';
    }

    else if (tipo === 'info') {
        icono = 'ⓘ';
    }


    alerta.innerHTML = `
        <div class="alerta-novedades-icono">
            ${icono}
        </div>

        <div class="alerta-novedades-contenido">
            ${mensaje}
        </div>

        <button
            type="button"
            class="alerta-novedades-cerrar"
            aria-label="Cerrar"
        >
            ×
        </button>
    `;


    // Agregar al documento
    document.body.appendChild(
        alerta
    );


    // Mostrar con animación
    requestAnimationFrame(() => {

        alerta.classList.add(
            'mostrar'
        );

    });


    // Botón cerrar
    const botonCerrar =
        alerta.querySelector(
            '.alerta-novedades-cerrar'
        );

    botonCerrar.addEventListener(
        'click',
        () => {

            cerrarAlertaNovedades(
                alerta
            );

        }
    );


    // Cerrar automáticamente
    setTimeout(() => {

        cerrarAlertaNovedades(
            alerta
        );

    }, 5000);
}


/* ============================================================
   CERRAR ALERTA
   ============================================================ */

function cerrarAlertaNovedades(
    alerta
) {

    if (!alerta) {
        return;
    }

    alerta.classList.remove(
        'mostrar'
    );


    setTimeout(() => {

        if (alerta.parentNode) {

            alerta.remove();

        }

    }, 300);
}

});