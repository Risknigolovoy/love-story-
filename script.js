document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальные переменные ---
    const apiKey = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const binApiUrl = 'https://api.jsonbin.io/v3/b';
    const geminiApiKey = '';
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    let gamePollingInterval = null;
    let heartsPollingInterval = null;
    let complimentInterval = null;
    let userRole = null;

    const userId = sessionStorage.getItem('userId') || `user_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('userId', userId);

    // --- Элементы DOM ---
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const navButtons = document.querySelectorAll('.nav-button');
    
    // ... (остальные элементы DOM)
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
    const complimentTextEl = document.getElementById('compliment-text');
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
    
    const lovePhrases = [ "Я люблю тебя больше, чем слова могут выразить.", "Каждый день я скучаю по тебе всё сильнее.", "Я боюсь потерять тебя, ты – мой мир.", "Прости, если моя любовь неидеальна. Я стараюсь.", "Даже на расстоянии, моё сердце всегда с тобой.", "Ты – первая мысль утром и последняя перед сном. Люблю.", "Скучаю по твоему смеху, он как музыка для меня.", "Мой самый большой страх – это мир, в котором нет тебя.", "Я люблю тебя не так, как ты заслуживаешь, а так, как умею – всем сердцем.", "Километры между нами ничего не значат. Я скучаю.", "Моя любовь к тебе – это единственное, в чём я уверен на 100%.", "Без тебя дни такие пустые. Скучаю ужасно.", "Пожалуйста, никогда не уходи. Я боюсь этой тишины.", "Прости за все моменты, когда я был неправ. Я люблю тебя.", "Расстояние учит меня ценить каждую секунду с тобой.", "Ты делаешь меня лучше. Я люблю тебя за это.", "Скучаю по твоим объятиям, в них я чувствовал себя дома.", "Я боюсь представить свою жизнь без твоей улыбки.", "Моя любовь к тебе растёт с каждым днём, даже если я этого не показываю.", "Мы далеко, но наши сердца бьются в унисон. Скучаю.", "Люблю тебя до луны и обратно.", "Каждая песня о любви теперь напоминает о тебе. Скучаю.", "Ты мой якорь в этом мире. Боюсь остаться без тебя.", "Прости, что иногда причиняю боль. Мои намерения всегда чисты.", "Я считаю дни до нашей встречи. Очень скучаю." ];

    function initialize() {
        setTimeout(() => {
            loader.classList.add('hidden');
            app.classList.remove('hidden');
        }, 6000);

        setupEventListeners();
        populateColorPalette();
        startComplimentCycle();
    }

    function setupEventListeners() {
        navButtons.forEach(button => button.addEventListener('click', switchView));
        createHeartsRoomBtn.addEventListener('click', createHeartsRoom);
        joinHeartsRoomForm.addEventListener('submit', joinHeartsRoom);
        moodSelector.addEventListener('click', handleMoodChange);
        colorPalette.addEventListener('click', handleColorChange);
        createGameBtn.addEventListener('click', createGame);
        joinGameForm.addEventListener('submit', joinGame);
        chatForm.addEventListener('submit', sendMessage);
    }

    function switchView(e) {
        clearInterval(heartsPollingInterval);
        clearInterval(gamePollingInterval);
        clearInterval(complimentInterval);

        const targetViewId = e.target.dataset.view;
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
        document.getElementById(targetViewId).classList.add('active-view');
        navButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        if (targetViewId === 'hearts-view') {
            startComplimentCycle();
        }
    }
    
    function startComplimentCycle() {
        if (complimentInterval) clearInterval(complimentInterval);
        const showNextCompliment = () => {
            complimentTextEl.style.opacity = 0;
            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * lovePhrases.length);
                complimentTextEl.textContent = lovePhrases[randomIndex];
                complimentTextEl.style.opacity = 1;
            }, 500);
        };
        showNextCompliment();
        complimentInterval = setInterval(showNextCompliment, 8000);
    }
    
    function startPolling(binId, updateFunction) {
        const intervalId = setInterval(async () => {
            const currentBinId = sessionStorage.getItem(updateFunction === updateHeartsUI ? 'heartsBinId' : 'gameBinId');
            if (currentBinId !== binId) {
                clearInterval(intervalId);
                return;
            }
            const data = await getBin(binId);
            if (data) updateFunction(data);
        }, 3500);

        if (updateFunction === updateHeartsUI) heartsPollingInterval = intervalId;
        else gamePollingInterval = intervalId;
    }

    async function updateBin(binId, data) {
        return fetch(`${binApiUrl}/${binId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
            body: JSON.stringify(data)
        });
    }
    
    async function createBin(initialData, errorElement) {
        errorElement.textContent = 'Создаю...';
        try {
            const response = await fetch(binApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey, 'X-Bin-Private': 'true'},
                body: JSON.stringify(initialData)
            });
            if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
            const result = await response.json();
            errorElement.textContent = '';
            return result.metadata.id;
        } catch (error) {
            errorElement.textContent = `Ошибка: ${error.message}`;
            return null;
        }
    }
    
    async function getBin(binId, errorElement) {
        try {
            const response = await fetch(`${binApiUrl}/${binId}/latest`, { headers: { 'X-Master-Key': apiKey } });
            if (!response.ok) throw new Error('Комната не найдена.');
            const data = await response.json();
            if (errorElement) errorElement.textContent = '';
            return data.record;
        } catch (error) {
            if (errorElement) errorElement.textContent = error.message;
            return null;
        }
    }

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
        const initialData = {
            user1: { id: userId, color: '#ff7a7a', mood: '❤️' },
            user2: { id: null, color: '#a27aff', mood: '❤️' }
        };
        const binId = await createBin(initialData, heartsErrorEl);
        if (binId) {
            userRole = 'user1';
            sessionStorage.setItem('userRole', 'user1');
            switchToHeartsView(binId, initialData);
        }
    }

    async function joinHeartsRoom(e) {
        e.preventDefault();
        const binId = joinHeartsRoomInput.value.trim();
        if (!binId) return;
        heartsErrorEl.textContent = 'Подключаюсь...';
        
        const data = await getBin(binId, heartsErrorEl);
        if (data) {
            if (data.user1.id === userId) userRole = 'user1';
            else if (data.user2.id === null || data.user2.id === userId) {
                userRole = 'user2';
                data.user2.id = userId;
                await updateBin(binId, data);
            } else { heartsErrorEl.textContent = 'Комната уже занята.'; return; }
            sessionStorage.setItem('userRole', userRole);
            switchToHeartsView(binId, data);
        }
    }

    function switchToHeartsView(binId, initialData) {
        sessionStorage.setItem('heartsBinId', binId);
        heartsConnectScreen.classList.add('hidden');
        heartsDisplayScreen.classList.remove('hidden');
        heartsRoomIdEl.textContent = binId;
        if (initialData) updateHeartsUI(initialData);
        startPolling(binId, updateHeartsUI);
    }

    function updateHeartsUI(data) {
        if (!data || !data.user1 || !data.user2) return;
        
        const myRole = sessionStorage.getItem('userRole');
        const partnerRole = myRole === 'user1' ? 'user2' : 'user1';

        const myHeart = myRole === 'user1' ? heart1El : heart2El;
        const myMood = myRole === 'user1' ? mood1El : mood2El;
        const partnerHeart = partnerRole === 'user1' ? heart1El : heart2El;
        const partnerMood = partnerRole === 'user1' ? mood1El : mood2El;

        myHeart.style.backgroundColor = data[myRole].color;
        myMood.textContent = data[myRole].mood;
        myHeart.classList.add('interactive');

        partnerHeart.style.backgroundColor = data[partnerRole].color;
        partnerMood.textContent = data[partnerRole].mood;
        partnerHeart.classList.remove('interactive');
    }

    async function handleMoodChange(e) {
        const myRole = sessionStorage.getItem('userRole');
        const binId = sessionStorage.getItem('heartsBinId');
        if (e.target.classList.contains('mood-option') && myRole && binId) {
            const newMood = e.target.textContent;
            const data = await getBin(binId);
            if (data) {
                data[myRole].mood = newMood;
                await updateBin(binId, data);
                updateHeartsUI(data);
            }
        }
    }

    async function handleColorChange(e) {
        const myRole = sessionStorage.getItem('userRole');
        const binId = sessionStorage.getItem('heartsBinId');
        if (e.target.classList.contains('color-dot') && myRole && binId) {
            const newColor = e.target.dataset.color;
            const data = await getBin(binId);
            if (data) {
                data[myRole].color = newColor;
                await updateBin(binId, data);
                updateHeartsUI(data);
            }
        }
    }

    async function createGame() {
        const initialData = {
            messages: [{ sender: 'Game', text: 'Вы вдвоём оказались в мерцающем лесу... Перед вами две тропы: к поющему водопаду или в таинственную пещеру с тихой музыкой. Ваш выбор?'}]
        };
        const binId = await createBin(initialData, gameErrorEl);
        if (binId) switchToGameView(binId, initialData);
    }

    async function joinGame(e) {
        e.preventDefault();
        const binId = joinGameInput.value.trim();
        if (!binId) return;
        const data = await getBin(binId, gameErrorEl);
        if (data) switchToGameView(binId, data);
    }
    
    function switchToGameView(binId, initialData) {
        sessionStorage.setItem('gameBinId', binId);
        gameConnectScreen.classList.add('hidden');
        gameChatScreen.classList.remove('hidden');
        gameIdDisplay.textContent = binId;
        if (initialData) updateGameUI(initialData);
        startPolling(binId, updateGameUI);
    }
    
    function updateGameUI(data) {
        const messages = data.messages || [];
        if (chatWindow.children.length === messages.length) return;
        
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
        if (!text || sendBtn.disabled) return;

        sendBtn.disabled = true;
        chatInput.value = '';

        const binId = sessionStorage.getItem('gameBinId');
        const data = await getBin(binId);
        if (!data) { sendBtn.disabled = false; return; }

        const newMessage = { sender: userId, text, timestamp: new Date().toISOString() };
        data.messages.push(newMessage);
        await updateBin(binId, data);
        updateGameUI(data);

        triggerGameMaster(data.messages);
    }

    async function triggerGameMaster(messages) {
        const chatHistory = messages.slice(-6).map(m => `${m.sender === 'Game' ? 'Мастер Игры' : 'Игрок'}: ${m.text}`).join('\n');
        const prompt = `Ты — таинственный и романтичный Гейм Мастер в текстовой игре для влюбленной пары. Их цель — вместе преодолевать испытания. Твой стиль — короткий, поэтичный, загадочный. Не давай прямых ответов, а создавай атмосферу и ставь перед ними выбор или описывай последствия их действий. Основываясь на истории чата, напиши следующее короткое сообщение (2-3 предложения) от лица Мастера Игры.\n\nИСТОРИЯ:\n${chatHistory}\n\nТВОЙ ОТВЕТ:`;

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
            
            const currentData = await getBin(sessionStorage.getItem('gameBinId'));
            if(currentData) {
                currentData.messages.push(gameMessage);
                await updateBin(sessionStorage.getItem('gameBinId'), currentData);
            }
        } catch (error) {
            console.error("Ошибка Gemini:", error);
        } finally {
            sendBtn.disabled = false;
        }
    }
    
    initialize();
});
