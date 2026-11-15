// Кабинет учителя: результаты, создание и редактирование вариантов
let currentTeacher = null;
let teacherRefreshInterval = null;

function checkTeacherCode() {
    const input = document.getElementById('teacher-code-input').value;
    if (teacherCodeHash(input) === TEACHER_CODE_HASH) {
        try { sessionStorage.setItem('teacherCode', input); } catch (e) {}   // нужен для записи в общую базу
        document.getElementById('teacher-password-block').style.display = 'none';
        document.getElementById('teacher-select-block').style.display = 'flex';
        buildTeacherCards();
    } else {
        document.getElementById('teacher-code-error').style.display = 'block';
        document.getElementById('teacher-code-input').value = '';
    }
}

function buildTeacherCards() {
    const container = document.getElementById('teacher-cards-container');
    if (!container || container.children.length > 0) return;
    TEACHERS.forEach(name => {
        const card = document.createElement('div');
        card.className = 'teacher-select-card';
        card.textContent = '👩‍🏫 ' + name;
        card.onclick = () => teacherLogin(name);
        container.appendChild(card);
    });
}

function teacherLogin(name) {
    currentTeacher = name;
    document.getElementById('t-dash-title').textContent = '👩‍🏫 ' + name;
    showPage('teacher-dashboard-page');
    teacherResultsCache = [];
    teacherResultsError = '';
    teacherCloudVariants = [];
    teacherRenderStats();
    teacherRenderTable();
    loadAllTeacherVariants(name);
    switchTeacherTab('results');
    teacherLoadResults();
    clearInterval(teacherRefreshInterval);
    // С общей базой обновляем раз в 30 секунд (бесплатный лимит Cloudflare — 1000 таких запросов в день)
    teacherRefreshInterval = setInterval(() => {
        if (CLOUD.on) teacherLoadResults(); else { teacherRenderStats(); teacherRenderTable(); }
    }, CLOUD.on ? 30000 : 15000);
}

// ===== Результаты из общей базы =====
let teacherResultsCache = [];
let teacherResultsError = '';
let teacherResultsLoading = false;
function teacherLoadResults() {
    if (!CLOUD.on || !currentTeacher || teacherResultsLoading) return Promise.resolve();
    teacherResultsLoading = true;
    const who = currentTeacher;
    return cloudResults(who)
        .then(list => { if (who === currentTeacher) { teacherResultsCache = list; teacherResultsError = ''; } })
        .catch(e => { teacherResultsError = cloudErrorText(e); })
        .then(() => {
            teacherResultsLoading = false;
            if (who === currentTeacher && isVisible('teacher-dashboard-page')) { teacherRenderStats(); teacherRenderTable(); }
        });
}

// Новые результаты из другой вкладки этого же браузера появляются сразу
window.addEventListener('storage', e => {
    if (currentTeacher && e.key === 'results_' + currentTeacher && isVisible('teacher-dashboard-page')) {
        teacherRenderStats(); teacherRenderTable();
    }
});

function teacherGetResults() {
    if (CLOUD.on) return teacherResultsCache.slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
    return safeJSON('results_' + currentTeacher, []);
}

function teacherRenderStats() {
    const results = teacherGetResults();
    const count = results.length;
    const students = new Set(results.map(r => r.name)).size;
    const avgGrade = count ? (results.reduce((s, r) => s + r.grade, 0) / count).toFixed(1) : '—';
    const avgPct = count ? Math.round(results.reduce((s, r) => s + r.percent, 0) / count) + '%' : '—';
    document.getElementById('t-stat-count').textContent = count;
    document.getElementById('t-stat-grade').textContent = avgGrade;
    document.getElementById('t-stat-pct').textContent = avgPct;
    document.getElementById('t-stat-students').textContent = students;
    const sub = document.getElementById('t-dash-sub');
    sub.textContent = teacherResultsError
        ? '⚠️ ' + teacherResultsError
        : (CLOUD.on ? '☁️ ' : '') + translations[currentLang]['t-updated'] + ': ' + new Date().toLocaleTimeString('ru-RU');
    sub.style.color = teacherResultsError ? '#FDA4AF' : '';
}

function teacherFilteredResults() {
    const search = (document.getElementById('t-search').value || '').toLowerCase();
    const gf = document.getElementById('t-grade-filter').value;
    return teacherGetResults().filter(r =>
        String(r.name || '').toLowerCase().includes(search) && (gf ? String(r.grade) === gf : true)
    ).reverse();
}

function leavesCell(r) {
    const n = Number(r.leaves) || 0;
    if (!n && !r.autoFinished) return '<span style="color:var(--text-gray)">—</span>';
    const title = tr('Вне экзамена', 'Емтиханнан тыс') + ': ' + fmtDuration(r.awaySec || 0) + (r.autoFinished ? ' · ' + tr('завершён автоматически', 'автоматты түрде аяқталды') : '');
    return `<span class="leaves-badge${n >= 3 || r.autoFinished ? ' leaves-bad' : ''}" title="${escapeHtml(title)}">⚠ ${n}${r.autoFinished ? ' ⛔' : ''}</span>`;
}

function teacherRenderTable() {
    const filtered = teacherFilteredResults();
    const tbody = document.getElementById('t-results-body');
    const empty = document.getElementById('t-empty');
    if (filtered.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    const barColors = { 5: '#22c55e', 4: '#2A73E8', 3: '#f59e0b', 2: '#ef4444' };
    tbody.innerHTML = filtered.map((r, i) => {
        const g = [2, 3, 4, 5].includes(Number(r.grade)) ? Number(r.grade) : 2;
        return `
        <tr>
            <td style="color:var(--text-gray);font-weight:600;">${i + 1}</td>
            <td><b>${escapeHtml(r.name)}</b></td>
            <td style="color:var(--text-gray);font-size:12px;">${escapeHtml(r.topic || '—')}</td>
            <td><b>${Number(r.score)}/${Number(r.total)}</b> <span style="color:var(--text-gray)">(${Number(r.percent)}%)</span></td>
            <td><div class="pbar"><div class="pbar-fill" style="width:${Number(r.percent)}%;background:${barColors[g]};"></div></div></td>
            <td><span class="grade-badge g${g}">${g}</span></td>
            <td>${leavesCell(r)}</td>
            <td style="color:var(--text-gray);font-size:11px;">${escapeHtml(r.date)}</td>
        </tr>`;
    }).join('');
}

// Выгрузка результатов в CSV (открывается в Excel)
function teacherExportCSV() {
    const rows = teacherFilteredResults().reverse();
    if (!rows.length) { showToast(tr('Нет результатов для выгрузки', 'Жүктейтін нәтиже жоқ'), 'error'); return; }
    const head = [tr('Ученик', 'Оқушы'), tr('Тема', 'Тақырып'), tr('Баллы', 'Ұпай'), tr('Всего', 'Барлығы'), '%',
                  tr('Оценка', 'Баға'), tr('Выходы', 'Шығулар'), tr('Вне экзамена (с)', 'Емтиханнан тыс (с)'),
                  tr('Завершён автоматически', 'Автоматты аяқталды'), tr('Дата', 'Күні')];
    const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [head.map(esc).join(';')].concat(rows.map(r => [
        r.name, r.topic, r.score, r.total, r.percent, r.grade, r.leaves || 0, r.awaySec || 0,
        r.autoFinished ? tr('да', 'иә') : '', r.date
    ].map(esc).join(';')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'results_' + String(currentTeacher).replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function teacherClear() {
    const msg = translations[currentLang]['t-confirm-clear'] + ' (' + currentTeacher + ')';
    uiConfirm(msg).then(ok => {
        if (!ok) return;
        if (CLOUD.on) {
            cloudClearResults(currentTeacher)
                .then(() => { teacherResultsCache = []; teacherRenderStats(); teacherRenderTable(); })
                .catch(e => uiAlert(cloudErrorText(e)));
            return;
        }
        localStorage.removeItem('results_' + currentTeacher);
        teacherRenderStats();
        teacherRenderTable();
    });
}

function switchTeacherTab(tab) {
    document.getElementById('tab-results').style.display = tab === 'results' ? 'block' : 'none';
    document.getElementById('tab-variants').style.display = tab === 'variants' ? 'block' : 'none';
    document.getElementById('tab-results-btn').classList.toggle('active', tab === 'results');
    document.getElementById('tab-variants-btn').classList.toggle('active', tab === 'variants');
    if (tab === 'variants') {
        if (!document.getElementById('vc-questions').children.length) buildVcQuestions();
        renderSavedVariants();
    }
}

// ===== Редактор варианта =====
// Черновик хранится в памяти: { count, questions: { n: { type, text, options:{A..E}, answer } }, images: { n: dataUrl } }
const VC_MAX = 40;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
let vcCount = 15;
let vcImages = {};          // n → dataURL (сжатая картинка)
let vcEditingId = null;     // id варианта, который редактируем (null — новый)

function t_(key) { return translations[currentLang][key] || key; }

function vcQuestionHTML(n) {
    const def = n <= 10 ? 'test' : 'open';
    const opts = LETTERS.map(L => `
        <div class="vc-opt">
            <label class="vc-radio" title="${escapeHtml(t_('q-correct'))} ${L}"><input type="radio" name="vc-correct-${n}" value="${L}"><span>${L}</span></label>
            <input type="text" id="vc-opt-${n}-${L}" maxlength="200" placeholder="${escapeHtml(t_('q-opt-ph'))}" data-i18n-ph="q-opt-ph">
        </div>`).join('');
    return `
        <div class="vc-q-head">
            <span class="vc-q-num">№${n}</span>
            <select id="vc-type-${n}" onchange="vcToggleType(${n})">
                <option value="test" ${def === 'test' ? 'selected' : ''} data-i18n="q-type-test">${t_('q-type-test')}</option>
                <option value="open" ${def === 'open' ? 'selected' : ''} data-i18n="q-type-open">${t_('q-type-open')}</option>
            </select>
            <label class="vc-img-btn"><span data-i18n="q-img-btn">${t_('q-img-btn')}</span>
                <input type="file" accept="image/*" class="visually-hidden" onchange="vcPickImage(${n}, this)">
            </label>
        </div>
        <textarea id="vc-text-${n}" rows="2" maxlength="2000" placeholder="${escapeHtml(t_('q-text-ph'))}" data-i18n-ph="q-text-ph"></textarea>
        <div class="vc-img-slot" id="vc-img-${n}"></div>
        <div class="vc-test" id="vc-test-${n}" style="display:${def === 'test' ? 'block' : 'none'};">
            <div class="vc-correct-hint" data-i18n="q-correct">${t_('q-correct')}</div>
            ${opts}
        </div>
        <div class="vc-open" id="vc-open-${n}" style="display:${def === 'open' ? 'block' : 'none'};">
            <input type="text" id="vc-ans-${n}" maxlength="100" placeholder="${escapeHtml(t_('q-ans-ph'))}" data-i18n-ph="q-ans-ph">
        </div>`;
}

function buildVcQuestions() {
    const box = document.getElementById('vc-questions');
    const have = box.children.length;
    for (let n = have + 1; n <= vcCount; n++) {
        const div = document.createElement('div');
        div.className = 'vc-q';
        div.id = 'vcq-' + n;
        div.innerHTML = vcQuestionHTML(n);
        box.appendChild(div);
        renderVcImage(n);
    }
    // лишние карточки прячем (данные не теряются, если учитель вернёт количество)
    Array.from(box.children).forEach((el, i) => { el.style.display = i < vcCount ? '' : 'none'; });
}

function setVcCount(v) {
    vcCount = Math.max(1, Math.min(VC_MAX, parseInt(v, 10) || 15));
    document.getElementById('vc-count').value = vcCount;
    buildVcQuestions();
}

function vcToggleType(n) {
    const type = document.getElementById('vc-type-' + n).value;
    document.getElementById('vc-test-' + n).style.display = type === 'test' ? 'block' : 'none';
    document.getElementById('vc-open-' + n).style.display = type === 'open' ? 'block' : 'none';
}

function renderVcImage(n) {
    const slot = document.getElementById('vc-img-' + n);
    if (!slot) return;
    slot.innerHTML = vcImages[n]
        ? `<div class="vc-thumb"><img src="${vcImages[n]}" alt="№${n}"><button type="button" onclick="vcRemoveImage(${n})" title="✕">✕</button></div>`
        : '';
}

function vcRemoveImage(n) { delete vcImages[n]; renderVcImage(n); }

// Сжимаем картинку перед сохранением: память браузера ограничена (~5 МБ на сайт)
function compressImage(file, maxSide, quality) {
    maxSide = maxSide || 1400; quality = quality || 0.82;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const k = Math.min(1, maxSide / Math.max(img.width, img.height));
                const w = Math.round(img.width * k), h = Math.round(img.height * k);
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                const ctx = c.getContext('2d');
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, w, h);
                const jpg = c.toDataURL('image/jpeg', quality);
                resolve(jpg.length < reader.result.length ? jpg : reader.result);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function vcPickImage(n, input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    compressImage(file).then(url => { vcImages[n] = url; renderVcImage(n); })
        .catch(() => uiAlert(tr('Не удалось прочитать картинку', 'Суретті оқу мүмкін болмады')));
}

function previewUploadedImages(input) {
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    const free = [];
    for (let i = 1; i <= vcCount; i++) if (!vcImages[i]) free.push(i);
    if (!free.length) { uiAlert(tr('У всех вопросов уже есть картинки.', 'Барлық сұрақтың суреті бар.')); return; }
    if (files.length > free.length) {
        uiAlert(tr(`Можно добавить только ${free.length} картинок — остальные пропущены. Увеличьте количество вопросов, если нужно.`,
                   `Тек ${free.length} сурет қосуға болады — қалғандары өткізілді. Қажет болса, сұрақтар санын көбейтіңіз.`));
    }
    files.slice(0, free.length).forEach((file, i) => {
        const n = free[i];
        compressImage(file).then(url => { vcImages[n] = url; renderVcImage(n); }).catch(() => {});
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('vc-images');
    if (input) input.addEventListener('change', function() { previewUploadedImages(this); });
});

function readVcForm() {
    const questions = {}, answers = {};
    for (let n = 1; n <= vcCount; n++) {
        const type = document.getElementById('vc-type-' + n).value;
        const text = document.getElementById('vc-text-' + n).value.trim();
        const options = {};
        let answer = '';
        if (type === 'test') {
            LETTERS.forEach(L => { const v = document.getElementById(`vc-opt-${n}-${L}`).value.trim(); if (v) options[L] = v; });
            const checked = document.querySelector(`input[name="vc-correct-${n}"]:checked`);
            answer = checked ? checked.value : '';
        } else {
            answer = document.getElementById('vc-ans-' + n).value.trim();
        }
        questions[n] = { type: type, text: text, options: options };
        answers[n] = answer;
    }
    return { questions, answers };
}

function clearVariantForm() {
    vcEditingId = null;
    vcEditingSource = null;
    vcEditingCreated = '';
    vcImages = {};
    document.getElementById('vc-name').value = '';
    document.getElementById('vc-subject').value = 'math';
    document.getElementById('vc-time').value = Math.round(EXAM_MS / 60000);
    document.getElementById('vc-strict').checked = true;
    document.getElementById('vc-max-leaves').value = (typeof ANTI_CHEAT !== 'undefined' && ANTI_CHEAT.maxLeaves) || 3;
    document.getElementById('vc-max-leaves').disabled = false;
    document.getElementById('vc-questions').innerHTML = '';
    vcCount = 15;
    document.getElementById('vc-count').value = 15;
    buildVcQuestions();
    setVcHeading();
}

function setVcHeading() {
    const h = document.getElementById('vc-heading');
    h.setAttribute('data-i18n', vcEditingId ? 'vc-edit-title' : 'vc-title');
    h.innerHTML = vcEditingId ? tr('✏️ Редактирование варианта', '✏️ Нұсқаны өңдеу') : t_('vc-title');
    document.getElementById('vc-cancel-edit').style.display = vcEditingId ? '' : 'none';
}

// Откуда редактируемый вариант: 'cloud' (общая база) или 'local' (только этот браузер)
let vcEditingSource = null;
let vcEditingCreated = '';

function fillVariantForm(v) {
    document.getElementById('vc-name').value = v.name || '';
    document.getElementById('vc-subject').value = ['math', 'phys'].includes(v.subject) ? v.subject : 'custom';
    document.getElementById('vc-time').value = variantMinutes(v);
    document.getElementById('vc-strict').checked = v.strict !== false;
    document.getElementById('vc-max-leaves').value = v.maxLeaves || 3;
    document.getElementById('vc-max-leaves').disabled = v.strict === false;
    setVcCount(variantCount(v));
    for (let n = 1; n <= vcCount; n++) {
        const q = customQuestion(v, n);
        document.getElementById('vc-type-' + n).value = q.type;
        vcToggleType(n);
        document.getElementById('vc-text-' + n).value = q.text || '';
        LETTERS.forEach(L => { document.getElementById(`vc-opt-${n}-${L}`).value = (q.options && q.options[L]) || ''; });
        const ans = (v.answers && v.answers[n]) || '';
        if (q.type === 'test') {
            const r = document.querySelector(`input[name="vc-correct-${n}"][value="${normAns(ans)}"]`);
            if (r) r.checked = true;
        } else {
            document.getElementById('vc-ans-' + n).value = ans;
        }
        const img = variantImage(v, n);
        if (img) { vcImages[n] = img; renderVcImage(n); }
    }
}

function editTeacherVariant(id) {
    const local = findLocalVariant(id);
    const open = (v, source) => {
        clearVariantForm();
        vcEditingId = id;
        vcEditingSource = source;
        vcEditingCreated = v.created || '';
        fillVariantForm(v);
        setVcHeading();
        document.getElementById('variant-creator').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (local) { open(local, 'local'); return; }
    if (!CLOUD.on) return;
    showToast(tr('Загружаю вариант…', 'Нұсқа жүктелуде…'), '');
    cloudVariant(id, true).then(v => open(v, 'cloud'))
        .catch(e => uiAlert(tr('Не удалось открыть вариант. ', 'Нұсқаны ашу мүмкін болмады. ') + cloudErrorText(e)));
}

function setSaveBusy(busy) {
    document.querySelectorAll('#variant-creator .btn').forEach(b => { b.disabled = busy; b.style.opacity = busy ? 0.6 : ''; });
}

function saveTeacherVariant() {
    const name = document.getElementById('vc-name').value.trim();
    if (!name) { uiAlert(tr('Введите название варианта!', 'Нұсқа атауын енгізіңіз!')); return; }
    const { questions, answers } = readVcForm();

    const noAnswer = [], noContent = [];
    for (let n = 1; n <= vcCount; n++) {
        if (!answers[n]) noAnswer.push(n);
        const q = questions[n];
        if (q.type === 'test' && Object.keys(q.options).length && answers[n] && !q.options[answers[n]]) noAnswer.push(n);
        if (!q.text && !vcImages[n]) noContent.push(n);
    }
    if (noAnswer.length) {
        uiAlert(tr('Укажите правильный ответ в вопросах: № ', 'Мына сұрақтарда дұрыс жауапты көрсетіңіз: № ') + Array.from(new Set(noAnswer)).join(', '));
        return;
    }
    const doSave = () => {
        const questionTypes = {};
        Object.keys(questions).forEach(n => { questionTypes[n] = questions[n].type; });
        const base = {
            id: vcEditingId || 'custom_' + Date.now(),
            name: name, subject: document.getElementById('vc-subject').value, teacher: currentTeacher,
            count: vcCount,
            timeMin: Math.max(1, Math.min(240, parseInt(document.getElementById('vc-time').value, 10) || 60)),
            strict: document.getElementById('vc-strict').checked,
            maxLeaves: Math.max(1, Math.min(20, parseInt(document.getElementById('vc-max-leaves').value, 10) || 3)),
            questions: questions, questionTypes: questionTypes, answers: answers,
            created: vcEditingId ? (vcEditingCreated || new Date().toLocaleString('ru-RU')) : new Date().toLocaleString('ru-RU'),
            updated: vcEditingId ? new Date().toLocaleString('ru-RU') : ''
        };
        if (CLOUD.on) saveVariantToCloud(base);
        else saveVariantLocally(base);
    };
    if (noContent.length) {
        uiConfirm(tr('В вопросах № ' + noContent.join(', ') + ' нет ни текста, ни картинки (например, если задания на бумаге). Сохранить так?',
                     '№ ' + noContent.join(', ') + ' сұрақтарында мәтін де, сурет те жоқ (мысалы, тапсырма қағазда болса). Осылай сақтау керек пе?'),
                  tr('Сохранить', 'Сақтау'), tr('Вернуться', 'Қайту')).then(ok => { if (ok) doSave(); });
    } else {
        doSave();
    }
}

// Вариант в общей базе: картинки внутри варианта, ответы — открытые (видны только с кодом учителя) и хеши (для учеников)
function cloudVariantData(base, images) {
    const data = Object.assign({}, base, { images: {} });
    for (let n = 1; n <= base.count; n++) if (images[n]) data.images[n] = images[n];
    data.imageCount = Object.keys(data.images).length;
    data.answersHash = hashAnswerMap(data.id, base.answers);
    delete data.imagePrefix;
    return data;
}

function saveVariantToCloud(base) {
    const data = cloudVariantData(base, vcImages);
    if (JSON.stringify(data).length > 19 * 1024 * 1024) {
        uiAlert(tr('Вариант слишком большой (больше 19 МБ): уберите часть картинок.', 'Нұсқа тым үлкен (19 МБ-тан көп): суреттердің бір бөлігін алып тастаңыз.'));
        return;
    }
    const wasLocal = vcEditingSource === 'local';
    setSaveBusy(true);
    showToast(tr('Сохраняю в общую базу…', 'Ортақ базаға сақталуда…'), '');
    cloudSaveVariant(data).then(() => {
        if (wasLocal) removeLocalVariant(data.id);          // перенесли в общую базу — локальная копия не нужна
        ALL_ANSWERS[data.id] = data.answersHash;
        uiAlert(base.updated
            ? tr('✅ Вариант «' + base.name + '» обновлён! Ученики увидят изменения на всех устройствах.', '✅ «' + base.name + '» нұсқасы жаңартылды! Оқушылар өзгерістерді барлық құрылғыда көреді.')
            : tr('✅ Вариант «' + base.name + '» сохранён в общую базу! Ученики увидят его на своих устройствах.', '✅ «' + base.name + '» нұсқасы ортақ базаға сақталды! Оқушылар оны өз құрылғыларында көреді.'));
        clearVariantForm();
        renderSavedVariants();
    }).catch(e => {
        uiAlert(tr('⚠️ Вариант не сохранён. ', '⚠️ Нұсқа сақталмады. ') + cloudErrorText(e));
    }).then(() => setSaveBusy(false));
}

// Без сервера — как раньше, в памяти браузера
function saveVariantLocally(base) {
    const key = 'teacher_variants_' + currentTeacher;
    const variants = safeJSON(key, []);
    const old = variants.find(v => v.id === base.id);
    const teacherSlug = (currentTeacher || 'teacher').replace(/\s+/g, '_');
    const imagePrefix = old && old.imagePrefix ? old.imagePrefix : `teacher_${teacherSlug}_${base.id}_q`;
    let imgFail = 0, imgCount = 0;
    for (let n = 1; n <= VC_MAX; n++) {
        const k = 'img_' + imagePrefix + n;
        if (n <= vcCount && vcImages[n]) {
            try { if (localStorage.getItem(k) !== vcImages[n]) localStorage.setItem(k, vcImages[n]); imgCount++; }
            catch (e) { imgFail++; }
        } else {
            localStorage.removeItem(k);
        }
    }
    const data = Object.assign({}, base, { imagePrefix: imagePrefix, imageCount: imgCount, hasImages: imgCount > 0 });
    const list = old ? variants.map(v => v.id === base.id ? data : v) : variants.concat([data]);
    try { localStorage.setItem(key, JSON.stringify(list)); }
    catch (e) { uiAlert(tr('⚠️ Память браузера заполнена — вариант не сохранён. Удалите старые варианты или картинки.', '⚠️ Браузер жады толы — нұсқа сақталмады. Ескі нұсқаларды немесе суреттерді өшіріңіз.')); return; }
    ALL_ANSWERS[base.id] = hashAnswerMap(base.id, base.answers);
    uiAlert((old ? tr('✅ Вариант «' + base.name + '» обновлён!', '✅ «' + base.name + '» нұсқасы жаңартылды!')
                 : tr('✅ Вариант «' + base.name + '» сохранён!', '✅ «' + base.name + '» нұсқасы сақталды!')) +
        (imgFail ? '\n' + tr('⚠️ Не удалось сохранить картинок: ' + imgFail + ' (память браузера заполнена).',
                              '⚠️ Сақталмаған суреттер: ' + imgFail + ' (браузер жады толы).') : ''));
    clearVariantForm();
    renderSavedVariants();
}

function removeLocalVariant(id) {
    const key = 'teacher_variants_' + currentTeacher;
    const all = safeJSON(key, []);
    const gone = all.find(v => v.id === id);
    if (gone && gone.imagePrefix) for (let i = 1; i <= VC_MAX; i++) localStorage.removeItem('img_' + gone.imagePrefix + i);
    localStorage.setItem(key, JSON.stringify(all.filter(v => v.id !== id)));
}

// Перенести вариант, созданный раньше в этом браузере, в общую базу
function uploadLocalVariant(id) {
    const v = findLocalVariant(id);
    if (!v) return;
    const images = {};
    for (let n = 1; n <= variantCount(v); n++) { const img = variantImage(v, n); if (img) images[n] = img; }
    const base = Object.assign({}, v, { teacher: currentTeacher, count: variantCount(v) });
    if (!base.questions) {
        base.questions = {};
        for (let n = 1; n <= base.count; n++) base.questions[n] = customQuestion(v, n);
    }
    const data = cloudVariantData(base, images);
    showToast(tr('Переношу в общую базу…', 'Ортақ базаға көшірілуде…'), '');
    cloudSaveVariant(data).then(() => {
        removeLocalVariant(id);
        showToast(tr('✅ Вариант теперь в общей базе', '✅ Нұсқа енді ортақ базада'), 'success');
        renderSavedVariants();
    }).catch(e => uiAlert(tr('⚠️ Не удалось перенести. ', '⚠️ Көшіру мүмкін болмады. ') + cloudErrorText(e)));
}

function subjectLabel(s) {
    return s === 'math' ? t_('vc-subj-math') : s === 'phys' ? t_('vc-subj-phys') : t_('vc-subj-custom');
}

// Краткие данные варианта для карточки (у вариантов из базы они уже посчитаны сервером)
function localVariantMeta(v) {
    return {
        id: v.id, name: v.name, subject: v.subject, teacher: v.teacher, count: variantCount(v), timeMin: variantMinutes(v),
        strict: v.strict !== false, maxLeaves: v.maxLeaves || 3, images: v.imageCount || 0,
        texts: v.questions ? Object.values(v.questions).filter(q => q && q.text).length : 0,
        answers: Object.values(v.answers || {}).filter(a => a).length,
        created: v.created || '', updated: v.updated || '', local: true
    };
}

let teacherCloudVariants = [];
let teacherVariantsNote = '';

function drawSavedVariants() {
    const local = safeJSON('teacher_variants_' + currentTeacher, []).filter(v => v && v.id).map(localVariantMeta);
    const variants = teacherCloudVariants.concat(local);
    const container = document.getElementById('sv-cards');
    const empty = document.getElementById('sv-empty');
    const note = teacherVariantsNote ? `<div class="sv-note">${escapeHtml(teacherVariantsNote)}</div>` : '';
    if (variants.length === 0) { container.innerHTML = note; empty.style.display = teacherVariantsNote ? 'none' : 'block'; return; }
    empty.style.display = 'none';
    container.innerHTML = note + variants.map(m => {
        const id = escapeHtml(m.id).replace(/'/g, '');
        const where = m.local
            ? (CLOUD.on ? `<span class="sv-badge sv-badge-local">💻 ${tr('только на этом устройстве', 'тек осы құрылғыда')}</span>` : '')
            : `<span class="sv-badge sv-badge-cloud">☁️ ${tr('общая база', 'ортақ база')}</span>`;
        const upload = m.local && CLOUD.on
            ? `<button class="sv-btn sv-btn-go" onclick="uploadLocalVariant('${id}')">☁️ ${tr('В общую базу', 'Ортақ базаға')}</button>` : '';
        return `
        <div class="sv-card">
            <div class="sv-info">
                <div class="sv-name">📋 ${escapeHtml(m.name)} ${where}</div>
                <div class="sv-meta">
                    ${escapeHtml(subjectLabel(m.subject))} · ${m.count} ${tr('вопр.', 'сұрақ')} · ⏱ ${m.timeMin} ${tr('мин', 'мин')}
                    · ${tr('ответов', 'жауап')}: ${m.answers}/${m.count} · 📝 ${m.texts} · 🖼 ${m.images || 0}
                    · ${m.strict === false ? tr('обычный режим', 'қалыпты режим') : '🔒 ' + tr('строгий', 'қатаң') + ' (' + (m.maxLeaves || 3) + ')'}
                    <br>${tr('Создан', 'Құрылды')}: ${escapeHtml(m.created || '')}${m.updated ? ' · ' + tr('изменён', 'өзгертілді') + ': ' + escapeHtml(m.updated) : ''}
                </div>
            </div>
            <div class="sv-actions">
                ${upload}
                <button class="sv-btn sv-btn-go" onclick="previewTeacherVariant('${id}')">👁 ${tr('Просмотр', 'Қарау')}</button>
                <button class="sv-btn sv-btn-edit" onclick="editTeacherVariant('${id}')">✏️ ${tr('Изменить', 'Өзгерту')}</button>
                <button class="sv-btn sv-btn-del" onclick="deleteTeacherVariant('${id}')" title="${escapeHtml(tr('Удалить', 'Өшіру'))}">🗑</button>
            </div>
        </div>`;
    }).join('');
}

function renderSavedVariants() {
    if (!CLOUD.on) { teacherCloudVariants = []; teacherVariantsNote = ''; drawSavedVariants(); return; }
    if (!teacherCloudVariants.length) teacherVariantsNote = tr('⏳ Загружаю варианты из общей базы…', '⏳ Ортақ базадағы нұсқалар жүктелуде…');
    drawSavedVariants();
    const who = currentTeacher;
    cloudIndex(true).then(list => {
        if (who !== currentTeacher) return;
        teacherCloudVariants = list.filter(v => v.teacher === currentTeacher);
        teacherVariantsNote = '';
    }).catch(e => {
        teacherVariantsNote = '⚠️ ' + cloudErrorText(e);
    }).then(() => { if (who === currentTeacher) drawSavedVariants(); });
}

// Учитель смотрит вариант глазами ученика (в режиме подготовки — без таймера и без записи результата)
function previewTeacherVariant(id) {
    const start = v => {
        ALL_ANSWERS[id] = v.answersHash || hashAnswerMap(id, v.answers);
        currentSubject = id;
        currentBaseSubject = ['math', 'phys'].includes(v.subject) ? v.subject : 'math';
        currentMode = 'prep';
        startQuiz();
    };
    const local = findLocalVariant(id);
    if (local) { start(local); return; }
    if (!CLOUD.on) return;
    cloudVariant(id).then(start).catch(e => uiAlert(cloudErrorText(e)));
}

function deleteTeacherVariant(id) {
    uiConfirm(tr('Удалить этот вариант? Ученики больше не увидят его.', 'Бұл нұсқаны өшіру керек пе? Оқушылар оны енді көрмейді.')).then(ok => {
        if (!ok) return;
        const done = () => { if (vcEditingId === id) clearVariantForm(); renderSavedVariants(); };
        if (findLocalVariant(id)) { removeLocalVariant(id); done(); return; }
        cloudDeleteVariant(id).then(() => {
            teacherCloudVariants = teacherCloudVariants.filter(v => v.id !== id);
            done();
        }).catch(e => uiAlert(tr('⚠️ Не удалось удалить. ', '⚠️ Өшіру мүмкін болмады. ') + cloudErrorText(e)));
    });
}

function loadAllTeacherVariants(teacher) {
    safeJSON('teacher_variants_' + teacher, []).forEach(v => { ALL_ANSWERS[v.id] = hashAnswerMap(v.id, v.answers); });
}
