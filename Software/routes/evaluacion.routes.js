const express = require('express');
const router = express.Router();

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 OBTENER PREGUNTAS
// ============================================

router.get('/api/preguntas-evaluacion/:capituloId', proteger, (req, res) => {

    const db = req.app.get('db');

    const sql = `
        SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, puntos 
        FROM preguntas_induccion 
        WHERE capitulo_id = ?
    `;

    db.query(sql, [req.params.capituloId], (err, results) => {

        if (err) {
            console.error("Error al cargar preguntas:", err);
            return res.json({ success: false, message: err.message });
        }

        res.json({ success: true, preguntas: results });

    });

});


// ============================================
// 🔥 GUARDAR EVALUACIÓN
// ============================================

router.post('/api/guardar-evaluacion', proteger, (req, res) => {

    const db = req.app.get('db');

    const { capitulo_id, respuestas } = req.body;
    const usuario_id = req.session.usuarioID;

    if (!capitulo_id || !respuestas) {
        return res.json({ success: false, message: "Datos incompletos" });
    }

    const sqlGetPreguntas = `
        SELECT id, respuesta_correcta 
        FROM preguntas_induccion 
        WHERE capitulo_id = ?
    `;
    
    db.query(sqlGetPreguntas, [capitulo_id], (err, preguntas) => {

        if (err) {
            console.error("Error al obtener preguntas:", err);
            return res.json({ success: false, message: "Error al obtener preguntas" });
        }

        if (preguntas.length === 0) {
            return res.json({ success: false, message: "No hay preguntas para este capítulo" });
        }

        let aciertos = 0;

        preguntas.forEach(p => {
            const respuestaUsuario = respuestas[p.id];
            if (respuestaUsuario && respuestaUsuario === p.respuesta_correcta) {
                aciertos++;
            }
        });

        const nota = Math.round((aciertos / preguntas.length) * 100);
        const aprobado = nota >= 70 ? 1 : 0;

        const sqlCheck = `
            SELECT id 
            FROM resultados_evaluaciones 
            WHERE usuario_id = ? AND capitulo_id = ?
        `;
        
        db.query(sqlCheck, [usuario_id, capitulo_id], (errCheck, existing) => {

            if (errCheck) {
                return res.json({ success: false, message: "Error al verificar evaluación previa" });
            }

            let sqlInsert;
            let params;

            if (existing.length > 0) {
                sqlInsert = `
                    UPDATE resultados_evaluaciones 
                    SET nota = ?, aprobado = ?, fecha_evaluacion = NOW() 
                    WHERE usuario_id = ? AND capitulo_id = ?
                `;
                params = [nota, aprobado, usuario_id, capitulo_id];
            } else {
                sqlInsert = `
                    INSERT INTO resultados_evaluaciones 
                    (usuario_id, capitulo_id, nota, aprobado, fecha_evaluacion) 
                    VALUES (?, ?, ?, ?, NOW())
                `;
                params = [usuario_id, capitulo_id, nota, aprobado];
            }

            db.query(sqlInsert, params, (errInsert) => {

                if (errInsert) {
                    console.error("Error al guardar:", errInsert);
                    return res.json({ success: false, message: errInsert.message });
                }

                // 🔥 VALIDAR SI TERMINÓ TODO
                const sqlTotal = `SELECT COUNT(*) as total FROM capitulos_induccion WHERE activo = 1`;
                const sqlAprobados = `
                    SELECT COUNT(*) as aprobados 
                    FROM resultados_evaluaciones 
                    WHERE usuario_id = ? AND aprobado = 1
                `;

                db.query(sqlTotal, (errTotal, totalResult) => {

                    db.query(sqlAprobados, [usuario_id], (errAprob, aprobadosResult) => {

                        const totalCapitulos = totalResult?.[0]?.total || 0;
                        const totalAprobados = aprobadosResult?.[0]?.aprobados || 0;

                        if (totalAprobados >= totalCapitulos && totalCapitulos > 0) {
                            db.query(`UPDATE usuarios SET primera_vez = 0 WHERE id = ?`, [usuario_id]);
                        }

                        res.json({
                            success: true,
                            nota,
                            aprobado: aprobado === 1
                        });

                    });

                });

            });

        });

    });

});

module.exports = router;