// ==========================================================
// EVALUACIÓN DE CAPACITACIÓN
// ==========================================================

let evaluacionId = null;
let cursoId = null;
let capituloId = null;

let evaluacionActual = null;
let preguntasEvaluacion = [];


// ==========================================================
// INICIAR
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    evaluacionId =
        Number(
            parametros.get("evaluacion")
        );

    cursoId =
        Number(
            parametros.get("curso")
        );

    
    capituloId =
    Number(
        parametros.get("capitulo")
    );


    console.log(
        "EVALUACIÓN ID:",
        evaluacionId
    );

    console.log(
        "CURSO ID:",
        cursoId
    );


    // ======================================================
    // VALIDAR PARÁMETROS
    // ======================================================

    if(
        !evaluacionId ||
        !cursoId
    ){

        mostrarError(
            "No se encontró la información de la evaluación."
        );

        return;
    }


    // ======================================================
    // BOTÓN ENVIAR
    // ======================================================

    const btnEnviar =
        document.getElementById(
            "btnEnviarEvaluacion"
        );

    if(btnEnviar){

        btnEnviar.addEventListener(
            "click",
            enviarEvaluacion
        );

    }


    // ======================================================
    // CARGAR EVALUACIÓN
    // ======================================================

    await cargarEvaluacion();

});


// ==========================================================
// CARGAR INFORMACIÓN DE LA EVALUACIÓN
// ==========================================================

async function cargarEvaluacion(){

    try{

        // ==================================================
        // OBTENER EVALUACIONES DEL CURSO
        // ==================================================

        const respuestaEvaluaciones =
            await fetch(
                `/api/cursos/${cursoId}/evaluaciones`
            );


        const datosEvaluaciones =
            await respuestaEvaluaciones.json();


        console.log(
            "EVALUACIONES:",
            datosEvaluaciones
        );


        if(
            !respuestaEvaluaciones.ok ||
            !datosEvaluaciones.success
        ){

            throw new Error(
                datosEvaluaciones.mensaje ||
                "No fue posible cargar la evaluación."
            );

        }


        // ==================================================
        // BUSCAR LA EVALUACIÓN CORRECTA
        // ==================================================

        evaluacionActual =
            (
                datosEvaluaciones.evaluaciones ||
                []
            ).find(

                evaluacion =>
                    Number(evaluacion.id) ===
                    Number(evaluacionId)

            );


        if(!evaluacionActual){

            throw new Error(
                "La evaluación no pertenece a esta capacitación."
            );

        }


        // ==================================================
        // MOSTRAR INFORMACIÓN
        // ==================================================

        const titulo =
            document.getElementById(
                "tituloEvaluacion"
            );

        const descripcion =
            document.getElementById(
                "descripcionEvaluacion"
            );

        const porcentaje =
            document.getElementById(
                "porcentajeAprobacion"
            );


        if(titulo){

            titulo.textContent =
                evaluacionActual.titulo ||
                "Evaluación";

        }


        if(descripcion){

            descripcion.textContent =
                evaluacionActual.descripcion ||
                "Responde todas las preguntas de la evaluación.";

        }


        if(porcentaje){

            porcentaje.textContent =
                `${evaluacionActual.porcentaje_aprobacion || 0}%`;

        }


        // ==================================================
        // CARGAR PREGUNTAS
        // ==================================================

        await cargarPreguntas();

    }
    catch(error){

        console.error(
            "ERROR CARGANDO EVALUACIÓN:",
            error
        );

        mostrarError(
            error.message ||
            "No fue posible cargar la evaluación."
        );

    }

}


// ==========================================================
// CARGAR PREGUNTAS
// ==========================================================

async function cargarPreguntas(){

    try{

        const respuesta =
            await fetch(
                `/api/evaluaciones/${evaluacionId}/preguntas`
            );


        const datos =
            await respuesta.json();


        console.log(
            "PREGUNTAS DE LA EVALUACIÓN:",
            datos
        );


        if(
            !respuesta.ok ||
            !datos.success
        ){

            throw new Error(
                datos.mensaje ||
                "No fue posible cargar las preguntas."
            );

        }


        preguntasEvaluacion =
            datos.preguntas || [];


        // ==================================================
        // TOTAL DE PREGUNTAS
        // ==================================================

        const totalPreguntas =
            document.getElementById(
                "totalPreguntas"
            );


        if(totalPreguntas){

            totalPreguntas.textContent =
                preguntasEvaluacion.length;

        }


        // ==================================================
        // VALIDAR QUE HAYA PREGUNTAS
        // ==================================================

        if(
            preguntasEvaluacion.length === 0
        ){

            mostrarError(
                "Esta evaluación todavía no tiene preguntas configuradas."
            );

            return;

        }


        renderizarPreguntas();

        actualizarProgreso();

    }
    catch(error){

        console.error(
            "ERROR CARGANDO PREGUNTAS:",
            error
        );

        mostrarError(
            error.message ||
            "No fue posible cargar las preguntas."
        );

    }

}


// ==========================================================
// RENDERIZAR PREGUNTAS
// ==========================================================

function renderizarPreguntas(){

    const contenedor =
        document.getElementById(
            "contenedorEvaluacion"
        );


    if(!contenedor){

        return;

    }


    contenedor.innerHTML = "";


    preguntasEvaluacion.forEach(
        (pregunta, index) => {

            const card =
                document.createElement("article");


            card.className =
                "pregunta-card";


            card.dataset.preguntaId =
                pregunta.id;


            // ==================================================
            // ENCABEZADO
            // ==================================================

            const obligatoria =
                pregunta.obligatoria
                    ? `<span class="pregunta-obligatoria">*</span>`
                    : "";


            card.innerHTML = `

                <div class="pregunta-titulo">

                    <span class="pregunta-numero">
                        ${index + 1}
                    </span>

                    ${escaparHTML(
                        pregunta.pregunta ||
                        `Pregunta ${index + 1}`
                    )}

                    ${obligatoria}

                </div>

                <div
                    class="respuesta-pregunta"
                    id="respuestaPregunta${pregunta.id}"
                >
                </div>

            `;


            contenedor.appendChild(card);


            renderizarTipoPregunta(
                pregunta
            );

        }
    );

}


// ==========================================================
// RENDERIZAR SEGÚN EL TIPO DE PREGUNTA
// ==========================================================

function renderizarTipoPregunta(
    pregunta
){

    const contenedor =
        document.getElementById(
            `respuestaPregunta${pregunta.id}`
        );


    if(!contenedor){

        return;

    }


    switch(pregunta.tipo){


        // ==================================================
        // VARIAS OPCIONES
        // ==================================================

        case "VARIAS_OPCIONES":

            renderizarOpcionesRadio(
                pregunta,
                contenedor
            );

            break;


        // ==================================================
        // DESPLEGABLE
        // ==================================================

        case "DESPLEGABLE":

            renderizarDesplegable(
                pregunta,
                contenedor
            );

            break;


        // ==================================================
        // CASILLAS
        // ==================================================

        case "CASILLAS":

            renderizarCasillas(
                pregunta,
                contenedor
            );

            break;


        // ==================================================
        // RESPUESTA CORTA
        // ==================================================

        case "RESPUESTA_CORTA":

            contenedor.innerHTML = `

                <input
                    type="text"
                    class="campo-respuesta"
                    data-pregunta="${pregunta.id}"
                    placeholder="Escribe tu respuesta"
                    ${pregunta.obligatoria ? "required" : ""}
                >

            `;

            break;


        // ==================================================
        // PÁRRAFO
        // ==================================================

        case "PARRAFO":

            contenedor.innerHTML = `

                <textarea
                    class="campo-respuesta campo-parrafo"
                    data-pregunta="${pregunta.id}"
                    rows="5"
                    placeholder="Escribe tu respuesta"
                    ${pregunta.obligatoria ? "required" : ""}
                ></textarea>

            `;

            break;


        // ==================================================
        // FECHA
        // ==================================================

        case "FECHA":

            contenedor.innerHTML = `

                <input
                    type="date"
                    class="campo-respuesta"
                    data-pregunta="${pregunta.id}"
                    ${pregunta.obligatoria ? "required" : ""}
                >

            `;

            break;


        // ==================================================
        // HORA
        // ==================================================

        case "HORA":

            contenedor.innerHTML = `

                <input
                    type="time"
                    class="campo-respuesta"
                    data-pregunta="${pregunta.id}"
                    ${pregunta.obligatoria ? "required" : ""}
                >

            `;

            break;


        // ==================================================
        // ESCALA LINEAL
        // ==================================================

        case "ESCALA_LINEAL":

            renderizarEscala(
                pregunta,
                contenedor
            );

            break;


        // ==================================================
        // CALIFICACIÓN
        // ==================================================

        case "CALIFICACION":

            renderizarCalificacion(
                pregunta,
                contenedor
            );

            break;


        // ==================================================
        // CUADRÍCULA OPCIONES
        // ==================================================

        case "CUADRICULA_OPCIONES":

            renderizarCuadricula(
                pregunta,
                contenedor,
                false
            );

            break;


        // ==================================================
        // CUADRÍCULA CASILLAS
        // ==================================================

        case "CUADRICULA_CASILLAS":

            renderizarCuadricula(
                pregunta,
                contenedor,
                true
            );

            break;


        // ==================================================
        // SUBIR ARCHIVOS
        // ==================================================

        case "SUBIR_ARCHIVOS":

            contenedor.innerHTML = `

                <div class="mensaje-tipo-no-disponible">

                    <i class="fas fa-file-arrow-up"></i>

                    La carga de archivos se habilitará
                    posteriormente.

                </div>

            `;

            break;


        // ==================================================
        // DESCONOCIDO
        // ==================================================

        default:

            contenedor.innerHTML = `

                <div class="mensaje-tipo-no-disponible">

                    Tipo de pregunta no compatible:
                    ${escaparHTML(
                        pregunta.tipo || ""
                    )}

                </div>

            `;

    }


    // ======================================================
    // ESCUCHAR CAMBIOS
    // ======================================================

    const campos =
        contenedor.querySelectorAll(
            "input, textarea, select"
        );


    campos.forEach(campo => {

        campo.addEventListener(
            "change",
            actualizarProgreso
        );

        campo.addEventListener(
            "input",
            actualizarProgreso
        );

    });

}


// ==========================================================
// OPCIONES RADIO
// ==========================================================

function renderizarOpcionesRadio(
    pregunta,
    contenedor
){

    const opciones =
        pregunta.opciones || [];


    contenedor.innerHTML = `

        <div class="opciones-pregunta">

            ${opciones.map(
                (opcion, index) => `

                    <label class="opcion-evaluacion">

                        <input
                            type="radio"
                            name="pregunta_${pregunta.id}"
                            value="${index}"
                            data-pregunta="${pregunta.id}"
                        >

                        <span>
                            ${escaparHTML(
                                opcion.texto || ""
                            )}
                        </span>

                    </label>

                `
            ).join("")}

        </div>

    `;


    activarEstiloOpciones(
        contenedor
    );

}


// ==========================================================
// DESPLEGABLE
// ==========================================================

function renderizarDesplegable(
    pregunta,
    contenedor
){

    const opciones =
        pregunta.opciones || [];


    contenedor.innerHTML = `

        <select
            class="campo-respuesta"
            data-pregunta="${pregunta.id}"
        >

            <option value="">
                Selecciona una respuesta
            </option>

            ${opciones.map(
                (opcion, index) => `

                    <option value="${index}">

                        ${escaparHTML(
                            opcion.texto || ""
                        )}

                    </option>

                `
            ).join("")}

        </select>

    `;

}


// ==========================================================
// CASILLAS
// ==========================================================

function renderizarCasillas(
    pregunta,
    contenedor
){

    const opciones =
        pregunta.opciones || [];


    contenedor.innerHTML = `

        <div class="opciones-pregunta">

            ${opciones.map(
                (opcion, index) => `

                    <label class="opcion-evaluacion">

                        <input
                            type="checkbox"
                            name="pregunta_${pregunta.id}"
                            value="${index}"
                            data-pregunta="${pregunta.id}"
                        >

                        <span>

                            ${escaparHTML(
                                opcion.texto || ""
                            )}

                        </span>

                    </label>

                `
            ).join("")}

        </div>

    `;


    activarEstiloOpciones(
        contenedor
    );

}


// ==========================================================
// ESCALA LINEAL
// ==========================================================

function renderizarEscala(
    pregunta,
    contenedor
){

    contenedor.innerHTML = `

        <div class="opciones-pregunta">

            ${[1,2,3,4,5].map(
                numero => `

                    <label class="opcion-evaluacion">

                        <input
                            type="radio"
                            name="pregunta_${pregunta.id}"
                            value="${numero}"
                            data-pregunta="${pregunta.id}"
                        >

                        <span>
                            ${numero}
                        </span>

                    </label>

                `
            ).join("")}

        </div>

    `;


    activarEstiloOpciones(
        contenedor
    );

}


// ==========================================================
// CALIFICACIÓN
// ==========================================================

function renderizarCalificacion(
    pregunta,
    contenedor
){

    contenedor.innerHTML = `

        <div class="calificacion-estrellas">

            ${[1,2,3,4,5].map(
                numero => `

                    <label>

                        <input
                            type="radio"
                            name="pregunta_${pregunta.id}"
                            value="${numero}"
                            data-pregunta="${pregunta.id}"
                        >

                        <i class="fas fa-star"></i>

                    </label>

                `
            ).join("")}

        </div>

    `;

}


// ==========================================================
// CUADRÍCULA
// ==========================================================

function renderizarCuadricula(
    pregunta,
    contenedor,
    multiple
){

    const filas =
        pregunta.filas || [];

    const columnas =
        pregunta.columnas || [];


    if(
        filas.length === 0 ||
        columnas.length === 0
    ){

        contenedor.innerHTML = `

            <div class="mensaje-tipo-no-disponible">

                Esta cuadrícula no tiene filas
                o columnas configuradas.

            </div>

        `;

        return;

    }


    contenedor.innerHTML = `

        <div class="tabla-cuadricula">

            <table>

                <thead>

                    <tr>

                        <th></th>

                        ${columnas.map(
                            columna => `

                                <th>
                                    ${escaparHTML(
                                        columna
                                    )}
                                </th>

                            `
                        ).join("")}

                    </tr>

                </thead>

                <tbody>

                    ${filas.map(
                        (fila, filaIndex) => `

                            <tr>

                                <td>
                                    ${escaparHTML(
                                        fila
                                    )}
                                </td>

                                ${columnas.map(
                                    (columna, columnaIndex) => `

                                        <td>

                                            <input
                                                type="${multiple ? "checkbox" : "radio"}"
                                                name="pregunta_${pregunta.id}_fila_${filaIndex}"
                                                value="${columnaIndex}"
                                                data-pregunta="${pregunta.id}"
                                                data-fila="${filaIndex}"
                                            >

                                        </td>

                                    `
                                ).join("")}

                            </tr>

                        `
                    ).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// ==========================================================
// ESTILO DE OPCIONES SELECCIONADAS
// ==========================================================

function activarEstiloOpciones(
    contenedor
){

    const inputs =
        contenedor.querySelectorAll(
            "input"
        );


    inputs.forEach(input => {

        input.addEventListener(
            "change",
            () => {

                const opciones =
                    contenedor.querySelectorAll(
                        ".opcion-evaluacion"
                    );


                opciones.forEach(opcion => {

                    const campo =
                        opcion.querySelector(
                            "input"
                        );


                    opcion.classList.toggle(
                        "seleccionada",
                        campo.checked
                    );

                });

            }
        );

    });

}


// ==========================================================
// SABER SI UNA PREGUNTA FUE RESPONDIDA
// ==========================================================

function preguntaRespondida(
    pregunta
){

    const contenedor =
        document.getElementById(
            `respuestaPregunta${pregunta.id}`
        );


    if(!contenedor){

        return false;

    }


    switch(pregunta.tipo){


        case "VARIAS_OPCIONES":
        case "ESCALA_LINEAL":
        case "CALIFICACION":

            return Boolean(
                contenedor.querySelector(
                    "input:checked"
                )
            );


        case "CASILLAS":

            return (
                contenedor.querySelectorAll(
                    "input:checked"
                ).length > 0
            );


        case "DESPLEGABLE":

            return Boolean(
                contenedor.querySelector(
                    "select"
                )?.value
            );


        case "RESPUESTA_CORTA":
        case "PARRAFO":
        case "FECHA":
        case "HORA":

            return Boolean(
                contenedor.querySelector(
                    "input, textarea"
                )?.value.trim()
            );


        case "CUADRICULA_OPCIONES":
        case "CUADRICULA_CASILLAS":

            return Boolean(
                contenedor.querySelector(
                    "input:checked"
                )
            );


        case "SUBIR_ARCHIVOS":

            return false;


        default:

            return false;

    }

}


// ==========================================================
// ACTUALIZAR PROGRESO
// ==========================================================

function actualizarProgreso(){

    if(
        preguntasEvaluacion.length === 0
    ){

        return;

    }


    const respondidas =
        preguntasEvaluacion.filter(
            pregunta =>
                preguntaRespondida(
                    pregunta
                )
        ).length;


    const porcentaje =
        Math.round(
            (
                respondidas /
                preguntasEvaluacion.length
            ) * 100
        );


    const texto =
        document.getElementById(
            "progresoTexto"
        );

    const barra =
        document.getElementById(
            "barraProgresoEvaluacion"
        );


    if(texto){

        texto.textContent =
            `${porcentaje}%`;

    }


    if(barra){

        barra.style.width =
            `${porcentaje}%`;

    }


    validarBotonEnviar();

}


// ==========================================================
// VALIDAR BOTÓN ENVIAR
// ==========================================================

function validarBotonEnviar(){

    const btn =
        document.getElementById(
            "btnEnviarEvaluacion"
        );


    if(!btn){

        return;

    }


    const obligatorias =
        preguntasEvaluacion.filter(
            pregunta =>
                pregunta.obligatoria
        );


    const completas =
        obligatorias.every(
            pregunta =>
                preguntaRespondida(
                    pregunta
                )
        );


    btn.disabled =
        !completas;

}


// ==========================================================
// ENVIAR EVALUACIÓN
// ==========================================================

async function enviarEvaluacion(){

    try{

        // ==================================================
        // CONFIRMAR
        // ==================================================

        const confirmar = await Swal.fire({

    icon: "question",

    title: "¿Enviar evaluación?",

    html: `
        <p>
            Estás a punto de enviar tus respuestas.
        </p>

        <p>
            Una vez enviada la evaluación,
            <strong>este intento quedará registrado</strong>.
        </p>

        <p>
            ¿Deseas continuar?
        </p>
    `,

    showCancelButton: true,

    confirmButtonText:
        "Sí, enviar evaluación",

    cancelButtonText:
        "Revisar respuestas",

    confirmButtonColor:
        "#16a34a",

    cancelButtonColor:
        "#64748b",

    reverseButtons: true,

    allowOutsideClick: false,

    customClass: {

        popup:
            "swal-capacitacion",

        title:
            "swal-capacitacion-titulo",

        htmlContainer:
            "swal-capacitacion-mensaje",

        confirmButton:
            "swal-capacitacion-boton",

        cancelButton:
            "swal-capacitacion-boton-cancelar"

    }

});


if(!confirmar.isConfirmed){

    return;

}


        // ==================================================
        // DESHABILITAR BOTÓN
        // ==================================================

        const btn =
            document.getElementById(
                "btnEnviarEvaluacion"
            );

        if(btn){

            btn.disabled = true;

            btn.innerHTML = `

                <i class="fas fa-spinner fa-spin"></i>

                Enviando evaluación...

            `;

        }


        // ==================================================
        // RECOGER RESPUESTAS
        // ==================================================

        const respuestas = [];


        for(
            const pregunta
            of preguntasEvaluacion
        ){

            const respuesta =
                obtenerRespuestaPregunta(
                    pregunta
                );


            // ==============================================
            // SOLO GUARDAMOS LAS QUE TENGAN RESPUESTA
            // ==============================================

            if(
                respuesta !== null &&
                respuesta !== undefined &&
                respuesta !== ""
            ){

                respuestas.push({

                    pregunta_id:
                        pregunta.id,

                    respuesta

                });

            }

        }


        console.log(
            "RESPUESTAS A ENVIAR:",
            respuestas
        );


        // ==================================================
        // ENVIAR AL BACKEND
        // ==================================================

        const respuestaServidor =
            await fetch(

                `/api/evaluaciones-capacitacion/${evaluacionId}/responder`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        respuestas

                    })

                }

            );


        const datos =
            await respuestaServidor.json();


        console.log(
            "RESULTADO EVALUACIÓN:",
            datos
        );


        // ==================================================
        // ERROR
        // ==================================================

        if(
            !respuestaServidor.ok ||
            !datos.success
        ){

            throw new Error(

                datos.mensaje ||
                "No fue posible enviar la evaluación."

            );

        }


        // ==================================================
        // GUARDAR RESULTADO
        // ==================================================

        sessionStorage.setItem(

            "resultadoEvaluacionCapacitacion",

            JSON.stringify({

                evaluacionId,

                cursoId,

                nota:
                    datos.nota,

                aprobado:
                    datos.aprobado,

                porcentajeAprobacion:
                    datos.porcentaje_aprobacion,

                intento:
                    datos.intento,

                evaluacionUsuarioId:
                    datos.evaluacion_usuario_id

            })

        );


        // ==================================================
        // RESULTADO
        // ==================================================

        if(
            datos.aprobado
        ){

            // ==============================================
            // APROBÓ
            // ==============================================

            await Swal.fire({

    icon: "success",

    title: "¡Evaluación aprobada!",

    html: `
        <p>
            Has obtenido una nota de
            <strong>${datos.nota}%</strong>.
        </p>

        <p>
            El mínimo requerido era
            <strong>${datos.porcentaje_aprobacion}%</strong>.
        </p>

        <p>
            <i class="fas fa-unlock"></i>
            El siguiente capítulo ha sido desbloqueado.
        </p>
    `,

    confirmButtonText: "Continuar",

    confirmButtonColor: "#16a34a",

    allowOutsideClick: false,

    customClass: {
        popup: "swal-capacitacion",
        title: "swal-capacitacion-titulo",
        confirmButton: "swal-capacitacion-boton"
    }

});


            // ==============================================
            // IR A GENERAR CERTIFICADO
            // ==============================================

           window.location.href =

    `/capacitacion/${cursoId}` +

    `?capitulo=${capituloId}` +

    `&evaluacion_aprobada=1`;

        }
        else{

            // ==============================================
            // NO APROBÓ
            // ==============================================

            await Swal.fire({

    icon: "warning",

    title: "Evaluación no aprobada",

    html: `
        <p>
            Tu nota fue
            <strong>${datos.nota}%</strong>.
        </p>

        <p>
            Necesitas mínimo
            <strong>${datos.porcentaje_aprobacion}%</strong>
            para aprobar.
        </p>
    `,

    confirmButtonText: "Intentar nuevamente",

    confirmButtonColor: "#f59e0b",

    allowOutsideClick: false,

    customClass: {
        popup: "swal-capacitacion",
        title: "swal-capacitacion-titulo",
        confirmButton: "swal-capacitacion-boton"
    }

});


            // ==============================================
            // RECARGAR LA EVALUACIÓN
            // ==============================================

            window.location.reload();

        }


    }
    catch(error){

        console.error(

            "ERROR ENVIANDO EVALUACIÓN:",

            error

        );


        await Swal.fire({

    icon: "error",

    title: "No fue posible enviar la evaluación",

    text:
        error.message ||
        "Ocurrió un error al enviar la evaluación.",

    confirmButtonText: "Entendido",

    confirmButtonColor: "#dc2626",

    allowOutsideClick: false,

    customClass: {
        popup: "swal-capacitacion",
        title: "swal-capacitacion-titulo",
        confirmButton: "swal-capacitacion-boton"
    }

});


        // ==============================================
        // RESTAURAR BOTÓN
        // ==============================================

        const btn =
            document.getElementById(
                "btnEnviarEvaluacion"
            );


        if(btn){

            btn.disabled = false;

            btn.innerHTML = `

                <i class="fas fa-paper-plane"></i>

                Enviar evaluación

            `;

        }

    }

}

// ==========================================================
// OBTENER RESPUESTA DE UNA PREGUNTA
// ==========================================================

function obtenerRespuestaPregunta(
    pregunta
){

    const contenedor =
        document.getElementById(
            `respuestaPregunta${pregunta.id}`
        );


    if(!contenedor){

        return null;

    }


    switch(pregunta.tipo){


        // ==============================================
        // UNA OPCIÓN
        // ==============================================

        case "VARIAS_OPCIONES":
        case "ESCALA_LINEAL":
        case "CALIFICACION":

        {

            const seleccionada =
                contenedor.querySelector(
                    "input:checked"
                );


            return seleccionada
                ? seleccionada.value
                : null;

        }


        // ==============================================
        // CASILLAS
        // ==============================================

        case "CASILLAS":

        {

            const seleccionadas =
                contenedor.querySelectorAll(
                    "input:checked"
                );


            return Array.from(
                seleccionadas
            ).map(
                input =>
                    input.value
            );

        }


        // ==============================================
        // DESPLEGABLE
        // ==============================================

        case "DESPLEGABLE":

        {

            const select =
                contenedor.querySelector(
                    "select"
                );


            return select &&
                select.value !== ""
                ? select.value
                : null;

        }


        // ==============================================
        // TEXTO
        // ==============================================

        case "RESPUESTA_CORTA":
        case "PARRAFO":

        {

            const campo =
                contenedor.querySelector(
                    "input, textarea"
                );


            return campo &&
                campo.value.trim() !== ""
                ? campo.value.trim()
                : null;

        }


        // ==============================================
        // FECHA / HORA
        // ==============================================

        case "FECHA":
        case "HORA":

        {

            const campo =
                contenedor.querySelector(
                    "input"
                );


            return campo &&
                campo.value
                ? campo.value
                : null;

        }


        // ==============================================
        // CUADRÍCULAS
        // ==============================================

        case "CUADRICULA_OPCIONES":
        case "CUADRICULA_CASILLAS":

        {

            const seleccionadas =
                contenedor.querySelectorAll(
                    "input:checked"
                );


            return Array.from(
                seleccionadas
            ).map(
                input => ({

                    fila:
                        input.dataset.fila,

                    columna:
                        input.value

                })
            );

        }


        default:

            return null;

    }

}


// ==========================================================
// MOSTRAR ERROR
// ==========================================================

function mostrarError(
    mensaje
){

    const contenedor =
        document.getElementById(
            "contenedorEvaluacion"
        );


    if(!contenedor){

        return;

    }


    contenedor.innerHTML = `

        <div class="estado-cargando">

            <i class="fas fa-circle-exclamation"></i>

            <h3>
                No fue posible cargar la evaluación
            </h3>

            <p>
                ${escaparHTML(mensaje)}
            </p>

        </div>

    `;


    const btn =
        document.getElementById(
            "btnEnviarEvaluacion"
        );


    if(btn){

        btn.disabled = true;

    }

}


// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escaparHTML(
    valor
){

    return String(
        valor ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}