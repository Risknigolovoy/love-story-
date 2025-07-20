document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальные переменные и конфигурация ---
    const {
        initializeApp, getAuth, signInAnonymously, onAuthStateChanged,
        getFirestore, doc, setDoc, onSnapshot, updateDoc, arrayUnion, getDoc, serverTimestamp
    } = window.firebase;

    // ВАЖНО: Вставьте свою конфигурацию Firebase сюда, если она у вас есть.
    // Если вы используете среду, которая предоставляет __firebase_config, оставьте как есть.
    const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) ? JSON.parse(__firebase_config) : {};
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-love-game-app';

    let db, auth, userId;

    // --- Элементы DOM ---
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-button');
    
    // Вкладка "Сердце"
    const heartSvg = document.getElementById('heart-svg');
    const loveMessageEl = document.getElementById('love-message');
    const messageButton = document.getElementById('message-button');
    const colorPalette = document.getElementById('color-palette');

    // Вкладка "Игра"
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
        if (Object.keys(firebaseConfig).length === 0) {
            document.body.innerHTML = `<div style="color: red; padding: 20px; text-align: center; font-family: monospace;">Ошибка: Конфигурация Firebase не найдена. Приложение не может подключиться к игре.</div>`;
            // Продолжаем работу для вкладки "Сердце"
            setupEventListeners();
            return;
        }
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        handleAuthentication();
        setupEventListeners();
    }

    function handleAuthentication() {
        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
            } else {
                signInAnonymously(auth).catch(err => console.error("Auth Error", err));
            }
        });
    }

    // --- Настройка обработчиков событий ---
    function setupEventListeners() {
        // Навигация
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetViewId = button.dataset.view;
                
                views.forEach(view => view.classList.remove('active-view'));
                document.getElementById(targetViewId).classList.add('active-view');

                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        // Вкладка "Сердце"
        messageButton.addEventListener('click', showNewLoveMessage);
        colorPalette.addEventListener('click', e => {
            if (e.target.classList.contains('color-dot')) {
                const color = e.target.dataset.color;
                heartSvg.style.fill = color;
                heartSvg.style.filter = `drop-shadow(0 0 15px ${color})`;
            }
        });

        // Вкладка "Игра"
        if (createGameBtn) { // Проверяем, существует ли элемент (на случай ошибки Firebase)
            createGameBtn.addEventListener('click', createGame);
            joinGameForm.addEventListener('submit', joinGame);
            chatForm.addEventListener('submit', sendMessage);
            gameIdDisplay.addEventListener('click', copyGameId);
        }
    }

    // --- Логика вкладки "Сердце" ---
    const lovePhrases = [
        "Я люблю тебя больше, чем слова могут выразить.", "Каждый день я скучаю по тебе всё сильнее.", "Я боюсь потерять тебя, ты – мой мир.", "Прости, если моя любовь неидеальна. Я стараюсь.", "Даже на расстоянии, моё сердце всегда с тобой.",
        "Ты – первая мысль утром и последняя перед сном. Люблю.", "Скучаю по твоему смеху, он как музыка для меня.", "Мой самый большой страх – это мир, в котором нет тебя.", "Я люблю тебя не так, как ты заслуживаешь, а так, как умею – всем сердцем.", "Километры между нами ничего не значат. Я скучаю.",
        "Моя любовь к тебе – это единственное, в чём я уверен на 100%.", "Без тебя дни такие пустые. Скучаю ужасно.", "Пожалуйста, никогда не уходи. Я боюсь этой тишины.", "Прости за все моменты, когда я был неправ. Я люблю тебя.", "Расстояние учит меня ценить каждую секунду с тобой.",
        "Ты делаешь меня лучше. Я люблю тебя за это.", "Скучаю по твоим объятиям, в них я чувствовал себя дома.", "Я боюсь представить свою жизнь без твоей улыбки.", "Моя любовь к тебе растёт с каждым днём, даже если я этого не показываю.", "Мы далеко, но наши сердца бьются в унисон. Скучаю.",
        "Люблю тебя до луны и обратно.", "Каждая песня о любви теперь напоминает о тебе. Скучаю.", "Ты мой якорь в этом мире. Боюсь остаться без тебя.", "Прости, что иногда причиняю боль. Мои намерения всегда чисты.", "Я считаю дни до нашей встречи. Очень скучаю.",
        "В моих мыслях мы всегда вместе. Люблю тебя.", "Этот город кажется чужим без тебя. Скучаю.", "Я боюсь, что однажды ты устанешь от меня.", "Я люблю тебя со всеми твоими недостатками, потому что они делают тебя тобой.", "Расстояние – это просто тест, который мы пройдём. Скучаю.",
        "Ты – моё всё. Люблю бесконечно.", "Мне не хватает твоего тепла рядом. Скучаю.", "Потерять тебя – значит потерять себя.", "Прости, если я не всегда нахожу правильные слова. Просто знай, что я люблю тебя.", "Каждый закат я думаю о том, как мы посмотрим на него вместе. Скучаю.",
        "Любовь к тебе – это лучшее, что со мной случалось.", "Скучаю по нашим разговорам ни о чём и обо всём.", "Я так боюсь, что это расстояние нас сломает.", "Я люблю тебя больше, чем вчера, но меньше, чем завтра.", "Я отправляю тебе тысячу поцелуев с ветром. Скучаю.",
        "Ты – причина моей улыбки. Люблю тебя.", "Мир теряет краски, когда тебя нет рядом. Скучаю.", "Обещай, что мы всегда будем вместе. Я боюсь одиночества.", "Прости, что я не идеален. Но моя любовь к тебе – идеальна.", "Я чувствую твою любовь даже через тысячи километров. Скучаю.",
        "С тобой я готов на всё. Люблю тебя.", "Скучаю до боли в груди.", "Я боюсь не оправдать твоих надежд.", "Ты заслуживаешь всего самого лучшего, и я постараюсь тебе это дать. Люблю.", "Скоро мы будем рядом. Я верю в это и очень скучаю.",
        "Каждая клеточка моего тела любит тебя.", "Скучаю по запаху твоих волос.", "Боюсь, что ты найдешь кого-то лучше.", "Прости за мою ревность, это от страха тебя потерять. Люблю.", "Давай просто будем вместе, несмотря ни на что. Скучаю.",
        "Ты – моя вселенная. Люблю.", "Скучаю по тому, как ты смотришь на меня.", "Я боюсь, что ты разлюбишь меня.", "Моя любовь к тебе – это константа. Она не меняется.", "Расстояние закаляет настоящие чувства. Скучаю по тебе.",
        "Любить тебя – это как дышать. Я не могу остановиться.", "Скучаю по твоей руке в моей.", "Я боюсь своих же мыслей, когда тебя нет рядом.", "Прости, если я бываю сложным. Я просто очень тебя люблю.", "Я готов ждать тебя вечность. Скучаю.",
        "Ты – моё вдохновение. Люблю тебя.", "Скучаю по нашим совместным мечтам.", "Я боюсь будущего без тебя.", "Я люблю в тебе абсолютно всё.", "Каждая звезда на небе напоминает мне о твоих глазах. Скучаю.",
        "Моё сердце принадлежит только тебе. Люблю.", "Скучаю по твоему голосу. Хочу его услышать.", "Боюсь, что однажды ты поймешь, что я не тот, кто тебе нужен.", "Прости за моё молчание. Иногда мне просто не хватает слов, чтобы описать мою любовь.", "Мы справимся. Я знаю это. Скучаю.",
        "Ты – моя судьба. Я люблю тебя.", "Скучаю по нашим глупостям и смеху до слёз.", "Я боюсь показаться слабым, но без тебя я слаб.", "Моя любовь к тебе – это самое настоящее, что у меня есть.", "Я обнимаю тебя мысленно каждую секунду. Скучаю.",
        "Я люблю тебя так сильно, что иногда это пугает.", "Скучаю по ощущению твоего присутствия.", "Я боюсь, что ты забудешь меня.", "Прости, что не могу быть рядом прямо сейчас. Я мысленно с тобой. Люблю.", "Расстояние не сможет нас разлучить. Я скучаю.",
        "Ты – мой ангел-хранитель. Люблю тебя.", "Скучаю по нашим вечерам.", "Я боюсь, что не смогу сделать тебя счастливой.", "Любовь к тебе делает меня сильнее.", "Я перематываю наши моменты в голове снова и снова. Скучаю.",
        "Ты – лучшее, что есть в моей жизни. Люблю.", "Скучаю по тебе, моя родная.", "Я боюсь своих ошибок, которые могут тебя ранить.", "Прости, если я не всегда понимаю тебя. Я учусь. Люблю.", "Я верю в нас и в наше будущее. Скучаю.",
        "Моя любовь к тебе безгранична. Просто знай это.", "Скучаю по тебе до дрожи.", "Я боюсь этого чувства беспомощности, когда мы далеко.", "Ты заслуживаешь мира, и я хочу его тебе подарить. Люблю.", "Скоро это расстояние останется лишь воспоминанием. Скучаю."
    ];

    function showNewLoveMessage() {
        const randomIndex = Math.floor(Math.random() * lovePhrases.length);
        loveMessageEl.textContent = lovePhrases[randomIndex];
    }

    // --- Логика вкладки "Игра" ---
    let unsubscribeFromGame;

    async function createGame() {
        const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const gameRef = doc(db, `artifacts/${appId}/public/data/games`, newGameId);
        const initialMessage = {
            text: "Темная пещера окутывает вас... Вдалеке мерцает одинокий кристалл. Что вы будете делать?",
            sender: 'Game',
            timestamp: serverTimestamp()
        };
        await setDoc(gameRef, {
            players: [userId],
            messages: [initialMessage],
            createdAt: serverTimestamp()
        });
        switchToChatView(newGameId);
    }

    async function joinGame(e) {
        e.preventDefault();
        const idToJoin = joinGameInput.value.toUpperCase();
        if (!idToJoin) {
            gameErrorEl.textContent = 'Введите код игры.';
            return;
        }
        const gameRef = doc(db, `artifacts/${appId}/public/data/games`, idToJoin);
        const gameSnap = await getDoc(gameRef);

        if (gameSnap.exists()) {
            await updateDoc(gameRef, { players: arrayUnion(userId) });
            switchToChatView(idToJoin);
        } else {
            gameErrorEl.textContent = 'Игра с таким кодом не найдена.';
        }
    }

    function switchToChatView(gameId) {
        gameConnectScreen.classList.add('hidden');
        gameChatScreen.style.display = 'flex';
        gameChatScreen.classList.remove('hidden');
        gameIdDisplay.textContent = gameId;

        if (unsubscribeFromGame) unsubscribeFromGame();
        
        const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
        unsubscribeFromGame = onSnapshot(gameRef, (docSnap) => {
            if (docSnap.exists()) {
                renderMessages(docSnap.data().messages || []);
            }
        });
    }
    
    function renderMessages(messages) {
        chatWindow.innerHTML = '';
        messages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
        
        messages.forEach(msg => {
            const wrapper = document.createElement('div');
            wrapper.className = 'message-wrapper';

            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.textContent = msg.text;

            if (msg.sender === 'Game') {
                wrapper.classList.add('game');
                messageEl.classList.add('game');
            } else if (msg.sender === userId) {
                wrapper.classList.add('user');
                messageEl.classList.add('user');
            } else {
                wrapper.classList.add('partner');
                messageEl.classList.add('partner');
            }
            
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
        const tempMessage = text;
        chatInput.value = '';
        
        const gameId = gameIdDisplay.textContent;
        const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
        
        const messageData = { text: tempMessage, sender: userId, timestamp: serverTimestamp() };
        await updateDoc(gameRef, { messages: arrayUnion(messageData) });
        
        // Логика Мастера Игры (пока отключена, чтобы не вызывать ошибку Gemini API, если она не настроена)
        // Если вам нужна логика ИИ, её нужно будет добавить сюда.
        // await triggerGameMaster(gameId); 
        
        sendBtn.disabled = false;
    }

    function copyGameId() {
        if (!navigator.clipboard) return; // Защита для старых браузеров
        navigator.clipboard.writeText(gameIdDisplay.textContent).then(() => {
            copySuccessEl.textContent = 'Скопировано!';
            setTimeout(() => copySuccessEl.textContent = '', 2000);
        });
    }

    // --- Запуск приложения ---
    initialize();
});
