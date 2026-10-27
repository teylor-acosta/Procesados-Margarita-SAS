const bcrypt = require('bcrypt');
const db = require('./DB');
const SALT_ROUNDS = 10;

async function migrarPasswords() {
    console.log('🔐 Migrando contraseñas existentes...');
    
    // Obtener todos los usuarios
    db.query('SELECT ID, password_hash FROM usuarios', async (err, users) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        
        for (const user of users) {
            // Verificar si la contraseña ya está encriptada (opcional)
            if (!user.password_hash.startsWith('$2b$')) {
                const hashedPassword = await bcrypt.hash(user.password_hash, SALT_ROUNDS);
                
                db.query('UPDATE usuarios SET password_hash = ? WHERE ID = ?', 
                    [hashedPassword, user.ID], 
                    (err) => {
                        if (err) {
                            console.error(`Error actualizando usuario ${user.ID}:`, err);
                        } else {
                            console.log(`✅ Usuario ${user.ID} actualizado`);
                        }
                    }
                );
            } else {
                console.log(`⏭️ Usuario ${user.ID} ya tiene contraseña encriptada`);
            }
        }
        
        console.log('✅ Migración completada');
        process.exit(0);
    });
}

migrarPasswords();