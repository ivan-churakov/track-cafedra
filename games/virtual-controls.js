// Универсальный скрипт для виртуальных кнопок управления

document.addEventListener('DOMContentLoaded', () => {
    const virtualButtons = document.querySelectorAll('.virtual-btn');
    
    virtualButtons.forEach(button => {
        const key = button.getAttribute('data-key');
        
        // Обработка нажатия (мышь и сенсор)
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            triggerKey(key, true);
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            triggerKey(key, false);
        });
        
        button.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            triggerKey(key, false);
        });
        
        // Сенсорные события
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            triggerKey(key, true);
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            triggerKey(key, false);
        });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            triggerKey(key, false);
        });
    });
});

function triggerKey(key, isPressed) {
    // Создаем событие клавиатуры
    const event = new KeyboardEvent(isPressed ? 'keydown' : 'keyup', {
        key: key,
        code: key === ' ' ? 'Space' : `Key${key}`,
        keyCode: getKeyCode(key),
        which: getKeyCode(key),
        bubbles: true,
        cancelable: true
    });
    
    // Отправляем событие в документ
    document.dispatchEvent(event);
}

function getKeyCode(key) {
    const keyCodes = {
        'ArrowUp': 38,
        'ArrowDown': 40,
        'ArrowLeft': 37,
        'ArrowRight': 39,
        ' ': 32, // Пробел
        'w': 87,
        'a': 65,
        's': 83,
        'd': 68
    };
    return keyCodes[key] || 0;
}

// Предотвращаем стандартное поведение при касании
document.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('virtual-btn')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('virtual-btn')) {
        e.preventDefault();
    }
}, { passive: false });


