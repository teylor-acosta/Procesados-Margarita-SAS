let evaluacionEditando = null;

let cursoEvaluacionSeleccionado =
window.location.pathname.split("/").pop();

window.evaluacionSeleccionada = null;

// ==========================================
// EVENTOS
// ==========================================

document
    .getElementById("cardEvaluaciones")
    .addEventListener("click", async () => {

        console.log("Click en Evaluaciones");

        await cargarEvaluaciones();

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById("modalEvaluaciones")
            )
            .show();

    });

    // ==========================================
// NUEVA EVALUACIÓN
// ==========================================

document
.getElementById("btnNuevaEvaluacion")
.addEventListener(
    "click",
     async ()=>{

        evaluacionEditando = null;

        document
        .getElementById(
            "formNuevaEvaluacion"
        )
        .reset();

        const modalEvaluaciones =
        bootstrap.Modal.getInstance(
            document.getElementById(
                "modalEvaluaciones"
            )
        );

        const modalNueva =
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById(
                "modalNuevaEvaluacion"
            )
        );

        document
        .getElementById(
            "modalEvaluaciones"
        )
        .addEventListener(
            "hidden.bs.modal",
            async function abrir(){

                document
                .getElementById(
                    "modalEvaluaciones"
                )
                .removeEventListener(
                    "hidden.bs.modal",
                    abrir
                );
                

                modalNueva.show();

            }
        );

        await cargarCapitulosEvaluacion();


        modalEvaluaciones.hide();

    }
);

    document
    .getElementById("btnGuardarEvaluacion")
    .addEventListener(
        "click",
        guardarEvaluacion
    );

    // ==========================================
// CARGAR EVALUACIONES
// ==========================================

async function cargarEvaluaciones(){

    try{

        const respuesta =
        await fetch(
    `/api/cursos/${cursoEvaluacionSeleccionado}/evaluaciones`
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
// CARGAR CAPÍTULOS EN EL SELECT
// ==========================================

async function cargarCapitulosEvaluacion(){

    try{

        const respuesta =
        await fetch(
            `/api/cursos/${cursoEvaluacionSeleccionado}/capitulos`
        );

        const data =
await respuesta.json();

console.log("Respuesta API:", data);

        if(!data.success){

            return;

        }

        const select =
        document.getElementById(
            "capituloEvaluacion"
        );

        select.innerHTML = `
            <option value="">
                Seleccione un capítulo
            </option>
        `;

        console.log("Capítulos:", data.capitulos);

        data.capitulos.forEach(capitulo=>{

            select.innerHTML += `
                <option value="${capitulo.id}">
                    Capítulo ${capitulo.numero_capitulo} - ${capitulo.titulo}
                </option>
            `;

        });

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// RENDER EVALUACIONES
// ==========================================

function renderEvaluaciones(evaluaciones){

    const lista =
    document.getElementById(
        "listaEvaluaciones"
    );

    if(evaluaciones.length===0){

        lista.innerHTML = `

        <div class="text-center py-5">

            <i class="fas fa-circle-question fa-3x text-secondary mb-3"></i>

            <h5>

                No existen evaluaciones.

            </h5>

            <p class="text-muted">

                Presiona "Nueva Evaluación" para comenzar.

            </p>

        </div>

        `;

        return;

    }

    let html = "";

    evaluaciones.forEach(evaluacion=>{

        html += `

        <div class="card shadow-sm border-0 mb-3">

            <div class="card-body">

                <div class="d-flex justify-content-between align-items-start">

                    <div>

                        <h5 class="mb-2">

                            ${evaluacion.titulo}

                        </h5>

                        <p class="text-muted mb-2">

                            ${evaluacion.descripcion ?? "Sin descripción"}

                        </p>

                        <small class="text-success">

                            <strong>% Aprobación:</strong>

                            ${evaluacion.porcentaje_aprobacion}%

                            &nbsp;&nbsp;|&nbsp;&nbsp;

                            <strong>Intentos:</strong>

                            ${evaluacion.intentos}

                        </small>

                    </div>

                    <div class="d-flex gap-2">

                        <button
                            class="btn btn-primary btn-sm"
                            onclick="administrarPreguntas(${evaluacion.id})">

                            <i class="fas fa-list"></i>

                        </button>

                        <button
                            class="btn btn-danger btn-sm"
                            onclick="eliminarEvaluacion(${evaluacion.id})">

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
// ADMINISTRAR PREGUNTAS
// ==========================================

async function administrarPreguntas(id){

    window.evaluacionSeleccionada = id;

    const modalEvaluaciones =
    bootstrap.Modal.getInstance(
        document.getElementById(
            "modalEvaluaciones"
        )
    );

    const modalPreguntas =
    bootstrap.Modal.getOrCreateInstance(
        document.getElementById(
            "modalPreguntas"
        )
    );

    document
    .getElementById(
        "modalEvaluaciones"
    )
    .addEventListener(
        "hidden.bs.modal",
        function abrir(){

            document
            .getElementById(
                "modalEvaluaciones"
            )
            .removeEventListener(
                "hidden.bs.modal",
                abrir
            );

            modalPreguntas.show();

            cargarPreguntas();

        }
    );

    modalEvaluaciones.hide();

}

// ==========================================
// CARGAR PREGUNTAS
// ==========================================

async function cargarPreguntas(){

    try{

        const respuesta = await fetch(

            `/api/evaluaciones/${window.evaluacionSeleccionada}/preguntas`

        );

        const data = await respuesta.json();

        if(!data.success){

            return;

        }

        preguntas = data.preguntas;

        renderPreguntas();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// EDITAR EVALUACIÓN
// ==========================================

function editarEvaluacion(id){

    console.log(
        "Editar evaluación",
        id
    );

}

// ==========================================
// ELIMINAR EVALUACIÓN
// ==========================================

async function eliminarEvaluacion(id){

    const confirmar = await Swal.fire({

        icon:"warning",

        title:"¿Eliminar evaluación?",

        text:"Se eliminará la evaluación junto con todas sus preguntas y respuestas.",

        showCancelButton:true,

        confirmButtonText:"Sí, eliminar",

        cancelButtonText:"Cancelar",

        confirmButtonColor:"#d33"

    });

    if(!confirmar.isConfirmed){

        return;

    }

    try{

        const respuesta = await fetch(

            `/api/evaluaciones/${id}`,

            {

                method:"DELETE"

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

        await Swal.fire({

            icon:"success",

            title:"Eliminada",

            text:"La evaluación fue eliminada correctamente.",

            timer:1500,

            showConfirmButton:false

        });

        cargarEvaluaciones();

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// GUARDAR EVALUACIÓN
// ==========================================

async function guardarEvaluacion(){

    try{

        const body = {

    capitulo_id:
        document.getElementById(
            "capituloEvaluacion"
        ).value,

    titulo:
        document.getElementById(
            "tituloEvaluacion"
        ).value.trim(),

    descripcion:
        document.getElementById(
            "descripcionEvaluacion"
        ).value.trim(),

    porcentaje_aprobacion:
        document.getElementById(
            "porcentajeEvaluacion"
        ).value,

    intentos:
        document.getElementById(
            "intentosEvaluacion"
        ).value,

    orden:
        document.getElementById(
            "ordenEvaluacion"
        ).value

};

        const respuesta =
        await fetch(

            `/api/cursos/${cursoEvaluacionSeleccionado}/evaluaciones`,

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify(body)

            }

        );

        const data =
        await respuesta.json();

        if(!data.success){

            return Swal.fire({

                icon:"error",

                title:"Error",

                text:data.mensaje

            });

        }

        await Swal.fire({

    icon:"success",

    title:"Evaluación creada",

    text:"La evaluación fue registrada correctamente.",

    timer:1500,

    showConfirmButton:false

});

evaluacionEditando = null;

document
.getElementById(
    "formNuevaEvaluacion"
)
.reset();

bootstrap.Modal
.getInstance(
    document.getElementById(
        "modalNuevaEvaluacion"
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

    }

}