// ============================================
// CERTIFICADO DE CAPACITACIÓN
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    cargarCertificado();

    configurarEventos();

});


// ============================================
// OBTENER ID DEL CERTIFICADO
// ============================================

function obtenerCertificadoId(){

    const partes =
        window.location.pathname
            .split("/")
            .filter(Boolean);

    return partes[partes.length - 1];

}


// ============================================
// CARGAR CERTIFICADO
// ============================================

async function cargarCertificado(){

    const certificadoId =
        obtenerCertificadoId();


    if(!certificadoId){

        mostrarError(
            "No se encontró el certificado."
        );

        return;

    }


    console.log(
        "CERTIFICADO ID:",
        certificadoId
    );


    try{

        const respuesta =
            await fetch(
                `/api/certificados-capacitacion/${certificadoId}`
            );


        const datos =
            await respuesta.json();


        console.log(
            "DATOS CERTIFICADO:",
            datos
        );


        if(!datos.success){

            mostrarError(
                datos.message ||
                "No fue posible cargar el certificado."
            );

            return;

        }


        if(!datos.certificado){

            mostrarError(
                "No se encontraron los datos del certificado."
            );

            return;

        }

        const fuenteDancing = document.createElement("link");

fuenteDancing.rel = "stylesheet";

fuenteDancing.href =
    "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap";

document.head.appendChild(fuenteDancing);

await new Promise(resolve => {

    fuenteDancing.onload = resolve;

    fuenteDancing.onerror = resolve;

});

await document.fonts.ready;

await document.fonts.load(
    '48px "Dancing Script"'
);


        await document.fonts.ready;

await document.fonts.load(
    '48px "Dancing Script"'
);


        renderizarCertificado(
            datos.certificado
        );

    }

    catch(error){

        console.error(
            "ERROR CARGANDO CERTIFICADO:",
            error
        );


        mostrarError(
            "Ocurrió un error al cargar el certificado."
        );

    }

}



// ============================================
// RENDERIZAR CERTIFICADO
// ============================================

function renderizarCertificado(certificado){

    console.log(
        "CERTIFICADO RECIBIDO:",
        certificado
    );


    // ========================================
    // MOSTRAR CONTENEDOR
    // ========================================

    document.getElementById(
        "estadoCarga"
    ).style.display = "none";


    document.getElementById(
        "contenedorCertificado"
    ).style.display = "flex";


    // ========================================
    // DATOS PRINCIPALES
    // ========================================

    const nombreEmpleado =
        certificado.nombre_empleado || "";


    const nombreCapacitacion =
        certificado.nombre_capacitacion || "";


    const descripcion =
        certificado.descripcion || "";


    const nota =
        certificado.nota_final ?? "";


    const fechaEmision =
        formatearFecha(
            certificado.fecha_emision
        );


    const codigo =
    certificado.codigo_certificado || "";

const textoCertificado =
    certificado.texto_certificado ||
    "Por haber completado satisfactoriamente la capacitación de";

    // ========================================
// GENERAR QR DEL CERTIFICADO
// ========================================

const qrCertificado =
    document.getElementById("qrCertificado");

if (qrCertificado && certificado.id) {

    const urlValidacion =
        `${window.location.origin}/api/certificados-capacitacion/${certificado.id}`;

    qrCertificado.src =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlValidacion)}`;

    qrCertificado.style.display = "block";

    console.log(
        "QR GENERADO:",
        urlValidacion
    );

}


    // ========================================
    // PLANTILLA
    // ========================================

    const plantilla =
        document.getElementById(
            "plantillaCertificado"
        );


    if(certificado.plantilla){

        plantilla.src =
            normalizarRuta(
                certificado.plantilla
            );

        plantilla.style.display =
            "block";

    }
    else{

        plantilla.style.display =
            "none";

    }


    // ========================================
    // SELLO
    // ========================================

    configurarImagen(
        "selloCertificado",
        certificado.sello
    );


    // ========================================
    // FIRMA IZQUIERDA
    // ========================================

    configurarImagen(
        "firmaIzquierda",
        certificado.firma_izquierda
    );


    // ========================================
    // FIRMA DERECHA
    // ========================================

    configurarImagen(
        "firmaDerecha",
        certificado.firma_derecha
    );


    // ========================================
    // CONFIGURACIÓN
    // ========================================

    let configuracion = [];


try {

    if (certificado.configuracion) {

        configuracion =
            typeof certificado.configuracion === "string"
                ? JSON.parse(certificado.configuracion)
                : certificado.configuracion;


        // ========================================
        // LA CONFIGURACIÓN VIENE COMO:
        //
        // {
        //     elementos: [...]
        // }
        // ========================================

        if (
            configuracion &&
            !Array.isArray(configuracion) &&
            Array.isArray(configuracion.elementos)
        ) {

            configuracion =
                configuracion.elementos;

        }

    }

}
catch (error) {

    console.error(
        "ERROR PARSEANDO CONFIGURACIÓN:",
        error
    );

    configuracion = [];

}


console.log(
    "ELEMENTOS CONFIGURACIÓN:",
    configuracion
);


    console.log(
        "CONFIGURACIÓN CERTIFICADO:",
        configuracion
    );


    // ========================================
    // RENDERIZAR TEXTOS
    // ========================================

    renderizarElementos(
    configuracion,
    {
        nombreEmpleado,
        nombreCapacitacion,
        descripcion,
        nota,
        fechaEmision,
        codigo,
        textoCertificado
    }
);


    // ========================================
    // APLICAR CONFIGURACIÓN A IMÁGENES
    // ========================================

    aplicarConfiguracionImagen(
        configuracion,
        "sello",
        "selloCertificado"
    );

aplicarConfiguracionImagen(
    configuracion,
    "qr",
    "qrCertificado"
);

    aplicarConfiguracionImagen(
        configuracion,
        "firmaIzquierda",
        "firmaIzquierda"
    );


    aplicarConfiguracionImagen(
        configuracion,
        "firmaDerecha",
        "firmaDerecha"
    );

}


// ============================================
// RENDERIZAR ELEMENTOS DE CONFIGURACIÓN
// ============================================

function renderizarElementos(
    configuracion,
    datos
){

    const contenedor =
        document.getElementById(
            "elementosTexto"
        );


    contenedor.innerHTML = "";


    if(!Array.isArray(configuracion)){

        console.warn(
            "La configuración no es un arreglo."
        );

        return;

    }


    configuracion.forEach(elemento => {

        if(!elemento){

            return;

        }


        const tipo =
            String(
                elemento.tipo || ""
            ).toLowerCase();


        // ====================================
        // IGNORAR IMÁGENES
        // ====================================

        if(
            tipo === "imagen" ||
            tipo === "image"
        ){

            return;

        }


        // ====================================
        // OBTENER CONTENIDO
        // ====================================

        let contenido =
    obtenerContenidoElemento(
        elemento,
        datos
    );


        // ====================================
        // REEMPLAZAR VARIABLES
        // ====================================

        contenido =
            reemplazarVariables(
                contenido,
                datos
            );


        // ====================================
        // CREAR ELEMENTO
        // ====================================

        const div =
            document.createElement("div");


        div.className =
            "elemento-texto";


        div.innerHTML =
            contenido;


        // ========================================
// POSICIÓN
// ========================================

aplicarPosicion(
    div,
    elemento
);


// ========================================
// CENTRAR NOMBRE DEL EMPLEADO
// ========================================

const idElemento =
    String(elemento.id || "").toLowerCase();

if(
    idElemento === "previewnombre" ||
    idElemento === "nombreempleado" ||
    idElemento === "empleado"
){

    div.style.left = "50%";

    div.style.width = "max-content";

    div.style.maxWidth = "none";

    div.style.whiteSpace = "nowrap";

    div.style.textAlign = "center";

    div.style.transform = "translateX(-50%)";

}


        // ====================================
        // ESTILO
        // ====================================

        aplicarEstiloTexto(
            div,
            elemento
        );


        contenedor.appendChild(
            div
        );

    });

}

// ============================================
// OBTENER CONTENIDO REAL DEL ELEMENTO
// ============================================

function obtenerContenidoElemento(
    elemento,
    datos
){

    const id =
        String(
            elemento.id || ""
        ).toLowerCase();


    // ========================================
    // NOMBRE DEL EMPLEADO
    // ========================================

    if(
        id === "previewnombre" ||
        id === "nombreempleado" ||
        id === "empleado"
    ){

        return datos.nombreEmpleado || "";

    }


    // ========================================
    // NOMBRE DE LA CAPACITACIÓN
    // ========================================

    if(
        id === "previewcurso" ||
        id === "previewcapacitacion" ||
        id === "curso" ||
        id === "capacitacion"
    ){

        return datos.nombreCapacitacion || "";

    }


    // ========================================
    // NOTA
    // ========================================

    if(
        id === "previewnota" ||
        id === "nota"
    ){

        return datos.nota !== ""
            ? `${datos.nota}%`
            : "";

    }


    // ========================================
    // FECHA
    // ========================================

    if(
        id === "previewfecha" ||
        id === "fecha"
    ){

        return datos.fechaEmision || "";

    }


    // ========================================
    // TEXTO PRINCIPAL
    // ========================================

    if(
        id === "previewtextoprincipal" ||
        id === "textoprincipal"
    ){

        return datos.textoCertificado || "";

    }


    // ========================================
    // CUALQUIER OTRO ELEMENTO
    // ========================================

    return elemento.html || "";

}

// ============================================
// REEMPLAZAR VARIABLES
// ============================================

function reemplazarVariables(
    contenido,
    datos
){

    if(!contenido){

        return "";

    }


    return contenido

        .replace(
            /\{\{nombreEmpleado\}\}/gi,
            datos.nombreEmpleado
        )

        .replace(
            /\{\{nombre_empleado\}\}/gi,
            datos.nombreEmpleado
        )

        .replace(
            /\{\{nombreCapacitacion\}\}/gi,
            datos.nombreCapacitacion
        )

        .replace(
            /\{\{nombre_capacitacion\}\}/gi,
            datos.nombreCapacitacion
        )

        .replace(
            /\{\{capacitacion\}\}/gi,
            datos.nombreCapacitacion
        )

        .replace(
            /\{\{descripcion\}\}/gi,
            datos.descripcion
        )

        .replace(
    /\{\{textoCertificado\}\}/gi,
    datos.textoCertificado
)

        .replace(
            /\{\{nota\}\}/gi,
            datos.nota
        )

        .replace(
            /\{\{fecha\}\}/gi,
            datos.fechaEmision
        )

        .replace(
            /\{\{fechaEmision\}\}/gi,
            datos.fechaEmision
        )

        .replace(
            /\{\{codigo\}\}/gi,
            datos.codigo
        )

        .replace(
            /\{\{codigoCertificado\}\}/gi,
            datos.codigo
        );

}


// ============================================
// POSICIÓN
// ============================================

function aplicarPosicion(
    elemento,
    configuracion
){

    // ========================================
    // POSICIONAMIENTO
    // ========================================

    elemento.style.position = "absolute";

    elemento.style.margin = "0";

    elemento.style.transform = "none";


    // ========================================
    // LEFT
    // ========================================

    if(configuracion.left !== undefined){

        elemento.style.left =
            convertirMedida(
                configuracion.left
            );

    }


    // ========================================
    // TOP
    // ========================================

    if(configuracion.top !== undefined){

        elemento.style.top =
            convertirMedida(
                configuracion.top
            );

    }


    // ========================================
    // WIDTH
    // ========================================

    if(configuracion.width !== undefined){

        elemento.style.width =
            convertirMedida(
                configuracion.width
            );

    }


    // ========================================
    // HEIGHT
    // ========================================

    if(configuracion.height !== undefined){

        elemento.style.height =
            convertirMedida(
                configuracion.height
            );

    }


    // ========================================
    // BOX SIZING
    // ========================================

    elemento.style.boxSizing = "border-box";

}


// ============================================
// ESTILOS DE TEXTO
// ============================================

function aplicarEstiloTexto(
    elemento,
    configuracion
){

    // ========================================
    // FUENTE
    // ========================================

    if(configuracion.fontFamily){

    elemento.style.setProperty(
        "font-family",
        configuracion.fontFamily,
        "important"
    );

}


    // ========================================
    // TAMAÑO
    // ========================================

    if(configuracion.fontSize !== undefined){

        elemento.style.fontSize =
            convertirMedida(
                configuracion.fontSize
            );

    }


    // ========================================
    // PESO
    // ========================================

    if(configuracion.fontWeight){

        elemento.style.fontWeight =
            configuracion.fontWeight;

    }


    // ========================================
    // ESTILO
    // ========================================

    if(configuracion.fontStyle){

        elemento.style.fontStyle =
            configuracion.fontStyle;

    }


    // ========================================
    // ALINEACIÓN
    // ========================================

    if(configuracion.textAlign){

        elemento.style.textAlign =
            configuracion.textAlign;

    }


    // ========================================
    // COLOR
    // ========================================

    if(configuracion.color){

        elemento.style.color =
            convertirColor(
                configuracion.color
            );

    }


    // ========================================
    // EVITAR SALTOS DE LÍNEA
    // ========================================

    elemento.style.whiteSpace =
        "nowrap";

    elemento.style.overflow =
        "visible";

}


// ============================================
// CONFIGURAR IMAGEN
// ============================================

function configurarImagen(
    id,
    ruta
){

    const elemento =
        document.getElementById(id);


    if(!elemento){

        return;

    }


    if(!ruta){

        elemento.style.display =
            "none";

        return;

    }


    elemento.src =
        normalizarRuta(ruta);


    elemento.style.display =
        "block";

}


// ============================================
// CONFIGURAR IMAGEN SEGÚN POSICIÓN
// ============================================

function aplicarConfiguracionImagen(
    configuracion,
    nombre,
    idElemento
){

    if(!Array.isArray(configuracion)){

        return;

    }


    // ========================================
    // BUSCAR CONFIGURACIÓN DE LA IMAGEN
    // ========================================

    const nombresPermitidos = {

        sello: [
            "sello",
            "previewsello"
        ],

        firmaizquierda: [
            "firmaizquierda",
            "previewfirmaizquierda"
        ],

        firmaderecha: [
            "firmaderecha",
            "previewfirmaderecha"
        ],

        qr: [
            "qr",
            "previewqr",
            "codigoqr",
            "previewcodigoqr"
        ]

    };


    const nombreBuscado =
        String(nombre || "")
            .toLowerCase();


    const idsPermitidos =
        nombresPermitidos[nombreBuscado]
        || [nombreBuscado];


    const elemento =
        configuracion.find(item => {

            if(!item){

                return false;

            }


            const id =
                String(
                    item.id || ""
                )
                .toLowerCase();


            return idsPermitidos.includes(id);

        });


    if(!elemento){

        console.warn(
            "No se encontró configuración para:",
            nombre,
            configuracion
        );

        return;

    }


    // ========================================
    // BUSCAR IMAGEN EN EL CERTIFICADO
    // ========================================

    const imagen =
        document.getElementById(
            idElemento
        );


    if(!imagen){

        console.warn(
            "No existe elemento:",
            idElemento
        );

        return;

    }


    // ========================================
    // POSICIONAMIENTO
    // ========================================

    imagen.style.position = "absolute";

    imagen.style.margin = "0";

    imagen.style.transform = "none";


    // ========================================
    // LEFT
    // ========================================

    if(elemento.left !== undefined){

        imagen.style.left =
            convertirMedida(
                elemento.left
            );

    }


    // ========================================
    // TOP
    // ========================================

    if(elemento.top !== undefined){

        imagen.style.top =
            convertirMedida(
                elemento.top
            );

    }


    // ========================================
    // WIDTH
    // ========================================

    if(
        elemento.width !== undefined &&
        elemento.width !== null &&
        elemento.width !== "auto"
    ){

        imagen.style.width =
            convertirMedida(
                elemento.width
            );

    }


    // ========================================
    // HEIGHT
    // ========================================

    if(
        elemento.height !== undefined &&
        elemento.height !== null &&
        elemento.height !== "auto"
    ){

        imagen.style.height =
            convertirMedida(
                elemento.height
            );

    }


    // ========================================
    // EVITAR RESTRICCIONES DEL CSS
    // ========================================

    imagen.style.maxWidth = "none";

    imagen.style.maxHeight = "none";

    // ========================================
// ASEGURAR VISIBILIDAD
// ========================================

imagen.style.display = "block";

// ========================================
// ASEGURAR BOX-SIZING
// ========================================

imagen.style.boxSizing = "border-box";


    console.log(
        "✅ CONFIGURACIÓN APLICADA:",
        nombre,
        elemento
    );

}

// ============================================
// CONVERTIR MEDIDA
// ============================================

// El editor de certificados trabaja sobre un
// lienzo de 900px de ancho.
//
// El certificado final utiliza 1123px.
// Por eso debemos escalar las posiciones,
// tamaños y fuentes guardadas.
//
// 1123 / 900 = 1.2477

const ESCALA_CERTIFICADO = 1123 / 900;

function limpiarFuente(fuente){

    if(!fuente){

        return "";

    }

    return String(fuente)
        .replace(/\\/g, "")
        .replace(/['"]/g, "")
        .trim();

}


// ============================================
// CONVERTIR MEDIDA
// ============================================

function convertirMedida(valor){

    if(valor === null || valor === undefined){

        return "";

    }

    if(typeof valor === "number"){

        return `${valor}px`;

    }

    const texto =
        String(valor).trim();

    if(
        texto.endsWith("px") ||
        texto.endsWith("%") ||
        texto.endsWith("em") ||
        texto.endsWith("rem")
    ){

        return texto;

    }

    const numero =
        Number(texto);

    if(!isNaN(numero)){

        return `${numero}px`;

    }

    return texto;

}


// ============================================
// CONVERTIR COLOR
// ============================================

function convertirColor(
    color
){

    if(!color){

        return "";

    }


    return String(color)
        .replace(/\\/g, "")
        .replace(/"/g, "");

}


// ============================================
// NORMALIZAR RUTA
// ============================================

function normalizarRuta(
    ruta
){

    if(!ruta){

        return "";

    }


    ruta =
        String(ruta)
            .replace(/\\/g, "/");


    // Ya es URL absoluta
    if(
        ruta.startsWith("http://") ||
        ruta.startsWith("https://")
    ){

        return ruta;

    }


    // Ya es ruta del servidor
    if(ruta.startsWith("/")){

        return ruta;

    }


    return "/" + ruta;

}


// ============================================
// FORMATEAR FECHA
// ============================================

function formatearFecha(
    fecha
){

    if(!fecha){

        return "";

    }


    const fechaObj =
        new Date(fecha);


    if(isNaN(fechaObj.getTime())){

        return fecha;

    }


    return fechaObj.toLocaleDateString(
        "es-CO",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ============================================
// MOSTRAR ERROR
// ============================================

function mostrarError(
    mensaje
){

    const carga =
        document.getElementById(
            "estadoCarga"
        );


    const error =
        document.getElementById(
            "estadoError"
        );


    const mensajeError =
        document.getElementById(
            "mensajeError"
        );


    if(carga){

        carga.style.display =
            "none";

    }


    if(error){

        error.style.display =
            "flex";

    }


    if(mensajeError){

        mensajeError.textContent =
            mensaje;

    }

}


// ============================================
// EVENTOS
// ============================================

function configurarEventos(){

    const btnVolver =
        document.getElementById(
            "btnVolver"
        );


    btnVolver?.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );


    const btnVolverError =
        document.getElementById(
            "btnVolverError"
        );


    btnVolverError?.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );


    const btnImprimir =
        document.getElementById(
            "btnImprimir"
        );


    btnImprimir?.addEventListener(
        "click",
        () => {

            window.print();

        }
    );

}