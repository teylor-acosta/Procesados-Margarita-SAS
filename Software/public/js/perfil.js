document.addEventListener("DOMContentLoaded", async () => {

    console.log("Perfil cargado");

    try {

        const response = await fetch("/api/me", {
            credentials: "include"
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error("No se pudo obtener la información del usuario");
        }

        cargarFichaEmpleado(data.usuario);

    } catch (error) {

        console.error("Error cargando perfil:", error);

    }

    inicializarFirma();

});

/* ==========================================
   CARGAR DATOS DEL EMPLEADO
========================================== */

function cargarFichaEmpleado(data) {

    const campos = {
        nombreBienvenida: data.nombre,
        subCargo: data.cargo,
        rolBadgeBienvenida: data.rol,

        perfilCodigo: data.codigo,
        perfilTipoDoc: data.tipo_documento,
        perfilDoc: data.numero_documento,
        perfilRh: data.rh,

        perfilDireccion: data.direccion,
        perfilBarrio: data.barrio_localidad,
        perfilTelefono: data.telefono,

        perfilEmail: data.email,
        perfilFechaNac: data.fecha_nacimiento
            ? data.fecha_nacimiento.split("T")[0]
            : "--",

        perfilLugarNac: data.lugar_nacimiento,
        perfilEstadoCivil: data.estado_civil,
        perfilArea: data.area,
        perfilSede: data.sede
    };

    Object.entries(campos).forEach(([id, valor]) => {

        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor || "--";
        }

    });

    if (data.foto) {

        const foto = document.getElementById("perfFoto");
        const icono = document.getElementById("perfFotoDefault");

        foto.src = data.foto.startsWith("data:image")
            ? data.foto
            : `/uploads/fotos/${data.foto}`;

        foto.style.display = "block";

        if (icono) {
            icono.style.display = "none";
        }
    }
}

/* ==========================================
   BOTON ACTUALIZAR FIRMA
========================================== */

document.getElementById("btnActualizarFirma")
?.addEventListener("click", async () => {

    try {

        const response = await fetch(
            "/api/obtener-firma",
            {
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log("Firma obtenida:", result);

        const imgFirma =
            document.getElementById("firmaActualPerfil");

        if (
            result.success &&
            result.firma &&
            imgFirma
        ) {

            imgFirma.src = result.firma;

        }

        const modal = new bootstrap.Modal(
            document.getElementById("modalFirmaPerfil")
        );

        modal.show();

    } catch (error) {

        console.error(error);

        alert(
            "No fue posible cargar la firma actual."
        );

    }

});

/* ==========================================
   CANVAS FIRMA
========================================== */

function inicializarFirma() {

    const canvas =
        document.getElementById("canvasNuevaFirma");

    if (!canvas) {
        console.error(
            "No existe canvasNuevaFirma"
        );
        return;
    }

    const ctx =
        canvas.getContext("2d");

    let dibujando = false;

    ctx.strokeStyle = "#022318";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    function posicion(e) {

        const rect =
            canvas.getBoundingClientRect();

        const x =
            (e.clientX || e.touches?.[0]?.clientX)
            - rect.left;

        const y =
            (e.clientY || e.touches?.[0]?.clientY)
            - rect.top;

        return { x, y };
    }

    function iniciar(e) {

        dibujando = true;

        const p = posicion(e);

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);

    }

    function mover(e) {

        if (!dibujando) return;

        e.preventDefault();

        const p = posicion(e);

        ctx.lineTo(p.x, p.y);
        ctx.stroke();

    }

    function finalizar() {

        dibujando = false;

    }

    canvas.addEventListener("mousedown", iniciar);
    canvas.addEventListener("mousemove", mover);
    canvas.addEventListener("mouseup", finalizar);
    canvas.addEventListener("mouseleave", finalizar);

    canvas.addEventListener("touchstart", iniciar);
    canvas.addEventListener("touchmove", mover, {
        passive: false
    });
    canvas.addEventListener("touchend", finalizar);

    document.getElementById(
        "btnLimpiarNuevaFirma"
    )?.addEventListener(
        "click",
        () => {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

        }
    );

    document.getElementById(
        "btnGuardarNuevaFirma"
    )?.addEventListener(
        "click",
        async () => {

            const firma =
                canvas.toDataURL("image/png");

            if (firma.length < 1500) {

                alert(
                    "Debe firmar antes de guardar."
                );

                return;
            }

            try {

                const response =
                    await fetch(
                        "/api/actualizar-firma",
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                firma_data: firma
                            })
                        }
                    );

                const result =
                    await response.json();

                if (result.success) {

                    alert(
                        "Firma actualizada correctamente."
                    );

                    location.reload();

                } else {

                    alert(
                        result.message ||
                        "Error actualizando firma."
                    );

                }

            } catch (error) {

                console.error(error);

                alert(
                    "Error actualizando firma."
                );

            }

        }
    );

}

/* ==========================================
   BOTONES RESTANTES
========================================== */

document
.getElementById("btnCambiarFoto")
?.addEventListener("click", () => {

    console.log(
        "CLICK CAMBIAR FOTO"
    );

    document
    .getElementById(
        "inputFotoPerfil"
    )
    .click();

});

document
.getElementById(
    "inputFotoPerfil"
)
?.addEventListener(
    "change",
    async function () {

        console.log(
    "SE EJECUTO CHANGE"
);

        const archivo =
            this.files[0];

        if (!archivo)
            return;

        const formData =
            new FormData();

        formData.append(
            "foto",
            archivo
        );

        try {

            const response =
    await fetch(
        "/api/perfil/foto",
        {
            method: "POST",
            credentials: "include",
            body: formData
        }
    );

console.log(
    "STATUS:",
    response.status
);

const result =
    await response.json();

console.log(
    "RESULTADO:",
    result
);

            if (
                result.success
            ) {

                document
                .getElementById(
                    "perfFoto"
                )
                .src =
                `/uploads/fotos/${result.foto}`;

                document
                .getElementById(
                    "perfFoto"
                )
                .style.display =
                "block";

                document
                .getElementById(
                    "perfFotoDefault"
                )
                .style.display =
                "none";

                Swal.fire({
    icon: "success",
    title: "Foto actualizada",
    text: "La foto de perfil fue actualizada correctamente.",
    confirmButtonColor: "#02412e",
    timer: 2000,
    showConfirmButton: false
});

            }

        } catch(error) {

            console.error(error);

            Swal.fire({
    icon: "error",
    title: "Error",
    text: "No fue posible actualizar la foto.",
    confirmButtonColor: "#dc3545"
});

        }

    }
);



document
.getElementById("btnDescargarPDF")
?.addEventListener("click", () => {

    window.open(
        "/api/perfil/pdf",
        "_blank"
    );

});

document
.getElementById("btnCambiarPassword")
?.addEventListener("click", () => {

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "modalCambiarPassword"
            )
        );

    modal.show();

});
document
.getElementById("btnGuardarPassword")
?.addEventListener("click", async () => {

    const actual =
        document.getElementById(
            "passwordActual"
        ).value;

    const nueva =
        document.getElementById(
            "passwordNueva"
        ).value;

    const confirmar =
        document.getElementById(
            "passwordConfirmar"
        ).value;

    if (!actual || !nueva || !confirmar) {

       Swal.fire({
    icon: "warning",
    title: "Campos incompletos",
    text: "Todos los campos son obligatorios.",
    confirmButtonColor: "#f39c12"
});
    }

    if (nueva !== confirmar) {

        Swal.fire({
    icon: "warning",
    title: "Validación",
    text: "Las contraseñas no coinciden.",
    confirmButtonColor: "#f39c12"
});

        return;
    }

    try {

    const response =
        await fetch(
            "/api/perfil/cambiar-password",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                    actual,
                    nueva
                })
            }
        );

    const result =
        await response.json();

   if (result.success) {

    Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: "La contraseña fue actualizada correctamente.",
        confirmButtonColor: "#02412e"
    }).then(() => {

        location.reload();

    });

} else {

    Swal.fire({
        icon: "error",
        title: "Error",
        text: result.message ||
              "No fue posible actualizar la contraseña.",
        confirmButtonColor: "#dc3545"
    });

}

} catch (error) {

    console.error(error);

    alert(
        "Error al actualizar contraseña."
    );

}

});