const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gamePaused = false;
let gameOver = false;

// Фигуры тетриса
const PIECES = [
    [
        [1, 1, 1, 1]
    ],
    [
        [1, 1],
        [1, 1]
    ],
    [
        [0, 1, 0],
        [1, 1, 1]
    ],
    [
        [0, 1, 1],
        [1, 1, 0]
    ],
    [
        [1, 1, 0],
        [0, 1, 1]
    ],
    [
        [1, 0, 0],
        [1, 1, 1]
    ],
    [
        [0, 0, 1],
        [1, 1, 1]
    ]
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

function initBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

function createPiece() {
    const type = Math.floor(Math.random() * PIECES.length);
    const piece = PIECES[type].map(row => [...row]);
    return {
        matrix: piece,
        x: Math.floor(COLS / 2) - Math.floor(piece[0].length / 2),
        y: 0,
        color: COLORS[type]
    };
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем доску
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x]);
            }
        }
    }
    
    // Рисуем текущую фигуру
    if (currentPiece) {
        currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            });
        });
    }
    
    // Рисуем следующую фигуру
    if (nextPiece) {
        nextCtx.fillStyle = '#000';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        const scale = 20;
        const offsetX = (nextCanvas.width - nextPiece.matrix[0].length * scale) / 2;
        const offsetY = (nextCanvas.height - nextPiece.matrix.length * scale) / 2;
        nextPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
                }
            });
        });
    }
}

function collide(piece, dx, dy) {
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                if (newX < 0 || newX >= COLS || newY >= ROWS || 
                    (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    currentPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        });
    });
}

function rotatePiece() {
    const rotated = currentPiece.matrix[0].map((_, i) =>
        currentPiece.matrix.map(row => row[i]).reverse()
    );
    const original = currentPiece.matrix;
    currentPiece.matrix = rotated;
    if (collide(currentPiece, 0, 0)) {
        currentPiece.matrix = original;
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        updateUI();
    }
}

function update(time = 0) {
    if (gamePaused || gameOver) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        if (!collide(currentPiece, 0, 1)) {
            currentPiece.y++;
        } else {
            mergePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            if (collide(currentPiece, 0, 0)) {
                gameOver = true;
                alert('Игра окончена! Очки: ' + score);
            }
        }
        dropCounter = 0;
    }
    
    draw();
    requestAnimationFrame(update);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
}

document.addEventListener('keydown', (e) => {
    if (gamePaused || gameOver || !currentPiece) return;
    
    if (e.key === 'ArrowLeft' && !collide(currentPiece, -1, 0)) {
        currentPiece.x--;
    } else if (e.key === 'ArrowRight' && !collide(currentPiece, 1, 0)) {
        currentPiece.x++;
    } else if (e.key === 'ArrowDown' && !collide(currentPiece, 0, 1)) {
        currentPiece.y++;
        score += 1;
        updateUI();
    } else if (e.key === 'ArrowUp') {
        rotatePiece();
    }
    draw();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    gamePaused = !gamePaused;
    document.getElementById('pauseBtn').textContent = gamePaused ? 'Продолжить' : 'Пауза';
    if (!gamePaused) {
        lastTime = performance.now();
        update();
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    initBoard();
    currentPiece = createPiece();
    nextPiece = createPiece();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    gamePaused = false;
    gameOver = false;
    updateUI();
    lastTime = performance.now();
    update();
});

// Инициализация
initBoard();
currentPiece = createPiece();
nextPiece = createPiece();
updateUI();
lastTime = performance.now();
update();


