import Starfield from './starfield.js';

const canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const starfield = new Starfield(canvas);

function gameLoop() {
    starfield.update();
    starfield.draw();

    // --- ADD YOUR GAME LOGIC HERE ---
    // For example:
    // player.update();
    // player.draw();
    // enemies.forEach(enemy => {
    //     enemy.update();
    //     enemy.draw();
    // });

    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // You might need to re-initialize or adjust game elements here
});

gameLoop();
