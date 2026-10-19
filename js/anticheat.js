// Строгий режим экзамена: полный экран, учёт выходов со вкладки, блокировка копирования
// Браузер не позволяет полностью запретить уйти со страницы, поэтому мы:
//   1) просим не уходить (полный экран + предупреждение перед закрытием),
//   2) фиксируем каждый выход и показываем его ученику и учителю,
//   3) после N выходов завершаем экзамен автоматически.
const examGuard = {
    active: false,      // строгий режим включён для текущего экзамена
    leaves: 0,          // сколько раз ученик уходил
    awaySec: 0,         // сколько секунд был вне экзамена
    away: false,        // сейчас вне вкладки
    awayStart: 0,
    startedAt: 0,
    max: 3,
    fullscreen: true,
    trapped: false
};

function strictSettings() {
    const base = Object.assign({ enabled: true, maxLeaves: 3, fullscreen: true, notifyStart: true, notifyLeaves: true },
        typeof ANTI_CHEAT !== 'undefined' ? ANTI_CHEAT : {});
    const v = typeof currentVariant === 'function' ? currentVariant() : null;
    if (v) {
        base.enabled = v.strict !== false;
        if (v.maxLeaves) base.maxLeaves = Number(v.maxLeaves);
    }
    return base;
}

function examGuardSnapshot() {
    return { strict: examGuard.active || examGuard.leaves > 0, leaves: examGuard.leaves, awaySec: examGuard.awaySec, startedAt: examGuard.startedAt };
}

// Восстановить счётчики из сохранённого состояния (без включения защиты)
function restoreExamGuard(st) {
    examGuard.leaves = (st && st.leaves) || 0;
    examGuard.awaySec = (st && st.awaySec) || 0;
    examGuard.startedAt = (st && st.startedAt) || Date.now();
    examGuard.away = false;
}

function startExamGuard(st) {
    const s = strictSettings();
    restoreExamGuard(st);
    examGuard.active = !!s.enabled;
    examGuard.max = Math.max(1, s.maxLeaves || 3);
    examGuard.fullscreen = s.fullscreen !== false;
    document.body.classList.add('exam-locked');
    if (!examGuard.trapped) {           // кнопка «Назад» браузера не уводит с экзамена
        try { history.pushState({ exam: true }, ''); examGuard.trapped = true; } catch (e) {}
    }
    if (examGuard.active) enterFullscreen();
    updateStrictBanner();
}

function stopExamGuard() {
    examGuard.active = false;
    examGuard.away = false;
    document.body.classList.remove('exam-locked');
    exitFullscreen();
    updateStrictBanner();
}

function guardOn() { return examGuard.active && typeof examInProgress === 'function' && examInProgress(); }

function enterFullscreen() {
    if (!examGuard.fullscreen) return;
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    try { const p = req.call(el); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
function exitFullscreen() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsEl) return;
    const ex = document.exitFullscreen || document.webkitExitFullscreen;
    try { const p = ex.call(document); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}

function leaveReasonText(reason) {
    return {
        tab: tr('переключение вкладки или приложения', 'қойындыны немесе қосымшаны ауыстыру'),
        blur: tr('переход в другое окно', 'басқа терезеге өту'),
        fullscreen: tr('выход из полноэкранного режима', 'толық экраннан шығу'),
        reload: tr('перезагрузка страницы', 'бетті қайта жүктеу'),
        exit: tr('выход из экзамена', 'емтиханнан шығу')
    }[reason] || reason;
}

// Засчитать выход. Для 'tab' и 'blur' ученик ещё не вернулся — предупреждение покажем при возврате
function registerLeave(reason, stillAway) {
    if (!examGuard.active || quizFinished) return;
    examGuard.leaves++;
    if (stillAway) { examGuard.away = true; examGuard.awayStart = Date.now(); }
    saveExamState();
    updateStrictBanner();
    const s = strictSettings();
    if (s.notifyLeaves) {
        notifyTeacher('leave', { topic: variantTitle(), leaves: examGuard.leaves, max: examGuard.max, reason: reason });
    }
    if (examGuard.leaves >= examGuard.max) {
        finishQuiz({ autoFinished: true, reason: tr(
            `Экзамен завершён автоматически: ${examGuard.leaves} выход(а) из экзамена (последний — ${leaveReasonText(reason)}).`,
            `Емтихан автоматты түрде аяқталды: емтиханнан ${examGuard.leaves} рет шығу (соңғысы — ${leaveReasonText(reason)}).`) });
        return;
    }
    if (!stillAway) warnLeave(reason);
}

function warnLeave(reason) {
    const left = examGuard.max - examGuard.leaves;
    uiAlert(tr(
        `⚠️ Зафиксирован выход из экзамена (${leaveReasonText(reason)}).\n\nВыходов: ${examGuard.leaves} из ${examGuard.max}. Учитель это увидит.\nЕщё ${left} — и экзамен завершится автоматически.`,
        `⚠️ Емтиханнан шығу тіркелді (${leaveReasonText(reason)}).\n\nШығу: ${examGuard.max} ішінен ${examGuard.leaves}. Мұғалім мұны көреді.\nТағы ${left} рет — емтихан автоматты түрде аяқталады.`
    )).then(() => { if (guardOn()) enterFullscreen(); });
}

function markAway(reason) {
    if (!guardOn() || examGuard.away) return;
    registerLeave(reason, true);
}
function markBack() {
    if (!examGuard.away) return;
    examGuard.away = false;
    examGuard.awaySec += Math.round((Date.now() - examGuard.awayStart) / 1000);
    saveExamState();
    if (quizFinished) return;           // экзамен уже завершён, итог на экране
    warnLeave(examGuard.lastReason || 'tab');
}

// Переключение вкладки / сворачивание (работает и на телефонах)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) { examGuard.lastReason = 'tab'; markAway('tab'); }
    else markBack();
});
// Переход в другое окно (вкладка видна, но фокус ушёл). Короткий клик в адресную строку не считаем
let blurTimer = null;
window.addEventListener('blur', () => {
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
        if (!document.hidden && !document.hasFocus()) { examGuard.lastReason = 'blur'; markAway('blur'); }
    }, 1500);
});
window.addEventListener('focus', () => { clearTimeout(blurTimer); if (!document.hidden) markBack(); });
// Выход из полноэкранного режима (Esc)
function onFullscreenChange() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    setTimeout(() => {
        if (!guardOn() || examGuard.away || document.hidden) return;   // переключение вкладки уже засчитано
        registerLeave('fullscreen', false);
    }, 400);
}
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

// Кнопка «Назад» браузера во время экзамена
window.addEventListener('popstate', () => {
    if (typeof examInProgress === 'function' && examInProgress()) {
        try { history.pushState({ exam: true }, ''); } catch (e) {}
        showToast(tr('Во время экзамена нельзя уйти назад. Нажмите «Завершить тест».', 'Емтихан кезінде артқа өтуге болмайды. «Тестті аяқтау» батырмасын басыңыз.'), 'error');
    } else {
        examGuard.trapped = false;
    }
});

// Копирование, контекстное меню, печать и сохранение страницы во время экзамена
['copy', 'cut', 'contextmenu', 'dragstart'].forEach(ev => document.addEventListener(ev, e => {
    if (typeof examInProgress === 'function' && examInProgress() && !(e.target && e.target.id === 'text-ans' && ev !== 'contextmenu')) {
        e.preventDefault();
        if (ev === 'copy' || ev === 'cut') showToast(tr('Копирование во время экзамена отключено', 'Емтихан кезінде көшіруге болмайды'), 'error');
    }
}));
document.addEventListener('keydown', e => {
    if (!(typeof examInProgress === 'function' && examInProgress())) return;
    const k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(k)) e.preventDefault();
});

function updateStrictBanner() {
    const el = document.getElementById('strict-banner');
    if (!el) return;
    const show = currentMode === 'test' && !quizFinished && examGuard.active;
    el.style.display = show ? 'flex' : 'none';
    if (!show) return;
    el.classList.toggle('strict-warn', examGuard.leaves > 0);
    el.innerHTML = `<span>🔒 ${tr('Строгий режим', 'Қатаң режим')}</span><span>${tr('Выходов', 'Шығу')}: <b>${examGuard.leaves}</b> / ${examGuard.max}</span>`;
}
