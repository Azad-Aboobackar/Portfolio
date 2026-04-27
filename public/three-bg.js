// public/three-bg.js
const initThreeJS = () => {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // High density geometry to create thousands of particles
    const geometry = new THREE.IcosahedronGeometry(2, 40); 
    const positionAttribute = geometry.attributes.position;
    
    const vertexData = [];
    
    for (let i = 0; i < positionAttribute.count; i++) {
        // Target position (the perfect organic sphere)
        const tx = positionAttribute.getX(i);
        const ty = positionAttribute.getY(i);
        const tz = positionAttribute.getZ(i);
        
        // Random shattered starting position (scattered far away)
        const radius = 15 + Math.random() * 25; // Far out in space
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        const sx = radius * Math.sin(phi) * Math.cos(theta);
        const sy = radius * Math.sin(phi) * Math.sin(theta);
        const sz = radius * Math.cos(phi);

        vertexData.push({
            startX: sx, startY: sy, startZ: sz,
            targetX: tx, targetY: ty, targetZ: tz,
            noiseOffsetX: Math.random() * Math.PI * 2,
            noiseOffsetY: Math.random() * Math.PI * 2,
            noiseOffsetZ: Math.random() * Math.PI * 2,
        });

        // Initialize particles at the shattered scattered positions
        positionAttribute.setXYZ(i, sx, sy, sz);
    }
    
    geometry.attributes.position.needsUpdate = true;

    // Dust particle material
    const material = new THREE.PointsMaterial({
        color: 0xe8b27a,      // Accent color
        size: 0.012,         // Tiny dust specks
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending // Glow effect
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Listen for progress from the extreme loader in index.html
    let currentProgress = 0;
    window.addEventListener('loaderProgress', (e) => {
        currentProgress = e.detail.progress; // ranges from 0 to 1
    });

    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Subtle Parallax
        const targetX = mouseX * 0.001;
        const targetY = mouseY * 0.001;
        
        particles.rotation.y += 0.002 + (targetX - particles.rotation.y) * 0.02;
        particles.rotation.x += 0.001 + (targetY - particles.rotation.x) * 0.02;

        const positions = particles.geometry.attributes.position.array;
        const time = elapsedTime * 0.4;
        
        for (let i = 0; i < vertexData.length; i++) {
            const v = vertexData[i];
            
            // 1. Interpolate from shattered space to the target sphere
            let x = v.startX + (v.targetX - v.startX) * currentProgress;
            let y = v.startY + (v.targetY - v.startY) * currentProgress;
            let z = v.startZ + (v.targetZ - v.startZ) * currentProgress;

            // 2. Add the organic noise "blob" displacement only as it finishes forming
            // so the dust comes alive as it assembles
            if (currentProgress > 0.5) {
                const noiseWeight = (currentProgress - 0.5) * 2.0; // scales from 0 to 1
                const displacement = 0.3 * noiseWeight;
                x += Math.sin(time + v.noiseOffsetX) * displacement;
                y += Math.cos(time + v.noiseOffsetY) * displacement;
                z += Math.sin(time + v.noiseOffsetZ) * displacement;
            }

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
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
