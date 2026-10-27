document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // Convertimos score a número y manejamos el parámetro 'aprobado'
    // En JS, '1' == true es falso, así que comparamos con la cadena o el número
    const score = Math.round(parseFloat(params.get('score'))) || 0;
    const aprobadoParam = params.get('aprobado');
    const aprobado = aprobadoParam === 'true' || aprobadoParam === '1';
    const capituloId = params.get('capitulo');

    const contenedor = document.getElementById('resultadoContenedor');
    if (!contenedor) return;

    // Definimos la configuración visual basada en el resultado
    const config = aprobado ? {
        icon: 'fa-check-circle',
        colorClass: 'text-success',
        title: '¡EVALUACIÓN APROBADA!',
        message: 'Excelente, has demostrado los conocimientos necesarios en este módulo.',
        btnText: 'Continuar con la Inducción',
        btnClass: 'btn-gradient', 
        link: '/induccion'
    } : {
        icon: 'fa-times-circle',
        colorClass: 'text-danger',
        title: 'NO APROBADO',
        message: 'No has alcanzado el puntaje mínimo. Te recomendamos repasar el material.',
        btnText: 'Reintentar Evaluación',
        btnClass: 'btn-danger', 
        // Si tenemos el ID del capítulo, lo mandamos de vuelta a la evaluación específica
        link: capituloId ? `/evaluacion?id=${capituloId}` : '/induccion'
    };

    contenedor.innerHTML = `
        <div class="resumen-card text-center animate__animated animate__zoomIn p-4 shadow-lg bg-white rounded-4">
            <div class="mb-4">
                <i class="fas ${config.icon} fa-5x ${config.colorClass}"></i>
            </div>
            <h2 class="fw-bold ${config.colorClass} mb-3">${config.title}</h2>
            
            <div class="my-4 p-3 bg-light rounded-3">
                <div class="display-4 fw-bold ${config.colorClass}">${score}%</div>
                <p class="text-muted mt-2 mb-0">${config.message}</p>
            </div>

            <div class="d-grid gap-3">
                <a href="${config.link}" class="btn ${config.btnClass} btn-lg py-3 shadow-sm fw-bold">
                    ${config.btnText}
                </a>
                <a href="/induccion" class="text-decoration-none text-secondary small">
                    <i class="fas fa-th-large me-1"></i> Volver al panel de módulos
                </a>
            </div>
        </div>
    `;
});