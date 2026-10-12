// Справочник формул (модальное окно «Повторить формулы»)
const FORMULAS_DB_RU = {
    short_mult: `
        <div class="formula-box">a² - b² = (a - b)(a + b)</div>
        <div class="formula-box">(a + b)² = a² + 2ab + b²</div>
        <div class="formula-box">(a - b)² = a² - 2ab + b²</div>
        <div class="formula-box">a³ + b³ = (a + b)(a² - ab + b²)</div>
        <div class="formula-box">a³ - b³ = (a - b)(a² + ab + b²)</div>
        <div class="formula-box">(a + b)³ = a³ + 3a²b + 3ab² + b³</div>
        <div class="formula-box">(a - b)³ = a³ - 3a²b + 3ab² - b³</div>
    `,
    trig: `
        <h3 class="formula-section-title">Важные моменты</h3>
        <div class="formula-box">sin90 = 1</div>
        <div class="formula-box">cos90 = 0</div>
        <div class="formula-box">tg90 = нету</div>
        <div class="formula-box">ctg90 = 0</div>
        <div class="formula-box">sin0 = 0</div>
        <div class="formula-box">cos0 = 1</div>
        <div class="formula-box">tg0 = 0</div>
        <div class="formula-box">ctg0 = нету</div>

        <h3 class="formula-section-title">Основное тождество</h3>
        <div class="formula-box">sin²α + cos²α = 1</div>
        <div class="formula-box">tg²α + 1 = <span class="frac"><span class="num">1</span><span class="den">cos²α</span></span></div>
        <div class="formula-box">ctg²α + 1 = <span class="frac"><span class="num">1</span><span class="den">sin²α</span></span></div>
        
        <h3 class="formula-section-title">Формулы сложения</h3>
        <div class="formula-box">sin(α ± β) = sin α cos β ± cos α sin β</div>
        <div class="formula-box">cos(α ± β) = cos α cos β ∓ sin α sin β</div>

        <h3 class="formula-section-title">Двойной угол</h3>
        <div class="formula-box">sin 2α = 2 sin α cos α</div>
        <div class="formula-box">cos 2α = cos²α - sin²α</div>
        <div class="formula-box">cos 2α = 2 cos²α - 1</div>
        <div class="formula-box">cos 2α = 1 - 2 sin²α</div>

        <h3 class="formula-section-title">Понижение степени</h3>
        <div class="formula-box">cos²α = <span class="frac"><span class="num">1 + cos 2α</span><span class="den">2</span></span></div>
        <div class="formula-box">sin²α = <span class="frac"><span class="num">1 - cos 2α</span><span class="den">2</span></span></div>

        <h3 class="formula-section-title">Суммы и произведения тригонометрических функций</h3>
        <div class="formula-box">sin α + sin β = 2 sin <span class="frac"><span class="num">α + β</span><span class="den">2</span></span> cos <span class="frac"><span class="num">α - β</span><span class="den">2</span></span></div>
        <div class="formula-box">sin α - sin β = 2 sin <span class="frac"><span class="num">α - β</span><span class="den">2</span></span> cos <span class="frac"><span class="num">α + β</span><span class="den">2</span></span></div>
        <div class="formula-box">cos α + cos β = 2 cos <span class="frac"><span class="num">α + β</span><span class="den">2</span></span> cos <span class="frac"><span class="num">α - β</span><span class="den">2</span></span></div>
        <div class="formula-box">cos α - cos β = -2 sin <span class="frac"><span class="num">α + β</span><span class="den">2</span></span> sin <span class="frac"><span class="num">α - β</span><span class="den">2</span></span></div>
        <div class="formula-box">sin α cos β = <span class="frac"><span class="num">1</span><span class="den">2</span></span>(sin(α + β) + sin(α - β))</div>
        <div class="formula-box">cos α cos β = <span class="frac"><span class="num">1</span><span class="den">2</span></span>(cos(α + β) + cos(α - β))</div>
        <div class="formula-box">sin α sin β = <span class="frac"><span class="num">1</span><span class="den">2</span></span>(cos(α - β) - cos(α + β))</div>
    `,
    info: `
        <h3 class="formula-section-title">Системы счисления</h3>
        <div class="formula-box">2 бита → 4 значения (2²)</div>
        <div class="formula-box">8 бит = 1 байт</div>
        <div class="formula-box">1 Кбайт = 1024 байт = 2¹⁰ байт</div>
        <div class="formula-box">1 Мбайт = 1024 Кбайт = 2²⁰ байт</div>
        <div class="formula-box">1 Гбайт = 1024 Мбайт = 2³⁰ байт</div>

        <h3 class="formula-section-title">Количество информации</h3>
        <div class="formula-box">N = 2<sup>i</sup> &nbsp;→&nbsp; i = log₂N</div>
        <div class="formula-box">N — количество событий, i — количество бит</div>

        <h3 class="formula-section-title">Скорость передачи данных</h3>
        <div class="formula-box">V = <span class="frac"><span class="num">Q</span><span class="den">t</span></span> &nbsp; (бит/с)</div>
        <div class="formula-box">Q — объём данных (бит), t — время (с)</div>

        <h3 class="formula-section-title">Логические операции</h3>
        <div class="formula-box">НЕ (инверсия): ¬A &nbsp;|&nbsp; 0→1, 1→0</div>
        <div class="formula-box">И (конъюнкция): A ∧ B = 1, только если оба 1</div>
        <div class="formula-box">ИЛИ (дизъюнкция): A ∨ B = 0, только если оба 0</div>
        <div class="formula-box">XOR (исключающее ИЛИ): A ⊕ B = 1, если разные</div>

        <h3 class="formula-section-title">Перевод в двоичную</h3>
        <div class="formula-box">Делить на 2 → записывать остатки снизу вверх</div>
        <div class="formula-box">10 → 2: 10÷2=5(0), 5÷2=2(1), 2÷2=1(0), 1÷2=0(1) → 1010</div>

        <h3 class="formula-section-title">Алгоритмы — сложность</h3>
        <div class="formula-box">Линейный поиск: O(n)</div>
        <div class="formula-box">Бинарный поиск: O(log₂n)</div>
        <div class="formula-box">Сортировка пузырьком: O(n²)</div>

        <p style="text-align:center; color:var(--text-gray); margin-top:20px; font-style:italic;">✏️ Добавь свои формулы здесь</p>
    `,
    phys: `
        <h3 class="formula-section-title">Механика — Кинематика</h3>
        <div class="formula-box">v = v₀ + at &nbsp;—&nbsp; скорость</div>
        <div class="formula-box">s = v₀t + <span class="frac"><span class="num">at²</span><span class="den">2</span></span> &nbsp;—&nbsp; путь</div>
        <div class="formula-box">v² = v₀² + 2as &nbsp;—&nbsp; без времени</div>
        <div class="formula-box">s = <span class="frac"><span class="num">v₀ + v</span><span class="den">2</span></span> · t &nbsp;—&nbsp; средняя скорость</div>

        <h3 class="formula-section-title">Механика — Динамика</h3>
        <div class="formula-box">F = ma &nbsp;—&nbsp; второй закон Ньютона</div>
        <div class="formula-box">p = mv &nbsp;—&nbsp; импульс</div>
        <div class="formula-box">F·Δt = Δp &nbsp;—&nbsp; импульс силы</div>
        <div class="formula-box">F = <span class="frac"><span class="num">Gm₁m₂</span><span class="den">r²</span></span> &nbsp;—&nbsp; сила тяготения</div>
        <div class="formula-box">g = 9,8 м/с² &nbsp;—&nbsp; ускорение свободного падения</div>

        <h3 class="formula-section-title">Работа и энергия</h3>
        <div class="formula-box">A = Fs·cosα &nbsp;—&nbsp; работа</div>
        <div class="formula-box">E<sub>k</sub> = <span class="frac"><span class="num">mv²</span><span class="den">2</span></span> &nbsp;—&nbsp; кинетическая энергия</div>
        <div class="formula-box">E<sub>p</sub> = mgh &nbsp;—&nbsp; потенциальная энергия</div>
        <div class="formula-box">N = <span class="frac"><span class="num">A</span><span class="den">t</span></span> &nbsp;—&nbsp; мощность</div>
        <div class="formula-box">η = <span class="frac"><span class="num">A<sub>пол</sub></span><span class="den">A<sub>зат</sub></span></span> · 100% &nbsp;—&nbsp; КПД</div>

        <h3 class="formula-section-title">Колебания и волны</h3>
        <div class="formula-box">T = <span class="frac"><span class="num">1</span><span class="den">ν</span></span> &nbsp;—&nbsp; период и частота</div>
        <div class="formula-box">T = 2π√(<span class="frac"><span class="num">l</span><span class="den">g</span></span>) &nbsp;—&nbsp; период маятника</div>
        <div class="formula-box">v = λν &nbsp;—&nbsp; скорость волны</div>

        <h3 class="formula-section-title">Термодинамика</h3>
        <div class="formula-box">Q = cm·ΔT &nbsp;—&nbsp; теплота нагревания</div>
        <div class="formula-box">Q = Lm &nbsp;—&nbsp; теплота плавления</div>
        <div class="formula-box">Q = qm &nbsp;—&nbsp; теплота сгорания</div>
        <div class="formula-box">pV = νRT &nbsp;—&nbsp; уравнение состояния газа</div>
        <div class="formula-box"><span class="frac"><span class="num">p₁V₁</span><span class="den">T₁</span></span> = <span class="frac"><span class="num">p₂V₂</span><span class="den">T₂</span></span> &nbsp;—&nbsp; объединённый закон</div>

        <h3 class="formula-section-title">Электричество</h3>
        <div class="formula-box">I = <span class="frac"><span class="num">q</span><span class="den">t</span></span> &nbsp;—&nbsp; сила тока</div>
        <div class="formula-box">U = IR &nbsp;—&nbsp; закон Ома</div>
        <div class="formula-box">R = <span class="frac"><span class="num">ρl</span><span class="den">S</span></span> &nbsp;—&nbsp; сопротивление</div>
        <div class="formula-box">P = UI = I²R = <span class="frac"><span class="num">U²</span><span class="den">R</span></span> &nbsp;—&nbsp; мощность</div>
        <div class="formula-box">A = UIt = Pt &nbsp;—&nbsp; работа тока</div>
        <div class="formula-box">Последовательно: R = R₁ + R₂</div>
        <div class="formula-box">Параллельно: <span class="frac"><span class="num">1</span><span class="den">R</span></span> = <span class="frac"><span class="num">1</span><span class="den">R₁</span></span> + <span class="frac"><span class="num">1</span><span class="den">R₂</span></span></div>

        <h3 class="formula-section-title">Оптика</h3>
        <div class="formula-box">n = <span class="frac"><span class="num">c</span><span class="den">v</span></span> &nbsp;—&nbsp; показатель преломления</div>
        <div class="formula-box"><span class="frac"><span class="num">1</span><span class="den">F</span></span> = <span class="frac"><span class="num">1</span><span class="den">d</span></span> + <span class="frac"><span class="num">1</span><span class="den">f</span></span> &nbsp;—&nbsp; формула линзы</div>
        <div class="formula-box">D = <span class="frac"><span class="num">1</span><span class="den">F</span></span> &nbsp;—&nbsp; оптическая сила (дптр)</div>
    `
};

const FORMULAS_DB_KK = {
    short_mult: FORMULAS_DB_RU.short_mult,
    trig: FORMULAS_DB_RU.trig,
    info: `
        <h3 class="formula-section-title">Санау жүйелері</h3>
        <div class="formula-box">2 бит → 4 мән (2²)</div>
        <div class="formula-box">8 бит = 1 байт</div>
        <div class="formula-box">1 Кбайт = 1024 байт = 2¹⁰ байт</div>
        <div class="formula-box">1 Мбайт = 1024 Кбайт = 2²⁰ байт</div>
        <div class="formula-box">1 Гбайт = 1024 Мбайт = 2³⁰ байт</div>
        <h3 class="formula-section-title">Ақпарат мөлшері</h3>
        <div class="formula-box">N = 2<sup>i</sup> &nbsp;→&nbsp; i = log₂N</div>
        <div class="formula-box">N — оқиғалар саны, i — бит саны</div>
        <h3 class="formula-section-title">Деректер беру жылдамдығы</h3>
        <div class="formula-box">V = <span class="frac"><span class="num">Q</span><span class="den">t</span></span> &nbsp; (бит/с)</div>
        <h3 class="formula-section-title">Логикалық амалдар</h3>
        <div class="formula-box">ЕМЕС (инверсия): ¬A &nbsp;|&nbsp; 0→1, 1→0</div>
        <div class="formula-box">ЖӘНЕ (конъюнкция): A ∧ B = 1, тек екеуі де 1 болса</div>
        <div class="formula-box">НЕМЕСЕ (дизъюнкция): A ∨ B = 0, тек екеуі де 0 болса</div>
        <div class="formula-box">XOR: A ⊕ B = 1, әртүрлі болса</div>
        <h3 class="formula-section-title">Екілікке аудару</h3>
        <div class="formula-box">2-ге бөл → қалдықтарды төменнен жоғары жаз</div>
        <div class="formula-box">10 → 2: 10÷2=5(0), 5÷2=2(1), 2÷2=1(0), 1÷2=0(1) → 1010</div>
        <h3 class="formula-section-title">Алгоритмдер — күрделілігі</h3>
        <div class="formula-box">Сызықтық іздеу: O(n)</div>
        <div class="formula-box">Екілік іздеу: O(log₂n)</div>
        <div class="formula-box">Көпіршік сұрыптау: O(n²)</div>
    `,
    phys: `
        <h3 class="formula-section-title">Механика — Кинематика</h3>
        <div class="formula-box">v = v₀ + at &nbsp;—&nbsp; жылдамдық</div>
        <div class="formula-box">s = v₀t + <span class="frac"><span class="num">at²</span><span class="den">2</span></span> &nbsp;—&nbsp; жол</div>
        <div class="formula-box">v² = v₀² + 2as &nbsp;—&nbsp; уақытсыз</div>
        <div class="formula-box">s = <span class="frac"><span class="num">v₀ + v</span><span class="den">2</span></span> · t &nbsp;—&nbsp; орташа жылдамдық</div>
        <h3 class="formula-section-title">Механика — Динамика</h3>
        <div class="formula-box">F = ma &nbsp;—&nbsp; Ньютонның 2-ші заңы</div>
        <div class="formula-box">p = mv &nbsp;—&nbsp; импульс</div>
        <div class="formula-box">F·Δt = Δp &nbsp;—&nbsp; күш импульсы</div>
        <div class="formula-box">F = <span class="frac"><span class="num">Gm₁m₂</span><span class="den">r²</span></span> &nbsp;—&nbsp; тартылыс күші</div>
        <div class="formula-box">g = 9,8 м/с² &nbsp;—&nbsp; еркін түсу үдеуі</div>
        <h3 class="formula-section-title">Жұмыс және энергия</h3>
        <div class="formula-box">A = Fs·cosα &nbsp;—&nbsp; жұмыс</div>
        <div class="formula-box">E<sub>k</sub> = <span class="frac"><span class="num">mv²</span><span class="den">2</span></span> &nbsp;—&nbsp; кинетикалық энергия</div>
        <div class="formula-box">E<sub>p</sub> = mgh &nbsp;—&nbsp; потенциалдық энергия</div>
        <div class="formula-box">N = <span class="frac"><span class="num">A</span><span class="den">t</span></span> &nbsp;—&nbsp; қуат</div>
        <div class="formula-box">η = <span class="frac"><span class="num">A<sub>пайд</sub></span><span class="den">A<sub>жұм</sub></span></span> · 100% &nbsp;—&nbsp; ПӘК</div>
        <h3 class="formula-section-title">Тербелістер және толқындар</h3>
        <div class="formula-box">T = <span class="frac"><span class="num">1</span><span class="den">ν</span></span> &nbsp;—&nbsp; период және жиілік</div>
        <div class="formula-box">T = 2π√(<span class="frac"><span class="num">l</span><span class="den">g</span></span>) &nbsp;—&nbsp; маятник периоды</div>
        <div class="formula-box">v = λν &nbsp;—&nbsp; толқын жылдамдығы</div>
        <h3 class="formula-section-title">Термодинамика</h3>
        <div class="formula-box">Q = cm·ΔT &nbsp;—&nbsp; жылу мөлшері</div>
        <div class="formula-box">Q = Lm &nbsp;—&nbsp; балқу жылуы</div>
        <div class="formula-box">Q = qm &nbsp;—&nbsp; жану жылуы</div>
        <div class="formula-box">pV = νRT &nbsp;—&nbsp; газ күйінің теңдеуі</div>
        <div class="formula-box"><span class="frac"><span class="num">p₁V₁</span><span class="den">T₁</span></span> = <span class="frac"><span class="num">p₂V₂</span><span class="den">T₂</span></span> &nbsp;—&nbsp; біріктірілген заң</div>
        <h3 class="formula-section-title">Электр</h3>
        <div class="formula-box">I = <span class="frac"><span class="num">q</span><span class="den">t</span></span> &nbsp;—&nbsp; ток күші</div>
        <div class="formula-box">U = IR &nbsp;—&nbsp; Ом заңы</div>
        <div class="formula-box">R = <span class="frac"><span class="num">ρl</span><span class="den">S</span></span> &nbsp;—&nbsp; кедергі</div>
        <div class="formula-box">P = UI = I²R = <span class="frac"><span class="num">U²</span><span class="den">R</span></span> &nbsp;—&nbsp; қуат</div>
        <div class="formula-box">A = UIt = Pt &nbsp;—&nbsp; токтың жұмысы</div>
        <div class="formula-box">Тізбекті: R = R₁ + R₂</div>
        <div class="formula-box">Параллель: <span class="frac"><span class="num">1</span><span class="den">R</span></span> = <span class="frac"><span class="num">1</span><span class="den">R₁</span></span> + <span class="frac"><span class="num">1</span><span class="den">R₂</span></span></div>
        <h3 class="formula-section-title">Оптика</h3>
        <div class="formula-box">n = <span class="frac"><span class="num">c</span><span class="den">v</span></span> &nbsp;—&nbsp; сыну көрсеткіші</div>
        <div class="formula-box"><span class="frac"><span class="num">1</span><span class="den">F</span></span> = <span class="frac"><span class="num">1</span><span class="den">d</span></span> + <span class="frac"><span class="num">1</span><span class="den">f</span></span> &nbsp;—&nbsp; линза формуласы</div>
        <div class="formula-box">D = <span class="frac"><span class="num">1</span><span class="den">F</span></span> &nbsp;—&nbsp; оптикалық күш (дптр)</div>
    `
};

function getFormulasDB() {
    return currentLang === 'kk' ? FORMULAS_DB_KK : FORMULAS_DB_RU;
}
