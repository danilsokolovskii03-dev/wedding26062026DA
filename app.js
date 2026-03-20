require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

const TELEGRAM_TOKEN = '7800015098:AAG4jzyM0MpWJZELlMk9ppyRtM-97Wf1G7E';
const CHAT_ID = '576062081';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

// Небольшая вспомогательная функция для нормализации чекбокса
function toBool(v) {
  if (v === true || v === 'true' || v === 'on' || v === '1' || v === 1) return true;
  return false;
}

app.post('/send-to-telegram', async (req, res) => {
  try {
    const rawText = req.body.text;
    const rawA = req.body.checkboxA;
    const rawB = req.body.checkboxB;

    const text = (typeof rawText === 'string' && rawText.trim()) ? rawText.trim() : '-';
    const checkboxA = toBool(rawA);
    const checkboxB = toBool(rawB);

    // Формируем части сообщения только для выбранных опций
    const lines = [];
    lines.push(`Ответ:`);
    lines.push(`Гость: ${escapeHtml(String(text))}`);

    if (checkboxA) {
      lines.push(`Присутствие: Да, с удовольствием!`);
    }
    if (checkboxB) {
      lines.push(`Присутствие: К сожалению, не смогу`);
    }

    // Если ни один чекбокс не выбран — можно явно указать отсутствие выбора
    if (!checkboxA && !checkboxB) {
      lines.push(`Присутствие: Не выбрано`);
    }

    const message = lines.join('\n');

    // Используем встроенный fetch (Node 18+) или глобальный fetch, если доступен.
    // Если у вас старый Node и вы используете node-fetch — замените на динамический import или установите fetch polyfill.
    const fetchFn = (typeof fetch === 'function') ? fetch : (await import('node-fetch')).default;

    const response = await fetchFn(TELEGRAM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML' })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram error', data);
      return res.status(500).json({ success: false, error: data });
    }

    res.json({ success: true, result: data.result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));