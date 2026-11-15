// Cloudflare Worker для сайта «Подготовка»:
//   1) пересылает события с сайта учителю в Telegram (начал экзамен, вышел со вкладки, результат);
//   2) хранит общую базу в Cloudflare KV: варианты учителей и результаты учеников,
//      чтобы они были видны с любого устройства.
//
// Настройка (Cloudflare Dashboard -> Workers -> podgotovka-results):
//   Settings -> Variables and Secrets:
//     BOT_TOKEN       (Secret)  токен от @BotFather
//     CHAT_ID         (Secret)  чат или группа для уведомлений (у группы номер с минусом)
//     ALLOWED_ORIGIN  (Text)    адрес сайта: https://daniyaldanik.github.io (можно несколько через запятую)
//     TEACHER_CODE    (Secret)  код учителя — тот же, что вводится на сайте
//   Settings -> Bindings -> KV namespace:
//     Variable name: DB   (хранилище KV)
// Адрес Worker вставьте в data/config.js: const RESULTS_ENDPOINT = '...';
//
// API:
//   POST   /                       событие (type: start | leave | result); result ещё и сохраняется в базу
//   GET    /api/ping               проверка: подключена ли база
//   GET    /api/variants           список вариантов (без вопросов и картинок)
//   GET    /api/variants/:id       вариант целиком (ответы — только с кодом учителя)
//   PUT    /api/variants/:id       сохранить вариант            (нужен код учителя)
//   DELETE /api/variants/:id       удалить вариант              (нужен код учителя)
//   GET    /api/results?teacher=…  результаты учителя           (нужен код учителя)
//   DELETE /api/results?teacher=…  очистить результаты учителя  (нужен код учителя)

const clip = (v, n) => String(v ?? '').slice(0, n);
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const MAX_VARIANT_BYTES = 20 * 1024 * 1024;     // лимит KV — 25 МБ на значение
const RESULT_TTL = 365 * 24 * 60 * 60;          // результаты хранятся год

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
function gradeFor(percent) { return percent >= 85 ? 5 : percent >= 65 ? 4 : percent >= 40 ? 3 : 2; }

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
    const percent = Math.round(score / total * 100);
    let text = `🎓 Новый результат!\n${who}\n💯 ${score}/${total} (${percent}%) — Оценка: ${gradeFor(percent)}`;
    if (num(d.durationSec)) text += `\n⏱ Время: ${fmtTime(d.durationSec)}`;
    if (num(d.leaves)) text += `\n⚠️ Выходов из экзамена: ${num(d.leaves)} (вне вкладки ${fmtTime(d.awaySec)})`;
    if (d.autoFinished) text += `\n⛔ Экзамен завершён автоматически`;
    return text;
  }
  return null;
}

function validResult(d) {
  const score = num(d.score), total = num(d.total);
  return total > 0 && total <= 200 && score >= 0 && score <= total;
}

// Результат храним отдельным ключом, а сами данные — в metadata (до 1 КБ):
// так одновременные результаты не затирают друг друга, а список читается одним запросом.
function resultRecord(d) {
  const score = num(d.score), total = num(d.total);
  const percent = Math.round(score / total * 100);
  return {
    name: clip(d.name, 60), teacher: clip(d.teacher, 40), topic: clip(d.topic, 80),
    score, total, percent, grade: gradeFor(percent),
    leaves: Math.min(99, num(d.leaves)), awaySec: Math.min(99999, num(d.awaySec)),
    autoFinished: !!d.autoFinished, durationSec: Math.min(99999, num(d.durationSec)),
    ts: Date.now(),
  };
}

async function sendTelegram(env, text) {
  if (!env.BOT_TOKEN || !env.CHAT_ID) return true;
  const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
  });
  return tg.ok;
}

// ----- Варианты -----
function variantMeta(v) {
  const q = v.questions || {};
  return {
    id: v.id, name: clip(v.name, 80), subject: clip(v.subject, 20), teacher: clip(v.teacher, 40),
    count: num(v.count) || 15, timeMin: num(v.timeMin) || 60, strict: v.strict !== false, maxLeaves: num(v.maxLeaves) || 3,
    images: Object.keys(v.images || {}).length,
    texts: Object.values(q).filter(x => x && x.text).length,
    answers: Object.values(v.answers || {}).filter(Boolean).length,
    created: clip(v.created, 40), updated: clip(v.updated, 40),
  };
}
async function readIndex(env) {
  return (await env.DB.get('index', 'json')) || [];
}
async function writeIndex(env, list) {
  await env.DB.put('index', JSON.stringify(list));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] || ''),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Teacher-Code',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const json = (data, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
    const fail = (msg, status) => json({ ok: false, error: msg }, status);

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!allowed.includes(origin)) return fail('forbidden origin', 403);

    const path = url.pathname.replace(/\/+$/, '') || '/';
    const isTeacher = () => !!env.TEACHER_CODE && request.headers.get('X-Teacher-Code') === env.TEACHER_CODE;
    const needDB = () => (env.DB ? null : fail('KV binding DB is not configured', 503));

    try {
      // ===== События (старый адрес, его использует сайт для уведомлений) =====
      if (path === '/' && request.method === 'POST') {
        let d;
        try { d = await request.json(); } catch { return fail('bad json', 400); }
        if (!d || typeof d !== 'object') return fail('bad data', 400);
        if ((d.type || 'result') === 'result') {
          if (!validResult(d)) return fail('bad result', 400);
          if (env.DB) {
            const rec = resultRecord(d);
            const key = `r:${encodeURIComponent(rec.teacher)}:${String(rec.ts).padStart(15, '0')}:${crypto.randomUUID().slice(0, 8)}`;
            await env.DB.put(key, '1', { metadata: rec, expirationTtl: RESULT_TTL });
          }
        }
        const text = buildText(d);
        if (!text) return fail('bad data', 400);
        const ok = await sendTelegram(env, text);
        return json({ ok, stored: !!env.DB }, ok ? 200 : 502);
      }

      if (path === '/api/ping') {
        return json({ ok: true, db: !!env.DB, teacherCode: !!env.TEACHER_CODE, telegram: !!(env.BOT_TOKEN && env.CHAT_ID) });
      }

      // ===== Варианты =====
      if (path === '/api/variants' && request.method === 'GET') {
        const no = needDB(); if (no) return no;
        return json({ ok: true, variants: await readIndex(env) });
      }

      const vm = path.match(/^\/api\/variants\/([A-Za-z0-9_-]{1,80})$/);
      if (vm) {
        const no = needDB(); if (no) return no;
        const id = vm[1];
        if (request.method === 'GET') {
          const v = await env.DB.get('v:' + id, 'json');
          if (!v) return fail('not found', 404);
          if (!isTeacher()) delete v.answers;            // ученикам — только хеши ответов
          return json({ ok: true, variant: v });
        }
        if (!isTeacher()) return fail('wrong teacher code', 401);
        if (request.method === 'PUT') {
          const raw = await request.text();
          if (raw.length > MAX_VARIANT_BYTES) return fail('variant too large', 413);
          let v;
          try { v = JSON.parse(raw); } catch { return fail('bad json', 400); }
          if (!v || typeof v !== 'object' || !clip(v.name, 80).trim()) return fail('bad variant', 400);
          v.id = id;
          await env.DB.put('v:' + id, JSON.stringify(v));
          const list = (await readIndex(env)).filter(x => x.id !== id);
          list.push(variantMeta(v));
          await writeIndex(env, list);
          return json({ ok: true, meta: variantMeta(v) });
        }
        if (request.method === 'DELETE') {
          await env.DB.delete('v:' + id);
          await writeIndex(env, (await readIndex(env)).filter(x => x.id !== id));
          return json({ ok: true });
        }
      }

      // ===== Результаты =====
      if (path === '/api/results') {
        const no = needDB(); if (no) return no;
        if (!isTeacher()) return fail('wrong teacher code', 401);
        const teacher = clip(url.searchParams.get('teacher'), 40);
        if (!teacher) return fail('teacher required', 400);
        const clearedKey = 'cleared:' + encodeURIComponent(teacher);
        if (request.method === 'DELETE') {
          await env.DB.put(clearedKey, String(Date.now()));
          return json({ ok: true });
        }
        if (request.method === 'GET') {
          const cleared = num(await env.DB.get(clearedKey));
          const out = [];
          let cursor;
          for (let page = 0; page < 5; page++) {
            const res = await env.DB.list({ prefix: `r:${encodeURIComponent(teacher)}:`, cursor });
            res.keys.forEach(k => { if (k.metadata && num(k.metadata.ts) > cleared) out.push(k.metadata); });
            if (res.list_complete) break;
            cursor = res.cursor;
          }
          return json({ ok: true, results: out });
        }
      }

      return fail('not found', 404);
    } catch (e) {
      return fail('server error: ' + clip(e && e.message, 200), 500);
    }
  },
};
