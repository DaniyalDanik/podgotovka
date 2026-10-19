// Cloudflare Worker: принимает события с сайта и пересылает их учителю в Telegram.
// Токен бота хранится в секретах Worker, а не в коде сайта.
//
// Настройка (Cloudflare Dashboard -> Workers -> Create -> вставить этот код):
//   Settings -> Variables and Secrets:
//     BOT_TOKEN       (Secret)  токен от @BotFather
//     CHAT_ID         (Secret)  ваш chat_id
//     ALLOWED_ORIGIN  (Text)    адрес вашего сайта, например https://daniyaldanik.github.io
// Полученный адрес Worker вставьте в data/config.js: const RESULTS_ENDPOINT = '...';
//
// События (поле type):
//   start  — ученик начал экзамен
//   leave  — ученик ушёл со вкладки / из полноэкранного режима (строгий режим)
//   result — итог экзамена (по умолчанию, если type не указан)

const clip = (v, n) => String(v ?? '').slice(0, n);
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

const REASONS = {
  tab: 'переключил(а) вкладку или приложение',
  blur: 'перешёл(ла) в другое окно',
  fullscreen: 'вышел(ла) из полноэкранного режима',
  reload: 'перезагрузил(а) страницу',
  exit: 'вышел(ла) из экзамена на сайте',
};

function fmtTime(sec) {
  sec = Math.max(0, Math.round(num(sec)));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? `${m} мин ${s} с` : `${s} с`;
}

function buildText(d) {
  const who = `👤 ${clip(d.name, 60)}\n👩‍🏫 ${clip(d.teacher, 40)}\n📚 ${clip(d.topic, 80)}`;
  const type = d.type || 'result';

  if (type === 'start') {
    return `▶️ Ученик начал экзамен\n${who}\n⏱ ${num(d.minutes)} мин · вопросов: ${num(d.total)}`;
  }
  if (type === 'leave') {
    const reason = REASONS[d.reason] || 'покинул(а) экзамен';
    return `⚠️ Ученик ${reason}\n${who}\nВыходов: ${num(d.leaves)} из ${num(d.max)}`;
  }
  if (type === 'result') {
    const score = num(d.score), total = num(d.total);
    if (total <= 0 || score < 0 || score > total) return null;
    const percent = Math.round(score / total * 100);
    const grade = percent >= 85 ? 5 : percent >= 65 ? 4 : percent >= 40 ? 3 : 2;
    let text = `🎓 Новый результат!\n${who}\n💯 ${score}/${total} (${percent}%) — Оценка: ${grade}`;
    if (num(d.durationSec)) text += `\n⏱ Время: ${fmtTime(d.durationSec)}`;
    if (num(d.leaves)) text += `\n⚠️ Выходов из экзамена: ${num(d.leaves)} (вне вкладки ${fmtTime(d.awaySec)})`;
    if (d.autoFinished) text += `\n⛔ Экзамен завершён автоматически`;
    return text;
  }
  return null;
}

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

    const text = d && typeof d === 'object' ? buildText(d) : null;
    if (!text) return new Response('Bad data', { status: 400, headers: cors });

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });
    return new Response(tg.ok ? 'ok' : 'error', { status: tg.ok ? 200 : 502, headers: cors });
  },
};
