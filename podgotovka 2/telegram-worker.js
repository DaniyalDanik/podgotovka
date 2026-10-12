// Cloudflare Worker: принимает результат теста и пересылает его в Telegram.
// Токен бота хранится в секретах Worker, а не в коде сайта.
//
// Настройка (Cloudflare Dashboard -> Workers -> Create -> вставить этот код):
//   Settings -> Variables and Secrets:
//     BOT_TOKEN       (Secret)  новый токен от @BotFather
//     CHAT_ID         (Secret)  ваш chat_id
//     ALLOWED_ORIGIN  (Text)    адрес вашего сайта, например https://username.github.io
// Полученный адрес Worker вставьте в index.html: const RESULTS_ENDPOINT = '...';

const clip = (v, n) => String(v ?? '').slice(0, n);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST' || origin !== env.ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403, headers: cors });
    }

    let d;
    try { d = await request.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }

    const score = Number(d.score), total = Number(d.total);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
      return new Response('Bad data', { status: 400, headers: cors });
    }
    const percent = Math.round(score / total * 100);
    const grade = percent >= 85 ? 5 : percent >= 65 ? 4 : percent >= 40 ? 3 : 2;

    const text =
      `🎓 Новый результат!\n👤 Ученик: ${clip(d.name, 60)}\n👩‍🏫 Учитель: ${clip(d.teacher, 40)}\n` +
      `📚 Тема: ${clip(d.topic, 60)}\n💯 ${score}/${total} (${percent}%) — Оценка: ${grade}`;

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });
    return new Response(tg.ok ? 'ok' : 'error', { status: tg.ok ? 200 : 502, headers: cors });
  },
};
