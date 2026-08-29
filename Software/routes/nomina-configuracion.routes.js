const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/nomina/configuracion', (req, res) => {
    res.sendFile(
        path.join(__dirname, '..', 'public', 'nomina-configuracion.html')
    );
});

module.exports = router;