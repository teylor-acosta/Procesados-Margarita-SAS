const contenedor = document.getElementById("contenedorEmpleados");
const buscador = document.getElementById("buscarEmpleado");

const totalCompleto = document.getElementById("totalCompleto");
const totalPendiente = document.getElementById("totalPendiente");
const totalIncompleto = document.getElementById("totalIncompleto");

let empleadosGlobal = [];


/* =========================================
   🚀 CARGAR EMPLEADOS
========================================= */

async function cargarEmpleados() {

    try {

        const response = await fetch(
            '/api/documentacion-empleados',
            {
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!data.ok) {

            contenedor.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar empleados
                </div>
            `;

            return;
        }

        empleadosGlobal = data.empleados.sort((a, b) => {

            const numA =
                parseInt(a.codigo.replace(/\D/g, "")) || 0;

            const numB =
                parseInt(b.codigo.replace(/\D/g, "")) || 0;

            return numA - numB;

        });

        renderizarEmpleados(empleadosGlobal);
        actualizarResumen(empleadosGlobal);

    } catch (error) {

        console.log(error);

        contenedor.innerHTML = `
            <div class="alert alert-danger">
                Error del servidor
            </div>
        `;

    }

}


/* =========================================
   🎯 RENDER EMPLEADOS
========================================= */

function renderizarEmpleados(lista) {

    contenedor.innerHTML = "";

    if (lista.length === 0) {

        contenedor.innerHTML = `
            <div class="alert alert-warning">
                No se encontraron empleados
            </div>
        `;

        return;
    }

    lista.forEach(emp => {

        const foto = emp.foto
            ? emp.foto
            : '/img/defecto.jpg';

        const progreso = 0;
        const estado = 'Incompleto';
        const color = 'danger';

        const card = document.createElement("div");

        card.className = "card-empleado";

        card.innerHTML = `

            <div class="header-card">

                <img src="${foto}" class="foto-empleado">

                <div class="info-principal">

                    <h3>${emp.nombre}</h3>

                    <p>${emp.cargo || 'Sin cargo'}</p>

                    <span class="codigo-empleado">
                        ${emp.codigo}
                    </span>

                </div>

            </div>

            <div class="estado-documentacion">

                <span class="badge bg-${color}">
                    ${estado}
                </span>

                <span class="porcentaje">
                    ${progreso}% completado
                </span>

            </div>

            <div class="progress barra-documentos">

                <div 
                    class="progress-bar bg-${color}"
                    style="width:${progreso}%"
                >
                    ${progreso}%
                </div>

            </div>

            <button 
                class="btn-expediente"
                onclick="verExpediente(${emp.id})"
            >
                <i class="fas fa-folder-open"></i>
                Ver expediente
            </button>

        `;

        contenedor.appendChild(card);

    });

}


/* =========================================
   📊 ACTUALIZAR RESUMEN
========================================= */

function actualizarResumen(lista) {

    let completos = 0;
    let pendientes = 0;
    let incompletos = 0;

    lista.forEach(emp => {

        incompletos++;

    });

    totalCompleto.textContent = completos;
    totalPendiente.textContent = pendientes;
    totalIncompleto.textContent = incompletos;

}


/* =========================================
   🔎 BUSCADOR
========================================= */

buscador.addEventListener("input", () => {

    const texto =
        buscador.value.toLowerCase();

    const filtrados =
        empleadosGlobal.filter(emp => {

        return (

            emp.nombre.toLowerCase().includes(texto) ||

            emp.codigo.toLowerCase().includes(texto) ||

            emp.numero_documento.toLowerCase().includes(texto) ||

            (emp.cargo &&
            emp.cargo.toLowerCase().includes(texto))

        );

    });

    renderizarEmpleados(filtrados);
    actualizarResumen(filtrados);

});


/* =========================================
   📁 VER EXPEDIENTE
========================================= */

function verExpediente(id) {

    window.location.href =
        `/expediente-empleado/${id}`;

}


/* =========================================
   📤 SUBIR DOCUMENTO
========================================= */

async function subirDocumento(
    empleadoId,
    categoria,
    inputFile
) {

    const archivo = inputFile.files[0];

    if (!archivo) {

        alert('Selecciona un archivo');

        return;
    }

    const formData = new FormData();

    formData.append(
        'empleado_id',
        empleadoId
    );

    formData.append(
        'categoria',
        categoria
    );

    formData.append(
        'tipo_documento',
        categoria
    );

    formData.append(
        'archivo',
        archivo
    );

    try {

        const response = await fetch(
            '/api/subir-documento',
            {
                method: 'POST',
                body: formData,
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (data.ok) {

            alert(
                'Documento subido correctamente'
            );

            location.reload();

        } else {

            alert(data.mensaje);

        }

    } catch (error) {

        console.log(error);

        alert(
            'Error al subir documento'
        );

    }

}


/* =========================================
   🚀 INIT
========================================= */

cargarEmpleados();