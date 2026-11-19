
document.addEventListener('DOMContentLoaded', () => {

    console.log('Liquidación de Nómina inicializada');

    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');

    const listaTramos = document.getElementById('listaTramosEtapa');
    const btnAgregarTramo = document.getElementById('btnAgregarTramo');

    const totalDiasEtapa = document.getElementById('totalDiasEtapa');
    const mensajeEtapas = document.getElementById('mensajeEtapas');

    const seccionEtapas = document.getElementById('seccionEtapasSena');

    let tramos = [];
    let siguienteId = 1;

    const formatoMoneda = valor =>
        new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(valor);


    // ==========================================
    // CONFIGURAR QUINCENAS
    // ==========================================

    function establecerQuincena(tipo) {

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth();

        let inicio;
        let fin;

        if (tipo === 1) {

            inicio = new Date(anio, mes, 1);
            fin = new Date(anio, mes, 15);

        } else {

            inicio = new Date(anio, mes, 16);
            fin = new Date(anio, mes + 1, 0);

        }

        fechaInicio.value = convertirFecha(inicio);
        fechaFin.value = convertirFecha(fin);

        actualizarPeriodo();

        if (seccionEtapas && !seccionEtapas.hidden) {
            renderizarTramos();
        }

    }

    function convertirFecha(fecha) {

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;

    }

    function actualizarPeriodo() {

        if (!fechaInicio.value || !fechaFin.value) return;

        if (fechaInicio.value > fechaFin.value) {
            alert('La fecha inicial no puede ser posterior a la fecha final.');
            return;
        }

        const dias = obtenerDiasPeriodo();

        document.getElementById('resumenPeriodo').textContent =
            `${fechaInicio.value} al ${fechaFin.value}`;

        totalDiasEtapa.textContent = `0 / ${dias} días`;

        if (tramos.length > 0) {
            renderizarTramos();
        }

    }

    function obtenerDiasPeriodo() {

        if (!fechaInicio.value || !fechaFin.value) return 0;

        const inicio = new Date(`${fechaInicio.value}T00:00:00`);
        const fin = new Date(`${fechaFin.value}T00:00:00`);

        return Math.floor((fin - inicio) / 86400000) + 1;

    }

    document.getElementById('btnQuincena1')
        .addEventListener('click', () => establecerQuincena(1));

    document.getElementById('btnQuincena2')
        .addEventListener('click', () => establecerQuincena(2));

    fechaInicio.addEventListener('change', actualizarPeriodo);
    fechaFin.addEventListener('change', actualizarPeriodo);


    // ==========================================
    // MANEJO DE TRAMOS SENA
    // ==========================================

    function agregarTramo() {

        const inicio = fechaInicio.value;
        const fin = fechaFin.value;

        if (!inicio || !fin || inicio > fin) {
            alert('Primero selecciona un período válido.');
            return;
        }

        tramos.push({
            id: siguienteId++,
            etapa: 'lectiva',
            desde: inicio,
            hasta: fin
        });

        renderizarTramos();

    }

    function eliminarTramo(id) {

        tramos = tramos.filter(tramo => tramo.id !== id);

        renderizarTramos();

    }

    function renderizarTramos() {

        listaTramos.innerHTML = '';

        tramos.forEach(tramo => {

            const fila = document.createElement('div');

            fila.className = 'tramo-etapa';

            fila.innerHTML = `
                <div>
                    <label>Etapa</label>

                    <select class="select-etapa">
                        <option value="lectiva"
                            ${tramo.etapa === 'lectiva' ? 'selected' : ''}>
                            Lectiva - 75%
                        </option>

                        <option value="productiva"
                            ${tramo.etapa === 'productiva' ? 'selected' : ''}>
                            Productiva - 100%
                        </option>
                    </select>
                </div>

                <div>
                    <label>Desde</label>
                    <input type="date" class="fecha-tramo-inicio"
                        value="${tramo.desde}">
                </div>

                <div>
                    <label>Hasta</label>
                    <input type="date" class="fecha-tramo-fin"
                        value="${tramo.hasta}">
                </div>

                <button type="button"
                    class="btn-eliminar-tramo"
                    title="Eliminar tramo">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            const select = fila.querySelector('.select-etapa');
            const desde = fila.querySelector('.fecha-tramo-inicio');
            const hasta = fila.querySelector('.fecha-tramo-fin');
            const eliminar = fila.querySelector('.btn-eliminar-tramo');

            select.addEventListener('change', () => {
                tramo.etapa = select.value;
                validarTramos();
            });

            desde.addEventListener('change', () => {
                tramo.desde = desde.value;
                validarTramos();
            });

            hasta.addEventListener('change', () => {
                tramo.hasta = hasta.value;
                validarTramos();
            });

            eliminar.addEventListener('click', () => {
                eliminarTramo(tramo.id);
            });

            listaTramos.appendChild(fila);

        });

        validarTramos();

    }

    function validarTramos() {

        const diasPeriodo = obtenerDiasPeriodo();

        let diasTotales = 0;
        let fechasOcupadas = new Set();

        let error = '';

        for (const tramo of tramos) {

            if (!tramo.desde || !tramo.hasta) {
                error = 'Completa las fechas de todos los tramos.';
                break;
            }

            if (
                tramo.desde < fechaInicio.value ||
                tramo.hasta > fechaFin.value ||
                tramo.desde > tramo.hasta
            ) {
                error = 'Los tramos deben estar dentro del período seleccionado.';
                break;
            }

            const inicio = new Date(`${tramo.desde}T00:00:00`);
            const fin = new Date(`${tramo.hasta}T00:00:00`);

            for (
                let fecha = new Date(inicio);
                fecha <= fin;
                fecha.setDate(fecha.getDate() + 1)
            ) {

                const clave = convertirFecha(fecha);

                if (fechasOcupadas.has(clave)) {
                    error = 'Hay fechas superpuestas entre los tramos.';
                    break;
                }

                fechasOcupadas.add(clave);

            }

            if (error) break;

            diasTotales += Math.floor((fin - inicio) / 86400000) + 1;

        }

        if (!error && diasTotales !== diasPeriodo) {
            error = 'Debes distribuir todos los días de la quincena.';
        }

        totalDiasEtapa.textContent =
            `${diasTotales} / ${diasPeriodo} días`;

        mensajeEtapas.textContent = error || 'Distribución de etapas completa.';

        mensajeEtapas.style.color = error ? '#dc2626' : '#16a34a';

        return !error && diasTotales === diasPeriodo && tramos.length > 0;

    }

    btnAgregarTramo.addEventListener('click', agregarTramo);


    // ==========================================
    // SELECCIÓN DE COLABORADOR
    // ==========================================

    const inputBuscar = document.getElementById('buscarColaborador');

    const btnCambiar = document.getElementById('btnCambiarColaborador');

    function limpiarSeleccion() {

    // Limpiar empleado seleccionado
    empleadoSeleccionado = null;

    // Limpiar buscador y resultados
    inputBuscar.value = '';
    resultados.innerHTML = '';
    resultados.hidden = true;

    // Ocultar información del colaborador
    document.getElementById('informacionColaborador').hidden = true;
    document.getElementById('seccionEtapasSena').hidden = true;

    // Restablecer detalle
    document.getElementById('detallePlaceholder').hidden = false;
    document.getElementById('detalleLiquidacion').hidden = true;

    // Restablecer resumen
    document.getElementById('resumenEmpleado').textContent = 'Ninguno';
    document.getElementById('resumenNombre').textContent = 'Sin colaborador';

    // Limpiar tramos SENA
    tramos = [];
    listaTramos.innerHTML = '';

    // Bloquear preparación
    document.getElementById('btnPrepararLiquidacion').disabled = true;
}


    // ==========================================
    // 🔎 BUSCADOR REAL DE EMPLEADOS
    // ==========================================

    const resultados = document.getElementById(
        'resultadosColaboradores'
    );

    let empleadoSeleccionado = null;
    let consultaActual = 0;

    let temporizadorBusqueda;

    async function buscarEmpleados() {

        const texto = inputBuscar.value.trim();

        resultados.innerHTML = '';
        resultados.hidden = true;

        if (texto.length < 2) return;

        if (!fechaInicio.value || !fechaFin.value) {
            resultados.hidden = false;
            resultados.textContent =
                'Selecciona primero el período de liquidación.';
            return;
        }

        const numeroConsulta = ++consultaActual;

        const parametros = new URLSearchParams({
            buscar: texto,
            inicio: fechaInicio.value,
            fin: fechaFin.value
        });

        try {

            const respuesta = await fetch(
                `/api/nomina/buscar-empleados?${parametros}`,
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );

            const data = await respuesta.json();

            if (numeroConsulta !== consultaActual) return;

            if (!respuesta.ok) {

                if (respuesta.status === 401) {
                    resultados.textContent =
                        'Tu sesión ha expirado. Inicia sesión nuevamente.';
                } else if (respuesta.status === 403) {
                    resultados.textContent =
                        'No tienes permisos para consultar empleados.';
                } else {
                    resultados.textContent =
                        data.message || 'No se pudo realizar la búsqueda.';
                }

                resultados.hidden = false;
                return;
            }

            if (!data.empleados || data.empleados.length === 0) {

                resultados.textContent =
                    'No se encontraron colaboradores para este período.';

                resultados.hidden = false;
                return;

            }

            data.empleados.forEach(empleado => {

                const boton = document.createElement('button');

                boton.type = 'button';
                boton.className = 'resultado-colaborador';

                const nombre = document.createElement('strong');

                nombre.textContent = empleado.nombre;

                const informacion = document.createElement('small');

                informacion.textContent =
                    `${empleado.tipo_documento || ''} ` +
                    `${empleado.numero_documento || ''} · ` +
                    `${empleado.tipo_vinculacion}`;

                boton.appendChild(nombre);
                boton.appendChild(informacion);

                boton.addEventListener('click', () => {
                    seleccionarEmpleado(empleado);
                });

                resultados.appendChild(boton);

            });

            resultados.hidden = false;

        } catch (error) {

            console.error('Error buscando empleados:', error);

            resultados.textContent =
                'No fue posible conectar con el servidor.';

            resultados.hidden = false;

        }

    }


    // ==========================================
    // SELECCIONAR EMPLEADO
    // ==========================================

async function seleccionarEmpleado(empleado) {

        empleadoSeleccionado = empleado;

        inputBuscar.value = empleado.nombre;

        resultados.hidden = true;

        document.getElementById(
            'informacionColaborador'
        ).hidden = false;

        document.getElementById(
            'nombreColaborador'
        ).textContent = empleado.nombre;

        document.getElementById(
            'documentoColaborador'
        ).textContent =
            `${empleado.tipo_documento || ''} ` +
            `${empleado.numero_documento || ''}`;

        document.getElementById(
            'vinculacionColaborador'
        ).textContent = empleado.tipo_vinculacion;

        document.getElementById(
            'contratoColaborador'
        ).textContent = empleado.tipo_contrato || 'No especificado';

        document.getElementById(
    'salarioColaborador'
).textContent = 'Listo para liquidar';

        document.getElementById(
            'resumenEmpleado'
        ).textContent = empleado.nombre;

        document.getElementById(
            'resumenNombre'
        ).textContent = empleado.nombre;

        document.getElementById(
            'detallePlaceholder'
        ).hidden = true;

        document.getElementById(
            'detalleLiquidacion'
        ).hidden = false;

        const esAprendiz =
            empleado.tipo_vinculacion
                .toLowerCase()
                .trim() === 'aprendiz sena';

        seccionEtapas.hidden = !esAprendiz;

        if (esAprendiz) {

            tramos = [];

            const dias = obtenerDiasPeriodo();

            // Inicialmente se propone un único tramo.
            // El usuario podrá cambiarlo y dividirlo.
            if (dias > 0) {
                tramos.push({
                    id: siguienteId++,
                    etapa: 'lectiva',
                    desde: fechaInicio.value,
                    hasta: fechaFin.value
                });
            }

            renderizarTramos();

        } else {

            tramos = [];
            listaTramos.innerHTML = '';

        }

        const botonPreparar = document.getElementById(
    'btnPrepararLiquidacion'
);

botonPreparar.disabled = true;

// Consultar automáticamente los valores del empleado.
await consultarValoresEmpleado();

botonPreparar.disabled = false;

    }
    // ==========================================
// CONSULTAR VALORES AUTOMÁTICAMENTE
// ==========================================

async function consultarValoresEmpleado() {

    if (!empleadoSeleccionado) return;

    const esAprendiz =
        empleadoSeleccionado.tipo_vinculacion
            .toLowerCase()
            .trim() === 'aprendiz sena';

    try {

        const respuesta = await fetch(
            '/api/nomina/liquidacion/preparar',
            {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    empleado_id: empleadoSeleccionado.empleado_id,
                    contrato_id: empleadoSeleccionado.contrato_id,
                    inicio: fechaInicio.value,
                    fin: fechaFin.value,
                    tramos: esAprendiz ? tramos : []
                })
            }
        );

        const data = await respuesta.json();

        if (!respuesta.ok || !data.ok) {
            throw new Error(
                data.mensaje || 'No se pudieron consultar los valores.'
            );
        }

        const calculo = data.calculo || {};

        const salarioMensual = Number(
            calculo.salario_mensual || 0
        );

        const salarioPeriodo = Number(
            calculo.salario_periodo || 0
        );

        const auxilio = Number(
            calculo.auxilio_transporte || 0
        );

        const totalDevengados = Number(
            calculo.total_devengados ??
            calculo.total_devengado_base ??
            (salarioPeriodo + auxilio)
        );

        // El endpoint actual todavía no devuelve
        // las deducciones calculadas.
        const totalDeducciones = Number(
            calculo.total_deducciones || 0
        );

        const neto = Number(
            calculo.neto_pagar ??
            (totalDevengados - totalDeducciones)
        );

        const moneda = valor => formatoMoneda(valor);

        // Información del colaborador.
        document.getElementById(
            'salarioColaborador'
        ).textContent = moneda(salarioMensual);

        // Resumen lateral.
        document.getElementById(
            'resumenSalario'
        ).textContent = moneda(salarioPeriodo + auxilio);

        document.getElementById(
            'resumenDevengados'
        ).textContent = moneda(
            Number(calculo.otros_devengados || 0)
        );

        document.getElementById(
            'resumenDescuentos'
        ).textContent = moneda(totalDeducciones);

        document.getElementById(
            'resumenNetoFinal'
        ).textContent = moneda(neto);

        document.getElementById(
            'resumenNeto'
        ).textContent = moneda(neto);

        document.getElementById(
            'resumenTotal'
        ).textContent = moneda(neto);

        // Totales del detalle.
        document.getElementById(
            'totalDevengado'
        ).textContent = moneda(totalDevengados);

        document.getElementById(
            'totalDeducciones'
        ).textContent = moneda(totalDeducciones);

        document.getElementById(
            'totalNeto'
        ).textContent = moneda(neto);

        document.getElementById(
            'resumenFecha'
        ).textContent =
            `${data.periodo.inicio} al ${data.periodo.fin}`;

    } catch (error) {

        console.error(
            'Error consultando valores del colaborador:',
            error
        );

        alert(error.message);

    }
}


    // ==========================================
    // EVENTO DE BÚSQUEDA
    // ==========================================

    inputBuscar.addEventListener('input', () => {

        clearTimeout(temporizadorBusqueda);

        empleadoSeleccionado = null;

        document.getElementById(
            'informacionColaborador'
        ).hidden = true;

        document.getElementById(
            'seccionEtapasSena'
        ).hidden = true;

        document.getElementById(
            'detallePlaceholder'
        ).hidden = false;

        document.getElementById(
            'detalleLiquidacion'
        ).hidden = true;

        document.getElementById(
            'btnPrepararLiquidacion'
        ).disabled = true;

        document.getElementById(
            'resumenEmpleado'
        ).textContent = 'Ninguno';

        document.getElementById(
            'resumenNombre'
        ).textContent = 'Sin colaborador';

        temporizadorBusqueda = setTimeout(
            buscarEmpleados,
            350
        );

    });


// =========================================================
// PREPARAR PRELIQUIDACIÓN
// =========================================================

async function prepararLiquidacion() {

    if (!empleadoSeleccionado) {
        alert('Selecciona primero un colaborador.');
        return;
    }

    if (!fechaInicio.value || !fechaFin.value) {
        alert('Selecciona el período de liquidación.');
        return;
    }

    const esAprendiz =
        empleadoSeleccionado.tipo_vinculacion
            .toLowerCase()
            .trim() === 'aprendiz sena';

    if (esAprendiz && !validarTramos()) {
        alert('Revisa la distribución de las etapas del aprendiz.');
        return;
    }

    const boton = document.getElementById(
        'btnPrepararLiquidacion'
    );

    boton.disabled = true;
    boton.textContent = 'Preparando...';

    try {

        const respuesta = await fetch(
            '/api/nomina/liquidacion/preparar',
            {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    empleado_id: empleadoSeleccionado.empleado_id,
                    contrato_id: empleadoSeleccionado.contrato_id,
                    inicio: fechaInicio.value,
                    fin: fechaFin.value,
                    tramos: esAprendiz ? tramos : []
                })
            }
        );

        const data = await respuesta.json();

        if (!respuesta.ok || !data.ok) {
            throw new Error(data.mensaje || 'No fue posible preparar la liquidación.');
        }

        mostrarPreliquidacion(data);

    } catch (error) {

        console.error('Error preparando liquidación:', error);
        alert(error.message);

    } finally {

        boton.disabled = false;
        boton.innerHTML = 'Preparar liquidación';

    }
}


// =========================================================
// MOSTRAR RESULTADO EN PANTALLA
// =========================================================


function mostrarPreliquidacion(data) {

    const detalle = document.getElementById('detalleLiquidacion');

    let panel = document.getElementById('resultadoPreliquidacion');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'resultadoPreliquidacion';
        panel.className = 'resultado-preliquidacion';
        detalle.appendChild(panel);
    }

    const moneda = valor => formatoMoneda(Number(valor || 0));

    const calculo = data.calculo || {};
    const novedades = data.novedades?.detalle || [];

    const etapas = calculo.etapas || [];

    const etapasHTML = etapas.map(etapa => `
        <tr>
            <td>${etapa.etapa}</td>
            <td>${etapa.desde} al ${etapa.hasta}</td>
            <td>${etapa.dias}</td>
            <td>${etapa.porcentaje}%</td>
            <td>${moneda(etapa.valor)}</td>
        </tr>
    `).join('');

    const novedadesHTML = novedades.map(novedad => `
        <tr>
            <td>${novedad.tipo}</td>
            <td>${novedad.fecha_inicio || '-'}</td>
            <td>${novedad.fecha_fin || '-'}</td>
            <td>${novedad.tratamiento === 'PENDIENTE_DE_CALCULO'
                ? 'Pendiente de cálculo'
                : novedad.tratamiento === 'NO_DESCONTAR_SOLICITUD'
                    ? 'No genera descuento'
                    : novedad.tratamiento === 'DEVENGADO'
                        ? 'Devengado'
                        : 'Deducción'}</td>
            <td>${novedad.valor !== null
                ? moneda(novedad.valor)
                : 'Por determinar'}</td>
        </tr>
    `).join('');

    const totalDevengados = Number(
        calculo.total_devengados ?? calculo.total_devengado_base ?? 0
    );

    const totalDeducciones = Number(
        calculo.total_deducciones || 0
    );

    const netoPagar = Number(
        calculo.neto_pagar ?? (totalDevengados - totalDeducciones)
    );


// =============================================
// ACTUALIZAR VALORES DE LA INTERFAZ
// =============================================

// Salario del período + auxilio de transporte
const salarioApoyos =
    Number(calculo.salario_periodo || 0) +
    Number(calculo.auxilio_transporte || 0);

// Salario y apoyos
document.getElementById('resumenSalario').textContent =
    moneda(salarioApoyos);

// Otros devengados
document.getElementById('resumenDevengados').textContent =
    moneda(calculo.otros_devengados || 0);

// Deducciones
document.getElementById('resumenDescuentos').textContent =
    moneda(totalDeducciones);

// Neto del resumen lateral
document.getElementById('resumenNetoFinal').textContent =
    moneda(netoPagar);

// Neto superior
document.getElementById('resumenNeto').textContent =
    moneda(netoPagar);

// Total del encabezado lateral
document.getElementById('resumenTotal').textContent =
    moneda(netoPagar);

// Detalle de liquidación
document.getElementById('totalDevengado').textContent =
    moneda(totalDevengados);

document.getElementById('totalDeducciones').textContent =
    moneda(totalDeducciones);

document.getElementById('totalNeto').textContent =
    moneda(netoPagar);

// Salario mensual de referencia
document.getElementById('salarioColaborador').textContent =
    moneda(calculo.salario_mensual || 0);

// Fecha del período
document.getElementById('resumenFecha').textContent =
    `${data.periodo.inicio} al ${data.periodo.fin}`;


    panel.innerHTML = `
        <h3>Preliquidación de nómina</h3>

        <p>
            <strong>Colaborador:</strong>
            ${data.empleado.nombre}
        </p>

        <p>
            <strong>Documento:</strong>
            ${data.empleado.numero_documento}
        </p>

        <p>
            <strong>Período:</strong>
            ${data.periodo.inicio} al ${data.periodo.fin}
        </p>

        <p>
            <strong>Vinculación:</strong>
            ${data.contrato.tipo_vinculacion}
        </p>

        <hr>

        <h4>Devengados</h4>

        <table class="table">
            <tbody>
                <tr>
                    <td>Salario del período</td>
                    <td class="text-end">${moneda(calculo.salario_periodo)}</td>
                </tr>
                <tr>
                    <td>Auxilio de transporte</td>
                    <td class="text-end">${moneda(calculo.auxilio_transporte)}</td>
                </tr>
                <tr>
                    <td>Otros ingresos variables</td>
                    <td class="text-end">${moneda(calculo.otros_devengados)}</td>
                </tr>
                <tr>
                    <th>Total devengado</th>
                    <th class="text-end">${moneda(totalDevengados)}</th>
                </tr>
            </tbody>
        </table>

        ${etapas.length ? `
            <h4>Distribución de etapas SENA</h4>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Etapa</th>
                            <th>Fechas</th>
                            <th>Días</th>
                            <th>Porcentaje</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>${etapasHTML}</tbody>
                </table>
            </div>
        ` : ''}

        <hr>

        <h4>Novedades del período</h4>

        ${novedades.length ? `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Tratamiento</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>${novedadesHTML}</tbody>
                </table>
            </div>
        ` : `
            <p>No hay novedades aprobadas para este período.</p>
        `}

        <hr>

        <h4>Deducciones</h4>

        <p>
            Total deducciones:
            <strong>${moneda(totalDeducciones)}</strong>
        </p>

        <hr>

        <h3>Total devengado: ${moneda(totalDevengados)}</h3>

        <h3>Total deducciones: ${moneda(totalDeducciones)}</h3>

        <h2>Neto preliminar a pagar: ${moneda(netoPagar)}</h2>

        ${data.novedades?.pendientes_calculo?.length ? `
            <p class="text-warning">
                Hay ${data.novedades.pendientes_calculo.length}
                novedad(es) que todavía requieren reglas de cálculo.
            </p>
        ` : ''}

        <p>
            <strong>Estado:</strong> Preliquidación sin guardar.
        </p>
    `;

    panel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}



    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    limpiarSeleccion();

document.getElementById('btnPrepararLiquidacion')
    .addEventListener('click', prepararLiquidacion);

    console.log('Interfaz de liquidación lista.');

});
