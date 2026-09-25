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

    function abrirRegistroNovedad() {

        /*
         * Todavía no existe en el HTML un modal
         * de registro.
         *
         * Por ahora dejamos preparado el punto
         * de entrada.
         */

        console.log(
            '➕ Abrir registro de novedad'
        );


        /*
         * En el siguiente paso conectaremos
         * este botón con el modal de registro.
         */

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