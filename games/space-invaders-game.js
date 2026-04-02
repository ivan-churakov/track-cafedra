const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 40,
    width: 50,
    height: 30,
    speed: 5
};

const invaders = [];
const bullets = [];
const invaderBullets = [];

let score = 0;
let lives = 3;
let gameRunning = false;
let direction = 1;
let keys = {};

const INVADER_ROWS = 5;
const INVADER_COLS = 10;
const INVADER_WIDTH = 40;
const INVADER_HEIGHT = 30;
const INVADER_PADDING = 10;

function initInvaders() {
    invaders.length = 0;
    for (let row = 0; row < INVADER_ROWS; row++) {
        for (let col = 0; col < INVADER_COLS; col++) {
            invaders.push({
                x: col * (INVADER_WIDTH + INVADER_PADDING) + 50,
                y: row * (INVADER_HEIGHT + INVADER_PADDING) + 50,
                width: INVADER_WIDTH,
                height: INVADER_HEIGHT,
                alive: true
            });
        }
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 53) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }
    
    // Игрок
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Инопланетяне
    invaders.forEach(invader => {
        if (invader.alive) {
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
        }
    });
    
    // Пули игрока
    ctx.fillStyle = '#FFD700';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
    });
    
    // Пули инопланетян
    ctx.fillStyle = '#FF6B6B';
    invaderBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
    });
}

function update() {
    if (!gameRunning) return;
    
    // Движение игрока
    if (keys['ArrowLeft'] || keys['a']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
    
    // Движение инопланетян
    let moveDown = false;
    invaders.forEach(invader => {
        if (invader.alive) {
            invader.x += direction * 0.5;
            if (invader.x <= 0 || invader.x + invader.width >= canvas.width) {
                moveDown = true;
            }
        }
    });
    
    if (moveDown) {
        direction = -direction;
        invaders.forEach(invader => {
            if (invader.alive) {
                invader.y += 20;
            }
        });
    }
    
    // Движение пуль
    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });
    
    invaderBullets.forEach((bullet, index) => {
        bullet.y += 3;
        if (bullet.y > canvas.height) {
            invaderBullets.splice(index, 1);
        }
    });
    
    // Столкновения пуль с инопланетянами
    bullets.forEach((bullet, bIndex) => {
        invaders.forEach((invader, iIndex) => {
            if (invader.alive &&
                bullet.x >= invader.x &&
                bullet.x <= invader.x + invader.width &&
                bullet.y >= invader.y &&
                bullet.y <= invader.y + invader.height) {
                invader.alive = false;
                bullets.splice(bIndex, 1);
                score += 10;
                document.getElementById('score').textContent = score;
            }
        });
    });
    
    // Столкновения пуль инопланетян с игроком
    invaderBullets.forEach((bullet, index) => {
        if (bullet.x >= player.x &&
            bullet.x <= player.x + player.width &&
            bullet.y >= player.y &&
            bullet.y <= player.y + player.height) {
            invaderBullets.splice(index, 1);
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) {
                alert('Игра окончена! Очки: ' + score);
                reset();
            }
        }
    });
    
    // Инопланетяне стреляют
    if (Math.random() < 0.01) {
        const aliveInvaders = invaders.filter(inv => inv.alive);
        if (aliveInvaders.length > 0) {
            const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            invaderBullets.push({x: shooter.x + shooter.width / 2, y: shooter.y + shooter.height});
        }
    }
    
    // Проверка победы
    if (invaders.every(inv => !inv.alive)) {
        alert('Победа! Очки: ' + score);
        reset();
    }
    
    // Проверка проигрыша (инопланетяне достигли низа)
    if (invaders.some(inv => inv.alive && inv.y + inv.height >= player.y)) {
        alert('Игра окончена! Очки: ' + score);
        reset();
    }
    
    draw();
    requestAnimationFrame(update);
}

function shoot() {
    bullets.push({
        x: player.x + player.width / 2,
        y: player.y
    });
}

function reset() {
    score = 0;
    lives = 3;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    player.x = canvas.width / 2 - 25;
    bullets.length = 0;
    invaderBullets.length = 0;
    initInvaders();
    draw();
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (gameRunning) {
            shoot();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        update();
    }
});

initInvaders();
draw();


