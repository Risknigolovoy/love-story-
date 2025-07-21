document.addEventListener('DOMContentLoaded', () => {
    // --- КОНФИГУРАЦИЯ ---
    const X_MASTER_KEY = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';
    const POLLING_INTERVAL = 3500;
    const COMPLIMENT_INTERVAL = 9000;

    const STATIC_BIN_ID = '687ebac9f7e7a370d1eba7fa'; 
    const CODE_FOR_HE = '06112002'; // Её дата рождения для входа "Его"
    const CODE_FOR_SHE = '18092000'; // Его дата рождения для входа "Её"
    
    // --- DOM ЭЛЕМЕНТЫ ---
    const dom = {
        loader: document.getElementById('loader'),
        app: document.getElementById('app'),
        roomScreen: document.getElementById('room-screen'),
        mainContent: document.getElementById('main-content'),
        loginCodeInput: document.getElementById('login-code-input'),
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
    
    // --- ДАННЫЕ (Комплименты, Вопросы, Игра и т.д.) ---
    const compliments = [ "Я люблю тебя до луны и обратно.", "Скучаю по твоему голосу.", "Ты - моё самое большое приключение.", "Каждая секунда без тебя - вечность.", "Мы справимся с любым расстоянием.", "Думаю о тебе прямо сейчас.", "Ты делаешь мой мир ярче.", "Скорей бы тебя обнять.", "Ты моё солнышко в пасмурный день.", "Спасибо, что ты есть у меня.", "Ты — причина моей улыбки.", "Наши сердца бьются в унисон." ];
    const questions = [ "Какое твоё самое тёплое детское воспоминание?", "Если бы ты мог(ла) иметь любую суперсилу, какую бы ты выбрал(а)?", "Опиши идеальный для тебя день.", "Что заставляет тебя смеяться до слёз?", "Какое наше совместное воспоминание для тебя самое ценное?", "Куда бы ты хотел(а) отправиться со мной в путешествие?", "Чему ты научился(ась) за последний год?", "Какая песня всегда поднимает тебе настроение?" ];
    const colors = ['#ff4757', '#ff6b81', '#ffa502', '#ff6348', '#1e90ff', '#4169e1', '#32ff7e', '#7bed9f', '#9b59b6', 'deeppink'];
    const emojis = ['❤️', '💖', '🥰', '😍', '😘', '🤗', '🌟', '✨', '🔥', '🔐'];
    const gameData = {
        'start': { text: "Вы стоите на пороге Зачарованного Леса. Луна дарит вам 'Лунный камень'. Куда пойдёте?", choices: [{ text: 'В тёмную чащу', id: 'a' }, { text: 'К мерцающему озеру', id: 'b' }], onEnter: { addItem: 'Лунный камень' }, outcomes: { 'a_a': { to: 'deep_forest', sync: 10 }, 'b_b': { to: 'lake_shore', sync: 10 }, 'a_b': { to: 'mixed_path_1', sync: -10 }, 'b_a': { to: 'mixed_path_1', sync: -10 } } },
        'deep_forest': { text: "В чаще вы находите сундук и светлячков у дуба. Что вы делаете?", choices: [{ text: 'Открыть сундук', id: 'a' }, { text: 'Пойти к дубу', id: 'b' }], outcomes: { 'a_a': { to: 'chest_open' }, 'b_b': { to: 'oak_success', sync: 15 }, 'a_b': { to: 'forest_fail' }, 'b_a': { to: 'forest_fail', sync: -5 } } },
        'chest_open': { text: "В сундуке лежит 'Карта созвездий'.", choices: [{ text: 'Продолжить путь', id: 'a' }], onEnter: { addItem: 'Карта созвездий' }, outcomes: { 'a_a': { to: 'star_bridge' } } },
        'lake_shore': { text: "У озера стоит лодка, а в воде что-то блестит.", choices: [{ text: 'Взять лодку', id: 'a' }, { text: 'Достать предмет из воды', id: 'b' }], outcomes: { 'a_a': { to: 'boat_success', sync: 5 }, 'b_b': { to: 'crystal_found', sync: 5 }, 'a_b': { to: 'lake_fail' }, 'b_a': { to: 'lake_fail', sync: -5 } } },
        'crystal_found': { text: "Вы нашли 'Водный кристалл'!", choices: [{ text: 'Идти дальше', id: 'a' }], onEnter: { addItem: 'Водный кристалл' }, outcomes: { 'a_a': { to: 'star_bridge' } } },
        'star_bridge': { text: "Перед вами пропасть. Нужна 'Карта созвездий' чтобы пройти.", choices: [{ text: 'Использовать карту', id: 'a', requiresItem: 'Карта созвездий' }, { text: 'Искать другой путь', id: 'b' }], outcomes: { 'a_a': { to: 'good_ending_moon' }, 'b_b': { to: 'bad_ending_lost' } } },
        'good_ending_moon': { text: "Карта создала мост из звёзд! Вы перешли его, и ваша любовь стала частью вечности. (Прекрасная концовка)", choices: [] },
        'bad_ending_lost': { text: "Вы заблудились, но вы всё ещё вместе. Главное приключение — найти выход рука об руку. (Плохая концовка)", choices: [] },
    };

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

    function getInitialState() {
        return {
            hearts: { he: { color: '#4169e1', emoji: '❤️' }, she: { color: '#ff69b4', emoji: '❤️' } },
            qotd: { date: "1970-01-01", answers: { he: null, she: null } },
            action: { from: null, type: null, timestamp: 0 },
            qotdHistory: [],
            game: { node: 'start', choices: { he: null, she: null }, inventory: [], syncScore: 50 },
        };
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
    
    function startComplimentCycle() {
        if (state.complimentTimer) clearInterval(state.complimentTimer);
        // Показываем первый комплимент сразу
        dom.complimentText.textContent = compliments[Math.floor(Math.random() * compliments.length)];
        dom.complimentText.style.opacity = 1;

        state.complimentTimer = setInterval(() => {
            dom.complimentText.style.opacity = 0;
            setTimeout(() => {
                dom.complimentText.textContent = compliments[Math.floor(Math.random() * compliments.length)];
                dom.complimentText.style.opacity = 1;
            }, 1000);
        }, COMPLIMENT_INTERVAL);
    }
    
    // --- ОБНОВЛЕНИЕ UI ---
    function updateUI(data) {
        state.localData = data;
        
        // Сердца
        dom.heHeart.style.color = data.hearts.he.color;
        dom.heEmoji.textContent = data.hearts.he.emoji;
        dom.sheHeart.style.color = data.hearts.she.color;
        dom.sheEmoji.textContent = data.hearts.she.emoji;

        // Вопрос Дня
        const today = new Date().toISOString().slice(0, 10);
        let currentQuestion = data.qotd;
        // Если дата в данных не сегодняшняя, сбрасываем ответы
        if(currentQuestion.date !== today) {
            currentQuestion = { date: today, answers: { he: null, she: null } };
        }
        
        const questionIndex = new Date(today).getDate() % questions.length;
        dom.qotdQuestion.textContent = questions[questionIndex];

        const myAnswer = currentQuestion.answers[state.userRole];
        const partnerRole = state.userRole === 'he' ? 'she' : 'he';
        const partnerAnswer = currentQuestion.answers[partnerRole];

        dom.myAnswerInput.disabled = !!myAnswer;
        dom.submitAnswerBtn.disabled = !!myAnswer;
        dom.myAnswerInput.value = myAnswer || '';

        dom.qotdPartnerAnswer.classList.toggle('hidden', !partnerAnswer);
        dom.partnerAnswerText.textContent = partnerAnswer || '';
        
        if (myAnswer) {
            dom.qotdStatus.textContent = partnerAnswer ? "Оба ответили! Ответы сохранены в историю." : "Отлично! Ждём ответ партнёра...";
        } else {
            dom.qotdStatus.textContent = partnerAnswer ? "Партнёр уже ответил. Теперь ваша очередь!" : "Напишите свой ответ...";
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
        } else {
            dom.historyList.innerHTML = '<p>Здесь будут появляться ваши ответы на "Вопрос дня".</p>';
        }

        // Анимации
        if (data.action && data.action.timestamp > state.lastActionTimestamp) {
            state.lastActionTimestamp = data.action.timestamp;
            if (data.action.from !== state.userRole) {
                // ... логика запуска анимаций...
            }
        }
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function handleLogin() {
        const code = dom.loginCodeInput.value;
        let userRole = null;

        if (code === CODE_FOR_HE) {
            userRole = 'he';
        } else if (code === CODE_FOR_SHE) {
            userRole = 'she';
        }

        if (userRole) {
            startSession(STATIC_BIN_ID, userRole);
        } else {
            alert('Неверный код. Попробуйте снова.');
            dom.loginCodeInput.value = '';
        }
    }

    function openControls(role) {
        if (role === state.userRole) {
            dom.controls.classList.remove('hidden');
            dom.controls.dataset.editing = role;
        } else {
            alert("Менять можно только своё сердечко :)");
        }
    }

    async function handleConfirmChoice() {
        const role = dom.controls.dataset.editing;
        const selectedColor = dom.colorPalette.querySelector('.swatch-selected');
        const selectedEmoji = dom.emojiPalette.querySelector('.swatch-selected');
        if (!role || !selectedColor || !selectedEmoji) return;
        
        const newData = { ...state.localData };
        newData.hearts[role].color = selectedColor.dataset.color;
        newData.hearts[role].emoji = selectedEmoji.dataset.emoji;
        
        dom.controls.classList.add('hidden');
        updateUI(newData); // Локальное обновление для мгновенной реакции
        await updateBin(state.binId, newData);
    }
    
    async function handleSubmitAnswer() {
        const answer = dom.myAnswerInput.value.trim();
        if (!answer) {
            alert('Пожалуйста, напишите ответ.');
            return;
        }
        
        const today = new Date().toISOString().slice(0, 10);
        const questionIndex = new Date(today).getDate() % questions.length;
        const questionText = questions[questionIndex];

        let newData = JSON.parse(JSON.stringify(state.localData));

        // Если день сменился, создаем новый объект qotd
        if(newData.qotd.date !== today) {
            newData.qotd = { date: today, answers: { he: null, she: null } };
        }

        newData.qotd.answers[state.userRole] = answer;
        
        const partnerRole = state.userRole === 'he' ? 'she' : 'he';
        // Если партнёр тоже ответил, сохраняем в историю
        if (newData.qotd.answers[partnerRole]) {
            if (!newData.qotdHistory) newData.qotdHistory = [];
            // Проверяем, чтобы не дублировать запись
            const alreadyExists = newData.qotdHistory.some(item => item.date === today);
            if (!alreadyExists) {
                newData.qotdHistory.push({
                    date: today,
                    question: questionText,
                    answers: newData.qotd.answers
                });
            }
        }
        
        updateUI(newData);
        await updateBin(state.binId, newData);
    }

    async function sendAction(type) {
        const newData = { ...state.localData, action: { from: state.userRole, type: type, timestamp: Date.now() } };
        updateUI(newData);
        await updateBin(state.binId, newData);
    }
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function setupEventListeners() {
        dom.loginBtn.addEventListener('click', handleLogin);
        dom.loginCodeInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleLogin());
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
        
        // **ИСПРАВЛЕНИЕ**: Проверяем, есть ли в данных ключевые разделы. Если нет - инициализируем.
        if (!data || !data.hearts || !data.game) {
            const initialData = getInitialState();
            await updateBin(state.binId, initialData);
            if (JSON.stringify(initialData) !== JSON.stringify(state.localData)) {
                updateUI(initialData);
            }
        } else if (JSON.stringify(data) !== JSON.stringify(state.localData)) {
            updateUI(data);
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
