const id = window.location.pathname.split('/').pop();

const nombreEmpleado = document.getElementById('nombreEmpleado');
const codigoEmpleado = document.getElementById('codigoEmpleado');
const cargoEmpleado = document.getElementById('cargoEmpleado');
const areaEmpleado = document.getElementById('areaEmpleado');
const sedeEmpleado = document.getElementById('sedeEmpleado');

const fotoEmpleado = document.getElementById('fotoEmpleado');

const nombreCarnet = document.getElementById('nombreCarnet');
const documentoCarnet = document.getElementById('documentoCarnet');
const rhCarnet = document.getElementById('rhCarnet');
const cargoCarnet = document.getElementById('cargoCarnet');

const contenedorDocumentos =
document.getElementById('contenedorDocumentos');

/* =========================================
   📊 ACTUALIZAR PROGRESO
========================================= */

function actualizarProgreso(documentosSubidos){

    const total = documentosBase.length;

    const completados = documentosSubidos.length;

    const porcentaje = Math.round(

        (completados / total) * 100

    );

    const barra = document.querySelector(
        '.progress-bar'
    );

    const texto = document.querySelector(
        '.porcentaje-documentos'
    );

    if(barra){

        barra.style.width =
        `${porcentaje}%`;

    }

    if(texto){

        texto.textContent =
        `${porcentaje}%`;

    }

}
/* =========================================
   🚀 CARGAR EMPLEADO
========================================= */

async function cargarEmpleado(){

    try{

        const response =
        await fetch(`/api/empleado/${id}`);

        const data =
        await response.json();

        if(!data.ok){

            alert('Empleado no encontrado');
            return;

        }

        const emp = data.empleado;

        nombreEmpleado.textContent =
        emp.nombre;

        codigoEmpleado.textContent =
        emp.codigo;

        cargoEmpleado.textContent =
        emp.cargo || 'Sin cargo';

        areaEmpleado.textContent =
        emp.area || 'Sin área';

        sedeEmpleado.textContent =
        emp.sede || 'Sin sede';

        fotoEmpleado.src =
        emp.foto || '/img/defecto.jpg';

        nombreCarnet.textContent =
        emp.nombre;

        documentoCarnet.textContent =
        emp.numero_documento ||
        'Sin documento';

        rhCarnet.textContent =
        `RH: ${emp.rh || 'N/A'}`;

        cargoCarnet.textContent =
        emp.cargo || 'Sin cargo';

        cargarDocumentos();

    }catch(error){

        console.log(error);

    }

}


/* =========================================
   📂 DOCUMENTOS BASE
========================================= */

const documentosBase = [

    'Cédula',
    'Hoja de vida',
    'Contrato',
    'EPS',
    'ARL',
    'Pensión',
    'Examen médico',
    'Certificados'

];


/* =========================================
   🎯 RENDER DOCUMENTOS
========================================= */

async function cargarDocumentos(){

    contenedorDocumentos.innerHTML = "";

    try{

        const response = await fetch(
            `/api/documentos/${id}`
        );

        const data =
        await response.json();

        const documentosSubidos =
        data.documentos || [];

        actualizarProgreso(documentosSubidos);

        documentosBase.forEach((doc, index) => {

            const inputId =
            `archivo_${index}`;

            const documentoExistente =

            documentosSubidos.find(d =>

                d.tipo_documento === doc

            );

            const card =
            document.createElement('div');

            card.className =
            "card-documento";

            if(documentoExistente){

                card.innerHTML = `

                    <div class="header-documento">

                        <div class="icono-documento">

                            <i class="fas fa-file-pdf"></i>

                        </div>

                        <div>

                            <h5>${doc}</h5>

                            <small>

                                ${documentoExistente.nombre_archivo}

                            </small>

                        </div>

                    </div>

                    <div class="acciones-documento">

                        <a

                            href="/api/ver-documento/${documentoExistente.id}"
                            target="_blank"

                            class="btn btn-primary"

                        >

                            <i class="fas fa-eye"></i>
                            Ver

                        </a>

                        <button

                            class="btn btn-danger"

                            onclick="eliminarDocumento(${documentoExistente.id})"

                        >

                            <i class="fas fa-trash"></i>
                            Eliminar

                        </button>

                    </div>

                    <div class="estado-doc">

                        <span class="badge bg-success">

                            Documento cargado

                        </span>

                    </div>

                `;

            }

            else{

                card.innerHTML = `

                    <div class="header-documento">

                        <div class="icono-documento">

                            <i class="fas fa-file-pdf"></i>

                        </div>

                        <div>

                            <h5>${doc}</h5>

                            <small>

                                Documento pendiente

                            </small>

                        </div>

                    </div>

                    <input 

                        type="file"
                        multiple

                        id="${inputId}"

                        class="form-control mb-3"

                    >

                    <button 

                        class="btn-subir"

                        onclick="subirDocumento(
                            '${doc}',
                            document.getElementById('${inputId}')
                        )"

                    >

                        <i class="fas fa-upload"></i>

                        Subir documento

                    </button>

                    <div class="estado-doc">

                        <span class="badge bg-danger">

                            Pendiente

                        </span>

                    </div>

                `;

            }

            contenedorDocumentos.appendChild(card);

        });

    }catch(error){

        console.log(error);

    }

}


/* =========================================
   📤 SUBIR DOCUMENTO
========================================= */

async function subirDocumento(
    tipoDocumento,
    inputArchivo
){

    try{

        const archivos =
        inputArchivo.files;

        if(archivos.length === 0){

            Swal.fire({

                icon:'warning',
                title:'Selecciona archivos'

            });

            return;

        }

        for(const archivo of archivos){

            const formData = new FormData();

            formData.append(
                'empleado_id',
                id
            );

            formData.append(
                'categoria',
                tipoDocumento
            );

            formData.append(
                'tipo_documento',
                tipoDocumento
            );

            formData.append(
                'archivo',
                archivo
            );

            await fetch(

                '/api/subir-documento',

                {

                    method:'POST',
                    body:formData

                }

            );

        }

        Swal.fire({

            icon:'success',

            title:'Archivos subidos correctamente',

            confirmButtonColor:'#2563eb'

        });

        cargarDocumentos();

    }catch(error){

        console.log(error);

        Swal.fire({

            icon:'error',

            title:'Error del servidor'

        });

    }

}

/* =========================================
   🗑️ ELIMINAR DOCUMENTO
========================================= */

async function eliminarDocumento(idDocumento){

    const confirmar = confirm(
        '¿Eliminar documento?'
    );

    if(!confirmar) return;

    try{

        const response = await fetch(

            `/api/documento/${idDocumento}`,

            {

                method:'DELETE'

            }

        );

        const data =
        await response.json();

        if(data.ok){

            alert(
                'Documento eliminado'
            );

            cargarDocumentos();

        }

    }catch(error){

        console.log(error);

    }

}


cargarEmpleado();