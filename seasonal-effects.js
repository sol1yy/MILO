// ===== Сезонные эффекты MILO =====
window.isWinterSeason = false;

function checkSeason() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Зимний период: декабрь-февраль
    if (month === 11 || month === 0 || month === 1) {
        window.isWinterSeason = true;
        // Если декабрь или январь, включаем новогодние эффекты
        if ((month === 11 && day >= 15) || (month === 0) || (month === 1 && day <= 15)) {
            return 'newyear';
        }
        return 'winter';
    }
    
    // Весенний период: март-май
    if (month >= 2 && month <= 4) {
        return 'spring';
    }
    
    // Летний период: июнь-август
    if (month >= 5 && month <= 7) {
        return 'summer';
    }
    
    // Осенний период: сентябрь-ноябрь
    if (month >= 8 && month <= 10) {
        return 'autumn';
    }
    
    return 'default';
}

function applySeasonalEffects() {
    const season = checkSeason();
    
    // Удаляем старые эффекты
    document.querySelectorAll('.seasonal-snow').forEach(el => el.remove());
    document.querySelectorAll('.seasonal-avatar-hat').forEach(el => el.remove());
    
    if (season === 'newyear' || season === 'winter') {
        // Снег
        const snowContainer = document.createElement('div');
        snowContainer.className = 'seasonal-snow';
        snowContainer.id = 'snow-container';
        document.body.appendChild(snowContainer);
        
        // Создаем снежинки
        const flakes = 60;
        for (let i = 0; i < flakes; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.textContent = ['❄', '❅', '❆', '•'][Math.floor(Math.random() * 4)];
            flake.style.left = Math.random() * 100 + '%';
            flake.style.fontSize = (6 + Math.random() * 16) + 'px';
            flake.style.opacity = 0.2 + Math.random() * 0.5;
            flake.style.animationDuration = (8 + Math.random() * 12) + 's';
            flake.style.animationDelay = (Math.random() * 15) + 's';
            snowContainer.appendChild(flake);
        }
    }
    
    // Добавляем шапочку на аватарку
    if (season === 'newyear') {
        const avatar = document.querySelector('.profile-avatar');
        if (avatar && !avatar.querySelector('.seasonal-hat')) {
            const hat = document.createElement('span');
            hat.className = 'seasonal-hat';
            hat.textContent = '🎄';
            avatar.appendChild(hat);
        }
    }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', () => {
    applySeasonalEffects();
});

// Перезапускаем при переключении экранов
const originalRender = renderScreen;
if (typeof renderScreen !== 'undefined') {
    const originalRenderFn = window.renderScreen;
    window.renderScreen = function(screen, data) {
        originalRenderFn(screen, data);
        setTimeout(applySeasonalEffects, 100);
    };
}