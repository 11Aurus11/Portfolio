import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PROJECT_ROOT = path.join(__dirname, '../..');
const PUBLIC_PATH = path.join(PROJECT_ROOT, 'public');

app.use(express.json());
app.use(express.static(PUBLIC_PATH));
app.use('/ts', express.static(path.join(PROJECT_ROOT, 'dist/frontend/ts')));

// Конфиг из переменных окружения
const PORT = process.env.PORT;
const OWNER_EMAIL = process.env.OWNER_EMAIL;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// Почта
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// Валидация
const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v: string): boolean => v.replace(/\D/g, '').length >= 10;

// Типы для тела запросов
interface ContactBody {
  name?: string;
  phone?: string;
  email?: string;
  comment?: string;
}

interface AiHelperBody {
  name?: string;
  draft?: string;
}

// Роуты
// POST /api/contact
app.post('/api/contact', async (req: Request<{}, {}, ContactBody>, res: Response) => {
  const { name, phone, email, comment } = req.body;

  if (!name?.trim() || name.trim().length < 2) {
    return res.status(400).json({ message: 'Введите корректное имя' });
  }
  if (!phone?.trim() || !isPhone(phone)) {
    return res.status(400).json({ message: 'Введите корректный телефон' });
  }
  if (!email?.trim() || !isEmail(email)) {
    return res.status(400).json({ message: 'Введите корректный email' });
  }

  const safeComment = comment?.trim() || '(без комментария)';
  const timestamp   = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  const ownerHtml = `
    <div style="font-family:sans-serif;max-width:560px;">
      <h2 style="color:#0a0a0a;margin-bottom:8px;">Новое сообщение с сайта</h2>
      <p style="color:#555;font-size:13px;margin-bottom:24px;">${timestamp} МСК</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:120px;">Имя</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${name.trim()}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Телефон</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${phone.trim()}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Email</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${email.trim()}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;vertical-align:top;">Комментарий</td>
            <td style="padding:8px 12px;">${safeComment}</td></tr>
      </table>
    </div>`;

  const userHtml = `
    <div style="font-family:sans-serif;max-width:560px;">
      <h2 style="color:#0a0a0a;">Ваше сообщение получено ✓</h2>
      <p style="color:#555;">Здравствуйте, ${name.trim()}!</p>
      <p style="color:#555;">Ваше сообщение успешно отправлено. Я отвечу в ближайшее время.</p>
      <blockquote style="border-left:3px solid #e8ff4d;padding:8px 16px;margin:16px 0;color:#888;">
        ${safeComment}
      </blockquote>
      <p style="color:#555;font-size:13px;margin-top:24px;">
        С уважением,<br><strong>Эльдар Рагимов</strong><br>
        <a href="mailto:${OWNER_EMAIL}" style="color:#0a0a0a;">${OWNER_EMAIL}</a>
      </p>
    </div>`;

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Портфолио" <${SMTP_USER}>`,
        to: OWNER_EMAIL,
        subject: `Новое сообщение от ${name.trim()}`,
        html: ownerHtml,
      }),
      transporter.sendMail({
        from: `"Эльдар Рагимов" <${SMTP_USER}>`,
        to: email.trim(),
        subject: 'Ваше сообщение получено',
        html: userHtml,
      }),
    ]);

    console.log(`[contact] отправлено -> владелец + ${email.trim()}`);
    return res.json({ ok: true, message: 'Сообщение отправлено' });
  } catch (err) {
    console.error('[contact] ошибка почты:', err);
    return res.status(500).json({ message: 'Ошибка при отправке письма. Попробуйте позже.' });
  }
});

// POST /api/ai-helper — генерация черновика через Claude
app.post('/api/ai-helper', async (req: Request<{}, {}, AiHelperBody>, res: Response) => {
  const { name, draft } = req.body;

  if (!OPENROUTER_KEY) {
    return res.status(503).json({ message: 'AI-сервис не настроен' });
  }

  const prompt = draft
    ? `Меня зовут ${name || 'пользователь'}. Вот черновик моего сообщения разработчику: "${draft}". Перепиши его более чётко и профессионально, сохранив смысл.`
    : `Меня зовут ${name || 'пользователь'}. Напиши короткое, дружелюбное и профессиональное сообщение frontend-разработчику с предложением о сотрудничестве. 2-3 предложения.`;

  try {
    const client = new OpenAI({ apiKey: OPENROUTER_KEY, baseURL: 'https://openrouter.ai/api/v1' });

    const message = await client.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        { 
          role: 'system', 
          content: 'Ты помогаешь пользователям написать краткое деловое сообщение. Отвечай только готовым текстом сообщения, без преамбул, кавычек и подписи.' 
        },
        { role: 'user', content: prompt }
      ],
        max_tokens: 300,
        temperature: 0.7,
      });

    const text = message.choices[0]?.message?.content?.trim() || ''

    return res.json({ text });
  } catch (err) {
    console.error('[ai-helper] ошибка:', err);
    return res.status(500).json({ message: 'Ошибка ИИ-сервиса' });
  }
});

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
