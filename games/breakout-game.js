const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 10,
    speed: 5
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speedX: 4,
    speedY: -4
};

const blocks = [];
const BLOCK_ROWS = 5;
const BLOCK_COLS = 8;
const BLOCK_WIDTH = 70;
const BLOCK_HEIGHT = 20;
const BLOCK_PADDING = 5;

let score = 0;
let lives = 3;
let gameRunning = false;
let mouseX = canvas.width / 2;

function initBlocks() {
    blocks.length = 0;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    for (let row = 0; row < BLOCK_ROWS; row++) {
        for (let col = 0; col < BLOCK_COLS; col++) {
            blocks.push({
                x: col * (BLOCK_WIDTH + BLOCK_PADDING) + BLOCK_PADDING,
                y: row * (BLOCK_HEIGHT + BLOCK_PADDING) + BLOCK_PADDING + 50,
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                color: colors[row],
                visible: true
            });
        }
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Блоки
    blocks.forEach(block => {
        if (block.visible) {
            ctx.fillStyle = block.color;
            ctx.fillRect(block.x, block.y, block.width, block.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(block.x, block.y, block.width, block.height);
        }
    });
    
    // Платформа
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Мяч
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function update() {
    if (!gameRunning) return;
    
    // Движение платформы
    paddle.x = mouseX - paddle.width / 2;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
    
    // Движение мяча
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Отскок от стен
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
        ball.speedX = -ball.speedX;
    }
    if (ball.y - ball.radius <= 0) {
        ball.speedY = -ball.speedY;
    }
    
    // Столкновение с платформой
    if (ball.y + ball.radius >= paddle.y &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.speedX = (hitPos - 0.5) * 8;
        ball.speedY = -Math.abs(ball.speedY);
    }
    
    // Столкновение с блоками
    blocks.forEach(block => {
        if (block.visible &&
            ball.x + ball.radius >= block.x &&
            ball.x - ball.radius <= block.x + block.width &&
            ball.y + ball.radius >= block.y &&
            ball.y - ball.radius <= block.y + block.height) {
            block.visible = false;
            score += 10;
            document.getElementById('score').textContent = score;
            ball.speedY = -ball.speedY;
        }
    });
    
    // Потеря жизни
    if (ball.y > canvas.height) {
        lives--;
        document.getElementById('lives').textContent = lives;
        if (lives <= 0) {
            alert('Игра окончена! Очки: ' + score);
            reset();
        } else {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.speedX = 4;
            ball.speedY = -4;
        }
    }
    
    // Победа
    if (blocks.every(block => !block.visible)) {
        alert('Победа! Очки: ' + score);
        reset();
    }
    
    draw();
    requestAnimationFrame(update);
}

function reset() {
    score = 0;
    lives = 3;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = 4;
    ball.speedY = -4;
    paddle.x = canvas.width / 2 - 50;
    initBlocks();
    draw();
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        mouseX = Math.max(paddle.width / 2, mouseX - 20);
    } else if (e.key === 'ArrowRight') {
        mouseX = Math.min(canvas.width - paddle.width / 2, mouseX + 20);
    }
});

document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        update();
    }
});

initBlocks();
draw();


