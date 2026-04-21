const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./DB');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secreto123',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ============================================
// PAGINAS
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/recuperar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recuperar.html'));
});

app.get('/cambiar-password', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'cambiar-password.html'));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/induccion', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'induccion.html'));
});

app.get('/evaluacion', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'evaluacion.html'));
});

app.get('/resultados', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'resultados.html'));
});

app.get('/firma', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'firma.html'));
});

app.get('/certificado', (req, res) => {
    if (!req.session.usuarioID) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'certificado.html'));
});

// ============================================
// LOGIN
// ============================================
app.post('/api/login', async (req, res) => {
    const { usuario, password } = req.body;

    const sql = `
        SELECT u.*, e.activo 
        FROM Usuarios u
        JOIN empleados e ON u.empleado_id = e.id
        WHERE LOWER(u.Usuario) = LOWER(?)
    `;

    db.query(sql, [usuario], async (err, results) => {
        if (err) {
            console.error('Error en login:', err);
            return res.json({ success: false, message: "Error servidor" });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "Usuario no existe" });
        }

        const user = results[0];

        if (user.bloqueado) {
            return res.json({ success: false, message: "Usuario bloqueado" });
        }

        if (user.activo === 'NO') {
            return res.json({ success: false, message: "Empleado inactivo" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            db.query(`UPDATE Usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE ID = ?`, [user.ID]);
            db.query(`UPDATE Usuarios SET bloqueado = 1 WHERE ID = ? AND intentos_fallidos >= 3`, [user.ID]);
            return res.json({ success: false, message: "Contraseña incorrecta" });
        }

        req.session.usuarioID = user.ID;
        
        db.query(`UPDATE Usuarios SET intentos_fallidos = 0, fecha_ultimo_login = NOW() WHERE ID = ?`, [user.ID]);

        const cambio = parseInt(user.cambio_password, 10);

        if (cambio === 1) {
            return res.json({ success: true, redirect: "/cambiar-password" });
        }

        return res.json({ success: true, message: "Login exitoso" });
    });
});

// ============================================
// VERIFICAR ACCESO DESPUÉS DEL LOGIN
// ============================================
app.get('/api/check-acceso', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, redirect: '/login' });
    }

    const sql = `
        SELECT u.primera_vez,
               COUNT(DISTINCT r.capitulo_id) as capitulos_aprobados,
               (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total_capitulos
        FROM Usuarios u
        LEFT JOIN resultados_evaluaciones r ON u.ID = r.usuario_id AND r.aprobado = 1
        WHERE u.ID = ?
        GROUP BY u.ID
    `;

    db.query(sql, [req.session.usuarioID], (err, results) => {
        if (err) {
            console.error('Error en check-acceso:', err);
            return res.json({ success: false, redirect: '/login' });
        }

        if (results.length === 0) {
            return res.json({ success: false, redirect: '/login' });
        }

        const data = results[0];
        const totalCapitulos = data.total_capitulos || 3;
        const capitulosAprobados = data.capitulos_aprobados || 0;
        const induccionCompleta = capitulosAprobados >= totalCapitulos;

        if (data.primera_vez === 1 && !induccionCompleta) {
            return res.json({ success: false, redirect: '/induccion' });
        }
        
        res.json({ success: true, redirect: '/dashboard' });
    });
});

// ============================================
// OBTENER CAPÍTULOS PRINCIPALES
// ============================================
app.get('/api/capitulos-induccion', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const sql = `
        SELECT c.*,
               (SELECT COUNT(*) FROM sub_capitulos_induccion WHERE capitulo_id = c.id AND activo = 1) as total_videos,
               (SELECT COUNT(*) FROM progreso_videos p 
                WHERE p.usuario_id = ? AND p.sub_capitulo_id IN 
                (SELECT id FROM sub_capitulos_induccion WHERE capitulo_id = c.id) AND p.visto = 1) as videos_vistos,
               (SELECT nota FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = c.id) as nota,
               (SELECT aprobado FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = c.id) as aprobado
        FROM capitulos_induccion c
        WHERE c.activo = 1
        ORDER BY c.orden ASC
    `;

    db.query(sql, [req.session.usuarioID, req.session.usuarioID, req.session.usuarioID], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }
        res.json({ success: true, capitulos: results });
    });
});

// ============================================
// OBTENER SUB-CAPÍTULOS (VIDEOS) DE UN CAPÍTULO
// ============================================
app.get('/api/sub-capitulos/:capituloId', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const capituloId = req.params.capituloId;

    const sql = `
        SELECT s.*,
               (SELECT visto FROM progreso_videos WHERE usuario_id = ? AND sub_capitulo_id = s.id) as visto
        FROM sub_capitulos_induccion s
        WHERE s.capitulo_id = ? AND s.activo = 1
        ORDER BY s.orden ASC
    `;

    db.query(sql, [req.session.usuarioID, capituloId], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }
        res.json({ success: true, sub_capitulos: results });
    });
});

// ============================================
// MARCAR VIDEO COMO VISTO
// ============================================
app.post('/api/marcar-visto', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const { sub_capitulo_id } = req.body;

    const sql = `
        INSERT INTO progreso_videos (usuario_id, sub_capitulo_id, visto, fecha_visto)
        VALUES (?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
        visto = 1, fecha_visto = NOW()
    `;

    db.query(sql, [req.session.usuarioID, sub_capitulo_id], (err) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error al guardar progreso" });
        }
        res.json({ success: true, message: "Video marcado como visto" });
    });
});

// ============================================
// OBTENER PREGUNTAS DE EVALUACIÓN POR CAPÍTULO
// ============================================
app.get('/api/preguntas-evaluacion/:capituloId', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const capituloId = req.params.capituloId;

    const sql = `
        SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d
        FROM preguntas_induccion
        WHERE capitulo_id = ?
        ORDER BY id ASC
    `;

    db.query(sql, [capituloId], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }
        res.json({ success: true, preguntas: results, total_preguntas: results.length });
    });
});

// ============================================
// GUARDAR RESULTADO DE EVALUACIÓN
// ============================================
app.post('/api/guardar-evaluacion', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const { capitulo_id, respuestas } = req.body;
    const usuario_id = req.session.usuarioID;

    const getPreguntasSql = `SELECT id, respuesta_correcta FROM preguntas_induccion WHERE capitulo_id = ?`;
    
    db.query(getPreguntasSql, [capitulo_id], (err, preguntas) => {
        if (err) {
            console.error('Error al obtener preguntas:', err);
            return res.json({ success: false, message: "Error al obtener preguntas" });
        }

        if (!preguntas || preguntas.length === 0) {
            return res.json({ success: false, message: "No hay preguntas para este capítulo" });
        }

        let puntosObtenidos = 0;
        const totalPuntos = preguntas.length;
        
        const respuestasValues = [];
        preguntas.forEach(pregunta => {
            const respuestaUsuario = respuestas[pregunta.id] || null;
            const esCorrecta = respuestaUsuario === pregunta.respuesta_correcta;
            if (esCorrecta) puntosObtenidos++;
            
            respuestasValues.push([usuario_id, capitulo_id, pregunta.id, respuestaUsuario, esCorrecta]);
        });

        const deleteSql = `DELETE FROM respuestas_usuario WHERE usuario_id = ? AND capitulo_id = ?`;
        
        db.query(deleteSql, [usuario_id, capitulo_id], (err) => {
            if (err) {
                console.error('Error al eliminar respuestas:', err);
                return res.json({ success: false, message: "Error al guardar" });
            }

            const insertSql = `INSERT INTO respuestas_usuario (usuario_id, capitulo_id, pregunta_id, respuesta_usuario, es_correcta) VALUES ?`;
            
            db.query(insertSql, [respuestasValues], (err) => {
                if (err) {
                    console.error('Error al insertar respuestas:', err);
                    return res.json({ success: false, message: "Error al guardar respuestas" });
                }

                const nota = (puntosObtenidos / totalPuntos) * 100;
                const aprobado = nota >= 70;

                db.query('SELECT intentos FROM resultados_evaluaciones WHERE usuario_id = ? AND capitulo_id = ?', 
                    [usuario_id, capitulo_id], 
                    (err, intentosResult) => {
                        
                    let nuevoIntento = 1;
                    if (!err && intentosResult.length > 0) {
                        nuevoIntento = intentosResult[0].intentos + 1;
                    }

                    const resultSql = `
                        INSERT INTO resultados_evaluaciones 
                        (usuario_id, capitulo_id, nota, aprobado, intentos, fecha_evaluacion)
                        VALUES (?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            nota = VALUES(nota),
                            aprobado = VALUES(aprobado),
                            intentos = VALUES(intentos),
                            fecha_evaluacion = VALUES(fecha_evaluacion)
                    `;

                    db.query(resultSql, [usuario_id, capitulo_id, nota, aprobado, nuevoIntento], (err) => {
                        if (err) {
                            console.error('Error al guardar resultado:', err);
                            return res.json({ success: false, message: "Error al guardar resultado" });
                        }

                        const checkSql = `
                            SELECT COUNT(*) as total_aprobados,
                                   (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total_capitulos
                            FROM resultados_evaluaciones
                            WHERE usuario_id = ? AND aprobado = 1
                        `;

                        db.query(checkSql, [usuario_id], (err, results) => {
                            if (!err && results[0] && results[0].total_aprobados >= results[0].total_capitulos) {
                                db.query('UPDATE Usuarios SET primera_vez = 0 WHERE ID = ?', [usuario_id]);
                            }
                        });

                        res.json({ 
                            success: true, 
                            nota: nota, 
                            aprobado: aprobado,
                            puntos_obtenidos: puntosObtenidos,
                            total_puntos: totalPuntos,
                            mensaje: aprobado ? `¡Felicidades! Aprobaste con ${Math.round(nota)}%` : `No aprobaste. Obtuviste ${Math.round(nota)}%. Mínimo requerido 70%`
                        });
                    });
                });
            });
        });
    });
});

// ============================================
// OBTENER PROGRESO GENERAL DEL USUARIO
// ============================================
app.get('/api/progreso-general', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total_capitulos,
            (SELECT COUNT(*) FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1) as capitulos_aprobados,
            (SELECT COUNT(*) FROM sub_capitulos_induccion WHERE activo = 1) as total_videos,
            (SELECT COUNT(*) FROM progreso_videos WHERE usuario_id = ? AND visto = 1) as videos_vistos
    `;

    db.query(sql, [req.session.usuarioID, req.session.usuarioID], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }
        res.json({ success: true, progreso: results[0] });
    });
});

// ============================================
// GUARDAR FIRMA DIGITAL
// ============================================
app.post('/api/guardar-firma', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const { firma_data } = req.body;
    const usuario_id = req.session.usuarioID;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;

    const checkSql = `SELECT id FROM firmas_usuario WHERE usuario_id = ?`;
    
    db.query(checkSql, [usuario_id], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error al verificar firma" });
        }

        let sql;
        if (results.length > 0) {
            sql = `UPDATE firmas_usuario SET firma_data = ?, ip_address = ?, fecha_firma = NOW() WHERE usuario_id = ?`;
            db.query(sql, [firma_data, ip, usuario_id], (err) => {
                if (err) {
                    console.error('Error:', err);
                    return res.json({ success: false, message: "Error al actualizar firma" });
                }
                res.json({ success: true, message: "Firma actualizada correctamente" });
            });
        } else {
            sql = `INSERT INTO firmas_usuario (usuario_id, firma_data, ip_address) VALUES (?, ?, ?)`;
            db.query(sql, [usuario_id, firma_data, ip], (err) => {
                if (err) {
                    console.error('Error:', err);
                    return res.json({ success: false, message: "Error al guardar firma" });
                }
                res.json({ success: true, message: "Firma guardada correctamente" });
            });
        }
    });
});

// ============================================
// GENERAR CERTIFICADO
// ============================================
app.post('/api/generar-certificado', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const usuario_id = req.session.usuarioID;

    const checkSql = `
        SELECT COUNT(*) as aprobados, (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total
        FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1
    `;

    db.query(checkSql, [usuario_id], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error al verificar" });
        }

        const { aprobados, total } = results[0];
        
        if (aprobados < total) {
            return res.json({ success: false, message: `Debes aprobar todos los capítulos. Aprobados: ${aprobados}/${total}` });
        }

        const notaSql = `SELECT AVG(nota) as nota_final FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1`;
        
        db.query(notaSql, [usuario_id], (err, notaResults) => {
            if (err) {
                console.error('Error:', err);
                return res.json({ success: false, message: "Error al calcular nota" });
            }

            const notaFinal = notaResults[0].nota_final || 0;
            const codigoCertificado = `CERT-${usuario_id}-${Date.now()}`;

            const existSql = `SELECT id FROM certificados_usuario WHERE usuario_id = ?`;
            
            db.query(existSql, [usuario_id], (err, existResults) => {
                let sql;
                if (existResults.length > 0) {
                    sql = `UPDATE certificados_usuario SET nota_final = ?, codigo_certificado = ?, fecha_emision = NOW() WHERE usuario_id = ?`;
                    db.query(sql, [notaFinal, codigoCertificado, usuario_id], (err) => {
                        if (err) {
                            console.error('Error:', err);
                            return res.json({ success: false, message: "Error al actualizar certificado" });
                        }
                        res.json({ success: true, nota_final: notaFinal, codigo: codigoCertificado });
                    });
                } else {
                    sql = `INSERT INTO certificados_usuario (usuario_id, nota_final, codigo_certificado) VALUES (?, ?, ?)`;
                    db.query(sql, [usuario_id, notaFinal, codigoCertificado], (err) => {
                        if (err) {
                            console.error('Error:', err);
                            return res.json({ success: false, message: "Error al generar certificado" });
                        }
                        res.json({ success: true, nota_final: notaFinal, codigo: codigoCertificado });
                    });
                }
            });
        });
    });
});

// ============================================
// OBTENER DATOS PARA CERTIFICADO
// ============================================
app.get('/api/datos-certificado', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const sql = `
        SELECT 
            u.ID,
            u.Usuario,
            e.nombre,
            e.numero_documento,
            e.codigo,
            c.nota_final,
            c.codigo_certificado,
            c.fecha_emision,
            f.firma_data
        FROM Usuarios u
        JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN certificados_usuario c ON u.ID = c.usuario_id
        LEFT JOIN firmas_usuario f ON u.ID = f.usuario_id
        WHERE u.ID = ?
        ORDER BY c.fecha_emision DESC
        LIMIT 1
    `;

    db.query(sql, [req.session.usuarioID], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "Usuario no encontrado" });
        }

        const datos = results[0];
        
        if (!datos.codigo_certificado) {
            const checkSql = `
                SELECT COUNT(*) as total_aprobados,
                       (SELECT COUNT(*) FROM capitulos_induccion WHERE activo = 1) as total_capitulos
                FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1
            `;
            
            db.query(checkSql, [req.session.usuarioID], (err, checkResults) => {
                if (!err && checkResults[0] && checkResults[0].total_aprobados >= checkResults[0].total_capitulos) {
                    const notaSql = `SELECT AVG(nota) as nota_final FROM resultados_evaluaciones WHERE usuario_id = ? AND aprobado = 1`;
                    db.query(notaSql, [req.session.usuarioID], (err, notaResults) => {
                        if (!err && notaResults[0]) {
                            const notaFinal = notaResults[0].nota_final || 0;
                            const codigoCertificado = `CERT-${req.session.usuarioID}-${Date.now()}`;
                            const insertSql = `INSERT INTO certificados_usuario (usuario_id, nota_final, codigo_certificado) VALUES (?, ?, ?)`;
                            db.query(insertSql, [req.session.usuarioID, notaFinal, codigoCertificado], (err) => {
                                if (!err) {
                                    datos.nota_final = notaFinal;
                                    datos.codigo_certificado = codigoCertificado;
                                    datos.fecha_emision = new Date();
                                }
                                res.json({ success: true, datos: datos });
                            });
                        } else {
                            res.json({ success: true, datos: datos });
                        }
                    });
                } else {
                    res.json({ success: true, datos: datos });
                }
            });
        } else {
            res.json({ success: true, datos: datos });
        }
    });
});

// ============================================
// DASHBOARD - OBTENER DATOS DEL USUARIO ACTUAL
// ============================================
app.get('/api/usuario-actual', (req, res) => {
    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const sql = `
        SELECT 
            u.ID,
            u.Usuario,
            u.primera_vez,
            e.codigo,
            e.nombre,
            e.numero_documento,
            c.nombre as cargo,
            r.Nombre as rol,
            s.nombre as sede
        FROM Usuarios u
        JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN cargos c ON e.cargo_id = c.id
        LEFT JOIN Rol r ON u.rol_id = r.ID
        LEFT JOIN sedes s ON e.sede_id = s.id
        WHERE u.ID = ?
    `;

    db.query(sql, [req.session.usuarioID], (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "Usuario no encontrado" });
        }

        const user = results[0];
        res.json({ success: true, usuario: user });
    });
});

// ============================================
// CAMBIO DE CONTRASEÑA
// ============================================
app.post('/api/cambiar-password', async (req, res) => {
    const { password } = req.body;

    if (!req.session.usuarioID) {
        return res.json({ success: false, message: "No autorizado" });
    }

    const id = req.session.usuarioID;

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        await new Promise((resolve, reject) => {
            db.query(`
                UPDATE Usuarios 
                SET 
                    password_hash = ?,
                    cambio_password = 0,
                    fecha_cambio_password = NOW()
                WHERE ID = ?
            `, [hashedPassword, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.query(`
                INSERT INTO historial_password (usuario_id, password_hash, fecha)
                VALUES (?, ?, NOW())
            `, [id, hashedPassword], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        req.session.destroy();

        return res.json({
            success: true,
            redirect: "/login"
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        return res.json({ success: false, message: "Error al procesar la contraseña" });
    }
});

// ============================================
// RECUPERAR CONTRASEÑA
// ============================================
app.post('/api/recuperar', async (req, res) => {
    const { documento } = req.body;

    const sql = `
        SELECT u.ID
        FROM Usuarios u
        JOIN empleados e ON u.empleado_id = e.id
        WHERE e.numero_documento = ?
    `;

    db.query(sql, [documento], async (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.json({ success: false, message: "Error servidor" });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "No existe usuario" });
        }

        const id = results[0].ID;
        const tempPass = '123456';

        try {
            const hashedTempPass = await bcrypt.hash(tempPass, SALT_ROUNDS);

            await new Promise((resolve, reject) => {
                db.query(`
                    UPDATE Usuarios 
                    SET 
                        password_hash = ?,
                        cambio_password = 1
                    WHERE ID = ?
                `, [hashedTempPass, id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            await new Promise((resolve, reject) => {
                db.query(`
                    INSERT INTO historial_password (usuario_id, password_hash, fecha)
                    VALUES (?, ?, NOW())
                `, [id, hashedTempPass], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            return res.json({
                success: true,
                message: "Contraseña temporal: 123456"
            });

        } catch (error) {
            console.error('Error al recuperar contraseña:', error);
            return res.json({ success: false, message: "Error al procesar" });
        }
    });
});

// ============================================
// LOGOUT
// ============================================
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/login');
    });
});

// ============================================
// SERVER
// ============================================
app.listen(PORT,'0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 Páginas disponibles:`);
    console.log(`   - http://localhost:${PORT}/`);
    console.log(`   - http://localhost:${PORT}/login`);
    console.log(`   - http://localhost:${PORT}/dashboard`);
    console.log(`   - http://localhost:${PORT}/induccion`);
    console.log(`   - http://localhost:${PORT}/evaluacion`);
    console.log(`   - http://localhost:${PORT}/resultados`);
    console.log(`   - http://localhost:${PORT}/firma`);
    console.log(`   - http://localhost:${PORT}/certificado`);
});