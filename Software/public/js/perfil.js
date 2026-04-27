document.addEventListener("DOMContentLoaded", async () => {

    const res = await fetch('/api/me', {
        credentials: 'include'
    });

    const data = await res.json();

    if (!data.success) {
        window.location.href = '/login';
        return;
    }

    const u = data.usuario;

    // 🔥 FOTO
    if (u.foto) {
        document.getElementById("foto").src = u.foto;
    }

    document.getElementById("nombre").textContent = u.nombre;
    document.getElementById("cargo").textContent = u.cargo || "Empleado";

    document.getElementById("codigo").textContent = u.codigo;
    document.getElementById("tipo_doc").textContent = u.tipo_documento;
    document.getElementById("doc").textContent = u.numero_documento;
    document.getElementById("rh").textContent = u.rh;
  const fecha = new Date(u.fecha_nacimiento);

document.getElementById("fecha").textContent = fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric"
});
    document.getElementById("lugar").textContent = u.lugar_nacimiento;
    document.getElementById("estado").textContent = u.estado_civil;

    document.getElementById("direccion").textContent = u.direccion;
    document.getElementById("barrio").textContent = u.barrio_localidad;
    document.getElementById("telefono").textContent = u.telefono;
    document.getElementById("email").textContent = u.email;

    document.getElementById("area").textContent = u.area || "No asignado";
    document.getElementById("sede").textContent = u.sede || "No asignado";

});

function subirFoto(){
    document.getElementById("inputFoto").click();
}

// 🔥 GUARDAR FOTO
document.getElementById("inputFoto").addEventListener("change", function(){

    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function(e){

        const base64 = e.target.result;

        // mostrar inmediatamente
        document.getElementById("foto").src = base64;

        // enviar al backend
        await fetch('/api/subir-foto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ foto: base64 })
        });

        alert("Foto actualizada ✔");

    };

    reader.readAsDataURL(file);

});