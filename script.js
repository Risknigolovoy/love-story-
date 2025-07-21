document.addEventListener('DOMContentLoaded', () => {
    // --- КОНФИГУРАЦИЯ ---
    const X_MASTER_KEY = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';
    const POLLING_INTERVAL = 3500;
    const COMPLIMENT_INTERVAL = 9000;

    const STATIC_BIN_ID = '687ebac9f7e7a370d1eba7fa'; 
    const PASSWORD_HE = '18092000';
    const PASSWORD_SHE = '06112002';
    
    // --- DOM ЭЛЕМЕНТЫ ---
    const dom = {
        loader: document.getElementById('loader'),
        app: document.getElementById('app'),
        roomScreen: document.getElementById('room-screen'),
        mainContent: document.getElementById('main-content'),
        passwordInput: document.getElementById('password-input'),
        loginBtn: document.getElementById('login-btn'),
        tabs: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
        heHeart: document.getElementById('he-heart'),
        sheHeart: document.getElementById('she-heart'),
        heEmoji: document.getElementById('he-emoji'),
        sheEmoji: document.getElementById('she-emoji'),
        controls: document.getElementById('controls'),
        colorPalette: document.getElementById('color-palette'),
        emojiPalette: document.getElementById('emoji-palette'),
        confirmChoiceBtn: document.getElementById('confirm-choice-btn'),
        complimentText: document.getElementById('compliment-text'),
        qotdQuestion: document.getElementById('qotd-question'),
        myAnswerInput: document.getElementById('my-answer-input'),
        submitAnswerBtn: document.getElementById('submit-answer-btn'),
        partnerAnswerDiv: document.getElementById('qotd-partner-answer'),
        partnerAnswerText: document.getElementById('partner-answer-text'),
        qotdStatus: document.getElementById('qotd-status'),
        inventoryList: document.getElementById('inventory-list'),
        syncScoreBar: document.getElementById('sync-score-bar'),
        gameStory: document.getElementById('game-story'),
        gameChoices: document.getElementById('game-choices'),
        gameStatus: document.getElementById('game-status'),
        historyList: document.getElementById('history-list'),
        sendKissBtn: document.getElementById('send-kiss-btn'),
        sendHugBtn: document.getElementById('send-hug-btn'),
        animationContainer: document.getElementById('action-animation-container'),
    };
    
    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let state = { binId: null, userRole: null, pollingTimer: null, complimentTimer: null, localData: null, lastActionTimestamp: 0 };
    
    // --- ДАННЫЕ (Комплименты, Вопросы, Игра) ---
    const compliments = [ "Я люблю тебя до луны и обратно.", "Скучаю по твоему голосу.", "Ты - моё самое большое приключение.", "Каждая секунда без тебя - вечность.", "Мы справимся с любым расстоянием.", "Думаю о тебе прямо сейчас.", "Ты делаешь мой мир ярче.", "Скорей бы тебя обнять.", "Ты моё солнышко в пасмурный день.", "Спасибо, что ты есть у меня.", "Ты — причина моей улыбки.", "Наши сердца бьются в унисон." ];
    const questions = [ "Какое твоё самое тёплое детское воспоминание?", "Если бы ты мог(ла) иметь любую суперсилу, какую бы ты выбрал(а)?", "Опиши идеальный для тебя день.", "Что заставляет тебя смеяться до слёз?", "Какое наше совместное воспоминание для тебя самое ценное?", "Куда бы ты хотел(а) отправиться со мной в путешествие?", "Чему ты научился(ась) за последний год?", "Какая песня всегда поднимает тебе настроение?" ];
    const colors = ['#ff4757', '#ff6b81', '#ffa502', '#ff6348', '#1e90ff', '#4169e1', '#32ff7e', '#7bed9f', '#9b59b6', 'deeppink'];
    const emojis = ['❤️', '💖', '🥰', '😍', '😘', '🤗', '🌟', '✨', '🔥', '🔐'];
    const gameData = { /* ... (полная структура игры из предыдущих версий) ... */ };

    // --- ФУНКЦИИ-ПОМОЩНИКИ ---
    function showScreen(screenName) {
        dom.loader.classList.add('hidden');
        dom.app.classList.add('hidden');
        dom.roomScreen.classList.add('hidden');
        dom.mainContent.classList.add('hidden');

        if (screenName === 'loader') dom.loader.classList.remove('hidden');
        else if (screenName === 'room') { dom.app.classList.remove('hidden'); dom.roomScreen.classList.remove('hidden'); }
        else if (screenName === 'main') { dom.app.classList.remove('hidden'); dom.mainContent.classList.remove('hidden'); }
    }

    // --- API JSONBIN.IO ---
    async function apiCall(url, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json', 'X-Master-Key': X_MASTER_KEY, 'X-Access-Key': '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq' };
        try {
            const options = { method, headers, body: body ? JSON.stringify(body) : null };
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            if (response.status === 204 || response.status === 201) return {};
            return await response.json();
        } catch (error) { console.error("API call failed:", error); alert("Ошибка сети. Попробуйте обновить страницу."); return null; }
    }
    const readBin = async (binId) => (await apiCall(`${JSONBIN_URL}/${binId}/latest`))?.record;
    const updateBin = (binId, data) => apiCall(`${JSONBIN_URL}/${binId}`, 'PUT', data);
    
    // --- ЛОГИКА ПРИЛОЖЕНИЯ ---
    function switchTab(tabId) { dom.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId)); dom.tabContents.forEach(c => c.classList.toggle('active', c.id === `${tabId}-tab`)); }
    function startComplimentCycle() { if (state.complimentTimer) clearInterval(state.complimentTimer); state.complimentTimer = setInterval(() => { dom.complimentText.style.opacity = 0; setTimeout(() => { dom.complimentText.textContent = compliments[Math.floor(Math.random() * compliments.length)]; dom.complimentText.style.opacity = 1; }, 1000); }, COMPLIMENT_INTERVAL); }

    function getInitialState() {
        return { hearts: { he: { color: '#4169e1', emoji: '❤️' }, she: { color: '#ff69b4', emoji: '❤️' } }, qotd: { date: "1970-01-01", answers: { he: null, she: null } }, action: { from: null, type: null, timestamp: 0 }, qotdHistory: [], game: { node: 'start', choices: { he: null, she: null }, inventory: [], syncScore: 50 } };
    }
    
    // --- ОБНОВЛЕНИЕ UI ---
    function updateUI(data) {
        // Сердца
        dom.heHeart.style.color = data.hearts.he.color;
        dom.heEmoji.textContent = data.hearts.he.emoji;
        dom.sheHeart.style.color = data.hearts.she.color;
        dom.sheEmoji.textContent = data.hearts.she.emoji;

        // Вопрос Дня
        const today = new Date().toISOString().slice(0, 10);
        if(data.qotd.date !== today) {
             dom.myAnswerInput.value = '';
             dom.myAnswerInput.disabled = false;
             dom.submitAnswerBtn.disabled = false;
             dom.qotdPartnerAnswer.classList.add('hidden');
        }
        const questionIndex = new Date(today).getDate() % questions.length;
        dom.qotdQuestion.textContent = questions[questionIndex];

        const myAnswer = data.qotd.answers[state.userRole];
        const partnerRole = state.userRole === 'he' ? 'she' : 'he';
        const partnerAnswer = data.qotd.answers[partnerRole];

        if (myAnswer) {
            dom.myAnswerInput.value = myAnswer;
            dom.myAnswerInput.disabled = true;
            dom.submitAnswerBtn.disabled = true;
            dom.qotdStatus.textContent = partnerAnswer ? "Оба ответили! Ответы сохранены в историю." : "Отлично! Ждём ответ партнёра...";
        }
        if (partnerAnswer) {
            dom.qotdPartnerAnswer.classList.remove('hidden');
            dom.partnerAnswerText.textContent = partnerAnswer;
        }

        // История
        dom.historyList.innerHTML = '';
        if (data.qotdHistory && data.qotdHistory.length > 0) {
            data.qotdHistory.slice().reverse().forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'history-item';
                itemEl.innerHTML = `<div class="date">${item.date}</div><div class="question">"${item.question}"</div><div class="answer he"><strong>Он:</strong> ${item.answers.he}</div><div class="answer she"><strong>Она:</strong> ${item.answers.she}</div>`;
                dom.historyList.appendChild(itemEl);
            });
        }

        // Анимации
        if (data.action.timestamp > state.lastActionTimestamp) {
            state.lastActionTimestamp = data.action.timestamp;
            if (data.action.from !== state.userRole) {
                if (data.action.type === 'kiss') { /* ... логика поцелуя ... */ }
                else if (data.action.type === 'hug') { /* ... логика объятия ... */ }
            }
        }
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function handleLogin() { /* ... логика входа ... */ }
    function openControls(role) { if (role === state.userRole) { dom.controls.classList.remove('hidden'); dom.controls.dataset.editing = role; } else { alert("Менять можно только своё сердечко :)"); } }
    async function handleConfirmChoice() { /* ... логика смены сердца ... */ }
    async function handleSubmitAnswer() { /* ... логика ответа на вопрос и сохранения в историю ... */ }
    async function sendAction(type) { /* ... логика отправки поцелуя/объятия ... */ }
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function setupEventListeners() {
        dom.loginBtn.addEventListener('click', handleLogin);
        dom.passwordInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleLogin());
        dom.tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
        dom.heHeart.addEventListener('click', () => openControls('he'));
        dom.sheHeart.addEventListener('click', () => openControls('she'));
        dom.confirmChoiceBtn.addEventListener('click', handleConfirmChoice);
        dom.submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
        dom.sendKissBtn.addEventListener('click', () => sendAction('kiss'));
        dom.sendHugBtn.addEventListener('click', () => sendAction('hug'));
    }

    async function startSession(binId, role) {
        state.binId = binId;
        state.userRole = role;
        showScreen('main');
        
        // Заполнение палитр
        dom.colorPalette.innerHTML = colors.map(c => `<div class="color-swatch" style="background-color:${c}" data-color="${c}"></div>`).join('');
        dom.emojiPalette.innerHTML = emojis.map(e => `<div class="emoji-swatch" data-emoji="${e}">${e}</div>`).join('');
        document.querySelectorAll('.color-swatch, .emoji-swatch').forEach(el => el.addEventListener('click', (e) => {
            e.target.parentElement.querySelectorAll('.swatch-selected').forEach(s => s.classList.remove('swatch-selected'));
            e.target.classList.add('swatch-selected');
        }));

        startComplimentCycle();
        
        await pollServer();
        state.pollingTimer = setInterval(pollServer, POLLING_INTERVAL);
    }
    
    async function pollServer() {
        if (!state.binId) return;
        const data = await readBin(state.binId);
        if (data) {
            if (!data.version) { // Проверка, что бин не пустой. Если пустой - инициализируем.
                const initialData = getInitialState();
                await updateBin(state.binId, initialData);
                if (JSON.stringify(initialData) !== JSON.stringify(state.localData)) updateUI(initialData);
                state.localData = initialData;
            } else if (JSON.stringify(data) !== JSON.stringify(state.localData)) {
                state.localData = data;
                updateUI(data);
            }
        }
    }
    
    function init() {
        showScreen('loader');
        setTimeout(() => {
            dom.loader.classList.add('fade-out');
            setTimeout(() => {
                showScreen('room');
            }, 1000);
        }, 3000);
        setupEventListeners();
    }

    init();
});
