document.addEventListener("DOMContentLoaded", function () {
    console.log("Controlador de perfil de producción unificado (Seguro).");

    // ==========================================================================
    // 📡 2. CARGA DE DATOS 100% DINÁMICA DESDE LA API (PROTECCIÓN DE PRIVACIDAD)
    // ==========================================================================
    
function cargarFichaEmpleado(data) {

    console.log("USUARIO RECIBIDO:", data);

    if (!data) return;

    const mapeo = {

        "nombreBienvenida": data.nombre,
        "subCargo": data.cargo,
        "rolBadgeBienvenida": data.rol,

        "nombre": data.nombre,
        "rol": data.rol,
        "cargo": data.cargo,

        "perfilCodigo": data.codigo,
        "perfilTipoDoc": data.tipo_documento,
        "perfilDoc": data.numero_documento,
        "perfilRh": data.rh,

        "perfilDireccion": data.direccion,
        "perfilBarrio": data.barrio_localidad,
        "perfilTelefono": data.telefono,

        "perfilEmail": data.email,
        "perfilFechaNac": data.fecha_nacimiento
    ? data.fecha_nacimiento.split('T')[0]
    : "--",
        "perfilLugarNac": data.lugar_nacimiento,

        "perfilEstadoCivil": data.estado_civil,
        "perfilArea": data.area,
        "perfilSede": data.sede

    };

    Object.keys(mapeo).forEach(id => {

        const el = document.getElementById(id);

        if (el) {

            el.textContent = mapeo[id] || "--";

        }

    });

    if (data.foto) {

        const foto =
            document.getElementById("perfFoto");

        const icono =
            document.getElementById("perfFotoDefault");

        if (foto) {

            if (data.foto.startsWith("data:image")) {

                foto.src = data.foto;

            } else {

                foto.src =
                    `/uploads/fotos/${data.foto}`;

            }

            foto.style.display = "block";

        }

        if (icono) {

            icono.style.display = "none";

        }

    }

}

    // Petición asíncrona real y segura
    fetch('/api/me', {
    credentials: 'include'
}) 
        .then(response => {
            if (!response.ok) {
                throw new Error("No se pudo conectar con la sesión del usuario.");
            }
            return response.json();
        })
        .then(datosUsuarioLogueado => {

    console.log("DATOS API:", datosUsuarioLogueado);

    if (!datosUsuarioLogueado.success) {

        throw new Error(
            "No se pudieron obtener los datos del usuario"
        );

    }

    cargarFichaEmpleado(
        datosUsuarioLogueado.usuario
    );

})
        .catch(error => {
            console.error("Error de conexión con el servidor ERP:", error);
            
            // Plan de contingencia anónimo: Si falla, jamás expone datos privados.
            const elementosPrincipales = ["perfNombreCompleto", "sbUserName"];
            elementosPrincipales.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = "Error al cargar";
            });
        });
}); // <--- Aquí estaba el cierre faltante que causaba el error en Visual Studio Code