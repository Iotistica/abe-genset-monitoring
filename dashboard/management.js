// Management Page JavaScript

const API_BASE_URL = 'http://localhost:3001/v1.1';
const LOGIN_ID = 'mylogin';

let currentTab = 'users';
let users = [];
let units = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupThemeSwitcher();
    setupLanguageSwitcher();
    setupTabNavigation();
    setupModals();
    loadData();
    startAutoRefresh();
});

// Theme Switcher
function setupThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// Language Switcher
let currentLang = localStorage.getItem('language') || 'en';

const translations = {
    en: {
        systemManagement: 'System Management',
        configureSystem: 'Configure and manage your Alfa Balt system',
        users: 'Users',
        unitConfig: 'Unit Config',
        systemSettings: 'System Settings',
        reports: 'Reports',
        userManagement: 'User Management',
        addUser: 'Add User',
        username: 'Username',
        email: 'Email',
        role: 'Role',
        status: 'Status',
        lastLogin: 'Last Login',
        actions: 'Actions',
        unitConfiguration: 'Unit Configuration',
        addUnit: 'Add Unit',
        reportsAnalytics: 'Reports & Analytics',
        generateReport: 'Generate Report'
    },
    ru: {
        systemManagement: 'Управление системой',
        configureSystem: 'Настройка и управление системой Alfa Balt',
        users: 'Пользователи',
        unitConfig: 'Конфигурация',
        systemSettings: 'Настройки',
        reports: 'Отчеты',
        userManagement: 'Управление пользователями',
        addUser: 'Добавить пользователя',
        username: 'Имя пользователя',
        email: 'Email',
        role: 'Роль',
        status: 'Статус',
        lastLogin: 'Последний вход',
        actions: 'Действия',
        unitConfiguration: 'Конфигурация установок',
        addUnit: 'Добавить установку',
        reportsAnalytics: 'Отчеты и аналитика',
        generateReport: 'Создать отчет'
    }
};

function t(key) {
    return translations[currentLang][key] || key;
}

function setupLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem('language', currentLang);
            
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            applyTranslations();
        });
    });
    
    applyTranslations();
}

function applyTranslations() {
    // Update static text
    document.querySelector('.management-header h1').textContent = t('systemManagement');
    document.querySelector('.header-subtitle').textContent = t('configureSystem');
    
    // Update tab labels
    document.querySelector('[data-tab="users"] .tab-label').textContent = t('users');
    document.querySelector('[data-tab="units"] .tab-label').textContent = t('unitConfig');
    document.querySelector('[data-tab="settings"] .tab-label').textContent = t('systemSettings');
    document.querySelector('[data-tab="reports"] .tab-label').textContent = t('reports');
    
    // Reload data to apply translations
    renderUsers();
    renderUnitsConfig();
}

// Tab Navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active states
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            currentTab = tabId;
        });
    });
}

// Modals
function setupModals() {
    // Add User Modal
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    const saveUserBtn = document.getElementById('save-user-btn');
    
    addUserBtn.addEventListener('click', () => {
        addUserModal.classList.add('active');
    });
    
    cancelUserBtn.addEventListener('click', () => {
        addUserModal.classList.remove('active');
        clearUserForm();
    });
    
    saveUserBtn.addEventListener('click', () => {
        const username = document.getElementById('new-username').value;
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;
        
        if (username && email && password) {
            addUser({ username, email, role });
            addUserModal.classList.remove('active');
            clearUserForm();
        }
    });
    
    // Edit Unit Modal
    const editUnitModal = document.getElementById('edit-unit-modal');
    const cancelUnitBtn = document.getElementById('cancel-unit-btn');
    const saveUnitBtn = document.getElementById('save-unit-btn');
    
    cancelUnitBtn.addEventListener('click', () => {
        editUnitModal.classList.remove('active');
    });
    
    saveUnitBtn.addEventListener('click', () => {
        // Save unit changes
        editUnitModal.classList.remove('active');
    });
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
}

function clearUserForm() {
    document.getElementById('new-username').value = '';
    document.getElementById('new-email').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('new-role').value = 'viewer';
}

// Load Data
async function loadData() {
    await loadUsers();
    await loadUnits();
}

async function loadUsers() {
    // Mock user data (in real app, fetch from API)
    users = [
        {
            id: 1,
            username: 'admin',
            email: 'admin@abespb.ru',
            role: 'admin',
            status: 'active',
            lastLogin: '2024-11-25 09:30'
        },
        {
            id: 2,
            username: 'operator1',
            email: 'operator1@abespb.ru',
            role: 'operator',
            status: 'active',
            lastLogin: '2024-11-25 08:15'
        },
        {
            id: 3,
            username: 'viewer1',
            email: 'viewer1@abespb.ru',
            role: 'viewer',
            status: 'active',
            lastLogin: '2024-11-24 16:45'
        },
        {
            id: 4,
            username: 'technician',
            email: 'tech@abespb.ru',
            role: 'operator',
            status: 'inactive',
            lastLogin: '2024-11-20 11:20'
        }
    ];
    
    renderUsers();
}

async function loadUnits() {
    try {
        const response = await fetch(`${API_BASE_URL}/${LOGIN_ID}/units`, {
            headers: {
                'Authorization': 'Bearer test_token',
                'Comap-Key': 'test_key'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            units = data.units || [];
            renderUnitsConfig();
            populateUnitsDropdown();
        }
    } catch (error) {
        console.error('Error loading units:', error);
    }
}

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    
    const roleLabels = {
        en: { admin: 'Administrator', operator: 'Operator', viewer: 'Viewer' },
        ru: { admin: 'Администратор', operator: 'Оператор', viewer: 'Наблюдатель' }
    };
    
    const statusLabels = {
        en: { active: 'Active', inactive: 'Inactive' },
        ru: { active: 'Активен', inactive: 'Неактивен' }
    };
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="role-badge">${roleLabels[currentLang][user.role]}</span></td>
            <td><span class="status-badge ${user.status}">${statusLabels[currentLang][user.status]}</span></td>
            <td>${user.lastLogin}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editUser(${user.id})">✏️ ${currentLang === 'en' ? 'Edit' : 'Изменить'}</button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})">🗑️ ${currentLang === 'en' ? 'Delete' : 'Удалить'}</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderUnitsConfig() {
    const grid = document.getElementById('units-config-grid');
    
    const statusLabels = {
        en: { Running: 'Online', Stopped: 'Offline', Standby: 'Standby' },
        ru: { Running: 'В сети', Stopped: 'Не в сети', Standby: 'Ожидание' }
    };
    
    grid.innerHTML = units.map(unit => `
        <div class="unit-config-card">
            <div class="unit-config-header">
                <div>
                    <h3 class="unit-config-title">${unit.unitName}</h3>
                    <p class="unit-config-location">${unit.location || 'N/A'}</p>
                </div>
                <div class="unit-config-status ${unit.status.toLowerCase()}">
                    <span class="status-dot"></span>
                    <span>${statusLabels[currentLang][unit.status] || unit.status}</span>
                </div>
            </div>
            <div class="unit-config-details">
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Rated Power' : 'Номинальная мощность'}</span>
                    <span class="config-value">${unit.ratedPower} ${currentLang === 'en' ? 'kW' : 'кВт'}</span>
                </div>
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Current Power' : 'Текущая мощность'}</span>
                    <span class="config-value">${unit.activePower} ${currentLang === 'en' ? 'kW' : 'кВт'}</span>
                </div>
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Running Hours' : 'Часы работы'}</span>
                    <span class="config-value">${unit.runningHours} ${currentLang === 'en' ? 'hrs' : 'ч'}</span>
                </div>
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Active Alarms' : 'Активные тревоги'}</span>
                    <span class="config-value">${unit.activeAlarms || 0}</span>
                </div>
            </div>
            <div class="unit-config-actions">
                <button class="btn-secondary btn-small" onclick="editUnitConfig('${unit.unitGuid}')">
                    ⚙️ ${currentLang === 'en' ? 'Configure' : 'Настроить'}
                </button>
                <button class="btn-secondary btn-small" onclick="viewUnitDetails('${unit.unitGuid}')">
                    👁️ ${currentLang === 'en' ? 'View' : 'Просмотр'}
                </button>
            </div>
        </div>
    `).join('');
}

function populateUnitsDropdown() {
    const dropdown = document.getElementById('units-dropdown');
    const existingItems = dropdown.querySelectorAll('.dropdown-item');
    
    if (existingItems.length === 0) {
        units.forEach(unit => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = unit.unitName;
            item.onclick = () => {
                window.location.href = `index.html?unit=${unit.unitGuid}`;
            };
            dropdown.appendChild(item);
        });
    }
}

// User Actions
function addUser(userData) {
    const newUser = {
        id: users.length + 1,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        status: 'active',
        lastLogin: 'Never'
    };
    
    users.push(newUser);
    renderUsers();
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        alert(`Edit user: ${user.username}\n(Feature coming soon)`);
    }
}

function deleteUser(userId) {
    if (confirm(currentLang === 'en' ? 'Are you sure you want to delete this user?' : 'Вы уверены, что хотите удалить этого пользователя?')) {
        users = users.filter(u => u.id !== userId);
        renderUsers();
    }
}

// Unit Actions
function editUnitConfig(unitGuid) {
    const unit = units.find(u => u.unitGuid === unitGuid);
    if (unit) {
        const modal = document.getElementById('edit-unit-modal');
        document.getElementById('edit-unit-name').value = unit.unitName;
        document.getElementById('edit-unit-location').value = unit.location || '';
        document.getElementById('edit-unit-power').value = unit.ratedPower;
        document.getElementById('edit-unit-maintenance').value = 500; // Default
        document.getElementById('edit-unit-enabled').checked = unit.status !== 'Stopped';
        modal.classList.add('active');
    }
}

function viewUnitDetails(unitGuid) {
    window.location.href = `index.html?unit=${unitGuid}`;
}

// Auto-refresh
function startAutoRefresh() {
    setInterval(() => {
        if (currentTab === 'units') {
            loadUnits();
        }
    }, 30000); // Refresh every 30 seconds
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) {
        lastUpdateEl.textContent = `Last update: ${timeString}`;
    }
}

setInterval(updateLastUpdateTime, 1000);
updateLastUpdateTime();
