// Общая база на сервере (Cloudflare Worker + KV): варианты учителей и результаты учеников.
// Если RESULTS_ENDPOINT пустой, сайт работает как раньше — всё хранится в браузере.
const CLOUD = {
    on: typeof RESULTS_ENDPOINT === 'string' && RESULTS_ENDPOINT.trim() !== '',
    index: null,          // список вариантов (без вопросов), кэш
    indexAt: 0,
    full: {}              // id → вариант целиком (вопросы, картинки, хеши ответов)
};

function apiUrl(path) { return RESULTS_ENDPOINT.trim().replace(/\/+$/, '') + path; }
function teacherCodeValue() { try { return sessionStorage.getItem('teacherCode') || ''; } catch (e) { return ''; } }

async function api(path, opts) {
    opts = opts || {};
    const headers = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.teacher) headers['X-Teacher-Code'] = teacherCodeValue();
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), opts.timeout || 20000) : null;
    let res;
    try {
        res = await fetch(apiUrl(path), {
            method: opts.method || 'GET',
            headers: headers,
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
            cache: 'no-store',
            signal: ctrl ? ctrl.signal : undefined
        });
    } catch (e) {
        throw Object.assign(new Error('network'), { status: 0 });
    } finally {
        if (timer) clearTimeout(timer);
    }
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok || !data || data.ok === false) {
        throw Object.assign(new Error((data && data.error) || ('HTTP ' + res.status)), { status: res.status });
    }
    return data;
}

// Понятное сообщение об ошибке сервера
function cloudErrorText(e) {
    if (!e) return '';
    if (e.status === 401) return tr('Код учителя не совпадает с кодом на сервере (TEACHER_CODE в Cloudflare).', 'Мұғалім коды сервердегі кодпен сәйкес емес (Cloudflare-дағы TEACHER_CODE).');
    if (e.status === 503) return tr('База на сервере не подключена (KV binding DB в Cloudflare).', 'Сервердегі база қосылмаған (Cloudflare-дағы KV binding DB).');
    if (e.status === 413) return tr('Вариант слишком большой: уберите часть картинок.', 'Нұсқа тым үлкен: суреттердің бір бөлігін алып тастаңыз.');
    if (e.status === 0) return tr('Нет связи с сервером. Проверьте интернет.', 'Сервермен байланыс жоқ. Интернетті тексеріңіз.');
    return tr('Ошибка сервера: ', 'Сервер қатесі: ') + e.message;
}

// ----- Варианты -----
async function cloudIndex(force) {
    if (!CLOUD.on) return [];
    if (!force && CLOUD.index && Date.now() - CLOUD.indexAt < 30000) return CLOUD.index;
    const data = await api('/api/variants');
    CLOUD.index = Array.isArray(data.variants) ? data.variants : [];
    CLOUD.indexAt = Date.now();
    return CLOUD.index;
}

function rememberVariant(v) {
    if (!v || !v.id) return v;
    v.cloud = true;
    CLOUD.full[v.id] = v;
    if (v.answersHash) ALL_ANSWERS[v.id] = v.answersHash;
    // копия на время сессии: нужна, чтобы продолжить экзамен после перезагрузки страницы
    try { sessionStorage.setItem('cv_' + v.id, JSON.stringify(v)); } catch (e) {}
    return v;
}

// Вариант целиком. withAnswers — для редактирования учителем (нужен код учителя)
async function cloudVariant(id, withAnswers) {
    if (!withAnswers && CLOUD.full[id]) return CLOUD.full[id];
    const data = await api('/api/variants/' + encodeURIComponent(id), { teacher: !!withAnswers });
    return rememberVariant(data.variant);
}

async function cloudSaveVariant(v) {
    const data = await api('/api/variants/' + encodeURIComponent(v.id), { method: 'PUT', body: v, teacher: true, timeout: 60000 });
    rememberVariant(v);
    if (CLOUD.index) {
        CLOUD.index = CLOUD.index.filter(x => x.id !== v.id).concat([data.meta]);
    }
    return data.meta;
}

async function cloudDeleteVariant(id) {
    await api('/api/variants/' + encodeURIComponent(id), { method: 'DELETE', teacher: true });
    delete CLOUD.full[id];
    try { sessionStorage.removeItem('cv_' + id); } catch (e) {}
    if (CLOUD.index) CLOUD.index = CLOUD.index.filter(x => x.id !== id);
}

// ----- Результаты -----
async function cloudResults(teacher) {
    const data = await api('/api/results?teacher=' + encodeURIComponent(teacher), { teacher: true });
    return (data.results || []).map(r => Object.assign({}, r, {
        date: r.ts ? new Date(r.ts).toLocaleString('ru-RU') : (r.date || '')
    }));
}

async function cloudClearResults(teacher) {
    await api('/api/results?teacher=' + encodeURIComponent(teacher), { method: 'DELETE', teacher: true });
}
