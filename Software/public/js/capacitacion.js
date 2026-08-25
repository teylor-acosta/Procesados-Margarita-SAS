// ==============================================
// CAPACITACIÓN
// ==============================================

let capacitacionId = null;
let cursoId = null;
let capitulos = [];
let capituloActual = 0;

let reproductoresYouTube = [];

// Videos del capítulo actual
let videosCompletados = new Set();
let totalVideosActuales = 0;

// Capítulos que ya terminó el usuario
let capitulosCompletados = new Set();


// ==============================================
// INICIAR
// ==============================================

document.addEventListener("DOMContentLoaded", () => {

    const partes = window.location.pathname.split("/");

    capacitacionId = Number(partes[2]);

    // ==========================================
    // LEER PARÁMETROS DE REGRESO DE EVALUACIÓN
    // ==========================================

    const parametros = new URLSearchParams(
        window.location.search
    );

    const capituloEvaluado = Number(
        parametros.get("capitulo")
    );

    const evaluacionAprobada =
        parametros.get("evaluacion_aprobada") === "1";

    // Guardar temporalmente estos datos
    window.capituloEvaluado = capituloEvaluado;
    window.evaluacionAprobada = evaluacionAprobada;

    console.log(
        "CAPACITACIÓN ID:",
        capacitacionId
    );

    console.log(
        "CAPÍTULO EVALUADO:",
        capituloEvaluado
    );

    console.log(
        "EVALUACIÓN APROBADA:",
        evaluacionAprobada
    );

    if (!capacitacionId) {

        console.error(
            "No se encontró el ID de la capacitación."
        );

        return;

    }

    cargarCapacitacion();

});

// ==============================================
// CARGAR CAPACITACIÓN
// ==============================================

async function cargarCapacitacion(){

    try{

        console.log(
            "Cargando capacitación:",
            capacitacionId
        );

        // ==========================================
        // 1. OBTENER INFORMACIÓN DEL CURSO
        // ==========================================

        const respuestaCurso = await fetch(
    `/api/capacitacion/${capacitacionId}`
);

        const datosCurso =
            await respuestaCurso.json();

        console.log(
            "DATOS CURSO:",
            datosCurso
        );

        if(!datosCurso.success){

            console.error(
                "No se pudo cargar el curso."
            );

            return;

        }

        const curso =
    datosCurso.curso;

cursoId = Number(curso.curso_id);

console.log("ID ASIGNACIÓN:", capacitacionId);
console.log("ID CURSO REAL:", cursoId);

        // ==========================================
        // MOSTRAR INFORMACIÓN DEL CURSO
        // ==========================================

        document.getElementById(
            "tituloCurso"
        ).textContent =
            curso.nombre || "";

        document.getElementById(
            "descripcionCurso"
        ).textContent =
            curso.descripcion || "";


        // ==========================================
        // 2. OBTENER CAPÍTULOS
        // ==========================================

console.log(
    "CAPÍTULOS DEL CURSO:",
    datosCurso.capitulos
);


// ==========================================
// VALIDAR CAPÍTULOS
// ==========================================

if (
    !Array.isArray(datosCurso.capitulos)
) {

    console.error(
        "La respuesta del curso no contiene un arreglo de capítulos."
    );

    capitulos = [];

} else {

    capitulos = [
        ...datosCurso.capitulos
    ];

}


// ==========================================
// MOSTRAR INFORMACIÓN
// ==========================================

console.log(
    "CAPÍTULOS RECIBIDOS:",
    capitulos
);

console.log(
    "ES ARRAY:",
    Array.isArray(capitulos)
);

console.log(
    "CANTIDAD:",
    capitulos.length
);

console.log(
    "CAPÍTULOS ASIGNADOS:",
    capitulos
);

console.log(
    "CANTIDAD ASIGNADA:",
    capitulos.length
);

// ==========================================
// CARGAR PROGRESO GUARDADO
// ==========================================

try {

    const respuestaProgreso =
    await fetch(
        `/api/cursos/${cursoId}/progreso`
    );

    const datosProgreso =
        await respuestaProgreso.json();

    console.log(
        "PROGRESO GUARDADO:",
        datosProgreso
    );

    if (
        datosProgreso.success &&
        datosProgreso.progreso
    ) {

        const progreso =
            datosProgreso.progreso;

        const cantidadCompletados =
            Number(
                progreso.capitulos_completados || 0
            );

        // Recuperar capítulos completados
        capitulosCompletados =
            new Set();

        for (
            let i = 0;
            i < cantidadCompletados;
            i++
        ) {
            capitulosCompletados.add(i);
        }

        // Continuar en el siguiente capítulo
        if (
            cantidadCompletados <
            capitulos.length
        ) {

            capituloActual =
                cantidadCompletados;

        } else {

            capituloActual =
                capitulos.length - 1;

        }

        console.log(
            "CAPÍTULOS RECUPERADOS:",
            [...capitulosCompletados]
        );

        console.log(
            "CAPÍTULO ACTUAL:",
            capituloActual
        );

    }

} catch(error) {

    console.error(
        "ERROR CARGANDO PROGRESO:",
        error
    );

}


// ==========================================
// PROCESAR REGRESO DE EVALUACIÓN
// ==========================================

if (
    window.evaluacionAprobada &&
    window.capituloEvaluado
) {

    console.log(
        "=========================================="
    );

    console.log(
        "EVALUACIÓN APROBADA - PROCESANDO CAPÍTULO"
    );

    console.log(
        "CAPÍTULO RECIBIDO:",
        window.capituloEvaluado
    );

    // Buscar el índice del capítulo por su ID
    const indiceCapituloEvaluado =
        capitulos.findIndex(
            capitulo =>
                Number(capitulo.id) ===
                Number(window.capituloEvaluado)
        );

    console.log(
        "ÍNDICE DEL CAPÍTULO EVALUADO:",
        indiceCapituloEvaluado
    );


    if (indiceCapituloEvaluado !== -1) {

        // ==========================================
        // MARCAR CAPÍTULO COMO COMPLETADO
        // ==========================================

        capitulosCompletados.add(
            indiceCapituloEvaluado
        );

        // Guardar progreso después de aprobar evaluación
await guardarProgreso();

        console.log(
            "CAPÍTULO COMPLETADO:",
            indiceCapituloEvaluado + 1
        );
        


        // ==========================================
        // SI HAY SIGUIENTE CAPÍTULO
        // ==========================================

        if (
            indiceCapituloEvaluado <
            capitulos.length - 1
        ) {

            capituloActual =
                indiceCapituloEvaluado + 1;

            console.log(
                "SIGUIENTE CAPÍTULO:",
                capituloActual + 1
            );

        }

        // ==========================================
        // SI ERA EL ÚLTIMO CAPÍTULO
        // ==========================================

        else {

            capituloActual =
                indiceCapituloEvaluado;

            console.log(
                "ERA EL ÚLTIMO CAPÍTULO"
            );

        }

    }

    // ==========================================
    // LIMPIAR PARÁMETROS DE LA URL
    // ==========================================

    window.history.replaceState(
        {},
        document.title,
        `/capacitacion/${capacitacionId}`
    );

}


// ==========================================
// MOSTRAR CAPÍTULOS
// ==========================================

renderizarCapitulos();


// ==========================================
// ACTUALIZAR ESTADO INICIAL
// ==========================================

actualizarNavegacion();


// ==========================================
// MOSTRAR CAPÍTULO CORRESPONDIENTE
// ==========================================

seleccionarCapitulo(
    capituloActual
);


    }
    catch(error){

        console.error(
            "ERROR CARGANDO CAPACITACIÓN:",
            error
        );

    }

}


// ==============================================
// MOSTRAR CAPÍTULOS
// ==============================================

function renderizarCapitulos(){

    const contenedor =
        document.getElementById(
            "contenedorCapitulos"
        );

    contenedor.innerHTML = "";

    if(!capitulos.length){

        contenedor.innerHTML = `
            <div class="cargando">
                <i class="fas fa-info-circle"></i>
                No hay capítulos disponibles.
            </div>
        `;

        return;
    }


    capitulos.forEach(
        (capitulo, index) => {

            const boton =
                document.createElement("button");

            boton.type = "button";

            boton.className =
                "capitulo-item";


            // ==========================================
            // DETERMINAR SI ESTÁ DISPONIBLE
            // ==========================================

            const esCompletado =
                capitulosCompletados.has(index);

            const esActual =
                index === capituloActual;

            const esSiguiente =
                index === capituloActual + 1 &&
                capitulosCompletados.has(
                    capituloActual
                );

            const disponible =
                index === 0 ||
                esCompletado ||
                esActual ||
                esSiguiente;


            // ==========================================
            // ESTADO VISUAL
            // ==========================================

            if(!disponible){

                boton.disabled = true;

                boton.classList.add(
                    "capitulo-bloqueado"
                );

            }


            if(esCompletado){

                boton.classList.add(
                    "capitulo-completado"
                );

            }


            if(esActual){

                boton.classList.add(
                    "activo"
                );

            }


            // ==========================================
            // CONTENIDO
            // ==========================================

            boton.innerHTML = `

                <span class="numero-capitulo-menu">

                    ${
                        esCompletado
                        ? '<i class="fas fa-check"></i>'
                        : index + 1
                    }

                </span>

                <div>

                    <strong>

                        ${
                            capitulo.nombre ||
                            `Capítulo ${index + 1}`
                        }

                    </strong>

                </div>

                ${
                    !disponible
                    ? `
                        <i class="fas fa-lock ms-auto"></i>
                    `
                    : ""
                }

            `;


            // ==========================================
            // CLICK
            // ==========================================

            if(disponible){

                boton.addEventListener(
                    "click",
                    () => {

                        seleccionarCapitulo(
                            index
                        );

                    }
                );

            }


            contenedor.appendChild(
                boton
            );

        }
    );

}


// ==============================================
// SELECCIONAR CAPÍTULO
// ==============================================

async function seleccionarCapitulo(index){

    if(
        index < 0 ||
        index >= capitulos.length
    ){

        return;

    }

    // ==========================================
    // REINICIAR ESTADO DE LOS VIDEOS
    // ==========================================

    videosCompletados = new Set();
    totalVideosActuales = 0;

    capituloActual = index;

    const capitulo =
        capitulos[index];

    console.log(
        "CAPÍTULO SELECCIONADO:",
        capitulo
    );


    // ==========================================
    // MARCAR CAPÍTULO ACTIVO
    // ==========================================

    const botones =
        document.querySelectorAll(
            ".capitulo-item"
        );

    botones.forEach(
        boton => boton.classList.remove("activo")
    );

    if(botones[index]){

        botones[index].classList.add("activo");

    }


    // ==========================================
    // MOSTRAR INFORMACIÓN DEL CAPÍTULO
    // ==========================================

    document.getElementById(
        "informacionCapitulo"
    ).innerHTML = `

        <div class="encabezado-capitulo">

            <span class="numero-capitulo">

                Capítulo ${index + 1}

            </span>

            <h2>

                ${capitulo.titulo ||
                  capitulo.nombre ||
                  `Capítulo ${index + 1}`}

            </h2>

            <p>

                ${capitulo.descripcion || ""}

            </p>

        </div>

    `;


    // ==========================================
    // LIMPIAR CONTENIDO ANTERIOR
    // ==========================================

    const contenedorContenido =
        document.getElementById(
            "contenedorContenido"
        );

    contenedorContenido.innerHTML = `

        <div class="cargando">

            <i class="fas fa-spinner fa-spin"></i>

            Cargando contenido...

        </div>

    `;


    // ==========================================
    // OCULTAR MATERIAL Y EVALUACIÓN
    // ==========================================

    document
        .getElementById("contenedorMaterial")
        ?.classList.add("d-none");

    document
        .getElementById("contenedorEvaluacion")
        ?.classList.add("d-none");


    // ==========================================
    // OBTENER SUBCAPÍTULOS
    // ==========================================

    try{

        const respuesta =
            await fetch(
                `/api/capitulos/${capitulo.id}/subcapitulos`
            );


        const datos =
            await respuesta.json();


        console.log(
            "SUBCAPÍTULOS:",
            datos
        );


        if(!datos.success){

            contenedorContenido.innerHTML = `

                <div class="estado-vacio">

                    <i class="fas fa-exclamation-circle"></i>

                    <p>
                        No fue posible cargar el contenido.
                    </p>

                </div>

            `;

            return;

        }


        const subcapitulos =
            datos.subcapitulos || [];


        // ==========================================
        // MOSTRAR SUBCAPÍTULOS
        // ==========================================

        renderizarSubcapitulos(
            subcapitulos
        );


    }
    catch(error){

        console.error(
            "ERROR CARGANDO SUBCAPÍTULOS:",
            error
        );


        contenedorContenido.innerHTML = `

            <div class="estado-vacio">

                <i class="fas fa-exclamation-triangle"></i>

                <p>
                    Error cargando el contenido.
                </p>

            </div>

        `;

    }


    // ==========================================
    // NAVEGACIÓN
    // ==========================================

    actualizarNavegacion();

controlarVideo();

setTimeout(async () => {

    inicializarYouTube();

    await cargarVideosVistos();

}, 500);
}

// ==============================================
// MOSTRAR SUBCAPÍTULOS
// ==============================================

function renderizarSubcapitulos(subcapitulos){

    const contenedor =
        document.getElementById(
            "contenedorContenido"
        );


    contenedor.innerHTML = "";


    if(!subcapitulos.length){

        contenedor.innerHTML = `

            <div class="estado-vacio">

                <i class="fas fa-video-slash"></i>

                <h3>
                    Este capítulo no tiene contenido
                </h3>

                <p>
                    Aún no se han agregado subcapítulos.
                </p>

            </div>

        `;

        return;

    }


    subcapitulos.forEach(
        (subcapitulo, index) => {


            const bloque =
                document.createElement("article");


            bloque.className =
    "subcapitulo";

bloque.dataset.subcapituloId =
    subcapitulo.id;


            const numero =
                subcapitulo.numero_subcapitulo ||
                index + 1;


            bloque.innerHTML = `

    <div class="subcapitulo-header">

        <div>

            <span class="subcapitulo-numero">

                ${numero}

            </span>

            <div>

                <h3>

                    ${subcapitulo.titulo ||
                      `Subcapítulo ${numero}`}

                </h3>

                ${
                    subcapitulo.descripcion
                    ?

                    `<p>
                        ${subcapitulo.descripcion}
                    </p>`

                    :

                    ""
                }

            </div>

        </div>

        <!-- ESTADO DEL VIDEO -->
        <span
            class="estado-video estado-video-pendiente"
            data-estado-video="${subcapitulo.id}"
        >
            <i class="fas fa-circle"></i>
            Pendiente
        </span>

    </div>


    <div class="video-contenedor">

        ${crearVideo(
            subcapitulo
        )}

    </div>

`;


            contenedor.appendChild(
                bloque
            );

        }
    );

}

// ==========================================================
// ACTUALIZAR ESTADO VISUAL DEL VIDEO
// ==========================================================

function actualizarEstadoVisualVideo(
    subcapituloId,
    visto
) {

    const estado =
        document.querySelector(
            `[data-estado-video="${subcapituloId}"]`
        );

    if (!estado) {
        return;
    }

    if (visto) {

        estado.classList.remove(
            "estado-video-pendiente"
        );

        estado.classList.add(
            "estado-video-completado"
        );

        estado.innerHTML = `
            <i class="fas fa-circle-check"></i>
            Visto
        `;

    } else {

        estado.classList.remove(
            "estado-video-completado"
        );

        estado.classList.add(
            "estado-video-pendiente"
        );

        estado.innerHTML = `
            <i class="fas fa-circle"></i>
            Pendiente
        `;

    }

}

// ==============================================
// CREAR VIDEO
// ==============================================

function crearVideo(subcapitulo){

    const url =
        subcapitulo.url_video || "";


    if(!url){

        return `

            <div class="video-sin-contenido">

                <i class="fas fa-video-slash"></i>

                <p>
                    Este subcapítulo no tiene video.
                </p>

            </div>

        `;

    }


    // ==========================================
    // YOUTUBE
    // ==========================================

    if(
        subcapitulo.tipo_video === "youtube"
    ){

        let videoUrl = url;


        // Convertir URL normal de YouTube
        // a URL embebida

        if(videoUrl.includes("watch?v=")){

            const videoId =
                videoUrl.split("watch?v=")[1]
                .split("&")[0];

            videoUrl =
                `https://www.youtube.com/embed/${videoId}`;

        }


        if(videoUrl.includes("youtu.be/")){

            const videoId =
                videoUrl.split("youtu.be/")[1]
                .split("?")[0];

            videoUrl =
                `https://www.youtube.com/embed/${videoId}`;

        }


        return `

    <div class="video-wrapper">

        <iframe
            class="youtube-video"
            src="${videoUrl}?enablejsapi=1"
            title="${subcapitulo.titulo || "Video"}"
            frameborder="0"
            allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share
            "
            allowfullscreen>
        </iframe>

    </div>

`;

    }


    // ==========================================
    // VIDEO LOCAL
    // ==========================================

    return `

        <div class="video-wrapper">

            <video

                controls

                preload="metadata"

                src="${url}"

            >

                Tu navegador no soporta
                la reproducción de video.

            </video>

        </div>

    `;

}


// ==============================================
// NAVEGACIÓN
// ==============================================

function actualizarNavegacion(){

    const btnAnterior =
        document.getElementById("btnAnterior");

    const btnSiguiente =
        document.getElementById("btnSiguiente");

    // ==========================================
    // BOTÓN ANTERIOR
    // ==========================================

    btnAnterior.disabled =
        capituloActual === 0;


    // ==========================================
    // BOTÓN SIGUIENTE
    // ==========================================

    // Por defecto queda bloqueado
    btnSiguiente.disabled = true;


    // Cambiar texto dependiendo del capítulo
    if(
        capituloActual === capitulos.length - 1
    ){

        btnSiguiente.innerHTML = `
            Finalizar capacitación
            <i class="fas fa-check"></i>
        `;

    }else{

        btnSiguiente.innerHTML = `
            Siguiente
            <i class="fas fa-arrow-right"></i>
        `;

    }

}

// ==============================================
// HABILITAR SIGUIENTE
// ==============================================

async function habilitarSiguiente() {

    const btnSiguiente =
        document.getElementById("btnSiguiente");


    if (!btnSiguiente) {
        return;
    }


    // ==========================================
    // COMPROBAR QUE TODOS LOS VIDEOS TERMINARON
    // ==========================================

    if (
        videosCompletados.size <
        totalVideosActuales
    ) {

        console.log(
            "Aún faltan videos por terminar:",
            totalVideosActuales -
            videosCompletados.size
        );

        return;
    }


    // ==========================================
    // BUSCAR SI EL CAPÍTULO TIENE EVALUACIÓN
    // ==========================================

    try {

        const respuesta =
    await fetch(
        `/api/cursos/${cursoId}/evaluaciones`
    );


        const datos =
            await respuesta.json();


        if (
            !respuesta.ok ||
            !datos.success
        ) {

            console.error(
                "No se pudieron consultar las evaluaciones."
            );

            return;
        }


        // ==========================================
        // BUSCAR EVALUACIÓN DEL CAPÍTULO ACTUAL
        // ==========================================

        const capitulo =
            capitulos[capituloActual];


        const evaluacion =
            (datos.evaluaciones || []).find(

                evaluacion =>

                    Number(
                        evaluacion.capitulo_id
                    ) ===
                    Number(
                        capitulo.id
                    )

            );


        console.log(
            "EVALUACIÓN DEL CAPÍTULO:",
            evaluacion
        );


        // ==================================================
        // SI EL CAPÍTULO TIENE EVALUACIÓN
        // ==================================================

        if (evaluacion) {

            console.log(
                "EVALUACIÓN ENCONTRADA:",
                evaluacion.id
            );


            // ==================================================
            // COMPROBAR SI YA FUE APROBADA
            // ==================================================

            const respuestaAprobada =
                await fetch(
                    `/api/evaluaciones-capacitacion/${evaluacion.id}/aprobada`
                );


            const datosAprobada =
                await respuestaAprobada.json();


            console.log(
                "ESTADO EVALUACIÓN:",
                datosAprobada
            );


            // ==================================================
            // SI YA ESTÁ APROBADA
            // ==================================================

            if (
                respuestaAprobada.ok &&
                datosAprobada.success &&
                datosAprobada.aprobada === true
            ) {

                console.log(
                    "EVALUACIÓN YA APROBADA. NO SE VOLVERÁ A PRESENTAR."
                );


                // ==========================================
                // MARCAR CAPÍTULO COMO COMPLETADO
                // ==========================================

                capitulosCompletados.add(
                    capituloActual
                );


                // ==========================================
                // ACTUALIZAR PROGRESO VISUAL
                // ==========================================

                actualizarProgreso();


                // ==========================================
                // GUARDAR PROGRESO EN BD
                // ==========================================

                await guardarProgreso();


                // ==========================================
                // CONFIGURAR BOTÓN
                // ==========================================

                btnSiguiente.style.display = "";

                btnSiguiente.disabled = false;

                btnSiguiente.dataset.tieneEvaluacion =
                    "false";

                btnSiguiente.dataset.evaluacionId =
                    "";


                // ==========================================
                // SI ES EL ÚLTIMO CAPÍTULO
                // ==========================================

                if (
                    capituloActual ===
                    capitulos.length - 1
                ) {

                    btnSiguiente.innerHTML = `

                        Finalizar capacitación

                        <i class="fas fa-check"></i>

                    `;

                }

                // ==========================================
                // SI HAY OTRO CAPÍTULO
                // ==========================================

                else {

                    btnSiguiente.innerHTML = `

                        Siguiente

                        <i class="fas fa-arrow-right"></i>

                    `;

                }


                // ==========================================
                // ACTUALIZAR MENÚ
                // ==========================================

                renderizarCapitulos();


                console.log(
                    "CAPÍTULO COMPLETADO POR EVALUACIÓN APROBADA:",
                    capituloActual + 1
                );


                return;
            }


            // ==================================================
            // SI NO ESTÁ APROBADA
            // ==================================================

            btnSiguiente.disabled = false;

            btnSiguiente.style.display = "none";


            btnSiguiente.dataset.tieneEvaluacion =
                "true";


            btnSiguiente.dataset.evaluacionId =
                evaluacion.id;


            console.log(
                "CAPÍTULO REQUIERE EVALUACIÓN:",
                evaluacion.id
            );


            // ==========================================
            // MOSTRAR ALERTA
            // ==========================================

            await mostrarAlertaCapacitacion({

                icon: "success",

                titulo:
                    "¡Capítulo completado!",

                mensaje:
                    "Has terminado todos los videos " +
                    "de este capítulo. Ahora debes " +
                    "presentar la evaluación para " +
                    "continuar con la capacitación.",

                textoBoton:
                    "Presentar evaluación",

                confirmButtonColor:
                    "#16a34a"

            });


            // ==========================================
            // ABRIR EVALUACIÓN
            // ==========================================

            window.location.href =
    `/evaluacion-capacitacion` +
    `?evaluacion=${evaluacion.id}` +
    `&curso=${cursoId}` +
    `&capitulo=${capitulo.id}` +
    `&capacitacion=${capacitacionId}`;


            return;
        }


        // ==================================================
        // SI NO TIENE EVALUACIÓN
        // ==================================================

        completarCapituloSinEvaluacion();


    }
    catch (error) {

        console.error(
            "ERROR CONSULTANDO EVALUACIÓN:",
            error
        );

    }

}


// ==============================================
// COMPLETAR CAPÍTULO SIN EVALUACIÓN
// ==============================================

function completarCapituloSinEvaluacion(){

    const btnSiguiente =
        document.getElementById("btnSiguiente");


        if(btnSiguiente){

    btnSiguiente.style.display = "";

}


    // ==========================================
    // MARCAR CAPÍTULO COMO COMPLETADO
    // ==========================================

    capitulosCompletados.add(
        capituloActual
    );


    // ==========================================
    // ACTUALIZAR PROGRESO
    // ==========================================

    actualizarProgreso();

    // ==========================================
// GUARDAR PROGRESO EN BASE DE DATOS
// ==========================================

guardarProgreso();


    // ==========================================
    // HABILITAR SIGUIENTE
    // ==========================================

    if(btnSiguiente){

        btnSiguiente.disabled = false;

        btnSiguiente.dataset.tieneEvaluacion =
            "false";

        if(
            capituloActual ===
            capitulos.length - 1
        ){

            btnSiguiente.innerHTML = `

                Finalizar capacitación

                <i class="fas fa-check"></i>

            `;

        }
        else{

            btnSiguiente.innerHTML = `

                Siguiente

                <i class="fas fa-arrow-right"></i>

            `;

        }

    }


    // ==========================================
    // ACTUALIZAR MENÚ
    // ==========================================

    renderizarCapitulos();


    console.log(
        "CAPÍTULO COMPLETADO:",
        capituloActual + 1
    );

}


// ==========================================================
// CARGAR VIDEOS VISTOS DESDE LA BASE DE DATOS
// ==========================================================

async function cargarVideosVistos() {

    try {

        const respuesta =
    await fetch(
        `/api/cursos/${cursoId}/progreso-videos`
    );


        const datos =
            await respuesta.json();


        console.log(
            "VIDEOS VISTOS EN BD:",
            datos
        );


        if (
            !respuesta.ok ||
            !datos.success
        ) {

            console.error(
                "No se pudieron cargar los videos vistos."
            );

            return;

        }


        // ==============================================
        // REINICIAR ESTADO
        // ==============================================

        videosCompletados =
            new Set();


        // ==============================================
        // OBTENER VIDEOS DEL CAPÍTULO ACTUAL
        // ==============================================

        const bloques =
            document.querySelectorAll(
                ".subcapitulo"
            );


        bloques.forEach(
            (bloque, index) => {

                const subcapituloId =
                    Number(
                        bloque.dataset.subcapituloId
                    );


                const estaVisto =
                    datos.videos.some(
                        video =>
                            Number(
                                video.sub_capitulo_id
                            ) ===
                            subcapituloId
                    );

                    actualizarEstadoVisualVideo(
    subcapituloId,
    estaVisto
);


                if (estaVisto) {

                    // El identificador depende del tipo
                    // de reproductor que tenga el bloque.

                    const video =
                        bloque.querySelector(
                            "video"
                        );

                    const youtube =
                        bloque.querySelector(
                            ".youtube-video"
                        );


                    if (video) {

                        videosCompletados.add(
                            `local-${index}`
                        );

                    }


                    if (youtube) {

                        videosCompletados.add(
                            `youtube-${index}`
                        );

                    }

                }

            }
        );


        console.log(
            "VIDEOS COMPLETADOS RECUPERADOS:",
            [...videosCompletados]
        );


        // ==============================================
        // ACTUALIZAR SIGUIENTE
        // ==============================================

        await habilitarSiguiente();


    } catch(error) {

        console.error(
            "ERROR CARGANDO VIDEOS VISTOS:",
            error
        );

    }

}

// ==============================================
// CONTROLAR VIDEOS DEL CAPÍTULO
// ==============================================

function controlarVideo(){

    const contenedor =
        document.getElementById(
            "contenedorContenido"
        );

    if(!contenedor){
        return;
    }

    // ==========================================
    // BUSCAR VIDEOS LOCALES
    // ==========================================

    const videos =
        contenedor.querySelectorAll("video");


    // ==========================================
    // BUSCAR VIDEOS DE YOUTUBE
    // ==========================================

    const iframes =
        contenedor.querySelectorAll(
            ".youtube-video"
        );


    // ==========================================
    // TOTAL DE VIDEOS
    // ==========================================

    totalVideosActuales =
        videos.length +
        iframes.length;


    console.log(
        "TOTAL VIDEOS DEL CAPÍTULO:",
        totalVideosActuales
    );


    // ==========================================
    // SI NO HAY VIDEOS
    // ==========================================

    if(totalVideosActuales === 0){

        habilitarSiguiente();

        return;
    }


    // ==========================================
    // VIDEOS LOCALES
    // ==========================================

    videos.forEach(
    (video, index) => {

        video.addEventListener(
            "ended",
            async () => {

                console.log(
                    "VIDEO LOCAL TERMINADO:",
                    index + 1
                );


                videosCompletados.add(
                    `local-${index}`
                );


                // ==========================================
                // OBTENER SUBCAPÍTULO
                // ==========================================

                const bloque =
                    video.closest(
                        ".subcapitulo"
                    );


                const subcapituloId =
                    bloque?.dataset.subcapituloId;


                // ==========================================
                // GUARDAR EN BASE DE DATOS
                // ==========================================

                await marcarVideoVisto(
                    subcapituloId
                );

                actualizarEstadoVisualVideo(
    subcapituloId,
    true
);


                // ==========================================
                // COMPROBAR SI YA TERMINÓ TODOS
                // ==========================================

                await habilitarSiguiente();

            }
        );

    }
);


    // ==========================================
    // YOUTUBE
    // ==========================================

    // Los videos de YouTube se controlan
    // mediante inicializarYouTube()

}

// ==============================================
// INICIALIZAR YOUTUBE
// ==============================================

function inicializarYouTube(){

    const iframes =
        document.querySelectorAll(
            ".youtube-video"
        );

    if(!iframes.length){

        return;

    }


    // Limpiar reproductores anteriores
    reproductoresYouTube = [];


    if(
        typeof YT === "undefined" ||
        !YT.Player
    ){

        console.warn(
            "YouTube API todavía no está disponible."
        );

        return;

    }


    iframes.forEach(
        (iframe, index) => {

            const reproductor =
                new YT.Player(
                    iframe,
                    {

                        events: {

                            onStateChange:
                                async function(event){

if(
    event.data ===
    YT.PlayerState.ENDED
){

    console.log(
        "YOUTUBE TERMINADO:",
        index + 1
    );


    videosCompletados.add(
        `youtube-${index}`
    );


    // ==========================================
    // OBTENER SUBCAPÍTULO
    // ==========================================

    const iframe =
        iframes[index];


    const bloque =
        iframe?.closest(
            ".subcapitulo"
        );


    const subcapituloId =
        bloque?.dataset.subcapituloId;


    // ==========================================
    // GUARDAR EN BASE DE DATOS
    // ==========================================

    await marcarVideoVisto(
        subcapituloId
    );

    actualizarEstadoVisualVideo(
    subcapituloId,
    true
);


    // ==========================================
    // COMPROBAR PROGRESO
    // ==========================================

    await habilitarSiguiente();

}
                                }

                        }

                    }
                );

            reproductoresYouTube.push(
                reproductor
            );

        }
    );

}

// ==========================================================
// MARCAR SUBCAPÍTULO COMO VISTO EN BASE DE DATOS
// ==========================================================

async function marcarVideoVisto(subcapituloId) {

    try {

        if (!subcapituloId) {

            console.warn(
                "No se recibió el ID del subcapítulo."
            );

            return false;
        }

        console.log(
            "=========================================="
        );

        console.log(
            "GUARDANDO VIDEO VISTO"
        );

        console.log(
            "CAPACITACIÓN ID:",
            capacitacionId
        );

        console.log(
            "SUBCAPÍTULO ID:",
            subcapituloId
        );

        console.log(
    "URL:",
    `/api/cursos/${cursoId}/progreso-videos`
);

        console.log(
            "=========================================="
        );


        const respuesta =
    await fetch(
        `/api/cursos/${cursoId}/progreso-videos`,
        {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        sub_capitulo_id:
                            subcapituloId

                    })

                }
            );


        const datos =
            await respuesta.json();


        console.log(
            "RESPUESTA VIDEO:",
            respuesta.status,
            datos
        );


        if (!respuesta.ok || !datos.success) {

            console.error(
                "No se pudo guardar el video como visto."
            );

            return false;

        }


        console.log(
            "VIDEO GUARDADO CORRECTAMENTE"
        );

        return true;


    } catch(error) {

        console.error(
            "ERROR GUARDANDO VIDEO VISTO:",
            error
        );

        return false;

    }

}

// ==============================================
// PROGRESO REAL
// ==============================================

function actualizarProgreso(){

    if(!capitulos.length){

        return;

    }


    const completados =
        capitulosCompletados.size;


    const porcentaje =
        Math.round(
            (
                completados /
                capitulos.length
            ) * 100
        );


    const porcentajeElemento =
        document.getElementById(
            "porcentajeProgreso"
        );


    const barra =
        document.getElementById(
            "barraProgreso"
        );


    if(porcentajeElemento){

        porcentajeElemento.textContent =
            `${porcentaje}%`;

    }


    if(barra){

        barra.style.width =
            `${porcentaje}%`;

    }


    console.log(
        "PROGRESO:",
        porcentaje + "%"
    );

}

// ==============================================
// GUARDAR PROGRESO EN BASE DE DATOS
// ==============================================

async function guardarProgreso(){

    try {

        const respuesta =
    await fetch(
        `/api/cursos/${cursoId}/progreso`,
        {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        capitulos_completados:
                            capitulosCompletados.size,

                        ultimo_capitulo:
                            capitulos[capituloActual]?.id || null

                    })
                }
            );


        const datos =
            await respuesta.json();


        console.log(
            "PROGRESO GUARDADO EN BD:",
            datos
        );


        if(!datos.success){

            console.error(
                "No se pudo guardar el progreso."
            );

        }

    } catch(error) {

        console.error(
            "ERROR GUARDANDO PROGRESO:",
            error
        );

    }

}

// ==============================================
// VOLVER A MIS CAPACITACIONES
// ==============================================

function volverMisCapacitaciones() {

    window.location.href = "/mis-capacitaciones";

}

// ==========================================================
// FINALIZAR CAPACITACIÓN Y GENERAR CERTIFICADO
// ==========================================================

async function finalizarCapacitacion() {

    try {

        // ======================================================
        // CONFIRMACIÓN
        // ======================================================

        const confirmacion =
            await mostrarAlertaCapacitacion({

                icon: "question",

                titulo:
                    "¿Finalizar capacitación?",

                mensaje:
                    "Has completado todos los capítulos. ¿Deseas finalizar la capacitación y generar tu certificado?",

                textoBoton:
                    "Sí, finalizar",

                confirmButtonColor:
                    "#16a34a"

            });


        if (
            !confirmacion.isConfirmed
        ) {

            return;

        }


        // ======================================================
        // MOSTRAR CARGANDO
        // ======================================================

        Swal.fire({

            title:
                "Generando certificado...",

            text:
                "Estamos registrando la finalización de tu capacitación.",

            allowOutsideClick:
                false,

            allowEscapeKey:
                false,

            didOpen: () => {

                Swal.showLoading();

            }

        });


        // ======================================================
        // GENERAR CERTIFICADO
        // ======================================================

        const respuesta =
    await fetch(
        `/api/capacitaciones/${cursoId}/generar-certificado`,
        {
            method:
                "POST",
            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );


        const datos =
            await respuesta.json();


        console.log(
            "RESPUESTA GENERAR CERTIFICADO:",
            datos
        );


        // ======================================================
        // ERROR
        // ======================================================

        if (
            !respuesta.ok ||
            !datos.success
        ) {

            Swal.close();

            await mostrarAlertaCapacitacion({

                icon:
                    "error",

                titulo:
                    "No fue posible finalizar",

                mensaje:
                    datos.mensaje ||
                    "No fue posible generar el certificado.",

                textoBoton:
                    "Entendido",

                confirmButtonColor:
                    "#dc2626"

            });

            return;

        }


        // ======================================================
        // GUARDAR DATOS DEL CERTIFICADO
        // ======================================================

        sessionStorage.setItem(

            "certificadoCapacitacion",

            JSON.stringify(
                datos.certificado
            )

        );


        // ======================================================
        // CERTIFICADO GENERADO
        // ======================================================

        await Swal.fire({

            icon:
                "success",

            title:
                "¡Capacitación completada!",

            html:
                `
                <p>
                    Has completado correctamente la capacitación.
                </p>

                <p>
                    <strong>
                        Tu certificado ha sido generado.
                    </strong>
                </p>

                <p>
                    Código:
                    <strong>
                        ${datos.certificado?.codigo || ""}
                    </strong>
                </p>
                `,

            confirmButtonText:
                "Continuar",

            confirmButtonColor:
                "#16a34a",

            allowOutsideClick:
                false,

            allowEscapeKey:
                false,

            customClass: {

                popup:
                    "swal-capacitacion",

                title:
                    "swal-capacitacion-titulo",

                htmlContainer:
                    "swal-capacitacion-mensaje",

                confirmButton:
                    "swal-capacitacion-boton"

            }

        });


        // ======================================================
        // POR AHORA VOLVER A MIS CAPACITACIONES
        // ======================================================

        window.location.href =
            "/mis-capacitaciones";


    }

    catch(error) {

        console.error(
            "ERROR FINALIZANDO CAPACITACIÓN:",
            error
        );


        Swal.close();


        await mostrarAlertaCapacitacion({

            icon:
                "error",

            titulo:
                "Error",

            mensaje:
                "Ocurrió un error al finalizar la capacitación.",

            textoBoton:
                "Entendido",

            confirmButtonColor:
                "#dc2626"

        });

    }

}


// ==============================================
// BOTÓN SIGUIENTE
// ==============================================

document.addEventListener("DOMContentLoaded", () => {

    const btnSiguiente =
        document.getElementById("btnSiguiente");

    const btnAnterior =
        document.getElementById("btnAnterior");


    // ==========================================
    // SIGUIENTE
    // ==========================================

    btnSiguiente?.addEventListener(
    "click",
    async () => {

        // ======================================
        // SI ESTÁ BLOQUEADO
        // ======================================

        if(btnSiguiente.disabled){

            return;

        }


        // ======================================
        // ¿TIENE EVALUACIÓN?
        // ======================================

        const tieneEvaluacion =
            btnSiguiente.dataset.tieneEvaluacion ===
            "true";


        if(tieneEvaluacion){

            const evaluacionId =
                btnSiguiente.dataset.evaluacionId;


            const capitulo =
                capitulos[capituloActual];


            console.log(
                "ABRIENDO EVALUACIÓN:",
                evaluacionId
            );


            // ==================================
            // IR A LA EVALUACIÓN
            // ==================================

            window.location.href =
    `/evaluacion-capacitacion` +
    `?evaluacion=${evaluacionId}` +
    `&curso=${cursoId}` +
    `&capitulo=${capitulo.id}` +
    `&capacitacion=${capacitacionId}`;


            return;

        }


        // ======================================
        // ÚLTIMO CAPÍTULO
        // ======================================

        if(
            capituloActual >=
            capitulos.length - 1
        ){

            console.log(
                "CAPACITACIÓN COMPLETADA"
            );


            finalizarCapacitacion();

            return;

        }


        // ======================================
        // SIGUIENTE CAPÍTULO
        // ======================================

        seleccionarCapitulo(
            capituloActual + 1
        );

    }
);

});

// ==============================================
// SWEETALERT - ALERTA DEL SISTEMA
// ==============================================

function mostrarAlertaCapacitacion({
    icon = "info",
    titulo = "",
    mensaje = "",
    textoBoton = "Continuar",
    confirmButtonColor = "#16a34a"
}) {

    return Swal.fire({

        icon: icon,

        title: titulo,

        text: mensaje,

        confirmButtonText: textoBoton,

        confirmButtonColor: confirmButtonColor,

        allowOutsideClick: false,

        allowEscapeKey: false,

        customClass: {

            popup: "swal-capacitacion",

            title: "swal-capacitacion-titulo",

            htmlContainer: "swal-capacitacion-mensaje",

            confirmButton: "swal-capacitacion-boton"

        }

    });

}