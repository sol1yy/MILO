// ===== Глобальное состояние =====
let currentUser = null;
let currentCart = [];
let currentScreen = 'auth'; // 'auth', 'main', 'category', 'cart', 'profile', 'order-success'
let currentCategory = null;
let currentSearchQuery = '';
let favoriteStatus = {};

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

function getProductImage(product) {
    // Если изображение загружено, используем его, иначе заглушку
    return `assets/products/${product.image}`;
}

function getFallbackImage() {
    return 'assets/placeholders/product-placeholder.svg';
}

// ===== Рендеринг экранов =====
function renderScreen(screen, data = null) {
    currentScreen = screen;
    switch (screen) {
        case 'auth':
            renderAuthScreen();
            break;
        case 'main':
            renderMainScreen();
            break;
        case 'category':
            renderCategoryScreen(data);
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
        item.classList.toggle('active', type === screen || (screen === 'category' && type === 'main'));
    });
}

// ===== Экран авторизации =====
function renderAuthScreen() {
    if (currentUser) {
        renderMainScreen();
        return;
    }
    app.innerHTML = `
        <div class="auth-screen screen-enter">
            <div class="logo-text">MILO</div>
            <div class="milo-sub">Продукты рядом</div>
            <h1 class="screen-title" style="margin-top:16px;">Добро пожаловать</h1>
            <p class="screen-subtitle">Быстро, просто и удобно</p>
            <div class="auth-form" id="auth-form">
                <input type="text" id="auth-name" placeholder="Имя или псевдоним" autocomplete="name">
                <input type="text" id="auth-username" placeholder="Telegram username" autocomplete="username">
                <button class="btn-primary" id="auth-start-btn">Начать</button>
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
        alert('Пожалуйста, заполните оба поля');
        return;
    }
    currentUser = { name, username, address: 'Москва, ул. Центральная, д. 1' };
    saveUser();
    nav.style.display = 'flex';
    renderScreen('main');
}

// ===== Главный экран =====
function renderMainScreen() {
    if (!currentUser) {
        renderAuthScreen();
        return;
    }
    // Получаем 4 товара для "Новое в MILO" (первые 4)
    const featuredProducts = window.PRODUCTS.slice(0, 4);

    let html = `
        <div class="screen-enter">
            <div class="header-logo">MILO</div>
            <div class="search-bar">
                <input type="text" id="search-input" placeholder="Найти продукт" value="${currentSearchQuery}">
                <span class="search-icon">🔍</span>
            </div>
            <div class="categories-scroll" id="categories-scroll">
                ${window.CATEGORIES.map(cat => `
                    <div class="category-chip ${cat === 'Свежая выпечка' ? 'highlight' : ''}" data-category="${cat}">${cat}</div>
                `).join('')}
            </div>
            <div class="section-header">
                <h2>Новое в MILO</h2>
                <span class="see-all" id="see-all-featured">Все товары</span>
            </div>
            <div class="product-grid" id="featured-grid">
                ${featuredProducts.map(p => renderProductCard(p)).join('')}
            </div>
        </div>
    `;
    app.innerHTML = html;
    nav.style.display = 'flex';

    // Поиск
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        if (currentSearchQuery.length > 0) {
            const results = window.PRODUCTS.filter(p => p.name.toLowerCase().includes(currentSearchQuery));
            if (results.length > 0) {
                renderSearchResults(results);
            } else {
                document.getElementById('featured-grid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Ничего не найдено</p></div>`;
            }
        } else {
            renderMainScreen();
        }
    });

    // Категории
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;
            renderScreen('category', category);
        });
    });

    // Ссылка "Все товары"
    document.getElementById('see-all-featured').addEventListener('click', () => {
        renderScreen('category', 'Свежая выпечка');
    });

    // Добавление в корзину
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
            btn.textContent = '✓';
            setTimeout(() => { btn.textContent = '+'; }, 600);
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

function renderSearchResults(results) {
    const grid = document.getElementById('featured-grid');
    grid.innerHTML = results.map(p => renderProductCard(p)).join('');
    attachCardEvents();
}

function attachCardEvents() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
            btn.textContent = '✓';
            setTimeout(() => { btn.textContent = '+'; }, 600);
        });
    });
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

function renderProductCard(product) {
    const isFavorite = favoriteStatus[product.id] || false;
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="image-area">
                <img src="${getProductImage(product)}" alt="${product.name}" onerror="this.src='${getFallbackImage()}'" loading="lazy">
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-weight">${product.weight}</div>
            <div class="product-bottom">
                <span class="product-price">${product.price} ₽</span>
                <div class="action-buttons">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${product.id}">${isFavorite ? '❤️' : '🤍'}</button>
                    <button class="add-to-cart-btn" data-id="${product.id}">+</button>
                </div>
            </div>
        </div>
    `;
}

// ===== Экран категории =====
function renderCategoryScreen(category) {
    currentCategory = category;
    const products = window.PRODUCTS.filter(p => p.category === category);

    let html = `
        <div class="screen-enter">
            <div class="category-header">
                <button class="back-btn" id="back-from-category">←</button>
                <span class="category-title">${category}</span>
            </div>
            <div class="product-grid">
                ${products.map(p => renderProductCard(p)).join('')}
            </div>
        </div>
    `;
    app.innerHTML = html;
    nav.style.display = 'flex';

    document.getElementById('back-from-category').addEventListener('click', () => {
        renderScreen('main');
    });

    attachCardEvents();
}

// ===== Корзина =====
function renderCartScreen() {
    if (!currentUser) {
        renderAuthScreen();
        return;
    }

    let html = `
        <div class="screen-enter">
            <div class="category-header">
                <button class="back-btn" id="back-from-cart">←</button>
                <span class="category-title">Корзина</span>
            </div>
    `;

    if (currentCart.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <p>Корзина пуста</p>
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
                <span>Итого</span>
                <span>${total} ₽</span>
            </div>
            <button class="btn-primary" id="checkout-btn">Оформить заказ</button>
        `;
    }

    html += `</div>`;
    app.innerHTML = html;
    nav.style.display = 'flex';

    document.getElementById('back-from-cart').addEventListener('click', () => {
        renderScreen('main');
    });

    // Обработчики корзины
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
            removeAllFromCart(id);
            renderCartScreen();
        });
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            currentCart = [];
            saveCart();
            renderScreen('order-success');
        });
    }
}

// ===== Профиль =====
function renderProfileScreen() {
    if (!currentUser) {
        renderAuthScreen();
        return;
    }

    const avatarLetter = currentUser.name.charAt(0).toUpperCase();

    let html = `
        <div class="screen-enter">
            <div class="category-header">
                <button class="back-btn" id="back-from-profile">←</button>
                <span class="category-title">Профиль</span>
            </div>
            <div class="profile-avatar">${avatarLetter}</div>
            <div class="profile-name">${currentUser.name}</div>
            <div class="profile-username">@${currentUser.username}</div>
            <div class="profile-address-edit">
                <input type="text" id="address-input" value="${currentUser.address || ''}" placeholder="Адрес доставки">
                <button id="save-address-btn">Сохранить</button>
            </div>
            <div class="profile-menu">
                <button class="profile-menu-item">📦 Заказы</button>
                <button class="profile-menu-item">🧾 Чеки</button>
                <button class="profile-menu-item">⭐ Отзывы</button>
                <button class="profile-menu-item">⚙️ Настройки</button>
                <button class="profile-menu-item" id="logout-btn" style="color:#b87a7a;">Выйти</button>
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
            alert('Адрес сохранён');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('milo_user');
            currentUser = null;
            currentCart = [];
            saveCart();
            nav.style.display = 'none';
            renderAuthScreen();
        }
    });

    // Демо для других кнопок
    document.querySelectorAll('.profile-menu-item:not(#logout-btn)').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Этот раздел будет доступен в следующей версии');
        });
    });
}

// ===== Заказ успешно оформлен =====
function renderOrderSuccess() {
    let html = `
        <div class="screen-enter order-success">
            <div class="cat-icon">🐱</div>
            <h2>Заказ успешно оформлен!</h2>
            <p>Спасибо за покупку в MILO</p>
            <button class="btn-primary" id="continue-shopping">Продолжить покупки</button>
        </div>
    `;
    app.innerHTML = html;
    nav.style.display = 'flex';

    document.getElementById('continue-shopping').addEventListener('click', () => {
        renderScreen('main');
    });
}

// ===== Функции корзины =====
function addToCart(productId) {
    const existing = currentCart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        currentCart.push({ id: productId, quantity: 1 });
    }
    saveCart();
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
    }
}

function removeAllFromCart(productId) {
    currentCart = currentCart.filter(item => item.id !== productId);
    saveCart();
}

// ===== Избранное =====
function toggleFavorite(productId) {
    favoriteStatus[productId] = !favoriteStatus[productId];
    saveFavorites();
}

// ===== Инициализация =====
function init() {
    loadState();

    // Проверка наличия данных
    if (typeof window.PRODUCTS === 'undefined') {
        console.error('Данные товаров не загружены');
        app.innerHTML = '<p>Ошибка загрузки данных. Проверьте файл products.js</p>';
        return;
    }

    // Создаем нижнюю навигацию
    nav.innerHTML = `
        <button class="nav-item active" data-screen="main" id="nav-main">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="nav-item" data-screen="cart" id="nav-cart">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </button>
        <button class="nav-item" data-screen="profile" id="nav-profile">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
    `;

    document.getElementById('nav-main').addEventListener('click', () => renderScreen('main'));
    document.getElementById('nav-cart').addEventListener('click', () => renderScreen('cart'));
    document.getElementById('nav-profile').addEventListener('click', () => renderScreen('profile'));

    // Запуск
    if (currentUser) {
        nav.style.display = 'flex';
        renderScreen('main');
    } else {
        nav.style.display = 'none';
        renderScreen('auth');
    }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', init);