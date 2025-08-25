import { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Howl } from 'howler';
import './index.css';

// Game Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const ENEMY_SPEED = 2;

// --- Player Class ---
class Player {
    constructor(app) {
        this.app = app;
        this.sprite = PIXI.Sprite.from('/player.png');
        this.sprite.anchor.set(0.5);
        this.sprite.x = GAME_WIDTH / 2;
        this.sprite.y = GAME_HEIGHT - 50;
        this.app.stage.addChild(this.sprite);

        this.bullets = [];
        this.canShoot = true;
        this.shootCooldown = 200; // milliseconds

        this.shootSound = new Howl({
            src: ['/shoot.ogg']
        });
    }

    move(direction) {
        this.sprite.x += direction * PLAYER_SPEED;
        // Keep player within bounds
        if (this.sprite.x < this.sprite.width / 2) this.sprite.x = this.sprite.width / 2;
        if (this.sprite.x > GAME_WIDTH - this.sprite.width / 2) this.sprite.x = GAME_WIDTH - this.sprite.width / 2;
    }

    shoot() {
        if (this.canShoot) {
            const bullet = new Bullet(this.app, this.sprite.x, this.sprite.y - this.sprite.height / 2);
            this.bullets.push(bullet);
            this.canShoot = false;
            this.shootSound.play();
            setTimeout(() => {
                this.canShoot = true;
            }, this.shootCooldown);
        }
    }

    update() {
        // Update bullets
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.sprite.y < 0) {
                bullet.sprite.destroy();
                this.bullets.splice(index, 1);
            }
        });
    }
}

// --- Bullet Class ---
class Bullet {
    constructor(app, x, y) {
        this.app = app;
        this.sprite = PIXI.Sprite.from('/bullet.png');
        this.sprite.anchor.set(0.5);
        this.sprite.x = x;
        this.sprite.y = y;
        this.app.stage.addChild(this.sprite);
    }

    update() {
        this.sprite.y -= BULLET_SPEED;
    }
}

// --- Enemy Class ---
class Enemy {
    constructor(app, x, y) {
        this.app = app;
        this.sprite = PIXI.Sprite.from('/enemy.png');
        this.sprite.anchor.set(0.5);
        this.sprite.x = x;
        this.sprite.y = y;
        this.app.stage.addChild(this.sprite);

        this.explosionSound = new Howl({
            src: ['/explosion.ogg']
        });
    }

    update() {
        this.sprite.y += ENEMY_SPEED;
    }

    explode() {
        this.explosionSound.play();
        // Simple explosion animation using GSAP
        const explosion = PIXI.Sprite.from('/explosion.png');
        explosion.anchor.set(0.5);
        explosion.x = this.sprite.x;
        explosion.y = this.sprite.y;
        explosion.scale.set(0.1);
        this.app.stage.addChild(explosion);

        gsap.to(explosion.scale, { x: 1, y: 1, duration: 0.3, onComplete: () => {
            explosion.destroy();
        }});
        this.sprite.destroy();
    }
}

// --- Game Component ---
const Game = () => {
    const pixiContainer = useRef(null);
    const app = useRef(null);
    const playerRef = useRef(null);
    const enemiesRef = useRef([]);
    const scoreRef = useRef(0);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!pixiContainer.current) return;

        app.current = new PIXI.Application({
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: 0x000000,
        });
        pixiContainer.current.appendChild(app.current.canvas);

        const player = new Player(app.current);
        playerRef.current = player;

        // Keyboard controls
        const keys = {};
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            if (e.code === 'Space') player.shoot();
        });
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });

        // Game Loop
        app.current.ticker.add(() => {
            // Player movement
            if (keys.ArrowLeft) player.move(-1);
            if (keys.ArrowRight) player.move(1);

            player.update();

            // Enemy spawning (simple for now)
            if (Math.random() < 0.01 && enemiesRef.current.length < 5) { // Spawn up to 5 enemies
                const enemy = new Enemy(app.current, Math.random() * GAME_WIDTH, -50);
                enemiesRef.current.push(enemy);
            }

            // Update enemies and check collisions
            enemiesRef.current.forEach((enemy, enemyIndex) => {
                enemy.update();
                if (enemy.sprite.y > GAME_HEIGHT + 50) {
                    enemy.sprite.destroy();
                    enemiesRef.current.splice(enemyIndex, 1);
                }

                // Bullet-enemy collision
                player.bullets.forEach((bullet, bulletIndex) => {
                    if (bullet.sprite.getBounds().intersects(enemy.sprite.getBounds())) {
                        enemy.explode();
                        player.bullets[bulletIndex].sprite.destroy();
                        player.bullets.splice(bulletIndex, 1);
                        enemiesRef.current.splice(enemyIndex, 1);
                        scoreRef.current += 10;
                        setScore(scoreRef.current);
                    }
                });
            });
        });

        // Cleanup
        return () => {
            app.current.destroy(true);
        };
    }, []);

    return (
        <div className="game-container" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, position: 'relative', overflow: 'hidden' }}>
            <div ref={pixiContainer} style={{ position: 'absolute' }} />
            <div className="score-display" style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontFamily: 'monospace', fontSize: 24 }}>
                SCORE: {score}
            </div>
        </div>
    );
};

function App() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <Game />
        </div>
    );
}

export default App;
