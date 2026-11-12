// ============================================================
// config/tareas-automaticas.js
// CONTROLADOR DE TAREAS AUTOMÁTICAS (Cron Jobs)
// ============================================================

const cron = require('node-cron');

module.exports = function iniciarTareas(db) {
    console.log('⏰ Iniciando el controlador de tareas automáticas...');

    // ============================================================
    // 🛠️ CONFIGURACIÓN DEL TIEMPO
    // ============================================================
    // Aquí puedes cambiar cuántos días deben pasar para que las
    // novedades pasen automáticamente al historial.
    const DIAS_PARA_HISTORIAL = 14; 

    // Aquí puedes cambiar la hora a la que se ejecuta la limpieza.
    // '0 0 * * *' significa "todos los días a las 12:00 de la noche (medianoche)".
    const FRECUENCIA = '0 0 * * *'; 

    // ============================================================

    cron.schedule(FRECUENCIA, async () => {
        console.log(`⏰ Ejecutando limpieza automática de novedades (Mayores a ${DIAS_PARA_HISTORIAL} días)...`);
        
        try {
            // Busca las novedades Aprobadas o Rechazadas que ya cumplieron el tiempo
            const [novedades] = await db.query(`
                SELECT id, estado FROM nomina_novedades 
                WHERE estado IN ('APROBADA', 'RECHAZADA') 
                AND fecha_revision <= DATE_SUB(NOW(), INTERVAL ? DAY)
            `, [DIAS_PARA_HISTORIAL]);

            if (novedades.length > 0) {
                for (const nov of novedades) {
                    // 1. Cambiar el estado a EN_HISTORIAL
                    await db.query(`UPDATE nomina_novedades SET estado = 'EN_HISTORIAL' WHERE id = ?`, [nov.id]);
                    
                    // 2. Registrar en la tabla de historial (usuario_id = 1 para el sistema)
                    await db.query(`
                        INSERT INTO nomina_novedades_historial 
                        (novedad_id, estado_anterior, estado_nuevo, observacion, usuario_id, fecha_registro) 
                        VALUES (?, ?, 'EN_HISTORIAL', 'Movido automáticamente al historial', 1, NOW())
                    `, [nov.id, nov.estado]);
                }
                console.log(`✅ ${novedades.length} novedades movidas al historial automáticamente.`);
            } else {
                console.log('✅ No hay novedades para mover al historial hoy.');
            }
        } catch (error) {
            console.error('❌ Error en la tarea automática de novedades:', error);
        }
    });
};