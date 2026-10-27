const express = require('express');
const router = express.Router();
const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 GUARDAR FIRMA (CON TRANSACCIÓN SQL)
// ============================================
router.post('/api/guardar-firma', proteger, async (req, res) => {
    const db = req.app.get('db');
    const { firma_data } = req.body;
    const usuario_id = req.session.usuarioID;
    const empleado_id = req.session.empleadoID;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    // 1. Validación básica de formato
    if (!firma_data || firma_data.length < 1000) {
        return res.status(400).json({ success: false, message: "Firma inválida o vacía" });
    }

    try {
        // Iniciamos la transacción: Todo o nada
        await db.query('START TRANSACTION');

        // A. Guardar/Actualizar Firma
        await db.query(`
            INSERT INTO firmas_usuario (usuario_id, firma_data, fecha_firma, ip_address)
            VALUES (?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE firma_data = VALUES(firma_data), fecha_firma = NOW()
        `, [usuario_id, firma_data, ip]);

        // B. Guardar Inducción
        await db.query(`
            INSERT INTO inducciones (empleado_id, tipo, fecha, calificacion, firmado)
            SELECT ?, 'induccion_completa', CURDATE(), 
            (SELECT AVG(nota) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1), 1
            WHERE NOT EXISTS (SELECT 1 FROM inducciones WHERE empleado_id = ? AND tipo = 'induccion_completa')
        `, [empleado_id, usuario_id, empleado_id]);

        // C. Generar/Actualizar Certificado
        const [promedioRes] = await db.query("SELECT AVG(nota) as p FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1", [usuario_id]);
        const promedio = promedioRes[0]?.p || 0;
        const codigo = 'CERT-' + Date.now();

        await db.query(`
            INSERT INTO certificados_usuario (usuario_id, nota_final, fecha_emision, codigo_certificado)
            VALUES (?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE nota_final = VALUES(nota_final), fecha_emision = NOW()
        `, [usuario_id, promedio, codigo]);

        // Si todo sale bien, confirmamos los cambios
        await db.query('COMMIT');
        
        console.log("✅ Proceso de firma y certificado completado con éxito.");
        res.json({ success: true });

    } catch (err) {
        // Si algo falla, revertimos todo lo anterior
        await db.query('ROLLBACK');
        console.error("❌ ERROR CRÍTICO EN GUARDADO:", err);
        res.status(500).json({ success: false, message: "Error al procesar la inducción" });
    }
});

// ============================================
// 🔥 OBTENER FIRMA
// ============================================
router.get('/api/obtener-firma', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const [result] = await db.query("SELECT firma_data FROM firmas_usuario WHERE usuario_id = ?", [req.session.usuarioID]);
        
        res.json({ 
            success: result.length > 0, 
            firma: result.length > 0 ? result[0].firma_data : null 
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.post(
    '/api/actualizar-firma',
    proteger,
    async (req,res)=>{

        try{

            const db =
                req.app.get('db');

            const {
                firma_data
            } = req.body;

            const usuario_id =
                req.session.usuarioID;

            const ip =
                req.headers['x-forwarded-for']
                || req.socket.remoteAddress
                || '';

            if(
                !firma_data ||
                firma_data.length < 1000
            ){
                return res.status(400).json({
                    success:false,
                    message:'Firma inválida'
                });
            }

            await db.query(`
                UPDATE firmas_usuario
                SET
                    firma_data = ?,
                    fecha_firma = NOW(),
                    ip_address = ?
                WHERE usuario_id = ?
            `,[
                firma_data,
                ip,
                usuario_id
            ]);

            res.json({
                success:true
            });

        }catch(error){

            console.error(error);

            res.status(500).json({
                success:false
            });
        }
    }
);

// ============================================
// 🔥 VERIFICAR INDUCCIÓN COMPLETADA
// ============================================
router.get('/api/induccion-completada', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const [results] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total,
                (SELECT COUNT(DISTINCT capitulo_id) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1) as aprobados,
                (SELECT firmado FROM inducciones WHERE empleado_id = ? AND tipo = 'induccion_completa' LIMIT 1) as firmado
        `, [req.session.usuarioID, req.session.empleadoID]);

        const total = results[0]?.total || 0;
        const aprobados = results[0]?.aprobados || 0;
        const firmado = results[0]?.firmado || 0;
        
        res.json({ 
            success: true,
            completada: aprobados >= total && total > 0,
            firmado: firmado === 1,
            total,
            aprobados
        });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;