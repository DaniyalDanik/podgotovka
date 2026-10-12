// Навигация, вход ученика, язык, отправка результата
let currentLang = 'ru', currentBaseSubject = 'math', currentSubject = 'math_v1', currentMode = 'prep', solvedQuestions = {}, currentQuestionNum = 1, timerInterval;

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('lang-' + lang).classList.add('active');
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
    
    renderTopics(); 
    if (document.getElementById('quiz-page').style.display === 'block') updateQuizUI();
    updateLessonContent(lang);
    const tl = translations[lang];
    const tSearch = document.getElementById('t-search-input');
    if (tSearch) tSearch.placeholder = tl['t-search-placeholder'] || '🔍';
    const gradeFilter = document.getElementById('t-grade-filter');
    if (gradeFilter) {
        gradeFilter.options[0].text = tl['t-all-grades'] || 'All';
        gradeFilter.options[1].text = tl['t-grade-5'] || '5';
        gradeFilter.options[2].text = tl['t-grade-4'] || '4';
        gradeFilter.options[3].text = tl['t-grade-3'] || '3';
        gradeFilter.options[4].text = tl['t-grade-2'] || '2';
    }
    const navTeacher = document.querySelector('.nav-links a[onclick*="teacher-login-page"]');
    if (navTeacher) navTeacher.textContent = tl['t-nav-link'] || '👩‍🏫';
}

function renderTopics() {
    const container = document.getElementById('topic-container');
    if(!container) return;
    container.innerHTML = '';
    translations[currentLang]["math-topics"].forEach((topic, index) => {
        const div = document.createElement('div');
        div.className = 'topic-item';
        div.innerHTML = `<div class="topic-num">${index + 1}</div> <div>${topic}</div>`;
        div.onclick = () => selectTopic(index + 1);
        container.appendChild(div);
    });
}

function registerStudent() {
    const nameInput = document.getElementById('studentName').value.trim();
    const teacherInput = document.getElementById('teacherSelect').value;
    
    if (nameInput === "") {
        uiAlert(translations[currentLang]["login-name-required"] || "Пожалуйста, введи своё имя!");
        return;
    }
    if (teacherInput === "") {
        uiAlert("Пожалуйста, выбери учителя!");
        return;
    }
    
    localStorage.setItem('studentName', nameInput);
    localStorage.setItem('studentTeacher', teacherInput);
    localStorage.setItem('loginTime', Date.now().toString());
    showPage('home-page');
    checkExamResume(); 
}

window.onload = function() {
    const savedName = localStorage.getItem('studentName');
    const savedTeacher = localStorage.getItem('studentTeacher');
    const loginTime = localStorage.getItem('loginTime');
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const expired = !loginTime || (Date.now() - parseInt(loginTime)) > TWO_HOURS;

    if (!savedName || !savedTeacher || expired) {
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentTeacher');
        localStorage.removeItem('loginTime');
        showPage('login-page');
    } else {
        showPage('home-page');
        checkExamResume();
    }
};

function sendResultToTeacher(score, totalQuestions, topicName) {
    const studentName = localStorage.getItem('studentName') || 'Неизвестный ученик';
    const teacherName = localStorage.getItem('studentTeacher') || 'Без учителя';
    const percent = Math.round((score / totalQuestions) * 100);
    let grade = 2;
    if (percent >= 85) grade = 5;
    else if (percent >= 65) grade = 4;
    else if (percent >= 40) grade = 3;

    const key = 'results_' + teacherName;
    let results = JSON.parse(localStorage.getItem(key) || '[]');
    results.push({
        name: studentName,
        teacher: teacherName,
        topic: topicName,
        score: score,
        total: totalQuestions,
        percent: percent,
        grade: grade,
        date: new Date().toLocaleString('ru-RU')
    });
    localStorage.setItem(key, JSON.stringify(results));

    // Токен бота здесь больше НЕ хранится. Уведомления уходят на ваш прокси
    // (см. telegram-worker.js), а токен лежит на сервере. Пустая строка = не отправлять.
    if (RESULTS_ENDPOINT) {
        fetch(RESULTS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName, teacher: teacherName, topic: topicName,
                                   score: score, total: totalQuestions, percent: percent, grade: grade })
        }).catch(() => {});
    }

    showToast(`Отлично, ${studentName}! Оценка: ${grade} (${score}/${totalQuestions}). Результат сохранён для ${teacherName}.`, 'success');
}

const pageHistory = [];

const NO_HISTORY_PAGES = ['login-page', 'home-page']; // эти страницы не пишем в историю

function showPage(pageId, force) {
    if (!force && pageId !== 'quiz-page' && examInProgress()) { guardExamExit(() => showPage(pageId, true)); return; }
    const current = document.querySelector('section[style*="display: block"], section[style*="display: flex"]');
    if (current && !NO_HISTORY_PAGES.includes(current.id) && current.id !== pageId) {
        pageHistory.push(current.id);
    }

    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    const target = document.getElementById(pageId);
    if (pageId === 'home-page') target.style.display = 'flex'; else target.style.display = 'block';
    if (pageId !== 'quiz-page') clearInterval(timerInterval);
    if (pageId === 'teacher-login-page') {
        document.getElementById('teacher-password-block').style.display = 'flex';
        document.getElementById('teacher-select-block').style.display = 'none';
        document.getElementById('teacher-code-input').value = '';
        document.getElementById('teacher-code-error').style.display = 'none';
    }
    const backBtn = document.getElementById('back-btn-nav');
    const hideBackOn = ['home-page', 'login-page'];
    backBtn.style.display = hideBackOn.includes(pageId) ? 'none' : 'flex';
}

function goBack(force) {
    if (!force && examInProgress()) { guardExamExit(() => goBack(true)); return; }
    const _cur = document.querySelector('section[style*="display: block"], section[style*="display: flex"]');
    while (_cur && pageHistory.length && pageHistory[pageHistory.length - 1] === _cur.id) pageHistory.pop();   // не возвращаемся на ту же страницу
    if (pageHistory.length > 0) {
        const prev = pageHistory.pop();
        document.querySelectorAll('section').forEach(s => s.style.display = 'none');
        const target = document.getElementById(prev);
        if (!target) return;
        if (prev === 'home-page') target.style.display = 'flex'; else target.style.display = 'block';
        if (prev !== 'quiz-page') clearInterval(timerInterval);
        const backBtn = document.getElementById('back-btn-nav');
        const hideBackOn = ['home-page', 'login-page'];
        backBtn.style.display = hideBackOn.includes(prev) ? 'none' : 'flex';
    } else {
        showPage('home-page', true);
    }
}

function selectBaseSubject(s) { currentBaseSubject = s; showPage('mode-selection'); }

function selectMode(m) { 
    currentMode = m; 
    if (m === 'prep') { renderTopics(); showPage('topic-selection'); } 
    else { renderVariantSelection(); showPage('variant-selection'); }
}

function renderVariantSelection() {
    const container = document.getElementById('variant-cards-container');
    container.innerHTML = '';

    if (currentBaseSubject === 'math') {
        const stdVariants = [
            { num: 1, icon: '📝', label: 'Вариант 1', desc: 'Стандартный набор задач' },
            { num: 2, icon: '🔥', label: 'Вариант 2', desc: 'Новый набор задач' },
            { num: 3, icon: '🔥', label: 'Вариант 3', desc: 'Новый набор задач' },
            { num: 4, icon: '📝', label: 'Вариант 4', desc: 'Новый набор задач' },
        ];
        stdVariants.forEach(v => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${v.icon} ${v.label}</h3><p>${v.desc}</p>`;
            card.onclick = () => selectVariant(v.num);
            container.appendChild(card);
        });
    } else if (currentBaseSubject === 'phys') {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>📝 Вариант 1</h3><p>Стандартный набор задач</p>`;
        card.onclick = () => { currentSubject = 'phys_v1'; startQuiz(); };
        container.appendChild(card);
    }
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('teacher_variants_'));
    allKeys.forEach(key => {
        const variants = safeJSON(key, []);
        variants.forEach(v => {
            if (!v.subject || v.subject === currentBaseSubject || v.subject === 'custom') {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>👩‍🏫 ${escapeHtml(v.name)}</h3>
                    <p style="color:#C084FC;font-size:12px;">от ${escapeHtml(v.teacher)}</p>
                `;
                card.onclick = () => {
                    ALL_ANSWERS[v.id] = hashAnswerMap(v.id, v.answers);
                    currentSubject = v.id;
                    startQuiz();
                };
                container.appendChild(card);
            }
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
    let title = type === 'short_mult' ? t["form-short"] :
                type === 'trig'       ? t["form-trig"]   :
                type === 'info'       ? t["form-info"]   :
                type === 'phys'       ? t["form-phys"]   : '';
    document.getElementById('modalTitle').innerText = title.replace(/🧮 |📐 |💻 |⚡ /, '');
    document.getElementById('modalBody').innerHTML = getFormulasDB()[type] || '';
    document.getElementById('infoModal').style.display = 'flex';
}
