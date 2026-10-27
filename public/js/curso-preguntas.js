// ===========================================
// CONSTRUCTOR DE EVALUACIONES
// ===========================================

// ================================
// VARIABLES
// ================================

let preguntas = [];
let temporizadorGuardado = null;


// ================================
// EVENTOS
// ================================

document.addEventListener("DOMContentLoaded",()=>{

    const btnAgregar =
    document.getElementById(
        "btnAgregarPregunta"
    );

    if(btnAgregar){

        btnAgregar.addEventListener(
            "click",
            agregarPregunta
        );

    }

    const btnGuardar =
document.getElementById(
    "btnGuardarTodasPreguntas"
);

if(btnGuardar){

    btnGuardar.addEventListener(
    "click",
    guardarTodasPreguntas
);
}

});


// ================================
// AGREGAR PREGUNTA
// ================================

function agregarPregunta(){

    console.log("CLICK");

    preguntas.push({

    id:null,

    pregunta:"",

    descripcion:"",

    tipo:"VARIAS_OPCIONES",

    puntaje:1,

    orden:preguntas.length+1,

    obligatoria:true,

    configuracionAbierta:true,

    opciones:[
    {
        texto:"",
        correcta:false
    }
],

filas:[],

columnas:[]

});

    renderPreguntas();

}


// ================================
// RENDER GENERAL
// ================================

function renderPreguntas(){

    const contenedor =
    document.getElementById(
        "contenedorPreguntas"
    );

    if(!contenedor){

        return;

    }

    let html="";

    preguntas.forEach((pregunta,index)=>{

        html += renderPregunta(
            pregunta,
            index
        );

    });

    contenedor.innerHTML = html;

}


// ================================
// RENDER PREGUNTA
// ================================

function renderPregunta(pregunta,index){

    return `

    <div class="card shadow border-0 rounded-4 mb-4">

        <div class="card-header bg-white border-0 py-3">

            <div class="d-flex justify-content-between align-items-center">

                <div>

                    <h5 class="fw-bold mb-1">

                        Pregunta ${index+1}

                    </h5>

                    <small class="text-muted">

                        Configure el contenido de esta pregunta

                    </small>

                </div>

                <div class="btn-group">

                    <button
                        class="btn btn-outline-secondary btn-sm"
                        onclick="duplicarPregunta(${index})">

                        <i class="fas fa-copy"></i>

                    </button>

                    <button
                        class="btn btn-outline-primary btn-sm"
                        onclick="subirPregunta(${index})">

                        <i class="fas fa-arrow-up"></i>

                    </button>

                    <button
                        class="btn btn-outline-primary btn-sm"
                        onclick="bajarPregunta(${index})">

                        <i class="fas fa-arrow-down"></i>

                    </button>

                    <button
                        class="btn btn-outline-danger btn-sm"
                        onclick="eliminarPregunta(${index})">

                        <i class="fas fa-trash"></i>

                    </button>

                </div>

            </div>

        </div>

        <div class="card-body">

            <div class="mb-4">

                <label class="form-label fw-semibold">

                    Enunciado

                </label>

                <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Escriba la pregunta..."
                    oninput="preguntas[${index}].pregunta=this.value">${pregunta.pregunta}</textarea>

            </div>

            <div class="mb-4">

                <label class="form-label fw-semibold">

                    Descripción (opcional)

                </label>

                <textarea
                    class="form-control"
                    rows="2"
                    placeholder="Instrucciones para el empleado..."
                    oninput="preguntas[${index}].descripcion=this.value">${pregunta.descripcion ?? ""}</textarea>

            </div>

            <div class="row g-3">

                <div class="col-lg-5">

                    <label class="form-label fw-semibold">

                        Tipo de pregunta

                    </label>

                    <select
                        class="form-select"
                        onchange="cambiarTipoPregunta(${index},this.value)">

                        <option value="VARIAS_OPCIONES" ${pregunta.tipo==="VARIAS_OPCIONES"?"selected":""}>Varias opciones</option>

                        <option value="CASILLAS" ${pregunta.tipo==="CASILLAS"?"selected":""}>Casillas</option>

                        <option value="DESPLEGABLE" ${pregunta.tipo==="DESPLEGABLE"?"selected":""}>Desplegable</option>

                        <option value="RESPUESTA_CORTA" ${pregunta.tipo==="RESPUESTA_CORTA"?"selected":""}>Respuesta corta</option>

                        <option value="PARRAFO" ${pregunta.tipo==="PARRAFO"?"selected":""}>Párrafo</option>

                        <option value="ESCALA_LINEAL" ${pregunta.tipo==="ESCALA_LINEAL"?"selected":""}>Escala lineal</option>

                        <option value="CALIFICACION" ${pregunta.tipo==="CALIFICACION"?"selected":""}>Calificación</option>

                        <option value="CUADRICULA_OPCIONES" ${pregunta.tipo==="CUADRICULA_OPCIONES"?"selected":""}>Cuadrícula opciones</option>

                        <option value="CUADRICULA_CASILLAS" ${pregunta.tipo==="CUADRICULA_CASILLAS"?"selected":""}>Cuadrícula casillas</option>

                        <option value="SUBIR_ARCHIVOS" ${pregunta.tipo==="SUBIR_ARCHIVOS"?"selected":""}>Subir archivos</option>

                        <option value="FECHA" ${pregunta.tipo==="FECHA"?"selected":""}>Fecha</option>

                        <option value="HORA" ${pregunta.tipo==="HORA"?"selected":""}>Hora</option>

                    </select>

                </div>

                <div class="col-lg-2">

                    <label class="form-label fw-semibold">

                        Puntaje

                    </label>

                    <input
                        type="number"
                        class="form-control"
                        value="${pregunta.puntaje}"
                        oninput="preguntas[${index}].puntaje=this.value">

                </div>

                <div class="col-lg-3 d-flex align-items-end">

                    <div class="form-check form-switch">

                        <input
                            class="form-check-input"
                            type="checkbox"
                            ${pregunta.obligatoria?"checked":""}
                            onchange="preguntas[${index}].obligatoria=this.checked">

                        <label class="form-check-label">

                            Obligatoria

                        </label>

                    </div>

                </div>

            </div>

            <div class="d-flex justify-content-between align-items-center mt-4 mb-3">

    <h6 class="mb-0">

        <i class="fas fa-cog me-2"></i>

        Configuración

    </h6>

    <button
        class="btn btn-sm btn-outline-secondary"
        onclick="toggleConfiguracion(${index})">

        ${
            pregunta.configuracionAbierta

            ?

            '<i class="fas fa-chevron-up"></i> Ocultar'

            :

            '<i class="fas fa-chevron-down"></i> Mostrar'

        }

    </button>

</div>

${
    pregunta.configuracionAbierta

    ?

    renderConfiguracionPregunta(pregunta,index)

    :

    ""
}

<hr class="my-4">

<div class="card bg-light border-0">

    <div class="card-header bg-transparent">

        <i class="fas fa-eye"></i>

        Vista previa

    </div>

    <div class="card-body">

        ${renderVistaPrevia(pregunta)}

    </div>

</div>

        </div>

    </div>

    `;

}

// ======================================
// CAMBIAR TIPO
// ======================================

function cambiarTipoPregunta(index, tipo){

    preguntas[index].tipo = tipo;

    switch(tipo){

        case "VARIAS_OPCIONES":

        case "CASILLAS":

        case "DESPLEGABLE":

            preguntas[index].opciones = [

                {
                    texto:"",
                    correcta:false
                }

            ];

        break;

        case "RESPUESTA_CORTA":

        case "PARRAFO":

            preguntas[index].opciones = [];

        break;

        case "ESCALA_LINEAL":

            preguntas[index].escala = {

                minimo:1,

                maximo:5,

                etiquetaMinima:"",

                etiquetaMaxima:""

            };

            preguntas[index].opciones = [];

        break;

        case "CALIFICACION":

            preguntas[index].calificacion = {

                maximo:5

            };

            preguntas[index].opciones = [];

        break;

        case "CUADRICULA_OPCIONES":

case "CUADRICULA_CASILLAS":

    preguntas[index].filas = [
        "Fila 1"
    ];

    preguntas[index].columnas = [
        "Columna 1"
    ];

    preguntas[index].opciones = [];

break;

        case "FECHA":

        case "HORA":

            preguntas[index].opciones = [];

        break;

    }

    renderPreguntas();

}

// ======================================
// RENDER CONFIGURACION
// ======================================

function renderConfiguracionPregunta(
    pregunta,
    index
){

    switch(pregunta.tipo){

        case "VARIAS_OPCIONES":

        case "CASILLAS":

        case "DESPLEGABLE":

            return renderOpciones(
                pregunta,
                index
            );

        case "RESPUESTA_CORTA":

            return renderRespuestaCorta();

        case "PARRAFO":

            return renderParrafo();

        case "ESCALA_LINEAL":

            return renderEscala();

        case "CALIFICACION":

            return renderCalificacion();

        case "CUADRICULA_OPCIONES":

case "CUADRICULA_CASILLAS":

    return renderCuadricula(
        pregunta,
        index
    );

        case "SUBIR_ARCHIVOS":

            return renderArchivos();

        case "FECHA":

            return renderFecha();

        case "HORA":

            return renderHora();

        default:

            return "";

    }

}

function renderOpciones(pregunta, index){

    let html = `

    <div class="card border-0 shadow-sm">

        <div class="card-header bg-white d-flex justify-content-between align-items-center">

            <div>

                <i class="fas fa-list-ul text-primary me-2"></i>

                <strong>Opciones de respuesta</strong>

            </div>

            <span class="badge bg-primary">

                ${pregunta.opciones.length}

            </span>

        </div>

        <div class="card-body">

    `;

    pregunta.opciones.forEach((opcion,i)=>{

        html += `

        <div class="card border rounded-3 mb-3 opcion-card">

            <div class="card-body">

                <div class="row align-items-center">

                    <div class="col-auto">

                        <i class="fas fa-grip-vertical text-secondary fs-5"></i>

                    </div>

                    <div class="col-auto">

                        ${
                            pregunta.tipo==="CASILLAS"

                            ?

                            `<input
                                type="checkbox"
                                class="form-check-input"
                                ${opcion.correcta?"checked":""}
                                onchange="marcarCorrecta(${index},${i})">`

                            :

                            `<input
                                type="radio"
                                name="correcta_${index}"
                                class="form-check-input"
                                ${opcion.correcta?"checked":""}
                                onchange="marcarCorrecta(${index},${i})">`
                        }

                    </div>

                    <div class="col">

                        <input
                            class="form-control"
                            placeholder="Escriba una opción..."
                            value="${opcion.texto}"
                            oninput="editarOpcion(${index},${i},this.value)">

                    </div>

                    <div class="col-auto">

    <button
        class="btn btn-outline-secondary"
        type="button"
        title="Imagen (próximamente)"
        disabled>

        <i class="fas fa-image"></i>

    </button>

</div>

<div class="col-auto">

    <button
        class="btn btn-outline-primary"
        type="button"
        title="Duplicar opción"
        onclick="duplicarOpcion(${index},${i})">

        <i class="fas fa-copy"></i>

    </button>

</div>

<div class="col-auto">

    <button
        class="btn btn-outline-danger"
        type="button"
        onclick="eliminarOpcion(${index},${i})">

        <i class="fas fa-trash"></i>

    </button>

</div>

                </div>

        `;

        if(opcion.correcta){

            html += `

                <div class="alert alert-success mt-3 mb-0 py-2">

                    <i class="fas fa-check-circle me-2"></i>

                    Esta opción será tomada como respuesta correcta.

                </div>

            `;

        }

        html += `

            </div>

        </div>

        `;

    });

    html += `

            <div class="text-center">

                <button
                    class="btn btn-success"
                    onclick="agregarOpcion(${index})">

                    <i class="fas fa-plus-circle me-2"></i>

                    Agregar opción

                </button>

            </div>

        </div>

    </div>

    `;

    return html;

}

function renderRespuestaCorta(){

    return `

        <div class="alert alert-info">

            El empleado responderá un texto corto.

        </div>

    `;

}

function renderParrafo(){

    return `

        <div class="alert alert-info">

            El empleado responderá un texto largo.

        </div>

    `;

}

function renderEscala(){

    return `

    <div class="row">

        <div class="col-md-3">

            <label>Mínimo</label>

            <input
                class="form-control"
                type="number"
                value="1">

        </div>

        <div class="col-md-3">

            <label>Máximo</label>

            <input
                class="form-control"
                type="number"
                value="5">

        </div>

        <div class="col-md-3">

            <label>Etiqueta mínima</label>

            <input
                class="form-control"
                placeholder="Malo">

        </div>

        <div class="col-md-3">

            <label>Etiqueta máxima</label>

            <input
                class="form-control"
                placeholder="Excelente">

        </div>

    </div>

    `;

}

function renderCalificacion(){

    return `

    <label>

        Número máximo de estrellas

    </label>

    <input
        class="form-control"
        type="number"
        value="5">

    `;

}

function renderCuadricula(
    pregunta,
    index
){

    let html = `

    <div class="row">

        <div class="col-md-6">

            <h6 class="mb-3">
                Filas
            </h6>

    `;

    pregunta.filas.forEach((fila,i)=>{

        html += `

        <div class="input-group mb-2">

            <input
                type="text"
                class="form-control"
                value="${fila}"
                oninput="preguntas[${index}].filas[${i}] = this.value">

            <button
                class="btn btn-outline-danger"
                onclick="eliminarFila(${index},${i})">

                <i class="fas fa-trash"></i>

            </button>

        </div>

        `;

    });

    html += `

        <button
            class="btn btn-success btn-sm"
            onclick="agregarFila(${index})">

            <i class="fas fa-plus"></i>

            Agregar fila

        </button>

        </div>

        <div class="col-md-6">

            <h6 class="mb-3">
                Columnas
            </h6>

    `;

    pregunta.columnas.forEach((columna,i)=>{

        html += `

        <div class="input-group mb-2">

            <input
                type="text"
                class="form-control"
                value="${columna}"
                oninput="preguntas[${index}].columnas[${i}] = this.value">

            <button
                class="btn btn-outline-danger"
                onclick="eliminarColumna(${index},${i})">

                <i class="fas fa-trash"></i>

            </button>

        </div>

        `;

    });

    html += `

        <button
            class="btn btn-success btn-sm"
            onclick="agregarColumna(${index})">

            <i class="fas fa-plus"></i>

            Agregar columna

        </button>

        </div>

    </div>

    `;

    return html;

}

function renderArchivos(){

    return `

    <div class="row">

        <div class="col-md-6">

            <label>

                Cantidad máxima

            </label>

            <input
                class="form-control"
                type="number"
                value="1">

        </div>

        <div class="col-md-6">

            <label>

                Tamaño máximo (MB)

            </label>

            <input
                class="form-control"
                type="number"
                value="10">

        </div>

    </div>

    `;

}

function renderFecha(){

    return `

        <div class="alert alert-info">

            El empleado seleccionará una fecha.

        </div>

    `;

}

function renderHora(){

    return `

        <div class="alert alert-info">

            El empleado seleccionará una hora.

        </div>

    `;

}

// ======================================
// VISTA PREVIA
// ======================================

function renderVistaPrevia(pregunta){

    switch(pregunta.tipo){

        case "VARIAS_OPCIONES":

            return vistaVariasOpciones(pregunta);

        case "CASILLAS":

            return vistaCasillas(pregunta);

        case "DESPLEGABLE":

            return vistaDesplegable(pregunta);

        case "RESPUESTA_CORTA":

            return `

                <input
                    class="form-control"
                    placeholder="Respuesta corta"
                    disabled>

            `;

        case "PARRAFO":

            return `

                <textarea
                    class="form-control"
                    rows="3"
                    placeholder="Respuesta larga"
                    disabled></textarea>

            `;

        case "ESCALA_LINEAL":

            return `

                <div class="d-flex gap-3">

                    <span>1</span>

                    <input type="range" disabled>

                    <span>5</span>

                </div>

            `;

        case "CALIFICACION":

            return `

                <div style="font-size:28px">

                    ⭐⭐⭐⭐⭐

                </div>

            `;

            case "CUADRICULA_OPCIONES":

case "CUADRICULA_CASILLAS":

    return vistaCuadricula(pregunta);

        case "FECHA":

            return `

                <input
                    class="form-control"
                    type="date"
                    disabled>

            `;

        case "HORA":

            return `

                <input
                    class="form-control"
                    type="time"
                    disabled>

            `;

        case "SUBIR_ARCHIVOS":

            return `

                <input
                    class="form-control"
                    type="file"
                    disabled>

            `;

        default:

            return `
                <div class="text-muted">
                    Vista previa no disponible.
                </div>
            `;

    }

}

function vistaVariasOpciones(pregunta){

    let html="";

    pregunta.opciones.forEach(op=>{

        html+=`

        <div class="form-check mb-2">

            <input
                class="form-check-input"
                type="radio"
                disabled>

            <label class="form-check-label">

                ${op.texto || "Opción"}

            </label>

        </div>

        `;

    });

    return html;

}

function vistaCasillas(pregunta){

    let html="";

    pregunta.opciones.forEach(op=>{

        html+=`

        <div class="form-check mb-2">

            <input
                class="form-check-input"
                type="checkbox"
                disabled>

            <label class="form-check-label">

                ${op.texto || "Opción"}

            </label>

        </div>

        `;

    });

    return html;

}

function vistaDesplegable(pregunta){

    let html=`

        <select
            class="form-select"
            disabled>

    `;

    pregunta.opciones.forEach(op=>{

        html+=`

            <option>

                ${op.texto || "Opción"}

            </option>

        `;

    });

    html+=`

        </select>

    `;

    return html;

}

function vistaCuadricula(pregunta){

    let html = `

    <div class="table-responsive">

        <table class="table table-bordered align-middle text-center">

            <thead>

                <tr>

                    <th style="width:220px"></th>

    `;

    pregunta.columnas.forEach(columna=>{

        html += `
            <th>${columna}</th>
        `;

    });

    html += `
                </tr>
            </thead>

            <tbody>
    `;

    pregunta.filas.forEach(fila=>{

        html += `

            <tr>

                <th class="text-start">

                    ${fila}

                </th>

        `;

        pregunta.columnas.forEach(()=>{

            if(pregunta.tipo==="CUADRICULA_OPCIONES"){

                html += `

                    <td>

                        <input
                            type="radio"
                            disabled>

                    </td>

                `;

            }else{

                html += `

                    <td>

                        <input
                            type="checkbox"
                            disabled>

                    </td>

                `;

            }

        });

        html += `
            </tr>
        `;

    });

    html += `

            </tbody>

        </table>

    </div>

    `;

    return html;

}

function agregarOpcion(index){

    preguntas[index].opciones.push({

        texto:"",

        correcta:false

    });

    renderPreguntas();

}

function editarOpcion(
    pregunta,
    opcion,
    texto
){

    preguntas[pregunta]
.opciones[opcion]
.texto = texto;

guardarAutomaticamente();
}

// ======================================
// RESPUESTA CORRECTA
// ======================================

function marcarCorrecta(
    pregunta,
    opcion
){

    const tipo =
    preguntas[pregunta].tipo;

    if(tipo==="CASILLAS"){

        preguntas[pregunta]
        .opciones[opcion]
        .correcta =

        !preguntas[pregunta]
        .opciones[opcion]
        .correcta;

    }else{

        preguntas[pregunta]
        .opciones
        .forEach(o=>{

            o.correcta = false;

        });

        preguntas[pregunta]
        .opciones[opcion]
        .correcta = true;

    }

    renderPreguntas();

}

function eliminarOpcion(
    pregunta,
    opcion
){

    if(
        preguntas[pregunta]
        .opciones.length===1
    ){

        return;

    }

    preguntas[pregunta]
    .opciones
    .splice(opcion,1);

    renderPreguntas();

}
// ======================================
// ELIMINAR PREGUNTA
// ======================================

function eliminarPregunta(index){

    preguntas.splice(index,1);

    renderPreguntas();

}

function agregarFila(index){

    preguntas[index].filas.push("Nueva fila");

    renderPreguntas();

}

function eliminarFila(index,fila){

    if(preguntas[index].filas.length===1){
        return;
    }

    preguntas[index].filas.splice(fila,1);

    renderPreguntas();

}

function agregarColumna(index){

    preguntas[index].columnas.push("Nueva columna");

    renderPreguntas();

}

function eliminarColumna(index,columna){

    if(preguntas[index].columnas.length===1){
        return;
    }

    preguntas[index].columnas.splice(columna,1);

    renderPreguntas();

}

// ======================================
// DUPLICAR PREGUNTA
// ======================================

function duplicarPregunta(index){

    const copia = JSON.parse(

        JSON.stringify(

            preguntas[index]

        )

    );

    preguntas.splice(

        index + 1,

        0,

        copia

    );

    renderPreguntas();

    guardarAutomaticamente();

}

// ======================================
// DUPLICAR
// ======================================

function duplicarOpcion(pregunta, opcion){

    const copia = {

        ...preguntas[pregunta].opciones[opcion]

    };

    preguntas[pregunta].opciones.splice(

        opcion + 1,

        0,

        copia

    );

    renderPreguntas();

    guardarAutomaticamente();

}

// ======================================
// SUBIR
// ======================================

function subirPregunta(index){

    if(index===0){

        return;

    }

    [
        preguntas[index-1],
        preguntas[index]

    ]=[

        preguntas[index],
        preguntas[index-1]

    ];

    renderPreguntas();

}

// ======================================
// BAJAR
// ======================================

function bajarPregunta(index){

    if(index===preguntas.length-1){

        return;

    }

    [
        preguntas[index+1],
        preguntas[index]

    ]=[

        preguntas[index],
        preguntas[index+1]

    ];

    renderPreguntas();

}

function toggleConfiguracion(index){

    preguntas[index].configuracionAbierta =
    !preguntas[index].configuracionAbierta;

    renderPreguntas();

}


function validarPreguntas(){

    for(let i = 0; i < preguntas.length; i++){

        const pregunta = preguntas[i];

        if(!pregunta.pregunta.trim()){

            Swal.fire({
                icon:"warning",
                title:"Pregunta incompleta",
                text:`La pregunta ${i + 1} no tiene enunciado.`
            });

            return false;

        }

        if(pregunta.puntaje <= 0){

            Swal.fire({
                icon:"warning",
                title:"Puntaje inválido",
                text:`La pregunta ${i + 1} debe tener un puntaje mayor que cero.`
            });

            return false;

        }

        if(
            pregunta.tipo === "VARIAS_OPCIONES" ||
            pregunta.tipo === "CASILLAS" ||
            pregunta.tipo === "DESPLEGABLE"
        ){

            if(pregunta.opciones.length < 2){

                Swal.fire({
                    icon:"warning",
                    title:"Opciones insuficientes",
                    text:`La pregunta ${i + 1} debe tener mínimo dos opciones.`
                });

                return false;

            }

            for(const opcion of pregunta.opciones){

                if(!opcion.texto.trim()){

                    Swal.fire({
                        icon:"warning",
                        title:"Opción vacía",
                        text:`Hay opciones vacías en la pregunta ${i + 1}.`
                    });

                    return false;

                }

            }

            const correctas =
                pregunta.opciones.filter(o => o.correcta).length;

            if(pregunta.tipo !== "CASILLAS" && correctas !== 1){

                Swal.fire({
                    icon:"warning",
                    title:"Respuesta correcta",
                    text:`La pregunta ${i + 1} debe tener exactamente una respuesta correcta.`
                });

                return false;

            }

            if(pregunta.tipo === "CASILLAS" && correctas === 0){

                Swal.fire({
                    icon:"warning",
                    title:"Respuesta correcta",
                    text:`La pregunta ${i + 1} debe tener al menos una respuesta correcta.`
                });

                return false;

            }

        }

    }

    return true;

}

function guardarAutomaticamente(){

    clearTimeout(temporizadorGuardado);

    temporizadorGuardado = setTimeout(async ()=>{

        console.log("Autoguardando...");

        // Más adelante aquí llamaremos guardarTodasPreguntas()
        // o un endpoint específico para borradores.

    },1500);

}

async function guardarTodasPreguntas(){

    if(!validarPreguntas()){

        return;

    }

    try{

        const respuesta = await fetch(

            `/api/evaluaciones/${window.evaluacionSeleccionada}/preguntas`,

            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
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

        await Swal.fire({

            icon:"success",
            title:"Preguntas guardadas",
            text:"La evaluación fue guardada correctamente.",
            timer:1500,
            showConfirmButton:false

        });

        // Vaciar el arreglo
        preguntas = [];

        // Limpiar el contenedor
        renderPreguntas();

        // Cerrar el modal de preguntas
        bootstrap.Modal
            .getInstance(
                document.getElementById("modalPreguntas")
            )
            .hide();

        // Volver a cargar las evaluaciones
        await cargarEvaluaciones();

        // Mostrar nuevamente el modal de evaluaciones
        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById("modalEvaluaciones")
            )
            .show();

    }catch(error){

        console.error(error);

    }

}