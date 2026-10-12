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

// (см. answers_utils)

function hashAnswerMap(subject, map) {
    const out = {};
    Object.keys(map || {}).forEach(k => { if (normAns(map[k]) !== '') out[k] = ansHash(subject, k, map[k]); });
    return out;
}

// (см. answers_utils)

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

// ===== Гибкая проверка ответов =====
// Ответ приводится к единому виду: без пробелов и регистра, «;» и «,» как разделитель,
// «×», «·» как «*», длинное тире как «-». Запятая может быть и десятичной: 3,375 = 3.375
function canonAns(a) {
    return String(a == null ? '' : a).toUpperCase().replace(/\s+/g, '')
        .replace(/[×·⋅∙]/g, '*').replace(/[−–—]/g, '-').replace(/;/g, ',');
}
// Два прочтения ответа ученика: запятая — разделитель ИЛИ десятичная запятая
function answerCandidates(a) {
    const s = String(a == null ? '' : a).toUpperCase().replace(/\s+/g, '')
        .replace(/[×·⋅∙]/g, '*').replace(/[−–—]/g, '-');
    return [s.replace(/;/g, ','), s.replace(/,/g, '.').replace(/;/g, ',')];
}
function answerMatches(input, correct) { return answerCandidates(input).includes(canonAns(correct)); }
function ansHash(subject, n, a) { return sha256Utf8('pdg|' + subject + '|' + n + '|' + canonAns(a)); }
function isCorrectAnswer(subject, n, a) {
    const h = ALL_ANSWERS[subject] && ALL_ANSWERS[subject][n];
    if (!h) return false;
    return answerCandidates(a).some(c => sha256Utf8('pdg|' + subject + '|' + n + '|' + c) === h);
}
