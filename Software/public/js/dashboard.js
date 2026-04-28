document.addEventListener("DOMContentLoaded", async () => {

    try {

        const res = await fetch('/api/me', {
            credentials: 'include'
        });

        const data = await res.json();

        console.log("ME:", data);

        if (!data.success) return;

        const u = data.usuario;

        document.getElementById("nombre").textContent = u.nombre;
        document.getElementById("rol").textContent = "Empleado";
        document.getElementById("cargo").textContent = u.cargo || "General";
        document.getElementById("doc").textContent = u.numero_documento;

        const cont = document.getElementById("acciones");

        if (data.completo) {

            cont.innerHTML = `
                <h5 class="mb-3">Inducción completada ✔</h5>

                <div class="d-flex justify-content-center gap-3 flex-wrap">

                    ${data.tiene_certificado ? `
                    <a href="/certificado" class="btn btn-success btn-custom">
                        Ver Certificado
                    </a>
                    ` : `
                    <a href="/firma" class="btn btn-warning btn-custom">
                        Generar Certificado
                    </a>
                    `}

                    <a href="/induccion" class="btn btn-primary btn-custom">
                        Ver Inducción
                    </a>

                </div>
            `;

        } else {

            cont.innerHTML = `
                <h5>Aún no completas la inducción</h5>

                <a href="/induccion" class="btn btn-primary mt-3">
                    Continuar
                </a>
            `;
        }

        // 🔥 CLICK PERFIL (AQUÍ VA)
        const btn = document.getElementById("btnPerfil");

        if (btn) {
            btn.addEventListener("click", () => {
                window.location.href = "/perfil";
            });
        }

    } catch (error) {
        console.error("Error dashboard:", error);
    }

});
function toggleMenu(){
    document.querySelector(".sidebar").classList.toggle("active");
}