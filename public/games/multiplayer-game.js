// Игровые переменные
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameRunning = false;
let gameTime = 0;
let gameTimer;

// Игроки
const players = [
    {
        id: 1,
        name: 'Игрок 1',
        x: 100,
        y: 300,
        width: 40,
        height: 40,
        color: '#4CAF50',
        speed: 5,
        score: 0,
        keys: { up: 'w', down: 's', left: 'a', right: 'd' }
    },
    {
        id: 2,
        name: 'Игрок 2',
        x: 900,
        y: 300,
        width: 40,
        height: 40,
        color: '#2196F3',
        speed: 5,
        score: 0,
        keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
    }
];

// Предметы для сбора
const collectibles = [];
const obstacles = [];

// Клавиши
const keys = {};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    generateObstacles();
});

function setupEventListeners() {
    document.getElementById('connectBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    // Обработка клавиатуры
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
}

function startGame() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        showStatus('Введите ваше имя!', 'error');
        return;
    }
    
    players[0].name = name;
    showStatus('Игра начинается...', 'success');
    
    setTimeout(() => {
        showScreen('gameScreen');
        gameRunning = true;
        gameTime = 0;
        players[0].score = 0;
        players[1].score = 0;
        collectibles.length = 0;
        generateCollectibles();
        updateUI();
        gameLoop();
        startTimer();
    }, 1000);
}

function restartGame() {
    players[0].x = 100;
    players[0].y = 300;
    players[1].x = 900;
    players[1].y = 300;
    players[0].score = 0;
    players[1].score = 0;
    collectibles.length = 0;
    gameTime = 0;
    generateCollectibles();
    showScreen('gameScreen');
    gameRunning = true;
    updateUI();
    gameLoop();
    startTimer();
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        gameTime++;
        document.getElementById('gameTime').textContent = gameTime;
        
        // Каждые 5 секунд добавляем новые предметы
        if (gameTime % 5 === 0) {
            generateCollectibles();
        }
        
        // Каждые 10 секунд добавляем препятствия
        if (gameTime % 10 === 0 && obstacles.length < 10) {
            generateObstacles();
        }
    }, 1000);
}

function generateCollectibles() {
    // Генерируем 3-5 новых предметов
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        collectibles.push({
            x: Math.random() * (canvas.width - 30),
            y: Math.random() * (canvas.height - 30),
            width: 20,
            height: 20,
            type: Math.random() > 0.8 ? 'gold' : 'normal' // 20% шанс на золотую звезду
        });
    }
}

function generateObstacles() {
    obstacles.push({
        x: Math.random() * (canvas.width - 50),
        y: Math.random() * (canvas.height - 50),
        width: 50,
        height: 50
    });
}

function updatePlayer(player) {
    const prevX = player.x;
    const prevY = player.y;
    
    // Движение
    if (keys[player.keys.up]) {
        player.y -= player.speed;
    }
    if (keys[player.keys.down]) {
        player.y += player.speed;
    }
    if (keys[player.keys.left]) {
        player.x -= player.speed;
    }
    if (keys[player.keys.right]) {
        player.x += player.speed;
    }
    
    // Границы
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Проверка столкновений с препятствиями
    for (const obstacle of obstacles) {
        if (isColliding(player, obstacle)) {
            player.x = prevX;
            player.y = prevY;
            break;
        }
    }
    
    // Сбор предметов
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        if (isColliding(player, item)) {
            collectibles.splice(i, 1);
            if (item.type === 'gold') {
                player.score += 10;
            } else {
                player.score += 1;
            }
            updateUI();
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Очистка
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем сетку
    drawGrid();
    
    // Обновляем и рисуем игроков
    for (const player of players) {
        updatePlayer(player);
        drawPlayer(player);
    }
    
    // Рисуем препятствия
    for (const obstacle of obstacles) {
        drawObstacle(obstacle);
    }
    
    // Рисуем предметы
    for (const item of collectibles) {
        drawCollectible(item);
    }
    
    requestAnimationFrame(gameLoop);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPlayer(player) {
    // Тело игрока
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Обводка
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Глаза
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 8, player.y + 10, 8, 8);
    ctx.fillRect(player.x + 24, player.y + 10, 8, 8);
    
    // Имя над игроком
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x + player.width / 2, player.y - 5);
}

function drawObstacle(obstacle) {
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    // Крест на препятствии
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(obstacle.x + 10, obstacle.y + 10);
    ctx.lineTo(obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height - 10);
    ctx.moveTo(obstacle.x + obstacle.width - 10, obstacle.y + 10);
    ctx.lineTo(obstacle.x + 10, obstacle.y + obstacle.height - 10);
    ctx.stroke();
}

function drawCollectible(item) {
    const centerX = item.x + item.width / 2;
    const centerY = item.y + item.height / 2;
    
    if (item.type === 'gold') {
        // Золотая звезда
        ctx.fillStyle = '#FFD700';
        drawStar(centerX, centerY, 5, 10, 5);
    } else {
        // Обычная звезда
        ctx.fillStyle = '#FFA500';
        drawStar(centerX, centerY, 5, 8, 5);
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function updateUI() {
    document.getElementById('player1Score').textContent = players[0].score;
    document.getElementById('player2Score').textContent = players[1].score;
    document.getElementById('player1Info').querySelector('.player-name').textContent = players[0].name;
    
    // Показываем второго игрока если играет
    const player2Info = document.getElementById('player2Info');
    if (players[1].name !== 'Игрок 2') {
        player2Info.style.display = 'block';
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showStatus(text, type) {
    const statusDiv = document.getElementById('connectStatus');
    statusDiv.textContent = text;
    statusDiv.className = `status ${type}`;
}

// Автоматически добавляем второго игрока через 3 секунды (для демо)
setTimeout(() => {
    if (gameRunning && players[1].name === 'Игрок 2') {
        players[1].name = 'Игрок 2 (Бот)';
        updateUI();
    }
}, 3000);


