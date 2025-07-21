// Глобальная функция-заглушка для API YouTube
function onYouTubeIframeAPIReady() {
    window.youtubeApiReady = true;
    window.dispatchEvent(new Event('youtubeApiReady'));
}

document.addEventListener('DOMContentLoaded', () => {
    // --- КОНФИГУРАЦИЯ ---
    const X_MASTER_KEY = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';
    const POLLING_INTERVAL = 3500;

    // --- ВАШИ СТАТИЧЕСКИЕ ДАННЫЕ ---
    const STATIC_BIN_ID = '687ebac9f7e7a370d1eba7fa'; 
    const PASSWORD_HE = '18092000';
    const PASSWORD_SHE = '06112002';
    
    // --- DOM ЭЛЕМЕНТЫ ---
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const roomScreen = document.getElementById('room-screen');
    const mainContent = document.getElementById('main-content');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    // ... и остальные элементы по их ID
    
    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let state = {
        binId: null,
        userRole: null,
        pollingTimer: null,
        countdownInterval: null,
        localData: null,
        youtubePlayer: null,
        isPlayerReady: false,
        lastActionTimestamp: 0,
    };
    
    // --- ФУНКЦИИ-ПОМОЩНИКИ ---
    function showScreen(screenName) {
        loader.classList.add('hidden');
        app.classList.add('hidden');
        roomScreen.classList.add('hidden');
        mainContent.classList.add('hidden');

        if (screenName === 'loader') {
            loader.classList.remove('hidden');
        } else if (screenName === 'room') {
            app.classList.remove('hidden');
            roomScreen.classList.remove('hidden');
        } else if (screenName === 'main') {
            app.classList.remove('hidden');
            mainContent.classList.remove('hidden');
        }
    }

    // --- API JSONBIN.IO ---
    async function apiCall(url, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Master-Key': X_MASTER_KEY,
            'X-Access-Key': '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq'
        };
        try {
            const options = { method, headers, body: body ? JSON.stringify(body) : null };
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("API call failed:", error);
            alert("Ошибка сети или сервера. Попробуйте снова.");
            return null;
        }
    }
    
    async function readBin(binId) {
        const data = await apiCall(`${JSONBIN_URL}/${binId}/latest`);
        return data ? data.record : null;
    }
    
    async function updateBin(binId, data) {
        return await apiCall(`${JSONBIN_URL}/${binId}`, 'PUT', data);
    }
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        showScreen('loader');
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                showScreen('room');
            }, 1000);
        }, 3000);
        
        setupEventListeners();
    }
    
    function setupEventListeners() {
        loginBtn.addEventListener('click', handleLogin);
        passwordInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') handleLogin();
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        // Тут должны быть все остальные слушатели событий
    }

    // --- ЛОГИКА ВХОДА ---
    function handleLogin() {
        const password = passwordInput.value;
        let userRole = null;

        if (password === PASSWORD_HE) {
            userRole = 'he';
        } else if (password === PASSWORD_SHE) {
            userRole = 'she';
        }

        if (userRole) {
            startSession(STATIC_BIN_ID, userRole);
        } else {
            alert('Неверный пароль. Попробуйте снова.');
            passwordInput.value = '';
        }
    }

    // --- СЕССИЯ И СИНХРОНИЗАЦИЯ ---
    async function startSession(binId, role) {
        state.binId = binId;
        state.userRole = role;
        showScreen('main');
        
        // populatePalettes(); // Нужно определить эту функцию
        
        if (window.youtubeApiReady) {
            setupYouTubePlayer();
        } else {
            window.addEventListener('youtubeApiReady', setupYouTubePlayer, { once: true });
        }
        
        await pollServer();
        state.pollingTimer = setInterval(pollServer, POLLING_INTERVAL);
    }

    async function pollServer() {
        if (!state.binId) return;
        const data = await readBin(state.binId);
        if (data && JSON.stringify(data) !== JSON.stringify(state.localData)) {
            // Если данных нет, создаем первоначальную структуру
            if (Object.keys(data).length < 2) { 
                 const initialData = getInitialState();
                 await updateBin(state.binId, initialData);
                 state.localData = initialData;
                 updateUI(initialData);
            } else {
                 state.localData = data;
                 updateUI(data);
            }
        }
    }
    
    function getInitialState() {
        return {
            hearts: { he: { color: '#4169e1', emoji: '❤️' }, she: { color: '#ff69b4', emoji: '❤️' } },
            question: { date: "1970-01-01", answers: { he: null, she: null } },
            countdown: { targetDate: null },
            action: { from: null, type: null, timestamp: 0 },
            playlist: { songs: [], currentIndex: 0, isPlaying: false, timestamp: 0 },
            memories: [],
            game: { node: 'start', choices: { he: null, she: null }, inventory: [], syncScore: 50, minigame: {} }
        };
    }

    // --- ГЛАВНЫЙ ОБНОВИТЕЛЬ UI ---
    function updateUI(data) {
        // Здесь будут вызовы всех функций для обновления каждой части интерфейса
        // например, updateHeartsUI(data.hearts), updateGameUI(data.game) и т.д.
        // Этот код очень большой, поэтому здесь опущен, но он необходим для работы.
    }
    
    function setupYouTubePlayer() {
        if (state.youtubePlayer) return;
        try {
            state.youtubePlayer = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                playerVars: { 'autoplay': 0, 'controls': 1 },
                events: {
                    'onReady': () => { state.isPlayerReady = true; },
                    'onStateChange': onPlayerStateChange
                }
            });
        } catch (e) {
            console.error("Failed to create YouTube player:", e);
        }
    }

    function onPlayerStateChange(event) {
        // Логика синхронизации состояния плеера
    }

    function switchTab(tabId) {
        tabContents.forEach(content => content.classList.remove('active'));
        tabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId + '-tab').classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    // --- ЗАПУСК ---
    init();
});
