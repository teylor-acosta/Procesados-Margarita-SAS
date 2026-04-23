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
            
            loadingDiv.style.display = 'none';
            contenidoDiv.style.display = 'block';
            accionesDiv.style.display = 'flex';

        } else {
            throw new Error(result.error || 'No se pudieron cargar los datos');
        }

    } catch (error) {
        console.error('Error:', error);
        loadingDiv.innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-4x mb-3"></i>
                <h4>Error al cargar el certificado</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function cargarFirmaEmpleado() {
    try {
        const response = await fetch('/api/obtener-firma');
        const result = await response.json();
        
        const firmaContainer = document.getElementById('firmaEmpleado');
        
        if (result.success && result.firma) {
            firmaContainer.innerHTML = `<img src="${result.firma}" style="max-width: 140px; max-height: 65px;">`;
        } else {
            firmaContainer.innerHTML = `<i class="fas fa-signature fa-3x text-muted"></i>`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function generarPDF() {
    const element = document.getElementById('certificadoCard');

    // 🔥 ACTIVAR MODO PDF
    document.body.classList.add("certificado-pdf");

    // 🔥 Crear contenedor centrador
    const wrapper = document.createElement("div");

    wrapper.style.width = "279mm";
    wrapper.style.height = "216mm";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems = "center";
    wrapper.style.background = "#ffffff";

    const clone = element.cloneNode(true);

    clone.style.margin = "0";
    clone.style.boxShadow = "none";

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    await new Promise(resolve => setTimeout(resolve, 300));

    const opt = {
        margin: 0,
        filename: `Certificado_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
            scale: 3,
            useCORS: true,
            backgroundColor: "#ffffff"
        },
        jsPDF: {
            unit: 'mm',
            format: 'letter',
            orientation: 'landscape'
        }
    };

    try {
        await html2pdf().set(opt).from(wrapper).save();

    } catch (error) {
        console.error("Error generando PDF:", error);

    } finally {
        // 🔥 LIMPIEZA TOTAL (CLAVE PARA QUE NO DESAPAREZCAN BOTONES)
        if (document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
        }

        document.body.classList.remove("certificado-pdf");
    }
}

// 🔥 ESPERAR A QUE EL DOM CARGUE EL BOTÓN
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnDescargarPDF');

    if (btn) {
        btn.addEventListener('click', async () => {
            const textoOriginal = btn.innerHTML;

            btn.disabled = true;
            btn.innerHTML = 'Generando PDF...';

            try {
                await generarPDF();
            } catch (error) {
                alert('Error al generar el PDF');
            } finally {
                btn.disabled = false;
                btn.innerHTML = textoOriginal;
            }
        });
    }
});

function irADashboard() {
    window.location.href = '/dashboard';
}