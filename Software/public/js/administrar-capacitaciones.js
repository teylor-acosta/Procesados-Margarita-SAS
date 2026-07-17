document.addEventListener("DOMContentLoaded", async () => {

    await cargarDatos();

    // ==========================================
    // MODAL NUEVA CAPACITACIÓN
    // ==========================================

    const btnNuevaCapacitacion =
        document.getElementById(
            "btnNuevaCapacitacion"
        );

    const modalNuevaCapacitacion =
        new bootstrap.Modal(
            document.getElementById(
                "modalNuevaCapacitacion"
            )
        );

    btnNuevaCapacitacion.addEventListener(
        "click",
        () => {

            modalNuevaCapacitacion.show();

        }
    );

    // ==========================================
    // GUARDAR (POR AHORA SOLO PRUEBA)
    // ==========================================

document
    .getElementById("btnGuardarCurso")
    .addEventListener(
        "click",
        async () => {

            try {

                const formData = new FormData();

                formData.append(
                    "titulo",
                    document.getElementById(
                        "tituloCurso"
                    ).value
                );

                formData.append(
                    "descripcion",
                    document.getElementById(
                        "descripcionCurso"
                    ).value
                );

                formData.append(
                    "fecha_limite",
                    document.getElementById(
                        "fechaLimite"
                    ).value
                );

                formData.append(
                    "estado",
                    document.getElementById(
                        "estadoCurso"
                    ).value
                );

                formData.append(
                    "obligatorio",
                    document.getElementById(
                        "obligatorioCurso"
                    ).value
                );

                const imagen =
                    document.getElementById(
                        "imagenCurso"
                    ).files[0];

                if (imagen) {

                    formData.append(
                        "imagen",
                        imagen
                    );

                }

                const respuesta =
                    await fetch(
                        "/api/cursos",
                        {

                            method: "POST",

                            body: formData

                        }
                    );

                const data =
                    await respuesta.json();

                if (data.success) {

                    Swal.fire({

                        icon: "success",

                        title: "Capacitación creada",

                        text: "La capacitación fue registrada correctamente.",

                        timer: 1800,

                        showConfirmButton: false

                    });

                    document
                        .getElementById(
                            "tituloCurso"
                        ).value = "";

                    document
                        .getElementById(
                            "descripcionCurso"
                        ).value = "";

                    document
                        .getElementById(
                            "fechaLimite"
                        ).value = "";

                    document
                        .getElementById(
                            "imagenCurso"
                        ).value = "";

                    document
                        .getElementById(
                            "estadoCurso"
                        ).value = "ACTIVO";

                    document
                        .getElementById(
                            "obligatorioCurso"
                        ).value = "1";

                    modalNuevaCapacitacion.hide();

                    await cargarDatos();

                } else {

                    Swal.fire({

                        icon: "error",

                        title: "Error",

                        text: data.mensaje

                    });

                }

            } catch (error) {

                console.error(error);

                Swal.fire({

                    icon: "error",

                    title: "Error",

                    text: "Ocurrió un error al crear la capacitación."

                });

            }

        }

    );

});

// ==========================================
// CARGAR DATOS
// ==========================================

async function cargarDatos(){

    try{

        const respuesta = await fetch(
            "/api/administrar-capacitaciones"
        );

        const data = await respuesta.json();

        if(!data.success){

            return;

        }

        renderDashboard(
            data.dashboard
        );

        renderCapacitaciones(
            data.capacitaciones
        );

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard(dashboard){

    document.getElementById(
        "totalCapacitaciones"
    ).textContent =
    dashboard.totalCapacitaciones;

    document.getElementById(
        "totalAsignados"
    ).textContent =
    dashboard.totalAsignados;

    document.getElementById(
        "totalActivas"
    ).textContent =
    dashboard.totalActivas;

    document.getElementById(
        "totalFinalizadas"
    ).textContent =
    dashboard.totalFinalizadas;

}

// ==========================================
// LISTADO
// ==========================================

function renderCapacitaciones(capacitaciones){

    const contenedor =
    document.getElementById(
        "contenedorCapacitaciones"
    );

    let html = "";

    capacitaciones.forEach(cap=>{

        html += `

        <div class="card-capacitacion">

            <div class="card-header">

                <h3>${cap.titulo}</h3>

                <span class="estado ${cap.estado.toLowerCase()}">

                    ${cap.estado}

                </span>

            </div>

            <div class="card-body">

                <p>

                    <strong>Módulos:</strong>

                    ${cap.contenido}

                </p>

                <p>

                    <strong>Empleados:</strong>

                    ${cap.empleados}

                </p>

                ${
                    cap.tipo === "SISTEMA"
                    ?
                    `<span class="badge bg-success">
                        Sistema ERP
                    </span>`
                    :
                    ""
                }

            </div>

            <div class="card-footer">

                <button
                    class="btn-card btn-editar">

                    <i class="fas fa-pen"></i>

                </button>

                <button
    class="btn-card btn-vista"
    onclick="verCapacitacion(${cap.id}, '${cap.tipo}')">

    <i class="fas fa-eye"></i>

</button>

                <button
                    class="btn-card btn-eliminar">

                    <i class="fas fa-trash"></i>

                </button>

            </div>

        </div>

        `;

    });

    contenedor.innerHTML = html;

}

// ==========================================
// VER CAPACITACIÓN
// ==========================================

function verCapacitacion(id, tipo){

    if(tipo === "SISTEMA"){

        window.location.href =
            "/administrar-induccion";

        return;

    }

    window.location.href =
        `/administrar-curso/${id}`;

}



