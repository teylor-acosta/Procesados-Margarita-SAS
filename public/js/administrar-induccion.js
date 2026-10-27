let capituloEditando = null;

let subCapituloEditando = null;

let modalCapitulos;

let modalNuevoCapitulo;

let modalSubCapitulos;

let modalNuevoSubCapitulo;

let modalVideo;

let subCapituloVideo = null;

let modalMaterialApoyo;

let modalNuevoMaterial;

let materialEditando = null;

let modalEvaluaciones;

let evaluacionEditando = null;

let capituloEvaluacionSeleccionado = null;

let modalEditorEvaluacion;

let preguntasEditor = [];

let contadorPreguntas = 0;


// ==========================================
// CARGAR CAPÍTULOS
// ==========================================

async function cargarCapitulos(){

    try{

        const respuesta =
            await fetch(
                "/api/capitulos-induccion"
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        renderCapitulos(
            data.capitulos
        );

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// CARGAR SELECT DE CAPÍTULOS
// ==========================================

async function cargarSelectCapitulos(){

    try{

        const respuesta =
            await fetch(
                "/api/capitulos-induccion"
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        const select =
            document.getElementById(
                "capituloSubCapitulo"
            );

        let html = "";

        data.capitulos.forEach(cap=>{

            html += `
                <option value="${cap.id}">
                    Capítulo ${cap.numero_capitulo} - ${cap.titulo}
                </option>
            `;

        });

        select.innerHTML = html;

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// CARGAR SUBCAPÍTULOS
// ==========================================

async function cargarSubCapitulos(){

    try{

        const respuesta =
            await fetch(
                "/api/subcapitulos-induccion"
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        renderSubCapitulos(
            data.subcapitulos
        );

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// MOSTRAR SUBCAPÍTULOS
// ==========================================

function renderSubCapitulos(subcapitulos){

    const lista =
        document.getElementById(
            "listaSubCapitulos"
        );

    let html = "";

    subcapitulos.forEach(sub=>{

        html += `

<div class="card mb-3 shadow-sm">

    <div class="card-body d-flex justify-content-between align-items-center">

        <div>

            <small class="text-success fw-bold">

                ${sub.capitulo}

            </small>

            <h5>

                ${sub.numero_sub_capitulo}. ${sub.titulo}

            </h5>

            <p class="mb-0">

                ${sub.descripcion ?? ""}

            </p>

        </div>

        <div class="d-flex gap-2">

            <button
                class="btn btn-primary"
                onclick="editarSubCapitulo(${sub.id})">

                <i class="fas fa-pen"></i>

            </button>

            <button
                class="btn btn-danger"
                onclick="eliminarSubCapitulo(${sub.id})">

                <i class="fas fa-trash"></i>

            </button>

            <button
                class="btn btn-success"
                onclick="administrarVideos(${sub.id})">

                <i class="fas fa-video"></i>

            </button>

        </div>

    </div>

</div>

        `;

    });

    lista.innerHTML = html;

}


// ==========================================
// EDITAR SUBCAPÍTULO
// ==========================================

async function editarSubCapitulo(id){

    try{

        const respuesta =
            await fetch(
                `/api/subcapitulos-induccion/${id}`
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        const sub =
            data.subcapitulo;

        await cargarSelectCapitulos();

        subCapituloEditando = id;

        document.getElementById(
            "capituloSubCapitulo"
        ).value =
        sub.capitulo_id;

        document.getElementById(
            "numeroSubCapitulo"
        ).value =
        sub.numero_sub_capitulo;

        document.getElementById(
            "ordenSubCapitulo"
        ).value =
        sub.orden;

        document.getElementById(
            "duracionSubCapitulo"
        ).value =
        sub.duracion_minutos;

        document.getElementById(
            "tituloSubCapitulo"
        ).value =
        sub.titulo;

        document.getElementById(
            "descripcionSubCapitulo"
        ).value =
        sub.descripcion;

        document.getElementById(
            "tipoVideo"
        ).value =
        sub.tipo_video;

        cambiarTipoVideo();

        if(sub.tipo_video === "youtube"){

            document.getElementById(
                "urlYoutube"
            ).value =
            sub.url_video;

            document.getElementById(
                "archivoVideo"
            ).value = "";

        }else{

            document.getElementById(
                "urlYoutube"
            ).value = "";

            document.getElementById(
                "archivoVideo"
            ).value = "";

        }

        document.querySelector(
            "#modalNuevoSubCapitulo .modal-title"
        ).innerHTML = `
            <i class="fas fa-pen"></i>
            Editar Subcapítulo
        `;

        modalSubCapitulos.hide();

        modalNuevoSubCapitulo.show();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// ELIMINAR SUBCAPÍTULO
// ==========================================

async function eliminarSubCapitulo(id){

    const resultado = await Swal.fire({

        title:"¿Eliminar subcapítulo?",

        text:"Esta acción desactivará el subcapítulo.",

        icon:"warning",

        showCancelButton:true,

        confirmButtonColor:"#16a34a",

        cancelButtonColor:"#dc2626",

        confirmButtonText:"Sí, eliminar",

        cancelButtonText:"Cancelar"

    });

    if(!resultado.isConfirmed){

        return;

    }

    try{

        const respuesta = await fetch(

            `/api/subcapitulos-induccion/${id}`,

            {

                method:"DELETE"

            }

        );

        const data = await respuesta.json();

        if(data.success){

            await cargarSubCapitulos();

            Swal.fire({

                icon:"success",

                title:"Subcapítulo eliminado",

                text:"El subcapítulo fue eliminado correctamente.",

                timer:1800,

                showConfirmButton:false

            });

        }else{

            Swal.fire({

                icon:"error",

                title:"Error",

                text:"No fue posible eliminar el subcapítulo."

            });

        }

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// CAMBIAR TIPO DE VIDEO
// ==========================================

function cambiarTipoVideo(){

    const tipo =
        document.getElementById(
            "tipoVideo"
        ).value;

    const archivo =
        document.getElementById(
            "contenedorArchivo"
        );

    const youtube =
        document.getElementById(
            "contenedorYoutube"
        );

    if(tipo === "local"){

        archivo.classList.remove(
            "d-none"
        );

        youtube.classList.add(
            "d-none"
        );

    }else{

        archivo.classList.add(
            "d-none"
        );

        youtube.classList.remove(
            "d-none"
        );

    }

}
// ==========================================
// CAMBIAR TIPO DE VIDEO (MODAL VIDEO)
// ==========================================

function cambiarTipoVideoEditar(){

    const tipo =
        document.getElementById(
            "tipoVideoEditar"
        ).value;

    const local =
        document.getElementById(
            "contenedorVideoLocalEditar"
        );

    const youtube =
        document.getElementById(
            "contenedorYoutubeEditar"
        );

    if(tipo === "local"){

        local.classList.remove(
            "d-none"
        );

        youtube.classList.add(
            "d-none"
        );

    }else{

        local.classList.add(
            "d-none"
        );

        youtube.classList.remove(
            "d-none"
        );

    }

}


// ==========================================
// MOSTRAR U OCULTAR SUBCAPÍTULO
// ==========================================

function cambiarTipoAsignacionMaterial(){

    const tipo =
        document.getElementById(
            "tipoAsignacion"
        ).value;

    const contenedor =
        document.getElementById(
            "contenedorSubCapituloMaterial"
        );

    if(tipo === "SUBCAPITULO"){

        contenedor.style.display = "block";

    }else{

        contenedor.style.display = "none";

    }

}

// ==========================================
// ADMINISTRAR VIDEO
// ==========================================

async function administrarVideos(id){

    subCapituloVideo = id;

    try{

        const respuesta =
            await fetch(
                `/api/subcapitulos-induccion/${id}`
            );

        const data =
            await respuesta.json();

        if(!data.success){

            Swal.fire({

                icon:"error",

                title:"No fue posible cargar el video."

            });

            return;

        }

        const sub =
            data.subcapitulo;

        let html = `

<div class="mb-4">

    <label class="form-label">

        Tipo de video

    </label>

    <select
        class="form-select"
        id="tipoVideoEditar"
        onchange="cambiarTipoVideoEditar()"
    >

        <option
            value="local"
            ${sub.tipo_video === "local" ? "selected" : ""}
        >

            Video del servidor

        </option>

        <option
            value="youtube"
            ${sub.tipo_video === "youtube" ? "selected" : ""}
        >

            YouTube

        </option>

    </select>

</div>

<!-- =======================================
VIDEO LOCAL
======================================= -->

<div
    id="contenedorVideoLocalEditar"
    class="${sub.tipo_video === "youtube" ? "d-none" : ""}"
>

    <label class="form-label">

        Vista previa

    </label>

    <video
        id="videoActual"
        controls
        controlsList="nodownload"
    >

        <source
            src="${sub.url_video ?? ""}"
            type="video/mp4"
        >

        Tu navegador no soporta video.

    </video>

    <div class="alert alert-light mt-3">

        <i class="fas fa-file-video text-success"></i>

        <strong>

            Archivo actual:

        </strong>

        ${sub.url_video
            ? sub.url_video.split("/").pop()
            : "Sin archivo"}

    </div>

    <label class="form-label mt-3">

        Reemplazar video

    </label>

    <input
        type="file"
        class="form-control"
        id="nuevoVideo"
        accept="video/*"
    >

</div>

<!-- =======================================
YOUTUBE
======================================= -->

<div
    id="contenedorYoutubeEditar"
    class="${sub.tipo_video === "local" ? "d-none" : ""}"
>

    <label class="form-label">

        Vista previa

    </label>

    <iframe
        id="youtubePreview"
        src="${
            sub.tipo_video === "youtube"
                ? sub.url_video
                    .replace("watch?v=", "embed/")
                    .replace("youtu.be/", "www.youtube.com/embed/")
                : ""
        }"
        allowfullscreen
    ></iframe>

    <label class="form-label mt-3">

        URL de YouTube

    </label>

    <input
        type="text"
        class="form-control"
        id="videoYoutube"
        value="${sub.tipo_video === "youtube" ? sub.url_video : ""}"
    >

</div>

`;
        
        document.getElementById(
    "contenidoVideo"
).innerHTML = html;

// Ocultar el modal de subcapítulos
modalSubCapitulos.hide();

// Esperar un momento y abrir el modal de video
setTimeout(()=>{

    modalVideo.show();

},300);

    }catch(error){

        console.error(error);

    }

}
// ==========================================
// MOSTRAR CAPÍTULOS
// ==========================================

function renderCapitulos(capitulos){

    const lista =
        document.getElementById(
            "listaCapitulos"
        );

    let html = "";

    capitulos.forEach(cap=>{

        html += `

        <div class="card mb-3 shadow-sm">

            <div class="card-body d-flex justify-content-between align-items-center">

                <div>

                    <h5 class="mb-1">

                        Capítulo ${cap.numero_capitulo}

                    </h5>

                    <strong>

                        ${cap.titulo}

                    </strong>

                    <br>

                    <small class="text-muted">

                        ${cap.descripcion ?? ""}

                    </small>

                </div>

                <div class="d-flex gap-2">

                    <button
                        class="btn btn-primary"
                        onclick="editarCapitulo(${cap.id})">

                        <i class="fas fa-pen"></i>

                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="eliminarCapitulo(${cap.id})">

                        <i class="fas fa-trash"></i>

                    </button>

                </div>

            </div>

        </div>

        `;

    });

    lista.innerHTML = html;

}

// ==========================================
// EDITAR
// ==========================================

async function editarCapitulo(id){

    const respuesta =
        await fetch(
            `/api/capitulos-induccion/${id}`
        );

    const data =
        await respuesta.json();

    if(!data.success){

        return;

    }

    const cap =
        data.capitulo;

    capituloEditando = id;

    document.querySelector(
        "#modalNuevoCapitulo .modal-title"
    ).innerHTML =
    `
        <i class="fas fa-pen"></i>
        Editar Capítulo
    `;

    document.getElementById(
        "numeroCapitulo"
    ).value =
    cap.numero_capitulo;

    document.getElementById(
        "ordenCapitulo"
    ).value =
    cap.orden;

    document.getElementById(
        "porcentajeCapitulo"
    ).value =
    cap.porcentaje_aprobacion;

    document.getElementById(
        "tituloCapitulo"
    ).value =
    cap.titulo;

    document.getElementById(
        "descripcionCapitulo"
    ).value =
    cap.descripcion;

    modalCapitulos.hide();

    modalNuevoCapitulo.show();

}

// ==========================================
// ELIMINAR
// ==========================================

async function eliminarCapitulo(id){

    const resultado = await Swal.fire({

        title: "¿Eliminar capítulo?",

        text: "Esta acción desactivará el capítulo.",

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#16a34a",

        cancelButtonColor: "#dc2626",

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar"

    });

    if(!resultado.isConfirmed){

        return;

    }

    try{

        const respuesta = await fetch(

            `/api/capitulos-induccion/${id}`,

            {

                method:"DELETE"

            }

        );

        const data = await respuesta.json();

        if(data.success){

            await cargarCapitulos();

            Swal.fire({

                icon:"success",

                title:"Capítulo eliminado",

                text:"El capítulo fue eliminado correctamente.",

                timer:1800,

                showConfirmButton:false

            });

        }else{

            Swal.fire({

                icon:"error",

                title:"Error",

                text:"No fue posible eliminar el capítulo."

            });

        }

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// INICIO
// ==========================================

document.addEventListener("DOMContentLoaded",()=>{

    modalCapitulos =
        new bootstrap.Modal(
            document.getElementById(
                "modalCapitulos"
            )
        );

    modalNuevoCapitulo =
        new bootstrap.Modal(
            document.getElementById(
                "modalNuevoCapitulo"
            )
        );

        modalSubCapitulos =
    new bootstrap.Modal(
        document.getElementById(
            "modalSubCapitulos"
        )
    );

    modalNuevoSubCapitulo =
    new bootstrap.Modal(
        document.getElementById(
            "modalNuevoSubCapitulo"
        )
    );

    modalVideo =
    new bootstrap.Modal(
        document.getElementById(
            "modalVideo"
        )
    );

    modalMaterialApoyo =
    new bootstrap.Modal(
        document.getElementById(
            "modalMaterialApoyo"
        )
    );

    modalNuevoMaterial =
    new bootstrap.Modal(
        document.getElementById(
            "modalNuevoMaterial"
        )
    );

    modalEvaluaciones =
new bootstrap.Modal(
    document.getElementById(
        "modalEvaluaciones"
    )
);


modalEditorEvaluacion =
new bootstrap.Modal(
    document.getElementById(
        "modalEditorEvaluacion"
    )
);

    document
    .getElementById(
        "tipoVideo"
    )
    .addEventListener(
        "change",
        cambiarTipoVideo
    );

cambiarTipoVideo();


document
    .getElementById(
        "capituloMaterial"
    )
    .addEventListener(
        "change",
        cargarSubCapitulosMaterial
    );

    document
    .getElementById(
        "btnAgregarPregunta"
    )
    .addEventListener(
        "click",
        agregarPreguntaEditor
    );

    // ==========================================
    // ABRIR ADMINISTRAR CAPÍTULOS
    // ==========================================

    document
        .getElementById(
            "cardCapitulos"
        )
        .addEventListener(
            "click",
            async()=>{

                await cargarCapitulos();

                modalCapitulos.show();

            }
        );


        document
    .getElementById("btnGuardarEvaluacionCompleta")
    .addEventListener(
        "click",
        guardarEvaluacionCompleta
    );

        // ==========================================
// ABRIR ADMINISTRAR SUBCAPÍTULOS
// ==========================================

document
    .getElementById(
        "cardSubCapitulos"
    )
    .addEventListener(
        "click",
        async()=>{

            await cargarSubCapitulos();

            modalSubCapitulos.show();

        }
    );

    // ==========================================
// NUEVA EVALUACIÓN
// ==========================================

document
    .getElementById("btnNuevaEvaluacion")
    .addEventListener("click", async () => {

        evaluacionEditando = null;

        preguntasEditor = [];

        contadorPreguntas = 0;

        document.getElementById("editorNombre").value = "";

        document.getElementById("editorDescripcion").value = "";

        document.getElementById("editorPorcentaje").value = 70;

        document.getElementById("contenedorPreguntas").innerHTML = "";

        await cargarSelectEvaluacionesEditor();

        agregarPreguntaEditor();

        modalEvaluaciones.hide();

        modalEditorEvaluacion.show();

    });

    // ==========================================
// ABRIR MATERIAL DE APOYO
// ==========================================

document
    .getElementById(
        "cardMaterialApoyo"
    )
    .addEventListener(
        "click",
        async()=>{

            await cargarMateriales();

            modalMaterialApoyo.show();

        }
    );

    // ==========================================
// ABRIR EVALUACIONES
// ==========================================

document
    .getElementById(
        "cardEvaluaciones"
    )
    .addEventListener(
        "click",
        async()=>{

            await cargarEvaluaciones();

            modalEvaluaciones.show();

        }
    );


    // ==========================================
// CAMBIAR TIPO DE ASIGNACIÓN
// ==========================================

document
    .getElementById(
        "tipoAsignacion"
    )
    .addEventListener(
        "change",
        cambiarTipoAsignacionMaterial
    );

cambiarTipoAsignacionMaterial();

    // ==========================================
// NUEVO MATERIAL
// ==========================================

document
    .getElementById(
        "btnNuevoMaterial"
    )
    .addEventListener(
    "click",
    async ()=>{

            document.getElementById(
                "tituloMaterial"
            ).value = "";

            document.getElementById(
                "descripcionMaterial"
            ).value = "";

             await cargarCapitulosMaterial();

await cargarSubCapitulosMaterial();

modalMaterialApoyo.hide();

modalNuevoMaterial.show();

        }
    );

    // ==========================================
// GUARDAR MATERIAL
// ==========================================

document
    .getElementById(
        "btnGuardarMaterial"
    )
    .addEventListener(
        "click",
        guardarMaterialApoyo
    );

    // ==========================================
// NUEVO SUBCAPÍTULO
// ==========================================

document
    .getElementById(
        "btnNuevoSubCapitulo"
    )
    .addEventListener(
        "click",
        async()=>{

            await cargarSelectCapitulos();

            subCapituloEditando = null;

            document.querySelector(
                "#modalNuevoSubCapitulo .modal-title"
            ).innerHTML = `
                <i class="fas fa-layer-group"></i>
                Nuevo Subcapítulo
            `;

            document.getElementById(
                "numeroSubCapitulo"
            ).value = "";

            document.getElementById(
                "ordenSubCapitulo"
            ).value = "";

            document.getElementById(
                "tituloSubCapitulo"
            ).value = "";

            document.getElementById(
                "descripcionSubCapitulo"
            ).value = "";


            document.getElementById(
    "duracionSubCapitulo"
).value = "";

document.getElementById(
    "tipoVideo"
).value = "local";

document.getElementById(
    "archivoVideo"
).value = "";

document.getElementById(
    "urlYoutube"
).value = "";

cambiarTipoVideo();

            modalSubCapitulos.hide();

            modalNuevoSubCapitulo.show();

        }
    );

    // ==========================================
    // NUEVO CAPÍTULO
    // ==========================================

    document
        .getElementById(
            "btnNuevoCapitulo"
        )
        .addEventListener(
            "click",
            ()=>{

                capituloEditando = null;

                document.querySelector(
                    "#modalNuevoCapitulo .modal-title"
                ).innerHTML = `
                    <i class="fas fa-book"></i>
                    Nuevo Capítulo
                `;

                document.getElementById(
                    "numeroCapitulo"
                ).value="";

                document.getElementById(
                    "ordenCapitulo"
                ).value="";

                document.getElementById(
                    "porcentajeCapitulo"
                ).value=70;

                document.getElementById(
                    "tituloCapitulo"
                ).value="";

                document.getElementById(
                    "descripcionCapitulo"
                ).value="";

                modalCapitulos.hide();

                modalNuevoCapitulo.show();

            }
        );

    // ==========================================
    // VOLVER AL LISTADO
    // ==========================================

    document
        .getElementById(
            "modalNuevoCapitulo"
        )
        .addEventListener(
            "hidden.bs.modal",
            ()=>{

                modalCapitulos.show();

            }
        );

        // ==========================================
// VOLVER A SUBCAPÍTULOS AL CERRAR VIDEO
// ==========================================

document
    .getElementById(
        "modalVideo"
    )
    .addEventListener(
        "hidden.bs.modal",
        ()=>{

            modalSubCapitulos.show();

        }
    );

    // ==========================================
    // GUARDAR
    // ==========================================

    document
        .getElementById(
            "btnGuardarCapitulo"
        )
        .addEventListener(
            "click",
            async()=>{

                const datos={

                    numeroCapitulo:
                    document.getElementById(
                        "numeroCapitulo"
                    ).value,

                    orden:
                    document.getElementById(
                        "ordenCapitulo"
                    ).value,

                    porcentaje:
                    document.getElementById(
                        "porcentajeCapitulo"
                    ).value,

                    titulo:
                    document.getElementById(
                        "tituloCapitulo"
                    ).value,

                    descripcion:
                    document.getElementById(
                        "descripcionCapitulo"
                    ).value

                };

                let url =
    "/api/capitulos-induccion";

let metodo =
    "POST";

if(capituloEditando){

    url =
        `/api/capitulos-induccion/${capituloEditando}`;

    metodo =
        "PUT";

}

const respuesta =
    await fetch(
        url,
        {

            method:metodo,

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify(
                datos
            )

        }
    );

const data =
    await respuesta.json();

                if(data.success){

    capituloEditando = null;

    modalNuevoCapitulo.hide();

    await cargarCapitulos();

}else{

    alert(
        "No fue posible guardar el capítulo."
    );

}

            }
        );

});

// ==========================================
// GUARDAR SUBCAPÍTULO
// ==========================================

document
    .getElementById(
        "btnGuardarSubCapitulo"
    )
    .addEventListener(
        "click",
        async()=>{

            const formData =
                new FormData();

            formData.append(
                "capitulo_id",
                document.getElementById(
                    "capituloSubCapitulo"
                ).value
            );

            formData.append(
                "numero_sub_capitulo",
                document.getElementById(
                    "numeroSubCapitulo"
                ).value
            );

            formData.append(
                "titulo",
                document.getElementById(
                    "tituloSubCapitulo"
                ).value
            );

            formData.append(
                "descripcion",
                document.getElementById(
                    "descripcionSubCapitulo"
                ).value
            );

            formData.append(
                "duracion_minutos",
                document.getElementById(
                    "duracionSubCapitulo"
                ).value
            );

            formData.append(
                "orden",
                document.getElementById(
                    "ordenSubCapitulo"
                ).value
            );

            formData.append(
                "tipo_video",
                document.getElementById(
                    "tipoVideo"
                ).value
            );

            if(
                document.getElementById(
                    "tipoVideo"
                ).value === "youtube"
            ){

                formData.append(
                    "url_video",
                    document.getElementById(
                        "urlYoutube"
                    ).value
                );

            }else{

                const archivo =
                    document.getElementById(
                        "archivoVideo"
                    ).files[0];

                if(archivo){

                    formData.append(
                        "archivoVideo",
                        archivo
                    );

                }

            }

            let url =
    "/api/subcapitulos-induccion";

let metodo =
    "POST";

if(subCapituloEditando){

    url =
        `/api/subcapitulos-induccion/${subCapituloEditando}`;

    metodo =
        "PUT";

}

const respuesta =
    await fetch(

        url,

        {

            method:metodo,

            body:formData

        }

    );

            const data =
                await respuesta.json();

            if(data.success){

    subCapituloEditando = null;

    Swal.fire({

        icon:"success",

        title:
            metodo === "POST"
            ?
            "Subcapítulo creado correctamente"
            :
            "Subcapítulo actualizado correctamente",

        timer:1800,

        showConfirmButton:false

    });

    modalNuevoSubCapitulo.hide();

    await cargarSubCapitulos();

}else{

                Swal.fire({

                    icon:"error",

                    title:"Error",

                    text:"No fue posible guardar el subcapítulo."

                });

            }

        }

    );

// ==========================================
// CARGAR CAPÍTULOS MATERIAL DE APOYO
// ==========================================

async function cargarCapitulosMaterial(){

    try{

        const respuesta =
            await fetch(
                "/api/capitulos-induccion"
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        const select =
            document.getElementById(
                "capituloMaterial"
            );

        let html = "";

        data.capitulos.forEach(cap=>{

            html += `

                <option value="${cap.id}">

                    Capítulo ${cap.numero_capitulo} - ${cap.titulo}

                </option>

            `;

        });

        select.innerHTML = html;

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// CARGAR SUBCAPÍTULOS DEL CAPÍTULO
// ==========================================

async function cargarSubCapitulosMaterial(){

    try{

        const capituloId =
            document.getElementById(
                "capituloMaterial"
            ).value;

        const respuesta =
            await fetch(
                `/api/subcapitulos-induccion/capitulo/${capituloId}`
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        const select =
            document.getElementById(
                "subCapituloMaterial"
            );

        let html = "";

        data.subcapitulos.forEach(sub=>{

            html += `

                <option value="${sub.id}">

                    ${sub.numero_sub_capitulo}. ${sub.titulo}

                </option>

            `;

        });

        select.innerHTML = html;

        if(select.options.length > 0){

    select.selectedIndex = 0;

}

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// GUARDAR MATERIAL DE APOYO
// ==========================================

async function guardarMaterialApoyo(){

    try{

        const formData = new FormData();

        formData.append(
            "titulo",
            document.getElementById(
                "tituloMaterial"
            ).value
        );

        formData.append(
            "descripcion",
            document.getElementById(
                "descripcionMaterial"
            ).value
        );

        formData.append(
            "tipoAsignacion",
            document.getElementById(
                "tipoAsignacion"
            ).value
        );

        formData.append(
            "capitulo_id",
            document.getElementById(
                "capituloMaterial"
            ).value
        );

        if(

            document.getElementById(
                "tipoAsignacion"
            ).value === "SUBCAPITULO"

        ){

            formData.append(

                "sub_capitulo_id",

                document.getElementById(
                    "subCapituloMaterial"
                ).value

            );

        }

        formData.append(

            "orden",

            document.getElementById(
                "ordenMaterial"
            ).value

        );

        formData.append(

            "obligatorio",

            document.getElementById(
                "materialObligatorio"
            ).checked
            ? 1
            : 0

        );

        const archivo =
            document.getElementById(
                "archivoMaterial"
            ).files[0];

        if(archivo){

            formData.append(
                "archivoMaterial",
                archivo
            );

        }

        const url = materialEditando
    ? `/api/material-apoyo/${materialEditando}`
    : "/api/material-apoyo";

const metodo = materialEditando
    ? "PUT"
    : "POST";

const respuesta = await fetch(url, {

    method: metodo,

    body: formData

});

        const data =
            await respuesta.json();

        if(data.success){

            Swal.fire({

                icon:"success",

                title:"Material registrado",

                text:"El material de apoyo fue registrado correctamente.",

                timer:1800,

                showConfirmButton:false

            });

            materialEditando = null;

// Restaurar título del modal
document.querySelector(
    "#modalNuevoMaterial .modal-title"
).innerHTML = `
<i class="fas fa-upload me-2"></i>
Nuevo Material
`;

// Limpiar formulario
document.getElementById(
    "formMaterialApoyo"
).reset();

// Volver a dejar visible el selector correcto
cambiarTipoAsignacionMaterial();

// Cerrar modal
modalNuevoMaterial.hide();

// Recargar tarjetas
await cargarMateriales();

// Abrir nuevamente el listado
modalMaterialApoyo.show();

        }else{

            Swal.fire({

                icon:"error",

                title:"Error",

                text:data.mensaje

            });

        }

    }catch(error){

        console.error(error);

    }

}


// ==========================================
// CARGAR MATERIALES
// ==========================================

async function cargarMateriales(){

    try{

        const respuesta =
            await fetch(
                "/api/material-apoyo"
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        const contenedor =
            document.getElementById(
                "listaMateriales"
            );

        contenedor.innerHTML = "";

        data.materiales.forEach(material=>{

            contenedor.innerHTML += `

<div class="col-md-6 col-lg-4 mb-4">

    <div class="card shadow border-0 rounded-4 h-100">

        <div class="card-body">

            <div class="d-flex align-items-center mb-3">

                <div class="me-3">

                    <i class="fas fa-file-pdf text-danger fs-2"></i>

                </div>

                <div>

                    <small class="text-success fw-bold">

                        Material de apoyo

                    </small>

                    <h5 class="mb-0">

                        ${material.titulo}

                    </h5>

                </div>

            </div>

            <p class="text-muted small">

                ${material.descripcion || "Sin descripción"}

            </p>

            <hr>

            <div class="small mb-3">

                <div>

                    <strong>Capítulo:</strong>

                    ${material.capitulo || "-"}

                </div>

                <div>

                    <strong>Subcapítulo:</strong>

                    ${material.subcapitulo || "-"}

                </div>

                <div class="mt-2">

                    ${
                        material.obligatorio
                        ? '<span class="badge bg-danger">Obligatorio</span>'
                        : '<span class="badge bg-secondary">Opcional</span>'
                    }

                </div>

            </div>

            <div class="d-flex justify-content-between">

                <a
                    href="${material.ruta_archivo}"
                    target="_blank"
                    class="btn btn-primary">

                    <i class="fas fa-download"></i>

                </a>

                <button
    class="btn btn-warning"
    onclick="editarMaterial(${material.id})">

    <i class="fas fa-edit"></i>

</button>

                <button
                    class="btn btn-danger">

                    <i class="fas fa-trash"></i>

                </button>

            </div>

        </div>

    </div>

</div>

`;

        });

    }catch(error){

        console.error(error);

    }

}

async function editarMaterial(id){

    try{

        const respuesta =
            await fetch(`/api/material-apoyo/${id}`);

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        const material =
            data.material;

        materialEditando = id;

        document.getElementById(
            "tituloMaterial"
        ).value =
        material.titulo;

        document.getElementById(
            "descripcionMaterial"
        ).value =
        material.descripcion || "";

        document.getElementById(
            "tipoAsignacion"
        ).value =
        material.tipo_asignacion;

        cambiarTipoAsignacionMaterial();

        await cargarCapitulosMaterial();

        document.getElementById(
            "capituloMaterial"
        ).value =
        material.capitulo_id;

        await cargarSubCapitulosMaterial();

        document.getElementById(
            "subCapituloMaterial"
        ).value =
        material.sub_capitulo_id || "";

        document.getElementById(
            "ordenMaterial"
        ).value =
        material.orden;

        document.getElementById(
            "materialObligatorio"
        ).checked =
        material.obligatorio == 1;

        document.querySelector(
            "#modalNuevoMaterial .modal-title"
        ).innerHTML = `
            <i class="fas fa-pen"></i>
            Editar Material
        `;

        modalMaterialApoyo.hide();

        modalNuevoMaterial.show();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// CARGAR EVALUACIONES
// ==========================================

async function cargarEvaluaciones(){

    try{

        const respuesta =
            await fetch(
                "/api/evaluaciones-induccion"
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return;

        }

        renderEvaluaciones(
            data.evaluaciones
        );

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// MOSTRAR EVALUACIONES
// ==========================================

function renderEvaluaciones(evaluaciones){

    const lista =
        document.getElementById(
            "listaEvaluaciones"
        );

    let html = "";

    evaluaciones.forEach(e=>{

        html += `

<tr>

    <td>

        ${e.capitulo}

    </td>

    <td>

        ${
            e.nombre
            ??
            '<span class="text-muted">Sin evaluación</span>'
        }

    </td>

    <td>

        ${
            e.porcentaje_aprobacion
            ??
            "-"
        }%

    </td>

    <td>

        ${e.preguntas}

    </td>

    <td>

        ${
            e.estado
            ??
            '<span class="badge bg-secondary">Sin crear</span>'
        }

    </td>

    <td class="text-center">

        ${
            e.id

            ?

            `<button
                class="btn btn-primary btn-sm"
                onclick="editarEvaluacion(${e.id})">

                <i class="fas fa-pen"></i>

            </button>
            
            <button
            class="btn btn-danger btn-sm ms-1"
            onclick="eliminarEvaluacion(${e.id})">

            <i class="fas fa-trash"></i>

        </button>`

            :

            `<button
                class="btn btn-success btn-sm"
                onclick="crearEvaluacion(${e.capitulo_id})">

                <i class="fas fa-plus"></i>

            </button>`

        }

    </td>

</tr>

`;

    });

    lista.innerHTML = html;

}


function crearEvaluacion(capituloId){

    document
        .getElementById("btnNuevaEvaluacion")
        .click();

    setTimeout(()=>{

        document.getElementById("editorCapitulo").value = capituloId;

    },100);

}

async function editarEvaluacion(id){

    try{

        evaluacionEditando = id;

        const respuesta =
            await fetch(
                `/api/evaluaciones-induccion/${id}`
            );

        const data =
            await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Error",

                text:"No fue posible cargar la evaluación."

            });

        }

        const evaluacion =
            data.evaluacion;

        document.getElementById(
            "editorNombre"
        ).value =
        evaluacion.nombre;

        document.getElementById(
            "editorDescripcion"
        ).value =
        evaluacion.descripcion || "";

        document.getElementById(
            "editorPorcentaje"
        ).value =
        evaluacion.porcentaje_aprobacion;

        await cargarSelectEvaluacionesEditor();

        document.getElementById(
            "editorCapitulo"
        ).value =
        evaluacion.capitulo_id;

        contadorPreguntas = 0;

        preguntasEditor = [];

        document.getElementById(
            "contenedorPreguntas"
        ).innerHTML = "";

        data.preguntas.forEach(pregunta=>{

            agregarPreguntaEditor(pregunta);

        });

        modalEvaluaciones.hide();

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById(
                    "modalEditorEvaluacion"
                )
            )
            .show();

    }catch(error){

        console.error(error);

        Swal.fire({

            icon:"error",

            title:"Error",

            text:error.message

        });

    }

}

async function eliminarEvaluacion(id){

    const resultado = await Swal.fire({

        title:"¿Eliminar evaluación?",

        text:"Se eliminará la evaluación junto con todas sus preguntas.",

        icon:"warning",

        showCancelButton:true,

        confirmButtonText:"Sí, eliminar",

        cancelButtonText:"Cancelar",

        confirmButtonColor:"#16a34a",

        cancelButtonColor:"#dc2626"

    });

    if(!resultado.isConfirmed){

        return;

    }

    try{

        const respuesta = await fetch(

            `/api/evaluaciones-induccion/${id}`,

            {

                method:"DELETE"

            }

        );

        const data = await respuesta.json();

        if(data.success){

            await Swal.fire({

                icon:"success",

                title:"Evaluación eliminada",

                timer:1500,

                showConfirmButton:false

            });

            await cargarEvaluaciones();

        }else{

            Swal.fire({

                icon:"error",

                title:"Error",

                text:data.mensaje

            });

        }

    }catch(error){

        console.error(error);

    }

}

function agregarPreguntaEditor(datos = null){

    contadorPreguntas++;

    const pregunta = datos || {};

    const contenedor =
        document.getElementById(
            "contenedorPreguntas"
        );

    contenedor.innerHTML += `

<div class="card shadow mb-4 pregunta-card">

    <div class="card-body">

        <div class="d-flex justify-content-between align-items-center">

            <h5>

                Pregunta ${contadorPreguntas}

            </h5>

            <button
                class="btn btn-danger btn-sm"
                onclick="this.closest('.pregunta-card').remove()">

                <i class="fas fa-trash"></i>

            </button>

        </div>

        <div class="mt-3">

            <textarea
                class="form-control pregunta-texto"
                rows="2"
                placeholder="Escriba la pregunta..."
            >${pregunta.pregunta || ""}</textarea>

        </div>

        <div class="mt-3">

            <label class="w-100">

                <input
                    type="radio"
                    name="correcta${contadorPreguntas}"
                    value="A"
                    ${pregunta.respuesta_correcta === "A" ? "checked" : ""}
                >

                <input
                    class="form-control d-inline w-75 ms-2 opcion-a"
                    placeholder="Opción A"
                    value="${pregunta.opcion_a || ""}"
                >

            </label>

        </div>

        <div class="mt-2">

            <label class="w-100">

                <input
                    type="radio"
                    name="correcta${contadorPreguntas}"
                    value="B"
                    ${pregunta.respuesta_correcta === "B" ? "checked" : ""}
                >

                <input
                    class="form-control d-inline w-75 ms-2 opcion-b"
                    placeholder="Opción B"
                    value="${pregunta.opcion_b || ""}"
                >

            </label>

        </div>

        <div class="mt-2">

            <label class="w-100">

                <input
                    type="radio"
                    name="correcta${contadorPreguntas}"
                    value="C"
                    ${pregunta.respuesta_correcta === "C" ? "checked" : ""}
                >

                <input
                    class="form-control d-inline w-75 ms-2 opcion-c"
                    placeholder="Opción C"
                    value="${pregunta.opcion_c || ""}"
                >

            </label>

        </div>

        <div class="mt-2">

            <label class="w-100">

                <input
                    type="radio"
                    name="correcta${contadorPreguntas}"
                    value="D"
                    ${pregunta.respuesta_correcta === "D" ? "checked" : ""}
                >

                <input
                    class="form-control d-inline w-75 ms-2 opcion-d"
                    placeholder="Opción D"
                    value="${pregunta.opcion_d || ""}"
                >

            </label>

        </div>

    </div>

</div>

`;

}
async function cargarSelectEvaluacionesEditor(){

    const respuesta =
        await fetch(
            "/api/capitulos-induccion"
        );

    const data =
        await respuesta.json();

    if(!data.success){

        return;

    }

    const select =
        document.getElementById(
            "editorCapitulo"
        );

    let html = "";

    data.capitulos.forEach(cap=>{

        html += `
            <option value="${cap.id}">
                Capítulo ${cap.numero_capitulo} - ${cap.titulo}
            </option>
        `;

    });

    select.innerHTML = html;

}

async function guardarEvaluacionCompleta(){

    try{

        const capitulo_id =
            document.getElementById(
                "editorCapitulo"
            ).value;

        const nombre =
            document.getElementById(
                "editorNombre"
            ).value.trim();

        const descripcion =
            document.getElementById(
                "editorDescripcion"
            ).value.trim();

        const porcentaje_aprobacion =
            document.getElementById(
                "editorPorcentaje"
            ).value;

        if(!capitulo_id){

            return Swal.fire({

                icon:"warning",

                title:"Capítulo requerido",

                text:"Seleccione un capítulo."

            });

        }

        if(!nombre){

            return Swal.fire({

                icon:"warning",

                title:"Nombre requerido",

                text:"Ingrese el nombre de la evaluación."

            });

        }

        // ==========================================
        // CREAR EVALUACIÓN
        // ==========================================

        let url = "/api/evaluaciones-induccion";

let metodo = "POST";

if(evaluacionEditando){

    url = `/api/evaluaciones-induccion/${evaluacionEditando}`;

    metodo = "PUT";

}

const tarjetas =
    document.querySelectorAll(
        ".pregunta-card"
    );

const preguntas = [];

tarjetas.forEach((tarjeta,index)=>{

    preguntas.push({

        pregunta:
            tarjeta.querySelector(".pregunta-texto").value.trim(),

        opcion_a:
            tarjeta.querySelector(".opcion-a").value.trim(),

        opcion_b:
            tarjeta.querySelector(".opcion-b").value.trim(),

        opcion_c:
            tarjeta.querySelector(".opcion-c").value.trim(),

        opcion_d:
            tarjeta.querySelector(".opcion-d").value.trim(),

        respuesta_correcta:
            tarjeta.querySelector(
                "input[type='radio']:checked"
            )?.value || "",

        puntos:1,

        orden:index+1

    });

});

const respuesta = await fetch(

    url,

    {

        method:metodo,

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            capitulo_id,
            nombre,
            descripcion,
            porcentaje_aprobacion,
            preguntas

        })

    }

);

const data = await respuesta.json();

if(!data.success){

    return Swal.fire({

        icon:"error",

        title:"Error",

        text:data.mensaje

    });

}

const evaluacion_id =
    evaluacionEditando || data.id;

        // ==========================================
        // MENSAJE
        // ==========================================

        await Swal.fire({

            icon:"success",

            title:"Evaluación creada",

            text:"La evaluación y sus preguntas fueron registradas correctamente.",

            confirmButtonColor:"#16a34a"

        });

        evaluacionEditando = null;


        // ==========================================
        // LIMPIAR FORMULARIO
        // ==========================================

        document.getElementById(
            "editorNombre"
        ).value = "";

        document.getElementById(
            "editorDescripcion"
        ).value = "";

        document.getElementById(
            "editorPorcentaje"
        ).value = 70;

        document.getElementById(
            "contenedorPreguntas"
        ).innerHTML = "";

        preguntasEditor = [];

        contadorPreguntas = 0;

        // ==========================================
        // CERRAR MODAL
        // ==========================================

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById(
                    "modalEditorEvaluacion"
                )
            )
            .hide();

        await cargarEvaluaciones();

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById(
                    "modalEvaluaciones"
                )
            )
            .show();

    }catch(error){

        console.error(error);

        Swal.fire({

            icon:"error",

            title:"Error",

            text:error.message

        });

    }

}
