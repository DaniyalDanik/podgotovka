// Кабинет учителя: результаты, создание вариантов
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
        card.textContent = '👩\u200d🏫 ' + name;
        card.onclick = () => teacherLogin(name);
        container.appendChild(card);
    });
}

function teacherLogin(name) {
    currentTeacher = name;
    document.getElementById('t-dash-title').textContent = '👩\u200d🏫 ' + name;
    showPage('teacher-dashboard-page');
    teacherRenderStats();
    teacherRenderTable();
    loadAllTeacherVariants(name);
    document.getElementById('tab-results').style.display = 'block';
    document.getElementById('tab-variants').style.display = 'none';
    document.getElementById('tab-results-btn').classList.add('active');
    document.getElementById('tab-variants-btn').classList.remove('active');
    clearInterval(teacherRefreshInterval);
    teacherRefreshInterval = setInterval(() => { teacherRenderStats(); teacherRenderTable(); }, 15000);
}

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
    document.getElementById('t-dash-sub').textContent = (translations[currentLang]['t-updated'] || 'Обновлено') + ': ' + new Date().toLocaleTimeString('ru-RU');
}

function teacherRenderTable() {
    const results = teacherGetResults();
    const search = (document.getElementById('t-search').value || '').toLowerCase();
    const gf = document.getElementById('t-grade-filter').value;
    let filtered = results.filter(r => {
        return r.name.toLowerCase().includes(search) && (gf ? r.grade == gf : true);
    }).reverse();

    const tbody = document.getElementById('t-results-body');
    const empty = document.getElementById('t-empty');
    if (filtered.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    const barColors = { 5: '#22c55e', 4: '#2A73E8', 3: '#f59e0b', 2: '#ef4444' };
    tbody.innerHTML = filtered.map((r, i) => `
        <tr>
            <td style="color:var(--text-gray);font-weight:600;">${i+1}</td>
            <td><b>${escapeHtml(r.name)}</b></td>
            <td style="color:var(--text-gray);font-size:12px;">${escapeHtml(r.topic || '—')}</td>
            <td><b>${Number(r.score)}/${Number(r.total)}</b> <span style="color:var(--text-gray)">(${Number(r.percent)}%)</span></td>
            <td><div class="pbar"><div class="pbar-fill" style="width:${Number(r.percent)}%;background:${barColors[r.grade]};"></div></div></td>
            <td><span class="grade-badge g${r.grade}">${r.grade}</span></td>
            <td style="color:var(--text-gray);font-size:11px;">${escapeHtml(r.date)}</td>
        </tr>
    `).join('');
}

function teacherClear() {
    const msg = (translations[currentLang]['t-confirm-clear'] || 'Удалить все результаты?') + ' (' + currentTeacher + ')';
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
    if (tab === 'variants') { buildVcGrid(); renderSavedVariants(); }
}

function buildVcGrid() {
    const grid = document.getElementById('vc-answers-grid');
    if (grid.children.length > 0) return;
    for (let i = 1; i <= 15; i++) {
        const div = document.createElement('div');
        div.className = 'vc-item';
        div.style.flexWrap = 'wrap';
        div.style.gap = '8px';
        const defaultType = i <= 10 ? 'test' : 'open';
        div.innerHTML = `
            <label>№${i}</label>
            <select id="vc-type${i}" onchange="toggleVcType(${i})" style="max-width:90px;font-size:12px;padding:6px 8px;">
                <option value="test" ${defaultType==='test'?'selected':''}>Тест</option>
                <option value="open" ${defaultType==='open'?'selected':''}>Ответ</option>
            </select>
            <div id="vc-q${i}-test" style="display:${defaultType==='test'?'flex':'none'};">
                <select id="vc-q${i}" style="min-width:70px;">
                    <option value="">—</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                </select>
            </div>
            <div id="vc-q${i}-open" style="display:${defaultType==='open'?'flex':'none'};">
                <input type="text" id="vc-q${i}-text" placeholder="Ответ..." style="min-width:100px;">
            </div>`;
        grid.appendChild(div);
    }
}

function toggleVcType(i) {
    const type = document.getElementById('vc-type' + i).value;
    document.getElementById('vc-q' + i + '-test').style.display = type === 'test' ? 'flex' : 'none';
    document.getElementById('vc-q' + i + '-open').style.display = type === 'open' ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('vc-images');
    if (input) {
input.addEventListener('change', function() {
    previewUploadedImages(this);
});
    }
});

function clearVariantForm() {
    document.getElementById('vc-name').value = '';
    document.getElementById('vc-subject').value = '';
    for (let i = 1; i <= 15; i++) {
        const sel = document.getElementById('vc-q' + i);
        if (sel) sel.value = '';
        const txt = document.getElementById('vc-q' + i + '-text');
        if (txt) txt.value = '';
    }
}

function renderSavedVariants() {
    const key = 'teacher_variants_' + currentTeacher;
    const variants = safeJSON(key, []);
    const container = document.getElementById('sv-cards');
    const empty = document.getElementById('sv-empty');
    if (variants.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    container.innerHTML = variants.map(v => `
        <div class="sv-card">
            <div class="sv-info">
                <div class="sv-name">📋 ${escapeHtml(v.name)}</div>
                <div class="sv-meta">
                    Предмет: ${escapeHtml(v.subject)} &nbsp;·&nbsp; Создан: ${escapeHtml(v.created)} &nbsp;·&nbsp;
                    Ответов: ${Object.values(v.answers).filter(a=>a).length}/15 &nbsp;·&nbsp;
                    🖼 Изображений: ${v.imageCount || 0}/15
                    ${v.imagePrefix ? '<br><code style="font-size:10px;color:#A855F7;">Префикс: ' + escapeHtml(v.imagePrefix) + 'N.png</code>' : ''}
                </div>
                <div class="sv-code-block" id="code-${v.id}">
                    <b>Код варианта (вставить в ALL_ANSWERS):</b><br><br>
                    <span style="color:#A855F7">"${v.id}"</span>: {
                        ${Object.entries(v.answers).map(([k,a]) => `<span style="color:#6EE7B7">${k}</span>:'<b>${escapeHtml(a||'?')}</b>'`).join(', ')}
                    }
                </div>
            </div>
            <div class="sv-actions">
                <button class="sv-btn" style="background:rgba(16,185,129,0.2);color:#6EE7B7;" onclick="loadVariantToQuiz('${escapeHtml(v.id)}')">▶ Запустить</button>
                <button class="sv-btn" style="background:rgba(244,63,94,0.2);color:#FDA4AF;" onclick="deleteTeacherVariant('${escapeHtml(v.id)}')">🗑</button>
            </div>
        </div>
    `).join('');
}

function toggleVcCode(id) {
    const el = document.getElementById('code-' + id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function loadVariantToQuiz(id) {
    const v = findVariantById(id);
    if (!v) return;
    ALL_ANSWERS[id] = hashAnswerMap(id, v.answers);
    currentSubject = id;
    currentBaseSubject = v.subject || 'math';
    currentMode = 'test';
    uiAlert('Вариант "' + v.name + '" загружен! Ученики могут проходить его через раздел тестов.');
}

function deleteTeacherVariant(id) {
    uiConfirm('Удалить этот вариант?').then(ok => {
        if (!ok) return;
        const key = 'teacher_variants_' + currentTeacher;
        const all = safeJSON(key, []);
        const gone = all.find(v => v.id === id);
        // чистим картинки удалённого варианта, чтобы не забивать память браузера
        if (gone && gone.imagePrefix) for (let i = 1; i <= 15; i++) localStorage.removeItem('img_' + gone.imagePrefix + i);
        localStorage.setItem(key, JSON.stringify(all.filter(v => v.id !== id)));
        renderSavedVariants();
    });
}

function loadAllTeacherVariants(teacher) {
    const key = 'teacher_variants_' + teacher;
    const variants = safeJSON(key, []);
    variants.forEach(v => { ALL_ANSWERS[v.id] = hashAnswerMap(v.id, v.answers); });
}

let uploadedImagesData = {};

function previewUploadedImages(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    const preview = document.getElementById('vc-img-preview');
    const namesDiv = document.getElementById('vc-img-names');
    const countSpan = document.getElementById('vc-img-count');

    const teacherSlug = (currentTeacher || 'teacher').replace(/\s+/g, '_');

    const freeSlots = [];
    for (let i = 1; i <= 15; i++) {
        if (!uploadedImagesData[i]) freeSlots.push(i);
    }

    if (freeSlots.length === 0) {
        uiAlert('Уже загружено 15 фото — максимум достигнут!');
        input.value = '';
        return;
    }

    const filesToAdd = files.slice(0, freeSlots.length);

    if (files.length > freeSlots.length) {
        uiAlert(`Можно добавить только ${freeSlots.length} фото. Остальные не загрузились.`);
    }

    filesToAdd.forEach((file, index) => {
        const qNum = freeSlots[index]; // номер закрепили заранее
        const uniqueName = `teacher_${teacherSlug}_q${qNum}`;
        const reader = new FileReader();

        reader.onload = (e) => {
            uploadedImagesData[qNum] = {
                name: uniqueName,
                dataUrl: e.target.result
            };

            rebuildPreview();
            updateUploadedImagesInfo();
        };

        reader.readAsDataURL(file);
    });

    input.value = '';
}

function rebuildPreview() {
    const preview = document.getElementById('vc-img-preview');
    preview.innerHTML = '';

    Object.entries(uploadedImagesData)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .forEach(([qNum, img]) => {
            const thumb = document.createElement('div');
            thumb.style.cssText = 'position:relative;width:80px;height:80px;border-radius:10px;overflow:hidden;border:2px solid rgba(168,85,247,0.4);flex-shrink:0;';
            thumb.innerHTML = `
                <img src="${img.dataUrl}" style="width:100%;height:100%;object-fit:cover;">
                <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);text-align:center;font-size:11px;color:white;padding:2px;font-weight:800;">№${qNum}</div>
                <button onclick="removeUploadedImage(${qNum})" style="position:absolute;top:2px;right:2px;background:rgba(244,63,94,0.85);border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;color:white;font-size:11px;line-height:18px;text-align:center;padding:0;">✕</button>
            `;
            preview.appendChild(thumb);
        });
}

function updateUploadedImagesInfo() {
    const countSpan = document.getElementById('vc-img-count');
    const namesDiv = document.getElementById('vc-img-names');

    const entries = Object.entries(uploadedImagesData)
        .sort((a, b) => Number(a[0]) - Number(b[0]));

    const total = entries.length;
    countSpan.textContent = total > 0 ? `${total} файл(ов) выбрано` : 'Не выбрано';

    namesDiv.innerHTML = total > 0
        ? '<b style="color:#E9D5FF;">📋 Имена файлов:</b><br>' +
        entries.map(([n, img]) => `<span style="color:#A855F7">№${n}:</span> ${escapeHtml(img.name)}.png`).join('<br>')
        : '';
}

function removeUploadedImage(qNum) {
    delete uploadedImagesData[qNum];
    rebuildPreview();
    updateUploadedImagesInfo();
}

function saveTeacherVariant() {
    const name = document.getElementById('vc-name').value.trim();
    const subject = document.getElementById('vc-subject').value.trim() || 'custom';
    if (!name) { uiAlert('Введите название варианта!'); return; }
    const answers = {};
    for (let i = 1; i <= 15; i++) {
        const typeEl = document.getElementById('vc-type' + i);
        const qType = typeEl ? typeEl.value : (i <= 10 ? 'test' : 'open');
        if (qType === 'test') {
            const el = document.getElementById('vc-q' + i);
            answers[i] = el ? el.value.trim().toUpperCase() : '';
        } else {
            const el = document.getElementById('vc-q' + i + '-text');
            answers[i] = el ? el.value.trim() : '';
        }
    }
    const filled = Object.values(answers).filter(v => v).length;
    if (filled < 5) { uiAlert('Заполните хотя бы 5 ответов!'); return; }
    const variantId = 'custom_' + Date.now();
    const teacherSlug = (currentTeacher || 'teacher').replace(/\s+/g, '_');
    const questionTypes = {};
    for (let i = 1; i <= 15; i++) {
        const typeEl = document.getElementById('vc-type' + i);
        questionTypes[i] = typeEl ? typeEl.value : (i <= 10 ? 'test' : 'open');
    }
    const images = {};
    let imgFail = 0;
    Object.entries(uploadedImagesData).forEach(([qNum, img]) => {
        const finalName = `teacher_${teacherSlug}_${variantId}_q${qNum}`;
        images[qNum] = { name: finalName, dataUrl: img.dataUrl };
        // сохранить фотки в моем localstorage
        try { localStorage.setItem('img_' + finalName, img.dataUrl); } catch(e) { imgFail++; }
    });

    const key = 'teacher_variants_' + currentTeacher;
    const variants = JSON.parse(localStorage.getItem(key) || '[]');
    variants.push({
        id: variantId, name, subject, answers, questionTypes, teacher: currentTeacher,
        created: new Date().toLocaleString('ru-RU'),
        imagePrefix: `teacher_${teacherSlug}_${variantId}_q`,
        hasImages: Object.keys(images).length > 0,
        imageCount: Object.keys(images).length
    });
    localStorage.setItem(key, JSON.stringify(variants));
    ALL_ANSWERS[variantId] = hashAnswerMap(variantId, answers);

    uiAlert('✅ Вариант "' + name + '" сохранён!' + (Object.keys(images).length > 0 ? ' Загружено изображений: ' + (Object.keys(images).length - imgFail) : '') + (imgFail ? '\n⚠️ Не удалось сохранить изображений: ' + imgFail + ' (память браузера заполнена).' : ''));
    clearVariantForm();
    uploadedImagesData = {};
    document.getElementById('vc-img-preview').innerHTML = '';
    document.getElementById('vc-img-names').innerHTML = '';
    document.getElementById('vc-img-count').textContent = 'Не выбрано';
    renderSavedVariants();
}
