// ============================================
// ADMINISTRAR CERTIFICADO
// ============================================

let cursoId = null;

// Elemento seleccionado para editar
let elementoSeleccionado = null;

// ============================================
// ELEMENTOS DEL DOM
// ============================================

// Formulario
const inputPlantilla = document.getElementById("inputPlantilla");
const inputFirmaIzquierda = document.getElementById("inputFirmaIzquierda");
const inputFirmaDerecha = document.getElementById("inputFirmaDerecha");
const inputSello = document.getElementById("inputSello");

const textoPrincipal = document.getElementById("textoPrincipal");

const mostrarSello = document.getElementById("mostrarSello");
const mostrarQR = document.getElementById("mostrarQR");

const btnGuardar = document.getElementById("btnGuardar");
const toolbarFlotante =
document.getElementById("toolbarFlotante");

const tamanoToolbar =
document.getElementById("tamanoToolbar");

const btnMas =
document.getElementById("btnMas");

const btnMenos =
document.getElementById("btnMenos");

const fuenteToolbar =
document.getElementById("fuenteToolbar");

const colorToolbar =
document.getElementById("colorToolbar");

const btnNegrita =
document.getElementById("btnNegrita");

const btnCursiva =
document.getElementById("btnCursiva");

const marcoSeleccion =
document.getElementById("marcoSeleccion");

// Panel de propiedades
// Tamaño de fuente
const tamanoFuente = document.getElementById("tamanoToolbar");

const anchoImagen = document.getElementById("anchoImagen");
const altoImagen = document.getElementById("altoImagen");

// Vista previa
const previewPlantilla = document.getElementById("previewPlantilla");

const previewTextoPrincipal = document.getElementById("previewTextoPrincipal");
const previewNombre = document.getElementById("previewNombre");
const previewCurso = document.getElementById("previewCurso");
const previewNota = document.getElementById("previewNota");
const previewFecha = document.getElementById("previewFecha");

const imgFirmaIzquierda = document.getElementById("imgFirmaIzquierda");
const imgFirmaDerecha = document.getElementById("imgFirmaDerecha");
const imgSello = document.getElementById("imgSello");

const previewSello = document.getElementById("previewSello");
const previewQR = document.getElementById("previewQR");

// ============================================
// INICIO
// ============================================

document.addEventListener("DOMContentLoaded", async () => {

    obtenerCurso();

    cargarVistaPrevia();

    inicializarEventos();

    actualizarVista();

    await cargarConfiguracion();

});
// ============================================
// OBTENER CURSO
// ============================================

function obtenerCurso() {

    const partes = window.location.pathname.split("/");

    cursoId = partes[partes.length - 1];

    console.log("Curso:", cursoId);

}

// ============================================
// CARGAR VISTA PREVIA
// ============================================

function cargarVistaPrevia() {

    previewNombre.textContent = "JUAN PÉREZ GARCÍA";

    previewCurso.textContent = "POLÍTICAS AMBIENTALES";

    previewNota.textContent = "100%";

    previewFecha.textContent =
        new Date().toLocaleDateString("es-CO");

    previewTextoPrincipal.textContent =
        textoPrincipal.value;

}

// ============================================
// POSICIONES INICIALES
// ============================================

function establecerPosicionesIniciales(){

    previewNombre.style.left = "314px";
    previewNombre.style.top = "245px";

    previewTextoPrincipal.style.left = "90px";
    previewTextoPrincipal.style.top = "325px";

    previewCurso.style.left = "0px";
    previewCurso.style.top = "390px";

    previewNota.style.left = "0px";
    previewNota.style.top = "485px";

    previewFecha.style.left = "410px";
    previewFecha.style.top = "180px";

}

// ============================================
// EVENTOS
// ============================================

function inicializarEventos() {

    textoPrincipal.addEventListener(
        "input",
        actualizarTextoPrincipal
    );

    inputPlantilla.addEventListener(
        "change",
        () => mostrarImagen(inputPlantilla, previewPlantilla)
    );

    inputFirmaIzquierda.addEventListener(
        "change",
        () => mostrarImagen(inputFirmaIzquierda, imgFirmaIzquierda)
    );

    inputFirmaDerecha.addEventListener(
        "change",
        () => mostrarImagen(inputFirmaDerecha, imgFirmaDerecha)
    );

    inputSello.addEventListener(
        "change",
        () => mostrarImagen(inputSello, imgSello)
    );

    mostrarSello.addEventListener(
        "change",
        actualizarVista
    );

    mostrarQR.addEventListener(
        "change",
        actualizarVista
    );

    btnGuardar.addEventListener(
        "click",
        guardarConfiguracion
    );

}

// ============================================
// ACTUALIZAR TEXTO
// ============================================

function actualizarTextoPrincipal() {

    previewTextoPrincipal.textContent =
        textoPrincipal.value;

}

// ============================================
// MOSTRAR IMAGEN EN VISTA PREVIA
// ============================================

function mostrarImagen(input, imagen) {

    const archivo = input.files[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function (e) {

        imagen.src = e.target.result;

    };

    lector.readAsDataURL(archivo);

}

// ============================================
// ACTUALIZAR VISTA
// ============================================

function actualizarVista() {

    // Mostrar u ocultar sello
    if (previewSello) {

        previewSello.style.display =
            mostrarSello.checked ? "block" : "none";

    }

    // Mostrar u ocultar QR
    if (previewQR) {

        previewQR.style.display =
            mostrarQR.checked ? "block" : "none";

    }

}

// ============================================
// GUARDAR CONFIGURACIÓN
// ============================================

async function guardarConfiguracion() {

    try {

        const configuracion = obtenerConfiguracionCertificado();

        // ======================================
// SUBIR ARCHIVOS
// ======================================

const formData = new FormData();

const inputPlantilla =
    document.getElementById("inputPlantilla");

const inputFirmaIzquierda =
    document.getElementById("inputFirmaIzquierda");

const inputFirmaDerecha =
    document.getElementById("inputFirmaDerecha");

const inputSello =
    document.getElementById("inputSello");

if(inputPlantilla.files.length){

    formData.append(
        "plantilla",
        inputPlantilla.files[0]
    );

}

if(inputFirmaIzquierda.files.length){

    formData.append(
        "firma_izquierda",
        inputFirmaIzquierda.files[0]
    );

}

if(inputFirmaDerecha.files.length){

    formData.append(
        "firma_derecha",
        inputFirmaDerecha.files[0]
    );

}

if(inputSello.files.length){

    formData.append(
        "sello",
        inputSello.files[0]
    );

}

if(formData.has("plantilla") ||

   formData.has("firma_izquierda") ||

   formData.has("firma_derecha") ||

   formData.has("sello")){

    const respuestaUpload =
        await fetch(

            `/api/certificados/upload/${cursoId}`,

            {

                method:"POST",

                body:formData

            }

        );

    const resultadoUpload =
        await respuestaUpload.json();

    if(!resultadoUpload.ok){

        throw new Error(
            resultadoUpload.mensaje
        );

    }

}

const respuesta = await fetch("/api/certificados", {

    method: "POST",

    headers: {

        "Content-Type": "application/json"

    },

    body: JSON.stringify({

    curso_id: cursoId,

    texto_certificado: textoPrincipal.value,

    mostrar_qr: mostrarQR.checked ? 1 : 0,

    mostrar_sello: mostrarSello.checked ? 1 : 0,

    configuracion: JSON.stringify(configuracion)

})

});

        const resultado = await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(resultado.mensaje);

        }

        alert(resultado.mensaje);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ============================================
// DRAG & DROP
// ============================================

document.querySelectorAll(".elemento-certificado").forEach(inicializarDrag);

function inicializarDrag(elemento){

    let moviendo = false;

    let offsetX = 0;
    let offsetY = 0;


    // ============================================
    // INICIAR ARRASTRE
    // ============================================

    elemento.addEventListener("mousedown", function(e){

        if (
            e.target.classList.contains("resize-handle") ||
            e.target.closest(".resize-handle")
        ){
            return;
        }


        e.preventDefault();


        // ========================================
        // DESELECCIONAR LOS DEMÁS ELEMENTOS
        // ========================================

        document
            .querySelectorAll(".elemento-certificado")
            .forEach(el => {

                el.classList.remove(
                    "elemento-seleccionado"
                );

            });


        // ========================================
        // ELEMENTO ACTUAL
        // ========================================

        elementoSeleccionado = elemento;


        // ========================================
        // DETERMINAR SI ES IMAGEN O TEXTO
        // ========================================

        const esImagen =
            elemento.querySelector("img") !== null;


        if(esImagen){

            document
                .getElementById("toolbarTexto")
                .style.display = "none";

            document
                .getElementById("toolbarImagen")
                .style.display = "flex";


            const img =
                elemento.querySelector("img");


            anchoImagen.value =
                parseInt(img.offsetWidth);


            altoImagen.value =
                parseInt(img.offsetHeight);

        }
        else{

            document
                .getElementById("toolbarTexto")
                .style.display = "flex";

            document
                .getElementById("toolbarImagen")
                .style.display = "none";

        }


        // ========================================
        // OBTENER POSICIÓN ACTUAL
        // ========================================

        const rect =
            elemento.getBoundingClientRect();


        const area =
            document
                .querySelector(".area-certificado")
                .getBoundingClientRect();


        // ========================================
        // CONVERTIR TRANSFORM A LEFT / TOP
        // ========================================

        const estilo =
            window.getComputedStyle(elemento);


        if(
            estilo.transform !== "none" &&
            !elemento.dataset.posicionConvertida
        ){

            elemento.style.left =
                (rect.left - area.left) + "px";


            elemento.style.top =
                (rect.top - area.top) + "px";


            elemento.style.transform =
                "none";


            elemento.dataset.posicionConvertida =
                "true";

        }


        // ========================================
        // RECALCULAR RECT DESPUÉS DE CONVERTIR
        // ========================================

        const rectElemento =
            elemento.getBoundingClientRect();


        offsetX =
            e.clientX -
            rectElemento.left;


        offsetY =
            e.clientY -
            rectElemento.top;


        // ========================================
        // ACTIVAR MOVIMIENTO
        // ========================================

        moviendo = true;


        elemento.classList.add(
            "elemento-seleccionado"
        );


        // ========================================
        // OCULTAR TOOLBAR MIENTRAS SE MUEVE
        // ========================================

        toolbarFlotante.style.display =
            "none";


        // ========================================
        // MOSTRAR MARCO DE SELECCIÓN
        // ========================================

        marcoSeleccion.style.display =
            "block";


        marcoSeleccion.style.left =
            (rectElemento.left - area.left) +
            "px";


        marcoSeleccion.style.top =
            (rectElemento.top - area.top) +
            "px";


        marcoSeleccion.style.width =
            rectElemento.width + "px";


        marcoSeleccion.style.height =
            rectElemento.height + "px";


        // ========================================
        // ACTUALIZAR HERRAMIENTAS DE TEXTO
        // ========================================

        if(!esImagen){

            const fuenteActual =
                estilo.fontFamily
                    .replace(/"/g,"");


            for(
                const opcion of fuenteToolbar.options
            ){

                if(
                    opcion.value
                        .replace(/"/g,"")
                        .includes(
                            fuenteActual
                                .split(",")[0]
                                .trim()
                        )
                ){

                    fuenteToolbar.value =
                        opcion.value;

                    break;

                }

            }


            colorToolbar.value =
                rgbAHex(estilo.color);


            tamanoToolbar.value =
                parseInt(estilo.fontSize);


            tamanoFuente.value =
                parseInt(estilo.fontSize);

        }

    });


    // ============================================
    // MOVIMIENTO
    // ============================================

    document.addEventListener(
        "mousemove",
        function(e){

            if(!moviendo) return;


            const area =
                document
                    .querySelector(".area-certificado")
                    .getBoundingClientRect();


            const x =
                e.clientX -
                area.left -
                offsetX;


            const y =
                e.clientY -
                area.top -
                offsetY;


            // ====================================
            // MOVER ELEMENTO
            // ====================================

            elemento.style.left =
                x + "px";


            elemento.style.top =
                y + "px";


            // Eliminar centrado
            elemento.style.transform =
                "none";


            // ====================================
            // ACTUALIZAR MARCO
            // ====================================

            const nuevoRect =
                elemento.getBoundingClientRect();


            marcoSeleccion.style.left =
                (nuevoRect.left - area.left) +
                "px";


            marcoSeleccion.style.top =
                (nuevoRect.top - area.top) +
                "px";


            marcoSeleccion.style.width =
                nuevoRect.width + "px";


            marcoSeleccion.style.height =
                nuevoRect.height + "px";


            // ====================================
            // IMPORTANTE
            // NO MOSTRAR TOOLBAR AQUÍ
            // ====================================

        }
    );


    // ============================================
    // TERMINAR ARRASTRE
    // ============================================

    document.addEventListener(
        "mouseup",
        function(){

            if(!moviendo) return;


            moviendo = false;


            // ====================================
            // OBTENER POSICIÓN FINAL
            // ====================================

            const rect =
                elemento.getBoundingClientRect();


            // ====================================
            // MOSTRAR TOOLBAR SOLO AL SOLTAR
            // ====================================

            toolbarFlotante.style.display =
                "flex";


            // ====================================
            // POSICIONAR TOOLBAR
            // ====================================

            const margen = 10;


            const anchoBarra =
                toolbarFlotante.offsetWidth;


            const altoBarra =
                toolbarFlotante.offsetHeight;


            let left =
                rect.left +
                window.scrollX +
                (rect.width / 2) -
                (anchoBarra / 2);


            let top =
                rect.top +
                window.scrollY -
                altoBarra -
                10;


            // ====================================
            // LIMITAR DERECHA
            // ====================================

            if(
                left + anchoBarra >
                window.innerWidth +
                window.scrollX -
                margen
            ){

                left =
                    window.innerWidth +
                    window.scrollX -
                    anchoBarra -
                    margen;

            }


            // ====================================
            // LIMITAR IZQUIERDA
            // ====================================

            if(
                left <
                margen +
                window.scrollX
            ){

                left =
                    margen +
                    window.scrollX;

            }


            // ====================================
            // SI NO CABE ARRIBA
            // ====================================

            if(
                top <
                window.scrollY +
                margen
            ){

                top =
                    rect.bottom +
                    window.scrollY +
                    10;

            }


            toolbarFlotante.style.left =
                left + "px";


            toolbarFlotante.style.top =
                top + "px";


            // ====================================
            // ACTUALIZAR MARCO FINAL
            // ====================================

            const area =
                document
                    .querySelector(".area-certificado")
                    .getBoundingClientRect();


            marcoSeleccion.style.left =
                (rect.left - area.left) +
                "px";


            marcoSeleccion.style.top =
                (rect.top - area.top) +
                "px";


            marcoSeleccion.style.width =
                rect.width + "px";


            marcoSeleccion.style.height =
                rect.height + "px";

        }
    );

}
// ============================================
// TAMAÑO DE FUENTE
// ============================================

tamanoFuente.addEventListener("input", () => {

    if (!elementoSeleccionado) return;

    elementoSeleccionado.style.fontSize =
        tamanoFuente.value + "px";


});


btnMas.addEventListener("click", () => {

    if (!elementoSeleccionado) return;

    let tamaño =
        parseInt(
            window
            .getComputedStyle(elementoSeleccionado)
            .fontSize
        );

    tamaño++;

    elementoSeleccionado.style.fontSize =
        tamaño + "px";

    tamanoToolbar.value = tamaño;

});

btnMenos.addEventListener("click", () => {

    if (!elementoSeleccionado) return;

    let tamaño =
        parseInt(
            window
            .getComputedStyle(elementoSeleccionado)
            .fontSize
        );

    if (tamaño <= 8) return;

    tamaño--;

    elementoSeleccionado.style.fontSize =
        tamaño + "px";

    tamanoToolbar.value = tamaño;

});

tamanoToolbar.addEventListener("input", () => {

    if (!elementoSeleccionado) return;

    elementoSeleccionado.style.fontSize =
        tamanoToolbar.value + "px";

});

function rgbAHex(color){

    const rgb =
        color.match(/\d+/g);

    if(!rgb) return "#000000";

    return "#"
        + rgb
        .slice(0,3)
        .map(x=>parseInt(x)
        .toString(16)
        .padStart(2,"0"))
        .join("");

}

fuenteToolbar.addEventListener("change",()=>{

    if(!elementoSeleccionado) return;

    elementoSeleccionado.style.fontFamily =
        fuenteToolbar.value;

    // Nunca partir el texto en varias líneas
    elementoSeleccionado.style.whiteSpace = "nowrap";

    // El ancho se ajusta automáticamente al contenido
    elementoSeleccionado.style.width = "max-content";

    // Esperar a que el navegador aplique la nueva fuente
    requestAnimationFrame(()=>{

        elementoSeleccionado.style.width =
            elementoSeleccionado.scrollWidth + "px";

    });

});

colorToolbar.addEventListener("input",()=>{

    if(!elementoSeleccionado) return;

    elementoSeleccionado.style.color =
        colorToolbar.value;

});

btnNegrita.addEventListener("click",()=>{

    if(!elementoSeleccionado) return;

    const peso =
        window
        .getComputedStyle(elementoSeleccionado)
        .fontWeight;

    elementoSeleccionado.style.fontWeight =
        peso=="700" || peso=="bold"
        ? "400"
        : "700";

});


document.addEventListener("click", function(e){

    if(
        !e.target.closest(".elemento-certificado") &&
        !e.target.closest("#toolbarFlotante")
    ){

        toolbarFlotante.style.display = "none";

        marcoSeleccion.style.display = "none";

        document
            .querySelectorAll(".elemento-certificado")
            .forEach(el => {

                el.classList.remove("elemento-seleccionado");

            });

        elementoSeleccionado = null;

    }

});

anchoImagen.addEventListener("input", () => {

    if (!elementoSeleccionado) return;

    const img = elementoSeleccionado.querySelector("img");

    if (!img) return;

    img.style.width = anchoImagen.value + "px";

    elementoSeleccionado.style.width = anchoImagen.value + "px";

    actualizarMarco();

    console.log("WIDTH IMG:", img.style.width);

});

altoImagen.addEventListener("input", () => {

    if (!elementoSeleccionado) return;

    const img = elementoSeleccionado.querySelector("img");

    if (!img) return;

    img.style.height = altoImagen.value + "px";

    elementoSeleccionado.style.height = altoImagen.value + "px";

    actualizarMarco();

    console.log("HEIGHT IMG:", img.style.height);

});

function actualizarMarco(){

    if(!elementoSeleccionado) return;

    const rect = elementoSeleccionado.getBoundingClientRect();

    const area = document
        .querySelector(".area-certificado")
        .getBoundingClientRect();

    marcoSeleccion.style.left =
        (rect.left - area.left) + "px";

    marcoSeleccion.style.top =
        (rect.top - area.top) + "px";

    marcoSeleccion.style.width =
        rect.width + "px";

    marcoSeleccion.style.height =
        rect.height + "px";

    toolbarFlotante.style.left =
        (rect.left - area.left) + "px";

    toolbarFlotante.style.top =
        (rect.top - area.top - 55) + "px";

}

function obtenerConfiguracionCertificado() {

    const elementos = [];

    const area =
        document.querySelector(".area-certificado");

    if (!area) {

        console.warn(
            "No se encontró .area-certificado"
        );

        return {
            elementos: []
        };

    }


    document
        .querySelectorAll(".elemento-certificado")
        .forEach(elemento => {

            const imagen =
                elemento.querySelector("img");

            const estilo =
                window.getComputedStyle(elemento);


            // ========================================
            // POSICIÓN REAL
            // ========================================
            // offsetLeft y offsetTop NO se afectan
            // por el transform: scale() de la vista previa.

            const left =
                elemento.offsetLeft;

            const top =
                elemento.offsetTop;


            // ========================================
            // TAMAÑO
            // ========================================

            const width =
                elemento.offsetWidth;

            const height =
                elemento.offsetHeight;


            // ========================================
            // CONFIGURACIÓN
            // ========================================

            elementos.push({

                id:
                    elemento.id,

                tipo:
                    elemento.dataset.tipo ||
                    "texto",

                html:
                    imagen
                        ? null
                        : elemento.innerHTML,

                left:
                    left + "px",

                top:
                    top + "px",

                width:
                    width + "px",

                height:
                    height + "px",

                fontSize:
                    estilo.fontSize,

                fontFamily:
                    estilo.fontFamily,

                fontWeight:
                    estilo.fontWeight,

                fontStyle:
                    estilo.fontStyle,

                textAlign:
                    estilo.textAlign,

                color:
                    estilo.color,

                src:
                    imagen
                        ? imagen.src
                        : null

            });

        });


    console.log(
        "CONFIGURACIÓN GUARDADA:",
        elementos
    );


    return {
        elementos
    };

}

async function cargarConfiguracion() {

    try {

        const respuesta = await fetch(`/api/certificados/${cursoId}`);

        const data = await respuesta.json();

        if (!data) return;

        textoPrincipal.value = data.texto_certificado || "";

        mostrarQR.checked = data.mostrar_qr == 1;

        mostrarSello.checked = data.mostrar_sello == 1;

        actualizarTextoPrincipal();

        actualizarVista();

        console.log("Configuración cargada", data);

        // ======================================
// CARGAR IMÁGENES GUARDADAS
// ======================================

if (data.plantilla) {

    previewPlantilla.src = data.plantilla;

}

if (data.sello) {

    imgSello.src = data.sello;

}

if (data.firma_izquierda) {

    imgFirmaIzquierda.src = data.firma_izquierda;

}

if (data.firma_derecha) {

    imgFirmaDerecha.src = data.firma_derecha;

}

// ======================================
// CARGAR POSICIONES
// ======================================

if (data && data.configuracion) {

    const configuracion =
        JSON.parse(data.configuracion);

    restaurarConfiguracion(configuracion);

} else {

    establecerPosicionesIniciales();

}

    } catch (error) {

        console.error(error);

    }

}

function restaurarConfiguracion(configuracion){

    if(!configuracion || !configuracion.elementos){
        return;
    }

    configuracion.elementos.forEach(item => {

        const elemento =
            document.getElementById(item.id);

        if(!elemento){
            return;
        }

        // ==========================================
        // POSICIÓN
        // ==========================================

        elemento.style.left =
            item.left || "";

        elemento.style.top =
            item.top || "";

        elemento.style.transform =
            "none";


        // ==========================================
        // IMAGEN
        // ==========================================

        const img =
            elemento.querySelector("img");

        const esImagen =
            img !== null;


        // ==========================================
        // CONTENIDO
        // ==========================================

        if(!esImagen && item.html){

            elemento.innerHTML =
                item.html;

        }


        // ==========================================
        // TAMAÑO
        // ==========================================

        if(esImagen){

            if(item.src){

                img.src =
                    item.src;

            }

            if(item.width){

                img.style.width =
                    item.width;

            }

            if(item.height){

                img.style.height =
                    item.height;

            }

        }else{

            /*
             * IMPORTANTE:
             *
             * Los textos NO deben recuperar
             * un ancho fijo guardado anteriormente.
             *
             * De lo contrario el nombre puede
             * quedar cortado o desplazado.
             */

            elemento.style.width =
                "auto";

            elemento.style.height =
                "auto";

            elemento.style.whiteSpace =
                "nowrap";

            elemento.style.overflow =
                "visible";

        }


        // ==========================================
        // ESTILOS
        // ==========================================

        if(item.fontSize){

            elemento.style.fontSize =
                item.fontSize;

        }

        if(item.fontFamily){

            elemento.style.fontFamily =
                item.fontFamily;

        }

        if(item.color){

            elemento.style.color =
                item.color;

        }

        if(item.fontWeight){

            elemento.style.fontWeight =
                item.fontWeight;

        }

        if(item.fontStyle){

            elemento.style.fontStyle =
                item.fontStyle;

        }

        if(item.textAlign){

            elemento.style.textAlign =
                item.textAlign;

        }

    });

}

// ============================================================
// CORRECCIÓN DE ESCALA DEL CERTIFICADO
// ============================================================
//
// La configuración se guarda usando las dimensiones reales:
// 1123 x 794 px.
//
// La vista previa de Administrar Certificado es más pequeña,
// por lo que debemos escalar los elementos visualmente.
//
// IMPORTANTE:
// Esto NO modifica la configuración guardada en la BD.
// Solo corrige cómo se muestra en Administrar Certificado.
// ============================================================

(function corregirEscalaVistaPrevia() {

    const ANCHO_CERTIFICADO = 1123;
    const ALTO_CERTIFICADO = 794;

    function aplicarEscala() {

        const preview =
            document.querySelector(".certificado-preview");

        const area =
            document.querySelector(".area-certificado");

        if (!preview || !area) {
            return;
        }

        const anchoActual =
            preview.clientWidth;

        const altoActual =
            preview.clientHeight;

        if (!anchoActual || !altoActual) {
            return;
        }

        const escalaX =
            anchoActual / ANCHO_CERTIFICADO;

        const escalaY =
            altoActual / ALTO_CERTIFICADO;

        /*
         * Usamos la escala horizontal como referencia.
         * El certificado mantiene proporción 1123 / 794.
         */

        const escala =
            Math.min(
                escalaX,
                escalaY
            );

        /*
         * La vista previa se mantiene en su tamaño actual,
         * pero internamente trabajamos con las coordenadas
         * reales del certificado.
         */

        area.style.width =
            ANCHO_CERTIFICADO + "px";

        area.style.height =
            ALTO_CERTIFICADO + "px";

        area.style.transformOrigin =
            "top left";

        area.style.transform =
            `scale(${escala})`;

    }


    // Ejecutar cuando cargue la página

    window.addEventListener(
        "load",
        () => {

            setTimeout(
                aplicarEscala,
                300
            );

        }
    );


    // Ejecutar nuevamente después de que
    // la configuración haya terminado de cargar.

    setTimeout(
        aplicarEscala,
        500
    );

    setTimeout(
        aplicarEscala,
        1000
    );


    // Corregir también al cambiar el tamaño
    // de la ventana.

    window.addEventListener(
        "resize",
        aplicarEscala
    );

})();

