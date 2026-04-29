document.addEventListener("DOMContentLoaded", async () => {

    try {

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

        // 🔥 DATOS BÁSICOS
        document.getElementById("nombre").textContent = u.nombre || "Sin nombre";
        document.getElementById("cargo").textContent = u.cargo || "Empleado";

        document.getElementById("codigo").textContent = u.codigo || "No asignado";
        document.getElementById("tipo_doc").textContent = u.tipo_documento || "No asignado";
        document.getElementById("doc").textContent = u.numero_documento || "No asignado";
        document.getElementById("rh").textContent = u.rh || "No asignado";

        // 🔥 FECHA (ARREGLA INVALID DATE)
        if (u.fecha_nacimiento) {
            const fecha = new Date(u.fecha_nacimiento);
            document.getElementById("fecha").textContent = fecha.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } else {
            document.getElementById("fecha").textContent = "No asignado";
        }

        document.getElementById("lugar").textContent = u.lugar_nacimiento || "No asignado";
        document.getElementById("estado").textContent = u.estado_civil || "No asignado";

        // 🔥 CONTACTO
        document.getElementById("direccion").textContent = u.direccion || "No asignado";
        document.getElementById("barrio").textContent = u.barrio_localidad || "No asignado";
        document.getElementById("telefono").textContent = u.telefono || "No asignado";
        document.getElementById("email").textContent = u.email || "No asignado";

        // 🔥 EMPRESA
        document.getElementById("area").textContent = u.area || "No asignado";
        document.getElementById("sede").textContent = u.sede || "No asignado";

    } catch (error) {
        console.error("Error perfil:", error);
        window.location.href = '/login';
    }

});


// ============================================
// 🔥 SUBIR FOTO
// ============================================

function subirFoto(){
    document.getElementById("inputFoto").click();
}

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


// ============================================
// 🔥 VOLVER
// ============================================

function volverDashboard(){
    window.location.href = "/dashboard";
}