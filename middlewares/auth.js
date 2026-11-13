// ============================================
// 🔒 MIDDLEWARE AUTENTICACIÓN Y ROLES
// ============================================

// 🔐 PROTEGER (LOGIN)
const proteger = (req, res, next) => {

    console.log("===== SESIÓN =====");
    console.log(req.session);
    console.log("UsuarioID:", req.session.usuarioID);
    console.log("URL:", req.originalUrl);

    if (!req.session.usuarioID) {

        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({
                success: false,
                message: "No autenticado"
            });
        }

        return res.redirect('/login');
    }

    next();
};

// ============================================
// 🔒 CONTROL DE ROLES (GENÉRICO)
// ============================================
const soloRol = (rolesPermitidos) => {

    return (req, res, next) => {

        const rol = (req.session.rol || "").toLowerCase().trim();

        const permitido = rolesPermitidos.some(r => rol === r.toLowerCase());

        if (!permitido) {

            if (req.originalUrl.startsWith('/api')) {
                return res.status(403).json({
                    success: false,
                    message: "No autorizado"
                });
            }

            return res.redirect('/dashboard');
        }

        next();
    };
};

// ============================================
// 🔒 ROLES ESPECÍFICOS
// ============================================

const soloSuperAdmin = soloRol(['superadmin']);

const soloAdmin = soloRol(['administrador']);

// Permitir acceso a SuperAdmin y Administrador
const soloAdminGeneral = soloRol(['superadmin', 'administrador']);

const soloAuxiliar = soloRol(['auxiliar']);

// ============================================
// VALIDAR LECTURA OBLIGATORIA DE DOCUMENTOS
// ============================================

const verificarDocumentosPendientes = async (req, res, next) => {

    try {

        const db = req.app.get('db');
        const empleadoID = req.session.empleadoID;

        const [documentos] = await db.query(`
            SELECT COUNT(*) AS pendientes
            FROM documentos_lectura d
            INNER JOIN versiones_documentos v
                ON d.version_actual_id = v.id
            LEFT JOIN aceptaciones_documentos a
                ON a.version_id = v.id
                AND a.empleado_id = ?
            WHERE d.estado = 'ACTIVO'
                AND v.estado = 'VIGENTE'
                AND a.id IS NULL
        `, [empleadoID]);

        if (documentos[0].pendientes > 0) {
            return res.redirect('/documentos-lectura');
        }

        next();

    } catch (error) {

        console.error('ERROR VALIDANDO DOCUMENTOS PENDIENTES:', error);

        return res.status(500).send(
            'No se pudo verificar la lectura de los documentos obligatorios.'
        );

    }
};

// ============================================
// EXPORTAR
// ============================================

module.exports = {
    proteger,
    verificarDocumentosPendientes,
    soloRol,
    soloSuperAdmin,
    soloAdmin,
    soloAdminGeneral,
    soloAuxiliar
};