// ============================================
// 🔒 MIDDLEWARE AUTENTICACIÓN Y ROLES
// ============================================

// 🔐 PROTEGER (LOGIN)
const proteger = (req, res, next) => {

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

        const rol = req.session.rol;

        if (!rol || !rolesPermitidos.includes(rol)) {

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

const soloSuperAdmin = soloRol(['superadministrador']);
const soloAdmin = soloRol(['administrador']);
const soloAuxiliar = soloRol(['auxiliar']);

// ============================================
// EXPORTAR
// ============================================

module.exports = {
    proteger,
    soloRol,
    soloSuperAdmin,
    soloAdmin,
    soloAuxiliar
};