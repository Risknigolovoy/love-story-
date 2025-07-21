document.addEventListener('DOMContentLoaded', () => {
    // --- КОНФИГУРАЦИЯ И КОНСТАНТЫ ---
    const X_MASTER_KEY = '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq';
    const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';
    const POLLING_INTERVAL = 3000; // 3 секунды
    const COMPLIMENT_INTERVAL = 9000; // 9 секунд

    // --- DOM ЭЛЕМЕНТЫ ---
    const loader = document.getElementById('loader');
    const app = document.getElementById('app');
    const roomScreen = document.getElementById('room-screen');
    const mainContent = document.getElementById('main-content');
    const createRoomBtn = document.getElementById('create-room-btn');
    const roomIdInput = document.getElementById('room-id-input');
    const joinAsHeBtn = document.getElementById('join-as-he-btn');
    const joinAsSheBtn = document.getElementById('join-as-she-btn');
    const roomCodeDisplay = document.querySelector('.room-code-display');
    const roomCodeEl = document.getElementById('room-code');

    const heHeart = document.getElementById('he-heart');
    const sheHeart = document.getElementById('she-heart');
    const heEmoji = document.getElementById('he-emoji');
    const sheEmoji = document.getElementById('she-emoji');

    const controls = document.getElementById('controls');
    const colorPalette = document.getElementById('color-palette');
    const emojiPalette = document.getElementById('emoji-palette');
    const confirmChoiceBtn = document.getElementById('confirm-choice-btn');

    const complimentText = document.getElementById('compliment-text');
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const gameStory = document.getElementById('game-story');
    const gameChoices = document.getElementById('game-choices');
    const gameStatus = document.getElementById('game-status');

    // --- СОСТОЯНИЕ ПРИЛОЖЕНИЯ ---
    let state = {
        binId: null,
        userRole: null, // 'he' или 'she'
        pollingTimer: null,
        complimentTimer: null,
        localData: null,
    };

    // --- СПИСКИ ДАННЫХ ---
    const compliments = [
        "Я люблю тебя до луны и обратно.", "Скучаю по твоему голосу.", "Ты - моё самое большое приключение.",
        "Каждая секунда без тебя - вечность.", "Мы справимся с любым расстоянием.", "Думаю о тебе прямо сейчас.",
        "Ты делаешь мой мир ярче.", "Скорей бы тебя обнять.", "Ты моё солнышко в пасмурный день.",
        "Спасибо, что ты есть у меня.", "Ты — причина моей улыбки.", "Наши сердца бьются в унисон."
    ];
    const colors = ['#ff4757', '#ff6b81', '#ffa502', '#ff6348', '#1e90ff', '#4169e1', '#32ff7e', '#7bed9f', '#9b59b6', '#8e44ad'];
    const emojis = ['❤️', '💖', '🥰', '😍', '😘', '🤗', '🌟', '✨', '🔥', '🔐'];

    // --- ИГРОВЫЕ ДАННЫЕ (Сюжет) ---
    const gameData = {
        'start': {
            text: "Вы стоите на пороге Зачарованного Леса. Лунный свет пробивается сквозь кроны деревьев, освещая две тропы. Одна уходит в тёмную чащу, другая — к мерцающему озеру. Куда вы пойдёте?",
            choices: [{ text: 'В тёмную чащу', id: 'a' }, { text: 'К мерцающему озеру', id: 'b' }],
            outcomes: {
                'a_a': 'deep_forest', 'b_b': 'lake_shore', 'a_b': 'mixed_path_1', 'b_a': 'mixed_path_1'
            }
        },
        'deep_forest': {
            text: "Вы вместе шагнули в чащу. Впереди вы видите светлячков, танцующих вокруг древнего дуба, и слышите тихую мелодию. Что будете делать?",
            choices: [{ text: 'Пойти к дубу', id: 'a' }, { text: 'Попытаться найти источник мелодии', id: 'b' }],
            outcomes: {
                'a_a': 'oak_success', 'b_b': 'music_success', 'a_b': 'oak_fail', 'b_a': 'oak_fail'
            }
        },
        'lake_shore': {
            text: "Берег озера усыпан светящимися камнями. Лодка мягко качается у кромки воды. Вы можете взять лодку или пойти вдоль берега.",
            choices: [{ text: 'Взять лодку и плыть к центру озера', id: 'a' }, { text: 'Идти вдоль берега', id: 'b' }],
            outcomes: {
                'a_a': 'boat_success', 'b_b': 'shore_walk_success', 'a_b': 'boat_fail', 'b_a': 'boat_fail'
            }
        },
        'mixed_path_1': {
            text: "Ваши пути разошлись, но вскоре снова сошлись у старого каменного моста. Мост выглядит хрупким. Вы решите перейти его вместе или будете искать обходной путь?",
            choices: [{ text: 'Рискнуть и перейти мост', id: 'a' }, { text: 'Искать обходной путь', id: 'b' }],
            outcomes: {
                'a_a': 'bridge_success', 'b_b': 'detour_success', 'a_b': 'bridge_fail', 'b_a': 'bridge_fail'
            }
        },
        // Концовки
        'oak_success': { text: "Подойдя к дубу, вы видите, что светлячки образовали два сердца. Они сливаются в одно, озаряя вас тёплым светом. Вы чувствуете, как ваша связь стала ещё крепче. (Хорошая концовка)", choices: [], outcomes: {} },
        'music_success': { text: "Мелодия привела вас на поляну, где духи леса играют на невидимых арфах. Они дарят вам волшебный цветок, символ вечной любви. (Хорошая концовка)", choices: [], outcomes: {} },
        'oak_fail': { text: "Ваши разные решения создали диссонанс. Светлячки разлетелись, и в лесу стало темно и холодно. Вы заблудились, но вы всё ещё вместе, чтобы найти выход. (Нейтральная концовка)", choices: [], outcomes: {} },
        'boat_success': { text: "В центре озера вы видите отражение двух летящих комет, которые встречаются в одной точке — прямо как вы. Это знак судьбы. (Хорошая концовка)", choices: [], outcomes: {} },
        'shore_walk_success': { text: "Идя вдоль берега, вы находите пещеру, стены которой усыпаны кристаллами, показывающими ваше счастливое будущее. (Хорошая концовка)", choices: [], outcomes: {} },
        'boat_fail': { text: "Из-за нерешительности вы упустили лодку, которую унесло течением. Придётся искать другой путь, но главное, что вы вместе. (Нейтральная концовка)", choices: [], outcomes: {} },
        'bridge_success': { text: "Держась за руки, вы аккуратно переходите мост. Ваше доверие друг к другу сделало его прочным. На другой стороне вас ждёт цветущий сад. (Хорошая концовка)", choices: [], outcomes: {} },
        'detour_success': { text: "Обходной путь оказался длинным, но живописным. Вы провели это время, разговаривая и наслаждаясь компанией друг друга, что сблизило вас ещё больше. (Хорошая концовка)", choices: [], outcomes: {} },
        'bridge_fail': { text: "Ваши сомнения сделали мост ещё более хрупким. Он обрушился, и вам пришлось вернуться. Это испытание, но вы готовы пройти его вместе. (Плохая концовка)", choices: [], outcomes: {} },

    };

    // --- ФУНКЦИИ API (JSONBIN.IO) ---
    async function apiCall(url, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Master-Key': X_MASTER_KEY,
            'X-Access-Key': '$2a$10$EIdkYYUdFQ6kRpT0OobuU.YjsENOEz9Un3ljT398QIIR0nRqXmFEq' // Для новых бинов иногда требуется
        };
        try {
            const options = { method, headers };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Для PUT запросов jsonbin возвращает 200 OK с данными, для POST - 200 OK с метаданными
             if (method === 'GET' || method === 'PUT') {
                 return await response.json();
             }
             // Для POST нам нужен ID из ответа
             const data = await response.json();
             return method === 'POST' ? data.metadata.id : data;

        } catch (error) {
            console.error("API call failed:", error);
            alert("Ошибка сети или сервера. Попробуйте снова.");
            return null;
        }
    }

    async function createBin() {
        const initialData = {
            hearts: {
                he: { color: '#4169e1', emoji: '❤️' },
                she: { color: '#ff69b4', emoji: '❤️' }
            },
            game: {
                node: 'start',
                choices: { he: null, she: null }
            }
        };
        const result = await apiCall(JSONBIN_URL, 'POST', initialData);
        return result; // Должен вернуть ID бина
    }

    async function readBin(binId) {
        const data = await apiCall(`${JSONBIN_URL}/${binId}/latest`);
        return data ? data.record : null;
    }

    async function updateBin(binId, data) {
        return await apiCall(`${JSONBIN_URL}/${binId}`, 'PUT', data);
    }

    // --- ОСНОВНАЯ ЛОГИКА ---

    function init() {
        // Симуляция загрузки
        setTimeout(() => {
            loader.classList.add('fade-out');
            app.classList.remove('hidden');
            setTimeout(() => loader.classList.add('hidden'), 1000);
        }, 5000); // 5 секунд

        setupEventListeners();
        populatePalettes();
    }
    
    function setupEventListeners() {
        createRoomBtn.addEventListener('click', handleCreateRoom);
        joinAsHeBtn.addEventListener('click', () => handleJoinRoom('he'));
        joinAsSheBtn.addEventListener('click', () => handleJoinRoom('she'));
        
        heHeart.addEventListener('click', () => openControls('he'));
        sheHeart.addEventListener('click', () => openControls('she'));
        confirmChoiceBtn.addEventListener('click', handleConfirmChoice);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        roomCodeEl.addEventListener('click', () => navigator.clipboard.writeText(state.binId));
    }

    // Логика комнат
    async function handleCreateRoom() {
        createRoomBtn.disabled = true;
        createRoomBtn.textContent = 'Создание...';
        const binId = await createBin();
        if (binId) {
            state.binId = binId;
            roomCodeEl.textContent = state.binId;
            roomCodeDisplay.classList.remove('hidden');
            alert(`Комната создана! Ваш код: ${state.binId}. Отправьте его партнёру. Вы автоматически войдёте как "Он".`);
            await startSession(binId, 'he');
        } else {
            alert("Не удалось создать комнату.");
        }
        createRoomBtn.disabled = false;
        createRoomBtn.textContent = 'Создать новую комнату';
    }

    async function handleJoinRoom(role) {
        const binId = roomIdInput.value.trim();
        if (!binId) {
            alert("Пожалуйста, введите код комнаты.");
            return;
        }
        // Проверка существования бина
        const data = await readBin(binId);
        if (data) {
            await startSession(binId, role);
        } else {
            alert("Комната с таким кодом не найдена.");
        }
    }

    async function startSession(binId, role) {
        state.binId = binId;
        state.userRole = role;
        
        roomScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');

        await pollServer(); // Первый немедленный вызов
        state.pollingTimer = setInterval(pollServer, POLLING_INTERVAL);
        startComplimentCycle();
    }
    
    // Обновление UI
    function updateUI(data) {
        if (!data) return;
        state.localData = data; // Сохраняем свежие данные локально

        // Обновляем сердца
        heHeart.style.color = data.hearts.he.color;
        heEmoji.textContent = data.hearts.he.emoji;
        sheHeart.style.color = data.hearts.she.color;
        sheEmoji.textContent = data.hearts.she.emoji;

        // Обновляем игру
        updateGameUI(data.game);
    }
    
    function updateGameUI(game) {
        const currentNode = gameData[game.node];
        if (!currentNode) return;
        
        gameStory.textContent = currentNode.text;
        
        // Очищаем и генерируем кнопки выбора
        gameChoices.innerHTML = '';
        if (currentNode.choices.length > 0) {
            currentNode.choices.forEach(choice => {
                const button = document.createElement('button');
                button.textContent = choice.text;
                button.dataset.choice = choice.id;
                button.addEventListener('click', () => handleGameChoice(choice.id));
                gameChoices.appendChild(button);
            });
        }
        
        // Обновляем статус игры
        const myChoice = game.choices[state.userRole];
        const partnerRole = state.userRole === 'he' ? 'she' : 'he';
        const partnerChoice = game.choices[partnerRole];

        if (myChoice) {
            // Если я уже выбрал
            gameChoices.querySelectorAll('button').forEach(b => {
                b.disabled = true; // Блокируем кнопки после выбора
                if (b.dataset.choice === myChoice) b.classList.add('chosen');
            });
            gameStatus.textContent = partnerChoice ? 'Оба сделали выбор! Смотрим результат...' : 'Ожидание ответа партнёра...';
        } else {
             // Если я еще не выбрал
            gameStatus.textContent = partnerChoice ? `Ваш партнёр (${partnerRole}) уже сделал свой выбор. Теперь ваша очередь!` : 'Сделайте свой выбор...';
        }
    }


    // Логика сердец
    function openControls(role) {
        if (role !== state.userRole) {
            alert("Вы можете изменять только своё сердце :)");
            return;
        }
        controls.classList.remove('hidden');
        controls.dataset.editing = role; // Сохраняем, чье сердце редактируем
    }

    async function handleConfirmChoice() {
        const role = controls.dataset.editing;
        const selectedColor = colorPalette.querySelector('.swatch-selected');
        const selectedEmoji = emojiPalette.querySelector('.swatch-selected');

        if (!selectedColor || !selectedEmoji) {
            alert("Пожалуйста, выберите и цвет, и эмодзи.");
            return;
        }

        const newData = JSON.parse(JSON.stringify(state.localData)); // Глубокая копия
        newData.hearts[role].color = selectedColor.dataset.color;
        newData.hearts[role].emoji = selectedEmoji.dataset.emoji;

        controls.classList.add('hidden');
        updateUI(newData); // Мгновенное локальное обновление
        await updateBin(state.binId, newData);
    }
    
    function populatePalettes() {
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => selectSwatch(swatch, 'color'));
            colorPalette.appendChild(swatch);
        });
        emojis.forEach(emoji => {
            const swatch = document.createElement('div');
            swatch.className = 'emoji-swatch';
            swatch.textContent = emoji;
            swatch.dataset.emoji = emoji;
            swatch.addEventListener('click', () => selectSwatch(swatch, 'emoji'));
            emojiPalette.appendChild(swatch);
        });
    }
    
    function selectSwatch(swatch, type) {
        const palette = type === 'color' ? colorPalette : emojiPalette;
        palette.querySelectorAll('.swatch-selected').forEach(s => s.classList.remove('swatch-selected'));
        swatch.classList.add('swatch-selected');
    }

    // Логика игры
    async function handleGameChoice(choiceId) {
        // Немедленно обновляем локальные данные и отправляем на сервер
        const newData = JSON.parse(JSON.stringify(state.localData));
        newData.game.choices[state.userRole] = choiceId;
        
        updateGameUI(newData.game); // Локальное обновление UI для отображения ожидания
        
        // Отправляем наш выбор на сервер
        const serverData = await updateBin(state.binId, newData);
        
        // Проверяем, сделал ли партнер выбор ПОСЛЕ нашего обновления
        if(serverData) {
            const partnerRole = state.userRole === 'he' ? 'she' : 'he';
            if (serverData.record.game.choices[partnerRole]) {
                 // Если да, значит, мы были вторыми. Мы отвечаем за переход на следующий узел.
                 await advanceGame(serverData.record);
            }
        }
    }
    
    async function advanceGame(data) {
        const choices = data.game.choices;
        const currentNode = gameData[data.game.node];
        
        // Формируем ключ для результата, например, 'a_b'
        const outcomeKey = `${choices.he}_${choices.she}`;
        const nextNodeId = currentNode.outcomes[outcomeKey];
        
        if (nextNodeId) {
            // Готовим новый стейт для следующего раунда
            const nextStateData = {
                ...data,
                game: {
                    node: nextNodeId,
                    choices: { he: null, she: null } // Сбрасываем выборы
                }
            };
             // Отправляем новый стейт на сервер. Все увидят его при следующем поллинге.
            await updateBin(state.binId, nextStateData);
        }
    }


    // Вспомогательные функции
    function switchTab(tabId) {
        tabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    function startComplimentCycle() {
        complimentText.textContent = compliments[Math.floor(Math.random() * compliments.length)];
        state.complimentTimer = setInterval(() => {
            complimentText.classList.add('fade-out');
            setTimeout(() => {
                let newCompliment = compliments[Math.floor(Math.random() * compliments.length)];
                while (newCompliment === complimentText.textContent) {
                     newCompliment = compliments[Math.floor(Math.random() * compliments.length)];
                }
                complimentText.textContent = newCompliment;
                complimentText.classList.remove('fade-out');
            }, 1000);
        }, COMPLIMENT_INTERVAL);
    }

    async function pollServer() {
        if (!state.binId) return;
        const data = await readBin(state.binId);
        if (data) {
            // Проверяем, нужно ли обновить UI (сравниваем с локальной копией)
            if (JSON.stringify(data) !== JSON.stringify(state.localData)) {
                updateUI(data);

                // Проверяем, не нужно ли нам, как первому игроку, инициировать переход
                const { he, she } = data.game.choices;
                if (he && she) {
                    await advanceGame(data);
                }
            }
        }
    }

    // --- ЗАПУСК ---
    init();
});
