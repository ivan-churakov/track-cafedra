const video = document.getElementById('video');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const target = document.getElementById('target');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');

let detector = null;
let gameRunning = false;
let score = 0;
let timeLeft = 60;
let cursorX = 320;
let cursorY = 240;
let fallingObjects = [];
let gameTimer = null;
let timeTimer = null;
let videoCanvas = null;
let videoCtx = null;
let lastFrame = null;
let motionX = 320;
let motionY = 240;

// Упрощенная версия без TensorFlow (используем движение мыши/пальца на видео)
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        video.srcObject = stream;
        statusEl.textContent = 'Камера активирована! Нажмите "Начать игру"';
        statusEl.style.color = '#4ECDC4';
    } catch (error) {
        statusEl.textContent = 'Ошибка доступа к камере. Используйте альтернативное управление.';
        statusEl.style.color = '#FF6B6B';
        // Альтернативное управление мышью
        setupMouseControl();
    }
}

function setupMouseControl() {
    // Дополнительное управление мышью/пальцем (как резервный вариант)
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        cursorX = (e.clientX - rect.left) * scaleX;
        cursorY = (e.clientY - rect.top) * scaleY;
        motionX = cursorX;
        motionY = cursorY;
        updateTarget();
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        cursorX = (touch.clientX - rect.left) * scaleX;
        cursorY = (touch.clientY - rect.top) * scaleY;
        motionX = cursorX;
        motionY = cursorY;
        updateTarget();
    });
}

// Отслеживание движения через анализ кадров видео
function trackMovement() {
    if (!gameRunning || !video.videoWidth || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(trackMovement);
        return;
    }
    
    if (!videoCanvas) {
        videoCanvas = document.createElement('canvas');
        videoCanvas.width = video.videoWidth;
        videoCanvas.height = video.videoHeight;
        videoCtx = videoCanvas.getContext('2d');
    }
    
    // Рисуем текущий кадр
    videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
    const currentFrame = videoCtx.getImageData(0, 0, videoCanvas.width, videoCanvas.height);
    
    if (lastFrame) {
        // Находим область с наибольшим движением
        const motion = detectMotion(lastFrame, currentFrame);
        if (motion) {
            // Плавно обновляем позицию курсора на основе движения
            motionX = motion.x;
            motionY = motion.y;
            cursorX = motionX;
            cursorY = motionY;
            updateTarget();
        }
    }
    
    lastFrame = currentFrame;
    requestAnimationFrame(trackMovement);
}

// Детекция движения между кадрами
function detectMotion(frame1, frame2) {
    const width = frame1.width;
    const height = frame1.height;
    const data1 = frame1.data;
    const data2 = frame2.data;
    
    let maxMotion = 0;
    let motionX = width / 2;
    let motionY = height / 2;
    let totalMotion = 0;
    let motionSumX = 0;
    let motionSumY = 0;
    
    // Анализируем центральную область (где обычно находится лицо)
    const centerX = width / 2;
    const centerY = height / 2;
    const regionSize = Math.min(width, height) * 0.6;
    
    const startX = Math.max(0, centerX - regionSize / 2);
    const endX = Math.min(width, centerX + regionSize / 2);
    const startY = Math.max(0, centerY - regionSize / 2);
    const endY = Math.min(height, centerY + regionSize / 2);
    
    // Упрощенный анализ движения (сравнение яркости)
    for (let y = startY; y < endY; y += 4) {
        for (let x = startX; x < endX; x += 4) {
            const idx = (y * width + x) * 4;
            
            // Вычисляем яркость пикселя
            const brightness1 = (data1[idx] + data1[idx + 1] + data1[idx + 2]) / 3;
            const brightness2 = (data2[idx] + data2[idx + 1] + data2[idx + 2]) / 3;
            
            const diff = Math.abs(brightness1 - brightness2);
            
            if (diff > 15) { // Порог движения
                totalMotion += diff;
                motionSumX += x * diff;
                motionSumY += y * diff;
            }
        }
    }
    
    if (totalMotion > 1000) {
        motionX = motionSumX / totalMotion;
        motionY = motionSumY / totalMotion;
        
        // Ограничиваем область движения
        motionX = Math.max(50, Math.min(width - 50, motionX));
        motionY = Math.max(50, Math.min(height - 50, motionY));
        
        return { x: motionX, y: motionY };
    }
    
    return null;
}

function updateTarget() {
    // Плавное обновление позиции
    const scaleX = canvas.offsetWidth / canvas.width;
    const scaleY = canvas.offsetHeight / canvas.height;
    target.style.left = (cursorX * scaleX) + 'px';
    target.style.top = (cursorY * scaleY) + 'px';
}

function startGame() {
    if (!video.srcObject) {
        alert('Сначала активируйте камеру!');
        return;
    }
    
    gameRunning = true;
    score = 0;
    timeLeft = 60;
    fallingObjects = [];
    scoreEl.textContent = score;
    timeEl.textContent = timeLeft;
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    statusEl.textContent = 'Игра началась! Ловите падающие объекты!';
    
    // Таймер игры
    timeTimer = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
    
    // Генерация падающих объектов
    gameTimer = setInterval(() => {
        if (gameRunning) {
            createFallingObject();
        }
    }, 1500);
    
    trackMovement();
    gameLoop();
}

function createFallingObject() {
    const x = Math.random() * (canvas.width - 40);
    fallingObjects.push({
        x: x,
        y: 0,
        width: 40,
        height: 40,
        speed: 2 + Math.random() * 3,
        caught: false
    });
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем падающие объекты
    fallingObjects.forEach((obj, index) => {
        if (!obj.caught) {
            obj.y += obj.speed;
            
            // Рисуем объект
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Проверка столкновения с курсором
            const distance = Math.sqrt(
                Math.pow(cursorX - (obj.x + obj.width/2), 2) + 
                Math.pow(cursorY - (obj.y + obj.height/2), 2)
            );
            
            if (distance < 40) {
                obj.caught = true;
                score += 10;
                scoreEl.textContent = score;
                // Эффект взрыва
                createExplosion(obj.x + obj.width/2, obj.y + obj.height/2);
            }
            
            // Удаляем объекты, которые упали
            if (obj.y > canvas.height) {
                fallingObjects.splice(index, 1);
            }
        }
    });
    
    // Рисуем курсор (улучшенный дизайн)
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, 35);
    gradient.addColorStop(0, 'rgba(78, 205, 196, 0.8)');
    gradient.addColorStop(0.5, 'rgba(78, 205, 196, 0.4)');
    gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 35, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 30, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    // Центральная точка
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    requestAnimationFrame(gameLoop);
}

function createExplosion(x, y) {
    // Простой эффект взрыва
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            life: 20
        };
        
        let frame = 0;
        const drawParticle = () => {
            if (frame++ < particle.life) {
                ctx.fillStyle = `rgba(255, 215, 0, ${1 - frame/particle.life})`;
                ctx.fillRect(particle.x, particle.y, 4, 4);
                particle.x += particle.vx;
                particle.y += particle.vy;
                requestAnimationFrame(drawParticle);
            }
        };
        drawParticle();
    }
}

function endGame() {
    gameRunning = false;
    clearInterval(gameTimer);
    clearInterval(timeTimer);
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('stopBtn').style.display = 'none';
    statusEl.textContent = `Игра окончена! Ваш счет: ${score}`;
    fallingObjects = [];
}

function stopGame() {
    endGame();
}

// Управление через движение мыши/пальца на видео
video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    cursorX = canvas.width / 2;
    cursorY = canvas.height / 2;
    motionX = cursorX;
    motionY = cursorY;
    setupMouseControl();
    updateTarget();
});

// Инициализация
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('stopBtn').addEventListener('click', stopGame);

initCamera();

