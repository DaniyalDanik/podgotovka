// Уроки: проверка заданий и смена языка
function checkLesson(lessonNum) {
    let answers = {};
    if (lessonNum === 1) {
        answers = {
            'l1-ans-1': '9', 'l1-ans-2': '11', 'l1-ans-3': '4', 'l1-ans-4': '13', 'l1-ans-5': '6',
            'l1-ans-6': '7', 'l1-ans-7': '3', 'l1-ans-8': '2', 'l1-ans-9': '5', 'l1-ans-10': '8'
        };
    } else if (lessonNum === 2) {
        answers = {
            'l2-ans-1': '3/7', 'l2-ans-2': '3/8', 'l2-ans-3': '1/6', 'l2-ans-4': '1', 'l2-ans-5': '8/9',
            'l2-ans-6': '5/6', 'l2-ans-7': '1/4', 'l2-ans-8': '5', 'l2-ans-9': '5', 'l2-ans-10': '1/2'
        };
    } else if (lessonNum === 3) {
        answers = {
            'l3-ans-1': '100',
            'l3-ans-2': '300',
            'l3-ans-3': '1100'
        };
    } else if (lessonNum === 4) {
        answers = {
            'l4-ans-1': '5',
            'l4-ans-2': '4',
            'l4-ans-3': '-4'
        };
    } else if (lessonNum === 5) {
        answers = {
            'l5-ans-1': '2.5',
            'l5-ans-2': '3.3',
            'l5-ans-3': '2.3',
        };
    } else if (lessonNum === 6) {
        answers = {
            'l6-ans-1': '>',
            'l6-ans-2': '<',
            'l6-ans-3': '<',
        };
    } else if (lessonNum === 7) {
        answers = {
            'l7-ans-1': '18',
            'l7-ans-2': '12',
            'l7-ans-3': '2',
        };
    } else if (lessonNum === 8) {
        answers = {
            'l8-ans-1': '5',
            'l8-ans-2': '4',
            'l8-ans-3': '-4'
        };
    } else if (lessonNum === 9) {
        answers = {
            'l9-ans-1': '12',
            'l9-ans-2': '24',
            'l9-ans-3': '10'
        };
    } else if (lessonNum === 10) {
        answers = {
            'l10-ans-1': '3',
            'l10-ans-2': '4',
            'l10-ans-3': '2.67'
        };
    } else if (lessonNum === 11) {
        answers = {
            'l11-ans-1': '1×10^4',
            'l11-ans-2': '1×10^-3',
            'l11-ans-3': '5.3×10^3'
        };
    } else if (lessonNum === 12) {
        answers = {
            'l12-ans-1': '2x+8',
            'l12-ans-2': '5x',
            'l12-ans-3': '2x'
        };
    } else if (lessonNum === 13) {
        answers = {
            'l13-ans-1': '2',
            'l13-ans-2': '8',
            'l13-ans-3': '14'
        };
    } else if (lessonNum === 14) {
        answers = {
            'l14-ans-1': 'x^2+2x+1',
            'l14-ans-2': 'x^2+4x+4',
            'l14-ans-3': 'x^3+3x^2+3x+1'
        };
    } else if (lessonNum === 15) {
        answers = {
            'l15-ans-1': '0.5',
            'l15-ans-2': '0.5',
            'l15-ans-3': '1'
        };
    }

    let allCorrect = true;
    for (let id in answers) {
        let el = document.getElementById(id);
        if (answerMatches(el.value, answers[id])) {
            el.style.borderColor = "var(--success)";
            el.style.backgroundColor = "#dcfce7";
        } else {
            el.style.borderColor = "var(--danger)";
            el.style.backgroundColor = "#fee2e2";
            allCorrect = false;
        }
    }
    
    if (allCorrect) showToast(translations[currentLang]["alert-success"], 'success');
    else showToast(translations[currentLang]["alert-fail"], 'error');
}

function updateLessonContent(lang) {
    for (let i = 3; i <= 15; i++) {
        const el = document.getElementById('lesson-' + i);
        if (el && LESSON_CONTENT[lang] && LESSON_CONTENT[lang][i]) {
            el.innerHTML = LESSON_CONTENT[lang][i];
        }
    }
}
