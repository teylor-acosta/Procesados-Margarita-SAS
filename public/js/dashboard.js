let usuarioActual = null;
let induccionCompleta = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Ejecutamos ambas verificaciones
    await Promise.all([cargarUsuario(), verificarInduccion()]);
});

async function cargarUsuario() {
    try {
        const response = await fetch('/api/usuario-actual');
        const data = await response.json();
        
        if (data.success) {
            usuarioActual = data.usuario;
            renderizarDashboard();
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
        window.location.href = '/login';
    }
}

async function verificarInduccion() {
    try {
        // Ajustado a la ruta que definimos en app.js para validar progreso
        const response = await fetch('/api/check-acceso');
        const data = await response.json();
        
        if (data.success) {
            // Si la redirección sugerida es el dashboard, significa que ya completó la inducción
            induccionCompleta = (data.redirect === '/dashboard');
            actualizarBotonHeader();
        }
    } catch (error) {
        console.error('Error verificando inducción:', error);
    }
}

function actualizarBotonHeader() {
    const btnHeader = document.getElementById('btnAccionHeader');
    if (!btnHeader) return;

    if (induccionCompleta) {
        btnHeader.innerHTML = '<i class="fas fa-arrow-right me-2"></i>Ingresar al ERP';
        btnHeader.className = 'btn-ingresar-erp-custom'; 
        btnHeader.style.background = 'linear-gradient(135deg, #28a745, #007bff)';
    } else {
        btnHeader.innerHTML = '<i class="fas fa-sign-out-alt me-2"></i>Cerrar sesión';
        btnHeader.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    }
}

function renderizarDashboard() {
    if (!usuarioActual) return;
    const container = document.getElementById('contenidoDashboard');
    
    let html = `
        <div class="dashboard-layout">
            <div class="sidebar">
                <div class="sidebar-card">
                    <div class="sidebar-header"><i class="fas fa-user-circle"></i> <h4>Sesión Activa</h4></div>
                    <div class="sidebar-body">
                        ${crearInfoRow('user', 'Ingresaste como', usuarioActual.nombre)}
                        ${crearInfoRow('tag', 'Rol', usuarioActual.rol || 'Empleado')}
                        ${crearInfoRow('briefcase', 'Cargo', usuarioActual.cargo || 'General')}
                        ${crearInfoRow('id-card', 'Documento', usuarioActual.numero_documento)}
                    </div>
                </div>
            </div>
            
            <div class="content-main">
                <div class="info-card">
                    <div class="info-card-header"><h4><i class="fas fa-chart-line"></i> Procesados Margarita SAS</h4></div>
                    <div class="info-card-body">
                        <p class="info-text">Empresa líder en <strong>economía circular</strong> y transformación de plásticos en Bogotá.</p>
                        <p class="info-text mt-2 small">📍 Calle 74 Sur N.º 87B-77 | NIT: 900.509.538-1</p>
                    </div>
                </div>

                <div class="mision-vision-grid">
                    <div class="mv-item"><i class="fas fa-bullseye"></i> <h5>Misión</h5><p>Cuidado del medio ambiente mediante el manejo integral de residuos.</p></div>
                    <div class="mv-item"><i class="fas fa-eye"></i> <h5>Visión 2030</h5><p>Liderazgo regional en tecnología de reciclaje industrial.</p></div>
                </div>`;

    // Bloque de Inducción (Solo si no está completa)
    if (!induccionCompleta) {
        html += `
            <div class="info-card mt-4 border-warning">
                <div class="info-card-header bg-light-warning">
                    <h4 class="text-warning"><i class="fas fa-graduation-cap"></i> Inducción Pendiente</h4>
                </div>
                <div class="info-card-body text-center">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                    <p>Tu proceso de inducción está incompleto. Debes finalizarlo para habilitar el ERP.</p>
                    <button class="btn btn-warning w-100 mt-2" onclick="window.location.href='/induccion'">
                        <i class="fas fa-play-circle me-2"></i>Continuar Inducción
                    </button>
                </div>
            </div>`;
    } else {
        // Bloque opcional si ya terminó: Ver Certificado
        html += `
            <div class="info-card mt-4 border-success">
                <div class="info-card-header bg-light-success">
                    <h4 class="text-success"><i class="fas fa-check-circle"></i> Inducción Completada</h4>
                </div>
                <div class="info-card-body text-center">
                    <p>¡Felicidades! Has cumplido con todos los requisitos de ingreso.</p>
                    <button class="btn btn-success w-100 mt-2" onclick="window.location.href='/certificado'">
                        <i class="fas fa-file-medal me-2"></i>Descargar mi Certificado
                    </button>
                </div>
            </div>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;
}

function crearInfoRow(icon, label, value) {
    return `
        <div class="sidebar-info-row">
            <div class="sidebar-info-icon"><i class="fas fa-${icon}"></i></div>
            <div>
                <div class="sidebar-info-label">${label}</div>
                <div class="sidebar-info-value">${value || 'No asignado'}</div>
            </div>
        </div>`;
}

function accionHeader() {
    if (induccionCompleta) {
        // Aquí puedes poner la URL de tu ERP real o un mensaje
        alert('Accediendo al módulo de Gestión Integral...');
    } else {
        window.location.href = '/logout';
    }
}