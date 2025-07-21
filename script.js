document.addEventListener('DOMContentLoaded', () => {
    // --- КОНФИГУРАЦИЯ И КОНСТАНТЫ ---
    const BIN_ID = '687ebac9f7e7a370d1eba7fa';
    const API_KEY = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
    const HEADERS = {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
    };
    const USER_CODES = {
        '06112002': 'He',
        '18092000': 'She'
    };
    const POLLING_INTERVAL = 3000; // 3 секунды для обновлений

    // --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
    let currentUser = null;
    let appData = null;
    let pollingIntervalId = null;
    let isUpdating = false; // Флаг для предотвращения гонки состояний

    // --- DOM ЭЛЕМЕНТЫ ---
    const loader = document.getElementById('loader');
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    const loginButton = document.getElementById('login-button');
    const loginCodeInput = document.getElementById('login-code');
    const loginError = document.getElementById('login-error');

    // --- Инициализация приложения ---
    function init() {
        // Показать загрузчик на несколько секунд для атмосферы
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('hidden');
                loginScreen.classList.remove('hidden');
                loginScreen.style.opacity = '1';
            }, 500);
        }, 5000);

        loginButton.addEventListener('click', handleLogin);
        loginCodeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // --- ЛОГИКА ВХОДА ---
    async function handleLogin() {
        const code = loginCodeInput.value;
        const user = USER_CODES[code];
        if (user) {
            currentUser = user;
            loginError.classList.add('hidden');
            await startApp();
        } else {
            loginError.classList.remove('hidden');
        }
    }

    // --- ЗАПУСК ОСНОВНОГО ПРИЛОЖЕНИЯ ---
    async function startApp() {
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            appScreen.classList.remove('hidden');
            appScreen.style.opacity = '1';
        }, 500);

        await fetchAndInitializeData();
        setupEventListeners();
        startPolling();
    }
    
    // --- РАБОТА С API JSONBIN.IO ---

    // Получение и инициализация данных
    async function fetchAndInitializeData() {
        try {
            const response = await fetch(`${API_URL}/latest`, { headers: { ...HEADERS, 'X-Bin-Meta': false } });
            if (response.status === 404 || response.headers.get('content-length') === '0') {
                console.log('Bin is empty or not found. Initializing...');
                await initializeBin();
            } else {
                appData = await response.json();
                // Проверка целостности данных
                if (!isDataStructureValid(appData)) {
                    console.log('Data structure is invalid. Re-initializing...');
                    await initializeBin();
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Попытка инициализировать, если произошла сетевая ошибка
            await initializeBin();
        }
        renderApp();
    }
    
    // Инициализация пустого хранилища
    async function initializeBin() {
        const defaultData = getDefaultDataStructure();
        await updateData(defaultData);
        appData = defaultData;
    }

    // Отправка обновленных данных на сервер
    async function updateData(data) {
        if (isUpdating) return;
        isUpdating = true;
        try {
            await fetch(API_URL, {
                method: 'PUT',
                headers: HEADERS,
                body: JSON.stringify(data)
            });
            appData = data; // Локальное состояние обновляется после успешной отправки
        } catch (error) {
            console.error('Error updating data:', error);
        } finally {
            isUpdating = false;
        }
    }

    // --- СИНХРОНИЗАЦИЯ (ПОЛЛИНГ) ---
    function startPolling() {
        if (pollingIntervalId) clearInterval(pollingIntervalId);
        pollingIntervalId = setInterval(async () => {
            if (isUpdating) return;
            try {
                const response = await fetch(`${API_URL}/latest`, { headers: { ...HEADERS, 'X-Bin-Meta': false } });
                if (response.ok) {
                    const latestData = await response.json();
                    if (JSON.stringify(latestData) !== JSON.stringify(appData)) {
                        appData = latestData;
                        renderApp();
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, POLLING_INTERVAL);
    }

    // --- ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА ---
    function renderApp() {
        if (!appData) return;
        
        // Проверка и обработка взаимодействий (поцелуй, объятие)
        handleInteractionAnimations();

        // Рендеринг каждой вкладки
        renderHeartsTab();
        renderQuestionTab();
        renderGameTab();
        renderStarMapTab();
        
        // Рендеринг общих элементов
        renderSoundToggle();
    }
    
    // --- УСТАНОВКА ОБРАБОТЧИКОВ СОБЫТИЙ ---
    function setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-button').forEach(button => {
            if (button.dataset.tab) {
                button.addEventListener('click', () => switchTab(button.dataset.tab));
            }
        });
        
        // Вкладка "Сердца"
        document.getElementById('he-heart').addEventListener('click', () => openHeartModal('He'));
        document.getElementById('she-heart').addEventListener('click', () => openHeartModal('She'));
        document.getElementById('kiss-button').addEventListener('click', sendKiss);
        document.getElementById('hug-button').addEventListener('click', sendHug);
        document.getElementById('save-heart-changes').addEventListener('click', saveHeartChanges);

        // Вкладка "Вопрос дня"
        document.getElementById('submit-answer-button').addEventListener('click', submitAnswer);

        // Вкладка "Звёздная карта"
        setupCanvas();
        document.getElementById('clear-canvas-button').addEventListener('click', confirmClearCanvas);
        document.getElementById('star-color-picker').addEventListener('change', (e) => {
            // Цвет меняется сразу, без сохранения в appData для простоты
            // Если нужна синхронизация цвета, нужно будет добавить в appData
        });

        // Звук
        document.getElementById('sound-toggle').addEventListener('click', toggleSound);

        // Автоматическая смена комплиментов
        setInterval(changeCompliment, 9000);
    }

    // --- ЛОГИКА ВКЛАДОК ---

    function switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-button[data-tab]').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`tab-${tabId}`).classList.add('active');
        document.querySelector(`.nav-button[data-tab="${tabId}"]`).classList.add('active');
    }

    // --- ВКЛАДКА 1: СЕРДЦА ---
    
    function renderHeartsTab() {
        const { He, She } = appData;
        // Сердце "Он"
        const heHeart = document.getElementById('he-heart');
        heHeart.style.backgroundColor = He.heart.color;
        heHeart.textContent = He.heart.emoji;
        heHeart.style.setProperty('--heart-he-color', He.heart.color);
        // Сердце "Она"
        const sheHeart = document.getElementById('she-heart');
        sheHeart.style.backgroundColor = She.heart.color;
        sheHeart.textContent = She.heart.emoji;
        sheHeart.style.setProperty('--heart-she-color', She.heart.color);
    }
    
    function openHeartModal(user) {
        if (user !== currentUser) return; // Можно менять только своё сердце
        
        const modal = document.getElementById('heart-modal');
        modal.dataset.user = user;
        
        const colorPalette = modal.querySelector('.color-palette');
        const emojiPalette = modal.querySelector('.emoji-palette');
        
        const colors = ['#ff4d4d', '#ff8fab', '#a481f1', '#4d79ff', '#52d1a6', '#f5d76e', '#ff9a8b'];
        const emojis = ['❤️', '💖', '✨', '🔥', '🥰', '🌟', '💫', '💞'];
        
        colorPalette.innerHTML = colors.map(c => `<div class="color-option" style="background-color: ${c}" data-color="${c}"></div>`).join('');
        emojiPalette.innerHTML = emojis.map(e => `<div class="emoji-option" data-emoji="${e}">${e}</div>`).join('');

        // Выбор текущих
        const currentHeart = appData[user].heart;
        const selectedColor = colorPalette.querySelector(`[data-color="${currentHeart.color}"]`);
        if(selectedColor) selectedColor.classList.add('selected');
        const selectedEmoji = emojiPalette.querySelector(`[data-emoji="${currentHeart.emoji}"]`);
        if(selectedEmoji) selectedEmoji.classList.add('selected');

        colorPalette.querySelectorAll('.color-option').forEach(el => el.addEventListener('click', () => {
            colorPalette.querySelector('.selected')?.classList.remove('selected');
            el.classList.add('selected');
        }));
        emojiPalette.querySelectorAll('.emoji-option').forEach(el => el.addEventListener('click', () => {
            emojiPalette.querySelector('.selected')?.classList.remove('selected');
            el.classList.add('selected');
        }));
        
        modal.classList.remove('hidden');
    }

    function saveHeartChanges() {
        const modal = document.getElementById('heart-modal');
        const user = modal.dataset.user;
        const selectedColor = modal.querySelector('.color-option.selected')?.dataset.color;
        const selectedEmoji = modal.querySelector('.emoji-option.selected')?.dataset.emoji;

        if (selectedColor) appData[user].heart.color = selectedColor;
        if (selectedEmoji) appData[user].heart.emoji = selectedEmoji;
        
        modal.classList.add('hidden');
        renderHeartsTab();
        updateData(appData);
    }

    function sendKiss() {
        appData.interactions.kissFrom = currentUser;
        updateData(appData);
    }

    function sendHug() {
        appData.interactions.hugFrom = currentUser;
        updateData(appData);
    }

    function handleInteractionAnimations() {
        const { kissFrom, hugFrom } = appData.interactions;

        if (kissFrom) {
            const sender = kissFrom;
            const receiver = sender === 'He' ? 'She' : 'He';
            
            const senderHeart = document.getElementById(`${sender.toLowerCase()}-heart-wrapper`);
            const receiverHeart = document.getElementById(`${receiver.toLowerCase()}-heart-wrapper`);
            
            const particle = document.createElement('div');
            particle.textContent = '💋';
            particle.className = 'kiss-particle';
            document.querySelector('.hearts-interaction-area').appendChild(particle);

            const startRect = senderHeart.getBoundingClientRect();
            const endRect = receiverHeart.getBoundingClientRect();
            
            particle.style.left = `${startRect.left + startRect.width / 2}px`;
            particle.style.top = `${startRect.top + startRect.height / 2}px`;
            
            const tx = endRect.left - startRect.left;
            const ty = endRect.top - startRect.top;

            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            setTimeout(() => particle.remove(), 1500);

            // Сбрасываем флаг, чтобы анимация не повторялась
            appData.interactions.kissFrom = null;
            updateData(appData);
        }

        if (hugFrom) {
            const heHeart = document.getElementById('he-heart-wrapper');
            const sheHeart = document.getElementById('she-heart-wrapper');
            
            heHeart.style.setProperty('--hug-translate', '50%');
            sheHeart.style.setProperty('--hug-translate', '-50%');
            
            heHeart.classList.add('hugging');
            sheHeart.classList.add('hugging');
            
            setTimeout(() => {
                heHeart.classList.remove('hugging');
                sheHeart.classList.remove('hugging');
            }, 2000);

            appData.interactions.hugFrom = null;
            updateData(appData);
        }
    }

    function changeCompliment() {
        const compliments = [
            "Ты — моё самое большое счастье.", "С тобой каждый день особенный.", "Твоя улыбка освещает мой мир.",
            "Я люблю тебя больше, чем слова могут выразить.", "Ты делаешь меня лучше.", "Вместе мы можем всё.",
            "Ты моё вдохновение.", "Каждая минута с тобой — это подарок.", "Наша любовь — это магия."
        ];
        const complimentText = document.getElementById('compliment-text');
        complimentText.style.opacity = '0';
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * compliments.length);
            complimentText.textContent = compliments[randomIndex];
            complimentText.style.opacity = '1';
        }, 1000);
    }

    // --- ВКЛАДКА 2: ВОПРОС ДНЯ И ИСТОРИЯ ---
    function renderQuestionTab() {
        checkForNewDay(); // Проверяем, не наступил ли новый день

        const { dailyQuestion, answerHistory } = appData;
        
        const questionText = document.getElementById('daily-question-text');
        const questions = getDailyQuestions();
        questionText.textContent = questions[dailyQuestion.questionId];

        const userAnswerInput = document.getElementById('user-answer');
        const submitButton = document.getElementById('submit-answer-button');
        const waitingPartner = document.getElementById('waiting-partner');
        const answersDisplay = document.getElementById('answers-display');
        const answerSection = document.getElementById('answer-section');

        const myAnswer = dailyQuestion.answers[currentUser];
        const partnerAnswer = dailyQuestion.answers[currentUser === 'He' ? 'She' : 'He'];

        if (myAnswer) {
            answerSection.classList.add('hidden');
            if (partnerAnswer) {
                // Оба ответили
                waitingPartner.classList.add('hidden');
                answersDisplay.classList.remove('hidden');
                document.getElementById('he-answer-text').textContent = dailyQuestion.answers.He;
                document.getElementById('she-answer-text').textContent = dailyQuestion.answers.She;
            } else {
                // Только я ответил
                waitingPartner.classList.remove('hidden');
                answersDisplay.classList.add('hidden');
            }
        } else {
            // Я еще не ответил
            answerSection.classList.remove('hidden');
            userAnswerInput.value = '';
            waitingPartner.classList.add('hidden');
            answersDisplay.classList.add('hidden');
        }

        // Рендеринг истории
        const historyContainer = document.getElementById('answer-history');
        historyContainer.innerHTML = '';
        answerHistory.slice().reverse().forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'history-entry';
            entryDiv.innerHTML = `
                <div class="date">${entry.date}</div>
                <p class="question">${entry.question}</p>
                <div class="answers">
                    <p><strong>Он:</strong> ${entry.answers.He}</p>
                    <p><strong>Она:</strong> ${entry.answers.She}</p>
                </div>
            `;
            historyContainer.appendChild(entryDiv);
        });
    }

    function submitAnswer() {
        const answer = document.getElementById('user-answer').value.trim();
        if (!answer) return;

        appData.dailyQuestion.answers[currentUser] = answer;

        const partner = currentUser === 'He' ? 'She' : 'He';
        if (appData.dailyQuestion.answers[partner]) {
            // Партнер уже ответил, сохраняем в историю
            saveToHistory();
        }

        updateData(appData).then(renderQuestionTab);
    }

    function saveToHistory() {
        const { dailyQuestion } = appData;
        const questions = getDailyQuestions();
        appData.answerHistory.push({
            date: dailyQuestion.date,
            question: questions[dailyQuestion.questionId],
            answers: { ...dailyQuestion.answers }
        });
    }
    
    function checkForNewDay() {
        const today = new Date().toISOString().split('T')[0];
        if (appData.dailyQuestion.date !== today) {
            // Новый день! Сбрасываем вопрос и ответы
            const questions = getDailyQuestions();
            appData.dailyQuestion.date = today;
            appData.dailyQuestion.questionId = new Date().getDate() % questions.length;
            appData.dailyQuestion.answers = { He: null, She: null };
            updateData(appData);
        }
    }

    // --- ВКЛАДКА 3: ТЕКСТОВАЯ ИГРА ---
    function renderGameTab() {
        const { game } = appData;
        const story = getGameStory();
        const currentNode = story[game.currentNode];

        document.getElementById('sync-scale').textContent = game.syncScale;
        document.getElementById('inventory').textContent = game.inventory.length > 0 ? game.inventory.join(', ') : 'пусто';
        document.getElementById('game-story').innerHTML = currentNode.text;

        const choicesContainer = document.getElementById('game-choices');
        const waitingMessage = document.getElementById('game-waiting-message');
        choicesContainer.innerHTML = '';

        const myChoice = game.choices[currentUser];
        const partnerChoice = game.choices[currentUser === 'He' ? 'She' : 'He'];

        if (myChoice) {
            waitingMessage.classList.remove('hidden');
            choicesContainer.classList.add('hidden');
        } else {
            waitingMessage.classList.add('hidden');
            choicesContainer.classList.remove('hidden');
            currentNode.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'choice-button';
                button.textContent = choice.text;
                button.addEventListener('click', () => makeGameChoice(index));
                choicesContainer.appendChild(button);
            });
        }
        
        // Если оба выбрали, обрабатываем результат
        if (myChoice !== null && partnerChoice !== null) {
            processGameTurn();
        }
    }

    function makeGameChoice(choiceIndex) {
        appData.game.choices[currentUser] = choiceIndex;
        updateData(appData).then(renderGameTab);
    }

    function processGameTurn() {
        const { game } = appData;
        const story = getGameStory();
        const currentNode = story[game.currentNode];
        
        const myChoice = currentNode.choices[game.choices[currentUser]];
        const partnerChoice = currentNode.choices[game.choices[currentUser === 'He' ? 'She' : 'He']];

        // Логика игры (упрощенная)
        if (myChoice.id === partnerChoice.id) {
            game.syncScale = Math.min(100, game.syncScale + 10);
        } else {
            game.syncScale = Math.max(0, game.syncScale - 5);
        }

        if (myChoice.item) game.inventory.push(myChoice.item);
        if (partnerChoice.item && myChoice.item !== partnerChoice.item) game.inventory.push(partnerChoice.item);
        
        // Переход к следующему узлу (берем из выбора первого игрока)
        game.currentNode = myChoice.next;
        game.choices = { He: null, She: null };
        
        updateData(appData).then(renderGameTab);
    }
    
    // --- ВКЛАДКА 4: ЗВЁЗДНАЯ КАРТА ---
    let canvas, ctx, drawing = false, lastPos = null;

    function setupCanvas() {
        canvas = document.getElementById('star-canvas');
        ctx = canvas.getContext('2d');
        
        // Адаптация размера canvas
        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            renderStarMapTab(); // Перерисовать при изменении размера
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('mousemove', draw);

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]); });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); stopDrawing(); });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });
    }

    function renderStarMapTab() {
        if (!ctx || !appData) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        appData.starMap.paths.forEach(path => {
            ctx.beginPath();
            ctx.strokeStyle = path.color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.moveTo(path.points[0].x * canvas.width, path.points[0].y * canvas.height);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x * canvas.width, path.points[i].y * canvas.height);
            }
            ctx.stroke();
        });
    }

    function startDrawing(e) {
        drawing = true;
        const pos = getMousePos(e);
        const color = document.getElementById('star-color-picker').value;
        appData.starMap.paths.push({ color: color, points: [pos] });
        lastPos = pos;
    }

    function draw(e) {
        if (!drawing) return;
        const pos = getMousePos(e);
        const currentPath = appData.starMap.paths[appData.starMap.paths.length - 1];
        currentPath.points.push(pos);
        
        // Рисуем локально для плавности
        ctx.beginPath();
        ctx.strokeStyle = currentPath.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.moveTo(lastPos.x * canvas.width, lastPos.y * canvas.height);
        ctx.lineTo(pos.x * canvas.width, pos.y * canvas.height);
        ctx.stroke();
        lastPos = pos;
    }

    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        lastPos = null;
        updateData(appData); // Отправляем данные на сервер после окончания рисования
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / canvas.width,
            y: (e.clientY - rect.top) / canvas.height
        };
    }

    function confirmClearCanvas() {
        if (confirm('Вы уверены, что хотите очистить холст? Это действие необратимо.')) {
            appData.starMap.paths = [];
            updateData(appData).then(renderStarMapTab);
        }
    }

    // --- ЗВУК ---
    const music = document.getElementById('background-music');
    function toggleSound() {
        appData[currentUser].soundOn = !appData[currentUser].soundOn;
        renderSoundToggle();
        updateData(appData);
    }

    function renderSoundToggle() {
        const soundButton = document.getElementById('sound-toggle');
        if (appData[currentUser].soundOn) {
            soundButton.textContent = '🔊';
            music.play().catch(e => console.log("Autoplay was prevented."));
        } else {
            soundButton.textContent = '🎵';
            music.pause();
        }
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ И ДАННЫЕ ---
    
    function isDataStructureValid(data) {
        const keys = ['He', 'She', 'interactions', 'dailyQuestion', 'answerHistory', 'game', 'starMap'];
        return data && keys.every(key => key in data);
    }

    function getDefaultDataStructure() {
        const today = new Date().toISOString().split('T')[0];
        const questions = getDailyQuestions();
        return {
            "He": { "heart": { "color": "#4d79ff", "emoji": "💙" }, "soundOn": false },
            "She": { "heart": { "color": "#ff8fab", "emoji": "💖" }, "soundOn": false },
            "interactions": { "kissFrom": null, "hugFrom": null },
            "dailyQuestion": {
                "date": today,
                "questionId": new Date().getDate() % questions.length,
                "answers": { "He": null, "She": null }
            },
            "answerHistory": [],
            "game": {
                "currentNode": "start",
                "inventory": [],
                "syncScale": 50,
                "choices": { "He": null, "She": null }
            },
            "starMap": { "paths": [] }
        };
    }
    
    function getDailyQuestions() {
        return [
            "Что заставило тебя улыбнуться сегодня?",
            "Какое твое самое теплое воспоминание о нас?",
            "Если бы мы могли отправиться куда угодно прямо сейчас, куда бы ты хотел(а)?",
            "Какой фильм или сериал ты бы хотел(а) пересмотреть со мной?",
            "Опиши идеальный вечер для нас двоих.",
            "Какая песня напоминает тебе обо мне?",
            "Что ты ценишь во мне больше всего?",
            "Какая у тебя есть маленькая мечта, о которой я не знаю?",
            "Что самое смешное, что мы делали вместе?",
            "Какой суперсилой ты бы хотел(а) обладать и почему?"
        ];
    }

    function getGameStory() {
        return {
            "start": {
                "text": "Вы стоите перед древним, заросшим лианами храмом. Тяжелая каменная дверь преграждает путь. Слева от двери — странные символы на стене, справа — небольшой рычаг, покрытый ржавчиной. Что вы делаете?",
                "choices": [
                    { "text": "Попытаться расшифровать символы", "id": "decode", "next": "decode_result" },
                    { "text": "Дернуть за ржавый рычаг", "id": "pull", "next": "pull_result" }
                ]
            },
            "decode_result": {
                "text": "Вы вместе разглядываете символы. Кажется, это древняя головоломка. После долгих раздумий вы понимаете, что это код. Дверь со скрипом открывается! Ваша синхронность растет.",
                "choices": [
                    { "text": "Войти в темный проход", "id": "enter", "next": "hall" }
                ]
            },
            "pull_result": {
                "text": "Вы с силой дергаете за рычаг. Раздается скрежет, и из-под земли поднимается решетка, блокируя путь назад. Но дверь в храм открывается. Немного рискованно!",
                "choices": [
                    { "text": "Осторожно заглянуть внутрь", "id": "enter", "next": "hall" }
                ]
            },
            "hall": {
                "text": "Вы входите в большой зал. В центре стоит пьедестал, на котором лежит светящийся кристалл. В дальнем конце зала — две двери: одна украшена изображением солнца, другая — луны. Куда пойдете?",
                "choices": [
                    { "text": "К двери Солнца", "id": "sun", "next": "sun_room" },
                    { "text": "К двери Луны", "id": "moon", "next": "moon_room" },
                    { "text": "Взять кристалл с пьедестала", "id": "crystal", "item": "Светящийся кристалл", "next": "hall_with_crystal" }
                ]
            },
            "hall_with_crystal": {
                "text": "Вы взяли кристалл. Он тепло пульсирует в руках. Двери Солнца и Луны все еще ждут вашего выбора.",
                "choices": [
                    { "text": "К двери Солнца", "id": "sun", "next": "sun_room" },
                    { "text": "К двери Луны", "id": "moon", "next": "moon_room" }
                ]
            },
            "sun_room": {
                "text": "Это комната-ловушка! Стены начинают сдвигаться. Конец игры.",
                "choices": [
                    { "text": "Начать заново", "id": "restart", "next": "start" }
                ]
            },
            "moon_room": {
                "text": "За дверью вы находите сокровищницу, полную древних артефактов. Вы вместе прошли испытание! Победа!",
                "choices": [
                    { "text": "Начать заново", "id": "restart", "next": "start" }
                ]
            }
        };
    }

    // --- ЗАПУСК ---
    init();
});
