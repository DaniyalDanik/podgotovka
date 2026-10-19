// Кабинет учителя: результаты, создание и редактирование вариантов
let currentTeacher = null;
let teacherRefreshInterval = null;

function checkTeacherCode() {
    const input = document.getElementById('teacher-code-input').value;
    if (teacherCodeHash(input) === TEACHER_CODE_HASH) {
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
    teacherRenderStats();
    teacherRenderTable();
    loadAllTeacherVariants(name);
    switchTeacherTab('results');
    clearInterval(teacherRefreshInterval);
    teacherRefreshInterval = setInterval(() => { teacherRenderStats(); teacherRenderTable(); }, 15000);
}

// Новые результаты из другой вкладки этого же браузера появляются сразу
window.addEventListener('storage', e => {
    if (currentTeacher && e.key === 'results_' + currentTeacher && isVisible('teacher-dashboard-page')) {
        teacherRenderStats(); teacherRenderTable();
    }
});

function teacherGetResults() {
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
    document.getElementById('t-dash-sub').textContent = translations[currentLang]['t-updated'] + ': ' + new Date().toLocaleTimeString('ru-RU');
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

function editTeacherVariant(id) {
    const v = findVariantById(id);
    if (!v) return;
    clearVariantForm();
    vcEditingId = id;
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
        const img = v.imagePrefix ? localStorage.getItem('img_' + v.imagePrefix + n) : null;
        if (img) { vcImages[n] = img; renderVcImage(n); }
    }
    setVcHeading();
    document.getElementById('variant-creator').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const key = 'teacher_variants_' + currentTeacher;
        const variants = safeJSON(key, []);
        const old = vcEditingId ? variants.find(v => v.id === vcEditingId) : null;
        const variantId = old ? old.id : 'custom_' + Date.now();
        const teacherSlug = (currentTeacher || 'teacher').replace(/\s+/g, '_');
        const imagePrefix = old && old.imagePrefix ? old.imagePrefix : `teacher_${teacherSlug}_${variantId}_q`;

        // картинки: сохраняем новые, удаляем убранные
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
        const questionTypes = {};
        Object.keys(questions).forEach(n => { questionTypes[n] = questions[n].type; });
        const timeMin = Math.max(1, Math.min(240, parseInt(document.getElementById('vc-time').value, 10) || 60));
        const strict = document.getElementById('vc-strict').checked;
        const maxLeaves = Math.max(1, Math.min(20, parseInt(document.getElementById('vc-max-leaves').value, 10) || 3));
        const data = {
            id: variantId, name: name, subject: document.getElementById('vc-subject').value,
            teacher: currentTeacher, count: vcCount, timeMin: timeMin, strict: strict, maxLeaves: maxLeaves,
            questions: questions, questionTypes: questionTypes, answers: answers,
            imagePrefix: imagePrefix, imageCount: imgCount, hasImages: imgCount > 0,
            created: old ? old.created : new Date().toLocaleString('ru-RU'),
            updated: old ? new Date().toLocaleString('ru-RU') : undefined
        };
        const list = old ? variants.map(v => v.id === variantId ? data : v) : variants.concat([data]);
        try { localStorage.setItem(key, JSON.stringify(list)); }
        catch (e) { uiAlert(tr('⚠️ Память браузера заполнена — вариант не сохранён. Удалите старые варианты или картинки.', '⚠️ Браузер жады толы — нұсқа сақталмады. Ескі нұсқаларды немесе суреттерді өшіріңіз.')); return; }
        ALL_ANSWERS[variantId] = hashAnswerMap(variantId, answers);

        uiAlert((old ? tr('✅ Вариант «' + name + '» обновлён!', '✅ «' + name + '» нұсқасы жаңартылды!')
                     : tr('✅ Вариант «' + name + '» сохранён!', '✅ «' + name + '» нұсқасы сақталды!')) +
            (imgFail ? '\n' + tr('⚠️ Не удалось сохранить картинок: ' + imgFail + ' (память браузера заполнена).',
                                  '⚠️ Сақталмаған суреттер: ' + imgFail + ' (браузер жады толы).') : ''));
        clearVariantForm();
        renderSavedVariants();
    };
    if (noContent.length) {
        uiConfirm(tr('В вопросах № ' + noContent.join(', ') + ' нет ни текста, ни картинки (например, если задания на бумаге). Сохранить так?',
                     '№ ' + noContent.join(', ') + ' сұрақтарында мәтін де, сурет те жоқ (мысалы, тапсырма қағазда болса). Осылай сақтау керек пе?'),
                  tr('Сохранить', 'Сақтау'), tr('Вернуться', 'Қайту')).then(ok => { if (ok) doSave(); });
    } else {
        doSave();
    }
}

function subjectLabel(s) {
    return s === 'math' ? t_('vc-subj-math') : s === 'phys' ? t_('vc-subj-phys') : t_('vc-subj-custom');
}

function renderSavedVariants() {
    const variants = safeJSON('teacher_variants_' + currentTeacher, []);
    const container = document.getElementById('sv-cards');
    const empty = document.getElementById('sv-empty');
    if (variants.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    container.innerHTML = variants.map(v => {
        const n = variantCount(v);
        const filled = Object.values(v.answers || {}).filter(a => a).length;
        const texts = v.questions ? Object.values(v.questions).filter(q => q && q.text).length : 0;
        const id = escapeHtml(v.id).replace(/'/g, '');
        return `
        <div class="sv-card">
            <div class="sv-info">
                <div class="sv-name">📋 ${escapeHtml(v.name)}</div>
                <div class="sv-meta">
                    ${escapeHtml(subjectLabel(v.subject))} · ${n} ${tr('вопр.', 'сұрақ')} · ⏱ ${variantMinutes(v)} ${tr('мин', 'мин')}
                    · ${tr('ответов', 'жауап')}: ${filled}/${n} · 📝 ${texts} · 🖼 ${v.imageCount || 0}
                    · ${v.strict === false ? tr('обычный режим', 'қалыпты режим') : '🔒 ' + tr('строгий', 'қатаң') + ' (' + (v.maxLeaves || 3) + ')'}
                    <br>${tr('Создан', 'Құрылды')}: ${escapeHtml(v.created || '')}${v.updated ? ' · ' + tr('изменён', 'өзгертілді') + ': ' + escapeHtml(v.updated) : ''}
                </div>
            </div>
            <div class="sv-actions">
                <button class="sv-btn sv-btn-go" onclick="previewTeacherVariant('${id}')">👁 ${tr('Просмотр', 'Қарау')}</button>
                <button class="sv-btn sv-btn-edit" onclick="editTeacherVariant('${id}')">✏️ ${tr('Изменить', 'Өзгерту')}</button>
                <button class="sv-btn sv-btn-del" onclick="deleteTeacherVariant('${id}')" title="${escapeHtml(tr('Удалить', 'Өшіру'))}">🗑</button>
            </div>
        </div>`;
    }).join('');
}

// Учитель смотрит вариант глазами ученика (в режиме подготовки — без таймера и без записи результата)
function previewTeacherVariant(id) {
    const v = findVariantById(id);
    if (!v) return;
    ALL_ANSWERS[id] = hashAnswerMap(id, v.answers);
    currentSubject = id;
    currentBaseSubject = ['math', 'phys'].includes(v.subject) ? v.subject : 'math';
    currentMode = 'prep';
    startQuiz();
}

function deleteTeacherVariant(id) {
    uiConfirm(tr('Удалить этот вариант?', 'Бұл нұсқаны өшіру керек пе?')).then(ok => {
        if (!ok) return;
        const key = 'teacher_variants_' + currentTeacher;
        const all = safeJSON(key, []);
        const gone = all.find(v => v.id === id);
        // чистим картинки удалённого варианта, чтобы не забивать память браузера
        if (gone && gone.imagePrefix) for (let i = 1; i <= VC_MAX; i++) localStorage.removeItem('img_' + gone.imagePrefix + i);
        localStorage.setItem(key, JSON.stringify(all.filter(v => v.id !== id)));
        if (vcEditingId === id) clearVariantForm();
        renderSavedVariants();
    });
}

function loadAllTeacherVariants(teacher) {
    safeJSON('teacher_variants_' + teacher, []).forEach(v => { ALL_ANSWERS[v.id] = hashAnswerMap(v.id, v.answers); });
}
