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
    if (!RESULTS_ENDPOINT) return;
    const payload = Object.assign({
        type: type,
        name: localStorage.getItem('studentName') || '',
        teacher: localStorage.getItem('studentTeacher') || ''
    }, data || {});
    try {
        fetch(RESULTS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(() => {});
    } catch (e) {}
}

// extra: { leaves, awaySec, autoFinished, durationSec, variantId }
function sendResultToTeacher(score, totalQuestions, topicName, extra) {
    extra = extra || {};
    const studentName = localStorage.getItem('studentName') || tr('Неизвестный ученик', 'Белгісіз оқушы');
    const teacherName = localStorage.getItem('studentTeacher') || tr('Без учителя', 'Мұғалімсіз');
    const percent = Math.round((score / totalQuestions) * 100);
    const grade = gradeFor(percent);

    const key = 'results_' + teacherName;
    const results = safeJSON(key, []);
    results.push({
        name: studentName,
        teacher: teacherName,
        topic: topicName,
        score: score,
        total: totalQuestions,
        percent: percent,
        grade: grade,
        leaves: extra.leaves || 0,
        awaySec: extra.awaySec || 0,
        autoFinished: !!extra.autoFinished,
        durationSec: extra.durationSec || 0,
        date: new Date().toLocaleString('ru-RU')
    });
    try { localStorage.setItem(key, JSON.stringify(results)); } catch (e) {}

    // Токен бота здесь НЕ хранится: уведомление уходит на ваш прокси (telegram-worker.js)
    notifyTeacher('result', {
        topic: topicName, score: score, total: totalQuestions, percent: percent, grade: grade,
        leaves: extra.leaves || 0, awaySec: extra.awaySec || 0,
        autoFinished: !!extra.autoFinished, durationSec: extra.durationSec || 0
    });

    const cheer = grade >= 4 ? tr('Отлично', 'Жарайсың') : tr('Готово', 'Дайын');
    showToast(tr(
        `${cheer}, ${studentName}! Оценка: ${grade} (${score}/${totalQuestions}). Результат сохранён для: ${teacherName}.`,
        `${cheer}, ${studentName}! Баға: ${grade} (${score}/${totalQuestions}). Нәтиже сақталды: ${teacherName}.`
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

function renderVariantSelection() {
    const container = document.getElementById('variant-cards-container');
    const t = translations[currentLang];
    container.innerHTML = '';

    if (currentBaseSubject === 'math') {
        [1, 2, 3, 4].forEach(n => container.appendChild(
            variantCard(t['var' + n], t['var' + n + '-desc'], () => selectVariant(n))));
    } else if (currentBaseSubject === 'phys') {
        container.appendChild(variantCard(t['var1'], t['var1-desc'], () => { currentSubject = 'phys_v1'; startQuiz(); }));
    }
    Object.keys(localStorage).filter(k => k.startsWith('teacher_variants_')).forEach(key => {
        safeJSON(key, []).forEach(v => {
            if (!v || !v.id) return;
            if (v.subject && v.subject !== currentBaseSubject && v.subject !== 'custom') return;
            const n = variantCount(v);
            const meta = tr(`от ${v.teacher} · ${n} вопр. · ${variantMinutes(v)} мин`,
                            `${v.teacher} · ${n} сұрақ · ${variantMinutes(v)} мин`);
            container.appendChild(variantCard(
                '👩‍🏫 ' + escapeHtml(v.name),
                `<span style="font-size:12px;">${escapeHtml(meta)}</span>`,
                () => { ALL_ANSWERS[v.id] = hashAnswerMap(v.id, v.answers); currentSubject = v.id; startQuiz(); },
                'card-teacher'));
        });
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
