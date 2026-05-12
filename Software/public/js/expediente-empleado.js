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

const contenedorDocumentos = document.getElementById('contenedorDocumentos');


/* =========================================
   🚀 CARGAR EMPLEADO
========================================= */

async function cargarEmpleado(){

    try{

        const response = await fetch(`/api/empleado/${id}`);
        const data = await response.json();

        if(!data.ok){

            alert('Empleado no encontrado');
            return;

        }

        const emp = data.empleado;

        nombreEmpleado.textContent = emp.nombre;

        codigoEmpleado.textContent = emp.codigo;

        cargoEmpleado.textContent =
            emp.cargo || 'Sin cargo';

        areaEmpleado.textContent =
            emp.area || 'Sin área';

        sedeEmpleado.textContent =
            emp.sede || 'Sin sede';


        /* =====================================
           🪪 CARNET
        ===================================== */

        fotoEmpleado.src =
            emp.foto || '/img/defecto.jpg';

        nombreCarnet.textContent =
            emp.nombre;

        documentoCarnet.textContent =
            emp.numero_documento || 'Sin documento';

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

function cargarDocumentos(){

    contenedorDocumentos.innerHTML = "";

    documentosBase.forEach(doc => {

        const card = document.createElement('div');

        card.className = "card-documento";

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
                class="form-control mb-3"
            >

            <button class="btn-subir">

                <i class="fas fa-upload"></i>

                Subir documento

            </button>

            <div class="estado-doc">

                <span class="badge bg-danger">
                    Pendiente
                </span>

            </div>

        `;

        contenedorDocumentos.appendChild(card);

    });

}

cargarEmpleado();