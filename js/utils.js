// Хеширование ответов, экранирование HTML, окна и подсказки
// ===== Проверка ответов без хранения ответов в открытом виде =====
// В коде лежат только SHA-256 хеши. Это защищает от «посмотрел в исходник»,
// но НЕ заменяет сервер: перебор A–E по хешу возможен. Для настоящей защиты
// ответы должен проверять сервер.
function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), i, j, result = '';
    var words = [], bl = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pc = k.length;
    var ic = {};
    for (var c = 2; pc < 64; c++) {
        if (!ic[c]) {
            for (i = 0; i < 313; i += c) ic[i] = c;
            hash[pc] = (mp(c, .5) * mw) | 0;
            k[pc++] = (mp(c, 1 / 3) * mw) | 0;
        }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((bl / mw) | 0);
    words[words.length] = (bl);
    for (j = 0; j < words.length;) {
        var w = words.slice(j, j += 16), oh = hash;
        hash = hash.slice(0, 8);
        for (i = 0; i < 64; i++) {
            var w15 = w[i - 15], w2 = w[i - 2];
            var a = hash[0], e = hash[4];
            var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
                (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
            var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(t1 + t2) | 0].concat(hash);
            hash[4] = (hash[4] + t1) | 0;
        }
        for (i = 0; i < 8; i++) hash[i] = (hash[i] + oh[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            var b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}

function sha256Utf8(str) { return sha256(unescape(encodeURIComponent(str))); }

function normAns(a) { return String(a == null ? '' : a).toUpperCase().trim(); }

function hashAnswerMap(subject, map) {
    const out = {};
    Object.keys(map || {}).forEach(k => { if (normAns(map[k]) !== '') out[k] = ansHash(subject, k, map[k]); });
    return out;
}

// Для тестовых вопросов (A–E) можно показать верную букву после ответа
function revealTestAnswer(subject, n) {
    for (const L of ['A', 'B', 'C', 'D', 'E']) if (isCorrectAnswer(subject, n, L)) return L;
    return null;
}

// Код учителя хранится как хеш. Сменить код: в консоли браузера выполнить
//   teacherCodeHash('новый_код')   и вставить результат в TEACHER_CODE_HASH
function teacherCodeHash(code) { return sha256Utf8('pdg-teacher|' + code); }

// ===== Вспомогательные функции =====
function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function safeJSON(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (e) { return fallback; }
}
// Короткий выбор строки по языку интерфейса
function tr(ru, kk) { return (typeof currentLang !== 'undefined' && currentLang === 'kk') ? kk : ru; }

// Ищет вариант учителя по id среди ВСЕХ учителей (а не только текущего)
function findVariantById(id) {
    for (const k of Object.keys(localStorage)) {
        if (!k.startsWith('teacher_variants_')) continue;
        const v = safeJSON(k, []).find(x => x && x.id === id);
        if (v) return v;
    }
    return null;
}
// Подгружает хеши ответов авторского варианта, если их ещё нет в памяти
function ensureAnswersLoaded(subject) {
    if (ALL_ANSWERS[subject]) return;
    const v = findVariantById(subject);
    if (v) ALL_ANSWERS[subject] = hashAnswerMap(subject, v.answers);
}

// ===== Красивые окна вместо alert/confirm =====
let _uiResolve = null;
function uiDialog(opts) {
    return new Promise(resolve => {
        if (_uiResolve) _uiResolve(false);
        _uiResolve = resolve;
        document.getElementById('uiModalText').textContent = opts.message || '';
        const ok = document.getElementById('uiModalOk');
        const cancel = document.getElementById('uiModalCancel');
        ok.textContent = opts.okText || tr('Ок', 'Жарайды');
        cancel.textContent = opts.cancelText || '';
        cancel.style.display = opts.cancelText ? '' : 'none';
        document.getElementById('uiModal').style.display = 'flex';
        ok.focus();
    });
}
function uiClose(result) {
    document.getElementById('uiModal').style.display = 'none';
    const r = _uiResolve; _uiResolve = null;
    if (r) r(result);
}
function uiAlert(message) { return uiDialog({ message: message }); }
function uiConfirm(message, okText, cancelText) {
    return uiDialog({ message: message, okText: okText || tr('Да', 'Иә'), cancelText: cancelText || tr('Отмена', 'Бас тарту') });
}
document.addEventListener('keydown', e => {
    const m = document.getElementById('uiModal');
    if (m && m.style.display === 'flex' && e.key === 'Escape') uiClose(false);
});
// Всплывающая подсказка, которая исчезает сама
function showToast(msg, type) {
    let box = document.getElementById('toast-box');
    if (!box) { box = document.createElement('div'); box.id = 'toast-box'; box.className = 'toast-box'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300); }, 3000);
}

// ===== Оценка по проценту (одна функция на весь сайт) =====
function gradeFor(percent) { return percent >= 85 ? 5 : percent >= 65 ? 4 : percent >= 40 ? 3 : 2; }

// ===== Гибкая проверка ответов =====
// Ответ приводится к единому виду: без пробелов и регистра, «;» и «,» как разделитель,
// «×», «·» как «*», длинное тире как «-». Запятая может быть и десятичной: 3,375 = 3.375
// Дополнительно: x² → X^2, 10⁻³ → 10^-3, 1×10^4 → 10^4, 5.3x10^3 → 5.3*10^3
const SUPERSCRIPTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function baseNorm(a) {
    return String(a == null ? '' : a).toUpperCase().replace(/\s+/g, '')
        .replace(/[×·⋅∙]/g, '*').replace(/[−–—]/g, '-');
}
function mathNorm(s) {
    return s
        .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, m => '^' + Array.from(m).map(c => SUPERSCRIPTS[c]).join(''))
        .replace(/\^\((-?\d+)\)/g, '^$1')                 // 10^(-3) → 10^-3
        .replace(/(\d)[XХ](?=10\^)/g, '$1*')              // 5.3x10^3 → 5.3*10^3
        .replace(/(^|[^\d.])1\*10\^/g, '$110^');           // 1*10^4 → 10^4
}
function canonAns(a) { return mathNorm(baseNorm(a)).replace(/;/g, ','); }
// Старый вид (без mathNorm) — им посчитаны хеши в data/answers.js, поэтому пробуем оба
function canonAnsLegacy(a) { return baseNorm(a).replace(/;/g, ','); }
// Прочтения ответа ученика: запятая — разделитель ИЛИ десятичная запятая
function answerCandidates(a) {
    const out = new Set();
    [baseNorm(a), mathNorm(baseNorm(a))].forEach(s => {
        out.add(s.replace(/;/g, ','));
        out.add(s.replace(/,/g, '.').replace(/;/g, ','));
    });
    return Array.from(out);
}
// Число из строки: 3, -2.5, 3,5, 8/3 → число; иначе NaN
function parseNumAns(s) {
    s = baseNorm(s).replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    const m = s.match(/^(-?\d+)\/(\d+)$/);
    return m && Number(m[2]) !== 0 ? Number(m[1]) / Number(m[2]) : NaN;
}
// Сравнение одного ответа с одним правильным (для уроков, где ответы открыты)
function answerMatchesOne(input, correct) {
    const want = canonAns(correct);
    const cands = answerCandidates(input);
    if (cands.includes(want)) return true;
    // список корней в любом порядке: «5,2» = «2;5», «3» = «3;3»
    if (String(correct).includes(';')) {
        const set = s => Array.from(new Set(s.split(',').filter(Boolean))).sort().join(',');
        if (cands.some(c => set(c) === set(want))) return true;
    }
    // числа: 2.666 ≈ 2.67, 1/2 = 0.5
    const c = parseNumAns(correct), v = parseNumAns(input);
    if (!isFinite(c) || !isFinite(v)) return false;
    const dec = (String(correct).split('.')[1] || '').length;
    if (dec > 0) return Math.abs(v - c) <= 0.5 * Math.pow(10, -dec) + 1e-9;
    // для целых и дробей принимаем десятичную запись (0.5 = 1/2), но не «несокращённую» дробь
    return !String(input).includes('/') && Math.abs(v - c) < 1e-9;
}
// correct может быть строкой или массивом допустимых ответов
function answerMatches(input, correct) {
    return (Array.isArray(correct) ? correct : [correct]).some(c => answerMatchesOne(input, c));
}
function ansHash(subject, n, a) { return sha256Utf8('pdg|' + subject + '|' + n + '|' + canonAns(a)); }
function isCorrectAnswer(subject, n, a) {
    const h = ALL_ANSWERS[subject] && ALL_ANSWERS[subject][n];
    if (!h) return false;
    return answerCandidates(a).some(c => sha256Utf8('pdg|' + subject + '|' + n + '|' + c) === h);
}
