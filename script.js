document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальные переменные ---
    let apiKey = localStorage.getItem('jsonBinApiKey'); // Ключ будет храниться в браузере
    let currentBinId = null;
    let pollingInterval = null;
    const userId = sessionStorage.getItem('userId') || `user_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('userId', userId);

    // --- Элементы DOM ---
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-button');
    const heartSvg = document.getElementById('heart-svg');
    const loveMessageEl = document.getElementById('love-message');
    const messageButton = document.getElementById('message-button');
    const colorPalette = document.getElementById('color-palette');
    const apiKeyForm = document.getElementById('api-key-form');
    const apiKeyInput = document.getElementById('api-key-input');
    const gameActions = document.getElementById('game-actions');
    const gameConnectScreen = document.getElementById('game-connect-screen');
    const gameChatScreen = document.getElementById('game-chat-screen');
    const createGameBtn = document.getElementById('create-game-btn');
    const joinGameForm = document.getElementById('join-game-form');
    const joinGameInput = document.getElementById('join-game-input');
    const gameErrorEl = document.getElementById('game-error');
    const gameIdDisplay = document.getElementById('game-id-display');
    const copySuccessEl = document.getElementById('copy-success');
    const chatWindow = document.getElementById('chat-window');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // --- Инициализация ---
    function initialize() {
        setupEventListeners();
        if (apiKey) {
            apiKeyForm.classList.add('hidden');
            gameActions.classList.remove('hidden');
        }
    }

    // --- Настройка обработчиков событий ---
    function setupEventListeners() {
        navButtons.forEach(button => button.addEventListener('click', switchView));
        messageButton.addEventListener('click', showNewLoveMessage);
        colorPalette.addEventListener('click', changeHeartColor);
        apiKeyForm.addEventListener('submit', saveApiKey);
        createGameBtn.addEventListener('click', createGame);
        joinGameForm.addEventListener('submit', joinGame);
        chatForm.addEventListener('submit', sendMessage);
        gameIdDisplay.addEventListener('click', copyGameId);
    }

    // --- Основные функции ---
    function switchView(e) {
        const targetViewId = e.target.dataset.view;
        views.forEach(view => view.classList.remove('active-view'));
        document.getElementById(targetViewId).classList.add('active-view');
        navButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }

    function saveApiKey(e) {
        e.preventDefault();
        const key = apiKeyInput.value.trim();
        if (key) {
            apiKey = key;
            localStorage.setItem('jsonBinApiKey', key);
            apiKeyForm.classList.add('hidden');
            gameActions.classList.remove('hidden');
            gameErrorEl.textContent = '';
        } else {
            gameErrorEl.textContent = 'Ключ не может быть пустым.';
        }
    }

    // --- Логика JSONbin.io ---
    const binApiUrl = 'https://api.jsonbin.io/v3/b';

    async function createGame() {
        gameErrorEl.textContent = 'Создаю комнату...';
        const initialData = {
            messages: [{
                sender: 'Game',
                text: 'Вы стоите на краю звёздной туманности. Впереди два пути: один сияет теплым светом, другой — холодным. Какой выберете?',
                timestamp: new Date().toISOString()
            }]
        };

        try {
            const response = await fetch(binApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': apiKey,
                    'X-Collection-Id': 'a0f2d0d5-8b7c-4a6a-8b0d-5c6a5b1f3e2d' // Общая коллекция для всех игр
                },
                body: JSON.stringify(initialData)
            });

            if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
            
            const result = await response.json();
            currentBinId = result.metadata.id;
            gameErrorEl.textContent = '';
            switchToChatView(currentBinId);

        } catch (error) {
            gameErrorEl.textContent = `Не удалось создать игру: ${error.message}`;
        }
    }

    async function joinGame(e) {
        e.preventDefault();
        const binId = joinGameInput.value.trim();
        if (!binId) {
            gameErrorEl.textContent = 'Введите код комнаты.';
            return;
        }
        // Проверяем, существует ли комната
        try {
            const response = await fetch(`${binApiUrl}/${binId}/latest`, { headers: { 'X-Master-Key': apiKey } });
            if (!response.ok) throw new Error('Комната не найдена.');
            currentBinId = binId;
            switchToChatView(currentBinId);
        } catch (error) {
            gameErrorEl.textContent = error.message;
        }
    }

    function switchToChatView(binId) {
        gameConnectScreen.classList.add('hidden');
        gameChatScreen.classList.remove('hidden');
        gameChatScreen.style.display = 'flex';
        gameIdDisplay.textContent = binId;
        startPollingForMessages();
    }

    function startPollingForMessages() {
        if (pollingInterval) clearInterval(pollingInterval);
        
        const fetchMessages = async () => {
            if (!currentBinId) return;
            try {
                const response = await fetch(`${binApiUrl}/${currentBinId}/latest`, { headers: { 'X-Master-Key': apiKey } });
                if (!response.ok) {
                    // Если комната удалена или ошибка, останавливаем опрос
                    clearInterval(pollingInterval);
                    return;
                }
                const data = await response.json();
                renderMessages(data.record.messages || []);
            } catch (error) {
                console.error("Ошибка при получении сообщений:", error);
            }
        };

        fetchMessages(); // Первый вызов сразу
        pollingInterval = setInterval(fetchMessages, 3000); // Проверять каждые 3 секунды
    }

    async function sendMessage(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        sendBtn.disabled = true;
        chatInput.value = '';

        try {
            // 1. Получаем текущие данные
            const getRes = await fetch(`${binApiUrl}/${currentBinId}/latest`, { headers: { 'X-Master-Key': apiKey } });
            const data = await getRes.json();
            const currentMessages = data.record.messages || [];

            // 2. Добавляем новое сообщение
            const newMessage = { sender: userId, text, timestamp: new Date().toISOString() };
            const updatedMessages = [...currentMessages, newMessage];

            // 3. Обновляем "бин"
            const putRes = await fetch(`${binApiUrl}/${currentBinId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': apiKey
                },
                body: JSON.stringify({ messages: updatedMessages })
            });

            if (!putRes.ok) throw new Error('Не удалось отправить сообщение.');
            
            // Сразу отображаем отправленное сообщение
            renderMessages(updatedMessages);

        } catch (error) {
            console.error(error);
        } finally {
            sendBtn.disabled = false;
        }
    }

    function renderMessages(messages) {
        const lastMessageCount = chatWindow.children.length;
        if (messages.length === lastMessageCount) return; // Не перерисовывать, если ничего не изменилось

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

    // --- Функции вкладки "Сердце" ---
    const lovePhrases = [ "Я люблю тебя больше, чем слова могут выразить.", "Каждый день я скучаю по тебе всё сильнее.", "Я боюсь потерять тебя, ты – мой мир.", "Прости, если моя любовь неидеальна. Я стараюсь.", "Даже на расстоянии, моё сердце всегда с тобой.", "Ты – первая мысль утром и последняя перед сном. Люблю.", "Скучаю по твоему смеху, он как музыка для меня.", "Мой самый большой страх – это мир, в котором нет тебя.", "Я люблю тебя не так, как ты заслуживаешь, а так, как умею – всем сердцем.", "Километры между нами ничего не значат. Я скучаю.", "Моя любовь к тебе – это единственное, в чём я уверен на 100%.", "Без тебя дни такие пустые. Скучаю ужасно.", "Пожалуйста, никогда не уходи. Я боюсь этой тишины.", "Прости за все моменты, когда я был неправ. Я люблю тебя.", "Расстояние учит меня ценить каждую секунду с тобой.", "Ты делаешь меня лучше. Я люблю тебя за это.", "Скучаю по твоим объятиям, в них я чувствовал себя дома.", "Я боюсь представить свою жизнь без твоей улыбки.", "Моя любовь к тебе растёт с каждым днём, даже если я этого не показываю.", "Мы далеко, но наши сердца бьются в унисон. Скучаю.", "Люблю тебя до луны и обратно.", "Каждая песня о любви теперь напоминает о тебе. Скучаю.", "Ты мой якорь в этом мире. Боюсь остаться без тебя.", "Прости, что иногда причиняю боль. Мои намерения всегда чисты.", "Я считаю дни до нашей встречи. Очень скучаю.", "В моих мыслях мы всегда вместе. Люблю тебя.", "Этот город кажется чужим без тебя. Скучаю.", "Я боюсь, что однажды ты устанешь от меня.", "Я люблю тебя со всеми твоими недостатками, потому что они делают тебя тобой.", "Расстояние – это просто тест, который мы пройдём. Скучаю.", "Ты – моё всё. Люблю бесконечно.", "Мне не хватает твоего тепла рядом. Скучаю.", "Потерять тебя – значит потерять себя.", "Прости, если я не всегда нахожу правильные слова. Просто знай, что я люблю тебя.", "Каждый закат я думаю о том, как мы посмотрим на него вместе. Скучаю.", "Любовь к тебе – это лучшее, что со мной случалось.", "Скучаю по нашим разговорам ни о чём и обо всём.", "Я так боюсь, что это расстояние нас сломает.", "Я люблю тебя больше, чем вчера, но меньше, чем завтра.", "Я отправляю тебе тысячу поцелуев с ветром. Скучаю.", "Ты – причина моей улыбки. Люблю тебя.", "Мир теряет краски, когда тебя нет рядом. Скучаю.", "Обещай, что мы всегда будем вместе. Я боюсь одиночества.", "Прости, что я не идеален. Но моя любовь к тебе – идеальна.", "Я чувствую твою любовь даже через тысячи километров. Скучаю.", "С тобой я готов на всё. Люблю тебя.", "Скучаю до боли в груди.", "Я боюсь не оправдать твоих надежд.", "Ты заслуживаешь всего самого лучшего, и я постараюсь тебе это дать. Люблю.", "Скоро мы будем рядом. Я верю в это и очень скучаю." ];
    function showNewLoveMessage() { loveMessageEl.textContent = lovePhrases[Math.floor(Math.random() * lovePhrases.length)]; }
    function changeHeartColor(e) { if (e.target.classList.contains('color-dot')) { const color = e.target.dataset.color; heartSvg.style.fill = color; heartSvg.style.filter = `drop-shadow(0 0 15px ${color})`; } }
    function copyGameId() { navigator.clipboard.writeText(gameIdDisplay.textContent).then(() => { copySuccessEl.textContent = 'Скопировано!'; setTimeout(() => copySuccessEl.textContent = '', 2000); }); }

    // --- Запуск приложения ---
    initialize();
});
