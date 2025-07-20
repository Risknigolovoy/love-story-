document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальные переменные ---
    const apiKey = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const binApiUrl = 'https://api.jsonbin.io/v3/b';
    
    let pollingInterval = null;
    let userRole = null;

    const userId = sessionStorage.getItem('userId') || `user_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('userId', userId);

    // --- Элементы DOM ---
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const navButtons = document.querySelectorAll('.nav-button');
    
    // Сердца
    const heartsConnectScreen = document.getElementById('hearts-connect-screen');
    const heartsDisplayScreen = document.getElementById('hearts-display-screen');
    const createHeartsRoomBtn = document.getElementById('create-hearts-room-btn');
    const joinHeartsRoomForm = document.getElementById('join-hearts-room-form');
    const joinHeartsRoomInput = document.getElementById('join-hearts-room-input');
    const heartsErrorEl = document.getElementById('hearts-error');
    const heart1Wrapper = document.getElementById('heart1');
    const heart2Wrapper = document.getElementById('heart2');
    const mood1El = document.getElementById('mood1');
    const mood2El = document.getElementById('mood2');
    const moodSelector = document.getElementById('mood-selector');
    const colorPalette = document.getElementById('color-palette');
    const heartsRoomIdEl = document.getElementById('hearts-room-id');
    const complimentTextEl = document.getElementById('compliment-text');

    // Игра
    const gameConnectScreen = document.getElementById('game-connect-screen');
    const gameChatScreen = document.getElementById('game-chat-screen');
    const createGameBtn = document.getElementById('create-game-btn');
    const joinGameForm = document.getElementById('join-game-form');
    const joinGameInput = document.getElementById('join-game-input');
    const gameErrorEl = document.getElementById('game-error');
    const gameIdDisplay = document.getElementById('game-id-display');
    const gameStoryText = document.getElementById('game-story-text');
    const gameOptions = document.getElementById('game-options');
    const gameWaitingText = document.getElementById('game-waiting-text');
    const gameResultsText = document.getElementById('game-results-text');

    // --- Инициализация ---
    function initialize() {
        setTimeout(() => {
            loader.classList.add('hidden');
            app.classList.remove('hidden');
        }, 5000);

        setupEventListeners();
        populateControls();
        startComplimentCycle();
        restoreSession();
    }
    
    // --- Логика игры ---
    const gameStory = {
        'start': {
            text: 'Вы вдвоём оказались в мерцающем лесу. Воздух пахнет озоном и ночными цветами. Перед вами тропа расходится: одна ведет к поющему водопаду, другая — к таинственной пещере, из которой доносится тихая музыка.',
            options: ['Идти к водопаду', 'Исследовать пещеру'],
            logic: (p1, p2) => (p1 === p2) ? (p1 === 0 ? 'waterfall' : 'cave') : 'split_paths'
        },
        'waterfall': {
            text: 'У водопада вы находите два светящихся камня. Один тёплый, как летнее солнце, другой — прохладный, как лунный свет. Вы можете взять только по одному.',
            options: ['Взять тёплый камень', 'Взять холодный камень'],
            logic: (p1, p2) => (p1 === p2) ? (p1 === 0 ? 'warm_ending' : 'cold_ending') : 'mix_ending'
        },
        'cave': {
            text: 'В пещере стены усыпаны кристаллами. В центре стоит пьедестал с двумя шкатулками: одна из тёмного дерева, другая — из светлого перламутра.',
            options: ['Открыть тёмную шкатулку', 'Открыть светлую шкатулку'],
            logic: (p1, p2) => (p1 === p2) ? (p1 === 0 ? 'dark_ending' : 'bright_ending') : 'mix_ending'
        },
        'split_paths': {
            text: 'Вы решили разделиться. Блуждая в одиночестве, вы понимаете, что магия этого места заключается в единстве. Тропинки снова сводят вас вместе, давая второй шанс. Перед вами снова водопад и пещера.',
            options: ['К водопаду, на этот раз вместе', 'В пещеру, держась за руки'],
            logic: (p1, p2) => (p1 === 0 || p2 === 0) ? 'waterfall' : 'cave'
        },
        'warm_ending': { text: 'Когда ваши тёплые камни соприкоснулись, они вспыхнули ярким светом, и лес вокруг вас расцвёл тысячами огней. Вы обрели дар согревать друг друга даже на расстоянии. Это ваша общая победа, построенная на тепле и доверии.', isEnd: true },
        'cold_ending': { text: 'Холодные камни в ваших руках засияли чистым звёздным светом, открывая вам тайные тропы Вселенной. Вы научились понимать друг друга без слов, читая мысли в сиянии звёзд. Это ваша победа мудрости и спокойствия.', isEnd: true },
        'dark_ending': { text: 'В тёмных шкатулках вы нашли древние артефакты, дарующие защиту от любых невзгод. Вы поняли, что вместе можете преодолеть любую тьму, ведь ваша любовь — самый надёжный щит. Это победа вашей смелости.', isEnd: true },
        'bright_ending': { text: 'Светлые шкатулки наполнили пещеру музыкой и светом, показав вам картины вашего счастливого будущего. Вы обрели дар видеть лучшее друг в друге и вдохновлять на мечты. Это победа вашей надежды.', isEnd: true },
        'mix_ending': { text: 'Ваши разные выборы создали нечто новое. Камни и шкатулки слились в один артефакт, который пульсирует и теплом, и холодом, и светом, и тенью. Вы поняли, что ваша сила — в принятии различий друг друга, создавая уникальную гармонию. Это ваша главная победа — победа любви, которая объединяет противоположности.', isEnd: true }
    };

    // ... (остальной код будет ниже)
    
    // --- Настройка и общие функции ---
    function setupEventListeners() {
        navButtons.forEach(button => button.addEventListener('click', switchView));
        createHeartsRoomBtn.addEventListener('click', createHeartsRoom);
        joinHeartsRoomForm.addEventListener('submit', joinHeartsRoom);
        moodSelector.addEventListener('click', handleMoodChange);
        colorPalette.addEventListener('click', handleColorChange);
        createGameBtn.addEventListener('click', createGame);
        joinGameForm.addEventListener('submit', joinGame);
        gameOptions.addEventListener('click', handleGameChoice);
    }

    function switchView(e) {
        clearInterval(pollingInterval);
        const targetViewId = e.target.dataset.view;
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
        document.getElementById(targetViewId).classList.add('active-view');
        navButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const heartsBinId = sessionStorage.getItem('heartsBinId');
        const gameBinId = sessionStorage.getItem('gameBinId');

        if (targetViewId === 'hearts-view' && heartsBinId) startPolling(heartsBinId, updateHeartsUI);
        else if (targetViewId === 'game-view' && gameBinId) startPolling(gameBinId, updateGameUI);
    }

    function startPolling(binId, updateFunction) {
        clearInterval(pollingInterval);
        const fetchData = async () => {
            const data = await getBin(binId);
            if (data) updateFunction(data);
        };
        fetchData();
        pollingInterval = setInterval(fetchData, 3500);
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
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey, 'X-Bin-Private': 'true' },
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
    
    // --- Логика сердец и комплиментов ---
    function startComplimentCycle() {
        if (complimentInterval) clearInterval(complimentInterval);
        const showNextCompliment = () => {
            complimentTextEl.style.opacity = 0;
            setTimeout(() => {
                complimentTextEl.textContent = lovePhrases[Math.floor(Math.random() * lovePhrases.length)];
                complimentTextEl.style.opacity = 1;
            }, 500);
        };
        showNextCompliment();
        complimentInterval = setInterval(showNextCompliment, 8000);
    }
    
    function populateControls() {
        const colors = ['#ff7a7a', '#a27aff', '#7affb8', '#f5ff7a', '#7ad7ff', '#ffc0cb', '#ffffff'];
        colors.forEach(color => {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = color;
            dot.dataset.color = color;
            colorPalette.appendChild(dot);
        });
        const moods = ['❤️', '😊', '🥰', '😔', '🔥', '😴'];
        moods.forEach(mood => {
            const btn = document.createElement('button');
            btn.className = 'mood-option';
            btn.textContent = mood;
            moodSelector.appendChild(btn);
        });
    }

    async function createHeartsRoom() {
        const initialData = {
            user1: { id: userId, color: '#ff7a7a', mood: '❤️' },
            user2: { id: null, color: '#a27aff', mood: '❤️' }
        };
        const binId = await createBin(initialData, heartsErrorEl);
        if (binId) {
            sessionStorage.setItem('userRole', 'user1');
            switchToHeartsView(binId, initialData);
        }
    }

    async function joinHeartsRoom(e) {
        e.preventDefault();
        const binId = joinHeartsRoomInput.value.trim();
        if (!binId) return;
        const data = await getBin(binId, heartsErrorEl);
        if (data) {
            let role = sessionStorage.getItem('userRole');
            if (data.user1.id === userId) role = 'user1';
            else if (data.user2.id === null || data.user2.id === userId) {
                role = 'user2';
                if (data.user2.id === null) {
                    data.user2.id = userId;
                    await updateBin(binId, data);
                }
            } else { heartsErrorEl.textContent = 'Комната уже занята.'; return; }
            sessionStorage.setItem('userRole', role);
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
        userRole = sessionStorage.getItem('userRole');
        const partnerRole = userRole === 'user1' ? 'user2' : 'user1';
        
        const myHeartWrapper = userRole === 'user1' ? heart1Wrapper : heart2Wrapper;
        const partnerHeartWrapper = userRole === 'user1' ? heart2Wrapper : heart1Wrapper;
        
        myHeartWrapper.querySelector('.heart-svg').style.fill = data[userRole].color;
        myHeartWrapper.querySelector('.mood-emoji').textContent = data[userRole].mood;
        myHeartWrapper.classList.add('interactive');
        
        partnerHeartWrapper.querySelector('.heart-svg').style.fill = data[partnerRole].color;
        partnerHeartWrapper.querySelector('.mood-emoji').textContent = data[partnerRole].mood;
        partnerHeartWrapper.classList.remove('interactive');
    }

    async function handleMoodChange(e) {
        userRole = sessionStorage.getItem('userRole');
        const binId = sessionStorage.getItem('heartsBinId');
        if (e.target.classList.contains('mood-option') && userRole && binId) {
            const newMood = e.target.textContent;
            const data = await getBin(binId);
            if (data) {
                data[userRole].mood = newMood;
                await updateBin(binId, data);
                updateHeartsUI(data);
            }
        }
    }

    async function handleColorChange(e) {
        userRole = sessionStorage.getItem('userRole');
        const binId = sessionStorage.getItem('heartsBinId');
        if (e.target.classList.contains('color-dot') && userRole && binId) {
            const newColor = e.target.dataset.color;
            const data = await getBin(binId);
            if (data) {
                data[userRole].color = newColor;
                await updateBin(binId, data);
                updateHeartsUI(data);
            }
        }
    }

    // --- Логика игры ---
    async function createGame() {
        const initialData = {
            step: 'start',
            p1_id: userId,
            p2_id: null,
            p1_answer: null,
            p2_answer: null,
            history: []
        };
        const binId = await createBin(initialData, gameErrorEl);
        if (binId) switchToGameView(binId, initialData);
    }

    async function joinGame(e) {
        e.preventDefault();
        const binId = joinGameInput.value.trim();
        if (!binId) return;
        const data = await getBin(binId, gameErrorEl);
        if (data) {
            if (data.p1_id !== userId && data.p2_id === null) {
                data.p2_id = userId;
                await updateBin(binId, data);
            }
            switchToGameView(binId, data);
        }
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
        if (!data) return;
        const currentStepData = gameStory[data.step];
        if (!currentStepData) return;

        const myRole = (userId === data.p1_id) ? 'p1' : 'p2';
        const myAnswer = data[`${myRole}_answer`];

        gameStoryText.textContent = currentStepData.text;
        gameResultsText.textContent = '';
        
        if (currentStepData.isEnd) {
            gameOptions.innerHTML = '';
            gameWaitingText.classList.add('hidden');
            const restartBtn = document.createElement('button');
            restartBtn.textContent = 'Начать заново';
            restartBtn.className = 'action-button orange';
            restartBtn.onclick = () => {
                gameConnectScreen.classList.remove('hidden');
                gameChatScreen.classList.add('hidden');
                sessionStorage.removeItem('gameBinId');
                clearInterval(pollingInterval);
            };
            gameOptions.appendChild(restartBtn);
            return;
        }

        if (myAnswer !== null) {
            gameOptions.innerHTML = '';
            gameWaitingText.classList.remove('hidden');
        } else {
            gameWaitingText.classList.add('hidden');
            gameOptions.innerHTML = '';
            currentStepData.options.forEach((optionText, index) => {
                const btn = document.createElement('button');
                btn.className = 'game-option-btn';
                btn.textContent = optionText;
                btn.dataset.choiceIndex = index;
                gameOptions.appendChild(btn);
            });
        }
        
        // Показываем результаты, если оба ответили
        if (data.p1_answer !== null && data.p2_answer !== null) {
            const p1ChoiceText = currentStepData.options[data.p1_answer];
            const p2ChoiceText = currentStepData.options[data.p2_answer];
            gameResultsText.innerHTML = `Он выбрал: <em>"${p1ChoiceText}"</em><br>Она выбрала: <em>"${p2ChoiceText}"</em>`;
        }
    }

    async function handleGameChoice(e) {
        if (!e.target.classList.contains('game-option-btn')) return;
        
        const choiceIndex = parseInt(e.target.dataset.choiceIndex, 10);
        const binId = sessionStorage.getItem('gameBinId');
        const data = await getBin(binId);
        if (!data) return;

        const myRole = (userId === data.p1_id) ? 'p1' : 'p2';
        data[`${myRole}_answer`] = choiceIndex;
        
        // Если оба игрока ответили, вычисляем следующий шаг
        if (data.p1_answer !== null && data.p2_answer !== null) {
            const currentStepLogic = gameStory[data.step].logic;
            const nextStep = currentStepLogic(data.p1_answer, data.p2_answer);
            
            // Сохраняем историю и переходим на новый шаг
            data.history.push({ step: data.step, p1: data.p1_answer, p2: data.p2_answer });
            data.step = nextStep;
            data.p1_answer = null;
            data.p2_answer = null;
        }

        await updateBin(binId, data);
        updateGameUI(data);
    }
    
    function restoreSession() {
        const heartsBinId = sessionStorage.getItem('heartsBinId');
        if (heartsBinId) switchToHeartsView(heartsBinId);
        
        const gameBinId = sessionStorage.getItem('gameBinId');
        if (gameBinId) switchToGameView(gameBinId);
    }

    initialize();
});
