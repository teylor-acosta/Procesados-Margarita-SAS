/* ==========================================================================
   PROCESADOS MARGARITA ERP - CONTROLADOR DINÁMICO DEL DASHBOARD (USER/SST)
   ========================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {
        // 🔄 1. Hacer la petición para obtener los datos del usuario logueado
        const res = await fetch('/api/me', {
            credentials: 'include'
        });

        const data = await res.json();
        console.log("Datos de sesión ERP:", data);

        // Si la petición falla o no hay sesión activa, de inmediato detenemos
        if (!data.success) {
            window.location.href = "/login";
            return;
        }

        const u = data.usuario;
        // Si el backend no envía conteos, inicializamos por defecto en 0
        const c = data.conteos || { empleados: 0, usuarios: 0, capacitaciones: 0, certificados: 0 };
        const rolUsuario = (u.rol || "empleado").toLowerCase().trim();

        // ==========================================================================
        // 👋 2. RENDERIZAR DATOS DEL USUARIO 
        // ==========================================================================
        
        const txtNombre = document.getElementById("nombre");
        if (txtNombre) txtNombre.textContent = u.nombre;

        const txtRol = document.getElementById("rol");
        if (txtRol) txtRol.textContent = u.rol || "Empleado";

        const txtCargo = document.getElementById("cargo");
        if (txtCargo) txtCargo.textContent = u.cargo || "General";

        const txtNombreBienvenida = document.getElementById("nombreBienvenida");
        if (txtNombreBienvenida) txtNombreBienvenida.textContent = u.nombre;

        const txtRolBadgeBienvenida = document.getElementById("rolBadgeBienvenida");
        if (txtRolBadgeBienvenida) txtRolBadgeBienvenida.textContent = u.rol || "Empleado";

        // ==========================================================================
        // 🛡️ 3. CONTROL DE RESTRICCIONES VISUALES SEGÚN EL ROL DEL USUARIO
        // ==========================================================================
        const panelEstadisticas = document.getElementById("panelEstadisticas");
        const cardContratacion = document.getElementById("cardContratacion");
        const cardCredenciales = document.getElementById("cardCredenciales");
        
        // Buscamos si existe una tarjeta del módulo de novedades en el inicio
        const cardModuloNovedades = document.getElementById("cardModuloNovedades");

        // Validamos si es administrador (abarca SuperAdmin, Admin, Administrador)
        const esAdmin = rolUsuario.includes("admin") || rolUsuario.includes("administrador");

        if (rolUsuario === "auxiliar" || rolUsuario === "empleado" || !esAdmin) {
            // 🚫 Ocultar KPIs globales del sistema
            if (panelEstadisticas) panelEstadisticas.style.display = "none";
            
            // 🚫 Ocultar accesos administrativos que no corresponden a su nivel
            if (cardContratacion) cardContratacion.style.display = "none";
            if (cardCredenciales) cardCredenciales.style.display = "none";
            
            // 👇 Para los empleados, aseguramos que SÍ vean la tarjeta de Novedades si existe en el inicio
            if (cardModuloNovedades) cardModuloNovedades.style.display = "block";
            
        } else {
            // 🔓 Si es Admin, SuperAdmin o SST, mostrar estadísticas globales e inyectar contadores
            if (panelEstadisticas) {
                panelEstadisticas.style.display = "grid"; 
                
                if (document.getElementById("totalEmpleados")) document.getElementById("totalEmpleados").textContent = c.empleados;
                if (document.getElementById("totalUsuarios")) document.getElementById("totalUsuarios").textContent = c.usuarios;
                if (document.getElementById("totalCapacitaciones")) document.getElementById("totalCapacitaciones").textContent = c.capacitaciones;
                if (document.getElementById("totalCertificados")) document.getElementById("totalCertificados").textContent = c.certificados;
            }

            // 🔓 Asegurar que las tarjetas administrativas se vean
            if (cardContratacion) cardContratacion.style.display = "flex";
            if (cardCredenciales) cardCredenciales.style.display = "flex";
            
            // 👇 Si es administrador, OCULTAMOS la tarjeta de Novedades del inicio
            // (porque ya la tienen dentro del módulo de Nómina)
            if (cardModuloNovedades) cardModuloNovedades.style.display = "none";
        }

        // ==========================================================================
        // 🎯 4. APARTADO DINÁMICO DE INDUCCIÓN / ACCIONES 
        // ==========================================================================
        const cont = document.getElementById("acciones");

        if (cont) {
            if (data.completo) {
                cont.innerHTML = `
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #22c55e, #2563eb);"></div>
                    <div class="p-4 text-center">
                        <h6 class="fw-bold text-dark mb-2" style="font-size: 1rem;">
                            Inducción completada
                            <i class="fas fa-check-circle text-success ms-1"></i>
                        </h6>
                        <p class="text-muted mb-3" style="font-size: 0.78rem; line-height: 1.4;">Tus capacitaciones obligatorias de SG-SST están al día.</p>
                        
                        <div class="d-grid gap-2">
                            ${data.tiene_certificado ? `
                            <a href="/certificado" class="btn btn-success btn-sm rounded-pill fw-bold py-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-2" style="font-size: 0.85rem;">
                                <i class="fas fa-certificate"></i> Ver Certificado
                            </a>
                            ` : `
                            <a href="/firma" class="btn btn-warning btn-sm text-dark rounded-pill fw-bold py-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-2" style="font-size: 0.85rem;">
                                <i class="fas fa-pen-nib"></i> Generar Certificado
                            </a>
                            `}
                            <a href="/induccion" class="btn btn-primary btn-sm rounded-pill fw-bold py-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-2" style="font-size: 0.85rem;">
                                <i class="fas fa-circle-play"></i> Ver Inducción
                            </a>
                        </div>
                    </div>
                `;
            } else {
                cont.innerHTML = `
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: #2563eb;"></div>
                    <div class="p-4 text-center">
                        <h6 class="fw-bold text-dark mb-2" style="font-size: 1rem;">
                            Inducción pendiente
                            <i class="fas fa-clock text-warning ms-1"></i>
                        </h6>
                        <p class="text-muted mb-3" style="font-size: 0.78rem; line-height: 1.4;">Es necesario finalizar tu capacitación de seguridad y salud antes de operar.</p>
                        
                        <a href="/induccion" class="btn btn-primary btn-sm w-100 rounded-pill fw-bold py-2 shadow-sm d-inline-flex align-items-center justify-content-center gap-2" style="font-size: 0.85rem;">
                            <i class="fas fa-arrow-right"></i> Continuar Inducción
                        </a>
                    </div>
                `;
            }
        }

        // ==========================================================================
        // 🔗 5. ENLACE DE REDIRECCIÓN AL CLIC EN EL CUADRO DE PERFIL
        // ==========================================================================
        const btnPerfil = document.getElementById("btnPerfil");
        if (btnPerfil) {
            btnPerfil.addEventListener("click", () => {
                window.location.href = "/perfil";
            });
        }

        // ==========================================================================
        // 🚪 6. CONTROL DE CERRAR SESIÓN
        // ==========================================================================
        const btnLogout = document.getElementById("btnLogout");
        if (btnLogout) {
            btnLogout.addEventListener("click", async (e) => {
                e.preventDefault(); 

                try {
                    let response = await fetch('/api/logout', { 
                        method: 'POST',
                        credentials: 'include' 
                    });

                    if (response.status === 404) {
                        response = await fetch('/api/logout', { 
                            method: 'GET',
                            credentials: 'include' 
                        });
                    }

                    window.location.replace("/"); 

                } catch (err) {
                    console.error("Error al intentar cerrar sesión:", err);
                    window.location.replace("/");
                }
            });
        }

    } catch (error) {
        console.error("Error crítico procesando el dashboard de usuario:", error);
    }
});