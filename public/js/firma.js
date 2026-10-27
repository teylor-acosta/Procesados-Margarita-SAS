/* ==========================================================================
   🌿 CONTROLADOR DE FIRMA DIGITAL - VERSION DEFINITIVA
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("Sistema de firma: DOM cargado. Inicializando...");

    /* ==========================================================
       👤 CARGAR DATOS DEL USUARIO EN SIDEBAR
       ========================================================== */

    try {

        const usuarioGuardado = JSON.parse(
            localStorage.getItem("usuario")
        );

        if (usuarioGuardado) {

            const nombreElement =
                document.getElementById("nombre");

            const rolElement =
                document.getElementById("rol");

            if (nombreElement) {
                nombreElement.textContent =
                    usuarioGuardado.nombre || "Usuario";
            }

            if (rolElement) {
                rolElement.textContent =
                    usuarioGuardado.rol || "Colaborador";
            }

            console.log(
                "Usuario cargado:",
                usuarioGuardado
            );
        }

    } catch (error) {

        console.error(
            "Error cargando usuario:",
            error
        );
    }

    /* ==========================================================
       🚪 CERRAR SESIÓN
       ========================================================== */

    const btnLogout =
        document.getElementById("btnLogout");

    if (btnLogout) {

        btnLogout.addEventListener("click", (e) => {

            e.preventDefault();

            localStorage.clear();
            sessionStorage.clear();

            window.location.href = "/";
        });
    }

    /* ==========================================================
       ✍️ FIRMA DIGITAL
       ========================================================== */

    const canvas =
        document.getElementById("canvasFirma");

    if (!canvas) {

        console.error(
            "ERROR CRÍTICO: No se encuentra canvasFirma"
        );

        return;
    }

    const preview =
        document.getElementById("previewFirma");

    const placeholder =
        document.getElementById("placeholderFirma");

    const btnFinalizar =
        document.getElementById("btnFinalizar");

    const btnBorrar =
        document.getElementById("btnBorrarLienzo");

    const mensajeExito =
        document.getElementById("mensajeExito");

    const ctx =
        canvas.getContext("2d");

    let dibujando = false;

    /* ==========================================================
       📐 CONFIGURACIÓN DEL CANVAS
       ========================================================== */

    function configurarCanvas() {

        const contenedor =
            canvas.parentElement;

        canvas.width =
            contenedor.clientWidth - 10;

        canvas.height = 250;

        ctx.strokeStyle = "#022318";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        console.log(
            "Canvas configurado:",
            canvas.width,
            "x",
            canvas.height
        );
    }

    configurarCanvas();

    window.addEventListener(
        "resize",
        configurarCanvas
    );

    /* ==========================================================
       📍 POSICIÓN CURSOR
       ========================================================== */

    function obtenerPosicion(e) {

        const rect =
            canvas.getBoundingClientRect();

        const clientX =
            e.clientX ||
            (e.touches
                ? e.touches[0].clientX
                : 0);

        const clientY =
            e.clientY ||
            (e.touches
                ? e.touches[0].clientY
                : 0);

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /* ==========================================================
       ✏️ DIBUJAR
       ========================================================== */

    function iniciarDibujo(e) {

        dibujando = true;

        const pos =
            obtenerPosicion(e);

        ctx.beginPath();

        ctx.moveTo(
            pos.x,
            pos.y
        );
    }

    function realizarTrazo(e) {

        if (!dibujando) return;

        e.preventDefault();

        const pos =
            obtenerPosicion(e);

        ctx.lineTo(
            pos.x,
            pos.y
        );

        ctx.stroke();
    }

    function terminarDibujo() {

        if (!dibujando) return;

        dibujando = false;

        if (preview) {

            preview.src =
                canvas.toDataURL(
                    "image/png"
                );

            preview.style.display =
                "block";
        }

        if (placeholder) {

            placeholder.style.display =
                "none";
        }
    }

    /* ==========================================================
       🖱️ EVENTOS MOUSE
       ========================================================== */

    canvas.addEventListener(
        "mousedown",
        iniciarDibujo
    );

    canvas.addEventListener(
        "mousemove",
        realizarTrazo
    );

    canvas.addEventListener(
        "mouseup",
        terminarDibujo
    );

    canvas.addEventListener(
        "mouseleave",
        terminarDibujo
    );

    /* ==========================================================
       📱 EVENTOS TOUCH
       ========================================================== */

    canvas.addEventListener(
        "touchstart",
        (e) => {
            iniciarDibujo(e);
        },
        { passive: false }
    );

    canvas.addEventListener(
        "touchmove",
        (e) => {
            realizarTrazo(e);
        },
        { passive: false }
    );

    canvas.addEventListener(
        "touchend",
        terminarDibujo
    );

    /* ==========================================================
       🗑️ BORRAR FIRMA
       ========================================================== */

    if (btnBorrar) {

        btnBorrar.addEventListener(
            "click",
            () => {

                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                if (preview) {

                    preview.src = "";

                    preview.style.display =
                        "none";
                }

                if (placeholder) {

                    placeholder.style.display =
                        "block";
                }
            }
        );
    }

    /* ==========================================================
       💾 GUARDAR FIRMA
       ========================================================== */

    if (btnFinalizar) {

        btnFinalizar.addEventListener(
            "click",
            async () => {

                const dataURL =
                    canvas.toDataURL(
                        "image/png"
                    );

                if (
                    dataURL.length < 1500
                ) {

                    alert(
                        "Por favor dibuja tu firma antes de finalizar."
                    );

                    return;
                }

                const textoOriginal =
                    btnFinalizar.innerHTML;

                btnFinalizar.disabled =
                    true;

                btnFinalizar.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                try {

                    const response =
                        await fetch(
                            "/api/guardar-firma",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },
                                body: JSON.stringify({
                                    firma_data:
                                        dataURL
                                })
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        result.success
                    ) {

                        if (
                            mensajeExito
                        ) {

                            mensajeExito.style.display =
                                "block";
                        }

                        setTimeout(
                            () => {

                                window.location.href =
                                    "/certificado";

                            },
                            1500
                        );

                    } else {

                        throw new Error(
                            result.message ||
                            "Error guardando firma"
                        );
                    }

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        error.message
                    );

                    btnFinalizar.disabled =
                        false;

                    btnFinalizar.innerHTML =
                        textoOriginal;
                }
            }
        );
    }

});