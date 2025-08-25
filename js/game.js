class Starfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isWarping = false;
        this.warpSpeed = 10;

        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        this.dx = 0; // Horizontal velocity
        this.dy = 0; // Vertical velocity
        this.acceleration = 0.2;
        this.friction = 0.98;
        this.maxSpeed = 5;

        this.starLayers = {
            near: { num: 100, stars: [], speed: 0.7, radius: 1.5 },
            medium: { num: 200, stars: [], speed: 0.4, radius: 1 },
            far: { num: 400, stars: [], speed: 0.2, radius: 0.5 }
        };

        this.shootingStars = [];
        this.numShootingStars = 2;
        this.nebulae = [];
        this.numNebulae = 7;
        this.starColors = ['#FFFFFF', '#FFFFE0', '#ADD8E6', '#FFDAB9'];

        this.init();
        this.addEventListeners();
    }

    init() {
        for (const layer in this.starLayers) {
            for (let i = 0; i < this.starLayers[layer].num; i++) {
                this.starLayers[layer].stars.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    radius: Math.random() * this.starLayers[layer].radius,
                    baseSpeed: Math.random() * 0.5 + this.starLayers[layer].speed,
                    color: this.starColors[Math.floor(Math.random() * this.starColors.length)],
                    opacity: Math.random() * 0.5 + 0.5
                });
            }
        }

        for (let i = 0; i < this.numNebulae; i++) {
            this.nebulae.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 300 + 200,
                color1: `rgba(${Math.random() * 100}, ${Math.random() * 50}, ${Math.random() * 100 + 155}, ${Math.random() * 0.1 + 0.05})`,
                color2: `rgba(${Math.random() * 100}, ${Math.random() * 50}, ${Math.random() * 100 + 155}, 0)`,
                driftX: (Math.random() - 0.5) * 0.1,
                driftY: (Math.random() - 0.5) * 0.1,
                opacity: 1
            });
        }

        for (let i = 0; i < this.numShootingStars; i++) {
            this.shootingStars.push(this.createShootingStar());
        }
    }

    createShootingStar() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height / 2,
            len: Math.random() * 80 + 10,
            speed: Math.random() * 10 + 5,
            opacity: 1
        };
    }

    addEventListeners() {
        window.addEventListener('mousedown', () => { this.isWarping = true; });
        window.addEventListener('mouseup', () => { this.isWarping = false; });
        window.addEventListener('keydown', (e) => { if (e.key in this.keys) this.keys[e.key] = true; });
        window.addEventListener('keyup', (e) => { if (e.key in this.keys) this.keys[e.key] = false; });
    }

    update() {
        if (this.keys.ArrowUp) this.dy = Math.min(this.maxSpeed, this.dy + this.acceleration);
        if (this.keys.ArrowDown) this.dy = Math.max(-this.maxSpeed, this.dy - this.acceleration);
        if (this.keys.ArrowLeft) this.dx = Math.min(this.maxSpeed, this.dx + this.acceleration);
        if (this.keys.ArrowRight) this.dx = Math.max(-this.maxSpeed, this.dx - this.acceleration);

        this.dy *= this.friction;
        this.dx *= this.friction;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawNebulae();
        this.drawStars();
        this.drawShootingStars();
    }
    
    drawNebulae() {
        for (let i = 0; i < this.numNebulae; i++) {
            const nebula = this.nebulae[i];
            if (!this.isWarping) {
                nebula.opacity += (1 - nebula.opacity) * 0.02;
                nebula.x += nebula.driftX - (this.dx * 0.1);
                nebula.y += nebula.driftY - (this.dy * 0.1);

                if (nebula.x + nebula.radius < 0) nebula.x = this.canvas.width + nebula.radius;
                if (nebula.x - nebula.radius > this.canvas.width) nebula.x = -nebula.radius;
                if (nebula.y + nebula.radius < 0) nebula.y = this.canvas.height + nebula.radius;
                if (nebula.y - nebula.radius > this.canvas.height) nebula.y = -nebula.radius;
            } else {
                nebula.opacity -= nebula.opacity * 0.05;
            }

            const gradient = this.ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
            gradient.addColorStop(0, nebula.color1);
            gradient.addColorStop(1, nebula.color2);
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = nebula.opacity;
            this.ctx.beginPath();
            this.ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    drawStars() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        for (const layer in this.starLayers) {
            for (let i = 0; i < this.starLayers[layer].num; i++) {
                const star = this.starLayers[layer].stars[i];
                
                if (this.isWarping) {
                    const d_x = star.x - centerX;
                    const d_y = star.y - centerY;
                    const dist = Math.sqrt(d_x * d_x + d_y * d_y);
                    const speed = star.baseSpeed * this.warpSpeed;

                    star.x += (d_x / dist) * speed;
                    star.y += (d_y / dist) * speed;

                    if (star.x < 0 || star.x > this.canvas.width || star.y < 0 || star.y > this.canvas.height) {
                        const angle = Math.random() * Math.PI * 2;
                        const radius = Math.random() * 20;
                        star.x = centerX + Math.cos(angle) * radius;
                        star.y = centerY + Math.sin(angle) * radius;
                    }
                } else {
                    star.y += star.baseSpeed + this.dy;
                    star.x += this.dx;

                    star.opacity += (Math.random() - 0.5) * 0.1;
                    if (star.opacity < 0.2) star.opacity = 0.2;
                    if (star.opacity > 1) star.opacity = 1;

                    if (star.y > this.canvas.height) { star.y = 0; star.x = Math.random() * this.canvas.width; }
                    if (star.y < 0) { star.y = this.canvas.height; star.x = Math.random() * this.canvas.width; }
                    if (star.x > this.canvas.width) { star.x = 0; star.y = Math.random() * this.canvas.height; }
                    if (star.x < 0) { star.x = this.canvas.width; star.y = Math.random() * this.canvas.height; }
                }

                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = star.color;
                this.ctx.globalAlpha = star.opacity;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }
    }

    drawShootingStars() {
        if (!this.isWarping) {
            for (let i = 0; i < this.shootingStars.length; i++) {
                const ss = this.shootingStars[i];
                this.ctx.beginPath();
                this.ctx.moveTo(ss.x, ss.y);
                this.ctx.lineTo(ss.x + ss.len, ss.y - ss.len);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${ss.opacity})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                ss.x -= ss.speed;
                ss.y += ss.speed;
                ss.opacity -= 0.02;

                if (ss.opacity <= 0) {
                    this.shootingStars[i] = this.createShootingStar();
                }
            }
        }
    }
}

const canvas = document.getElementById('gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const starfield = new Starfield(canvas);

function gameLoop() {
    starfield.update();
    starfield.draw();

    // --- ADD YOUR GAME LOGIC HERE ---

    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

gameLoop();