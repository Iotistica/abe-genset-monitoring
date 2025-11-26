// Alfa Balt API Configuration
const API_BASE_URL = 'https://abe-genset-api.azurewebsites.net';
const API_VERSION = 'v1.1';
const LOGIN_ID = 'mylogin';
const AUTH_TOKEN = 'test_token';
const COMAP_KEY = 'test_key';

// Global state
let allUnits = [];
let unitValues = new Map();
let currentLang = localStorage.getItem('language') || 'ru';
let translations = {};

// Load translations from JSON files
async function loadTranslations(lang) {
    try {
        const response = await fetch(`translations/${lang}.json`);
        if (!response.ok) {
            console.warn(`Failed to load ${lang} translations, falling back to English`);
            if (lang !== 'en') {
                return loadTranslations('en');
            }
            return {};
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        return {};
    }
}

// Get translation helper function
function t(path) {
    // Handle both flat keys (for backward compatibility) and nested paths
    if (translations[path]) {
        return translations[path];
    }
    
    // Handle nested paths like 'nav.dashboard'
    const keys = path.split('.');
    let value = translations;
    for (const key of keys) {
        value = value?.[key];
        if (value === undefined) return path;
    }
    return value;
}

// Initialize application
async function initializeApp() {
    // Load translations first
    translations = await loadTranslations(currentLang);
    
    // Initialize all components
    loadUnits();
    initializeCharts();
    setupManagementTabs();
    
    // Start periodic updates
    setInterval(() => {
        if (allUnits.length > 0) {
            updateLiveValues();
        }
    }, 5000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Load translations first
    translations = await loadTranslations(currentLang);
    
    setupThemeSwitcher();
    setupLanguageSwitcher();
    applyTranslations();
    loadUnits();
    setupFilters();
    setupModal();
    setupNavigation();
    setupManagementTabs();
    setupManagementModals();
    setupAlarms();
    
    // Auto-refresh every 5 seconds
    setInterval(() => {
        if (document.getElementById('units-grid').children.length > 0) {
            loadUnits(true); // Silent refresh
        }
    }, 5000);
});

// Load units from API
async function loadUnits(silent = false) {
    if (!silent) {
        document.getElementById('units-grid').innerHTML = `<div class="loading">${t('loadingUnits')}</div>`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${API_VERSION}/${LOGIN_ID}/units`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Comap-Key': COMAP_KEY
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch units');
        
        const data = await response.json();
        allUnits = data.units;
        
        // Load live values for all running units
        await loadLiveValues();
        
        // Update stats
        updateStats();
        
        // Render units
        renderUnits(allUnits);
        
        // Update units menu
        updateUnitsMenu(allUnits);
        
        // Update last refresh time
        document.getElementById('last-update').textContent = 
            `Last update: ${new Date().toLocaleTimeString()}`;
        document.getElementById('connection-status').classList.remove('disconnected');
        
    } catch (error) {
        console.error('Error loading units:', error);
        document.getElementById('connection-status').classList.add('disconnected');
        document.getElementById('connection-status').textContent = 'Disconnected';
        
        if (!silent) {
            document.getElementById('units-grid').innerHTML = 
                '<div class="error">❌ Error loading units. Make sure the server is running on port 3001.</div>';
        }
    }
}

// Load live values for running units
async function loadLiveValues() {
    const promises = allUnits
        .filter(unit => unit.state === 'ON')
        .map(async (unit) => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/${API_VERSION}/${LOGIN_ID}/units/${unit.unitGuid}/values`,
                    {
                        headers: {
                            'Authorization': `Bearer ${AUTH_TOKEN}`,
                            'Comap-Key': COMAP_KEY
                        }
                    }
                );
                
                if (response.ok) {
                    const values = await response.json();
                    unitValues.set(unit.unitGuid, values);
                }
            } catch (error) {
                console.error(`Error loading values for ${unit.unitGuid}:`, error);
            }
        });
    
    await Promise.all(promises);
}

// Load alarms for a specific unit
async function loadAlarms(unitGuid) {
    try {
        const response = await fetch(`${API_BASE_URL}/${API_VERSION}/${LOGIN_ID}/units/${unitGuid}/alarms`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Comap-Key': COMAP_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.alarms || [];
    } catch (error) {
        console.error('Error loading alarms:', error);
        return [];
    }
}

// Update statistics
function updateStats() {
    const total = allUnits.length;
    const running = allUnits.filter(u => u.status === 'Running').length;
    const standby = allUnits.filter(u => u.status === 'Standby').length;
    const warning = allUnits.filter(u => u.status === 'Warning').length;
    const totalPower = allUnits.reduce((sum, u) => sum + (u.powerRating || 0), 0);
    
    document.getElementById('total-units').textContent = total;
    document.getElementById('running-units').textContent = running;
    document.getElementById('standby-units').textContent = standby;
    document.getElementById('warning-units').textContent = warning;
    document.getElementById('total-power').textContent = `${totalPower.toLocaleString()} kW`;
}

// Render units grid
function renderUnits(units) {
    const grid = document.getElementById('units-grid');
    
    if (units.length === 0) {
        grid.innerHTML = `<div class="loading">${t('noUnits')}</div>`;
        return;
    }
    
    grid.innerHTML = units.map(unit => {
        const values = unitValues.get(unit.unitGuid);
        const isRunning = unit.state === 'ON';
        const hasAlarms = unit.activeAlarms > 0;
        
        // Alarm pluralization
        let alarmText = '';
        if (hasAlarms) {
            if (currentLang === 'ru') {
                alarmText = unit.activeAlarms === 1 ? 'оповещение' : unit.activeAlarms < 5 ? 'оповещения' : 'оповещений';
            } else {
                alarmText = unit.activeAlarms > 1 ? t('alarmsCount') : t('alarm');
            }
        }
        
        // Status translation
        let statusText = unit.status;
        if (unit.status === 'Running') statusText = t('running');
        else if (unit.status === 'Standby') statusText = t('standby');
        else if (unit.status === 'Warning') statusText = t('warning');
        
        return `
            <div class="unit-card" onclick="showUnitDetails('${unit.unitGuid}')">
                <div class="status-indicator ${unit.status.toLowerCase()}"></div>
                <div class="unit-card-header">
                    <h3>${unit.unitName}</h3>
                    ${hasAlarms ? `<span class="alarm-badge">${unit.activeAlarms} ${alarmText}</span>` : ''}
                </div>
                <div class="unit-type">${unit.unitType}</div>
                
                ${unit.gensetManufacturer ? `
                <div class="genset-info">
                    <p><strong>${unit.gensetManufacturer}</strong> ${unit.gensetModel || ''}</p>
                    <p>${unit.engineManufacturer || ''} ${unit.engineModel || ''}</p>
                </div>
                ` : ''}
                
                <div class="location">📍 ${unit.location?.address || t('unknownLocation')}</div>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-label">${t('status')}</div>
                        <div class="metric-value">${statusText}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">${isRunning && values ? t('activePower') : t('ratedPower')}</div>
                        <div class="metric-value">${isRunning && values ? Math.round(values.generator?.power?.active || 0) : (unit.powerRating || 0)} ${t('kw')}</div>
                    </div>
                    ${isRunning && values ? `
                    <div class="metric">
                        <div class="metric-label">${t('rpm')}</div>
                        <div class="metric-value">${Math.round(values.engine?.rpm || 0)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">${t('fuel')}</div>
                        <div class="metric-value">${Math.round(values.engine?.fuelLevel || 0)}%</div>
                    </div>
                    ` : ''}
                </div>
                
                ${unit.alarms && unit.alarms.length > 0 ? `
                    <div class="alarm-badge">⚠️ ${unit.alarms[0].message}</div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Show unit details in modal
async function showUnitDetails(unitGuid) {
    const modal = document.getElementById('unit-modal');
    const modalBody = document.getElementById('modal-body');
    
    const unit = allUnits.find(u => u.unitGuid === unitGuid);
    if (!unit) return;
    
    modalBody.innerHTML = `<div class="loading">${t('loadingUnitDetails')}</div>`;
    modal.style.display = 'block';
    
    try {
        // Fetch detailed info and current values
        const [infoResponse, valuesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/${API_VERSION}/${LOGIN_ID}/units/${unitGuid}/info`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Comap-Key': COMAP_KEY
                }
            }),
            fetch(`${API_BASE_URL}/${API_VERSION}/${LOGIN_ID}/units/${unitGuid}/values`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Comap-Key': COMAP_KEY
                }
            })
        ]);
        
        const info = await infoResponse.json();
        const values = await valuesResponse.json();
        
        renderUnitDetails(info, values);
    } catch (error) {
        console.error('Error loading unit details:', error);
        modalBody.innerHTML = `<div class="error">${t('errorLoadingUnit')}</div>`;
    }
}

// Render unit details
function renderUnitDetails(unit, values) {
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h2>${unit.unitName}</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Контроллер' : 'Controller'}</label>
                    <value>${unit.unitType}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Производитель генератора' : 'Genset Manufacturer'}</label>
                    <value>${unit.gensetManufacturer || (currentLang === 'ru' ? 'Н/Д' : 'N/A')}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Модель генератора' : 'Genset Model'}</label>
                    <value>${unit.gensetModel || (currentLang === 'ru' ? 'Н/Д' : 'N/A')}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Двигатель' : 'Engine'}</label>
                    <value>${unit.engineManufacturer || (currentLang === 'ru' ? 'Н/Д' : 'N/A')} ${unit.engineModel || ''}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Альтернатор' : 'Alternator'}</label>
                    <value>${unit.alternatorManufacturer || (currentLang === 'ru' ? 'Н/Д' : 'N/A')} ${unit.alternatorModel || ''}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Номинальная мощность' : 'Power Rating'}</label>
                    <value>${unit.powerRating} ${currentLang === 'ru' ? 'кВт' : 'kW'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Серийный номер' : 'Serial Number'}</label>
                    <value>${unit.serialNumber}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Дата установки' : 'Installation Date'}</label>
                    <value>${new Date(unit.installationDate).toLocaleDateString()}</value>
                </div>
            </div>
        </div>
        
        ${values && values.engine ? `
        <div class="detail-section">
            <h2>${currentLang === 'ru' ? 'Параметры двигателя' : 'Engine Parameters'}</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Обороты двигателя' : 'Engine Speed'}</label>
                    <value>${Math.round(values.engine.rpm)} ${currentLang === 'ru' ? 'об/мин' : 'RPM'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Моточасы' : 'Running Hours'}</label>
                    <value>${Math.round(values.engine.hours)} ${currentLang === 'ru' ? 'ч' : 'h'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Давление масла' : 'Oil Pressure'}</label>
                    <value>${values.engine.oilPressure.toFixed(1)} ${currentLang === 'ru' ? 'пси' : 'psi'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Температура охлаждающей жидкости' : 'Coolant Temp'}</label>
                    <value>${values.engine.coolantTemp.toFixed(1)} °C</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Уровень топлива' : 'Fuel Level'}</label>
                    <value>${Math.round(values.engine.fuelLevel)} %</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Напряжение АКБ' : 'Battery Voltage'}</label>
                    <value>${values.engine.batteryVoltage.toFixed(1)} ${currentLang === 'ru' ? 'В' : 'V'}</value>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h2>${currentLang === 'ru' ? 'Выходные параметры генератора' : 'Generator Output'}</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Напряжение L1-N' : 'Voltage L1-N'}</label>
                    <value>${values.generator.voltage.L1N.toFixed(1)} ${currentLang === 'ru' ? 'В' : 'V'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Напряжение L2-N' : 'Voltage L2-N'}</label>
                    <value>${values.generator.voltage.L2N.toFixed(1)} ${currentLang === 'ru' ? 'В' : 'V'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Напряжение L3-N' : 'Voltage L3-N'}</label>
                    <value>${values.generator.voltage.L3N.toFixed(1)} ${currentLang === 'ru' ? 'В' : 'V'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Ток L1' : 'Current L1'}</label>
                    <value>${values.generator.current.L1.toFixed(1)} ${currentLang === 'ru' ? 'А' : 'A'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Ток L2' : 'Current L2'}</label>
                    <value>${values.generator.current.L2.toFixed(1)} ${currentLang === 'ru' ? 'А' : 'A'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Ток L3' : 'Current L3'}</label>
                    <value>${values.generator.current.L3.toFixed(1)} ${currentLang === 'ru' ? 'А' : 'A'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Частота' : 'Frequency'}</label>
                    <value>${values.generator.frequency.toFixed(2)} ${currentLang === 'ru' ? 'Гц' : 'Hz'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Активная мощность' : 'Active Power'}</label>
                    <value>${Math.round(values.generator.power.active)} ${currentLang === 'ru' ? 'кВт' : 'kW'}</value>
                </div>
                <div class="detail-item">
                    <label>${currentLang === 'ru' ? 'Коэффициент мощности' : 'Power Factor'}</label>
                    <value>${values.generator.powerFactor.toFixed(2)}</value>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${unit.alarms && unit.alarms.length > 0 ? `
        <div class="detail-section">
            <h2>${currentLang === 'ru' ? 'Активные тревоги' : 'Active Alarms'}</h2>
            ${unit.alarms.map(alarm => `
                <div class="alarm-badge" style="display: block; margin-bottom: 10px;">
                    <strong>${alarm.severity}:</strong> ${alarm.message}
                    <br><small>${new Date(alarm.timestamp).toLocaleString()}</small>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="command-buttons">
            <button class="btn-start" onclick="sendCommand('${unit.unitGuid}', 'START')">▶️ Start</button>
            <button class="btn-stop" onclick="sendCommand('${unit.unitGuid}', 'STOP')">⏹️ Stop</button>
            <button class="btn-reset" onclick="sendCommand('${unit.unitGuid}', 'RESET_ALARM')">🔄 Reset Alarm</button>
        </div>
    `;
    
    // Load and display alarms
    loadAlarms(unit.unitGuid).then(alarms => {
        const alarmsSection = document.getElementById('alarms-section');
        const alarmsList = document.getElementById('alarms-list');
        
        if (alarms.length > 0) {
            alarmsSection.style.display = 'block';
            alarmsList.innerHTML = alarms.map(alarm => `
                <div class="alarm-item severity-${alarm.severity.toLowerCase()}">
                    <div class="alarm-item-header">
                        <span class="alarm-severity">${alarm.severity}</span>
                        <span class="alarm-timestamp">${new Date(alarm.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="alarm-message">${alarm.message}</div>
                    ${alarm.value ? `<div class="alarm-details">Value: ${alarm.value} (Threshold: ${alarm.threshold || 'N/A'})</div>` : ''}
                </div>
            `).join('');
        }
    });
}

// Theme switcher
function setupThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
        // Update icon
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        
        // Save preference
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// Language switcher
function setupLanguageSwitcher() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const lang = btn.dataset.lang;
            currentLang = lang;
            localStorage.setItem('language', lang);
            
            // Load new translations
            translations = await loadTranslations(lang);
            
            // Update button states
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply translations
            applyTranslations();
            
            // Notify iframe about language change
            const architectureIframe = document.getElementById('architecture-diagram');
            if (architectureIframe && architectureIframe.contentWindow) {
                architectureIframe.contentWindow.postMessage({
                    type: 'languageChange',
                    lang: lang
                }, '*');
            }
            
            // Reload units to update all text
            if (allUnits.length > 0) {
                renderUnits(allUnits);
                updateStats(allUnits);
            }
        });
    });
    
    // Set initial button state
    langButtons.forEach(btn => {
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        }
    });
}

function applyTranslations() {
    // Navigation - target specific nav items
    const dashboardNav = document.querySelector('#dashboard-nav span:not(.nav-icon)');
    const analyseNav = document.querySelector('#analyse-nav span:not(.nav-icon)');
    const managementNav = document.querySelector('#management-nav span:not(.nav-icon)');
    const apiNav = document.querySelector('#api-nav span:not(.nav-icon)');
    const architectureNav = document.querySelector('#architecture-nav span:not(.nav-icon)');
    const navItems = document.querySelectorAll('.nav-item:not(#dashboard-nav):not(#units-nav):not(#analyse-nav):not(#management-nav):not(#api-nav):not(#architecture-nav) span:not(.nav-icon)');
    
    if (dashboardNav) dashboardNav.textContent = t('dashboard');
    if (analyseNav) analyseNav.textContent = t('analyse');
    if (managementNav) managementNav.textContent = t('management');
    if (apiNav) apiNav.textContent = t('api');
    if (architectureNav) architectureNav.textContent = t('architecture');
    if (navItems[0]) navItems[0].textContent = t('help');
    
    // Status
    const statusBadge = document.getElementById('connection-status');
    if (statusBadge && statusBadge.textContent.includes('Connected') || statusBadge.textContent.includes('Подключено')) {
        statusBadge.textContent = t('connected');
    }
    
    // Last update
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const timeMatch = lastUpdate.textContent.match(/\d{2}:\d{2}:\d{2}/);
        if (timeMatch) {
            lastUpdate.textContent = `${t('lastUpdate')}: ${timeMatch[0]}`;
        } else {
            lastUpdate.textContent = `${t('lastUpdate')}: --:--:--`;
        }
    }
    
    // Page header
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        pageHeader.textContent = `${t('dashboardOverview')}`;
    }
    
    // Filters
    document.getElementById('search').placeholder = t('searchUnits');
    document.querySelector('#refresh-btn').innerHTML = `🔄 ${t('refresh')}`;
    
    // Status filter
    const statusFilter = document.getElementById('status-filter');
    statusFilter.options[0].text = t('allStatus');
    statusFilter.options[1].text = t('running');
    statusFilter.options[2].text = t('standby');
    statusFilter.options[3].text = t('warning');
    
    // Manufacturer filter
    const mfgFilter = document.getElementById('manufacturer-filter');
    mfgFilter.options[0].text = t('allManufacturers');
    
    // Stats cards
    const statCards = document.querySelectorAll('.stat-card h3');
    if (statCards[0]) statCards[0].textContent = t('totalUnits');
    if (statCards[1]) statCards[1].textContent = t('running');
    if (statCards[2]) statCards[2].textContent = t('standby');
    if (statCards[3]) statCards[3].textContent = t('warning');
    if (statCards[4]) statCards[4].textContent = t('totalPower');
    
    // Dropdown header
    const dropdownHeader = document.querySelector('.dropdown-header');
    if (dropdownHeader) {
        dropdownHeader.textContent = t('selectUnit');
    }
    
    // Management tab labels
    const tabLabels = document.querySelectorAll('.tab-label');
    if (tabLabels[0]) tabLabels[0].textContent = t('usersTab');
    if (tabLabels[1]) tabLabels[1].textContent = t('unitConfigTab');
    if (tabLabels[2]) tabLabels[2].textContent = t('systemSettingsTab');
    if (tabLabels[3]) tabLabels[3].textContent = t('reportsTab');
    
    // Table headers with data-key attribute
    document.querySelectorAll('.translate[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (key) el.textContent = t(key);
    });
}

// Send command to unit
async function sendCommand(unitGuid, command) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/${API_VERSION}/${LOGIN_ID}/units/${unitGuid}/commands`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Comap-Key': COMAP_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            }
        );
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`✅ Command ${command} sent successfully!`);
            setTimeout(() => loadUnits(), 1000);
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error sending command:', error);
        alert('❌ Error sending command');
    }
}

// Setup filters
function setupFilters() {
    const searchInput = document.getElementById('search');
    const statusFilter = document.getElementById('status-filter');
    const mfgFilter = document.getElementById('manufacturer-filter');
    
    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const mfgValue = mfgFilter.value;
        
        const filtered = allUnits.filter(unit => {
            const matchesSearch = !searchTerm || 
                unit.unitName.toLowerCase().includes(searchTerm) ||
                unit.unitType.toLowerCase().includes(searchTerm) ||
                (unit.gensetManufacturer && unit.gensetManufacturer.toLowerCase().includes(searchTerm));
            
            const matchesStatus = !statusValue || unit.status === statusValue;
            const matchesMfg = !mfgValue || unit.gensetManufacturer === mfgValue;
            
            return matchesSearch && matchesStatus && matchesMfg;
        });
        
        renderUnits(filtered);
    };
    
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    mfgFilter.addEventListener('change', applyFilters);
}

// Setup modal
function setupModal() {
    const modal = document.getElementById('unit-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Setup navigation
function setupNavigation() {
    const dashboardNav = document.getElementById('dashboard-nav');
    const managementNav = document.getElementById('management-nav');
    const analyseNav = document.getElementById('analyse-nav');
    const apiNav = document.getElementById('api-nav');
    const unitsNav = document.getElementById('units-nav');
    const unitsDropdown = document.getElementById('units-dropdown');
    
    if (dashboardNav) {
        dashboardNav.addEventListener('click', () => {
            switchSection('dashboard');
        });
    }
    
    if (managementNav) {
        managementNav.addEventListener('click', () => {
            switchSection('management');
        });
    }
    
    if (analyseNav) {
        analyseNav.addEventListener('click', () => {
            switchSection('analyse');
        });
    }
    
    if (apiNav) {
        apiNav.addEventListener('click', () => {
            switchSection('api');
        });
    }
    
    const architectureNav = document.getElementById('architecture-nav');
    if (architectureNav) {
        architectureNav.addEventListener('click', () => {
            switchSection('architecture');
        });
    }
    
    // Units dropdown toggle
    if (unitsNav && unitsDropdown) {
        unitsNav.addEventListener('mouseenter', () => {
            unitsDropdown.style.display = 'block';
        });
        
        unitsNav.addEventListener('mouseleave', (e) => {
            // Check if mouse is moving to dropdown
            setTimeout(() => {
                if (!unitsDropdown.matches(':hover') && !unitsNav.matches(':hover')) {
                    unitsDropdown.style.display = 'none';
                }
            }, 100);
        });
        
        unitsDropdown.addEventListener('mouseleave', () => {
            unitsDropdown.style.display = 'none';
        });
    }
}

// Switch between sections
function switchSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Load management data if needed
    if (sectionName === 'management') {
        loadManagementData();
    }
    
    // Initialize charts if needed
    if (sectionName === 'analyse' && Object.keys(charts).length === 0) {
        setTimeout(() => {
            initializeCharts();
        }, 100);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update units menu in navigation
function updateUnitsMenu(units) {
    const menuList = document.getElementById('units-menu-list');
    
    if (!menuList) return;
    
    if (units.length === 0) {
        menuList.innerHTML = `<div class="dropdown-loading">${t('noUnitsInDropdown')}</div>`;
        return;
    }
    
    menuList.innerHTML = units.map(unit => `
        <div class="unit-menu-item" onclick="showUnitDetails('${unit.unitGuid}')">
            <div class="unit-menu-info">
                <div class="unit-menu-name">${unit.unitName}</div>
                <div class="unit-menu-type">${unit.unitType}</div>
            </div>
            <span class="unit-menu-status ${unit.status.toLowerCase()}">${unit.status}</span>
        </div>
    `).join('');
}

// ========== MANAGEMENT FEATURES ==========

let users = [];
let currentManagementTab = 'users';

// Setup management tabs
function setupManagementTabs() {
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
            
            currentManagementTab = tabId;
        });
    });
}

// Setup management modals
function setupManagementModals() {
    // Add User Modal
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    const saveUserBtn = document.getElementById('save-user-btn');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            addUserModal.classList.add('active');
        });
    }
    
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', () => {
            addUserModal.classList.remove('active');
            clearUserForm();
        });
    }
    
    if (saveUserBtn) {
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
    }
    
    // Edit Unit Modal
    const editUnitModal = document.getElementById('edit-unit-modal');
    const cancelUnitBtn = document.getElementById('cancel-unit-btn');
    const saveUnitBtn = document.getElementById('save-unit-btn');
    
    if (cancelUnitBtn) {
        cancelUnitBtn.addEventListener('click', () => {
            editUnitModal.classList.remove('active');
        });
    }
    
    if (saveUnitBtn) {
        saveUnitBtn.addEventListener('click', () => {
            editUnitModal.classList.remove('active');
        });
    }
    
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

// Load management data
function loadManagementData() {
    loadUsers();
    renderUnitsConfig();
}

function loadUsers() {
    // Mock user data
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

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
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
    if (!grid || allUnits.length === 0) return;
    
    const statusLabels = {
        en: { Running: 'Online', Stopped: 'Offline', Standby: 'Standby' },
        ru: { Running: 'В сети', Stopped: 'Не в сети', Standby: 'Ожидание' }
    };
    
    grid.innerHTML = allUnits.map(unit => {
        // Get live values for this unit if available
        const values = unitValues.get(unit.unitGuid) || {};
        const activePower = values.activePower || 0;
        const runningHours = values.runningHours || 0;
        
        return `
        <div class="unit-config-card">
            <div class="unit-config-header">
                <div>
                    <h3 class="unit-config-title">${unit.unitName}</h3>
                    <p class="unit-config-location">${unit.siteName || unit.location?.address || 'N/A'}</p>
                </div>
                <div class="unit-config-status ${unit.status.toLowerCase()}">
                    <span class="status-dot"></span>
                    <span>${statusLabels[currentLang][unit.status] || unit.status}</span>
                </div>
            </div>
            <div class="unit-config-details">
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Rated Power' : 'Номинальная мощность'}</span>
                    <span class="config-value">${unit.powerRating || 0} ${currentLang === 'en' ? 'kW' : 'кВт'}</span>
                </div>
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Current Power' : 'Текущая мощность'}</span>
                    <span class="config-value">${activePower} ${currentLang === 'en' ? 'kW' : 'кВт'}</span>
                </div>
                <div class="config-detail">
                    <span class="config-label">${currentLang === 'en' ? 'Running Hours' : 'Часы работы'}</span>
                    <span class="config-value">${runningHours} ${currentLang === 'en' ? 'hrs' : 'ч'}</span>
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
                <button class="btn-secondary btn-small" onclick="showUnitDetails('${unit.unitGuid}')">
                    👁️ ${currentLang === 'en' ? 'View' : 'Просмотр'}
                </button>
            </div>
        </div>
    `}).join('');
}

// User actions
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

// Unit configuration actions
function editUnitConfig(unitGuid) {
    const unit = allUnits.find(u => u.unitGuid === unitGuid);
    if (unit) {
        const modal = document.getElementById('edit-unit-modal');
        document.getElementById('edit-unit-name').value = unit.unitName;
        document.getElementById('edit-unit-location').value = unit.siteName || unit.location?.address || '';
        document.getElementById('edit-unit-power').value = unit.powerRating || 0;
        document.getElementById('edit-unit-maintenance').value = 500;
        document.getElementById('edit-unit-enabled').checked = unit.status !== 'Stopped';
        modal.classList.add('active');
    }
}

// ========== ANALYTICS SECTION ==========

let charts = {};
let currentTimeRange = '1h';

// Setup analytics navigation
function setupAnalyticsNavigation() {
    const analyseNav = document.getElementById('analyse-nav');
    
    if (analyseNav) {
        analyseNav.addEventListener('click', () => {
            switchSection('analyse');
        });
    }
}

// Initialize charts
function initializeCharts() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    // Set default chart options
    Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--text-secondary');
    Chart.defaults.borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    createPowerChart();
    createStatusChart();
    createEfficiencyChart();
    createFuelChart();
    createTemperatureChart();
    createAlarmChart();
    createHoursChart();
    createPerformanceGauge();

    setupTimeRangeSelector();
    setupChartExport();
    setupChartExpansion();
}

// Setup chart expansion on click
function setupChartExpansion() {
    const chartCards = document.querySelectorAll('.chart-card');
    
    chartCards.forEach(card => {
        // Add expand indicator
        const indicator = document.createElement('div');
        indicator.className = 'expand-indicator';
        indicator.innerHTML = '⛶';
        card.appendChild(indicator);
        
        card.addEventListener('click', function(e) {
            // Don't toggle if clicking on buttons or selects
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') {
                return;
            }
            
            const wasExpanded = this.classList.contains('expanded');
            
            // Collapse all other cards
            chartCards.forEach(c => {
                c.classList.remove('expanded');
                const canvas = c.querySelector('canvas');
                if (canvas && charts[canvas.id.replace('-chart', '').replace('-gauge', '')]) {
                    const chart = charts[canvas.id.replace('-chart', '').replace('-gauge', '')];
                    if (chart) {
                        chart.resize();
                    }
                }
            });
            
            // Toggle this card
            if (!wasExpanded) {
                this.classList.add('expanded');
                indicator.innerHTML = '⛶';
                
                // Scroll to the card
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                
                // Resize the chart
                const canvas = this.querySelector('canvas');
                if (canvas) {
                    const chartKey = canvas.id.replace('-chart', '').replace('-gauge', '');
                    if (charts[chartKey]) {
                        setTimeout(() => {
                            charts[chartKey].resize();
                        }, 350);
                    }
                }
            }
        });
    });
}

// Power Generation Chart
function createPowerChart() {
    const ctx = document.getElementById('power-chart');
    if (!ctx) return;

    const timeLabels = generateTimeLabels(currentTimeRange);
    const powerData = generatePowerData(timeLabels.length);
    const targetData = Array(timeLabels.length).fill(1500);

    charts.power = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Active Power (kW)',
                    data: powerData,
                    borderColor: '#FA7000',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Target',
                    data: targetData,
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Status Distribution Chart
function createStatusChart() {
    const ctx = document.getElementById('status-chart');
    if (!ctx) return;

    const statusCounts = {
        running: allUnits.filter(u => u.status === 'Running').length,
        standby: allUnits.filter(u => u.status === 'Standby').length,
        stopped: allUnits.filter(u => u.status === 'Stopped').length
    };

    document.getElementById('chart-running').textContent = statusCounts.running;
    document.getElementById('chart-standby').textContent = statusCounts.standby;
    document.getElementById('chart-stopped').textContent = statusCounts.stopped;

    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Running', 'Standby', 'Stopped'],
            datasets: [{
                data: [statusCounts.running, statusCounts.standby, statusCounts.stopped],
                backgroundColor: ['#10b981', '#f59e0b', '#6b7280'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Efficiency Trend Chart
function createEfficiencyChart() {
    const ctx = document.getElementById('efficiency-chart');
    if (!ctx) return;

    const timeLabels = generateTimeLabels(currentTimeRange);
    const efficiencyData = generateEfficiencyData(timeLabels.length);
    const avgEfficiency = Math.round(efficiencyData.reduce((a, b) => a + b) / efficiencyData.length);
    
    document.getElementById('avg-efficiency').textContent = avgEfficiency;

    charts.efficiency = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Efficiency %',
                data: efficiencyData,
                borderColor: '#FA7000',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Fuel Consumption Chart
function createFuelChart() {
    const ctx = document.getElementById('fuel-chart');
    if (!ctx) return;

    const unitNames = allUnits.slice(0, 8).map(u => u.unitName);
    const fuelData = allUnits.slice(0, 8).map(() => Math.random() * 500 + 200);

    charts.fuel = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: unitNames,
            datasets: [{
                label: 'Fuel (L)',
                data: fuelData,
                backgroundColor: '#FA7000',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Temperature Monitoring Chart
function createTemperatureChart() {
    const ctx = document.getElementById('temperature-chart');
    if (!ctx) return;

    const timeLabels = generateTimeLabels(currentTimeRange);
    const coolantData = generateTemperatureData(timeLabels.length, 75, 90);
    const oilData = generateTemperatureData(timeLabels.length, 85, 100);

    const avgCoolant = Math.round(coolantData.reduce((a, b) => a + b) / coolantData.length);
    const avgOil = Math.round(oilData.reduce((a, b) => a + b) / oilData.length);
    
    document.getElementById('avg-coolant').textContent = avgCoolant + '°C';
    document.getElementById('avg-oil').textContent = avgOil + '°C';

    charts.temperature = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Coolant Temp',
                    data: coolantData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Oil Temp',
                    data: oilData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Alarm Frequency Chart
function createAlarmChart() {
    const ctx = document.getElementById('alarm-chart');
    if (!ctx) return;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const criticalData = [2, 1, 0, 3, 1, 0, 2];
    const warningData = [5, 3, 4, 6, 3, 2, 4];
    const infoData = [8, 6, 7, 9, 5, 4, 6];

    document.getElementById('critical-alarms').textContent = criticalData.reduce((a, b) => a + b);
    document.getElementById('warning-alarms').textContent = warningData.reduce((a, b) => a + b);
    document.getElementById('info-alarms').textContent = infoData.reduce((a, b) => a + b);

    charts.alarm = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [
                {
                    label: 'Critical',
                    data: criticalData,
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Warning',
                    data: warningData,
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Info',
                    data: infoData,
                    backgroundColor: '#3b82f6'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        }
    });
}

// Running Hours Chart
function createHoursChart() {
    const ctx = document.getElementById('hours-chart');
    if (!ctx) return;

    const unitNames = allUnits.slice(0, 8).map(u => u.unitName);
    const currentHours = allUnits.slice(0, 8).map(u => u.runningHours);
    const previousHours = currentHours.map(h => h * 0.85);

    charts.hours = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: unitNames,
            datasets: [
                {
                    label: 'Current Period',
                    data: currentHours,
                    backgroundColor: '#FA7000',
                    borderRadius: 6
                },
                {
                    label: 'Previous Period',
                    data: previousHours,
                    backgroundColor: '#f7931e',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Performance Gauge
function createPerformanceGauge() {
    const ctx = document.getElementById('performance-gauge');
    if (!ctx) return;

    const score = 87;
    document.getElementById('performance-score').textContent = score;
    document.getElementById('availability-score').textContent = '94%';
    document.getElementById('reliability-score').textContent = '91%';

    charts.performance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: ['#10b981', 'rgba(107, 114, 128, 0.2)'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });
}

// Helper functions
function generateTimeLabels(range) {
    const labels = [];
    let count, format;
    
    switch(range) {
        case '1h':
            count = 12;
            for (let i = count - 1; i >= 0; i--) {
                labels.unshift(`${i * 5}m ago`);
            }
            break;
        case '6h':
            count = 12;
            for (let i = count - 1; i >= 0; i--) {
                labels.unshift(`${i * 30}m ago`);
            }
            break;
        case '24h':
            count = 24;
            for (let i = count - 1; i >= 0; i--) {
                labels.unshift(`${i}h ago`);
            }
            break;
        case '7d':
            labels.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
            break;
        case '30d':
            count = 30;
            for (let i = count - 1; i >= 0; i--) {
                labels.unshift(`Day ${30 - i}`);
            }
            break;
    }
    
    return labels;
}

function generatePowerData(length) {
    const data = [];
    let baseValue = 1200;
    
    for (let i = 0; i < length; i++) {
        baseValue += (Math.random() - 0.5) * 200;
        baseValue = Math.max(800, Math.min(1800, baseValue));
        data.push(Math.round(baseValue));
    }
    
    return data;
}

function generateEfficiencyData(length) {
    const data = [];
    let baseValue = 85;
    
    for (let i = 0; i < length; i++) {
        baseValue += (Math.random() - 0.5) * 5;
        baseValue = Math.max(75, Math.min(95, baseValue));
        data.push(Math.round(baseValue));
    }
    
    return data;
}

function generateTemperatureData(length, min, max) {
    const data = [];
    let baseValue = (min + max) / 2;
    
    for (let i = 0; i < length; i++) {
        baseValue += (Math.random() - 0.5) * 5;
        baseValue = Math.max(min, Math.min(max, baseValue));
        data.push(Math.round(baseValue));
    }
    
    return data;
}

// Setup time range selector
function setupTimeRangeSelector() {
    const timeButtons = document.querySelectorAll('.time-btn');
    
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentTimeRange = btn.dataset.range;
            updateChartsTimeRange();
        });
    });
}

function updateChartsTimeRange() {
    // Destroy and recreate charts with new time range
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    
    charts = {};
    initializeCharts();
}

// Setup chart export
function setupChartExport() {
    const exportBtn = document.getElementById('export-data-btn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            alert('Export functionality coming soon!\n\nThis will allow you to download analytics data in CSV or PDF format.');
        });
    }
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navMenu.classList.toggle('mobile-open');
        });
        
        // Close menu when clicking a nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('mobile-open');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('mobile-open');
            }
        });
    }
});

// Alarms functionality
let allAlarms = [];

function setupAlarms() {
    loadAlarms();
    setupAlarmFilters();
    
    // Auto-refresh alarms every 10 seconds
    setInterval(() => {
        loadAlarms(true);
    }, 10000);
}

async function loadAlarms(silent = false) {
    if (!silent) {
        document.getElementById('alarms-table-body').innerHTML = '<tr><td colspan="7" class="loading">Loading alarms...</td></tr>';
    }
    
    // Generate mock alarm data from COMAP controller codes
    // In production, this would fetch from the API endpoint
    allAlarms = generateMockAlarms();
    
    updateAlarmStats();
    displayAlarms(allAlarms);
}

function generateMockAlarms() {
    const comapAlarmCodes = [
        { 
            code: 'E001', 
            description: currentLang === 'ru' ? 'Активирован аварийный останов' : 'Emergency Stop Activated', 
            severity: 'critical' 
        },
        { 
            code: 'E002', 
            description: currentLang === 'ru' ? 'Низкое давление масла' : 'Low Oil Pressure', 
            severity: 'critical' 
        },
        { 
            code: 'E003', 
            description: currentLang === 'ru' ? 'Высокая температура двигателя' : 'High Engine Temperature', 
            severity: 'critical' 
        },
        { 
            code: 'E004', 
            description: currentLang === 'ru' ? 'Обнаружено превышение скорости' : 'Overspeed Detected', 
            severity: 'critical' 
        },
        { 
            code: 'W001', 
            description: currentLang === 'ru' ? 'Низкий уровень охлаждающей жидкости' : 'Low Coolant Level', 
            severity: 'warning' 
        },
        { 
            code: 'W002', 
            description: currentLang === 'ru' ? 'Низкое напряжение аккумулятора' : 'Battery Voltage Low', 
            severity: 'warning' 
        },
        { 
            code: 'W003', 
            description: currentLang === 'ru' ? 'Высокий расход топлива' : 'High Fuel Consumption', 
            severity: 'warning' 
        },
        { 
            code: 'W004', 
            description: currentLang === 'ru' ? 'Требуется обслуживание воздушного фильтра' : 'Air Filter Maintenance Due', 
            severity: 'warning' 
        },
        { 
            code: 'I001', 
            description: currentLang === 'ru' ? 'Напоминание о плановом обслуживании' : 'Maintenance Schedule Reminder', 
            severity: 'info' 
        },
        { 
            code: 'I002', 
            description: currentLang === 'ru' ? 'Генератор запущен' : 'Generator Started', 
            severity: 'info' 
        },
        { 
            code: 'I003', 
            description: currentLang === 'ru' ? 'Переключение нагрузки завершено' : 'Load Transfer Complete', 
            severity: 'info' 
        }
    ];
    
    const statuses = ['active', 'acknowledged', 'cleared'];
    const alarms = [];
    
    // Generate 5-15 random alarms
    const alarmCount = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < alarmCount; i++) {
        const alarm = comapAlarmCodes[Math.floor(Math.random() * comapAlarmCodes.length)];
        const unit = allUnits[Math.floor(Math.random() * Math.min(allUnits.length, 3))] || { name: 'GenSet-001' };
        const hoursAgo = Math.floor(Math.random() * 72);
        const timestamp = new Date(Date.now() - hoursAgo * 3600000);
        
        alarms.push({
            id: `alarm-${Date.now()}-${i}`,
            severity: alarm.severity,
            unit: unit.name,
            code: alarm.code,
            description: alarm.description,
            timestamp: timestamp.toISOString(),
            status: hoursAgo < 2 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    
    return alarms.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function updateAlarmStats() {
    const critical = allAlarms.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const warning = allAlarms.filter(a => a.severity === 'warning' && a.status === 'active').length;
    const info = allAlarms.filter(a => a.severity === 'info' && a.status === 'active').length;
    const total = critical + warning + info;
    
    document.getElementById('critical-alarms-count').textContent = critical;
    document.getElementById('warning-alarms-count').textContent = warning;
    document.getElementById('info-alarms-count').textContent = info;
    document.getElementById('total-alarms-count').textContent = total;
}

function displayAlarms(alarms) {
    const tbody = document.getElementById('alarms-table-body');
    
    const noAlarmsText = currentLang === 'ru' ? 'Тревоги не найдены' : 'No alarms found';
    const acknowledgeText = currentLang === 'ru' ? 'Подтвердить' : 'Acknowledge';
    const clearText = currentLang === 'ru' ? 'Очистить' : 'Clear';
    
    if (alarms.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">${noAlarmsText}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = alarms.map(alarm => `
        <tr class="${alarm.severity}">
            <td>
                <span class="alarm-severity-badge ${alarm.severity}">
                    ${alarm.severity === 'critical' ? '⚠️' : alarm.severity === 'warning' ? '⚡' : 'ℹ️'}
                    ${alarm.severity}
                </span>
            </td>
            <td><strong>${alarm.unit}</strong></td>
            <td><code style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: 4px;">${alarm.code}</code></td>
            <td>${alarm.description}</td>
            <td>${formatAlarmTimestamp(alarm.timestamp)}</td>
            <td>
                <span class="alarm-status-badge ${alarm.status}">${translateStatus(alarm.status)}</span>
            </td>
            <td>
                <div class="alarm-actions">
                    ${alarm.status === 'active' ? `<button class="alarm-action-btn" onclick="acknowledgeAlarm('${alarm.id}')">${acknowledgeText}</button>` : ''}
                    ${alarm.status !== 'cleared' ? `<button class="alarm-action-btn" onclick="clearAlarm('${alarm.id}')">${clearText}</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function translateStatus(status) {
    if (currentLang === 'ru') {
        const statusMap = {
            'active': 'Активно',
            'acknowledged': 'Подтверждено',
            'cleared': 'Очищено'
        };
        return statusMap[status] || status;
    }
    return status;
}

function formatAlarmTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (currentLang === 'ru') {
        if (diffMins < 1) return 'Только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;
    } else {
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
    }
    
    return date.toLocaleString();
}

function setupAlarmFilters() {
    const severityFilter = document.getElementById('alarm-severity-filter');
    const statusFilter = document.getElementById('alarm-status-filter');
    const searchInput = document.getElementById('alarm-search');
    const clearAllBtn = document.getElementById('clear-all-alarms-btn');
    
    const applyFilters = () => {
        let filtered = [...allAlarms];
        
        const severity = severityFilter.value;
        if (severity) {
            filtered = filtered.filter(a => a.severity === severity);
        }
        
        const status = statusFilter.value;
        if (status) {
            filtered = filtered.filter(a => a.status === status);
        }
        
        const search = searchInput.value.toLowerCase();
        if (search) {
            filtered = filtered.filter(a => 
                a.unit.toLowerCase().includes(search) ||
                a.code.toLowerCase().includes(search) ||
                a.description.toLowerCase().includes(search)
            );
        }
        
        displayAlarms(filtered);
    };
    
    severityFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
    
    clearAllBtn.addEventListener('click', () => {
        const confirmText = currentLang === 'ru' ? 'Очистить все активные тревоги?' : 'Clear all active alarms?';
        if (confirm(confirmText)) {
            allAlarms.forEach(a => {
                if (a.status === 'active' || a.status === 'acknowledged') {
                    a.status = 'cleared';
                }
            });
            updateAlarmStats();
            displayAlarms(allAlarms);
        }
    });
}

function acknowledgeAlarm(alarmId) {
    const alarm = allAlarms.find(a => a.id === alarmId);
    if (alarm) {
        alarm.status = 'acknowledged';
        updateAlarmStats();
        displayAlarms(allAlarms);
    }
}

function clearAlarm(alarmId) {
    const alarm = allAlarms.find(a => a.id === alarmId);
    if (alarm) {
        alarm.status = 'cleared';
        updateAlarmStats();
        displayAlarms(allAlarms);
    }
}


