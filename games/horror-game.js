// Элементы DOM
const container = document.getElementById('gameContainer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const overlay = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayBtn = document.getElementById('overlayBtn');
const keysEl = document.getElementById('keys');
const timeEl = document.getElementById('time');
const distanceEl = document.getElementById('distance');

// Проверка наличия Three.js
if (typeof THREE === 'undefined') {
    console.error('Three.js не загружен!');
    overlayTitle.textContent = 'Ошибка';
    overlayText.textContent = 'Не удалось загрузить Three.js. Проверьте подключение к интернету.';
    overlay.classList.remove('hidden');
}

// Игровое состояние
let gameState = 'menu'; // menu, playing, paused, win, lose
let keys = 0;
let startTime = 0;
let gameTime = 0;
let flashlightOn = true;

// Three.js сцена
let scene, camera, renderer;
let player, monster, keysList = [], exit;
let walls = [];
let flashlight;
let ambientLight, monsterLight;

// Управление
const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
};

let mouseX = 0;
let mouseY = 0;
let isPointerLocked = false;

// Параметры игрока
const playerSpeed = 0.15;
const runSpeed = 0.25;
const mouseSensitivity = 0.002;

// Инициализация Three.js
function initThree() {
    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    // Камера (от первого лица)
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.6, 0);
    
    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Освещение
    ambientLight = new THREE.AmbientLight(0x111111, 0.3);
    scene.add(ambientLight);
    
    // Фонарик
    flashlight = new THREE.SpotLight(0xffffff, 2, 20, Math.PI / 6, 0.3, 1);
    flashlight.position.set(0, 1.5, 0);
    flashlight.target.position.set(0, 1.5, -1);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 2048;
    flashlight.shadow.mapSize.height = 2048;
    scene.add(flashlight);
    scene.add(flashlight.target);
    
    // Свет от монстра (красный)
    monsterLight = new THREE.PointLight(0xff0000, 1, 10);
    monsterLight.castShadow = true;
    scene.add(monsterLight);
    
    // Создание уровня
    createLevel();
    
    // Обработка изменения размера
    window.addEventListener('resize', onWindowResize);
}

// Создание уровня
function createLevel() {
    // Пол
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Потолок
    const ceiling = new THREE.Mesh(floorGeometry, floorMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3;
    scene.add(ceiling);
    
    // Стены коридора
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Боковые стены
    const wallGeometry = new THREE.PlaneGeometry(100, 3);
    
    // Левая стена
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 1.5, 0);
    leftWall.castShadow = true;
    scene.add(leftWall);
    walls.push(leftWall);
    
    // Правая стена
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5, 1.5, 0);
    rightWall.castShadow = true;
    scene.add(rightWall);
    walls.push(rightWall);
    
    // Стены с проходами (создаем лабиринт)
    createMazeWalls();
    
    // Ключи
    const keyPositions = [
        new THREE.Vector3(-3, 1, -15),
        new THREE.Vector3(3, 1, -30),
        new THREE.Vector3(-2, 1, -45)
    ];
    
    keysList = keyPositions.map((pos, index) => {
        const keyGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        const keyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        const key = new THREE.Mesh(keyGeometry, keyMaterial);
        key.position.copy(pos);
        key.userData = { collected: false, index: index };
        key.castShadow = true;
        scene.add(key);
        return key;
    });
    
    // Выход
    const exitGeometry = new THREE.PlaneGeometry(2, 2);
    const exitMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        emissive: 0x00aa00,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.7
    });
    exit = new THREE.Mesh(exitGeometry, exitMaterial);
    exit.position.set(0, 1.5, -55);
    exit.rotation.y = Math.PI;
    exit.visible = false;
    scene.add(exit);
    
    // Монстр
    const monsterGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const monsterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x660000,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
    });
    monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
    monster.position.set(0, 1, -20);
    monster.castShadow = true;
    scene.add(monster);
}

// Создание стен лабиринта
function createMazeWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        roughness: 0.9
    });
    
    // Случайные стены в коридоре
    const wallPositions = [
        { x: -2, z: -10, rot: 0 },
        { x: 2, z: -20, rot: 0 },
        { x: -3, z: -25, rot: 0 },
        { x: 3, z: -35, rot: 0 },
        { x: -2, z: -40, rot: 0 },
        { x: 0, z: -12, rot: Math.PI / 2 },
        { x: 0, z: -22, rot: Math.PI / 2 },
        { x: 0, z: -32, rot: Math.PI / 2 }
    ];
    
    wallPositions.forEach(pos => {
        const wallGeometry = new THREE.PlaneGeometry(2, 3);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.rotation.y = pos.rot;
        wall.position.set(pos.x, 1.5, pos.z);
        wall.castShadow = true;
        scene.add(wall);
        walls.push(wall);
    });
}

// Обновление игры
function update() {
    if (gameState !== 'playing') return;
    
    // Обновление времени
    gameTime = Date.now() - startTime;
    updateTimeDisplay();
    
    // Движение игрока
    const speed = keysPressed.shift ? runSpeed : playerSpeed;
    const direction = new THREE.Vector3();
    
    if (keysPressed.w) direction.z -= 1;
    if (keysPressed.s) direction.z += 1;
    if (keysPressed.a) direction.x -= 1;
    if (keysPressed.d) direction.x += 1;
    
    direction.normalize();
    direction.multiplyScalar(speed);
    
    // Применяем поворот камеры к направлению
    direction.applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    
    // Проверка коллизий
    const newPosition = camera.position.clone().add(direction);
    if (!checkCollision(newPosition)) {
        camera.position.add(direction);
    }
    
    // Обновление фонарика
    flashlight.position.copy(camera.position);
    flashlight.position.y = 1.5;
    flashlight.target.position.copy(camera.position);
    flashlight.target.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(5));
    flashlight.intensity = flashlightOn ? 2 : 0;
    
    // Проверка сбора ключей
    keysList.forEach(key => {
        if (!key.userData.collected) {
            const distance = camera.position.distanceTo(key.position);
            if (distance < 1.5) {
                key.userData.collected = true;
                key.visible = false;
                keys++;
                updateKeysDisplay();
            }
        }
    });
    
    // Показываем выход когда все ключи собраны
    if (keys === 3 && !exit.visible) {
        exit.visible = true;
        exit.material.emissiveIntensity = 0.5 + Math.sin(Date.now() / 200) * 0.3;
    }
    
    // Проверка выхода
    if (keys === 3) {
        const distToExit = camera.position.distanceTo(exit.position);
        if (distToExit < 2) {
            winGame();
            return;
        }
    }
    
    // ИИ монстра
    const distToPlayer = camera.position.distanceTo(monster.position);
    updateDistanceDisplay(distToPlayer);
    
    if (distToPlayer < 15) {
        // Преследование
        const direction = new THREE.Vector3()
            .subVectors(camera.position, monster.position)
            .normalize();
        
        const speed = 0.08;
        const newPos = monster.position.clone().add(direction.multiplyScalar(speed));
        
        if (!checkMonsterCollision(newPos)) {
            monster.position.copy(newPos);
        }
        
        // Вращение монстра к игроку
        monster.lookAt(camera.position);
        
        // Красное свечение усиливается
        monsterLight.intensity = 2;
        monsterLight.position.copy(monster.position);
        monsterLight.position.y = 1;
        
        // Эффект дрожания при близости
        if (distToPlayer < 5) {
            document.body.classList.add('shake');
        } else {
            document.body.classList.remove('shake');
        }
    } else {
        // Патрулирование
        monsterLight.intensity = 0.5;
        if (Math.random() < 0.01) {
            const angle = Math.random() * Math.PI * 2;
            const moveX = Math.cos(angle) * 0.05;
            const moveZ = Math.sin(angle) * 0.05;
            const newPos = monster.position.clone().add(new THREE.Vector3(moveX, 0, moveZ));
            if (!checkMonsterCollision(newPos)) {
                monster.position.copy(newPos);
            }
        }
    }
    
    // Проверка столкновения с монстром
    if (distToPlayer < 1.5) {
        loseGame();
    }
    
    // Обновление рендерера
    renderer.render(scene, camera);
}

// Проверка коллизий игрока
function checkCollision(position) {
    const playerRadius = 0.5;
    
    for (const wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const playerBox = new THREE.Box3(
            new THREE.Vector3(position.x - playerRadius, 0.5, position.z - playerRadius),
            new THREE.Vector3(position.x + playerRadius, 2.5, position.z + playerRadius)
        );
        
        if (wallBox.intersectsBox(playerBox)) {
            return true;
        }
    }
    
    // Проверка границ
    if (Math.abs(position.x) > 4.5 || position.z > 2 || position.z < -60) {
        return true;
    }
    
    return false;
}

// Проверка коллизий монстра
function checkMonsterCollision(position) {
    const monsterRadius = 0.6;
    
    for (const wall of walls) {
        const wallBox = new THREE.Box3().setFromObject(wall);
        const monsterBox = new THREE.Box3(
            new THREE.Vector3(position.x - monsterRadius, 0, position.z - monsterRadius),
            new THREE.Vector3(position.x + monsterRadius, 2, position.z + monsterRadius)
        );
        
        if (wallBox.intersectsBox(monsterBox)) {
            return true;
        }
    }
    
    return false;
}

// Обновление отображения ключей
function updateKeysDisplay() {
    keysEl.textContent = `${keys}/3`;
    if (keys === 3) {
        keysEl.style.color = '#00ff00';
        keysEl.style.textShadow = '0 0 10px #00ff00';
    }
}

// Обновление отображения времени
function updateTimeDisplay() {
    const seconds = Math.floor(gameTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Обновление отображения дистанции
function updateDistanceDisplay(distance) {
    const meters = Math.floor(distance);
    if (distance < 15) {
        distanceEl.textContent = `${meters}м (ПРЕСЛЕДУЕТ!)`;
        distanceEl.style.color = '#ff0000';
        distanceEl.style.textShadow = '0 0 10px #ff0000';
    } else {
        distanceEl.textContent = `${meters}м`;
        distanceEl.style.color = '#ff6b6b';
        distanceEl.style.textShadow = 'none';
    }
}

// Игровой цикл
function gameLoop() {
    update();
    requestAnimationFrame(gameLoop);
}

// Начало игры
function startGame() {
    gameState = 'playing';
    keys = 0;
    startTime = Date.now();
    gameTime = 0;
    flashlightOn = true;
    
    // Сброс позиций
    camera.position.set(0, 1.6, 0);
    camera.rotation.set(0, 0, 0);
    monster.position.set(0, 1, -20);
    
    // Сброс ключей
    keysList.forEach(key => {
        key.userData.collected = false;
        key.visible = true;
    });
    
    exit.visible = false;
    
    updateKeysDisplay();
    overlay.classList.add('hidden');
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    
    // Захват указателя мыши
    container.requestPointerLock = container.requestPointerLock || 
                                   container.mozRequestPointerLock || 
                                   container.webkitRequestPointerLock;
    
    if (container.requestPointerLock) {
        container.requestPointerLock();
    }
    
    gameLoop();
}

// Победа
function winGame() {
    gameState = 'win';
    const seconds = Math.floor(gameTime / 1000);
    overlayTitle.textContent = '🎉 Победа!';
    overlayText.textContent = `Вы успешно сбежали за ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}!`;
    overlayBtn.textContent = 'Играть снова';
    overlay.classList.remove('hidden');
    pauseBtn.style.display = 'none';
    startBtn.style.display = 'inline-block';
    document.exitPointerLock();
}

// Поражение
function loseGame() {
    gameState = 'lose';
    overlayTitle.textContent = '💀 Поражение';
    overlayText.textContent = 'Монстр настиг вас! Попробуйте снова и будьте осторожнее.';
    overlayBtn.textContent = 'Попробовать снова';
    overlay.classList.remove('hidden');
    pauseBtn.style.display = 'none';
    startBtn.style.display = 'inline-block';
    document.exitPointerLock();
}

// Пауза
function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        overlayTitle.textContent = '⏸ Пауза';
        overlayText.textContent = 'Игра приостановлена. Нажмите кнопку для продолжения.';
        overlayBtn.textContent = 'Продолжить';
        overlay.classList.remove('hidden');
        pauseBtn.textContent = 'Продолжить';
        document.exitPointerLock();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        startTime = Date.now() - gameTime;
        overlay.classList.add('hidden');
        pauseBtn.textContent = 'Пауза';
        container.requestPointerLock();
    }
}

// Обработка изменения размера окна
function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Обработчики событий
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
overlayBtn.addEventListener('click', () => {
    if (gameState === 'win' || gameState === 'lose') {
        startGame();
    } else if (gameState === 'paused') {
        pauseGame();
    } else {
        startGame();
    }
});

// Обработка клавиатуры
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = true;
        e.preventDefault();
    }
    if (e.key === 'Shift') {
        keysPressed.shift = true;
    }
    if (e.key === 'f' || e.key === 'F') {
        flashlightOn = !flashlightOn;
        e.preventDefault();
    }
    if (e.key === 'Escape' && gameState === 'playing') {
        pauseGame();
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysPressed[key] = false;
        e.preventDefault();
    }
    if (e.key === 'Shift') {
        keysPressed.shift = false;
    }
});

// Обработка мыши
let isMouseDown = false;

container.addEventListener('mousedown', () => {
    if (gameState === 'playing' && !isPointerLocked) {
        container.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    isPointerLocked = document.pointerLockElement === container;
});

document.addEventListener('mousemove', (e) => {
    if (isPointerLocked && gameState === 'playing') {
        const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
        
        camera.rotation.y -= movementX * mouseSensitivity;
        camera.rotation.x -= movementY * mouseSensitivity;
        
        // Ограничение вертикального обзора
        camera.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, camera.rotation.x));
    }
});

// Инициализация
if (typeof THREE !== 'undefined') {
    initThree();
    renderer.render(scene, camera);
} else {
    console.error('Three.js не загружен!');
}
