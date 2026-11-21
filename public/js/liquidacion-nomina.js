
document.addEventListener('DOMContentLoaded', () => {

    console.log('Liquidación de Nómina inicializada');

    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');

    const listaTramos = document.getElementById('listaTramosEtapa');
    const btnAgregarTramo = document.getElementById('btnAgregarTramo');

    const totalDiasEtapa = document.getElementById('totalDiasEtapa');
    const mensajeEtapas = document.getElementById('mensajeEtapas');

    const seccionEtapas = document.getElementById('seccionEtapasSena');
    const modoEtapaSena = document.getElementById('modoEtapaSena');
const etapaUnicaSena = document.getElementById('etapaUnicaSena');

const contenedorEtapaUnica = document.getElementById('contenedorEtapaUnica');
const contenedorTramosEtapa = document.getElementById('contenedorTramosEtapa');

    let tramos = [];
    let siguienteId = 1;

    // ==========================================
// PRÉSTAMOS DEL COLABORADOR
// ==========================================

let prestamosEmpleado = [];
let saldoTotalPrestamos = 0;
let descuentoPrestamos = 0;
let distribucionPrestamos = [];

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

    }

    function convertirFecha(fecha) {

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;

    }

 async function actualizarPeriodo() {

        if (!fechaInicio.value || !fechaFin.value) return;

        if (fechaInicio.value > fechaFin.value) {
            alert('La fecha inicial no puede ser posterior a la fecha final.');
            return;
        }

        const dias = obtenerDiasPeriodo();

        document.getElementById('resumenPeriodo').textContent =
            `${fechaInicio.value} al ${fechaFin.value}`;

        totalDiasEtapa.textContent = `0 / ${dias} días`;

        if (!seccionEtapas.hidden) {

    if (modoEtapaSena.value === 'unica') {

        sincronizarModoEtapaSena();

    } else if (tramos.length > 0) {

        renderizarTramos();

    }

}
if (
    !seccionEtapas.hidden &&
    empleadoSeleccionado &&
    validarTramos()
) {
    await consultarValoresEmpleado();
}

    }

    function obtenerDiasPeriodo() {

        if (!fechaInicio.value || !fechaFin.value) return 0;

        const inicio = new Date(`${fechaInicio.value}T00:00:00`);
        const fin = new Date(`${fechaFin.value}T00:00:00`);

        return Math.floor((fin - inicio) / 86400000) + 1;

    }

    // ==========================================
// SINCRONIZAR MODO DE ETAPA SENA
// ==========================================

function sincronizarModoEtapaSena() {

    if (!fechaInicio.value || !fechaFin.value) return;

    const modo = modoEtapaSena.value;

    contenedorEtapaUnica.hidden = modo !== 'unica';
    contenedorTramosEtapa.hidden = modo !== 'cambio';

    if (modo === 'unica') {

        tramos = [{
            id: siguienteId++,
            etapa: etapaUnicaSena.value,
            desde: fechaInicio.value,
            hasta: fechaFin.value
        }];

        validarTramos();

    } else {

        if (tramos.length === 0) {

            tramos = [{
                id: siguienteId++,
                etapa: 'lectiva',
                desde: fechaInicio.value,
                hasta: fechaFin.value
            }];

        }

        renderizarTramos();

    }

}

modoEtapaSena.addEventListener('change', async () => {

    sincronizarModoEtapaSena();

    if (empleadoSeleccionado && validarTramos()) {
        await consultarValoresEmpleado();
    }

});

etapaUnicaSena.addEventListener('change', async () => {

    if (modoEtapaSena.value === 'unica') {

        sincronizarModoEtapaSena();

        await consultarValoresEmpleado();

    }

});

    document.getElementById('btnQuincena1')
        .addEventListener('click', () => establecerQuincena(1));

    document.getElementById('btnQuincena2')
        .addEventListener('click', () => establecerQuincena(2));

    fechaInicio.addEventListener('change', actualizarPeriodo);
    fechaFin.addEventListener('change', actualizarPeriodo);


    // ==========================================
    // MANEJO DE TRAMOS SENA
    // ==========================================

async function agregarTramo() {

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
        if (validarTramos()) {
    await consultarValoresEmpleado();
}

    }

   async function eliminarTramo(id) {

    tramos = tramos.filter(tramo => tramo.id !== id);

    renderizarTramos();

    if (validarTramos()) {
        await consultarValoresEmpleado();
    }

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

            select.addEventListener('change', async () => {

    tramo.etapa = select.value;

    if (validarTramos()) {
        await consultarValoresEmpleado();
    }

});

            desde.addEventListener('change', async () => {

    tramo.desde = desde.value;

    if (validarTramos()) {
        await consultarValoresEmpleado();
    }

});

            hasta.addEventListener('change', async () => {

    tramo.hasta = hasta.value;

    if (validarTramos()) {
        await consultarValoresEmpleado();
    }

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

    modoEtapaSena.value = 'unica';
    etapaUnicaSena.value = 'lectiva';

    tramos = [];

    sincronizarModoEtapaSena();

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
// CONSULTAR PRÉSTAMOS ACTIVOS
// ==========================================

async function consultarPrestamosEmpleado(empleadoId) {

    try {

        const respuesta = await fetch(
    `/nomina/prestamos/empleado/${empleadoId}/consolidado`,
            {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const contenido = await respuesta.text();

console.log('Estado de consulta de préstamos:', respuesta.status);
console.log('Respuesta del servidor:', contenido);

let data;

try {
    data = JSON.parse(contenido);
} catch (error) {
    throw new Error(
        'El servidor no devolvió JSON. Revisa la ruta de préstamos. Respuesta: ' +
        contenido.substring(0, 300)
    );
}

        if (!respuesta.ok || !data.ok) {
            throw new Error(
                data.error || 'No fue posible consultar los préstamos.'
            );
        }

        prestamosEmpleado = data.prestamos || [];

        saldoTotalPrestamos = Number(data.saldo_total || 0);

        console.log('Préstamos activos:', prestamosEmpleado);
        console.log('Saldo total de préstamos:', saldoTotalPrestamos);

        return data;

    } catch (error) {

        console.error('Error consultando préstamos:', error);

        throw error;

    }
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

    // ==========================================
// NAVEGACIÓN ENTRE PASOS
// ==========================================

function mostrarPaso(numero) {

    const paso1 = document.querySelector('.layout-liquidacion');
    const paso2 = document.getElementById('contenidoPaso2');

    const indicadores = [
        'indicadorPaso1',
        'indicadorPaso2',
        'indicadorPaso3',
        'indicadorPaso4'
    ];

    paso1.hidden = numero !== 1;
    paso2.hidden = numero !== 2;

    indicadores.forEach((id, indice) => {

        const indicador = document.getElementById(id);

        indicador.classList.toggle(
            'activo',
            indice + 1 === numero
        );

        indicador.classList.toggle(
            'completado',
            indice + 1 < numero
        );

    });

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


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

        // Consultar todos los préstamos activos del colaborador.
// Primero validar la respuesta de la liquidación.
const data = await respuesta.json();

if (!respuesta.ok || !data.ok) {
    throw new Error(
        data.mensaje || 'No fue posible preparar la liquidación.'
    );
}

// Consultar todos los préstamos activos del colaborador.
await consultarPrestamosEmpleado(
    empleadoSeleccionado.empleado_id
);

console.log(
    'Saldo total pendiente de préstamos:',
    formatoMoneda(saldoTotalPrestamos)
);

// Mostrar la preliquidación.
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

    const panel = document.getElementById(
        'resultadoPreliquidacion'
    );

    if (!panel) {
        console.error('No se encontró el contenedor de preliquidación.');
        return;
    }

    const moneda = valor => formatoMoneda(Number(valor || 0));

const formatearFechaPrestamo = fecha => {
    if (!fecha) return '-';

    const fechaTexto = String(fecha).substring(0, 10);
    const [anio, mes, dia] = fechaTexto.split('-');

    return `${dia}/${mes}/${anio}`;
};

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
        <td>${moneda(etapa.auxilio)}</td>
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

    const totalDeduccionesBase = Number(
    calculo.total_deducciones || 0
);

let totalDeducciones = totalDeduccionesBase;

const netoPagarBase = Number(
    calculo.neto_pagar ??
    (totalDevengados - totalDeduccionesBase)
);

let netoPagar = netoPagarBase;

// Reiniciar la simulación para cada preliquidación.
descuentoPrestamos = 0;
distribucionPrestamos = [];

    // SEGURIDAD SOCIAL
const seguridadSocial = calculo.seguridad_social || {};

const descuentoSalud = Number(
    seguridadSocial.salud?.valor || 0
);

const descuentoPension = Number(
    seguridadSocial.pension?.valor || 0
);

const porcentajeSalud = Number(
    seguridadSocial.salud?.porcentaje || 0
);

const porcentajePension = Number(
    seguridadSocial.pension?.porcentaje || 0
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
<th>Salario</th>
<th>Auxilio de transporte</th>
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

<table class="table">
    <tbody>
        ${descuentoSalud > 0 || descuentoPension > 0 ? `
            <tr>
                <td>
                    Salud (${porcentajeSalud}%)
                </td>
                <td class="text-end">
                    ${moneda(descuentoSalud)}
                </td>
            </tr>

            <tr>
                <td>
                    Pensión (${porcentajePension}%)
                </td>
                <td class="text-end">
                    ${moneda(descuentoPension)}
                </td>
            </tr>
        ` : ''}

        <tr>
            <td>Otras deducciones y anticipos</td>
            <td class="text-end">
                ${moneda(
                    totalDeducciones -
                    descuentoSalud -
                    descuentoPension
                )}
            </td>
        </tr>

        <tr>
    <td>Descuento de préstamos</td>
    <td class="text-end" id="valorDescuentoPrestamos">
        ${moneda(0)}
    </td>
</tr>

<tr>
    <th>Total deducciones</th>
    <th class="text-end" id="totalDeduccionesPreliquidacion">
        ${moneda(totalDeducciones)}
    </th>
</tr>
    </tbody>
</table>
<hr>

<h4>Préstamos activos del colaborador</h4>

<div class="card p-3 mb-3">
    <label for="descuentoPrestamosInput">
        Descuento de préstamos para esta quincena
    </label>

    <input
    type="text"
    id="descuentoPrestamosInput"
    class="form-control"
    inputmode="numeric"
    autocomplete="off"
    min="0"
    max="${saldoTotalPrestamos}"
    placeholder="$ 0"
    value=""
>

    <small class="text-muted">
        El descuento no puede superar el saldo total pendiente.
    </small>
</div>

${prestamosEmpleado.length > 0 ? `
    <p>
        <strong>Saldo total pendiente:</strong>
        ${moneda(saldoTotalPrestamos)}
    </p>

    <div class="table-responsive">
        <table class="table">
            <thead>
                <tr>
                    <th>Fecha del préstamo</th>
<th>Valor inicial</th>
<th>Saldo pendiente</th>
<th>Descuento quincenal</th>
<th>Nuevo saldo</th>
                </tr>
            </thead>
            <tbody id="tablaDistribucionPrestamos">
    ${prestamosEmpleado.map(prestamo => `
        <tr>
            <td>${formatearFechaPrestamo(prestamo.fecha_prestamo)}</td>
            <td>${moneda(
                Number(prestamo.valor_prestamo || 0) +
                Number(prestamo.valor_interes || 0)
            )}</td>
            <td>${moneda(prestamo.saldo_pendiente)}</td>
            <td>$ 0</td>
            <td>${moneda(prestamo.saldo_pendiente)}</td>
        </tr>
    `).join('')}
</tbody>
        </table>
    </div>
` : `
    <p>No tiene préstamos activos con saldo pendiente.</p>
`}
    `;

    // =============================================
// SIMULACIÓN DE DESCUENTOS DE PRÉSTAMOS
// =============================================

const inputDescuento = document.getElementById(
    'descuentoPrestamosInput'
);

if (inputDescuento) {

    inputDescuento.addEventListener('focus', () => {
    inputDescuento.value =
        inputDescuento.value.replace(/\D/g, '');
});

inputDescuento.addEventListener('blur', () => {
    const digitos = inputDescuento.value.replace(/\D/g, '');
    let valor = Number(digitos || 0);

    valor = Math.min(valor, saldoTotalPrestamos);

    inputDescuento.value = formatoMoneda(valor);
});

    inputDescuento.addEventListener('input', () => {

        const digitos = inputDescuento.value.replace(/\D/g, '');

let valor = Number(digitos || 0);

        // No permitir descuentos negativos.
        valor = Math.max(valor, 0);

        // No superar el saldo total pendiente.
        valor = Math.min(valor, saldoTotalPrestamos);

        descuentoPrestamos = valor;

        inputDescuento.value = digitos
    ? String(valor)
    : '';

        let restante = valor;

        distribucionPrestamos = prestamosEmpleado.map(prestamo => {

            const saldo = Number(prestamo.saldo_pendiente || 0);

            const aplicado = Math.min(restante, saldo);

            restante -= aplicado;

            return {
                prestamo_id: prestamo.id,
                saldo_anterior: saldo,
                valor_aplicado: aplicado,
                saldo_nuevo: saldo - aplicado
            };
        });

        const tabla = document.getElementById(
            'tablaDistribucionPrestamos'
        );

        if (tabla) {
            tabla.innerHTML = distribucionPrestamos.map((item, index) => `
                <tr>
                    <td>${formatearFechaPrestamo(
                        prestamosEmpleado[index].fecha_prestamo
                    )}</td>
                    <td>${moneda(
                        Number(prestamosEmpleado[index].valor_prestamo || 0) +
                        Number(prestamosEmpleado[index].valor_interes || 0)
                    )}</td>
                    <td>${moneda(item.saldo_anterior)}</td>
                    <td>${moneda(item.valor_aplicado)}</td>
                    <td>${moneda(item.saldo_nuevo)}</td>
                </tr>
            `).join('');
        }

        // Actualizar deducciones y neto.
        totalDeducciones = totalDeduccionesBase + valor;
        netoPagar = netoPagarBase - valor;

        // Actualizar el desglose de deducciones.
document.getElementById('valorDescuentoPrestamos').textContent =
    moneda(valor);

document.getElementById('totalDeduccionesPreliquidacion').textContent =
    moneda(totalDeducciones);

        document.getElementById('totalDeducciones').textContent =
            moneda(totalDeducciones);

        document.getElementById('totalNeto').textContent =
            moneda(netoPagar);

        document.getElementById('resumenDescuentos').textContent =
            moneda(totalDeducciones);

        document.getElementById('resumenNetoFinal').textContent =
            moneda(netoPagar);

        document.getElementById('resumenNeto').textContent =
            moneda(netoPagar);

        document.getElementById('resumenTotal').textContent =
            moneda(netoPagar);

    });
}

    // Mostrar automáticamente el paso 2.
mostrarPaso(2);

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

    // ==========================================
// EVENTOS DE NAVEGACIÓN
// ==========================================

document.getElementById('btnVolverPaso1')
    .addEventListener('click', () => {
        mostrarPaso(1);
    });

// El paso 3 todavía está en construcción.
document.getElementById('btnContinuarPaso3').disabled = true;

    console.log('Interfaz de liquidación lista.');

});
