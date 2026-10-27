const express = require('express');
const router = express.Router();
const path = require('path');

const { proteger, soloAdmin, soloAuxiliar, soloSuperAdmin } = require('../middlewares/auth');

// ============================================
// RUTAS PÚBLICAS
// ============================================

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

router.get('/recuperar', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'recuperar.html'));
});


// ============================================
// 🔐 VALIDACIÓN PÚBLICA DE CERTIFICADOS
// ============================================

router.get('/validar-certificado/:token', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/validar-certificado.html'
        )
    );

});
// ============================================
// RUTAS PROTEGIDAS
// ============================================

router.get('/cambiar-password', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'cambiar-password.html'));
});

router.get('/dashboard', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

router.get('/induccion', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'induccion.html'));
});

router.get('/evaluacion', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'evaluacion.html'));
});

router.get('/resultados', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'resultados.html'));
});

router.get('/firma', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'firma.html'));
});

router.get('/certificado', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'certificado.html'));
});

router.get('/perfil', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'perfil.html'));
});
router.get('/empleados-menu', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/empleados-menu.html'));
});
router.get('/empleados-inactivos', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/empleados-inactivos.html'));
});

router.get('/expediente-empleado/:id', (req, res) => {

    res.sendFile(
        path.join(__dirname, '../public/expediente-empleado.html')
    );

});


// ============================================
// 🔥 RESET PASSWORD
// ============================================

router.get('/reset/:token', (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/cambiar-password.html'
        )

    );

});
/* =========================================
   🔥 CENTRO ACTIVIDAD
========================================= */

router.get('/centro-actividad', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/centro-actividad.html'
        )
    );

});


// ============================================
// RUTAS POR ROL
// ============================================

router.get('/admin', proteger, soloAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'admin.html'));
});

router.get('/auxiliar', proteger, soloAuxiliar, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'auxiliar.html'));
});

router.get('/crear-empleado', proteger, soloSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'crear-empleado.html'));
});

router.get('/empleados', proteger, soloSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'empleados.html'));
});

// ============================================
// PANEL
// ============================================

router.get('/panel', proteger, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'panel.html'));
});

router.get('/recursos-humanos', proteger, soloSuperAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'recursos-humanos.html'));
});

/* =========================================
   🔥 CAPACITACIONES
========================================= */

router.get(
    '/capacitaciones',
    proteger,
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                '../public/capacitaciones.html'
            )

        );

    }
);

router.get('/usuarios', proteger, soloSuperAdmin, (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/usuarios.html'
        )

    );

});

router.get(
    '/gestion-organizacional',
    proteger,
    soloSuperAdmin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '../public/gestion-organizacional.html'
            )
        );

    }
);
/* =========================================
   🔥 CREAR USUARIO
========================================= */

router.get('/crear-usuario', proteger, soloSuperAdmin, (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/crear-usuario.html'
        )

    );

});
/* =========================================
   🔥 USUARIOS REGISTRADOS
========================================= */

router.get('/usuarios-registrados', proteger, soloSuperAdmin, (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/usuarios-registrados.html'
        )

    );

});

router.get(
    '/seguimiento-general',
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '../public/seguimiento-general.html'
            )
        );

    }
);

/* =========================================
   🔥 ROLES Y ACCESOS
========================================= */

router.get('/roles-accesos', proteger, soloSuperAdmin, (req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/roles-accesos.html'
        )

    );

});

/* =========================================
   🔥 VER CAPACITACIÓN
========================================= */

router.get(
    "/capacitacion/:id",
    proteger,
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "../public/capacitacion.html"
            )

        );

    }
);

// ==========================================
// EVALUACIÓN DE CAPACITACIÓN
// ==========================================

router.get(
    "/evaluacion-capacitacion",
    proteger,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "../public/evaluacion-capacitacion.html"
            )
        );

    }
);

/* =========================================
   🔥 ADMINISTRAR CURSO
========================================= */

router.get(
    "/administrar-curso/:id",
    proteger,
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "../public/administrar-curso.html"
            )

        );

    }
);

/* =========================================
   🔥 ADMINISTRAR CERTIFICADO
========================================= */

router.get(
    "/administrar-certificado/:id",
    proteger,
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "../public/administrar-certificado.html"
            )

        );

    }
);

module.exports = router;