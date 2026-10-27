const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { proteger } = require('../middlewares/auth');

// ============================================
// 🔥 SUBIR FOTO PERFIL (PROCESAMIENTO SEGURO)
// ============================================
router.post('/api/subir-foto', proteger, async (req, res) => {
    try {
        const db = req.app.get('db');
        const { foto } = req.body; // Aquí llega el String Base64 desde el frontend

        if (!foto) {
            return res.status(400).json({ success: false, error: "No se recibió ninguna imagen." });
        }

        // 1. Validar que realmente sea una estructura Base64 válida
        if (!foto.startsWith('data:image/')) {
            return res.status(400).json({ success: false, error: "Formato de imagen inválido." });
        }

        // 2. Extraer la extensión de la imagen (png, jpeg, jpg, etc.) y aislar los datos limpios
        const matches = foto.match(/^data:image\/([A-Za-z-+0-9]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, error: "Error al procesar la codificación de la imagen." });
        }

        const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1]; // Normalizar jpeg a jpg
        const imagenBuffer = Buffer.from(matches[2], 'base64'); // Convertir el texto a un archivo binario real

        // 3. Crear un nombre de archivo único para evitar colisiones (ej: foto-171829384.jpg)
        const nombreArchivo = `foto-${req.session.usuarioID}-${Date.now()}.${extension}`;
        
        // 4. Definir la ruta física en el servidor (asegúrate de que las carpetas existan)
        const rutaCarpeta = path.join(__dirname, '../public/uploads/fotos');
        
        // Crear la carpeta recursivamente si no existe en tu estructura de directorios
        if (!fs.existsSync(rutaCarpeta)) {
            fs.mkdirSync(rutaCarpeta, { recursive: true });
        }

        const rutaCompleta = path.join(rutaCarpeta, nombreArchivo);

        // 5. Guardar el archivo físicamente en el disco del servidor
        fs.writeFileSync(rutaCompleta, imagenBuffer);

        // 6. Guardar ÚNICAMENTE el nombre del archivo en la base de datos
        const sql = `
            UPDATE empleados e
            JOIN usuarios u ON u.empleado_id = e.id
            SET e.foto = ?
            WHERE u.id = ?
        `;

        await db.query(sql, [nombreArchivo, req.session.usuarioID]);

        // 7. Retornar éxito junto con el nombre del nuevo archivo creado
        res.json({
            success: true,
            foto: nombreArchivo
        });

    } catch (error) {
        console.error('🔥 ERROR SUBIR FOTO:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;