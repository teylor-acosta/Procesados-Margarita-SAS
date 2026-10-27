/* ==========================================
   VALIDAR CERTIFICADO
========================================== */


const estadoCargando =
    document.getElementById(
        "estadoCargando"
    );


const certificadoValido =
    document.getElementById(
        "certificadoValido"
    );


const certificadoInvalido =
    document.getElementById(
        "certificadoInvalido"
    );


const nombreEmpleado =
    document.getElementById(
        "nombreEmpleado"
    );


const nombreCapacitacion =
    document.getElementById(
        "nombreCapacitacion"
    );


const nota =
    document.getElementById(
        "nota"
    );


const fechaEmision =
    document.getElementById(
        "fechaEmision"
    );


const codigoCertificado =
    document.getElementById(
        "codigoCertificado"
    );


const mensajeError =
    document.getElementById(
        "mensajeError"
    );


/* ==========================================
   OBTENER TOKEN DE LA URL
========================================== */

function obtenerToken() {

    const partes =
        window.location.pathname
            .split("/")
            .filter(Boolean);

    return partes[partes.length - 1];

}


/* ==========================================
   FORMATEAR FECHA
========================================== */

function formatearFecha(fecha) {

    if (!fecha) {

        return "-";

    }

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return fecha;

    }

    return fechaObjeto.toLocaleDateString(
        "es-CO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* ==========================================
   VALIDAR
========================================== */

async function validarCertificado() {

    try {

        const token =
            obtenerToken();


        if (!token) {

            throw new Error(
                "No se encontró el token de validación."
            );

        }


        const respuesta =
            await fetch(
                `/api/validar-certificado/${encodeURIComponent(token)}`
            );


        const datos =
            await respuesta.json();


        /* ======================================
           CERTIFICADO INVÁLIDO
        ====================================== */

        if (
            !respuesta.ok ||
            !datos.valido
        ) {

            throw new Error(
                datos.mensaje ||
                "El certificado no es válido."
            );

        }


        /* ======================================
           MOSTRAR DATOS
        ====================================== */

        const certificado =
            datos.certificado;


        nombreEmpleado.textContent =
            certificado.nombre_empleado ||
            "-";


        nombreCapacitacion.textContent =
            certificado.nombre_capacitacion ||
            "-";


        nota.textContent =
            certificado.nota
                ? `${certificado.nota}%`
                : "-";


        fechaEmision.textContent =
            formatearFecha(
                certificado.fecha_emision
            );


        codigoCertificado.textContent =
            certificado.codigo ||
            "-";


        /* ======================================
           MOSTRAR CERTIFICADO
        ====================================== */

        estadoCargando.style.display =
            "none";


        certificadoValido.style.display =
            "block";


    }

    catch (error) {

        console.error(
            "Error validando certificado:",
            error
        );


        mensajeError.textContent =
            error.message;


        estadoCargando.style.display =
            "none";


        certificadoInvalido.style.display =
            "block";

    }

}


/* ==========================================
   INICIAR
========================================== */

validarCertificado();