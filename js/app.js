// Навигация, вход ученика, язык, отправка результата
let currentLang = 'ru', currentBaseSubject = 'math', currentSubject = 'math_v1', currentMode = 'prep', solvedQuestions = {}, currentQuestionNum = 1, timerInterval;

function isVisible(id) {
    const el = document.getElementById(id);
    return !!el && el.style.display !== 'none' && el.style.display !== '';
}

function setLanguage(lang) {
    if (!translations[lang]) lang = 'ru';
    currentLang = lang;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    document.documentElement.lang = lang === 'kk' ? 'kk' : 'ru';
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('lang-' + lang).classList.add('active');

    const tl = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const v = tl[el.getAttribute('data-i18n')];
        if (typeof v === 'string') el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const v = tl[el.getAttribute('data-i18n-ph')];
        if (typeof v === 'string') el.placeholder = v;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const v = tl[el.getAttribute('data-i18n-title')];
        if (typeof v === 'string') el.title = v;
    });

    renderTopics();
    updateLessonContent(lang);
    if (isVisible('quiz-page')) updateQuizUI();
    if (isVisible('variant-selection')) renderVariantSelection();
    if (isVisible('teacher-dashboard-page') && typeof currentTeacher !== 'undefined' && currentTeacher) {
        teacherRenderStats(); teacherRenderTable(); renderSavedVariants();
    }
    if (typeof updateStrictBanner === 'function') updateStrictBanner();
}

function renderTopics() {
    const container = document.getElementById('topic-container');
    if (!container) return;
    container.innerHTML = '';
    translations[currentLang]['math-topics'].forEach((topic, index) => {
        const div = document.createElement('div');
        div.className = 'topic-item';
        div.innerHTML = `<div class="topic-num">${index + 1}</div> <div>${topic}</div>`;
        div.onclick = () => selectTopic(index + 1);
        container.appendChild(div);
    });
}

// Список учителей на странице входа берётся из TEACHERS (data/config.js)
function fillTeacherSelect() {
    const sel = document.getElementById('teacherSelect');
    if (!sel || sel.options.length > 1) return;
    TEACHERS.forEach(name => {
        const o = document.createElement('option');
        o.value = name; o.textContent = name;
        sel.appendChild(o);
    });
}

function registerStudent() {
    const nameInput = document.getElementById('studentName').value.trim();
    const teacherInput = document.getElementById('teacherSelect').value;

    if (nameInput === '') {
        uiAlert(translations[currentLang]['login-name-required']);
        return;
    }
    if (teacherInput === '') {
        uiAlert(tr('Пожалуйста, выбери учителя!', 'Мұғалімді таңда!'));
        return;
    }

    localStorage.setItem('studentName', nameInput);
    localStorage.setItem('studentTeacher', teacherInput);
    localStorage.setItem('loginTime', Date.now().toString());
    showPage('home-page');
    checkExamResume();
}

window.onload = function() {
    fillTeacherSelect();
    flushPendingResults();
    const savedName = localStorage.getItem('studentName');
    const savedTeacher = localStorage.getItem('studentTeacher');
    const loginTime = localStorage.getItem('loginTime');
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const expired = !loginTime || (Date.now() - parseInt(loginTime)) > TWO_HOURS;

    // Незавершённый экзамен не даём «потерять» из-за истечения входа
    if ((!savedName || !savedTeacher || expired) && !(savedName && loadExamState())) {
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentTeacher');
        localStorage.removeItem('loginTime');
        showPage('login-page');
    } else {
        showPage('home-page');
        checkExamResume();
    }
};

// ===== Уведомления учителю (через прокси telegram-worker.js) =====
// type: 'start' — ученик начал экзамен, 'leave' — вышел со вкладки, 'result' — итог
function notifyTeacher(type, data) {
    if (!RESULTS_ENDPOINT) return Promise.resolve(false);
    const payload = Object.assign({
        type: type,
        name: localStorage.getItem('studentName') || '',
        teacher: localStorage.getItem('studentTeacher') || ''
    }, data || {});
    return postEvent(payload);
}

function postEvent(payload) {
    try {
        return fetch(RESULTS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).then(r => r.ok).catch(() => false);
    } catch (e) { return Promise.resolve(false); }
}

// Результаты, которые не удалось отправить (нет интернета): отправим при следующем открытии сайта
const PENDING_KEY = 'pendingResults';
function queueResult(payload) {
    const list = safeJSON(PENDING_KEY, []);
    list.push(payload);
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-50))); } catch (e) {}
}
function flushPendingResults() {
    if (!CLOUD.on) return;
    const list = safeJSON(PENDING_KEY, []);
    if (!list.length) return;
    localStorage.removeItem(PENDING_KEY);
    list.forEach(p => postEvent(p).then(ok => { if (!ok) queueResult(p); }));
}

// extra: { leaves, awaySec, autoFinished, durationSec }
function sendResultToTeacher(score, totalQuestions, topicName, extra) {
    extra = extra || {};
    const studentName = localStorage.getItem('studentName') || tr('Неизвестный ученик', 'Белгісіз оқушы');
    const teacherName = localStorage.getItem('studentTeacher') || tr('Без учителя', 'Мұғалімсіз');
    const percent = Math.round((score / totalQuestions) * 100);
    const grade = gradeFor(percent);
    const record = {
        name: studentName, teacher: teacherName, topic: topicName,
        score: score, total: totalQuestions, percent: percent, grade: grade,
        leaves: extra.leaves || 0, awaySec: extra.awaySec || 0,
        autoFinished: !!extra.autoFinished, durationSec: extra.durationSec || 0
    };

    if (CLOUD.on) {
        // Результат уходит в общую базу (и уведомлением в Telegram) — учитель увидит его с любого устройства
        const payload = Object.assign({ type: 'result' }, record);
        postEvent(payload).then(ok => {
            if (!ok) {
                queueResult(payload);
                showToast(tr('Нет связи с сервером: результат сохранён и будет отправлен позже.',
                             'Сервермен байланыс жоқ: нәтиже сақталды, кейін жіберіледі.'), 'error');
            }
        });
    } else {
        // Без сервера — как раньше, в памяти браузера
        const key = 'results_' + teacherName;
        const results = safeJSON(key, []);
        results.push(Object.assign({ date: new Date().toLocaleString('ru-RU') }, record));
        try { localStorage.setItem(key, JSON.stringify(results)); } catch (e) {}
    }

    const cheer = grade >= 4 ? tr('Отлично', 'Жарайсың') : tr('Готово', 'Дайын');
    showToast(tr(
        `${cheer}, ${studentName}! Оценка: ${grade} (${score}/${totalQuestions}). Результат отправлен: ${teacherName}.`,
        `${cheer}, ${studentName}! Баға: ${grade} (${score}/${totalQuestions}). Нәтиже жіберілді: ${teacherName}.`
    ), grade >= 3 ? 'success' : '');
}

const pageHistory = [];

const NO_HISTORY_PAGES = ['login-page', 'home-page']; // эти страницы не пишем в историю

function currentPageId() {
    const cur = document.querySelector('section[style*="display: block"], section[style*="display: flex"]');
    return cur ? cur.id : null;
}

function displayPage(pageId) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(pageId);
    if (!target) return;
    target.style.display = pageId === 'home-page' ? 'flex' : 'block';
    if (pageId !== 'quiz-page') {
        clearInterval(timerInterval);
        if (typeof stopExamGuard === 'function') stopExamGuard();
    }
    if (pageId !== 'teacher-dashboard-page' && typeof teacherRefreshInterval !== 'undefined') {
        clearInterval(teacherRefreshInterval);   // не обновляем таблицу, когда кабинет закрыт
    }
    const backBtn = document.getElementById('back-btn-nav');
    backBtn.style.display = ['home-page', 'login-page'].includes(pageId) ? 'none' : 'flex';
    window.scrollTo(0, 0);
}

function showPage(pageId, force) {
    if (!force && pageId !== 'quiz-page' && examInProgress()) { guardExamExit(() => showPage(pageId, true)); return; }
    const cur = currentPageId();
    if (cur && !NO_HISTORY_PAGES.includes(cur) && cur !== pageId) pageHistory.push(cur);

    displayPage(pageId);
    if (pageId === 'teacher-login-page') {
        document.getElementById('teacher-password-block').style.display = 'flex';
        document.getElementById('teacher-select-block').style.display = 'none';
        document.getElementById('teacher-code-input').value = '';
        document.getElementById('teacher-code-error').style.display = 'none';
    }
}

function goBack(force) {
    if (!force && examInProgress()) { guardExamExit(() => goBack(true)); return; }
    const cur = currentPageId();
    while (cur && pageHistory.length && pageHistory[pageHistory.length - 1] === cur) pageHistory.pop();   // не возвращаемся на ту же страницу
    if (pageHistory.length > 0) displayPage(pageHistory.pop());
    else showPage('home-page', true);
}

function selectBaseSubject(s) { currentBaseSubject = s; showPage('mode-selection'); }

function selectMode(m) {
    currentMode = m;
    if (m === 'prep') { renderTopics(); showPage('topic-selection'); }
    else { renderVariantSelection(); showPage('variant-selection'); }
}

function variantCard(title, desc, onClick, extraClass) {
    const card = document.createElement('div');
    card.className = 'card' + (extraClass ? ' ' + extraClass : '');
    card.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    card.onclick = onClick;
    return card;
}

function teacherVariantCard(v, onClick) {
    const n = variantCount(v);
    const meta = tr(`от ${v.teacher} · ${n} вопр. · ${variantMinutes(v)} мин`,
                    `${v.teacher} · ${n} сұрақ · ${variantMinutes(v)} мин`);
    return variantCard('👩‍🏫 ' + escapeHtml(v.name),
        `<span style="font-size:12px;">${escapeHtml(meta)}</span>`, onClick, 'card-teacher');
}
function variantFitsSubject(v) {
    return !v.subject || v.subject === currentBaseSubject || v.subject === 'custom';
}

// Открыть вариант учителя из общей базы
function openCloudVariant(id) {
    showToast(tr('Загружаю вариант…', 'Нұсқа жүктелуде…'), '');
    cloudVariant(id).then(() => {
        currentSubject = id;
        startQuiz();
    }).catch(e => uiAlert(tr('Не удалось загрузить вариант. ', 'Нұсқаны жүктеу мүмкін болмады. ') + cloudErrorText(e)));
}

let variantRenderToken = 0;
function renderVariantSelection() {
    const container = document.getElementById('variant-cards-container');
    const t = translations[currentLang];
    container.innerHTML = '';
    const token = ++variantRenderToken;

    if (currentBaseSubject === 'math') {
        [1, 2, 3, 4].forEach(n => container.appendChild(
            variantCard(t['var' + n], t['var' + n + '-desc'], () => selectVariant(n))));
    } else if (currentBaseSubject === 'phys') {
        container.appendChild(variantCard(t['var1'], t['var1-desc'], () => { currentSubject = 'phys_v1'; startQuiz(); }));
    }

    // Варианты, сохранённые только в этом браузере (старые)
    const shown = new Set();
    Object.keys(localStorage).filter(k => k.startsWith('teacher_variants_')).forEach(key => {
        safeJSON(key, []).forEach(v => {
            if (!v || !v.id || !variantFitsSubject(v)) return;
            shown.add(v.id);
            container.appendChild(teacherVariantCard(v,
                () => { ALL_ANSWERS[v.id] = hashAnswerMap(v.id, v.answers); currentSubject = v.id; startQuiz(); }));
        });
    });

    // Варианты учителей из общей базы
    if (!CLOUD.on) return;
    const loading = document.createElement('div');
    loading.className = 'variants-loading';
    loading.textContent = tr('⏳ Загружаю варианты учителей…', '⏳ Мұғалімдердің нұсқалары жүктелуде…');
    container.appendChild(loading);
    cloudIndex().then(list => {
        if (token !== variantRenderToken) return;           // страницу уже перерисовали
        loading.remove();
        list.filter(v => v && v.id && !shown.has(v.id) && variantFitsSubject(v))
            .forEach(v => container.appendChild(teacherVariantCard(v, () => openCloudVariant(v.id))));
    }).catch(() => {
        if (token !== variantRenderToken) return;
        loading.textContent = tr('⚠️ Не удалось загрузить варианты учителей. Проверьте интернет.',
                                 '⚠️ Мұғалімдердің нұсқаларын жүктеу мүмкін болмады. Интернетті тексеріңіз.');
    });
}

function selectTopic(n) {
    currentQuestionNum = n;
    if (n >= 1 && n <= 15 && currentMode === 'prep') {
        for (let i = 1; i <= 15; i++) {
            const el = document.getElementById('lesson-' + i);
            if (el) el.style.display = (i === n) ? 'block' : 'none';
        }
        showPage('lesson-page');
    } else {
        showPage('variant-selection');
    }
}

function openFormulas(type) {
    const t = translations[currentLang];
    const title = type === 'short_mult' ? t['form-short'] :
                  type === 'trig'       ? t['form-trig']   :
                  type === 'info'       ? t['form-info']   :
                  type === 'phys'       ? t['form-phys']   : '';
    document.getElementById('modalTitle').innerText = title.replace(/🧮 |📐 |💻 |⚡ /, '');
    document.getElementById('modalBody').innerHTML = getFormulasDB()[type] || '';
    document.getElementById('infoModal').style.display = 'flex';
}
