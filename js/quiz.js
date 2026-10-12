// Квиз и экзамен: вопросы, проверка, таймер, итог, сохранение прогресса
function selectVariant(v) { currentSubject = currentBaseSubject + '_v' + v; startQuiz(); }

function startQuiz(resume) {
    quizFinished = false;
    ensureAnswersLoaded(currentSubject);
    const isTest = currentMode === 'test';
    const st = isTest ? (resume || loadExamState()) : null;
    if (isTest && st && st.subject === currentSubject && st.endsAt > Date.now()) {
        // продолжаем начатый экзамен: ответы и таймер на месте
        solvedQuestions = st.solved || {}; examEndsAt = st.endsAt; currentQuestionNum = st.q || 1;
    } else {
        solvedQuestions = {};
        if (isTest) { examEndsAt = Date.now() + EXAM_MS; currentQuestionNum = 1; }
    }
    showPage('quiz-page');
    document.getElementById('finish-btn').style.display = isTest ? 'block' : 'none';
    updateQuizUI();
    const timerEl = document.getElementById('timer-display');
    if (isTest) { timerEl.style.display = 'block'; startTimer(examEndsAt); saveExamState(); }
    else { timerEl.style.display = 'none'; }
}

function updateQuizUI() {
    let rawTitle = translations[currentLang][currentBaseSubject] || currentBaseSubject;
    let titleText = rawTitle.replace(/^[^\w\sа-яА-ЯёЁӘәҒғҚқҢңӨөҰұҮүҺһіІ]*/, '').trim();

    let variantLabel = '';

    if (currentSubject && currentSubject.includes('_v')) {
        variantLabel = currentSubject.split('_v')[1];
    } else if (currentSubject && currentSubject.startsWith('custom_')) {
        variantLabel = 'Авторский вариант';
    }

    document.getElementById('quiz-title').innerText =
        variantLabel ? `${titleText} (${variantLabel})` : titleText;

    showQuestion(currentQuestionNum);
}

function showQuestion(num) {
    currentQuestionNum = num;
    const t = translations[currentLang];
    document.getElementById('q-title').innerText = `№${num} ${t["q-header"]}`;
    document.getElementById('current-question-view').style.display = 'block';

    const isCustom = currentSubject.startsWith('custom_');
    const variant = isCustom ? findVariantById(currentSubject) : null;   // ищем по всем учителям, не только по текущему

    if (isCustom) {
        if (variant && variant.imagePrefix) {
            const storedImg = localStorage.getItem('img_' + variant.imagePrefix + num);
            if (storedImg) {
                document.getElementById('q-content').innerHTML = `<img src="${escapeHtml(storedImg)}" alt="Task №${num}">`;
            } else {
                document.getElementById('q-content').innerHTML = `<div style="padding:40px; text-align:center; color:#C084FC; font-size:15px; background:rgba(168,85,247,0.1); border-radius:14px;">🖼 Изображение вопроса №${num}<br><span style="font-size:12px; opacity:0.7;">Учитель не загрузил картинку для этого вопроса</span></div>`;
            }
        } else {
            document.getElementById('q-content').innerHTML = `<div style="padding:40px; text-align:center; color:#C084FC; font-size:15px; background:rgba(168,85,247,0.1); border-radius:14px;">📝 Вопрос №${num}</div>`;
        }
    } else {
        let prefix = currentSubject === 'math_v4' ? 'qqqq' : currentSubject === 'math_v2' ? 'qqq' : currentSubject === 'math_v3' ? 'qqqthird' : currentSubject === 'phys_v1' ? 'qq' : 'q';
        document.getElementById('q-content').innerHTML = `<img src="${prefix}${num}.png" alt="Task">`;
    }

    document.getElementById('prev-btn').disabled = (num === 1);
    document.getElementById('next-btn').disabled = (num === 15);

    const optionsDiv = document.getElementById('options-btns');
    optionsDiv.innerHTML = '';

    let isOpenQuestion = (num > 10);                       // по умолчанию 11-15 — открытые
    if (isCustom) {
        if (variant && variant.questionTypes) {
            isOpenQuestion = (variant.questionTypes[num] === 'open');
        } else {
            const _has = ALL_ANSWERS[currentSubject] && ALL_ANSWERS[currentSubject][num];
            isOpenQuestion = _has ? !revealTestAnswer(currentSubject, num) : (num > 10);
        }
    }

    const answered = !!solvedQuestions[num];
    // В экзамене ответ даётся один раз; после завершения всё заблокировано
    const locked = quizFinished || (currentMode === 'test' && answered);

    if (!isOpenQuestion) {
        const rightOpt = answered ? revealTestAnswer(currentSubject, num) : null;
        ['A', 'B', 'C', 'D', 'E'].forEach(opt => {
            const btn = document.createElement('button');
            let btnClass = 'btn-option';
            if (answered) {
                if (opt === rightOpt) btnClass += ' opt-correct';
                else if (solvedQuestions[num] === 'wrong' && opt === solvedQuestions[num + '_choice']) btnClass += ' opt-wrong';
            }
            btn.className = btnClass;
            btn.innerText = opt;
            if (locked) btn.disabled = true; else btn.onclick = () => checkAnswer(opt, num, btn);
            optionsDiv.appendChild(btn);
        });
    } else {
        const prev = answered ? escapeHtml(solvedQuestions[num + '_choice'] || '') : '';
        optionsDiv.innerHTML = `
            <input type="text" id="text-ans" placeholder="${t['placeholder']}" style="padding:15px; border-radius:10px; border:2px solid rgba(168,85,247,0.3); width:100%; background:rgba(168,85,247,0.08); color:#E9D5FF; font-family:inherit; font-size:15px; outline:none;" value="${prev}" ${locked ? 'readonly' : ''} onkeydown="if(event.key==='Enter'){checkAnswer(this.value, ${num})}">
            ${locked ? '' : `<button class="btn" style="background:var(--primary-blue); margin-top:10px; width:100%;" onclick="checkAnswer(document.getElementById('text-ans').value, ${num})">${t['check']}</button>`}
        `;
    }
    createGrid();
    document.getElementById('help-btn').style.display = (currentMode === 'prep' ? 'block' : 'none');
    saveExamState();
}

function createGrid() {
    const grid = document.getElementById('question-grid'); grid.innerHTML = '';
    for (let i = 1; i <= 15; i++) {
        const div = document.createElement('div');
        div.className = 'grid-item' + (solvedQuestions[i] ? ' ' + solvedQuestions[i] : '') + (i === currentQuestionNum ? ' active-task' : '');
        div.innerText = i;
        div.onclick = () => showQuestion(i);
        grid.appendChild(div);
    }
}

function checkAnswer(userAns, q_num, btnElement) {
    if (quizFinished) return;
    if (currentMode === 'test' && solvedQuestions[q_num]) return;      // в экзамене ответ один
    const inputVal = userAns.toString().toUpperCase().trim();
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
        showToast(translations[currentLang]["try-again"], 'error');
        return;
    }
    saveExamState();
    showQuestion(q_num);                                               // перерисовка: подсветка и блокировка

    if (currentMode === 'test') {
        let answeredCount = 0;
        for (let i = 1; i <= 15; i++) { if (solvedQuestions[i]) answeredCount++; }
        if (answeredCount === 15) setTimeout(finishQuiz, 500);
    }
}

function finishQuiz() {
    if (quizFinished) return;          // защита от повторной отправки результата
    quizFinished = true;
    clearInterval(timerInterval);
    let correctCount = 0;
    for (let i = 1; i <= 15; i++) {
        if (solvedQuestions[i] === 'correct') correctCount++;
    }
    let percent = Math.round((correctCount / 15) * 100);
    let grade = 2;
    if (percent >= 85) grade = 5;
    else if (percent >= 65) grade = 4;
    else if (percent >= 40) grade = 3;

    const gradeColors = { 5: '#10B981', 4: '#A855F7', 3: '#F59E0B', 2: '#F43F5E' };
    const gradeEmoji  = { 5: '🏆', 4: '🎯', 3: '📚', 2: '💪' };

    let rows = '';
    for (let i = 1; i <= 15; i++) {
        const correct = escapeHtml(revealTestAnswer(currentSubject, i) || (solvedQuestions[i] === 'correct' ? solvedQuestions[i + '_choice'] : '—'));
        const userAns = escapeHtml(solvedQuestions[i + '_choice'] || '—');
        const status  = solvedQuestions[i];
        let badge, ansCell;
        if (status === 'correct') {
            badge = `<span class="ans-badge-c">✓ Верно</span>`;
            ansCell = `<span class="ans-correct">${userAns}</span>`;
        } else if (status === 'wrong') {
            badge = `<span class="ans-badge-w">✗ Ошибка</span>`;
            ansCell = `<span class="ans-wrong">${userAns}</span>`;
        } else {
            badge = `<span class="ans-badge-s">— Пропущен</span>`;
            ansCell = `<span class="ans-skip">—</span>`;
        }
        rows += `<tr>
            <td style="font-weight:800;color:#C084FC;">№${i}</td>
            <td>${ansCell}</td>
            <td style="color:#6EE7B7;font-weight:800;">${correct}</td>
            <td>${badge}</td>
        </tr>`;
    }

    document.getElementById('modalTitle').innerHTML = `
        <div style="font-size:14px;color:#C084FC;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Результат теста</div>
        <div class="result-score-big">${correctCount}<span style="font-size:30px;opacity:0.5">/15</span></div>
        <div class="result-grade-row">
            <div class="result-stat">
                <div class="result-stat-num" style="color:${gradeColors[grade]}">${gradeEmoji[grade]} ${grade}</div>
                <div class="result-stat-lbl">Оценка</div>
            </div>
            <div style="width:1px;height:40px;background:rgba(168,85,247,0.3)"></div>
            <div class="result-stat">
                <div class="result-stat-num" style="color:#A855F7">${percent}%</div>
                <div class="result-stat-lbl">Баллов</div>
            </div>
            <div style="width:1px;height:40px;background:rgba(168,85,247,0.3)"></div>
            <div class="result-stat">
                <div class="result-stat-num" style="color:#10B981">${correctCount}</div>
                <div class="result-stat-lbl">Правильно</div>
            </div>
            <div style="width:1px;height:40px;background:rgba(168,85,247,0.3)"></div>
            <div class="result-stat">
                <div class="result-stat-num" style="color:#F43F5E">${15 - correctCount}</div>
                <div class="result-stat-lbl">Ошибок</div>
            </div>
        </div>
    `;
    document.getElementById('modalBody').innerHTML = `
        <div style="font-size:13px;font-weight:800;color:#C084FC;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Разбор ответов</div>
        <table class="answers-review">
            <thead><tr>
                <th>№</th>
                <th>Твой ответ</th>
                <th>Верный ответ</th>
                <th>Результат</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
    document.getElementById('infoModal').style.display = 'flex';
    clearExamState();
    const _v = findVariantById(currentSubject);
    sendResultToTeacher(correctCount, 15, _v ? _v.name : currentSubject);
}

// Таймер считает от времени окончания, поэтому перезагрузка страницы его не сбрасывает
function startTimer(endTs) {
    clearInterval(timerInterval);
    const el = document.getElementById('timer-display');
    const tick = () => {
        const left = Math.max(0, Math.round((endTs - Date.now()) / 1000));
        const m = Math.floor(left / 60), s = left % 60;
        el.textContent = `${m}:${s < 10 ? '0' + s : s}`;
        if (left <= 0) { clearInterval(timerInterval); finishQuiz(); }
    };
    tick();
    timerInterval = setInterval(tick, 1000);
}

function showTheory(topicNum) {
    const t = translations[currentLang];
    let theoryContent = THEORY_DB[currentLang][topicNum];
    
    if (!theoryContent) {
        theoryContent = `<p style="color: var(--text-gray);">${currentLang === 'kk' ? 'Бұл тақырыптың теориясы әлі қосылмаған. Бірақ жақында міндетті түрде болады!' : 'Теория для этой темы еще не добавлена. Но скоро появится!'}</p>`;
    }

    document.getElementById('modalTitle').innerText = t["help-btn"].replace('📚 ', '');
    document.getElementById('modalBody').innerHTML = theoryContent;
    document.getElementById('infoModal').style.display = 'flex';
}

function navQuestion(step) { let next = currentQuestionNum + step; if (next >= 1 && next <= 15) showQuestion(next); }

function closeModal() { document.getElementById('infoModal').style.display = 'none'; }

// ===== Состояние экзамена: один ответ, защита от повторной отправки, сохранение прогресса =====
let quizFinished = false;
let examEndsAt = 0;
const EXAM_STATE_KEY = 'examState';

function saveExamState() {
    if (currentMode !== 'test' || quizFinished || !examEndsAt) return;
    try {
        localStorage.setItem(EXAM_STATE_KEY, JSON.stringify({
            student: localStorage.getItem('studentName') || '',
            subject: currentSubject, base: currentBaseSubject,
            solved: solvedQuestions, endsAt: examEndsAt, q: currentQuestionNum
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
        showPage('quiz-page');
        finishQuiz();
        return;
    }
    const mins = Math.max(1, Math.ceil((st.endsAt - Date.now()) / 60000));
    uiConfirm(
        tr('У вас есть незавершённый экзамен. Осталось примерно ' + mins + ' мин. Продолжить?',
           'Аяқталмаған емтихан бар. Шамамен ' + mins + ' мин қалды. Жалғастырасыз ба?'),
        tr('Продолжить', 'Жалғастыру'), tr('Отменить экзамен', 'Емтиханнан бас тарту')
    ).then(ok => { if (ok) { apply(); startQuiz(st); } else clearExamState(); });
}
function confirmFinish() {
    const answered = Object.keys(solvedQuestions).filter(k => /^\d+$/.test(k)).length;
    uiConfirm(
        tr('Вы ответили на ' + answered + ' из 15 вопросов. Завершить экзамен?',
           '15 сұрақтың ' + answered + '-іне жауап бердіңіз. Емтиханды аяқтайсыз ба?'),
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
    uiConfirm(
        tr('Вы уходите с экзамена. Время продолжит идти, а ваши ответы сохранятся: чтобы вернуться, выберите тот же вариант в разделе «Экзамен». Выйти?',
           'Сіз емтиханнан шығып барасыз. Уақыт жүре береді, жауаптарыңыз сақталады: оралу үшін «Емтихан» бөлімінде сол нұсқаны таңдаңыз. Шығасыз ба?'),
        tr('Выйти', 'Шығу'), tr('Остаться', 'Қалу')
    ).then(ok => { if (ok) proceed(); });
}
// Закрытие вкладки / обновление страницы во время экзамена
window.addEventListener('beforeunload', e => {
    if (examInProgress()) { e.preventDefault(); e.returnValue = ''; }
});
