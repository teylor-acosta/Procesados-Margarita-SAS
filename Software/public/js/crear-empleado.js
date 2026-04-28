document.getElementById('formEmpleado').addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = e.target;

    const data = {
        nombre: f.nombre.value,
        tipo_documento: f.tipo_documento.value,
        numero_documento: f.numero_documento.value,
        rh: f.rh.value,
        fecha_nacimiento: f.fecha_nacimiento.value,
        lugar_nacimiento: f.lugar_nacimiento.value,
        estado_civil: f.estado_civil.value,
        direccion: f.direccion.value,
        barrio_localidad: f.barrio_localidad.value,
        telefono: f.telefono.value,
        email: f.email.value
    };

    const res = await fetch('/api/crear-empleado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
        alert("Empleado creado");
        window.location.href = "/empleados";
    } else {
        alert("Error");
    }
});