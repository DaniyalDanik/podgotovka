// Тема (светлая/тёмная) и звёзды на фоне
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
}
(function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        const btn = document.getElementById('theme-btn');
        if (btn) btn.textContent = '🌙';
    }
})();
(function() {
    const container = document.getElementById('stars-container');
    if (!container) return;
    const count = 80;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        s.style.cssText = `
            left:${Math.random()*100}%;
            top:${Math.random()*100}%;
            width:${Math.random()<0.3?4:Math.random()<0.6?3:2}px;
            height:${Math.random()<0.3?4:Math.random()<0.6?3:2}px;
            --d:${(2+Math.random()*4).toFixed(1)}s;
            --delay:-${(Math.random()*5).toFixed(1)}s;
            opacity:${0.1+Math.random()*0.4};
        `;
        container.appendChild(s);
    }
})();
