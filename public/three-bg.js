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
    // 1. We use an invisible HTML canvas to render your name "AZAD" in bold font
    // 2. We scan the pixels of that canvas to get the exact coordinates of the letters
    // 3. We map 25,000 3D particles to those coordinates to build your name out of golden dust

    const textCanvas = document.createElement('canvas');
    textCanvas.width = 1200;
    textCanvas.height = 300;
    const ctx = textCanvas.getContext('2d');

    // Draw the text (Bold, premium typography)
    ctx.fillStyle = 'white';
    ctx.font = '900 240px "Inter", "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A Z A D', textCanvas.width / 2, textCanvas.height / 2);

    const imgData = ctx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
    const validPoints = [];

    // Extract pixel coordinates where the text exists
    for (let y = 0; y < textCanvas.height; y += 2) { // Skip pixels for performance
        for (let x = 0; x < textCanvas.width; x += 2) {
            const index = (y * textCanvas.width + x) * 4;
            const alpha = imgData[index + 3];
            if (alpha > 128) {
                // Map from 2D canvas coordinates to 3D space
                const mappedX = (x - textCanvas.width / 2) * 0.03;
                const mappedY = -(y - textCanvas.height / 2) * 0.03;
                validPoints.push({ x: mappedX, y: mappedY });
            }
        }
    }

    const particleCount = 25000;
    const positionsArray = [];

    // If the canvas failed or is empty, fallback to a small scatter
    if (validPoints.length === 0) validPoints.push({ x: 0, y: 0 });

    for (let i = 0; i < particleCount; i++) {
        // 1. Initial State: Chaotic dust floating everywhere
        const startRadius = 40 + Math.random() * 150;
        const sTheta = Math.random() * Math.PI * 2;
        const sPhi = Math.acos(Math.random() * 2 - 1);
        const startX = startRadius * Math.sin(sPhi) * Math.cos(sTheta) * (window.innerWidth / window.innerHeight);
        const startY = startRadius * Math.sin(sPhi) * Math.sin(sTheta);
        const startZ = (Math.random() - 0.5) * 150.0;

        // 2. The Name State: Map to a random pixel inside the letters
        const pt = validPoints[Math.floor(Math.random() * validPoints.length)];

        // Add random 3D thickness (scatter) so the text isn't paper-thin, giving it a solid 3D feel
        const nameX = pt.x + (Math.random() - 0.5) * 0.3;
        const nameY = pt.y + (Math.random() - 0.5) * 0.3;
        const nameZ = (Math.random() - 0.5) * 1.5;

        // 3. The Final Explosion Scatter (Interactive dust field)
        const finalRadius = 5 + Math.random() * 80;
        const fTheta = Math.random() * Math.PI * 2;
        const fPhi = Math.acos(Math.random() * 2 - 1);
        const finalX = finalRadius * Math.sin(fPhi) * Math.cos(fTheta) * (window.innerWidth / window.innerHeight);
        const finalY = finalRadius * Math.sin(fPhi) * Math.sin(fTheta);
        const finalZ = (Math.random() - 0.5) * 20.0;

        vertexData.push({
            startX, startY, startZ,
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

        let formProgress = 0;
        let explodeProgress = 0;

        if (elapsedTime < 1.5) {
            // Forming the Name
            const t = elapsedTime / 1.5;
            // easeOutExpo gives a very snappy snap-into-place feel
            formProgress = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        } else {
            formProgress = 1;
        }

        if (elapsedTime > 2.5) {
            // Shattering the Name
            const t = Math.min((elapsedTime - 2.5) / 1.5, 1);
            explodeProgress = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo

            if (!isExploded) {
                isExploded = true;
                particles.rotation.set(0, 0, 0);
            }
        }

        if (elapsedTime > 4.0 && !hasRevealed) {
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
                // Moving into the text shape
                targetX = v.startX + (v.nameX - v.startX) * formProgress;
                targetY = v.startY + (v.nameY - v.startY) * formProgress;
                targetZ = v.startZ + (v.nameZ - v.startZ) * formProgress;
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
