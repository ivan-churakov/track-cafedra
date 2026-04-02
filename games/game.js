// Игровые слова
const WORDS = [
    'кот', 'собака', 'дом', 'машина', 'солнце', 'дерево', 'цветок', 'книга',
    'компьютер', 'телефон', 'самолет', 'корабль', 'велосипед', 'мяч', 'торт',
    'яблоко', 'банан', 'слон', 'лев', 'тигр', 'медведь', 'заяц', 'птица',
    'рыба', 'звезда', 'луна', 'облако', 'дождь', 'снег', 'море', 'гора',
    'река', 'лес', 'цветок', 'бабочка', 'пчела', 'муравей', 'змея', 'лягушка'
];

let socket;
let playerName = '';
let isDrawing = false;
let currentWord = '';
let canvas, ctx;
let otherCanvas, otherCtx;
let isConnected = false;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    setupEventListeners();
});

function initializeCanvas() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    otherCanvas = document.getElementById('otherPlayerCanvas');
    otherCtx = otherCanvas.getContext('2d');
    
    // Настройка рисования
    setupDrawing();
}

function setupDrawing() {
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        drawLine(lastX, lastY, x, y);
        
        // Отправляем данные на сервер
        if (socket && socket.connected) {
            socket.emit('draw', {
                x0: lastX / canvas.width,
                y0: lastY / canvas.height,
                x1: x / canvas.width,
                y1: y / canvas.height,
                color: document.getElementById('colorPicker').value,
                size: document.getElementById('brushSize').value
            });
        }
        
        lastX = x;
        lastY = y;
    });
    
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
}

function drawLine(x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = document.getElementById('colorPicker').value;
    ctx.lineWidth = document.getElementById('brushSize').value;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function setupEventListeners() {
    document.getElementById('connectBtn').addEventListener('click', connectToGame);
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('submitGuess').addEventListener('click', submitGuess);
    document.getElementById('nextRoundBtn').addEventListener('click', nextRound);
    
    document.getElementById('brushSize').addEventListener('input', (e) => {
        document.getElementById('brushSizeValue').textContent = e.target.value;
    });
    
    document.getElementById('guessInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });
    
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connectToGame();
        }
    });
}

function connectToGame() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        showMessage('Введите ваше имя!', 'error');
        return;
    }
    
    playerName = name;
    
    // Подключаемся к серверу (используем простой polling, так как WebSocket может быть недоступен)
    // Для демонстрации создадим локальную версию игры
    showMessage('Подключение...', 'success');
    
    // Симулируем подключение
    setTimeout(() => {
        isConnected = true;
        showScreen('waitingScreen');
        showMessage('Подключено! Ожидание других игроков...', 'success');
        
        // Для демонстрации сразу начинаем игру
        setTimeout(() => {
            startLocalGame();
        }, 2000);
    }, 1000);
}

function startLocalGame() {
    // Локальная версия игры (без сервера)
    showMessage('Игра началась!', 'success');
    startRound();
}

let roundTime = 60; // 60 секунд на раунд
let timeLeft = roundTime;
let timerInterval;

function startRound() {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    currentWord = randomWord;
    
    // Определяем, кто рисует (для демо - всегда текущий игрок)
    isDrawing = true;
    showScreen('drawingScreen');
    document.getElementById('wordToDraw').textContent = currentWord;
    
    // Запускаем таймер
    timeLeft = roundTime;
    startTimer();
    
    // Через roundTime секунд переключаемся на угадывание
    setTimeout(() => {
        if (isDrawing) {
            switchToGuessing();
        }
    }, roundTime * 1000);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    const timerDisplay = document.getElementById('wordToDraw');
    const originalWord = currentWord;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerDisplay.textContent = `${originalWord} (${timeLeft}с)`;
        } else {
            clearInterval(timerInterval);
            timerDisplay.textContent = originalWord;
        }
    }, 1000);
}

function switchToGuessing() {
    if (timerInterval) clearInterval(timerInterval);
    
    isDrawing = false;
    showScreen('guessingScreen');
    document.getElementById('drawerName').textContent = playerName;
    
    // Копируем рисунок на другой canvas
    otherCtx.drawImage(canvas, 0, 0);
    
    // Очищаем список догадок
    document.getElementById('guessesList').innerHTML = '';
    
    // Очищаем canvas для следующего раунда
    setTimeout(() => {
        clearCanvas();
    }, 100);
    
    // Автоматически показываем результаты через 30 секунд угадывания
    setTimeout(() => {
        if (!isDrawing) {
            showResults();
        }
    }, 30000);
}

function submitGuess() {
    const guess = document.getElementById('guessInput').value.trim().toLowerCase();
    if (!guess) return;
    
    const guessItem = document.createElement('div');
    guessItem.className = 'guess-item';
    guessItem.textContent = `${playerName}: ${guess}`;
    
    // Проверяем частичное совпадение
    const wordLower = currentWord.toLowerCase();
    if (guess === wordLower) {
        guessItem.classList.add('correct');
        guessItem.textContent += ' ✅ Правильно!';
        updateScore(100);
        showMessage('Поздравляем! Вы угадали! +100 очков', 'success');
        
        setTimeout(() => {
            showResults();
        }, 2000);
    } else if (wordLower.includes(guess) || guess.includes(wordLower)) {
        guessItem.textContent += ' (близко!)';
        showMessage('Близко, но не совсем!', 'error');
    } else {
        showMessage('Не угадали, попробуйте еще раз!', 'error');
    }
    
    document.getElementById('guessesList').appendChild(guessItem);
    document.getElementById('guessInput').value = '';
}

function showResults() {
    showScreen('resultsScreen');
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = `
        <div class="result-item">
            <strong>Слово было:</strong> "${currentWord}"
        </div>
        <div class="result-item">
            <strong>${playerName}</strong> заработал очков в этом раунде!
        </div>
    `;
    
    // Обновляем таблицу лидеров
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = `
        <div class="leaderboard-item top">
            <span>${playerName}</span>
            <span>${playerScore} очков</span>
        </div>
    `;
}

let roundNumber = 1;
let playerScore = 0;

function nextRound() {
    roundNumber++;
    document.getElementById('roundNumber').textContent = roundNumber;
    startRound();
    showScreen('drawingScreen');
}

function updateScore(points) {
    playerScore += points;
    document.getElementById('playerScore').textContent = playerScore;
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showMessage(text, type = 'success') {
    const messagesDiv = document.getElementById('gameMessages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    messagesDiv.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Добавляем ссылку на игру в главное меню
if (typeof window.addGameLink === 'undefined') {
    window.addGameLink = function() {
        const link = document.createElement('a');
        link.href = 'game.html';
        link.textContent = '🎮 Играть в "Рисуй и Угадывай"';
        link.style.cssText = 'display: block; text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 1.2em;';
        return link;
    };
}

