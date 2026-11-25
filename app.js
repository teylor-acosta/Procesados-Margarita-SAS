/* ============================================================
   PROCESADOS MARGARITA S.A.S.
   SERVIDOR PRINCIPAL DEL ERP
   Archivo: app.js
   Actualización: 24/11/2026
============================================================ */

// ============================================================
// 01. VARIABLES DE ENTORNO
// ============================================================

require('dotenv').config();

// ============================================================
// 02. DEPENDENCIAS
// ============================================================

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');

const db = require('./DB');

// ============================================================
// 03. SERVICIOS INTERNOS
// ============================================================

const cumpleanosService = require(
    './public/servicios/cumpleanos.service'
);

const {
    notificarPedidoPropietario,
    notificarPedidoConfirmado,
    notificarPedidoRechazado
} = require('./public/servicios/correo');

// ============================================================
// 04. CONFIGURACIÓN GENERAL
// ============================================================

const app = express();

const PORT = process.env.PORT || 3000;

const ES_PRODUCCION =
    process.env.NODE_ENV === 'production';

const PUBLIC_DIR = path.join(
    __dirname,
    'public'
);

const SERVICIOS_DIR = path.join(
    PUBLIC_DIR,
    'servicios'
);

const PLANTILLAS_DIR = path.join(
    SERVICIOS_DIR,
    'plantillas'
);

// Validar configuración de sesiones.

if (!process.env.SESSION_SECRET) {
    throw new Error(
        'Falta SESSION_SECRET en el archivo .env'
    );
}

// Configuración para servidores detrás de un proxy.

if (ES_PRODUCCION) {
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// ============================================================
// 05. CONFIGURACIÓN DE MULTER
// ============================================================

const upload = multer({
    dest: 'uploads/'
});

// ============================================================
// 06. BODY PARSER
// ============================================================

app.use(express.urlencoded({
    extended: true,
    limit: '50mb'
}));

app.use(express.json({
    limit: '50mb'
}));

// ============================================================
// 07. CORS CON CREDENCIALES
// ============================================================

app.use(cors({
    origin: true,
    credentials: true
}));

// ============================================================
// 08. CONFIGURACIÓN DE SESIONES
// ============================================================

app.use(session({
    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {
        secure: ES_PRODUCCION,

        httpOnly: true,

        sameSite: 'lax',

        maxAge: 8 * 60 * 60 * 1000
    }
}));

// ============================================================
// 09. CONTROL DE CACHÉ
// ============================================================

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');

    next();
});

// ============================================================
// 10. CABECERAS DE SEGURIDAD
// ============================================================

app.use((req, res, next) => {
    res.setHeader(
        'X-Content-Type-Options',
        'nosniff'
    );

    next();
});

// ============================================================
// 11. PETICIONES INTERNAS DE CHROME DEVTOOLS
// ============================================================

app.use((req, res, next) => {
    if (
        req.path.startsWith(
            '/.well-known/appspecific'
        )
    ) {
        return res.status(204).end();
    }

    next();
});

// ============================================================
// 12. PROTECCIÓN DE ARCHIVOS INTERNOS
// ============================================================

// IMPORTANTE:
// Este middleware debe ejecutarse ANTES de express.static.
//
// Los servicios internos deben ser utilizados únicamente
// desde el backend.
//
// Archivos protegidos:
//
// public/servicios/correo.js
// public/servicios/cronograma-excel.service.js
// public/servicios/cumpleanos.service.js
// public/servicios/plantillas/FT-SST-147.xlsx
// public/servicios/plantillas/tarjeta-cumpleanos.png
// public/servicios/plantillas/felicitacion-cumpleanos.html
//
// También quedan protegidas las plantillas del chatbot.

app.use((req, res, next) => {
    let ruta;

    try {
        ruta = decodeURIComponent(req.path);

    } catch {
        return res.status(400).send(
            'Solicitud no válida'
        );
    }

    ruta = ruta.replace(/\\/g, '/');

    const rutaNormalizada = path.posix
        .normalize(ruta)
        .toLowerCase();

    const segmentos = rutaNormalizada
        .split('/')
        .filter(Boolean);

    // Bloquear servicios internos.

    if (segmentos.includes('servicios')) {
        return res.status(404).send(
            'Recurso no encontrado'
        );
    }

    // Bloquear archivos y carpetas sensibles.

    const archivosProtegidos = [
        '.env',
        '.git',
        'node_modules',
        'package.json',
        'package-lock.json',
        'app.js',
        'server.js',
        'db.js'
    ];

    const accesoProtegido = segmentos.some(
        segmento =>
            archivosProtegidos.includes(segmento) ||
            segmento.startsWith('.env.')
    );

    if (accesoProtegido) {
        return res.status(404).send(
            'Recurso no encontrado'
        );
    }

    next();
});

// ============================================================
// 13. PROTEGER ACCESO DIRECTO A ARCHIVOS HTML
// ============================================================

app.use((req, res, next) => {
    let ruta;

    try {
        ruta = decodeURIComponent(req.path)
            .replace(/\\/g, '/');

    } catch {
        return res.status(400).send(
            'Solicitud no válida'
        );
    }

    ruta = path.posix
        .normalize(ruta)
        .toLowerCase();

    const archivosPermitidos = [
        '/components/sidebar.html',
        '/tienda.html',
        '/carrito.html'
    ];

    if (
        ruta.endsWith('.html') &&
        !archivosPermitidos.includes(ruta)
    ) {
        return res.status(404).send(
            'Página no encontrada'
        );
    }

    next();
});

// ============================================================
// 14. RECURSOS ESTÁTICOS
// ============================================================

app.use(express.static(
    PUBLIC_DIR,
    {
        index: false,

        dotfiles: 'deny'
    }
));

// Archivos públicos.

app.use(
    '/uploads',

    express.static(
        path.join(
            PUBLIC_DIR,
            'uploads'
        ),
        {
            index: false,
            dotfiles: 'deny'
        }
    )
);

// Videos.

app.use(
    '/videos',

    express.static(
        path.join(
            PUBLIC_DIR,
            'videos'
        ),
        {
            index: false,
            dotfiles: 'deny'
        }
    )
);

// Archivos cargados por el sistema.
// Se conserva la ruta existente para evitar afectar
// los módulos que actualmente la utilizan.

app.use(
    '/uploads',

    express.static(
        path.join(
            __dirname,
            'uploads'
        ),
        {
            index: false,
            dotfiles: 'deny'
        }
    )
);

// ============================================================
// 15. CONEXIÓN COMPARTIDA A MYSQL
// ============================================================

app.set('db', db);

// ============================================================
// 16. RUTAS PRINCIPALES DEL ERP
// ============================================================

app.use(
    require('./routes/views.routes')
);

app.use(
    require('./routes/auth.routes')
);

app.use(
    require('./routes/empleados.routes')
);

app.use(
    require('./routes/expediente.routes')
);

app.use(
    require('./routes/induccion.routes')
);

app.use(
    require('./routes/evaluacion.routes')
);

app.use(
    require('./routes/evaluaciones-admin.routes')
);

app.use(
    require('./routes/preguntas-induccion.routes')
);

app.use(
    require('./routes/curso-preguntas.routes')
);

app.use(
    require('./routes/curso-material.routes')
);

app.use(
    require('./routes/curso-evaluaciones.routes')
);

app.use(
    require('./routes/firma.routes')
);

app.use(
    require('./routes/certificado.routes')
);

app.use(
    require('./routes/certificado-capacitacion.routes')
);

app.use(
    require('./routes/evaluacion-capacitacion.routes')
);

app.use(
    require('./routes/perfil.routes')
);

app.use(
    require('./routes/catalogos.routes')
);

app.use(
    require('./routes/documentacion.routes')
);

// ============================================================
// 17. DOCUMENTOS Y ACEPTACIONES
// ============================================================

app.use(
    require('./routes/documentos-lectura.routes')
);

app.use(
    require('./routes/centro-actividad.routes')
);

// ============================================================
// 18. USUARIOS Y CONTROL DE ACCESO
// ============================================================

app.use(
    '/api/usuarios',

    require('./routes/crear-usuario.routes')
);

app.use(
    '/api/usuarios',

    require('./routes/usuarios-registrados.routes')
);

app.use(
    '/api/dashboard-usuarios',

    require('./routes/dashboard-usuarios.routes')
);

app.use(
    require('./routes/roles-acceso.routes')
);

// ============================================================
// 19. CAPACITACIONES
// ============================================================

app.use(
    require('./routes/capacitaciones.routes')
);

app.use(
    require('./routes/centro-capacitaciones.routes')
);

app.use(
    require('./routes/mis-capacitaciones.routes')
);

app.use(
    require('./routes/finalizar-capacitacion.routes')
);

app.use(
    require('./routes/seguimiento-general.routes')
);

// ============================================================
// 20. NÓMINA
// ============================================================

app.use(
    require('./routes/nomina.routes')
);

// Liquidación de nómina.

app.use(
    require('./routes/nomina-liquidacion.routes')
);

// Configuración de nómina.

app.use(
    require('./routes/nomina-configuracion.routes')
);

// Préstamos.

app.use(
    require('./routes/nomina-prestamos.routes')
);

// Gastos diarios.

app.use(
    require('./routes/gastos-diarios.routes')
);

// Novedades de nómina.

app.use(
    '/api/nomina/novedades',

    require('./routes/nomina-novedades.routes')
);

// ============================================================
// 21. SIDEBAR DINÁMICO
// ============================================================

app.use(
    '/api/sidebar',

    require('./routes/sidebar.routes')
);
// ============================================================
// MÓDULO DE NOVEDADES DE NÓMINA
// ============================================================

app.use(
    '/api/nomina/novedades',
    require('./routes/nomina-novedades.routes')
);

// ============================================================
// 22. PRODUCCIÓN
// ============================================================

app.use(
    require('./routes/produccion.routes')
);

// ============================================================
// 23. HISTORIAL Y REPORTES
// ============================================================

app.use(
    require('./routes/reportes.routes')
);

// ============================================================
// 24. CRONOGRAMA DE TRANSFORMÍN
// ============================================================

// Este router administra:
//
// - Actividades manuales.
// - Actividades corporativas FT-SST-147.
// - Importación y exportación Excel.
// - Cumplimiento anual y mensual.
// - Integración con Recursos Humanos.
// - Configuración de cumpleaños.
// - Tarjetas corporativas personalizadas.
// - Recordatorios y felicitaciones.
// - Historial de actividades y notificaciones.
//
// El router debe implementar sus propias validaciones
// de sesión, roles y permisos.

app.use(
    '/cronograma-transformin',

    require('./routes/cronograma-transformin.routes')
);

// ============================================================
// 25. VISTA DE LIQUIDACIÓN POR PRODUCCIÓN
// ============================================================

app.get('/nomina/produccion', (req, res) => {
    const rutaVista = path.join(
        PUBLIC_DIR,
        'produccion.html'
    );

    if (!fs.existsSync(rutaVista)) {
        console.error(
            'No existe la vista:',
            rutaVista
        );

        return res.status(404).send(
            'Vista de liquidación por producción no encontrada. ' +
            'Verifica que el archivo exista en public/produccion.html'
        );
    }

    return res.sendFile(rutaVista);
});

// ============================================================
// 26. TEST DE CONEXIÓN MYSQL
// ============================================================

app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT 1 AS test'
        );

        return res.json(rows);

    } catch (error) {
        console.error(
            'Error de conexión MySQL:',
            error
        );

        return res.status(500).json({
            error:
                'No fue posible consultar la base de datos.'
        });
    }
});

// ============================================================
// 27. VISTAS ADICIONALES
// ============================================================

app.get('/tienda', (req, res) => {
    return res.sendFile(
        path.join(
            PUBLIC_DIR,
            'tienda.html'
        )
    );
});

app.get('/carrito', (req, res) => {
    return res.sendFile(
        path.join(
            PUBLIC_DIR,
            'carrito.html'
        )
    );
});

// ============================================================
// 28. CONFIGURACIÓN SMTP HOSTINGER
// ============================================================

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',

    port: 465,

    secure: true,

    auth: {
        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS
    },

    tls: {
        rejectUnauthorized: true
    },

    connectionTimeout: 15000,

    greetingTimeout: 15000,

    socketTimeout: 30000
});

// ============================================================
// 29. VERIFICAR CONEXIÓN SMTP
// ============================================================

async function verificarSMTPPrincipal() {
    if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
    ) {
        console.warn(
            '[SMTP] Faltan las credenciales de correo.'
        );

        return false;
    }

    try {
        await transporter.verify();

        console.log(
            '[SMTP] Hostinger conectado correctamente.'
        );

        return true;

    } catch (error) {
        console.error(
            '[SMTP] Error de conexión:',
            error.message
        );

        return false;
    }
}

// ============================================================
// 30. CARGAR PLANTILLAS HTML DEL CHATBOT
// ============================================================

function cargarPlantillaChatbot(
    nombreArchivo,
    variables
) {
    const ruta = path.join(
        PLANTILLAS_DIR,
        nombreArchivo
    );

    if (!fs.existsSync(ruta)) {
        throw new Error(
            `La plantilla del chatbot no existe: ${nombreArchivo}`
        );
    }

    let html = fs.readFileSync(
        ruta,
        'utf8'
    );

    for (
        const [llave, valor]
        of Object.entries(variables)
    ) {
        html = html.replaceAll(
            `{{${llave}}}`,

            () => String(valor ?? '')
        );
    }

    return html;
}

// ============================================================
// 31. FUNCIONES AUXILIARES DE CORREO
// ============================================================

function escaparHTML(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validarCorreo(correo) {
    return typeof correo === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            correo.trim()
        );
}

// ============================================================
// 32. API - REGISTRAR PEDIDO DE TIENDA
// ============================================================

app.post('/api/pedidos', async (req, res) => {
    try {
        const pedido = req.body;

        if (
            !pedido ||
            !pedido.cliente ||
            !pedido.correo ||
            !pedido.productos
        ) {
            return res.status(400).json({
                ok: false,

                mensaje:
                    'Faltan datos obligatorios del pedido.'
            });
        }

        pedido.numero =
            `PM-${Date.now().toString().slice(-6)}`;

        pedido.fecha =
            new Date().toISOString();

        console.log(
            `Recibiendo pedido #${pedido.numero} de ${pedido.cliente}`
        );

        const correoEnviado =
            await notificarPedidoPropietario(
                pedido
            );

        if (correoEnviado) {
            return res.status(200).json({
                ok: true,

                mensaje:
                    'Pedido registrado y correo enviado al propietario.',

                numero_pedido: pedido.numero
            });
        }

        return res.status(500).json({
            ok: false,

            mensaje:
                'El pedido se recibió pero el correo falló.'
        });

    } catch (error) {
        console.error(
            'Error en /api/pedidos:',
            error
        );

        return res.status(500).json({
            ok: false,

            mensaje:
                'Error interno del servidor.'
        });
    }
});

// ============================================================
// 33. API - CONFIRMAR PEDIDO
// ============================================================

app.post(
    '/api/pedidos/:numero/confirmar',

    async (req, res) => {
        try {
            const { numero } = req.params;

            const pedido = req.body;

            if (
                !pedido ||
                typeof pedido !== 'object' ||
                Array.isArray(pedido)
            ) {
                return res.status(400).json({
                    ok: false,

                    mensaje:
                        'Los datos del pedido no son válidos.'
                });
            }

            pedido.numero = numero;

            const enviado =
                await notificarPedidoConfirmado(
                    pedido
                );

            if (enviado) {
                return res.json({
                    ok: true,

                    mensaje:
                        'Correo de confirmación enviado al cliente.'
                });
            }

            return res.status(500).json({
                ok: false,

                mensaje:
                    'No se pudo enviar el correo.'
            });

        } catch (error) {
            console.error(
                'Error al confirmar pedido:',
                error
            );

            return res.status(500).json({
                ok: false,

                mensaje: 'Error interno.'
            });
        }
    }
);

// ============================================================
// 34. API - RECHAZAR PEDIDO
// ============================================================

app.post(
    '/api/pedidos/:numero/rechazar',

    async (req, res) => {
        try {
            const { numero } = req.params;

            const {
                motivo,
                pedido
            } = req.body || {};

            if (
                !pedido ||
                typeof pedido !== 'object' ||
                Array.isArray(pedido)
            ) {
                return res.status(400).json({
                    ok: false,

                    mensaje:
                        'Los datos del pedido no son válidos.'
                });
            }

            pedido.numero = numero;

            const enviado =
                await notificarPedidoRechazado(
                    pedido,
                    motivo
                );

            if (enviado) {
                return res.json({
                    ok: true,

                    mensaje:
                        'Correo de rechazo enviado al cliente.'
                });
            }

            return res.status(500).json({
                ok: false,

                mensaje:
                    'No se pudo enviar el correo.'
            });

        } catch (error) {
            console.error(
                'Error al rechazar pedido:',
                error
            );

            return res.status(500).json({
                ok: false,

                mensaje: 'Error interno.'
            });
        }
    }
);

// ============================================================
// 35. API - FORMULARIO DE CONTACTO
// ============================================================

app.post(
    '/api/contacto',

    upload.single('archivo'),

    async (req, res) => {
        try {

            // ================================================
            // DATOS GENERALES DE LA SOLICITUD
            // ================================================

            const tipo = String(
                req.body.tipo || 'solicitud'
            );

            const destino =
                req.body.correoDestino ||
                process.env.CORREO_SOLICITUDES;

            const asunto =
                req.body.asunto ||
                `Nueva solicitud: ${tipo}`;

            const datosStr =
                req.body.datos || '{}';

            let datos;

            try {
                datos = JSON.parse(datosStr);

            } catch {
                return res.status(400).json({
                    ok: false,

                    mensaje:
                        'Los datos del formulario no son válidos.'
                });
            }

            if (
                !datos ||
                typeof datos !== 'object' ||
                Array.isArray(datos)
            ) {
                return res.status(400).json({
                    ok: false,

                    mensaje:
                        'Formato de formulario incorrecto.'
                });
            }

            let emailCliente = '';

            let nombreCliente = 'Cliente';

            let telefonoCliente =
                'No registrado';

            // ================================================
            // IDENTIFICAR TIPO DE FORMULARIO
            // ================================================

            if (tipo === 'producto') {

                emailCliente =
                    datos['pro-correo'];

                nombreCliente =
                    datos['pro-nombre'];

                telefonoCliente =
                    datos['pro-telefono'];

            } else if (tipo === 'material') {

                emailCliente =
                    datos['mat-correo'];

                nombreCliente =
                    datos['mat-nombre'];

                telefonoCliente =
                    datos['mat-telefono'];

            } else if (tipo === 'soporte') {

                emailCliente =
                    datos['sop-correo'];

                nombreCliente =
                    datos['sop-nombre'];

                telefonoCliente =
                    datos['sop-telefono'];

            } else if (tipo === 'empleo') {

                emailCliente =
                    datos['emp-correo'];

                nombreCliente =
                    datos['emp-nombre'];

                telefonoCliente =
                    datos['emp-telefono'];

            } else if (tipo === 'acta') {

                emailCliente =
                    datos['act-correo'];

                nombreCliente =
                    datos['act-solicitante'];

                telefonoCliente =
                    'No registrado';

            } else if (tipo === 'retencion') {

                emailCliente =
                    datos['ret-correo'];

                nombreCliente =
                    datos['ret-solicitante'];

                telefonoCliente =
                    'No registrado';

            } else {

                emailCliente =
                    datos['correo'] ||
                    datos['rec-correo'] ||
                    datos['cal-correo'] ||
                    '';

                nombreCliente =
                    datos['nombre'] ||
                    datos['rec-nombre'] ||
                    datos['cal-nombre'] ||
                    'Cliente';

                telefonoCliente =
                    datos['rec-telefono'] ||
                    datos['cal-telefono'] ||
                    'No registrado';
            }

            // Normalizar información.

            emailCliente = String(
                emailCliente || ''
            ).trim();

            nombreCliente = String(
                nombreCliente || 'Cliente'
            );

            telefonoCliente = String(
                telefonoCliente || 'No registrado'
            );

            // ================================================
            // FECHA Y TIPO DE SOLICITUD
            // ================================================

            const fecha = new Date().toLocaleString(
                'es-CO',
                {
                    timeZone: 'America/Bogota'
                }
            );

            const tipoSolicitud =
                tipo.charAt(0).toUpperCase() +
                tipo.slice(1);

            // ================================================
            // GENERAR TABLA HTML
            // ================================================

            let tablaDatos = '';

            for (
                const [key, value]
                of Object.entries(datos)
            ) {
                if (value) {
                    const nombreCampo = key
                        .replace(
                            /^(pro-|mat-|sop-|emp-|rec-|cal-|act-|ret-)/,
                            ''
                        )
                        .toUpperCase();

                    tablaDatos += `
                        <tr>

                            <td style="
                                padding: 12px 15px;
                                border-bottom: 1px solid #e2e8f0;
                                font-weight: bold;
                                color: #0b2345;
                                background-color: #f8fafc;
                                width: 35%;
                                font-size: 14px;
                            ">
                                ${escaparHTML(nombreCampo)}
                            </td>

                            <td style="
                                padding: 12px 15px;
                                border-bottom: 1px solid #e2e8f0;
                                color: #334155;
                                font-size: 14px;
                            ">
                                ${escaparHTML(value)}
                            </td>

                        </tr>
                    `;
                }
            }

            // ================================================
            // SELECCIONAR PLANTILLA
            // ================================================

            const plantillaAsesor = req.file
                ? 'chatbot-adjunto.html'
                : 'chatbot-asesor.html';

            const htmlAsesor =
                cargarPlantillaChatbot(
                    plantillaAsesor,
                    {
                        TIPO_SOLICITUD:
                            escaparHTML(tipoSolicitud),

                        FECHA:
                            escaparHTML(fecha),

                        NOMBRE_CLIENTE:
                            escaparHTML(nombreCliente),

                        EMAIL_CLIENTE:
                            escaparHTML(
                                emailCliente ||
                                'No proporcionado'
                            ),

                        TELEFONO_CLIENTE:
                            escaparHTML(telefonoCliente),

                        TABLA_DATOS:
                            tablaDatos,

                        ANIO:
                            new Date().getFullYear()
                    }
                );

            // ================================================
            // PREPARAR CORREO PARA EL ASESOR
            // ================================================

            const mailAsesor = {
                from: {
                    name:
                        process.env.NOMBRE_REMITENTE ||
                        'Procesados Margarita',

                    address:
                        process.env.EMAIL_USER
                },

                to: destino,

                replyTo:
                    validarCorreo(emailCliente)
                        ? emailCliente
                        : undefined,

                bcc:
                    process.env.CORREO_PROPIETARIO,

                subject: asunto,

                html: htmlAsesor,

                attachments: []
            };

            // ================================================
            // ADJUNTAR ARCHIVO
            // ================================================

            if (req.file) {
                mailAsesor.attachments.push({
                    filename:
                        req.file.originalname,

                    path:
                        req.file.path
                });
            }

            // ================================================
            // ENVIAR CORREO AL ASESOR
            // ================================================

            await transporter.sendMail(
                mailAsesor
            );

            console.log(
                `Correo del asesor enviado a ${destino}`
            );

            // ================================================
            // CONFIRMACIÓN PARA EL CLIENTE
            // ================================================

            if (validarCorreo(emailCliente)) {

                const htmlCliente =
                    cargarPlantillaChatbot(
                        'chatbot-cliente.html',
                        {
                            NOMBRE_CLIENTE:
                                escaparHTML(nombreCliente),

                            TIPO_SOLICITUD:
                                escaparHTML(tipoSolicitud),

                            TELEFONO_EMPRESA:
                                escaparHTML(
                                    process.env.EMPRESA_TELEFONO ||
                                    'No disponible'
                                ),

                            EMAIL_EMPRESA:
                                escaparHTML(
                                    process.env.CORREO_SOLICITUDES ||
                                    'solicitudes@procesadosmargaritasas.com'
                                ),

                            ANIO:
                                new Date().getFullYear()
                        }
                    );

                await transporter.sendMail({
                    from: {
                        name:
                            process.env.NOMBRE_REMITENTE ||
                            'Procesados Margarita',

                        address:
                            process.env.EMAIL_USER
                    },

                    to: emailCliente,

                    subject:
                        'Hemos recibido tu solicitud - Procesados Margarita',

                    html: htmlCliente
                });

                console.log(
                    `Confirmación enviada a ${emailCliente}`
                );

            } else {

                console.log(
                    'No se envió confirmación: correo no válido.'
                );
            }

            // ================================================
            // RESPUESTA EXITOSA
            // ================================================

            return res.status(200).json({
                ok: true,

                mensaje:
                    'Solicitud enviada correctamente.'
            });

        } catch (error) {
            console.error(
                'Error en /api/contacto:',
                error
            );

            return res.status(500).json({
                ok: false,

                mensaje:
                    'Error al enviar la solicitud.'
            });
        }
    }
);

// ============================================================
// 36. VERIFICAR ARCHIVOS DE TRANSFORMÍN
// ============================================================

function verificarArchivosTransformin() {
    const archivos = [
        {
            nombre: 'Plantilla corporativa FT-SST-147',

            ruta: path.join(
                PLANTILLAS_DIR,
                'FT-SST-147.xlsx'
            )
        },
        {
            nombre: 'Tarjeta corporativa de cumpleaños',

            ruta: path.join(
                PLANTILLAS_DIR,
                'tarjeta-cumpleanos.png'
            )
        },
        {
            nombre: 'Plantilla HTML de felicitaciones',

            ruta: path.join(
                PLANTILLAS_DIR,
                'felicitacion-cumpleanos.html'
            )
        }
    ];

    let disponibles = true;

    console.log(
        '[Transformín] Verificando archivos corporativos...'
    );

    for (const archivo of archivos) {
        if (fs.existsSync(archivo.ruta)) {
            console.log(
                `[Transformín] Disponible: ${archivo.nombre}`
            );

        } else {
            disponibles = false;

            console.warn(
                `[Transformín] Archivo no encontrado: ${archivo.nombre}`
            );
        }
    }

    return disponibles;
}

// ============================================================
// 37. INICIALIZAR SERVICIO DE CUMPLEAÑOS
// ============================================================

async function iniciarServiciosTransformin() {
    console.log(
        '[Transformín] Inicializando servicios internos...'
    );

    const archivosDisponibles =
        verificarArchivosTransformin();

    if (!archivosDisponibles) {
        console.warn(
            '[Transformín] Existen archivos corporativos pendientes.'
        );
    }

    // El envío automático permanece desactivado
    // hasta que se autorice expresamente en el .env.

    if (
        process.env.TRANSFORMIN_ENVIO_HABILITADO !== 'true'
    ) {
        console.log(
            '[Transformín] Envíos automáticos desactivados.'
        );

        console.log(
            '[Transformín] Modo de pruebas habilitado.'
        );

        return;
    }

    // Validar credenciales SMTP.

    if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
    ) {
        console.warn(
            '[Transformín] No se inició el programador: faltan credenciales SMTP.'
        );

        return;
    }

    // Verificar los archivos necesarios para los cumpleaños.

    const tarjetaDisponible = fs.existsSync(
        path.join(
            PLANTILLAS_DIR,
            'tarjeta-cumpleanos.png'
        )
    );

    const plantillaDisponible = fs.existsSync(
        path.join(
            PLANTILLAS_DIR,
            'felicitacion-cumpleanos.html'
        )
    );

    if (
        !tarjetaDisponible ||
        !plantillaDisponible
    ) {
        console.warn(
            '[Transformín] No se inició el programador: faltan archivos de felicitación.'
        );

        return;
    }

    try {

        // Verificar acceso a la configuración del módulo.

        await cumpleanosService
            .obtenerConfiguracionGlobal();

        // Verificar conexión SMTP del servicio.

        const smtpDisponible =
            await cumpleanosService.verificarSMTP();

        if (smtpDisponible === false) {
            console.warn(
                '[Transformín] No se inició el programador: SMTP no disponible.'
            );

            return;
        }

        if (cerrandoServidor) {
            return;
        }

        // Iniciar el programador.
        //
        // El servicio consulta periódicamente los cumpleaños
        // y verifica la configuración general e individual
        // antes de realizar cualquier envío.

        cumpleanosService.iniciarProgramador();

        console.log(
            '[Transformín] Programador de cumpleaños inicializado.'
        );

        console.log(
            '[Transformín] Zona horaria: America/Bogota.'
        );

    } catch (error) {
        console.error(
            '[Transformín] Error al iniciar el servicio de cumpleaños:',
            error.message
        );

        // Un fallo de Transformín no debe impedir
        // el funcionamiento de los demás módulos del ERP.
    }
}

// ============================================================
// 38. MANEJO DE RUTAS NO ENCONTRADAS
// ============================================================

app.use((req, res) => {
    const ruta = req.path;

    if (
        ruta.startsWith('/api/') ||
        ruta.startsWith('/cronograma-transformin/api/')
    ) {
        return res.status(404).json({
            success: false,

            ok: false,

            mensaje:
                'La ruta solicitada no existe.'
        });
    }

    return res.status(404).send(
        'Página no encontrada'
    );
});

// ============================================================
// 39. MANEJO GLOBAL DE ERRORES EXPRESS
// ============================================================

app.use((error, req, res, next) => {
    console.error(
        '[Express] Error:',
        error.message
    );

    if (res.headersSent) {
        return next(error);
    }

    // Errores de carga de archivos.

    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,

            ok: false,

            mensaje:
                'No fue posible procesar el archivo.'
        });
    }

    // Errores de validación y procesamiento.

    const codigo = Number(
        error.status ||
        error.statusCode ||
        500
    );

    const status =
        Number.isInteger(codigo) &&
        codigo >= 400 &&
        codigo <= 599
            ? codigo
            : 500;

    const mensaje = status >= 500
        ? 'Ocurrió un error interno del servidor.'
        : error.message || 'Solicitud no válida.';

    return res.status(status).json({
        success: false,

        ok: false,

        mensaje
    });
});

// ============================================================
// 40. CONTROL DEL SERVIDOR
// ============================================================

let servidor = null;

let cerrandoServidor = false;

// ============================================================
// 41. CIERRE CONTROLADO DEL SERVIDOR
// ============================================================

function cerrarServidor(
    motivo,
    codigoSalida = 0
) {
    if (cerrandoServidor) {
        return;
    }

    cerrandoServidor = true;

    console.log(
        `[Servidor] Cerrando aplicación: ${motivo}`
    );

    // Detener el programador de cumpleaños.

    try {
        cumpleanosService.detenerProgramador();

        console.log(
            '[Transformín] Programador detenido.'
        );

    } catch (error) {
        console.error(
            '[Transformín] Error al detener programador:',
            error.message
        );
    }

    // Tiempo máximo de espera para el cierre.

    const cierreForzado = setTimeout(() => {
        console.error(
            '[Servidor] Se agotó el tiempo de cierre.'
        );

        process.exit(1);

    }, 30000);

    cierreForzado.unref();

    // Cerrar conexiones HTTP.

    if (servidor) {
        servidor.close(async error => {
            try {
                if (error) {
                    console.error(
                        '[Servidor] Error al cerrar HTTP:',
                        error.message
                    );

                    codigoSalida = 1;
                }

                if (typeof db.end === 'function') {
                    await db.end();

                    console.log(
                        '[MySQL] Conexiones cerradas.'
                    );
                }

                transporter.close();

                clearTimeout(cierreForzado);

                console.log(
                    '[Servidor] Aplicación detenida.'
                );

                process.exit(codigoSalida);

            } catch (errorCierre) {
                console.error(
                    '[Servidor] Error durante el cierre:',
                    errorCierre.message
                );

                process.exit(1);
            }
        });

    } else {
        clearTimeout(cierreForzado);

        process.exit(codigoSalida);
    }
}

// ============================================================
// 42. SEÑALES DEL SISTEMA
// ============================================================

process.on('SIGINT', () => {
    cerrarServidor('SIGINT');
});

process.on('SIGTERM', () => {
    cerrarServidor('SIGTERM');
});

// ============================================================
// 43. ERRORES GLOBALES DE NODE.JS
// ============================================================

process.on('unhandledRejection', error => {
    console.error(
        '[Node.js] UNHANDLED REJECTION'
    );

    console.error(error);
});

process.on('uncaughtException', error => {
    console.error(
        '[Node.js] UNCAUGHT EXCEPTION'
    );

    console.error(error);

    cerrarServidor(
        'Excepción no controlada',
        1
    );
});

// ============================================================
// 44. INICIAR SERVIDOR PRINCIPAL
// ============================================================

servidor = app.listen(PORT, async () => {
    console.log('');

    console.log(
        '================================================'
    );

    console.log(
        '       PROCESADOS MARGARITA S.A.S.'
    );

    console.log(
        '             SISTEMA ERP'
    );

    console.log(
        '================================================'
    );

    console.log(
        `[Servidor] http://localhost:${PORT}`
    );

    console.log(
        `[Entorno] ${process.env.NODE_ENV || 'development'}`
    );

    console.log(
        '[Seguridad] Servicios internos protegidos.'
    );

    console.log(
        '[Cronograma] Ruta /cronograma-transformin disponible.'
    );

    console.log(
        `[Correo] ${process.env.EMAIL_USER || 'No configurado'}`
    );

    console.log(
        '================================================'
    );

    // Verificar conexión principal de correo.

    await verificarSMTPPrincipal();

    // Inicializar los servicios de Transformín.

    if (!cerrandoServidor) {
        await iniciarServiciosTransformin();
    }

    console.log(
        '================================================'
    );

    console.log(
        '[Servidor] Inicialización finalizada.'
    );

    console.log(
        '================================================'
    );
});

// ============================================================
// 45. ERRORES DE INICIO DEL SERVIDOR
// ============================================================

servidor.on('error', error => {
    if (error.code === 'EADDRINUSE') {
        console.error(
            `[Servidor] El puerto ${PORT} ya está en uso.`
        );

    } else {
        console.error(
            '[Servidor] Error de inicio:',
            error.message
        );
    }

    process.exit(1);
});

/* ============================================================
   FIN DEL ARCHIVO APP.JS
   PROCESADOS MARGARITA S.A.S.
============================================================ */