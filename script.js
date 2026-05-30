window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const textInput = document.getElementById('textInput');

    class Particle {
        constructor(effect, x, y, color) {
            this.effect = effect;
            this.x = Math.random() * this.effect.canvasWidth;
            this.y = Math.random() * this.effect.canvasHeight;
            this.originX = x;
            this.originY = y;
            this.color = color;
            this.size = this.effect.gap - 1;
            this.vx = 0;
            this.vy = 0;
            this.ease = 0.05; // Return speed
            this.friction = 0.95;
            this.dx = 0;
            this.dy = 0;
            this.distance = 0;
            this.force = 0;
            this.angle = 0;
        }
        draw(context) {
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            context.fill();
        }
        update() {
            this.dx = this.effect.mouse.x - this.x;
            this.dy = this.effect.mouse.y - this.y;
            this.distance = this.dx * this.dx + this.dy * this.dy;
            this.force = -this.effect.mouse.radius / this.distance;

            if (this.distance < this.effect.mouse.radius) {
                this.angle = Math.atan2(this.dy, this.dx);
                this.vx += this.force * Math.cos(this.angle);
                this.vy += this.force * Math.sin(this.angle);
            }

            this.vx *= this.friction;
            this.vy *= this.friction;

            this.x += this.vx + (this.originX - this.x) * this.ease;
            this.y += this.vy + (this.originY - this.y) * this.ease;
        }
    }

    class Effect {
        constructor(context, canvasWidth, canvasHeight) {
            this.context = context;
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.textX = this.canvasWidth / 2;
            this.textY = this.canvasHeight / 2;
            this.fontSize = 120;
            this.lineHeight = this.fontSize * 0.9;
            this.maxTextWidth = this.canvasWidth * 0.8;
            this.particles = [];
            this.gap = 4; // Particle spacing (Halftone density)
            this.mouse = {
                radius: 10000,
                x: undefined,
                y: undefined
            };
            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            });
            window.addEventListener('mouseleave', () => {
                this.mouse.x = undefined;
                this.mouse.y = undefined;
            });
        }
        wrapText(text) {
            const gradient = this.context.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
            gradient.addColorStop(0.3, 'black');
            gradient.addColorStop(0.5, '#333');
            gradient.addColorStop(0.7, 'black');
            this.context.fillStyle = gradient;
            this.context.textAlign = 'center';
            this.context.textBaseline = 'middle';
            this.context.font = `bold ${this.fontSize}px Arial`;

            // Handle multi-line
            let lines = text.split('\n');
            let currentY = this.textY - ((lines.length - 1) * this.lineHeight) / 2;
            
            lines.forEach((line, index) => {
                this.context.fillText(line, this.textX, currentY + (index * this.lineHeight));
            });

            this.convertToParticles();
        }
        convertToParticles() {
            this.particles = [];
            const pixels = this.context.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data;
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

            for (let y = 0; y < this.canvasHeight; y += this.gap) {
                for (let x = 0; x < this.canvasWidth; x += this.gap) {
                    const index = (y * this.canvasWidth + x) * 4;
                    const alpha = pixels[index + 3];
                    if (alpha > 128) {
                        const red = pixels[index];
                        const green = pixels[index + 1];
                        const blue = pixels[index + 2];
                        const color = `rgb(${red},${green},${blue})`;
                        this.particles.push(new Particle(this, x, y, color));
                    }
                }
            }
        }
        render() {
            this.particles.forEach(particle => {
                particle.update();
                particle.draw(this.context);
            });
        }
        resize(width, height) {
            this.canvasWidth = width;
            this.canvasHeight = height;
            this.textX = this.canvasWidth / 2;
            this.textY = this.canvasHeight / 2;
            this.maxTextWidth = this.canvasWidth * 0.8;
        }
    }

    const effect = new Effect(ctx, canvas.width, canvas.height);
    effect.wrapText(textInput.value);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.render();
        requestAnimationFrame(animate);
    }
    animate();

    textInput.addEventListener('input', function(e) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.wrapText(e.target.value);
    });

    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        effect.resize(canvas.width, canvas.height);
        effect.wrapText(textInput.value);
    });
});
