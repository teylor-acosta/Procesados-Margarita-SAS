document.addEventListener("DOMContentLoaded", async () => {

    const form = document.getElementById("formEmpleado");

    let modoEditar = false;
    let empleado = null;

    // ============================================
    // 🔥 LIMPIAR SI ES CREAR
    // ============================================
    const data = localStorage.getItem("empleadoEditar");

    if (data) {
        empleado = JSON.parse(data);
        modoEditar = true;
    } else {
        // 🔥 CREAR → limpiar todo
        form.reset();
    }

    // ============================================
    // 🔥 CARGAR SELECTS
    // ============================================
    async function cargarSelects() {

        try {
            const [areas, sedes, cargos] = await Promise.all([
                fetch('/api/areas').then(r => r.json()),
                fetch('/api/sedes').then(r => r.json()),
                fetch('/api/cargos').then(r => r.json())
            ]);

            llenarSelect("area_id", areas);
            llenarSelect("sede_id", sedes);
            llenarSelect("cargo_id", cargos);

        } catch (error) {
            console.error("Error cargando selects:", error);
        }
    }

    function llenarSelect(id, lista) {
        const select = document.getElementById(id);

        if (!select) return;

        select.innerHTML = `<option value="">Seleccione</option>`;

        lista.forEach(x => {
            select.innerHTML += `<option value="${x.id}">${x.nombre}</option>`;
        });
    }

    await cargarSelects();

    // ============================================
    // 🔥 SI ES EDITAR → LLENAR FORM
    // ============================================
    if (modoEditar && empleado) {

        form.nombres.value = empleado.nombre?.split(" ")[0] || "";
        form.apellidos.value = empleado.nombre?.split(" ").slice(1).join(" ") || "";

        form.tipo_documento.value = empleado.tipo_documento || "";
        form.numero_documento.value = empleado.numero_documento || "";
        form.rh.value = empleado.rh || "";
        form.lugar_nacimiento.value = empleado.lugar_nacimiento || "";
        form.estado_civil.value = empleado.estado_civil || "";
        form.direccion.value = empleado.direccion || "";
        form.barrio_localidad.value = empleado.barrio_localidad || "";
        form.telefono.value = empleado.telefono || "";
        form.email.value = empleado.email || "";

        if (empleado.fecha_nacimiento) {
            form.fecha_nacimiento.value = empleado.fecha_nacimiento.split("T")[0];
        }

        setTimeout(() => {
            form.area_id.value = empleado.area_id || "";
            form.sede_id.value = empleado.sede_id || "";
            form.cargo_id.value = empleado.cargo_id || "";
        }, 300);
    }

    // ============================================
    // 🔥 SUBMIT
    // ============================================
    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = {
            nombre: form.nombres.value + " " + form.apellidos.value,
            tipo_documento: form.tipo_documento.value,
            numero_documento: form.numero_documento.value,
            rh: form.rh.value,
            fecha_nacimiento: form.fecha_nacimiento.value,
            lugar_nacimiento: form.lugar_nacimiento.value,
            estado_civil: form.estado_civil.value,
            direccion: form.direccion.value,
            barrio_localidad: form.barrio_localidad.value,
            telefono: form.telefono.value,
            email: form.email.value,
            area_id: form.area_id.value,
            sede_id: form.sede_id.value,
            cargo_id: form.cargo_id.value
        };

        let url = "/api/crear-empleado";
        let method = "POST";

        if (modoEditar) {
            url = "/api/actualizar-empleado";
            method = "PUT";
            data.id = empleado.id;
        }

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const r = await res.json();

        if (r.success) {

            Swal.fire({
                icon: "success",
                title: modoEditar ? "Actualizado" : "Creado",
                text: modoEditar 
                    ? "Empleado actualizado correctamente"
                    : "Empleado creado correctamente"
            });

            // 🔥 LIMPIAR SIEMPRE
            localStorage.removeItem("empleadoEditar");

            window.location.href = "/empleados";
        }
    });

});