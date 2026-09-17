/* ============================================================
   PRÉSTAMOS - PROCESADOS MARGARITA
   JavaScript de interfaz
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    console.log('💰 Módulo de Préstamos cargado');


    /* ========================================================
       ELEMENTOS PRINCIPALES
       ======================================================== */

    const btnNuevoPrestamo =
        document.getElementById('btnNuevoPrestamo');

    const modalElement =
        document.getElementById('modalNuevoPrestamo');

    const buscarPrestamo =
        document.getElementById('buscarPrestamo');

    const btnLimpiarFiltros =
        document.getElementById('btnLimpiarFiltros');

    const cantidadPrestamos =
        document.getElementById('cantidadPrestamos');

    const prestamosList =
        document.getElementById('prestamosList');

    const prestamosVacio =
        document.getElementById('prestamosVacio');


        let prestamosDatos = [];

    const btnGuardarPrestamo =
        document.getElementById('btnGuardarPrestamo');

    const tieneInteres =
        document.getElementById('tieneInteres');

    const contenedorPorcentajeInteres =
        document.getElementById('contenedorPorcentajeInteres');

        /* ========================================================
   CARGAR EMPLEADOS
   ======================================================== */

           let empleadosPrestamo = [];

async function cargarEmpleados() {

    const empleadoPrestamo =
        document.getElementById('empleadoPrestamo');

    if (!empleadoPrestamo) {
        return;
    }

    try {

        const respuesta =
            await fetch('/nomina/prestamos/empleados');

        const resultado =
            await respuesta.json();

        if (!respuesta.ok || !resultado.ok) {

            throw new Error(
                resultado.error ||
                'No fue posible cargar los empleados.'
            );

        }

        // Limpiar empleados de demostración
        empleadoPrestamo.innerHTML = `
            <option value="">
                Seleccione un empleado...
            </option>
        `;

        // Cargar empleados reales
        resultado.empleados.forEach(empleado => {

            const opcion =
                document.createElement('option');

            opcion.value = empleado.id;

            opcion.textContent =
                `${empleado.nombre} - ${empleado.tipo_documento} ${empleado.numero_documento}`;

            empleadoPrestamo.appendChild(opcion);

        });

        empleadosPrestamo = resultado.empleados;

        console.log(
            `✅ ${resultado.empleados.length} empleados cargados`
        );

    } catch (error) {

        console.error(
            '❌ Error cargando empleados:',
            error
        );

        empleadoPrestamo.innerHTML = `
            <option value="">
                No fue posible cargar los empleados
            </option>
        `;

    }

}

/* ========================================================
   BUSCAR EMPLEADOS
   ======================================================== */

function buscarEmpleadosPrestamo() {

    const buscador =
        document.getElementById('buscadorEmpleadoPrestamo');

    const resultados =
        document.getElementById('resultadosEmpleadosPrestamo');

    if (!buscador || !resultados) {
        return;
    }

    const texto =
        buscador.value
            .trim()
            .toLowerCase();

    resultados.innerHTML = '';

    if (!texto) {

        resultados.hidden = true;
        return;

    }

    const empleadosFiltrados =
        empleadosPrestamo.filter(empleado => {

            const nombre =
                (empleado.nombre || '')
                    .toLowerCase();

            const documento =
                (empleado.numero_documento || '')
                    .toLowerCase();

            const codigo =
                (empleado.codigo || '')
                    .toLowerCase();

            return (
                nombre.includes(texto) ||
                documento.includes(texto) ||
                codigo.includes(texto)
            );

        });

    if (empleadosFiltrados.length === 0) {

        resultados.innerHTML = `
            <div class="resultado-empleado-vacio">
                <i class="fas fa-user-slash"></i>
                <span>No se encontraron empleados</span>
            </div>
        `;

        resultados.hidden = false;
        return;

    }

    empleadosFiltrados.forEach(empleado => {

        const item =
            document.createElement('button');

        item.type = 'button';
        item.className = 'resultado-empleado';

        item.innerHTML = `
            <div class="resultado-empleado-icono">
                <i class="fas fa-user"></i>
            </div>

            <div class="resultado-empleado-info">

                <strong>
                    ${empleado.nombre}
                </strong>

                <span>
                    ${empleado.tipo_documento || ''} ${empleado.numero_documento || ''}
                </span>

            </div>
        `;

        item.addEventListener('click', () => {

            seleccionarEmpleadoPrestamo(empleado);

        });

        resultados.appendChild(item);

    });

    resultados.hidden = false;

}

function seleccionarEmpleadoPrestamo(empleado) {

    const buscador =
        document.getElementById('buscadorEmpleadoPrestamo');

    const empleadoId =
        document.getElementById('empleadoPrestamo');

    const resultados =
        document.getElementById('resultadosEmpleadosPrestamo');

    if (!buscador || !empleadoId) {
        return;
    }

    buscador.value =
        empleado.nombre;

    empleadoId.value =
        empleado.id;

    if (resultados) {
        resultados.hidden = true;
    }

    console.log(
        '👤 Empleado seleccionado:',
        empleado.nombre,
        'ID:',
        empleado.id
    );

}


    /* ========================================================
       MODAL
       ======================================================== */

    let modalNuevoPrestamo = null;

    if (modalElement) {

        modalNuevoPrestamo =
            new bootstrap.Modal(modalElement);

    }


    /* ========================================================
       ABRIR MODAL NUEVO PRÉSTAMO
       ======================================================== */

    if (btnNuevoPrestamo) {

        btnNuevoPrestamo.addEventListener('click', () => {

            limpiarFormulario();

            establecerFechaActual();

            if (modalNuevoPrestamo) {

                modalNuevoPrestamo.show();

            }

        });

    }


    /* ========================================================
       INTERÉS
       ======================================================== */

    if (tieneInteres) {

        tieneInteres.addEventListener('change', () => {

            if (tieneInteres.checked) {

                contenedorPorcentajeInteres.hidden = false;

            } else {

                contenedorPorcentajeInteres.hidden = true;

                const porcentaje =
                    document.getElementById(
                        'porcentajeInteres'
                    );

                if (porcentaje) {

                    porcentaje.value = '';

                }

            }

        });

    }


    /* ========================================================
       BUSCADOR
       ======================================================== */

    if (buscarPrestamo) {

        buscarPrestamo.addEventListener('input', () => {

            aplicarFiltros();

        });

    }


    /* ========================================================
       FILTROS POR ESTADO
       ======================================================== */

    const filtros =
        document.querySelectorAll(
            '.filtro-prestamo'
        );

    filtros.forEach(filtro => {

        filtro.addEventListener('click', () => {

            filtros.forEach(item => {

                item.classList.remove('active');

            });

            filtro.classList.add('active');

            aplicarFiltros();

        });

    });


    /* ========================================================
       LIMPIAR FILTROS
       ======================================================== */

    if (btnLimpiarFiltros) {

        btnLimpiarFiltros.addEventListener('click', () => {

            if (buscarPrestamo) {

                buscarPrestamo.value = '';

            }

            filtros.forEach(filtro => {

                filtro.classList.remove('active');

            });

            const filtroTodos =
                document.querySelector(
                    '.filtro-prestamo[data-estado="TODOS"]'
                );

            if (filtroTodos) {

                filtroTodos.classList.add('active');

            }

            aplicarFiltros();

        });

    }

    /* ========================================================
   CARGAR PRÉSTAMOS DESDE LA BASE DE DATOS
   ======================================================== */

async function cargarPrestamos() {

    if (!prestamosList) {
        return;
    }

    try {

        const respuesta =
            await fetch('/nomina/prestamos/lista');

        const resultado =
            await respuesta.json();

        if (!respuesta.ok || !resultado.ok) {

            throw new Error(
                resultado.error ||
                'No fue posible cargar los préstamos.'
            );

        }

        prestamosDatos =
            resultado.prestamos || [];

        renderizarPrestamos(prestamosDatos);

        actualizarIndicadoresPrestamos(prestamosDatos);

        aplicarFiltros();

        console.log(
            `✅ ${prestamosDatos.length} préstamos cargados`
        );

    } catch (error) {

        console.error(
            '❌ Error cargando préstamos:',
            error
        );

        prestamosList.innerHTML = '';

        mostrarEstadoVacio(true);

        actualizarContador(0);

    }

}

/* ========================================================
   RENDERIZAR PRÉSTAMOS
   ======================================================== */

function renderizarPrestamos(prestamos) {

    if (!prestamosList) {
        return;
    }

    prestamosList.innerHTML = '';

    prestamos.forEach((prestamo, indice) => {

        const tarjeta =
            document.createElement('article');

        const totalObligacion =
            Number(prestamo.valor_prestamo || 0) +
            Number(prestamo.valor_interes || 0);

        const saldo =
            Number(prestamo.saldo_pendiente || 0);

        const pagado =
            Math.max(
                totalObligacion - saldo,
                0
            );

        const porcentaje =
            totalObligacion > 0
                ? Math.min(
                    Math.round(
                        (pagado / totalObligacion) * 100
                    ),
                    100
                )
                : 0;

        const claseColor =
            indice % 2 === 0
                ? ''
                : ' prestamo-morado';

        const claseProgreso =
            indice % 2 === 0
                ? 'verde'
                : 'morado';

        const nombre =
            prestamo.empleado || 'Empleado';

        const documento =
            `${prestamo.tipo_documento || 'CC'} ${prestamo.numero_documento || ''}`;

        const numeroPrestamo =
            String(prestamo.id).padStart(4, '0');

        const estadoTexto =
            obtenerTextoEstado(prestamo.estado);

        const estadoClase =
            obtenerClaseEstado(prestamo.estado);

        const interesTexto =
            Number(prestamo.tiene_interes)
                ? `${Number(prestamo.porcentaje_interes || 0).toLocaleString('es-CO')}%`
                : 'Sin interés';

        const fechaProxima =
            formatearFechaPrestamo(
                prestamo.proxima_cuota_fecha
            );

        const diasProxima =
            calcularDiasProximaCuota(
                prestamo.proxima_cuota_fecha
            );

        const proximaCuota =
            prestamo.proxima_cuota_fecha
                ? `
                    <strong>${fechaProxima}</strong>
                    <small>
                        ${diasProxima}
                    </small>
                  `
                : `
                    <strong>Sin cuotas</strong>
                    <small>
                        Préstamo finalizado
                    </small>
                  `;

        tarjeta.className =
            `prestamo-card${claseColor}`;

        tarjeta.dataset.estado =
            prestamo.estado || '';

        tarjeta.dataset.empleado =
            nombre.toLowerCase();

        tarjeta.dataset.documento =
            String(
                prestamo.numero_documento || ''
            ).toLowerCase();

        tarjeta.dataset.prestamo =
            numeroPrestamo;

        tarjeta.innerHTML = `

            <!-- PERSONA -->

            <div class="prestamo-persona">

                <div class="prestamo-avatar ${indice % 2 === 0 ? '' : 'morado'}">
                    ${obtenerIniciales(nombre)}
                </div>

                <div class="prestamo-persona-info">

                    <div class="prestamo-nombre-linea">
                        <h3>
                            ${nombre}
                        </h3>
                    </div>

                    <span class="prestamo-documento">
                        ${documento}
                    </span>

                    <span class="prestamo-numero">
                        Préstamo #${numeroPrestamo}
                    </span>

                    <span class="estado-prestamo ${estadoClase}">
                        <i class="fas fa-circle"></i>
                        ${estadoTexto}
                    </span>

                </div>

            </div>


            <!-- VALOR -->

            <div class="prestamo-info">

                <span>
                    Valor inicial
                </span>

                <strong>
                    ${formatearMoneda(prestamo.valor_prestamo)}
                </strong>

            </div>


            <!-- INTERÉS -->

            <div class="prestamo-info">

                <span>
                    Interés
                </span>

                <strong>
                    ${interesTexto}
                </strong>

            </div>


            <!-- CUOTA -->

            <div class="prestamo-info">

                <span>
                    Valor de cuota
                </span>

                <strong>
                    ${prestamo.proxima_cuota_valor
                        ? formatearMoneda(
                            prestamo.proxima_cuota_valor
                        )
                        : '—'}
                </strong>

                <small>
                    ${prestamo.periodicidad || '—'}
                </small>

            </div>


            <!-- PROGRESO -->

            <div class="prestamo-progreso">

                <div class="progreso-cabecera">

                    <div>

                        <span>
                            Saldo pendiente
                        </span>

                        <strong>
                            ${formatearMoneda(saldo)}
                        </strong>

                    </div>

                    <span class="progreso-porcentaje ${indice % 2 === 0 ? '' : 'morado-text'}">
                        ${porcentaje}%
                    </span>

                </div>


                <div class="progreso-barra">

                    <div
                        class="progreso-fill ${claseProgreso}"
                        style="width: ${porcentaje}%"
                    ></div>

                </div>


                <div class="progreso-pie">

                    <span>
                        ${formatearMoneda(pagado)} pagados
                    </span>

                    <span>
                        de ${formatearMoneda(totalObligacion)}
                    </span>

                </div>

            </div>


            <!-- GRÁFICA CIRCULAR -->

            <div class="progreso-circular">

                <div
                    class="circular-chart ${claseProgreso}"
                    style="--progreso: ${porcentaje}%"
                >

                    <div class="circular-centro">

                        <strong>
                            ${porcentaje}%
                        </strong>

                        <span>
                            pagado
                        </span>

                    </div>

                </div>

            </div>


            <!-- PRÓXIMA CUOTA -->

            <div class="proxima-cuota">

                <div class="proxima-cuota-icon">
                    <i class="fas fa-calendar-days"></i>
                </div>

                <div>

                    <span>
                        Próxima cuota
                    </span>

                    ${proximaCuota}

                </div>

            </div>


            <!-- ACCIONES -->

            <div class="prestamo-acciones">

                <button
                    type="button"
                    class="btn-menu-prestamo"
                    title="Más opciones"
                >
                    <i class="fas fa-ellipsis"></i>
                </button>

                <button
                    type="button"
                    class="btn-ver-prestamo"
                    data-prestamo-id="${prestamo.id}"
                >
                    Ver préstamo

                    <i class="fas fa-arrow-right"></i>
                </button>

            </div>

        `;

        prestamosList.appendChild(tarjeta);

    });

}

/* ========================================================
   FUNCIONES AUXILIARES DE PRÉSTAMOS
   ======================================================== */

function obtenerIniciales(nombre) {

    return String(nombre || '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(parte => parte.charAt(0).toUpperCase())
        .join('');

}


function obtenerTextoEstado(estado) {

    const estados = {
        ACTIVO: 'Activo',
        PAGADO: 'Pagado',
        CANCELADO: 'Cancelado',
        ANULADO: 'Anulado'
    };

    return estados[estado] || estado || 'Sin estado';

}


function obtenerClaseEstado(estado) {

    const clases = {
        ACTIVO: 'activo',
        PAGADO: 'pagado',
        CANCELADO: 'cancelado',
        ANULADO: 'anulado'
    };

    return clases[estado] || '';

}


function formatearFechaPrestamo(fecha) {

    if (!fecha) {
        return 'Sin fecha';
    }

    const fechaObj =
        new Date(fecha);

    if (Number.isNaN(fechaObj.getTime())) {
        return 'Sin fecha';
    }

    return fechaObj.toLocaleDateString(
        'es-CO',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );

}


function calcularDiasProximaCuota(fecha) {

    if (!fecha) {
        return 'Sin cuotas pendientes';
    }

    const hoy =
        new Date();

    hoy.setHours(0, 0, 0, 0);

    const fechaCuota =
        new Date(fecha);

    fechaCuota.setHours(0, 0, 0, 0);

    const diferencia =
        Math.ceil(
            (
                fechaCuota - hoy
            ) /
            (1000 * 60 * 60 * 24)
        );

    if (diferencia < 0) {
        return `Vencida hace ${Math.abs(diferencia)} días`;
    }

    if (diferencia === 0) {
        return 'Vence hoy';
    }

    if (diferencia === 1) {
        return 'En 1 día';
    }

    return `En ${diferencia} días`;

}

/* ========================================================
   ACTUALIZAR INDICADORES
   ======================================================== */

function actualizarIndicadoresPrestamos(prestamos) {

    const totalPrestamosActivos =
        document.getElementById(
            'totalPrestamosActivos'
        );

    const capitalPrestado =
        document.getElementById(
            'capitalPrestado'
        );

    const saldoPendiente =
        document.getElementById(
            'saldoPendiente'
        );

    const cuotasPendientes =
        document.getElementById(
            'cuotasPendientes'
        );


    const activos =
        prestamos.filter(
            prestamo =>
                prestamo.estado === 'ACTIVO'
        ).length;


    const capital =
        prestamos.reduce(
            (total, prestamo) =>
                total +
                Number(
                    prestamo.valor_prestamo || 0
                ),
            0
        );


    const saldo =
        prestamos.reduce(
            (total, prestamo) =>
                total +
                Number(
                    prestamo.saldo_pendiente || 0
                ),
            0
        );


    const cuotas =
        prestamos.reduce(
            (total, prestamo) =>
                total +
                Number(
                    prestamo.total_cuotas || 0
                ) -
                Number(
                    prestamo.cuotas_pagadas || 0
                ),
            0
        );


    if (totalPrestamosActivos) {
        totalPrestamosActivos.textContent =
            activos;
    }

    if (capitalPrestado) {
        capitalPrestado.textContent =
            formatearMoneda(capital);
    }

    if (saldoPendiente) {
        saldoPendiente.textContent =
            formatearMoneda(saldo);
    }

    if (cuotasPendientes) {
        cuotasPendientes.textContent =
            cuotas;
    }

}

/* ========================================================
   ACTUALIZAR INDICADORES
   ======================================================== */

async function actualizarIndicadoresPrestamos(prestamos) {

    const totalPrestamosActivos =
        document.getElementById(
            'totalPrestamosActivos'
        );

    const capitalPrestado =
        document.getElementById(
            'capitalPrestado'
        );

    const saldoPendiente =
        document.getElementById(
            'saldoPendiente'
        );

    const cuotasPendientes =
        document.getElementById(
            'cuotasPendientes'
        );


    /* ====================================================
       VALORES ACTUALES
       ==================================================== */

    const activos =
        prestamos.filter(
            prestamo =>
                prestamo.estado === 'ACTIVO'
        ).length;


    const capital =
        prestamos.reduce(
            (total, prestamo) =>
                total +
                Number(
                    prestamo.valor_prestamo || 0
                ),
            0
        );


    const saldo =
        prestamos.reduce(
            (total, prestamo) =>
                total +
                Number(
                    prestamo.saldo_pendiente || 0
                ),
            0
        );


    const cuotas =
        prestamos.reduce(
            (total, prestamo) =>
                total +
                Number(
                    prestamo.total_cuotas || 0
                ) -
                Number(
                    prestamo.cuotas_pagadas || 0
                ),
            0
        );


    /* ====================================================
       ACTUALIZAR VALORES PRINCIPALES
       ==================================================== */

    if (totalPrestamosActivos) {

        totalPrestamosActivos.textContent =
            activos;

    }


    if (capitalPrestado) {

        capitalPrestado.textContent =
            formatearMoneda(capital);

    }


    if (saldoPendiente) {

        saldoPendiente.textContent =
            formatearMoneda(saldo);

    }


    if (cuotasPendientes) {

        cuotasPendientes.textContent =
            cuotas;

    }


    /* ====================================================
       OBTENER COMPARACIÓN CON EL MES ANTERIOR
       ==================================================== */

    try {

        const respuesta =
            await fetch(
                '/nomina/prestamos/indicadores'
            );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok || !resultado.ok) {

            throw new Error(
                resultado.error ||
                'No fue posible obtener los indicadores.'
            );

        }


        const indicadores =
            resultado.indicadores;

            actualizarMiniGraficas(resultado.historico);


        /* ================================================
           PRÉSTAMOS ACTIVOS
           ================================================ */

        actualizarVariacionKPI(
            'variacionPrestamosActivos',
            'porcentajePrestamosActivos',
            indicadores.prestamos_activos.variacion
        );


        /* ================================================
           CAPITAL DESEMBOLSADO
           ================================================ */

        actualizarVariacionKPI(
            'variacionCapitalDesembolsado',
            'porcentajeCapitalDesembolsado',
            indicadores.capital_desembolsado.variacion
        );


        /* ================================================
           SALDO POR COBRAR
           ================================================ */

        actualizarVariacionKPI(
            'variacionSaldoPorCobrar',
            'porcentajeSaldoPorCobrar',
            indicadores.saldo_por_cobrar.variacion
        );


        /* ================================================
           CUOTAS PENDIENTES
           ================================================ */

        actualizarVariacionKPI(
            'variacionCuotasPendientes',
            'porcentajeCuotasPendientes',
            indicadores.cuotas_pendientes.variacion
        );


    } catch (error) {

        console.error(
            '❌ Error actualizando variaciones:',
            error
        );

    }

}


/* ========================================================
   ACTUALIZAR UNA VARIACIÓN KPI
   ======================================================== */

function actualizarVariacionKPI(
    idContenedor,
    idPorcentaje,
    variacion
) {

    const contenedor =
        document.getElementById(
            idContenedor
        );

    const porcentaje =
        document.getElementById(
            idPorcentaje
        );


    if (!contenedor || !porcentaje) {
        return;
    }


    const icono =
        contenedor.querySelector('i');


    const valor =
        Number(variacion || 0);


    /* ====================================================
       LIMPIAR ESTADOS ANTERIORES
       ==================================================== */

    contenedor.classList.remove(
        'positiva',
        'negativa'
    );


    /* ====================================================
       AUMENTÓ
       ==================================================== */

    if (valor > 0) {

        contenedor.classList.add(
            'positiva'
        );


        if (icono) {

            icono.className =
                'fas fa-arrow-trend-up';

        }


        porcentaje.textContent =
            `+${valor}%`;

    }


    /* ====================================================
       DISMINUYÓ
       ==================================================== */

    else if (valor < 0) {

        contenedor.classList.add(
            'negativa'
        );


        if (icono) {

            icono.className =
                'fas fa-arrow-trend-down';

        }


        porcentaje.textContent =
            `${valor}%`;

    }


    /* ====================================================
       NO HUBO CAMBIO
       ==================================================== */

    else {

        if (icono) {

            icono.className =
                'fas fa-minus';

        }


        porcentaje.textContent =
            '0%';

    }

}

/* ========================================================
   ACTUALIZAR MINI GRÁFICAS
   ======================================================== */

function actualizarMiniGraficas(historico) {

    if (!Array.isArray(historico) || historico.length === 0) {
        return;
    }

    const graficas = [
        {
            valores: historico.map(item =>
                Number(item.prestamos_activos || 0)
            ),
            linea: 'graficaLineaPrestamosActivos',
            area: 'graficaAreaPrestamosActivos'
        },
        {
            valores: historico.map(item =>
                Number(item.capital_desembolsado || 0)
            ),
            linea: 'graficaLineaCapitalDesembolsado',
            area: 'graficaAreaCapitalDesembolsado'
        },
        {
            valores: historico.map(item =>
                Number(item.saldo_por_cobrar || 0)
            ),
            linea: 'graficaLineaSaldoPorCobrar',
            area: 'graficaAreaSaldoPorCobrar'
        },
        {
            valores: historico.map(item =>
                Number(item.cuotas_pendientes || 0)
            ),
            linea: 'graficaLineaCuotasPendientes',
            area: 'graficaAreaCuotasPendientes'
        }
    ];

    graficas.forEach(grafica => {

        const linea =
            document.getElementById(grafica.linea);

        const area =
            document.getElementById(grafica.area);

        if (!linea || !area) {
            return;
        }

        const valores = grafica.valores;

        if (!valores.length) {
            return;
        }

        const ancho = 150;
        const alto = 55;
        const margen = 5;

        const maximo =
            Math.max(...valores);

        const minimo =
            Math.min(...valores);

        const rango =
            maximo - minimo;

        const puntos = valores.map((valor, indice) => {

            const x =
                valores.length === 1
                    ? ancho / 2
                    : (indice / (valores.length - 1)) * ancho;

            let y;

            if (rango === 0) {

                y = alto / 2;

            } else {

                y =
                    alto -
                    margen -
                    (
                        (valor - minimo) /
                        rango
                    ) *
                    (alto - margen * 2);

            }

            return {
                x,
                y
            };

        });

        /*
         * Generar línea
         */

        let rutaLinea = '';

        puntos.forEach((punto, indice) => {

            if (indice === 0) {

                rutaLinea =
                    `M${punto.x} ${punto.y}`;

            } else {

                rutaLinea +=
                    ` L${punto.x} ${punto.y}`;

            }

        });

        /*
         * Generar área debajo de la línea
         */

        const ultimo =
            puntos[puntos.length - 1];

        const primero =
            puntos[0];

        const rutaArea =
            `${rutaLinea} ` +
            `L${ultimo.x} ${alto} ` +
            `L${primero.x} ${alto} Z`;

        linea.setAttribute(
            'd',
            rutaLinea
        );

        area.setAttribute(
            'd',
            rutaArea
        );

    });

}


    /* ========================================================
       APLICAR FILTROS
       ======================================================== */

    function aplicarFiltros() {

        if (!prestamosList) {
            return;
        }


        const textoBusqueda =
            buscarPrestamo
                ? buscarPrestamo.value
                    .trim()
                    .toLowerCase()
                : '';


        const filtroActivo =
            document.querySelector(
                '.filtro-prestamo.active'
            );


        const estadoSeleccionado =
            filtroActivo
                ? filtroActivo.dataset.estado
                : 'TODOS';


        const prestamos =
            prestamosList.querySelectorAll(
                '.prestamo-card'
            );


        let visibles = 0;


        prestamos.forEach(prestamo => {

            const empleado =
                prestamo.dataset.empleado || '';

            const documento =
                prestamo.dataset.documento || '';

            const numero =
                prestamo.dataset.prestamo || '';

            const estado =
                prestamo.dataset.estado || '';


            const coincideBusqueda =
                !textoBusqueda ||
                empleado.includes(textoBusqueda) ||
                documento.includes(textoBusqueda) ||
                numero.includes(textoBusqueda);


            const coincideEstado =
                estadoSeleccionado === 'TODOS' ||
                estado === estadoSeleccionado;


            const mostrar =
                coincideBusqueda &&
                coincideEstado;


            if (mostrar) {

                prestamo.style.display = '';

                visibles++;

            } else {

                prestamo.style.display = 'none';

            }

        });


        actualizarContador(visibles);

        mostrarEstadoVacio(visibles === 0);

    }


    /* ========================================================
       CONTADOR
       ======================================================== */

    function actualizarContador(cantidad) {

        if (!cantidadPrestamos) {
            return;
        }


        cantidadPrestamos.textContent =
            cantidad === 1
                ? '1 registro'
                : `${cantidad} registros`;

    }


    /* ========================================================
       ESTADO VACÍO
       ======================================================== */

    function mostrarEstadoVacio(mostrar) {

        if (!prestamosVacio) {
            return;
        }

        prestamosVacio.hidden = !mostrar;

    }


    /* ========================================================
   BOTONES "VER PRÉSTAMO"
   ======================================================== */

const modalDetalleElement =
    document.getElementById(
        'modalDetallePrestamo'
    );

let modalDetallePrestamo = null;

if (modalDetalleElement) {

    modalDetallePrestamo =
        new bootstrap.Modal(
            modalDetalleElement
        );

}


document.addEventListener('click', async event => {

    const boton =
        event.target.closest(
            '.btn-ver-prestamo'
        );


    if (!boton) {
        return;
    }


    const prestamoId =
        boton.dataset.prestamoId;


    if (!prestamoId) {

        mostrarMensaje(
            'No fue posible identificar el préstamo.',
            'error'
        );

        return;

    }


    /* ====================================================
       ELEMENTOS DEL DETALLE
       ==================================================== */

    const cargando =
        document.getElementById(
            'detallePrestamoCargando'
        );

    const contenido =
        document.getElementById(
            'detallePrestamoContenido'
        );


    const titulo =
        document.getElementById(
            'detallePrestamoTitulo'
        );


    /* ====================================================
       MOSTRAR MODAL
       ==================================================== */

    if (modalDetallePrestamo) {

        modalDetallePrestamo.show();

    }


    if (cargando) {

        cargando.hidden = false;

    }


    if (contenido) {

        contenido.hidden = true;

    }


    try {

        /* ================================================
           CONSULTAR DETALLE
           ================================================ */

        const respuesta =
            await fetch(
                `/nomina/prestamos/${prestamoId}`
            );


        const resultado =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !resultado.ok
        ) {

            throw new Error(
                resultado.error ||
                'No fue posible consultar el préstamo.'
            );

        }


        const prestamo =
            resultado.prestamo;


        const cuotas =
            resultado.cuotas || [];


        const movimientos =
            resultado.movimientos || [];


        /* ================================================
           TÍTULO
           ================================================ */

        if (titulo) {

            titulo.textContent =
                `Préstamo #${String(prestamo.id).padStart(4, '0')}`;

        }


        /* ================================================
           INFORMACIÓN EMPLEADO
           ================================================ */

        const detalleEmpleado =
            document.getElementById(
                'detalleEmpleado'
            );

        const detalleDocumento =
            document.getElementById(
                'detalleDocumento'
            );

        const detalleEstado =
            document.getElementById(
                'detalleEstado'
            );


        if (detalleEmpleado) {

            detalleEmpleado.textContent =
                prestamo.empleado ||
                'Sin empleado';

        }


        if (detalleDocumento) {

            detalleDocumento.textContent =
                `${prestamo.tipo_documento || 'CC'} ${prestamo.numero_documento || ''}`;

        }


        if (detalleEstado) {

            detalleEstado.textContent =
                obtenerTextoEstado(
                    prestamo.estado
                );

        }


        /* ================================================
           INFORMACIÓN FINANCIERA
           ================================================ */

        const detalleValorPrestamo =
            document.getElementById(
                'detalleValorPrestamo'
            );

        const detalleInteres =
            document.getElementById(
                'detalleInteres'
            );

        const detalleSaldo =
            document.getElementById(
                'detalleSaldo'
            );

        const detalleDesembolso =
            document.getElementById(
                'detalleDesembolso'
            );


        if (detalleValorPrestamo) {

            detalleValorPrestamo.textContent =
                formatearMoneda(
                    prestamo.valor_prestamo
                );

        }


        if (detalleInteres) {

            detalleInteres.textContent =
                Number(
                    prestamo.tiene_interes
                )
                    ? `${Number(
                        prestamo.porcentaje_interes || 0
                    ).toLocaleString('es-CO')}%`
                    : 'Sin interés';

        }


        if (detalleSaldo) {

            detalleSaldo.textContent =
                formatearMoneda(
                    prestamo.saldo_pendiente
                );

        }


        if (detalleDesembolso) {

            detalleDesembolso.textContent =
                prestamo.medio_desembolso ||
                '-';

        }


        /* ================================================
           OBSERVACIÓN
           ================================================ */

        const observacionBloque =
            document.getElementById(
                'detalleObservacionBloque'
            );

        const observacion =
            document.getElementById(
                'detalleObservacion'
            );


        if (
            prestamo.observacion &&
            observacionBloque &&
            observacion
        ) {

            observacion.textContent =
                prestamo.observacion;

            observacionBloque.hidden =
                false;

        } else if (observacionBloque) {

            observacionBloque.hidden =
                true;

        }


        /* ================================================
           CUOTAS
           ================================================ */

        const tablaCuotas =
            document.getElementById(
                'detalleCuotas'
            );


        if (tablaCuotas) {

            if (cuotas.length === 0) {

                tablaCuotas.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="text-center text-muted py-4"
                        >
                            No hay cuotas registradas.
                        </td>
                    </tr>
                `;

            } else {

                tablaCuotas.innerHTML =
                    cuotas.map(cuota => {

                        return `
                            <tr>

                                <td>
                                    <strong>
                                        #${cuota.numero_cuota}
                                    </strong>
                                </td>

                                <td>
                                    ${formatearFechaPrestamo(
                                        cuota.fecha_programada
                                    )}
                                </td>

                                <td>
                                    ${formatearMoneda(
                                        cuota.valor_capital
                                    )}
                                </td>

                                <td>
                                    ${formatearMoneda(
                                        cuota.valor_interes
                                    )}
                                </td>

                                <td>
                                    <strong>
                                        ${formatearMoneda(
    cuota.saldo_cuota
)}
                                    </strong>
                                </td>

                                <td>
                                    ${cuota.estado || '-'}
                                </td>

                                <td>
                                    ${
                                        cuota.fecha_pago
                                            ? formatearFechaPrestamo(
                                                cuota.fecha_pago
                                            )
                                            : '-'
                                    }
                                </td>

                            </tr>
                        `;

                    }).join('');

            }

        }


        /* ================================================
           MOVIMIENTOS
           ================================================ */

        const contenedorMovimientos =
            document.getElementById(
                'detalleMovimientos'
            );


        if (contenedorMovimientos) {

            if (movimientos.length === 0) {

                contenedorMovimientos.innerHTML = `
                    <div class="text-muted">
                        No hay movimientos registrados.
                    </div>
                `;

            } else {

                contenedorMovimientos.innerHTML =
                    movimientos.map(movimiento => {

                        return `
                            <div class="border-bottom py-3">

                                <div
                                    class="d-flex justify-content-between align-items-center"
                                >

                                    <strong>
                                        ${movimiento.tipo_movimiento || '-'}
                                    </strong>

                                    <strong>
                                        ${formatearMoneda(
                                            movimiento.valor
                                        )}
                                    </strong>

                                </div>

                                <small class="text-muted">

                                    ${
                                        movimiento.fecha_movimiento
                                            ? new Date(
                                                movimiento.fecha_movimiento
                                            ).toLocaleString(
                                                'es-CO'
                                            )
                                            : ''
                                    }

                                </small>

                                ${
                                    movimiento.observacion
                                        ? `
                                            <div class="mt-1">
                                                ${movimiento.observacion}
                                            </div>
                                          `
                                        : ''
                                }

                            </div>
                        `;

                    }).join('');

            }

        }


        /* ================================================
           MOSTRAR CONTENIDO
           ================================================ */

        if (cargando) {

            cargando.hidden = true;

        }


        if (contenido) {

            contenido.hidden = false;

        }


    } catch (error) {

        console.error(
            '❌ Error consultando detalle del préstamo:',
            error
        );


        if (cargando) {

            cargando.hidden = true;

        }


        if (contenido) {

            contenido.hidden = true;

        }


        if (modalDetallePrestamo) {

            modalDetallePrestamo.hide();

        }


        mostrarMensaje(
            error.message ||
            'No fue posible cargar el detalle del préstamo.',
            'error'
        );

    }

});

    /* ========================================================
   MENÚ DE TRES PUNTOS
   ======================================================== */

let menuAccionesPrestamo = null;

document.addEventListener('click', event => {

    const boton =
        event.target.closest('.btn-menu-prestamo');

    /*
     * Si hacemos clic fuera del botón y fuera del menú,
     * cerramos el menú abierto.
     */
    if (
        !boton &&
        menuAccionesPrestamo &&
        !event.target.closest('.menu-acciones-prestamo')
    ) {
        menuAccionesPrestamo.remove();
        menuAccionesPrestamo = null;
        return;
    }

    if (!boton) {
        return;
    }


    const tarjeta =
        boton.closest('.prestamo-card');

    if (!tarjeta) {
        return;
    }


    const prestamoId =
        tarjeta.dataset.prestamo;

    if (!prestamoId) {

        mostrarMensaje(
            'No fue posible identificar el préstamo.',
            'error'
        );

        return;
    }


    /*
     * Si ya existe un menú abierto,
     * lo cerramos antes de crear otro.
     */

    if (menuAccionesPrestamo) {
        menuAccionesPrestamo.remove();
        menuAccionesPrestamo = null;
    }


    /*
     * Crear menú
     */

    const menu =
        document.createElement('div');

    menu.className =
        'menu-acciones-prestamo dropdown-menu show';


    menu.innerHTML = `

        <button
            type="button"
            class="dropdown-item accion-registrar-pago"
            data-prestamo-id="${prestamoId}"
        >
            <i class="fas fa-money-bill-wave"></i>
            Registrar pago
        </button>

        <button
    type="button"
    class="dropdown-item accion-abono-extraordinario"
    data-prestamo-id="${prestamoId}"
>
    <i class="fas fa-coins"></i>
    Abono extraordinario
</button>

        <button
    type="button"
    class="dropdown-item accion-aplazar-cuota"
    data-prestamo-id="${prestamoId}"
>
    <i class="fas fa-calendar-xmark"></i>
    Aplazar cuota
</button>

        <div class="dropdown-divider"></div>

        <button
            type="button"
            class="dropdown-item"
            disabled
        >
            <i class="fas fa-circle-check"></i>
            Cancelar anticipadamente
        </button>

        <button
            type="button"
            class="dropdown-item text-danger"
            disabled
        >
            <i class="fas fa-ban"></i>
            Anular préstamo
        </button>

    `;


    /*
     * Ubicar el menú dentro del contenedor
     * de acciones de la tarjeta.
     */

    const contenedor =
        boton.closest('.prestamo-acciones');

    if (!contenedor) {
        return;
    }


    contenedor.appendChild(menu);

    menuAccionesPrestamo = menu;

});

/* ========================================================
   APLAZAR CUOTA
   ======================================================== */

let prestamoAplazarActual = null;
let cuotaAplazarActual = null;

const modalAplazarCuotaElement =
    document.getElementById('modalAplazarCuota');

let modalAplazarCuota = null;

if (modalAplazarCuotaElement) {

    modalAplazarCuota =
        new bootstrap.Modal(
            modalAplazarCuotaElement
        );

}


/* ========================================================
   ABRIR MODAL DE APLAZAMIENTO
   ======================================================== */

document.addEventListener('click', async event => {

    const boton =
        event.target.closest(
            '.accion-aplazar-cuota'
        );

    if (!boton) {
        return;
    }

    const prestamoId =
        boton.dataset.prestamoId;

    if (!prestamoId) {

        mostrarMensaje(
            'No fue posible identificar el préstamo.',
            'error'
        );

        return;
    }


    /*
     * Cerrar menú de tres puntos
     */

    if (menuAccionesPrestamo) {

        menuAccionesPrestamo.remove();
        menuAccionesPrestamo = null;

    }


    /*
     * Mostrar modal
     */

    if (modalAplazarCuota) {
        modalAplazarCuota.show();
    }


    /*
     * Elementos del modal
     */

    const titulo =
        document.getElementById(
            'aplazarPrestamoTitulo'
        );

    const empleado =
        document.getElementById(
            'aplazarEmpleado'
        );

    const saldoPrestamo =
        document.getElementById(
            'aplazarSaldoPrestamo'
        );

    const numeroCuota =
        document.getElementById(
            'aplazarNumeroCuota'
        );

    const fechaCuota =
        document.getElementById(
            'aplazarFechaCuota'
        );

    const valorOriginal =
        document.getElementById(
            'aplazarValorOriginal'
        );

    const valorDescontar =
        document.getElementById(
            'aplazarValorDescontar'
        );

        if (valorDescontar) {

    valorDescontar.addEventListener('input', () => {

        /*
         * Si todavía no se ha cargado la cuota,
         * no hacemos ningún cálculo.
         */
        if (
            !cuotaAplazarActual ||
            !prestamoAplazarActual
        ) {
            return;
        }


        /*
         * Obtener solamente los números
         * escritos por el usuario.
         */
        let valorNumerico =
            valorDescontar.value
                .replace(/\D/g, '');

        let valorDescontado =
            Number(valorNumerico || 0);


        /*
         * Saldo TOTAL pendiente del préstamo.
         *
         * Este es el límite máximo.
         */
        const saldoPrestamo =
            Number(
                prestamoAplazarActual.saldo_pendiente || 0
            );


        /*
         * Valor pendiente de la cuota
         * que estamos aplazando.
         */
        const valorCuota =
            Number(
                cuotaAplazarActual.saldo_cuota ??
                cuotaAplazarActual.valor_cuota ??
                0
            );


        /*
         * =====================================================
         * CASO 1: NO DESCONTAR NADA
         * =====================================================
         *
         * $0 es válido.
         *
         * Esto significa:
         * "No descuento nada de esta cuota y aplazo
         * el valor completo."
         */
        if (valorDescontado === 0) {

            valorDescontar.value = '';

            if (saldoCuota) {

                saldoCuota.textContent =
                    formatearMoneda(valorCuota);

            }

            return;
        }


        /*
         * =====================================================
         * CASO 2: SUPERA EL SALDO TOTAL DEL PRÉSTAMO
         * =====================================================
         */
        if (valorDescontado > saldoPrestamo) {

            valorDescontado =
                saldoPrestamo;

            valorDescontar.value =
                formatearMoneda(
                    valorDescontado
                );

            mostrarMensaje(
                `El valor máximo permitido es ${formatearMoneda(saldoPrestamo)}.`,
                'error'
            );

            /*
             * Si llegó exactamente al saldo total,
             * se debe manejar como cancelación anticipada.
             */
            if (
                valorDescontado === saldoPrestamo
            ) {

                if (saldoCuota) {

                    saldoCuota.textContent =
                        'Este valor corresponde al saldo total del préstamo.';

                }

                mostrarMensaje(
                    'Para pagar todo el saldo del préstamo debe utilizar "Cancelar anticipadamente".',
                    'error'
                );

                return;
            }

        }


        /*
         * Mostrar el valor con formato colombiano.
         */
        valorDescontar.value =
            formatearMoneda(
                valorDescontado
            );


        /*
         * =====================================================
         * CASO 3: PAGA TODO EL SALDO DEL PRÉSTAMO
         * =====================================================
         *
         * Esto NO es un aplazamiento.
         */
        if (
            saldoPrestamo > 0 &&
            valorDescontado === saldoPrestamo
        ) {

            if (saldoCuota) {

                saldoCuota.textContent =
                    'Este valor corresponde al saldo total del préstamo.';

            }

            mostrarMensaje(
                'Para pagar todo el saldo del préstamo debe utilizar "Cancelar anticipadamente".',
                'error'
            );

            return;
        }


        /*
         * =====================================================
         * CALCULAR SALDO APLAZADO
         * =====================================================
         *
         * Ejemplo:
         *
         * Cuota       $50.000
         * Descontar   $40.000
         * Aplazar     $10.000
         *
         * Si descontar = $0:
         * Aplazar     $50.000
         */
        const valorAplicado =
            Math.min(
                valorDescontado,
                valorCuota
            );


        const saldoAplazado =
            Math.max(
                valorCuota -
                valorAplicado,
                0
            );


        if (saldoCuota) {

            saldoCuota.textContent =
                formatearMoneda(
                    saldoAplazado
                );

        }

    });

}
    const saldoCuota =
        document.getElementById(
            'aplazarSaldoCuota'
        );

    const fechaAplazamiento =
        document.getElementById(
            'aplazarFecha'
        );

    const observacion =
        document.getElementById(
            'aplazarObservacion'
        );

        /* ========================================================
   OPCIONES DE APLAZAMIENTO
   ======================================================== */

const opcionAcumular =
    document.getElementById(
        'aplazarAcumular'
    );

const opcionMantenerNormal =
    document.getElementById(
        'aplazarMantenerNormal'
    );

const opcionReprogramar =
    document.getElementById(
        'aplazarReprogramar'
    );

const contenedorFechaReprogramacion =
    document.getElementById(
        'contenedorFechaReprogramacion'
    );

const fechaReprogramada =
    document.getElementById(
        'aplazarFechaReprogramada'
    );

const medioAplazamiento =
    document.getElementById(
        'aplazarMedio'
    );


/*
 * Mostrar u ocultar elementos
 * dependiendo de la opción seleccionada.
 */
function actualizarOpcionAplazamiento() {

    /*
     * Ocultar por defecto la fecha
     * de reprogramación.
     */
    if (contenedorFechaReprogramacion) {
    contenedorFechaReprogramacion.hidden = false;
}


    /*
     * =====================================================
     * ACUMULAR EN LA SIGUIENTE CUOTA
     * =====================================================
     */
    if (
        opcionAcumular &&
        opcionAcumular.checked
    ) {

        /*
         * No necesita fecha adicional.
         */
        if (contenedorFechaReprogramacion) {

            contenedorFechaReprogramacion.style.display =
                'none';

        }

        return;
    }


    /*
     * =====================================================
     * MANTENER VALOR NORMAL
     * =====================================================
     */
    if (
        opcionMantenerNormal &&
        opcionMantenerNormal.checked
    ) {

        /*
         * Tampoco necesita seleccionar
         * una fecha manual.
         */
        if (contenedorFechaReprogramacion) {
    contenedorFechaReprogramacion.hidden = true;
}

        return;
    }


    /*
     * =====================================================
     * REPROGRAMAR MANUALMENTE
     * =====================================================
     */
    /*
 * =====================================================
 * REPROGRAMAR MANUALMENTE
 * =====================================================
 */
if (opcionReprogramar && opcionReprogramar.checked) {

    if (contenedorFechaReprogramacion) {

        contenedorFechaReprogramacion.hidden = false;

        contenedorFechaReprogramacion.style.display = 'block';

    }

    return;
}

}


/*
 * Escuchar cambio de opción.
 */
if (opcionAcumular) {

    opcionAcumular.addEventListener(
        'change',
        actualizarOpcionAplazamiento
    );

}

if (opcionMantenerNormal) {

    opcionMantenerNormal.addEventListener(
        'change',
        actualizarOpcionAplazamiento
    );

}

if (opcionReprogramar) {

    opcionReprogramar.addEventListener(
        'change',
        actualizarOpcionAplazamiento
    );

}


    /*
     * Limpiar información anterior
     */

    if (titulo) {
        titulo.textContent = 'Cargando...';
    }

    if (empleado) {
        empleado.textContent = '-';
    }

    if (saldoPrestamo) {
        saldoPrestamo.textContent = '-';
    }

    if (numeroCuota) {
        numeroCuota.textContent = '-';
    }

    if (fechaCuota) {
        fechaCuota.textContent = '-';
    }

    if (valorOriginal) {
        valorOriginal.textContent = '-';
    }

    if (valorDescontar) {
        valorDescontar.value = '';
    }

    if (saldoCuota) {
        saldoCuota.textContent = '-';
    }

    if (observacion) {
        observacion.value = '';
    }


    /*
     * Fecha actual
     */

    if (fechaAplazamiento) {

        const ahora = new Date();

        const anio =
            ahora.getFullYear();

        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, '0');

        const dia =
            String(
                ahora.getDate()
            ).padStart(2, '0');

        fechaAplazamiento.value =
            `${anio}-${mes}-${dia}`;

    }


    try {

        /*
         * Consultar préstamo
         */

        const respuesta =
            await fetch(
                `/nomina/prestamos/${prestamoId}`
            );

        const resultado =
            await respuesta.json();

        if (
            !respuesta.ok ||
            !resultado.ok
        ) {

            throw new Error(
                resultado.error ||
                'No fue posible consultar el préstamo.'
            );

        }


        const prestamo =
            resultado.prestamo;

        const cuotas =
            resultado.cuotas || [];


        /*
         * Buscar primera cuota pendiente
         * o vencida
         */

        const cuotasDisponibles =
            cuotas.filter(cuota =>
                cuota.estado === 'PENDIENTE' ||
                cuota.estado === 'VENCIDA'
            );


        if (cuotasDisponibles.length === 0) {

            throw new Error(
                'Este préstamo no tiene cuotas pendientes para aplazar.'
            );

        }


        const cuota =
            cuotasDisponibles[0];


        prestamoAplazarActual =
            prestamo;

        cuotaAplazarActual =
            cuota;


        /*
         * Información general
         */

        if (titulo) {

            titulo.textContent =
                `Préstamo #${String(
                    prestamo.id
                ).padStart(4, '0')}`;

        }

        if (empleado) {

            empleado.textContent =
                prestamo.empleado ||
                'Sin empleado';

        }

        if (saldoPrestamo) {

            saldoPrestamo.textContent =
                formatearMoneda(
                    prestamo.saldo_pendiente
                );

        }


        /*
         * Información de la cuota
         */

        if (numeroCuota) {

            numeroCuota.textContent =
                `Cuota #${cuota.numero_cuota}`;

        }

        if (fechaCuota) {

            fechaCuota.textContent =
                formatearFechaPrestamo(
                    cuota.fecha_programada
                );

        }

        if (valorOriginal) {

            valorOriginal.textContent =
                formatearMoneda(
                    cuota.saldo_cuota ??
                    cuota.valor_cuota
                );

        }


        /*
         * Valor por defecto:
         * no descontar nada todavía.
         */

        if (valorDescontar) {

            valorDescontar.value = '';

            valorDescontar.dispatchEvent(
                new Event('input')
            );

        }

    } catch (error) {

        console.error(
            '❌ Error cargando información para aplazamiento:',
            error
        );

        if (modalAplazarCuota) {
            modalAplazarCuota.hide();
        }

        mostrarMensaje(
            error.message ||
            'No fue posible cargar la información del préstamo.',
            'error'
        );

    }

});

/* ========================================================
   PREVISUALIZACIÓN DE LAS OPCIONES DE APLAZAMIENTO
   ======================================================== */

const opcionAcumular =
    document.getElementById('aplazarAcumular');

const opcionMantenerNormal =
    document.getElementById('aplazarMantenerNormal');

const opcionReprogramar =
    document.getElementById('aplazarReprogramar');

const contenedorFechaReprogramacion =
    document.getElementById(
        'contenedorFechaReprogramacion'
    );

const fechaReprogramada =
    document.getElementById(
        'aplazarFechaReprogramada'
    );

const medioAplazamiento =
    document.getElementById(
        'aplazarMedio'
    );

    const btnConfirmarAplazamiento =
    document.getElementById(
        'btnConfirmarAplazamiento'
    );


if (btnConfirmarAplazamiento) {

    btnConfirmarAplazamiento.addEventListener(
        'click',
        async function () {

            if (
                !prestamoAplazarActual ||
                !cuotaAplazarActual
            ) {
                mostrarMensaje(
                    'No hay una cuota seleccionada para aplazar.',
                    'error'
                );

                return;
            }


            const valorDescontarInput =
                document.getElementById(
                    'aplazarValorDescontar'
                );


            const fechaInput =
                document.getElementById(
                    'aplazarFecha'
                );


            const observacionInput =
                document.getElementById(
                    'aplazarObservacion'
                );


            const valorDescontar =
                Number(
                    (valorDescontarInput?.value || '')
                        .replace(/\D/g, '') || 0
                );


            const fechaAplazamiento =
                fechaInput?.value || '';


            const observacion =
                observacionInput?.value.trim() || '';


            const opcionSeleccionada =
                document.querySelector(
                    'input[name="opcionAplazamiento"]:checked'
                );


            const opcionAplazamiento =
                opcionSeleccionada?.value || '';


            const medioPago =
                medioAplazamiento?.value || '';


            /* =============================================
               VALIDACIONES
               ============================================= */

            if (!fechaAplazamiento) {

                mostrarMensaje(
                    'Debe indicar la fecha del aplazamiento.',
                    'error'
                );

                return;
            }


            if (!opcionAplazamiento) {

                mostrarMensaje(
                    'Debe seleccionar una opción de aplazamiento.',
                    'error'
                );

                return;
            }


            if (!medioPago) {

                mostrarMensaje(
                    'Debe seleccionar el medio de pago.',
                    'error'
                );

                return;
            }


            const valorCuota =
                Number(
                    cuotaAplazarActual.saldo_cuota ??
                    cuotaAplazarActual.valor_cuota ??
                    0
                );


            if (
                valorDescontar < 0 ||
                valorDescontar > valorCuota
            ) {

                mostrarMensaje(
                    'El valor a descontar no es válido.',
                    'error'
                );

                return;
            }


            const valorAplazado =
                Math.max(
                    valorCuota -
                    valorDescontar,
                    0
                );


            if (valorAplazado <= 0) {

                mostrarMensaje(
                    'Debe quedar un valor pendiente para aplazar.',
                    'error'
                );

                return;
            }


            /* =============================================
               CONFIRMACIÓN
               ============================================= */

            const confirmar =
                confirm(
                    `¿Desea aplazar la cuota #${cuotaAplazarActual.numero_cuota}?\n\n` +
                    `Valor de la cuota: ${formatearMoneda(valorCuota)}\n` +
                    `Descontar ahora: ${formatearMoneda(valorDescontar)}\n` +
                    `Valor aplazado: ${formatearMoneda(valorAplazado)}`
                );


            if (!confirmar) {
                return;
            }


            /* =============================================
               DESHABILITAR BOTÓN
               ============================================= */

            btnConfirmarAplazamiento.disabled =
                true;

            const textoOriginal =
                btnConfirmarAplazamiento.innerHTML;

            btnConfirmarAplazamiento.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Guardando...';


            try {

                const respuesta =
                    await fetch(
                        `/nomina/prestamos/${prestamoAplazarActual.id}/aplazar-cuota`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                cuota_id:
                                    cuotaAplazarActual.id,

                                valor_descontar:
                                    valorDescontar,

                                opcion_aplazamiento:
                                    opcionAplazamiento,

                                medio_pago:
                                    medioPago,

                                fecha_aplazamiento:
                                    fechaAplazamiento,

                                observacion:
                                    observacion
                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (
                    !respuesta.ok ||
                    !resultado.ok
                ) {
                    throw new Error(
                        resultado.error ||
                        'No fue posible registrar el aplazamiento.'
                    );
                }


                /* =============================================
                   CERRAR MODAL
                   ============================================= */

                if (modalAplazarCuota) {
                    modalAplazarCuota.hide();
                }


                /* =============================================
                   MENSAJE
                   ============================================= */

                mostrarMensaje(
                    resultado.mensaje ||
                    'Aplazamiento registrado correctamente.',
                    'success'
                );


                /* =============================================
                   ACTUALIZAR LISTADO
                   ============================================= */

                if (
                    typeof cargarPrestamos ===
                    'function'
                ) {
                    await cargarPrestamos();
                }


            } catch (error) {

                console.error(
                    '❌ Error registrando aplazamiento:',
                    error
                );


                mostrarMensaje(
                    error.message ||
                    'No fue posible registrar el aplazamiento.',
                    'error'
                );


            } finally {

                btnConfirmarAplazamiento.disabled =
                    false;

                btnConfirmarAplazamiento.innerHTML =
                    textoOriginal;
            }

        }
    );

}


/*
 * Crear contenedor de previsualización
 * si todavía no existe.
 */
let vistaPreviaAplazamiento =
    document.getElementById(
        'vistaPreviaAplazamiento'
    );


if (!vistaPreviaAplazamiento) {

    vistaPreviaAplazamiento =
        document.createElement('div');

    vistaPreviaAplazamiento.id =
        'vistaPreviaAplazamiento';

    vistaPreviaAplazamiento.style.marginTop =
        '15px';

    vistaPreviaAplazamiento.style.padding =
        '12px 15px';

    vistaPreviaAplazamiento.style.borderRadius =
        '10px';

    vistaPreviaAplazamiento.style.background =
        '#f0fdf4';

    vistaPreviaAplazamiento.style.border =
        '1px solid #bbf7d0';

    vistaPreviaAplazamiento.style.fontSize =
        '14px';

    vistaPreviaAplazamiento.style.lineHeight =
        '1.5';

    /*
     * Insertarlo debajo de las opciones
     */
    const radioReprogramar =
        opcionReprogramar
            ? opcionReprogramar.closest('.form-check')
            : null;

    if (radioReprogramar) {

        radioReprogramar
            .parentElement
            .appendChild(
                vistaPreviaAplazamiento
            );

    }

}


/* ========================================================
   OBTENER SALDO QUE SE VA A APLAZAR
   ======================================================== */

function obtenerSaldoAplazadoActual() {

    if (!cuotaAplazarActual) {
        return 0;
    }

    const valorCuota =
        Number(
            cuotaAplazarActual.saldo_cuota ??
            cuotaAplazarActual.valor_cuota ??
            0
        );


    const campo =
        document.getElementById(
            'aplazarValorDescontar'
        );


    if (!campo) {
        return valorCuota;
    }


    const valorDescontado =
        Number(
            campo.value
                .replace(/\D/g, '') || 0
        );


    return Math.max(
        valorCuota -
        Math.min(
            valorDescontado,
            valorCuota
        ),
        0
    );

}


/* ========================================================
   ACTUALIZAR PREVISUALIZACIÓN
   ======================================================== */

function actualizarVistaPreviaAplazamiento() {

    if (!vistaPreviaAplazamiento) {
        return;
    }


    const saldoAplazado =
        obtenerSaldoAplazadoActual();


    /*
     * Si todavía no hay préstamo/cuota cargada.
     */
    if (!cuotaAplazarActual) {

        vistaPreviaAplazamiento.style.display =
            'none';

        return;

    }


    /*
     * Si no queda nada por aplazar.
     */
    if (saldoAplazado <= 0) {

        vistaPreviaAplazamiento.style.display =
            'none';

        return;

    }


    const valorCuotaNormal =
        Number(
            cuotaAplazarActual.valor_cuota || 0
        );


    /* =====================================================
       ACUMULAR EN LA SIGUIENTE CUOTA
       ===================================================== */

    if (
        opcionAcumular &&
        opcionAcumular.checked
    ) {

        vistaPreviaAplazamiento.style.display =
            'block';

        const proximaCuota =
            valorCuotaNormal +
            saldoAplazado;


        vistaPreviaAplazamiento.innerHTML = `
            <strong>
                <i class="fas fa-circle-info"></i>
                Previsualización
            </strong>

            <div style="margin-top:6px;">
                La siguiente cuota conservará su valor normal
                y se le sumará el saldo aplazado.
            </div>

            <div style="margin-top:8px; font-weight:600;">
                ${formatearMoneda(valorCuotaNormal)}
                +
                ${formatearMoneda(saldoAplazado)}
                =
                ${formatearMoneda(proximaCuota)}
            </div>
        `;

        if (contenedorFechaReprogramacion) {

            contenedorFechaReprogramacion.style.display =
                'none';

        }

        return;
    }


    /* =====================================================
       MANTENER VALOR NORMAL
       ===================================================== */

    if (
        opcionMantenerNormal &&
        opcionMantenerNormal.checked
    ) {

        vistaPreviaAplazamiento.style.display =
            'block';

        vistaPreviaAplazamiento.innerHTML = `
            <strong>
                <i class="fas fa-circle-info"></i>
                Previsualización
            </strong>

            <div style="margin-top:6px;">
                Las cuotas siguientes conservarán su valor
                normal.
            </div>

            <div style="margin-top:6px;">
                El saldo aplazado de
                <strong>
                    ${formatearMoneda(saldoAplazado)}
                </strong>
                se agregará como una nueva cuota al final
                del plan.
            </div>
        `;

        if (contenedorFechaReprogramacion) {

            contenedorFechaReprogramacion.style.display =
                'none';

        }

        return;
    }


    /* =====================================================
       REPROGRAMAR MANUALMENTE
       ===================================================== */

    /* =====================================================
   REPROGRAMAR MANUALMENTE
   ===================================================== */

if (
    opcionReprogramar &&
    opcionReprogramar.checked
) {

    vistaPreviaAplazamiento.style.display =
        'block';

    vistaPreviaAplazamiento.innerHTML = `
        <strong>
            <i class="fas fa-circle-info"></i>
            Reprogramación manual
        </strong>

        <div style="margin-top:6px;">
            El valor aplazado de
            <strong>
                ${formatearMoneda(saldoAplazado)}
            </strong>
            quedará pendiente para ser reprogramado
            manualmente.
        </div>
    `;

    if (contenedorFechaReprogramacion) {

        contenedorFechaReprogramacion.style.display =
            'none';

    }

    return;
}

}


/* ========================================================
   CAMBIAR OPCIÓN
   ======================================================== */

if (opcionAcumular) {

    opcionAcumular.addEventListener(
        'change',
        actualizarVistaPreviaAplazamiento
    );

}


if (opcionMantenerNormal) {

    opcionMantenerNormal.addEventListener(
        'change',
        actualizarVistaPreviaAplazamiento
    );

}


if (opcionReprogramar) {

    opcionReprogramar.addEventListener(
        'change',
        actualizarVistaPreviaAplazamiento
    );

}


/* ========================================================
   ACTUALIZAR PREVISUALIZACIÓN AL CAMBIAR EL VALOR
   ======================================================== */

const campoValorAplazar =
    document.getElementById(
        'aplazarValorDescontar'
    );


if (campoValorAplazar) {

    campoValorAplazar.addEventListener(
        'input',
        () => {

            actualizarVistaPreviaAplazamiento();

        }
    );

}


/* ========================================================
   VALIDAR FECHA DE REPROGRAMACIÓN
   ======================================================== */

if (fechaReprogramada) {

    fechaReprogramada.addEventListener(
        'change',
        actualizarVistaPreviaAplazamiento
    );

}

/* ========================================================
   REGISTRAR PAGO DE CUOTA
   ======================================================== */

let prestamoPagoActual = null;
let cuotasPagoActual = [];


const modalRegistrarPagoElement =
    document.getElementById(
        'modalRegistrarPago'
    );

let modalRegistrarPago = null;

if (modalRegistrarPagoElement) {

    modalRegistrarPago =
        new bootstrap.Modal(
            modalRegistrarPagoElement
        );
}


/* ========================================================
   ABRIR MODAL DE PAGO
   ======================================================== */

document.addEventListener('click', async event => {

    const boton =
        event.target.closest(
            '.accion-registrar-pago'
        );

    if (!boton) {
        return;
    }


    const prestamoId =
        boton.dataset.prestamoId;

    if (!prestamoId) {

        mostrarMensaje(
            'No fue posible identificar el préstamo.',
            'error'
        );

        return;
    }


    /*
     * Cerrar menú
     */

    if (menuAccionesPrestamo) {

        menuAccionesPrestamo.remove();

        menuAccionesPrestamo = null;
    }


    /*
     * Elementos del modal
     */

    const titulo =
        document.getElementById(
            'pagoPrestamoTitulo'
        );

    const empleado =
        document.getElementById(
            'pagoEmpleado'
        );

    const saldo =
        document.getElementById(
            'pagoSaldoPendiente'
        );

    const selectCuota =
        document.getElementById(
            'pagoCuota'
        );

    const valorCuota =
        document.getElementById(
            'pagoValorCuota'
        );

    const fechaPago =
        document.getElementById(
            'pagoFecha'
        );

    const medioPago =
        document.getElementById(
            'pagoMedio'
        );

    const observacion =
        document.getElementById(
            'pagoObservacion'
        );


    /*
     * Limpiar formulario
     */

    if (titulo) {
        titulo.textContent = 'Cargando...';
    }

    if (empleado) {
        empleado.textContent = '-';
    }

    if (saldo) {
        saldo.textContent = '-';
    }

    if (valorCuota) {
        valorCuota.textContent = '-';
    }

    if (selectCuota) {

        selectCuota.innerHTML = `
            <option value="">
                Cargando cuotas...
            </option>
        `;

        selectCuota.disabled = true;
    }

    if (medioPago) {
        medioPago.value = '';
    }

    if (observacion) {
        observacion.value = '';
    }


    /*
     * Fecha actual
     */

    if (fechaPago) {

        const ahora = new Date();

        const anio =
            ahora.getFullYear();

        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, '0');

        const dia =
            String(
                ahora.getDate()
            ).padStart(2, '0');

        fechaPago.value =
            `${anio}-${mes}-${dia}`;
    }


    if (modalRegistrarPago) {
        modalRegistrarPago.show();
    }


    try {

        /*
         * Consultar préstamo completo
         */

        const respuesta =
            await fetch(
                `/nomina/prestamos/${prestamoId}`
            );


        const resultado =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !resultado.ok
        ) {

            throw new Error(
                resultado.error ||
                'No fue posible consultar el préstamo.'
            );
        }


        const prestamo =
            resultado.prestamo;

        const cuotas =
            resultado.cuotas || [];


        prestamoPagoActual =
            prestamo;


        /*
         * Solo cuotas que pueden pagarse
         */

        cuotasPagoActual =
            cuotas.filter(cuota =>
                cuota.estado === 'PENDIENTE' ||
                cuota.estado === 'VENCIDA'
            );


        /*
         * Información general
         */

        if (titulo) {

            titulo.textContent =
                `Préstamo #${String(prestamo.id).padStart(4, '0')}`;
        }


        if (empleado) {

            empleado.textContent =
                prestamo.empleado ||
                'Sin empleado';
        }


        if (saldo) {

            saldo.textContent =
                formatearMoneda(
                    prestamo.saldo_pendiente
                );
        }


        /*
         * Cargar cuotas disponibles
         */

        if (selectCuota) {

            selectCuota.disabled = false;


            if (
                cuotasPagoActual.length === 0
            ) {

                selectCuota.innerHTML = `
                    <option value="">
                        No hay cuotas pendientes
                    </option>
                `;

                selectCuota.disabled = true;

            } else {

                selectCuota.innerHTML = `

                    <option value="">
                        Seleccione una cuota...
                    </option>

                    ${
                        cuotasPagoActual
                            .map(cuota => `
                                <option
                                    value="${cuota.id}"
                                >
                                    Cuota #${cuota.numero_cuota}
                                    · ${formatearMoneda(cuota.valor_cuota)}
                                    · ${formatearFechaPrestamo(cuota.fecha_programada)}
                                    · ${cuota.estado}
                                </option>
                            `)
                            .join('')
                    }

                `;

            }

        }


        /*
         * Mostrar valor al seleccionar cuota
         */

        if (selectCuota) {

            selectCuota.onchange =
                () => {

                    const cuotaSeleccionada =
                        cuotasPagoActual.find(
                            cuota =>
                                String(cuota.id) ===
                                String(selectCuota.value)
                        );


                    if (!cuotaSeleccionada) {

                        if (valorCuota) {
                            valorCuota.textContent = '-';
                        }

                        return;
                    }


                    if (valorCuota) {

                        valorCuota.textContent =
                            formatearMoneda(
                                cuotaSeleccionada.valor_cuota
                            );
                    }

                };

        }


    } catch (error) {

        console.error(
            '❌ Error cargando información para pago:',
            error
        );


        if (modalRegistrarPago) {
            modalRegistrarPago.hide();
        }


        mostrarMensaje(
            error.message ||
            'No fue posible cargar la información del préstamo.',
            'error'
        );

    }

});

/* ========================================================
   GUARDAR PAGO
   ======================================================== */

const btnRegistrarPago =
    document.getElementById(
        'btnRegistrarPago'
    );


if (btnRegistrarPago) {

    btnRegistrarPago.addEventListener(
        'click',
        async () => {

            const selectCuota =
                document.getElementById(
                    'pagoCuota'
                );

            const fechaPago =
                document.getElementById(
                    'pagoFecha'
                );

            const medioPago =
                document.getElementById(
                    'pagoMedio'
                );

            const observacion =
                document.getElementById(
                    'pagoObservacion'
                );


            const cuotaId =
                selectCuota
                    ? selectCuota.value
                    : '';


            /*
             * Validaciones
             */

            if (!prestamoPagoActual) {

                mostrarMensaje(
                    'No hay un préstamo seleccionado.',
                    'error'
                );

                return;
            }


            if (!cuotaId) {

                mostrarMensaje(
                    'Debe seleccionar una cuota.',
                    'error'
                );

                return;
            }


            if (!fechaPago || !fechaPago.value) {

                mostrarMensaje(
                    'Debe indicar la fecha del pago.',
                    'error'
                );

                return;
            }


            if (!medioPago || !medioPago.value) {

                mostrarMensaje(
                    'Debe seleccionar el medio de pago.',
                    'error'
                );

                return;
            }


            /*
             * Evitar doble clic
             */

            btnRegistrarPago.disabled = true;

            btnRegistrarPago.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Registrando...
            `;


            try {

                const respuesta =
                    await fetch(
                        `/nomina/prestamos/${prestamoPagoActual.id}/pagar-cuota`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                cuota_id:
                                    Number(cuotaId),

                                fecha_pago:
                                    fechaPago.value,

                                medio_pago:
                                    medioPago.value,

                                observacion:
                                    observacion
                                        ? observacion.value.trim()
                                        : ''
                            })
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (
                    !respuesta.ok ||
                    !resultado.ok
                ) {

                    throw new Error(
                        resultado.error ||
                        'No fue posible registrar el pago.'
                    );
                }


                console.log(
                    '✅ Pago registrado:',
                    resultado
                );


                /*
                 * Cerrar modal
                 */

                if (modalRegistrarPago) {
                    modalRegistrarPago.hide();
                }


                /*
                 * Mensaje
                 */

                mostrarMensaje(
                    resultado.mensaje ||
                    'Pago registrado correctamente.',
                    'success'
                );


                /*
                 * Actualizar lista e indicadores
                 */

                await cargarPrestamos();

                if (
                    typeof actualizarIndicadoresPrestamos ===
                    'function'
                ) {

                    await actualizarIndicadoresPrestamos(
                        prestamosDatos
                    );

                }


            } catch (error) {

                console.error(
                    '❌ Error registrando pago:',
                    error
                );


                mostrarMensaje(
                    error.message ||
                    'No fue posible registrar el pago.',
                    'error'
                );


            } finally {

                btnRegistrarPago.disabled = false;

                btnRegistrarPago.innerHTML = `
                    <i class="fas fa-check"></i>
                    Registrar pago
                `;

            }

        }
    );

}

/* ========================================================
   ABONO EXTRAORDINARIO
   ======================================================== */

let prestamoAbonoActual = null;


/* ========================================================
   INICIALIZAR MODAL
   ======================================================== */

const modalAbonoElement =
    document.getElementById(
        'modalAbonoExtraordinario'
    );

let modalAbonoExtraordinario = null;

if (modalAbonoElement) {

    modalAbonoExtraordinario =
        new bootstrap.Modal(
            modalAbonoElement
        );

}


/* ========================================================
   ABRIR MODAL DE ABONO
   ======================================================== */

document.addEventListener('click', async event => {

    const boton =
        event.target.closest(
            '.accion-abono-extraordinario'
        );

    if (!boton) {
        return;
    }


    const prestamoId =
        boton.dataset.prestamoId;

    if (!prestamoId) {

        mostrarMensaje(
            'No fue posible identificar el préstamo.',
            'error'
        );

        return;
    }


    /* ====================================================
       CERRAR MENÚ
       ==================================================== */

    if (menuAccionesPrestamo) {

        menuAccionesPrestamo.remove();

        menuAccionesPrestamo = null;

    }


    /* ====================================================
       ELEMENTOS DEL MODAL
       ==================================================== */

    const titulo =
        document.getElementById(
            'abonoPrestamoTitulo'
        );

    const empleado =
        document.getElementById(
            'abonoEmpleado'
        );

    const saldo =
        document.getElementById(
            'abonoSaldoPendiente'
        );

    const valor =
        document.getElementById(
            'abonoValor'
        );

    const fecha =
        document.getElementById(
            'abonoFecha'
        );

    const medio =
        document.getElementById(
            'abonoMedio'
        );

    const observacion =
        document.getElementById(
            'abonoObservacion'
        );

    const saldoDespues =
        document.getElementById(
            'abonoSaldoDespues'
        );


    /* ====================================================
       LIMPIAR
       ==================================================== */

    prestamoAbonoActual = null;

    if (titulo) {
        titulo.textContent = 'Cargando...';
    }

    if (empleado) {
        empleado.textContent = '-';
    }

    if (saldo) {
        saldo.textContent = '-';
    }

    if (valor) {
        valor.value = '';
    }

    if (medio) {
        medio.value = '';
    }

    if (observacion) {
        observacion.value = '';
    }

    if (saldoDespues) {
        saldoDespues.textContent =
            'Nuevo saldo: -';
    }


    /* ====================================================
       FECHA ACTUAL
       ==================================================== */

    if (fecha) {

        const ahora = new Date();

        const anio =
            ahora.getFullYear();

        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, '0');

        const dia =
            String(
                ahora.getDate()
            ).padStart(2, '0');

        fecha.value =
            `${anio}-${mes}-${dia}`;

    }


    /* ====================================================
       MOSTRAR MODAL
       ==================================================== */

    if (modalAbonoExtraordinario) {
        modalAbonoExtraordinario.show();
    }


    try {

        const respuesta =
            await fetch(
                `/nomina/prestamos/${Number(prestamoId)}`
            );

        const resultado =
            await respuesta.json();

        if (
            !respuesta.ok ||
            !resultado.ok
        ) {

            throw new Error(
                resultado.error ||
                'No fue posible consultar el préstamo.'
            );

        }


        const prestamo =
            resultado.prestamo;


        prestamoAbonoActual =
            prestamo;


        if (titulo) {

            titulo.textContent =
                `Préstamo #${String(
                    prestamo.id
                ).padStart(4, '0')}`;

        }


        if (empleado) {

            empleado.textContent =
                prestamo.empleado ||
                '-';

        }


        const saldoActual =
            Number(
                prestamo.saldo_pendiente || 0
            );


        if (saldo) {

            saldo.textContent =
                formatearMoneda(
                    saldoActual
                );

        }


    } catch (error) {

        console.error(
            '❌ Error cargando préstamo para abono:',
            error
        );


        if (modalAbonoExtraordinario) {
            modalAbonoExtraordinario.hide();
        }


        mostrarMensaje(
            error.message ||
            'No fue posible cargar el préstamo.',
            'error'
        );

    }

});

/* ========================================================
   CALCULAR NUEVO SALDO DEL ABONO
   ======================================================== */

const abonoValorInput =
    document.getElementById(
        'abonoValor'
    );

const abonoSaldoDespues =
    document.getElementById(
        'abonoSaldoDespues'
    );


if (
    abonoValorInput &&
    abonoSaldoDespues
) {

    abonoValorInput.addEventListener(
        'input',
        () => {

            if (!prestamoAbonoActual) {

                abonoSaldoDespues.textContent =
                    'Nuevo saldo: -';

                return;

            }


            const saldoActual =
                Number(
                    prestamoAbonoActual.saldo_pendiente ||
                    0
                );


            const valorNumerico =
    abonoValorInput.value
        .replace(/\D/g, '');

if (valorNumerico) {

    abonoValorInput.value =
        formatearMoneda(
            Number(valorNumerico)
        );

}

const valorAbono =
    Number(valorNumerico || 0);


            if (
                !valorAbono ||
                valorAbono <= 0
            ) {

                abonoSaldoDespues.textContent =
                    'Nuevo saldo: -';

                return;

            }


            const nuevoSaldo =
                Math.max(
                    saldoActual - valorAbono,
                    0
                );


            abonoSaldoDespues.textContent =
                `Nuevo saldo: ${formatearMoneda(
                    nuevoSaldo
                )}`;

        }
    );

}

/* ========================================================
   GUARDAR ABONO EXTRAORDINARIO
   ======================================================== */

const btnRegistrarAbono =
    document.getElementById(
        'btnRegistrarAbono'
    );


if (btnRegistrarAbono) {

    btnRegistrarAbono.addEventListener(
        'click',
        async () => {

            const valorInput =
                document.getElementById(
                    'abonoValor'
                );

            const fecha =
                document.getElementById(
                    'abonoFecha'
                );

            const medio =
                document.getElementById(
                    'abonoMedio'
                );

            const observacion =
                document.getElementById(
                    'abonoObservacion'
                );


            if (!prestamoAbonoActual) {

                mostrarMensaje(
                    'No hay un préstamo seleccionado.',
                    'error'
                );

                return;

            }


            const valorAbono =
                Number(
                    valorInput.value
                        .replace(/\D/g, '')
                );


            const saldoActual =
                Number(
                    prestamoAbonoActual.saldo_pendiente ||
                    0
                );


            /* =================================================
               VALIDACIONES
               ================================================= */

            if (
                !valorAbono ||
                valorAbono <= 0
            ) {

                mostrarMensaje(
                    'Debe indicar un valor de abono válido.',
                    'error'
                );

                return;

            }


            if (
                valorAbono >= saldoActual
            ) {

                mostrarMensaje(
                    'El abono debe ser menor al saldo pendiente. Para cancelar todo el saldo utilizaremos la opción de cancelación anticipada.',
                    'error'
                );

                return;

            }


            if (
                !fecha ||
                !fecha.value
            ) {

                mostrarMensaje(
                    'Debe indicar la fecha del abono.',
                    'error'
                );

                return;

            }


            if (
                !medio ||
                !medio.value
            ) {

                mostrarMensaje(
                    'Debe seleccionar el medio de pago.',
                    'error'
                );

                return;

            }


            /* =================================================
               EVITAR DOBLE CLIC
               ================================================= */

            btnRegistrarAbono.disabled = true;

            btnRegistrarAbono.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Registrando...
            `;


            try {

                const respuesta =
                    await fetch(
                        `/nomina/prestamos/${prestamoAbonoActual.id}/abono-extraordinario`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body: JSON.stringify({

                                valor:
                                    valorAbono,

                                fecha_abono:
                                    fecha.value,

                                medio_pago:
                                    medio.value,

                                observacion:
                                    observacion
                                        ? observacion.value.trim()
                                        : ''

                            })

                        }
                    );


                const resultado =
                    await respuesta.json();


                if (
                    !respuesta.ok ||
                    !resultado.ok
                ) {

                    throw new Error(
                        resultado.error ||
                        'No fue posible registrar el abono.'
                    );

                }


                console.log(
                    '✅ Abono extraordinario registrado:',
                    resultado
                );


                if (modalAbonoExtraordinario) {
                    modalAbonoExtraordinario.hide();
                }


                mostrarMensaje(
                    resultado.mensaje ||
                    'Abono extraordinario registrado correctamente.',
                    'success'
                );


                /* =================================================
                   ACTUALIZAR LISTA E INDICADORES
                   ================================================= */

                await cargarPrestamos();


            } catch (error) {

                console.error(
                    '❌ Error registrando abono:',
                    error
                );


                mostrarMensaje(
                    error.message ||
                    'No fue posible registrar el abono.',
                    'error'
                );


            } finally {

                btnRegistrarAbono.disabled = false;

                btnRegistrarAbono.innerHTML = `
                    <i class="fas fa-check"></i>
                    Registrar abono
                `;

            }

        }
    );

}


    /* ========================================================
   GUARDAR PRÉSTAMO
   ======================================================== */

if (btnGuardarPrestamo) {

    btnGuardarPrestamo.addEventListener('click', async () => {

        const datos =
            obtenerDatosFormulario();

        const validacion =
            validarFormulario(datos);

        if (!validacion.valido) {

            mostrarMensaje(
                validacion.mensaje,
                'error'
            );

            return;
        }

        try {

            // Evitar múltiples envíos mientras se procesa
            btnGuardarPrestamo.disabled = true;

            btnGuardarPrestamo.textContent = 'Guardando...';

            const respuesta = await fetch(
                '/nomina/prestamos',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(datos)
                }
            );

            const resultado =
                await respuesta.json();

            if (!respuesta.ok || !resultado.ok) {

                throw new Error(
                    resultado.error ||
                    'No fue posible registrar el préstamo.'
                );
            }

            console.log(
                '✅ Préstamo registrado:',
                resultado
            );

            mostrarMensaje(
                resultado.mensaje ||
                'Préstamo registrado correctamente.',
                'success'
            );

            // Cerrar modal
            if (modalNuevoPrestamo) {
                modalNuevoPrestamo.hide();
            }

            // Limpiar formulario
limpiarFormulario();

// Actualizar automáticamente la lista
// y los indicadores del dashboard
await cargarPrestamos();

        } catch (error) {

            console.error(
                '❌ Error al registrar préstamo:',
                error
            );

            mostrarMensaje(
                error.message ||
                'Ocurrió un error al registrar el préstamo.',
                'error'
            );

        } finally {

            // Reactivar botón
            btnGuardarPrestamo.disabled = false;

            btnGuardarPrestamo.textContent =
                'Guardar préstamo';

        }

    });

}

/* ========================================================
   FORMATO DE VALORES MONETARIOS
   ======================================================== */

function formatearMoneda(valor) {

    if (valor === null || valor === undefined || valor === '') {
        return '';
    }

    let numero;

    if (typeof valor === 'number') {

        numero = valor;

    } else {

        const texto = String(valor)
            .trim()
            .replace(/\$/g, '')
            .replace(/\s/g, '');

        // Valores provenientes de la base de datos:
        // 500000.00
        if (/^\d+\.\d{1,2}$/.test(texto)) {

            numero = Number(texto);

        } else {

            // Valores escritos/formateados en Colombia:
            // $ 500.000
            numero = Number(
                texto
                    .replace(/\./g, '')
                    .replace(',', '.')
            );

        }

    }

    if (!Number.isFinite(numero)) {
        return '';
    }

    return '$ ' + Math.round(numero).toLocaleString('es-CO');
}

const campoValorPrestamo =
    document.getElementById('valorPrestamo');

const campoValorCuota =
    document.getElementById('valorCuota');


if (campoValorPrestamo) {

    campoValorPrestamo.addEventListener('input', () => {

        campoValorPrestamo.value =
            formatearMoneda(campoValorPrestamo.value);

    });

}


if (campoValorCuota) {

    campoValorCuota.addEventListener('input', () => {

        campoValorCuota.value =
            formatearMoneda(campoValorCuota.value);

    });

}


    /* ========================================================
       OBTENER DATOS DEL FORMULARIO
       ======================================================== */

    function obtenerDatosFormulario() {

        const empleado =
            document.getElementById(
                'empleadoPrestamo'
            );

        const fecha =
            document.getElementById(
                'fechaPrestamo'
            );

        const valor =
            document.getElementById(
                'valorPrestamo'
            );

        const porcentaje =
            document.getElementById(
                'porcentajeInteres'
            );

        const medio =
            document.getElementById(
                'medioDesembolso'
            );

        const periodicidad =
            document.getElementById(
                'periodicidadPrestamo'
            );

        const cuota =
    document.getElementById(
        'valorCuota'
    );

const cantidadCuotas =
    document.getElementById(
        'cantidadCuotas'
    );

const primeraCuota =
    document.getElementById(
        'fechaPrimeraCuota'
    );

        const observacion =
            document.getElementById(
                'observacionPrestamo'
            );


        return {

            empleado_id:
                empleado
                    ? empleado.value
                    : '',

            fecha_prestamo:
                fecha
                    ? fecha.value
                    : '',

            valor_prestamo:
    valor
        ? Number(
            valor.value.replace(/\D/g, '')
        )
        : 0,

            tiene_interes:
                tieneInteres
                    ? tieneInteres.checked
                    : false,

            porcentaje_interes:
                porcentaje
                    ? Number(porcentaje.value || 0)
                    : 0,

            medio_desembolso:
                medio
                    ? medio.value
                    : '',

            periodicidad:
                periodicidad
                    ? periodicidad.value
                    : '',

            valor_cuota:
    cuota
        ? Number(
            cuota.value.replace(/\D/g, '')
        )
        : 0,

cantidad_cuotas:
    cantidadCuotas
        ? Number(cantidadCuotas.value || 0)
        : 0,

fecha_primera_cuota:
    primeraCuota
        ? primeraCuota.value
        : '',

            observacion:
                observacion
                    ? observacion.value.trim()
                    : ''

        };

    }


    /* ========================================================
       VALIDAR FORMULARIO
       ======================================================== */

    function validarFormulario(datos) {


        if (!datos.empleado_id) {

            return {
                valido: false,
                mensaje: 'Seleccione un empleado.'
            };

        }


        if (!datos.fecha_prestamo) {

            return {
                valido: false,
                mensaje: 'Seleccione la fecha del préstamo.'
            };

        }


        if (
            !datos.valor_prestamo ||
            datos.valor_prestamo <= 0
        ) {

            return {
                valido: false,
                mensaje:
                    'Ingrese un valor de préstamo válido.'
            };

        }


        if (
            datos.tiene_interes &&
            (
                !datos.porcentaje_interes ||
                datos.porcentaje_interes <= 0
            )
        ) {

            return {
                valido: false,
                mensaje:
                    'Ingrese el porcentaje de interés pactado.'
            };

        }


        if (!datos.medio_desembolso) {

            return {
                valido: false,
                mensaje:
                    'Seleccione el medio de desembolso.'
            };

        }


        if (!datos.periodicidad) {

            return {
                valido: false,
                mensaje:
                    'Seleccione la periodicidad del préstamo.'
            };

        }


        if (
            !datos.valor_cuota ||
            datos.valor_cuota <= 0
        ) {

            return {
                valido: false,
                mensaje:
                    'Ingrese un valor de cuota válido.'
            };

        }

        // =====================================================
// VALIDAR CANTIDAD DE CUOTAS
// =====================================================

if (
    !datos.cantidad_cuotas ||
    datos.cantidad_cuotas <= 0 ||
    !Number.isInteger(datos.cantidad_cuotas)
) {
    return {
        valido: false,
        mensaje: 'Ingrese una cantidad de cuotas válida.'
    };
}

const totalConfigurado =
    datos.valor_cuota * datos.cantidad_cuotas;

const totalSinUltima =
    datos.valor_cuota * (datos.cantidad_cuotas - 1);

const ultimaCuota =
    datos.valor_prestamo - totalSinUltima;

// Las cuotas no alcanzan para cubrir el préstamo.
if (totalConfigurado < datos.valor_prestamo) {
    return {
        valido: false,
        mensaje: `Con ${datos.cantidad_cuotas} cuotas de ${formatearMoneda(datos.valor_cuota)} no alcanza para cubrir el préstamo.`
    };
}

// La cantidad de cuotas es demasiado alta.
if (ultimaCuota <= 0) {
    return {
        valido: false,
        mensaje: 'La cantidad de cuotas es demasiado alta para el valor de la cuota.'
    };
}

        /* ========================================================
   VALIDAR VALOR DE CUOTA
   ======================================================== */

const porcentajeInteres =
    datos.tiene_interes
        ? datos.porcentaje_interes
        : 0;

const valorInteres =
    datos.valor_prestamo *
    (porcentajeInteres / 100);

const valorTotal =
    datos.valor_prestamo +
    valorInteres;


if (datos.valor_cuota > valorTotal) {

    return {
        valido: false,
        mensaje:
            `El valor de la cuota no puede ser mayor al total del préstamo (${formatearMoneda(valorTotal)}).`
    };

}


        if (!datos.fecha_primera_cuota) {

            return {
                valido: false,
                mensaje:
                    'Seleccione la fecha de la primera cuota.'
            };

        }


        return {
            valido: true
        };

    }


    /* ========================================================
       LIMPIAR FORMULARIO
       ======================================================== */

    function limpiarFormulario() {

        const formulario =
            modalElement
                ? modalElement.querySelector('form')
                : null;


        /*
         * Como actualmente el modal no tiene <form>,
         * limpiamos cada campo manualmente.
         */

        const campos =
            modalElement
                ? modalElement.querySelectorAll(
                    'input, select, textarea'
                )
                : [];


        campos.forEach(campo => {

            if (campo.type === 'checkbox') {

                campo.checked = false;

            } else {

                campo.value = '';

            }

        });


        if (contenedorPorcentajeInteres) {

            contenedorPorcentajeInteres.hidden = true;

        }

    }


    /* ========================================================
       FECHA ACTUAL
       ======================================================== */

    function establecerFechaActual() {

        const fecha =
            document.getElementById(
                'fechaPrestamo'
            );


        if (!fecha) {
            return;
        }


        const hoy =
            new Date();


        const year =
            hoy.getFullYear();


        const month =
            String(
                hoy.getMonth() + 1
            ).padStart(2, '0');


        const day =
            String(
                hoy.getDate()
            ).padStart(2, '0');


        fecha.value =
            `${year}-${month}-${day}`;

    }


    /* ========================================================
       MENSAJES
       ======================================================== */

    function mostrarMensaje(mensaje, tipo = 'success') {

    // Eliminar notificación anterior
    const anterior =
        document.querySelector('.prestamo-toast');

    if (anterior) {
        anterior.remove();
    }

    // Crear notificación
    const toast =
        document.createElement('div');

    toast.className =
        `prestamo-toast prestamo-toast-${tipo}`;

    const icono =
        tipo === 'error'
            ? 'fa-circle-exclamation'
            : 'fa-circle-check';

    const titulo =
        tipo === 'error'
            ? 'Atención'
            : 'Operación exitosa';

    toast.innerHTML = `
        <div class="prestamo-toast-icon">
            <i class="fas ${icono}"></i>
        </div>

        <div class="prestamo-toast-contenido">
            <strong>${titulo}</strong>
            <span>${mensaje}</span>
        </div>

        <button
            type="button"
            class="prestamo-toast-cerrar"
            aria-label="Cerrar"
        >
            <i class="fas fa-xmark"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // Cerrar manualmente
    const botonCerrar =
        toast.querySelector('.prestamo-toast-cerrar');

    if (botonCerrar) {

        botonCerrar.addEventListener('click', () => {

            toast.classList.add('ocultando');

            setTimeout(() => {
                toast.remove();
            }, 250);

        });

    }

    // Mostrar con animación
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Cerrar automáticamente después de 4 segundos
    setTimeout(() => {

        if (!toast.isConnected) {
            return;
        }

        toast.classList.add('ocultando');

        setTimeout(() => {
            toast.remove();
        }, 250);

    }, 4000);

}


    /* ========================================================
   INICIALIZACIÓN
   ======================================================== */

   const buscadorEmpleadoPrestamo =
    document.getElementById('buscadorEmpleadoPrestamo');

if (buscadorEmpleadoPrestamo) {

    buscadorEmpleadoPrestamo.addEventListener(
        'input',
        buscarEmpleadosPrestamo
    );

}

cargarEmpleados();

cargarPrestamos();

console.log(
    '✅ Interfaz de Préstamos lista'
);

});