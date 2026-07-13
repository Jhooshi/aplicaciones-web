// js/particles.js

(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.prepend(canvas);

    // Aplicar estilos en línea para asegurar que se comporte como un fondo fijo detrás de todo
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '-1',
        pointerEvents: 'none',
        display: 'block'
    });

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const maxParticles = 120; // Límite para evitar lag
    const mouse = { x: null, y: null, active: false, radius: 150 };

    // Redimensionar automáticamente
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Clase que representa tanto a las partículas ambientales (esporas) como las interactivas (polvo de luz)
    class Particle {
        constructor(x, y, isInteractive = false) {
            this.x = x || Math.random() * width;
            this.y = y || Math.random() * height;
            this.isInteractive = isInteractive;
            
            // Tamaño: Pequeñas ambientales (más visibles ahora), ligeramente mayores en la estela del mouse
            this.size = isInteractive ? Math.random() * 4 + 3.5 : Math.random() * 2.8 + 1.2;
            
            // Velocidad
            this.vx = (Math.random() - 0.5) * 1.2;
            this.vy = isInteractive ? (Math.random() - 0.7) * 2 - 1 : (Math.random() - 0.5) * 0.5 - 0.4; // Deriva hacia arriba
            
            // Vida y Opacidad
            this.alpha = 1;
            this.decay = isInteractive ? Math.random() * 0.012 + 0.006 : 0; // Las ambientales no desaparecen por tiempo
            
            // Colores solicitados: Blanco, negro (gris oscuro), verde y amarillo
            const colorsList = [
                { r: 255, g: 255, b: 255 }, // Blanco
                { r: 40, g: 45, b: 50 },    // Negro / Gris oscuro
                { r: 16, g: 185, b: 129 },  // Verde esmeralda
                { r: 234, g: 179, b: 8 }    // Amarillo
            ];
            this.color = colorsList[Math.floor(Math.random() * colorsList.length)];
        }

        update() {
            // Aplicar velocidad
            this.x += this.vx;
            this.y += this.vy;

            // Decaimiento de las interactivas
            if (this.isInteractive) {
                this.alpha -= this.decay;
            } else {
                // Envoltura para partículas ambientales si salen de la pantalla
                if (this.x < -10) this.x = width + 10;
                if (this.x > width + 10) this.x = -10;
                if (this.y < -10) this.y = height + 10;
                if (this.y > height + 10) this.y = -10;
            }

            // Gravedad/Atracción hacia el puntero
            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    
                    // Atraer partículas levemente usando fuerza elástica
                    this.vx += Math.cos(angle) * force * 0.07;
                    this.vy += Math.sin(angle) * force * 0.07;
                    
                    // Fricción para estabilidad
                    this.vx *= 0.94;
                    this.vy *= 0.94;
                }
            }
        }

        draw() {
            ctx.save();
            // Aumentamos la opacidad de 0.28 a 0.58 para que se noten más
            ctx.globalAlpha = this.isInteractive ? Math.max(0, this.alpha) : 0.58;
            ctx.shadowBlur = this.isInteractive ? 10 : 3;
            ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
            ctx.fill();
            ctx.restore();
        }
    }

    // Inicializar esporas ambientales flotantes en segundo plano
    const ambientCount = 45;
    for (let i = 0; i < ambientCount; i++) {
        particles.push(new Particle());
    }

    // Eventos del Mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;

        // Generar partículas interactivas en la estela del mouse
        const currentTrails = particles.filter(p => p.isInteractive).length;
        if (currentTrails < maxParticles) {
            particles.push(new Particle(mouse.x, mouse.y, true));
            particles.push(new Particle(mouse.x, mouse.y, true));
        }
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
        mouse.active = false;
    });

    // Explosión de chispas en clicks
    window.addEventListener('click', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        for (let i = 0; i < 18; i++) {
            const p = new Particle(x, y, true);
            // Mayor impulso inicial
            const speed = Math.random() * 5 + 1;
            const angle = Math.random() * Math.PI * 2;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            particles.push(p);
        }
    });

    // Trazar conexiones sutiles en la red
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Conectar solo si la distancia es reducida
                const maxDist = 95;
                if (dist < maxDist) {
                    const minAlpha = Math.min(p1.alpha, p2.alpha);
                    const alpha = (1 - (dist / maxDist)) * 0.12 * minAlpha;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
                    ctx.lineWidth = 0.75;
                    ctx.stroke();
                }
            }
        }
    }

    // Bucle de Animación principal
    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();

            // Eliminar partículas interactivas desvanecidas
            if (p.isInteractive && p.alpha <= 0) {
                particles.splice(i, 1);
            }
        }

        drawConnections();
        requestAnimationFrame(animate);
    }

    animate();
})();
