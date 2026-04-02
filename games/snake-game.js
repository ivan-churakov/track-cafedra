const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;

let snake = [{x: 10, y: 10}];
let direction = {x: 0, y: 0};
let food = {x: 15, y: 15};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;

document.getElementById('highScore').textContent = highScore;

function randomFood() {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        randomFood();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Еда
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    
    // Змейка
    ctx.fillStyle = '#4ecdc4';
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#45b7d1';
        } else {
            ctx.fillStyle = '#4ecdc4';
        }
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });
}

function update() {
    if (!gameRunning || gamePaused) return;
    
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    
    // Проверка столкновений
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').textContent = score;
        randomFood();
    } else {
        snake.pop();
    }
    
    draw();
}

function gameOver() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    alert('Игра окончена! Очки: ' + score);
    reset();
}

function reset() {
    snake = [{x: 10, y: 10}];
    direction = {x: 0, y: 0};
    score = 0;
    document.getElementById('score').textContent = score;
    randomFood();
    draw();
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    const key = e.key.toLowerCase();
    if ((key === 'arrowup' || key === 'w') && direction.y === 0) {
        direction = {x: 0, y: -1};
    } else if ((key === 'arrowdown' || key === 's') && direction.y === 0) {
        direction = {x: 0, y: 1};
    } else if ((key === 'arrowleft' || key === 'a') && direction.x === 0) {
        direction = {x: -1, y: 0};
    } else if ((key === 'arrowright' || key === 'd') && direction.x === 0) {
        direction = {x: 1, y: 0};
    }
});

document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        direction = {x: 1, y: 0};
        gameLoop = setInterval(update, 150);
    }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? 'Продолжить' : 'Пауза';
    }
});

reset();
draw();


