// Запуск: язык, который ученик выбрал в прошлый раз
setLanguage((function () { try { return localStorage.getItem('lang') || 'ru'; } catch (e) { return 'ru'; } })());
