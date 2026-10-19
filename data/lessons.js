// Содержимое уроков
const LESSON_CONTENT = {
    ru: {
        3: `<h2>💸 Что такое проценты?</h2>
            <p><b>Процент (%)</b> — это одна сотая часть числа.</p>
            <div class="lesson-box">1% = 1/100</div>
            <h3>📌 Как считать?</h3>
            <div class="lesson-box">Число × процент</div>
            <p>Пример: 10% от 700000 = 700000 × 0.1 = 70000</p>
            <h3>📈 Сложные проценты</h3>
            <div class="lesson-box">S = P × (1 + p)^n</div>
            <p>700000 × (1.1)^2 = <b>847000</b></p>
            <div class="lesson-tasks">
                <p>1. 20% от 500 = <input id="l3-ans-1" class="lesson-input"></p>
                <p>2. 10% от 3000 = <input id="l3-ans-2" class="lesson-input"></p>
                <p>3. 1000 под 10% на 1 год = <input id="l3-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(3)">Проверить</button>`,

        4: `<h2>📊 Что такое неравенства?</h2>
            <p><b>Неравенство</b> — это когда числа не равны:</p>
            <div class="lesson-box">> больше<br>&lt; меньше<br>≥ больше или равно<br>≤ меньше или равно</div>
            <h3>📌 Главное правило</h3>
            <div class="lesson-box">Если умножаешь или делишь на отрицательное число → знак меняется!</div>
            <h3>🧠 Примеры</h3>
            <p>1) x + 3 > 5 → x > 2</p><p>2) 2x &lt; 10 → x &lt; 5</p><p>3) -2x > 6 → x &lt; -3 (знак поменяли!)</p>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. x + 5 > 10 → x > <input id="l4-ans-1" class="lesson-input"></p>
                <p>2. 3x &lt; 12 → x &lt; <input id="l4-ans-2" class="lesson-input"></p>
                <p>3. -2x > 8 → x &lt; <input id="l4-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(4)">Проверить</button>`,

        5: `<h2>📘 Теорема Виета (очень просто)</h2>
            <p>Есть квадратное уравнение:</p>
            <div class="lesson-box">x² + bx + c = 0</div>
            <h3>📌 Формулы Виета:</h3>
            <div class="lesson-box">x₁ + x₂ = -b<br>x₁ · x₂ = c</div>
            <p>👉 То есть:</p><ul><li>сумма корней = -b</li><li>произведение = c</li></ul>
            <h3>🧠 Пример:</h3>
            <p>x² - 5x + 6 = 0 → x₁ + x₂ = 5, x₁ · x₂ = 6 → <b>Ответ: 2 и 3</b></p>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. x² - 7x + 10 → корни: <input id="l5-ans-1" class="lesson-input"></p>
                <p>2. x² - 6x + 9 → корни: <input id="l5-ans-2" class="lesson-input"></p>
                <p>3. x² - 5x + 6 → корни: <input id="l5-ans-3" class="lesson-input"></p>
            </div>
            <p style="font-size:14px;color:gray;">Пиши корни через запятую: например 2,3 (порядок не важен)</p>
            <button class="btn" style="background:green;" onclick="checkLesson(5)">Проверить</button>`,

        6: `<h2>📈 Квадратная функция (график)</h2>
            <p>Функция выглядит так:</p>
            <div class="lesson-box">y = ax² + bx + c</div>
            <h3>📌 Как определить знаки?</h3>
            <ul><li><b>a</b> — направление ветвей: вверх → a > 0, вниз → a &lt; 0</li>
            <li><b>c</b> — пересечение с осью Y: выше 0 → c > 0, ниже 0 → c &lt; 0</li>
            <li><b>b</b> — куда смещена вершина: вправо → b &lt; 0, влево → b > 0</li></ul>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. Ветви вверх → a <input id="l6-ans-1" class="lesson-input"></p>
                <p>2. Пересечение выше 0 → c <input id="l6-ans-2" class="lesson-input"></p>
                <p>3. Вершина слева → b <input id="l6-ans-3" class="lesson-input"></p>
            </div>
            <p style="font-size:14px;">Пиши: &gt;0 или &lt;0</p>
            <button class="btn" style="background:green;" onclick="checkLesson(6)">Проверить</button>`,

        7: `<h2>🚤 Скорость в воде (лодка и течение)</h2>
            <p>Есть 3 скорости:</p>
            <div class="lesson-box">v<sub>собств</sub> — скорость лодки в стоячей воде<br>v<sub>теч</sub> — скорость течения</div>
            <h3>📌 Формулы:</h3>
            <div class="lesson-box">По течению: v = v<sub>собств</sub> + v<sub>теч</sub><br>Против течения: v = v<sub>собств</sub> - v<sub>теч</sub></div>
            <h3>🧠 Пример:</h3>
            <p>Лодка: 10 км/ч, течение: 2 км/ч → По течению: 12, Против: 8</p>
            <div class="lesson-box">t = s / v</div>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. 15 км/ч и 3 км/ч → по течению = <input id="l7-ans-1" class="lesson-input"></p>
                <p>2. 15 км/ч и 3 км/ч → против = <input id="l7-ans-2" class="lesson-input"></p>
                <p>3. 24 км путь, скорость 12 → время = <input id="l7-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(7)">Проверить</button>`,

        8: `<h2>🧩 Системы неравенств</h2>
            <p><b>Система неравенств</b> — это несколько неравенств, которые должны выполняться <b>одновременно</b>. Записывается с фигурной скобкой.</p>
            <div class="lesson-box">{ x > 2<br>{ x &lt; 7 &nbsp;&nbsp;→&nbsp;&nbsp; 2 &lt; x &lt; 7</div>
            <h3>📌 Как решать</h3>
            <div class="lesson-box">1) Реши каждое неравенство отдельно<br>2) Нарисуй оба ответа на одной числовой прямой<br>3) Ответ — <b>общая часть</b> (пересечение)</div>
            <h3>🧠 Примеры</h3>
            <p>1) { x + 1 > 3, x − 4 &lt; 1 } → x > 2 и x &lt; 5 → <b>2 &lt; x &lt; 5</b>. Целые решения: 3, 4 (их 2).</p>
            <p>2) { 3x ≥ 6, x ≤ 4 } → x ≥ 2 и x ≤ 4 → <b>2 ≤ x ≤ 4</b>. Скобка квадратная: 2 и 4 входят.</p>
            <p>3) { x > 5, x &lt; 1 } → общей части нет → <b>решений нет</b>.</p>
            <div class="lesson-box">Строгий знак (&gt;, &lt;) — точка «пустая», число не входит.<br>Нестрогий (≥, ≤) — точка «закрашена», число входит.</div>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. { x + 1 > 4, x − 2 &lt; 5 } → сколько целых решений? <input id="l8-ans-1" class="lesson-input"></p>
                <p>2. { 2x ≥ 6, x ≤ 5 } → наименьшее целое решение = <input id="l8-ans-2" class="lesson-input"></p>
                <p>3. { x > 4, x &lt; 1 } → сколько решений? <input id="l8-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(8)">Проверить</button>`,

        9: `<h2>🎲 Комбинаторика (очень просто)</h2>
            <h3>📌 1. Правило умножения</h3>
            <div class="lesson-box">Если есть выборы: a способов и b способов → всего a × b</div>
            <p>Пример: 3 кофты и 2 штаны → 3 × 2 = <b>6</b></p>
            <h3>📌 2. Перестановки</h3>
            <div class="lesson-box">n! = 1 × 2 × 3 × ... × n</div>
            <h3>📌 3. Сочетания</h3>
            <div class="lesson-box">C = n! / (k!(n-k)!)</div>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. 3 кофты и 4 штаны → <input id="l9-ans-1" class="lesson-input"></p>
                <p>2. 4! = <input id="l9-ans-2" class="lesson-input"></p>
                <p>3. C(5,2) = <input id="l9-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(9)">Проверить</button>`,

        10: `<h2>📊 Дисперсия (очень просто)</h2>
            <p>Дисперсия показывает, насколько числа разбросаны</p>
            <h3>📌 Формула:</h3>
            <div class="lesson-box">D = среднее из (x - среднее)²</div>
            <h3>🧠 Пример: числа 2, 4, 6 → Среднее = 4 → D = (4+0+4)/3 = <b>2.67</b></h3>
            <h3>🏋️ Попробуй сам:</h3>
            <div class="lesson-tasks">
                <p>1. Среднее чисел 1,3,5 = <input id="l10-ans-1" class="lesson-input"></p>
                <p>2. (1-3)² = <input id="l10-ans-2" class="lesson-input"></p>
                <p>3. Дисперсия ≈ <input id="l10-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(10)">Проверить</button>`,

        11: `<h2>🔬 Стандартный вид числа</h2>
            <p>Запись вида:</p>
            <div class="lesson-box">a × 10ⁿ, где 1 ≤ a &lt; 10</div>
            <h3>🧠 Примеры:</h3>
            <p>1000 = 1 × 10³ &nbsp;&nbsp; 0.01 = 1 × 10⁻²</p>
            <h3>🏋️ Практика:</h3>
            <div class="lesson-tasks">
                <p>1. 10000 = <input id="l11-ans-1" class="lesson-input"></p>
                <p>2. 0.001 = <input id="l11-ans-2" class="lesson-input"></p>
                <p>3. 5300 = <input id="l11-ans-3" class="lesson-input"></p>
            </div>
            <p style="font-size:14px;">Пиши: 5.3×10³</p>
            <button class="btn" style="background:green;" onclick="checkLesson(11)">Проверить</button>`,

        12: `<h2>🧠 Упрощение выражений</h2>
            <h3>📌 Правила:</h3>
            <div class="lesson-box">1) Скобки раскрываем<br>2) Похожие складываем<br>3) Сокращаем дроби</div>
            <h3>🧠 Примеры:</h3>
            <p>2(x + 3) = 2x + 6 &nbsp; | &nbsp; x + 2x = 3x &nbsp; | &nbsp; 6x / 3 = 2x</p>
            <h3>🏋️ Практика:</h3>
            <div class="lesson-tasks">
                <p>1. 2(x+4) = <input id="l12-ans-1" class="lesson-input"></p>
                <p>2. 3x + 2x = <input id="l12-ans-2" class="lesson-input"></p>
                <p>3. 10x / 5 = <input id="l12-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(12)">Проверить</button>`,

        13: `<h2>📈 Геометрическая прогрессия</h2>
            <p>Последовательность, где каждый раз умножаем на число q</p>
            <div class="lesson-box">aₙ = a₁ × qⁿ⁻¹</div>
            <h3>📌 Сумма:</h3>
            <div class="lesson-box">S = a₁(qⁿ - 1) / (q - 1)</div>
            <h3>🧠 Пример: 2, 4, 8, 16 → q = 2</h3>
            <h3>🏋️ Практика:</h3>
            <div class="lesson-tasks">
                <p>1. 3, 6, 12 → q = <input id="l13-ans-1" class="lesson-input"></p>
                <p>2. a₁=2, q=2, n=3 → aₙ = <input id="l13-ans-2" class="lesson-input"></p>
                <p>3. 2,4,8 → сумма = <input id="l13-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(13)">Проверить</button>`,

        14: `<h2>📘 Бином Ньютона</h2>
            <div class="lesson-box">(a+b)² = a² + 2ab + b²<br>(a+b)³ = a³ + 3a²b + 3ab² + b³</div>
            <h3>📌 Формула:</h3>
            <div class="lesson-box">(a+b)^n = C(n,k) · a^(n-k) · b^k</div>
            <h3>🧠 Пример: (x+1)² = x² + 2x + 1</h3>
            <h3>🏋️ Практика:</h3>
            <div class="lesson-tasks">
                <p>1. (x+1)² = <input id="l14-ans-1" class="lesson-input"></p>
                <p>2. (x+2)² = <input id="l14-ans-2" class="lesson-input"></p>
                <p>3. (x+1)³ = <input id="l14-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(14)">Проверить</button>`,

        15: `<h2>📐 Тригонометрия (база)</h2>
            <h3>📌 Основные значения:</h3>
            <div class="lesson-box">sin 30° = 1/2<br>cos 60° = 1/2<br>sin 90° = 1<br>cos 0° = 1</div>
            <h3>📌 Формулы:</h3>
            <div class="lesson-box">sin²x + cos²x = 1</div>
            <h3>🏋️ Практика:</h3>
            <div class="lesson-tasks">
                <p>1. sin 30° = <input id="l15-ans-1" class="lesson-input"></p>
                <p>2. cos 60° = <input id="l15-ans-2" class="lesson-input"></p>
                <p>3. sin²x + cos²x = <input id="l15-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(15)">Проверить</button>`
    },
    kk: {
        3: `<h2>💸 Пайыз дегеніміз не?</h2>
            <p><b>Пайыз (%)</b> — бұл санның жүзден бір бөлігі.</p>
            <div class="lesson-box">1% = 1/100</div>
            <h3>📌 Қалай есептейді?</h3>
            <div class="lesson-box">Сан × пайыз</div>
            <p>Мысал: 700000-ның 10% = 700000 × 0.1 = 70000</p>
            <h3>📈 Күрделі пайыз</h3>
            <div class="lesson-box">S = P × (1 + p)^n</div>
            <p>700000 × (1.1)^2 = <b>847000</b></p>
            <div class="lesson-tasks">
                <p>1. 500-дің 20% = <input id="l3-ans-1" class="lesson-input"></p>
                <p>2. 3000-ның 10% = <input id="l3-ans-2" class="lesson-input"></p>
                <p>3. 1000, жылдық 10%, 1 жылдан кейін = <input id="l3-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(3)">Тексеру</button>`,

        4: `<h2>📊 Теңсіздік дегеніміз не?</h2>
            <p><b>Теңсіздік</b> — сандар тең емес кезде:</p>
            <div class="lesson-box">> үлкен<br>&lt; кіші<br>≥ үлкен немесе тең<br>≤ кіші немесе тең</div>
            <h3>📌 Басты ереже</h3>
            <div class="lesson-box">Теріс санға көбейтсек немесе бөлсек → белгі өзгереді!</div>
            <h3>🧠 Мысалдар</h3>
            <p>1) x + 3 > 5 → x > 2</p><p>2) 2x &lt; 10 → x &lt; 5</p><p>3) -2x > 6 → x &lt; -3</p>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. x + 5 > 10 → x > <input id="l4-ans-1" class="lesson-input"></p>
                <p>2. 3x &lt; 12 → x &lt; <input id="l4-ans-2" class="lesson-input"></p>
                <p>3. -2x > 8 → x &lt; <input id="l4-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(4)">Тексеру</button>`,

        5: `<h2>📘 Виет теоремасы (өте қарапайым)</h2>
            <p>Квадрат теңдеу бар:</p>
            <div class="lesson-box">x² + bx + c = 0</div>
            <h3>📌 Виет формулалары:</h3>
            <div class="lesson-box">x₁ + x₂ = -b<br>x₁ · x₂ = c</div>
            <p>👉 Яғни:</p><ul><li>түбірлер қосындысы = -b</li><li>көбейтіндісі = c</li></ul>
            <h3>🧠 Мысал:</h3>
            <p>x² - 5x + 6 = 0 → x₁ + x₂ = 5, x₁ · x₂ = 6 → <b>Жауап: 2 және 3</b></p>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. x² - 7x + 10 → түбірлер: <input id="l5-ans-1" class="lesson-input"></p>
                <p>2. x² - 6x + 9 → түбірлер: <input id="l5-ans-2" class="lesson-input"></p>
                <p>3. x² - 5x + 6 → түбірлер: <input id="l5-ans-3" class="lesson-input"></p>
            </div>
            <p style="font-size:14px;color:gray;">Түбірлерді үтірмен жаз: мысалы 2,3 (реті маңызды емес)</p>
            <button class="btn" style="background:green;" onclick="checkLesson(5)">Тексеру</button>`,

        6: `<h2>📈 Квадрат функция (график)</h2>
            <p>Функция осылай жазылады:</p>
            <div class="lesson-box">y = ax² + bx + c</div>
            <h3>📌 Белгілерді қалай анықтайды?</h3>
            <ul><li><b>a</b> — тармақтар бағыты: жоғары → a > 0, төмен → a &lt; 0</li>
            <li><b>c</b> — Y осімен қиылысу: 0-ден жоғары → c > 0, төмен → c &lt; 0</li>
            <li><b>b</b> — төбенің ығысуы: оңға → b &lt; 0, солға → b > 0</li></ul>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. Тармақтар жоғары → a <input id="l6-ans-1" class="lesson-input"></p>
                <p>2. Қиылысу 0-ден жоғары → c <input id="l6-ans-2" class="lesson-input"></p>
                <p>3. Төбе солда → b <input id="l6-ans-3" class="lesson-input"></p>
            </div>
            <p style="font-size:14px;">&gt;0 немесе &lt;0 деп жаз</p>
            <button class="btn" style="background:green;" onclick="checkLesson(6)">Тексеру</button>`,

        7: `<h2>🚤 Судағы жылдамдық (қайық және ағыс)</h2>
            <p>3 жылдамдық бар:</p>
            <div class="lesson-box">v<sub>меншікті</sub> — тыныш судағы жылдамдық<br>v<sub>ағыс</sub> — ағыс жылдамдығы</div>
            <h3>📌 Формулалар:</h3>
            <div class="lesson-box">Ағыспен: v = v<sub>меншікті</sub> + v<sub>ағыс</sub><br>Ағысқа қарсы: v = v<sub>меншікті</sub> - v<sub>ағыс</sub></div>
            <h3>🧠 Мысал:</h3>
            <p>Қайық: 10 км/сағ, ағыс: 2 км/сағ → Ағыспен: 12, Қарсы: 8</p>
            <div class="lesson-box">t = s / v</div>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. 15 км/сағ және 3 км/сағ → ағыспен = <input id="l7-ans-1" class="lesson-input"></p>
                <p>2. 15 км/сағ және 3 км/сағ → қарсы = <input id="l7-ans-2" class="lesson-input"></p>
                <p>3. 24 км жол, жылдамдық 12 → уақыт = <input id="l7-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(7)">Тексеру</button>`,

        8: `<h2>🧩 Теңсіздіктер жүйесі</h2>
            <p><b>Теңсіздіктер жүйесі</b> — бір мезгілде <b>бірге</b> орындалуы керек бірнеше теңсіздік. Фигуралық жақшамен жазылады.</p>
            <div class="lesson-box">{ x > 2<br>{ x &lt; 7 &nbsp;&nbsp;→&nbsp;&nbsp; 2 &lt; x &lt; 7</div>
            <h3>📌 Қалай шығарамыз</h3>
            <div class="lesson-box">1) Әр теңсіздікті жеке шеш<br>2) Екі жауапты бір сан түзуіне сыз<br>3) Жауап — <b>ортақ бөлік</b> (қиылысу)</div>
            <h3>🧠 Мысалдар</h3>
            <p>1) { x + 1 > 3, x − 4 &lt; 1 } → x > 2 және x &lt; 5 → <b>2 &lt; x &lt; 5</b>. Бүтін шешімдер: 3, 4 (2 шешім).</p>
            <p>2) { 3x ≥ 6, x ≤ 4 } → x ≥ 2 және x ≤ 4 → <b>2 ≤ x ≤ 4</b>. Жақша квадрат: 2 мен 4 кіреді.</p>
            <p>3) { x > 5, x &lt; 1 } → ортақ бөлік жоқ → <b>шешімі жоқ</b>.</p>
            <div class="lesson-box">Қатаң белгі (&gt;, &lt;) — нүкте «бос», сан кірмейді.<br>Қатаң емес (≥, ≤) — нүкте «боялған», сан кіреді.</div>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. { x + 1 > 4, x − 2 &lt; 5 } → неше бүтін шешім бар? <input id="l8-ans-1" class="lesson-input"></p>
                <p>2. { 2x ≥ 6, x ≤ 5 } → ең кіші бүтін шешім = <input id="l8-ans-2" class="lesson-input"></p>
                <p>3. { x > 4, x &lt; 1 } → неше шешім бар? <input id="l8-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(8)">Тексеру</button>`,

        9: `<h2>🎲 Комбинаторика (өте қарапайым)</h2>
            <h3>📌 1. Көбейту ережесі</h3>
            <div class="lesson-box">a тәсіл және b тәсіл болса → барлығы a × b</div>
            <p>Мысал: 3 свитер және 2 шалбар → 3 × 2 = <b>6</b></p>
            <h3>📌 2. Ауыстырулар</h3>
            <div class="lesson-box">n! = 1 × 2 × 3 × ... × n</div>
            <h3>📌 3. Таңдаулар</h3>
            <div class="lesson-box">C = n! / (k!(n-k)!)</div>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. 3 свитер және 4 шалбар → <input id="l9-ans-1" class="lesson-input"></p>
                <p>2. 4! = <input id="l9-ans-2" class="lesson-input"></p>
                <p>3. C(5,2) = <input id="l9-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(9)">Тексеру</button>`,

        10: `<h2>📊 Дисперсия (өте қарапайым)</h2>
            <p>Дисперсия сандардың шашырауын көрсетеді</p>
            <h3>📌 Формула:</h3>
            <div class="lesson-box">D = (x - орташа)² орташасы</div>
            <h3>🧠 Мысал: 2, 4, 6 → Орташа = 4 → D = (4+0+4)/3 = <b>2.67</b></h3>
            <h3>🏋️ Өзің байқа:</h3>
            <div class="lesson-tasks">
                <p>1. 1,3,5 сандарының орташасы = <input id="l10-ans-1" class="lesson-input"></p>
                <p>2. (1-3)² = <input id="l10-ans-2" class="lesson-input"></p>
                <p>3. Дисперсия ≈ <input id="l10-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(10)">Тексеру</button>`,

        11: `<h2>🔬 Санның стандарт түрі</h2>
            <p>Жазылу түрі:</p>
            <div class="lesson-box">a × 10ⁿ, мұндағы 1 ≤ a &lt; 10</div>
            <h3>🧠 Мысалдар:</h3>
            <p>1000 = 1 × 10³ &nbsp;&nbsp; 0.01 = 1 × 10⁻²</p>
            <h3>🏋️ Тәжірибе:</h3>
            <div class="lesson-tasks">
                <p>1. 10000 = <input id="l11-ans-1" class="lesson-input"></p>
                <p>2. 0.001 = <input id="l11-ans-2" class="lesson-input"></p>
                <p>3. 5300 = <input id="l11-ans-3" class="lesson-input"></p>
            </div>
            <p style="font-size:14px;">Жаз: 5.3×10³</p>
            <button class="btn" style="background:green;" onclick="checkLesson(11)">Тексеру</button>`,

        12: `<h2>🧠 Өрнектерді жеңілдету</h2>
            <h3>📌 Ережелер:</h3>
            <div class="lesson-box">1) Жақшаны ашамыз<br>2) Ұқсас мүшелерді қосамыз<br>3) Бөлшекті қысқартамыз</div>
            <h3>🧠 Мысалдар:</h3>
            <p>2(x + 3) = 2x + 6 &nbsp; | &nbsp; x + 2x = 3x &nbsp; | &nbsp; 6x / 3 = 2x</p>
            <h3>🏋️ Тәжірибе:</h3>
            <div class="lesson-tasks">
                <p>1. 2(x+4) = <input id="l12-ans-1" class="lesson-input"></p>
                <p>2. 3x + 2x = <input id="l12-ans-2" class="lesson-input"></p>
                <p>3. 10x / 5 = <input id="l12-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(12)">Тексеру</button>`,

        13: `<h2>📈 Геометриялық прогрессия</h2>
            <p>Әр мүшені q санына көбейтетін тізбек</p>
            <div class="lesson-box">aₙ = a₁ × qⁿ⁻¹</div>
            <h3>📌 Қосынды:</h3>
            <div class="lesson-box">S = a₁(qⁿ - 1) / (q - 1)</div>
            <h3>🧠 Мысал: 2, 4, 8, 16 → q = 2</h3>
            <h3>🏋️ Тәжірибе:</h3>
            <div class="lesson-tasks">
                <p>1. 3, 6, 12 → q = <input id="l13-ans-1" class="lesson-input"></p>
                <p>2. a₁=2, q=2, n=3 → aₙ = <input id="l13-ans-2" class="lesson-input"></p>
                <p>3. 2,4,8 → қосынды = <input id="l13-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(13)">Тексеру</button>`,

        14: `<h2>📘 Ньютон биномы</h2>
            <div class="lesson-box">(a+b)² = a² + 2ab + b²<br>(a+b)³ = a³ + 3a²b + 3ab² + b³</div>
            <h3>📌 Формула:</h3>
            <div class="lesson-box">(a+b)^n = C(n,k) · a^(n-k) · b^k</div>
            <h3>🧠 Мысал: (x+1)² = x² + 2x + 1</h3>
            <h3>🏋️ Тәжірибе:</h3>
            <div class="lesson-tasks">
                <p>1. (x+1)² = <input id="l14-ans-1" class="lesson-input"></p>
                <p>2. (x+2)² = <input id="l14-ans-2" class="lesson-input"></p>
                <p>3. (x+1)³ = <input id="l14-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(14)">Тексеру</button>`,

        15: `<h2>📐 Тригонометрия (база)</h2>
            <h3>📌 Негізгі мәндер:</h3>
            <div class="lesson-box">sin 30° = 1/2<br>cos 60° = 1/2<br>sin 90° = 1<br>cos 0° = 1</div>
            <h3>📌 Формулалар:</h3>
            <div class="lesson-box">sin²x + cos²x = 1</div>
            <h3>🏋️ Тәжірибе:</h3>
            <div class="lesson-tasks">
                <p>1. sin 30° = <input id="l15-ans-1" class="lesson-input"></p>
                <p>2. cos 60° = <input id="l15-ans-2" class="lesson-input"></p>
                <p>3. sin²x + cos²x = <input id="l15-ans-3" class="lesson-input"></p>
            </div>
            <button class="btn" style="background:green;" onclick="checkLesson(15)">Тексеру</button>`
    }
};
