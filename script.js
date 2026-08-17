// ===== Часть 1: Глобальное состояние и вспомогательные функции =====
let currentUser = null;
let currentCart = [];
let currentScreen = 'welcome';
let currentCategory = null;
let currentSearchQuery = '';
let favoriteStatus = {};
let currentLanguage = 'ru';
let notificationsEnabled = true;
let userOrders = [];

// DOM элементы
const app = document.getElementById('app');
const nav = document.getElementById('bottom-nav');

// ===== Вспомогательные функции =====
function loadState() {
    try {
        const user = localStorage.getItem('milo_user');
        if (user) currentUser = JSON.parse(user);
        
        const cart = localStorage.getItem('milo_cart');
        if (cart) currentCart = JSON.parse(cart);
        
        const favs = localStorage.getItem('milo_favorites');
        if (favs) favoriteStatus = JSON.parse(favs);
        
        const lang = localStorage.getItem('milo_lang');
        if (lang) currentLanguage = lang;
        
        const notif = localStorage.getItem('milo_notifications');
        if (notif) notificationsEnabled = JSON.parse(notif);
        
        const orders = localStorage.getItem('milo_orders');
        if (orders) userOrders = JSON.parse(orders);
    } catch (e) {
        console.warn('Error loading state', e);
    }
}

function saveUser() {
    if (currentUser) {
        localStorage.setItem('milo_user', JSON.stringify(currentUser));
    }
}

function saveCart() {
    localStorage.setItem('milo_cart', JSON.stringify(currentCart));
}

function saveFavorites() {
    localStorage.setItem('milo_favorites', JSON.stringify(favoriteStatus));
}

function saveLang() {
    localStorage.setItem('milo_lang', currentLanguage);
}

function saveNotifications() {
    localStorage.setItem('milo_notifications', JSON.stringify(notificationsEnabled));
}

function saveOrders() {
    localStorage.setItem('milo_orders', JSON.stringify(userOrders));
}

function getProductImage(product) {
    return `assets/products/${product.image}`;
}

function getFallbackImage() {
    return 'assets/placeholders/product-placeholder.svg';
}

function t(key) {
    if (typeof window.translations !== 'undefined' && window.translations[currentLanguage]) {
        return window.translations[currentLanguage][key] || key;
    }
    return key;
}

// ===== Уведомления =====
function showNotification(message, duration = 2500) {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}
// ===== Часть 2: Рендеринг экранов и навигация =====
function renderScreen(screen, data = null) {
    currentScreen = screen;
    switch (screen) {
        case 'welcome':
            renderWelcomeScreen();
            break;
        case 'auth':
            renderAuthScreen();
            break;
        case 'main':
            renderMainScreen();
            break;
        case 'cart':
            renderCartScreen();
            break;
        case 'profile':
            renderProfileScreen();
            break;
        case 'order-success':
            renderOrderSuccess();
            break;
        default:
            renderMainScreen();
    }
    updateNav(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNav(screen) {
    const items = nav.querySelectorAll('.nav-item');
    items.forEach(item => {
        const type = item.dataset.screen;
        item.classList.toggle('active', type === screen || 
            (screen === 'main' && type === 'main') ||
            (screen === 'welcome' && type === ''));
    });
    nav.style.display = (screen === 'welcome' || screen === 'auth') ? 'none' : 'flex';
}
// ===== Часть 3: Приветственный экран =====
function renderWelcomeScreen() {
    const isRu = currentLanguage === 'ru';
    
    app.innerHTML = `
        <div class="welcome-screen screen-enter">
            <div class="blur-bg"></div>
            
            <div class="welcome-logo">
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" fill="#d4c5b2" opacity="0.3"/>
                    <path d="M60 70 L60 130 L80 100 L100 130 L100 70" stroke="#2d2a24" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M100 70 L100 130 L120 100 L140 130 L140 70" stroke="#2d2a24" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    <ellipse cx="80" cy="55" rx="12" ry="8" fill="#2d2a24"/>
                    <ellipse cx="120" cy="55" rx="12" ry="8" fill="#2d2a24"/>
                    <path d="M80 150 Q100 165 120 150" stroke="#2d2a24" stroke-width="6" stroke-linecap="round"/>
                </svg>
            </div>
            
            <div class="welcome-title">MILO</div>
            <div class="welcome-subtitle">${t('welcome')}</div>
            <div class="welcome-desc">${t('welcome_desc')}</div>
            
            <button class="welcome-btn" id="welcome-start-btn">
                ${t('login_register')} →
            </button>
            
            <div class="language-toggle" id="lang-toggle">
                <div class="slider" style="transform: translateX(${isRu ? '0' : '100%'})"></div>
                <button class="lang-btn ${isRu ? 'active' : ''}" data-lang="ru">RU</button>
                <button class="lang-btn ${!isRu ? 'active' : ''}" data-lang="eng">ENG</button>
            </div>
        </div>
    `;
    
    document.getElementById('welcome-start-btn').addEventListener('click', () => {
        if (currentUser) {
            renderScreen('main');
        } else {
            renderScreen('auth');
        }
    });
    
    // Переключатель языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            switchLanguage(lang);
        });
    });
}

function switchLanguage(lang) {
    if (lang === currentLanguage) return;
    currentLanguage = lang;
    saveLang();
    
    // Плавное обновление интерфейса
    const slider = document.querySelector('#lang-toggle .slider');
    const btns = document.querySelectorAll('#lang-toggle .lang-btn');
    
    btns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    if (slider) {
        slider.style.transform = `translateX(${lang === 'ru' ? '0' : '100%'})`;
    }
    
    // Обновляем текущий экран
    if (currentScreen === 'welcome') {
        renderWelcomeScreen();
    } else if (currentScreen === 'auth') {
        renderAuthScreen();
    } else if (currentScreen === 'main') {
        renderMainScreen();
    } else if (currentScreen === 'cart') {
        renderCartScreen();
    } else if (currentScreen === 'profile') {
        renderProfileScreen();
    }
}
// ===== Часть 4: Авторизация =====
function renderAuthScreen() {
    if (currentUser) {
        renderScreen('main');
        return;
    }
    
    app.innerHTML = `
        <div class="auth-screen screen-enter">
            <div class="logo-text">MILO</div>
            <div class="milo-sub">${t('products_nearby')}</div>
            <h1 class="screen-title" style="margin-top:16px;">${t('welcome')}</h1>
            <p class="screen-subtitle">${t('auth_subtitle')}</p>
            <div class="auth-form" id="auth-form">
                <input type="text" id="auth-name" placeholder="${t('name_placeholder')}" autocomplete="name">
                <input type="text" id="auth-username" placeholder="${t('telegram_placeholder')}" autocomplete="username">
                <button class="btn-primary" id="auth-start-btn">${t('start')}</button>
            </div>
        </div>
    `;
    
    document.getElementById('auth-start-btn').addEventListener('click', handleAuth);
    document.getElementById('auth-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuth(); });
    document.getElementById('auth-username').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuth(); });
    nav.style.display = 'none';
}

function handleAuth() {
    const name = document.getElementById('auth-name').value.trim();
    const username = document.getElementById('auth-username').value.trim();
    
    if (!name || !username) {
        showNotification(t('fill_all_fields'));
        return;
    }
    
    currentUser = { 
        name, 
        username, 
        address: t('default_address')
    };
    saveUser();
    nav.style.display = 'flex';
    
    // Поздравление
    showNotification(`${t('welcome_user')} ${name}! ${t('registration_success')}`);
    
    setTimeout(() => {
        renderScreen('main');
    }, 400);
}
// ===== Часть 5: Главный экран (часть 1) =====
function renderMainScreen() {
    if (!currentUser) {
        renderScreen('auth');
        return;
    }
    
    // Фильтруем товары по категории
    let products = window.PRODUCTS;
    let filteredProducts = products;
    let recommendations = [];
    
    if (currentCategory) {
        filteredProducts = products.filter(p => p.category === currentCategory);
        // Рекомендации: товары из других категорий
        const otherProducts = products.filter(p => p.category !== currentCategory);
        recommendations = otherProducts.slice(0, 4);
    } else {
        // Показываем все товары
        filteredProducts = products;
        // Рекомендации: популярные товары (первые 4)
        recommendations = products.slice(0, 4);
    }
    
    // Поиск
    if (currentSearchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );
    }
    
    const categories = window.CATEGORIES;
    const productCount = filteredProducts.length;
    
    let html = `
        <div class="screen-enter">
            <div class="header-logo" id="logo-home">MILO</div>
            
            <div class="search-bar">
                <input type="text" id="search-input" placeholder="${t('search_placeholder')}" value="${currentSearchQuery}">
                <span class="search-icon">🔍</span>
            </div>
            
            <div class="categories-wrapper">
                <div class="categories-scroll" id="categories-scroll">
                    <div class="category-chip ${!currentCategory ? 'highlight' : ''}" data-category="">${t('all')}</div>
                    ${categories.map(cat => `
                        <div class="category-chip ${currentCategory === cat ? 'highlight' : ''}" data-category="${cat}">${cat}</div>
                    `).join('')}
                </div>
                <div class="category-slider" id="category-slider"></div>
            </div>
    `;
  // ===== Часть 6: Главный экран (часть 2 - рекомендации и товары) =====
    
    // Рекомендации
    if (recommendations.length > 0 && !currentSearchQuery) {
        const recTitle = currentCategory ? 
            `${t('recommend_for')} "${currentCategory}"` : 
            t('recommend_for_you');
        
        html += `
            <div class="recommendations">
                <h3>${recTitle}</h3>
                <div class="rec-grid">
                    ${recommendations.map(p => `
                        <div class="rec-item" data-id="${p.id}">${p.name}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="section-header">
            <h2>${currentCategory || t('all_products')}</h2>
            <span class="count">${productCount} ${t('items')}</span>
        </div>
        <div class="product-grid" id="product-grid">
            ${filteredProducts.map(p => renderProductCard(p)).join('')}
        </div>
    `;
    
    app.innerHTML = html;
    nav.style.display = 'flex';
    
    // Логотип как кнопка "на главную"
    document.getElementById('logo-home').addEventListener('click', () => {
        currentCategory = null;
        currentSearchQuery = '';
        renderMainScreen();
    });
    
    // Поиск
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim();
        renderMainScreen();
    });
    
    // Категории
    const chips = document.querySelectorAll('.category-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            currentCategory = category || null;
            renderMainScreen();
        });
    });
    
    // Рекомендации
    document.querySelectorAll('.rec-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const product = window.PRODUCTS.find(p => p.id === id);
            if (product) {
                currentCategory = product.category;
                renderMainScreen();
            }
        });
    });
    
    // Анимация слайдера категорий
    updateCategorySlider();
    
    // Обработчики карточек
    attachCardEvents();
}

function updateCategorySlider() {
    const slider = document.getElementById('category-slider');
    if (!slider) return;
    
    const chips = document.querySelectorAll('.category-chip');
    let activeIndex = 0;
    chips.forEach((chip, index) => {
        if (chip.classList.contains('highlight')) {
            activeIndex = index;
        }
    });
    
    const activeChip = chips[activeIndex];
    if (activeChip) {
        const wrapper = activeChip.closest('.categories-scroll');
        const wrapperRect = wrapper.getBoundingClientRect();
        const chipRect = activeChip.getBoundingClientRect();
        
        const left = activeChip.offsetLeft;
        const width = activeChip.offsetWidth;
        
        slider.style.left = left + 'px';
        slider.style.width = width + 'px';
    }
}
// ===== Часть 7: Карточки товаров =====
function renderProductCard(product) {
    const isFavorite = favoriteStatus[product.id] || false;
    
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="image-area">
                <img src="${getProductImage(product)}" alt="${product.name}" 
                     onerror="this.src='${getFallbackImage()}'" loading="lazy">
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-weight">${product.weight}</div>
            <div class="product-bottom">
                <span class="product-price">${product.price} ₽</span>
                <div class="action-buttons">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${product.id}">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button class="add-to-cart-btn" data-id="${product.id}">+</button>
                </div>
            </div>
        </div>
    `;
}

function attachCardEvents() {
    // Добавление в корзину
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
            btn.textContent = '✓';
            btn.classList.add('added');
            showNotification(t('added_to_cart'));
            setTimeout(() => { 
                btn.textContent = '+';
                btn.classList.remove('added');
            }, 800);
        });
    });
    
    // Избранное
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            toggleFavorite(id);
            btn.classList.toggle('active');
            btn.textContent = favoriteStatus[id] ? '❤️' : '🤍';
        });
    });
}
// ===== Часть 8: Корзина =====
function renderCartScreen() {
    if (!currentUser) {
        renderAuthScreen();
        return;
    }
    
    let html = `
        <div class="screen-enter">
            <div class="category-header">
                <button class="back-btn" id="back-from-cart">←</button>
                <span class="category-title">${t('cart')}</span>
            </div>
    `;
    
    if (currentCart.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <p>${t('cart_empty')}</p>
            </div>
        `;
    } else {
        let total = 0;
        html += `<div id="cart-items">`;
        currentCart.forEach(item => {
            const product = window.PRODUCTS.find(p => p.id === item.id);
            if (!product) return;
            const subtotal = product.price * item.quantity;
            total += subtotal;
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="item-info">
                        <div class="item-name">${product.name}</div>
                        <div class="item-price">${product.price} ₽ × ${item.quantity}</div>
                    </div>
                    <div class="quantity-controls">
                        <button class="cart-dec" data-id="${item.id}">−</button>
                        <span>${item.quantity}</span>
                        <button class="cart-inc" data-id="${item.id}">+</button>
                        <button class="cart-remove" data-id="${item.id}" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        html += `
            <div class="cart-total">
                <span>${t('total')}</span>
                <span>${total} ₽</span>
            </div>
            <button class="btn-primary" id="checkout-btn">${t('checkout')}</button>
        `;
    }
    
    html += `</div>`;
    app.innerHTML = html;
    nav.style.display = 'flex';
    
    document.getElementById('back-from-cart').addEventListener('click', () => {
        renderScreen('main');
    });
    
    // Обработчики корзины с анимациями
    document.querySelectorAll('.cart-inc').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            addToCart(id);
            renderCartScreen();
        });
    });
    
    document.querySelectorAll('.cart-dec').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
            renderCartScreen();
        });
    });
    
    document.querySelectorAll('.cart-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const item = document.querySelector(`.cart-item[data-id="${id}"]`);
            if (item) {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    removeAllFromCart(id);
                    renderCartScreen();
                }, 300);
            }
        });
    });
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (currentCart.length === 0) return;
            
            // Сохраняем заказ
            const order = {
                id: Date.now(),
                date: new Date().toLocaleDateString(),
                items: [...currentCart],
                total: currentCart.reduce((sum, item) => {
                    const product = window.PRODUCTS.find(p => p.id === item.id);
                    return sum + (product ? product.price * item.quantity : 0);
                }, 0)
            };
            userOrders.push(order);
            saveOrders();
            
            currentCart = [];
            saveCart();
            renderScreen('order-success');
        });
    }
}

// Функции корзины
function addToCart(productId) {
    const existing = currentCart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        currentCart.push({ id: productId, quantity: 1 });
    }
    saveCart();
    updateCartBadge();
}

function removeFromCart(productId) {
    const index = currentCart.findIndex(item => item.id === productId);
    if (index !== -1) {
        if (currentCart[index].quantity > 1) {
            currentCart[index].quantity -= 1;
        } else {
            currentCart.splice(index, 1);
        }
        saveCart();
        updateCartBadge();
    }
}

function removeAllFromCart(productId) {
    currentCart = currentCart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
}

function toggleFavorite(productId) {
    favoriteStatus[productId] = !favoriteStatus[productId];
    saveFavorites();
}

function updateCartBadge() {
    const total = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.querySelector('.nav-item[data-screen="cart"] .nav-badge');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'block' : 'none';
    }
}
// ===== Часть 9: Профиль =====
function renderProfileScreen() {
    if (!currentUser) {
        renderAuthScreen();
        return;
    }
    
    const avatarLetter = currentUser.name.charAt(0).toUpperCase();
    const orderCount = userOrders.length;
    
    let html = `
        <div class="screen-enter">
            <div class="category-header">
                <button class="back-btn" id="back-from-profile">←</button>
                <span class="category-title">${t('profile')}</span>
            </div>
            <div class="profile-avatar" id="profile-avatar">
                ${avatarLetter}
                ${window.isWinterSeason ? '<span class="seasonal-hat">🎄</span>' : ''}
            </div>
            <div class="profile-name">${currentUser.name}</div>
            <div class="profile-username">@${currentUser.username}</div>
            <div class="profile-address-edit">
                <input type="text" id="address-input" value="${currentUser.address || ''}" placeholder="${t('address_placeholder')}">
                <button id="save-address-btn">${t('save')}</button>
            </div>
            <div class="profile-menu">
                <button class="profile-menu-item" id="orders-btn">
                    ${t('orders')}
                    <span class="badge">${orderCount}</span>
                </button>
                <button class="profile-menu-item" id="receipts-btn">${t('receipts')}</button>
                <button class="profile-menu-item" id="reviews-btn">${t('reviews')}</button>
                <button class="profile-menu-item" id="settings-btn">
                    ${t('settings')}
                    <span>⚙️</span>
                </button>
                <button class="profile-menu-item" id="logout-btn" style="color:#b87a7a;">${t('logout')}</button>
            </div>
        </div>
    `;
    app.innerHTML = html;
    nav.style.display = 'flex';
    
    document.getElementById('back-from-profile').addEventListener('click', () => {
        renderScreen('main');
    });
    
    document.getElementById('save-address-btn').addEventListener('click', () => {
        const address = document.getElementById('address-input').value.trim();
        if (address) {
            currentUser.address = address;
            saveUser();
            showNotification(t('address_saved'));
        }
    });
    
    document.getElementById('orders-btn').addEventListener('click', () => {
        showOrders();
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        renderSettingsScreen();
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm(t('logout_confirm'))) {
            localStorage.removeItem('milo_user');
            currentUser = null;
            currentCart = [];
            saveCart();
            nav.style.display = 'none';
            renderScreen('welcome');
        }
    });
    
    // Демо для других кнопок
    document.getElementById('receipts-btn').addEventListener('click', () => {
        showNotification(t('coming_soon'));
    });
    
    document.getElementById('reviews-btn').addEventListener('click', () => {
        showNotification(t('coming_soon'));
    });
}

function showOrders() {
    if (userOrders.length === 0) {
        showNotification(t('no_orders'));
        return;
    }
    
    let message = t('your_orders') + ':\n\n';
    userOrders.forEach((order, index) => {
        message += `${index + 1}. ${t('order_from')} ${order.date}\n`;
        order.items.forEach(item => {
            const product = window.PRODUCTS.find(p => p.id === item.id);
            if (product) {
                message += `   ${product.name} × ${item.quantity}\n`;
            }
        });
        message += `   ${t('total')}: ${order.total} ₽\n\n`;
    });
    alert(message);
}
// ===== Часть 10: Настройки =====
function renderSettingsScreen() {
    const isRu = currentLanguage === 'ru';
    
    let html = `
        <div class="screen-enter">
            <div class="category-header">
                <button class="back-btn" id="back-from-settings">←</button>
                <span class="category-title">${t('settings')}</span>
            </div>
            
            <div style="margin-top:16px;display:flex;flex-direction:column;gap:16px;">
                <!-- Язык -->
                <div style="background:var(--bg-surface);border-radius:var(--radius-lg);padding:16px;">
                    <div style="font-weight:600;margin-bottom:10px;">${t('language')}</div>
                    <div class="language-toggle" id="settings-lang-toggle">
                        <div class="slider" style="transform: translateX(${isRu ? '0' : '100%'})"></div>
                        <button class="lang-btn ${isRu ? 'active' : ''}" data-lang="ru">RU</button>
                        <button class="lang-btn ${!isRu ? 'active' : ''}" data-lang="eng">ENG</button>
                    </div>
                </div>
                
                <!-- Имя -->
                <div style="background:var(--bg-surface);border-radius:var(--radius-lg);padding:16px;">
                    <div style="font-weight:600;margin-bottom:10px;">${t('change_name')}</div>
                    <div style="display:flex;gap:10px;">
                        <input type="text" id="settings-name-input" value="${currentUser.name}" 
                               style="flex:1;padding:12px 20px;border:none;background:var(--bg-input);border-radius:var(--radius-full);font-size:15px;outline:none;">
                        <button id="settings-save-name" style="background:var(--accent);border:none;border-radius:var(--radius-full);padding:12px 20px;font-weight:600;cursor:pointer;">
                            ${t('save')}
                        </button>
                    </div>
                </div>
                
                <!-- Уведомления -->
                <div style="background:var(--bg-surface);border-radius:var(--radius-lg);padding:16px;">
                    <div style="font-weight:600;margin-bottom:10px;">${t('notifications')}</div>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                            <input type="checkbox" id="notif-order-accepted" ${notificationsEnabled ? 'checked' : ''}>
                            ${t('order_accepted')}
                        </label>
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                            <input type="checkbox" id="notif-order-collecting" ${notificationsEnabled ? 'checked' : ''}>
                            ${t('order_collecting')}
                        </label>
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                            <input type="checkbox" id="notif-order-delivering" ${notificationsEnabled ? 'checked' : ''}>
                            ${t('order_delivering')}
                        </label>
                        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
                            <input type="checkbox" id="notif-order-delivered" ${notificationsEnabled ? 'checked' : ''}>
                            ${t('order_delivered')}
                        </label>
                    </div>
                </div>
                
                <!-- О приложении -->
                <div style="background:var(--bg-surface);border-radius:var(--radius-lg);padding:16px;">
                    <div style="font-weight:600;margin-bottom:8px;">${t('about_app')}</div>
                    <div style="color:var(--text-secondary);font-size:14px;line-height:1.6;">
                        ${t('about_text')}
                    </div>
                </div>
            </div>
        </div>
    `;
    app.innerHTML = html;
    nav.style.display = 'flex';
    
    document.getElementById('back-from-settings').addEventListener('click', () => {
        renderScreen('profile');
    });
    
    // Переключатель языка в настройках
    document.querySelectorAll('#settings-lang-toggle .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            switchLanguage(lang);
        });
    });
    
    // Изменение имени
    document.getElementById('settings-save-name').addEventListener('click', () => {
        const newName = document.getElementById('settings-name-input').value.trim();
        if (newName) {
            currentUser.name = newName;
            saveUser();
            showNotification(t('name_updated'));
            renderSettingsScreen();
        }
    });
    
    // Уведомления
    const notifCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    notifCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            notificationsEnabled = true;
            saveNotifications();
            if (cb.checked) {
                showNotification(t('notifications_enabled'));
            }
        });
    });
}
// ===== Часть 11: Экран заказа и инициализация =====
function renderOrderSuccess() {
    let html = `
        <div class="screen-enter order-success">
            <div class="cat-icon">🐱</div>
            <h2>${t('order_success')}</h2>
            <p>${t('order_success_text')}</p>
            <button class="btn-primary" id="continue-shopping">${t('continue_shopping')}</button>
        </div>
    `;
    app.innerHTML = html;
    nav.style.display = 'flex';
    
    document.getElementById('continue-shopping').addEventListener('click', () => {
        renderScreen('main');
    });
}

// ===== Инициализация =====
function init() {
    loadState();
    
    if (typeof window.PRODUCTS === 'undefined') {
        console.error('Данные товаров не загружены');
        app.innerHTML = '<p>Ошибка загрузки данных</p>';
        return;
    }
    
    // Создаем нижнюю навигацию
    nav.innerHTML = `
        <button class="nav-item active" data-screen="main" id="nav-main">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="nav-item" data-screen="cart" id="nav-cart">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="nav-badge" style="display:none;">0</span>
        </button>
        <button class="nav-item" data-screen="profile" id="nav-profile">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
    `;
    
    document.getElementById('nav-main').addEventListener('click', () => {
        currentCategory = null;
        currentSearchQuery = '';
        renderScreen('main');
    });
    document.getElementById('nav-cart').addEventListener('click', () => renderScreen('cart'));
    document.getElementById('nav-profile').addEventListener('click', () => renderScreen('profile'));
    
    updateCartBadge();
    
    // Запуск
    if (currentUser) {
        nav.style.display = 'flex';
        renderScreen('main');
    } else {
        nav.style.display = 'none';
        renderScreen('welcome');
    }
}

document.addEventListener('DOMContentLoaded', init);