const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./DB'); 

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// ============================================
// CONFIGURACIONES BASE
// ============================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'procesados_margarita_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

const proteger = (req, res, next) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    next();
};

// ============================================
// RUTAS DE PÁGINAS (HTML)
// ============================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/recuperar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'recuperar.html')));
app.get('/cambiar-password', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'cambiar-password.html')));
app.get('/dashboard', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/induccion', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'induccion.html')));
app.get('/evaluacion', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'evaluacion.html')));
app.get('/resultados', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'resultados.html')));
app.get('/firma', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'firma.html')));
app.get('/certificado', proteger, (req, res) => res.sendFile(path.join(__dirname, 'public', 'certificado.html')));

// ============================================
// LOGIN
// ============================================
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;
    
    const sql = `SELECT u.*, e.activo 
                 FROM usuarios u 
                 JOIN empleados e ON u.empleado_id = e.id 
                 WHERE u.Usuario = ?`;

    db.query(sql, [usuario], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "error servidor" });
        if (results.length === 0) return res.json({ success: false, message: "usuario no encontrado" });

        const user = results[0];
        
        try {
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) return res.json({ success: false, message: "contraseña incorrecta" });

            req.session.usuarioID = user.ID || user.id; 

            // Determinar destino después del login
            let destino = "/dashboard";
            
            // Si requiere cambiar contraseña
            if (parseInt(user.cambio_password) === 1) {
                destino = "/cambiar-password";
            } 
            // Si es primera vez O no ha completado todos los capítulos
            else if (parseInt(user.primera_vez) === 1) {
                destino = "/induccion";
            }
            // Verificar si completó TODOS los capítulos
            else {
                // Consultar cuántos capítulos aprobó vs total
                const sqlCheckCompletado = `
                    SELECT 
                        (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total,
                        (SELECT COUNT(DISTINCT capitulo_id) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1) as aprobados
                `;
                
                db.query(sqlCheckCompletado, [req.session.usuarioID], (err, results) => {
                    if (err) {
                        return res.json({ success: true, redirect: "/dashboard" });
                    }
                    
                    const total = results[0]?.total || 0;
                    const aprobados = results[0]?.aprobados || 0;
                    
                    if (aprobados < total) {
                        destino = "/induccion";
                    } else {
                        destino = "/dashboard";
                    }
                    
                    return res.json({ success: true, redirect: destino });
                });
                return; // Esperar la consulta antes de responder
            }
            
            return res.json({ success: true, redirect: destino });
        } catch (e) {
            return res.status(500).json({ success: false });
        }
    });
});

// ============================================
// CHECK-ACCESO (para verificar si debe redirigir desde el frontend)
// ============================================
app.get('/api/check-acceso', (req, res) => {
    if (!req.session.usuarioID) return res.json({ success: false, redirect: '/login' });
    
    const sql = `
        SELECT u.cambio_password, u.primera_vez,
               (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total,
               (SELECT COUNT(DISTINCT capitulo_id) FROM resultados_evaluaciones WHERE usuario_id = u.id AND aprobado = 1) as aprobados
        FROM usuarios u WHERE u.id = ?`;

    db.query(sql, [req.session.usuarioID], (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, redirect: '/login' });
        
        const user = results[0];
        const requiereCambio = parseInt(user.cambio_password) === 1;
        const totalCapitulos = user.total || 0;
        const aprobados = user.aprobados || 0;
        
        // CORREGIDO: Solo requiere inducción si NO ha aprobado TODOS los capítulos
        const requiereInduccion = (aprobados < totalCapitulos) || (parseInt(user.primera_vez) === 1);
        
        let redirect = null;
        if (requiereCambio) {
            redirect = '/cambiar-password';
        } else if (requiereInduccion) {
            redirect = '/induccion';
        } else {
            redirect = '/dashboard';
        }
        
        res.json({ 
            success: true, 
            requiereCambio, 
            requiereInduccion,
            redirect: redirect,
            totalCapitulos: totalCapitulos,
            aprobados: aprobados
        });
    });
});

// ============================================
// INDUCCIÓN Y VIDEOS
// ============================================
app.get('/api/capitulos-induccion', proteger, (req, res) => {
    const sql = `
        SELECT c.*, 
        (SELECT COUNT(*) FROM sub_capitulos_induccion WHERE capitulo_id = c.id AND activo = 1) as total_videos,
        (SELECT COUNT(*) FROM progreso_videos p WHERE p.usuario_id = ? AND p.sub_capitulo_id IN (SELECT id FROM sub_capitulos_induccion WHERE capitulo_id = c.id)) as videos_vistos,
        (SELECT aprobado FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = c.id LIMIT 1) as aprobado,
        (SELECT nota FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = c.id LIMIT 1) as nota
        FROM capitulos_induccion c WHERE c.activo = 1 ORDER BY c.orden ASC`;
    
    db.query(sql, [req.session.usuarioID, req.session.usuarioID, req.session.usuarioID], (err, results) => {
        if (err) {
            console.error("Error en capitulos-induccion:", err);
            return res.json({ success: false, error: err.message });
        }
        res.json({ success: true, capitulos: results });
    });
});

app.get('/api/sub-capitulos/:capituloId', proteger, (req, res) => {
    const sql = `SELECT s.*, (SELECT visto FROM progreso_videos WHERE usuario_id = ? AND sub_capitulo_id = s.id) as visto 
                 FROM sub_capitulos_induccion s WHERE s.capitulo_id = ? AND s.activo = 1 ORDER BY s.orden ASC`;
    db.query(sql, [req.session.usuarioID, req.params.capituloId], (err, results) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, sub_capitulos: results });
    });
});

app.post('/api/marcar-visto', proteger, (req, res) => {
    const { sub_capitulo_id } = req.body;
    const sql = `INSERT INTO progreso_videos (usuario_id, sub_capitulo_id, visto, fecha_visto) 
                 VALUES (?, ?, 1, NOW()) ON DUPLICATE KEY UPDATE visto = 1, fecha_visto = NOW()`;
    db.query(sql, [req.session.usuarioID, sub_capitulo_id], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// ============================================
// EVALUACIONES - CON MÍNIMO DE APROBACIÓN 70%
// ============================================
app.get('/api/preguntas-evaluacion/:capituloId', proteger, (req, res) => {
    const sql = `SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, puntos 
                 FROM preguntas_induccion WHERE capitulo_id = ?`;
    db.query(sql, [req.params.capituloId], (err, results) => {
        if (err) {
            console.error("Error al cargar preguntas:", err);
            return res.json({ success: false, message: err.message });
        }
        res.json({ success: true, preguntas: results });
    });
});

app.post('/api/guardar-evaluacion', proteger, (req, res) => {
    const { capitulo_id, respuestas } = req.body;
    const usuario_id = req.session.usuarioID;

    if (!capitulo_id || !respuestas) {
        return res.json({ success: false, message: "Datos incompletos" });
    }

    const sqlGetPreguntas = `SELECT id, respuesta_correcta FROM preguntas_induccion WHERE capitulo_id = ?`;
    
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
            const respuestaCorrecta = p.respuesta_correcta;
            
            if (respuestaUsuario && respuestaUsuario === respuestaCorrecta) {
                aciertos++;
            }
        });

        const nota = Math.round((aciertos / preguntas.length) * 100);
        const aprobado = nota >= 70 ? 1 : 0;
        
        const sqlCheck = `SELECT id FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = ?`;
        
        db.query(sqlCheck, [usuario_id, capitulo_id], (errCheck, existing) => {
            if (errCheck) {
                return res.json({ success: false, message: "Error al verificar evaluación previa" });
            }
            
            let sqlInsert;
            let params;
            
            if (existing.length > 0) {
                sqlInsert = `UPDATE resultados_evaluaciones 
                             SET nota = ?, aprobado = ?, fecha_evaluacion = NOW() 
                             WHERE usuario_id = ? AND capitulo_id = ?`;
                params = [nota, aprobado, usuario_id, capitulo_id];
            } else {
                sqlInsert = `INSERT INTO resultados_evaluaciones (usuario_id, capitulo_id, nota, aprobado, fecha_evaluacion) 
                             VALUES (?, ?, ?, ?, NOW())`;
                params = [usuario_id, capitulo_id, nota, aprobado];
            }
            
            db.query(sqlInsert, params, (errInsert) => {
                if (errInsert) {
                    console.error("Error al guardar:", errInsert);
                    return res.json({ success: false, message: "Error al guardar la evaluación: " + errInsert.message });
                }
                
                // Verificar si completó TODOS los capítulos
                const sqlTotal = `SELECT COUNT(*) as total FROM capitulos_induccion WHERE activo = 1`;
                const sqlAprobados = `SELECT COUNT(*) as aprobados FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1`;
                
                db.query(sqlTotal, (errTotal, totalResult) => {
                    db.query(sqlAprobados, [usuario_id], (errAprob, aprobadosResult) => {
                        const totalCapitulos = totalResult?.[0]?.total || 0;
                        const totalAprobados = aprobadosResult?.[0]?.aprobados || 0;
                        
                        // Solo marcar primera_vez = 0 cuando completó TODOS los capítulos
                        if (totalAprobados >= totalCapitulos && totalCapitulos > 0) {
                            db.query(`UPDATE usuarios SET primera_vez = 0, fecha_induccion_completa = NOW() WHERE id = ?`, [usuario_id]);
                        }
                        
                        res.json({ success: true, nota, aprobado: aprobado === 1 });
                    });
                });
            });
        });
    });
});

// ============================================
// RECUPERACIÓN Y CAMBIO DE CLAVE
// ============================================
app.post('/api/recuperar', async (req, res) => {
    const { documento } = req.body;
    const sql = `SELECT u.id FROM usuarios u JOIN empleados e ON u.empleado_id = e.id WHERE e.numero_documento = ?`;
    db.query(sql, [documento], async (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "no encontrado" });
        
        const hashedTempPass = await bcrypt.hash('123456', SALT_ROUNDS);
        db.query(`UPDATE usuarios SET password_hash = ?, cambio_password = 1 WHERE id = ?`, [hashedTempPass, results[0].id], (errU) => {
            if (errU) return res.json({ success: false });
            res.json({ success: true, message: "contraseña temporal: 123456" });
        });
    });
});

app.post('/api/cambiar-password', proteger, async (req, res) => {
    const { password } = req.body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.query(`UPDATE usuarios SET password_hash = ?, cambio_password = 0 WHERE id = ?`, [hash, req.session.usuarioID], (err) => {
        if (err) return res.json({ success: false });
        req.session.destroy();
        res.json({ success: true, redirect: "/login" });
    });
});

// ============================================
// FIRMA Y USUARIO
// ============================================
app.post('/api/guardar-firma', proteger, (req, res) => {
    const { firma_data } = req.body;
    const sql = `UPDATE usuarios SET firma_digital = ?, fecha_induccion_completa = NOW() WHERE id = ?`;
    db.query(sql, [firma_data, req.session.usuarioID], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

app.get('/api/usuario-actual', proteger, (req, res) => {
    const sql = `SELECT u.id, u.usuario, e.nombre, e.numero_documento, e.sede, c.nombre as cargo 
                 FROM usuarios u 
                 JOIN empleados e ON u.empleado_id = e.id 
                 LEFT JOIN cargos c ON e.cargo_id = c.id 
                 WHERE u.id = ?`;
    db.query(sql, [req.session.usuarioID], (err, results) => {
        if (err || results.length === 0) return res.json({ success: false });
        res.json({ success: true, usuario: results[0] });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`🚀 servidor margarita listo en puerto ${PORT}`);
});