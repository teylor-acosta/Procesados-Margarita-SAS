document.addEventListener("DOMContentLoaded", () => {

    let imagenBase64 = null;

    const inputFirma = document.getElementById("inputFirma");
    const preview = document.getElementById("previewFirma");
    const btnFinalizar = document.getElementById("btnFinalizar");

    // 🔥 PREVIEW
    inputFirma.addEventListener("change", function () {

        const file = this.files[0];
        if (!file) return;

        // validar tipo
        if (!file.type.startsWith("image/")) {
            alert("Solo se permiten imágenes");
            limpiarFirma();
            return;
        }

        // validar tamaño
        if (file.size > 2000000) {
            alert("La imagen es muy pesada (máx 2MB)");
            limpiarFirma();
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            imagenBase64 = e.target.result;
            preview.src = imagenBase64;
            preview.style.display = "block";
        };

        reader.readAsDataURL(file);
    });

    // 🔥 LIMPIAR FIRMA (MEJORADO)
    window.limpiarFirma = function () {
        inputFirma.value = "";
        preview.src = "";              // 🔥 limpia imagen
        preview.style.display = "none";
        imagenBase64 = null;
    };

    // 🔥 FINALIZAR
    btnFinalizar.addEventListener("click", async () => {

        if (!imagenBase64) {
            alert("Debes subir una firma");
            return;
        }

        const textoOriginal = btnFinalizar.innerHTML;

        btnFinalizar.disabled = true;
        btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';

        try {

            const response = await fetch('/api/guardar-firma', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firma_data: imagenBase64
                })
            });

            const result = await response.json();

            if (result.success) {

                document.getElementById('mensajeExito').style.display = 'block';

                setTimeout(() => {
                    window.location.href = '/certificado';
                }, 2000);

            } else {
                alert(result.message || "Error al guardar firma");
                btnFinalizar.disabled = false;
                btnFinalizar.innerHTML = textoOriginal;
            }

        } catch (error) {
            console.error(error);
            alert("Error de conexión");
            btnFinalizar.disabled = false;
            btnFinalizar.innerHTML = textoOriginal;
        }

    });

});