let datosCertificado = null;

document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosCertificado();
});

async function cargarDatosCertificado() {
    const contenedor = document.getElementById('certificadoContent');
    try {
        // Apuntamos a la ruta centralizada en app.js
        const response = await fetch('/api/datos-certificado');
        const result = await response.json();
        
        if (result.success && result.datos) {
            datosCertificado = result.datos;
            renderizarCertificado();
        } else {
            // Manejo de error si no ha terminado la inducción o no hay firma
            contenedor.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <h4>Certificado no disponible</h4>
                    <p>${result.message || 'Asegúrate de haber aprobado todas las evaluaciones y haber guardado tu firma digital.'}</p>
                    <div class="mt-3">
                        <a href="/induccion" class="btn-gradient me-2">Ir a Inducción</a>
                        <a href="/firma" class="btn-gradient">Ir a Firmar</a>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        contenedor.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-wifi-slash fa-2x"></i>
                <p>Error de conexión con el servidor al generar el certificado.</p>
            </div>
        `;
    }
}

function renderizarCertificado() {
    // Validamos la fecha: si no viene del servidor, usamos la actual
    const fechaValida = datosCertificado.fecha_emision ? new Date(datosCertificado.fecha_emision) : new Date();
    const mes = fechaValida.toLocaleString('es-CO', { month: 'long' });
    
    let html = `
        <div class="certificado-pdf" id="certificadoParaPDF">
            <div class="marca-agua">
                <img src="img/marca_agua.png" alt="Marca de agua" onerror="this.style.display='none'">
            </div>
            <div class="contenido-certificado">
                <div class="certificado-header">
                    <img src="img/9903400.png" alt="Logo" class="certificado-logo">
                    <h1 class="certificado-titulo-principal">PROCESADOS MARGARITA SAS</h1>
                    <h3 class="certificado-subtitulo">Certificado de Inducción</h3>
                    <div class="certificado-linea"></div>
                </div>
                
                <div class="certificado-texto">
                    <p>El Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)</p>
                    <p>de <strong>Procesados Margarita SAS</strong> Certifica que:</p>
                </div>
                
                <div class="certificado-nombre">${datosCertificado.nombre}</div>
                
                <div class="certificado-datos">
                    <p>Identificado(a) con Cédula de Ciudadanía No. <strong>${datosCertificado.numero_documento}</strong></p>
                </div>
                
                <div class="certificado-curso">
                    <p>Completó y aprobó satisfactoriamente el curso de:</p>
                    <p class="certificado-curso-titulo">INDUCCIÓN EMPRESARIAL PROCESADOS MARGARITA SAS</p>
                </div>
                
                <div class="certificado-modulos">
                    <p>Que incluye los módulos de Reglamento Interno, Políticas de Seguridad y Procesos Operativos.</p>
                </div>
                
                <div class="certificado-fecha">
                    <p>Se firma el presente en Bogotá D.C., a los <strong>${fechaValida.getDate()}</strong> días del mes de <strong>${mes}</strong> de <strong>${fechaValida.getFullYear()}</strong></p>
                </div>
                
                <div class="certificado-firmas">
                    <div class="firma-empleado">
                        ${datosCertificado.firma_data ? `<img src="${datosCertificado.firma_data}" alt="Firma del Empleado">` : '<div class="firma-linea"></div>'}
                        <div class="firma-nombre">${datosCertificado.nombre}</div>
                        <div class="firma-cargo">Empleado</div>
                    </div>
                    <div class="firma-representante">
                        <div class="firma-linea"></div>
                        <div class="firma-nombre">Maria Margarita Herrera</div>
                        <div class="firma-cargo">Representante Legal</div>
                    </div>
                </div>
                
                <div class="certificado-pie">
                    <span><strong>Código:</strong> ${datosCertificado.codigo_certificado || 'PENDIENTE'}</span> | 
                    <span><strong>Nota:</strong> ${Math.round(datosCertificado.nota_final || 0)}%</span>
                </div>
            </div>
        </div>`;
        
    document.getElementById('certificadoContent').innerHTML = html;
}

async function generarPDF() {
    const element = document.getElementById('certificadoParaPDF');
    if (!element) return;
    
    // Buscar el botón por clase o por ID
    const btn = document.querySelector('.btn-pdf') || document.querySelector('button[onclick="generarPDF()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando...';
    }
    
    try {
        // html2canvas con scale 3 para alta resolución
        const canvas = await html2canvas(element, { 
            scale: 3, 
            useCORS: true,
            logging: false 
        });
        
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        // Formato A4 Horizontal (Landscape)
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
        pdf.save(`Certificado_Induccion_${datosCertificado.numero_documento}.pdf`);
    } catch (e) {
        console.error('Error al generar PDF:', e);
        alert("Hubo un problema al generar el archivo PDF.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Descargar Certificado PDF';
        }
    }
}