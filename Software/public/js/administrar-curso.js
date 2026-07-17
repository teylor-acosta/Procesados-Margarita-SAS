// ==========================================
// ID DEL CURSO
// ==========================================

const cursoId =
window.location.pathname.split("/").pop();

// ==========================================
// CAPÍTULO SELECCIONADO
// ==========================================

let capituloSeleccionado = null;
let mostrarTodosLosSubCapitulos = false;
let capituloEditando = null;
let subCapituloVideo = null;
let subCapituloEditando = null;


// ==========================================
// INICIO
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarCurso
);

// ==========================================

async function iniciarCurso(){

    await cargarCurso();

    await cargarCapitulos();

    inicializarEventos();

}

// ==========================================
// CARGAR INFORMACIÓN DEL CURSO
// ==========================================

async function cargarCurso() {

    try {

        const respuesta = await fetch(
            `/api/curso/${cursoId}`
        );

        const data = await respuesta.json();

        if (!data.success) {

            return Swal.fire({

                icon: "error",
                title: "Curso no encontrado"

            });

        }

        document.title =
            data.curso.titulo;

        document.getElementById(
            "tituloCurso"
        ).innerHTML = `
            <i class="fas fa-graduation-cap"></i>
            ${data.curso.titulo}
        `;

        document.getElementById(
            "descripcionCurso"
        ).textContent =
            data.curso.descripcion || "Sin descripción.";

    } catch (error) {

        console.error(error);

    }

}

// ==========================================
// CARGAR CAPÍTULOS
// ==========================================

async function cargarCapitulos(){

    try{

        const respuesta =
        await fetch(

            `/api/cursos/${cursoId}/capitulos`

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
// RENDER CAPÍTULOS
// ==========================================

function renderCapitulos(capitulos){

    const lista =
    document.getElementById(
        "listaCapitulos"
    );

    if(capitulos.length===0){

        lista.innerHTML=`

        <div class="text-center py-5">

            <i class="fas fa-book fa-3x text-secondary mb-3"></i>

            <h5>

                Este curso aún no tiene capítulos

            </h5>

            <p class="text-muted">

                Presiona "Nuevo Capítulo" para comenzar.

            </p>

        </div>

        `;

        return;

    }

    let html="";

    capitulos.forEach(cap=>{

        html+=`

        <div class="card shadow-sm border-0 mb-3">

            <div class="card-body">

                <div class="d-flex justify-content-between align-items-start">

                    <div>

                        <h5 class="mb-2">

                            <span class="badge bg-success me-2">

                                ${cap.numero_capitulo}

                            </span>

                            ${cap.titulo}

                        </h5>

                        <p class="text-muted mb-2">

                            ${cap.descripcion ?? ""}

                        </p>

                    </div>

                    <div class="d-flex gap-2">

                        <button
    type="button"
    class="btn btn-primary btn-sm"
                            onclick="administrarSubCapitulos(${cap.id})">

                            <i class="fas fa-layer-group"></i>

                        </button>

                        <button
    type="button"
    class="btn btn-warning btn-sm"
                            onclick="editarCapitulo(${cap.id})">

                            <i class="fas fa-pen"></i>

                        </button>

                        <button
    type="button"
    class="btn btn-danger btn-sm"
                            onclick="eliminarCapitulo(${cap.id})">

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </div>

            </div>

        </div>

        `;

    });

    lista.innerHTML = html;

}



// ==========================================
// EDITAR CAPÍTULO
// ==========================================

async function editarCapitulo(id){

    try{

        const respuesta =
        await fetch(

            `/api/capitulos/${id}`

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Capítulo no encontrado"

            });

        }

        const cap =
        data.capitulo;

        capituloEditando = id;

        document.getElementById(
            "numeroCapitulo"
        ).value =
        cap.numero_capitulo;

        document.getElementById(
            "tituloCapitulo"
        ).value =
        cap.titulo;

        document.getElementById(
            "descripcionCapitulo"
        ).value =
        cap.descripcion ?? "";

        document.getElementById(
            "ordenCapitulo"
        ).value =
        cap.orden;

        document.getElementById(
            "porcentajeCapitulo"
        ).value =
        cap.porcentaje_aprobacion;

        const modalCapitulos =
bootstrap.Modal.getInstance(
    document.getElementById(
        "modalCapitulos"
    )
);

const modalNuevo =
bootstrap.Modal.getOrCreateInstance(
    document.getElementById(
        "modalNuevoCapitulo"
    )
);

document.querySelector(
    "#modalNuevoCapitulo .modal-title"
).innerHTML = `

<i class="fas fa-pen"></i>

Editar Capítulo

`;

document
.getElementById("modalCapitulos")
.addEventListener(
    "hidden.bs.modal",
    function abrirModal(){

        document
        .getElementById("modalCapitulos")
        .removeEventListener(
            "hidden.bs.modal",
            abrirModal
        );

        modalNuevo.show();

    }
);

modalCapitulos.hide();

    }catch(error){

        console.error(error);

    }

}

// ==========================================

function eliminarCapitulo(id){

    console.log(
        "Eliminar",
        id
    );

}

// ==========================================

// ==========================================
// ADMINISTRAR SUBCAPÍTULOS
// ==========================================

async function administrarSubCapitulos(id){

    capituloSeleccionado = id;

    const modalCapitulos =
bootstrap.Modal.getInstance(
    document.getElementById(
        "modalCapitulos"
    )
);

const modalSub =
bootstrap.Modal.getOrCreateInstance(
    document.getElementById(
        "modalSubCapitulos"
    )
);

document
.getElementById("modalCapitulos")
.addEventListener(
    "hidden.bs.modal",
    async function abrirModal(){

        document
        .getElementById("modalCapitulos")
        .removeEventListener(
            "hidden.bs.modal",
            abrirModal
        );

        modalSub.show();

        await cargarSubCapitulos();

    }
);

modalCapitulos.hide();

}

// ==========================================
// EVENTOS
// ==========================================

function inicializarEventos(){

    const modalCapitulos =
        new bootstrap.Modal(
            document.getElementById(
                "modalCapitulos"
            )
        );

    const modalNuevoCapitulo =
        new bootstrap.Modal(
            document.getElementById(
                "modalNuevoCapitulo"
            )
        );

    const modalSubCapitulos =
        new bootstrap.Modal(
            document.getElementById(
                "modalSubCapitulos"
            )
        );

    // ===========================
    // CARD CAPÍTULOS
    // ===========================

    document
        .getElementById("cardCapitulos")
        .addEventListener("click",()=>{

            modalCapitulos.show();

        });

    // ===========================
    // CARD SUBCAPÍTULOS
    // ===========================

    document
        .getElementById("cardSubCapitulos")
        .addEventListener("click",async()=>{

            mostrarTodosLosSubCapitulos = true;

            capituloSeleccionado = null;

            modalSubCapitulos.show();

            await cargarSubCapitulos();

        });


        document
.getElementById(
    "btnGuardarSubCapitulo"
)
.addEventListener(
    "click",
    ()=>{

        if(subCapituloEditando){

            actualizarSubCapitulo();

        }else{

            guardarSubCapitulo();

        }

    }
);

    // ===========================
    // NUEVO CAPÍTULO
    // ===========================

    document
    .getElementById("btnNuevoCapitulo")
    .addEventListener("click",(e)=>{

        e.preventDefault();

        // Ya no estamos editando
        capituloEditando = null;

        // Limpiar formulario
        document.getElementById(
            "formNuevoCapitulo"
        ).reset();

        // Valores por defecto
        document.getElementById(
            "porcentajeCapitulo"
        ).value = 70;

        // Cambiar el título nuevamente
        document.querySelector(
            "#modalNuevoCapitulo .modal-title"
        ).innerHTML = `
            <i class="fas fa-book"></i>
            Nuevo Capítulo
        `;

        modalCapitulos.hide();

        modalNuevoCapitulo.show();

    });

    // ===========================
    // GUARDAR CAPÍTULO
    // ===========================

    document
    .getElementById("btnGuardarCapitulo")
    .addEventListener(
        "click",
        ()=>{

            if(capituloEditando){

                actualizarCapitulo();

            }else{

                guardarCapitulo();

            }

        }
    );

    // ===========================
// NUEVO SUBCAPÍTULO
// ===========================

document
    .getElementById(
        "btnNuevoSubCapitulo"
    )
    .addEventListener(
        "click",
        async()=>{

            const modalSub =
            bootstrap.Modal.getInstance(
                document.getElementById(
                    "modalSubCapitulos"
                )
            );

            const modalNuevo =
            bootstrap.Modal.getOrCreateInstance(
                document.getElementById(
                    "modalNuevoSubCapitulo"
                )
            );

            document
            .getElementById(
                "modalSubCapitulos"
            )
            .addEventListener(
                "hidden.bs.modal",
                async function abrirNuevo(){

                    document
                    .getElementById(
                        "modalSubCapitulos"
                    )
                    .removeEventListener(
                        "hidden.bs.modal",
                        abrirNuevo
                    );

                    await cargarCapitulosSelect();

                    modalNuevo.show();

                }
            );

            modalSub.hide();

        }
    );

    // ===========================
// CAMBIO TIPO DE VIDEO
// ===========================

document
    .getElementById(
        "tipoVideo"
    )
    .addEventListener(
        "change",
        cambiarTipoVideo
    );

    document
.getElementById(
    "tipoVideoEditar"
)
.addEventListener(
    "change",
    cambiarTipoVideoEditar
);
}

document
.getElementById(
    "btnGuardarVideo"
)
.addEventListener(
    "click",
    guardarVideo
);

function cambiarTipoVideoEditar(){

    const tipo =
    document.getElementById(
        "tipoVideoEditar"
    ).value;

    const local =
    document.getElementById(
        "contenedorVideoLocal"
    );

    const youtube =
    document.getElementById(
        "contenedorVideoYoutube"
    );

    if(tipo==="local"){

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
// GUARDAR CAPÍTULO
// ==========================================

async function guardarCapitulo(){

    try{

        const datos={

            numero:

                document.getElementById(
                    "numeroCapitulo"
                ).value,

            titulo:

                document.getElementById(
                    "tituloCapitulo"
                ).value,

            descripcion:

                document.getElementById(
                    "descripcionCapitulo"
                ).value,

            orden:

                document.getElementById(
                    "ordenCapitulo"
                ).value,

            porcentaje:

                document.getElementById(
                    "porcentajeCapitulo"
                ).value

        };

        const respuesta=
        await fetch(

            `/api/cursos/${cursoId}/capitulos`,

            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify(datos)

            }

        );

        const data=
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Error",

                text:"No fue posible guardar el capítulo."

            });

        }

        Swal.fire({

    icon:"success",

    title:"Capítulo creado",

    text:"El capítulo fue registrado correctamente.",

    timer:1500,

    showConfirmButton:false

}).then(async ()=>{

    document.getElementById(
        "formNuevoCapitulo"
    ).reset();

    await cargarCapitulos();

    bootstrap.Modal.getInstance(
        document.getElementById(
            "modalNuevoCapitulo"
        )
    ).hide();

    bootstrap.Modal.getOrCreateInstance(
        document.getElementById(
            "modalCapitulos"
        )
    ).show();

});

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// GUARDAR SUBCAPÍTULO
// ==========================================

async function guardarSubCapitulo(){

    try{

        const formData = new FormData();

        formData.append(
            "capitulo_id",
            document.getElementById(
                "capituloSubCapitulo"
            ).value
        );

        formData.append(
            "numero",
            document.getElementById(
                "numeroSubCapitulo"
            ).value
        );

        formData.append(
            "orden",
            document.getElementById(
                "ordenSubCapitulo"
            ).value
        );

        formData.append(
            "duracion",
            document.getElementById(
                "duracionSubCapitulo"
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

        const tipo =
        document.getElementById(
            "tipoVideo"
        ).value;

        formData.append(
            "tipo_video",
            tipo
        );

        if(tipo==="local"){

            const archivo =
            document.getElementById(
                "archivoVideo"
            ).files[0];

            if(archivo){

                formData.append(
                    "video",
                    archivo
                );

            }

        }else{

            formData.append(
                "url_youtube",
                document.getElementById(
                    "urlYoutube"
                ).value
            );

        }

        const respuesta =
        await fetch(

            `/api/cursos/${cursoId}/subcapitulos`,

            {

                method:"POST",

                body:formData

            }

        );

        const data =
await respuesta.json();

if(!data.success){

    return Swal.fire({

        icon:"error",

        title:"Error",

        text:data.mensaje ||

        "No fue posible crear el subcapítulo."

    });

}

await Swal.fire({

    icon:"success",

    title:"Subcapítulo creado",

    text:"El subcapítulo fue registrado correctamente.",

    timer:1500,

    showConfirmButton:false

});

document.getElementById(
    "formNuevoSubCapitulo"
).reset();

bootstrap.Modal
.getInstance(
    document.getElementById(
        "modalNuevoSubCapitulo"
    )
)
.hide();

await cargarSubCapitulos();

bootstrap.Modal
.getOrCreateInstance(
    document.getElementById(
        "modalSubCapitulos"
    )
)
.show();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// ACTUALIZAR SUBCAPÍTULO
// ==========================================

async function actualizarSubCapitulo(){

    try{

        const formData = new FormData();

        formData.append(
            "capitulo_id",
            document.getElementById(
                "capituloSubCapitulo"
            ).value
        );

        formData.append(
            "numero",
            document.getElementById(
                "numeroSubCapitulo"
            ).value
        );

        formData.append(
            "orden",
            document.getElementById(
                "ordenSubCapitulo"
            ).value
        );

        formData.append(
            "duracion",
            document.getElementById(
                "duracionSubCapitulo"
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

        const tipo =
        document.getElementById(
            "tipoVideo"
        ).value;

        formData.append(
            "tipo_video",
            tipo
        );

        if(tipo==="local"){

            const archivo =
            document.getElementById(
                "archivoVideo"
            ).files[0];

            if(archivo){

                formData.append(
                    "video",
                    archivo
                );

            }

        }else{

            formData.append(
                "url_youtube",
                document.getElementById(
                    "urlYoutube"
                ).value
            );

        }

        const respuesta =
        await fetch(

            `/api/subcapitulos/${subCapituloEditando}`,

            {

                method:"PUT",

                body:formData

            }

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Error",

                text:data.mensaje ||

                "No fue posible actualizar."

            });

        }

        await Swal.fire({

            icon:"success",

            title:"Subcapítulo actualizado",

            timer:1500,

            showConfirmButton:false

        });

        subCapituloEditando = null;

        document.getElementById(
            "formNuevoSubCapitulo"
        ).reset();

        bootstrap.Modal
        .getInstance(
            document.getElementById(
                "modalNuevoSubCapitulo"
            )
        )
        .hide();

        await cargarSubCapitulos();

        bootstrap.Modal
        .getOrCreateInstance(
            document.getElementById(
                "modalSubCapitulos"
            )
        )
        .show();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// ACTUALIZAR CAPÍTULO
// ==========================================

async function actualizarCapitulo(){

    try{

        const datos = {

            numero:

                document.getElementById(
                    "numeroCapitulo"
                ).value,

            titulo:

                document.getElementById(
                    "tituloCapitulo"
                ).value,

            descripcion:

                document.getElementById(
                    "descripcionCapitulo"
                ).value,

            orden:

                document.getElementById(
                    "ordenCapitulo"
                ).value,

            porcentaje:

                document.getElementById(
                    "porcentajeCapitulo"
                ).value

        };

        const respuesta =
        await fetch(

            `/api/cursos/${cursoId}/capitulos/${capituloEditando}`,

            {

                method:"PUT",

                headers:{

                    "Content-Type":"application/json"

                },

                body:JSON.stringify(datos)

            }

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Error",

                text:"No fue posible actualizar el capítulo."

            });

        }

        Swal.fire({

            icon:"success",

            title:"Capítulo actualizado",

            text:"Los cambios fueron guardados correctamente.",

            timer:1500,

            showConfirmButton:false

        }).then(async()=>{

            capituloEditando = null;

            document.getElementById(
                "formNuevoCapitulo"
            ).reset();

            document.querySelector(
                "#modalNuevoCapitulo .modal-title"
            ).innerHTML = `

                <i class="fas fa-book"></i>

                Nuevo Capítulo

            `;

            await cargarCapitulos();

            bootstrap.Modal
                .getInstance(
                    document.getElementById(
                        "modalNuevoCapitulo"
                    )
                )
                .hide();

            bootstrap.Modal
                .getOrCreateInstance(
                    document.getElementById(
                        "modalCapitulos"
                    )
                )
                .show();

        });

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// CARGAR SUBCAPÍTULOS
// ==========================================

async function cargarSubCapitulos(){

    let url = "";

    if(mostrarTodosLosSubCapitulos){

        url =
        `/api/cursos/${cursoId}/subcapitulos`;

    }else{

        url =
        `/api/capitulos/${capituloSeleccionado}/subcapitulos`;

    }

    const respuesta =
    await fetch(url);

    const data =
    await respuesta.json();

    renderSubCapitulos(
        data.subcapitulos
    );

}

// ==========================================
// CARGAR CAPÍTULOS EN EL SELECT
// ==========================================

async function cargarCapitulosSelect(){

    try{

        const respuesta =
        await fetch(

            `/api/cursos/${cursoId}/capitulos`

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

        select.innerHTML = "";

        data.capitulos.forEach(cap=>{

            select.innerHTML += `

                <option value="${cap.id}">

                    Capítulo ${cap.numero_capitulo} - ${cap.titulo}

                </option>

            `;

        });

        if(capituloSeleccionado){

            select.value =
            capituloSeleccionado;

        }

        document.getElementById(
    "tipoVideo"
).value = "local";

cambiarTipoVideo();

        document.getElementById(
    "tipoVideo"
).value = "local";

cambiarTipoVideo();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// RENDER SUBCAPÍTULOS
// ==========================================

function renderSubCapitulos(subcapitulos){

    const lista =
    document.getElementById(
        "listaSubCapitulos"
    );

    if(subcapitulos.length===0){

        lista.innerHTML=`

        <div class="text-center py-5">

            <i class="fas fa-layer-group fa-3x text-secondary mb-3"></i>

            <h5>

                No existen subcapítulos.

            </h5>

        </div>

        `;

        return;

    }

    let html="";

    subcapitulos.forEach(sub=>{

        html+=`

        <div class="card shadow-sm border-0 mb-3">

            <div class="card-body">

                <div class="d-flex justify-content-between">

                    <div>

                        <h5>

                            <span class="badge bg-success me-2">

                                ${sub.numero_subcapitulo}

                            </span>

                            ${sub.titulo}

                        </h5>

                        <p class="mb-1 text-muted">

                            ${sub.descripcion ?? ""}

                        </p>

                        <small class="text-primary">

                            <i class="fas fa-book"></i>

                            ${sub.numero_capitulo}. ${sub.capitulo}

                        </small>

                    </div>

                    <div class="d-flex gap-2">

    <button
        class="btn btn-warning btn-sm"
        onclick="editarSubCapitulo(${sub.id})">

        <i class="fas fa-pen"></i>

    </button>

    <button
        class="btn btn-danger btn-sm"
        onclick="eliminarSubCapitulo(${sub.id})">

        <i class="fas fa-trash"></i>

    </button>

    <button
        class="btn btn-success btn-sm"
        onclick="administrarVideo(${sub.id})">

        <i class="fas fa-video"></i>

    </button>

</div>

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

            `/api/subcapitulos/${id}`

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Subcapítulo no encontrado"

            });

        }

        const sub =
        data.subcapitulo;

        subCapituloEditando = id;

        // ===========================
        // CARGAR PRIMERO EL SELECT
        // ===========================

        await cargarCapitulosSelect();

        // ===========================
        // LLENAR EL FORMULARIO
        // ===========================

        document.getElementById(
            "capituloSubCapitulo"
        ).value =
        sub.capitulo_id;

        document.getElementById(
            "numeroSubCapitulo"
        ).value =
        sub.numero_subcapitulo;

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
        sub.descripcion ?? "";

        document.getElementById(
            "tipoVideo"
        ).value =
        sub.tipo_video;

        cambiarTipoVideo();

        if(sub.tipo_video==="youtube"){

            document.getElementById(
                "urlYoutube"
            ).value =
            sub.url_video ?? "";

        }else{

            document.getElementById(
                "urlYoutube"
            ).value = "";

        }

        // Limpiar el input de archivo
        document.getElementById(
            "archivoVideo"
        ).value = "";

        // ===========================
        // MODALES
        // ===========================

        const modalSub =
        bootstrap.Modal.getInstance(
            document.getElementById(
                "modalSubCapitulos"
            )
        );

        const modalNuevo =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "modalNuevoSubCapitulo"
            )
        );

        document.querySelector(
            "#modalNuevoSubCapitulo .modal-title"
        ).innerHTML = `

            <i class="fas fa-pen"></i>

            Editar Subcapítulo

        `;

        document
        .getElementById(
            "modalSubCapitulos"
        )
        .addEventListener(
            "hidden.bs.modal",
            function abrir(){

                document
                .getElementById(
                    "modalSubCapitulos"
                )
                .removeEventListener(
                    "hidden.bs.modal",
                    abrir
                );

                modalNuevo.show();

            }
        );

        modalSub.hide();

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
// ADMINISTRAR VIDEO
// ==========================================

async function administrarVideo(id){

    subCapituloVideo = id;

    const modalSub =
    bootstrap.Modal.getInstance(
        document.getElementById(
            "modalSubCapitulos"
        )
    );

    const modalVideo =
    bootstrap.Modal.getOrCreateInstance(
        document.getElementById(
            "modalVideo"
        )
    );

    document
    .getElementById("modalSubCapitulos")
    .addEventListener(
        "hidden.bs.modal",
        async function abrirVideo(){

            document
            .getElementById("modalSubCapitulos")
            .removeEventListener(
                "hidden.bs.modal",
                abrirVideo
            );

            modalVideo.show();

            await cargarVideo();

        }
    );

    modalSub.hide();

}

// ==========================================
// CARGAR VIDEO
// ==========================================

async function cargarVideo(){

    try{

        const respuesta =
        await fetch(

            `/api/subcapitulos/${subCapituloVideo}/video`

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return;

        }

        const video = data.video;

        document.getElementById(
            "tipoVideoEditar"
        ).value =
        video.tipo_video;

        cambiarTipoVideoEditar();

        // Limpiar vistas previas
        document.getElementById(
            "videoPreview"
        ).src = "";

        document.getElementById(
            "youtubePreview"
        ).src = "";

        document.getElementById(
            "urlYoutubeEditar"
        ).value = "";

        document.getElementById(
            "archivoVideoEditar"
        ).value = "";

        if(video.tipo_video==="youtube"){

            document.getElementById(
                "urlYoutubeEditar"
            ).value =
            video.url_video ?? "";

            let embed = video.url_video;

            if(embed.includes("watch?v=")){

                embed = embed.replace(
                    "watch?v=",
                    "embed/"
                );

            }

            if(embed.includes("youtu.be/")){

                embed =
                "https://www.youtube.com/embed/" +
                embed.split("youtu.be/")[1];

            }

            document.getElementById(
                "youtubePreview"
            ).src = embed;

        }else{

            document.getElementById(
                "videoPreview"
            ).src =
            video.url_video;

            document.getElementById(
                "nombreVideoActual"
            ).textContent =
            video.url_video.split("/").pop();

        }

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// GUARDAR VIDEO
// ==========================================

async function guardarVideo(){

    try{

        const formData = new FormData();

        const tipo =
        document.getElementById(
            "tipoVideoEditar"
        ).value;

        formData.append(
            "tipo_video",
            tipo
        );

        if(tipo==="local"){

            const archivo =
            document.getElementById(
                "archivoVideoEditar"
            ).files[0];

            if(archivo){

                formData.append(
                    "video",
                    archivo
                );

            }

        }else{

            formData.append(
                "url_youtube",
                document.getElementById(
                    "urlYoutubeEditar"
                ).value
            );

        }

        const respuesta =
        await fetch(

            `/api/subcapitulos/${subCapituloVideo}/video`,

            {

                method:"PUT",

                body:formData

            }

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Error",

                text:data.mensaje ||

                "No fue posible actualizar el video."

            });

        }

        await Swal.fire({

            icon:"success",

            title:"Video actualizado",

            timer:1500,

            showConfirmButton:false

        });

        bootstrap.Modal
        .getInstance(
            document.getElementById(
                "modalVideo"
            )
        )
        .hide();

        bootstrap.Modal
        .getOrCreateInstance(
            document.getElementById(
                "modalSubCapitulos"
            )
        )
        .show();

        await cargarSubCapitulos();

    }catch(error){

        console.error(error);

    }

}