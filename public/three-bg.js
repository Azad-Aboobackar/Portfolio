// public/three-bg.js
const initThreeJS = () => {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    let particles = null;
    let vertexData = [];
    const clock = new THREE.Clock();
    let hasRevealed = false;
    let isExploded = false;

    // --- THE NAME SHATTER GENERATOR ---
    const getPointsForText = (renderCallback) => {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 3000;
        textCanvas.height = 1200;
        const ctx = textCanvas.getContext('2d');

        renderCallback(ctx, textCanvas.width, textCanvas.height);

        const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
        const validPoints = [];
        for (let y = 0; y < textCanvas.height; y += 2) {
            for (let x = 0; x < textCanvas.width; x += 2) {
                const index = (y * textCanvas.width + x) * 4;
                if (imgData[index + 3] > 128) {
                    validPoints.push({
                        x: (x - textCanvas.width / 2) * 0.03,
                        y: -(y - textCanvas.height / 2) * 0.03
                    });
                }
            }
        }
        for (let i = validPoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validPoints[i], validPoints[j]] = [validPoints[j], validPoints[i]];
        }
        if (validPoints.length === 0) validPoints.push({ x: 0, y: 0 });
        return validPoints;
    };

    const loadingPoints = getPointsForText((ctx, width, height) => {
        ctx.fillStyle = 'white';
        ctx.font = '900 120px "Inter", "Arial Black", Impact, sans-serif';
        ctx.letterSpacing = '10px';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw the text (shifted slightly left to make room for dots)
        ctx.fillText('LOADING', width / 2 - 100, height / 2);

        // Draw the dots separately so we can identify them by X coordinate later
        ctx.fillText('.', width / 2 + 300, height / 2);
        ctx.fillText('.', width / 2 + 380, height / 2);
        ctx.fillText('.', width / 2 + 460, height / 2);
    });

    const namePoints = getPointsForText((ctx, width, height) => {
        ctx.fillStyle = 'white';
        ctx.font = '900 160px "Inter", "Arial Black", Impact, sans-serif';
        ctx.letterSpacing = '15px';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AZAD', width / 2, height / 2 - 80);
        ctx.fillText('ABOOBACKAR', width / 2, height / 2 + 80);

        ctx.font = '900 100px "Inter", "Arial Black", Impact, sans-serif';
        ctx.letterSpacing = '5px';
        const drawScatteredText = (text, x, y, angle) => {
            ctx.save(); ctx.translate(x, y); ctx.rotate(angle * Math.PI / 180); ctx.fillText(text, 0, 0); ctx.restore();
        };
        // Chaotic abstract symbol scatter (less formal, more hacker/cyberpunk)
        drawScatteredText('Python', 200, 250, -35);
        drawScatteredText('{  }', 900, 150, 18);
        drawScatteredText('[ ... ]', 2300, 200, -22);
        drawScatteredText('Django', 2800, 300, 40);
        drawScatteredText('**kwargs', 350, 600, 25);
        drawScatteredText('=>', 2750, 650, -45);
        drawScatteredText('(  )', 250, 1050, -15);
        drawScatteredText('0x1F', 850, 950, 30);
        drawScatteredText('def()', 1450, 1150, -25);
        drawScatteredText('</>', 2100, 1050, 12);
        drawScatteredText('~ /', 2700, 1000, -30);
    });

    const particleCount = 100000;
    const positionsArray = [];

    // Safety checks
    if (loadingPoints.length === 0) loadingPoints.push({ x: 0, y: 0 });
    if (namePoints.length === 0) namePoints.push({ x: 0, y: 0 });

    for (let i = 0; i < particleCount; i++) {
        // 1. Initial State: Chaotic dust floating everywhere
        const startRadius = 40 + Math.random() * 150;
        const sTheta = Math.random() * Math.PI * 2;
        const sPhi = Math.acos(Math.random() * 2 - 1);
        const startX = startRadius * Math.sin(sPhi) * Math.cos(sTheta) * (window.innerWidth / window.innerHeight);
        const startY = startRadius * Math.sin(sPhi) * Math.sin(sTheta);
        const startZ = (Math.random() - 0.5) * 150.0;

        // 2. The Loading State: Map to a pixel inside "LOADING..."
        const ptLoad = loadingPoints[i % loadingPoints.length];

        const loadingX = ptLoad.x + (Math.random() - 0.5) * 0.08;
        const loadingY = ptLoad.y + (Math.random() - 0.5) * 0.08;
        const loadingZ = (Math.random() - 0.5) * 0.5;

        // Identify dots based on their X position
        let dotIndex = -1;
        if (ptLoad.x > 8.5 && ptLoad.x < 10.5) dotIndex = 0;
        else if (ptLoad.x >= 10.5 && ptLoad.x < 12.5) dotIndex = 1;
        else if (ptLoad.x >= 12.5) dotIndex = 2;

        // 3. The Name State: Map to a pixel inside "AZAD ABOOBACKAR"
        const ptName = namePoints[i % namePoints.length];

        // Add random 3D thickness (scatter) so the text isn't paper-thin
        const nameX = ptName.x + (Math.random() - 0.5) * 0.08;
        const nameY = ptName.y + (Math.random() - 0.5) * 0.08;
        const nameZ = (Math.random() - 0.5) * 0.5;

        // 3. The Final Explosion Scatter (Interactive dust field)
        const finalRadius = 5 + Math.random() * 80;
        const fTheta = Math.random() * Math.PI * 2;
        const fPhi = Math.acos(Math.random() * 2 - 1);
        const finalX = finalRadius * Math.sin(fPhi) * Math.cos(fTheta) * (window.innerWidth / window.innerHeight);
        const finalY = finalRadius * Math.sin(fPhi) * Math.sin(fTheta);
        const finalZ = (Math.random() - 0.5) * 20.0;

        vertexData.push({
            startX, startY, startZ,
            loadingX, loadingY, loadingZ, dotIndex,
            nameX, nameY, nameZ,
            finalX, finalY, finalZ,
            currentX: startX, currentY: startY, currentZ: startZ
        });

        positionsArray.push(startX, startY, startZ);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffa040, // Warm golden-orange 
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);

    // Scale down dynamically if on a mobile screen
    if (window.innerWidth < 768) {
        particles.scale.set(0.4, 0.4, 0.4);
    }

    scene.add(particles);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-9999, -9999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorldPos = new THREE.Vector3();

    document.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Handle mobile scaling on resize
        if (window.innerWidth < 768) {
            particles.scale.set(0.4, 0.4, 0.4);
        } else {
            particles.scale.set(1.0, 1.0, 1.0);
        }
    });

    const startTime = clock.getElapsedTime();

    const animate = () => {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime() - startTime;

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, mouseWorldPos);

        let formLoadingProgress = 0;
        let morphProgress = 0;
        let explodeProgress = 0;

        if (elapsedTime < 1.5) {
            // Phase 1: Meteor shower into LOADING
            const t = elapsedTime / 1.5;
            formLoadingProgress = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
        } else {
            formLoadingProgress = 1;
        }

        if (elapsedTime > 3.0) {
            // Phase 2: Morph from LOADING to AZAD ABOOBACKAR
            const t = Math.min((elapsedTime - 3.0) / 1.5, 1);
            morphProgress = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        if (elapsedTime > 5.0) {
            // Phase 3: Shattering the Name
            const t = Math.min((elapsedTime - 5.0) / 1.5, 1);
            explodeProgress = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

            if (!isExploded) {
                isExploded = true;
                particles.rotation.set(0, 0, 0);
            }
        }

        // Trigger UI reveal matching the new explosion time
        if (elapsedTime > 5.3 && !hasRevealed) {
            hasRevealed = true;
            const rootEl = document.getElementById('root');
            if (rootEl) {
                rootEl.classList.add('reveal');
            }
        }

        // Slight hovering motion of the name before it explodes
        if (!isExploded) {
            particles.rotation.x = Math.sin(elapsedTime) * 0.05;
            particles.rotation.y = Math.cos(elapsedTime * 0.8) * 0.05;
            particles.position.y = Math.sin(elapsedTime * 1.5) * 0.5;
        } else {
            particles.rotation.y += 0.001;
            particles.rotation.x += 0.0005;
            particles.position.y = 0;
        }

        const positions = particles.geometry.attributes.position.array;

        for (let i = 0; i < vertexData.length; i++) {
            const v = vertexData[i];

            let targetX, targetY, targetZ;

            if (!isExploded) {
                // Determine target text state (Loading -> Name morph)
                let currentTextX = v.loadingX;
                let currentTextY = v.loadingY;
                let currentTextZ = v.loadingZ;

                // Bouncing dot logic during the loading phase
                if (v.dotIndex !== -1 && morphProgress === 0) {
                    const bouncePhase = elapsedTime * 8 - v.dotIndex * 1.5;
                    currentTextY += Math.max(0, Math.sin(bouncePhase)) * 1.0;
                }

                if (morphProgress > 0) {
                    currentTextX += (v.nameX - currentTextX) * morphProgress;
                    currentTextY += (v.nameY - currentTextY) * morphProgress;
                    currentTextZ += (v.nameZ - currentTextZ) * morphProgress;
                }

                // Apply initial entry fall
                targetX = v.startX + (currentTextX - v.startX) * formLoadingProgress;
                targetY = v.startY + (currentTextY - v.startY) * formLoadingProgress;
                targetZ = v.startZ + (currentTextZ - v.startZ) * formLoadingProgress;
            } else {
                // Shattering outward
                targetX = v.nameX + (v.finalX - v.nameX) * explodeProgress;
                targetY = v.nameY + (v.finalY - v.nameY) * explodeProgress;
                targetZ = v.nameZ + (v.finalZ - v.nameZ) * explodeProgress;

                // Physics Repulsion
                if (explodeProgress > 0.5) {
                    // Apply scale factors to mouse physics so they match visual position
                    const scaleFactor = particles.scale.x;
                    const worldTargetX = targetX * scaleFactor;
                    const worldTargetY = targetY * scaleFactor;

                    const dx = worldTargetX - mouseWorldPos.x;
                    const dy = worldTargetY - mouseWorldPos.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq > 0.001 && distSq < 15.0) {
                        const dist = Math.sqrt(distSq);
                        const force = (3.87 - dist) / 3.87;

                        targetX += (dx / dist) * force * 5.0 / scaleFactor;
                        targetY += (dy / dist) * force * 5.0 / scaleFactor;
                    }
                }
            }

            // Butter-smooth interpolation
            const lerpSpeed = isExploded ? 0.15 : 0.25;
            v.currentX += (targetX - v.currentX) * lerpSpeed;
            v.currentY += (targetY - v.currentY) * lerpSpeed;
            v.currentZ += (targetZ - v.currentZ) * lerpSpeed;

            positions[i * 3] = v.currentX;
            positions[i * 3 + 1] = v.currentY;
            positions[i * 3 + 2] = v.currentZ;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    };

    animate();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeJS);
} else {
    initThreeJS();
}
