/* =========================================================
   CONFIGURACIÓN DE NÓMINA
   Procesados Margarita - ERP
   ========================================================= */

'use strict';


/* =========================================================
   CONFIGURACIÓN DE API
   ========================================================= */

const API_NOMINA = {
    parametros: '/api/nomina/configuracion/parametros',
    horasExtra: '/api/nomina/configuracion/horas-extra',
    recargos: '/api/nomina/configuracion/recargos',
    salarios: '/api/nomina/configuracion/salarios',
    auxilio: '/api/nomina/configuracion/auxilio-transporte',
    materiales: '/api/nomina/configuracion/materiales'
};


/* =========================================================
   ESTADO LOCAL
   ========================================================= */

let parametrosNomina = [];
let horasExtraNomina = [];
let recargosNomina = [];
let salariosNomina = [];
let auxiliosNomina = [];
let materialesNomina = [];


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => { 

    console.log('💰 Configuración de Nómina iniciada'); 


    // Limpiar restos de modales anteriores
    document
        .querySelectorAll('.modal-backdrop')
        .forEach(backdrop => {
            backdrop.remove();
        });

    document.body.classList.remove(
        'modal-open'
    );

    document.body.style.removeProperty(
        'padding-right'
    );


    inicializarConfiguracion(); 

});


/* =========================================================
   INICIALIZAR
   ========================================================= */

async function inicializarConfiguracion() {

    try {

        // ================================
        // ⚙️ PARÁMETROS GENERALES
        // ================================
        await cargarParametros();


        // ================================
        // ⏱️ HORAS EXTRA
        // ================================
        await cargarHorasExtra();

        // ================================
// 🌙 RECARGOS
// ================================
await cargarRecargos();

await cargarSalarioMinimo();


        // ================================
        // 🔘 PREPARAR BOTONES
        // ================================
        prepararBotonesHorasExtra();

        prepararBotonesRecargos();

        prepararBotonesSalarios();

        prepararBotonesMateriales();


    } catch (error) {

        console.error(
            '❌ Error inicializando configuración:',
            error
        );

    }

}


/* =========================================================
   PARÁMETROS GENERALES
   ========================================================= */

async function cargarParametros() {

    const container =
        document.getElementById(
            'parametrosContainer'
        );

    if (!container) {

        console.error(
            '❌ No existe #parametrosContainer'
        );

        return;

    }


    container.innerHTML = `
        <div class="config-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Cargando parámetros...</span>
        </div>
    `;


    try {

        const response =
            await fetch(
                API_NOMINA.parametros,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    cache: 'no-store'
                }
            );


        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!data.ok) {

            throw new Error(
                data.error ||
                'No fue posible cargar los parámetros.'
            );

        }


        parametrosNomina =
            Array.isArray(data.parametros)
                ? data.parametros
                : [];


        if (!parametrosNomina.length) {

            container.innerHTML = `
                <div class="config-empty">

                    <i class="fas fa-sliders-h"></i>

                    <p>
                        No hay parámetros configurados.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML =
            parametrosNomina
                .map(
                    parametro =>
                        crearParametroCard(parametro)
                )
                .join('');


    } catch (error) {

        console.error(
            '❌ Error cargando parámetros:',
            error
        );


        container.innerHTML = `

            <div class="config-error">

                <i class="fas fa-exclamation-triangle"></i>

                <p>
                    No fue posible cargar los
                    parámetros de nómina.
                </p>

                <button
                    type="button"
                    onclick="cargarParametros()"
                >
                    <i class="fas fa-rotate-right"></i>
                    Reintentar
                </button>

            </div>

        `;

    }

}

/* =========================================================
   CARGAR SALARIO MÍNIMO
   ========================================================= */

async function cargarSalarioMinimo() {

    try {

        const response =
            await fetch(
                API_NOMINA.salarios,
                {
                    method: 'GET',

                    headers: {
                        'Accept':
                            'application/json'
                    },

                    cache: 'no-store'
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                'No fue posible cargar el salario mínimo.'
            );

        }


        salariosNomina =
            Array.isArray(data.data)
                ? data.data
                : [];


        const salario =
            salariosNomina[0];


        if (!salario) {

            console.warn(
                '⚠️ No existe salario mínimo activo.'
            );

            return;

        }


        // Buscar la sección
        const secciones =
            document.querySelectorAll(
                '.config-section'
            );


        secciones.forEach(
            section => {

                const titulo =
                    section.querySelector('h2');


                if (!titulo) {
                    return;
                }


                if (
                    titulo.textContent
                        .trim()
                        .toLowerCase() !==
                    'salarios y auxilio de transporte'
                ) {
                    return;
                }


                const tarjetas =
                    section.querySelectorAll(
                        '.valor-card'
                    );


                if (!tarjetas.length) {
                    return;
                }


                // Primera tarjeta = salario mínimo
                const tarjeta =
                    tarjetas[0];


                const valor =
                    tarjeta.querySelector(
                        '.valor-principal'
                    );


                const fecha =
                    tarjeta.querySelector(
                        '.valor-fecha'
                    );


                if (valor) {

                    valor.textContent =
                        `$ ${Number(
                            salario.valor
                        ).toLocaleString(
                            'es-CO'
                        )}`;

                }


                if (fecha) {

                    fecha.textContent =
                        `Vigente desde ${
                            formatearFecha(
                                salario.fecha_inicio
                            )
                        }`;

                }

            }
        );


    } catch (error) {

        console.error(
            '❌ Error cargando salario mínimo:',
            error
        );

    }

}


/* =========================================================
   CREAR CARD DE PARÁMETRO
   ========================================================= */

function crearParametroCard(parametro) {

    const valor =
        formatearValorParametro(parametro);


    const fecha =
        formatearFecha(parametro.fecha_inicio);


    const unidad =
        parametro.unidad || '';


    return `

        <div
            class="parametro-card"
            data-parametro-id="${parametro.id}"
        >

            <span class="parametro-nombre">

                ${escapeHtml(
                    parametro.nombre
                )}

            </span>


            <strong class="parametro-valor">

                ${escapeHtml(valor)}

            </strong>


            <small class="parametro-unidad">

                ${escapeHtml(unidad)}

            </small>


            <em class="parametro-fecha">

                Vigente desde
                ${escapeHtml(fecha)}

            </em>


            <button
                type="button"
                class="btn-editar parametro-edit"
                onclick="editarParametro(${parametro.id})"
            >

                <i class="fas fa-pen"></i>

                Editar

            </button>

        </div>

    `;

}


/* =========================================================
   FORMATEAR VALOR DE PARÁMETRO
   ========================================================= */

function formatearValorParametro(parametro) {

    if (!parametro) {

        return '';

    }


    const tipo =
        String(
            parametro.tipo_dato || ''
        ).toUpperCase();


    const valor =
        parametro.valor;


    if (
        tipo === 'NUMERO'
    ) {

        const numero =
            Number(valor);


        if (
            Number.isNaN(numero)
        ) {

            return valor;

        }


        return numero.toLocaleString(
            'es-CO'
        );

    }


    if (
        tipo === 'DECIMAL'
    ) {

        const numero =
            Number(valor);


        if (
            Number.isNaN(numero)
        ) {

            return valor;

        }


        return numero.toLocaleString(
            'es-CO',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

    }


    if (
        tipo === 'BOOLEANO'
    ) {

        return (
            String(valor) === '1' ||
            String(valor).toLowerCase() === 'true'
        )
            ? 'Sí'
            : 'No';

    }


    return valor ?? '';

}


/* =========================================================
   FORMATEAR FECHA
   ========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {

        return '';

    }


    const texto =
        String(fecha)
            .substring(0, 10);


    const partes =
        texto.split('-');


    if (
        partes.length !== 3
    ) {

        return fecha;

    }


    return `
        ${partes[2]}/${partes[1]}/${partes[0]}
    `;

}


/* =========================================================
   EDITAR PARÁMETRO
   ========================================================= */

async function editarParametro(id) {

    try {

        const parametro =
            parametrosNomina.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (!parametro) {

            throw new Error(
                'No se encontró el parámetro seleccionado.'
            );

        }


        const input =
            generarInputParametro(
                parametro
            );


        mostrarModal(

            `Editar ${parametro.nombre}`,

            `

                <form
                    id="formEditarParametro"
                >

                    <div class="config-form-group">

                        <label>
                            Parámetro
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(
                                parametro.nombre
                            )}"
                            disabled
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Valor
                        </label>

                        ${input}

                    </div>


                    <div class="config-form-group">

                        <label>
                            Vigente desde
                        </label>

                        <input
                            type="date"
                            id="fechaVigenciaParametro"
                            min="${obtenerFechaMinima(
                                parametro.fecha_inicio
                            )}"
                            required
                        >

                        <small>
                            Fecha a partir de la cual comenzará a aplicarse este nuevo valor.
                        </small>

                    </div>


                    <div class="config-form-group">

                        <label>
                            Unidad
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(
                                parametro.unidad || ''
                            )}"
                            disabled
                        >

                    </div>


                    <div class="config-info-box">

                        <i class="fas fa-circle-info"></i>

                        <div>

                            <strong>
                                Vigencia histórica
                            </strong>

                            <p>
                                Al cambiar un parámetro,
                                se conserva la información
                                anterior para mantener el
                                historial de nómina.
                            </p>

                        </div>

                    </div>


                    <div class="config-modal-actions">

                        <button
                            type="button"
                            class="btn-modal-secondary"
                            data-bs-dismiss="modal"
                        >

                            Cancelar

                        </button>


                        <button
                            type="submit"
                            class="btn-modal-primary"
                        >

                            <i class="fas fa-save"></i>

                            Guardar cambios

                        </button>

                    </div>

                </form>

            `

        );


        const form =
            document.getElementById(
                'formEditarParametro'
            );


        if (form) {

            form.addEventListener(
                'submit',
                event =>
                    guardarParametro(
                        event,
                        parametro.id
                    )
            );

        }


    } catch (error) {

        console.error(
            '❌ Error editando parámetro:',
            error
        );


        mostrarNotificacion(
            error.message ||
            'No fue posible abrir el parámetro.',
            'error'
        );

    }

}


/* =========================================================
   GENERAR INPUT SEGÚN TIPO
   ========================================================= */

function generarInputParametro(parametro) {

    const tipo =
        String(
            parametro.tipo_dato || 'TEXTO'
        ).toUpperCase();


    if (
        tipo === 'BOOLEANO'
    ) {

        const checked =
            String(parametro.valor) === '1' ||
            String(parametro.valor).toLowerCase() ===
            'true';


        return `

            <div class="form-check form-switch">

                <input
                    class="form-check-input"
                    type="checkbox"
                    id="valorParametro"
                    ${checked ? 'checked' : ''}
                >

                <label
                    class="form-check-label"
                    for="valorParametro"
                >
                    Activado
                </label>

            </div>

        `;

    }


    if (
        tipo === 'NUMERO'
    ) {

        return `

            <input
                type="number"
                id="valorParametro"
                value="${escapeHtml(
                    parametro.valor
                )}"
                step="1"
                required
            >

        `;

    }


    if (
        tipo === 'DECIMAL'
    ) {

        return `

            <input
                type="number"
                id="valorParametro"
                value="${escapeHtml(
                    parametro.valor
                )}"
                step="0.01"
                required
            >

        `;

    }


    if (
        tipo === 'HORA'
    ) {

        return `

            <input
                type="time"
                id="valorParametro"
                value="${escapeHtml(
                    parametro.valor
                )}"
                required
            >

        `;

    }


    if (
        tipo === 'FECHA'
    ) {

        return `

            <input
                type="date"
                id="valorParametro"
                value="${escapeHtml(
                    String(parametro.valor)
                        .substring(0, 10)
                )}"
                required
            >

        `;

    }


    return `

        <input
            type="text"
            id="valorParametro"
            value="${escapeHtml(
                parametro.valor
            )}"
            required
        >

    `;

}


/* =========================================================
   GUARDAR PARÁMETRO
   ========================================================= */

async function guardarParametro(
    event,
    id
) {

    event.preventDefault();


    const input =
        document.getElementById(
            'valorParametro'
        );


    const fecha =
        document.getElementById(
            'fechaVigenciaParametro'
        );


    if (
        !input ||
        !fecha
    ) {

        mostrarNotificacion(
            'No fue posible obtener los datos del formulario.',
            'error'
        );

        return;

    }


    let valor;


    if (
        input.type === 'checkbox'
    ) {

        valor =
            input.checked
                ? '1'
                : '0';

    } else {

        valor =
            input.value.trim();

    }


    if (
        valor === ''
    ) {

        mostrarNotificacion(
            'Debes ingresar un valor.',
            'error'
        );

        return;

    }


    if (
        !fecha.value
    ) {

        mostrarNotificacion(
            'Debes seleccionar la fecha de vigencia.',
            'error'
        );

        return;

    }


    const parametro =
        parametrosNomina.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (
        parametro &&
        fecha.value <=
        String(
            parametro.fecha_inicio
        ).substring(0, 10)
    ) {

        mostrarNotificacion(
            'La nueva fecha debe ser posterior a la vigencia actual.',
            'error'
        );

        return;

    }


    try {

        bloquearModalBotones(true);


        const response =
            await fetch(
                `${API_NOMINA.parametros}/${id}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            valor: valor,
                            fecha_inicio:
                                fecha.value
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.error ||
                'No fue posible guardar el parámetro.'
            );

        }


        cerrarModal();


        await cargarParametros();


        mostrarNotificacion(
            'Parámetro actualizado correctamente.',
            'success'
        );


    } catch (error) {

        console.error(
            '❌ Error guardando parámetro:',
            error
        );


        mostrarNotificacion(
            error.message ||
            'Error guardando el parámetro.',
            'error'
        );


    } finally {

        bloquearModalBotones(false);

    }

}


/* =========================================================
   HORAS EXTRA
   ========================================================= */

function prepararBotonesHorasExtra() {

    const secciones = document.querySelectorAll('.config-section');

    secciones.forEach(section => {

        const titulo = section.querySelector('h2');

        if (!titulo) {
            return;
        }

        if (
            titulo.textContent.trim().toLowerCase() !==
            'horas extra'
        ) {
            return;
        }

        // ---------------------------------------------
        // BOTONES EDITAR
        // ---------------------------------------------
        section
            .querySelectorAll('.config-table tbody tr')
            .forEach(fila => {

                const boton = fila.querySelector('.btn-action');

                if (!boton) {
                    return;
                }

                boton.type = 'button';

                // Evitar eventos duplicados
                boton.replaceWith(boton.cloneNode(true));

                const nuevoBoton =
                    fila.querySelector('.btn-action');

                nuevoBoton.addEventListener(
                    'click',
                    () => editarHoraExtraDesdeFila(fila)
                );

            });

        // ---------------------------------------------
        // BOTÓN NUEVO
        // ---------------------------------------------
        const botonNuevo =
            section.querySelector('.btn-nuevo');

        if (botonNuevo) {

            botonNuevo.type = 'button';

            botonNuevo.replaceWith(
                botonNuevo.cloneNode(true)
            );

            const nuevoBoton =
                section.querySelector('.btn-nuevo');

            nuevoBoton.addEventListener(
                'click',
                nuevoTipoHoraExtra
            );
        }

    });

}


/* =========================================================
   EDITAR HORA EXTRA DESDE HTML
   ========================================================= */

async function editarHoraExtraDesdeFila(fila) {

    try {

        const celdas = fila.querySelectorAll('td');

        if (celdas.length < 5) {

            mostrarNotificacion(
                'No fue posible identificar la hora extra.',
                'error'
            );

            return;
        }

        const codigo =
            celdas[0].textContent.trim();

        // Buscar el registro real cargado desde la API
        const horaExtra =
            horasExtraNomina.find(
                item =>
                    String(item.codigo).trim() === codigo
            );

        if (!horaExtra) {

            mostrarNotificacion(
                `No se encontró la hora extra ${codigo}.`,
                'error'
            );

            return;
        }

        const fechaInicio =
            String(horaExtra.fecha_inicio || '')
                .substring(0, 10);

        /*
         * =====================================================
         * CONVERSIÓN DE PORCENTAJES
         * =====================================================
         *
         * En la base de datos:
         *
         * 0.25 = 25%
         * 0.35 = 35%
         * 0.90 = 90%
         *
         * En pantalla queremos:
         *
         * 25
         * 35
         * 90
         *
         * El factor:
         *
         * 1.25 = 125%
         * 1.35 = 135%
         * 1.90 = 190%
         */

        const porcentajeBD =
            Number(horaExtra.porcentaje_recargo) || 0;

        const porcentajePantalla =
            porcentajeBD <= 1
                ? porcentajeBD * 100
                : porcentajeBD;

        const factorBD =
            Number(horaExtra.factor_pago) || 1;

        const factorPantalla =
            factorBD * 100;


        mostrarModal(

            `Editar hora extra ${horaExtra.codigo}`,

            `

            <form id="formEditarHoraExtra">

                <!-- =========================================
                     INFORMACIÓN FIJA
                     ========================================= -->

                <div class="config-info-box">

                    <i class="fas fa-clock"></i>

                    <div>

                        <strong>
                            ${escapeHtml(horaExtra.nombre)}
                        </strong>

                        <p>
                            Código:
                            <strong>
                                ${escapeHtml(horaExtra.codigo)}
                            </strong>
                        </p>

                    </div>

                </div>


                <div class="config-form-grid">

                    <!-- =====================================
                         NOMBRE - NO EDITABLE
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Nombre
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(
                                horaExtra.nombre || ''
                            )}"
                            disabled
                        >

                        <small>
                            El nombre se define al crear la hora extra y
                            no puede modificarse posteriormente.
                        </small>

                    </div>


                    <!-- =====================================
                         TIPO DE JORNADA - NO EDITABLE
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Tipo de jornada
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(
                                horaExtra.tipo_jornada || ''
                            )}"
                            disabled
                        >

                        <small>
                            Este valor queda definido al crear el concepto.
                        </small>

                    </div>


                    <!-- =====================================
                         TIPO DE DÍA - NO EDITABLE
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Tipo de día
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(
                                horaExtra.tipo_dia || ''
                            )}"
                            disabled
                        >

                        <small>
                            Este valor queda definido al crear el concepto.
                        </small>

                    </div>


                    <!-- =====================================
                         PORCENTAJE DE RECARGO
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Porcentaje de recargo
                        </label>

                        <div class="input-with-suffix">

                            <input
                                type="number"
                                id="horaExtraPorcentaje"
                                value="${porcentajePantalla}"
                                min="0"
                                max="1000"
                                step="1"
                                required
                            >

                            <span>%</span>

                        </div>

                        <small>
                            Ingresa únicamente el porcentaje.
                            Ejemplo: 25 para un recargo del 25%.
                        </small>

                    </div>


                    <!-- =====================================
                         FACTOR DE PAGO
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Factor de pago
                        </label>

                        <div class="input-with-suffix">

                            <input
                                type="number"
                                id="horaExtraFactor"
                                value="${factorPantalla}"
                                min="100"
                                step="1"
                                readonly
                            >

                            <span>%</span>

                        </div>

                        <small>
                            Se calcula automáticamente.
                            Un recargo del 25% equivale a un factor de pago del 125%.
                        </small>

                    </div>


                    <!-- =====================================
                         LÍMITE DIARIO
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Límite diario
                        </label>

                        <div class="input-with-suffix">

                            <input
                                type="number"
                                id="horaExtraLimiteDiario"
                                value="${
                                    horaExtra.limite_diario !== null &&
                                    horaExtra.limite_diario !== undefined
                                        ? Math.floor(
                                            Number(horaExtra.limite_diario)
                                        )
                                        : ''
                                }"
                                min="0"
                                step="1"
                                inputmode="numeric"
                            >

                            <span>horas</span>

                        </div>

                        <small>
                            Número máximo de horas extra permitidas por día.
                        </small>

                    </div>


                    <!-- =====================================
                         LÍMITE SEMANAL
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Límite semanal
                        </label>

                        <div class="input-with-suffix">

                            <input
                                type="number"
                                id="horaExtraLimiteSemanal"
                                value="${
                                    horaExtra.limite_semanal !== null &&
                                    horaExtra.limite_semanal !== undefined
                                        ? Math.floor(
                                            Number(horaExtra.limite_semanal)
                                        )
                                        : ''
                                }"
                                min="0"
                                step="1"
                                inputmode="numeric"
                            >

                            <span>horas</span>

                        </div>

                        <small>
                            Número máximo de horas extra permitidas por semana.
                        </small>

                    </div>


                    <!-- =====================================
                         NUEVA VIGENCIA
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Nueva fecha de vigencia
                        </label>

                        <input
                            type="date"
                            id="horaExtraFechaVigencia"
                            min="${obtenerFechaMinima(
                                fechaInicio
                            )}"
                            required
                        >

                        <small>
                            A partir de esta fecha comenzará a aplicarse
                            la nueva configuración.
                        </small>

                    </div>

                </div>


                <!-- =========================================
                     DESCRIPCIÓN
                     ========================================= -->

                <div class="config-form-group">

                    <label>
                        Descripción
                    </label>

                    <textarea
                        id="horaExtraDescripcion"
                        rows="3"
                    >${escapeHtml(
                        horaExtra.descripcion || ''
                    )}</textarea>

                </div>


                <!-- =========================================
                     FÓRMULA
                     ========================================= -->

                <div class="config-form-group">

                    <label>
                        Fórmula
                    </label>

                    <input
                        type="text"
                        id="horaExtraFormula"
                        value="${escapeHtml(
                            horaExtra.formula || ''
                        )}"
                    >

                </div>


                <!-- =========================================
                     AUTORIZACIÓN
                     ========================================= -->

                <div class="config-form-group">

                    <div class="config-authorization-box">

                        <div class="config-authorization-content">

                            <div class="config-authorization-icon">
                                <i class="fas fa-user-check"></i>
                            </div>

                            <div>

                                <strong>
                                    Requiere autorización previa
                                </strong>

                                <small>
                                    Si está activado, las horas extra
                                    de este tipo deberán ser autorizadas
                                    antes de ser tenidas en cuenta
                                    para la liquidación.
                                </small>

                            </div>

                        </div>

                        <label class="config-switch">

                            <input
                                type="checkbox"
                                id="horaExtraAutorizacion"
                                ${
                                    Number(
                                        horaExtra.requiere_autorizacion
                                    ) === 1
                                        ? 'checked'
                                        : ''
                                }
                            >

                            <span class="config-slider"></span>

                        </label>

                    </div>

                </div>


                <!-- =========================================
                     VIGENCIA HISTÓRICA
                     ========================================= -->

                <div class="config-info-box">

                    <i class="fas fa-history"></i>

                    <div>

                        <strong>
                            Vigencia histórica
                        </strong>

                        <p>
                            El cambio no modificará el registro anterior.
                            Se cerrará su vigencia y se creará una nueva
                            configuración a partir de la fecha indicada.
                        </p>

                    </div>

                </div>


                <!-- =========================================
                     BOTONES
                     ========================================= -->

                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar cambios

                    </button>

                </div>


            </form>

            `
        );


        // =====================================================
        // CALCULAR FACTOR AUTOMÁTICAMENTE
        // =====================================================

        const porcentaje =
            document.getElementById(
                'horaExtraPorcentaje'
            );

        const factor =
            document.getElementById(
                'horaExtraFactor'
            );


        if (porcentaje && factor) {

            const actualizarFactor = () => {

                const valor =
                    Number(porcentaje.value) || 0;

                factor.value =
                    (100 + valor).toFixed(0);

            };


            porcentaje.addEventListener(
                'input',
                actualizarFactor
            );


            actualizarFactor();

        }


        // =====================================================
        // SUBMIT
        // =====================================================

        const form =
            document.getElementById(
                'formEditarHoraExtra'
            );


        if (form) {

            form.addEventListener(
                'submit',
                event =>
                    guardarHoraExtra(
                        event,
                        horaExtra.id
                    )
            );

        }


    } catch (error) {

        console.error(
            '❌ Error editando hora extra:',
            error
        );

        mostrarNotificacion(
            error.message ||
            'No fue posible abrir la hora extra.',
            'error'
        );

    }

}

// =========================================================
// 💾 GUARDAR HORA EXTRA
// =========================================================
async function guardarHoraExtra(event, id) {

    event.preventDefault();

    const porcentaje =
        document.getElementById(
            'horaExtraPorcentaje'
        );

    const fecha =
        document.getElementById(
            'horaExtraFechaVigencia'
        );

    const descripcion =
        document.getElementById(
            'horaExtraDescripcion'
        );

    const formula =
        document.getElementById(
            'horaExtraFormula'
        );

    const autorizacion =
        document.getElementById(
            'horaExtraAutorizacion'
        );

    const limiteDiario =
        document.getElementById(
            'horaExtraLimiteDiario'
        );

    const limiteSemanal =
        document.getElementById(
            'horaExtraLimiteSemanal'
        );


    // =====================================================
    // VALIDAR CAMPOS
    // =====================================================

    if (
        !porcentaje ||
        !fecha ||
        !descripcion ||
        !formula ||
        !autorizacion ||
        !limiteDiario ||
        !limiteSemanal
    ) {

        mostrarNotificacion(
            'No fue posible obtener los datos del formulario.',
            'error'
        );

        return;
    }


    if (!fecha.value) {

        mostrarNotificacion(
            'Debes seleccionar la nueva fecha de vigencia.',
            'error'
        );

        return;
    }


    // =====================================================
    // PORCENTAJE
    // =====================================================

    const valorPorcentaje =
        Number(porcentaje.value);

    if (
        Number.isNaN(valorPorcentaje) ||
        valorPorcentaje < 0
    ) {

        mostrarNotificacion(
            'El porcentaje de recargo no es válido.',
            'error'
        );

        return;
    }


    // =====================================================
    // BUSCAR HORA EXTRA ORIGINAL
    // =====================================================

    const horaExtra =
        horasExtraNomina.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!horaExtra) {

        mostrarNotificacion(
            'No se encontró la hora extra seleccionada.',
            'error'
        );

        return;
    }


    // =====================================================
    // VALIDAR FECHA DE VIGENCIA
    // =====================================================

    const fechaActual =
        String(horaExtra.fecha_inicio || '')
            .substring(0, 10);


    if (
        fecha.value <= fechaActual
    ) {

        mostrarNotificacion(
            'La nueva fecha debe ser posterior a la vigencia actual.',
            'error'
        );

        return;
    }


    // =====================================================
    // LÍMITES
    // =====================================================

    const valorLimiteDiario =
        limiteDiario.value === ''
            ? null
            : Number(limiteDiario.value);

    const valorLimiteSemanal =
        limiteSemanal.value === ''
            ? null
            : Number(limiteSemanal.value);


    if (
        valorLimiteDiario !== null &&
        (
            Number.isNaN(valorLimiteDiario) ||
            valorLimiteDiario < 0 ||
            !Number.isInteger(valorLimiteDiario)
        )
    ) {

        mostrarNotificacion(
            'El límite diario debe ser un número entero de horas.',
            'error'
        );

        return;
    }


    if (
        valorLimiteSemanal !== null &&
        (
            Number.isNaN(valorLimiteSemanal) ||
            valorLimiteSemanal < 0 ||
            !Number.isInteger(valorLimiteSemanal)
        )
    ) {

        mostrarNotificacion(
            'El límite semanal debe ser un número entero de horas.',
            'error'
        );

        return;
    }


    // =====================================================
    // CONSTRUIR DATOS
    // =====================================================
    //
    // IMPORTANTE:
    //
    // En pantalla:
    // 25 = 25%
    // 125 = 125%
    //
    // En BD:
    // 0.25 = 25%
    // 1.25 = 125%
    //
    // Por eso hacemos las conversiones aquí.
    // =====================================================

    const datos = {

        descripcion:
            descripcion.value.trim(),

        porcentaje_recargo:
            valorPorcentaje / 100,

        factor_pago:
            1 + (valorPorcentaje / 100),

        formula:
            formula.value.trim(),

        requiere_autorizacion:
            autorizacion.checked
                ? 1
                : 0,

        limite_diario:
            valorLimiteDiario,

        limite_semanal:
            valorLimiteSemanal,

        fecha_inicio:
            fecha.value

    };


    console.log(
        '📤 Datos enviados para actualizar hora extra:',
        datos
    );


    // =====================================================
    // GUARDAR
    // =====================================================

    try {

        bloquearModalBotones(true);


        const response =
            await fetch(
                `${API_NOMINA.horasExtra}/${id}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Accept':
                            'application/json'
                    },

                    body:
                        JSON.stringify(datos)
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.mensaje ||
                data.error ||
                'No fue posible guardar la hora extra.'
            );

        }


        // =================================================
        // ÉXITO
        // =================================================

        cerrarModal();


        await cargarHorasExtra();


        mostrarNotificacion(
            'Hora extra actualizada correctamente.',
            'success'
        );


    } catch (error) {

        console.error(
            '❌ Error guardando hora extra:',
            error
        );


        mostrarNotificacion(
            error.message ||
            'Error guardando la hora extra.',
            'error'
        );


    } finally {

        bloquearModalBotones(false);

    }

}

// =========================================================
// ⏱️ CARGAR HORAS EXTRA DESDE MYSQL
// =========================================================

async function cargarHorasExtra() {

    try {

        const response =
            await fetch(
                API_NOMINA.horasExtra
            );

        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.mensaje ||
                data.error ||
                'No fue posible cargar las horas extra.'
            );

        }


        horasExtraNomina =
            Array.isArray(data.data)
                ? data.data
                : [];


        renderizarHorasExtra();


        console.log(
            '⏱️ Horas extra cargadas:',
            horasExtraNomina
        );


    } catch (error) {

        console.error(
            '❌ Error cargando horas extra:',
            error
        );

        mostrarNotificacion(
            'No fue posible cargar las horas extra.',
            'error'
        );

    }

}

// =========================================================
// 🖥️ MOSTRAR HORAS EXTRA EN LA TABLA
// =========================================================

function renderizarHorasExtra() {

    const secciones =
        document.querySelectorAll(
            '.config-section'
        );


    let tabla = null;


    secciones.forEach(section => {

        const titulo =
            section.querySelector('h2');


        if (
            titulo &&
            titulo.textContent
                .trim()
                .toLowerCase() ===
            'horas extra'
        ) {

            tabla =
                section.querySelector(
                    '.config-table tbody'
                );

        }

    });


    if (!tabla) {

        console.warn(
            '⚠️ No se encontró la tabla de horas extra.'
        );

        return;
    }


    tabla.innerHTML = '';


    horasExtraNomina.forEach(hora => {

        const fila =
            document.createElement('tr');


        fila.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(hora.codigo)}
                </strong>
            </td>

            <td>
                ${escapeHtml(hora.nombre)}
            </td>

            <td>
                ${Number(
                    hora.porcentaje_recargo
                ).toFixed(2)}%
            </td>

            <td>
                ${Number(
                    hora.factor_pago
                ).toFixed(4)}
            </td>

           <td>
    <button
        type="button"
        class="btn-action"
        title="Editar hora extra"
        aria-label="Editar hora extra"
    >
        <i class="fas fa-pen"></i>
    </button>
</td>

        `;


        tabla.appendChild(fila);

    });


    prepararBotonesHorasExtra();

}


/* =========================================================
   NUEVA HORA EXTRA
   ========================================================= */

function nuevoTipoHoraExtra() {

    mostrarModal(

        'Nueva hora extra',

        `

            <form
                onsubmit="
                    event.preventDefault();
                    mostrarNotificacion(
                        'La creación de horas extra se conectará con la base de datos en el siguiente paso.',
                        'success'
                    );
                    cerrarModal();
                "
            >

                <div class="config-form-grid">

                    <div class="config-form-group">

                        <label>
                            Código
                        </label>

                        <input
                            type="text"
                            name="codigo"
                            placeholder="Ej. HED"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Nombre
                        </label>

                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre del concepto"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Tipo de jornada
                        </label>

                        <select
                            name="tipo_jornada"
                            required
                        >

                            <option value="DIURNA">
                                Diurna
                            </option>

                            <option value="NOCTURNA">
                                Nocturna
                            </option>

                        </select>

                    </div>


                    <div class="config-form-group">

                        <label>
                            Tipo de día
                        </label>

                        <select
                            name="tipo_dia"
                            required
                        >

                            <option value="ORDINARIO">
                                Ordinario
                            </option>

                            <option value="DESCANSO">
                                Descanso
                            </option>

                        </select>

                    </div>


                    <div class="config-form-group">

                        <label>
                            Porcentaje de recargo
                        </label>

                        <input
                            type="number"
                            name="porcentaje_recargo"
                            step="0.01"
                            min="0"
                            placeholder="25"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Factor de pago
                        </label>

                        <input
                            type="number"
                            name="factor_pago"
                            step="0.01"
                            min="0"
                            placeholder="1.25"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Hora inicio
                        </label>

                        <input
                            type="time"
                            name="hora_inicio"
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Hora fin
                        </label>

                        <input
                            type="time"
                            name="hora_fin"
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Límite diario
                        </label>

                        <input
                            type="number"
                            name="limite_diario"
                            step="0.01"
                            min="0"
                            placeholder="2"
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Límite semanal
                        </label>

                        <input
                            type="number"
                            name="limite_semanal"
                            step="0.01"
                            min="0"
                            placeholder="12"
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Fecha de inicio
                        </label>

                        <input
                            type="date"
                            name="fecha_inicio"
                            required
                        >

                    </div>

                </div>


                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar

                    </button>

                </div>

            </form>

        `

    );

}

// =========================================================
// 🌙 CARGAR RECARGOS DESDE MYSQL
// =========================================================

async function cargarRecargos() {

    try {

        const response = await fetch(
            API_NOMINA.recargos
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {

            throw new Error(
                data.mensaje ||
                data.error ||
                'No fue posible cargar los recargos.'
            );

        }

        recargosNomina =
            Array.isArray(data.data)
                ? data.data
                : [];

        renderizarRecargos();

        console.log(
            '🌙 Recargos cargados:',
            recargosNomina
        );

    } catch (error) {

        console.error(
            '❌ Error cargando recargos:',
            error
        );

        mostrarNotificacion(
            'No fue posible cargar los recargos.',
            'error'
        );

    }

}


// =========================================================
// 🖥️ MOSTRAR RECARGOS EN LA TABLA
// =========================================================

function renderizarRecargos() {

    const secciones =
        document.querySelectorAll(
            '.config-section'
        );

    let tabla = null;

    secciones.forEach(section => {

        const titulo =
            section.querySelector('h2');

        if (
            titulo &&
            titulo.textContent
                .trim()
                .toLowerCase() ===
            'recargos'
        ) {

            tabla =
                section.querySelector(
                    '.config-table tbody'
                );

        }

    });


    if (!tabla) {

        console.warn(
            '⚠️ No se encontró la tabla de recargos.'
        );

        return;

    }


    tabla.innerHTML = '';


    recargosNomina.forEach(recargo => {

        const fila =
            document.createElement('tr');


        const porcentajeBD =
    Number(
        recargo.porcentaje_recargo
    ) || 0;

const porcentajePantalla =
    porcentajeBD * 100;

const factorBD =
    Number(
        recargo.factor_pago
    ) || 1;


        fila.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(
                        recargo.codigo
                    )}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    recargo.nombre
                )}
            </td>

            <td>
                ${porcentajePantalla.toFixed(0)}%
            </td>

            <td>
                ${factorBD.toFixed(2)}
            </td>

            <td>
                <span class="estado-activo">
                    Activo
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="btn-action"
                    title="Editar recargo"
                    aria-label="Editar recargo"
                >
                    <i class="fas fa-pen"></i>
                </button>
            </td>

        `;


        tabla.appendChild(fila);

    });


    prepararBotonesRecargos();

}


/* =========================================================
   RECARGOS
   ========================================================= */

function prepararBotonesRecargos() {

    const secciones =
        document.querySelectorAll(
            '.config-section'
        );


    secciones.forEach(
        section => {

            const titulo =
                section.querySelector('h2');


            if (!titulo) {

                return;

            }


            if (
                titulo.textContent
                    .trim()
                    .toLowerCase() !==
                'recargos'
            ) {

                return;

            }


            section
                .querySelectorAll(
                    '.config-table tbody tr'
                )
                .forEach(
                    fila => {

                        const boton =
                            fila.querySelector(
                                '.btn-action'
                            );


                        if (!boton) {

                            return;

                        }


                        boton.type =
                            'button';


                        boton.addEventListener(
                            'click',
                            () =>
                                editarRecargoDesdeFila(
                                    fila
                                )
                        );

                    }
                );


            const botonNuevo =
                section.querySelector(
                    '.btn-nuevo'
                );


            if (botonNuevo) {

                botonNuevo.type =
                    'button';


                botonNuevo.addEventListener(
                    'click',
                    nuevoRecargo
                );

            }

        }
    );

}


/* =========================================================
   EDITAR RECARGO
   ========================================================= */

function editarRecargoDesdeFila(fila) {

    const celdas = fila.querySelectorAll('td');

    if (celdas.length < 4) {
        mostrarNotificacion(
            'No fue posible identificar el recargo.',
            'error'
        );
        return;
    }

    const codigo = celdas[0].textContent.trim();
    const nombre = celdas[1].textContent.trim();

    /*
     * El porcentaje mostrado en la tabla puede venir como:
     * 35%
     * 90%
     * 125%
     *
     * Lo convertimos a número para mostrarlo correctamente
     * en el formulario.
     */

    const textoRecargo = celdas[2].textContent
        .trim()
        .replace('%', '')
        .replace(',', '.');

    const porcentaje = Number(textoRecargo) || 0;

    /*
     * El factor de la tabla puede venir como:
     * 1.35
     * 1.90
     * 2.25
     *
     * En pantalla lo mostramos como:
     * 135%
     * 190%
     * 225%
     */

    const textoFactor = celdas[3].textContent
        .trim()
        .replace(',', '.');

    const factorBD = Number(textoFactor) || 1;

    const factorPantalla = factorBD * 100;


    mostrarModal(

        `Editar recargo ${codigo}`,

        `

            <form id="formEditarRecargo">

                <!-- =========================================
                     INFORMACIÓN DEL RECARGO
                     ========================================= -->

                <div class="config-info-box">

                    <i class="fas fa-moon"></i>

                    <div>

                        <strong>
                            ${escapeHtml(nombre)}
                        </strong>

                        <p>
                            Código:
                            <strong>
                                ${escapeHtml(codigo)}
                            </strong>
                        </p>

                    </div>

                </div>


                <div class="config-form-grid">


                    <!-- =====================================
                         CÓDIGO
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Código
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(codigo)}"
                            disabled
                        >

                        <small>
                            El código se define al crear el recargo
                            y no puede modificarse posteriormente.
                        </small>

                    </div>


                    <!-- =====================================
                         CONCEPTO
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Concepto
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(nombre)}"
                            disabled
                        >

                        <small>
                            El concepto se define al crear el recargo
                            y no puede modificarse posteriormente.
                        </small>

                    </div>


                    <!-- =====================================
                         PORCENTAJE
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Porcentaje de recargo
                        </label>

                        <div class="input-with-suffix">

                            <input
                                type="number"
                                id="recargoPorcentaje"
                                value="${porcentaje}"
                                min="0"
                                max="1000"
                                step="1"
                                inputmode="numeric"
                                required
                            >

                            <span>%</span>

                        </div>

                        <small>
                            Ingresa únicamente el porcentaje.
                            Ejemplo: 35 para un recargo del 35%.
                        </small>

                    </div>


                    <!-- =====================================
                         FACTOR DE PAGO
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Factor de pago
                        </label>

                        <div class="input-with-suffix">

                            <input
                                type="number"
                                id="recargoFactor"
                                value="${factorPantalla.toFixed(0)}"
                                min="100"
                                step="1"
                                readonly
                            >

                            <span>%</span>

                        </div>

                        <small>
                            Se calcula automáticamente.
                            Un recargo del 35% equivale a un factor
                            de pago del 135%.
                        </small>

                    </div>


                    <!-- =====================================
                         NUEVA VIGENCIA
                         ===================================== -->

                    <div class="config-form-group">

                        <label>
                            Nueva fecha de vigencia
                        </label>

                        <input
                            type="date"
                            id="recargoFechaVigencia"
                            required
                        >

                        <small>
                            A partir de esta fecha comenzará a aplicarse
                            la nueva configuración.
                        </small>

                    </div>

                </div>


                <!-- =========================================
                     INFORMACIÓN
                     ========================================= -->

                <div class="config-info-box">

                    <i class="fas fa-calculator"></i>

                    <div>

                        <strong>
                            ¿Cómo funciona el recargo?
                        </strong>

                        <p>
                            El porcentaje indica cuánto se incrementa
                            el valor de la hora ordinaria.
                        </p>

                        <p>
                            Ejemplo: un recargo del 35% significa que
                            la hora se paga al <strong>135%</strong>
                            de su valor ordinario.
                        </p>

                    </div>

                </div>


                <!-- =========================================
                     VIGENCIA HISTÓRICA
                     ========================================= -->

                <div class="config-info-box">

                    <i class="fas fa-history"></i>

                    <div>

                        <strong>
                            Vigencia histórica
                        </strong>

                        <p>
                            El cambio no modificará el registro anterior.
                            Se cerrará su vigencia y se creará una nueva
                            configuración a partir de la fecha indicada.
                        </p>

                    </div>

                </div>


                <!-- =========================================
                     BOTONES
                     ========================================= -->

                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar cambios

                    </button>

                </div>


            </form>

        `

    );


    /* =====================================================
       CALCULAR FACTOR AUTOMÁTICAMENTE
       ===================================================== */

    const inputPorcentaje =
        document.getElementById(
            'recargoPorcentaje'
        );

    const inputFactor =
        document.getElementById(
            'recargoFactor'
        );


    if (
        inputPorcentaje &&
        inputFactor
    ) {

        inputPorcentaje.addEventListener(
            'input',
            () => {

                const valor =
                    Number(inputPorcentaje.value) || 0;

                inputFactor.value =
                    (100 + valor).toFixed(0);

            }
        );

    }


    /* =====================================================
       FORMULARIO
       ===================================================== */

    const form =
        document.getElementById(
            'formEditarRecargo'
        );


    if (form) {

    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const inputPorcentaje =
                document.getElementById(
                    'recargoPorcentaje'
                );

            const inputFactor =
                document.getElementById(
                    'recargoFactor'
                );

            const inputFecha =
                document.getElementById(
                    'recargoFechaVigencia'
                );


            if (
                !inputPorcentaje ||
                !inputFactor ||
                !inputFecha
            ) {

                mostrarNotificacion(
                    'No fue posible obtener los datos del formulario.',
                    'error'
                );

                return;

            }


            const porcentaje =
                Number(
                    inputPorcentaje.value
                );


            const factor =
                Number(
                    inputFactor.value
                );


            const fecha =
                inputFecha.value;


            // =================================================
            // VALIDACIONES
            // =================================================

            if (
                Number.isNaN(porcentaje) ||
                porcentaje < 0
            ) {

                mostrarNotificacion(
                    'Ingresa un porcentaje válido.',
                    'error'
                );

                inputPorcentaje.focus();

                return;

            }


            if (
                Number.isNaN(factor) ||
                factor < 1
            ) {

                mostrarNotificacion(
                    'El factor de pago no es válido.',
                    'error'
                );

                return;

            }


            if (!fecha) {

                mostrarNotificacion(
                    'Debes indicar la nueva fecha de vigencia.',
                    'error'
                );

                inputFecha.focus();

                return;

            }


            // =================================================
            // DESACTIVAR BOTONES
            // =================================================

            bloquearModalBotones(true);


            try {


                // =================================================
                // 📡 ENVIAR A MYSQL
                // =================================================

                const response =
                    await fetch(
                        `${API_NOMINA.recargos}/${encodeURIComponent(codigo)}`,
                        {
                            method: 'PUT',

                            headers: {
                                'Content-Type':
                                    'application/json',

                                'Accept':
                                    'application/json'
                            },

                            body: JSON.stringify({

                                porcentaje_recargo:
                                    porcentaje / 100,

                                factor_pago:
                                    factor / 100,

                                fecha_inicio:
                                    fecha

                            })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.ok) {

                    throw new Error(
                        data.mensaje ||
                        data.error ||
                        'No fue posible actualizar el recargo.'
                    );

                }


                // =================================================
                // ✅ ÉXITO
                // =================================================

                cerrarModal();


                mostrarNotificacion(
                    'Recargo actualizado correctamente.',
                    'success'
                );


                // Recargamos la página para mostrar
                // la nueva vigencia.

                setTimeout(
                    () => {
                        window.location.reload();
                    },
                    700
                );


            } catch (error) {


                console.error(
                    '❌ Error guardando recargo:',
                    error
                );


                mostrarNotificacion(
                    error.message ||
                    'No fue posible guardar el recargo.',
                    'error'
                );


                bloquearModalBotones(false);

            }

        }
    );

}

}


/* =========================================================
   NUEVO RECARGO
   ========================================================= */

function nuevoRecargo() {

    mostrarModal(

        'Nuevo recargo',

        `

            <form
                onsubmit="
                    event.preventDefault();
                    mostrarNotificacion(
                        'La creación de recargos se conectará con la base de datos en el siguiente paso.',
                        'success'
                    );
                    cerrarModal();
                "
            >

                <div class="config-form-grid">

                    <div class="config-form-group">

                        <label>
                            Código
                        </label>

                        <input
                            type="text"
                            placeholder="Ej. RN"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Nombre
                        </label>

                        <input
                            type="text"
                            placeholder="Nombre del recargo"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Porcentaje
                        </label>

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="35"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Factor de pago
                        </label>

                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="1.35"
                            required
                        >

                    </div>


                    <div class="config-form-group config-form-full">

                        <label>
                            Fórmula
                        </label>

                        <input
                            type="text"
                            placeholder="VALOR_HORA_ORDINARIA × 0.35"
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Fecha de inicio
                        </label>

                        <input
                            type="date"
                            required
                        >

                    </div>

                </div>


                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar

                    </button>

                </div>

            </form>

        `

    );

}


/* =========================================================
   SALARIOS
   ========================================================= */

function prepararBotonesSalarios() {

    const secciones =
        document.querySelectorAll(
            '.config-section'
        );


    secciones.forEach(
        section => {

            const titulo =
                section.querySelector('h2');


            if (!titulo) {

                return;

            }


            if (
                titulo.textContent
                    .trim()
                    .toLowerCase() !==
                'salarios y auxilio de transporte'
            ) {

                return;

            }


            const botones =
                section.querySelectorAll(
                    '.valor-card .btn-editar'
                );


            if (
                botones.length >= 1
            ) {

                botones[0].type =
                    'button';

                botones[0].addEventListener(
                    'click',
                    nuevoSalario
                );

            }


            if (
                botones.length >= 2
            ) {

                botones[1].type =
                    'button';

                botones[1].addEventListener(
                    'click',
                    nuevoAuxilio
                );

            }

        }
    );

}


/* =========================================================
   NUEVO SALARIO
   ========================================================= */

/* =========================================================
   NUEVO SALARIO MÍNIMO
   ========================================================= */

async function nuevoSalario() {

    mostrarModal(

        'Nuevo salario mínimo legal vigente',

        `

            <form id="formNuevoSalario">

                <div class="config-info-box">

                    <i class="fas fa-money-bill-wave"></i>

                    <div>

                        <strong>
                            Nuevo valor salarial
                        </strong>

                        <p>
                            El valor anterior se conservará
                            como histórico y el nuevo comenzará
                            a aplicarse desde la fecha indicada.
                        </p>

                    </div>

                </div>


                <div class="config-form-grid">


                    <div class="config-form-group">

                        <label>
                            Valor
                        </label>

                        <input
                            type="number"
                            id="nuevoSalarioValor"
                            min="0"
                            step="0.01"
                            placeholder="1623500"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Fecha de inicio
                        </label>

                        <input
                            type="date"
                            id="nuevoSalarioFecha"
                            required
                        >

                    </div>


                    <div
                        class="config-form-group config-form-full"
                    >

                        <label>
                            Observación
                        </label>

                        <textarea
                            id="nuevoSalarioObservacion"
                            rows="3"
                            placeholder="Ej. Salario mínimo legal vigente"
                        ></textarea>

                    </div>

                </div>


                <div class="config-info-box">

                    <i class="fas fa-history"></i>

                    <div>

                        <strong>
                            Vigencia histórica
                        </strong>

                        <p>
                            El salario anterior no será eliminado.
                            Se cerrará su vigencia y se creará
                            un nuevo registro.
                        </p>

                    </div>

                </div>


                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>


                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar

                    </button>

                </div>


            </form>

        `

    );


    // =====================================================
    // SUBMIT
    // =====================================================

    const form =
        document.getElementById(
            'formNuevoSalario'
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const valor =
                document.getElementById(
                    'nuevoSalarioValor'
                );

            const fecha =
                document.getElementById(
                    'nuevoSalarioFecha'
                );

            const observacion =
                document.getElementById(
                    'nuevoSalarioObservacion'
                );


            if (
                !valor ||
                !fecha ||
                !valor.value ||
                !fecha.value
            ) {

                mostrarNotificacion(
                    'Debes ingresar el valor y la fecha de inicio.',
                    'error'
                );

                return;

            }


            const valorNumerico =
                Number(valor.value);


            if (
                Number.isNaN(valorNumerico) ||
                valorNumerico <= 0
            ) {

                mostrarNotificacion(
                    'El valor del salario mínimo no es válido.',
                    'error'
                );

                return;

            }


            try {

                bloquearModalBotones(true);


                const response =
                    await fetch(
                        API_NOMINA.salarios,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',

                                'Accept':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    valor:
                                        valorNumerico,

                                    fecha_inicio:
                                        fecha.value,

                                    observacion:
                                        observacion
                                            ? observacion.value.trim()
                                            : ''
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.ok
                ) {

                    throw new Error(
                        data.error ||
                        'No fue posible guardar el salario mínimo.'
                    );

                }


                cerrarModal();


                mostrarNotificacion(
                    'Salario mínimo actualizado correctamente.',
                    'success'
                );


                // Recargar la configuración
                await cargarSalarioMinimo();


            } catch (error) {

                console.error(
                    '❌ Error guardando salario mínimo:',
                    error
                );


                mostrarNotificacion(
                    error.message ||
                    'Error guardando el salario mínimo.',
                    'error'
                );


            } finally {

                bloquearModalBotones(false);

            }

        }
    );

}


/* =========================================================
   AUXILIO DE TRANSPORTE
   ========================================================= */

function nuevoAuxilio() {

    mostrarModal(

        'Nuevo auxilio de transporte',

        `

            <form
                onsubmit="
                    event.preventDefault();
                    mostrarNotificacion(
                        'El auxilio se conectará con la base de datos en el siguiente paso.',
                        'success'
                    );
                    cerrarModal();
                "
            >

                <div class="config-form-grid">

                    <div class="config-form-group">

                        <label>
                            Valor del auxilio
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="200000"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Salario máximo para aplicar
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="4870500"
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Fecha de inicio
                        </label>

                        <input
                            type="date"
                            required
                        >

                    </div>


                    <div class="config-form-group config-form-full">

                        <label>
                            Observación
                        </label>

                        <textarea
                            rows="3"
                            placeholder="Observación del valor vigente"
                        ></textarea>

                    </div>

                </div>


                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar

                    </button>

                </div>

            </form>

        `

    );

}


/* =========================================================
   MATERIALES
   ========================================================= */

function prepararBotonesMateriales() {

    const secciones =
        document.querySelectorAll(
            '.config-section'
        );


    secciones.forEach(
        section => {

            const titulo =
                section.querySelector('h2');


            if (!titulo) {

                return;

            }


            if (
                titulo.textContent
                    .trim()
                    .toLowerCase() !==
                'materiales de producción'
            ) {

                return;

            }


            section
                .querySelectorAll(
                    '.config-table tbody tr'
                )
                .forEach(
                    fila => {

                        const boton =
                            fila.querySelector(
                                '.btn-action'
                            );


                        if (!boton) {

                            return;

                        }


                        boton.type =
                            'button';


                        boton.addEventListener(
                            'click',
                            () =>
                                editarMaterialDesdeFila(
                                    fila
                                )
                        );

                    }
                );


            const botonNuevo =
                section.querySelector(
                    '.btn-nuevo'
                );


            if (botonNuevo) {

                botonNuevo.type =
                    'button';


                botonNuevo.addEventListener(
                    'click',
                    nuevoMaterial
                );

            }

        }
    );

}


/* =========================================================
   EDITAR MATERIAL
   ========================================================= */

function editarMaterialDesdeFila(
    fila
) {

    const celdas =
        fila.querySelectorAll('td');


    if (
        celdas.length < 4
    ) {

        return;

    }


    const codigo =
        celdas[0]
            .textContent
            .trim();


    const nombre =
        celdas[1]
            .textContent
            .trim();


    const unidad =
        celdas[2]
            .textContent
            .trim();


    const precio =
        celdas[3]
            .textContent
            .trim();


    mostrarModal(

        `Editar material ${codigo}`,

        `

            <form
                onsubmit="
                    event.preventDefault();
                    mostrarNotificacion(
                        'La edición de materiales se conectará con la base de datos en el siguiente paso.',
                        'success'
                    );
                    cerrarModal();
                "
            >

                <div class="config-form-grid">

                    <div class="config-form-group">

                        <label>
                            Código
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(codigo)}"
                            disabled
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Material
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(nombre)}"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Unidad
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(unidad)}"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Precio por unidad
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value="${escapeHtml(
                                limpiarMoneda(precio)
                            )}"
                            required
                        >

                    </div>

                </div>


                <div class="config-info-box">

                    <i class="fas fa-link"></i>

                    <div>

                        <strong>
                            Integración futura con Producción
                        </strong>

                        <p>
                            Este material será posteriormente
                            relacionado con Producción para que
                            Nómina pueda consultar automáticamente
                            los kilos aprobados y calcular el
                            valor correspondiente.
                        </p>

                    </div>

                </div>


                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar

                    </button>

                </div>

            </form>

        `

    );

}


/* =========================================================
   NUEVO MATERIAL
   ========================================================= */

function nuevoMaterial() {

    mostrarModal(

        'Nuevo material de producción',

        `

            <form
                onsubmit="
                    event.preventDefault();
                    mostrarNotificacion(
                        'El material se conectará con la base de datos en el siguiente paso.',
                        'success'
                    );
                    cerrarModal();
                "
            >

                <div class="config-form-grid">

                    <div class="config-form-group">

                        <label>
                            Código
                        </label>

                        <input
                            type="text"
                            placeholder="Ej. MAT-002"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Nombre del material
                        </label>

                        <input
                            type="text"
                            placeholder="Ej. Plástico PET"
                            required
                        >

                    </div>


                    <div class="config-form-group">

                        <label>
                            Unidad
                        </label>

                        <select
                            required
                        >

                            <option value="KG">
                                KG
                            </option>

                            <option value="UNIDAD">
                                Unidad
                            </option>

                            <option value="TON">
                                Tonelada
                            </option>

                        </select>

                    </div>


                    <div class="config-form-group">

                        <label>
                            Precio por unidad
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            required
                        >

                    </div>


                    <div class="config-form-group config-form-full">

                        <label>
                            Descripción
                        </label>

                        <textarea
                            rows="3"
                            placeholder="Descripción del material"
                        ></textarea>

                    </div>


                    <div class="config-form-group">

                        <label>
                            Fecha de inicio
                        </label>

                        <input
                            type="date"
                            required
                        >

                    </div>

                </div>


                <div class="config-info-box">

                    <i class="fas fa-industry"></i>

                    <div>

                        <strong>
                            Preparado para Producción
                        </strong>

                        <p>
                            Más adelante Producción podrá
                            utilizar estos materiales y Nómina
                            consultará el precio vigente para
                            calcular el pago por kilos.
                        </p>

                    </div>

                </div>


                <div class="config-modal-actions">

                    <button
                        type="button"
                        class="btn-modal-secondary"
                        data-bs-dismiss="modal"
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn-modal-primary"
                    >

                        <i class="fas fa-save"></i>

                        Guardar material

                    </button>

                </div>

            </form>

        `

    );

}


/* =========================================================
   MODAL GENERAL
   ========================================================= */

function mostrarModal(
    titulo,
    contenido
) {

    // Si existe otro modal, cerrarlo antes de crear uno nuevo
    const modalesAnteriores =
    document.querySelectorAll(
        '#configModal'
    );

modalesAnteriores.forEach(
    (modalAnterior) => {

        const instancia =
            bootstrap.Modal.getInstance(
                modalAnterior
            );

        if (instancia) {
            instancia.hide();
        }

        setTimeout(() => {

            if (
                modalAnterior.parentNode &&
                !modalAnterior.classList.contains('show')
            ) {
                modalAnterior.remove();
            }

        }, 400);

    }
);


    // Crear el HTML del modal
    const modalHTML = `

        <div
            class="modal fade"
            id="configModal"
            tabindex="-1"
            aria-hidden="true"
        >

            <div
                class="
                    modal-dialog
                    modal-dialog-centered
                    modal-lg
                "
            >

                <div
                    class="
                        modal-content
                        config-modal
                    "
                >

                    <div class="modal-header">

                        <h5 class="modal-title">

                            <i class="fas fa-sliders-h"></i>

                            ${escapeHtml(titulo)}

                        </h5>

                        <button
                            type="button"
                            class="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Cerrar"
                        ></button>

                    </div>

                    <div class="modal-body">

                        ${contenido}

                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.insertAdjacentHTML(
        'beforeend',
        modalHTML
    );


    const modalElement =
        document.getElementById(
            'configModal'
        );


    if (!modalElement) {
        return;
    }


    if (
        typeof bootstrap ===
        'undefined'
    ) {

        console.error(
            '❌ Bootstrap no está cargado.'
        );

        return;
    }


    // Crear instancia de Bootstrap
    const modal =
        new bootstrap.Modal(
            modalElement
        );


    // Cuando Bootstrap termine de cerrar,
    // eliminamos solamente el elemento modal.
    modalElement.addEventListener(
    'hidden.bs.modal',
    () => {

        if (modalElement.parentNode) {
            modalElement.remove();
        }

    },
    {
        once: true
    }
);


    // Mostrar
    modal.show();

}


function cerrarModal() {

    const modalElement =
        document.getElementById('configModal');

    // Si existe una instancia de Bootstrap,
    // dejamos que Bootstrap cierre el modal correctamente.
    if (
        modalElement &&
        typeof bootstrap !== 'undefined'
    ) {

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {

            modalElement.addEventListener(
                'hidden.bs.modal',
                () => {

                    // Eliminar modal
                    if (modalElement.parentNode) {
                        modalElement.remove();
                    }

                    // Limpiar cualquier backdrop
                    // que haya quedado por error
                    document
                        .querySelectorAll('.modal-backdrop')
                        .forEach(backdrop => {
                            backdrop.remove();
                        });

                    document.body.classList.remove(
                        'modal-open'
                    );

                    document.body.style.removeProperty(
                        'padding-right'
                    );

                },
                {
                    once: true
                }
            );

            modal.hide();

            return;
        }
    }


    // Si Bootstrap no encuentra la instancia,
    // hacemos limpieza de emergencia.

    if (modalElement) {

        modalElement.remove();

    }

    document
        .querySelectorAll('.modal-backdrop')
        .forEach(backdrop => {
            backdrop.remove();
        });

    document.body.classList.remove(
        'modal-open'
    );

    document.body.style.removeProperty(
        'padding-right'
    );

}


/* =========================================================
   BLOQUEAR BOTONES DEL MODAL
   ========================================================= */

function bloquearModalBotones(
    bloquear
) {

    const modal =
        document.getElementById(
            'configModal'
        );


    if (!modal) {

        return;

    }


    modal
        .querySelectorAll(
            'button'
        )
        .forEach(
            boton => {

                boton.disabled =
                    bloquear;

            }
        );

}


/* =========================================================
   FECHA MÍNIMA
   ========================================================= */

function obtenerFechaMinima(
    fechaActual
) {

    if (!fechaActual) {

        return '';

    }


    const fecha =
        new Date(
            `${String(fechaActual)
                .substring(0, 10)}T00:00:00`
        );


    fecha.setDate(
        fecha.getDate() + 1
    );


    return fecha
        .toISOString()
        .substring(0, 10);

}


/* =========================================================
   LIMPIAR MONEDA
   ========================================================= */

function limpiarMoneda(
    valor
) {

    return String(
        valor || ''
    )
        .replace(/\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHtml(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return '';

    }


    return String(valor)

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function mostrarNotificacion(
    mensaje,
    tipo = 'success'
) {

    const anterior =
        document.querySelector(
            '.config-toast'
        );


    if (anterior) {

        anterior.remove();

    }


    const alerta =
        document.createElement(
            'div'
        );


    alerta.className =
        `config-toast config-toast-${tipo}`;


    const icono =
        tipo === 'success'
            ? 'fa-check-circle'
            : 'fa-exclamation-circle';


    alerta.innerHTML = `

        <i class="fas ${icono}"></i>

        <span>
            ${escapeHtml(mensaje)}
        </span>

    `;


    document.body.appendChild(
        alerta
    );


    setTimeout(
        () => {

            alerta.classList.add(
                'config-toast-hide'
            );


            setTimeout(
                () => {

                    alerta.remove();

                },
                300
            );

        },
        3000
    );

}


/* =========================================================
   EXPORTAR FUNCIONES
   =========================================================
   Necesario porque algunos botones del HTML
   pueden llamar funciones directamente.
   ========================================================= */

window.cargarParametros =
    cargarParametros;

window.editarParametro =
    editarParametro;

window.guardarParametro =
    guardarParametro;

window.cargarHorasExtra =
    cargarHorasExtra;

window.renderizarHorasExtra =
    renderizarHorasExtra;

window.editarHoraExtraDesdeFila =
    editarHoraExtraDesdeFila;

window.guardarHoraExtra =
    guardarHoraExtra;

window.nuevoTipoHoraExtra =
    nuevoTipoHoraExtra;

window.nuevoRecargo =
    nuevoRecargo;

window.nuevoSalario =
    nuevoSalario;

window.nuevoAuxilio =
    nuevoAuxilio;

window.nuevoMaterial =
    nuevoMaterial;

window.mostrarNotificacion =
    mostrarNotificacion;

window.cerrarModal =
    cerrarModal;