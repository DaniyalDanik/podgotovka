// Квиз и экзамен: вопросы, проверка, таймер, итог, сохранение прогресса
function selectVariant(v) { currentSubject = currentBaseSubject + '_v' + v; startQuiz(); }

// ===== Параметры текущего варианта =====
function isCustomSubject(id) { return String(id || '').startsWith('custom_'); }
function currentVariant() { return isCustomSubject(currentSubject) ? findVariantById(currentSubject) : null; }
function variantCount(v) { return v && v.count ? Number(v.count) : 15; }
function variantMinutes(v) { return v && v.timeMin ? Number(v.timeMin) : Math.round(EXAM_MS / 60000); }
function qTotal() { return variantCount(currentVariant()); }
function variantTitle() {
    const v = currentVariant();
    if (v) return v.name;
    const m = String(currentSubject).match(/^(math|phys)_v(\d+)$/);
    if (m) return (m[1] === 'math' ? tr('Математика', 'Математика') : tr('Физика', 'Физика')) + ', ' + tr('вариант', 'нұсқа') + ' ' + m[2];
    return currentSubject;
}

// Вопрос авторского варианта: { type: 'test'|'open', text, options: {A..E} }
function customQuestion(v, num) {
    if (!v) return null;
    const q = (v.questions && v.questions[num]) || {};
    let type = q.type || (v.questionTypes && v.questionTypes[num]);
    if (!type) {
        const has = ALL_ANSWERS[v.id] && ALL_ANSWERS[v.id][num];
        type = has ? (revealTestAnswer(v.id, num) ? 'test' : 'open') : (num > 10 ? 'open' : 'test');
    }
    return { type: type, text: q.text || '', options: q.options || {} };
}

function startQuiz(resume) {
    quizFinished = false;
    ensureAnswersLoaded(currentSubject);
    const isTest = currentMode === 'test';
    const st = isTest ? (resume || loadExamState()) : null;
    const continuing = isTest && st && st.subject === currentSubject && st.endsAt > Date.now();

    if (isTest && !continuing) {
        // Новый экзамен: сначала правила, потом старт (клик по «Начать» нужен и для полноэкранного режима)
        const s = strictSettings();
        const mins = variantMinutes(currentVariant());
        const n = qTotal();
        const rules = s.enabled
            ? tr(`🔒 Строгий режим экзамена\n\n• Экзамен откроется на весь экран.\n• Нельзя переключаться на другие вкладки и приложения — каждый выход фиксируется, учитель его увидит.\n• После ${s.maxLeaves} выходов экзамен завершится автоматически.\n• Время: ${mins} мин, вопросов: ${n}. На каждый вопрос — одна попытка.\n\nГотов(а)?`,
                 `🔒 Емтиханның қатаң режимі\n\n• Емтихан толық экранда ашылады.\n• Басқа қойындыларға және қосымшаларға ауысуға болмайды — әр шығу тіркеледі, мұғалім оны көреді.\n• ${s.maxLeaves} рет шыққаннан кейін емтихан автоматты түрде аяқталады.\n• Уақыт: ${mins} мин, сұрақтар: ${n}. Әр сұраққа — бір мүмкіндік.\n\nДайынсың ба?`)
            : tr(`⏱ Экзамен\n\nВремя: ${mins} мин, вопросов: ${n}. На каждый вопрос — одна попытка.\n\nНачать?`,
                 `⏱ Емтихан\n\nУақыт: ${mins} мин, сұрақтар: ${n}. Әр сұраққа — бір мүмкіндік.\n\nБастаймыз ба?`);
        uiConfirm(rules, tr('Начать', 'Бастау'), tr('Отмена', 'Бас тарту')).then(ok => {
            if (!ok) return;
            solvedQuestions = {};
            examEndsAt = Date.now() + mins * 60000;
            currentQuestionNum = 1;
            openQuizPage(true, { leaves: 0, awaySec: 0, startedAt: Date.now() });
            if (s.notifyStart) notifyTeacher('start', { topic: variantTitle(), total: n, minutes: mins });
        });
        return;
    }

    if (continuing) {
        // продолжаем начатый экзамен: ответы и таймер на месте
        solvedQuestions = st.solved || {}; examEndsAt = st.endsAt; currentQuestionNum = st.q || 1;
    } else {
        solvedQuestions = {};
        currentQuestionNum = 1;
    }
    openQuizPage(isTest, st);
    // Перезагрузка страницы посреди строгого экзамена засчитывается как выход
    if (isTest && resume) registerLeave('reload');
}

function openQuizPage(isTest, guardState) {
    showPage('quiz-page');
    document.getElementById('finish-btn').style.display = isTest ? 'block' : 'none';
    updateQuizUI();
    const timerEl = document.getElementById('timer-display');
    if (isTest) {
        timerEl.style.display = 'block';
        startTimer(examEndsAt);
        startExamGuard(guardState);
        saveExamState();
    } else {
        timerEl.style.display = 'none';
    }
}

function updateQuizUI() {
    const rawTitle = translations[currentLang][currentBaseSubject] || currentBaseSubject;
    const titleText = rawTitle.replace(/^[^\w\sа-яА-ЯёЁӘәҒғҚқҢңӨөҰұҮүҺһіІ]*/, '').trim();
    const v = currentVariant();
    let title = titleText;
    if (v) title = v.name;
    else if (currentSubject && currentSubject.includes('_v')) title = `${titleText} (${tr('вариант', 'нұсқа')} ${currentSubject.split('_v')[1]})`;
    document.getElementById('quiz-title').innerText = title;
    showQuestion(Math.min(currentQuestionNum, qTotal()));
}

function questionPlaceholder(icon, text, sub) {
    return `<div class="q-placeholder">${icon} ${text}${sub ? `<br><span>${sub}</span>` : ''}</div>`;
}

function showQuestion(num) {
    currentQuestionNum = num;
    const total = qTotal();
    const t = translations[currentLang];
    document.getElementById('q-title').innerText = `№${num} ${t['q-header']} · ${num} ${t['q-of']} ${total}`;
    document.getElementById('current-question-view').style.display = 'block';

    const v = currentVariant();
    const content = document.getElementById('q-content');
    let isOpenQuestion = num > 10;          // встроенные варианты: 11–15 — открытые
    let optionTexts = {};

    if (isCustomSubject(currentSubject)) {
        const q = customQuestion(v, num);
        isOpenQuestion = q ? q.type === 'open' : isOpenQuestion;
        optionTexts = q ? q.options : {};
        let html = '';
        if (q && q.text) html += `<div class="q-text">${escapeHtml(q.text).replace(/\n/g, '<br>')}</div>`;
        const img = v && v.imagePrefix ? localStorage.getItem('img_' + v.imagePrefix + num) : null;
        if (img && /^data:image\//.test(img)) html += `<img src="${img}" alt="№${num}" draggable="false">`;
        if (!html) html = questionPlaceholder('📝', tr('Вопрос', 'Сұрақ') + ' №' + num,
            v ? '' : tr('Вариант не найден на этом устройстве', 'Нұсқа бұл құрылғыда табылмады'));
        content.innerHTML = html;
    } else {
        const prefix = currentSubject === 'math_v4' ? 'qqqq' : currentSubject === 'math_v2' ? 'qqq' : currentSubject === 'math_v3' ? 'qqqthird' : currentSubject === 'phys_v1' ? 'qq' : 'q';
        content.innerHTML = `<img src="${prefix}${num}.png" alt="${t['q-header']} №${num}" draggable="false">`;
    }

    document.getElementById('prev-btn').disabled = (num === 1);
    document.getElementById('next-btn').disabled = (num === total);

    const optionsDiv = document.getElementById('options-btns');
    optionsDiv.innerHTML = '';

    const answered = !!solvedQuestions[num];
    // В экзамене ответ даётся один раз; после завершения всё заблокировано
    const locked = quizFinished || (currentMode === 'test' && answered);
    const withText = ['A', 'B', 'C', 'D', 'E'].some(L => optionTexts[L]);
    optionsDiv.classList.toggle('options-list', !isOpenQuestion && withText);

    if (!isOpenQuestion) {
        const rightOpt = answered ? revealTestAnswer(currentSubject, num) : null;
        ['A', 'B', 'C', 'D', 'E'].forEach(opt => {
            if (withText && !optionTexts[opt]) return;          // пустые варианты не показываем
            const btn = document.createElement('button');
            let btnClass = 'btn-option' + (withText ? ' btn-option-wide' : '');
            if (answered) {
                if (opt === rightOpt) btnClass += ' opt-correct';
                else if (solvedQuestions[num] === 'wrong' && opt === solvedQuestions[num + '_choice']) btnClass += ' opt-wrong';
            }
            btn.className = btnClass;
            if (withText) btn.innerHTML = `<b>${opt}</b><span>${escapeHtml(optionTexts[opt])}</span>`;
            else btn.innerText = opt;
            if (locked) btn.disabled = true; else btn.onclick = () => checkAnswer(opt, num, btn);
            optionsDiv.appendChild(btn);
        });
    } else {
        const prev = answered ? escapeHtml(solvedQuestions[num + '_choice'] || '') : '';
        optionsDiv.innerHTML = `
            <input type="text" id="text-ans" class="q-answer-input" autocomplete="off" placeholder="${escapeHtml(t['placeholder'])}" value="${prev}" ${locked ? 'readonly' : ''} onkeydown="if(event.key==='Enter'){checkAnswer(this.value, ${num})}">
            ${locked ? '' : `<button class="btn" style="background:var(--primary-blue); margin-top:10px; width:100%;" onclick="checkAnswer(document.getElementById('text-ans').value, ${num})">${t['check']}</button>`}
        `;
    }
    createGrid();
    // «Помощь с темой» — только в подготовке и только для встроенных вариантов
    document.getElementById('help-btn').style.display = (currentMode === 'prep' && !isCustomSubject(currentSubject)) ? 'block' : 'none';
    saveExamState();
}

function createGrid() {
    const grid = document.getElementById('question-grid'); grid.innerHTML = '';
    for (let i = 1; i <= qTotal(); i++) {
        const div = document.createElement('div');
        div.className = 'grid-item' + (solvedQuestions[i] ? ' ' + solvedQuestions[i] : '') + (i === currentQuestionNum ? ' active-task' : '');
        div.innerText = i;
        div.onclick = () => showQuestion(i);
        grid.appendChild(div);
    }
}

function answeredCount() {
    let c = 0;
    for (let i = 1; i <= qTotal(); i++) if (solvedQuestions[i]) c++;
    return c;
}

function checkAnswer(userAns, q_num, btnElement) {
    if (quizFinished) return;
    if (currentMode === 'test' && solvedQuestions[q_num]) return;      // в экзамене ответ один
    const inputVal = String(userAns).toUpperCase().trim();
    if (inputVal === '') { showToast(tr('Введите ответ', 'Жауапты енгізіңіз'), 'error'); return; }

    if (isCorrectAnswer(currentSubject, q_num, inputVal)) {
        solvedQuestions[q_num] = 'correct';
        solvedQuestions[q_num + '_choice'] = inputVal;
    } else if (currentMode === 'test') {
        solvedQuestions[q_num] = 'wrong';
        solvedQuestions[q_num + '_choice'] = inputVal;
    } else {
        // режим подготовки: можно пробовать снова
        if (btnElement) {
            btnElement.classList.add('opt-wrong');
            setTimeout(() => btnElement.classList.remove('opt-wrong'), 800);
        }
        showToast(translations[currentLang]['try-again'], 'error');
        return;
    }
    saveExamState();
    showQuestion(q_num);                                               // перерисовка: подсветка и блокировка

    if (currentMode === 'test') {
        if (answeredCount() === qTotal()) setTimeout(finishQuiz, 500);
        else if (q_num < qTotal()) setTimeout(() => { if (!quizFinished && currentQuestionNum === q_num) showQuestion(q_num + 1); }, 600);
    }
}

// opts: { autoFinished: true, reason: '...' }
function finishQuiz(opts) {
    if (quizFinished) return;          // защита от повторной отправки результата
    opts = opts || {};
    quizFinished = true;
    clearInterval(timerInterval);
    const total = qTotal();
    const guard = examGuardSnapshot();
    stopExamGuard();

    let correctCount = 0;
    for (let i = 1; i <= total; i++) if (solvedQuestions[i] === 'correct') correctCount++;
    const percent = Math.round((correctCount / total) * 100);
    const grade = gradeFor(percent);

    const gradeColors = { 5: '#10B981', 4: '#A855F7', 3: '#F59E0B', 2: '#F43F5E' };
    const gradeEmoji  = { 5: '🏆', 4: '🎯', 3: '📚', 2: '💪' };

    let rows = '';
    for (let i = 1; i <= total; i++) {
        const correct = escapeHtml(revealTestAnswer(currentSubject, i) || (solvedQuestions[i] === 'correct' ? solvedQuestions[i + '_choice'] : '—'));
        const userAns = escapeHtml(solvedQuestions[i + '_choice'] || '—');
        const status  = solvedQuestions[i];
        let badge, ansCell;
        if (status === 'correct') {
            badge = `<span class="ans-badge-c">✓ ${tr('Верно', 'Дұрыс')}</span>`;
            ansCell = `<span class="ans-correct">${userAns}</span>`;
        } else if (status === 'wrong') {
            badge = `<span class="ans-badge-w">✗ ${tr('Ошибка', 'Қате')}</span>`;
            ansCell = `<span class="ans-wrong">${userAns}</span>`;
        } else {
            badge = `<span class="ans-badge-s">— ${tr('Пропущен', 'Өткізілді')}</span>`;
            ansCell = `<span class="ans-skip">—</span>`;
        }
        rows += `<tr>
            <td style="font-weight:800;color:#C084FC;">№${i}</td>
            <td>${ansCell}</td>
            <td style="color:#6EE7B7;font-weight:800;">${correct}</td>
            <td>${badge}</td>
        </tr>`;
    }

    const sep = '<div class="result-sep"></div>';
    let notice = '';
    if (opts.autoFinished) {
        notice = `<div class="result-notice">⛔ ${escapeHtml(opts.reason || tr('Экзамен завершён автоматически.', 'Емтихан автоматты түрде аяқталды.'))}</div>`;
    }
    if (guard.strict) {
        notice += `<div class="result-leaves">${guard.leaves ? '⚠️' : '✅'} ${tr('Выходов из экзамена', 'Емтиханнан шығу саны')}: <b>${guard.leaves}</b>${guard.awaySec ? ' · ' + tr('вне вкладки', 'қойындыдан тыс') + ': ' + fmtDuration(guard.awaySec) : ''}</div>`;
    }

    document.getElementById('modalTitle').innerHTML = `
        <div class="result-kicker">${tr('Результат теста', 'Тест нәтижесі')}</div>
        <div class="result-score-big">${correctCount}<span style="font-size:30px;opacity:0.5">/${total}</span></div>
        <div class="result-grade-row">
            <div class="result-stat">
                <div class="result-stat-num" style="color:${gradeColors[grade]}">${gradeEmoji[grade]} ${grade}</div>
                <div class="result-stat-lbl">${tr('Оценка', 'Баға')}</div>
            </div>${sep}
            <div class="result-stat">
                <div class="result-stat-num" style="color:#A855F7">${percent}%</div>
                <div class="result-stat-lbl">${tr('Баллов', 'Ұпай')}</div>
            </div>${sep}
            <div class="result-stat">
                <div class="result-stat-num" style="color:#10B981">${correctCount}</div>
                <div class="result-stat-lbl">${tr('Правильно', 'Дұрыс')}</div>
            </div>${sep}
            <div class="result-stat">
                <div class="result-stat-num" style="color:#F43F5E">${total - correctCount}</div>
                <div class="result-stat-lbl">${tr('Ошибок', 'Қате')}</div>
            </div>
        </div>
        ${notice}
    `;
    document.getElementById('modalBody').innerHTML = `
        <div class="result-kicker" style="margin-bottom:12px;">${tr('Разбор ответов', 'Жауаптарды талдау')}</div>
        <div style="overflow-x:auto;">
        <table class="answers-review">
            <thead><tr>
                <th>№</th>
                <th>${tr('Твой ответ', 'Сенің жауабың')}</th>
                <th>${tr('Верный ответ', 'Дұрыс жауап')}</th>
                <th>${tr('Результат', 'Нәтиже')}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        </div>
    `;
    document.getElementById('infoModal').style.display = 'flex';
    clearExamState();
    if (currentMode === 'test') {
        sendResultToTeacher(correctCount, total, variantTitle(), {
            leaves: guard.leaves, awaySec: guard.awaySec, autoFinished: !!opts.autoFinished,
            durationSec: guard.startedAt ? Math.round((Date.now() - guard.startedAt) / 1000) : 0
        });
    }
    updateQuizUI();          // заблокировать кнопки на текущем вопросе
}

function fmtDuration(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m ? `${m} ${tr('мин', 'мин')} ${s} ${tr('с', 'с')}` : `${s} ${tr('с', 'с')}`;
}

// Таймер считает от времени окончания, поэтому перезагрузка страницы его не сбрасывает
function startTimer(endTs) {
    clearInterval(timerInterval);
    const el = document.getElementById('timer-display');
    const tick = () => {
        const left = Math.max(0, Math.round((endTs - Date.now()) / 1000));
        const m = Math.floor(left / 60), s = left % 60;
        el.textContent = `${m}:${s < 10 ? '0' + s : s}`;
        el.classList.toggle('timer-low', left > 0 && left <= 300);
        if (left <= 0) { clearInterval(timerInterval); finishQuiz({ autoFinished: true, reason: tr('Время вышло.', 'Уақыт бітті.') }); }
    };
    tick();
    timerInterval = setInterval(tick, 1000);
}

function showTheory(topicNum) {
    const t = translations[currentLang];
    let theoryContent = THEORY_DB[currentLang][topicNum];
    if (!theoryContent) {
        theoryContent = `<p style="color: var(--text-gray);">${tr('Теория для этой темы ещё не добавлена. Но скоро появится!', 'Бұл тақырыптың теориясы әлі қосылмаған. Бірақ жақында міндетті түрде болады!')}</p>`;
    }
    document.getElementById('modalTitle').innerText = t['help-btn'].replace('📚 ', '');
    document.getElementById('modalBody').innerHTML = theoryContent;
    document.getElementById('infoModal').style.display = 'flex';
}

function navQuestion(step) { const next = currentQuestionNum + step; if (next >= 1 && next <= qTotal()) showQuestion(next); }

function closeModal() { document.getElementById('infoModal').style.display = 'none'; }

// ===== Состояние экзамена: один ответ, защита от повторной отправки, сохранение прогресса =====
let quizFinished = false;
let examEndsAt = 0;
const EXAM_STATE_KEY = 'examState';

function saveExamState() {
    if (currentMode !== 'test' || quizFinished || !examEndsAt) return;
    const g = examGuardSnapshot();
    try {
        localStorage.setItem(EXAM_STATE_KEY, JSON.stringify({
            student: localStorage.getItem('studentName') || '',
            subject: currentSubject, base: currentBaseSubject,
            solved: solvedQuestions, endsAt: examEndsAt, q: currentQuestionNum,
            leaves: g.leaves, awaySec: g.awaySec, startedAt: g.startedAt
        }));
    } catch (e) {}
}
function clearExamState() { localStorage.removeItem(EXAM_STATE_KEY); }
function loadExamState() {
    const st = safeJSON(EXAM_STATE_KEY, null);
    if (!st || !st.subject || !st.endsAt) return null;
    if (st.student !== (localStorage.getItem('studentName') || '')) return null;
    return st;
}
// Если страницу перезагрузили посреди экзамена — предлагаем продолжить
function checkExamResume() {
    const st = loadExamState();
    if (!st) return;
    const apply = () => {
        currentBaseSubject = st.base || 'math'; currentSubject = st.subject; currentMode = 'test';
        ensureAnswersLoaded(st.subject);
    };
    if (st.endsAt <= Date.now()) {            // время вышло, пока страница была закрыта
        apply();
        solvedQuestions = st.solved || {}; examEndsAt = st.endsAt; quizFinished = false;
        restoreExamGuard(st);
        showPage('quiz-page', true);
        finishQuiz({ autoFinished: true, reason: tr('Время вышло, пока страница была закрыта.', 'Бет жабық тұрғанда уақыт бітті.') });
        return;
    }
    const mins = Math.max(1, Math.ceil((st.endsAt - Date.now()) / 60000));
    uiConfirm(
        tr('У вас есть незавершённый экзамен. Осталось примерно ' + mins + ' мин. Продолжить?',
           'Аяқталмаған емтихан бар. Шамамен ' + mins + ' мин қалды. Жалғастырасыз ба?'),
        tr('Продолжить', 'Жалғастыру'), tr('Завершить экзамен', 'Емтиханды аяқтау')
    ).then(ok => {
        apply();
        if (ok) { startQuiz(st); return; }
        // Отказ = сдать то, что уже решено (иначе можно было бы «сбросить» неудачную попытку)
        solvedQuestions = st.solved || {}; examEndsAt = st.endsAt; quizFinished = false;
        restoreExamGuard(st);
        showPage('quiz-page', true);
        finishQuiz({ autoFinished: true, reason: tr('Экзамен завершён учеником после перезагрузки.', 'Оқушы бетті қайта жүктегеннен кейін емтиханды аяқтады.') });
    });
}
function confirmFinish() {
    const answered = answeredCount();
    const total = qTotal();
    uiConfirm(
        tr('Вы ответили на ' + answered + ' из ' + total + ' вопросов. Завершить экзамен?',
           total + ' сұрақтың ' + answered + '-іне жауап бердіңіз. Емтиханды аяқтайсыз ба?'),
        tr('Завершить', 'Аяқтау'), tr('Вернуться', 'Қайту')
    ).then(ok => { if (ok) finishQuiz(); });
}

// ===== Защита от случайного выхода из экзамена =====
function examInProgress() {
    const page = document.getElementById('quiz-page');
    return currentMode === 'test' && !quizFinished && examEndsAt > Date.now() && !!page && page.style.display === 'block';
}
function guardExamExit(proceed) {
    if (!examInProgress()) { proceed(); return; }
    const s = strictSettings();
    const msg = s.enabled
        ? tr('Вы уходите с экзамена. Это засчитается как выход (учитель увидит). Время продолжит идти, ответы сохранятся. Выйти?',
             'Сіз емтиханнан шығып барасыз. Бұл шығу ретінде есептеледі (мұғалім көреді). Уақыт жүре береді, жауаптар сақталады. Шығасыз ба?')
        : tr('Вы уходите с экзамена. Время продолжит идти, а ваши ответы сохранятся: чтобы вернуться, выберите тот же вариант в разделе «Экзамен». Выйти?',
             'Сіз емтиханнан шығып барасыз. Уақыт жүре береді, жауаптарыңыз сақталады: оралу үшін «Емтихан» бөлімінде сол нұсқаны таңдаңыз. Шығасыз ба?');
    uiConfirm(msg, tr('Выйти', 'Шығу'), tr('Остаться', 'Қалу')).then(ok => {
        if (!ok) return;
        if (s.enabled) registerLeave('exit');
        if (!quizFinished) proceed();
    });
}
// Закрытие вкладки / обновление страницы во время экзамена
window.addEventListener('beforeunload', e => {
    if (examInProgress()) { saveExamState(); e.preventDefault(); e.returnValue = ''; }
});
