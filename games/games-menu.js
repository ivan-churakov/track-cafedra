document.addEventListener('DOMContentLoaded', () => {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        const playBtn = card.querySelector('.play-btn');
        const gameName = card.getAttribute('data-game');
        
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startGame(gameName);
        });
        
        card.addEventListener('click', () => {
            startGame(gameName);
        });
    });
});

function startGame(gameName) {
    const gameUrls = {
        'tetris': 'tetris-game.html',
        'snake': 'snake-game.html',
        'breakout': 'breakout-game.html',
        'space-invaders': 'space-invaders-game.html',
        'pong': 'pong-game.html',
        'camera': 'camera-game.html',
        'horror': 'horror-game.html'
    };
    
    if (gameUrls[gameName]) {
        window.location.href = gameUrls[gameName];
    }
}

