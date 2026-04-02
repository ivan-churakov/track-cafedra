// Игровые переменные
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Игровые объекты
const player = {
    x: 10,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    speed: 0,
    score: 0
};

const player2 = {
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    speed: 0,
    score: 0
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speedX: 5,
    speedY: 5,
    baseSpeed: 5,
    maxSpeed: 20,
    speedIncreaseInterval: 5000, // 5 секунд
    lastSpeedIncrease: 0
};

// Состояние игры
let gameRunning = false;
let gamePaused = false;
let mouseY = canvas.height / 2;
let mouseY2 = canvas.height / 2;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    resetBall();
});

function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    
    // Управление мышью - разделение экрана пополам
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        // Учитываем масштабирование canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseYPos = (e.clientY - rect.top) * scaleY;
        
        // Левая половина - игрок 1
        if (mouseX < canvas.width / 2) {
            mouseY = mouseYPos;
        } else {
            // Правая половина - игрок 2
            mouseY2 = mouseYPos;
        }
    });
    
    // Управление сенсором
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        // Учитываем масштабирование canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const touchX = (touch.clientX - rect.left) * scaleX;
        const touchY = (touch.clientY - rect.top) * scaleY;
        
        // Левая половина - игрок 1
        if (touchX < canvas.width / 2) {
            mouseY = touchY;
        } else {
            // Правая половина - игрок 2
            mouseY2 = touchY;
        }
    });
    
    // Клик для паузы
    canvas.addEventListener('click', () => {
        if (gameRunning && !gamePaused) {
            togglePause();
        }
    });
}

function startGame() {
    document.getElementById('startScreen').classList.remove('active');
    gameRunning = true;
    gamePaused = false;
    gameLoop();
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        document.getElementById('pauseScreen').classList.add('active');
    } else {
        document.getElementById('pauseScreen').classList.remove('active');
        gameLoop();
    }
}

function restartGame() {
    player.score = 0;
    player2.score = 0;
    player.y = canvas.height / 2 - 50;
    player2.y = canvas.height / 2 - 50;
    resetBall();
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('pauseScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    gameRunning = true;
    gamePaused = false;
    ball.lastSpeedIncrease = Date.now();
    updateScore();
    gameLoop();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const baseSpeed = ball.baseSpeed;
    ball.speedX = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
    ball.speedY = (Math.random() * 2 - 1) * baseSpeed;
    ball.lastSpeedIncrease = Date.now();
}

function update() {
    if (gamePaused || !gameRunning) return;
    
    // Увеличение скорости мяча каждые 5 секунд
    const now = Date.now();
    if (now - ball.lastSpeedIncrease >= ball.speedIncreaseInterval) {
        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        if (currentSpeed < ball.maxSpeed) {
            const speedMultiplier = 1.1; // Увеличиваем на 10%
            const newSpeed = Math.min(currentSpeed * speedMultiplier, ball.maxSpeed);
            const angle = Math.atan2(ball.speedY, ball.speedX);
            ball.speedX = Math.cos(angle) * newSpeed;
            ball.speedY = Math.sin(angle) * newSpeed;
            ball.lastSpeedIncrease = now;
            playSound('speedup');
        }
    }
    
    // Управление игроком 1 (следует за мышью/сенсором в левой половине)
    const targetY = mouseY - player.height / 2;
    const diff = targetY - player.y;
    player.y += diff * 0.2; // Плавное движение
    
    // Границы для игрока 1
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Управление игроком 2 (следует за мышью/сенсором в правой половине)
    const targetY2 = mouseY2 - player2.height / 2;
    const diff2 = targetY2 - player2.y;
    player2.y += diff2 * 0.2; // Плавное движение
    
    // Границы для игрока 2
    player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
    
    // Движение мяча
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Отскок от верхней и нижней стенки
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
        ball.speedY = -ball.speedY;
        playSound('paddle');
    }
    
    // Столкновение с игроком
    if (ball.x - ball.radius <= player.x + player.width &&
        ball.x - ball.radius >= player.x &&
        ball.y >= player.y &&
        ball.y <= player.y + player.height) {
        
        const hitPos = (ball.y - player.y) / player.height;
        const angle = (hitPos - 0.5) * Math.PI / 3; // Угол от -60 до 60 градусов
        
        ball.speedX = Math.abs(ball.speedX);
        ball.speedX = Math.min(ball.speedX + 0.5, ball.maxSpeed);
        ball.speedY = Math.sin(angle) * ball.speedX;
        
        ball.x = player.x + player.width + ball.radius;
        playSound('paddle');
    }
    
    // Столкновение с игроком 2
    if (ball.x + ball.radius >= player2.x &&
        ball.x + ball.radius <= player2.x + player2.width &&
        ball.y >= player2.y &&
        ball.y <= player2.y + player2.height) {
        
        const hitPos = (ball.y - player2.y) / player2.height;
        const angle = (hitPos - 0.5) * Math.PI / 3;
        
        const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
        const newSpeed = Math.min(currentSpeed + 0.3, ball.maxSpeed);
        
        ball.speedX = -Math.abs(Math.cos(angle) * newSpeed);
        ball.speedY = Math.sin(angle) * newSpeed;
        
        ball.x = player2.x - ball.radius;
        playSound('paddle');
    }
    
    // Гол за игроком 1 (мяч ушел влево)
    if (ball.x < 0) {
        player2.score++;
        updateScore();
        resetBall();
        playSound('score');
        checkGameOver();
    }
    
    // Гол за игроком 2 (мяч ушел вправо)
    if (ball.x > canvas.width) {
        player.score++;
        updateScore();
        resetBall();
        playSound('score');
        checkGameOver();
    }
}

function checkGameOver() {
    if (player.score >= 11 || player2.score >= 11) {
        gameRunning = false;
        const winner = player.score >= 11 ? 'Игрок 1' : 'Игрок 2';
        document.getElementById('winnerText').textContent = 
            `🎉 ${winner} победил!`;
        document.getElementById('finalPlayerScore').textContent = player.score;
        document.getElementById('finalComputerScore').textContent = player2.score;
        document.getElementById('gameOverScreen').classList.add('active');
    }
}

function draw() {
    // Очистка
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Сетка по центру
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Индикация зон управления
    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height);
    ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    
    // Текст зон
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Игрок 1', canvas.width / 4, 30);
    ctx.fillText('Игрок 2', canvas.width * 3 / 4, 30);
    
    // Ракетка игрока
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#4CAF50';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
    
    // Ракетка игрока 2
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#2196F3';
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    ctx.shadowBlur = 0;
    
    // Мяч
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Траектория мяча (опционально)
    drawTrail();
}

function drawTrail() {
    // Эффект следа за мячом
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(ball.x - ball.speedX * i * 0.5, ball.y - ball.speedY * i * 0.5, ball.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateScore() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('player2Score').textContent = player2.score;
}

function playSound(type) {
    // Создаем звук через Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'paddle') {
        oscillator.frequency.value = 300;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'score') {
        oscillator.frequency.value = 200;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'speedup') {
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Адаптация размера canvas
function resizeCanvas() {
    // Вычисляем доступное пространство с учетом всех элементов
    const headerHeight = document.querySelector('.game-header').offsetHeight || 150;
    const controlsHeight = document.querySelector('.game-controls').offsetHeight || 80;
    const padding = 40; // Отступы сверху и снизу
    
    const maxWidth = Math.min(window.innerWidth - 40, 800);
    const maxHeight = window.innerHeight - headerHeight - controlsHeight - padding;
    const aspectRatio = 800 / 500;
    
    let canvasWidth, canvasHeight;
    
    if (maxWidth / aspectRatio <= maxHeight) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
    } else {
        canvasWidth = maxHeight * aspectRatio;
        canvasHeight = maxHeight;
    }
    
    // Ограничиваем максимальный размер
    canvasWidth = Math.min(canvasWidth, 800);
    canvasHeight = Math.min(canvasHeight, 500);
    
    // Устанавливаем размер через CSS для отображения
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    
    // Реальный размер canvas остается 800x500 для логики игры
    // Браузер автоматически масштабирует отображение
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

