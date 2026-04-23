document.addEventListener("DOMContentLoaded", async () => {

    try {

        // 🔥 USUARIO
        const userRes = await fetch('/api/usuario-actual', {
            credentials: 'include'
        });

        const userData = await userRes.json();

        if (!userData.success) {
            window.location.href = '/login';
            return;
        }

        const u = userData.usuario;

        document.getElementById("nombre").textContent = u.nombre;
        document.getElementById("rol").textContent = u.rol || "Empleado";
        document.getElementById("cargo").textContent = u.cargo || "General";
        document.getElementById("doc").textContent = u.numero_documento;

        // 🔥 ESTADO
        const res = await fetch('/api/estado-usuario', {
            credentials: 'include'
        });

        const data = await res.json();

        const cont = document.getElementById("acciones");

        if (data.completo) {

            cont.innerHTML = `
                <h5 class="mb-3">Inducción completada ✔</h5>

                <div class="d-flex justify-content-center gap-3 flex-wrap">

                    ${data.tiene_certificado ? `
                    <a href="/certificado" class="btn btn-success btn-custom">
                        <i class="fas fa-file-pdf me-1"></i> Ver Certificado
                    </a>
                    ` : `
                    <a href="/firma" class="btn btn-warning btn-custom">
                        <i class="fas fa-pen me-1"></i> Generar Certificado
                    </a>
                    `}

                    <a href="/induccion" class="btn btn-primary btn-custom">
                        <i class="fas fa-book me-1"></i> Ver Inducción
                    </a>

                </div>
            `;

        } else {

            cont.innerHTML = `
                <h5>Aún no completas la inducción</h5>

                <a href="/induccion" class="btn btn-primary mt-3">
                    <i class="fas fa-play me-1"></i> Continuar
                </a>
            `;
        }

    } catch (error) {
        console.error(error);
        window.location.href = '/login';
    }

});