/* =========================================================
   PROCESADOS MARGARITA S.A.S.
   Servicio de Correos con Nodemailer (Gmail SMTP)
   ========================================================= */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/* =========================================================
   1. CONFIGURACIÓN DEL TRANSPORTADOR (Gmail)
   ========================================================= */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // notificaciones@procesadosmargaritasas.com
        pass: process.env.EMAIL_PASS  // Procesados.6605
    }
});
/* =========================================================
   2. FUNCIÓN PARA LEER Y REEMPLAZAR LAS VARIABLES
   ========================================================= */
function cargarPlantilla(nombreArchivo, datos) {
    const ruta = path.join(__dirname, '..', 'plantillas', nombreArchivo);

    if (!fs.existsSync(ruta)) {
        throw new Error(`La plantilla no existe: ${ruta}`);
    }

    let html = fs.readFileSync(ruta, 'utf8');

    // Reemplazar todas las variables {{clave}} del HTML
    Object.keys(datos).forEach((clave) => {
        const valor = datos[clave] !== undefined ? datos[clave] : '';
        html = html.replace(new RegExp(`{{${clave}}}`, 'g'), valor);
    });

    return html;
}

/* =========================================================
   3. FORMATEADOR DE MONEDA
   ========================================================= */
const formatoMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor || 0);
};

/* =========================================================
   4. FUNCIÓN: NOTIFICAR NUEVO PEDIDO AL PROPIETARIO
   -----------------------------------------------------
   Aquí está la magia: separamos los productos de los 
   materiales para que el correo se vea profesional.
   ========================================================= */
async function notificarPedidoPropietario(pedido) {
    try {
        // 1. Separar productos de materiales
        const productosNormales = pedido.productos.filter(p => p.tipo !== 'material');
        const materialesCotizar = pedido.productos.filter(p => p.tipo === 'material');

        // 2. Armar las filas de la tabla para los productos
        const filasProductos = productosNormales.map((p) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <strong>${p.nombre}</strong>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    ${p.cantidad}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                    ${formatoMoneda(p.precio)}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #079455; font-weight: bold;">
                    ${formatoMoneda(p.total)}
                </td>
            </tr>
        `).join('');

        // Si no hay productos, mostramos un mensaje
        const contenidoProductos = filasProductos || `
            <tr>
                <td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">
                    No se seleccionaron productos con precio fijo. (Solo materiales para cotizar)
                </td>
            </tr>
        `;

        // 3. Armar el bloque HTML de los materiales si existen
        let bloqueMateriales = '';
        if (materialesCotizar.length > 0) {
            const filasMateriales = materialesCotizar.map((p) => `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #fef3c7;">
                        <strong>${p.nombre}</strong>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #fef3c7; text-align: center;">
                        ${p.cantidad} kg / ud
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #fef3c7; text-align: right; color: #b45309; font-weight: bold;">
                        Por cotizar
                    </td>
                </tr>
            `).join('');

            bloqueMateriales = `
                <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                    <h3 style="color: #b45309; font-size: 18px; margin: 0 0 10px 0;">
                        ⚠️ Solicitud de Cotización de Materiales
                    </h3>
                    <p style="color: #78350f; font-size: 14px; margin: 0 0 15px 0;">
                        El cliente solicita los siguientes materiales. <strong>Es necesario llamarlo para negociar el precio:</strong>
                    </p>
                    <div style="background: #ffffff; border-radius: 10px; padding: 10px; margin-bottom: 15px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 8px; color: #78350f;">Material</th>
                                    <th style="text-align: center; padding: 8px; color: #78350f;">Cantidad</th>
                                    <th style="text-align: right; padding: 8px; color: #78350f;">Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filasMateriales}
                            </tbody>
                        </table>
                    </div>
                    <p style="margin: 0; font-size: 15px; color: #b45309;">
                        📞 <strong>Llamar a:</strong> <a href="tel:${pedido.telefono}" style="color: #b45309; font-weight: 900;">${pedido.telefono}</a>
                    </p>
                </div>
            `;
        }

        // 4. Juntar todos los datos para la plantilla
        const datos = {
            numero_pedido: pedido.numero,
            fecha: new Date(pedido.fecha).toLocaleString('es-CO'),
            cliente: pedido.cliente,
            correo_cliente: pedido.correo,
            telefono_cliente: pedido.telefono,
            productos: contenidoProductos,
            bloque_materiales: bloqueMateriales,
            subtotal: formatoMoneda(pedido.subtotal),
            total: formatoMoneda(pedido.total),
            envio: pedido.envio ? formatoMoneda(pedido.envio) : 'Por confirmar',
            observaciones: pedido.observaciones || 'Sin observaciones.',
            telefono_empresa: process.env.TELEFONO_EMPRESA || '[Ingresar número aquí]'
        };

        const html = cargarPlantilla('pedido-propietario.html', datos);

        const opciones = {
            from: `"${process.env.NOMBRE_REMITENTE}" <${process.env.GMAIL_USER}>`,
            to: process.env.CORREO_PROPIETARIO,
            subject: `🛒 Nuevo Pedido #${pedido.numero} - Procesados Margarita`,
            html
        };

        await transporter.sendMail(opciones);
        console.log('✅ Correo al propietario enviado con éxito.');
        return true;

    } catch (error) {
        console.error('❌ Error enviando correo al propietario:', error);
        return false;
    }
}

/* =========================================================
   5. FUNCIÓN: NOTIFICAR PEDIDO CONFIRMADO AL CLIENTE
   ========================================================= */
async function notificarPedidoConfirmado(pedido) {
    try {
        const filasProductos = pedido.productos.map((p) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <strong>${p.nombre}</strong>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    ${p.cantidad}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                    ${p.tipo === 'material' ? 'Por cotizar' : formatoMoneda(p.precio)}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #079455; font-weight: bold;">
                    ${p.tipo === 'material' ? 'Por cotizar' : formatoMoneda(p.total)}
                </td>
            </tr>
        `).join('');

        const datos = {
            numero_pedido: pedido.numero,
            cliente: pedido.cliente,
            telefono_cliente: pedido.telefono,
            productos: filasProductos,
            telefono_empresa: process.env.TELEFONO_EMPRESA || '[Ingresar número aquí]'
        };

        const html = cargarPlantilla('pedido-confirmado.html', datos);

        const opciones = {
            from: `"${process.env.NOMBRE_REMITENTE}" <${process.env.GMAIL_USER}>`,
            to: pedido.correo,
            subject: `✅ Tu pedido #${pedido.numero} ha sido confirmado`,
            html
        };

        await transporter.sendMail(opciones);
        console.log(`✅ Correo de confirmación enviado a ${pedido.correo}.`);
        return true;

    } catch (error) {
        console.error('❌ Error enviando correo de confirmación:', error);
        return false;
    }
}

/* =========================================================
   6. FUNCIÓN: NOTIFICAR PEDIDO RECHAZADO AL CLIENTE
   ========================================================= */
async function notificarPedidoRechazado(pedido, motivo) {
    try {
        const filasProductos = pedido.productos.map((p) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                    <strong>${p.nombre}</strong>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
                    ${p.cantidad}
                </td>
            </tr>
        `).join('');

        const datos = {
            numero_pedido: pedido.numero,
            cliente: pedido.cliente,
            motivo: motivo || 'No especificado por la empresa',
            productos: filasProductos,
            telefono_empresa: process.env.TELEFONO_EMPRESA || '[Ingresar número aquí]'
        };

        const html = cargarPlantilla('pedido-rechazado.html', datos);

        const opciones = {
            from: `"${process.env.NOMBRE_REMITENTE}" <${process.env.GMAIL_USER}>`,
            to: pedido.correo,
            subject: `❌ Actualización sobre tu pedido #${pedido.numero}`,
            html
        };

        await transporter.sendMail(opciones);
        console.log(`✅ Correo de rechazo enviado a ${pedido.correo}.`);
        return true;

    } catch (error) {
        console.error('❌ Error enviando correo de rechazo:', error);
        return false;
    }
}

/* =========================================================
   7. EXPORTAR LAS FUNCIONES
   ========================================================= */
module.exports = {
    notificarPedidoPropietario,
    notificarPedidoConfirmado,
    notificarPedidoRechazado
};