document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальные переменные ---
    const apiKey = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const binApiUrl = 'https://api.jsonbin.io/v3/b';
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=`; // API ключ для Gemini не нужен в этой среде

    let gameBinId = null;
    let heartsBinId = null;
    let pollingInterval = null;
    let userRole = null; // 'user1' или 'user2'

    const userId = sessionStorage.getItem('userId') || `user_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('userId', userId);

    // --- Элементы DOM ---
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const navButtons = document.querySelectorAll('.nav-button');
    
    // Вкладка Сердца
    const heartsConnectScreen = document.getElementById('hearts-connect-screen');
    const heartsDisplayScreen = document.getElementById('hearts-display-screen');
    const createHeartsRoomBtn = document.getElementById('create-hearts-room-btn');
    const joinHeartsRoomForm = document.getElementById('join-hearts-room-form');
    const joinHeartsRoomInput = document.getElementById('join-hearts-room-input');
    const heartsErrorEl = document.getElementById('hearts-error');
    const heart1El = document.getElementById('heart1');
    const heart2El = document.getElementById('heart2');
    const mood1El = document.getElementById('mood1');
    const mood2El = document.getElementById('mood2');
    const moodSelector = document.getElementById('mood-selector');
    const colorPalette = document.getElementById('color-palette');
    const heartsRoomIdEl = document.getElementById('hearts-room-id');

    // Вкладка Игра
    const gameConnectScreen = document.getElementById('game-connect-screen');
    const gameChatScreen = document.getElementById('game-chat-screen');
    const createGameBtn = document.getElementById('create-game-btn');
    const joinGameForm = document.getElementById('join-game-form');
    const joinGameInput = document.getElementById('join-game-input');
    const gameErrorEl = document.getElementById('game-error');
    const gameIdDisplay = document.getElementById('game-id-display');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // --- Инициализация ---
    function initialize() {
        // Анимация загрузки
        setTimeout(() => {
            loader.classList.add('hidden');
            app.classList.remove('hidden');
        }, 6000);

        setupEventListeners();
        populateColorPalette();
    }

    // --- Настройка обработчиков событий ---
    function setupEventListeners() {
        navButtons.forEach(button => button.addEventListener('click', switchView));
        
        // Сердца
        createHeartsRoomBtn.addEventListener('click', createHeartsRoom);
        joinHeartsRoomForm.addEventListener('submit', joinHeartsRoom);
        moodSelector.addEventListener('click', handleMoodChange);
        colorPalette.addEventListener('click', handleColorChange);

        // Игра
        createGameBtn.addEventListener('click', createGame);
        joinGameForm.addEventListener('submit', joinGame);
        chatForm.addEventListener('submit', sendMessage);
    }

    // --- Логика переключения вкладок ---
    function switchView(e) {
        // Останавливаем опрос при переключении
        if (pollingInterval) clearInterval(pollingInterval);

        const targetViewId = e.target.dataset.view;
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
        document.getElementById(targetViewId).classList.add('active-view');
        navButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Возобновляем опрос, если мы на активной вкладке с комнатой
        if (targetViewId === 'hearts-view' && heartsBinId) {
            startPolling(heartsBinId, updateHeartsUI);
        } else if (targetViewId === 'game-view' && gameBinId) {
            startPolling(gameBinId, updateGameUI);
        }
    }

    // --- Общая логика JSONbin и опроса ---
    function startPolling(binId, updateFunction) {
        if (pollingInterval) clearInterval(pollingInterval);
        
        const fetchData = async () => {
            try {
                const response = await fetch(`${binApiUrl}/${binId}/latest`, { headers: { 'X-Master-Key': apiKey } });
                if (!response.ok) {
                    console.error("Комната не найдена или ошибка сети, опрос остановлен.");
                    clearInterval(pollingInterval);
                    return;
                }
                const data = await response.json();
                updateFunction(data.record);
            } catch (error) {
                console.error("Ошибка при получении данных:", error);
            }
        };

        fetchData();
        pollingInterval = setInterval(fetchData, 3500); // Проверять каждые 3.5 секунды
    }

    async function updateBin(binId, data) {
        try {
            await fetch(`${binApiUrl}/${binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error("Ошибка обновления данных:", error);
        }
    }

    // --- Логика вкладки "Сердца" ---
    function populateColorPalette() {
        const colors = ['#ff7a7a', '#a27aff', '#7affb8', '#f5ff7a', '#7ad7ff', '#ffc0cb', '#ffffff'];
        colors.forEach(color => {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = color;
            dot.dataset.color = color;
            colorPalette.appendChild(dot);
        });
    }

    async function createHeartsRoom() {
        heartsErrorEl.textContent = 'Создаю комнату...';
        const initialData = {
            user1: { id: userId, color: '#ff7a7a', mood: '❤️' },
            user2: { id: null, color: '#a27aff', mood: '❤️' }
        };
        const binId = await createBin(initialData, heartsErrorEl);
        if (binId) {
            userRole = 'user1';
            switchToHeartsView(binId);
        }
    }

    async function joinHeartsRoom(e) {
        e.preventDefault();
        const binId = joinHeartsRoomInput.value.trim();
        if (!binId) return;
        heartsErrorEl.textContent = 'Подключаюсь...';
        
        const data = await getBin(binId, heartsErrorEl);
        if (data) {
            // Определяем роль пользователя
            if (data.user1.id === userId) {
                userRole = 'user1';
            } else if (data.user2.id === null || data.user2.id === userId) {
                userRole = 'user2';
                data.user2.id = userId; // Занимаем второй слот
                await updateBin(binId, data);
            } else {
                heartsErrorEl.textContent = 'Комната уже занята.';
                return;
            }
            switchToHeartsView(binId);
        }
    }

    function switchToHeartsView(binId) {
        heartsBinId = binId;
        heartsConnectScreen.classList.add('hidden');
        heartsDisplayScreen.classList.remove('hidden');
        heartsRoomIdEl.textContent = binId;
        startPolling(binId, updateHeartsUI);
    }

    function updateHeartsUI(data) {
        if (!data || !data.user1 || !data.user2) return;
        
        // Обновляем Сердце 1
        heart1El.style.backgroundColor = data.user1.color;
        mood1El.textContent = data.user1.mood;

        // Обновляем Сердце 2
        heart2El.style.backgroundColor = data.user2.color;
        mood2El.textContent = data.user2.mood;
    }

    async function handleMoodChange(e) {
        if (e.target.classList.contains('mood-option') && userRole) {
            const newMood = e.target.textContent;
            const data = await getBin(heartsBinId, heartsErrorEl);
            if (data) {
                data[userRole].mood = newMood;
                await updateBin(heartsBinId, data);
                updateHeartsUI(data); // Мгновенное обновление для себя
            }
        }
    }

    async function handleColorChange(e) {
        if (e.target.classList.contains('color-dot') && userRole) {
            const newColor = e.target.dataset.color;
            const data = await getBin(heartsBinId, heartsErrorEl);
            if (data) {
                data[userRole].color = newColor;
                await updateBin(heartsBinId, data);
                updateHeartsUI(data); // Мгновенное обновление для себя
            }
        }
    }

    // --- Логика Игры с ИИ Gemini ---
    async function createGame() {
        gameErrorEl.textContent = 'Создаю игру...';
        const initialData = {
            messages: [{
                sender: 'Game',
                text: 'Вы вдвоём оказались в мерцающем лесу. Воздух пахнет озоном и ночными цветами. Перед вами тропа расходится: одна ведет к поющему водопаду, другая — к таинственной пещере, из которой доносится тихая музыка. Ваш выбор?',
                timestamp: new Date().toISOString()
            }]
        };
        const binId = await createBin(initialData, gameErrorEl);
        if (binId) switchToGameView(binId);
    }

    async function joinGame(e) {
        e.preventDefault();
        const binId = joinGameInput.value.trim();
        if (!binId) return;
        gameErrorEl.textContent = 'Подключаюсь...';
        const data = await getBin(binId, gameErrorEl);
        if (data) switchToGameView(binId);
    }

    function switchToGameView(binId) {
        gameBinId = binId;
        gameConnectScreen.classList.add('hidden');
        gameChatScreen.classList.remove('hidden');
        gameIdDisplay.textContent = binId;
        startPolling(binId, updateGameUI);
    }

    function updateGameUI(data) {
        const messages = data.messages || [];
        const lastMessageCount = chatWindow.children.length;
        if (messages.length === lastMessageCount) return;

        chatWindow.innerHTML = '';
        messages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = 'message-wrapper';
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.textContent = msg.text;

            if (msg.sender === 'Game') wrapper.classList.add('game');
            else if (msg.sender === userId) wrapper.classList.add('user');
            else wrapper.classList.add('partner');
            
            messageEl.classList.add(wrapper.classList[1]);
            wrapper.appendChild(messageEl);
            chatWindow.appendChild(wrapper);
        });
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        sendBtn.disabled = true;
        const tempMessage = text;
        chatInput.value = '';

        const data = await getBin(gameBinId, gameErrorEl);
        if (!data) {
            sendBtn.disabled = false;
            return;
        }

        const newMessage = { sender: userId, text: tempMessage, timestamp: new Date().toISOString() };
        data.messages.push(newMessage);
        await updateBin(gameBinId, data);
        updateGameUI(data); // Мгновенное обновление для себя

        // Вызов Гейм Мастера (Gemini)
        triggerGameMaster(data.messages);
    }

    async function triggerGameMaster(messages) {
        const chatHistory = messages.slice(-6).map(m => {
            return `${m.sender === 'Game' ? 'Мастер Игры' : 'Игрок'}: ${m.text}`;
        }).join('\n');

        const prompt = `Ты — таинственный и романтичный Гейм Мастер. Ты ведешь текстовую игру для влюбленной пары, которая на расстоянии. Их цель — вместе преодолевать загадочные испытания. Твой стиль — короткий, поэтичный, загадочный. Не давай прямых ответов, а создавай атмосферу и ставь перед ними выбор или описывай последствия их действий. Основываясь на истории чата, напиши следующее короткое сообщение (2-3 предложения) от лица Мастера Игры.\n\nИСТОРИЯ:\n${chatHistory}\n\nТВОЙ ОТВЕТ:`;

        try {
            const response = await fetch(geminiApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error('Ошибка ответа от ИИ');

            const result = await response.json();
            const gameResponse = result.candidates[0].content.parts[0].text;

            const gameMessage = { sender: 'Game', text: gameResponse, timestamp: new Date().toISOString() };
            
            const currentData = await getBin(gameBinId, gameErrorEl);
            if(currentData) {
                currentData.messages.push(gameMessage);
                await updateBin(gameBinId, currentData);
                updateGameUI(currentData);
            }

        } catch (error) {
            console.error("Ошибка Gemini:", error);
        } finally {
            sendBtn.disabled = false;
        }
    }

    // --- Хелперы ---
    async function createBin(initialData, errorElement) {
        try {
            const response = await fetch(binApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
                body: JSON.stringify(initialData)
            });
            if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
            const result = await response.json();
            errorElement.textContent = '';
            return result.metadata.id;
        } catch (error) {
            errorElement.textContent = `Не удалось создать комнату: ${error.message}`;
            return null;
        }
    }

    async function getBin(binId, errorElement) {
        try {
            const response = await fetch(`${binApiUrl}/${binId}/latest`, { headers: { 'X-Master-Key': apiKey } });
            if (!response.ok) throw new Error('Комната не найдена.');
            const data = await response.json();
            errorElement.textContent = '';
            return data.record;
        } catch (error) {
            errorElement.textContent = error.message;
            return null;
        }
    }

    function copyGameId() {
        const id = gameIdDisplay.textContent;
        navigator.clipboard.writeText(id).then(() => {
            document.getElementById('copy-success').textContent = 'Скопировано!';
            setTimeout(() => document.getElementById('copy-success').textContent = '', 2000);
        });
    }

    // --- Запуск приложения ---
    initialize();
});
