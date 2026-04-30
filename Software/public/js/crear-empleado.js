document.addEventListener("DOMContentLoaded", () => {

    // 🔥 FORZAR LIMPIEZA SI ES CREAR
    const url = window.location.pathname;

    if (url.includes("crear-empleado")) {
        localStorage.removeItem("empleadoEditar");
    }

    // 🔥 INTENTAR OBTENER EMPLEADO
    const emp = JSON.parse(localStorage.getItem("empleadoEditar"));

    // 🔥 SI NO HAY → FORMULARIO VACÍO
    if (!emp) {
        document.getElementById("formEmpleado").reset();
        return;
    }

    // 🔥 SI HAY → EDITAR
    document.getElementById("empleado_id").value = emp.id || '';

    document.getElementById("nombres").value = emp.nombre || '';
    document.getElementById("apellidos").value = emp.apellidos || '';
    document.getElementById("tipo_documento").value = emp.tipo_documento || '';
    document.getElementById("numero_documento").value = emp.numero_documento || '';
    document.getElementById("fecha_nacimiento").value = emp.fecha_nacimiento || '';
    document.getElementById("lugar_nacimiento").value = emp.lugar_nacimiento || '';
    document.getElementById("rh").value = emp.rh || '';
    document.getElementById("estado_civil").value = emp.estado_civil || '';
    document.getElementById("direccion").value = emp.direccion || '';
    document.getElementById("barrio_localidad").value = emp.barrio_localidad || '';
    document.getElementById("telefono").value = emp.telefono || '';
    document.getElementById("email").value = emp.email || '';

    document.getElementById("area").value = emp.area_id || '';
    document.getElementById("sede").value = emp.sede_id || '';
    document.getElementById("cargo").value = emp.cargo_id || '';
});