// Уроки: проверка заданий и смена языка
// Ответ может быть строкой или массивом допустимых вариантов.
// Ученик может писать с пробелами, через запятую, x² или x^2, 0.5 или 1/2 — см. answerMatches в utils.js
const LESSON_ANSWERS = {
    1: { 1: '9', 2: '11', 3: '4', 4: '13', 5: '6', 6: '7', 7: '3', 8: '2', 9: '5', 10: '8' },
    2: { 1: '3/7', 2: '3/8', 3: '1/6', 4: '1', 5: '8/9', 6: '5/6', 7: '1/4', 8: '5', 9: '5', 10: '1/2' },
    3: { 1: '100', 2: '300', 3: '1100' },
    4: { 1: '5', 2: '4', 3: '-4' },
    5: { 1: '2;5', 2: ['3', '3;3'], 3: '2;3' },
    6: { 1: ['>', '>0'], 2: ['>', '>0'], 3: ['>', '>0'] },
    7: { 1: '18', 2: '12', 3: '2' },
    8: { 1: '3', 2: '3', 3: '0' },
    9: { 1: '12', 2: '24', 3: '10' },
    10: { 1: '3', 2: '4', 3: '2.67' },
    11: { 1: '1×10^4', 2: '1×10^-3', 3: '5.3×10^3' },
    12: { 1: '2x+8', 2: '5x', 3: '2x' },
    13: { 1: '2', 2: '8', 3: '14' },
    14: { 1: 'x^2+2x+1', 2: 'x^2+4x+4', 3: 'x^3+3x^2+3x+1' },
    15: { 1: '0.5', 2: '0.5', 3: '1' }
};

function checkLesson(lessonNum) {
    const answers = LESSON_ANSWERS[lessonNum] || {};
    let allCorrect = true;
    Object.keys(answers).forEach(n => {
        const el = document.getElementById('l' + lessonNum + '-ans-' + n);
        if (!el) return;
        const ok = el.value.trim() !== '' && answerMatches(el.value, answers[n]);
        el.classList.toggle('lesson-ok', ok);
        el.classList.toggle('lesson-bad', !ok);
        if (!ok) allCorrect = false;
    });
    if (allCorrect) showToast(translations[currentLang]['alert-success'], 'success');
    else showToast(translations[currentLang]['alert-fail'], 'error');
}

function updateLessonContent(lang) {
    for (let i = 3; i <= 15; i++) {
        const el = document.getElementById('lesson-' + i);
        if (el && LESSON_CONTENT[lang] && LESSON_CONTENT[lang][i]) {
            // сохраняем то, что ученик уже ввёл, при смене языка
            const typed = {};
            el.querySelectorAll('input').forEach(inp => { if (inp.id) typed[inp.id] = inp.value; });
            el.innerHTML = LESSON_CONTENT[lang][i];
            Object.keys(typed).forEach(id => { const inp = document.getElementById(id); if (inp) inp.value = typed[id]; });
        }
    }
}
