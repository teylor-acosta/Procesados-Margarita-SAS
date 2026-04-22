document.addEventListener('DOMContentLoaded', async () => {
    console.log("Cargando certificado...");
    await cargarDatosCertificado();
});

async function cargarDatosCertificado() {
    const loadingDiv = document.getElementById('loadingCertificado');
    const contenidoDiv = document.getElementById('contenidoCertificado');
    const accionesDiv = document.getElementById('accionesCertificado');
    
    try {
        const response = await fetch('/api/datos-certificado');
        const result = await response.json();
        
        console.log("Respuesta:", result);
        
        if (result.success && result.datos) {
            const datos = result.datos;
            
            document.getElementById('nombreEmpleado').textContent = datos.nombre || 'Empleado';
            document.getElementById('documentoEmpleado').textContent = `Identificado(a) con documento de identidad No ${datos.numero_documento || 'N/A'}`;
            document.getElementById('nombreEmpleadoFirma').textContent = datos.nombre || 'Empleado';
            
            const notaPromedio = Math.round(datos.nota_promedio || 0);
            document.getElementById('notaPromedio').textContent = notaPromedio;
            
            const fecha = datos.fecha_completado ? new Date(datos.fecha_completado) : new Date();
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            const fechaFormateada = `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
            document.getElementById('fechaCertificado').innerHTML = `
                <i class="fas fa-calendar-alt me-2"></i> 
                Bogotá, Colombia, ${fechaFormateada}
            `;
            
            await cargarFirmaEmpleado();
            
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (contenidoDiv) contenidoDiv.style.display = 'block';
            if (accionesDiv) accionesDiv.style.display = 'flex';
        } else {
            throw new Error(result.error || 'No se pudieron cargar los datos');
        }
    } catch (error) {
        console.error('Error:', error);
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-4x mb-3"></i>
                    <h4>Error al cargar el certificado</h4>
                    <p>${error.message}</p>
                    <button class="btn-degradado mt-3" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }
}

async function cargarFirmaEmpleado() {
    try {
        const response = await fetch('/api/obtener-firma');
        const result = await response.json();
        
        const firmaContainer = document.getElementById('firmaEmpleado');
        
        if (result.success && result.firma) {
            firmaContainer.innerHTML = `<img src="${result.firma}" alt="Firma del empleado" style="max-width: 200px; max-height: 80px;">`;
        } else {
            firmaContainer.innerHTML = `<i class="fas fa-signature fa-3x text-muted"></i><p class="text-muted small mt-2">Sin firma registrada</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

document.getElementById('btnDescargarPDF').addEventListener('click', async () => {
    const btn = document.getElementById('btnDescargarPDF');
    const textoOriginal = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando PDF...';
    
    const element = document.getElementById('certificadoCard');
    
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Certificado_Induccion_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar el PDF');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
});

function irADashboard() {
    window.location.href = '/dashboard';
}